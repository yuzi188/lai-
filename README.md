# LAI家便當網站與接單系統

這個專案包含 LAI家便當的公開品牌網站、線上訂購頁、加盟接單後台、查單系統、營業統計與列印設定頁。

## 本機啟動

```bash
npm install
npm start
```

本機網址：

- 前台首頁：`http://127.0.0.1:4180/`
- 訂購頁：`http://127.0.0.1:4180/order.html`
- 接單後台：`http://127.0.0.1:4180/admin.html`

## Railway 部署

1. 在 GitHub 建立新 repository，將本專案推上去。
2. Railway 選擇 `Deploy from GitHub repo`。
3. 在 Railway 新增 PostgreSQL database。
4. Railway 會自動注入 `DATABASE_URL`，後端會使用 PostgreSQL 儲存訂單。
5. Railway 產生公開網域後，前台與後台都使用同一個網域：
   - 前台：`https://你的網域/`
   - 訂購頁：`https://你的網域/order.html`
   - 後台：`https://你的網域/admin.html`

## 環境變數

- `PORT`：Railway 自動提供，不需手動設定。
- `DATABASE_URL`：Railway PostgreSQL 自動提供。存在時使用雲端資料庫，沒有時使用本機 `data/orders.json`。
- `PRINTER_HOST`：網路小票機 IP。本機店內列印使用，雲端 Railway 通常無法直接連到店內區域網路印表機。
- `PRINTER_PORT`：小票機連接埠，預設 `9100`。

## 重要說明

Railway 是雲端服務，不能直接連到店內 LAN 的 USB/網口小票機。正式加盟部署時建議：

- 雲端後台負責接單與資料統計。
- 店內電腦或小主機開一個本地列印橋接程式，輪詢雲端新單後列印。
- 或使用支援雲端 API 的印表機服務。

目前系統已保留 `/api/orders/:id/print`，在雲端無法連印表機時會留下列印紀錄，店內列印橋接可接續這個流程。
