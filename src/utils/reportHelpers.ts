import { PhotoReport, ReportReasonKey } from '../types/memory';

export interface ReportReasonOption {
  key: ReportReasonKey;
  label: string;
  description: string;
}

export const REPORT_REASONS: readonly ReportReasonOption[] = [
  {
    key: 'inappropriate',
    label: 'Nội dung không phù hợp / nhạy cảm',
    description: 'Hình ảnh phản cảm, thiếu tôn trọng hoặc không phù hợp với tập thể lớp.',
  },
  {
    key: 'privacy',
    label: 'Ảnh riêng tư, chưa được sự đồng ý',
    description: 'Chụp trộm, lộ thông tin cá nhân hoặc người trong ảnh muốn gỡ xuống.',
  },
  {
    key: 'misleading',
    label: 'Thông tin hoặc chú thích sai lệch',
    description: 'Tiêu đề, ngày chụp hoặc nội dung mô tả không đúng sự thật.',
  },
  {
    key: 'spam',
    label: 'Ảnh trùng lặp / gửi nhầm',
    description: 'Ảnh bị tải trùng nhiều lần, mờ nhòe hoặc không liên quan đến 10B4.',
  },
  {
    key: 'other',
    label: 'Lý do khác',
    description: 'Mô tả cụ thể vấn đề để quản trị viên kiểm tra và xử lý nhanh.',
  },
] as const;

export function getReportReasonLabel(key: ReportReasonKey): string {
  return REPORT_REASONS.find((item) => item.key === key)?.label || 'Nội dung không phù hợp';
}

export function validateReportDraft(
  reason: ReportReasonKey,
  details: string,
  reporterName: string
):
  | { valid: true; reason: ReportReasonKey; details: string; reporterName: string }
  | { valid: false; error: string } {
  const cleanDetails = details.trim().slice(0, 500);
  const cleanReporter = reporterName.trim().slice(0, 40) || 'Thành viên 10B4';

  if (reason === 'other' && cleanDetails.length < 5) {
    return {
      valid: false,
      error: 'Vui lòng mô tả ngắn gọn lý do báo cáo (ít nhất 5 ký tự).',
    };
  }

  return {
    valid: true,
    reason,
    details: cleanDetails,
    reporterName: cleanReporter,
  };
}

export function buildPhotoReportRecord(params: {
  id: string;
  photoId: string;
  photoTitle: string;
  reason: ReportReasonKey;
  details: string;
  reporterName: string;
  createdAt?: string;
}): PhotoReport {
  return {
    id: params.id,
    photo_id: params.photoId,
    photo_title: params.photoTitle.trim() || 'Khoảnh khắc 10B4',
    reason: params.reason,
    reason_label: getReportReasonLabel(params.reason),
    details: params.details.trim(),
    reporter_name: params.reporterName.trim() || 'Thành viên 10B4',
    status: 'pending',
    created_at: params.createdAt || new Date().toISOString(),
  };
}

export function countPendingReports(reports: PhotoReport[]): number {
  return reports.filter((report) => report.status === 'pending').length;
}
