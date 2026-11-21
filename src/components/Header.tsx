import React from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import { CHAPTERS } from '../data/chapters';
import { ChapterId } from '../types/memory';
import { triggerHaptic } from '../utils/haptics';

interface HeaderProps {
  activeChapter: ChapterId;
  searchTerm: string;
  cloudConfigured?: boolean;
  isCurator?: boolean;
  onSelectChapter: (index: number) => void;
  onSearchChange: (value: string) => void;
  onOpenCurator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeChapter,
  searchTerm,
  cloudConfigured = false,
  isCurator = false,
  onSelectChapter,
  onSearchChange,
  onOpenCurator,
}) => {
  return (
    <header className="no-print sticky top-0 z-30 h-14 border-b border-white/10 bg-[#0a1324]/70 pt-[env(safe-area-inset-top)] backdrop-blur-2xl backdrop-saturate-150 sm:h-16">
      <div className="mx-auto flex h-full max-w-[1480px] items-center justify-between gap-2.5 px-3.5 sm:gap-8 sm:px-8 lg:px-12">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#top"
          className="font-display flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium tracking-[0.13em] text-[#fff8ec] transition-opacity hover:opacity-85 sm:gap-2.5 sm:text-lg sm:tracking-[0.18em]"
        >
          <span className="text-[#f2cf88]" aria-hidden="true">
            ✦
          </span>
          <span>MEMORYVERSE</span>
        </a>

        {/* Zone 2: Clean single-line chapter navigation links (desktop) */}
        <nav
          aria-label="Sáu chương ký ức"
          className="hidden items-center gap-6 lg:flex"
        >
          {CHAPTERS.map((chapter, idx) => {
            const isActive = chapter.id === activeChapter && !searchTerm;
            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectChapter(idx);
                }}
                className={`glass-press relative shrink-0 cursor-pointer whitespace-nowrap py-1 text-[13px] transition-colors duration-200 ${
                  isActive
                    ? 'font-medium text-[#f2cf88]'
                    : 'text-[#c9d2e3]/75 hover:text-white'
                }`}
              >
                {chapter.shortTitle}
                <span
                  className={`absolute inset-x-0 -bottom-0.5 h-px bg-[#f2cf88] transition-transform duration-300 origin-left ${
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Search + Compact Curator Trigger */}
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <label className="liquid-glass-subtle flex h-10 w-[138px] min-w-0 items-center gap-1.5 rounded-full px-3 transition-all focus-within:border-[#f2cf88]/60 focus-within:bg-white/15 sm:w-[230px] sm:gap-2 sm:px-3.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-[#d8e0ee]/75 sm:h-4 sm:w-4" aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kỉ niệm..."
              aria-label="Tìm kiếm kỉ niệm"
              className="w-full min-w-0 bg-transparent text-xs text-white placeholder:text-[#c7d1e3]/55 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Xóa tìm kiếm"
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center text-[#d8e0ee]/70 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onOpenCurator();
            }}
            aria-label={
              cloudConfigured
                ? isCurator
                  ? 'Quản lý ảnh Cloud 10B4 (Đã đăng nhập)'
                  : 'Quản trị Cloud 10B4'
                : 'Quản lý ảnh 10B4'
            }
            title={
              cloudConfigured
                ? isCurator
                  ? 'Quản lý ảnh Cloud (Quản trị viên)'
                  : 'Góc quản trị & Cloud 10B4'
                : 'Quản lý ảnh & Cloud'
            }
            className={`liquid-glass-subtle glass-press flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#f6efe2] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f2cf88]/60 hover:bg-white/15 sm:h-10 sm:w-10 ${
              cloudConfigured && isCurator ? 'border-[#f2cf88]/65 bg-[#f2cf88]/12' : ''
            }`}
          >
            <Sparkles className="h-4 w-4 text-[#f2cf88]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};
