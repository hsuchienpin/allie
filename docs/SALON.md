# Little Salon 美妝沙龍原型

本機首頁選 Little Salon，或進入 `/salon/`。沿用固定 Home／Full screen 外層，可跨首頁保留全螢幕。介面以英文工具名稱搭配繁體中文提示。

## 操作

| 工具 | 玩法 |
| --- | --- |
| Lipstick | 選色後在嘴唇上拖動，顏色限制於嘴唇內；反覆塗抹疊色。 |
| Eyeshadow | 選色後在眼皮上刷色，角色會閉眼；Both eyes 預設開啟，左右同步。取消勾選可各自塗色。 |
| Scissors | 在側邊長髮或瀏海上滑動。每束頭髮獨立變短，剪下的部分會掉落。 |
| Hair dryer | 在頭髮旁按住並移動，或點 Turn on 持續吹風。滑桿改變風力，Turn off 關閉後髮束逐漸回落。 |

化妝時自動切換臉部近景，剪髮與吹髮則顯示完整頭髮。畫布採 Pointer Events、指標捕捉與 `touch-action: none`，設計上供滑鼠與單指拖曳；第二隻手指不會接手正在進行的操作。取消觸控、視窗失焦或旋轉造成畫布尺寸改變時，未完成的塗色／剪髮會回復到操作前，吹風也會停止。

Undo／Redo 可還原妝容與剪髮。Remove makeup 只卸妝；Grow hair back 只恢復髮長。Start over 全部重設，當次仍可用 Undo 回復。Save photo 開啟 1200×1440 PNG 成品預覽，再按 Download PNG；也可長按成品儲存。照片顯示完整髮型，不含工具游標。

## 保存與範圍

進度保存於 `allie-little-salon-v1` 的 localStorage，保存妝容筆觸與髮束長度；吹風的瞬時擺動、所選工具與復原歷史不跨重整保存。只保留最後一個造型，同來源與瀏覽器重新開啟可繼續。清除網站資料或使用無痕模式可能失去進度；不提供帳號、雲端同步、作品上傳或貼紙獎勵。無法保存時會顯示提示，仍可遊玩與產生照片。

本版只有一位原創插畫女生的頭部與頸部。頭髮是 68 束二維彈性髮束，頭頂有固定髮根；可剪側髮和瀏海，不是每一根髮絲的寫實模擬。眼線、腮紅、飾品與其他角色尚未納入本次四工具原型。

## 檔案

- `wwwroot/salon/core.js`：髮束幾何、剪髮判定、風力與彈性、保存資料驗證、復原歷史。
- `wwwroot/salon/renderer.js`：插畫、妝容遮罩、柔邊筆刷、髮束和剪落動畫。
- `wwwroot/salon/app.js`：工具、指標輸入、近景座標、保存與成品照片。
- `tests/salon.test.cjs`：剪髮、遮擋、瀏海、受風吹動後的剪髮判定、風力穩定與回落、存檔驗證及座標映射。

測試紀錄見 `TESTING.md`。本機試玩使用 `python -m http.server 8771 --bind 127.0.0.1 --directory wwwroot`，網址為 `http://127.0.0.1:8771/`；此網址供目前這台電腦使用。公開試玩網址為 https://hsuchienpin.github.io/allie/salon/ ，也可從線上遊戲首頁第一個 Little Salon 入口進入。
