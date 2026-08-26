# LAI Bento Website and Order System

This repository contains the public LAI Bento website, online ordering page, franchise order dashboard, order search, revenue statistics, and print settings pages.

## Customer Records

The backend stores each online order with customer name, phone number, company, items, total amount, and status timeline. When PostgreSQL is enabled, it also maintains a `customers` table keyed by normalized phone number for repeat-customer lookup.

The order search page supports keyword search by phone digits, order number, name, company, and item name. Clicking an order opens the full order detail, customer data, and same-phone order history.

## Membership and Points

The member center uses the customer's phone number as the membership key. Completed orders can earn points at `$100 = 1 point`; staff can also redeem or adjust points from the admin member page. The member page shows consumption history, point ledger, available points, redeemed points, referral code, and reward actions such as side-dish or free-bento redemption.

## Restaurant AI MVP APIs

The restaurant AI MVP uses a replaceable rule-based stub and local `data/restaurant-ai-seed.json`; it does not require external AI keys.

- `GET /api/restaurant-ai/menu?lang=zh-TW|km|vi|en|th`: localized menu, add-ons, inventory availability, and dietary conflicts.
- `POST /api/restaurant-ai/dietary-note`: converts free-text restrictions/allergies into structured kitchen notes.
- `POST /api/restaurant-ai/recommendations`: menu recommendations with dietary, allergy, budget, tag, and inventory filtering.
- `POST /api/restaurant-ai/upsells`: add-on recommendations for selected items.
- `POST /api/restaurant-ai/costing`: item-level revenue, cost, gross profit, and margin calculation.
- `GET /api/restaurant-ai/inventory/advice`: low-stock status and reorder suggestions.
- `POST /api/restaurant-ai/inventory/deduct`: deducts local inventory by items or `orderId`; `orderId` deductions are idempotent.
- `GET /api/restaurant-ai/reports/daily?date=YYYY-MM-DD`: owner daily report with sales, gross margin, low stock, pending orders, and feedback summary.
- `GET|POST /api/restaurant-ai/feedback/summary`: summarizes reviews and complaints; `POST` can summarize supplied feedback and optionally persist it with `persist: true`.
- `GET /api/restaurants`: restaurant instance registry. Current instance: `hainan-singapore` for `@Lai999_BOT`.
- `GET /api/telegram/lai999/instance`: returns the Lai999 bot instance setup contract, feature page URL, order page URL, and webhook URL.
- `POST /api/telegram/lai999/webhook`: Telegram webhook endpoint. It replies to ordering, location, hours, support, and phone-based order-status intents.
- `PATCH /api/orders/:orderId`: changes pending or preparing orders, recalculates total, writes timeline, syncs POS webhook, and notifies Telegram customers when their chat ID is known.

To attach the deployed site to `@Lai999_BOT`, set `PUBLIC_BASE_URL` to the public HTTPS domain and keep `TELEGRAM_BOT_TOKEN` in `.env` or hosting secrets, then run:

```bash
npm run bot:lai999:setup
```

The setup command configures bot commands, description, webhook, and Telegram's menu button. Telegram Web Apps require HTTPS; with a local or missing `PUBLIC_BASE_URL`, the script configures text commands only and skips webhook/menu button setup.

Do not commit the bot token. The Lai999 feature page is `lai999-bot.html?storeId=hainan-singapore&source=telegram&bot=Lai999_BOT`, and the Hainan order page is `hainan.html?storeId=hainan-singapore&source=telegram&bot=Lai999_BOT`.

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
- Lai999 Bot feature page: `http://127.0.0.1:4180/lai999-bot.html?storeId=hainan-singapore&source=telegram&bot=Lai999_BOT`
- AI QR order page: `http://127.0.0.1:4180/ai-order.html`
- Hainan AI order page: `http://127.0.0.1:4180/hainan.html?storeId=hainan-singapore&source=telegram&bot=Lai999_BOT`
- Order page: `http://127.0.0.1:4180/order.html`
- LAI Bento Life: `http://127.0.0.1:4180/life.html`
- Admin dashboard: `http://127.0.0.1:4180/admin.html`
- AI kitchen board: `http://127.0.0.1:4180/ai-kitchen.html`
- AI owner dashboard: `http://127.0.0.1:4180/ai-manager.html`
- Member center: `http://127.0.0.1:4180/admin-members.html`

## Restaurant AI OS MVP

The MVP adds a rule-based AI layer that works without external model keys:

- `GET /api/restaurant-ai/menu`: localized menu, add-ons, inventory availability, and dietary conflict markers.
- `POST /api/restaurant-ai/dietary-note`: structured kitchen note for avoidances and allergies.
- `POST /api/restaurant-ai/recommendations`: menu recommendations from budget, language, inventory, and dietary inputs.
- `POST /api/restaurant-ai/upsells`: add-on recommendations for the current cart.
- `POST /api/restaurant-ai/costing`: item-level cost and gross-margin snapshot.
- `GET /api/restaurant-ai/inventory/advice`: low-stock and reorder advice.
- `POST /api/restaurant-ai/inventory/deduct`: idempotent inventory deduction by items or order ID.
- `GET /api/restaurant-ai/reports/daily`: owner daily report for revenue, top items, margin, inventory, feedback, and AI brief.
- `GET|POST /api/restaurant-ai/feedback/summary`: summarize or persist review and complaint text.

OS planning docs live in `docs/restaurant-ai-os/`. External payment, POS vendor integration, messaging channels, and real LLM providers remain launch-gated until credentials, authorization, privacy notices, and human approval flows are confirmed.

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
- `PUBLIC_BASE_URL`: public HTTPS origin used for Telegram Web App and webhook URLs.
- `LOCAL_SERVER_URL`: local server origin used by `npm run bot:lai999`, defaults to `http://127.0.0.1:4180`.
- `TELEGRAM_BOT_TOKEN`: Telegram Bot API token for `@Lai999_BOT`. Store it in `.env` or hosting secrets only; never commit it.
- `DATABASE_URL`: provided by Railway PostgreSQL.
- `POS_WEBHOOK_URL`: optional POS API/webhook URL. When set, new orders and status updates are pushed to the POS.
- `POS_API_KEY`: optional POS bearer token.
- `POS_TIMEOUT_MS`: optional POS request timeout, defaults to `8000`.
- `PRINTER_HOST`: optional local network receipt printer IP.
- `PRINTER_PORT`: optional printer port, defaults to `9100`.

## POS Integration

When `POS_WEBHOOK_URL` is configured, the backend sends JSON payloads to the POS on:

- `order.created`
- `order.updated`
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
