import React, { useState } from 'react';
import { CloudRain, Music2, SlidersHorizontal, Volume2, VolumeX } from 'lucide-react';
import { CHAPTERS } from '../data/chapters';
import { ChapterAudioTrack, ChapterId } from '../types/memory';
import { triggerHaptic } from '../utils/haptics';

interface AudioControllerProps {
  activeChapter: ChapterId;
  isPlaying: boolean;
  volume: number;
  rainEnabled: boolean;
  customTrack?: ChapterAudioTrack;
  onToggle: () => void;
  onVolumeChange: (val: number) => void;
  onToggleRain: () => void;
  onOpenMusicSettings: () => void;
}

function cleanTrackTitle(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

export const AudioController: React.FC<AudioControllerProps> = ({
  activeChapter,
  isPlaying,
  volume,
  rainEnabled,
  customTrack,
  onToggle,
  onVolumeChange,
  onToggleRain,
  onOpenMusicSettings,
}) => {
  const [expanded, setExpanded] = useState(false);
  const currentChapter = CHAPTERS.find((c) => c.id === activeChapter) || CHAPTERS[0];
  const displayTitle = customTrack
    ? cleanTrackTitle(customTrack.fileName)
    : currentChapter.melodyName;

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="liquid-glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[#e8f2f7] transition-all duration-300 sm:gap-2 sm:px-3">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            onToggle();
          }}
          aria-label={isPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền theo chương'}
          className="glass-press flex min-h-[36px] max-w-[180px] cursor-pointer items-center gap-2 px-1 text-xs font-medium transition-colors hover:text-[#f2cf88]"
        >
          {isPlaying ? (
            <Volume2 className="h-4 w-4 shrink-0 text-[#f2cf88]" aria-hidden="true" />
          ) : (
            <VolumeX className="h-4 w-4 shrink-0 text-[#b7c2d6]" aria-hidden="true" />
          )}
          <span className="truncate">
            {isPlaying ? displayTitle : 'Nhạc nền'}
          </span>
        </button>

        {(expanded || isPlaying) ? (
          <div className="flex items-center gap-1.5 border-l border-white/15 pl-2">
            <Music2 className="hidden h-3.5 w-3.5 text-[#f2cf88]/75 sm:block" aria-hidden="true" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Âm lượng nhạc nền"
              className="h-1 w-14 cursor-pointer accent-[#f2cf88] sm:w-20"
            />

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onToggleRain();
              }}
              title={rainEnabled ? 'Đang bật tiếng mưa & cát-sét nhẹ' : 'Bật tiếng mưa nhẹ'}
              aria-label={rainEnabled ? 'Tắt tiếng mưa nhẹ' : 'Bật tiếng mưa nhẹ'}
              className={`glass-press flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors ${
                rainEnabled
                  ? 'bg-[#f2cf88]/20 text-[#f2cf88]'
                  : 'text-[#b7c2d6]/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <CloudRain className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenMusicSettings();
              }}
              title="Đổi nhạc MP3 cho từng chương"
              aria-label="Cài đặt nhạc nền từng chương"
              className="glass-press flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#d5deee]/80 transition-colors hover:bg-white/10 hover:text-[#f2cf88]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onOpenMusicSettings();
            }}
            title="Đổi nhạc MP3 cho từng chương"
            aria-label="Cài đặt nhạc nền từng chương"
            className="glass-press flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-l border-white/12 pl-1 text-[#d5deee]/75 transition-colors hover:bg-white/10 hover:text-[#f2cf88]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
