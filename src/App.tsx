import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { CHAPTERS, COLLECTIONS } from './data/chapters';
import {
  ChapterAudioTrack,
  ChapterId,
  MemoryComment,
  MemoryPhoto,
  PhotoReactions,
  ReactionKey,
  SupabaseRuntimeConfig,
  YearbookStage,
} from './types/memory';
import { ambientAudio } from './utils/ambientAudio';
import {
  deleteChapterAudio,
  deletePhotoFromVault,
  emptyReactions,
  loadAllChapterAudio,
  loadAllComments,
  loadAllReactions,
  loadAllStoredPhotos,
  loadAudioPref,
  makeId,
  saveAllComments,
  saveAllReactions,
  saveAudioPref,
  saveChapterAudio,
  updatePhotoMetadataInVault,
} from './utils/storage';
import {
  clearCloudConfig,
  CuratorSessionState,
  migrateLegacyVaultArchiveToCloud,
  deleteCloudChapterAudio,
  deleteCloudPhoto,
  fetchCloudReactionCounts,
  fetchCloudSnapshot,
  getCuratorSession,
  incrementCloudReaction,
  isCloudConfigured,
  moderateCloudComment,
  reorderCloudYearbook,
  saveCloudConfig,
  setCloudYearbookStage,
  signInCurator,
  signOutCurator,
  submitCloudComment,
  subscribeCloudChanges,
  updateCloudPhotoMetadata,
  uploadCloudChapterAudio,
} from './utils/supabaseCloud';
import {
  buildTimeBuckets,
  getTimeKeyForPhoto,
  TimeFilterMode,
} from './utils/timeFilter';
import { triggerHaptic } from './utils/haptics';
import { Header } from './components/Header';
import { JourneyStage } from './components/JourneyStage';
import { FilmRibbon } from './components/FilmRibbon';
import { PhotoViewerModal } from './components/PhotoViewerModal';
import { CinemaModeModal } from './components/CinemaModeModal';
import { CuratorDrawer, CuratorTabId } from './components/CuratorDrawer';
import { YearbookPreviewModal } from './components/YearbookPreviewModal';
import { RightTimelineSlider } from './components/RightTimelineSlider';

