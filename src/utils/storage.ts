import {
  ChapterAudioTrack,
  ChapterId,
  MemoryComment,
  MemoryPhoto,
  PhotoReactions,
  PhotoReport,
  ReactionKey,
  YearbookStage,
} from '../types/memory';

const DB_NAME = 'memoryverse_10b4_vault';
const DB_VERSION = 2;
const STORE_PHOTOS = 'photos';
const STORE_AUDIO = 'chapterAudio';
const COMMENTS_KEY = 'memoryverse_10b4_comments_v1';
const REACTIONS_KEY = 'memoryverse_10b4_reactions_v1';
const REPORTS_KEY = 'memoryverse_10b4_reports_v1';
const MY_REPORTED_PHOTOS_KEY = 'memoryverse_10b4_my_reported_photos_v1';
const AUDIO_PREF_KEY = 'memoryverse_10b4_audio_v2';
const COMMENTER_NAME_KEY = 'memoryverse_10b4_commenter_name_v1';
const UPLOADER_NAME_KEY = 'memoryverse_10b4_uploader_name_v1';

interface StoredPhotoRecord {
  id: string;
  title: string;
  originalName?: string;
  caption: string;
  taken_at: string;
  created_at: string;
  collectionIds: string[];
  tags: string[];
  width: number;
  height: number;
  sha256?: string;
  is_yearbook_pick: boolean;
  yearbook_pick_type: YearbookStage;
  yearbook_order?: number;
  uploader_name?: string;
  originalBlob: Blob;
  thumbBlob: Blob;
}

interface StoredAudioRecord {
  chapterId: ChapterId;
  fileName: string;
  updatedAt: string;
  audioBlob: Blob;
}

function openVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO, { keyPath: 'chapterId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function makeId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export async function sha256Hex(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function createThumbnailBlob(
  file: File,
  maxEdge = 1200
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Không thể khởi tạo canvas tạo ảnh thu nhỏ.'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve({ blob, width: img.naturalWidth, height: img.naturalHeight });
          } else {
            resolve({ blob: file, width: img.naturalWidth, height: img.naturalHeight });
          }
        },
        'image/webp',
        0.86
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không đọc được tệp ảnh này.'));
    };
    img.src = url;
  });
}

function recordToMemoryPhoto(record: StoredPhotoRecord): MemoryPhoto {
  return {
    id: record.id,
    title: record.title,
    originalName: record.originalName,
    caption: record.caption,
    taken_at: record.taken_at,
    created_at: record.created_at,
    collectionIds: record.collectionIds,
    tags: record.tags,
    width: record.width,
    height: record.height,
    sha256: record.sha256,
    is_yearbook_pick: record.is_yearbook_pick,
    yearbook_pick_type: record.yearbook_pick_type,
    yearbook_order: record.yearbook_order,
    uploader_name: record.uploader_name,
    src: URL.createObjectURL(record.originalBlob),
    thumb: URL.createObjectURL(record.thumbBlob),
  };
}

