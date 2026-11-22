import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ChapterAudioTrack,
  ChapterId,
  MemoryComment,
  MemoryPhoto,
  PhotoReactions,
  PhotoReport,
  ReactionKey,
  ReportReasonKey,
  ReportStatus,
  SupabaseRuntimeConfig,
  YearbookStage,
} from '../types/memory';
import { emptyReactions, makeId, sha256Hex } from './storage';
import { isMissingCloudSchemaError } from './cloudSchemaHelpers';

const CLIENT_ID_STORAGE_KEY = 'memoryverse_10b4_client_id_v1';
let cachedClientId = '';
const missingOptionalResources = new Set<string>();

declare global {
  interface Window {
    MEMORYVERSE_CONFIG?: {
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
      STORAGE_BUCKET?: string;
    };
  }
}

let cachedClient: SupabaseClient | null = null;
let cachedKey = '';

function makeCloudUuid(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createCloudRequestId(): string {
  return makeCloudUuid();
}

export function getCloudConfig(): SupabaseRuntimeConfig {
  const winCfg = typeof window !== 'undefined' ? window.MEMORYVERSE_CONFIG : undefined;
  const envUrl = (import.meta.env?.VITE_SUPABASE_URL as string | undefined) || '';
  const envKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined) || '';
  return {
    supabaseUrl: (winCfg?.SUPABASE_URL || envUrl || '').trim().replace(/\/+$/, ''),
    supabaseAnonKey: (winCfg?.SUPABASE_ANON_KEY || envKey || '').trim(),
    // SQL policies and bucket creation are intentionally pinned to this bucket.
    storageBucket: 'memoryverse',
  };
}

/** Stable anonymous installation ID; stores an identifier only, not app data. */
export function getCloudClientId(): string {
  if (cachedClientId) return cachedClientId;
  try {
    const stored = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (stored && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stored)) {
      cachedClientId = stored;
      return stored;
    }
  } catch {
    // Continue with an in-memory ID when browser storage is unavailable.
  }
  cachedClientId = makeCloudUuid();
  try {
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, cachedClientId);
  } catch {
    // The session still works, but cross-reload duplicate protection is reduced.
  }
  return cachedClientId;
}

export function isCloudConfigured(): boolean {
  const cfg = getCloudConfig();
  return Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
}

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = getCloudConfig();
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
  const sig = `${cfg.supabaseUrl}|${cfg.supabaseAnonKey}`;
  if (!cachedClient || cachedKey !== sig) {
    cachedClient = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    cachedKey = sig;
  }
  return cachedClient;
}

function publicStorageUrl(client: SupabaseClient, bucket: string, path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl || '';
}

export interface CuratorSessionState {
  userId: string | null;
  email: string | null;
  isCurator: boolean;
}

export async function getCuratorSession(): Promise<CuratorSessionState> {
  const client = getSupabaseClient();
  if (!client) return { userId: null, email: null, isCurator: false };

  const {
    data: { session },
  } = await client.auth.getSession();
  const user = session?.user;
  if (!user) return { userId: null, email: null, isCurator: false };

  const { data, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email || null,
    isCurator: !error && data?.role === 'curator',
  };
}

export async function signInCurator(email: string, password: string): Promise<CuratorSessionState> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Chưa cấu hình kết nối Supabase Cloud.');

  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(error.message);

  const user = data.user;
  if (!user) throw new Error('Không xác thực được tài khoản.');

  const { data: profile, error: profErr } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profErr || profile?.role !== 'curator') {
    await client.auth.signOut();
    throw new Error('Tài khoản này chưa được cấp quyền Quản trị (curator) trong bảng profiles.');
  }

  return {
    userId: user.id,
    email: user.email || email,
    isCurator: true,
  };
}

export async function signOutCurator(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}

export interface CloudSnapshot {
  photos: MemoryPhoto[];
  commentsMap: Record<string, MemoryComment[]>;
  reactionsMap: Record<string, PhotoReactions>;
  customTracks: Partial<Record<ChapterId, ChapterAudioTrack>>;
}

