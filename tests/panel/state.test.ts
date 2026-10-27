import { expect, test } from "bun:test";
import { initialState, reduce, type AppState } from "../../panel/state";
import type { FileEntry } from "../../panel/types";

function entry(name: string, kind: FileEntry["kind"] = "file"): FileEntry {
  return { name, kind };
}

function stateWith(overrides: Partial<AppState> = {}): AppState {
  return { ...initialState, ...overrides };
}

test("switches between the files and preview views", () => {
  expect(reduce(initialState, { type: "VIEW_CHANGED", view: "preview" })).toMatchObject({ activeView: "preview" });
  expect(reduce(initialState, { type: "VIEW_CHANGED", view: "files" })).toMatchObject({ activeView: "files" });
});

test("marks the session surface from the host ready context", () => {
  expect(reduce(initialState, { type: "HOST_READY", surface: "page", locale: "zh-TW" })).toMatchObject({
    surface: "page",
    locale: "zh-TW",
  });
});

test("clears errors and loading flags once a file listing arrives", () => {
  const loading = reduce(initialState, { type: "REQUEST_STARTED" });
  expect(loading).toMatchObject({ loading: true });

  expect(
    reduce(loading, { type: "FILE_LIST_RECEIVED", generation: loading.requestGeneration, cwd: "src", entries: [entry("index.ts")] }),
  ).toMatchObject({ loading: false, error: null, cwd: "src", entries: [entry("index.ts")] });
});

test("ignores stale file list responses", () => {
  const first = reduce(initialState, { type: "REQUEST_STARTED" });
  const second = reduce(first, { type: "REQUEST_STARTED" });

  expect(reduce(second, { type: "FILE_LIST_RECEIVED", generation: first.requestGeneration, cwd: "src", entries: [] })).toEqual(second);
});

test("navigates into a directory and clears the selected file", () => {
  const selected = reduce(initialState, { type: "FILE_SELECTED", path: "src/index.ts" });
  expect(selected).toMatchObject({ selectedPath: "src/index.ts" });

  expect(reduce(selected, { type: "NAVIGATE", path: "src" })).toMatchObject({ cwd: "src", selectedPath: null });
});

test("keeps the selected file until a navigation replaces it", () => {
  let state = initialState;
  state = reduce(state, { type: "FILE_SELECTED", path: "README.md" });
  expect(state.selectedPath).toBe("README.md");

  state = reduce(state, { type: "NAVIGATE", path: "src" });
  expect(state).toMatchObject({ selectedPath: null, cwd: "src" });
});

test("stores the preview content and stat for the selected file", () => {
  const state = reduce(initialState, {
    type: "PREVIEW_LOADED",
    generation: initialState.requestGeneration,
    content: "console.log(1);",
    stat: { kind: "file", size: 14, mtime: 1_800_000_000_000 },
  });
  expect(state.preview).toEqual({ content: "console.log(1);", stat: { kind: "file", size: 14, mtime: 1_800_000_000_000 } });
});

test("does not apply a stale preview result", () => {
  const first = reduce(initialState, { type: "REQUEST_STARTED" });
  const second = reduce(first, { type: "REQUEST_STARTED" });

  expect(reduce(second, { type: "PREVIEW_LOADED", generation: first.requestGeneration, content: "stale", stat: { kind: "file", size: 1, mtime: 1 } })).toEqual(second);
});
