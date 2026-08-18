import { classifyPriority, scoreOrder, DAY } from "./decisionEngine";
import type {
  ActivityEntry,
  AllocationRecord,
  CustomerTier,
  Order,
  PickWave,
  Product,
  Settings,
  ShippingMethod,
  TeamMember,
  WarehouseException,
  WareSmartState,
  FulfillmentStatus,
} from "./types";

const iso = (offsetDays: number, hour = 9) => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return new Date(d.getTime() + offsetDays * DAY).toISOString();
};

interface RawProduct {
  sku: string;
  name: string;
  category: string;
  zone: string;
  bin: string;
  available: number;
  reserved: number;
  damaged: number;
  safetyStock: number;
  reorderPoint: number;
  unitCost: number;
  velocity: number;
}

const rawProducts: RawProduct[] = [
  ["SKU-101", "Industrial Shelving Bracket", "Hardware", "Zone A", "A-01-14", 480, 60, 0, 80, 120, 18.5, 320],
  ["SKU-104", "Heavy Duty Pallet Wrap", "Packaging", "Zone A", "A-02-07", 96, 24, 3, 60, 90, 12.0, 410],
  ["SKU-108", "Thermal Label Roll 4x6", "Packaging", "Zone A", "A-03-02", 1240, 180, 0, 200, 300, 6.25, 890],
  ["SKU-112", "Forklift Battery Pack", "Equipment", "Zone D", "D-01-01", 12, 4, 1, 6, 8, 640.0, 9],
  ["SKU-118", "Barcode Scanner Handheld", "Equipment", "Zone C", "C-02-11", 14, 6, 0, 30, 40, 189.0, 62],
  ["SKU-121", "Corrugated Box Medium", "Packaging", "Zone A", "A-04-09", 2450, 320, 12, 400, 600, 1.85, 1500],
  ["SKU-125", "Stretch Film Dispenser", "Equipment", "Zone C", "C-01-05", 68, 10, 0, 25, 35, 42.0, 74],
  ["SKU-130", "Steel Storage Bin", "Hardware", "Zone B", "B-01-03", 310, 45, 5, 60, 90, 28.4, 210],
  ["SKU-134", "Safety Vest Hi-Vis", "Safety", "Zone C", "C-03-08", 220, 20, 0, 50, 70, 14.9, 130],
  ["SKU-139", "Anti Fatigue Floor Mat", "Safety", "Zone C", "C-03-12", 0, 0, 2, 20, 30, 55.0, 40],
  ["SKU-142", "Conveyor Roller 60cm", "Equipment", "Zone D", "D-02-04", 74, 12, 0, 25, 40, 96.5, 58],
  ["SKU-147", "Packing Tape Heavy", "Packaging", "Zone A", "A-02-15", 980, 140, 8, 200, 280, 3.4, 1120],
  ["SKU-152", "Warehouse LED High Bay", "Equipment", "Zone D", "D-03-06", 42, 6, 0, 15, 25, 128.0, 33],
  ["SKU-158", "Pallet Jack Manual", "Equipment", "Zone D", "D-01-09", 18, 3, 1, 8, 12, 415.0, 21],
  ["SKU-163", "Bubble Wrap Roll", "Packaging", "Zone A", "A-05-01", 640, 90, 0, 120, 180, 9.75, 520],
  ["SKU-171", "Stackable Tote Bin", "Hardware", "Zone B", "B-02-10", 890, 110, 4, 150, 220, 11.2, 640],
  ["SKU-180", "Cut Resistant Gloves", "Safety", "Zone C", "C-04-02", 36, 12, 0, 40, 60, 8.6, 260],
  ["SKU-193", "Shrink Wrap Machine Part", "Equipment", "Zone D", "D-02-11", 7, 2, 0, 10, 15, 220.0, 12],
  ["SKU-204", "Precision Load Sensor", "Electronics", "Zone B", "B-03-05", 7, 0, 0, 20, 30, 310.0, 48],
  ["SKU-205", "RFID Gate Antenna", "Electronics", "Zone B", "B-03-09", 54, 8, 0, 15, 25, 275.0, 36],
  ["SKU-211", "Wireless Access Point", "Electronics", "Zone B", "B-04-01", 88, 14, 2, 20, 30, 165.0, 51],
  ["SKU-301", "Cold Chain Sensor Tag", "Electronics", "Zone C", "C-05-03", 130, 25, 6, 40, 60, 46.0, 190],
].map((r) => {
  const [sku, name, category, zone, bin, available, reserved, damaged, safetyStock, reorderPoint, unitCost, velocity] =
    r as [string, string, string, string, string, number, number, number, number, number, number, number];
  return { sku, name, category, zone, bin, available, reserved, damaged, safetyStock, reorderPoint, unitCost, velocity };
});

