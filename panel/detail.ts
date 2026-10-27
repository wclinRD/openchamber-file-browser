import type { Messages } from "./i18n";
import type { FileStat } from "./types";

export function formatDate(value: number, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toLocaleString(locale === "zh" ? "zh-TW" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildPreviewContent(
  path: string,
  content: string,
  stat: FileStat,
  t: Messages,
  locale: string,
): HTMLElement {
  const contentRoot = document.createElement("div");
  contentRoot.className = "file-detail";

  const pre = document.createElement("pre");
  pre.className = "file-detail__content";
  pre.textContent = content;

  const meta = document.createElement("dl");
  meta.className = "file-detail__meta";
  const addMeta = (label: string, value: string) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    meta.append(dt, dd);
  };
  addMeta(t.path, path);
  addMeta(t.kind, t.typeFile);
  addMeta(t.size, formatBytes(stat.size));
  addMeta(t.modified, formatDate(stat.mtime, locale));

  contentRoot.append(pre, meta);
  return contentRoot;
}
