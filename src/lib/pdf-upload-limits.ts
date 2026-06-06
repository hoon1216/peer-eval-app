/** 발표 PDF 최대 크기 (50MB) */
export const MAX_PDF_BYTES = 50 * 1024 * 1024;

/** Vercel 서버리스 함수 본문 제한(약 4.5MB) — 이보다 크면 Blob 직접 업로드 필요 */
export const VERCEL_FUNCTION_BODY_LIMIT_BYTES = 4 * 1024 * 1024;

export function useBlobPdfStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function formatPdfSizeLimitMb() {
  return Math.round(MAX_PDF_BYTES / (1024 * 1024));
}