function buildProducts(): Product[] {
  return rawProducts.map((p, i) => ({
    ...p,
    history: [
      {
        id: `${p.sku}-h1`,
        date: iso(-9, 8),
        type: "Inbound",
        quantity: 120 + i * 7,
        reference: `PO-88${i + 10}`,
      },
      {
        id: `${p.sku}-h2`,
        date: iso(-5, 11),
        type: "Outbound",
        quantity: -(30 + i * 3),
        reference: `ORD-10${20 + i}`,
      },
      {
        id: `${p.sku}-h3`,
        date: iso(-2, 15),
        type: p.damaged > 0 ? "Damage" : "Adjustment",
        quantity: p.damaged > 0 ? -p.damaged : 5,
        reference: p.damaged > 0 ? "QC-CHK-221" : "CYCLE-COUNT-07",
      },
    ],
  }));
}

interface RawOrder {
  id: string;
  customer: string;
  tier: CustomerTier;
  lines: [string, number, number][];
  createdOffset: number;
  dueOffset: number;
  shipping: ShippingMethod;
  status: FulfillmentStatus;
  picker: string | null;
  carrier?: string;
}

const rawOrders: RawOrder[] = [
  { id: "ORD-1042", customer: "Northwind Retail Group", tier: "Platinum", lines: [["SKU-204", 10, 0], ["SKU-108", 40, 0]], createdOffset: -3, dueOffset: 0, shipping: "Same Day", status: "Pending", picker: null },
  { id: "ORD-1043", customer: "Vertex Manufacturing", tier: "Gold", lines: [["SKU-101", 60, 60], ["SKU-130", 25, 25]], createdOffset: -2, dueOffset: 1, shipping: "Express", status: "Picking", picker: "Marco Silva" },
  { id: "ORD-1044", customer: "Harbor Logistics", tier: "Standard", lines: [["SKU-121", 300, 300]], createdOffset: -4, dueOffset: 2, shipping: "Freight", status: "Packing", picker: "Aisha Khan" },
  { id: "ORD-1045", customer: "Crestline Foods", tier: "Platinum", lines: [["SKU-301", 45, 45], ["SKU-147", 80, 80]], createdOffset: -1, dueOffset: 1, shipping: "Express", status: "Allocated", picker: "Devon Price" },
  { id: "ORD-1046", customer: "BlueOak Distributors", tier: "Gold", lines: [["SKU-118", 20, 0]], createdOffset: -2, dueOffset: 3, shipping: "Standard", status: "Exception", picker: null },
  { id: "ORD-1047", customer: "Pinnacle Hardware", tier: "Standard", lines: [["SKU-171", 120, 120], ["SKU-163", 60, 60]], createdOffset: -5, dueOffset: 4, shipping: "Standard", status: "Picked", picker: "Marco Silva" },
  { id: "ORD-1048", customer: "Solstice Electronics", tier: "Standard", lines: [["SKU-204", 5, 0]], createdOffset: -1, dueOffset: 6, shipping: "Standard", status: "Pending", picker: null },
  { id: "ORD-1049", customer: "Ironclad Industrial", tier: "Gold", lines: [["SKU-142", 18, 18], ["SKU-152", 10, 10]], createdOffset: -3, dueOffset: 2, shipping: "Express", status: "Quality Check", picker: "Lena Ortiz" },
  { id: "ORD-1050", customer: "Northwind Retail Group", tier: "Platinum", lines: [["SKU-121", 500, 500], ["SKU-147", 150, 150]], createdOffset: -6, dueOffset: 1, shipping: "Freight", status: "Ready", picker: "Aisha Khan", carrier: "SwiftFreight" },
  { id: "ORD-1051", customer: "Meridian Cold Storage", tier: "Gold", lines: [["SKU-301", 24, 22], ["SKU-134", 30, 30]], createdOffset: -2, dueOffset: 2, shipping: "Express", status: "Exception", picker: "Devon Price" },
  { id: "ORD-1052", customer: "Atlas Supply Co", tier: "Standard", lines: [["SKU-180", 40, 0]], createdOffset: -1, dueOffset: 5, shipping: "Standard", status: "Pending", picker: null },
  { id: "ORD-1053", customer: "Vertex Manufacturing", tier: "Gold", lines: [["SKU-158", 6, 6]], createdOffset: -4, dueOffset: 1, shipping: "Express", status: "Ready", picker: "Lena Ortiz", carrier: "Regional Express" },
  { id: "ORD-1054", customer: "Copperfield Retail", tier: "Standard", lines: [["SKU-139", 15, 0]], createdOffset: -3, dueOffset: 4, shipping: "Standard", status: "Exception", picker: null },
  { id: "ORD-1055", customer: "Quantum Systems", tier: "Platinum", lines: [["SKU-205", 12, 12], ["SKU-211", 8, 8]], createdOffset: -1, dueOffset: 2, shipping: "Same Day", status: "Allocated", picker: null },
  { id: "ORD-1056", customer: "Harbor Logistics", tier: "Standard", lines: [["SKU-108", 250, 250]], createdOffset: -8, dueOffset: -1, shipping: "Standard", status: "Dispatched", picker: "Marco Silva", carrier: "SwiftFreight" },
  { id: "ORD-1057", customer: "Redstone Builders", tier: "Gold", lines: [["SKU-101", 90, 90], ["SKU-130", 40, 0]], createdOffset: -2, dueOffset: 3, shipping: "Standard", status: "Allocated", picker: null },
];

