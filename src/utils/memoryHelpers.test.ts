import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deduplicatePhotosById,
  getMakingOfPhotos,
  groupPhotoComments,
  isMakingOfPhoto,
  MAKING_OF_COLLECTION_ID,
  MAKING_OF_TAG,
  validateCommentDraft,
} from './memoryHelpers';
import { MemoryComment, MemoryPhoto } from '../types/memory';

function makePhoto(overrides: Partial<MemoryPhoto> = {}): MemoryPhoto {
  return {
    id: 'p1',
    title: 'Test Photo',
    caption: '',
    taken_at: '2026-10-15',
    created_at: '2026-10-15T10:00:00Z',
    collectionIds: ['c-everyday-1'],
    tags: [],
    width: 1200,
    height: 900,
    is_yearbook_pick: false,
    yearbook_pick_type: '',
    src: 'blob:1',
    thumb: 'blob:1',
    ...overrides,
  };
}

test('isMakingOfPhoto matches collection ID or making-of tags case-insensitively', () => {
  assert.equal(
    isMakingOfPhoto(makePhoto({ collectionIds: [MAKING_OF_COLLECTION_ID] })),
    true
  );
  assert.equal(
    isMakingOfPhoto(makePhoto({ tags: ['Quá Trình Tạo Lập Web'] })),
    true
  );
  assert.equal(
    isMakingOfPhoto(makePhoto({ tags: [MAKING_OF_TAG] })),
    true
  );
  assert.equal(
    isMakingOfPhoto(makePhoto({ collectionIds: ['c-everyday-2'], tags: ['lớp học'] })),
    false
  );
});

test('getMakingOfPhotos filters and sorts newest first', () => {
  const photos = [
    makePhoto({ id: 'old', taken_at: '2026-09-01', tags: [MAKING_OF_TAG] }),
    makePhoto({ id: 'other', taken_at: '2026-11-01', tags: ['ra chơi'] }),
    makePhoto({ id: 'new', taken_at: '2026-10-20', collectionIds: [MAKING_OF_COLLECTION_ID] }),
  ];
  const result = getMakingOfPhotos(photos);
  assert.deepEqual(
    result.map((p) => p.id),
    ['new', 'old']
  );
});

test('groupPhotoComments excludes hidden comments and groups replies under parents', () => {
  const comments: MemoryComment[] = [
    {
      id: 'c1',
      photo_id: 'p1',
      parent_id: null,
      author_name: 'Gia Huy',
      body: 'Đỉnh quá!',
      created_at: '2026-10-15T10:00:00Z',
    },
    {
      id: 'c2',
      photo_id: 'p1',
      parent_id: 'c1',
      author_name: 'Minh Anh',
      body: 'Chuẩn luôn',
      created_at: '2026-10-15T10:05:00Z',
    },
    {
      id: 'c3',
      photo_id: 'p1',
      parent_id: null,
      author_name: 'Spam',
      body: 'Hidden',
      created_at: '2026-10-15T10:06:00Z',
      is_hidden: true,
    },
  ];
  const grouped = groupPhotoComments(comments);
  assert.equal(grouped.visibleComments.length, 2);
  assert.equal(grouped.topLevel.length, 1);
  assert.equal(grouped.topLevel[0].id, 'c1');
  assert.equal(grouped.repliesByParent['c1']?.length, 1);
  assert.equal(grouped.repliesByParent['c1']?.[0].id, 'c2');
});

test('validateCommentDraft trims and rejects short inputs', () => {
  assert.equal(validateCommentDraft('A', 'Xin chào').valid, false);
  assert.equal(validateCommentDraft('Huy', ' ').valid, false);
  const ok = validateCommentDraft('  Gia Huy  ', '  Ảnh đẹp quá  ');
  assert.equal(ok.valid, true);
  if (ok.valid) {
    assert.equal(ok.authorName, 'Gia Huy');
    assert.equal(ok.body, 'Ảnh đẹp quá');
  }
});

test('deduplicatePhotosById keeps first occurrence and removes duplicates', () => {
  const list = deduplicatePhotosById([
    makePhoto({ id: 'a', title: 'First' }),
    makePhoto({ id: 'b', title: 'Second' }),
    makePhoto({ id: 'a', title: 'Duplicate' }),
  ]);
  assert.equal(list.length, 2);
  assert.equal(list[0].title, 'First');
  assert.equal(list[1].id, 'b');
});
