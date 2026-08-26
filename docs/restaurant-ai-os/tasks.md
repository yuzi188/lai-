# Lai 家便當餐廳 AI OS 任務清單
**日期**: 2026-08-26
**狀態**: Draft
**格式**: 每個任務都要有驗收條件；沒有 Gate 通過不得接外部正式服務。

## MVP

| ID | 任務 | Owner | 依賴 | 驗收條件 |
|---|---|---|---|---|
| MVP-01 | 盤點現有訂單欄位與狀態轉移 | Workflow Architect | 無 | 文件列出現有 `/api/orders`、status、print、pos-sync、members 入口 |
| MVP-02 | 定義 QR 參數 contract | Backend Architect | MVP-01 | `source`, `storeId`, `tableCode`, `language` 有資料型別與 fallback |
| MVP-03 | 擴充訂單 payload schema | Backend Architect | MVP-02 | 舊訂單可讀，新訂單可存 language/table/dietary/allergy |
| MVP-04 | 多語字典資料模型 | Content Ops | MVP-03 | 菜名、說明、按鈕、錯誤訊息可回退繁中 |
| MVP-05 | 忌口/過敏分類表 | Food Safety Owner | MVP-04 | 至少含不吃牛、不吃豬、不吃海鮮、蛋、堅果、奶、辣、素食 |
| MVP-06 | 客人點餐確認頁規格 | Frontend Designer | MVP-05 | 送出前明確顯示品項、數量、金額、忌口/過敏 |
| MVP-07 | 前台高風險標籤規格 | Frontend Developer | MVP-05 | 過敏/模糊備註/缺貨/重複單在接單卡片上可見 |
| MVP-08 | 後廚小票/看板欄位規格 | Backend Architect | MVP-07 | 小票/看板顯示桌號、品項、數量、忌口/過敏、備註 |
| MVP-09 | 庫存單品可售量資料模型 | Operations Owner | MVP-03 | 有開店量、可售量、預扣、售完、回補欄位 |
| MVP-10 | 庫存衝突規則 | Backend Architect | MVP-09 | 同時搶最後一份只成功一筆，另一筆回 409 |
| MVP-11 | 成本快照資料模型 | Finance Owner | MVP-09 | 訂單完成時保留當下單品成本與毛利估算 |
| MVP-12 | AI 推薦服務 contract | AI Engineer | MVP-04, MVP-09 | 輸入含購物車/庫存/過敏，輸出最多 3 個可售建議 |
| MVP-13 | AI 推薦 fallback | Backend Architect | MVP-12 | 逾時 3 秒或失敗不阻斷送單 |
| MVP-14 | 會員偏好欄位 | Backend Architect | MVP-03 | 手機會員可保存語言、忌口偏好、過敏備註 |
| MVP-15 | 客服分類與回覆草稿規格 | Customer Service Owner | MVP-03 | 高風險分類必須人工接手 |
| MVP-16 | 評價邀請規格 | Marketing Owner | MVP-15 | 完成訂單後可產生評價連結或 QR |
| MVP-17 | 每日老闆報表資料源 | Data Analyst | MVP-11, MVP-15, MVP-16 | 訂單、營收、份數、毛利、缺貨、客服、評價可彙整 |
| MVP-18 | 無 AI key 報表 fallback | Data Analyst | MVP-17 | 規則版報表可產出，AI 摘要標示未啟用 |
| MVP-19 | Gate 檢查清單 | DevOps Automator | 所有外部服務 | `launch-gates.md` 每個 Gate 有 owner 與通過證據 |
| MVP-20 | 端到端試營運腳本 | QA Tester | MVP-01..19 | 可演練掃碼、下單、接單、列印、缺貨、完成、報表 |

## Phase 2

