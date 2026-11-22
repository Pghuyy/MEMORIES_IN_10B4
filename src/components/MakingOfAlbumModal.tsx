import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ImagePlus, Layers, X } from 'lucide-react';
import { MemoryPhoto } from '../types/memory';
import { formatViDate } from '../utils/storage';
import { triggerHaptic } from '../utils/haptics';

interface MakingOfSpotlightBarProps {
  photos: MemoryPhoto[];
  onOpenAlbum: () => void;
}

export const MakingOfSpotlightBar: React.FC<MakingOfSpotlightBarProps> = ({
  photos,
  onOpenAlbum,
}) => {
  const previews = photos.slice(0, 3);

  return (
    <section
      aria-label="Album nổi bật Quá trình tạo lập web"
      className="mx-auto w-full max-w-[1440px] px-3.5 pb-4 sm:px-8 lg:px-12"
    >
      <button
        type="button"
        onClick={() => {
          triggerHaptic('selection');
          onOpenAlbum();
        }}
        className="liquid-glass glass-press group flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border-[#f2cf88]/40 bg-[linear-gradient(125deg,rgba(242,207,136,0.14)_0%,rgba(24,38,66,0.55)_52%,rgba(235,242,255,0.08)_100%)] px-3.5 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f2cf88]/75 sm:px-5 sm:py-3"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#f2cf88]/45 bg-[#f2cf88]/15 text-[#f2cf88]"
          >
            <Layers className="h-4 w-4" />
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-medium text-[#f2cf88]">
              <span>Album đặc biệt</span>
              <span aria-hidden="true" className="text-[#f2cf88]/50">
                ·
              </span>
              <span className="font-mono-tabular text-[#f5efe4]/80">
                {photos.length} khung hình
              </span>
            </div>
            <p className="font-display truncate text-[15px] font-normal text-[#fff9ef] sm:text-base">
              Quá trình tạo lập web
              <span className="font-sans hidden text-xs text-[#cfd7e6]/75 md:inline">
                {' '}
                — Hậu trường dựng nên MEMORYVERSE 10B4
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          {previews.length > 0 && (
            <div className="hidden -space-x-2 sm:flex" aria-hidden="true">
              {previews.map((p) => (
                <img
                  key={p.id}
                  src={p.thumb || p.src}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-lg border border-white/30 bg-[#121e35] object-cover shadow-sm"
                />
              ))}
            </div>
          )}

          <span className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#f2cf88] px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-[#142038] shadow-[0_6px_18px_rgba(242,207,136,0.28)] transition-colors group-hover:bg-[#f7dc9f]">
            <span>Mở album</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </button>
    </section>
  );
};

interface MakingOfAlbumModalProps {
  isOpen: boolean;
  photos: MemoryPhoto[];
  canManage?: boolean;
  suspendEscape?: boolean;
  onClose: () => void;
  onOpenPhoto: (photoId: string) => void;
  onUploadToMakingOf: () => void;
}

const AlbumImageTile: React.FC<{
  photo: MemoryPhoto;
  index: number;
  onOpen: () => void;
}> = ({ photo, index, onOpen }) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        triggerHaptic('selection');
        onOpen();
      }}
      className="glass-press group flex cursor-pointer flex-col text-left"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/18 bg-[#121e35] shadow-[0_10px_28px_rgba(4,10,22,0.34)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#f2cf88]/70">
        {imgFailed ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-[linear-gradient(135deg,#182742,#0e182b)] p-4 text-center">
            <Layers className="h-5 w-5 text-[#f2cf88]/70" aria-hidden="true" />
            <span className="line-clamp-2 text-xs text-[#d6dfee]/80">{photo.title}</span>
          </div>
        ) : (
          <img
            src={photo.thumb || photo.src}
            alt={photo.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2 px-0.5">
        <span className="truncate text-xs font-medium text-[#f5efe4] transition-colors group-hover:text-[#f2cf88]">
          {photo.title || `Khung hình ${index + 1}`}
        </span>
        <span className="font-mono-tabular shrink-0 text-[11px] text-[#b7c2d6]/60">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <span className="truncate px-0.5 text-[11px] text-[#b7c2d6]/70">
        {formatViDate(photo.taken_at || photo.created_at)}
        {photo.uploader_name ? ` · ${photo.uploader_name}` : ''}
      </span>
    </button>
  );
};

export const MakingOfAlbumModal: React.FC<MakingOfAlbumModalProps> = ({
  isOpen,
  photos,
  canManage = true,
  suspendEscape = false,
  onClose,
  onOpenPhoto,
  onUploadToMakingOf,
}) => {
  useEffect(() => {
    if (!isOpen || suspendEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, suspendEscape, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#050914]/82 p-0 backdrop-blur-xl sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: 18, scale: 0.985, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 12, scale: 0.985, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        role="dialog"
        aria-modal="true"
        aria-label="Album ảnh: Quá trình tạo lập web"
        className="flex h-dvh w-full max-w-5xl flex-col overflow-hidden border-white/18 bg-[#0e1729] text-[#f5efe4] shadow-[0_32px_100px_rgba(0,0,0,0.65)] sm:h-auto sm:max-h-[90dvh] sm:rounded-[28px] sm:border"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2.5 border-b border-white/12 bg-[#121f38] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:gap-3 sm:px-6 sm:py-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium text-[#f2cf88]">
              <span className="whitespace-nowrap">Album hậu trường</span>
              <span aria-hidden="true" className="text-[#f2cf88]/50">
                ·
              </span>
              <span className="font-mono-tabular whitespace-nowrap text-[#d5deee]/80">
                {photos.length} khung hình
              </span>
            </div>
            <h2 className="font-display mt-1 text-lg font-normal text-[#fff9ef] sm:text-2xl">
              Quá trình tạo lập web
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#cfd7e6]/75">
              Những bức ảnh chụp lại hành trình phác thảo, viết mã, thử nghiệm giao diện và dựng nên ngôi nhà ký ức cho tập thể 10B4.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onUploadToMakingOf();
                }}
                className="glass-press inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full bg-[#f2cf88] px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-[#142038] hover:bg-[#f7dc9f] sm:min-h-[40px] sm:px-3.5 sm:py-2"
              >
                <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Thêm ảnh hậu trường</span>
                <span className="sm:hidden">Thêm</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              aria-label="Đóng album Quá trình tạo lập web"
              className="glass-press flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 sm:h-10 sm:w-10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6">
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {photos.map((photo, index) => (
                <AlbumImageTile
                  key={photo.id}
                  photo={photo}
                  index={index}
                  onOpen={() => onOpenPhoto(photo.id)}
                />
              ))}
            </div>
          ) : (
            <div className="liquid-glass-subtle flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#f2cf88]/30 px-6 py-14 text-center">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#f2cf88]/35 bg-[#f2cf88]/12 text-[#f2cf88]"
              >
                <Layers className="h-5 w-5" />
              </span>
              <h3 className="font-display mt-4 text-lg font-normal text-[#fff9ef]">
                Chưa có ảnh hậu trường tạo lập web
              </h3>
              <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[#cfd7e6]/75">
                {canManage
                  ? 'Hãy lưu lại những ảnh chụp màn hình bản nháp, lúc chỉnh sửa giao diện hay những buổi thức khuya làm web để cả lớp cùng xem lại sau này.'
                  : 'Quản trị viên 10B4 sẽ sớm cập nhật những hình ảnh hậu trường tạo lập trang web tại đây.'}
              </p>

              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    onUploadToMakingOf();
                  }}
                  className="glass-press mt-5 inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-full bg-[#f2cf88] px-5 py-2.5 text-xs font-semibold text-[#142038] hover:bg-[#f7dc9f]"
                >
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  <span>Thêm ảnh vào album này</span>
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
