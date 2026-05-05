# UX Specs: Shipping Information

## 1. Visual Design
- **Modern & Clean**: Use the existing TurboOrder design system (dark mode, glassmorphism if applicable).
- **Status Modal Enhancement**: 
  - When "Shipping" is selected, the modal expands smoothly with an animation.
  - Shipping fields are grouped in a "Shipping Details" card within the modal.
  - Input fields use clear labels and placeholders.
  - Shipping Fee input should have a currency suffix (đ).

## 2. Interaction
- **Dynamic Calculation**: As the user types the shipping fee, the "New Total" at the bottom of the modal updates instantly.
- **Carrier Autocomplete**: The carrier field should suggest common Vietnamese carriers but allow custom input.

## 3. Order Details Page
- Add a new "Shipping" card in the right sidebar or main content area.
- Use icons for Carrier (truck icon) and Tracking Number (barcode icon).

## 4. Components
- `ShippingInfoForm`: A reusable component for entering shipping details.
- `CarrierSelect`: A select component with carrier logos/icons.
