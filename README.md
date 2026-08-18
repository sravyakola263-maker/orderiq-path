# WareSmart Command

Build a complete modern web application called "WareSmart" — a Smart Warehouse Operations and Order Fulfillment platform.

This is a hackathon MVP and must look like a real production SaaS product, not a basic CRUD application.

TAGLINE:

"Smart Decisions. Faster Fulfillment. Zero Stock Surprises."

CORE PURPOSE:

WareSmart helps warehouse teams manage inventory, orders, allocation, picking, packing, exceptions, dispatch, and operational analytics. The key differentiator is a Decision Engine that does not just display data. It recommends what the warehouse should do next.

TECHNOLOGY:

- React

- TypeScript

- Tailwind CSS

- shadcn/ui

- Lucide icons

- Recharts for analytics

- Use mock/sample data initially

- Store application state locally so the demo works without an external backend

- Structure the application so Supabase can be connected later

DESIGN:

Create a premium warehouse-management SaaS interface.

Use:

- clean white/light gray background

- dark navy sidebar

- professional blue primary accent

- green for success

- orange for warnings

- red for critical alerts

- rounded cards

- subtle shadows

- modern typography

- responsive desktop-first layout

- excellent spacing

- smooth hover states

- professional tables

- clear status badges

- charts and visual indicators

MAIN NAVIGATION:

1. Dashboard

2. Orders

3. Inventory

4. Allocation Center

5. Picking & Packing

6. Exceptions

7. Dispatch

8. Analytics

9. Settings

LOGIN PAGE:

Create a professional login page for WareSmart.

Include:

- WareSmart logo

- email

- password

- remember me

- login button

- demo login button

- modern warehouse illustration/background

The Demo Login should immediately enter the dashboard using mock data.

DASHBOARD:

Create a command-center style dashboard.

Top KPI cards:

- Total Inventory Value

- Available Units

- Pending Orders

- Critical Orders

- Low Stock Items

- Orders Ready for Dispatch

Create an "AI Decision Center" section.

Show actionable recommendations such as:

1. CRITICAL:

"Order #ORD-1042 requires 10 units of SKU-204, but only 7 are available."

Recommendation:

"Allocate all 7 available units to the urgent order and place the remaining 3 units on shortage."

2. WARNING:

"SKU-118 is below safety stock."

Recommendation:

"Reorder 50 units."

3. BOTTLENECK:

"Picking Zone B is 32% slower than the warehouse average."

Recommendation:

"Create a consolidated picking wave for Zone B."

Each recommendation must have:

- severity

- problem

- recommended decision

- reason

- action button

Add:

- Order fulfillment trend chart

- Orders by priority chart

- Inventory health chart

- Warehouse activity timeline

- Recent orders table

ORDERS PAGE:

Create an advanced order management interface.

Filters:

- All

- Critical

- High

- Medium

- Normal

- Pending

- Allocated

- Picking

- Packing

- Ready

- Dispatched

- Exception

Table columns:

- Order ID

- Customer

- Items

- Priority

- Required Date

- Stock Status

- Fulfillment Status

- Assigned Picker

- Actions

Add "Create Order" button.

Create Order form:

- customer

- products

- quantity

- delivery date

- customer priority

- shipping method

When an order is created, automatically calculate its priority using the Decision Engine.

ORDER DETAILS:

Display:

- Order information

- Customer

- Delivery deadline

- Priority score

- Products

- Requested quantity

- Allocated quantity

- Remaining quantity

- Current status

- Timeline

Show a "Why this priority?" section explaining the calculated priority.

INVENTORY PAGE:

Create inventory management interface.

KPI cards:

- Total SKUs

- Healthy Stock

- Low Stock

- Out of Stock

- Overstock

Table:

- SKU

- Product

- Category

- Warehouse Zone

- Bin Location

- Available

- Reserved

- Damaged

- Safety Stock

- Reorder Point

- Status

Add search and filters.

Product details should show inventory history.

ALLOCATION CENTER:

This is one of the most important pages.

Create a decision-oriented allocation interface.

Show:

- Pending allocation orders

- Available inventory

- Conflicting orders

