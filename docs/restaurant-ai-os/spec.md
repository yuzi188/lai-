# Lai 家便當餐廳 AI OS 規格
**版本**: 0.1
**日期**: 2026-08-26
**狀態**: Draft
**適用系統**: LAI Bento public website and order system
**現有基礎**: `order.html` 線上點餐、`admin.html` 接單工作台、訂單查詢、營業統計、列印設定、會員中心、PostgreSQL 或 local JSON、POS webhook、會員點數與送禮

## 1. 目標
建立一套能接住「店內掃碼點餐 -> 前台確認 -> 後廚製作 -> 庫存/成本回寫 -> 會員與客服追蹤 -> 老闆每日報表」的餐廳 AI OS。MVP 先讓現有 Lai 家便當網站與訂單後台可以支援店內 QR 點餐、多語提示、忌口/過敏標註、AI 推薦加購、基本庫存扣抵、客服回覆草稿與每日營運摘要；Phase 2/3 再擴到預測、採購、評價、會員自動化與多店控管。

## 2. 明確不做
- MVP 不處理線上金流；付款仍以現場收款或既有 POS 為準。
- MVP 不讓 AI 自動改菜單價格、食材成本或庫存盤點數；AI 只能建議，需人員確認。
- MVP 不讓 AI 自動承諾過敏「保證安全」；只能顯示風險提示與店員確認流程。
- MVP 不直接連店內 USB/LAN 印表機；沿用現有列印 fallback，真正連線需 Gate。

## 3. 角色
| 角色 | 責任 |
|---|---|
| 客人 | 掃 QR、選語言、點餐、填忌口/過敏、接受或略過加購、送出訂單、查看狀態 |
| 前台 | 接單、確認付款/取餐、處理客訴、人工確認過敏單、處理缺貨替代 |
| 後廚 | 查看待做清單、製作、標記完成、回報售完/備料不足 |
| 店長/老闆 | 設菜單、庫存、成本、促銷、會員規則、查看每日報表 |
| AI 推薦服務 | 依購物車、時間、庫存、會員偏好產生加購與套餐建議 |
| AI 客服服務 | 產生客服回覆草稿、分類問題、提示需人工接手 |
| POS/列印橋接 | 接收訂單事件、列印小票、回寫狀態或失敗原因 |

## 4. 階段範圍
| 能力 | MVP | Phase 2 | Phase 3 |
|---|---|---|---|
| 客人掃碼點餐 | 桌號/門市 QR 進入點餐頁；送出訂單含桌號/取餐資訊 | 動態 QR 含活動碼、語言、座位區 | 多店多品牌 QR 管理與防偽 |
| 多語 | 繁中、英文、日文、韓文介面文案與菜名說明 | AI 輔助翻譯草稿、人工審核發布 | 依客人語言自動客服與推播 |
| AI 推薦/加購 | 結帳前提供 1-3 個加購建議，缺貨不推薦 | 會員偏好、天氣、時段、毛利排序 | 預測式套餐與個人化價格實驗 |
| 忌口/過敏 | 訂單層與品項層標註；牛/豬/海鮮/蛋/堅果/辣/素食 | 食材表自動交叉檢查與替代建議 | 供應商批次與交叉污染風險追蹤 |
| 前台 | 現有接單工作台擴充 QR/語言/忌口/AI 標籤 | 異常單工作佇列、補償券 | 多角色權限、班表與任務 |
| 後廚 | 小票/看板顯示餐點、數量、忌口/過敏與備註 | 分站製作、出餐 SLA、缺貨回報 | 廚房排程最佳化 |
| 庫存 | 每日初始量、下單預扣、取消/拒單回補、售完鎖定 | 食材 BOM 扣庫與低庫存提醒 | 需求預測與自動採購建議 |
| 成本 | 單品成本、毛利、每日成本摘要 | 食材價格變動、供應商比較 | 自動建議調價與毛利策略 |
| 會員 | 沿用手機會員、點數、消費歷史 | 偏好標籤、回訪券、生日券 | 分群自動行銷與 LTV 預測 |
| 客服 | 常見問題、訂單查詢、回覆草稿、人工接手 | LINE/FB/IG/Google 評論整合 | 多渠道客服品質評分 |
| 評價 | 完成訂單後產生評價邀請連結 | 負評預警與補償流程 | 評價主題分析與菜色迭代 |
| 每日老闆報表 | 訂單、營收、份數、熱銷、缺貨、毛利、客服/評價摘要 | 同比/環比、食材耗用、會員回訪 | 多店排行與 AI 經營建議 |

