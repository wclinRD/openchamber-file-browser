import { connectHost } from "@openchamber/sdk";
import { applyHostReady, mountBanner, mountButton, mountSpinner, mountTabs } from "@openchamber/sdk/ui";
import { createFileApi, FileApiError } from "./api";
import { mountFileView } from "./file-view";
import { mountPreviewView } from "./preview-view";
import { errorCopy, resolveLocale, strings } from "./i18n";
import { initialState, reduce, type AppAction, type AppSurface, type AppView } from "./state";

const host = connectHost();
const api = createFileApi(host);
let state = initialState;
let mounted = false;
let loadStarted = false;

const root = document.createElement("main");
root.className = "file-app";
const header = document.createElement("header");
header.className = "file-app__header";
const title = document.createElement("h1");
title.className = "file-app__title";
const status = document.createElement("span");
status.className = "file-app__status";
const statusDot = document.createElement("span");
statusDot.className = "file-app__status-dot";
statusDot.setAttribute("aria-hidden", "true");
const statusText = document.createElement("span");
statusText.className = "file-app__status-text";
status.append(statusDot, statusText);
const toolbar = document.createElement("div");
toolbar.className = "file-app__toolbar";
header.append(title, status, toolbar);
const tabsRoot = document.createElement("nav");
tabsRoot.className = "file-app__tabs";
const content = document.createElement("section");
content.className = "file-app__content";
const feedback = document.createElement("div");
const spinnerRoot = document.createElement("div");
const bannerRoot = document.createElement("div");
feedback.append(spinnerRoot, bannerRoot);
const filesRoot = document.createElement("div");
const previewRoot = document.createElement("div");
content.append(feedback, filesRoot, previewRoot);
root.append(header, tabsRoot, content);

const tabs = mountTabs(tabsRoot, {
  items: [],
  activeId: state.activeView,
  onChange: (id) => dispatch({ type: "VIEW_CHANGED", view: id as AppView }),
  trackBackground: true,
});
const refresh = mountButton(toolbar, { label: "", variant: "outline", size: "sm", onClick: () => void load() });
const spinner = mountSpinner(spinnerRoot, { label: "" });
const banner = mountBanner(bannerRoot, { tone: "error", title: "", body: "", action: { label: "", onClick: () => void load() } });
const fileView = mountFileView(filesRoot, {
  api,
  dispatch,
  reload: load,
  strings,
  toast: (kind, message) => void host.toast({ kind, message }),
});
const previewView = mountPreviewView(previewRoot, {
  api,
  dispatch,
  reload: load,
  strings,
  toast: (kind, message) => void host.toast({ kind, message }),
});

function surfaceFromHost(surface: string): AppSurface {
  return surface === "page" ? "page" : "panel";
}

function dispatch(action: AppAction): void {
  state = reduce(state, action);
  render();
}

async function load(): Promise<void> {
  if (state.activeView === "preview" && !state.selectedPath) {
    return;
  }
  dispatch({ type: "REQUEST_STARTED" });
  const generation = state.requestGeneration;
  try {
    if (state.activeView === "preview") {
      const stat = await api.stat(state.selectedPath ?? "");
      const content = await api.readFile(state.selectedPath ?? "");
      dispatch({ type: "PREVIEW_LOADED", generation, content: content.content, stat });
      return;
    }
    const listing = await api.listDir(state.cwd);
    dispatch({ type: "FILE_LIST_RECEIVED", generation, cwd: state.cwd, entries: listing.entries });
  } catch (error) {
    const code = error instanceof FileApiError ? error.code : "HOST_REJECTED";
    dispatch({ type: "REQUEST_FAILED", generation, message: code });
  }
}

function errorCopyFor(error: string, locale: string) {
  return errorCopy(strings(locale), error);
}

function render(): void {
  const text = strings(state.locale);
  document.documentElement.lang = state.locale === "zh" ? "zh-TW" : "en";
  root.dataset.surface = state.surface;
  title.textContent = text.appTitle;
  tabsRoot.setAttribute("aria-label", text.viewsLabel);
  const statusLabel = state.error ? text.failedTitle : state.loading ? text.loading : text.ready;
  statusText.textContent = statusLabel;
  status.setAttribute("aria-label", statusLabel);
  refresh.update({ label: text.refresh, loading: state.loading });
  tabs.update({
    activeId: state.activeView,
    items: [
      { id: "files", label: text.list },
      { id: "preview", label: text.preview },
    ],
  });
  if (state.error) {
    const copy = errorCopyFor(state.error, state.locale);
    banner.update({ title: copy.title, body: copy.body, action: { label: text.retry, onClick: () => void load() } });
  }
  spinnerRoot.hidden = !state.loading || state.activeView === "preview";
  bannerRoot.hidden = !state.error;
  if (state.loading && state.activeView === "files") {
    spinner.update({ label: text.loading, size: "sm" });
  }
  feedback.hidden = !state.loading && !state.error;
  filesRoot.hidden = state.activeView !== "files";
  previewRoot.hidden = state.activeView !== "preview";
  fileView.update(state);
  previewView.update(state);
}

function mount(): void {
  if (mounted) return;
  mounted = true;
  document.body.replaceChildren(root);
}

const stopReady = host.onReady((context) => {
  applyHostReady(context, document.documentElement);
  mount();
  dispatch({ type: "HOST_READY", surface: surfaceFromHost(context.surface), locale: resolveLocale(context.locale) });
  if (!loadStarted) {
    loadStarted = true;
    void load();
  }
});

const pollTimer = setInterval(() => {
  if (document.visibilityState === "visible" && state.activeView === "files" && !state.loading) {
    void load();
  }
}, 30_000);

window.addEventListener(
  "unload",
  () => {
    clearInterval(pollTimer);
    stopReady();
    tabs.dispose();
    refresh.dispose();
    spinner.dispose();
    banner.dispose();
    fileView.dispose();
    previewView.dispose();
    host.dispose();
  },
  { once: true },
);
