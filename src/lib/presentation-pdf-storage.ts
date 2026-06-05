import { access, mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export function presentationPdfRelativePath(presentationId: string) {
  return path.join("presentations", `${presentationId}.pdf`);
}

export function presentationPdfAbsolutePath(relativePath: string) {
  return path.join(UPLOAD_ROOT, relativePath);
}

export async function savePresentationPdf(presentationId: string, data: Buffer) {
  const relative = presentationPdfRelativePath(presentationId);
  const absolute = presentationPdfAbsolutePath(relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, data);
  return relative;
}

export async function deletePresentationPdf(relativePath: string | null) {
  if (!relativePath) return;
  try {
    await unlink(presentationPdfAbsolutePath(relativePath));
  } catch {
    /* file may already be missing */
  }
}

export async function presentationPdfFileExists(relativePath: string | null) {
  if (!relativePath) return false;
  try {
    await access(presentationPdfAbsolutePath(relativePath));
    return true;
  } catch {
    return false;
  }
}