## 5. 核心資料物件
| 物件 | MVP 必備欄位 |
|---|---|
| Order | orderId, status, source, tableCode, language, customerName, customerPhone, pickupType, pickupTime, items, total, orderNote, dietaryFlags, allergyFlags, aiRecommendationsShown, aiRecommendationsAccepted, inventoryStatus, costSnapshot, timeline |
| OrderItem | sku, name, series, quantity, unitPrice, itemNote, dietaryFlags, allergyFlags, kitchenRoute, inventoryDeductions, costSnapshot |
| MenuItem | sku, nameZhTw, translations, price, active, soldOut, tags, ingredients, allergenTags, dietaryTags, cost, stockMode |
| InventoryItem | inventoryId, name, unit, openingQty, availableQty, reservedQty, wasteQty, lowStockThreshold, updatedBy, updatedAt |
| MemberProfile | phone, name, company, languagePreference, dietaryPreference, allergyNotes, points, referralCode, orderHistory |
| CustomerConversation | channel, customerPhone, orderId, intent, riskLevel, aiDraft, humanResolution, status |
| DailyBossReport | businessDate, revenue, orderCount, itemCount, grossMarginEstimate, topItems, soldOutItems, allergyOrders, customerIssues, reviews, aiRecommendations |

## 6. 工作流程樹

### WF-01 客人掃碼點餐與送單
**觸發**: 客人掃桌上或櫃台 QR，進入點餐頁。
**MVP 入口**: 現有 `order.html` 延伸，新增 `source=qr`, `tableCode`, `language`。

1. QR 解析
   - 成功: 取得門市/桌號/語言預設 -> STEP 2
   - 失敗: 顯示一般點餐頁，要求客人選取取餐方式
   - 逾時: 5 秒內無法載入 QR 設定，降級一般點餐頁
2. 語言與菜單載入
   - 成功: 顯示對應語言菜名、圖片、價格、過敏標籤 -> STEP 3
   - 菜單未發布: 顯示「目前未開放線上點餐」，前台可手動點餐
   - 翻譯缺漏: 回退繁中，不阻斷點餐
3. 客人加入餐點
   - 成功: 購物車更新，庫存做前端提示 -> STEP 4
   - 品項售完: 禁止加入並提示替代品
   - 數量超過可售量: 降到可售量或要求改選
4. 忌口/過敏標註
   - 成功: 訂單與品項寫入 flags -> STEP 5
   - 高風險過敏: 標記 `requiresHumanConfirm=true`，送單後前台必須確認
   - 備註含模糊字詞: AI/規則標為 `needsReview`
5. AI 推薦/加購
   - 成功: 回傳最多 3 個可售建議，客人接受或略過 -> STEP 6
   - AI 逾時 3 秒: 不顯示推薦，點餐不中斷
   - AI 回傳缺貨或過敏衝突品: 丟棄該建議並記錄
6. 送出訂單
   - 成功: 建立 `pending` 訂單，預扣庫存，寫入 timeline，推送 POS/前台 -> STEP 7
   - 驗證失敗: 顯示缺漏欄位，不建立訂單
   - 庫存衝突: 顯示已售完/剩餘份數，要求客人調整
   - POS 失敗: 訂單仍成立，標記 `posSyncStatus=failed`，前台可重送
7. 客人收到結果
   - 成功: 顯示單號、預估時間、前台確認狀態
   - 需人工確認: 顯示「店員確認後開始製作」

### WF-02 前台接單
**觸發**: 新訂單進入 `pending`。
**現有基礎**: `admin.html` 可看新單、製作中、可取餐、完成/拒單、列印。

1. 前台看到新單與提醒音
2. 前台檢查付款方式、取餐/桌號、忌口/過敏、高風險備註
3. 分支
   - 可接單: 狀態改 `preparing`，設定預估分鐘數，通知後廚
   - 缺貨: 前台選替代品或拒單，庫存回補
   - 過敏需確認: 電話/現場確認後才可接單
   - 重複訂單疑慮: 標記 `duplicateReview`，需人工判斷
4. POS/列印同步
   - 成功: timeline 記錄 synced/printed
   - 失敗: 顯示重送與備用小票檔路徑

### WF-03 後廚製作與出餐
1. 後廚看板/小票接收 `preparing` 訂單
2. 依品項分站或單線製作
3. 忌口/過敏以醒目標籤顯示在品項旁，不只放備註
4. 製作完成改 `ready`
5. 前台交餐後改 `completed`
6. 完成訂單觸發會員點數、評價邀請、報表彙總

### WF-04 庫存與成本
1. 開店前店長輸入今日可售量與食材成本
2. 下單成功預扣 `reservedQty`
3. 接單後轉為實際耗用
4. 拒單/取消回補
5. 售完自動鎖定菜色，不再被 AI 推薦
6. 收店後輸入報廢與盤點差異，產生日成本與毛利估算

### WF-05 客服、評價、每日報表
1. 客服收到問題或評價
2. AI 分類: 訂單查詢、改單、退款/補償、過敏/食安、一般問題、負評
3. 高風險分類必須人工接手: 食安、過敏、退款、法律、辱罵威脅
4. 完成訂單後推評價連結或現場 QR
5. 每日打烊後生成老闆報表
6. 老闆報表列出「今天要處理的 3 件事」，但不自動執行調價/採購

## 7. 狀態轉移
```text
cart_draft -> pending -> preparing -> ready -> completed
cart_draft -> abandoned
pending -> rejected
pending -> cancelled
preparing -> cancelled_with_manager_approval
completed -> review_requested -> reviewed
pending/preparing/ready/completed -> customer_support_open -> customer_support_resolved
```

