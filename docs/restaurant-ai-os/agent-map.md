# Lai 家便當餐廳 AI OS Agent Map
**日期**: 2026-08-26
**狀態**: Draft
**目的**: 定義每個人員/代理/服務的責任邊界、輸入輸出與失敗交接。

## 1. Agent Registry
| Agent | 類型 | 階段 | 主要責任 | 不可做 |
|---|---|---|---|---|
| Customer Ordering Agent | UI/流程代理 | MVP | 引導 QR 點餐、多語、購物車、忌口/過敏、送單 | 不承諾過敏安全 |
| Recommendation Agent | AI 代理 | MVP | 產生加購/套餐建議 | 不推薦缺貨、過敏衝突或被店長停用的品項 |
| Front Desk Agent | 人員+後台 | MVP | 接單、確認付款/過敏/缺貨、拒單、重送 POS | 不略過高風險確認 |
| Kitchen Agent | 人員+看板/小票 | MVP | 製作、標記完成、回報售完 | 不修改價格或成本 |
| Inventory Agent | 系統+營運 | MVP | 預扣、回補、售完鎖定、低庫存提示 | 不在資料缺漏時自動扣庫 |
| Cost Agent | 系統+財務 | MVP | 單品成本、毛利快照、每日成本摘要 | 不覆蓋歷史訂單成本 |
| Member Agent | 系統 | MVP | 手機會員、點數、偏好、推薦碼 | 不在未完成訂單發點 |
| Customer Support Agent | AI+客服 | MVP | 問題分類、回覆草稿、人工接手 | 不自動處理退款、食安、過敏爭議 |
| Review Agent | 系統+行銷 | MVP | 評價邀請、負評標記 | 不刷評、不誘導不實評價 |
| Boss Report Agent | AI+報表 | MVP | 每日老闆報表、問題摘要、建議 | 不自動調價、採購、改菜單 |
| POS Bridge Agent | 外部/橋接 | MVP | POS webhook、狀態同步、重送 | 不作為唯一訂單真相來源 |
| Print Bridge Agent | 外部/本地 | MVP | 小票列印、失敗 fallback | 不讓列印失敗造成吃單 |
| Security/Compliance Agent | 人員 | MVP | 權限、金鑰、隱私、上線 Gate | 不把金鑰寫入文件或前端 |

## 2. Agent Handoff

### Customer Ordering Agent -> Recommendation Agent
**時機**: 客人進入結帳確認前。
**Payload**:
```json
{
  "cart": "OrderItem[]",
  "language": "string",
  "blockedDietaryFlags": "string[]",
  "blockedAllergyFlags": "string[]",
  "availableMenuItems": "MenuItem[]",
  "memberProfile": "MemberProfile|null"
}
```
**成功**: 回傳 1-3 個推薦與短理由。
**失敗/逾時**: Customer Ordering Agent 略過推薦，繼續結帳。
**Timeout**: 3 秒。

### Customer Ordering Agent -> Front Desk Agent
**時機**: 訂單建立為 `pending`。
**Payload**:
```json
{
  "orderId": "string",
  "tableCode": "string|null",
  "language": "string",
  "items": "OrderItem[]",
  "dietaryFlags": "string[]",
  "allergyFlags": "string[]",
  "requiresHumanConfirm": "boolean",
  "total": "number",
  "timeline": "array"
}
```
**成功**: 前台看到新單與風險標籤。
**失敗**: 若後台讀取失敗，訂單仍存在於資料庫；需前台重新整理或切人工流程。
**Timeout**: 新單通知 5 秒內顯示，超過需重新整理提示。

### Front Desk Agent -> Kitchen Agent
**時機**: 前台接單，狀態改 `preparing`。
**Payload**:
```json
{
  "orderId": "string",
  "prepMinutes": "number",
  "kitchenTicket": "string",
  "items": "OrderItem[]",
  "riskLabels": "string[]"
}
```
**成功**: 後廚小票/看板出現製作項目。
**失敗**: 列印 fallback；後廚看板仍可查看。
**Timeout**: 列印 5 秒，本地橋接可另訂。

