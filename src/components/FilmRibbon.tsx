import React, { useRef } from 'react';
import { BookOpen, CalendarRange, ImagePlus, RotateCcw } from 'lucide-react';
import { CHAPTERS } from '../data/chapters';
import { ChapterId, MemoryPhoto } from '../types/memory';
import { formatViDate } from '../utils/storage';
import { triggerHaptic } from '../utils/haptics';
import { getTimeKeyForPhoto, TimeBucket, TimeFilterMode } from '../utils/timeFilter';

interface FilmRibbonProps {
  activeChapter: ChapterId;
  /** All photos in the active chapter or search results */
  photos: MemoryPhoto[];
  /** Number of photos matching the current time filter */
  matchingCount: number;
  searchTerm: string;
  timeFilterMode: TimeFilterMode;
  selectedTimeKey: string;
  timeBuckets: TimeBucket[];
  finalYearbookCount: number;
  canManage?: boolean;
  onChangeTimeFilterMode: (mode: TimeFilterMode) => void;
  onSelectTimeKey: (key: string) => void;
  onOpenPhoto: (photoId: string) => void;
  onOpenCuratorUpload: (chapterId: ChapterId) => void;
  onOpenYearbookPreview: () => void;
}

export const FilmRibbon: React.FC<FilmRibbonProps> = ({
  activeChapter,
  photos,
  matchingCount,
  searchTerm,
  timeFilterMode,
  selectedTimeKey,
  timeBuckets,
  finalYearbookCount,
  canManage = true,
  onChangeTimeFilterMode,
  onSelectTimeKey,
  onOpenPhoto,
  onOpenCuratorUpload,
  onOpenYearbookPreview,
}) => {
  const ribbonRef = useRef<HTMLDivElement | null>(null);
  const chapter = CHAPTERS.find((c) => c.id === activeChapter) || CHAPTERS[0];

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = ribbonRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
      el.scrollLeft += e.deltaY;
    }
  };

  return (
    <section
      aria-label="Dải phim và bộ lọc thời gian"
      className="mx-auto w-full max-w-[1440px] px-3.5 pt-2 pb-12 sm:px-8 lg:px-12"
    >
      {/* Ribbon Header */}
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-[#f2cf88] uppercase">
            {searchTerm
              ? 'Kết quả tìm kiếm'
              : `Chương ${chapter.index} · ${chapter.title}`}
          </p>
          <h3 className="font-display mt-1 text-xl font-normal text-[#fff8ec] sm:text-2xl">
            {searchTerm
              ? `Khung hình khớp với “${searchTerm}”`
              : `Dải phim trong ${chapter.title.toLowerCase()}`}
          </h3>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono-tabular text-xs text-[#c7d2e4]/75">
            {selectedTimeKey === 'all'
              ? `${photos.length} khung hình`
              : `${matchingCount} / ${photos.length} khung hình`}
          </span>

          {activeChapter === 'yearbook' && !searchTerm && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onOpenYearbookPreview();
              }}
              className="liquid-glass glass-press inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-[#f9e5b8] transition-all hover:-translate-y-0.5 hover:border-[#f2cf88]/70"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#f2cf88]" />
              <span>Xem kỷ yếu ({finalYearbookCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Lọc ký ức (Time Range Filter Bar) */}
      {photos.length > 0 && (
        <div
          aria-label="Lọc ký ức theo thời gian"
          className="mb-4 flex flex-wrap items-center gap-2 sm:gap-2.5"
        >
          <div className="liquid-glass-subtle flex shrink-0 items-center gap-1 rounded-full p-1">
            <span className="flex items-center gap-1.5 pl-2.5 pr-1 text-[11px] font-medium text-[#d5deee]/75">
              <CalendarRange className="h-3.5 w-3.5 text-[#f2cf88]" aria-hidden="true" />
              <span className="hidden sm:inline">Lọc ký ức:</span>
            </span>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onChangeTimeFilterMode('semester');
              }}
              className={`glass-press min-h-[34px] cursor-pointer rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                timeFilterMode === 'semester'
                  ? 'bg-[#f2cf88] text-[#142038]'
                  : 'text-[#d5deee]/80 hover:text-white'
              }`}
            >
              Học kỳ
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onChangeTimeFilterMode('month');
              }}
              className={`glass-press min-h-[34px] cursor-pointer rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                timeFilterMode === 'month'
                  ? 'bg-[#f2cf88] text-[#142038]'
                  : 'text-[#d5deee]/80 hover:text-white'
              }`}
            >
              Theo tháng
            </button>
          </div>

          <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onSelectTimeKey('all');
              }}
              className={`glass-press min-h-[38px] shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                selectedTimeKey === 'all'
                  ? 'border border-[#f2cf88]/75 bg-[#f2cf88]/20 text-[#fff3d6]'
                  : 'liquid-glass-subtle text-[#d5deee]/80 hover:border-white/35 hover:text-white'
              }`}
            >
              Tất cả ({photos.length})
            </button>

            {timeBuckets.map((bucket) => {
              const active = selectedTimeKey === bucket.key;
              return (
                <button
                  key={bucket.key}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onSelectTimeKey(bucket.key);
                  }}
                  className={`glass-press min-h-[38px] shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'border border-[#f2cf88]/75 bg-[#f2cf88]/20 text-[#fff3d6]'
                      : 'liquid-glass-subtle text-[#d5deee]/80 hover:border-white/35 hover:text-white'
                  }`}
                >
                  <span>{bucket.label}</span>
                  <span className="font-mono-tabular ml-1.5 opacity-70">
                    {bucket.count}
                  </span>
                </button>
              );
            })}

            {selectedTimeKey !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onSelectTimeKey('all');
                }}
                aria-label="Đặt lại bộ lọc thời gian"
                className="glass-press inline-flex min-h-[38px] shrink-0 cursor-pointer items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-[11px] text-[#f2cf88] hover:bg-white/10"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Hiện tất cả</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Horizontal 35mm Film Contact Strip — Immediately dims non-matching photos when a time filter is active */}
      {photos.length > 0 ? (
        <div
          ref={ribbonRef}
          onWheel={handleWheel}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:gap-4"
        >
          {photos.map((photo, index) => {
            const isMatchingTime =
              selectedTimeKey === 'all' ||
              getTimeKeyForPhoto(photo, timeFilterMode) === selectedTimeKey;

            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onOpenPhoto(photo.id);
                }}
                className={`glass-press group relative flex w-[156px] flex-none cursor-pointer snap-start flex-col text-left transition-all duration-300 sm:w-[225px] ${
                  isMatchingTime
                    ? 'opacity-100 scale-100'
                    : 'opacity-25 blur-[2px] grayscale-[40%] scale-[0.95] hover:opacity-75 hover:blur-none'
                }`}
              >
                <div
                  className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-[#121e35] shadow-[0_10px_28px_rgba(4,10,22,0.3)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#f2cf88]/65 ${
                    selectedTimeKey !== 'all' && isMatchingTime
                      ? 'border-[#f2cf88]/75 ring-1 ring-[#f2cf88]/35'
                      : 'border-white/18'
                  }`}
                >
                  <img
                    src={photo.thumb || photo.src}
                    alt={photo.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {activeChapter === 'yearbook' && photo.yearbook_pick_type && (
                    <span
                      className={`font-mono-tabular absolute top-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium backdrop-blur-md ${
                        photo.yearbook_pick_type === 'final'
                          ? 'border border-[#f2cf88]/75 bg-[#4f3b1a]/85 text-[#ffe7b2]'
                          : 'border border-white/30 bg-[#0d192e]/75 text-white'
                      }`}
                    >
                      {photo.yearbook_pick_type === 'final' ? 'FINAL' : 'ĐÃ CHỌN'}
                    </span>
                  )}
                </div>

                {/* Clean unboxed editorial metadata below thumbnail */}
                <div className="mt-2.5 flex items-baseline justify-between gap-2 px-0.5">
                  <span className="truncate text-xs font-medium text-[#f5efe4] transition-colors group-hover:text-[#f2cf88]">
                    {photo.title || `Khung hình ${index + 1}`}
                  </span>
                  <span className="font-mono-tabular shrink-0 text-[11px] text-[#b7c2d6]/60">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <span className="truncate px-0.5 text-[11px] text-[#b7c2d6]/65">
                  {formatViDate(photo.taken_at || photo.created_at)}
                  {photo.uploader_name ? ` · ${photo.uploader_name}` : ''}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="liquid-glass-subtle flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 px-6 py-10 text-center">
          <p className="font-display text-lg italic text-[#f5efe4]/85">
            {searchTerm
              ? 'Chưa tìm thấy kỉ niệm phù hợp.'
              : 'Chương này vẫn đang chờ những bức ảnh thật đầu tiên của 10B4.'}
          </p>
          <p className="mt-1.5 text-xs text-[#c7d2e4]/65">
            {searchTerm
              ? 'Thử một từ khóa khác như tên bạn, sự kiện hoặc nhãn kỉ niệm nhé.'
              : canManage
              ? 'Mọi bức ảnh thật bạn tải lên sẽ được lưu giữ nguyên bản tại đây.'
              : 'Quản trị viên 10B4 sẽ sớm tải thêm những khoảnh khắc mới lên chương này.'}
          </p>

          {!searchTerm && canManage && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onOpenCuratorUpload(activeChapter);
              }}
              className="glass-press mt-4 inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium text-[#f2cf88] transition-colors hover:bg-white/15"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              <span>Thêm ảnh vào {chapter.title}</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
};
