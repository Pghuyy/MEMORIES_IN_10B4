const CONFIG = window.MEMORYVERSE_CONFIG || {};
const BUCKET = CONFIG.STORAGE_BUCKET || 'memoryverse';
const DEMO_MODE = !(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const SPACE_INFO = [
  { id: 'everyday', title: 'Đời thường', subtitle: 'Giờ học · Giờ chơi · Tan trường', index: '01', slug: 'everyday' },
  { id: 'chaos', title: 'Chuyện khó đỡ', subtitle: 'Bị phạt · Trò nghịch · Hậu trường', index: '02', slug: 'chaos' },
  { id: 'milestones', title: 'Dấu mốc', subtitle: 'Sự kiện · Hoạt động · Chuyến đi', index: '03', slug: 'milestones' },
  { id: 'people', title: 'Mọi người', subtitle: 'Chân dung · Nhóm · GVCN', index: '04', slug: 'people' },
  { id: 'details', title: 'Điều nhỏ bé', subtitle: 'Góc lớp · Đồ vật · Chi tiết', index: '05', slug: 'details' },
  { id: 'yearbook', title: 'Kỷ yếu', subtitle: 'Ảnh chọn · Dòng thời gian', index: '06', slug: 'yearbook' }
];

const DEMO_COLLECTIONS = [
  { id: 'c-everyday-1', slug: 'first-period', title: 'Trước giờ vào lớp', description: 'Những phút đầu ngày, khi lớp mình còn đang ngái ngủ.', space: 'everyday', layout_type: 'film-strip', sort_order: 1 },
  { id: 'c-everyday-2', slug: 'in-class', title: 'Trong giờ học', description: 'Những tiết học, ánh mắt, trang vở và chuyện bên lề.', space: 'everyday', layout_type: 'exhibition', sort_order: 2 },
  { id: 'c-everyday-3', slug: 'break-time', title: 'Giờ ra chơi', description: 'Mười lăm phút mà có cả nghìn chuyện.', space: 'everyday', layout_type: 'scrapbook', sort_order: 3 },
  { id: 'c-everyday-4', slug: 'after-class', title: 'Tan học rồi', description: 'Sân trường, hành lang và những bước chân cuối buổi.', space: 'everyday', layout_type: 'film-strip', sort_order: 4 },
  { id: 'c-everyday-5', slug: 'class-duty', title: 'Trực nhật & sinh hoạt', description: 'Những buổi cùng dọn lớp, họp lớp và ở lại thêm một chút.', space: 'everyday', layout_type: 'scrapbook', sort_order: 5 },
  { id: 'c-chaos-1', slug: 'punishment-files', title: 'Hồ sơ những lần bị phạt', description: 'Những lần bị nhắc nhở — lưu lại bằng tinh thần vui vẻ và tôn trọng nhau.', space: 'chaos', layout_type: 'case-files', sort_order: 6 },
  { id: 'c-chaos-2', slug: 'oops-moments', title: 'Lỡ tay, lỡ lời', description: 'Những pha bất ngờ khiến cả lớp không nhịn được cười.', space: 'chaos', layout_type: 'film-strip', sort_order: 7 },
  { id: 'c-chaos-3', slug: 'funny-faces', title: 'Biểu cảm khó đỡ', description: 'Những gương mặt chỉ cần nhìn lại là bật cười.', space: 'chaos', layout_type: 'portrait-wall', sort_order: 8 },
  { id: 'c-chaos-4', slug: 'behind-scenes', title: 'Hậu trường không lên hình', description: 'Những chuyện vui xảy ra trước và sau khoảnh khắc được chụp.', space: 'chaos', layout_type: 'scrapbook', sort_order: 9 },
  { id: 'c-milestones-1', slug: 'october-days', title: 'Những ngày đặc biệt', description: 'Các dịp đáng nhớ và hoạt động của tập thể.', space: 'milestones', layout_type: 'exhibition', sort_order: 10 },
  { id: 'c-milestones-2', slug: 'stage-sports', title: 'Sân khấu & hội thao', description: 'Văn nghệ, thi đấu và những lần cổ vũ hết mình.', space: 'milestones', layout_type: 'film-strip', sort_order: 11 },
  { id: 'c-milestones-3', slug: 'class-trips', title: 'Những chuyến đi', description: 'Đi cùng nhau, có thêm vài câu chuyện để kể.', space: 'milestones', layout_type: 'scrapbook', sort_order: 12 },
  { id: 'c-people-1', slug: 'our-people', title: 'Gương mặt thân quen', description: 'Những người tạo nên 10B4.', space: 'people', layout_type: 'portrait-wall', sort_order: 13 },
  { id: 'c-people-2', slug: 'friend-groups', title: 'Hội bạn của chúng mình', description: 'Những nhóm nhỏ và những lần tụ lại bên nhau.', space: 'people', layout_type: 'portrait-wall', sort_order: 14 },
  { id: 'c-details-1', slug: 'little-things', title: 'Góc lớp & đồ vật', description: 'Bảng, bàn, cửa sổ và những thứ quá quen thuộc.', space: 'details', layout_type: 'scrapbook', sort_order: 15 },
  { id: 'c-details-2', slug: 'notes-and-letters', title: 'Mẩu giấy & nét chữ', description: 'Những lời nhắn, trang vở và điều nhỏ xíu được giữ lại.', space: 'details', layout_type: 'case-files', sort_order: 16 },
  { id: 'c-yearbook-1', slug: 'yearbook-candidates', title: 'Ảnh chọn cho video kỷ yếu', description: 'Những khung hình được chọn để kể lại hành trình ba năm.', space: 'yearbook', layout_type: 'exhibition', sort_order: 17 }
];

const DEMO_PHOTOS = []; // Không dùng ảnh minh họa giả làm ảnh thật của 10B4.


let supabase = null;
let isCurator = false;
let currentUser = null;
let collections = [...DEMO_COLLECTIONS];
let photos = [...DEMO_PHOTOS];
let yearbookIds = new Set(DEMO_PHOTOS.filter(p => p.is_yearbook_pick).map(p => p.id));
let yearbookTypes = new Map(DEMO_PHOTOS.filter(p => p.is_yearbook_pick).map(p => [p.id, p.yearbook_pick_type || 'candidate']));
let yearbookOrder = new Map();
let activeSpace = 'everyday';
let chapterSyncPending = false;
let searchTerm = '';
let viewerItems = [];
let viewerIndex = 0;
let selectedFiles = [];
let selectedFileUrls = [];
let selectedFileTitles = [];
let turnstileWidgetId = null;
let turnstileScriptPromise = null;
let touchStartX = 0;
let touchStartY = 0;

const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i=0;i<bytes.length;i++) bytes[i]=Math.floor(Math.random()*256);
  bytes[6]=(bytes[6]&0x0f)|0x40; bytes[8]=(bytes[8]&0x3f)|0x80;
  const hex=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