### Front Desk Agent -> POS Bridge Agent
**時機**: 訂單建立、接單、完成、拒單、取消、手動重送。
**Payload**: 沿用現有 POS webhook order event contract。
**成功**: 訂單 timeline 記錄 `pos-sync`。
**失敗**: 訂單 timeline 記錄 `pos-error`，前台顯示可重送。
**Timeout**: 現有預設 8 秒。

### Kitchen Agent -> Inventory Agent
**時機**: 訂單接單與完成。
**Payload**:
```json
{
  "orderId": "string",
  "items": [{ "sku": "string", "quantity": "number" }],
  "transition": "pending_to_preparing|preparing_to_completed|rejected|cancelled"
}
```
**成功**: 庫存從 reserved 轉 consumed，或回補。
**失敗**: 訂單狀態不得消失；Inventory Agent 建立修正任務給店長。
**Timeout**: 5 秒。

### Order System -> Member Agent
**時機**: 訂單變為 `completed`。
**Payload**:
```json
{
  "orderId": "string",
  "customerPhone": "string",
  "total": "number",
  "completedAt": "datetime"
}
```
**成功**: 每 100 元 1 點，ledger 有唯一 orderId earn 紀錄。
**失敗**: 訂單仍 completed；會員補點任務進入待處理。
**Timeout**: 5 秒。

### Customer Support Agent -> Human Operator
**時機**: 高風險客服分類或 AI 信心不足。
**Payload**:
```json
{
  "conversationId": "string",
  "customerPhone": "string|null",
  "orderId": "string|null",
  "intent": "food_safety|allergy|refund|complaint|order_change|faq",
  "riskLevel": "low|medium|high",
  "aiDraft": "string",
  "requiredAction": "string"
}
```
**成功**: 人工送出回覆並關閉或升級案件。
**失敗**: 案件保持 open，不自動回覆。
**Timeout**: 高風險 15 分鐘內需前台看到提醒；實際 SLA 由店家決定。

### Boss Report Agent -> Owner
**時機**: 打烊後或手動產生。
**Payload**:
```json
{
  "businessDate": "date",
  "orders": "Order[]",
  "inventory": "InventoryItem[]",
  "costs": "CostSnapshot[]",
  "supportCases": "CustomerConversation[]",
  "reviews": "Review[]"
}
```
**成功**: 產出每日老闆報表。
**失敗**: 產出規則版報表，AI 摘要缺席。
**Timeout**: 30 秒。

## 3. 權限矩陣
| 功能 | 客人 | 前台 | 後廚 | 店長/老闆 | AI |
|---|---:|---:|---:|---:|---:|
| 建立訂單 | 可 | 可 | 否 | 可 | 否 |
| 修改訂單狀態 | 否 | 可 | 可標 ready | 可 | 否 |
| 拒單/取消 | 可送請求 | 可 | 否 | 可 | 否 |
| 看過敏資訊 | 自己的 | 可 | 可 | 可 | 可讀必要最小資料 |
| 改菜單價格 | 否 | 否 | 否 | 可 | 只建議 |
| 改庫存 | 否 | 可回報售完 | 可回報售完 | 可 | 只建議 |
| 改成本 | 否 | 否 | 否 | 可 | 只建議 |
| 客服回覆 | 可發問 | 可 | 否 | 可 | 只產草稿 |
| 產生日報 | 否 | 可看必要摘要 | 否 | 可 | 可產草稿 |

## 4. Agent Failure Rules
- AI 代理失敗不得阻斷客人送單、前台接單、後廚出餐。
- 外部 POS/列印失敗不得讓訂單消失。
- 過敏、食安、退款、法律、辱罵威脅永遠交給人。
- 庫存資料不完整時，不允許 AI 用庫存理由做推薦。
- 成本資料不完整時，報表必須標示「成本未設定」。
- 金鑰、token、webhook secret 不得寫入前端、文件範例或截圖。

## 5. 需要補規格的 Missing Workflows
| Workflow | 狀態 | 風險 |
|---|---|---|
| 後台登入與權限 | Missing | 未限制後台會暴露訂單/會員個資 |
| 金流與退款 | Deferred | 若未來加線上付款，需獨立規格 |
| 多店資料隔離 | Phase 3 Missing | 多店後若未隔離會串資料 |
| 本地列印橋接安裝 | Missing | 雲端無法直接連店內印表機 |
| 食安/過敏事故處理 | Missing | 必須有人員 SOP 與紀錄 |
