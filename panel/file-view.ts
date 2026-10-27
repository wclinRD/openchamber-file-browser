import { mountButton, mountEmpty } from "@openchamber/sdk/ui";
import type { FileApi } from "./api";
import { type Messages } from "./i18n";
import type { AppAction, AppState } from "./state";
import type { FileEntry } from "./types";

export type FileViewDeps = {
  api: FileApi;
  dispatch: (action: AppAction) => void;
  reload: () => Promise<void>;
  strings: (locale: string) => Messages;
  toast: (kind: "success" | "error", message: string) => void;
};

export type FileViewHandle = {
  update(state: AppState): void;
  dispose(): void;
};

/** The host joins a relative path to the open project; "." is the project root. */
export function joinPath(parent: string, name: string): string {
  return parent === "." ? name : `${parent}/${name}`;
}

/** Parent of a host-relative path; null at the project root. */
export function parentPath(path: string): string | null {
  if (path === "." || path === "") return null;
  const index = path.lastIndexOf("/");
  return index === -1 ? "." : path.slice(0, index);
}

/** Breadcrumb segments of a host-relative path; empty for the project root. */
export function segmentsOf(path: string): string[] {
  if (path === "." || path === "") return [];
  return path.split("/");
}

export function mountFileView(root: Element, deps: FileViewDeps): FileViewHandle {
  let latest: AppState | undefined;
  let rowSignature = "";

  const toolbar = document.createElement("div");
  toolbar.className = "file-toolbar";
  const refresh = mountButton(toolbar, { label: "", variant: "outline", size: "sm", onClick: () => void deps.reload() });

  const crumbs = document.createElement("nav");
  crumbs.className = "file-crumbs";
  crumbs.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const crumb = target.closest<HTMLElement>("[data-path]");
    const path = crumb?.dataset.path;
    if (!crumb || !path) return;
    const state = latest;
    if (!state) return;
    if (path === "") {
      const parent = parentPath(state.cwd);
      if (parent === null) return;
      deps.dispatch({ type: "NAVIGATE", path: parent });
      void deps.reload();
      return;
    }
    const segments = segmentsOf(state.cwd);
    const index = segments.indexOf(path);
    if (index === -1) return;
    const parent = index === 0 ? "." : segments.slice(0, index).join("/");
    deps.dispatch({ type: "NAVIGATE", path: parent });
    void deps.reload();
  });

  const entries = document.createElement("div");
  entries.className = "file-entries";

  const emptyRoot = document.createElement("div");
  const empty = mountEmpty(emptyRoot, { title: "", body: "" });

  root.append(toolbar, crumbs, entries, emptyRoot);

  function renderCrumbs(state: AppState, t: Messages): void {
    crumbs.replaceChildren();
    for (const segment of segmentsOf(state.cwd)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "file-crumb";
      button.dataset.path = segment;
      button.textContent = segment;
      crumbs.append(button);
    }
    if (state.cwd !== ".") {
      const up = document.createElement("button");
      up.type = "button";
      up.className = "file-crumb";
      up.dataset.path = "";
      up.textContent = t.up;
      crumbs.append(up);
    }
  }

  function renderEntries(state: AppState, t: Messages): void {
    entries.replaceChildren();
    for (const entry of state.entries) {
      const row = document.createElement("div");
      row.className = "file-row";
      row.dataset.path = joinPath(state.cwd, entry.name);
      row.dataset.kind = entry.kind;
      const name = document.createElement("span");
      name.className = "file-row__name";
      name.textContent = entry.name;
      const badge = document.createElement("span");
      badge.className = `file-badge file-badge--${entry.kind}`;
      badge.textContent = entry.kind === "directory" ? t.typeDirectory : entry.kind === "file" ? t.typeFile : t.kind;
      row.append(name, badge);
      row.addEventListener("click", () => {
        const current = latest;
        if (!current) return;
        const entryCwd = current.cwd;
        const path = joinPath(entryCwd, entry.name);
        if (entry.kind === "directory") {
          deps.dispatch({ type: "NAVIGATE", path });
          void deps.reload();
          return;
        }
        deps.dispatch({ type: "FILE_SELECTED", path });
      });
      entries.append(row);
    }
  }

  function update(state: AppState): void {
    latest = state;
    const t = deps.strings(state.locale);
    refresh.update({ label: t.refresh, loading: state.loading });
    renderCrumbs(state, t);
    const signature = `${state.locale};${state.cwd};${JSON.stringify(state.entries)}`;
    if (signature !== rowSignature) {
      rowSignature = signature;
      renderEntries(state, t);
    }
    empty.update({ title: t.filesEmptyTitle, body: t.filesEmptyBody });
    emptyRoot.hidden = state.entries.length > 0 || state.loading || Boolean(state.error);
  }

  function dispose(): void {
    refresh.dispose();
    empty.dispose();
    root.replaceChildren();
  }

  return { update, dispose };
}
