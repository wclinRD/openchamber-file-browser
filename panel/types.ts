import type { GuestFileStatKind } from "@openchamber/sdk";

export type FileEntryKind = "file" | "directory" | "other";

export type FileEntry = {
  name: string;
  kind: FileEntryKind;
};

export type FileStat = {
  kind: GuestFileStatKind;
  size: number;
  mtime: number;
};

export type DirectoryListing = {
  entries: FileEntry[];
};

export type FileContent = {
  content: string;
};

export type FileWriteResult = {
  written: true;
};

export type FilePreview = {
  content: string;
  stat: FileStat;
};

/** Current directory as a host-relative path; "." is the open project root. */
export type FilePath = string;