export default function App() {
  const [cloudConfigured, setCloudConfigured] = useState<boolean>(() => isCloudConfigured());
  const [curatorSession, setCuratorSession] = useState<CuratorSessionState>({
    userId: null,
    email: null,
    isCurator: false,
  });
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [cloudConnectionRevision, setCloudConnectionRevision] = useState(0);

  const [photos, setPhotos] = useState<MemoryPhoto[]>([]);
  const [customTracks, setCustomTracks] = useState<
    Partial<Record<ChapterId, ChapterAudioTrack>>
  >({});
  const [commentsMap, setCommentsMap] = useState<Record<string, MemoryComment[]>>(() =>
    isCloudConfigured() ? {} : loadAllComments()
  );
  const [reactionsMap, setReactionsMap] = useState<Record<string, PhotoReactions>>(() =>
    isCloudConfigured() ? {} : loadAllReactions()
  );

  const [activeChapter, setActiveChapter] = useState<ChapterId>('everyday');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilterMode, setTimeFilterMode] = useState<TimeFilterMode>('semester');
  const [selectedTimeKey, setSelectedTimeKey] = useState<string>('all');

  // Optional background audio state (Vietnamese Piano, Violin, Lo-fi + custom MP3)
  const initialAudioPref = useMemo(() => loadAudioPref(), []);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState<number>(initialAudioPref.volume);
  const [rainEnabled, setRainEnabled] = useState<boolean>(initialAudioPref.rainEnabled);

  // Overlays
  const [viewerPhotoId, setViewerPhotoId] = useState<string | null>(null);
  const [cinemaOpen, setCinemaOpen] = useState(false);
  const [curatorOpen, setCuratorOpen] = useState(false);
  const [curatorTab, setCuratorTab] = useState<CuratorTabId>('upload');
  const [curatorChapter, setCuratorChapter] = useState<ChapterId>('everyday');
  const [yearbookOpen, setYearbookOpen] = useState(false);

  const [toastMsg, setToastMsg] = useState('');

  const canManage = !cloudConfigured || curatorSession.isCurator;

  const showToast = useCallback((message: string) => {
    setToastMsg(message);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(''), 3200);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const loadAppData = useCallback(async (): Promise<boolean> => {
    const useCloud = isCloudConfigured();
    setCloudConfigured(useCloud);

    if (useCloud) {
      setCloudSyncing(true);
      try {
        const [snapshot, session] = await Promise.all([
          fetchCloudSnapshot(),
          getCuratorSession(),
        ]);
        setPhotos(snapshot.photos);
        setCommentsMap(snapshot.commentsMap);
        setReactionsMap(snapshot.reactionsMap);
        setCustomTracks(snapshot.customTracks);
        ambientAudio.setCustomTracks(snapshot.customTracks);
        setCuratorSession(session);
        return true;
      } catch (err) {
        showToast(
          err instanceof Error
            ? `Chưa tải được dữ liệu Cloud: ${err.message}`
            : 'Chưa tải được dữ liệu từ Cloud.'
        );
        return false;
      } finally {
        setCloudSyncing(false);
      }
    }

    const [loadedPhotos, loadedAudio] = await Promise.all([
      loadAllStoredPhotos(),
      loadAllChapterAudio(),
    ]);
    setPhotos(loadedPhotos);
    setCustomTracks(loadedAudio);
    ambientAudio.setCustomTracks(loadedAudio);
    setCommentsMap(loadAllComments());
    setReactionsMap(loadAllReactions());
    setCuratorSession({ userId: null, email: null, isCurator: false });
    return true;
  }, [showToast]);

  useEffect(() => {
    void loadAppData();
  }, [loadAppData]);

  // Subscribe to Postgres Changes so other devices see new comments, reactions,
  // photos, yearbook changes and chapter audio without reloading the page.
  useEffect(() => {
    if (!cloudConfigured) return;
    return subscribeCloudChanges(
      (snapshot) => {
        setPhotos(snapshot.photos);
        setCommentsMap(snapshot.commentsMap);
        setReactionsMap(snapshot.reactionsMap);
        setCustomTracks(snapshot.customTracks);
        ambientAudio.setCustomTracks(snapshot.customTracks);
      },
      (error) => {
        console.warn('Memoryverse Realtime update failed:', error);
      }
    );
  }, [cloudConfigured, cloudConnectionRevision]);

  // Keep chapter music synchronized when user swipes or navigates
  useEffect(() => {
    ambientAudio.setChapter(activeChapter);
  }, [activeChapter]);

  // Global keyboard arrow navigation between chapters when no modal is open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (viewerPhotoId || cinemaOpen || curatorOpen || yearbookOpen) return;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target && (target.matches('input, textarea, select') || target.isContentEditable);
      if (isTyping) return;

      const idx = CHAPTERS.findIndex((c) => c.id === activeChapter);
      if (e.key === 'ArrowRight' && idx < CHAPTERS.length - 1) {
        triggerHaptic('selection');
        setActiveChapter(CHAPTERS[idx + 1].id);
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        triggerHaptic('selection');
        setActiveChapter(CHAPTERS[idx - 1].id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeChapter, viewerPhotoId, cinemaOpen, curatorOpen, yearbookOpen]);

  // Map photos into the 6 chapters
  const chapterPhotosMap = useMemo(() => {
    const sorted = [...photos].sort((a, b) =>
      String(b.taken_at || b.created_at).localeCompare(String(a.taken_at || a.created_at))
    );

    const map: Record<ChapterId, MemoryPhoto[]> = {
      everyday: [],
      chaos: [],
      milestones: [],
      people: [],
      details: [],
      yearbook: [],
    };

    for (const p of sorted) {
      const colSpaces = new Set(
        p.collectionIds
          .map((cid) => COLLECTIONS.find((c) => c.id === cid)?.space)
          .filter(Boolean) as ChapterId[]
      );

      if (colSpaces.has('everyday')) map.everyday.push(p);
      if (colSpaces.has('chaos')) map.chaos.push(p);
      if (colSpaces.has('milestones')) map.milestones.push(p);
      if (colSpaces.has('people')) map.people.push(p);
      if (colSpaces.has('details')) map.details.push(p);
      if (p.is_yearbook_pick || p.yearbook_pick_type || colSpaces.has('yearbook')) {
        map.yearbook.push(p);
      }
    }

    return map;
  }, [photos]);

  const basePhotosForRibbon = useMemo(() => {
    const trimmed = searchTerm.trim().toLocaleLowerCase('vi');
    if (!trimmed) {
      return chapterPhotosMap[activeChapter];
    }

    return [...photos]
      .filter((p) => {
        const albumNames = p.collectionIds
          .map((id) => COLLECTIONS.find((c) => c.id === id)?.title || '')
          .join(' ');
        const haystack = [p.title, p.caption, ...p.tags, albumNames]
          .join(' ')
          .toLocaleLowerCase('vi');
        return haystack.includes(trimmed);
      })
      .sort((a, b) =>
        String(b.taken_at || b.created_at).localeCompare(String(a.taken_at || a.created_at))
      );
  }, [photos, chapterPhotosMap, activeChapter, searchTerm]);

  const timeBuckets = useMemo(
    () => buildTimeBuckets(basePhotosForRibbon, timeFilterMode),
    [basePhotosForRibbon, timeFilterMode]
  );

  // Reset time filter when switching chapters
  useEffect(() => {
    setSelectedTimeKey('all');
  }, [activeChapter]);

  const visiblePhotos = useMemo(() => {
    if (selectedTimeKey === 'all') return basePhotosForRibbon;
    return basePhotosForRibbon.filter(
      (p) => getTimeKeyForPhoto(p, timeFilterMode) === selectedTimeKey
    );
  }, [basePhotosForRibbon, timeFilterMode, selectedTimeKey]);

  const finalYearbookPhotos = useMemo(() => {
    return photos
      .filter((p) => p.yearbook_pick_type === 'final')
      .sort((a, b) => (a.yearbook_order ?? 9999) - (b.yearbook_order ?? 9999));
  }, [photos]);

  const viewerPhotos = useMemo(() => {
    if (!viewerPhotoId) return [];
    const inVisible = visiblePhotos.some((p) => p.id === viewerPhotoId);
    return inVisible ? visiblePhotos : photos;
  }, [viewerPhotoId, visiblePhotos, photos]);

  const viewerIndex = useMemo(() => {
    if (!viewerPhotoId) return 0;
    const idx = viewerPhotos.findIndex((p) => p.id === viewerPhotoId);
    return idx >= 0 ? idx : 0;
  }, [viewerPhotoId, viewerPhotos]);

  const handleSelectChapter = (index: number) => {
    const safeIdx = Math.max(0, Math.min(CHAPTERS.length - 1, index));
    setSearchTerm('');
    setActiveChapter(CHAPTERS[safeIdx].id);
  };

  const handleToggleAudio = () => {
    if (audioPlaying) {
      ambientAudio.stop();
      setAudioPlaying(false);
    } else {
      ambientAudio.start(activeChapter, audioVolume, rainEnabled);
      setAudioPlaying(true);
    }
  };

  const handleVolumeChange = (val: number) => {
    setAudioVolume(val);
    saveAudioPref(val, rainEnabled);
    ambientAudio.setVolume(val);
    if (!audioPlaying && val > 0) {
      ambientAudio.start(activeChapter, val, rainEnabled);
      setAudioPlaying(true);
    }
  };

  const handleToggleRain = () => {
    const next = !rainEnabled;
    setRainEnabled(next);
    saveAudioPref(audioVolume, next);
    ambientAudio.setRainEnabled(next);
    showToast(next ? 'Đã bật tiếng mưa & cát-sét nhẹ.' : 'Đã tắt tiếng mưa nền.');
  };

  const handleUploadChapterAudio = async (chapterId: ChapterId, file: File) => {
    try {
      let track: ChapterAudioTrack;
      if (cloudConfigured) {
        if (!curatorSession.isCurator) {
          showToast('Cần đăng nhập Quản trị viên để tải nhạc lên Cloud.');
          return;
        }
        track = await uploadCloudChapterAudio(chapterId, file);
      } else {
        track = await saveChapterAudio(chapterId, file);
      }
      setCustomTracks((prev) => {
        const prevTrack = prev[chapterId];
        if (prevTrack?.url?.startsWith('blob:')) URL.revokeObjectURL(prevTrack.url);
        const next = { ...prev, [chapterId]: track };
        ambientAudio.setCustomTracks(next);
        return next;
      });
      showToast(`Đã gắn nhạc “${file.name}” cho chương này.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể lưu tệp âm thanh này.');
    }
  };

  const handleResetChapterAudio = async (chapterId: ChapterId) => {
    try {
      if (cloudConfigured) {
        if (!curatorSession.isCurator) return;
        await deleteCloudChapterAudio(chapterId);
      } else {
        await deleteChapterAudio(chapterId);
      }
      setCustomTracks((prev) => {
        const prevTrack = prev[chapterId];
        if (prevTrack?.url?.startsWith('blob:')) URL.revokeObjectURL(prevTrack.url);
        const next = { ...prev };
        delete next[chapterId];
        ambientAudio.setCustomTracks(next);
        return next;
      });
      showToast('Đã chuyển lại nhạc Piano / Violin mặc định.');
    } catch {
      showToast('Không thể đặt lại nhạc nền mặc định.');
    }
  };

  const handlePreviewChapterAudio = (chapterId: ChapterId) => {
    setActiveChapter(chapterId);
    ambientAudio.start(chapterId, audioVolume, rainEnabled);
    setAudioPlaying(true);
  };

  const handleAddComment = async (
    photoId: string,
    authorName: string,
    body: string,
    parentId: string | null,
    requestId: string
  ): Promise<boolean> => {
    if (cloudConfigured) {
      try {
        const entry = await submitCloudComment(
          photoId,
          authorName,
          body,
          parentId,
          undefined,
          requestId
        );
        setCommentsMap((prev) => {
          const current = prev[photoId] || [];
          if (current.some((comment) => comment.id === entry.id)) return prev;
          return { ...prev, [photoId]: [...current, entry] };
        });
        return true;
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Không gửi được bình luận lên Cloud.'
        );
        return false;
      }
    }

    const entry: MemoryComment = {
      id: makeId(),
      photo_id: photoId,
      parent_id: parentId,
      author_name: authorName,
      body,
      created_at: new Date().toISOString(),
    };
    setCommentsMap((prev) => {
      const next = {
        ...prev,
        [photoId]: [...(prev[photoId] || []), entry],
      };
      saveAllComments(next);
      return next;
    });
    return true;
  };

  const handleReact = async (photoId: string, key: ReactionKey): Promise<ReactionKey | false> => {
    if (cloudConfigured) {
      try {
        const savedKey = await incrementCloudReaction(photoId, key);
        const counts = await fetchCloudReactionCounts();
        setReactionsMap(counts);
        if (savedKey !== key) {
          showToast('Lượt cảm xúc trước đó đã được ghi nhận; không cộng thêm lần nữa.');
        }
        return savedKey;
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Không thể đồng bộ cảm xúc lên Cloud.'
        );
        return false;
      }
    }

    setReactionsMap((prev) => {
      const current = prev[photoId] || emptyReactions();
      const next = {
        ...prev,
        [photoId]: { ...current, [key]: current[key] + 1 },
      };
      saveAllReactions(next);
      return next;
    });
    return key;
  };

  const handleSetYearbookStage = (photoId: string, stage: YearbookStage) => {
    if (!canManage) return;
    const maxOrder = Math.max(0, ...photos.map((p) => p.yearbook_order || 0));
    const nextOrder = stage === 'final' ? maxOrder + 1 : undefined;

    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId
          ? {
              ...p,
              is_yearbook_pick: Boolean(stage),
              yearbook_pick_type: stage,
              yearbook_order: nextOrder ?? p.yearbook_order,
            }
          : p
      )
    );

    if (cloudConfigured) {
      void setCloudYearbookStage(photoId, stage, nextOrder).catch(() =>
        showToast('Không thể cập nhật Kỷ yếu trên Cloud.')
      );
    } else {
      void updatePhotoMetadataInVault(photoId, {
        is_yearbook_pick: Boolean(stage),
        yearbook_pick_type: stage,
        ...(nextOrder ? { yearbook_order: nextOrder } : {}),
      });
    }

    if (stage === 'final') showToast('Đã đưa ảnh vào danh sách FINAL kỷ yếu.');
    else if (stage === 'candidate') showToast('Đã thêm vào danh sách ứng viên kỷ yếu.');
    else showToast('Đã bỏ ảnh khỏi kỷ yếu.');
  };

  const handleUpdatePhotoInfo = async (
    photoId: string,
    patch: { title: string; caption: string }
  ) => {
    if (!canManage) return;
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId
          ? { ...p, title: patch.title, caption: patch.caption }
          : p
      )
    );

    if (cloudConfigured) {
      try {
        await updateCloudPhotoMetadata(photoId, patch);
        showToast('Đã cập nhật thông tin ảnh trên Cloud.');
      } catch {
        showToast('Không thể cập nhật thông tin ảnh trên Cloud.');
      }
    } else {
      await updatePhotoMetadataInVault(photoId, patch);
      showToast('Đã lưu thay đổi thông tin ảnh.');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!canManage) return;
    const target = photos.find((p) => p.id === photoId);
    if (!target) return;

    // Advance viewer cleanly to neighboring photo before removing
    if (viewerPhotoId === photoId) {
      const idx = viewerPhotos.findIndex((p) => p.id === photoId);
      const nextList = viewerPhotos.filter((p) => p.id !== photoId);
      if (nextList.length === 0) {
        setViewerPhotoId(null);
      } else {
        const nextIdx = Math.min(idx, nextList.length - 1);
        setViewerPhotoId(nextList[nextIdx].id);
      }
    }

    if (cloudConfigured) {
      try {
        await deleteCloudPhoto(target);
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        showToast('Đã xóa ảnh gửi nhầm khỏi Cloud 10B4.');
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Không thể xóa ảnh trên Cloud.'
        );
      }
      return;
    }

    if (target.src.startsWith('blob:')) URL.revokeObjectURL(target.src);
    if (target.thumb.startsWith('blob:')) URL.revokeObjectURL(target.thumb);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    await deletePhotoFromVault(photoId);
    showToast('Đã xóa ảnh khỏi kho lưu trữ.');
  };

  const handleModerateComment = (
    photoId: string,
    commentId: string,
    action: 'hide' | 'show' | 'delete'
  ) => {
    if (!canManage) return;
    setCommentsMap((prev) => {
      const list = prev[photoId] || [];
      const updated =
        action === 'delete'
          ? list.filter((c) => c.id !== commentId)
          : list.map((c) =>
              c.id === commentId ? { ...c, is_hidden: action === 'hide' } : c
            );
      const next = { ...prev, [photoId]: updated };
      if (!cloudConfigured) {
        saveAllComments(next);
      }
      return next;
    });

    if (cloudConfigured) {
      void moderateCloudComment(commentId, action).catch(() =>
        showToast('Không thể cập nhật lời nhắn trên Cloud.')
      );
    }

    showToast(
      action === 'delete'
        ? 'Đã xóa lời nhắn.'
        : action === 'hide'
        ? 'Đã ẩn lời nhắn.'
        : 'Đã hiện lại lời nhắn.'
    );
  };

  const handleReorderYearbook = (photoId: string, direction: 'up' | 'down') => {
    if (!canManage) return;
    const idx = finalYearbookPhotos.findIndex((p) => p.id === photoId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= finalYearbookPhotos.length) return;

    const reordered = [...finalYearbookPhotos];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];

    const orderMap = new Map<string, number>();
    reordered.forEach((p, i) => orderMap.set(p.id, i + 1));

    setPhotos((prev) =>
      prev.map((p) =>
        orderMap.has(p.id) ? { ...p, yearbook_order: orderMap.get(p.id) } : p
      )
    );

    if (cloudConfigured) {
      void reorderCloudYearbook(
        reordered.map((p, i) => ({ photoId: p.id, order: i + 1 }))
      );
    } else {
      reordered.forEach((p, i) => {
        void updatePhotoMetadataInVault(p.id, { yearbook_order: i + 1 });
      });
    }
  };

  const handleSignInCurator = async (email: string, password: string) => {
    const session = await signInCurator(email, password);
    setCuratorSession(session);
    await loadAppData();
    showToast(`Chào mừng quản trị viên (${session.email})!`);
  };

  const handleSignOutCurator = async () => {
    await signOutCurator();
    setCuratorSession({ userId: null, email: null, isCurator: false });
    showToast('Đã đăng xuất chế độ Quản trị viên.');
  };

  const handleSaveCloudConfig = async (cfg: SupabaseRuntimeConfig) => {
    saveCloudConfig(cfg);
    setCloudConnectionRevision((value) => value + 1);
    const connected = await loadAppData();
    if (connected) {
      showToast('Đã kết nối thử Cloud trong tab này. Muốn dùng chung, hãy chép cấu hình vào public/config.js rồi triển khai lại.');
    }
  };

  const handleClearCloudConfig = async () => {
    clearCloudConfig();
    setCloudConnectionRevision((value) => value + 1);
    await loadAppData();
    showToast('Đã ngắt Cloud tạm thời trong tab này; tải lại trang sẽ dùng lại cấu hình public/config.js.');
  };

  const activeChapterTheme =
    CHAPTERS.find((c) => c.id === activeChapter) || CHAPTERS[0];

  return (
    <div id="top" className="relative min-h-screen overflow-x-hidden">
      {/* Crossfading Atmospheric Chapter Ambient Backdrop */}
      <div
        aria-hidden="true"
        className="no-print pointer-events-none fixed inset-0 -z-10 transition-all duration-1000 ease-out"
        style={{ background: activeChapterTheme.ambientBg }}
      />

      {/* Subtle 35mm Film Grain */}
      <div className="no-print film-grain" aria-hidden="true" />

      <Header
        activeChapter={activeChapter}
        searchTerm={searchTerm}
        cloudConfigured={cloudConfigured}
        isCurator={curatorSession.isCurator}
        onSelectChapter={handleSelectChapter}
        onSearchChange={setSearchTerm}
        onOpenCurator={() => {
          setCuratorChapter(activeChapter);
          setCuratorTab('upload');
          setCuratorOpen(true);
        }}
      />

      <main className="no-print relative z-10">
        <JourneyStage
          activeChapter={activeChapter}
          chapterPhotosMap={chapterPhotosMap}
          commentsMap={commentsMap}
          totalPhotoCount={photos.length}
          canManage={canManage}
          audioPlaying={audioPlaying}
          audioVolume={audioVolume}
          rainEnabled={rainEnabled}
          customTracks={customTracks}
          onSelectChapter={handleSelectChapter}
          onSyncChapterFromScroll={setActiveChapter}
          onOpenPhoto={(id) => setViewerPhotoId(id)}
          onOpenCuratorUpload={(chId) => {
            setCuratorChapter(chId);
            setCuratorTab('upload');
            setCuratorOpen(true);
          }}
          onOpenCinemaMode={() => setCinemaOpen(true)}
          onToggleAudio={handleToggleAudio}
          onVolumeChange={handleVolumeChange}
          onToggleRain={handleToggleRain}
          onOpenMusicSettings={() => {
            setCuratorChapter(activeChapter);
            setCuratorTab('audio');
            setCuratorOpen(true);
          }}
        />

        <FilmRibbon
          activeChapter={activeChapter}
          photos={basePhotosForRibbon}
          matchingCount={visiblePhotos.length}
          searchTerm={searchTerm}
          timeFilterMode={timeFilterMode}
          selectedTimeKey={selectedTimeKey}
          timeBuckets={timeBuckets}
          finalYearbookCount={finalYearbookPhotos.length}
          canManage={canManage}
          onChangeTimeFilterMode={(mode) => {
            setTimeFilterMode(mode);
            setSelectedTimeKey('all');
          }}
          onSelectTimeKey={setSelectedTimeKey}
          onOpenPhoto={(id) => setViewerPhotoId(id)}
          onOpenCuratorUpload={(chId) => {
            setCuratorChapter(chId);
            setCuratorTab('upload');
            setCuratorOpen(true);
          }}
          onOpenYearbookPreview={() => setYearbookOpen(true)}
        />
      </main>

      {!viewerPhotoId && !cinemaOpen && !curatorOpen && !yearbookOpen && (
        <RightTimelineSlider
          timeBuckets={timeBuckets}
          selectedTimeKey={selectedTimeKey}
          totalCount={basePhotosForRibbon.length}
          mode={timeFilterMode}
          onSelectTimeKey={setSelectedTimeKey}
        />
      )}

      <footer className="no-print relative z-10 mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-3 px-6 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-center text-xs text-[#d6dfee]/55">
        <span className="text-[#f2cf88]" aria-hidden="true">
          ✦
        </span>
        <span className="font-display italic">
          Những ngày ấy, chúng mình đã ở đây.
        </span>
        <span aria-hidden="true">·</span>
        <span className="tracking-[0.16em] uppercase">MEMORYVERSE · 10B4</span>
      </footer>

      {/* Facebook-Style Photo Viewer: Author, Photo Actions, Reactions & Always-Visible Comments */}
      <AnimatePresence>
        {viewerPhotoId && (
          <PhotoViewerModal
            isOpen={Boolean(viewerPhotoId)}
            photos={viewerPhotos}
            currentIndex={viewerIndex}
            commentsMap={commentsMap}
            reactionsMap={reactionsMap}
            canManage={canManage}
            onClose={() => setViewerPhotoId(null)}
            onNavigate={(nextIdx) => {
              const target = viewerPhotos[nextIdx];
              if (target) setViewerPhotoId(target.id);
            }}
            onAddComment={handleAddComment}
            onReact={handleReact}
            onSetYearbookStage={handleSetYearbookStage}
            onUpdatePhotoInfo={handleUpdatePhotoInfo}
            onDeletePhoto={handleDeletePhoto}
            onModerateComment={handleModerateComment}
            onOpenYearbookPreview={() => {
              setViewerPhotoId(null);
              setYearbookOpen(true);
            }}
            onToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* 35mm Cinema Reel Mode */}
      <AnimatePresence>
        {cinemaOpen && (
          <CinemaModeModal
            isOpen={cinemaOpen}
            photos={
              chapterPhotosMap[activeChapter].length > 0
                ? chapterPhotosMap[activeChapter]
                : photos
            }
            activeChapter={activeChapter}
            audioPlaying={audioPlaying}
            customTrack={customTracks[activeChapter]}
            onToggleAudio={handleToggleAudio}
            onClose={() => setCinemaOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Curator Upload, Delete, Music & Supabase Cloud Manager */}
      <AnimatePresence>
        {curatorOpen && (
          <CuratorDrawer
            isOpen={curatorOpen}
            initialTab={curatorTab}
            initialChapter={curatorChapter}
            photos={photos}
            commentsMap={commentsMap}
            customTracks={customTracks}
            cloudConfigured={cloudConfigured}
            curatorSession={curatorSession}
            cloudSyncing={cloudSyncing}
            onClose={() => setCuratorOpen(false)}
            onPhotosAdded={(newPhotos) =>
              setPhotos((prev) => [...newPhotos, ...prev])
            }
            onDeletePhoto={handleDeletePhoto}
            onSetYearbookStage={handleSetYearbookStage}
            onModerateComment={handleModerateComment}
            onUploadChapterAudio={handleUploadChapterAudio}
            onResetChapterAudio={handleResetChapterAudio}
            onPreviewChapterAudio={handlePreviewChapterAudio}
            onVaultImported={async () => { await loadAppData(); }}
            onMigrateLegacyVault={migrateLegacyVaultArchiveToCloud}
            onOpenYearbookPreview={() => setYearbookOpen(true)}
            onSignInCurator={handleSignInCurator}
            onSignOutCurator={handleSignOutCurator}
            onSaveCloudConfig={handleSaveCloudConfig}
            onClearCloudConfig={handleClearCloudConfig}
            onRefreshCloud={async () => { await loadAppData(); }}
            onToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* In-App A4 Yearbook Book & PDF Export */}
      <AnimatePresence>
        {yearbookOpen && (
          <YearbookPreviewModal
            isOpen={yearbookOpen}
            finalPhotos={finalYearbookPhotos}
            canManage={canManage}
            onReorder={handleReorderYearbook}
            onClose={() => setYearbookOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Subtle Liquid Glass Toast */}
      <AnimatePresence>
        {toastMsg && (
          <div
            role="status"
            aria-live="polite"
            className="no-print liquid-glass fixed bottom-5 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-full px-5 py-2.5 text-center text-xs font-medium text-[#fff9ef] shadow-2xl"
          >
            {toastMsg}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
