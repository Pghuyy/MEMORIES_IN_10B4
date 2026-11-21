import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Check,
  Cloud,
  Copy,
  Download,
  Eye,
  EyeOff,
  FolderUp,
  ImagePlus,
  KeyRound,
  LogOut,
  MessageSquare,
  Music,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { CHAPTERS, COLLECTIONS } from '../data/chapters';
import {
  ChapterAudioTrack,
  ChapterId,
  MemoryComment,
  MemoryPhoto,
  SupabaseRuntimeConfig,
  YearbookStage,
} from '../types/memory';
import {
  createThumbnailBlob,
  exportVaultArchive,
  formatViDate,
  importVaultArchive,
  loadUploaderName,
  makeId,
  savePhotoToVault,
  saveUploaderName,
  sha256Hex,
} from '../utils/storage';
import {
  CuratorSessionState,
  getCloudConfig,
  uploadPhotoToCloud,
  LegacyCloudMigrationSummary,
} from '../utils/supabaseCloud';
import { triggerHaptic } from '../utils/haptics';

export type CuratorTabId = 'upload' | 'audio' | 'manage' | 'comments' | 'cloud';

interface PendingUploadFile {
  file: File;
  previewUrl: string;
  title: string;
}

// Streamlined, merged chapter picker mapping directly to the underlying collection IDs
const STREAMLINED_CHAPTER_OPTIONS: {
  chapterId: ChapterId;
  index: string;
  label: string;
  hint: string;
  defaultCollectionId: string;
  subMoments: { id: string; label: string }[];
}[] = [
  {
    chapterId: 'everyday',
    index: '01',
    label: 'Đời thường',
    hint: 'Giờ học, ra chơi, tan trường, trực nhật',
    defaultCollectionId: 'c-everyday-2',
    subMoments: [
      { id: 'c-everyday-1', label: 'Trước lớp & Giờ học' },
      { id: 'c-everyday-3', label: 'Ra chơi & Sinh hoạt' },
      { id: 'c-everyday-4', label: 'Tan học rồi' },
    ],
  },
  {
    chapterId: 'chaos',
    index: '02',
    label: 'Chuyện khó đỡ',
    hint: 'Bị phạt vui, lỡ tay, biểu cảm, hậu trường',
    defaultCollectionId: 'c-chaos-2',
    subMoments: [
      { id: 'c-chaos-2', label: 'Pha khó đỡ & Biểu cảm' },
      { id: 'c-chaos-1', label: 'Kỷ luật vui & Hậu trường' },
    ],
  },
  {
    chapterId: 'milestones',
    index: '03',
    label: 'Dấu mốc',
    hint: 'Ngày đặc biệt, văn nghệ, hội thao, chuyến đi',
    defaultCollectionId: 'c-milestones-1',
    subMoments: [
      { id: 'c-milestones-1', label: 'Sự kiện & Sân khấu' },
      { id: 'c-milestones-3', label: 'Những chuyến đi' },
    ],
  },
  {
    chapterId: 'people',
    index: '04',
    label: 'Con người',
    hint: 'Chân dung, hội bạn thân, GVCN',
    defaultCollectionId: 'c-people-1',
    subMoments: [
      { id: 'c-people-1', label: 'Gương mặt thân quen' },
      { id: 'c-people-2', label: 'Hội bạn 10B4' },
    ],
  },
  {
    chapterId: 'details',
    index: '05',
    label: 'Điều nhỏ bé',
    hint: 'Góc lớp, đồ vật, mẩu giấy, nét chữ',
    defaultCollectionId: 'c-details-1',
    subMoments: [
      { id: 'c-details-1', label: 'Góc lớp & Đồ vật' },
      { id: 'c-details-2', label: 'Mẩu giấy & Nét chữ' },
    ],
  },
  {
    chapterId: 'yearbook',
    index: '06',
    label: 'Kỷ yếu',
    hint: 'Đưa thẳng vào danh sách chọn kỷ yếu',
    defaultCollectionId: 'c-yearbook-1',
    subMoments: [{ id: 'c-yearbook-1', label: 'Ảnh chọn kỷ yếu' }],
  },
];

interface CuratorDrawerProps {
  isOpen: boolean;
  initialTab?: CuratorTabId;
  initialChapter: ChapterId;
  photos: MemoryPhoto[];
  commentsMap: Record<string, MemoryComment[]>;
  customTracks: Partial<Record<ChapterId, ChapterAudioTrack>>;
  cloudConfigured: boolean;
  curatorSession: CuratorSessionState;
  cloudSyncing?: boolean;
  onClose: () => void;
  onPhotosAdded: (newPhotos: MemoryPhoto[]) => void;
  onDeletePhoto: (photoId: string) => void;
  onSetYearbookStage: (photoId: string, stage: YearbookStage) => void;
  onModerateComment: (
    photoId: string,
    commentId: string,
    action: 'hide' | 'show' | 'delete'
  ) => void;
  onUploadChapterAudio: (chapterId: ChapterId, file: File) => Promise<void>;
  onResetChapterAudio: (chapterId: ChapterId) => Promise<void>;
  onPreviewChapterAudio: (chapterId: ChapterId) => void;
  onVaultImported: () => Promise<void>;
  onMigrateLegacyVault: (file: File) => Promise<LegacyCloudMigrationSummary>;
  onOpenYearbookPreview: () => void;
  onSignInCurator: (email: string, password: string) => Promise<void>;
  onSignOutCurator: () => Promise<void>;
  onSaveCloudConfig: (cfg: SupabaseRuntimeConfig) => Promise<void>;
  onClearCloudConfig: () => Promise<void>;
  onRefreshCloud: () => Promise<void>;
  onToast: (msg: string) => void;
}

