import { extensionsToMimes, mimes } from "./mimes";

export function readableBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]
  );
}

export const gigaToBytes = (gigaByte: number = 2) => {
  return gigaByte * 1024 * 1024 * 1024;
};

export const getMimes = (name: string) => {
  const extension = name?.split(".").pop();
  for (const [ext, types] of Object.entries(extensionsToMimes)) {
    if (ext === extension) return types;
  }
  return [];
};

// Fallback function
export function getExtension(mimeType: string): string {
  return mimes[mimeType] || "bin";
}

export function next24() {
  return new Date(new Date().getTime() + 60 * 60 * 24 * 1000);
}
