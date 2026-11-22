import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Flag,
  ImageOff,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Reply,
  RotateCcw,
  Send,
  ShieldAlert,
  Star,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { CHAPTERS, COLLECTIONS, REACTION_META } from '../data/chapters';
import {
  MemoryComment,
  MemoryPhoto,
  PhotoReactions,
  ReactionKey,
  ReportReasonKey,
  YearbookStage,
} from '../types/memory';
import {
  cleanDownloadName,
  emptyReactions,
  formatRelativeViTime,
  formatViDate,
  getOriginalPhotoBlob,
  loadCommenterName,
  loadMyReportedPhotoIds,
  markPhotoReportedByMe,
  saveCommenterName,
} from '../utils/storage';
import { groupPhotoComments, validateCommentDraft } from '../utils/memoryHelpers';
import { REPORT_REASONS, validateReportDraft } from '../utils/reportHelpers';
import { createCloudRequestId, downloadCloudOriginal } from '../utils/supabaseCloud';
import { triggerHaptic } from '../utils/haptics';

const AVATAR_PALETTE = [
  'from-[#3b82f6] to-[#1d4ed8]',
  'from-[#e11d48] to-[#9f1239]',
  'from-[#d97706] to-[#92400e]',
  'from-[#059669] to-[#065f46]',
  'from-[#7c3aed] to-[#4c1d95]',
  'from-[#0284c7] to-[#075985]',
];

const MY_REACTIONS_KEY = 'memoryverse_10b4_my_reactions_v1';

function loadMyReactions(): Record<string, ReactionKey> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(MY_REACTIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) =>
        ['like', 'heart', 'care', 'cry', 'angry'].includes(String(value))
      )
    ) as Record<string, ReactionKey>;
  } catch {
    return {};
  }
}

function persistMyReactions(map: Record<string, ReactionKey>): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(MY_REACTIONS_KEY, JSON.stringify(map));
  } catch {
    // The server still enforces the one-vote rule when browser storage is blocked.
  }
}

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '10';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const ReactionIcon: React.FC<{ kind: ReactionKey; sizeClass?: string }> = ({
  kind,
  sizeClass = 'h-[19px] w-[19px]',
}) => {
  switch (kind) {
    case 'like':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#3b82f6" />
          <path
            d="M8.5 11.2V16.5H6.8V11.2H8.5ZM10.2 16.5H14.8C15.5 16.5 16.1 16 16.3 15.3L17.2 12.1C17.4 11.3 16.8 10.6 16 10.6H13.1L13.6 8.3C13.7 7.8 13.4 7.3 12.9 7.2C12.5 7.1 12.1 7.3 11.9 7.6L9.8 11.1V16.5H10.2Z"
            fill="#ffffff"
          />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#f43f5e" />
          <path
            d="M12 17.2C12 17.2 6.8 13.9 6.8 10.3C6.8 8.6 8.1 7.3 9.7 7.3C10.7 7.3 11.5 7.8 12 8.6C12.5 7.8 13.3 7.3 14.3 7.3C15.9 7.3 17.2 8.6 17.2 10.3C17.2 13.9 12 17.2 12 17.2Z"
            fill="#ffffff"
          />
        </svg>
      );
    case 'care':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#fbbf24" />
          <circle cx="9.2" cy="9.4" r="1.15" fill="#451a03" />
          <circle cx="14.8" cy="9.4" r="1.15" fill="#451a03" />
          <path
            d="M9.6 11.8C10.4 12.7 13.6 12.7 14.4 11.8"
            stroke="#451a03"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M12 18.8C12 18.8 8.6 16.7 8.6 14.6C8.6 13.6 9.4 12.9 10.3 12.9C11 12.9 11.6 13.3 12 13.8C12.4 13.3 13 12.9 13.7 12.9C14.6 12.9 15.4 13.6 15.4 14.6C15.4 16.7 12 18.8 12 18.8Z"
            fill="#ef4444"
          />
        </svg>
      );
    case 'cry':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#fbbf24" />
          <path
            d="M7.8 9.2L10.3 10.2M16.2 9.2L13.7 10.2"
            stroke="#451a03"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <rect x="8.3" y="10.8" width="1.9" height="5.6" rx="0.95" fill="#38bdf8" />
          <rect x="13.8" y="10.8" width="1.9" height="5.6" rx="0.95" fill="#38bdf8" />
          <path
            d="M9.5 16.4C10.4 15.2 13.6 15.2 14.5 16.4"
            stroke="#451a03"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case 'angry':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#f97316" />
          <path
            d="M7.6 8.8L10.6 10.3M16.4 8.8L13.4 10.3"
            stroke="#450a0a"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="9.2" cy="11.3" r="1.1" fill="#450a0a" />
          <circle cx="14.8" cy="11.3" r="1.1" fill="#450a0a" />
          <path
            d="M9.4 15.8C10.5 14.8 13.5 14.8 14.6 15.8"
            stroke="#450a0a"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
  }
};

