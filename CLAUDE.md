# 給 Claude 的工作規則

開始任何工作前，先讀 `docs/HANDOFF.md`（設計決策和尚未定案的事），再讀 `README.md`。用繁體中文跟使用者溝通。

## 檔案

- 遊戲規則改 `game/core.js`，關卡改 `game/levels.js`，2D 畫面改 `game/template.html`。
- `game/index.html` 和 `art/dist/` 是建置產物，不要手動修改；改完原始檔後重新建置，並把產物一起 commit。
- 3D 概念圖的場景在 `art/concept.html`，樣張在 `art/keyart.html`；共用的遊戲瞬間在 `art/scene.json`，由 `art/export-scene.js` 產生。

## 每次改動遊戲或關卡之後

```bash
npm run build
```

```bash
npm run check
```

```bash
npm run play-all
```

- `build` 失敗代表有關卡解不出來。
- `check` 必須在每一關都是零誤差：危險預告要跟實際撞車完全一致。
- `play-all` 用瀏覽器把每一關的最短解玩一遍。

如果最少步數有變，也要同步更新 `README.md` 的關卡表。

## 設計原則

- 規則要合乎現實：違停機車和汽車推不動；推得動的只有店家雜物、三角錐和嬰兒車。
- 解法要讓玩家看得出來，不能只靠背答案。新關卡要用 `game/tools/careful.js` 這類模擬確認一般玩家有機會過關，並確認「推東西」在關卡裡是必要的。
- 改了畫面要自己截圖看過再交出去。

## 環境

- three.js 0.160.0 從 jsDelivr 載入；在連不到 CDN 的環境裡，`art/render.js` 會改用 `node_modules/three`。
- 無頭瀏覽器渲染 WebGL 要加 `--use-angle=swiftshader`，`art/render.js` 已經設定好。
