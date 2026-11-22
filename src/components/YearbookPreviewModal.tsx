import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, ArrowUp, Printer, X } from 'lucide-react';
import { MemoryPhoto } from '../types/memory';
import { formatViDate } from '../utils/storage';
import { triggerHaptic } from '../utils/haptics';

interface YearbookPreviewModalProps {
  isOpen: boolean;
  finalPhotos: MemoryPhoto[];
  canManage?: boolean;
  onReorder: (photoId: string, direction: 'up' | 'down') => void;
  onClose: () => void;
}

export const YearbookPreviewModal: React.FC<YearbookPreviewModalProps> = ({
  isOpen,
  finalPhotos,
  canManage = true,
  onReorder,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Xem trước Kỷ yếu 10B4"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#e6e1d7] text-[#17243a]"
    >
      {/* Sticky Toolbar (Hidden during Print/PDF) */}
      <div className="no-print sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 bg-[#111e35]/95 px-4 py-3 text-white backdrop-blur-md sm:px-5 sm:py-3.5">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium tracking-[0.16em] text-[#f2cf88] uppercase">
            Kỷ yếu 10B4
          </span>
          <span className="text-xs text-white/70">
            · {finalPhotos.length} khung hình FINAL
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {finalPhotos.length > 0 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                window.print();
              }}
              className="glass-press inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full bg-[#f2cf88] px-4 py-2 text-xs font-semibold text-[#142038] hover:bg-[#f7dc9f]"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In / Lưu thành PDF</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            aria-label="Đóng xem kỷ yếu"
            className="glass-press flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Book Spreads */}
      <div className="mx-auto max-w-[860px] space-y-6 p-3.5 sm:p-8">
        {finalPhotos.length === 0 ? (
          <div className="rounded-3xl bg-[#faf6ee] px-8 py-16 text-center shadow-xl">
            <h2 className="font-display text-2xl text-[#17243a]">
              Chưa có khung hình FINAL nào
            </h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#5c677d]">
              {canManage
                ? 'Hãy mở Bảng quản trị → mục Kỷ yếu 10B4 để chọn những bức ảnh FINAL đưa vào cuốn kỷ yếu in ấn.'
                : 'Quản trị viên 10B4 đang chọn lọc những bức ảnh FINAL để hoàn thiện cuốn kỷ yếu.'}
            </p>
          </div>
        ) : (
          <>
            {/* Cover Page */}
            <article className="yearbook-print-page flex min-h-[78vh] flex-col items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_80%_15%,#5f503c,transparent_40%),linear-gradient(145deg,#132442,#23385b)] px-8 py-16 text-center text-white shadow-2xl">
              <p className="text-xs tracking-[0.26em] text-[#e8cf9f] uppercase">
                MEMORYVERSE · LỚP 10B4 · 2026–2029
              </p>
              <h1 className="font-display mt-6 text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.04] font-normal">
                Những kỉ niệm đáng nhớ
                <em className="mt-2 block italic text-[#f2cf88]">của 10B4</em>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-[#d9e0ec]">
                Một cuốn kỷ yếu nhỏ, gom những khoảnh khắc chúng mình muốn giữ lại lâu hơn một chút.
              </p>
              <span className="mt-10 text-2xl text-[#f2cf88]">✦</span>
            </article>

            {/* Photo Pages */}
            {finalPhotos.map((photo, index) => (
              <article
                key={photo.id}
                className="yearbook-print-page relative flex min-h-[82vh] flex-col justify-between rounded-2xl bg-[#faf6ee] p-6 shadow-xl sm:p-10"
              >
                <div className="flex items-center justify-between text-[11px] tracking-[0.16em] text-[#8d7952] uppercase">
                  <span>MEMORYVERSE · 10B4</span>
                  <div className="flex items-center gap-3">
                    {canManage && (
                      <span className="no-print flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => {
                            triggerHaptic('selection');
                            onReorder(photo.id, 'up');
                          }}
                          aria-label="Đưa trang lên trước"
                          className="glass-press cursor-pointer rounded-md border border-[#dcd3c0] p-1 text-[#5c677d] hover:bg-[#efe8da] disabled:opacity-30"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={index === finalPhotos.length - 1}
                          onClick={() => {
                            triggerHaptic('selection');
                            onReorder(photo.id, 'down');
                          }}
                          aria-label="Đưa trang xuống sau"
                          className="glass-press cursor-pointer rounded-md border border-[#dcd3c0] p-1 text-[#5c677d] hover:bg-[#efe8da] disabled:opacity-30"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    <span className="font-mono-tabular">
                      {String(index + 1).padStart(2, '0')} /{' '}
                      {String(finalPhotos.length).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <div className="my-6 flex flex-1 items-center justify-center rounded-xl bg-[#111c30] p-4">
                  <img
                    src={photo.src || photo.thumb}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    className="max-h-[56vh] max-w-full rounded object-contain"
                  />
                </div>

                <div>
                  <p className="text-[11px] tracking-[0.14em] text-[#9b8459] uppercase">
                    {formatViDate(photo.taken_at || photo.created_at)}
                  </p>
                  <h2 className="font-display mt-1.5 text-3xl font-normal text-[#17243a]">
                    {photo.title}
                  </h2>
                  {photo.caption && (
                    <p className="mt-2 text-sm leading-relaxed text-[#5c677d]">
                      {photo.caption}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[#e5dfd2] pt-3 text-[10px] tracking-[0.18em] text-[#8d7952] uppercase">
                  <span>Những kỉ niệm đáng nhớ của 10B4</span>
                  <span className="text-[#c4a56c]">✦</span>
                </div>
              </article>
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
};