interface PhotoViewerModalProps {
  isOpen: boolean;
  photos: MemoryPhoto[];
  currentIndex: number;
  commentsMap: Record<string, MemoryComment[]>;
  reactionsMap: Record<string, PhotoReactions>;
  canManage?: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onAddComment: (
    photoId: string,
    authorName: string,
    body: string,
    parentId: string | null,
    requestId: string
  ) => Promise<boolean> | boolean;
  onReact: (photoId: string, key: ReactionKey) => Promise<ReactionKey | false> | ReactionKey | false;
  onSetYearbookStage?: (photoId: string, stage: YearbookStage) => void;
  onUpdatePhotoInfo?: (
    photoId: string,
    patch: { title: string; caption: string }
  ) => Promise<void> | void;
  onDeletePhoto?: (photoId: string) => void;
  onModerateComment?: (
    photoId: string,
    commentId: string,
    action: 'hide' | 'show' | 'delete'
  ) => void;
  onOpenYearbookPreview?: () => void;
  onReportPhoto?: (params: {
    photoId: string;
    photoTitle: string;
    reason: ReportReasonKey;
    details: string;
    reporterName: string;
  }) => Promise<boolean | void> | boolean | void;
  onToast: (msg: string) => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  isOpen,
  photos,
  currentIndex,
  commentsMap,
  reactionsMap,
  canManage = true,
  onClose,
  onNavigate,
  onAddComment,
  onReact,
  onSetYearbookStage,
  onUpdatePhotoInfo,
  onDeletePhoto,
  onModerateComment,
  onOpenYearbookPreview,
  onReportPhoto,
  onToast,
}) => {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentViewport, setCommentViewport] = useState<{ height: number; top: number } | null>(null);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState<1 | 2>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const [editingInfo, setEditingInfo] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [captionDraft, setCaptionDraft] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReasonKey>('inappropriate');
  const [reportDetails, setReportDetails] = useState('');
  const [reportReporterName, setReportReporterName] = useState(() => loadCommenterName());
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportedPhotoIds, setReportedPhotoIds] = useState<string[]>(loadMyReportedPhotoIds);

  const [authorName, setAuthorName] = useState(() => loadCommenterName());
  const [commentBody, setCommentBody] = useState('');
  const [replyTo, setReplyTo] = useState<MemoryComment | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false);
  const [myReactions, setMyReactions] = useState<Record<string, ReactionKey>>(loadMyReactions);
  const commentRequestIdsRef = useRef<Record<string, string>>({});

  const touchStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStart = useRef<{ x: number; y: number; originX: number; originY: number } | null>(
    null
  );
  const movedDuringPointer = useRef(false);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const commentFeedEndRef = useRef<HTMLDivElement | null>(null);
  const photo = photos[currentIndex];

  // Keep the comment sheet inside the actually visible phone viewport.
  // This is especially important on compact phones when the on-screen keyboard opens.
  useEffect(() => {
    if (!commentsOpen) {
      setCommentViewport(null);
      return;
    }

    const updateVisibleViewport = () => {
      if (!window.matchMedia('(max-width: 639px)').matches) {
        setCommentViewport(null);
        return;
      }

      const viewport = window.visualViewport;
      const nextViewport = {
        height: Math.max(180, Math.round(viewport?.height ?? window.innerHeight)),
        top: Math.max(0, Math.round(viewport?.offsetTop ?? 0)),
      };
      setCommentViewport((previous) =>
        previous?.height === nextViewport.height && previous.top === nextViewport.top
          ? previous
          : nextViewport
      );
    };

    updateVisibleViewport();
    window.addEventListener('resize', updateVisibleViewport);
    window.visualViewport?.addEventListener('resize', updateVisibleViewport);
    window.visualViewport?.addEventListener('scroll', updateVisibleViewport);

    return () => {
      window.removeEventListener('resize', updateVisibleViewport);
      window.visualViewport?.removeEventListener('resize', updateVisibleViewport);
      window.visualViewport?.removeEventListener('scroll', updateVisibleViewport);
    };
  }, [commentsOpen]);

  // Let the message field grow for a few lines instead of squeezing writing into one line.
  useEffect(() => {
    if (!commentsOpen) return;
    const field = commentInputRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${Math.min(field.scrollHeight, 128)}px`;
  }, [commentBody, commentsOpen]);

  useEffect(() => {
    if (photo) {
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
      setImgFailed(false);
      setConfirmDeleteOpen(false);
      setDeleting(false);
      setReplyTo(null);
      setToolsMenuOpen(false);
      setEditingInfo(false);
      setReportModalOpen(false);
      setTitleDraft(photo.title);
      setCaptionDraft(photo.caption || '');
    }
  }, [photo]);

  useEffect(() => {
    if (!isOpen) {
      setCommentsOpen(false);
      setToolsMenuOpen(false);
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
      setConfirmDeleteOpen(false);
      setEditingInfo(false);
      setReportModalOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target && (target.matches('input, textarea, select') || target.isContentEditable);

      if (e.key === 'Escape') {
        if (reportModalOpen) {
          setReportModalOpen(false);
        } else if (confirmDeleteOpen) {
          setConfirmDeleteOpen(false);
        } else if (editingInfo) {
          setEditingInfo(false);
        } else if (toolsMenuOpen) {
          setToolsMenuOpen(false);
        } else if (commentsOpen) {
          setCommentsOpen(false);
        } else if (zoomScale > 1) {
          setZoomScale(1);
          setPanOffset({ x: 0, y: 0 });
        } else {
          onClose();
        }
      } else if (!isTyping && !editingInfo && !reportModalOpen && photos.length > 1) {
        if (e.key === 'ArrowRight') {
          onNavigate((currentIndex + 1) % photos.length);
        } else if (e.key === 'ArrowLeft') {
          onNavigate((currentIndex - 1 + photos.length) % photos.length);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isOpen,
    commentsOpen,
    toolsMenuOpen,
    editingInfo,
    reportModalOpen,
    confirmDeleteOpen,
    zoomScale,
    currentIndex,
    photos.length,
    onClose,
    onNavigate,
  ]);

  const photoId = photo?.id || '';

  const { visibleComments: allComments, topLevel: topComments, repliesByParent } = useMemo(
    () => groupPhotoComments(photoId ? commentsMap[photoId] : []),
    [commentsMap, photoId]
  );

  const latestVisibleComment = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...allComments]
      .reverse()
      .find((c) => !c.unlock_date || c.unlock_date <= today);
  }, [allComments]);

  if (!isOpen || !photo) return null;

  const primaryCollectionObj = COLLECTIONS.find((c) =>
    photo.collectionIds.includes(c.id)
  );
  const primaryCollection = primaryCollectionObj?.title || 'Kỷ niệm 10B4';
  const primaryChapterTitle =
    CHAPTERS.find((ch) => ch.id === primaryCollectionObj?.space)?.title || '10B4';
  const uploaderDisplay = photo.uploader_name?.trim() || 'Ban quản trị 10B4';

  const photoReactions = reactionsMap[photo.id] || emptyReactions();
  const todayIso = new Date().toISOString().slice(0, 10);

  const toggleZoom = () => {
    triggerHaptic('selection');
    setToolsMenuOpen(false);
    if (zoomScale === 1) {
      setZoomScale(2);
      setPanOffset({ x: 0, y: 0 });
    } else {
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleReactClick = async (key: ReactionKey) => {
    if (isSubmittingReaction) return;
    if (myReactions[photo.id]) {
      onToast('Mỗi thiết bị chỉ thả một cảm xúc cho mỗi bức ảnh nhé.');
      return;
    }
    triggerHaptic('light');
    setIsSubmittingReaction(true);
    try {
      const acceptedKey = await Promise.resolve(onReact(photo.id, key));
      if (!acceptedKey) return;
      setMyReactions((prev) => {
        const next = { ...prev, [photo.id]: acceptedKey };
        persistMyReactions(next);
        return next;
      });
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể ghi nhận cảm xúc.');
    } finally {
      setIsSubmittingReaction(false);
    }
  };

  const handleDownloadOriginal = async () => {
    setDownloading(true);
    try {
      let blob = await getOriginalPhotoBlob(photo.id);
      if (!blob && photo.storage_path) {
        blob = await downloadCloudOriginal(photo.storage_path);
      }
      if (!blob) {
        const res = await fetch(photo.src || photo.thumb);
        blob = await res.blob();
      }
      const extMatch = (photo.originalName || '').match(/\.([a-z0-9]{2,5})$/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanDownloadName(photo.title)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 15000);
      onToast('Đã lưu ảnh gốc về thiết bị.');
    } catch {
      onToast('Chưa thể tải ảnh gốc. Hãy thử lại.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveEditedInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = titleDraft.trim();
    if (!cleanTitle) {
      onToast('Tên ảnh không được để trống.');
      return;
    }
    setSavingInfo(true);
    try {
      await Promise.resolve(
        onUpdatePhotoInfo?.(photo.id, {
          title: cleanTitle,
          caption: captionDraft.trim(),
        })
      );
      triggerHaptic('success');
      setEditingInfo(false);
    } finally {
      setSavingInfo(false);
    }
  };

  const submitCommentNow = async () => {
    if (isSubmittingComment) return;
    const validation = validateCommentDraft(authorName, commentBody);
    if (!validation.valid) {
      onToast(validation.error);
      return;
    }
    setIsSubmittingComment(true);
    const parentId = replyTo?.id || null;
    const payloadKey = JSON.stringify([
      photo.id,
      parentId,
      validation.authorName,
      validation.body,
    ]);
    const requestId = commentRequestIdsRef.current[payloadKey] || createCloudRequestId();
    commentRequestIdsRef.current[payloadKey] = requestId;
    try {
      const accepted = await Promise.resolve(
        onAddComment(
          photo.id,
          validation.authorName,
          validation.body,
          parentId,
          requestId
        )
      );
      if (accepted === false) return;
      delete commentRequestIdsRef.current[payloadKey];
      saveCommenterName(validation.authorName);
      triggerHaptic('success');
      setCommentBody('');
      setReplyTo(null);
      window.setTimeout(() => {
        commentFeedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 80);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể gửi bình luận.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    void submitCommentNow();
  };

  const openAndFocusComments = (targetComment?: MemoryComment, mentionName?: string) => {
    triggerHaptic('light');
    setToolsMenuOpen(false);
    setCommentsOpen(true);
    if (targetComment) {
      setReplyTo(targetComment);
      if (mentionName) {
        setCommentBody((prev) =>
          prev.startsWith(`@${mentionName}`) ? prev : `@${mentionName} `
        );
      }
      window.setTimeout(() => {
        commentInputRef.current?.focus();
      }, 180);
    }
  };

  const alreadyReported = reportedPhotoIds.includes(photo.id);

  const openReportDialog = () => {
    triggerHaptic('light');
    setToolsMenuOpen(false);
    setReportReporterName((prev) => prev || authorName || loadCommenterName());
    setReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingReport) return;
    const validation = validateReportDraft(reportReason, reportDetails, reportReporterName);
    if (!validation.valid) {
      onToast(validation.error);
      return;
    }

    setSubmittingReport(true);
    try {
      const accepted = await Promise.resolve(
        onReportPhoto?.({
          photoId: photo.id,
          photoTitle: photo.title,
          reason: validation.reason,
          details: validation.details,
          reporterName: validation.reporterName,
        })
      );
      if (accepted === false) return;

      const updatedIds = markPhotoReportedByMe(photo.id);
      setReportedPhotoIds(updatedIds);
      if (validation.reporterName && validation.reporterName !== 'Thành viên 10B4') {
        saveCommenterName(validation.reporterName);
      }
      triggerHaptic('success');
      setReportModalOpen(false);
      setReportDetails('');
      setReportReason('inappropriate');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Chưa thể gửi báo cáo vi phạm.');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Xem ảnh ${photo.title}`}
      className="no-print fixed inset-0 z-[60] overflow-hidden bg-[#050811]/78 backdrop-blur-2xl"
    >
      {/* Soft Ambient Blurred Photo Backdrop for Deep Center Focus */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <img
          src={photo.thumb || photo.src}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full scale-125 object-cover opacity-30 blur-3xl saturate-125"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(5,9,18,0.32)_0%,rgba(4,7,15,0.84)_82%)]" />
      </div>

      {/* Minimal, Refined Top Bar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-2 bg-gradient-to-b from-[#04070f]/75 via-[#04070f]/35 to-transparent px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-6 sm:px-6 sm:pt-4">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            aria-label="Đóng trình xem ảnh"
            className="liquid-glass-subtle glass-press flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#d6dfee]/80">
              <span className="font-mono-tabular font-semibold text-white">
                {String(currentIndex + 1).padStart(2, '0')} /{' '}
                {String(photos.length).padStart(2, '0')}
              </span>
              <span aria-hidden="true" className="hidden sm:inline">
                ·
              </span>
              <span className="hidden truncate sm:inline">{primaryCollection}</span>
              <span aria-hidden="true" className="hidden md:inline">
                ·
              </span>
              <span className="hidden truncate text-[#f2cf88] md:inline">
                {uploaderDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* Refined Compact Tools Trigger (Zoom + Report Violation + More Options) */}
        <div className="pointer-events-auto relative flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleZoom}
            aria-label={zoomScale === 1 ? 'Phóng to ảnh 2x' : 'Thu ảnh vừa màn hình'}
            className={`liquid-glass-subtle glass-press flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-colors ${
              zoomScale > 1
                ? 'border-[#f2cf88] bg-[#f2cf88] text-[#142038]'
                : 'text-white hover:bg-white/15'
            }`}
          >
            {zoomScale > 1 ? (
              <>
                <ZoomOut className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Thu vừa</span>
              </>
            ) : (
              <>
                <ZoomIn className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Phóng to</span>
              </>
            )}
          </button>

          {onReportPhoto && (
            <button
              type="button"
              onClick={openReportDialog}
              aria-label="Báo cáo vi phạm"
              title="Báo cáo vi phạm tới quản trị viên"
              className={`liquid-glass-subtle glass-press flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-colors ${
                alreadyReported
                  ? 'border-[#f48b82]/55 bg-[#f48b82]/15 text-[#ffb4ad]'
                  : 'text-white hover:border-[#f48b82]/50 hover:bg-[#f48b82]/12 hover:text-[#ffd6d2]'
              }`}
            >
              <Flag className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">
                {alreadyReported ? 'Đã báo cáo' : 'Báo cáo vi phạm'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setConfirmDeleteOpen(false);
              setToolsMenuOpen((prev) => !prev);
            }}
            aria-expanded={toolsMenuOpen}
            aria-label="Tùy chọn và công cụ ảnh"
            title="Tùy chọn ảnh"
            className={`liquid-glass-subtle glass-press flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-colors ${
              toolsMenuOpen
                ? 'border-[#f2cf88]/80 bg-[#f2cf88]/20 text-[#f2cf88]'
                : 'text-white hover:bg-white/15'
            }`}
          >
            <MoreHorizontal className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Tùy chọn</span>
          </button>
        </div>
      </div>

      {/* Subtle Floating Liquid Glass Photo Tools Popover */}
      <AnimatePresence>
        {toolsMenuOpen && (
          <>
            <div
              onClick={() => {
                setToolsMenuOpen(false);
                setConfirmDeleteOpen(false);
              }}
              className="fixed inset-0 z-30"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              role="menu"
              aria-label="Công cụ ảnh"
              className="fixed top-[max(3.75rem,calc(env(safe-area-inset-top)+3.25rem))] right-3 z-40 w-[min(320px,calc(100vw-1.5rem))] space-y-3 rounded-2xl border border-white/20 bg-[#101828]/95 p-3.5 text-xs text-[#eef2f8] shadow-[0_24px_64px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:top-16 sm:right-6"
            >
              {/* Clean Photo Metadata Summary */}
              <div className="space-y-1 border-b border-white/10 pb-3">
                <p className="text-[11px] font-medium text-[#f2cf88]">
                  {primaryChapterTitle} · {primaryCollection}
                </p>
                <p className="text-[13px] font-semibold text-white">{photo.title}</p>
                {photo.caption && (
                  <p className="text-xs leading-relaxed text-[#cfd9e8]/85">
                    {photo.caption}
                  </p>
                )}
                <p className="pt-0.5 text-[11px] text-[#9fb0c9]">
                  Đăng bởi {uploaderDisplay} · {formatViDate(photo.taken_at || photo.created_at)}
                </p>
                {photo.tags.length > 0 && (
                  <p className="pt-0.5 text-[11px] text-[#f2cf88]/85">
                    {photo.tags.map((t) => `#${t}`).join('  ')}
                  </p>
                )}
              </div>

              {/* Action List */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    triggerHaptic('light');
                    void handleDownloadOriginal();
                    setToolsMenuOpen(false);
                  }}
                  disabled={downloading}
                  className="glass-press flex min-h-[40px] w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  <Download className="h-4 w-4 shrink-0 text-[#f2cf88]" />
                  <span>{downloading ? 'Đang tải ảnh gốc...' : 'Lưu ảnh gốc về máy'}</span>
                </button>

                {canManage && onUpdatePhotoInfo && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      triggerHaptic('light');
                      setToolsMenuOpen(false);
                      setEditingInfo(true);
                    }}
                    className="glass-press flex min-h-[40px] w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-white transition-colors hover:bg-white/10"
                  >
                    <Pencil className="h-4 w-4 shrink-0 text-[#cbd6e8]" />
                    <span>Sửa tên & chú thích ảnh</span>
                  </button>
                )}

                {onReportPhoto && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={openReportDialog}
                    className="glass-press flex min-h-[40px] w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#ffb4ad] transition-colors hover:bg-[#c94a41]/18"
                  >
                    <Flag className="h-4 w-4 shrink-0 text-[#f48b82]" />
                    <span>
                      {alreadyReported
                        ? 'Gửi thêm báo cáo vi phạm'
                        : 'Báo cáo vi phạm'}
                    </span>
                  </button>
                )}
              </div>

              {/* Curator Yearbook Selection */}
              {canManage && onSetYearbookStage && (
                <div className="space-y-2 border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#f2cf88]">
                      <Star className="h-3.5 w-3.5" />
                      <span>Kỷ yếu 10B4</span>
                    </span>
                    {onOpenYearbookPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setToolsMenuOpen(false);
                          onOpenYearbookPreview();
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-[#cfd9e8] hover:text-[#f2cf88] hover:underline"
                      >
                        <BookOpen className="h-3 w-3" />
                        <span>Mở sách</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        onSetYearbookStage(photo.id, '');
                      }}
                      className={`glass-press min-h-[36px] cursor-pointer rounded-xl border px-2 py-1 text-[11px] font-medium transition-colors ${
                        !photo.yearbook_pick_type
                          ? 'border-white/35 bg-white/15 text-white'
                          : 'border-white/12 bg-white/5 text-[#b7c2d6] hover:bg-white/10'
                      }`}
                    >
                      Chưa chọn
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        onSetYearbookStage(photo.id, 'candidate');
                      }}
                      className={`glass-press inline-flex min-h-[36px] cursor-pointer items-center justify-center gap-1 rounded-xl border px-2 py-1 text-[11px] font-medium transition-colors ${
                        photo.yearbook_pick_type === 'candidate'
                          ? 'border-[#f2cf88] bg-[#f2cf88]/22 text-[#fae2b0]'
                          : 'border-white/12 bg-white/5 text-[#b7c2d6] hover:bg-white/10'
                      }`}
                    >
                      {photo.yearbook_pick_type === 'candidate' && (
                        <Check className="h-3 w-3 shrink-0" />
                      )}
                      <span>Ứng viên</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('success');
                        onSetYearbookStage(photo.id, 'final');
                      }}
                      className={`glass-press inline-flex min-h-[36px] cursor-pointer items-center justify-center gap-1 rounded-xl border px-2 py-1 text-[11px] font-semibold transition-colors ${
                        photo.yearbook_pick_type === 'final'
                          ? 'border-[#f2cf88] bg-[#f2cf88] text-[#142038]'
                          : 'border-[#f2cf88]/35 bg-[#f2cf88]/10 text-[#f2cf88] hover:bg-[#f2cf88]/20'
                      }`}
                    >
                      <span>FINAL</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Curator Mistake-Delete */}
              {canManage && onDeletePhoto && (
                <div className="border-t border-white/10 pt-2.5">
                  {confirmDeleteOpen ? (
                    <div className="space-y-2 rounded-xl border border-[#f48b82]/40 bg-[#331417]/80 p-2.5">
                      <p className="text-[11px] text-[#ffe7e4]">
                        Xóa vĩnh viễn ảnh <strong>“{photo.title}”</strong>?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={async () => {
                            setDeleting(true);
                            triggerHaptic('medium');
                            await Promise.resolve(onDeletePhoto(photo.id));
                            setConfirmDeleteOpen(false);
                            setToolsMenuOpen(false);
                            setDeleting(false);
                          }}
                          className="glass-press min-h-[34px] flex-1 cursor-pointer rounded-lg bg-[#d64c42] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#e1594f] disabled:opacity-50"
                        >
                          {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                        </button>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => setConfirmDeleteOpen(false)}
                          className="glass-press min-h-[34px] cursor-pointer rounded-lg border border-white/20 px-3 py-1 text-[11px] text-white/85 hover:bg-white/10"
                        >
                          Giữ lại
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        triggerHaptic('medium');
                        setConfirmDeleteOpen(true);
                      }}
                      className="glass-press flex min-h-[40px] w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#ff9b93] transition-colors hover:bg-[#c94a41]/20"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                      <span>Xóa ảnh gửi nhầm</span>
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Clean Inline Photo Info Editor Modal (when curator chooses Sửa tên & chú thích) */}
      <AnimatePresence>
        {canManage && editingInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#050811]/84 p-4 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditingInfo(false);
            }}
          >
            <motion.form
              initial={{ y: 8, scale: 0.985 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 6, scale: 0.985 }}
              transition={{ duration: 0.14 }}
              onSubmit={handleSaveEditedInfo}
              className="w-full max-w-md space-y-3 rounded-2xl border border-white/20 bg-[#111a2c] p-5 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-normal text-[#fff8ec]">
                  Sửa thông tin ảnh
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingInfo(false)}
                  aria-label="Đóng chỉnh sửa ảnh"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#cfd9e8]">
                  Tên khoảnh khắc
                </label>
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  maxLength={140}
                  required
                  placeholder="Tên khoảnh khắc"
                  className="min-h-[42px] w-full rounded-xl border border-white/18 bg-[#0b1322] px-3.5 py-2 text-base text-white focus:border-[#f2cf88] focus:outline-none sm:text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#cfd9e8]">
                  Chú thích / câu chuyện
                </label>
                <textarea
                  rows={3}
                  value={captionDraft}
                  onChange={(e) => setCaptionDraft(e.target.value)}
                  maxLength={300}
                  placeholder="Chú thích ngắn về bức ảnh..."
                  className="w-full resize-none rounded-xl border border-white/18 bg-[#0b1322] px-3.5 py-2 text-base text-white focus:border-[#f2cf88] focus:outline-none sm:text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingInfo(false)}
                  className="glass-press min-h-[40px] cursor-pointer rounded-full border border-white/20 px-4 text-xs text-white/85 hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingInfo}
                  className="glass-press min-h-[40px] cursor-pointer rounded-full bg-[#f2cf88] px-5 text-xs font-semibold text-[#142038] hover:bg-[#f7dc9f] disabled:opacity-50"
                >
                  {savingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clean Liquid Glass Violation Report Dialog */}
      <AnimatePresence>
        {reportModalOpen && onReportPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#050811]/84 p-4 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget) setReportModalOpen(false);
            }}
          >
            <motion.form
              initial={{ y: 8, scale: 0.985 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 6, scale: 0.985 }}
              transition={{ duration: 0.14 }}
              onSubmit={handleSubmitReport}
              role="dialog"
              aria-modal="true"
              aria-label="Báo cáo vi phạm tới Quản trị viên 10B4"
              className="flex max-h-[86dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#111a2c] text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f48b82]/15 text-[#ff9b93]">
                    <ShieldAlert className="h-4.5 w-4.5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display truncate text-base font-normal text-[#fff8ec]">
                      Báo cáo vi phạm
                    </h3>
                    <p className="truncate text-[11px] text-[#9fb0c9]">
                      Gửi thông báo trực tiếp cho Quản trị viên 10B4
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  aria-label="Đóng hộp báo cáo vi phạm"
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div className="rounded-xl border border-white/12 bg-[#0c1424] px-3.5 py-2.5 text-xs">
                  <p className="text-[11px] text-[#9fb0c9]">Khoảnh khắc đang báo cáo</p>
                  <p className="mt-0.5 truncate font-semibold text-[#f2cf88]">
                    {photo.title}
                  </p>
                </div>

                <fieldset className="space-y-2">
                  <legend className="mb-1 text-xs font-medium text-[#cfd9e8]">
                    Chọn lý do cần xem xét
                  </legend>
                  {REPORT_REASONS.map((option) => {
                    const selected = reportReason === option.key;
                    return (
                      <label
                        key={option.key}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                          selected
                            ? 'border-[#f48b82]/70 bg-[#f48b82]/12'
                            : 'border-white/12 bg-[#0c1424]/75 hover:border-white/25'
                        }`}
                      >
                        <input
                          type="radio"
                          name="report-reason"
                          value={option.key}
                          checked={selected}
                          onChange={() => {
                            triggerHaptic('selection');
                            setReportReason(option.key);
                          }}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[#f48b82]"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white">
                            {option.label}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-[#9fb0c9]">
                            {option.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </fieldset>

                <div>
                  <label
                    htmlFor="report-reporter-name"
                    className="mb-1 block text-xs font-medium text-[#cfd9e8]"
                  >
                    Tên của bạn (tùy chọn)
                  </label>
                  <input
                    id="report-reporter-name"
                    type="text"
                    value={reportReporterName}
                    onChange={(e) => setReportReporterName(e.target.value)}
                    maxLength={40}
                    placeholder="Ví dụ: Minh Anh · 10B4 (có thể để trống)"
                    className="min-h-[42px] w-full rounded-xl border border-white/18 bg-[#0b1322] px-3.5 py-2 text-base text-white placeholder:text-[#7e90ab] focus:border-[#f48b82] focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="report-details"
                    className="mb-1 block text-xs font-medium text-[#cfd9e8]"
                  >
                    Ghi chú thêm cho Quản trị viên{' '}
                    {reportReason === 'other' ? '(bắt buộc)' : '(không bắt buộc)'}
                  </label>
                  <textarea
                    id="report-details"
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    maxLength={500}
                    required={reportReason === 'other'}
                    placeholder="Mô tả ngắn vấn đề để quản trị viên xử lý chính xác hơn..."
                    className="w-full resize-none rounded-xl border border-white/18 bg-[#0b1322] px-3.5 py-2 text-base text-white placeholder:text-[#7e90ab] focus:border-[#f48b82] focus:outline-none sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-white/10 bg-[#0d1524] px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  disabled={submittingReport}
                  className="glass-press min-h-[40px] cursor-pointer rounded-full border border-white/20 px-4 text-xs text-white/85 hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="glass-press inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-full bg-[#e2574c] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#cf483e] disabled:opacity-50"
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span>
                    {submittingReport ? 'Đang gửi báo cáo...' : 'Gửi báo cáo vi phạm'}
                  </span>
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Fullscreen Container: Centered Enlarged Photo Stage + Floating Bottom Dock */}
      <div className="relative h-full w-full">
        {/* Centered Fullscreen Enlarged Photo Viewport */}
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && zoomScale === 1 && !commentsOpen && !toolsMenuOpen) {
              triggerHaptic('light');
              onClose();
            }
          }}
          className={`fixed inset-0 flex items-center justify-center overflow-hidden p-2 sm:p-5 ${
            zoomScale > 1 ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          onTouchStart={(e) => {
            if (zoomScale === 1 && e.changedTouches[0]) {
              touchStart.current = {
                x: e.changedTouches[0].screenX,
                y: e.changedTouches[0].screenY,
              };
            }
          }}
          onTouchEnd={(e) => {
            if (zoomScale > 1 || !e.changedTouches[0]) return;
            const dx = e.changedTouches[0].screenX - touchStart.current.x;
            const dy = e.changedTouches[0].screenY - touchStart.current.y;
            if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.2 && photos.length > 1) {
              triggerHaptic('selection');
              onNavigate(
                dx < 0
                  ? (currentIndex + 1) % photos.length
                  : (currentIndex - 1 + photos.length) % photos.length
              );
            }
          }}
          onPointerDown={(e) => {
            if (zoomScale <= 1) return;
            movedDuringPointer.current = false;
            setIsPanning(true);
            panStart.current = {
              x: e.clientX,
              y: e.clientY,
              originX: panOffset.x,
              originY: panOffset.y,
            };
          }}
          onPointerMove={(e) => {
            if (!isPanning || !panStart.current || zoomScale <= 1) return;
            const dx = e.clientX - panStart.current.x;
            const dy = e.clientY - panStart.current.y;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
              movedDuringPointer.current = true;
            }
            setPanOffset({
              x: Math.max(-280, Math.min(280, panStart.current.originX + dx)),
              y: Math.max(-220, Math.min(220, panStart.current.originY + dy)),
            });
          }}
          onPointerUp={() => {
            setIsPanning(false);
            panStart.current = null;
          }}
          onPointerCancel={() => {
            setIsPanning(false);
            panStart.current = null;
          }}
        >
          {photos.length > 1 && zoomScale === 1 && (
            <>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onNavigate((currentIndex - 1 + photos.length) % photos.length);
                }}
                aria-label="Ảnh trước"
                className="liquid-glass glass-press absolute top-1/2 left-2.5 z-20 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white transition-transform hover:scale-105 sm:left-4 sm:h-11 sm:w-11"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onNavigate((currentIndex + 1) % photos.length);
                }}
                aria-label="Ảnh tiếp theo"
                className="liquid-glass glass-press absolute top-1/2 right-2.5 z-20 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white transition-transform hover:scale-105 sm:right-4 sm:h-11 sm:w-11"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {imgFailed ? (
            <div className="flex h-64 w-80 max-w-[90vw] flex-col items-center justify-center gap-2 rounded-2xl border border-white/15 bg-[#111b2e] p-6 text-center text-white/80">
              <ImageOff className="h-7 w-7 text-[#f2cf88]/75" aria-hidden="true" />
              <p className="font-display text-base">{photo.title}</p>
              <p className="text-xs text-[#9fb0c9]">Chưa tải được ảnh gốc này.</p>
            </div>
          ) : (
            <motion.img
              key={photo.id}
              initial={{ opacity: 0.45, scale: 0.985 }}
              animate={{
                opacity: 1,
                scale: zoomScale,
                x: zoomScale > 1 ? panOffset.x : 0,
                y: zoomScale > 1 ? panOffset.y : 0,
              }}
              transition={
                isPanning
                  ? { duration: 0 }
                  : { duration: 0.24, ease: [0.16, 1, 0.3, 1] }
              }
              src={photo.src || photo.thumb}
              alt={photo.title}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              onClick={() => {
                if (movedDuringPointer.current) {
                  movedDuringPointer.current = false;
                  return;
                }
                if (toolsMenuOpen) {
                  setToolsMenuOpen(false);
                  return;
                }
                if (commentsOpen) {
                  triggerHaptic('selection');
                  setCommentsOpen(false);
                  return;
                }
                toggleZoom();
              }}
              className="max-h-[82dvh] max-w-[96vw] rounded-xl object-contain shadow-[0_28px_90px_rgba(0,0,0,0.72)] select-none sm:max-h-[88dvh] sm:max-w-[92vw]"
            />
          )}

          {zoomScale > 1 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setZoomScale(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="liquid-glass glass-press fixed bottom-24 left-1/2 z-30 flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-white shadow-lg sm:bottom-28"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#f2cf88]" />
              <span>Đang phóng to 2x · Kéo để xem hoặc chạm để thu vừa</span>
            </button>
          )}
        </div>

        {/* Floating Bottom Dock: Photo Caption Summary + 5 Expressive Reactions + Prominent Bình luận Button */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#04070f]/86 via-[#04070f]/52 to-transparent px-3 pt-10 pb-[max(0.85rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-5">
          <div className="pointer-events-auto mx-auto flex max-w-4xl flex-col gap-2">
            <div className="flex flex-wrap items-end justify-between gap-2 px-1">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#cfd9e8]/80">
                  <span className="font-medium text-[#f2cf88]">{uploaderDisplay}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatViDate(photo.taken_at || photo.created_at)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{primaryCollection}</span>
                </div>
                <h2 className="font-display mt-0.5 truncate text-lg font-normal text-white sm:text-xl">
                  {photo.title}
                </h2>
              </div>

              {latestVisibleComment && !commentsOpen && (
                <button
                  type="button"
                  onClick={() => openAndFocusComments()}
                  className="liquid-glass-subtle glass-press hidden max-w-[310px] cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.5 text-left text-xs text-[#f7f1e5] transition-colors hover:border-[#f2cf88]/60 md:flex"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0 text-[#f2cf88]" />
                  <span className="truncate">
                    <strong className="font-semibold text-[#f2cf88]">
                      {latestVisibleComment.author_name}:
                    </strong>{' '}
                    {latestVisibleComment.body}
                  </span>
                </button>
              )}
            </div>

            {/* Dual-Access Reaction + Prominent Comment Bar */}
            <div className="flex w-full justify-center">
              <div className="liquid-glass no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto rounded-full px-2 py-1.5 sm:gap-1.5 sm:px-3">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {REACTION_META.map((r) => {
                    const count = photoReactions[r.key] || 0;
                    const chosen = myReactions[photo.id] === r.key;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        title={r.label}
                        aria-label={`${r.label}${count > 0 ? ` (${count})` : ''}`}
                        onClick={() => void handleReactClick(r.key)}
                        disabled={isSubmittingReaction || Boolean(myReactions[photo.id])}
                        className={`glass-press flex min-h-[40px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-all hover:-translate-y-0.5 hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-55 ${
                          chosen
                            ? 'bg-white/16 font-semibold text-[#f2cf88]'
                            : 'text-[#f5efe4]/90'
                        }`}
                      >
                        <ReactionIcon kind={r.key} />
                        <span className="hidden text-[11.5px] font-medium lg:inline">
                          {r.label}
                        </span>
                        {count > 0 && (
                          <span className="font-mono-tabular text-[11.5px] font-semibold text-[#f2cf88]">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <span
                  aria-hidden="true"
                  className="mx-0.5 h-6 w-px shrink-0 bg-white/20 sm:mx-1"
                />

                <button
                  type="button"
                  onClick={() => openAndFocusComments()}
                  aria-expanded={commentsOpen}
                  aria-label={`Mở bình luận (${allComments.length})`}
                  className="glass-press flex min-h-[42px] shrink-0 cursor-pointer items-center gap-2 rounded-full bg-[#f2cf88] px-4 py-1.5 text-xs font-semibold whitespace-nowrap text-[#142038] shadow-[0_6px_22px_rgba(242,207,136,0.38)] transition-all hover:bg-[#f7dc9f]"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <span>Bình luận</span>
                  <span className="font-mono-tabular rounded-full bg-[#142038]/15 px-1.5 py-0.5 text-[11px]">
                    {allComments.length}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacious, Distraction-Free Comment Sheet (Name + Comment Body Only, Maximum Mobile Space) */}
      <AnimatePresence>
        {commentsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCommentsOpen(false)}
              className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px]"
              aria-hidden="true"
            />

            <motion.aside
              initial={{ y: '100%', opacity: 0.85 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.7 }}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
              aria-label="Khung bình luận ảnh"
              style={
                commentViewport
                  ? {
                      height: `${commentViewport.height}px`,
                      maxHeight: `${commentViewport.height}px`,
                      top: `${commentViewport.top}px`,
                    }
                  : undefined
              }
              className="fixed inset-0 z-40 isolate flex max-h-dvh flex-col overflow-hidden bg-[#121a29] text-[#eef2f8] shadow-[0_24px_80px_rgba(0,0,0,0.72)] sm:inset-y-3 sm:right-3 sm:left-auto sm:max-h-[calc(100dvh-1.5rem)] sm:w-[min(92vw,520px)] sm:rounded-[26px] sm:border sm:border-white/20 lg:w-[520px]"
            >
              {/* Minimal Comment Sheet Header — Full Mobile Screen Height & Zero Clutter */}
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5 sm:px-5 sm:py-3.5">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-base font-semibold text-white">Bình luận</h3>
                    <span className="font-mono-tabular text-xs font-medium text-[#f2cf88]">
                      {allComments.length}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#9fb0c9]">
                    {photo.title}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setCommentsOpen(false);
                  }}
                  aria-label="Đóng khung bình luận"
                  className="glass-press flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/8 text-white hover:bg-white/18"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Spacious Scrollable Comment List (Author Name + Comment Content) */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3.5 py-4 sm:px-5 sm:py-5">
                {topComments.length === 0 ? (
                  <div className="flex h-full min-h-[180px] flex-col items-center justify-center px-4 text-center">
                    <MessageCircle
                      className="h-7 w-7 text-[#f2cf88]/55"
                      aria-hidden="true"
                    />
                    <p className="mt-2.5 text-[15px] font-medium text-[#e4ebf5]">
                      Chưa có bình luận nào
                    </p>
                    <p className="mt-1 text-xs text-[#9fb0c9]">
                      Viết tên và cảm nghĩ của cậu về khoảnh khắc này nhé.
                    </p>
                  </div>
                ) : (
                  topComments.map((c) => {
                    const isLocked = Boolean(c.unlock_date && c.unlock_date > todayIso);
                    const replies = repliesByParent[c.id] || [];
                    return (
                      <div key={c.id} className="space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <div
                            aria-hidden="true"
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${getAvatarGradient(
                              c.author_name
                            )}`}
                          >
                            {getInitials(c.author_name)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="rounded-2xl bg-[#1e283c] px-4 py-3 shadow-xs">
                              <p className="text-[14px] font-semibold text-[#f2cf88]">
                                {c.author_name}
                              </p>
                              {isLocked ? (
                                <div className="mt-1.5 flex items-center gap-2 text-[13.5px] text-[#f9e5b8]">
                                  <Lock className="h-3.5 w-3.5 shrink-0" />
                                  <span>
                                    Hộp thời gian 10B4 · Hẹn mở ngày {formatViDate(c.unlock_date)}
                                  </span>
                                </div>
                              ) : (
                                <p className="mt-1 text-[15px] leading-[1.55] break-words whitespace-pre-wrap text-[#f5f8fd]">
                                  {c.body}
                                </p>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-4 px-2 text-[12px] text-[#9fb0c9]">
                              <span>
                                {formatRelativeViTime(c.created_at) || formatViDate(c.created_at)}
                              </span>
                              {!isLocked && (
                                <button
                                  type="button"
                                  onClick={() => openAndFocusComments(c)}
                                  className="inline-flex cursor-pointer items-center gap-1 font-medium text-[#cbd6e8] hover:text-[#f2cf88] hover:underline"
                                >
                                  <Reply className="h-3 w-3" />
                                  <span>Trả lời</span>
                                </button>
                              )}
                              {canManage && onModerateComment && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic('light');
                                    onModerateComment(photo.id, c.id, 'delete');
                                  }}
                                  className="cursor-pointer font-medium text-[#e69b94] hover:text-[#ffb4ad] hover:underline"
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {replies.length > 0 && (
                          <div className="ml-5 space-y-2.5 border-l border-white/12 pl-2.5 sm:ml-10 sm:pl-3">
                            {replies.map((rep) => {
                              const replyLocked = Boolean(
                                rep.unlock_date && rep.unlock_date > todayIso
                              );
                              return (
                                <div key={rep.id} className="flex items-start gap-2.5">
                                  <div
                                    aria-hidden="true"
                                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white ${getAvatarGradient(
                                      rep.author_name
                                    )}`}
                                  >
                                    {getInitials(rep.author_name)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="rounded-2xl bg-[#1a2334] px-3.5 py-2.5">
                                      <p className="text-[13.5px] font-semibold text-[#f2cf88]">
                                        {rep.author_name}
                                      </p>
                                      {replyLocked ? (
                                        <div className="mt-1 flex items-center gap-2 text-[13px] text-[#f9e5b8]">
                                          <Lock className="h-3.5 w-3.5 shrink-0" />
                                          <span>
                                            Hộp thời gian 10B4 · Hẹn mở ngày{' '}
                                            {formatViDate(rep.unlock_date)}
                                          </span>
                                        </div>
                                      ) : (
                                        <p className="mt-0.5 text-[14.5px] leading-[1.5] break-words whitespace-pre-wrap text-[#f1f5fb]">
                                          {rep.body}
                                        </p>
                                      )}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-3.5 px-2 text-[11.5px] text-[#9fb0c9]">
                                      <span>
                                        {formatRelativeViTime(rep.created_at) ||
                                          formatViDate(rep.created_at)}
                                      </span>
                                      {!replyLocked && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openAndFocusComments(c, rep.author_name)
                                          }
                                          className="cursor-pointer font-medium text-[#cbd6e8] hover:text-[#f2cf88] hover:underline"
                                        >
                                          Trả lời
                                        </button>
                                      )}
                                      {canManage && onModerateComment && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            triggerHaptic('light');
                                            onModerateComment(photo.id, rep.id, 'delete');
                                          }}
                                          className="cursor-pointer font-medium text-[#e69b94] hover:text-[#ffb4ad] hover:underline"
                                        >
                                          Xóa
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={commentFeedEndRef} />
              </div>

              {/* Comfortable Comment Composer: full-width fields and generous touch targets */}
              <form
                onSubmit={handleSubmitComment}
                className="shrink-0 space-y-2.5 border-t border-white/12 bg-[#0c1320] px-3.5 pt-3 pb-[max(0.8rem,env(safe-area-inset-bottom))] sm:px-4 sm:pt-3.5 sm:pb-4"
              >
                {replyTo && (
                  <div className="flex items-center justify-between rounded-xl bg-[#1e283c] px-3 py-1.5 text-xs text-[#f2cf88]">
                    <span className="truncate">
                      Đang trả lời <strong>{replyTo.author_name}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setReplyTo(null);
                      }}
                      className="cursor-pointer font-medium text-white/75 hover:text-white"
                    >
                      Hủy
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div
                    aria-hidden="true"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${getAvatarGradient(
                      authorName || '10B4'
                    )}`}
                  >
                    {getInitials(authorName || '10B4')}
                  </div>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    maxLength={40}
                    required
                    aria-label="Tên của cậu"
                    placeholder="Tên của cậu..."
                    className="min-h-[46px] min-w-0 flex-1 rounded-full border border-white/15 bg-[#1b2436] px-4 py-2 text-base text-white placeholder:text-[#9fb0c9]/75 focus:border-[#f2cf88] focus:outline-none sm:text-[15px]"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <textarea
                    ref={commentInputRef}
                    rows={2}
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    disabled={isSubmittingComment}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void submitCommentNow();
                      }
                    }}
                    maxLength={600}
                    required
                    aria-label="Nội dung bình luận"
                    placeholder={
                      replyTo
                        ? `Trả lời ${replyTo.author_name}...`
                        : 'Viết bình luận...'
                    }
                    className="max-h-32 min-h-[64px] min-w-0 flex-1 resize-none overflow-y-auto rounded-2xl border border-white/15 bg-[#1b2436] px-3.5 py-3 text-base leading-relaxed text-white placeholder:text-[#9fb0c9]/75 focus:border-[#f2cf88] focus:outline-none sm:text-[15px]"
                  />

                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    aria-label={isSubmittingComment ? 'Đang gửi bình luận' : 'Gửi bình luận'}
                    className="glass-press flex h-12 min-w-12 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-[#f2cf88] px-3.5 text-xs font-semibold text-[#142038] shadow-[0_6px_18px_rgba(242,207,136,0.3)] transition-colors hover:bg-[#f7dc9f] disabled:cursor-wait disabled:opacity-65"
                  >
                    <Send className="h-4 w-4 shrink-0" />
                    <span className="hidden min-[360px]:inline">
                      {isSubmittingComment ? 'Đang gửi...' : 'Gửi'}
                    </span>
                  </button>
                </div>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
