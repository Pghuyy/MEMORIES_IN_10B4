import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Feather } from 'lucide-react';
import { ChapterId, MemoryComment, MemoryPhoto } from '../types/memory';
import { formatViDate } from '../utils/storage';
import { triggerHaptic } from '../utils/haptics';

interface ArtifactCardData {
  id: string;
  kicker: string;
  note: string;
  signature: string;
  dateLabel: string;
  photoId?: string;
}

interface ArtifactFanCardsProps {
  chapterId: ChapterId;
  photos: MemoryPhoto[];
  commentsMap: Record<string, MemoryComment[]>;
  onOpenPhoto: (photoId: string) => void;
}

const DEFAULT_ARTIFACTS: Record<'people' | 'details', ArtifactCardData[]> = {
  people: [
    {
      id: 'art-p-1',
      kicker: '10B4 · Bàn cuối',
      note: '“Đừng ngủ nữa, thầy sắp đi xuống cuối lớp rồi kìa.”',
      signature: '— Nhóm bàn 4',
      dateLabel: 'Giờ Sinh · Tháng 10',
    },
    {
      id: 'art-p-2',
      kicker: 'Tan học chiều thứ 6',
      note: '“Đợi ở cổng phụ nha, nay trời nắng đẹp ghê.”',
      signature: '— Hội bạn thân',
      dateLabel: 'Sân trường 10B4',
    },
    {
      id: 'art-p-3',
      kicker: 'Áo đồng phục',
      note: '“Sau này nhìn lại vẫn nhớ nguyên tiếng cười cả tổ.”',
      signature: '— Thanh xuân 2026–2029',
      dateLabel: 'Gương mặt thân quen',
    },
  ],
  details: [
    {
      id: 'art-d-1',
      kicker: 'Mẩu giấy ngăn bàn',
      note: '“Hết tiết ra căng-tin không? Tao bao ly trà tắc.”',
      signature: '— Nét bút xanh',
      dateLabel: 'Ngăn bàn dãy giữa',
    },
    {
      id: 'art-d-2',
      kicker: 'Ô cửa sổ tầng 3',
      note: '“Nắng xiên qua rèm, bụi phấn bay lấp lánh trên bục giảng.”',
      signature: '— Góc lớp quen',
      dateLabel: 'Buổi sáng đầu tuần',
    },
    {
      id: 'art-d-3',
      kicker: 'Trang nháp cuối vở',
      note: '“Vẽ nguệch ngoạc mấy chữ 10B4 rồi để quên trong cặp.”',
      signature: '— Điều nhỏ bé ở lại',
      dateLabel: 'Cuốn vở cũ',
    },
  ],
};

export const ArtifactFanCards: React.FC<ArtifactFanCardsProps> = ({
  chapterId,
  photos,
  commentsMap,
  onOpenPhoto,
}) => {
  const [fanned, setFanned] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  if (chapterId !== 'people' && chapterId !== 'details') return null;

  // Build up to 3 artifact cards blending real photos/comments with fallback handwritten notes
  const defaults = DEFAULT_ARTIFACTS[chapterId];
  const cards: ArtifactCardData[] = defaults.map((fallback, idx) => {
    const photo = photos[idx];
    if (!photo) return fallback;
    const latestComment = (commentsMap[photo.id] || []).find((c) => !c.is_hidden);
    return {
      id: photo.id,
      kicker: photo.title,
      note: latestComment
        ? `“${latestComment.body.slice(0, 82)}${latestComment.body.length > 82 ? '…' : ''}”`
        : photo.caption
        ? `“${photo.caption.slice(0, 82)}”`
        : fallback.note,
      signature: latestComment ? `— ${latestComment.author_name}` : '— Kỷ vật 10B4',
      dateLabel: formatViDate(photo.taken_at || photo.created_at),
      photoId: photo.id,
    };
  });

  const handleToggleFan = () => {
    triggerHaptic('medium');
    setFanned((prev) => !prev);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ x: nx * 10, y: ny * 8 });
  };

  const restingAngles = [-4, 1.5, 6];
  const fannedTransforms = [
    { x: -64, y: 4, rotate: -11 },
    { x: -8, y: -12, rotate: 1 },
    { x: 46, y: 10, rotate: 12 },
  ];

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      className="pointer-events-auto relative z-20 flex origin-top-right scale-[0.68] flex-col items-end sm:origin-bottom-right sm:scale-90 md:scale-100"
    >
      {/* Interactive Stacked / Fanned Handwritten Artifact Cards */}
      <div
        className="relative h-[196px] w-[235px] cursor-pointer select-none sm:h-[220px] sm:w-[260px]"
        onClick={handleToggleFan}
        role="button"
        tabIndex={0}
        aria-expanded={fanned}
        aria-label={
          fanned
            ? 'Thu gọn thẻ ghi chú viết tay'
            : 'Chạm để xòe quạt thẻ ghi chú viết tay'
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggleFan();
          }
        }}
      >
        {cards.map((card, idx) => {
          const target = fanned
            ? fannedTransforms[idx]
            : { x: idx * 3, y: idx * 3, rotate: restingAngles[idx] };

          // Parallax depth multiplier per card layer
          const depth = (idx + 1) * 0.45;

          return (
            <motion.div
              key={card.id}
              animate={{
                x: target.x + tilt.x * depth,
                y: target.y + tilt.y * depth,
                rotate: target.rotate + tilt.x * 0.25,
                scale: fanned ? 1 : 0.96 + idx * 0.02,
              }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 22,
                mass: 0.85,
              }}
              onClick={(e) => {
                if (fanned && card.photoId) {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  onOpenPhoto(card.photoId);
                }
              }}
              style={{
                zIndex: idx + 1,
                backgroundImage:
                  'repeating-linear-gradient(transparent, transparent 23px, rgba(138, 118, 86, 0.14) 24px)',
              }}
              className="absolute top-3 right-3 w-[200px] origin-bottom rounded-xl border border-[#dfd3bc] bg-[#faf4e8] p-3.5 text-[#1d2b42] shadow-[0_14px_34px_rgba(6,12,24,0.34)] transition-shadow hover:shadow-[0_18px_42px_rgba(6,12,24,0.46)] sm:top-auto sm:bottom-2 sm:w-[210px] sm:p-4"
            >
              {/* Washi masking tape strip */}
              <div
                aria-hidden="true"
                className="mx-auto -mt-5 mb-2 h-3 w-12 -rotate-2 rounded-xs bg-[#e9d5ac]/85 shadow-xs sm:-mt-6 sm:mb-2.5 sm:h-3.5 sm:w-14"
              />

              <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8d7448] uppercase">
                {card.kicker}
              </p>

              <p className="font-display mt-1.5 text-[13px] leading-relaxed italic text-[#1f2e47] sm:mt-2 sm:text-sm">
                {card.note}
              </p>

              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#e5dac4] pt-2 text-[10px] text-[#6d7482] sm:mt-3">
                <span className="font-display italic">{card.signature}</span>
                <span className="font-mono-tabular">{card.dateLabel}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Subtle Label Trigger */}
      <button
        type="button"
        onClick={handleToggleFan}
        className="liquid-glass-subtle glass-press mt-1 inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-[#f5efe4]/90 transition-colors hover:border-[#f2cf88]/60 hover:text-[#f2cf88] sm:mt-2"
      >
        <Feather className="h-3 w-3 text-[#f2cf88]" aria-hidden="true" />
        <span>{fanned ? 'Thu thẻ kỷ vật' : 'Chạm xòe thẻ tay'}</span>
      </button>
    </div>
  );
};
