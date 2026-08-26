# Lai 家便當餐廳 AI OS Launch Gates
**日期**: 2026-08-26
**狀態**: Draft
**規則**: Gate 未通過，相關功能只能在本機/測試資料/人工流程中使用，不得接正式客人。

## 1. Gate 總表
| Gate | 階段 | 外部帳號/金鑰 | Owner | 通過證據 | 未通過時降級 |
|---|---|---|---|---|---|
| G-01 正式資料庫 | MVP | Railway PostgreSQL / `DATABASE_URL` | DevOps | `/api/health` 顯示 postgres，備份策略確認 | 不開正式 QR，只做測試或人工接單 |
| G-02 後台存取保護 | MVP | 可能需 auth provider/session secret | Security | 後台頁不可被未授權者看到 | 僅店內受控裝置使用，不公開網址 |
| G-03 AI 推薦 | MVP | OpenAI 或 LLM API key | AI Engineer | 逾時、過敏排除、缺貨排除測試通過 | 隱藏推薦區 |
| G-04 AI 客服草稿 | MVP | OpenAI 或 LLM API key | Customer Service | 高風險人工接手測試通過 | 使用固定 FAQ 與人工回覆 |
| G-05 AI 每日報表 | MVP | OpenAI 或 LLM API key | Data Analyst | 無 key 規則版、有 key AI 摘要都通過 | 只產規則版報表 |
| G-06 POS webhook | MVP | `POS_WEBHOOK_URL`, `POS_API_KEY` | DevOps/POS Vendor | 建立、接單、完成、拒單、手動重送都有回應 | 前台以本系統為主，POS 手動補登 |
| G-07 列印橋接 | MVP | `PRINTER_HOST`, `PRINTER_PORT` 或雲端列印帳號 | Store Ops | 連續 20 張測試單列印成功，斷線有 fallback | 後廚看板/小票檔/手抄 |
| G-08 QR 正式發布 | MVP | QR 產生/短網址服務可選 | Store Ops | 每桌/櫃台 QR 對應正確 store/table/language | 使用一般點餐頁 |
| G-09 評價渠道 | MVP | Google 商家檔案/LINE OA/表單工具 | Marketing | 完成訂單後可產連結且不違反平台規範 | 前台人工請客人掃評價 QR |
| G-10 客服渠道 | Phase 2 | LINE OA/FB/IG/Google API key | Customer Service | 訊息進站、草稿、人工送出、關閉案件通過 | 後台手動記錄客服 |
| G-11 簡訊/Email 推播 | Phase 2 | SMS/Email provider key | Marketing | 退訂、頻率、個資告知通過 | 不自動推播 |
| G-12 多店部署 | Phase 3 | 多店網域/DB/權限設定 | DevOps | storeId 隔離測試通過 | 單店模式 |
| G-13 採購/供應商整合 | Phase 3 | 供應商 API/ERP 帳號 | Operations | 建議單不會自動送出，人工核准紀錄存在 | 匯出採購建議 |

## 2. MVP 必過 Gate
MVP 正式開放客人掃碼前，至少必須通過：
- G-01 正式資料庫
- G-02 後台存取保護
- G-06 POS webhook 或明確選擇人工 POS 補登
- G-07 列印橋接或明確選擇後廚看板/小票檔
- G-08 QR 正式發布

AI 相關 Gate 可以先不過，但功能必須降級：
- G-03 未過: 不顯示 AI 推薦/加購。
- G-04 未過: 不產生 AI 客服草稿。
- G-05 未過: 每日報表只用規則版。

## 3. Gate 詳細檢查

### G-01 正式資料庫
**檢查項**
- `DATABASE_URL` 存在於部署環境，不在前端。
- `/api/health` 回傳 `storage=postgres`。
- 訂單、會員、點數 ledger 可寫入與讀取。
- 有備份/匯出方式。

**阻擋條件**
- 正式客人訂單寫入 local JSON。
- 多台裝置同時接單時資料不一致。

### G-02 後台存取保護
**檢查項**
- 後台、會員、統計、列印設定頁有登入或網路層保護。
- 店員、後廚、店長權限分離。
- 操作狀態、點數、成本、庫存有操作紀錄。

**阻擋條件**
- 未授權者可讀訂單、電話、會員點數或成本。

### G-03 AI 推薦
**檢查項**
- API key 只在後端環境變數。
- AI 輸入包含庫存、過敏/忌口排除與會員偏好。
- 回傳建議需經規則層再檢查一次。
- 3 秒逾時 fallback 通過。

**阻擋條件**
- AI 可推薦售完品、過敏衝突品或已停用品。

### G-04 AI 客服草稿
**檢查項**
- 高風險 intent: 食安、過敏、退款、法律、辱罵威脅。
- 高風險只產草稿，不自動送出。
- 客服回覆有人工送出者與時間紀錄。

**阻擋條件**
- AI 自動承諾退款、醫療/食安保證或責任歸屬。

### G-05 AI 每日報表
**檢查項**
- 無 AI key 可產規則版。
- 有 AI key 可產「問題摘要」與「明日建議」。
- 成本缺漏時報表標示未知，不估假毛利。

**阻擋條件**
- AI 自動調價、改菜單、下採購。

### G-06 POS webhook
**檢查項**
- `POS_WEBHOOK_URL` 與 `POS_API_KEY` 設在後端部署環境。
- `order.created`, `order.preparing`, `order.ready`, `order.completed`, `order.rejected`, `order.cancelled`, `order.manual-sync` 測試通過。
- POS 逾時或 5xx 時，訂單仍留在本系統，前台可重送。

**阻擋條件**
- POS 失敗導致訂單未建立或狀態遺失。

### G-07 列印橋接
**檢查項**
- 若使用店內 LAN 印表機，確認雲端不能直接連，需本地橋接。
- 斷線時產生小票檔 fallback。
- 小票含桌號、單號、品項、數量、忌口/過敏、備註。

**阻擋條件**
- 列印失敗造成後廚不知道有新單。

### G-08 QR 正式發布
**檢查項**
- 每個 QR 對應正確門市/桌號/取餐模式。
- QR 掃描後 3 秒內載入可用頁或錯誤頁。
- QR 沒帶參數時回到一般點餐頁。

**阻擋條件**
- 桌號串錯或連到測試環境。

### G-09 評價渠道
**檢查項**
- 評價連結正確。
- 不誘導不實評價，不用優惠交換指定星等。
- 負評可進客服流程。

**阻擋條件**
- 違反平台規範或無法處理負評。

## 4. 上線日 Runbook
1. 開店前確認 G-01/G-02/G-06/G-07/G-08 狀態。
2. 建立 3 筆測試單: 一般單、過敏單、缺貨單。
3. 測試前台接單、後廚列印/看板、完成、會員點數。
4. 清除測試單或標記為測試。
5. 貼 QR，先開一桌或櫃台試跑。
6. 每 30 分鐘查看新單、失敗 POS、列印 fallback、庫存售完。
7. 打烊產生每日老闆報表。
8. 記錄 D0 問題，隔天修正菜單/庫存/文案。

## 5. 上線後停止條件
遇到以下任一情況，暫停 QR 點餐，改人工接單：
- 連續 2 筆訂單未進後台。
- 發生過敏標籤遺失或顯示不一致。
- 庫存明顯超賣且無法人工控管。
- 後台無保護狀態下被非店內人員存取。
- POS 與本系統金額/品項連續不一致。
