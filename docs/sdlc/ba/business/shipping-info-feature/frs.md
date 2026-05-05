# FRS: Shipping Information Feature

## 1. Introduction
This document specifies the functional requirements for adding shipping information to orders in TurboOrder.

## 2. Data Model Changes
### 2.1 Order Schema
The `Order` model will be updated with the following fields:
- `trackingNumber` (String, Optional): The tracking ID provided by the shipping carrier.
- `shippingCarrier` (String, Optional): The name of the shipping company (e.g., GHTK, GHN, Viettel Post).
- `shippingFee` (Number, Default: 0): The cost of shipping.

## 3. Workflow Changes
### 3.1 Status Transition: Confirm -> Shipping
When the user updates an order status from any status to `shipping`:
1. The UI must present additional input fields:
   - **Carrier**: A dropdown or search-select field.
   - **Tracking Number**: A text input.
   - **Shipping Fee**: A numeric input.
2. The backend must:
   - Save these fields to the order.
   - Recalculate the `total` as: `total = subtotal - discountAmount + shippingFee`.
   - Record the status change in `statusHistory`.

### 3.2 Order Details View
1. The "Order Summary" section should now include a "Shipping Fee" line item.
2. A new "Shipping Information" section should be added to display:
   - Carrier
   - Tracking Number
   - Estimated delivery (optional, for future)

## 4. UI/UX Requirements
### 4.1 Update Status Modal
- Add a conditional section that appears when the selected status is "Shipping".
- Fields:
  - `Carrier`: Suggestions like "Giao Hàng Tiết Kiệm", "Giao Hàng Nhanh", "Viettel Post", "VNPost", "Ahamove", "GrabExpress", "Other".
  - `Tracking Number`.
  - `Shipping Fee`: Default to 0.
- Real-time total calculation display in the modal would be a "WOW" factor.

## 5. API Specifications
### 5.1 PATCH /api/orders/:id/status
- New optional fields in request body:
  - `trackingNumber`
  - `shippingCarrier`
  - `shippingFee`
