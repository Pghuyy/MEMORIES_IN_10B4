import { MemoryPhoto } from '../types/memory';

export type TimeFilterMode = 'semester' | 'month';

export interface TimeBucket {
  key: string;
  label: string;
  count: number;
  sortKey: string;
}

function parsePhotoDate(photo: MemoryPhoto): Date | null {
  const raw = photo.taken_at || photo.created_at;
  if (!raw) return null;
  const d = new Date(`${String(raw).slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getTimeKeyForPhoto(photo: MemoryPhoto, mode: TimeFilterMode): string {
  const d = parsePhotoDate(photo);
  if (!d) return 'unknown';

  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1..12

  if (mode === 'month') {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  // Vietnamese high-school academic calendar:
  // Sept-Dec => HK1 of (year)-(year+1)
  // Jan-May  => HK2 of (year-1)-(year)
  // Jun-Aug  => Hè (year)
  if (month >= 9) {
    return `${year}-HK1`;
  }
  if (month <= 5) {
    return `${year - 1}-HK2`;
  }
  return `${year}-HE`;
}

function formatBucketLabel(key: string, mode: TimeFilterMode): { label: string; sortKey: string } {
  if (key === 'unknown') {
    return { label: 'Chưa rõ ngày', sortKey: '0000-00' };
  }

  if (mode === 'month') {
    const [y, m] = key.split('-');
    return {
      label: `Tháng ${m}/${y}`,
      sortKey: `${y}-${m}`,
    };
  }

  const [yStr, term] = key.split('-');
  const y = Number(yStr);
  const nextShort = String(y + 1).slice(-2);
  const currShort = String(y).slice(-2);

  if (term === 'HK1') {
    return {
      label: `HK1 · ${currShort}–${nextShort}`,
      sortKey: `${y}-09`,
    };
  }
  if (term === 'HK2') {
    return {
      label: `HK2 · ${currShort}–${nextShort}`,
      sortKey: `${y + 1}-01`,
    };
  }
  return {
    label: `Hè ${y}`,
    sortKey: `${y}-06`,
  };
}

export function buildTimeBuckets(photos: MemoryPhoto[], mode: TimeFilterMode): TimeBucket[] {
  const counts = new Map<string, number>();
  for (const photo of photos) {
    const k = getTimeKeyForPhoto(photo, mode);
    counts.set(k, (counts.get(k) || 0) + 1);
  }

  const buckets: TimeBucket[] = [];
  counts.forEach((count, key) => {
    const { label, sortKey } = formatBucketLabel(key, mode);
    buckets.push({ key, label, count, sortKey });
  });

  // Sort newest period first
  return buckets.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}
