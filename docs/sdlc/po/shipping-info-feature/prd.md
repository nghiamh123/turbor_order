# PRD: Shipping Information for Orders

## 1. Overview
Currently, TurboOrder handles orders from creation to completion but lacks detailed shipping information such as tracking numbers, carriers, and shipping fees. This feature aims to capture and display this information, especially when an order transitions to the "Delivering" (shipping) status.

## 2. Objectives
- Capture shipping details (Tracking Number, Carrier, Shipping Fee) during the order lifecycle.
- Update the total order amount to include the shipping fee.
- Display shipping information in the order details.

## 3. User Stories
- **As a store manager**, when I change an order status to "Shipping", I want to enter the tracking number, carrier, and shipping fee so that I can keep track of the delivery process.
- **As a store manager**, I want to see the updated total amount (subtotal - discount + shipping fee) so that I know the final amount to collect from the customer/shipper.
- **As a store manager**, I want to see the shipping details when viewing order information.

## 4. Functional Requirements
- **FR1: Update Order Status Modal/Form**: Add fields for Tracking Number (text), Shipping Carrier (dropdown), and Shipping Fee (number) when the status "Shipping" is selected.
- **FR2: Order Data Model**: Add `trackingNumber`, `shippingCarrier`, and `shippingFee` to the Order schema.
- **FR3: Total Calculation**: Update the order's `total` calculation to include `shippingFee`.
- **FR4: Order Details UI**: Display the tracking number, carrier, and shipping fee in the order details page.
- **FR5: Order List UI**: (Optional) Show tracking number or carrier in the order list if applicable.

## 5. Non-Functional Requirements
- **NFR1: UX**: The shipping fields should only appear or be required when transitioning to "Shipping" or if the order is already in "Shipping/Completed" status.
- **NFR2: Validation**: Shipping fee must be a non-negative number.

## 6. Acceptance Criteria
- [ ] Successfully update an order to "Shipping" status with tracking number, carrier, and shipping fee.
- [ ] The order's total amount reflects the added shipping fee.
- [ ] Shipping details are correctly displayed in the order details view.
- [ ] Shipping details are persisted in the database.
