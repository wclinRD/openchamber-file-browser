# Design Guide — openchamber-file-browser

## 1. 概述

`openchamber-file-browser` 是 OpenChamber 擴充套件，把 OpenChamber host 的文件
存取能力整理成一個可瀏覽、可預覽、可編輯的檔案瀏覽系統。

延續 `openchamber-memory-graph-ui` 的設計語言（panel shell、reducer、i18n、
dialog、host bridge），整個專案改以 **host 原生檔案 API** 取代 opencode-mem 的
本機 service proxy。

## 2. 設計目標

1. 以最少的本機服務與授權邊界，完成「瀏覽 → 預覽 → 編輯」閉環。
2. 保留 OpenChamber 既有的主題 token、locale、focus、a11y 慣用做法。
3. 單一 capability grant（`files` + `filesystem`）涵蓋瀏覽與寫入。

## 3. 架構

```
┌──────────────────────────── OpenChamber ────────────────────────────┐
│  panel/index.html (sandboxed guest, panel or page surface)         │
│    panel/main.ts      host lifecycle, shell, load                     │
│    panel/file-view   directory listing + navigation + selection     │
│    panel/preview     content preview + edit + save                 │
│    panel/state.ts     reducer, request generations                  │
│    panel/api.ts       typed client over host file methods           │
│              │  host.listDir / readFile / stat / writeFile          │
│              ▼                                                     │
│        OpenChamber host file runtime                              │
└─────────────────────────────────────────────────────────────────────┘
```

## 4. 設計決策

### 4.1 為何不用 local service

`opencode-memory-graph-ui` 的本機 service 是為了 proxy 到 `opencode-mem`
（127.0.0.1:4747）。檔案瀏覽不需要第二層 token、proxy allowlist 與 health check。

OpenChamber host 已提供 `listDir / readFile / stat / writeFile`，
並依 capability 控制路徑（相對路徑進入 open project；`/` 或 `~/` 需宣告
`contributes.filesystem` pattern）。直接用 host API，省掉 service 層。

### 4.2 Capability 與 scope

- `capabilities: ["files"]`：`files` = 在 open project 內 read + write。
- `contributes.filesystem: ["~/.**"]`：`filesystem` capability，放開 home 目錄範圍。

錯誤代碼對應（`panel/i18n.ts` `errorCopy`）：

- `NO_DIRECTORY`：未開專案
- `NOT_FOUND`：路徑不存在
- `FILE_TOO_LARGE`：內容超 host 上限
- `DENIED`：OS 拒絕存取
- `NOT_GRANTED`：未授權

fallback 為 `failedTitle / failedBody`。

### 4.3 兩個 view 的分工

- **Files**：清單、麵包屑、導航（`NAVIGATE`）、選取（`FILE_SELECTED`）、空狀。
- **Preview**：選取檔案的 content + stat，編輯後 `writeFile` → toast → reload。

兩者共用同一份 state（`cwd`、`entries`、`selectedPath`、`preview`），
不引入第二份 store。

### 4.4 State 設計

- `REQUEST_STARTED / REQUEST_FAILED / FILE_LIST_RECEIVED / PREVIEW_LOADED / PREVIEW_FAILED`
- 每個結果帶 `requestGeneration`，過期結果直接忽略（stale guard）。
- `NAVIGATE` 會清 `selectedPath`；導航後 reload listing。

### 4.5 i18n

- `panel/i18n.ts`：`en` + `zh`，`zh-*` → `zh`。
- 所有 copy 集中在 i18n；view 透過 `deps.strings(locale)` 取文案。

### 4.6 Dialog 與 focus

- `panel/dialog.ts`：`openDialog`（dialog / drawer）、`openConfirm`。
- Escape、focus trap、focus restore 沿用原作設計。

## 5. UX 流程

1. Panel 啟動 → `HOST_READY` → `load()` → `listDir(".")`。
2. Files tab 顯示清單；點資料夾 → `NAVIGATE` + reload；點檔案 → `FILE_SELECTED`。
3. 切 Preview tab → `refreshPreview()` → `stat` + `readFile` → render。
4. Edit → `writeFile` → toast → reload → preview 重讀。

## 6. 驗證

```bash
bun run check   # bun test && tsc --noEmit && bun run build:panel
```

- 19 tests / 4 files（manifest / api / state / i18n）
- typecheck clean
- build clean

## 7. 已知限制

- Host file API 不提供 delete / create 語意（edit 走 overwrite）。
- 本機未跑 desktop GUI 手動驗證。
- `filesystem` pattern 為 `["~/.**"]`，實際授權範圍由使用者在 install 時確認。
