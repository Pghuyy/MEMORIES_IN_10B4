export type ChapterId =
  | 'everyday'
  | 'chaos'
  | 'milestones'
  | 'people'
  | 'details'
  | 'yearbook';

export type YearbookStage = '' | 'candidate' | 'final';

export type ReactionKey = 'like' | 'heart' | 'care' | 'cry' | 'angry';

export interface ChapterTheme {
  id: ChapterId;
  index: string;
  title: string;
  shortTitle: string;
  headlinePrimary: string;
  headlineAccent: string;
  description: string;
  cornerNote: string;
  /** Subtle mood lighting: alternating warm sunlit and twilight tones (never gloomy) */
  surfaceTone: 'twilight' | 'sunlit';
  ambientBg: string;
  slideBackdrop: string;
  lightLeakColor: string;
  accentHex: string;
  melodyName: string;
}

export interface CollectionItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  space: ChapterId;
  layout_type: string;
  sort_order: number;
}

export interface MemoryPhoto {
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
  /** Display name of whoever uploaded the photo */
  uploader_name?: string;
  /** Resolved object URL or remote URL for display */
  src: string;
  thumb: string;
  /** Optional remote storage path if connected to Supabase */
  storage_path?: string;
}

export interface MemoryComment {
  id: string;
  photo_id: string;
  parent_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
  is_hidden?: boolean;
  /** Optional Time Capsule unlock date (YYYY-MM-DD) */
  unlock_date?: string | null;
}

export interface ChapterAudioTrack {
  chapterId: ChapterId;
  fileName: string;
  url: string;
  updatedAt: string;
}

export type PhotoReactions = Record<ReactionKey, number>;

export interface SupabaseRuntimeConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  storageBucket: string;
}
