# Piano 與 Drums

新增 Piano／Drums 兩個入口，沿用 Allie's Playground 原創獨角獸公主素材、固定 Home／Full screen、共用音效偏好和消耗式貼紙。

## 玩法

- Piano：C D E F G A B 高音 C 共 8 個大白鍵，沒有黑鍵、和弦或難度選擇。只有單音，下一個鍵會提前亮起；等音符到金色亮線時，點一下該鍵。鍵盤 A S D F G H J K 對應 8 鍵。
- Drums：左右兩條落下軌道與左右鼓面中心對齊。L 點 Left，R 點 Right；偶爾同時到達時用兩手一起敲。鍵盤 F／J。手機直式仍維持左右並排，短橫式縮小鼓面保留落下區。
- 每首是約 39–66 秒的主題小編曲，可先 Listen 試聽再 Play；兩款各 10 首，全數開放。沒有關卡選擇、扣分、失敗退出或星星貨幣。
- 開始有 3 秒準備。Pause 凍結進度並停止已排程聲音，Resume 有 2 秒準備，再從原位置接續。切換視窗、音效被系統中斷、旋轉螢幕會自動暫停。
- 遊玩畫面左側的 ← Songs 直接回到該遊戲的選曲首頁，保留所選歌曲並停止音樂、清除按住狀態；再次 Play 從頭開始。上方 Home 回到 Allie 總首頁。兩種返回都保持全螢幕，中途返回不領貼紙。
- Great! 100 分、Good! 50 分；按住不連發，按錯軌道或太早不計分。分數、最佳成績只供回顧。
- 完整玩完且命中至少一次，固定領一張共用貼紙；空放一首、中途 Home 或 Back to songs 不領。每次重新完整遊玩是一個新任務，重試同一任務只保存一張。獎勵保存失敗可重試，已完成的待領任務在網站儲存可用時保留到重載後。
- Use 進入 Draw；放置一次扣除一張實體貼紙，Undo 退回同一張。沿用既有 IndexedDB，未變更、清除或遷移舊草稿與庫存。

## 音樂來源與使用範圍

使用歷史旋律的自製遊戲編曲與 Web Audio 合成音色，沒有第三方 MP3、現代演奏錄音、下載 MIDI、歌詞、樣本音庫或遠端音訊請求。鋼琴是含衰減包絡的泛音合成；鼓是自製低頻衰減與程序生成噪音。Piano 由玩家彈出旋律，提供輕聲低音陪伴；Drums 播放自製旋律伴奏，由玩家敲鼓。

