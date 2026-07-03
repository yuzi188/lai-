# LAI Bento Website and Order System

This repository contains the public LAI Bento website, online ordering page, franchise order dashboard, order search, revenue statistics, and print settings pages.

## Local Development

```bash
npm install
npm start
```

Local URLs:

- Public site: `http://127.0.0.1:4180/`
- Order page: `http://127.0.0.1:4180/order.html`
- Admin dashboard: `http://127.0.0.1:4180/admin.html`

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
- `PRINTER_HOST`: optional local network receipt printer IP.
- `PRINTER_PORT`: optional printer port, defaults to `9100`.

## Printer Note

Railway runs in the cloud and cannot directly access a store's local USB or LAN receipt printer. For production franchise use, run a small local print bridge inside each store, or use a cloud printer service.

The backend already exposes print actions, so a local print bridge can be added later without changing the public order flow.
