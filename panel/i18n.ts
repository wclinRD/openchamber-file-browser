export type SupportedLocale = "en" | "zh";

const messages = {
  en: {
    appTitle: "File Browser",
    list: "Files",
    preview: "Preview",
    viewsLabel: "File views",
    refresh: "Refresh",
    loading: "Loading files",
    ready: "ready",
    close: "Close",
    retry: "Retry",
    failedTitle: "File request failed",
    failedBody: "The local file service returned an unexpected response. Retry once after checking OpenCode.",
    notGrantedTitle: "Filesystem access is not granted",
    notGrantedBody: "Approve the File Browser filesystem permission in Settings > Extensions, then retry.",
    noDirectoryTitle: "No project is open",
    noDirectoryBody: "Open a project in OpenChamber to browse its files.",
    notFoundTitle: "File not found",
    notFoundBody: "The path no longer exists. Pick another file.",
    tooLargeTitle: "File is too large",
    tooLargeBody: "The file content exceeds the host limit. Split or trim the file.",
    deniedTitle: "Access denied",
    deniedBody: "The operating system refused the file access.",
    actionFailed: "Action failed",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    saved: "File saved",
    content: "Content",
    path: "Path",
    size: "Size",
    modified: "Modified",
    kind: "Kind",
    typeFile: "File",
    typeDirectory: "Folder",
    up: "Up one level",
    filesEmptyTitle: "This folder is empty",
    filesEmptyBody: "Open a folder or pick a file to preview its content.",
    previewEmptyTitle: "No file selected",
    previewEmptyBody: "Pick a file from the list to preview its content.",
  },
  zh: {
    appTitle: "檔案瀏覽器",
    list: "檔案",
    preview: "預覽",
    viewsLabel: "檔案檢視",
    refresh: "重新整理",
    loading: "正在載入檔案",
    ready: "就緒",
    close: "關閉",
    retry: "重試",
    failedTitle: "檔案要求失敗",
    failedBody: "本機檔案服務傳回了異常回應。檢查 OpenCode 後重試一次。",
    notGrantedTitle: "未授權檔案系統存取",
    notGrantedBody: "請在「設定 > 擴充功能」中核准檔案瀏覽器權限，然後重試。",
    noDirectoryTitle: "未開啟專案",
    noDirectoryBody: "在 OpenChamber 中開啟專案以瀏覽其檔案。",
    notFoundTitle: "找不到檔案",
    notFoundBody: "路徑已不存在，請選取其他檔案。",
    tooLargeTitle: "檔案太大",
    tooLargeBody: "檔案內容超過主機上限，請拆分或修剪檔案。",
    deniedTitle: "存取被拒絕",
    deniedBody: "作業系統拒絕了檔案存取。",
    actionFailed: "操作失敗",
    edit: "編輯",
    save: "儲存",
    cancel: "取消",
    saved: "檔案已儲存",
    content: "內容",
    path: "路徑",
    size: "大小",
    modified: "修改時間",
    kind: "類型",
    typeFile: "檔案",
    typeDirectory: "資料夾",
    up: "上一層",
    filesEmptyTitle: "此資料夾是空的",
    filesEmptyBody: "開啟資料夾或選取檔案以預覽其內容。",
    previewEmptyTitle: "未選取檔案",
    previewEmptyBody: "從清單選取檔案以預覽其內容。",
  },
} as const;

export type Messages = (typeof messages)[SupportedLocale];
export type TranslationKey = keyof (typeof messages)["en"];

export function resolveLocale(locale: string): SupportedLocale {
  return locale.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function strings(locale: string): (typeof messages)[SupportedLocale] {
  return messages[resolveLocale(locale)];
}

export function errorCopy(t: Messages, error: string): { title: string; body: string } {
  switch (error) {
    case "NO_DIRECTORY":
      return { title: t.noDirectoryTitle, body: t.noDirectoryBody };
    case "NOT_FOUND":
      return { title: t.notFoundTitle, body: t.notFoundBody };
    case "FILE_TOO_LARGE":
      return { title: t.tooLargeTitle, body: t.tooLargeBody };
    case "DENIED":
      return { title: t.deniedTitle, body: t.deniedBody };
    case "NOT_GRANTED":
      return { title: t.notGrantedTitle, body: t.notGrantedBody };
    default:
      return { title: t.failedTitle, body: t.failedBody };
  }
}