/** Subscribe to shared changes and refresh a consistent snapshot for every viewer. */
export function subscribeCloudChanges(
  onSnapshot: (snapshot: CloudSnapshot) => void,
  onError?: (error: unknown) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) return () => undefined;

  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const refresh = () => {
    if (disposed) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        const snapshot = await fetchCloudSnapshot();
        if (!disposed) onSnapshot(snapshot);
      } catch (error) {
        if (!disposed) onError?.(error);
      }
    }, 180);
  };

  const channel = client.channel(`memoryverse-live-${makeId()}`);
  const tables = [
    'photos',
    'photo_collections',
    'photo_tags',
    'tags',
    'yearbook_picks',
    'comment_activity',
    'photo_reactions',
    'chapter_audio',
  ];
  for (const table of tables) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      refresh
    );
  }

  channel.subscribe((status, error) => {
    if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !disposed) {
      onError?.(error || new Error(`Supabase Realtime: ${status}`));
    }
  });

  return () => {
    disposed = true;
    if (timer) clearTimeout(timer);
    void client.removeChannel(channel);
  };
}

export async function fetchCloudSnapshot(): Promise<CloudSnapshot> {
  const client = getSupabaseClient();
  if (!client) {
    return { photos: [], commentsMap: {}, reactionsMap: {}, customTracks: {} };
  }
  const { supabaseUrl, storageBucket } = getCloudConfig();
  const optKey = (resource: string) => `${supabaseUrl}|${resource}`;
  const runOptional = async <T,>(
    resource: string,
    query: () => PromiseLike<{ data: T[] | null; error: unknown }>
  ): Promise<T[]> => {
    const key = optKey(resource);
    if (missingOptionalResources.has(key)) return [];
    const res = await query();
    if (res.error) {
      if (isMissingCloudSchemaError(res.error)) {
        missingOptionalResources.add(key);
        return [];
      }
      throw res.error;
    }
    return res.data || [];
  };

  const fetchOptionalComments = async (): Promise<
    Array<{
      id: string;
      photo_id: string;
      parent_id: string | null;
      author_name: string;
      body: string;
      unlock_date?: string | null;
      is_hidden?: boolean;
      created_at: string;
    }>
  > => {
    const rpcKey = optKey('rpc:get_memory_comments');
    if (!missingOptionalResources.has(rpcKey)) {
      const rpcRes = await client.rpc('get_memory_comments');
      if (!rpcRes.error) {
        return (rpcRes.data || []) as Array<{
          id: string;
          photo_id: string;
          parent_id: string | null;
          author_name: string;
          body: string;
          unlock_date?: string | null;
          is_hidden?: boolean;
          created_at: string;
        }>;
      }
      if (!isMissingCloudSchemaError(rpcRes.error)) {
        throw rpcRes.error;
      }
      missingOptionalResources.add(rpcKey);
    }

    const tableKey = optKey('table:comments');
    if (missingOptionalResources.has(tableKey)) return [];
    const tblRes = await client
      .from('comments')
      .select('id,photo_id,parent_id,author_name,body,unlock_date,is_hidden,created_at')
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });
    if (!tblRes.error) {
      return tblRes.data || [];
    }
    if (isMissingCloudSchemaError(tblRes.error)) {
      const simpleRes = await client
        .from('comments')
        .select('id,photo_id,parent_id,author_name,body,is_hidden,created_at')
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });
      if (!simpleRes.error) return simpleRes.data || [];
      if (isMissingCloudSchemaError(simpleRes.error)) {
        missingOptionalResources.add(tableKey);
        return [];
      }
      throw simpleRes.error;
    }
    throw tblRes.error;
  };

  const [
    pResPrimary,
    pcData,
    ptData,
    ypData,
    cData,
    rData,
    aData,
  ] = await Promise.all([
    client
      .from('photos')
      .select('id,title,original_filename,caption,taken_at,storage_path,thumbnail_path,width,height,sha256,is_published,uploader_name,created_at')
      .eq('is_published', true)
      .order('taken_at', { ascending: false, nullsFirst: false }),
    runOptional<{ photo_id: string; collection_id: string }>('table:photo_collections', () =>
      client.from('photo_collections').select('photo_id,collection_id')
    ),
    runOptional<{ photo_id: string; tags: { name: string } | { name: string }[] | null }>(
      'table:photo_tags',
      () => client.from('photo_tags').select('photo_id,tags(name)')
    ),
    runOptional<{ photo_id: string; pick_type: string; sort_order: number }>(
      'table:yearbook_picks',
      () => client.from('yearbook_picks').select('photo_id,pick_type,sort_order')
    ),
    fetchOptionalComments(),
    runOptional<{
      photo_id: string;
      like_count: number;
      heart_count: number;
      care_count: number;
      cry_count: number;
      angry_count: number;
    }>('table:photo_reactions', () =>
      client
        .from('photo_reactions')
        .select('photo_id,like_count,heart_count,care_count,cry_count,angry_count')
    ),
    runOptional<{
      chapter_id: string;
      file_name: string;
      storage_path: string;
      updated_at: string;
    }>('table:chapter_audio', () =>
      client.from('chapter_audio').select('chapter_id,file_name,storage_path,updated_at')
    ),
  ]);

  let pResData = pResPrimary.data as Array<Record<string, unknown>> | null;
  if (pResPrimary.error) {
    // Graceful fallback if an existing Supabase DB hasn't added uploader_name yet
    if (String(pResPrimary.error.message || '').includes('uploader_name')) {
      const fallback = await client
        .from('photos')
        .select('id,title,original_filename,caption,taken_at,storage_path,thumbnail_path,width,height,sha256,is_published,created_at')
        .eq('is_published', true)
        .order('taken_at', { ascending: false, nullsFirst: false });
      if (fallback.error) throw fallback.error;
      pResData = fallback.data as Array<Record<string, unknown>> | null;
    } else {
      throw pResPrimary.error;
    }
  }

  const colMap = new Map<string, string[]>();
  for (const row of pcData) {
    const list = colMap.get(row.photo_id) || [];
    list.push(row.collection_id);
    colMap.set(row.photo_id, list);
  }

  const tagMap = new Map<string, string[]>();
  for (const row of ptData) {
    const list = tagMap.get(row.photo_id) || [];
    const tagName = Array.isArray(row.tags) ? row.tags[0]?.name : row.tags?.name;
    if (tagName) list.push(tagName);
    tagMap.set(row.photo_id, list);
  }

  const ybMap = new Map<string, { type: YearbookStage; order: number }>();
  for (const row of ypData) {
    ybMap.set(row.photo_id, {
      type: (row.pick_type as YearbookStage) || 'candidate',
      order: Number(row.sort_order || 0),
    });
  }

  const photos: MemoryPhoto[] = (pResData || []).map((row) => {
    const id = String(row.id);
    const yb = ybMap.get(id);
    const createdAt = String(row.created_at || '');
    const storagePath = row.storage_path ? String(row.storage_path) : undefined;
    const thumbPath = row.thumbnail_path ? String(row.thumbnail_path) : storagePath;
    return {
      id,
      title: String(row.title || 'Khoảnh khắc 10B4'),
      originalName: row.original_filename ? String(row.original_filename) : undefined,
      caption: row.caption ? String(row.caption) : '',
      taken_at: row.taken_at ? String(row.taken_at) : createdAt.slice(0, 10) || '',
      created_at: createdAt,
      collectionIds: colMap.get(id) || [],
      tags: tagMap.get(id) || [],
      width: Number(row.width || 0),
      height: Number(row.height || 0),
      sha256: row.sha256 ? String(row.sha256) : undefined,
      is_yearbook_pick: Boolean(yb),
      yearbook_pick_type: yb?.type || '',
      yearbook_order: yb?.order,
      uploader_name: row.uploader_name ? String(row.uploader_name) : undefined,
      storage_path: storagePath,
      src: publicStorageUrl(client, storageBucket, storagePath),
      thumb: publicStorageUrl(client, storageBucket, thumbPath),
    };
  });

  const commentsMap: Record<string, MemoryComment[]> = {};
  for (const c of cData) {
    if (!commentsMap[c.photo_id]) commentsMap[c.photo_id] = [];
    commentsMap[c.photo_id].push({
      id: c.id,
      photo_id: c.photo_id,
      parent_id: c.parent_id,
      author_name: c.author_name,
      body: c.body,
      unlock_date: c.unlock_date,
      is_hidden: c.is_hidden,
      created_at: c.created_at,
    });
  }

  const reactionsMap: Record<string, PhotoReactions> = {};
  for (const r of rData) {
    reactionsMap[r.photo_id] = {
      like: Number(r.like_count || 0),
      heart: Number(r.heart_count || 0),
      care: Number(r.care_count || 0),
      cry: Number(r.cry_count || 0),
      angry: Number(r.angry_count || 0),
    };
  }

  const customTracks: Partial<Record<ChapterId, ChapterAudioTrack>> = {};
  for (const a of aData) {
    const chId = a.chapter_id as ChapterId;
    customTracks[chId] = {
      chapterId: chId,
      fileName: a.file_name,
      updatedAt: a.updated_at,
      url: publicStorageUrl(client, storageBucket, a.storage_path),
    };
  }

  return { photos, commentsMap, reactionsMap, customTracks };
}

