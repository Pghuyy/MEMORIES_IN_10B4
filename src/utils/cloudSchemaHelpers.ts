export interface UploadToastParams {
  addedCount: number;
  skippedDup: number;
  isSharedCloud: boolean;
}

/**
 * Detects PostgREST / Postgres errors caused by an optional table, column, or RPC
 * not yet existing in the connected Supabase project schema cache.
 * Real auth, permission (RLS), validation, or network failures return false.
 */
export function isMissingCloudSchemaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const rec = error as {
    code?: unknown;
    status?: unknown;
    statusCode?: unknown;
    message?: unknown;
    details?: unknown;
    hint?: unknown;
  };

  const code = String(rec.code || '').trim().toUpperCase();
  const status = Number(rec.status ?? rec.statusCode ?? 0);
  const message = `${String(rec.message || '')} ${String(rec.details || '')} ${String(
    rec.hint || ''
  )}`.toLowerCase();

  if (
    code === 'PGRST205' ||
    code === 'PGRST202' ||
    code === '42P01' ||
    code === '42883' ||
    code === '42703'
  ) {
    return true;
  }

  if (
    status === 404 &&
    (message.includes('schema cache') ||
      message.includes('could not find the table') ||
      message.includes('could not find the function') ||
      message.includes('does not exist') ||
      message.trim() === '')
  ) {
    return true;
  }

  return (
    message.includes('could not find the table') ||
    message.includes('could not find the function') ||
    (message.includes('relation') && message.includes('does not exist'))
  );
}

/**
 * Builds consistent Vietnamese feedback confirming automatic saving right after upload.
 */
export function buildUploadSuccessToast({
  addedCount,
  skippedDup,
  isSharedCloud,
}: UploadToastParams): string {
  if (isSharedCloud) {
    return skippedDup > 0
      ? `Đã tự động lưu & đăng ${addedCount} ảnh lên kho chung (bỏ qua ${skippedDup} ảnh trùng) — cả lớp mở web là xem được ngay!`
      : `Đã tự động lưu & đăng ${addedCount} ảnh — cả lớp 10B4 mở web là xem được ngay!`;
  }

  return skippedDup > 0
    ? `Đã tự động lưu ${addedCount} ảnh mới (bỏ qua ${skippedDup} ảnh trùng).`
    : `Đã tự động lưu ${addedCount} khung hình thật vào hành trình 10B4.`;
}