function buildOrders(products: Product[]): Order[] {
  return rawOrders.map((raw) => {
    const lines = raw.lines.map(([sku, quantity, allocated]) => ({
      sku,
      quantity,
      allocated,
      picked: raw.status === "Picked" || raw.status === "Packing" || raw.status === "Quality Check" || raw.status === "Ready" || raw.status === "Dispatched" ? allocated : 0,
    }));
    const createdAt = iso(raw.createdOffset, 10);
    const requiredDate = iso(raw.dueOffset, 17);
    const breakdown = scoreOrder(
      { lines, createdAt, requiredDate, shippingMethod: raw.shipping, customerTier: raw.tier },
      products,
    );
    return {
      id: raw.id,
      customer: raw.customer,
      customerTier: raw.tier,
      lines,
      createdAt,
      requiredDate,
      shippingMethod: raw.shipping,
      status: raw.status,
      picker: raw.picker,
      priorityScore: breakdown.total,
      priority: classifyPriority(breakdown.total),
      scoreBreakdown: breakdown,
      carrier: raw.carrier,
      packageId: raw.carrier ? `PKG-${raw.id.slice(-4)}` : undefined,
      dispatchedAt: raw.status === "Dispatched" ? iso(-1, 16) : undefined,
      timeline: [
        { at: createdAt, label: "Order received", detail: `${raw.customer} · ${raw.shipping}` },
        ...(raw.status !== "Pending"
          ? [{ at: iso(raw.createdOffset + 1, 12), label: "Inventory allocated" }]
          : []),
        ...(["Picking", "Picked", "Packing", "Quality Check", "Ready", "Dispatched"].includes(raw.status)
          ? [{ at: iso(raw.createdOffset + 1, 14), label: "Picking started", detail: raw.picker ?? undefined }]
          : []),
        ...(raw.status === "Dispatched"
          ? [{ at: iso(-1, 16), label: "Dispatched", detail: raw.carrier }]
          : []),
      ],
    };
  });
}

