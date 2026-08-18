import type {
  CustomerTier,
  Order,
  OrderLine,
  PriorityLevel,
  Product,
  ScoreBreakdown,
  ShippingMethod,
} from "./types";

export const DAY = 24 * 60 * 60 * 1000;

export function daysBetween(from: string | Date, to: string | Date) {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / DAY);
}

const shippingUrgency: Record<ShippingMethod, number> = {
  "Same Day": 25,
  Express: 18,
  Standard: 10,
  Freight: 6,
};

const tierScore: Record<CustomerTier, number> = {
  Platinum: 20,
  Gold: 13,
  Standard: 6,
};

/**
 * Deterministic rule-based priority scoring.
 * priorityScore = urgency + deadline + customerPriority + orderAge + stockAvailability
 */
export function scoreOrder(
  input: {
    lines: OrderLine[];
    createdAt: string;
    requiredDate: string;
    shippingMethod: ShippingMethod;
    customerTier: CustomerTier;
  },
  products: Product[],
  now: Date = new Date(),
): ScoreBreakdown {
  const notes: string[] = [];

  const urgency = shippingUrgency[input.shippingMethod];
  notes.push(`Shipping method "${input.shippingMethod}" contributes ${urgency} urgency points.`);

  const daysToDeadline = daysBetween(now, input.requiredDate);
  let deadline: number;
  if (daysToDeadline <= 0) deadline = 30;
  else if (daysToDeadline === 1) deadline = 25;
  else if (daysToDeadline <= 2) deadline = 20;
  else if (daysToDeadline <= 4) deadline = 14;
  else if (daysToDeadline <= 7) deadline = 8;
  else deadline = 4;
  notes.push(
    `Delivery deadline is ${daysToDeadline <= 0 ? "due now or overdue" : `in ${daysToDeadline} day(s)`} → ${deadline} points.`,
  );

  const customerPriority = tierScore[input.customerTier];
  notes.push(`${input.customerTier} customer tier adds ${customerPriority} points.`);

  const ageDays = Math.max(0, daysBetween(input.createdAt, now));
  const orderAge = Math.min(15, ageDays * 3);
  notes.push(`Order has been open ${ageDays} day(s) → ${orderAge} points (capped at 15).`);

  const totalRequested = input.lines.reduce((s, l) => s + l.quantity, 0);
  const totalCovered = input.lines.reduce((s, l) => {
    const p = products.find((x) => x.sku === l.sku);
    return s + Math.min(l.quantity, p?.available ?? 0);
  }, 0);
  const coverage = totalRequested === 0 ? 1 : totalCovered / totalRequested;
  let stockAvailability: number;
  if (coverage >= 1) stockAvailability = 4;
  else if (coverage >= 0.75) stockAvailability = 10;
  else if (coverage >= 0.5) stockAvailability = 15;
  else stockAvailability = 20;
  notes.push(
    `Stock coverage is ${Math.round(coverage * 100)}% → ${stockAvailability} points (short stock raises urgency).`,
  );

  const total = Math.max(
    0,
    Math.min(100, urgency + deadline + customerPriority + orderAge + stockAvailability),
  );

  return { urgency, deadline, customerPriority, orderAge, stockAvailability, total, notes };
}

export function classifyPriority(score: number): PriorityLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "NORMAL";
}

export function stockStatus(product: Product): "Healthy" | "Low" | "Out of Stock" | "Overstock" {
  if (product.available <= 0) return "Out of Stock";
  if (product.available <= product.reorderPoint) return "Low";
  if (product.available > product.safetyStock * 6) return "Overstock";
  return "Healthy";
}

export function orderCoverage(order: Order, products: Product[]) {
  let requested = 0;
  let available = 0;
  order.lines.forEach((l) => {
    const p = products.find((x) => x.sku === l.sku);
    requested += l.quantity;
    available += Math.min(l.quantity, (p?.available ?? 0) + l.allocated);
  });
  return { requested, available, short: Math.max(0, requested - available) };
}

export interface AllocationPlan {
  orderId: string;
  lines: { sku: string; requested: number; allocatable: number; shortage: number }[];
  fullyAllocatable: boolean;
  reason: string;
}

/** Deterministic allocation: highest priority score first, no randomness. */
export function buildAllocationPlan(orders: Order[], products: Product[]): AllocationPlan[] {
  const pool = new Map(products.map((p) => [p.sku, p.available]));
  const queue = [...orders].sort(
    (a, b) => b.priorityScore - a.priorityScore || a.requiredDate.localeCompare(b.requiredDate),
  );

  return queue.map((order) => {
    const lines = order.lines.map((l) => {
      const remaining = l.quantity - l.allocated;
      const free = pool.get(l.sku) ?? 0;
      const allocatable = Math.max(0, Math.min(remaining, free));
      pool.set(l.sku, free - allocatable);
      return { sku: l.sku, requested: remaining, allocatable, shortage: remaining - allocatable };
    });
    const shortage = lines.reduce((s, l) => s + l.shortage, 0);
    const reason = shortage
      ? `Order ${order.id} scores ${order.priorityScore}/100 (${order.priority}). Allocate every available unit now; ${shortage} unit(s) fall short and must raise a shortage exception plus replenishment.`
      : `Order ${order.id} scores ${order.priorityScore}/100 (${order.priority}) and can be fully covered from on-hand stock. Allocate in full.`;
    return { orderId: order.id, lines, fullyAllocatable: shortage === 0, reason };
  });
}