選用公有領域的原作旋律。曲名相同的現代錄音、編曲與樂譜排版可能另有權利，並未因原曲年代而視為可直接複製。美國著作權局對[音樂作品與錄音的分別](https://www.copyright.gov/circs/circ56a.pdf)有說明；臺灣著作財產權期間可參考[智慧財產局](https://www.tipo.gov.tw/tw/copyright/694-17709.html)。以下連結是年代與旋律原作的查核資料，不是執行時依賴，也沒有把來源的整份樂譜或錄音納入遊戲。

| Piano 曲名 | 原作依據／查核來源 |
|---|---|
| Twinkle, Twinkle, Little Star | 18 世紀法國傳統旋律 Ah! vous dirai-je, maman；[Mozart K.265 原作資料與歷史版樂譜](https://imslp.org/wiki/12_Variations_on_%27Ah_vous_dirai-je,_Maman%27,_K.265/300e_(Mozart,_Wolfgang_Amadeus)) |
| Mary Had a Little Lamb | 19 世紀童謠旋律；[Library of Congress，The school song book](https://www.loc.gov/item/28017858/) |
| London Bridge | 傳統童謠；[Walter Crane，The Baby's Bouquet（19 世紀書籍影本）](https://www.gutenberg.org/files/25432/25432-h/25432-h.htm) |
| Row, Row, Row Your Boat | 常見旋律見 1881 年 Franklin Square Song Collection；[Morgan Library 館藏紀錄](https://www.themorgan.org/music-manuscripts-and-printed-music/311191) |
| Are You Sleeping? | Frère Jacques 傳統旋律，1811 年 La clé du caveau；[Morgan Library 館藏紀錄](https://www.themorgan.org/music-manuscripts-and-printed-music/130800) |
| Moonlight Song | Au clair de la lune 傳統旋律，同見 1811 年 La clé du caveau；[Morgan Library 館藏紀錄](https://www.themorgan.org/music-manuscripts-and-printed-music/130800) |
| Ode to Joy | Beethoven 第九交響曲主題，1824，作曲者卒於 1827；[歷史原作樂譜](https://imslp.org/wiki/Symphony_No.9,_Op.125_(Beethoven,_Ludwig_van)) |
| Brahms’ Lullaby | Brahms Op.49 No.4，1868，作曲者卒於 1897；[作品與歷史版樂譜](https://imslp.org/wiki/Wiegenlied_(Brahms,_Johannes)) |
| Lightly Row | 19 世紀傳統旋律（Hänschen klein）；[1898 年 Liederkranz 的古書樂譜頁與館藏資料](https://hymnary.org/text/lightly_row_lightly_rowoer_the_glassy_wa) |
| Hot Cross Buns | 傳統童謠；[The Baby's Bouquet 的歷史旋律頁](https://www.gutenberg.org/files/25432/25432-h/25432-h.htm) |

Piano 為適合 8 鍵操作的單音主題版，並非原曲全譜。慢化節奏、拉長短音；Moonlight Song 移調以保留旋律範圍，Are You Sleeping? 尾句的低音 G 改在同一白鍵八度內。原先較複雜的小步舞曲、給愛麗絲，改為 Lightly Row、Hot Cross Buns。

| Drums 曲名 | 原作依據／查核來源 |
|---|---|
| Jingle Bells | James Lord Pierpont，1857，卒於 1893；[Johns Hopkins Levy Music Collection，歷史樂譜](https://levysheetmusic.mse.jhu.edu/collection/062/029) |
| Yankee Doodle | 18 世紀傳統旋律；[Library of Congress 歷史館藏與研究報告](https://tile.loc.gov/storage-services/service/gdc/scd0002/0007/00072432514/00072432514.pdf) |
| Oh! Susanna | Stephen Foster，1847，卒於 1864；[Library of Congress 作曲者資料](https://www.loc.gov/item/ihas.200035701/) |
| Camptown Races | Stephen Foster，1850；[Library of Congress 歷史樂譜](https://www.loc.gov/item/2011564470/) |
| Can-Can | Offenbach，Orphée aux enfers，1858，卒於 1880；[歷史原作樂譜](https://imslp.org/wiki/Orph%C3%A9e_aux_Enfers_(Offenbach,_Jacques)) |
| William Tell | Rossini 序曲主題，1829，卒於 1868；[歷史原作樂譜](https://imslp.org/wiki/Guillaume_Tell_(Rossini,_Gioacchino)) |
| Radetzky March | Johann Strauss I，1848，卒於 1849；[歷史原作樂譜](https://imslp.org/wiki/Radetzky-Marsch,_Op.228_(Strauss_Sr.,_Johann)) |
| Turkish March | Mozart K.331 第三樂章，1780 年代，卒於 1791；[歷史原作樂譜](https://imslp.org/wiki/Piano_Sonata_No.11_in_A_major,_K.331/300i_(Mozart,_Wolfgang_Amadeus)) |
| Stars and Stripes | John Philip Sousa，1896／1897，卒於 1932；[Library of Congress 保存的手稿與出版資料](https://www.loc.gov/preservation/conservators/bachbase/bbcmusic/) |
| Toreador March | Bizet，Carmen，1875，卒於 1875；[歷史原作樂譜](https://imslp.org/wiki/Carmen_(Bizet,_Georges)) |

Can-Can 主題參考 1870 年 Root & Cady 的古譜中 Galop 段落，旋律重新編成遊戲小品；查核影本記錄：[Library of Congress](https://www.loc.gov/item/2023813691/)。

Stars and Stripes 使用 1897 年 John Church 出版古譜的 Trio 開頭段落，查核影本：[Silent Film Sound & Music Archive](https://www.sfsma.org/the-stars-and-stripes-forever/)。

Drums 是慢化的主題摘錄，左右鼓點由本專案自編，沒有套用其他節奏遊戲的譜面、角色或商標。兩款仍共用原創素材，不使用大耳狗、美樂蒂或太鼓達人素材。

## 技術與保存

`rhythm/songs.js` 保存音高與時值，`core.js` 產生譜面與單調時間命中判定；`audio.js` 在 Play／Listen 的操作後啟動 AudioContext，以同一時鐘安排伴奏及更新畫面。停止、暫停與離開會取消音訊節點，不留下背景聲音。無 Web Audio 支援時可按畫面遊玩。

鋼琴音符與鼓點已放大，鼓點尺寸增加更多；判定框會配合記號尺寸，記號中心在正確時間對齊金色亮線。短橫式會縮短畫面內的預告時間，讓同軌道的連續記號保持間隔；曲目速度、音樂、得分時間範圍與貼紙條件維持原設定。

選曲、最佳分數、待領任務存在 `allie.rhythm.piano.v1`／`allie.rhythm.drums.v1` 的 localStorage；共用貼紙仍由原 IndexedDB 原子交易保存。待領記錄只含遊戲任務識別、曲目及分數，沒有姓名、帳戶或外傳。

使用者指定不用耳機，因此沒有耳機延遲設定或校正流程。瀏覽器測試不代替 Allie 在實際平板上對喇叭、手感和閱讀大小的驗收。
