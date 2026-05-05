# Technical Specification: Shipping Information

## 1. Shared Types Update (`packages/shared/src/types/index.ts`)
```typescript
export interface Order {
  // ...
  trackingNumber?: string;
  shippingCarrier?: string;
  shippingFee?: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  note?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  shippingFee?: number;
}
```

## 2. API Implementation (`apps/api/src/modules/orders/orders.service.ts`)
Modify `updateStatus` function:
- Accept optional `shippingInfo` object containing `trackingNumber`, `shippingCarrier`, `shippingFee`.
- If `shippingFee` is provided:
  - Update `order.shippingFee`.
  - Recalculate `order.total`.
  - If the order was already counted in customer `totalSpent`, adjust the customer's `totalSpent` by the difference in shipping fee.
- Update `order.trackingNumber` and `order.shippingCarrier` if provided.

## 3. Database Schema (`apps/api/src/models/Order.ts`)
Add fields to `OrderSchema`:
```javascript
trackingNumber: { type: String },
shippingCarrier: { type: String },
shippingFee: { type: Number, default: 0 },
```

## 4. Frontend Implementation
### 4.1 Update Status Modal (`apps/web/src/features/orders/components/UpdateStatusModal.tsx`)
- Add state for `trackingNumber`, `shippingCarrier`, `shippingFee`.
- Show fields conditionally when `newStatus === 'shipping'`.
- Calculate and display "New Total" in the modal.

### 4.2 Order Details View (`apps/web/src/features/orders/components/OrderDetails.tsx`)
- Display shipping info if present.
- Update the summary section to show "Shipping Fee".