## 8. Handoff 契約

### 前端點餐 -> 後端訂單 API
**Endpoint**: `POST /api/orders`
**Timeout**: 8 秒
**Payload**:
```json
{
  "source": "qr|string",
  "tableCode": "string|null",
  "language": "zh-TW|en|ja|ko",
  "customerName": "string",
  "customerPhone": "string",
  "pickupType": "pickup|dine-in|delivery",
  "pickupTime": "string",
  "items": [
    {
      "sku": "string",
      "name": "string",
      "series": "string",
      "quantity": "number",
      "price": "number",
      "itemNote": "string",
      "dietaryFlags": ["no_beef", "no_pork"],
      "allergyFlags": ["egg", "seafood"]
    }
  ],
  "orderNote": "string",
  "aiRecommendationsAccepted": ["sku"]
}
```
**Success**: `201 { "order": Order }`
**Failure**:
- `400 VALIDATION_ERROR`: 缺姓名、電話、取餐時間、品項或 flags 格式錯誤；不建立訂單。
- `409 INVENTORY_CONFLICT`: 售完或剩餘量不足；不建立訂單或要求重送。
- `503 ORDER_STORAGE_UNAVAILABLE`: 資料庫/local JSON 無法寫入；顯示請洽櫃台。

### 後端訂單 API -> POS
**現有設定**: `POS_WEBHOOK_URL`, `POS_API_KEY`, `POS_TIMEOUT_MS`
**事件**: `order.created`, `order.preparing`, `order.ready`, `order.completed`, `order.rejected`, `order.cancelled`, `order.manual-sync`
**Timeout**: 預設 8 秒
**Failure Recovery**: 訂單主流程不中斷，寫入 `posSyncStatus=failed` 與錯誤訊息，前台可手動重送。

### 後端 -> AI 推薦服務
**Timeout**: 3 秒
**Payload**:
```json
{
  "cart": "OrderItem[]",
  "language": "string",
  "memberProfile": "MemberProfile|null",
  "availableMenuItems": "MenuItem[]",
  "inventorySnapshot": "InventoryItem[]",
  "blockedAllergens": "string[]"
}
```
**Success**: `{ "recommendations": [{ "sku": "string", "reason": "string", "riskFlags": [] }] }`
**Failure Recovery**: 不顯示推薦；訂單流程不中斷；記錄 `aiRecommendationStatus=skipped|failed`。

### 後端 -> 每日老闆報表服務
**Trigger**: 每日打烊時間或手動產生
**Timeout**: 30 秒
**Failure Recovery**: 先產生規則版報表，AI 摘要標示「未產生」，可重新生成。

## 9. 外部 Gate 摘要
完整 Gate 見 `launch-gates.md`。MVP 至少需要決定：
- PostgreSQL 是否作為正式資料庫。
- OpenAI 或其他 LLM API key 是否啟用 AI 推薦/客服/報表。
- POS webhook URL/API key 是否接正式 POS。
- 店內列印橋接或雲端列印服務是否啟用。
- 評價渠道是否使用 Google 商家檔案、LINE OA 或簡訊服務。

## 10. 驗收標準
- 客人可用 QR 開啟點餐，送出訂單後 8 秒內看到單號或明確錯誤。
- 忌口/過敏標籤在客人確認頁、前台卡片、後廚小票/看板三處一致。
- AI 推薦逾時或失敗不阻斷結帳。
- 庫存衝突不會產生超賣訂單。
- POS/列印失敗不會吃單，前台能看到失敗狀態與重試入口。
- 完成訂單後會員點數只發一次。
- 每日報表能在無 AI key 時產生規則版；有 AI key 時補上 AI 摘要。

## 11. Assumptions
| # | 假設 | 驗證狀態 | 風險 |
|---|---|---|---|
| A1 | 正式營運會使用 Railway PostgreSQL，而非 local JSON | README 顯示支援，但未確認部署狀態 | local JSON 不適合多裝置同時接單 |
| A2 | 店內 QR 點餐先不含線上付款 | 由本規格界定 | 若要付款需新增金流 Gate 與退款流程 |
| A3 | 忌口數量或標籤是原訂單/品項的拆分與標示，不是額外餐點 | 依既有便當營運規則記憶 | 算錯會導致備餐數與報表錯誤 |
| A4 | AI 只能建議，不可自動承諾過敏安全 | 由本規格界定 | 食安與責任風險 |
| A5 | 前台仍是所有高風險例外的最後確認者 | 由本規格界定 | 無人確認會造成錯單或客訴 |

## 12. Open Questions
- Lai 家便當正式支援哪些語言？MVP 建議繁中、英文、日文、韓文。
- 店內是否已有 POS 廠商 API 文件？若無，MVP 只能保留 webhook/匯出。
- 是否要接 LINE OA、Google 商家檔案、簡訊或 Email 作為評價/客服渠道？
- 庫存要以「便當可售份數」還是「食材 BOM」作為 MVP 粒度？
- 老闆每日報表的打烊時間與收件渠道是 LINE、Email、Telegram 還是後台頁面？