const exceptions: WarehouseException[] = [
  {
    id: "EXC-501",
    type: "Stock Shortage",
    severity: "CRITICAL",
    orderId: "ORD-1042",
    sku: "SKU-204",
    quantity: 3,
    detectedAt: iso(0, 7),
    detection: "Allocation engine found only 7 of 10 requested units on hand in Zone B.",
    decision: "Allocate all 7 available units to ORD-1042 (CRITICAL) and short-ship 3 units.",
    resolution: "Raise shortage for 3 units and trigger replenishment PO for 30 units of SKU-204.",
    status: "Open",
  },
  {
    id: "EXC-502",
    type: "Damaged Item",
    severity: "WARNING",
    orderId: "ORD-1051",
    sku: "SKU-301",
    quantity: 2,
    detectedAt: iso(0, 8),
    detection: "Picker flagged 2 damaged Cold Chain Sensor Tags during pick in Zone C.",
    decision: "Replacement stock is available in Zone C.",
    resolution: "Allocate 2 replacement units from Zone C and write off damaged inventory.",
    status: "Open",
  },
  {
    id: "EXC-503",
    type: "Quality Failure",
    severity: "WARNING",
    orderId: "ORD-1046",
    sku: "SKU-118",
    quantity: 20,
    detectedAt: iso(-1, 13),
    detection: "SKU-118 is below safety stock (14 on hand vs 30 safety stock).",
    decision: "Hold order and reorder 50 units to restore safety stock.",
    resolution: "Create replenishment order for 50 units and re-run allocation on arrival.",
    status: "Open",
  },
  {
    id: "EXC-504",
    type: "Missing Item",
    severity: "CRITICAL",
    orderId: "ORD-1054",
    sku: "SKU-139",
    quantity: 15,
    detectedAt: iso(-1, 9),
    detection: "Bin C-03-12 empty at pick time; system quantity was 0.",
    decision: "No substitute available. Notify customer and split the shipment.",
    resolution: "Split order, dispatch available lines and backorder SKU-139.",
    status: "Open",
  },
  {
    id: "EXC-505",
    type: "Misplaced Item",
    severity: "INFO",
    orderId: "ORD-1047",
    sku: "SKU-163",
    quantity: 12,
    detectedAt: iso(-2, 15),
    detection: "12 units of SKU-163 found in bin A-05-09 instead of A-05-01.",
    decision: "Update bin location and continue pick.",
    resolution: "Bin corrected to A-05-01, pick resumed.",
    status: "Resolved",
  },
  {
    id: "EXC-506",
    type: "Delayed Order",
    severity: "WARNING",
    orderId: "ORD-1050",
    sku: "SKU-121",
    quantity: 500,
    detectedAt: iso(-1, 11),
    detection: "Carrier pickup window missed by 3 hours for freight lane.",
    decision: "Rebook with SwiftFreight evening lane.",
    resolution: "Rebooked; dispatch scheduled today 18:00.",
    status: "Resolved",
  },
];

const waves: PickWave[] = [
  {
    id: "PW-104",
    orderIds: ["ORD-1043", "ORD-1055"],
    zones: ["Zone A", "Zone B"],
    assignedTo: "Marco Silva",
    status: "In Progress",
    createdAt: iso(0, 7),
    items: [
      { sku: "SKU-101", quantity: 5, zone: "Zone A", picked: true },
      { sku: "SKU-104", quantity: 2, zone: "Zone A", picked: false },
      { sku: "SKU-205", quantity: 3, zone: "Zone B", picked: false },
      { sku: "SKU-211", quantity: 1, zone: "Zone B", picked: false },
    ],
  },
  {
    id: "PW-105",
    orderIds: ["ORD-1045"],
    zones: ["Zone C", "Zone A"],
    assignedTo: "Devon Price",
    status: "Queued",
    createdAt: iso(0, 8),
    items: [
      { sku: "SKU-301", quantity: 45, zone: "Zone C", picked: false },
      { sku: "SKU-147", quantity: 80, zone: "Zone A", picked: false },
    ],
  },
];

const allocations: AllocationRecord[] = [
  { id: "ALC-9001", at: iso(-1, 9), orderId: "ORD-1050", sku: "SKU-121", quantity: 500, mode: "Recommended", note: "Full allocation, Platinum customer freight lane." },
  { id: "ALC-9002", at: iso(-1, 10), orderId: "ORD-1049", sku: "SKU-142", quantity: 18, mode: "Recommended", note: "Allocated from Zone D." },
  { id: "ALC-9003", at: iso(-2, 14), orderId: "ORD-1047", sku: "SKU-171", quantity: 120, mode: "Manual Override", note: "Supervisor prioritised long-open order." },
  { id: "ALC-9004", at: iso(-2, 16), orderId: "ORD-1044", sku: "SKU-121", quantity: 300, mode: "Recommended", note: "Freight consolidation." },
];

