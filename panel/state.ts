import type { FileEntry, FilePreview, FileStat } from "./types";

export type AppView = "files" | "preview";
export type AppSurface = "panel" | "page";

export type AppState = {
  activeView: AppView;
  surface: AppSurface;
  locale: string;
  loading: boolean;
  error: string | null;
  requestGeneration: number;
  cwd: string;
  entries: FileEntry[];
  selectedPath: string | null;
  preview: FilePreview | null;
};

export const initialState: AppState = {
  activeView: "files",
  surface: "panel",
  locale: "en",
  loading: false,
  error: null,
  requestGeneration: 0,
  cwd: ".",
  entries: [],
  selectedPath: null,
  preview: null,
};

export type AppAction =
  | { type: "HOST_READY"; surface: AppSurface; locale: string }
  | { type: "VIEW_CHANGED"; view: AppView }
  | { type: "REQUEST_STARTED" }
  | { type: "REQUEST_FAILED"; generation: number; message: string }
  | { type: "FILE_LIST_RECEIVED"; generation: number; cwd: string; entries: FileEntry[] }
  | { type: "NAVIGATE"; path: string }
  | { type: "FILE_SELECTED"; path: string | null }
  | { type: "PREVIEW_LOADED"; generation: number; content: string; stat: FileStat }
  | { type: "PREVIEW_FAILED"; generation: number; message: string };

export function reduce(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "HOST_READY":
      return { ...state, surface: action.surface, locale: action.locale };
    case "VIEW_CHANGED":
      return { ...state, activeView: action.view };
    case "REQUEST_STARTED":
      return { ...state, loading: true, error: null, requestGeneration: state.requestGeneration + 1 };
    case "REQUEST_FAILED":
      return action.generation === state.requestGeneration
        ? { ...state, loading: false, error: action.message }
        : state;
    case "FILE_LIST_RECEIVED":
      return action.generation === state.requestGeneration
        ? { ...state, loading: false, error: null, cwd: action.cwd, entries: action.entries }
        : state;
    case "NAVIGATE":
      return { ...state, cwd: action.path, selectedPath: null };
    case "FILE_SELECTED":
      return { ...state, selectedPath: action.path };
    case "PREVIEW_LOADED":
      return action.generation === state.requestGeneration
        ? { ...state, loading: false, error: null, preview: { content: action.content, stat: action.stat } }
        : state;
    case "PREVIEW_FAILED":
      return action.generation === state.requestGeneration
        ? { ...state, loading: false, error: action.message }
        : state;
    default:
      return state;
  }
}