| ID | 任務 | Owner | 依賴 | 驗收條件 |
|---|---|---|---|---|
| P2-01 | 食材 BOM 扣庫 | Operations Owner | MVP-09 | 每個餐點可扣多個食材 |
| P2-02 | 低庫存提醒 | Backend Architect | P2-01 | 低於閾值產生前台/店長提醒 |
| P2-03 | AI 翻譯審核流程 | Content Ops | MVP-04 | AI 草稿需人工發布才上線 |
| P2-04 | 缺貨替代建議 | AI Engineer | P2-02 | 建議不得違反過敏/忌口 |
| P2-05 | LINE OA 客服整合 | Customer Service Owner | MVP-15 | 可收訊息、產草稿、人工送出 |
| P2-06 | Google 評價整合 | Marketing Owner | MVP-16 | 可追蹤評價邀請與負評 |
| P2-07 | 補償券流程 | Marketing Owner | P2-05 | 負評/客訴可建立補償券並記錄 |
| P2-08 | 權限與操作紀錄 | Security Engineer | MVP-07 | 前台、後廚、店長權限分離 |
| P2-09 | 報表同比/環比 | Data Analyst | MVP-17 | 支援昨日、上週同日、近 7 天比較 |
| P2-10 | 食材價格歷史 | Finance Owner | P2-01 | 成本異動可回溯，不覆蓋舊訂單快照 |

## Phase 3

| ID | 任務 | Owner | 依賴 | 驗收條件 |
|---|---|---|---|---|
| P3-01 | 多店資料模型 | Backend Architect | P2-08 | 訂單、庫存、會員、報表可按 storeId 切分 |
| P3-02 | 需求預測 | Data Scientist | P2-09 | 產出備料建議與信心分數 |
| P3-03 | 自動採購建議 | Operations Owner | P3-02 | 只產生建議單，不自動下採購 |
| P3-04 | 個人化套餐 | AI Engineer | P2-04 | 建議可解釋、可關閉、可排除敏感條件 |
| P3-05 | 廚房排程最佳化 | Operations Owner | P2-01 | 尖峰訂單可估完成時間 |
| P3-06 | 多店老闆戰情室 | Data Analyst | P3-01 | 多店排行、毛利、缺貨、客訴集中顯示 |

## 必測案例

| Test ID | 分支 | 預期 |
|---|---|---|
| TC-01 | 一般 QR 下單 | 訂單進 `pending`，前台看到桌號與語言 |
| TC-02 | 缺必填欄位 | 回 400，不建立訂單 |
| TC-03 | AI 推薦逾時 | 結帳不中斷，不顯示推薦 |
| TC-04 | 過敏品項衝突 | 推薦被移除或要求人工確認 |
| TC-05 | 庫存最後一份併發 | 僅一筆成功，另一筆回 409 |
| TC-06 | 前台拒單 | 狀態 `rejected`，庫存回補，POS 事件送出或標失敗 |
| TC-07 | 列印失敗 | 產生小票檔 fallback，訂單不消失 |
| TC-08 | POS webhook 失敗 | `posSyncStatus=failed`，可手動重送 |
| TC-09 | 完成訂單累點 | 點數只發一次，重送 status 不重複發 |
| TC-10 | 成本缺漏 | 日報標示成本未知，不產生假毛利 |
| TC-11 | 客服食安問題 | AI 只產草稿並強制人工接手 |
| TC-12 | 無 AI key 打烊 | 產出規則版每日老闆報表 |

## 紅旗任務
- 紅旗 1: 正式營運若仍使用 local JSON，併發與資料遺失風險高。
- 紅旗 2: 後台目前 README 未描述登入/權限，MVP 上線前需補 Gate。
- 紅旗 3: 過敏原與食材資料若未人工審核，不得啟用 AI 推薦。
- 紅旗 4: POS/列印若在店內 LAN，雲端 Railway 無法直接連，需要本地橋接。
- 紅旗 5: 評價/客服若接外部渠道，需確認帳號權限、隱私告知與人工接手。