const canManage = () => DEMO_MODE || isCurator;
const cleanDownloadName = value => String(value || 'ky-niem-10B4').normalize('NFKC').replace(/[\\/:*?"<>|\x00-\x1F]/g, '-').replace(/\s+/g, ' ').trim().slice(0,120) || 'ky-niem-10B4';
const fileExtension = value => { const match = String(value || '').match(/\.([a-z0-9]{2,5})$/i); return match ? match[1].toLowerCase() : 'jpg'; };
const safeUrl = value => {
  try { const u = new URL(value, document.baseURI || location.href); return ['https:','http:','blob:','data:'].includes(u.protocol) ? u.href : ''; }
  catch { return ''; }
};
const prettyDate = value => {
  if (!value) return 'Chưa có ngày';
  const d = new Date(`${String(value).slice(0,10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return 'Chưa có ngày';
  return new Intl.DateTimeFormat('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }).format(d);
};
const monthLabel = value => {
  if (!value) return '';
  const d = new Date(`${String(value).slice(0,10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('vi-VN',{month:'long',year:'numeric'}).format(d);
};
const imageUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) return path;
  return supabase?.storage?.from(BUCKET).getPublicUrl(path).data.publicUrl || '';
};

function readDemoComments() {
  try { return JSON.parse(window.localStorage.getItem('memoryverse-demo-comments') || '{}') || {}; }
  catch { return {}; }
}
function writeDemoComments(value) {
  try { window.localStorage.setItem('memoryverse-demo-comments', JSON.stringify(value)); return true; }
  catch { return false; }
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
}
function openOverlay(el) { el.classList.add('open'); el.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open'); }
function closeOverlay(el) { el.classList.remove('open'); el.setAttribute('aria-hidden','true'); if (!$('.overlay.open')) document.body.classList.remove('modal-open'); }
const CHAPTER_COPY = {
  everyday: { title: 'Những ngày', accent: 'bình thường', description: 'Giờ học, giờ chơi, những buổi tan trường — những điều quen thuộc rồi sẽ thành điều đáng nhớ.', note: 'NHỮNG NGÀY QUEN THUỘC' },
  chaos: { title: 'Những pha', accent: 'khó đỡ', description: 'Một chút nghịch ngợm, vài tình huống ngoài dự kiến và những trận cười chẳng thể nhịn.', note: 'CƯỜI LÊN MỘT CHÚT' },
  milestones: { title: 'Những dấu', accent: 'mốc đáng nhớ', description: 'Những lần cùng nhau xuất hiện, thử sức, cổ vũ và làm nên chuyện của riêng lớp mình.', note: 'MỘT CHẶNG ĐƯỜNG' },
  people: { title: 'Những người', accent: 'làm nên 10B4', description: 'Gương mặt thân quen, những nhóm bạn và tất cả những người khiến tập thể này trở thành chính nó.', note: 'NHỮNG GƯƠNG MẶT THÂN QUEN' },
  details: { title: 'Những điều', accent: 'nhỏ bé', description: 'Một góc bàn, ô cửa sổ, mẩu giấy hay nét chữ — những chi tiết tưởng như rất nhỏ.', note: 'NHỮNG ĐIỀU Ở LẠI' },
  yearbook: { title: 'Một cuốn phim', accent: 'mang tên 10B4', description: 'Những khung hình được chọn lại, góp thành cuốn phim thanh xuân của chúng mình.', note: 'CUỐN PHIM CỦA CHÚNG MÌNH' }
};

function photosForSpace(space) {
  let list = [...photos];
  if (space === 'yearbook') {
    list = list.filter(p => yearbookIds.has(p.id) || p.is_yearbook_pick || p.collectionIds?.some(id => collections.find(c => c.id === id)?.space === 'yearbook'));
  } else {
    list = list.filter(p => p.collectionIds?.some(id => collections.find(c => c.id === id)?.space === space));
  }
  return list.sort((a,b) => String(b.taken_at || b.created_at || '').localeCompare(String(a.taken_at || a.created_at || '')));
}

function currentPhotos() {
  let list = searchTerm ? [...photos] : photosForSpace(activeSpace);
  if (searchTerm) {
    const term = searchTerm.toLocaleLowerCase('vi');
    list = list.filter(p => {
      const albumNames = (p.collectionIds || []).map(id => collections.find(c => c.id === id)?.title || '').join(' ');
      return [p.title, p.caption, ...(p.tags || []), albumNames].join(' ').toLocaleLowerCase('vi').includes(term);
    });
  }
  return list.sort((a,b) => String(b.taken_at || b.created_at || '').localeCompare(String(a.taken_at || a.created_at || '')));
}

function renderJourney() {
  const track = $('#journeyTrack');
  if (!track) return;
  const activeIndex = Math.max(0, SPACE_INFO.findIndex(space => space.id === activeSpace));
  track.innerHTML = SPACE_INFO.map((space, index) => {
    const chapter = CHAPTER_COPY[space.id];
    const list = photosForSpace(space.id);
    const featured = list[0];
    const src = featured ? safeUrl(featured.thumb || featured.src) : '';
    const countLabel = `${list.length} ${list.length === 1 ? 'khung hình' : 'khung hình'}`;
    const imageMarkup = src
      ? `<button class="chapter-photo-hit" type="button" data-photo-id="${escapeHTML(featured.id)}" aria-label="Mở ảnh ${escapeHTML(featured.title || 'kỉ niệm')}"><img src="${escapeHTML(src)}" alt="${escapeHTML(featured.title || 'Ảnh kỉ niệm 10B4')}" ${index === activeIndex ? 'fetchpriority="high"' : 'loading="lazy"'} /></button>`
      : '<div class="chapter-empty-art" aria-hidden="true"></div>';
    const actionMarkup = featured
      ? `<button class="chapter-open-photo" type="button" data-photo-id="${escapeHTML(featured.id)}">Xem khoảnh khắc <span>↗</span></button>`
      : '<span class="chapter-no-photo">✧ Chương này đang chờ ảnh thật của lớp</span>';
    return `<article class="journey-slide${index === activeIndex ? ' is-active' : ''}" data-space="${space.id}" aria-label="Chương ${space.index}: ${space.title}">
      ${imageMarkup}
      <div class="chapter-vignette" aria-hidden="true"></div>
      <div class="chapter-copy">
        <span class="chapter-index">CHƯƠNG ${space.index} / 06 · ${space.title.toLocaleUpperCase('vi')}</span>
        <h2>${escapeHTML(chapter.title)}<em>${escapeHTML(chapter.accent)}</em></h2>
        <p>${escapeHTML(chapter.description)}</p>
        <div class="chapter-meta"><span>${escapeHTML(countLabel)}</span><span>10B4 · 2026—2029</span></div>
        ${actionMarkup}
      </div>
      <div class="chapter-number-stamp">${space.index} / 06</div>
      <div class="chapter-corner-note"><i></i><b>${escapeHTML(chapter.note)}</b></div>
    </article>`;
  }).join('');
  $('#chapterDots').innerHTML = SPACE_INFO.map((space,index) => `<button type="button" class="chapter-dot${index === activeIndex ? ' active' : ''}" data-chapter-index="${index}" aria-label="Đến chương ${index+1}: ${escapeHTML(space.title)}" aria-current="${index === activeIndex ? 'step' : 'false'}"></button>`).join('');
  $('#chapterCount').textContent = String(activeIndex + 1).padStart(2,'0');
  track.scrollLeft = activeIndex * track.clientWidth;
  renderPhotoRibbon();
}

function renderPhotoRibbon() {
  const list = currentPhotos();
  const space = SPACE_INFO.find(s => s.id === activeSpace) || SPACE_INFO[0];
  const index = SPACE_INFO.findIndex(s => s.id === activeSpace);
  $('#ribbonKicker').textContent = searchTerm ? 'KẾT QUẢ TÌM KIẾM' : `CHƯƠNG ${space.index} · ${space.title.toLocaleUpperCase('vi')}`;
  $('#ribbonTitle').textContent = searchTerm ? 'Những khoảnh khắc tìm thấy' : `Những bức ảnh trong ${space.title.toLocaleLowerCase('vi')}`;
  $('#photoCount').textContent = `${list.length} ảnh`;
  $('#createYearbook').hidden = !(canManage() && activeSpace === 'yearbook' && !searchTerm);
  $('#photoRibbon').innerHTML = list.map((photo, i) => {
    const src = safeUrl(photo.thumb || photo.src);
    if (!src) return '';
    const stage = yearbookTypes.get(photo.id) || photo.yearbook_pick_type || '';
    const stageBadge = activeSpace === 'yearbook' && stage ? `<small class="ribbon-stage-badge ${stage === 'final' ? 'is-final' : ''}">${stage === 'final' ? 'FINAL' : 'ĐÃ CHỌN'}</small>` : '';
    return `<button type="button" class="ribbon-photo" data-photo-id="${escapeHTML(photo.id)}" aria-label="Xem ảnh ${escapeHTML(photo.title || 'kỉ niệm')}"><img src="${escapeHTML(src)}" alt="${escapeHTML(photo.title || 'Ảnh kỉ niệm')}" loading="lazy">${stageBadge}<span>${escapeHTML(photo.title || `Khung hình ${i+1}`)}</span></button>`;
  }).join('');
  $('#ribbonEmpty').hidden = list.length > 0;
  $('#ribbonEmptyTitle').textContent = searchTerm ? 'Chưa tìm thấy kỉ niệm phù hợp.' : 'Chương này vẫn đang chờ những bức ảnh đầu tiên.';
  $('#ribbonEmptyHint').textContent = searchTerm ? 'Thử tên người, sự kiện hoặc một từ khóa khác nhé.' : 'Khi có ảnh thật của lớp, chúng sẽ xuất hiện ở đây.';
  $('#searchStatus').textContent = searchTerm
    ? (list.length ? `Tìm thấy ${list.length} kỉ niệm phù hợp với “${searchTerm}”.` : `Chưa tìm thấy kỉ niệm phù hợp với “${searchTerm}”.`)
    : '';
  const activeIndex = Math.max(0,index);
  $$('.journey-slide').forEach((slide,i) => slide.classList.toggle('is-active', i === activeIndex));
  $$('.chapter-dot').forEach((dot,i) => {
    dot.classList.toggle('active',i === activeIndex);
    dot.setAttribute('aria-current',i === activeIndex ? 'step' : 'false');
  });
  $('#chapterCount').textContent = String(activeIndex + 1).padStart(2,'0');
}

function goToChapter(index, behavior = 'smooth') {
  const safeIndex = Math.max(0, Math.min(SPACE_INFO.length - 1, Number(index) || 0));
  activeSpace = SPACE_INFO[safeIndex].id;
  searchTerm = '';
  const search = $('#searchInput');
  if (search) search.value = '';
  const track = $('#journeyTrack');
  if (track) track.scrollTo({left: safeIndex * track.clientWidth, behavior});
  renderPhotoRibbon();
}

function syncChapterFromScroll() {
  if (chapterSyncPending) return;
  chapterSyncPending = true;
  requestAnimationFrame(() => {
    const track = $('#journeyTrack');
    if (track && track.clientWidth) {
      const index = Math.max(0, Math.min(SPACE_INFO.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
      const nextSpace = SPACE_INFO[index].id;
      if (nextSpace !== activeSpace) {
        activeSpace = nextSpace;
        renderPhotoRibbon();
      }
    }
    chapterSyncPending = false;
  });
}

function renderComments(items) {
  items = items.filter(c => !c.is_hidden);
  const list = $('#commentsList');
  $('#commentCount').textContent = `${items.length} lời nhắn`;
  if (!items.length) { list.innerHTML = '<div class="no-comments">Chưa có bình luận nào. Cậu có thể là người đầu tiên kể lại khoảnh khắc này.</div>'; return; }
  const top = items.filter(c => !c.parent_id);
  const children = new Map();
  items.filter(c => c.parent_id).forEach(c => { if (!children.has(c.parent_id)) children.set(c.parent_id,[]); children.get(c.parent_id).push(c); });
  const renderOne = c => `<div class="comment-item${c.parent_id ? ' reply' : ''}"><div class="comment-meta"><b>${escapeHTML(c.author_name)}</b><time>${prettyDate(c.created_at)}</time></div><p>${escapeHTML(c.body)}</p>${!c.parent_id ? `<button class="reply-link" data-reply-to="${escapeHTML(c.id)}">↳ Trả lời</button>` : ''}</div>`;
  list.innerHTML = top.map(c => renderOne(c) + (children.get(c.id)||[]).map(renderOne).join('')).join('');
}
async function loadPhotoComments(photo) {
  $('#commentMessage').textContent = '';
  if (DEMO_MODE) {
    const saved = readDemoComments();
    renderComments(saved[photo.id] || []);
    return;
  }
  $('#commentsList').innerHTML = '<div class="no-comments">Đang mở những lời nhắn...</div>';
  const { data, error } = await supabase.from('comments').select('id,photo_id,parent_id,author_name,body,created_at').eq('photo_id',photo.id).eq('is_hidden',false).order('created_at',{ascending:true});
  if (error) { $('#commentsList').innerHTML = '<div class="no-comments">Chưa tải được bình luận.</div>'; console.error(error); return; }
  renderComments(data || []);
}
function setViewerPhoto() {
  if (!viewerItems.length) return;
  const p = viewerItems[viewerIndex];
  $('#yearbookActions').hidden = !canManage();
  $('#photoAdminTools').hidden = !canManage();
  $('#editPhotoTitle').value = p.title || '';
  $('#downloadOriginal').disabled = !p.src && !p.storage_path;
  updateYearbookControls(p);
  $('#commentForm').dataset.parentId = '';
  $('#commentBody').placeholder = 'Bạn còn nhớ chuyện gì hôm ấy?';
  const img = $('#viewerImage');
  img.classList.add('changing');
  const source = safeUrl(p.src || p.thumb);
  img.onload = () => img.classList.remove('changing');
  img.onerror = () => { img.classList.remove('changing'); img.alt = 'Không thể tải ảnh này'; };
  img.src = source;
  img.alt = p.title || 'Ký ức lớp mình';
  $('#viewerImageWrap').classList.toggle('is-portrait', Number(p.height || 0) > Number(p.width || 0));
  $('#viewerImageWrap').classList.toggle('is-landscape', Number(p.width || 0) >= Number(p.height || 0));
  $('#viewerPosition').textContent = `${String(viewerIndex+1).padStart(2,'0')} / ${String(viewerItems.length).padStart(2,'0')}`;
  $('#viewerTitle').textContent = p.title || 'Một khoảnh khắc';
  $('#viewerCaption').textContent = p.caption || '';
  $('#viewerCollection').textContent = (collections.find(c => p.collectionIds?.includes(c.id))?.title || 'KỶ NIỆM').toUpperCase();
  $('#viewerDate').textContent = monthLabel(p.taken_at || p.created_at);
  $('#viewerTags').innerHTML = (p.tags || []).slice(0,5).map(t=>`<span>${escapeHTML(t)}</span>`).join('');
  $('#viewerPrev').disabled = viewerItems.length < 2;
  $('#viewerNext').disabled = viewerItems.length < 2;
  loadPhotoComments(p);
  if (!DEMO_MODE) ensureTurnstile();
}
function openViewer(photoId) {
  viewerItems = currentPhotos();
  viewerIndex = viewerItems.findIndex(p => p.id === photoId);
  if (viewerIndex < 0) { viewerItems = photos; viewerIndex = viewerItems.findIndex(p=>p.id===photoId); }
  if (viewerIndex < 0) return;
  openOverlay($('#viewer'));
  setViewerPhoto();
}
function moveViewer(delta) {
  if (viewerItems.length < 2) return;
  viewerIndex = (viewerIndex + delta + viewerItems.length) % viewerItems.length;
  setViewerPhoto();
}

async function downloadOriginalImage() {
  const photo = viewerItems[viewerIndex];
  if (!photo) return;
  const button = $('#downloadOriginal');
  button.disabled = true;
  button.classList.add('is-loading');
  try {
    let blob;
    if (!DEMO_MODE && photo.storage_path) {
      const { data, error } = await supabase.storage.from(BUCKET).download(photo.storage_path);
      if (error) throw error;
      blob = data;
    } else {
      const source = photo.src || photo.thumb;
      const response = await fetch(source);
      if (!response.ok) throw new Error('Không tải được ảnh gốc.');
      blob = await response.blob();
    }
    const ext = fileExtension(photo.original_filename || photo.originalName || photo.storage_path || photo.src);
    const filename = `${cleanDownloadName(photo.title)}.${ext}`;
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    showToast('Đã chuẩn bị ảnh gốc để lưu về máy.');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Chưa thể tải ảnh gốc. Hãy thử lại.');
  } finally {
    button.disabled = false;
    button.classList.remove('is-loading');
  }
}

async function savePhotoTitle() {
  if (!canManage()) return;
  const photo = viewerItems[viewerIndex];
  const title = $('#editPhotoTitle').value.trim();
  if (!photo || !title) { showToast('Tên ảnh không được để trống.'); return; }
  if (title.length > 160) { showToast('Tên ảnh tối đa 160 ký tự.'); return; }
  const button = $('#savePhotoTitle');
  button.disabled = true;
  try {
    if (!DEMO_MODE) {
      const { error } = await supabase.from('photos').update({ title }).eq('id', photo.id);
      if (error) throw error;
    }
    photo.title = title;
    const master = photos.find(item => item.id === photo.id);
    if (master) master.title = title;
    $('#viewerTitle').textContent = title;
    renderJourney();
    showToast('Đã cập nhật tên kỉ niệm.');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Chưa lưu được tên ảnh.');
  } finally { button.disabled = false; }
}

async function loadModeration() {
  const host=$('#moderationList');
  if(!host) return;
  let rows=[];
  if(DEMO_MODE){
    const stored=readDemoComments();
    rows=Object.values(stored).flat().map(c=>({...c,photo_title:photos.find(p=>p.id===c.photo_id)?.title || 'Ảnh đã lưu'}));
  } else if(isCurator){
    const {data,error}=await supabase.from('comments').select('id,photo_id,author_name,body,created_at,is_hidden,photos(title)').order('created_at',{ascending:false}).limit(60);
    if(error){host.innerHTML='<p class="no-comments">Chưa tải được danh sách lời nhắn.</p>';return;}
    rows=(data||[]).map(c=>({...c,photo_title:c.photos?.title || 'Ảnh đã lưu'}));
  } else return;
  rows.sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
  if(!rows.length){host.innerHTML='<p class="no-comments">Chưa có lời nhắn nào.</p>';return;}
  host.innerHTML=rows.map(c=>`<article class="moderation-item"><div class="moderation-item-top"><b>${escapeHTML(c.author_name)} ${c.is_hidden?'<span style="color:#9c5b51;font-weight:400">· đã ẩn</span>':''}</b><small>${prettyDate(c.created_at)}</small></div><small>${escapeHTML(c.photo_title)}</small><p>${escapeHTML(c.body)}</p><div class="moderation-actions">${c.is_hidden?`<button data-comment-action="show" data-comment-id="${escapeHTML(c.id)}">Hiện lại</button>`:`<button data-comment-action="hide" data-comment-id="${escapeHTML(c.id)}">Ẩn lời nhắn</button>`}<button class="danger" data-comment-action="delete" data-comment-id="${escapeHTML(c.id)}">Xóa</button></div></article>`).join('');
}
async function moderateComment(action,id) {
  if(DEMO_MODE){
    const stored=readDemoComments();
    for(const photoId of Object.keys(stored)){
      const target=stored[photoId].find(c=>c.id===id);
      if(target){if(action==='delete')stored[photoId]=stored[photoId].filter(c=>c.id!==id);else target.is_hidden=action==='hide';}
    }
    if (!writeDemoComments(stored)) { showToast('Không thể lưu lời nhắn trên trình duyệt này.'); return; }
    if(viewerItems[viewerIndex]) loadPhotoComments(viewerItems[viewerIndex]);
  } else {
    if(!isCurator) return;
    const result=action==='delete'?await supabase.from('comments').delete().eq('id',id):await supabase.from('comments').update({is_hidden:action==='hide'}).eq('id',id);
    if(result.error){showToast('Chưa cập nhật được lời nhắn.');return;}
    if(viewerItems[viewerIndex]) loadPhotoComments(viewerItems[viewerIndex]);
  }
  await loadModeration(); showToast(action==='delete'?'Đã xóa lời nhắn.':action==='hide'?'Đã ẩn lời nhắn.':'Đã hiện lại lời nhắn.');
}

function setCollectionsForUpload() {
  const available = collections.filter(c=>c.space!=='yearbook');
  $('#uploadCollectionChoices').innerHTML = available.map((c,i)=>`<label class="collection-choice"><input type="checkbox" name="uploadCollection" value="${escapeHTML(c.id)}" ${i===0?'checked':''}><span>${escapeHTML(c.title)}</span></label>`).join('');
}
function setMode() {
  $('#modeIndicator').innerHTML = DEMO_MODE ? '<i></i> BẢN XEM THỬ' : '<i></i> ĐÃ KẾT NỐI';
  $('#demoWarning').hidden = !DEMO_MODE;
  $('#loginForm').hidden = DEMO_MODE || isCurator;
  $('#uploadWorkspace').hidden = !DEMO_MODE && !isCurator;
  $('#curatorSession').hidden = DEMO_MODE || !isCurator;
  if (currentUser) $('#curatorIdentity').textContent = currentUser.email || 'Người quản lý';
  $('#moderationWorkspace').hidden = !DEMO_MODE && !isCurator;
  $('#createYearbook').hidden = !(canManage() && activeSpace === 'yearbook' && !searchTerm);
  if (DEMO_MODE || isCurator) loadModeration();
}
function openCurator() {
  setMode(); openOverlay($('#curatorModal'));
}
function selectFiles(fileList) {
  selectedFileUrls.forEach(url=>URL.revokeObjectURL(url));
  selectedFileUrls=[];
  selectedFiles = [...fileList].filter(file => ['image/jpeg','image/png','image/webp','image/avif'].includes(file.type));
  selectedFileUrls=selectedFiles.map(file=>URL.createObjectURL(file));
  selectedFileTitles = selectedFiles.map(file => ({ title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g,' ').trim().slice(0,160) }));
  const box = $('#selectedFiles');
  box.hidden = !selectedFiles.length;
  $('#selectedFilesHeading').hidden = !selectedFiles.length;
  $('#uploadButton').disabled = selectedFiles.length === 0;
  box.innerHTML = selectedFiles.map((file,i) => `<div class="selected-file"><img src="${escapeHTML(selectedFileUrls[i])}" alt=""><div class="selected-file-meta"><small>ẢNH ${String(i+1).padStart(2,'0')} · ${(file.size/1024/1024).toFixed(1)} MB</small><label for="fileTitle${i}">Tên hiển thị</label><input id="fileTitle${i}" class="file-title-input" type="text" maxlength="160" value="${escapeHTML(selectedFileTitles[i].title)}" data-file-title="${i}" placeholder="Ví dụ: Một chiều tháng mười"></div></div>`).join('');
  if (fileList.length && selectedFiles.length !== fileList.length) showToast('Một số tệp không phải ảnh nên đã được bỏ qua.');
}
function fileToDataUrl(file) {
  return new Promise((resolve,reject) => { const r = new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file); });
}
function createThumbnail(file, maxEdge=1000) {
  return new Promise((resolve,reject) => {
    const url = URL.createObjectURL(file); const image = new Image();
    image.onload = () => {
      const ratio = Math.min(1, maxEdge / Math.max(image.naturalWidth,image.naturalHeight));
      const canvas = document.createElement('canvas'); canvas.width=Math.round(image.naturalWidth*ratio); canvas.height=Math.round(image.naturalHeight*ratio);
      const ctx = canvas.getContext('2d'); ctx.drawImage(image,0,0,canvas.width,canvas.height);
      canvas.toBlob(blob => { URL.revokeObjectURL(url); if (blob) resolve({blob,width:image.naturalWidth,height:image.naturalHeight}); else reject(new Error('Không tạo được ảnh xem trước.')); },'image/webp',.82);
    };
    image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Không đọc được ảnh.'));}; image.src=url;
  });
}
async function sha256(file) {
  const bytes = await file.arrayBuffer(); const hash = await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function setUploadProgress(done,total,text) {
  $('#uploadProgress').hidden=false; $('#progressBar').style.width=`${Math.round(done/Math.max(total,1)*100)}%`; $('#progressText').textContent=text;
}
async function uploadSelectedFiles() {
  if (!selectedFiles.length) return;
  const collectionIds=$$('input[name="uploadCollection"]:checked').map(input=>input.value); const date=$('#uploadDate').value || null; const note=$('#uploadNote').value.trim();
  const tags=[...new Set($('#uploadTags').value.split(',').map(tag=>tag.trim().toLocaleLowerCase('vi')).filter(Boolean))].slice(0,12);
  if (!collectionIds.length) { $('#uploadMessage').textContent='Hãy chọn ít nhất một bộ sưu tập.'; $('#uploadMessage').classList.add('error'); return; }
  $('#uploadMessage').classList.remove('error');
  $('#uploadButton').disabled=true; $('#uploadMessage').textContent=''; setUploadProgress(0,selectedFiles.length,'Đang chuẩn bị...');
  let completed=0; const errors=[];
  for (let fileIndex = 0; fileIndex < selectedFiles.length; fileIndex++) {
    const file = selectedFiles[fileIndex];
    const photoTitle = String(selectedFileTitles[fileIndex]?.title || '').trim().slice(0,160);
    try {
      if (!photoTitle) throw new Error(`${file.name}: hãy nhập tên hiển thị cho ảnh.`);
      if (file.size > 30*1024*1024) throw new Error(`${file.name}: vượt quá 30 MB.`);
      const thumb=await createThumbnail(file);
      if (DEMO_MODE) {
        const dataUrl=await fileToDataUrl(file);
        const id=`local-${makeId()}`;
        const p={id,title:photoTitle,originalName:file.name,original_filename:file.name,caption:note,taken_at:date || (()=>{const now=new Date();return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10)})(),created_at:new Date().toISOString(),collectionIds,tags,src:dataUrl,thumb:dataUrl,width:thumb.width,height:thumb.height,is_yearbook_pick:false};
        photos.unshift(p);
      } else {
        const hash=await sha256(file);
        const duplicate=await supabase.from('photos').select('id').eq('sha256',hash).maybeSingle();
        if (duplicate.error) throw duplicate.error;
        if (duplicate.data) throw new Error(`${file.name}: ảnh này đã có trong kho.`);
        const id=makeId(); const ext=(file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
        const originalPath=`originals/${id}.${ext}`; const thumbPath=`thumbs/${id}.webp`;
        const originalUpload=await supabase.storage.from(BUCKET).upload(originalPath,file,{contentType:file.type,upsert:false});
        if(originalUpload.error) throw originalUpload.error;
        const thumbUpload=await supabase.storage.from(BUCKET).upload(thumbPath,thumb.blob,{contentType:'image/webp',upsert:false});
        if(thumbUpload.error){await supabase.storage.from(BUCKET).remove([originalPath]);throw thumbUpload.error;}
        const insert=await supabase.from('photos').insert({id,title:photoTitle,original_filename:file.name,caption:note || null,taken_at:date,storage_path:originalPath,thumbnail_path:thumbPath,width:thumb.width,height:thumb.height,sha256:hash,is_published:true,created_by:currentUser.id}).select('id').single();
        if(insert.error){await supabase.storage.from(BUCKET).remove([originalPath,thumbPath]);throw insert.error;}
        const link=await supabase.from('photo_collections').insert(collectionIds.map(collection_id=>({photo_id:id,collection_id})));
        if(link.error){await supabase.from('photos').delete().eq('id',id);await supabase.storage.from(BUCKET).remove([originalPath,thumbPath]);throw link.error;}
        if(tags.length){
          const tagRows=await supabase.from('tags').upsert(tags.map(name=>({name})),{onConflict:'name'}).select('id,name');
          if(tagRows.error){await supabase.from('photos').delete().eq('id',id);await supabase.storage.from(BUCKET).remove([originalPath,thumbPath]);throw tagRows.error;}
          const tagLinks=await supabase.from('photo_tags').insert(tagRows.data.map(t=>({photo_id:id,tag_id:t.id})));
          if(tagLinks.error){await supabase.from('photos').delete().eq('id',id);await supabase.storage.from(BUCKET).remove([originalPath,thumbPath]);throw tagLinks.error;}
        }
      }
      completed++;
      setUploadProgress(completed,selectedFiles.length,`Đã thêm ${completed}/${selectedFiles.length} ảnh`);
    } catch (error) { errors.push(error.message || String(error)); }
  }
  if (!DEMO_MODE) await loadCloudData();
  else { renderJourney(); }
  const ok=completed;
  const destination = collectionIds.map(id=>collections.find(c=>c.id===id)?.title).filter(Boolean).join(', ') || 'album';
  const successText = DEMO_MODE ? `Đã thêm ${ok} ảnh vào ${destination}. Đây chỉ là bản xem thử; hãy kết nối Supabase để lưu ảnh bền vững.` : `Đã thêm ${ok} ảnh vào ${destination}. Hãy mở thử một ảnh và tải bản gốc về máy để xác nhận trước khi xóa ảnh khỏi điện thoại.`;
  $('#uploadMessage').textContent = errors.length ? `Đã thêm ${ok} ảnh. ${errors.join(' ')}` : successText;
  $('#uploadMessage').classList.toggle('error',errors.length>0 && ok===0);
  if(ok) showToast(`${ok} khung hình đã được thêm.`);
  selectedFiles=[]; selectedFileUrls.forEach(url=>URL.revokeObjectURL(url)); selectedFileUrls=[]; selectedFileTitles=[]; $('#photoFiles').value=''; $('#selectedFiles').hidden=true; $('#selectedFilesHeading').hidden=true; $('#selectedFiles').innerHTML=''; $('#uploadButton').disabled=true;
  if(!errors.length) { $('#uploadNote').value=''; $('#uploadTags').value=''; }
}

async function loadTurnstile() {
  if (DEMO_MODE || !CONFIG.TURNSTILE_SITE_KEY) return false;
  if (window.turnstile) return true;
  if (!turnstileScriptPromise) turnstileScriptPromise = new Promise((resolve,reject) => {
    const script=document.createElement('script'); script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async=true; script.defer=true;
    script.onload=()=>resolve(true); script.onerror=()=>reject(new Error('Không tải được xác minh chống spam.')); document.head.appendChild(script);
  });
  try { await turnstileScriptPromise; return !!window.turnstile; } catch { return false; }
}
async function ensureTurnstile() {
  if (DEMO_MODE) return;
  if (!CONFIG.TURNSTILE_SITE_KEY) {
    $('#commentMessage').textContent='Bình luận trực tuyến chưa được bật. Người quản lý cần hoàn tất cấu hình chống spam.';
    return;
  }
  const ready=await loadTurnstile();
  if (!ready || !window.turnstile || turnstileWidgetId !== null) return;
  turnstileWidgetId=window.turnstile.render('#turnstileContainer',{
    sitekey:CONFIG.TURNSTILE_SITE_KEY,
    theme:'light',
    size:'invisible',
    execution:'execute',
    appearance:'interaction-only',
    callback:(token)=>{
      if(turnstileTokenResolver){clearTimeout(requestTurnstileToken._timeout);turnstileTokenResolver(token);turnstileTokenResolver=null;turnstileTokenRejecter=null;}
    },
    'error-callback':()=>{if(turnstileTokenRejecter){clearTimeout(requestTurnstileToken._timeout);turnstileTokenRejecter(new Error('Xác minh không thành công. Hãy thử lại.'));turnstileTokenResolver=null;turnstileTokenRejecter=null;}}
  });
}
let turnstileTokenResolver=null;
let turnstileTokenRejecter=null;
async function requestTurnstileToken() {
  if (!window.turnstile || turnstileWidgetId === null) throw new Error('Chưa sẵn sàng xác minh bình luận.');
  return new Promise((resolve,reject)=>{
    turnstileTokenResolver=resolve;
    turnstileTokenRejecter=reject;
    const timeout=setTimeout(()=>{
      turnstileTokenResolver=null; turnstileTokenRejecter=null;
      reject(new Error('Chưa xác minh được. Hãy thử gửi lại.'));
    },15000);
    window.turnstile.execute(turnstileWidgetId);
    // The callback is registered on the existing widget below; keep timeout cleanup centralized.
    requestTurnstileToken._timeout=timeout;
  });
}

async function submitComment(event) {
  event.preventDefault();
  const photo=viewerItems[viewerIndex]; if(!photo) return;
  const name=$('#commentName').value.trim(); const body=$('#commentBody').value.trim();
  if(name.length<2 || body.length<2){$('#commentMessage').textContent='Tên và lời nhắn cần có ít nhất 2 ký tự.';$('#commentMessage').classList.add('error');return;}
  $('#commentMessage').classList.remove('error'); $('#commentMessage').textContent='Đang gửi...';
  const parentId=$('#commentForm').dataset.parentId || null;
  if(DEMO_MODE){
    const stored=readDemoComments();
    const entry={id:makeId(),photo_id:photo.id,parent_id:parentId,author_name:name,body,created_at:new Date().toISOString()};
    stored[photo.id]=stored[photo.id] || []; stored[photo.id].push(entry);
    if (!writeDemoComments(stored)) { $('#commentMessage').textContent='Trình duyệt này không cho phép lưu lời nhắn ở chế độ xem thử.'; $('#commentMessage').classList.add('error'); return; }
    $('#commentBody').value=''; $('#commentForm').dataset.parentId=''; $('#commentMessage').textContent='Đã lưu trên thiết bị này ở chế độ xem thử. Khi kết nối cloud, mọi người mới cùng nhìn thấy.'; renderComments(stored[photo.id]); return;
  }
  if(!CONFIG.TURNSTILE_SITE_KEY){$('#commentMessage').textContent='Bình luận trực tuyến chưa được bật. Người quản lý cần hoàn tất cấu hình chống spam.';$('#commentMessage').classList.add('error');return;}
  const submitButton=$('#commentForm button[type="submit"]'); submitButton.disabled=true;
  try {
    const token=await requestTurnstileToken();
    const {data,error}=await supabase.functions.invoke('submit-comment',{body:{photo_id:photo.id,author_name:name,body,parent_id:parentId,turnstile_token:token}});
    if(error || data?.error) throw new Error(data?.error || error?.message || 'Chưa gửi được bình luận.');
    $('#commentBody').value=''; $('#commentForm').dataset.parentId=''; $('#commentMessage').textContent='Đã gửi bình luận. Cảm ơn cậu!';
    window.turnstile?.reset(turnstileWidgetId); await loadPhotoComments(photo);
  } catch(error) {
    $('#commentMessage').textContent=error.message || 'Chưa gửi được bình luận.';
    $('#commentMessage').classList.add('error');
    window.turnstile?.reset(turnstileWidgetId);
  } finally { submitButton.disabled=false; }
}

async function loadCloudData() {
  const [cRes,pRes,pcRes,tRes,ytRes]=await Promise.all([
    supabase.from('collections').select('id,slug,title,description,space,layout_type,cover_image_path,sort_order,is_published').eq('is_published',true).order('sort_order'),
    supabase.from('photos').select('id,title,original_filename,caption,taken_at,storage_path,thumbnail_path,width,height,is_published,created_at').eq('is_published',true).order('taken_at',{ascending:false,nullsFirst:false}),
    supabase.from('photo_collections').select('photo_id,collection_id'),
    supabase.from('photo_tags').select('photo_id,tags(name)'),
    supabase.from('yearbook_picks').select('photo_id,pick_type,sort_order')
  ]);
  const firstError=[cRes,pRes,pcRes].find(r=>r.error)?.error;
  if(firstError) throw firstError;
  collections=(cRes.data||[]).map(c=>({...c,coverUrl:imageUrl(c.cover_image_path)}));
  const links=new Map(); (pcRes.data||[]).forEach(x=>{if(!links.has(x.photo_id))links.set(x.photo_id,[]);links.get(x.photo_id).push(x.collection_id);});
  const tagMap=new Map(); (tRes.data||[]).forEach(x=>{if(!tagMap.has(x.photo_id))tagMap.set(x.photo_id,[]);if(x.tags?.name)tagMap.get(x.photo_id).push(x.tags.name);});
  yearbookIds=new Set((ytRes.data||[]).map(x=>x.photo_id));
  yearbookTypes=new Map((ytRes.data||[]).map(x=>[x.photo_id,x.pick_type]));
  yearbookOrder=new Map((ytRes.data||[]).map(x=>[x.photo_id,Number(x.sort_order||0)]));
  photos=(pRes.data||[]).map(p=>({...p,src:imageUrl(p.storage_path),thumb:imageUrl(p.thumbnail_path || p.storage_path),collectionIds:links.get(p.id)||[],tags:tagMap.get(p.id)||[],is_yearbook_pick:yearbookIds.has(p.id),yearbook_pick_type:yearbookTypes.get(p.id)||''}));
  setCollectionsForUpload(); renderJourney();
}
async function checkCurator() {
  if(DEMO_MODE) return;
  const {data:{session}}=await supabase.auth.getSession(); currentUser=session?.user || null;
  if(!currentUser){isCurator=false;setMode();return;}
  const {data,error}=await supabase.from('profiles').select('role,display_name').eq('id',currentUser.id).maybeSingle();
  isCurator=!error && data?.role==='curator'; setMode();
  if(!isCurator) $('#loginMessage').textContent='Tài khoản này chưa được cấp quyền curator.';
}
async function loginCurator(event) {
  event.preventDefault(); $('#loginMessage').textContent='Đang xác thực...';
  const {data,error}=await supabase.auth.signInWithPassword({email:$('#adminEmail').value.trim(),password:$('#adminPassword').value});
  if(error){$('#loginMessage').textContent=error.message;$('#loginMessage').classList.add('error');return;}
  currentUser=data.user; await checkCurator();
  if(!isCurator){await supabase.auth.signOut();$('#loginMessage').textContent='Tài khoản chưa được cấp quyền curator trong bảng profiles.';return;}
  $('#loginMessage').textContent=''; showToast('Đã mở quyền quản lý ảnh.');
}
async function signOut() { await supabase.auth.signOut();currentUser=null;isCurator=false;setMode();showToast('Đã đăng xuất.'); }

async function setYearbookStage(stage) {
  const photo = viewerItems[viewerIndex];
  if (!photo || !canManage()) return;
  const oldStage = yearbookTypes.get(photo.id) || '';
  if (stage === oldStage) { updateYearbookControls(photo); return; }
  try {
    if (!DEMO_MODE) {
      if (!stage) {
        const { error } = await supabase.from('yearbook_picks').delete().eq('photo_id', photo.id);
        if (error) throw error;
      } else {
        const nextOrder = stage === 'final'
          ? Math.max(0, ...[...yearbookOrder.values()]) + 1
          : (yearbookOrder.get(photo.id) || Math.max(0, ...[...yearbookOrder.values()]) + 1);
        const { error } = await supabase.from('yearbook_picks').upsert({ photo_id: photo.id, pick_type: stage, sort_order: nextOrder });
        if (error) throw error;
        yearbookOrder.set(photo.id, nextOrder);
      }
    }
    if (stage) { yearbookIds.add(photo.id); yearbookTypes.set(photo.id, stage); }
    else { yearbookIds.delete(photo.id); yearbookTypes.delete(photo.id); yearbookOrder.delete(photo.id); }
    photo.is_yearbook_pick = !!stage;
    photo.yearbook_pick_type = stage;
    const master = photos.find(item => item.id === photo.id);
    if (master) { master.is_yearbook_pick = !!stage; master.yearbook_pick_type = stage; }
    updateYearbookControls(photo);
    renderJourney();
    showToast(stage === 'final' ? 'Đã đưa ảnh vào danh sách FINAL.' : stage === 'candidate' ? 'Đã thêm ảnh vào danh sách kỷ yếu.' : 'Đã bỏ ảnh khỏi kỷ yếu.');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Chưa cập nhật được danh sách kỷ yếu.');
  }
}

function updateYearbookControls(photo) {
  const stage = photo ? (yearbookTypes.get(photo.id) || '') : '';
  $('#yearbookStageLabel').textContent = stage === 'final' ? 'ĐÃ VÀO FINAL' : stage ? 'ĐÃ THÊM VÀO DANH SÁCH' : 'CHƯA ĐƯỢC CHỌN';
  $('#markYearbookCandidate').classList.toggle('is-picked', stage === 'candidate');
  $('#markYearbookCandidate').textContent = stage === 'candidate' ? '✓ Đã trong danh sách' : '＋ Thêm vào danh sách';
  $('#markYearbookFinal').classList.toggle('is-picked', stage === 'final');
  $('#markYearbookFinal').textContent = stage === 'final' ? '✓ Đã là FINAL' : '✦ Đưa vào FINAL';
  $('#removeYearbookPick').hidden = !stage;
  $('#createYearbook').hidden = !(canManage() && activeSpace === 'yearbook' && !searchTerm);
}

function openYearbookPDF() {
  if (!canManage()) return;
  const finalPhotos = photos.filter(p => (yearbookTypes.get(p.id) || p.yearbook_pick_type) === 'final')
    .sort((a,b) => (yearbookOrder.get(a.id)||0) - (yearbookOrder.get(b.id)||0));
  if (!finalPhotos.length) {
    showToast('Chưa có ảnh FINAL. Mở ảnh và chọn “Đưa vào FINAL” trước nhé.');
    return;
  }
  const printWindow = window.open('', '_blank');
  if (!printWindow) { showToast('Trình duyệt đang chặn cửa sổ mới. Hãy cho phép mở cửa sổ bật lên.'); return; }
  const pages = finalPhotos.map((photo, index) => {
    const src = safeUrl(photo.src || photo.thumb);
    const title = escapeHTML(photo.title || `Khoảnh khắc ${index+1}`);
    const caption = escapeHTML(photo.caption || '');
    const date = escapeHTML(prettyDate(photo.taken_at || photo.created_at));
    return `<article class="memory-page"><div class="page-top"><span>MEMORYVERSE · 10B4</span><span>${String(index+1).padStart(2,'0')} / ${String(finalPhotos.length).padStart(2,'0')}</span></div><div class="page-image"><img src="${escapeHTML(src)}" alt="${title}"></div><div class="page-copy"><span class="page-date">${date}</span><h2>${title}</h2>${caption ? `<p>${caption}</p>` : ''}</div><div class="page-foot">NHỮNG KỈ NIỆM ĐÁNG NHỚ CỦA 10B4 <span>✦</span></div></article>`;
  }).join('');
  const documentHTML = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kỷ yếu 10B4</title><style>
    *{box-sizing:border-box}body{margin:0;background:#e9e5dc;color:#1b2a40;font-family:Georgia,'Times New Roman',serif}.toolbar{position:sticky;top:0;z-index:3;display:flex;justify-content:center;gap:12px;padding:14px;background:rgba(17,31,52,.94);color:#fff;font:13px Arial,sans-serif;backdrop-filter:blur(12px)}.toolbar button{border:1px solid #e7d5b0;border-radius:999px;padding:10px 18px;background:#f2dfb7;color:#17243a;font-weight:700;cursor:pointer}.cover,.memory-page{width:min(900px,calc(100% - 32px));min-height:calc(100vh - 72px);margin:18px auto;padding:28px;background:#f8f5ef;box-shadow:0 16px 50px #17243a20;display:flex;flex-direction:column;break-after:page;page-break-after:always}.cover{justify-content:center;align-items:center;text-align:center;background:radial-gradient(circle at 80% 12%,#f3dfbd,transparent 32%),linear-gradient(145deg,#152947,#293c59);color:#fff}.cover small{letter-spacing:.25em;color:#e8cf9f}.cover h1{font-size:clamp(42px,8vw,78px);font-weight:400;line-height:1.02;margin:24px 0}.cover h1 em{display:block;color:#f4d391;font-style:italic}.cover p{max-width:520px;color:#d8dfeb;line-height:1.8}.cover .cover-star{margin-top:32px;color:#f4d391;font-size:26px}.page-top,.page-foot{display:flex;justify-content:space-between;color:#9c8967;font:10px Arial,sans-serif;letter-spacing:.15em}.page-image{flex:1;min-height:0;display:grid;place-items:center;margin:28px 0 20px;padding:12px;background:#101c30;border-radius:12px}.page-image img{display:block;max-width:100%;max-height:65vh;object-fit:contain}.page-copy{padding:0 2vw 22px}.page-date{font:11px Arial,sans-serif;letter-spacing:.15em;color:#a28b61}.page-copy h2{font-size:34px;line-height:1.12;font-weight:400;margin:10px 0;color:#1b2a40}.page-copy p{font:14px/1.7 Arial,sans-serif;color:#697386;white-space:pre-wrap}.page-foot{border-top:1px solid #e5dfd2;padding-top:14px}.page-foot span{color:#c4a56c}@media(max-width:600px){.cover,.memory-page{min-height:calc(100svh - 26px);width:calc(100% - 16px);padding:17px}.page-image img{max-height:55svh}.page-copy h2{font-size:27px}}@media print{body{background:#fff}.toolbar{display:none}.cover,.memory-page{width:100%;min-height:100vh;margin:0;box-shadow:none;break-after:page;page-break-after:always;print-color-adjust:exact;-webkit-print-color-adjust:exact}.page-image img{max-height:68vh}@page{size:A4 portrait;margin:0}}
    </style></head><body><nav class="toolbar"><span>Đã chọn ${finalPhotos.length} ảnh FINAL</span><button onclick="window.print()">In / Lưu thành PDF</button></nav><section class="cover"><small>MEMORYVERSE · LỚP 10B4</small><h1>Những kỉ niệm đáng nhớ <em>của 10B4</em></h1><p>Một cuốn kỷ yếu nhỏ, gom những khoảnh khắc chúng mình muốn giữ lại lâu hơn một chút.</p><span class="cover-star">✦</span></section>${pages}</body></html>`;
  printWindow.document.open();
  printWindow.document.write(documentHTML);
  printWindow.document.close();
}

function bindEvents() {
  const track = $('#journeyTrack');
  track.addEventListener('scroll', syncChapterFromScroll, {passive:true});
  track.addEventListener('click', e => {
    const trigger = e.target.closest('[data-photo-id]');
    if (trigger) openViewer(trigger.dataset.photoId);
  });
  $('#chapterDots').addEventListener('click', e => {
    const dot = e.target.closest('[data-chapter-index]');
    if (dot) goToChapter(Number(dot.dataset.chapterIndex));
  });
  $('#chapterPrev').addEventListener('click', () => goToChapter(SPACE_INFO.findIndex(s => s.id === activeSpace) - 1));
  $('#chapterNext').addEventListener('click', () => goToChapter(SPACE_INFO.findIndex(s => s.id === activeSpace) + 1));
  $('#photoRibbon').addEventListener('click', e => {
    const card = e.target.closest('[data-photo-id]');
    if (card) openViewer(card.dataset.photoId);
  });
  $('#searchInput').addEventListener('input', e => {
    searchTerm = e.target.value.trim();
    renderPhotoRibbon();
  });

  $('#openCurator').addEventListener('click', openCurator);
  $('#closeCurator').addEventListener('click', () => closeOverlay($('#curatorModal')));
  $('#closeViewer').addEventListener('click', () => closeOverlay($('#viewer')));
  $('#viewerPrev').addEventListener('click', () => moveViewer(-1));
  $('#viewerNext').addEventListener('click', () => moveViewer(1));
  $('#viewer').addEventListener('click', e => { if (e.target === $('#viewer')) closeOverlay($('#viewer')); });
  $('#curatorModal').addEventListener('click', e => { if (e.target === $('#curatorModal')) closeOverlay($('#curatorModal')); });
  $('#commentForm').addEventListener('submit', submitComment);
  $('#markYearbookCandidate').addEventListener('click', () => setYearbookStage('candidate'));
  $('#markYearbookFinal').addEventListener('click', () => setYearbookStage('final'));
  $('#removeYearbookPick').addEventListener('click', () => setYearbookStage(''));
  $('#downloadOriginal').addEventListener('click', downloadOriginalImage);
  $('#savePhotoTitle').addEventListener('click', savePhotoTitle);
  $('#createYearbook').addEventListener('click', openYearbookPDF);
  $('#openYearbookFromStudio').addEventListener('click', openYearbookPDF);
  $('#moderationList').addEventListener('click', e => {
    const btn = e.target.closest('[data-comment-action]');
    if (btn) moderateComment(btn.dataset.commentAction, btn.dataset.commentId);
  });
  $('#commentsList').addEventListener('click', e => {
    const btn = e.target.closest('[data-reply-to]');
    if (!btn) return;
    $('#commentForm').dataset.parentId = btn.dataset.replyTo;
    $('#commentBody').placeholder = 'Viết lời hồi đáp...';
    $('#commentBody').focus();
  });
  $('#photoFiles').addEventListener('change', e => selectFiles(e.target.files));
  $('#selectedFiles').addEventListener('input', e => {
    const input = e.target.closest('[data-file-title]');
    if (input) selectedFileTitles[Number(input.dataset.fileTitle)] = { title: input.value };
  });
  $('#uploadButton').addEventListener('click', uploadSelectedFiles);
  $('#dropzone').addEventListener('dragover', e => { e.preventDefault(); $('#dropzone').classList.add('dragover'); });
  $('#dropzone').addEventListener('dragleave', () => $('#dropzone').classList.remove('dragover'));
  $('#dropzone').addEventListener('drop', e => { e.preventDefault(); $('#dropzone').classList.remove('dragover'); selectFiles(e.dataTransfer.files); });
  $('#loginForm').addEventListener('submit', loginCurator);
  $('#signOutButton').addEventListener('click', signOut);

  document.addEventListener('keydown', e => {
    const target = e.target;
    const typing = target && (target.matches('input,textarea,select') || target.isContentEditable);
    if ($('#viewer').classList.contains('open')) {
      if (e.key === 'Escape') closeOverlay($('#viewer'));
      if (e.key === 'ArrowRight') moveViewer(1);
      if (e.key === 'ArrowLeft') moveViewer(-1);
    } else if ($('#curatorModal').classList.contains('open') && e.key === 'Escape') {
      closeOverlay($('#curatorModal'));
    } else if (!typing && e.key === 'ArrowRight') {
      goToChapter(SPACE_INFO.findIndex(s => s.id === activeSpace) + 1);
    } else if (!typing && e.key === 'ArrowLeft') {
      goToChapter(SPACE_INFO.findIndex(s => s.id === activeSpace) - 1);
    }
  });
  $('#viewerSwipeArea').addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, {passive:true});
  $('#viewerSwipeArea').addEventListener('touchend', e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) moveViewer(dx < 0 ? 1 : -1);
  }, {passive:true});
}

async function init() {
  bindEvents(); setCollectionsForUpload(); renderJourney();
  const now=new Date(); $('#uploadDate').value=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
  if(!DEMO_MODE){
    try{
      const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2');
      supabase=createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_ANON_KEY);
      await checkCurator(); await loadCloudData();
    }catch(error){console.error(error);showToast('Chưa kết nối được Supabase. Kiểm tra cấu hình trong config.js.');}
  }else{
    // Bản xem thử không chèn ảnh hoặc bình luận giả; nội dung chỉ xuất hiện khi người quản lý thêm ảnh thật.
  }
  setMode();
}

init();
