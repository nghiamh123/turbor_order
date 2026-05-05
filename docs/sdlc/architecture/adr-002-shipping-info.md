# ADR 002: Order Shipping Information Implementation

## Status
Proposed

## Context
The system needs to store shipping details (tracking number, carrier, fee) and update the order total accordingly. This information is primarily gathered when the order moves to the "Shipping" status.

## Decision
1. **Database Schema**: Add `trackingNumber`, `shippingCarrier`, and `shippingFee` directly to the `Order` model in MongoDB. `shippingFee` will have a default value of 0.
2. **Total Calculation Logic**: The `total` field in the `Order` model will be defined as `subtotal - discountAmount + shippingFee`.
3. **API Update**: Modify the `updateStatus` endpoint to accept these new optional fields.
4. **Consistency**: When updating the `shippingFee`, we must also update the `total` and subsequently the customer's `totalSpent` if the order is already in a state where `totalSpent` is accounted for.
5. **Shared Types**: Update the shared `Order` and `UpdateOrderStatusRequest` interfaces to include the new fields.

## Consequences
- **Positive**: Simple implementation, consistent with existing order data structure.
- **Negative**: Requires updating existing order records if we want to support retrospective shipping info (can be defaulted to null/0).
- **Complexity**: Calculating `totalSpent` for customers needs careful handling when shipping fees change.
