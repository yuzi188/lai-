# LAI Bento Website and Order System

This repository contains the public LAI Bento website, online ordering page, franchise order dashboard, order search, revenue statistics, and print settings pages.

## Customer Records

The backend stores each online order with customer name, phone number, company, items, total amount, and status timeline. When PostgreSQL is enabled, it also maintains a `customers` table keyed by normalized phone number for repeat-customer lookup.

The order search page supports keyword search by phone digits, order number, name, company, and item name. Clicking an order opens the full order detail, customer data, and same-phone order history.

## Membership and Points

The member center uses the customer's phone number as the membership key. Completed orders can earn points at `$100 = 1 point`; staff can also redeem or adjust points from the admin member page. The member page shows consumption history, point ledger, available points, redeemed points, referral code, and reward actions such as side-dish or free-bento redemption.

## LAI Bento Life Phase 1

`website/life.html` is the first mock UI for the customer-facing gamified member life app. It uses mock data only and does not connect to payment or real member APIs yet.

Phase 1 files:

- `website/life.html`: game-style member home screen.
- `website/life-data.js`: mock data and mock API layer.
- `website/life-app.js`: modal/drawer interactions and mock state updates.
- `website/styles.css`: LAI Life visual system and responsive layout.

## Local Development

```bash
npm install
npm start
```

Local URLs:

- Public site: `http://127.0.0.1:4180/`
- Order page: `http://127.0.0.1:4180/order.html`
- LAI Bento Life: `http://127.0.0.1:4180/life.html`
- Admin dashboard: `http://127.0.0.1:4180/admin.html`
- Member center: `http://127.0.0.1:4180/admin-members.html`

## Railway Deployment

1. Deploy this GitHub repository from Railway.
2. Add a Railway PostgreSQL database.
3. Railway will provide `DATABASE_URL` automatically.
4. The Node backend stores orders in PostgreSQL when `DATABASE_URL` exists.
5. The same Railway domain serves both frontend and backend:
   - Public site: `https://your-domain/`
   - Order page: `https://your-domain/order.html`
   - Admin dashboard: `https://your-domain/admin.html`

## Environment Variables

- `PORT`: provided by Railway.
- `DATABASE_URL`: provided by Railway PostgreSQL.
- `POS_WEBHOOK_URL`: optional POS API/webhook URL. When set, new orders and status updates are pushed to the POS.
- `POS_API_KEY`: optional POS bearer token.
- `POS_TIMEOUT_MS`: optional POS request timeout, defaults to `8000`.
- `PRINTER_HOST`: optional local network receipt printer IP.
- `PRINTER_PORT`: optional printer port, defaults to `9100`.

## POS Integration

When `POS_WEBHOOK_URL` is configured, the backend sends JSON payloads to the POS on:

- `order.created`
- `order.preparing`
- `order.ready`
- `order.completed`
- `order.rejected`
- `order.cancelled`
- `order.manual-sync`

The POS endpoint should accept `POST application/json`. If `POS_API_KEY` is set, requests include:

```http
Authorization: Bearer <POS_API_KEY>
```

The manual retry endpoint is:

```http
POST /api/orders/:orderId/pos-sync
```

## Printer Note

Railway runs in the cloud and cannot directly access a store's local USB or LAN receipt printer. For production franchise use, run a small local print bridge inside each store, or use a cloud printer service.

The backend already exposes print actions, so a local print bridge can be added later without changing the public order flow.

The same applies to store-only POS terminals. If the POS is only reachable inside the store LAN, run a small local bridge in the store or ask the POS vendor for a public cloud API/webhook endpoint.