export const CuratorDrawer: React.FC<CuratorDrawerProps> = ({
  isOpen,
  initialTab = 'upload',
  initialChapter,
  photos,
  commentsMap,
  customTracks,
  cloudConfigured,
  curatorSession,
  cloudSyncing = false,
  onClose,
  onPhotosAdded,
  onDeletePhoto,
  onSetYearbookStage,
  onModerateComment,
  onUploadChapterAudio,
  onResetChapterAudio,
  onPreviewChapterAudio,
  onVaultImported,
  onMigrateLegacyVault,
  onOpenYearbookPreview,
  onSignInCurator,
  onSignOutCurator,
  onSaveCloudConfig,
  onClearCloudConfig,
  onRefreshCloud,
  onToast,
}) => {
  const [tab, setTab] = useState<CuratorTabId>(initialTab);
  const [pendingFiles, setPendingFiles] = useState<PendingUploadFile[]>([]);
  const [recentUploadedIds, setRecentUploadedIds] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<ChapterId[]>([initialChapter]);
  const [autoChapterDefault, setAutoChapterDefault] = useState(true);
  const [selectedSubMoments, setSelectedSubMoments] = useState<string[]>([]);
  const [takenDate, setTakenDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [uploaderName, setUploaderName] = useState(
    () =>
      loadUploaderName() ||
      (curatorSession.email ? curatorSession.email.split('@')[0] : '') ||
      ''
  );
  const [caption, setCaption] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [manageQuery, setManageQuery] = useState('');

  // Curator Login State (for Cloud mode)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  // Supabase Cloud Config Form State
  const [cloudUrlDraft, setCloudUrlDraft] = useState(() => getCloudConfig().supabaseUrl);
  const [cloudAnonDraft, setCloudAnonDraft] = useState(
    () => getCloudConfig().supabaseAnonKey
  );
  const [savingCloud, setSavingCloud] = useState(false);
  const [migratingLegacy, setMigratingLegacy] = useState(false);

  const importInputRef = useRef<HTMLInputElement | null>(null);
  const canManage = !cloudConfigured || curatorSession.isCurator;

  useEffect(() => {
    if (!isOpen) return;
    setTab(initialTab);
    setSelectedChapters([initialChapter]);
    setAutoChapterDefault(true);
    setSelectedSubMoments([]);
    const cfg = getCloudConfig();
    setCloudUrlDraft(cfg.supabaseUrl);
    setCloudAnonDraft(cfg.supabaseAnonKey);
  }, [isOpen, initialTab, initialChapter]);

  useEffect(() => {
    return () => {
      pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, [pendingFiles]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const filteredManagePhotos = useMemo(() => {
    const q = manageQuery.trim().toLocaleLowerCase('vi');
    if (!q) return photos;
    return photos.filter((p) => {
      const hay = `${p.title} ${p.caption} ${p.tags.join(' ')}`.toLocaleLowerCase('vi');
      return hay.includes(q);
    });
  }, [photos, manageQuery]);

  const recentUploadedPhotos = useMemo(
    () => photos.filter((p) => recentUploadedIds.includes(p.id)),
    [photos, recentUploadedIds]
  );

  if (!isOpen) return null;

  const handleSelectFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const valid = [...fileList].filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(f.type)
    );
    if (valid.length !== fileList.length) {
      onToast('Một số tệp không phải ảnh hợp lệ nên đã được bỏ qua.');
    }
    const mapped: PendingUploadFile[] = valid.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      title:
        file.name
          .replace(/\.[^.]+$/, '')
          .replace(/[_-]+/g, ' ')
          .trim()
          .slice(0, 140) || 'Khoảnh khắc 10B4',
    }));
    setPendingFiles((prev) => [...prev, ...mapped]);
  };

  const toggleChapter = (chapterId: ChapterId) => {
    setAutoChapterDefault(false);
    setSelectedChapters((prev) => {
      if (prev.includes(chapterId)) {
        const next = prev.filter((id) => id !== chapterId);
        const opt = STREAMLINED_CHAPTER_OPTIONS.find((o) => o.chapterId === chapterId);
        if (opt) {
          const ids = new Set(opt.subMoments.map((s) => s.id));
          setSelectedSubMoments((sm) => sm.filter((id) => !ids.has(id)));
        }
        return next;
      }
      return [...prev, chapterId];
    });
  };

  const toggleSmartChip = (collectionId: string, chapterId: ChapterId) => {
    triggerHaptic('selection');
    const wasDefaultAndEmpty = autoChapterDefault && selectedSubMoments.length === 0;
    setAutoChapterDefault(false);

    setSelectedSubMoments((prev) => {
      const isRemoving = prev.includes(collectionId);
      const next = isRemoving
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId];

      if (!isRemoving) {
        setSelectedChapters((chs) => {
          if (wasDefaultAndEmpty) return [chapterId];
          return chs.includes(chapterId) ? chs : [...chs, chapterId];
        });
      } else {
        const siblingIds = COLLECTIONS.filter(
          (c) => c.space === chapterId && c.id !== collectionId
        ).map((c) => c.id);
        const stillHasSibling = siblingIds.some((id) => next.includes(id));
        if (!stillHasSibling) {
          setSelectedChapters((chs) => chs.filter((id) => id !== chapterId));
        }
      }
      return next;
    });
  };

  const resolveCollectionIdsForUpload = (): string[] => {
    const result = new Set<string>(selectedSubMoments);
    for (const chId of selectedChapters) {
      const opt = STREAMLINED_CHAPTER_OPTIONS.find((o) => o.chapterId === chId);
      if (!opt) continue;
      const hasAnyFromChapter = COLLECTIONS.some(
        (c) => c.space === chId && selectedSubMoments.includes(c.id)
      );
      if (!hasAnyFromChapter) {
        result.add(opt.defaultCollectionId);
      }
    }
    return [...result];
  };

  const handleUpload = async () => {
    if (!pendingFiles.length) return;
    if (!canManage) {
      onToast('Vui lòng đăng nhập tài khoản Quản trị viên để tải ảnh lên Cloud.');
      return;
    }
    if (selectedChapters.length === 0 && selectedSubMoments.length === 0) {
      onToast('Hãy chạm chọn ít nhất một thẻ chủ đề hoặc chương cho ảnh nhé.');
      return;
    }

    const collectionIds = resolveCollectionIdsForUpload();
    const isDirectYearbook =
      selectedChapters.includes('yearbook') || selectedSubMoments.includes('c-yearbook-1');

    setUploading(true);
    setUploadProgress(0);

    const smartChipTags = COLLECTIONS.filter((c) => selectedSubMoments.includes(c.id)).map(
      (c) => c.title.toLocaleLowerCase('vi')
    );

    const parsedTags = [
      ...new Set([
        ...smartChipTags,
        ...tagsInput
          .split(',')
          .map((t) => t.trim().toLocaleLowerCase('vi'))
          .filter(Boolean),
      ]),
    ].slice(0, 12);

    const existingHashes = new Set(photos.map((p) => p.sha256).filter(Boolean));
    const added: MemoryPhoto[] = [];
    let skippedDup = 0;
    let firstError = '';

    for (let i = 0; i < pendingFiles.length; i++) {
      const item = pendingFiles[i];
      try {
        const hash = await sha256Hex(item.file);
        if (existingHashes.has(hash)) {
          skippedDup += 1;
          continue;
        }
        const thumb = await createThumbnailBlob(item.file);
        const title = item.title.trim() || 'Khoảnh khắc 10B4';

        const resolvedUploader =
          uploaderName.trim() ||
          (curatorSession.email ? curatorSession.email.split('@')[0] : '') ||
          'Ban quản trị 10B4';
        if (uploaderName.trim()) {
          saveUploaderName(uploaderName.trim());
        }

        let saved: MemoryPhoto;
        if (cloudConfigured && curatorSession.isCurator && curatorSession.userId) {
          saved = await uploadPhotoToCloud(
            item.file,
            thumb.blob,
            {
              title,
              caption: caption.trim(),
              taken_at: takenDate,
              collectionIds,
              tags: parsedTags,
              width: thumb.width,
              height: thumb.height,
              sha256: hash,
              isYearbookCandidate: isDirectYearbook,
              uploader_name: resolvedUploader,
            },
            curatorSession.userId
          );
        } else {
          saved = await savePhotoToVault(
            {
              id: makeId(),
              title,
              originalName: item.file.name,
              caption: caption.trim(),
              taken_at: takenDate,
              created_at: new Date().toISOString(),
              collectionIds,
              tags: parsedTags,
              width: thumb.width,
              height: thumb.height,
              sha256: hash,
              is_yearbook_pick: isDirectYearbook,
              yearbook_pick_type: isDirectYearbook ? 'candidate' : '',
              uploader_name: resolvedUploader,
            },
            item.file,
            thumb.blob
          );
        }

        existingHashes.add(hash);
        added.push(saved);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Lỗi tải ảnh.';
        if (!firstError) firstError = msg;
        if (msg.includes('đã có trên Cloud')) skippedDup += 1;
      }
      setUploadProgress(Math.round(((i + 1) / pendingFiles.length) * 100));
    }

    pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setPendingFiles([]);
    setCaption('');
    setTagsInput('');
    setUploading(false);

    if (added.length > 0) {
      triggerHaptic('success');
      onPhotosAdded(added);
      setRecentUploadedIds((prev) => [...added.map((a) => a.id), ...prev].slice(0, 8));
      onToast(
        cloudConfigured
          ? `Đã đăng ${added.length} ảnh lên Cloud — cả lớp 10B4 mở web là xem được ngay!`
          : skippedDup > 0
          ? `Đã lưu ${added.length} ảnh mới (bỏ qua ${skippedDup} ảnh trùng).`
          : `Đã lưu ${added.length} khung hình thật vào hành trình 10B4.`
      );
    } else if (skippedDup > 0) {
      onToast('Những ảnh này đã có trong kho ký ức rồi.');
    } else if (firstError) {
      onToast(firstError);
    }
  };

  const handleCuratorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) return;
    setSigningIn(true);
    try {
      await onSignInCurator(loginEmail.trim(), loginPassword);
      setLoginPassword('');
      triggerHaptic('success');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSaveCloudForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = cloudUrlDraft.trim().replace(/\/+$/, '');
    const key = cloudAnonDraft.trim();
    if (!url || !key) {
      onToast('Cần nhập đủ Supabase URL và Anon Key.');
      return;
    }
    setSavingCloud(true);
    try {
      await onSaveCloudConfig({
        supabaseUrl: url,
        supabaseAnonKey: key,
        storageBucket: 'memoryverse',
      });
      triggerHaptic('success');
    } finally {
      setSavingCloud(false);
    }
  };

  const handleCopyConfigSnippet = async () => {
    const snippet = `window.MEMORYVERSE_CONFIG = {\n  SUPABASE_URL: "${cloudUrlDraft.trim().replace(/\/+$/, '')}",\n  SUPABASE_ANON_KEY: "${cloudAnonDraft.trim()}",\n  STORAGE_BUCKET: "memoryverse"\n};`;
    try {
      await navigator.clipboard.writeText(snippet);
      triggerHaptic('light');
      onToast('Đã chép cấu hình public/config.js vào bộ nhớ tạm.');
    } catch {
      onToast('Hãy chọn và sao chép đoạn mã bên dưới nhé.');
    }
  };

  const handleExportVault = async () => {
    try {
      const blob = await exportVaultArchive();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memoryverse-10b4-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 15000);
      onToast('Đã xuất tệp sao lưu toàn bộ kho ảnh, nhạc & lời nhắn.');
    } catch {
      onToast('Không thể xuất bản sao lưu.');
    }
  };

  const handleImportVault = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (cloudConfigured) {
        if (!curatorSession.isCurator) {
          throw new Error('Hãy đăng nhập Quản trị viên trước khi chuyển dữ liệu lên Cloud.');
        }
        setMigratingLegacy(true);
        const result = await onMigrateLegacyVault(file);
        await onVaultImported();
        onToast(
          `Đã chuyển lên Cloud: ${result.photosUploaded} ảnh mới, ${result.commentsImported} lời nhắn, ${result.reactionsMerged} dòng bộ đếm cảm xúc đã hợp nhất, ${result.audioTracksUploaded} bản nhạc. ${result.photosAlreadyPresent} ảnh đã có sẵn.`
        );
      } else {
        const count = await importVaultArchive(file);
        await onVaultImported();
        onToast(`Đã khôi phục ${count} khung hình từ bản sao lưu.`);
      }
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Tệp sao lưu không hợp lệ.');
    } finally {
      setMigratingLegacy(false);
      e.target.value = '';
    }
  };

  const allFlatComments = Object.entries(commentsMap)
    .flatMap(([photoId, list]) =>
      list.map((c) => ({
        ...c,
        photoTitle: photos.find((p) => p.id === photoId)?.title || 'Ảnh đã lưu',
      }))
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const finalCount = photos.filter((p) => p.yearbook_pick_type === 'final').length;

  const renderCuratorAuthGate = () => (
    <div className="space-y-4 rounded-2xl border border-[#dfd5c1] bg-white p-5 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#14223d] text-[#f2cf88]">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-lg text-[#1a263d]">
            Đăng nhập Quản trị viên (10B4)
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[#5c677d]">
            Web đang dùng <strong>Supabase Cloud</strong>: mọi người mở link đều xem ảnh & gửi lời nhắn miễn phí không cần đăng nhập. Chỉ tài khoản Quản trị viên mới được tải ảnh, xóa ảnh gửi nhầm, gắn nhạc MP3 và kiểm duyệt.
          </p>
        </div>
      </div>

      <form onSubmit={handleCuratorLogin} className="space-y-3 pt-1">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475368]">
            Email Quản trị viên
          </label>
          <input
            type="email"
            required
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="admin10b4@example.com"
            className="min-h-[42px] w-full rounded-xl border border-[#dfd8c8] bg-[#faf6ee] px-3.5 py-2 text-xs text-[#1a263d] focus:border-[#14223d] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475368]">
            Mật khẩu
          </label>
          <input
            type="password"
            required
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="••••••••"
            className="min-h-[42px] w-full rounded-xl border border-[#dfd8c8] bg-[#faf6ee] px-3.5 py-2 text-xs text-[#1a263d] focus:border-[#14223d] focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={signingIn}
            className="min-h-[42px] flex-1 cursor-pointer rounded-full bg-[#14223d] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#1f345b] disabled:opacity-50"
          >
            {signingIn ? 'Đang xác thực...' : 'Đăng nhập Quản trị'}
          </button>
          <button
            type="button"
            onClick={() => setTab('cloud')}
            className="min-h-[42px] cursor-pointer rounded-full border border-[#d6ccb7] bg-[#faf6ee] px-4 py-2 text-xs font-medium text-[#1a263d] hover:bg-[#efe8da]"
          >
            Cài đặt Cloud
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#060c18]/78 p-0 backdrop-blur-lg sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: 18, scale: 0.985, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 12, scale: 0.985, opacity: 0 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        role="dialog"
        aria-modal="true"
        aria-label="Góc quản lý ảnh, Cloud và nhạc nền 10B4"
        className="flex h-dvh w-full max-w-3xl flex-col overflow-hidden bg-[#faf6ee] text-[#1a263d] shadow-[0_32px_100px_rgba(0,0,0,0.5)] sm:h-auto sm:max-h-[90dvh] sm:rounded-[28px]"
      >
        {/* Warm Twilight Header */}
        <div className="flex items-center justify-between bg-[#14223d] px-5 pt-[max(1.1rem,env(safe-area-inset-top))] pb-4 text-white sm:px-6 sm:py-5">
          <div className="min-w-0 pr-3">
            <p className="text-[11px] font-medium tracking-[0.2em] text-[#f2cf88] uppercase">
              Góc riêng của người lưu giữ
            </p>
            <h2 className="font-display mt-1 truncate text-xl font-normal sm:text-2xl">
              Lưu thêm
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            aria-label="Đóng quản lý"
            className="glass-press flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 sm:h-10 sm:w-10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Curator Sign-out Strip when logged in on Cloud */}
        {cloudConfigured && curatorSession.isCurator && (
          <div className="flex items-center justify-end border-b border-[#e5dfd2] bg-[#ece6d8] px-5 py-2 text-[11px] text-[#3a465c] sm:px-6">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                void onSignOutCurator();
              }}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#cfc5b0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#7a3b34] hover:bg-[#faf0ee]"
            >
              <LogOut className="h-3 w-3" />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}

        {/* Clean Tab Bar */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-b border-[#e5dfd2] bg-[#f4efe4] px-4 py-2.5 sm:gap-2 sm:px-6">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`inline-flex min-h-[38px] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              tab === 'upload'
                ? 'bg-[#14223d] text-white'
                : 'text-[#5c677d] hover:text-[#1a263d]'
            }`}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            <span>Thêm ảnh</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('manage')}
            className={`inline-flex min-h-[38px] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              tab === 'manage'
                ? 'bg-[#14223d] text-white'
                : 'text-[#5c677d] hover:text-[#1a263d]'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Kho ảnh & Xóa ({photos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('audio')}
            className={`inline-flex min-h-[38px] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              tab === 'audio'
                ? 'bg-[#14223d] text-white'
                : 'text-[#5c677d] hover:text-[#1a263d]'
            }`}
          >
            <Music className="h-3.5 w-3.5" />
            <span>Nhạc nền (6)</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('comments')}
            className={`inline-flex min-h-[38px] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              tab === 'comments'
                ? 'bg-[#14223d] text-white'
                : 'text-[#5c677d] hover:text-[#1a263d]'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Lời nhắn ({allFlatComments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('cloud')}
            className={`inline-flex min-h-[38px] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              tab === 'cloud'
                ? 'bg-[#14223d] text-[#f2cf88]'
                : cloudConfigured
                ? 'border border-[#c5d7cc] bg-[#e7f1eb] text-[#1b4f3a]'
                : 'text-[#5c677d] hover:text-[#1a263d]'
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>Cloud 10B4</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
          {tab === 'upload' && (
            <div className="space-y-5">
              {!canManage ? (
                renderCuratorAuthGate()
              ) : (
                <>
                  {/* Quick Undo / Delete Card right after uploading (if sent by mistake) */}
                  {recentUploadedPhotos.length > 0 && (
                    <div className="rounded-2xl border border-[#dfb4ae] bg-[#fdf1ef] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[#8c332a]">
                          Vừa tải lên {recentUploadedPhotos.length} ảnh — Gửi nhầm ảnh? Xóa nhanh tại đây:
                        </p>
                        <button
                          type="button"
                          onClick={() => setRecentUploadedIds([])}
                          className="cursor-pointer text-[11px] text-[#7a8496] hover:text-[#1a263d]"
                        >
                          Ẩn bớt
                        </button>
                      </div>
                      <div className="mt-2.5 space-y-2">
                        {recentUploadedPhotos.map((rp) => (
                          <div
                            key={rp.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-[#ebd2ce] bg-white p-2"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <img
                                src={rp.thumb || rp.src}
                                alt=""
                                className="h-10 w-10 shrink-0 rounded-lg object-cover"
                              />
                              <p className="truncate text-xs font-medium text-[#1a263d]">
                                {rp.title}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('medium');
                                onDeletePhoto(rp.id);
                                setRecentUploadedIds((prev) =>
                                  prev.filter((id) => id !== rp.id)
                                );
                              }}
                              className="inline-flex min-h-[36px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[#c94a41] px-3.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#b23c34]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Xóa ngay</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dropzone */}
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleSelectFiles(e.dataTransfer.files);
                    }}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-7 text-center transition-colors ${
                      isDragging
                        ? 'border-[#b9954e] bg-[#efe5cf]'
                        : 'border-[#d3c7ad] bg-[#f4efe3] hover:border-[#b39356]'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      multiple
                      onChange={(e) => handleSelectFiles(e.target.files)}
                      className="sr-only"
                    />
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6dac0] text-[#785e31]">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="mt-2.5 text-sm font-semibold text-[#1a263d]">
                      Thả ảnh thật của 10B4 vào đây hoặc chạm để chọn
                    </p>
                    <p className="mt-1 text-xs text-[#697489]">
                      JPG, PNG, WEBP, AVIF ·{' '}
                      {cloudConfigured
                        ? 'Đang lưu trực tiếp lên Supabase Cloud cho cả lớp xem'
                        : 'Đang lưu trên thiết bị này'}
                    </p>
                  </label>

                  {/* Pending Photos */}
                  {pendingFiles.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-[#5c677d]">
                        Đặt tên hiển thị cho từng bức ảnh ({pendingFiles.length})
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {pendingFiles.map((item, idx) => (
                          <div
                            key={item.previewUrl}
                            className="flex items-center gap-3 rounded-xl border border-[#e3dccb] bg-white p-2.5"
                          >
                            <img
                              src={item.previewUrl}
                              alt=""
                              className="h-16 w-16 shrink-0 rounded-lg bg-[#14223d] object-cover"
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <input
                                type="text"
                                value={item.title}
                                maxLength={140}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPendingFiles((prev) =>
                                    prev.map((p, i) => (i === idx ? { ...p, title: val } : p))
                                  );
                                }}
                                placeholder="Tên khoảnh khắc..."
                                className="w-full rounded-lg border border-[#dfd8c8] px-2.5 py-1.5 text-xs text-[#1a263d] focus:border-[#b39356] focus:outline-none"
                              />
                              <div className="flex items-center justify-between text-[11px] text-[#7a8496]">
                                <span>{(item.file.size / 1024 / 1024).toFixed(1)} MB</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    URL.revokeObjectURL(item.previewUrl);
                                    setPendingFiles((prev) =>
                                      prev.filter((_, i) => i !== idx)
                                    );
                                  }}
                                  className="cursor-pointer font-medium text-[#a8584f] hover:underline"
                                >
                                  Bỏ ảnh
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Streamlined 1-Tap Chapter Picker */}
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <label className="text-xs font-semibold text-[#475368]">
                        1. Chạm để chọn chương phù hợp (chọn được nhiều)
                      </label>
                      <span className="text-[11px] text-[#7a8496]">
                        Đã chọn {selectedChapters.length} chương
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {STREAMLINED_CHAPTER_OPTIONS.map((opt) => {
                        const active = selectedChapters.includes(opt.chapterId);
                        return (
                          <button
                            key={opt.chapterId}
                            type="button"
                            onClick={() => toggleChapter(opt.chapterId)}
                            className={`flex min-h-[56px] cursor-pointer items-start justify-between gap-2.5 rounded-xl border p-3 text-left transition-all ${
                              active
                                ? 'border-[#14223d] bg-[#14223d] text-white shadow-sm'
                                : 'border-[#e0d8c6] bg-white text-[#1a263d] hover:border-[#b9a67f]'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold">
                                <span
                                  className={`font-mono-tabular mr-1.5 ${
                                    active ? 'text-[#f2cf88]' : 'text-[#8e7444]'
                                  }`}
                                >
                                  {opt.index}
                                </span>
                                {opt.label}
                              </p>
                              <p
                                className={`mt-0.5 text-[11px] ${
                                  active ? 'text-[#d8e0ef]/85' : 'text-[#697489]'
                                }`}
                              >
                                {opt.hint}
                              </p>
                            </div>
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                active
                                  ? 'border-[#f2cf88] bg-[#f2cf88] text-[#14223d]'
                                  : 'border-[#cfc6b2]'
                              }`}
                            >
                              {active && <Check className="h-3 w-3" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Smart Tagging: All-Upfront 1-Tap Topic Chips into Albums */}
                    <div className="rounded-2xl border border-[#dfd5c1] bg-white p-4 shadow-xs">
                      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-[#8e7444]" />
                          <label className="text-xs font-semibold text-[#1a263d]">
                            2. Gắn thẻ thông minh — chạm chọn nhanh vào album
                          </label>
                        </div>
                        {selectedSubMoments.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setSelectedSubMoments([]);
                            }}
                            className="cursor-pointer text-[11px] font-medium text-[#8e7444] hover:underline"
                          >
                            Bỏ chọn ({selectedSubMoments.length})
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#7a8496]">
                            Tự động xếp đúng chương & gắn từ khóa
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        {CHAPTERS.map((ch) => {
                          const chCollections = COLLECTIONS.filter((c) => c.space === ch.id);
                          return (
                            <div key={ch.id} className="space-y-1.5">
                              <p className="text-[11px] font-medium text-[#6c778b]">
                                <span className="font-mono-tabular mr-1 text-[#8e7444]">
                                  {ch.index}.
                                </span>
                                {ch.title}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {chCollections.map((col) => {
                                  const checked = selectedSubMoments.includes(col.id);
                                  return (
                                    <button
                                      key={col.id}
                                      type="button"
                                      onClick={() => toggleSmartChip(col.id, col.space)}
                                      className={`glass-press inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all ${
                                        checked
                                          ? 'border-[#14223d] bg-[#14223d] font-medium text-[#f2cf88] shadow-xs'
                                          : 'border-[#ddd4c1] bg-[#faf6ee] text-[#323e54] hover:border-[#9e824d] hover:bg-[#f2ebdc]'
                                      }`}
                                    >
                                      {checked && <Check className="h-3 w-3 shrink-0" />}
                                      <span>{col.title}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Uploader, Date, Extra Tags, Caption */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#475368]">
                        Người đăng ảnh (hiển thị công khai)
                      </label>
                      <input
                        type="text"
                        value={uploaderName}
                        onChange={(e) => setUploaderName(e.target.value)}
                        maxLength={40}
                        placeholder="Ví dụ: Gia Huy · Lớp phó 10B4"
                        className="min-h-[40px] w-full rounded-xl border border-[#dfd8c8] bg-white px-3 py-2 text-xs text-[#1a263d]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#475368]">
                        Ngày chụp
                      </label>
                      <input
                        type="date"
                        value={takenDate}
                        onChange={(e) => setTakenDate(e.target.value)}
                        className="min-h-[40px] w-full rounded-xl border border-[#dfd8c8] bg-white px-3 py-2 text-xs text-[#1a263d]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#475368]">
                        Từ khóa thêm (tùy chọn — thẻ chip đã tự gắn)
                      </label>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="Ví dụ: tên bạn, tên thầy cô, tiết Toán..."
                        className="min-h-[40px] w-full rounded-xl border border-[#dfd8c8] bg-white px-3 py-2 text-xs text-[#1a263d]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#475368]">
                        Chú thích ngắn (không bắt buộc)
                      </label>
                      <input
                        type="text"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        maxLength={140}
                        placeholder="Ví dụ: Một buổi chiều nắng nhẹ cuối tiết năm..."
                        className="min-h-[40px] w-full rounded-xl border border-[#dfd8c8] bg-white px-3 py-2 text-xs text-[#1a263d]"
                      />
                    </div>
                  </div>

                  {uploading && (
                    <div className="space-y-1.5">
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#e6dfd1]">
                        <div
                          className="h-full bg-[#8e7444] transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#697489]">
                        {cloudConfigured
                          ? `Đang tải lên Cloud 10B4... ${uploadProgress}%`
                          : `Đang lưu vào kho ký ức... ${uploadProgress}%`}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={pendingFiles.length === 0 || uploading}
                    onClick={handleUpload}
                    className="min-h-[46px] w-full cursor-pointer rounded-full bg-[#14223d] px-5 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#1f345b] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {cloudConfigured ? 'Đăng ' : 'Lưu '}
                    {pendingFiles.length > 0 ? `${pendingFiles.length} ` : ''}ảnh vào MEMORYVERSE
                  </button>
                </>
              )}
            </div>
          )}

          {tab === 'audio' && (
            <div className="space-y-4">
              {!canManage ? (
                renderCuratorAuthGate()
              ) : (
                <>
                  <div className="rounded-2xl border border-[#e3dccb] bg-[#f4efe3] p-4">
                    <p className="text-xs font-semibold text-[#1a263d]">
                      Nhạc nền song song: Piano / Violin Việt Nam & File MP3 riêng
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#5c677d]">
                      Mỗi chương đã có sẵn một bản hòa tấu Piano, Violin hoặc Lo-fi Việt. Khi tải MP3 riêng lên{cloudConfigured ? ' Cloud' : ''}, cả lớp mở web qua từng chương đều nghe được đúng bài hát ấy.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {CHAPTERS.map((ch) => {
                      const custom = customTracks[ch.id];
                      return (
                        <div
                          key={ch.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e3dccb] bg-white p-3.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#1a263d]">
                              <span className="font-mono-tabular mr-1.5 text-[#8e7444]">
                                {ch.index}
                              </span>
                              {ch.title}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-[#5c677d]">
                              {custom ? (
                                <span className="font-medium text-[#1b4f3a]">
                                  MP3 riêng: {custom.fileName}
                                </span>
                              ) : (
                                <span>Mặc định: {ch.melodyName}</span>
                              )}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onPreviewChapterAudio(ch.id)}
                              className="min-h-[36px] cursor-pointer rounded-full border border-[#d6ccb7] bg-[#faf6ee] px-3 py-1.5 text-[11px] font-medium text-[#1a263d] hover:bg-[#efe8da]"
                            >
                              Nghe thử
                            </button>

                            <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full bg-[#14223d] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#1f345b]">
                              <Upload className="h-3 w-3" />
                              <span>{custom ? 'Đổi MP3' : 'Tải MP3'}</span>
                              <input
                                type="file"
                                accept="audio/mpeg,audio/mp3,audio/wav,audio/mp4,audio/aac,audio/ogg,audio/*"
                                className="sr-only"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    void onUploadChapterAudio(ch.id, file);
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </label>

                            {custom && (
                              <button
                                type="button"
                                onClick={() => void onResetChapterAudio(ch.id)}
                                title="Quay lại nhạc Piano / Violin mặc định"
                                className="inline-flex min-h-[36px] cursor-pointer items-center gap-1 rounded-full border border-[#ebd7d5] px-2.5 py-1.5 text-[11px] text-[#a8584f] hover:bg-[#f9ecea]"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Mặc định</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'manage' && (
            <div className="space-y-5">
              {/* Yearbook Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e3dccb] bg-white p-4">
                <div>
                  <p className="text-xs font-semibold text-[#1a263d]">
                    Biên tập Kỷ yếu 10B4 ({finalCount} ảnh FINAL)
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#697489]">
                    Chọn những tấm FINAL rồi xem & xuất bản in PDF ngay trong web.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenYearbookPreview();
                  }}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full bg-[#14223d] px-4 py-2 text-xs font-medium text-[#f2cf88] hover:bg-[#1f345b]"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Mở sách kỷ yếu</span>
                </button>
              </div>

              {!canManage ? (
                renderCuratorAuthGate()
              ) : (
                <>
                  {/* Offline backup or one-time migration into Supabase Cloud */}
                  {cloudConfigured ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d6e0d9] bg-[#eef5f0] p-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#1d3b2c]">
                          Chuyển kho dữ liệu cũ lên Cloud
                        </p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-[#42634f]">
                          Chọn tệp JSON đã xuất từ mục sao lưu ngoại tuyến trước khi bật Cloud. Ảnh, lời nhắn, cảm xúc tổng hợp và nhạc sẽ được nhập vào Supabase; các ảnh đã có sẽ được nhận diện để tránh tải trùng.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={migratingLegacy || !curatorSession.isCurator}
                          onClick={() => importInputRef.current?.click()}
                          className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full bg-[#1b5e43] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#164b36] disabled:cursor-wait disabled:opacity-50"
                        >
                          <FolderUp className="h-3.5 w-3.5" />
                          <span>{migratingLegacy ? 'Đang chuyển dữ liệu...' : 'Chọn tệp sao lưu cũ'}</span>
                        </button>
                        <input
                          ref={importInputRef}
                          type="file"
                          accept="application/json,.json"
                          onChange={handleImportVault}
                          className="sr-only"
                        />
                      </div>
                    </div>
                  ) : (
                    
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e3dccb] bg-[#f4efe3] p-4">
                      <div>
                        <p className="text-xs font-semibold text-[#1a263d]">
                          Sao lưu & Khôi phục kho ảnh, nhạc ngoại tuyến
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#697489]">
                          Xuất toàn bộ ảnh gốc, nhạc MP3 và bình luận ra tệp .json để giữ an toàn.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleExportVault}
                          disabled={
                            photos.length === 0 && Object.keys(customTracks).length === 0
                          }
                          className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full border border-[#cfc3aa] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1a263d] hover:bg-[#faf6ee] disabled:opacity-45"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Xuất sao lưu</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => importInputRef.current?.click()}
                          className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full border border-[#cfc3aa] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1a263d] hover:bg-[#faf6ee]"
                        >
                          <FolderUp className="h-3.5 w-3.5" />
                          <span>Nhập tệp</span>
                        </button>
                        <input
                          ref={importInputRef}
                          type="file"
                          accept="application/json"
                          onChange={handleImportVault}
                          className="sr-only"
                        />
                      </div>
                    </div>

                  )}

                  {/* Search bar inside Manage tab for quickly locating mistaken photos */}
                  {photos.length > 0 && (
                    <label className="flex min-h-[42px] items-center gap-2.5 rounded-xl border border-[#dfd8c8] bg-white px-3.5 py-2">
                      <Search className="h-4 w-4 text-[#7a8496]" />
                      <input
                        type="search"
                        value={manageQuery}
                        onChange={(e) => setManageQuery(e.target.value)}
                        placeholder="Tìm nhanh ảnh gửi nhầm hoặc ảnh cần chọn kỷ yếu..."
                        className="w-full min-w-0 bg-transparent text-xs text-[#1a263d] placeholder:text-[#8c95a6] focus:outline-none"
                      />
                    </label>
                  )}

                  {/* Photo Management List with Prominent Delete Action */}
                  {filteredManagePhotos.length === 0 ? (
                    <p className="py-8 text-center text-xs text-[#697489]">
                      {photos.length === 0
                        ? 'Kho ảnh hiện đang trống. Chuyển sang mục “Thêm ảnh” để tải ảnh lớp 10B4 lên nhé.'
                        : 'Không tìm thấy ảnh phù hợp với từ khóa.'}
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredManagePhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e3dccb] bg-white p-3"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <img
                              src={photo.thumb || photo.src}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-lg object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-[#1a263d]">
                                {photo.title}
                              </p>
                              <p className="text-[11px] text-[#7a8496]">
                                {formatViDate(photo.taken_at || photo.created_at)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                onSetYearbookStage(
                                  photo.id,
                                  photo.yearbook_pick_type === 'final' ? '' : 'final'
                                )
                              }
                              className={`min-h-[36px] cursor-pointer rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                                photo.yearbook_pick_type === 'final'
                                  ? 'bg-[#f2cf88] text-[#142038]'
                                  : 'border border-[#ddd5c4] text-[#5c677d] hover:border-[#8e7444]'
                              }`}
                            >
                              {photo.yearbook_pick_type === 'final'
                                ? '✓ FINAL'
                                : 'Chọn FINAL'}
                            </button>

                            {confirmDeleteId === photo.id ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic('medium');
                                    onDeletePhoto(photo.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="min-h-[36px] cursor-pointer rounded-full bg-[#c94a41] px-3.5 py-1 text-[11px] font-semibold text-white hover:bg-[#b23c34]"
                                >
                                  Xác nhận xóa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="min-h-[36px] cursor-pointer rounded-full border border-[#dfd8c8] px-3 py-1 text-[11px] text-[#5c677d]"
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic('light');
                                  setConfirmDeleteId(photo.id);
                                }}
                                aria-label={`Xóa ảnh ${photo.title}`}
                                className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border border-[#e9c8c4] bg-[#fdf2f1] px-3 py-1 text-[11px] font-semibold text-[#a84239] transition-colors hover:bg-[#fae2df]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Xóa ảnh</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'comments' && (
            <div className="space-y-3">
              {!canManage ? (
                renderCuratorAuthGate()
              ) : allFlatComments.length === 0 ? (
                <p className="py-10 text-center text-xs text-[#697489]">
                  Chưa có lời nhắn nào từ các bạn trong lớp.
                </p>
              ) : (
                allFlatComments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-[#e3dccb] bg-white p-3.5"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-[#1a263d]">
                        {c.author_name}{' '}
                        {c.is_hidden && (
                          <span className="font-normal text-[#a8584f]">· Đã ẩn</span>
                        )}
                      </span>
                      <span className="text-[11px] text-[#7a8496]">
                        {formatViDate(c.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#8e7444]">{c.photoTitle}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#384459]">
                      {c.body}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onModerateComment(
                            c.photo_id,
                            c.id,
                            c.is_hidden ? 'show' : 'hide'
                          )
                        }
                        className="inline-flex min-h-[36px] cursor-pointer items-center gap-1 rounded-full border border-[#dfd8c8] px-3 py-1 text-[11px] text-[#475368] hover:bg-[#f4efe3]"
                      >
                        {c.is_hidden ? (
                          <>
                            <Eye className="h-3 w-3" />
                            <span>Hiện lại</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            <span>Ẩn lời nhắn</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onModerateComment(c.photo_id, c.id, 'delete')}
                        className="inline-flex min-h-[36px] cursor-pointer items-center gap-1 rounded-full border border-[#ebd7d5] px-3 py-1 text-[11px] text-[#a8584f] hover:bg-[#f9ecea]"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'cloud' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#d6e0d9] bg-[#eef5f0] p-4 text-[#1d3b2c]">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1b5e43]" />
                  <div>
                    <p className="text-xs font-semibold">
                      Cơ sở Sub Cloud: Chỉ Quản trị tải ảnh — Ai mở web cũng xem được
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#2f5241]">
                      Ảnh, nhạc MP3 và lời nhắn lưu trên Supabase Storage & PostgreSQL. Khi bạn gắn cấu hình vào <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11px]">public/config.js</code> trước khi xuất bản web, mọi thành viên 10B4 mở link đều xem được ngay mà không cần đăng nhập.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#e8d7ad] bg-[#fff8e8] px-3.5 py-3 text-[11px] leading-relaxed text-[#6d5730]">
                Lưu ý: nút kết nối bên dưới chỉ tạo cấu hình thử trong tab hiện tại, không ghi cấu hình lên máy chủ. Để tất cả điện thoại và máy tính cùng dùng một Cloud, hãy chép đoạn <code className="rounded bg-white/80 px-1 font-mono">config.js</code> bên dưới vào tệp <code className="rounded bg-white/80 px-1 font-mono">public/config.js</code> của dự án rồi triển khai lại website.
              </div>

              <form
                onSubmit={handleSaveCloudForm}
                className="space-y-3.5 rounded-2xl border border-[#e3dccb] bg-white p-4 sm:p-5"
              >
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#475368]">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    required
                    value={cloudUrlDraft}
                    onChange={(e) => setCloudUrlDraft(e.target.value)}
                    placeholder="https://ten-du-an.supabase.co"
                    className="min-h-[42px] w-full rounded-xl border border-[#dfd8c8] bg-[#faf6ee] px-3.5 py-2 text-xs text-[#1a263d]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#475368]">
                    Supabase Anon Key (Publishable Key — an toàn cho trình duyệt)
                  </label>
                  <input
                    type="text"
                    required
                    value={cloudAnonDraft}
                    onChange={(e) => setCloudAnonDraft(e.target.value)}
                    placeholder="eyJhbGciOi..."
                    className="min-h-[42px] w-full rounded-xl border border-[#dfd8c8] bg-[#faf6ee] px-3.5 py-2 font-mono text-[11px] text-[#1a263d]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#475368]">
                    Storage Bucket (cố định theo chính sách bảo mật)
                  </label>
                  <input
                    type="text"
                    value="memoryverse"
                    readOnly
                    aria-readonly="true"
                    className="min-h-[42px] w-full rounded-xl border border-[#dfd8c8] bg-[#f0ecdf] px-3.5 py-2 text-xs text-[#1a263d]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={savingCloud}
                    className="min-h-[42px] cursor-pointer rounded-full bg-[#14223d] px-5 py-2 text-xs font-semibold text-white hover:bg-[#1f345b] disabled:opacity-50"
                  >
                    {savingCloud ? 'Đang kết nối...' : 'Kết nối thử trong tab này'}
                  </button>

                  {cloudConfigured && (
                    <>
                      <button
                        type="button"
                        disabled={cloudSyncing}
                        onClick={() => void onRefreshCloud()}
                        className="inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-full border border-[#cfc3aa] bg-white px-4 py-2 text-xs font-medium text-[#1a263d] hover:bg-[#faf6ee]"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${cloudSyncing ? 'animate-spin' : ''}`}
                        />
                        <span>Làm mới Cloud</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void onClearCloudConfig()}
                        className="min-h-[42px] cursor-pointer rounded-full border border-[#ebd7d5] px-4 py-2 text-xs font-medium text-[#a8584f] hover:bg-[#f9ecea]"
                      >
                        Ngắt kết nối
                      </button>
                    </>
                  )}
                </div>
              </form>

              {/* Deployable public/config.js snippet */}
              {cloudUrlDraft.trim() && cloudAnonDraft.trim() && (
                <div className="space-y-2 rounded-2xl border border-[#e3dccb] bg-[#f4efe3] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#1a263d]">
                      Mã dán vào <code className="font-mono">public/config.js</code> khi đưa web lên mạng
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleCopyConfigSnippet()}
                      className="inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-full bg-[#14223d] px-3 py-1 text-[11px] font-medium text-[#f2cf88]"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Chép config.js</span>
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-xl bg-[#14223d] p-3 font-mono text-[11px] leading-relaxed text-[#e8eef9]">
                    {`window.MEMORYVERSE_CONFIG = {\n  SUPABASE_URL: "${cloudUrlDraft.trim().replace(/\/+$/, '')}",\n  SUPABASE_ANON_KEY: "${cloudAnonDraft.trim()}",\n  STORAGE_BUCKET: "memoryverse"\n};`}
                  </pre>
                </div>
              )}

              {/* 4-Step Setup Guide */}
              <div className="space-y-2 rounded-2xl border border-[#e3dccb] bg-white p-4 text-xs leading-relaxed text-[#475368]">
                <p className="font-semibold text-[#1a263d]">
                  4 bước thiết lập Supabase Sub Cloud cho lớp 10B4:
                </p>
                <ol className="list-decimal space-y-1.5 pl-4">
                  <li>
                    Tạo dự án miễn phí tại <strong>supabase.com</strong>, mở{' '}
                    <strong>SQL Editor</strong> và chạy toàn bộ tệp{' '}
                    <code className="rounded bg-[#f4efe3] px-1 py-0.5 font-mono text-[11px]">
                      supabase/schema.sql
                    </code>{' '}
                    (đã tạo sẵn bảng, phân quyền công khai cho người xem & bucket{' '}
                    <code className="font-mono text-[11px]">memoryverse</code>).
                  </li>
                  <li>
                    Vào <strong>Authentication → Users → Add user</strong> để tạo 1 tài khoản cho quản trị viên (bạn), rồi chạy lệnh cuối trong{' '}
                    <code className="font-mono text-[11px]">schema.sql</code> để đặt{' '}
                    <code className="font-mono text-[11px]">role = &apos;curator&apos;</code>.
                  </li>
                  <li>
                    Lấy <strong>Project URL</strong> và <strong>Anon Key</strong> dán vào ô phía trên (hoặc ghi cố định vào{' '}
                    <code className="font-mono text-[11px]">public/config.js</code> trước khi xuất bản web).
                  </li>
                  <li>
                    Đăng nhập bằng tài khoản Quản trị trong mục <strong>Thêm ảnh</strong> để tải ảnh lớp lên. Từ đó bất kỳ ai mở trang web đều xem được ngay!
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