- Allocation recommendations

Create a sample shortage scenario:

Order #ORD-1042

Priority: CRITICAL

Required: 10 units

Available: 7 units

Order #ORD-1048

Priority: NORMAL

Required: 5 units

Decision Engine recommendation:

"Allocate 7 units to ORD-1042 because it has higher priority. Reserve no stock for the lower-priority order. Create a shortage exception for 3 units and trigger replenishment."

Show buttons:

- Apply Recommendation

- Override Decision

- View Reason

Also create an allocation history table.

DECISION ENGINE:

Implement deterministic rule-based logic.

Priority score should consider:

- urgency

- delivery deadline

- customer priority

- order age

- stock availability

Example:

priorityScore =

urgencyScore +

deadlineScore +

customerPriorityScore +

orderAgeScore +

stockAvailabilityScore

Classify:

80-100 = Critical

60-79 = High

40-59 = Medium

0-39 = Normal

Never make the AI randomly allocate inventory.

Use deterministic rules.

PICKING & PACKING:

Create workflow board:

Pending Picking

→ Picking

→ Picked

→ Packing

→ Quality Check

→ Ready for Dispatch

Create picking waves.

Example:

Pick Wave #PW-104

Zone A:

SKU-101: 5

SKU-104: 2

Zone B:

SKU-205: 3

SKU-211: 1

Allow the user to:

- start picking

- mark item picked

- report missing item

- report damaged item

- move order to packing

- complete quality check

Show picking efficiency metrics.

EXCEPTIONS PAGE:

Create an Exception Management Center.

Exception types:

- Stock shortage

- Damaged item

- Missing item

- Wrong item

- Misplaced item

- Delayed order

- Quality failure

Each exception must display:

Exception

→ Detection

→ Decision

→ Resolution

Example:

DAMAGED ITEM

Order #ORD-1051

SKU-301

Damaged quantity: 2

Decision Engine:

"Replacement stock is available in Zone C."

Resolution:

"Allocate 2 replacement units from Zone C."

Buttons:

- Approve Resolution

- Reject

- Escalate

DISPATCH PAGE:

Show orders ready for dispatch.

Fields:

- Order ID

- Customer

- Package

- Carrier

- Dispatch priority

- Status

- Dispatch time

Workflow:

Ready → Packed → Quality Checked → Dispatched

Add dispatch confirmation modal.

ANALYTICS PAGE:

Create professional warehouse analytics.

Charts:

- Daily orders

- Fulfillment rate

- Picking time

- Packing time

- Dispatch time

- Inventory turnover

- Stockout frequency

- Damaged item rate

- Exception frequency

Create a "Bottleneck Detection" section.

Example:

Picking Zone B

Average time: 14.8 minutes

Warehouse average: 10.2 minutes

Status:

BOTTLENECK DETECTED

Recommendation:

"Rebalance picking workload between Zone A and Zone B."

Also show:

- top products

- slow-moving products

- fast-moving products

- most common exceptions

SETTINGS:

Include:

- warehouse information

- safety stock settings

- reorder thresholds

- priority rules

- notification settings

- user management

MOCK DATA:

Create realistic warehouse data with:

- at least 20 products

- at least 15 orders

- multiple warehouse zones

- different stock levels

- urgent orders

- low-stock products

- out-of-stock products

- damaged products

- pending picking orders

- dispatch-ready orders

- exceptions

IMPORTANT USER EXPERIENCE:

The application must behave like a real operational system.

When the user performs an action:

- update the UI immediately

- update inventory quantities

- update order status

- create/remove exceptions where appropriate

- update dashboard metrics

- update analytics

Do not create static screens only.

Create reusable components:

- Sidebar

- Header

- KPI cards

- Data tables

- Status badges

- Priority badges

- Alert cards

- Decision cards

- Modals

- Charts

- Timeline

- Empty states

Use realistic sample data.

Make the dashboard the strongest and most polished screen because it will be used for the hackathon demonstration.

Add a small "Demo Mode" indicator so judges understand that the application is running on simulated warehouse data.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c0057d7e-2145-4966-a926-f4ec1a81f63a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
