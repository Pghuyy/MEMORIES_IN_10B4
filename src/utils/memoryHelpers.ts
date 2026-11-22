import { MemoryComment, MemoryPhoto } from '../types/memory';

export const MAKING_OF_COLLECTION_ID = 'c-making-of';
export const MAKING_OF_TAG = 'quá trình tạo lập web';

export function isMakingOfPhoto(photo: Pick<MemoryPhoto, 'collectionIds' | 'tags'>): boolean {
  if (photo.collectionIds.includes(MAKING_OF_COLLECTION_ID)) {
    return true;
  }
  return photo.tags.some((tag) => {
    const normalized = tag.trim().toLocaleLowerCase('vi');
    return (
      normalized === MAKING_OF_TAG ||
      normalized === 'making-of' ||
      normalized === 'tạo lập web'
    );
  });
}

export function getMakingOfPhotos(photos: MemoryPhoto[]): MemoryPhoto[] {
  return [...photos]
    .filter(isMakingOfPhoto)
    .sort((a, b) =>
      String(b.taken_at || b.created_at).localeCompare(String(a.taken_at || a.created_at))
    );
}

export interface GroupedComments {
  visibleComments: MemoryComment[];
  topLevel: MemoryComment[];
  repliesByParent: Record<string, MemoryComment[]>;
}

export function groupPhotoComments(comments: MemoryComment[] = []): GroupedComments {
  const visibleComments = comments.filter((c) => !c.is_hidden);
  const topLevel = visibleComments.filter((c) => !c.parent_id);
  const repliesByParent = visibleComments.reduce<Record<string, MemoryComment[]>>((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = [];
      acc[c.parent_id].push(c);
    }
    return acc;
  }, {});

  return { visibleComments, topLevel, repliesByParent };
}

export function validateCommentDraft(
  authorName: string,
  body: string
): { valid: true; authorName: string; body: string } | { valid: false; error: string } {
  const cleanName = authorName.trim();
  const cleanBody = body.trim();
  if (cleanName.length < 2) {
    return { valid: false, error: 'Hãy nhập tên của cậu (ít nhất 2 ký tự).' };
  }
  if (cleanBody.length < 2) {
    return { valid: false, error: 'Nội dung bình luận cần ít nhất 2 ký tự.' };
  }
  return { valid: true, authorName: cleanName, body: cleanBody };
}

export function deduplicatePhotosById(photos: MemoryPhoto[]): MemoryPhoto[] {
  const seen = new Set<string>();
  const result: MemoryPhoto[] = [];
  for (const photo of photos) {
    if (!photo.id || seen.has(photo.id)) continue;
    seen.add(photo.id);
    result.push(photo);
  }
  return result;
}
