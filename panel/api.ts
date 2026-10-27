import {
  HostRequestError,
  type FileListEntry,
  type FileListResult,
  type FileReadResult,
  type FileStatResult,
  type FileWriteResult,
  type GuestFileStatKind,
  type HostRequestErrorCode,
} from "@openchamber/sdk";

export type { FileListEntry, FileListResult, FileReadResult, FileStatResult, FileWriteResult };

export type FileApiErrorCode = HostRequestErrorCode;

export class FileApiError extends Error {
  constructor(readonly code: FileApiErrorCode, message: string) {
    super(message);
    this.name = "FileApiError";
  }
}

export type FileApi = {
  listDir(path: string): Promise<{ entries: FileListEntry[] }>;
  readFile(path: string): Promise<{ content: string }>;
  stat(path: string): Promise<{ kind: GuestFileStatKind; size: number; mtime: number }>;
  writeFile(path: string, content: string): Promise<{ written: true }>;
};

export type FileHost = {
  listDir(path: string): Promise<FileListResult>;
  readFile(path: string): Promise<FileReadResult>;
  stat(path: string): Promise<FileStatResult>;
  writeFile(path: string, content: string): Promise<FileWriteResult>;
};

function toFileApiError(error: unknown): FileApiError {
  if (error instanceof HostRequestError) {
    return new FileApiError(error.code, error.message);
  }
  return new FileApiError("HOST_REJECTED", "The host file request failed");
}

export function createFileApi(host: FileHost): FileApi {
  return {
    listDir: async (path) => {
      try {
        return await host.listDir(path);
      } catch (error) {
        throw toFileApiError(error);
      }
    },
    readFile: async (path) => {
      try {
        const result = await host.readFile(path);
        return { content: result.content };
      } catch (error) {
        throw toFileApiError(error);
      }
    },
    stat: async (path) => {
      try {
        const result = await host.stat(path);
        return { kind: result.kind, size: result.size, mtime: result.mtime };
      } catch (error) {
        throw toFileApiError(error);
      }
    },
    writeFile: async (path, content) => {
      try {
        return await host.writeFile(path, content);
      } catch (error) {
        throw toFileApiError(error);
      }
    },
  };
}
