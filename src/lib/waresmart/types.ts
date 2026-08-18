export type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "NORMAL";

export type FulfillmentStatus =
  | "Pending"
  | "Allocated"
  | "Picking"
  | "Picked"
  | "Packing"
  | "Quality Check"
  | "Ready"
  | "Dispatched"
  | "Exception";

export type CustomerTier = "Platinum" | "Gold" | "Standard";

export type ShippingMethod = "Same Day" | "Express" | "Standard" | "Freight";

export interface InventoryMovement {
  id: string;
  date: string;
  type: "Inbound" | "Outbound" | "Adjustment" | "Damage" | "Reservation";
  quantity: number;
  reference: string;
}

export interface Product {
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
  velocity: number; // units shipped last 30 days
  history: InventoryMovement[];
}

export interface OrderLine {
  sku: string;
  quantity: number;
  allocated: number;
  picked: number;
}

export interface OrderEvent {
  at: string;
  label: string;
  detail?: string;
}

export interface Order {
  id: string;
  customer: string;
  customerTier: CustomerTier;
  lines: OrderLine[];
  createdAt: string;
  requiredDate: string;
  shippingMethod: ShippingMethod;
  status: FulfillmentStatus;
  picker: string | null;
  priorityScore: number;
  priority: PriorityLevel;
  scoreBreakdown: ScoreBreakdown;
  carrier?: string;
  packageId?: string;
  dispatchedAt?: string;
  timeline: OrderEvent[];
}

export interface ScoreBreakdown {
  urgency: number;
  deadline: number;
  customerPriority: number;
  orderAge: number;
  stockAvailability: number;
  total: number;
  notes: string[];
}

export type ExceptionType =
  | "Stock Shortage"
  | "Damaged Item"
  | "Missing Item"
  | "Wrong Item"
  | "Misplaced Item"
  | "Delayed Order"
  | "Quality Failure";

export interface WarehouseException {
  id: string;
  type: ExceptionType;
  severity: "CRITICAL" | "WARNING" | "INFO";
  orderId: string;
  sku: string;
  quantity: number;
  detectedAt: string;
  detection: string;
  decision: string;
  resolution: string;
  status: "Open" | "Resolved" | "Rejected" | "Escalated";
}

export interface AllocationRecord {
  id: string;
  at: string;
  orderId: string;
  sku: string;
  quantity: number;
  mode: "Recommended" | "Manual Override" | "Replenishment";
  note: string;
}

export interface PickWaveItem {
  sku: string;
  quantity: number;
  zone: string;
  picked: boolean;
}

export interface PickWave {
  id: string;
  orderIds: string[];
  zones: string[];
  assignedTo: string;
  status: "Queued" | "In Progress" | "Completed";
  items: PickWaveItem[];
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  at: string;
  actor: string;
  message: string;
  tone: "info" | "success" | "warning" | "critical";
}

export interface Settings {
  warehouseName: string;
  warehouseCode: string;
  address: string;
  timezone: string;
  defaultSafetyStock: number;
  defaultReorderPoint: number;
  autoReplenish: boolean;
  criticalThreshold: number;
  highThreshold: number;
  mediumThreshold: number;
  notifyLowStock: boolean;
  notifyExceptions: boolean;
  notifyDispatch: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  zone: string;
  status: "Active" | "Off shift";
}

export interface WareSmartState {
  products: Product[];
  orders: Order[];
  exceptions: WarehouseException[];
  allocations: AllocationRecord[];
  waves: PickWave[];
  activity: ActivityEntry[];
  settings: Settings;
  team: TeamMember[];
}
