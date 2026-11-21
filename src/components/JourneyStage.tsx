import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Film, ImagePlus, ArrowUpRight } from 'lucide-react';
import { CHAPTERS } from '../data/chapters';
import { ChapterAudioTrack, ChapterId, MemoryComment, MemoryPhoto } from '../types/memory';
import { triggerHaptic } from '../utils/haptics';
import { AudioController } from './AudioController';
import { ArtifactFanCards } from './ArtifactFanCards';

interface JourneyStageProps {
  activeChapter: ChapterId;
  chapterPhotosMap: Record<ChapterId, MemoryPhoto[]>;
  commentsMap: Record<string, MemoryComment[]>;
  totalPhotoCount: number;
  canManage?: boolean;
  audioPlaying: boolean;
  audioVolume: number;
  rainEnabled: boolean;
  customTracks: Partial<Record<ChapterId, ChapterAudioTrack>>;
  onSelectChapter: (index: number) => void;
  onSyncChapterFromScroll: (chapterId: ChapterId) => void;
  onOpenPhoto: (photoId: string) => void;
  onOpenCuratorUpload: (chapterId: ChapterId) => void;
  onOpenCinemaMode: () => void;
  onToggleAudio: () => void;
  onVolumeChange: (val: number) => void;
  onToggleRain: () => void;
  onOpenMusicSettings: () => void;
}

