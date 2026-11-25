# 5. Print store

**Who:** couples, families and guests ordering prints; photographers setting prices. **Business:** low or 0% commission, regional labs (WHCC for the US, labs in India). Revenue is also upsell emails and discount codes.

## Client side

- **Entry:** a "Order prints" button in the section bar and in the lightbox ("Order this photo"). Print theme throughout.
- **Product picker (Dialog or full screen on phone):** photo preview, a size Select (5x7, 8x10, 11x14, 16x20, canvas, album), paper finish (Radio: Lustre, Matte), quantity stepper, live price in the visitor's currency, and a crop preview showing exactly what will be cut off for the chosen ratio (essential: a wrong crop is the number one print complaint).
- **Cart:** a drawer showing items with thumbnails, subtotal, studio discount code Field, and shipping estimate after the address is known.
- **Checkout:** one page: email, shipping address (country-aware fields), shipping method, payment (Stripe; Razorpay for India), clear total with tax. A Print-theme order summary stays visible.
- **After:** confirmation with order number, email receipt, order status page: **Received, In production, Shipped (tracking link), Delivered**.

## Photographer side

Store settings: turn on/off, choose lab, set price per product (markup over lab cost, with the resulting profit shown), discount codes (percentage, expiry), sale banner on a gallery, "guests can buy prints" toggle. An **Orders** list with status Badges, totals and payouts.

## States

Photo resolution too low for the size (Badge `warning`, size disabled with the reason); out-of-region shipping; payment failed (keep the cart, show why); lab outage (store pauses with a message to clients and a notice to the photographer).

## Accessibility and trust

Prices and totals never rely on colour; every control 44px; autofill attributes on address fields; a visible "Secure payment by Stripe" line and the studio's name as the seller.

## New components

`Stepper` (quantity), `Radio`, `Drawer`, `AddressFields`, `PriceLine`.

## Data

`products`, `price_overrides`, `orders`, `order_items`, `discount_codes`. Payment and lab IDs stay server-side.

## Open questions

Who is the merchant of record (studio or Framesly)? That decides tax handling and the checkout wording.
