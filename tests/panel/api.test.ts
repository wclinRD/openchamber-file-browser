import { expect, test } from "bun:test";
import { HostRequestError } from "@openchamber/sdk";
import { createFileApi, FileApi, FileApiError, type FileHost } from "../../panel/api";

function createHost(overrides: Partial<FileHost> = {}): { calls: Array<{ method: string; path?: string; content?: string }>; host: FileHost } {
  const calls: Array<{ method: string; path?: string; content?: string }> = [];
  const host: FileHost = {
    listDir: async (path: string) => {
      calls.push({ method: "listDir", path });
      return { entries: [{ name: "src", kind: "directory" }] };
    },
    readFile: async (path: string) => {
      calls.push({ method: "readFile", path });
      return { content: "hello" };
    },
    stat: async (path: string) => {
      calls.push({ method: "stat", path });
      return { kind: "file", size: 5, mtime: 1_800_000_000_000 };
    },
    writeFile: async (path: string, content: string) => {
      calls.push({ method: "writeFile", path, content });
      return { written: true };
    },
    ...overrides,
  };
  return { calls, host };
}

test("creates a file api from a host", () => {
  const { host } = createHost();
  expect(typeof createFileApi(host).listDir).toBe("function");
});

test("lists directory entries through the host file api", async () => {
  const { calls, host } = createHost();
  const api = createFileApi(host);

  await expect(api.listDir("src")).resolves.toEqual({ entries: [{ name: "src", kind: "directory" }] });
  expect(calls).toEqual([{ method: "listDir", path: "src" }]);
});

test("reads file content through the host file api", async () => {
  const { calls, host } = createHost();
  const api = createFileApi(host);

  await expect(api.readFile("src/index.ts")).resolves.toEqual({ content: "hello" });
  expect(calls).toEqual([{ method: "readFile", path: "src/index.ts" }]);
});

test("stats a path through the host file api", async () => {
  const { calls, host } = createHost();
  const api = createFileApi(host);

  await expect(api.stat("src/index.ts")).resolves.toEqual({ kind: "file", size: 5, mtime: 1_800_000_000_000 });
  expect(calls).toEqual([{ method: "stat", path: "src/index.ts" }]);
});

test("writes file content through the host file api", async () => {
  const { calls, host } = createHost();
  const api = createFileApi(host);

  await expect(api.writeFile("src/index.ts", "hello")).resolves.toEqual({ written: true });
  expect(calls).toEqual([{ method: "writeFile", path: "src/index.ts", content: "hello" }]);
});

test("maps host request failures to file api errors", async () => {
  const api = createFileApi({
    listDir: async () => {
      throw new HostRequestError("NOT_FOUND", "The path does not exist");
    },
  } as unknown as FileHost);

  await expect(api.listDir("src/missing")).rejects.toEqual(new FileApiError("NOT_FOUND", "The path does not exist"));
});
