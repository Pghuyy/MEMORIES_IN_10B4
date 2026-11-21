import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { CHAPTERS } from '../data/chapters';
import { ChapterAudioTrack, ChapterId, MemoryPhoto } from '../types/memory';
import { formatViDate } from '../utils/storage';
import { triggerHaptic } from '../utils/haptics';

interface CinemaModeModalProps {
  isOpen: boolean;
  photos: MemoryPhoto[];
  activeChapter: ChapterId;
  audioPlaying: boolean;
  customTrack?: ChapterAudioTrack;
  onToggleAudio: () => void;
  onClose: () => void;
}

export const CinemaModeModal: React.FC<CinemaModeModalProps> = ({
  isOpen,
  photos,
  activeChapter,
  audioPlaying,
  customTrack,
  onToggleAudio,
  onClose,
}) => {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setIndex(0);
      setPlaying(true);
      return;
    }
    if (!playing || photos.length < 2) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % photos.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [isOpen, playing, photos.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || photos.length === 0) return null;

  const photo = photos[index] || photos[0];
  const chapter = CHAPTERS.find((c) => c.id === activeChapter) || CHAPTERS[0];
  const trackLabel = customTrack
    ? customTrack.fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
    : chapter.melodyName;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Chế độ chiếu phim ký ức 10B4"
      className="no-print fixed inset-0 z-50 flex flex-col justify-between bg-[#040811] text-white"
    >
      {/* Top Cinema Control Bar */}
      <div className="relative z-20 flex items-center justify-between px-5 py-4 sm:px-9">
        <div className="flex items-center gap-3">
          <span className="font-mono-tabular text-xs tracking-widest text-[#f2cf88]">
            35MM REEL · {String(index + 1).padStart(2, '0')} /{' '}
            {String(photos.length).padStart(2, '0')}
          </span>
          <span className="hidden text-xs text-white/60 sm:inline">
            · {chapter.title}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onToggleAudio();
            }}
            aria-label={audioPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
            className="liquid-glass-subtle glass-press flex h-10 max-w-[200px] cursor-pointer items-center gap-2 rounded-full px-3.5 text-xs text-white/90 hover:text-[#f2cf88]"
          >
            {audioPlaying ? (
              <Volume2 className="h-4 w-4 shrink-0 text-[#f2cf88]" />
            ) : (
              <VolumeX className="h-4 w-4 shrink-0" />
            )}
            <span className="hidden truncate sm:inline">
              {audioPlaying ? trackLabel : 'Bật nhạc'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setPlaying((p) => !p);
            }}
            aria-label={playing ? 'Tạm dừng chiếu' : 'Tiếp tục chiếu'}
            className="liquid-glass-subtle glass-press flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white hover:text-[#f2cf88]"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            aria-label="Thoát chiếu phim"
            className="liquid-glass-subtle glass-press flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Ken Burns Cinematic Crossfade Frame */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 sm:px-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex h-full w-full items-center justify-center"
          >
            <img
              src={photo.src || photo.thumb}
              alt={photo.title}
              className="animate-ken-burns max-h-[74vh] max-w-full rounded-xl object-contain shadow-[0_30px_90px_rgba(0,0,0,0.75)]"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Subtitle Strip */}
      <div className="relative z-20 px-6 pb-8 pt-4 text-center">
        <p className="text-[11px] tracking-[0.2em] text-[#f2cf88]/80 uppercase">
          {formatViDate(photo.taken_at || photo.created_at)}
        </p>
        <h2 className="font-display mt-1.5 text-2xl font-normal text-[#fff8ec] sm:text-3xl">
          {photo.title}
        </h2>
        {photo.caption && (
          <p className="mx-auto mt-1.5 max-w-xl text-xs leading-relaxed text-[#d7dfed]/80 sm:text-sm">
            {photo.caption}
          </p>
        )}

        {/* Reel Progress Bar */}
        <div className="mx-auto mt-5 flex max-w-md gap-1.5">
          {photos.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setIndex(idx);
              }}
              aria-label={`Đến khung hình ${idx + 1}`}
              className={`h-1 flex-1 cursor-pointer rounded-full transition-all ${
                idx === index ? 'bg-[#f2cf88]' : 'bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
