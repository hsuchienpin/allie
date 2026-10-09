# 素材來源與設計記錄

Allie 版採原創獨角獸公主風格，奶油白、粉紅、淡紫、薄荷綠。角色、服裝與圖案不以大耳狗、美樂蒂或特定動畫公主作參考。

## 本次新增

| 檔案 | 製作方式 | 用途 |
|---|---|---|
| `wwwroot/assets/allie/stickers.webp` | 內建 image_gen 生成；透明背景，6 欄 × 4 列，1536 × 1024；PNG 無損轉成 WebP | 24 種共享貼紙、選角、甜點、彩球與氣球 |
| `wwwroot/assets/allie/world.webp` | 內建 image_gen 生成；轉成 WebP | 首頁及遊戲的公主遊樂場背景 |
| `wwwroot/assets/cards/allie-*.svg` | 自行編寫的原創封閉輪廓 SVG；`scripts/generate_allie_cards.py` 可重建 | 12 張記憶主題著色紙 |

貼紙順序：第一列獨角獸、水母、企鵝、彩虹公主、花朵公主、海洋公主；第二列糖果公主、獨角獸棉花糖、花朵棉花糖、獨角獸雞蛋糕、企鵝雞蛋糕、愛心雞蛋糕；第三列草莓／橘子／葡萄軟糖、霜淇淋、彩虹／草莓冰棒；第四列粉紅／藍色塑膠球、獨角獸／愛心氣球、戶外／室內遊樂場。

生成設計摘要：獨立原創童話插畫，圓潤友善、粉彩、白色貼紙邊、每格完整物品、無文字或品牌。雞蛋糕呈金黃色模具烤蛋糕而非奶油杯子蛋糕；軟糖呈半透明水果造型；塑膠球帶接縫。背景左側是原創公主和獨角獸，中後方戶外滑梯，右側室內球池；中心留出安靜草地以放置介面。

AI 圖稿未作為特定第三方角色的授權素材使用；本檔記錄生成來源，不宣稱 AI 素材的著作權排他性。

## 保留素材

原有 30 張圖卡與 10 枚印章由 `scripts/card_designs.py`、`scripts/generate_assets.py` 自行製作。原有 Slice／Bowl PNG、森林封面與角色圖曾由 image_gen 生成；其中部分已改為 Allie 素材，保留舊貼紙圖集供既有收藏遷移。Slice 六段 WAV 為 `scripts/generate_slice_audio.py` 本機合成；其他音效由 Web Audio 合成。

jQuery 3.7.1 隨專案附帶，其 MIT 授權文字保留在 `wwwroot/vendor/LICENSE.jquery.txt`。網站不引用外部圖片、字型或 CDN。