export async function fetchCloudReactionCounts(): Promise<Record<string, PhotoReactions>> {
  const client = getSupabaseClient();
  if (!client) return {};
  const { data, error } = await client
    .from('photo_reactions')
    .select('photo_id,like_count,heart_count,care_count,cry_count,angry_count');
  if (error) {
    if (isMissingCloudSchemaError(error)) return {};
    throw error;
  }
  const result: Record<string, PhotoReactions> = {};
  for (const row of data || []) {
    result[row.photo_id] = {
      like: Number(row.like_count || 0),
      heart: Number(row.heart_count || 0),
      care: Number(row.care_count || 0),
      cry: Number(row.cry_count || 0),
      angry: Number(row.angry_count || 0),
    };
  }
  return result;
}

export async function uploadPhotoToCloud(
  file: File,
  thumbBlob: Blob,
  meta: {
    title: string;
    caption: string;
    taken_at: string;
    collectionIds: string[];
    tags: string[];
    width: number;
    height: number;
    sha256: string;
    isYearbookCandidate: boolean;
    uploader_name?: string;
    id?: string;
    createdAt?: string;
    yearbookStage?: YearbookStage;
    yearbookOrder?: number;
  },
  userId: string
): Promise<MemoryPhoto> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Chưa kết nối Supabase Cloud.');
  const { storageBucket } = getCloudConfig();

  const dup = await client
    .from('photos')
    .select('id')
    .eq('sha256', meta.sha256)
    .maybeSingle();
  if (dup.error) throw dup.error;
  if (dup.data) throw new Error(`${file.name}: ảnh này đã có trên Cloud.`);

  const id = meta.id || makeCloudUuid();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const originalPath = `originals/${id}.${ext}`;
  const thumbPath = `thumbs/${id}.webp`;

  const upOrig = await client.storage
    .from(storageBucket)
    .upload(originalPath, file, { contentType: file.type, upsert: false });
  if (upOrig.error) throw upOrig.error;

  const upThumb = await client.storage
    .from(storageBucket)
    .upload(thumbPath, thumbBlob, { contentType: thumbBlob.type || file.type || 'image/webp', upsert: false });
  if (upThumb.error) {
    await client.storage.from(storageBucket).remove([originalPath]);
    throw upThumb.error;
  }

  const basePayload = {
    id,
    title: meta.title,
    original_filename: file.name,
    caption: meta.caption || null,
    taken_at: meta.taken_at || null,
    storage_path: originalPath,
    thumbnail_path: thumbPath,
    width: meta.width,
    height: meta.height,
    sha256: meta.sha256,
    is_published: true,
    created_by: userId,
    ...(meta.createdAt ? { created_at: meta.createdAt } : {}),
  };

  let insertRes = await client
    .from('photos')
    .insert({
      ...basePayload,
      uploader_name: meta.uploader_name?.trim() || null,
    })
    .select('created_at')
    .single();

  if (
    insertRes.error &&
    String(insertRes.error.message || '').includes('uploader_name')
  ) {
    insertRes = await client
      .from('photos')
      .insert(basePayload)
      .select('created_at')
      .single();
  }

  if (insertRes.error) {
    await client.storage.from(storageBucket).remove([originalPath, thumbPath]);
    throw insertRes.error;
  }

  try {
    const resolvedTags = meta.collectionIds.includes('c-making-of')
      ? [...new Set([...meta.tags, 'quá trình tạo lập web'])]
      : meta.tags;

    if (meta.collectionIds.length > 0) {
      const { data: existingCols, error: colLookupErr } = await client
        .from('collections')
        .select('id')
        .in('id', meta.collectionIds);
      if (colLookupErr && !isMissingCloudSchemaError(colLookupErr)) {
        throw colLookupErr;
      }
      const validColIds = new Set((existingCols || []).map((c) => String(c.id)));
      const insertableCols = meta.collectionIds.filter((cid) => validColIds.has(cid));
      if (insertableCols.length > 0) {
        const colLink = await client
          .from('photo_collections')
          .insert(insertableCols.map((collection_id) => ({ photo_id: id, collection_id })));
        if (colLink.error && !isMissingCloudSchemaError(colLink.error)) {
          throw colLink.error;
        }
      }
    }

    if (resolvedTags.length > 0) {
      const tagRows = await client
        .from('tags')
        .upsert(
          resolvedTags.map((name) => ({ name })),
          { onConflict: 'name' }
        )
        .select('id,name');
      if (tagRows.error) {
        if (!isMissingCloudSchemaError(tagRows.error)) throw tagRows.error;
      } else if (tagRows.data && tagRows.data.length > 0) {
        const photoTagRows = await client
          .from('photo_tags')
          .insert(tagRows.data.map((t) => ({ photo_id: id, tag_id: t.id })));
        if (photoTagRows.error && !isMissingCloudSchemaError(photoTagRows.error)) {
          throw photoTagRows.error;
        }
      }
    }

    if (meta.isYearbookCandidate) {
      const yearbook = await client
        .from('yearbook_picks')
        .upsert({
          photo_id: id,
          pick_type: meta.yearbookStage === 'final' ? 'final' : 'candidate',
          sort_order: meta.yearbookOrder ?? 0,
        });
      if (yearbook.error && !isMissingCloudSchemaError(yearbook.error)) {
        throw yearbook.error;
      }
    }
  } catch (error) {
    await client.from('photos').delete().eq('id', id);
    await client.storage.from(storageBucket).remove([originalPath, thumbPath]);
    throw error;
  }

  return {
    id,
    title: meta.title,
    originalName: file.name,
    caption: meta.caption,
    taken_at: meta.taken_at,
    created_at: insertRes.data?.created_at || new Date().toISOString(),
    collectionIds: meta.collectionIds,
    tags: meta.tags,
    width: meta.width,
    height: meta.height,
    sha256: meta.sha256,
    is_yearbook_pick: meta.isYearbookCandidate,
    yearbook_pick_type: meta.isYearbookCandidate
      ? (meta.yearbookStage === 'final' ? 'final' : 'candidate')
      : '',
    yearbook_order: meta.yearbookOrder,
    uploader_name: meta.uploader_name?.trim() || undefined,
    storage_path: originalPath,
    src: publicStorageUrl(client, storageBucket, originalPath),
    thumb: publicStorageUrl(client, storageBucket, thumbPath),
  };
}

