# Allie's Playground

給 Allie 的獨角獸公主遊戲樂園。四個遊戲共用貼紙背包，英文操作、繁體中文說明；免登入，直接在瀏覽器遊玩。

遊玩網址：https://hsuchienpin.github.io/allie/

| 入口 | 玩法 | 貼紙任務 |
|---|---|---|
| Draw | 畫筆、填色、印章、回憶貼紙、下載作品 | 使用其他遊戲取得的貼紙 |
| Go! | 選公主、獨角獸或企鵝，左右閃避彩球 | 累積至少 30 秒有效遊玩，再結算 |
| Slice | 切開造型糖果、雞蛋糕、冰棒 | 累積 20 Energy，再按 Open |
| Bowl | 十瓶保齡球，一局 10 格；左右調整起點，滑動出球 | 完成整局 10 格 |
| My Stickers | 查看所有可用貼紙與數量 | 共用獎勵中心 |

每個任務固定一張貼紙。24 種原創回憶貼紙包括獨角獸、水母、企鵝、四位公主、棉花糖、雞蛋糕、水果軟糖、霜淇淋、冰棒、塑膠球、氣球與兩種遊樂場。同一圖案可以得到多張，但每一張實體副本只能貼一次。遊戲分數與 Energy 是遊玩進度，不是可兌換的獎勵貨幣。

Draw 有 42 張著色紙（原有 30 張，加上 12 張回憶主題）。每張內建圖卡保存一份草稿，New Paper 有一份空白草稿；每次匯入圖片建立獨立草稿。重開畫室會回到最後使用的草稿。

## 保存方式

貼紙、音效偏好與草稿保存在同一來源、同一瀏覽器的 IndexedDB。貼紙扣除與草稿寫入使用同一交易；保存失敗不扣貼紙。Undo 移除貼紙時退回一張；移動、縮放、旋轉和下載作品不會退回或再次扣除。

同一任務重試只保存一張；多分頁操作會檢查草稿版本，拒絕覆蓋別的分頁已更新的作品。舊 Slice／Bowl 收藏每種已收集圖案各轉入一張，不推算過去取得的次數。

無法保存的瀏覽器仍可遊玩和下載作品，但不啟用會消耗庫存的貼紙操作。清除網站資料、無痕視窗關閉、換瀏覽器或裝置會失去當地資料，未提供帳號或雲端同步。舊本機網址的紀錄無法跨來源自動搬到 GitHub Pages。

## 本機預覽與驗證

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory wwwroot
node --test tests/*.test.cjs
```

開啟 http://127.0.0.1:8765/ 。也可使用 .NET 8 執行 `dotnet run` 提供靜態檔案。網站發布只需要 `wwwroot`，不需要伺服器資料庫或 .NET 主機。

瀏覽器驗證：安裝 Playwright 並準備 Chromium 後，執行 `node tests/browser.cjs`。`BASE_URL` 可指定公開網址或帶子路徑的預覽網址；測試會用隔離的瀏覽器資料驗證獎勵和保存，並把截圖放在忽略上傳的 `artifacts/browser`。

## GitHub Pages

`.github/workflows/pages.yml` 在 main 更新時檢查 JavaScript、執行邏輯測試，再部署 `wwwroot`。GitHub Pages 發布來源設定為 GitHub Actions。所有入口、圖片與 Worker 都支援 `/allie/` 子路徑。公開網址改名後沿用原有裝置保存空間，既有貼紙與草稿仍可讀取。

沒有圖片上傳、會員、外部 CDN、廣告或追蹤程式。自行匯入的照片和畫作在裝置處理；Ideas 只生成給家長複製的中文提示詞，不會呼叫 AI 或替使用者傳送照片。未實作離線重新開啟。

遊玩說明見 [docs/PLAY_GUIDE.md](docs/PLAY_GUIDE.md)，素材來源見 [docs/ASSETS.md](docs/ASSETS.md)，驗證方法與限制見 [TESTING.md](TESTING.md)。
