import { mountButton, mountEmpty, mountSpinner } from "@openchamber/sdk/ui";
import { type FileApi, FileApiError } from "./api";
import { buildPreviewContent } from "./detail";
import { type Messages } from "./i18n";
import { openDialog, type DialogHandle } from "./dialog";
import type { AppAction, AppState } from "./state";
import type { FileStat } from "./types";

export type PreviewViewDeps = {
  api: FileApi;
  dispatch: (action: AppAction) => void;
  reload: () => Promise<void>;
  strings: (locale: string) => Messages;
  toast: (kind: "success" | "error", message: string) => void;
};

export type PreviewViewHandle = {
  update(state: AppState): void;
  dispose(): void;
};

type Status = "idle" | "loading" | "ready";

export function mountPreviewView(root: Element, deps: PreviewViewDeps): PreviewViewHandle {
  let latest: AppState | undefined;
  let busy = false;
  let status: Status = "idle";
  let content = "";
  let stat: FileStat | null = null;

  const actions = document.createElement("div");
  actions.className = "file-preview__actions";
  const editButton = mountButton(actions, { label: "", variant: "default", size: "sm", onClick: () => void openForm() });

  const feedback = document.createElement("div");
  feedback.className = "file-preview__feedback";
  const spinnerRoot = document.createElement("div");
  const emptyRoot = document.createElement("div");
  feedback.append(spinnerRoot, emptyRoot);
  const spinner = mountSpinner(spinnerRoot, { label: "" });
  const empty = mountEmpty(emptyRoot, { title: "", body: "" });
  const contentRoot = document.createElement("div");
  contentRoot.className = "file-preview__content";

  root.append(actions, feedback, contentRoot);

  function refreshPreview(): Promise<void> {
    if (busy) return Promise.resolve();
    const path = latest?.selectedPath ?? null;
    if (!path) {
      status = "idle";
      return Promise.resolve();
    }
    busy = true;
    deps.dispatch({ type: "REQUEST_STARTED" });
    const generation = latest?.requestGeneration ?? 0;
    return (async () => {
      try {
        const statResult = await deps.api.stat(path);
        const contentResult = await deps.api.readFile(path);
        status = "ready";
        content = contentResult.content;
        stat = statResult;
        deps.dispatch({ type: "PREVIEW_LOADED", generation, content: contentResult.content, stat: statResult });
      } catch (error) {
        status = "idle";
        deps.dispatch({ type: "PREVIEW_FAILED", generation, message: error instanceof FileApiError ? error.code : "HOST_REJECTED" });
      }
      busy = false;
    })();
  }

  async function openForm(): Promise<void> {
    const path = latest?.selectedPath;
    if (!path || !latest?.preview) return;
    const t = deps.strings(latest.locale);
    const contentArea = document.createElement("textarea");
    contentArea.className = "file-form__textarea";
    contentArea.rows = 10;
    contentArea.value = latest.preview.content;
    const actionsRow = document.createElement("div");
    actionsRow.className = "file-form__actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "file-form__button";
    cancel.textContent = t.cancel;
    const save = document.createElement("button");
    save.type = "button";
    save.className = "file-form__button file-form__button--primary";
    save.textContent = t.save;
    actionsRow.append(cancel, save);
    const form = document.createElement("form");
    form.className = "file-form";
    const error = document.createElement("p");
    error.className = "file-form__error";
    error.hidden = true;
    error.setAttribute("role", "alert");
    form.append(contentArea, error, actionsRow);
    const dialog = openDialog({ title: t.edit, content: form, closeLabel: t.close });
    cancel.addEventListener("click", dialog.close);
    save.addEventListener("click", () => {
      const next = contentArea.value;
      void (async () => {
        try {
          await deps.api.writeFile(path, next);
          deps.toast("success", t.saved);
          dialog.close();
          await deps.reload();
        } catch {
          deps.toast("error", t.actionFailed);
        }
      })();
    });
  }

  function paint(): void {
    const t = deps.strings(latest?.locale ?? "en");
    editButton.update({ label: t.edit, loading: busy });
    spinner.update({ label: t.loading, size: "sm" });
    const hasSelection = Boolean(latest?.selectedPath);
    const showSpinner = status === "loading";
    const showEmpty = status === "idle" || status === "ready";
    spinnerRoot.hidden = !showSpinner;
    emptyRoot.hidden = !(showEmpty && !hasSelection);
    feedback.hidden = !(showSpinner || (showEmpty && !hasSelection));
    contentRoot.hidden = !hasSelection || status !== "ready";
    if (status === "ready" && latest?.selectedPath) {
      contentRoot.replaceChildren();
      contentRoot.append(buildPreviewContent(latest.selectedPath, content, stat as FileStat, t, latest.locale));
    }
  }

  function update(state: AppState): void {
    latest = state;
    if (state.activeView !== "preview") return;
    paint();
    if (status === "idle" && state.selectedPath) void refreshPreview();
  }

  function dispose(): void {
    spinner.dispose();
    empty.dispose();
    editButton.dispose();
    root.replaceChildren();
  }

  return { update, dispose };
}
