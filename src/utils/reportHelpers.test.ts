import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPhotoReportRecord,
  countPendingReports,
  getReportReasonLabel,
  REPORT_REASONS,
  validateReportDraft,
} from './reportHelpers';

test('validateReportDraft requires details when reason is other and defaults reporter name', () => {
  const missingOther = validateReportDraft('other', '   ', '');
  assert.equal(missingOther.valid, false);

  const okOther = validateReportDraft('other', 'Ảnh này bị cắt lỗi nền', '');
  assert.equal(okOther.valid, true);
  if (okOther.valid) {
    assert.equal(okOther.reporterName, 'Thành viên 10B4');
    assert.equal(okOther.details, 'Ảnh này bị cắt lỗi nền');
  }

  const okStandard = validateReportDraft('privacy', '', '  Minh Anh  ');
  assert.equal(okStandard.valid, true);
  if (okStandard.valid) {
    assert.equal(okStandard.reporterName, 'Minh Anh');
  }
});

test('buildPhotoReportRecord and countPendingReports track report lifecycle cleanly', () => {
  assert.equal(REPORT_REASONS.length, 5);
  const r1 = buildPhotoReportRecord({
    id: 'rep-1',
    photoId: 'p1',
    photoTitle: 'Tiết Văn buổi chiều',
    reason: 'inappropriate',
    details: 'Góc chụp nhạy cảm',
    reporterName: 'Lan Anh',
    createdAt: '2026-10-12T08:00:00Z',
  });
  const r2 = {
    ...buildPhotoReportRecord({
      id: 'rep-2',
      photoId: 'p2',
      photoTitle: 'Giờ ra chơi',
      reason: 'spam',
      details: '',
      reporterName: 'Thành viên 10B4',
    }),
    status: 'resolved' as const,
  };

  assert.equal(r1.reason_label, getReportReasonLabel('inappropriate'));
  assert.equal(r1.status, 'pending');
  assert.equal(countPendingReports([r1, r2]), 1);
});