export async function loadAllStoredPhotos(): Promise<MemoryPhoto[]> {
  try {
    const db = await openVaultDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PHOTOS, 'readonly');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.getAll();
      req.onsuccess = () => {
        const rows = (req.result as StoredPhotoRecord[]) || [];
        resolve(rows.map(recordToMemoryPhoto));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function savePhotoToVault(
  meta: Omit<MemoryPhoto, 'src' | 'thumb'>,
  originalBlob: Blob,
  thumbBlob: Blob
): Promise<MemoryPhoto> {
  const db = await openVaultDB();
  const record: StoredPhotoRecord = {
    ...meta,
    originalBlob,
    thumbBlob,
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readwrite');
    tx.objectStore(STORE_PHOTOS).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return recordToMemoryPhoto(record);
}

export async function updatePhotoMetadataInVault(
  id: string,
  patch: Partial<
    Pick<
      MemoryPhoto,
      | 'title'
      | 'caption'
      | 'taken_at'
      | 'collectionIds'
      | 'tags'
      | 'is_yearbook_pick'
      | 'yearbook_pick_type'
      | 'yearbook_order'
    >
  >
): Promise<void> {
  const db = await openVaultDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readwrite');
    const store = tx.objectStore(STORE_PHOTOS);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result as StoredPhotoRecord | undefined;
      if (!existing) {
        resolve();
        return;
      }
      store.put({ ...existing, ...patch });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deletePhotoFromVault(id: string): Promise<void> {
  const db = await openVaultDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readwrite');
    tx.objectStore(STORE_PHOTOS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOriginalPhotoBlob(id: string): Promise<Blob | null> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readonly');
    const req = tx.objectStore(STORE_PHOTOS).get(id);
    req.onsuccess = () => {
      const rec = req.result as StoredPhotoRecord | undefined;
      resolve(rec?.originalBlob ?? null);
    };
    req.onerror = () => reject(req.error);
  });
}

// Per-chapter custom MP3 / audio persistence
export async function loadAllChapterAudio(): Promise<Partial<Record<ChapterId, ChapterAudioTrack>>> {
  try {
    const db = await openVaultDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIO, 'readonly');
      const req = tx.objectStore(STORE_AUDIO).getAll();
      req.onsuccess = () => {
        const rows = (req.result as StoredAudioRecord[]) || [];
        const map: Partial<Record<ChapterId, ChapterAudioTrack>> = {};
        for (const r of rows) {
          map[r.chapterId] = {
            chapterId: r.chapterId,
            fileName: r.fileName,
            updatedAt: r.updatedAt,
            url: URL.createObjectURL(r.audioBlob),
          };
        }
        resolve(map);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return {};
  }
}

export async function saveChapterAudio(
  chapterId: ChapterId,
  file: File
): Promise<ChapterAudioTrack> {
  const db = await openVaultDB();
  const record: StoredAudioRecord = {
    chapterId,
    fileName: file.name,
    updatedAt: new Date().toISOString(),
    audioBlob: file,
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readwrite');
    tx.objectStore(STORE_AUDIO).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return {
    chapterId,
    fileName: record.fileName,
    updatedAt: record.updatedAt,
    url: URL.createObjectURL(record.audioBlob),
  };
}

export async function deleteChapterAudio(chapterId: ChapterId): Promise<void> {
  const db = await openVaultDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readwrite');
    tx.objectStore(STORE_AUDIO).delete(chapterId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function loadAllComments(): Record<string, MemoryComment[]> {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, MemoryComment[]>) : {};
  } catch {
    return {};
  }
}

export function saveAllComments(map: Record<string, MemoryComment[]>): void {
  try {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota failures gracefully
  }
}

export function loadAllReactions(): Record<string, PhotoReactions> {
  try {
    const raw = localStorage.getItem(REACTIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<PhotoReactions>>;
    const normalized: Record<string, PhotoReactions> = {};
    for (const [id, r] of Object.entries(parsed)) {
      normalized[id] = {
        like: Number(r?.like || 0),
        heart: Number(r?.heart || 0),
        care: Number(r?.care || 0),
        cry: Number(r?.cry || 0),
        angry: Number(r?.angry || 0),
      };
    }
    return normalized;
  } catch {
    return {};
  }
}

export function saveAllReactions(map: Record<string, PhotoReactions>): void {
  try {
    localStorage.setItem(REACTIONS_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota failures
  }
}

export function loadAllReports(): PhotoReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PhotoReport[]) : [];
  } catch {
    return [];
  }
}

export function saveAllReports(reports: PhotoReport[]): void {
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  } catch {
    // Ignore quota failures
  }
}

export function loadMyReportedPhotoIds(): string[] {
  try {
    const raw = localStorage.getItem(MY_REPORTED_PHOTOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function markPhotoReportedByMe(photoId: string): string[] {
  const current = new Set(loadMyReportedPhotoIds());
  current.add(photoId);
  const list = [...current];
  try {
    localStorage.setItem(MY_REPORTED_PHOTOS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
  return list;
}

export function emptyReactions(): PhotoReactions {
  return { like: 0, heart: 0, care: 0, cry: 0, angry: 0 };
}

export function getReactionCount(
  map: Record<string, PhotoReactions>,
  photoId: string,
  key: ReactionKey
): number {
  return map[photoId]?.[key] ?? 0;
}

export function loadAudioPref(): { volume: number; rainEnabled: boolean } {
  try {
    const raw = localStorage.getItem(AUDIO_PREF_KEY);
    if (!raw) return { volume: 0.45, rainEnabled: true };
    const parsed = JSON.parse(raw) as { volume?: number; rainEnabled?: boolean };
    return {
      volume: typeof parsed.volume === 'number' ? parsed.volume : 0.45,
      rainEnabled: typeof parsed.rainEnabled === 'boolean' ? parsed.rainEnabled : true,
    };
  } catch {
    return { volume: 0.45, rainEnabled: true };
  }
}

export function saveAudioPref(volume: number, rainEnabled: boolean): void {
  try {
    localStorage.setItem(AUDIO_PREF_KEY, JSON.stringify({ volume, rainEnabled }));
  } catch {
    // ignore
  }
}

export function loadCommenterName(): string {
  try {
    return localStorage.getItem(COMMENTER_NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function saveCommenterName(name: string): void {
  try {
    localStorage.setItem(COMMENTER_NAME_KEY, name.trim());
  } catch {
    // ignore
  }
}

export function loadUploaderName(): string {
  try {
    return localStorage.getItem(UPLOADER_NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function saveUploaderName(name: string): void {
  try {
    localStorage.setItem(UPLOADER_NAME_KEY, name.trim());
  } catch {
    // ignore
  }
}

export function formatViDate(value?: string | null): string {
  if (!value) return 'Chưa có ngày';
  const d = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return 'Chưa có ngày';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatRelativeViTime(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Hôm qua';
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return formatViDate(value);
}

export function formatViMonthYear(value?: string | null): string {
  if (!value) return '';
  const d = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(d);
}

export function cleanDownloadName(value?: string): string {
  return (
    String(value || 'ky-niem-10B4')
      .normalize('NFKC')
      .replace(/[\\/:*?"<>|\x00-\x1f]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'ky-niem-10B4'
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function exportVaultArchive(): Promise<Blob> {
  const db = await openVaultDB();
  const records = await new Promise<StoredPhotoRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readonly');
    const req = tx.objectStore(STORE_PHOTOS).getAll();
    req.onsuccess = () => resolve((req.result as StoredPhotoRecord[]) || []);
    req.onerror = () => reject(req.error);
  });

  const audioRecords = await new Promise<StoredAudioRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readonly');
    const req = tx.objectStore(STORE_AUDIO).getAll();
    req.onsuccess = () => resolve((req.result as StoredAudioRecord[]) || []);
    req.onerror = () => reject(req.error);
  });

  const serializedPhotos = await Promise.all(
    records.map(async (r) => ({
      ...r,
      originalBlob: undefined,
      thumbBlob: undefined,
      originalDataUrl: await blobToBase64(r.originalBlob),
      thumbDataUrl: await blobToBase64(r.thumbBlob),
    }))
  );

  const serializedAudio = await Promise.all(
    audioRecords.map(async (a) => ({
      chapterId: a.chapterId,
      fileName: a.fileName,
      updatedAt: a.updatedAt,
      audioDataUrl: await blobToBase64(a.audioBlob),
    }))
  );

  const payload = {
    app: 'MEMORYVERSE-10B4',
    exportedAt: new Date().toISOString(),
    photos: serializedPhotos,
    audioTracks: serializedAudio,
    comments: loadAllComments(),
    reactions: loadAllReactions(),
  };
  return new Blob([JSON.stringify(payload)], { type: 'application/json' });
}

export async function importVaultArchive(file: File): Promise<number> {
  const text = await file.text();
  const parsed = JSON.parse(text) as {
    app?: string;
    photos?: Array<
      Omit<StoredPhotoRecord, 'originalBlob' | 'thumbBlob'> & {
        originalDataUrl: string;
        thumbDataUrl: string;
      }
    >;
    audioTracks?: Array<{
      chapterId: ChapterId;
      fileName: string;
      updatedAt: string;
      audioDataUrl: string;
    }>;
    comments?: Record<string, MemoryComment[]>;
    reactions?: Record<string, PhotoReactions>;
  };

  if (parsed.app !== 'MEMORYVERSE-10B4' || !Array.isArray(parsed.photos)) {
    throw new Error('Tệp sao lưu không đúng định dạng MEMORYVERSE 10B4.');
  }

  const db = await openVaultDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_PHOTOS, STORE_AUDIO], 'readwrite');
    const photoStore = tx.objectStore(STORE_PHOTOS);
    for (const item of parsed.photos || []) {
      const originalBlob = dataUrlToBlob(item.originalDataUrl);
      const thumbBlob = dataUrlToBlob(item.thumbDataUrl || item.originalDataUrl);
      const { originalDataUrl: _o, thumbDataUrl: _t, ...meta } = item;
      photoStore.put({ ...meta, originalBlob, thumbBlob });
    }
    const audioStore = tx.objectStore(STORE_AUDIO);
    for (const track of parsed.audioTracks || []) {
      audioStore.put({
        chapterId: track.chapterId,
        fileName: track.fileName,
        updatedAt: track.updatedAt,
        audioBlob: dataUrlToBlob(track.audioDataUrl),
      });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  if (parsed.comments) {
    const current = loadAllComments();
    saveAllComments({ ...current, ...parsed.comments });
  }
  if (parsed.reactions) {
    const current = loadAllReactions();
    saveAllReactions({ ...current, ...parsed.reactions });
  }

  return parsed.photos.length;
}
