import React, { useRef, useState } from 'react';
import { triggerHaptic } from '../utils/haptics';
import { TimeBucket, TimeFilterMode } from '../utils/timeFilter';

interface RightTimelineSliderProps {
  timeBuckets: TimeBucket[];
  selectedTimeKey: string;
  totalCount: number;
  mode: TimeFilterMode;
  onSelectTimeKey: (key: string) => void;
}

export const RightTimelineSlider: React.FC<RightTimelineSliderProps> = ({
  timeBuckets,
  selectedTimeKey,
  totalCount,
  mode,
  onSelectTimeKey,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  if (totalCount === 0 || timeBuckets.length === 0) return null;

  // Build full vertical stops: ['all', ...buckets]
  const stops = [
    { key: 'all', label: 'Tất cả', count: totalCount },
    ...timeBuckets.map((b) => ({ key: b.key, label: b.label, count: b.count })),
  ];

  const maxCount = Math.max(1, ...stops.map((s) => s.count));

  const pickStopFromClientY = (clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(0.999, (clientY - rect.top) / rect.height));
    const idx = Math.floor(ratio * stops.length);
    const chosen = stops[idx];
    if (chosen && chosen.key !== selectedTimeKey) {
      triggerHaptic('selection');
      onSelectTimeKey(chosen.key);
    }
  };

  return (
    <aside
      aria-label="Thanh trượt dòng thời gian"
      className="no-print fixed top-[66%] right-1.5 z-30 -translate-y-1/2 sm:top-1/2 sm:right-4"
    >
      <div
        ref={trackRef}
        onPointerDown={(e) => {
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
          pickStopFromClientY(e.clientY);
        }}
        onPointerMove={(e) => {
          if (dragging) {
            pickStopFromClientY(e.clientY);
          }
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        className="liquid-glass flex touch-none flex-col items-end gap-1 rounded-2xl px-1.5 py-2 select-none sm:gap-1.5 sm:px-2 sm:py-3"
      >
        <span className="mb-0.5 self-center text-[8px] font-semibold tracking-[0.12em] text-[#f2cf88]/85 uppercase sm:text-[9px] sm:tracking-[0.14em]">
          {mode === 'semester' ? 'Học kỳ' : 'Tháng'}
        </span>

        {stops.map((stop) => {
          const isActive = selectedTimeKey === stop.key;
          const barWidthPct = Math.max(24, Math.round((stop.count / maxCount) * 100));

          return (
            <button
              key={stop.key}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('selection');
                onSelectTimeKey(stop.key);
              }}
              aria-label={`Lọc ${stop.label} (${stop.count} ảnh)`}
              className="group relative flex h-6 cursor-pointer items-center justify-end gap-1.5 px-0.5 sm:gap-2 sm:px-1"
            >
              {/* Floating label when active or hovered/dragged */}
              <span
                className={`pointer-events-none whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#f2cf88] text-[#142038] opacity-100 shadow-sm'
                    : dragging
                    ? 'bg-[#0b1426]/85 text-white/90 opacity-100'
                    : 'bg-[#0b1426]/90 text-white/90 opacity-0 group-hover:opacity-100'
                }`}
              >
                {stop.label} · {stop.count}
              </span>

              {/* Mini Timeline Histogram Bar */}
              <div className="flex w-5 justify-end sm:w-7">
                <span
                  className={`block h-1.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-[#f2cf88] shadow-[0_0_10px_rgba(242,207,136,0.7)]'
                      : 'bg-white/35 group-hover:bg-white/75'
                  }`}
                  style={{ width: `${barWidthPct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