export async function updateCloudPhotoMetadata(
  photoId: string,
  patch: { title: string; caption: string }
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from('photos')
    .update({
      title: patch.title,
      caption: patch.caption || null,
    })
    .eq('id', photoId);
  if (error) throw error;
}

export async function deleteCloudPhoto(photo: MemoryPhoto): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { storageBucket } = getCloudConfig();
  const { error } = await client.from('photos').delete().eq('id', photo.id);
  if (error) throw error;
  const toRemove = [
    photo.storage_path,
    photo.storage_path ? `thumbs/${photo.id}.webp` : undefined,
  ].filter(Boolean) as string[];
  if (toRemove.length > 0) {
    const removed = await client.storage.from(storageBucket).remove(toRemove);
    if (removed.error) throw removed.error;
  }
}

export async function setCloudYearbookStage(
  photoId: string,
  stage: YearbookStage,
  order?: number
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  if (!stage) {
    const { error } = await client.from('yearbook_picks').delete().eq('photo_id', photoId);
    if (error) throw error;
  } else {
    const { error } = await client.from('yearbook_picks').upsert({
      photo_id: photoId,
      pick_type: stage,
      sort_order: order ?? 0,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
}

export async function reorderCloudYearbook(
  items: Array<{ photoId: string; order: number }>
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const results = await Promise.all(
    items.map((it) =>
      client
        .from('yearbook_picks')
        .update({ sort_order: it.order })
        .eq('photo_id', it.photoId)
    )
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

export async function submitCloudComment(
  photoId: string,
  authorName: string,
  body: string,
  parentId: string | null,
  unlockDate?: string | null,
  requestId = makeCloudUuid()
): Promise<MemoryComment> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Chưa kết nối Supabase Cloud.');

  const { data, error } = await client.rpc('submit_memory_comment', {
    p_photo_id: photoId,
    p_parent_id: parentId,
    p_author_name: authorName.trim(),
    p_body: body.trim(),
    p_unlock_date: unlockDate || null,
    p_client_id: getCloudClientId(),
    p_request_id: requestId,
  });

  if (error) throw error;
  if (!data) throw new Error('Cloud chưa trả về bình luận đã lưu.');
  return data as MemoryComment;
}

export async function fetchCloudPhotoReports(): Promise<PhotoReport[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { supabaseUrl } = getCloudConfig();
  const key = `${supabaseUrl}|table:photo_reports`;
  if (missingOptionalResources.has(key)) return [];

  const { data, error } = await client
    .from('photo_reports')
    .select('id,photo_id,photo_title,reason,reason_label,details,reporter_name,status,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingCloudSchemaError(error)) {
      missingOptionalResources.add(key);
      return [];
    }
    // Visitors without curator permission will get RLS empty/denied on select; return empty gracefully.
    return [];
  }
  return (data || []) as PhotoReport[];
}

export async function submitCloudPhotoReport(params: {
  id: string;
  photoId: string;
  photoTitle: string;
  reason: ReportReasonKey;
  reasonLabel: string;
  details: string;
  reporterName: string;
}): Promise<{ syncedToCloud: boolean }> {
  const client = getSupabaseClient();
  if (!client) return { syncedToCloud: false };
  const { supabaseUrl } = getCloudConfig();
  const key = `${supabaseUrl}|table:photo_reports`;
  if (missingOptionalResources.has(key)) return { syncedToCloud: false };

  const { error } = await client.from('photo_reports').insert({
    id: params.id,
    photo_id: params.photoId,
    photo_title: params.photoTitle,
    reason: params.reason,
    reason_label: params.reasonLabel,
    details: params.details,
    reporter_name: params.reporterName,
    status: 'pending',
  });

  if (error) {
    if (isMissingCloudSchemaError(error)) {
      missingOptionalResources.add(key);
      return { syncedToCloud: false };
    }
    throw error;
  }
  return { syncedToCloud: true };
}

export async function updateCloudPhotoReportStatus(
  reportId: string,
  status: ReportStatus
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { supabaseUrl } = getCloudConfig();
  const key = `${supabaseUrl}|table:photo_reports`;
  if (missingOptionalResources.has(key)) return false;

  const { error } = await client
    .from('photo_reports')
    .update({ status })
    .eq('id', reportId);

  if (error) {
    if (isMissingCloudSchemaError(error)) {
      missingOptionalResources.add(key);
      return false;
    }
    throw error;
  }
  return true;
}

export async function moderateCloudComment(
  commentId: string,
  action: 'hide' | 'show' | 'delete'
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  if (action === 'delete') {
    const { error } = await client.from('comments').delete().eq('id', commentId);
    if (error) throw error;
  } else {
    const { error } = await client
      .from('comments')
      .update({ is_hidden: action === 'hide' })
      .eq('id', commentId);
    if (error) throw error;
  }
}

export async function incrementCloudReaction(
  photoId: string,
  key: ReactionKey
): Promise<ReactionKey> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Chưa kết nối Supabase Cloud.');
  const { data, error } = await client.rpc('submit_photo_reaction', {
    p_photo_id: photoId,
    p_key: key,
    p_client_id: getCloudClientId(),
  });
  if (error) throw error;
  const savedKey = String(data || '');
  if (!['like', 'heart', 'care', 'cry', 'angry'].includes(savedKey)) {
    throw new Error('Cloud chưa trả về loại cảm xúc đã ghi nhận.');
  }
  return savedKey as ReactionKey;
}

export async function uploadCloudChapterAudio(
  chapterId: ChapterId,
  file: File
): Promise<ChapterAudioTrack> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Chưa kết nối Supabase Cloud.');
  const { storageBucket } = getCloudConfig();

  const ext = (file.name.split('.').pop() || 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp3';
  const path = `audio/${chapterId}-${Date.now()}.${ext}`;

  const existing = await client
    .from('chapter_audio')
    .select('storage_path')
    .eq('chapter_id', chapterId)
    .maybeSingle();
  if (existing.error) throw existing.error;

  const up = await client.storage
    .from(storageBucket)
    .upload(path, file, { contentType: file.type || 'audio/mpeg', upsert: true });
  if (up.error) throw up.error;

  const updatedAt = new Date().toISOString();
  const { error } = await client.from('chapter_audio').upsert({
    chapter_id: chapterId,
    file_name: file.name,
    storage_path: path,
    updated_at: updatedAt,
  });
  if (error) {
    await client.storage.from(storageBucket).remove([path]);
    throw error;
  }
  if (existing.data?.storage_path && existing.data.storage_path !== path) {
    const cleanup = await client.storage.from(storageBucket).remove([existing.data.storage_path]);
    if (cleanup.error) throw cleanup.error;
  }

  return {
    chapterId,
    fileName: file.name,
    updatedAt,
    url: publicStorageUrl(client, storageBucket, path),
  };
}

export async function deleteCloudChapterAudio(chapterId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { storageBucket } = getCloudConfig();
  const lookup = await client
    .from('chapter_audio')
    .select('storage_path')
    .eq('chapter_id', chapterId)
    .maybeSingle();
  if (lookup.error) throw lookup.error;
  const deleted = await client.from('chapter_audio').delete().eq('chapter_id', chapterId);
  if (deleted.error) throw deleted.error;
  if (lookup.data?.storage_path) {
    const removed = await client.storage.from(storageBucket).remove([lookup.data.storage_path]);
    if (removed.error) throw removed.error;
  }
}

export async function downloadCloudOriginal(storagePath: string): Promise<Blob | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { storageBucket } = getCloudConfig();
  const { data, error } = await client.storage.from(storageBucket).download(storagePath);
  if (error) return null;
  return data;
}

export interface LegacyCloudMigrationSummary {
  photosUploaded: number;
  photosAlreadyPresent: number;
  commentsImported: number;
  reactionsMerged: number;
  audioTracksUploaded: number;
}

type LegacyArchivePhoto = {
  id: string;
  title?: string;
  originalName?: string;
  caption?: string;
  taken_at?: string;
  created_at?: string;
  collectionIds?: string[];
  tags?: string[];
  width?: number;
  height?: number;
  sha256?: string;
  is_yearbook_pick?: boolean;
  yearbook_pick_type?: YearbookStage;
  yearbook_order?: number;
  uploader_name?: string;
  originalDataUrl: string;
  thumbDataUrl?: string;
};

type LegacyArchive = {
  app?: string;
  photos?: LegacyArchivePhoto[];
  audioTracks?: Array<{
    chapterId: ChapterId;
    fileName: string;
    audioDataUrl: string;
  }>;
  comments?: Record<string, MemoryComment[]>;
  reactions?: Record<string, Partial<PhotoReactions>>;
};

function decodeLegacyDataUrl(dataUrl: string): Blob {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/i.exec(dataUrl || '');
  if (!match) throw new Error('Ảnh hoặc nhạc trong tệp sao lưu bị thiếu dữ liệu.');
  const mime = match[1] || 'application/octet-stream';
  if (match[2]) {
    const binary = atob(match[3]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(match[3])], { type: mime });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Upload an offline Memoryverse JSON archive into the shared Cloud project. */
export async function migrateLegacyVaultArchiveToCloud(
  file: File
): Promise<LegacyCloudMigrationSummary> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Chưa kết nối Supabase Cloud.');
  const session = await getCuratorSession();
  if (!session.isCurator || !session.userId) {
    throw new Error('Chỉ Quản trị viên mới được chuyển kho dữ liệu cũ lên Cloud.');
  }

  let archive: LegacyArchive;
  try {
    archive = JSON.parse(await file.text()) as LegacyArchive;
  } catch {
    throw new Error('Không đọc được tệp JSON sao lưu.');
  }
  if (archive.app !== 'MEMORYVERSE-10B4' || !Array.isArray(archive.photos)) {
    throw new Error('Tệp không đúng định dạng sao lưu MEMORYVERSE 10B4.');
  }

  const summary: LegacyCloudMigrationSummary = {
    photosUploaded: 0,
    photosAlreadyPresent: 0,
    commentsImported: 0,
    reactionsMerged: 0,
    audioTracksUploaded: 0,
  };
  const photoIdMap = new Map<string, string>();

  for (const item of archive.photos) {
    if (!item.id || !item.originalDataUrl) {
      throw new Error('Có ảnh trong bản sao lưu thiếu mã hoặc dữ liệu gốc.');
    }
    const oldId = String(item.id);
    if (isUuid(oldId)) {
      const byId = await client.from('photos').select('id').eq('id', oldId).maybeSingle();
      if (byId.error) throw byId.error;
      if (byId.data?.id) {
        photoIdMap.set(oldId, byId.data.id);
        summary.photosAlreadyPresent += 1;
        continue;
      }
    }

    const originalBlob = decodeLegacyDataUrl(item.originalDataUrl);
    const thumbBlob = item.thumbDataUrl
      ? decodeLegacyDataUrl(item.thumbDataUrl)
      : originalBlob;
    const originalName = item.originalName || `${item.title || 'memory'}-${oldId}.jpg`;
    const imageFile = new File([originalBlob], originalName, {
      type: originalBlob.type || 'image/jpeg',
    });
    const sha = item.sha256 || await sha256Hex(imageFile);

    const byHash = await client
      .from('photos')
      .select('id')
      .eq('sha256', sha)
      .maybeSingle();
    if (byHash.error) throw byHash.error;
    if (byHash.data?.id) {
      photoIdMap.set(oldId, byHash.data.id);
      summary.photosAlreadyPresent += 1;
      continue;
    }

    const preservedId = isUuid(oldId) ? oldId : makeCloudUuid();
    const isYearbookCandidate = Boolean(
      item.is_yearbook_pick || item.yearbook_pick_type
    );
    await uploadPhotoToCloud(
      imageFile,
      thumbBlob,
      {
        id: preservedId,
        title: (item.title || 'Khoảnh khắc 10B4').slice(0, 160),
        caption: item.caption || '',
        taken_at: item.taken_at || '',
        collectionIds: Array.isArray(item.collectionIds) ? item.collectionIds : [],
        tags: Array.isArray(item.tags) ? item.tags : [],
        width: Number(item.width || 0),
        height: Number(item.height || 0),
        sha256: sha,
        isYearbookCandidate,
        uploader_name: item.uploader_name,
        createdAt: item.created_at,
        yearbookStage: item.yearbook_pick_type || '',
        yearbookOrder: Number(item.yearbook_order || 0),
      },
      session.userId
    );
    photoIdMap.set(oldId, preservedId);
    summary.photosUploaded += 1;
  }

  // Keep photo/comment identifiers linked even if an image was deduplicated by SHA.
  const allLegacyComments = Object.entries(archive.comments || {}).flatMap(
    ([oldPhotoId, comments]) =>
      (comments || []).map((comment) => ({ ...comment, oldPhotoId }))
  ).sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
  const commentIdMap = new Map<string, string>();
  for (const comment of allLegacyComments) {
    const oldCommentId = String(comment.id || '');
    if (oldCommentId) commentIdMap.set(oldCommentId, isUuid(oldCommentId) ? oldCommentId : makeCloudUuid());
  }

  const commentsPayload = allLegacyComments.flatMap((comment) => {
    const newPhotoId = photoIdMap.get(comment.oldPhotoId);
    if (!newPhotoId) return [];
    const newCommentId = commentIdMap.get(comment.id) || makeCloudUuid();
    return [{
      id: newCommentId,
      photo_id: newPhotoId,
      parent_id: comment.parent_id ? (commentIdMap.get(comment.parent_id) || null) : null,
      author_name: comment.author_name,
      body: comment.body,
      unlock_date: comment.unlock_date || null,
      is_hidden: Boolean(comment.is_hidden),
      created_at: comment.created_at,
    }];
  });

  if (commentsPayload.length > 0) {
    const { data, error } = await client.rpc('import_legacy_comments', {
      p_comments: commentsPayload,
    });
    if (error) throw error;
    summary.commentsImported = Number(data || 0);
  }

  const reactionsPayload = Object.entries(archive.reactions || {}).flatMap(
    ([oldPhotoId, counts]) => {
      const photoId = photoIdMap.get(oldPhotoId);
      if (!photoId) return [];
      return [{
        photo_id: photoId,
        like: Number(counts?.like || 0),
        heart: Number(counts?.heart || 0),
        care: Number(counts?.care || 0),
        cry: Number(counts?.cry || 0),
        angry: Number(counts?.angry || 0),
      }];
    }
  );
  if (reactionsPayload.length > 0) {
    const { data, error } = await client.rpc('merge_legacy_reaction_counts', {
      p_reactions: reactionsPayload,
    });
    if (error) throw error;
    summary.reactionsMerged = Number(data || 0);
  }

  for (const track of archive.audioTracks || []) {
    if (!track.audioDataUrl || !track.chapterId) continue;
    const audioBlob = decodeLegacyDataUrl(track.audioDataUrl);
    const audioFile = new File([audioBlob], track.fileName || `${track.chapterId}.mp3`, {
      type: audioBlob.type || 'audio/mpeg',
    });
    await uploadCloudChapterAudio(track.chapterId, audioFile);
    summary.audioTracksUploaded += 1;
  }

  return summary;
}

export { emptyReactions };