const activity: ActivityEntry[] = [
  { id: "ACT-1", at: iso(0, 8), actor: "Decision Engine", message: "Flagged shortage on ORD-1042 for SKU-204 (3 units short).", tone: "critical" },
  { id: "ACT-2", at: iso(0, 8), actor: "Devon Price", message: "Reported 2 damaged units of SKU-301 during pick.", tone: "warning" },
  { id: "ACT-3", at: iso(0, 7), actor: "Marco Silva", message: "Started pick wave PW-104 across Zone A and Zone B.", tone: "info" },
  { id: "ACT-4", at: iso(-1, 18), actor: "Aisha Khan", message: "ORD-1050 packed and staged for SwiftFreight.", tone: "success" },
  { id: "ACT-5", at: iso(-1, 16), actor: "System", message: "ORD-1056 dispatched via SwiftFreight.", tone: "success" },
];

const team: TeamMember[] = [
  { id: "U-1", name: "Marco Silva", role: "Senior Picker", zone: "Zone A", status: "Active" },
  { id: "U-2", name: "Aisha Khan", role: "Packing Lead", zone: "Zone A", status: "Active" },
  { id: "U-3", name: "Devon Price", role: "Picker", zone: "Zone C", status: "Active" },
  { id: "U-4", name: "Lena Ortiz", role: "Quality Inspector", zone: "Zone D", status: "Active" },
  { id: "U-5", name: "Tomas Berg", role: "Dispatch Coordinator", zone: "Dock", status: "Off shift" },
  { id: "U-6", name: "Priya Nair", role: "Warehouse Manager", zone: "All zones", status: "Active" },
];

const settings: Settings = {
  warehouseName: "WareSmart Central DC",
  warehouseCode: "WS-CDC-01",
  address: "4820 Logistics Parkway, Columbus, OH",
  timezone: "America/New_York",
  defaultSafetyStock: 50,
  defaultReorderPoint: 80,
  autoReplenish: true,
  criticalThreshold: 80,
  highThreshold: 60,
  mediumThreshold: 40,
  notifyLowStock: true,
  notifyExceptions: true,
  notifyDispatch: false,
};

export const PICKERS = ["Marco Silva", "Aisha Khan", "Devon Price", "Lena Ortiz"];
export const CARRIERS = ["SwiftFreight", "Regional Express", "AeroParcel", "MetroVan"];

export function seedState(): WareSmartState {
  const products = buildProducts();
  return {
    products,
    orders: buildOrders(products),
    exceptions,
    allocations,
    waves,
    activity,
    settings,
    team,
  };
}

export const fulfillmentTrend = [
  { day: "Mon", received: 42, fulfilled: 38, dispatched: 35 },
  { day: "Tue", received: 51, fulfilled: 47, dispatched: 44 },
  { day: "Wed", received: 47, fulfilled: 44, dispatched: 41 },
  { day: "Thu", received: 58, fulfilled: 50, dispatched: 48 },
  { day: "Fri", received: 63, fulfilled: 59, dispatched: 55 },
  { day: "Sat", received: 39, fulfilled: 36, dispatched: 34 },
  { day: "Sun", received: 28, fulfilled: 27, dispatched: 26 },
];

export const cycleTimes = [
  { day: "Mon", picking: 11.2, packing: 6.4, dispatch: 4.1 },
  { day: "Tue", picking: 12.4, packing: 6.9, dispatch: 4.6 },
  { day: "Wed", picking: 10.8, packing: 6.1, dispatch: 3.9 },
  { day: "Thu", picking: 13.6, packing: 7.2, dispatch: 5.2 },
  { day: "Fri", picking: 14.1, packing: 7.6, dispatch: 5.4 },
  { day: "Sat", picking: 9.8, packing: 5.6, dispatch: 3.4 },
  { day: "Sun", picking: 9.2, packing: 5.2, dispatch: 3.1 },
];

export const zonePerformance = [
  { zone: "Zone A", avgPickMinutes: 9.4 },
  { zone: "Zone B", avgPickMinutes: 14.8 },
  { zone: "Zone C", avgPickMinutes: 10.1 },
  { zone: "Zone D", avgPickMinutes: 10.6 },
];

export const inventoryTurnover = [
  { month: "Feb", turnover: 3.4, stockouts: 6, damageRate: 1.8 },
  { month: "Mar", turnover: 3.9, stockouts: 4, damageRate: 1.4 },
  { month: "Apr", turnover: 4.2, stockouts: 5, damageRate: 1.6 },
  { month: "May", turnover: 4.6, stockouts: 3, damageRate: 1.1 },
  { month: "Jun", turnover: 5.1, stockouts: 2, damageRate: 0.9 },
  { month: "Jul", turnover: 5.4, stockouts: 3, damageRate: 1.0 },
];
