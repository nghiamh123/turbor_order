# Walkthrough: Shipping Information Feature

## Overview
Added the ability to capture and display shipping information (Carrier, Tracking Number, Shipping Fee) when an order is moved to the "Shipping" status.

## Key Changes

### 1. Enhanced Status Update Modal
When you click "Shipping" on an order, a new modal appears:
- **Carrier Selection**: Quick tags for common carriers (GHTK, GHN, Viettel Post, etc.) and a custom input.
- **Tracking Number**: Input field for the delivery ID.
- **Shipping Fee**: Input field that automatically updates the total amount.
- **Real-time Total**: Shows the new total (Subtotal - Discount + Shipping Fee) before confirming.

### 2. Order Details Display
- Added "Shipping Information" section to the customer info card.
- Included "Shipping Fee" as a line item in the Order Summary.
- Tracking numbers are copyable for convenience.

### 3. Data Integrity
- The backend automatically recalculates the order's total.
- The customer's `totalSpent` is adjusted when the shipping fee is changed.
- Shared TypeScript interfaces ensure type safety across the stack.

## Technical Details
- **Schema**: Updated `Order` model in MongoDB.
- **API**: Modified `PATCH /api/orders/:id/status`.
- **Frontend**: Updated `OrderDetailPage` with new state, effects, and modal components.
- **Locales**: Vietnamese and English translations updated.