export const JourneyStage: React.FC<JourneyStageProps> = ({
  activeChapter,
  chapterPhotosMap,
  commentsMap,
  totalPhotoCount,
  canManage = true,
  audioPlaying,
  audioVolume,
  rainEnabled,
  customTracks,
  onSelectChapter,
  onSyncChapterFromScroll,
  onOpenPhoto,
  onOpenCuratorUpload,
  onOpenCinemaMode,
  onToggleAudio,
  onVolumeChange,
  onToggleRain,
  onOpenMusicSettings,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const isProgrammaticRef = useRef(false);

  const activeIndex = Math.max(
    0,
    CHAPTERS.findIndex((c) => c.id === activeChapter)
  );

  // Continuous fractional index [0..5] for Liquid Glass & 35mm film parallax transitions
  const [scrollProgress, setScrollProgress] = useState<number>(activeIndex);
  const [pointerGlow, setPointerGlow] = useState<{ x: number; y: number }>({ x: 50, y: 35 });

  // Sync horizontal scroll container when activeIndex changes from outside (nav/dots/keyboard)
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const targetLeft = activeIndex * track.clientWidth;
    if (Math.abs(track.scrollLeft - targetLeft) > 8) {
      isProgrammaticRef.current = true;
      track.scrollTo({ left: targetLeft, behavior: 'smooth' });
      const t = window.setTimeout(() => {
        isProgrammaticRef.current = false;
      }, 480);
      return () => window.clearTimeout(t);
    }
  }, [activeIndex]);

  const handleTrackScroll = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const track = trackRef.current;
      if (!track || !track.clientWidth) return;
      const progress = track.scrollLeft / track.clientWidth;
      setScrollProgress(progress);

      if (!isProgrammaticRef.current) {
        const nearest = Math.max(0, Math.min(CHAPTERS.length - 1, Math.round(progress)));
        const nextId = CHAPTERS[nearest].id;
        if (nextId !== activeChapter) {
          triggerHaptic('selection');
          onSyncChapterFromScroll(nextId);
        }
      }
    });
  }, [activeChapter, onSyncChapterFromScroll]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPointerGlow({ x, y });
  };

  return (
    <section className="mx-auto w-full max-w-[1440px] px-3.5 pt-5 pb-7 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12">
      {/* Editorial Header */}
      <div className="mx-auto mb-5 max-w-3xl text-center sm:mb-8">
        <p className="text-[10px] font-medium tracking-[0.18em] text-[#d5deee]/70 uppercase sm:text-[11px] sm:tracking-[0.22em]">
          ✦ Một lớp học · Một thanh xuân · 10B4 (2026–2029)
        </p>
        <h1 className="font-display mt-2.5 text-[clamp(2rem,4.8vw,4.15rem)] leading-[1.03] font-normal tracking-tight text-[#fff9ef] text-balance sm:mt-3">
          Những kỉ niệm đáng nhớ{' '}
          <em className="font-normal italic text-[#f2cf88]">của 10B4</em>
        </h1>
        <p className="mx-auto mt-2.5 max-w-xl text-[13px] leading-relaxed text-[#cfd7e6]/75 sm:mt-3 sm:text-sm">
          Có những khoảnh khắc lúc ấy thật bình thường, nhưng sau này lại muốn giữ nguyên vẹn trong tim.
        </p>
      </div>

      {/* Main Continuous 6-Chapter Liquid Glass Stage */}
      <div className="relative" onPointerMove={handlePointerMove}>
        {/* Mobile Top-Left Compact Arrows (avoids overlapping RightTimelineSlider & ArtifactFanCards) */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onSelectChapter(Math.max(0, activeIndex - 1));
            }}
            disabled={activeIndex === 0}
            aria-label="Chương trước"
            className="liquid-glass glass-press flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white transition-all disabled:pointer-events-none disabled:opacity-25"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onSelectChapter(Math.min(CHAPTERS.length - 1, activeIndex + 1));
            }}
            disabled={activeIndex === CHAPTERS.length - 1}
            aria-label="Chương tiếp theo"
            className="liquid-glass glass-press flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white transition-all disabled:pointer-events-none disabled:opacity-25"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Desktop Left & Right Liquid Glass Arrow Buttons */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onSelectChapter(Math.max(0, activeIndex - 1));
          }}
          disabled={activeIndex === 0}
          aria-label="Chương trước"
          className="liquid-glass glass-press absolute top-1/2 left-5 z-20 hidden h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white transition-all duration-200 hover:scale-105 hover:border-white/50 disabled:pointer-events-none disabled:opacity-25 sm:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onSelectChapter(Math.min(CHAPTERS.length - 1, activeIndex + 1));
          }}
          disabled={activeIndex === CHAPTERS.length - 1}
          aria-label="Chương tiếp theo"
          className="liquid-glass glass-press absolute top-1/2 right-5 z-20 hidden h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white transition-all duration-200 hover:scale-105 hover:border-white/50 disabled:pointer-events-none disabled:opacity-25 sm:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Horizontal Snap Scroll Track */}
        <div
          ref={trackRef}
          onScroll={handleTrackScroll}
          tabIndex={0}
          aria-label="Vuốt ngang để khám phá sáu chương ký ức 10B4"
          className="no-scrollbar flex h-[clamp(440px,58svh,620px)] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-[24px] border border-white/25 shadow-[0_28px_80px_rgba(3,8,20,0.48)] focus:outline-none sm:rounded-[32px]"
        >
          {CHAPTERS.map((chapter, idx) => {
            const list = chapterPhotosMap[chapter.id] || [];
            const featured = list[0];
            const dist = idx - scrollProgress;
            const clampedDist = Math.max(-1, Math.min(1, dist));
            const absDist = Math.abs(clampedDist);

            // Multi-plane 35mm cinema camera Parallax:
            // Plane 1 (Deep Photo / Optical Light Field): overscanned 1.12x so counter-drift reveals 35mm depth without seams
            const pointerShiftX = (pointerGlow.x - 50) * 0.18 * (1 - absDist);
            const pointerShiftY = (pointerGlow.y - 50) * 0.14 * (1 - absDist);
            const imageScale = 1.12 - absDist * 0.04;
            const imageTranslateX = clampedDist * -78 + pointerShiftX;
            const imageTranslateY = pointerShiftY;
            const imageBrightness = 1 - absDist * 0.22;

            // Plane 2 (Midground 35mm Anamorphic Light-Leak): glides faster across glass
            const leakTranslateX = clampedDist * 28;
            const leakOpacity = Math.min(0.88, absDist * 1.18);

            // Plane 3 (Foreground Liquid Glass Frame & Artifacts)
            const frameTranslateX = clampedDist * 14;

            // Plane 4 (Foreground Editorial Typography)
            const copyTranslateX = clampedDist * 52;
            const copyOpacity = Math.max(0.18, 1 - absDist * 0.82);

            return (
              <article
                key={chapter.id}
                aria-label={`Chương ${chapter.index}: ${chapter.title}`}
                className="relative h-full w-full flex-none snap-center snap-always overflow-hidden rounded-[26px] sm:rounded-[32px]"
                style={{ background: chapter.slideBackdrop }}
              >
                {/* Plane 3: Inner Liquid Glass Hairline Frame */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2.5 z-10 rounded-[20px] border border-white/18 will-change-transform sm:inset-3.5 sm:rounded-[24px]"
                  style={{
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22)',
                    transform: `translate3d(${frameTranslateX}px, 0, 0)`,
                  }}
                />

                {/* Pointer-Reactive Specular Glass Sheen */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-10 opacity-45 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(520px circle at ${pointerGlow.x}% ${pointerGlow.y}%, rgba(255,255,255,0.14), transparent 55%)`,
                  }}
                />

                {/* Plane 1: Real Uploaded Featured Photo OR Pure Film Light Field with 35mm Cinema Parallax */}
                {featured ? (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      onOpenPhoto(featured.id);
                    }}
                    aria-label={`Xem ảnh ${featured.title}`}
                    className="group absolute inset-0 z-0 h-full w-full cursor-zoom-in overflow-hidden border-0 bg-transparent p-0"
                  >
                    <img
                      src={featured.src || featured.thumb}
                      alt={featured.title || `Khoảnh khắc ${chapter.title}`}
                      className="h-full w-full object-cover object-center transition-[filter] duration-300 will-change-transform"
                      style={{
                        transform: `translate3d(${imageTranslateX}px, ${imageTranslateY}px, 0) scale(${imageScale})`,
                        filter: `brightness(${imageBrightness})`,
                      }}
                    />
                  </button>
                ) : (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 overflow-hidden will-change-transform"
                    style={{
                      transform: `translate3d(${imageTranslateX * 0.65}px, ${imageTranslateY * 0.65}px, 0) scale(1.06)`,
                    }}
                  >
                    {/* Natural film window light slats & optical glass lens rings */}
                    <div
                      className="absolute -right-[8%] top-0 h-full w-[58%] -skew-x-12 opacity-40"
                      style={{
                        background:
                          'repeating-linear-gradient(90deg, transparent 0 12%, rgba(248, 232, 200, 0.14) 12.2% 12.6%, transparent 13% 25%)',
                      }}
                    />
                    <div className="absolute right-[8%] -top-[22%] h-[420px] w-[420px] rounded-full border border-white/12 shadow-[0_0_0_24px_rgba(255,255,255,0.025),0_0_0_52px_rgba(255,255,255,0.015)]" />
                  </div>
                )}

                {/* Plane 2: 35mm Anamorphic Film Light-Leak Transition Wash when swiping between chapters */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-10 mix-blend-screen transition-opacity duration-200 will-change-transform"
                  style={{
                    opacity: leakOpacity,
                    transform: `translate3d(${leakTranslateX}px, 0, 0)`,
                    background: `radial-gradient(ellipse at ${clampedDist > 0 ? '15%' : '85%'} 45%, ${chapter.lightLeakColor}, transparent 62%)`,
                  }}
                />

                {/* Calibrated Readability Scrim (4.5:1+ text contrast) */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#08101f]/90 via-[#0b1528]/45 to-transparent sm:bg-gradient-to-r sm:from-[#08101f]/90 sm:via-[#0b1528]/58 sm:to-transparent"
                />

                {/* Top-Right Chapter Frame Counter */}
                <div className="pointer-events-none absolute top-4 right-4 z-20 sm:top-8 sm:right-9">
                  <span className="font-mono-tabular liquid-glass-subtle rounded-full px-3 py-1.5 text-[11px] tracking-wider text-white/90 sm:px-3.5 sm:text-xs">
                    {chapter.index} / 06
                  </span>
                </div>

                {/* Plane 4: Chapter Editorial Copy */}
                <div
                  className="pointer-events-none absolute right-5 bottom-6 left-5 z-20 will-change-transform sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-14 sm:max-w-[540px] sm:-translate-y-1/2 lg:left-20"
                  style={{
                    opacity: copyOpacity,
                    transform: `translate3d(${copyTranslateX}px, 0, 0)`,
                  }}
                >
                  <div className="flex items-center gap-3 text-[10px] font-medium tracking-[0.18em] text-[#f7f2e8]/80 uppercase sm:text-[11px] sm:tracking-[0.2em]">
                    <span
                      className="h-px w-6 sm:w-7"
                      style={{ backgroundColor: chapter.accentHex }}
                    />
                    <span>
                      Chương {chapter.index} · {chapter.title}
                    </span>
                  </div>

                  <h2 className="font-display mt-2.5 text-[clamp(1.9rem,5vw,4.35rem)] leading-[0.98] font-normal tracking-tight text-[#fffaf2] sm:mt-4">
                    {chapter.headlinePrimary}
                    <em
                      className="mt-1 block font-normal italic"
                      style={{ color: chapter.accentHex }}
                    >
                      {chapter.headlineAccent}
                    </em>
                  </h2>

                  <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-[#f2ede3]/85 sm:mt-4 sm:text-sm">
                    {chapter.description}
                  </p>

                  {/* Unboxed Clean Metadata (Zero-Pill Discipline) */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-2.5 text-xs text-[#e8e2d7]/75 sm:mt-5">
                    <span className="font-mono-tabular">
                      {list.length} khung hình
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {featured?.uploader_name
                        ? `Đăng bởi ${featured.uploader_name}`
                        : '10B4 · 2026–2029'}
                    </span>
                  </div>

                  {/* Interactive Chapter Action */}
                  <div className="pointer-events-auto mt-4 flex flex-wrap items-center gap-3 sm:mt-7">
                    {featured ? (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('medium');
                          onOpenPhoto(featured.id);
                        }}
                        className="glass-press inline-flex min-h-[42px] cursor-pointer items-center gap-2.5 rounded-full border border-white/50 bg-[#faf5ea]/95 px-5 py-2.5 text-xs font-semibold text-[#162238] shadow-[0_10px_28px_rgba(0,0,0,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
                      >
                        <span>Xem khoảnh khắc</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    ) : canManage ? (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('medium');
                          onOpenCuratorUpload(chapter.id);
                        }}
                        className="liquid-glass glass-press inline-flex min-h-[42px] cursor-pointer items-center gap-2.5 rounded-full px-5 py-2.5 text-xs font-medium text-[#fff5df] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f2cf88]/65"
                      >
                        <ImagePlus className="h-4 w-4 text-[#f2cf88]" />
                        <span>Thêm ảnh thật vào chương này</span>
                      </button>
                    ) : (
                      <span className="text-xs italic text-[#f2cf88]/80">
                        Quản trị viên 10B4 đang cập nhật khoảnh khắc cho chương này.
                      </span>
                    )}
                  </div>
                </div>

                {/* Interactive Fan-Out Handwritten Artifact Cards for People & Details */}
                {(chapter.id === 'people' || chapter.id === 'details') && (
                  <div className="pointer-events-none absolute top-14 right-3 z-20 sm:top-auto sm:right-10 sm:bottom-14 lg:right-14 lg:bottom-16">
                    <ArtifactFanCards
                      chapterId={chapter.id}
                      photos={list}
                      commentsMap={commentsMap}
                      onOpenPhoto={onOpenPhoto}
                    />
                  </div>
                )}

                {/* Bottom-Right Poetic Chapter Whisper */}
                <div className="pointer-events-none absolute right-6 bottom-5 z-20 hidden items-center gap-3 sm:flex lg:right-9 lg:bottom-7">
                  <span
                    className="h-px w-7 opacity-75"
                    style={{ backgroundColor: chapter.accentHex }}
                  />
                  <span className="text-[10px] font-medium tracking-[0.2em] text-[#f5efe4]/75">
                    {chapter.cornerNote}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Liquid Glass Navigation Scrubber, Counter, Cinema Mode & Adaptive Audio */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:mt-5 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="font-mono-tabular text-sm font-medium text-white">
            {String(activeIndex + 1).padStart(2, '0')}
          </span>
          <span className="font-mono-tabular text-xs text-[#b7c2d6]/60">/ 06</span>

          <div
            className="ml-1 flex items-center gap-1 sm:ml-2 sm:gap-1.5"
            role="tablist"
            aria-label="Chọn chương ký ức"
          >
            {CHAPTERS.map((ch, idx) => {
              const isCurrent = idx === activeIndex;
              return (
                <button
                  key={ch.id}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  aria-label={`Chương ${idx + 1}: ${ch.title}`}
                  onClick={() => {
                    triggerHaptic('selection');
                    onSelectChapter(idx);
                  }}
                  className="glass-press flex h-8 cursor-pointer items-center justify-center px-0.5"
                >
                  <span
                    className={`block h-2 rounded-full transition-all duration-300 ${
                      isCurrent
                        ? 'w-8 bg-[#f2cf88] shadow-[0_0_16px_rgba(242,207,136,0.45)] sm:w-9'
                        : 'w-3.5 bg-white/25 hover:bg-white/45 sm:w-4'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-2.5">
          {totalPhotoCount > 0 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onOpenCinemaMode();
              }}
              className="liquid-glass-subtle glass-press inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-[#f7f1e5] transition-all hover:border-[#f2cf88]/60 hover:text-[#f2cf88]"
            >
              <Film className="h-3.5 w-3.5 text-[#f2cf88]" aria-hidden="true" />
              <span>Chiếu phim ký ức</span>
            </button>
          )}

          <AudioController
            activeChapter={activeChapter}
            isPlaying={audioPlaying}
            volume={audioVolume}
            rainEnabled={rainEnabled}
            customTrack={customTracks[activeChapter]}
            onToggle={onToggleAudio}
            onVolumeChange={onVolumeChange}
            onToggleRain={onToggleRain}
            onOpenMusicSettings={onOpenMusicSettings}
          />
        </div>
      </div>
    </section>
  );
};
