// lib/storage-compat.ts
// Client-side Storage compatibility layer backed by Base44 private uploads.
// Replaces firebase/storage imports with Base44 SDK upload operations.

import { base44 } from "@/lib/base44";

// ── Storage instance marker ──
export function getStorage(): any {
  return { _compat: true };
}

// ── Storage ref ──
export interface StorageRef {
  _path: string;
  _fileUri?: string;
}

export function ref(_storage: any, path: string): StorageRef {
  return { _path: path };
}

// ── Upload operations ──
export async function uploadBytes(storageRef: StorageRef, file: File | Blob | ArrayBuffer): Promise<{ ref: StorageRef }> {
  const blob = file instanceof Blob ? file : new Blob([file as ArrayBuffer]);
  const result = await base44.integrations.Core.UploadPrivateFile({ file: blob as File });
  storageRef._fileUri = result.file_uri;
  return { ref: storageRef };
}

export async function uploadBytesResumable(
  storageRef: StorageRef,
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ ref: StorageRef }> {
  if (onProgress) onProgress(50);
  const result = await base44.integrations.Core.UploadPrivateFile({ file });
  storageRef._fileUri = result.file_uri;
  if (onProgress) onProgress(100);
  return { ref: storageRef };
}

export async function getDownloadURL(storageRef: StorageRef): Promise<string> {
  if (!storageRef._fileUri) return "";
  const result = await base44.integrations.Core.CreateFileSignedUrl({
    file_uri: storageRef._fileUri,
    expires_in: 3600,
  });
  return result.signed_url;
}

export async function deleteObject(storageRef: StorageRef): Promise<void> {
  // Base44 private files are managed by the platform; no-op for compat
}

export async function uploadString(
  storageRef: StorageRef,
  data: string,
  format?: string
): Promise<{ ref: StorageRef }> {
  const blob = new Blob([data], { type: format || "text/plain" });
  const result = await base44.integrations.Core.UploadPrivateFile({ file: blob as File });
  storageRef._fileUri = result.file_uri;
  return { ref: storageRef };
}

// ── storage marker ──
export const storage = getStorage();
