import { ChapterTheme, CollectionItem, ReactionKey } from '../types/memory';

export const CHAPTERS: ChapterTheme[] = [
  {
    id: 'everyday',
    index: '01',
    title: 'Đời thường',
    shortTitle: 'Đời thường',
    headlinePrimary: 'Những ngày',
    headlineAccent: 'bình thường',
    description:
      'Giờ học, giờ chơi, những buổi tan trường — những điều quen thuộc rồi sẽ thành điều đáng nhớ.',
    cornerNote: 'NHỮNG NGÀY QUEN THUỘC',
    surfaceTone: 'twilight',
    ambientBg:
      'radial-gradient(ellipse at 20% 15%, rgba(86, 124, 186, 0.45), transparent 44%), radial-gradient(ellipse at 82% 76%, rgba(235, 189, 120, 0.22), transparent 42%), linear-gradient(148deg, #0b1426 0%, #172848 54%, #101d34 100%)',
    slideBackdrop:
      'radial-gradient(ellipse at 76% 28%, rgba(244, 208, 142, 0.34), transparent 34%), radial-gradient(ellipse at 22% 82%, rgba(108, 146, 198, 0.32), transparent 44%), linear-gradient(128deg, #1b3052 0%, #13223b 56%, #4e4756 100%)',
    lightLeakColor: 'rgba(243, 209, 142, 0.26)',
    accentHex: '#f2cf88',
    melodyName: 'Lo-fi Piano & Mưa nhẹ',
  },
  {
    id: 'chaos',
    index: '02',
    title: 'Chuyện khó đỡ',
    shortTitle: 'Khó đỡ',
    headlinePrimary: 'Những pha',
    headlineAccent: 'khó đỡ',
    description:
      'Một chút nghịch ngợm, vài tình huống ngoài dự kiến và những trận cười chẳng thể nhịn.',
    cornerNote: 'CƯỜI LÊN MỘT CHÚT',
    surfaceTone: 'sunlit',
    ambientBg:
      'radial-gradient(ellipse at 26% 18%, rgba(206, 124, 108, 0.32), transparent 44%), radial-gradient(ellipse at 84% 72%, rgba(92, 130, 188, 0.36), transparent 44%), linear-gradient(148deg, #171a2d 0%, #272743 52%, #141c31 100%)',
    slideBackdrop:
      'radial-gradient(ellipse at 78% 24%, rgba(235, 149, 122, 0.36), transparent 35%), radial-gradient(ellipse at 20% 78%, rgba(242, 207, 136, 0.24), transparent 45%), linear-gradient(130deg, #2a2844 0%, #1d2239 54%, #5e3c42 100%)',
    lightLeakColor: 'rgba(238, 152, 125, 0.28)',
    accentHex: '#f0b695',
    melodyName: 'Pizzicato & Piano nhí nhảnh',
  },
  {
    id: 'milestones',
    index: '03',
    title: 'Dấu mốc',
    shortTitle: 'Dấu mốc',
    headlinePrimary: 'Những dấu',
    headlineAccent: 'mốc đáng nhớ',
    description:
      'Những lần cùng nhau xuất hiện, thử sức, cổ vũ và làm nên chuyện của riêng lớp mình.',
    cornerNote: 'MỘT CHẶNG ĐƯỜNG',
    surfaceTone: 'twilight',
    ambientBg:
      'radial-gradient(ellipse at 18% 20%, rgba(226, 176, 98, 0.28), transparent 42%), radial-gradient(ellipse at 80% 76%, rgba(78, 118, 175, 0.4), transparent 46%), linear-gradient(148deg, #0d1629 0%, #1a2d4c 52%, #162138 100%)',
    slideBackdrop:
      'radial-gradient(ellipse at 74% 26%, rgba(242, 198, 114, 0.38), transparent 34%), radial-gradient(ellipse at 25% 80%, rgba(96, 136, 186, 0.32), transparent 44%), linear-gradient(128deg, #1b2f4e 0%, #132037 56%, #594b3b 100%)',
    lightLeakColor: 'rgba(244, 198, 112, 0.28)',
    accentHex: '#f4ca7e',
    melodyName: 'Piano & Violin Ballad',
  },
  {
    id: 'people',
    index: '04',
    title: 'Con người',
    shortTitle: 'Con người',
    headlinePrimary: 'Những người',
    headlineAccent: 'làm nên 10B4',
    description:
      'Gương mặt thân quen, những nhóm bạn và tất cả những người khiến tập thể này trở thành chính nó.',
    cornerNote: 'NHỮNG GƯƠNG MẶT THÂN QUEN',
    surfaceTone: 'sunlit',
    ambientBg:
      'radial-gradient(ellipse at 22% 16%, rgba(192, 146, 138, 0.32), transparent 44%), radial-gradient(ellipse at 84% 74%, rgba(96, 128, 176, 0.38), transparent 44%), linear-gradient(148deg, #13192b 0%, #242b44 54%, #151d30 100%)',
    slideBackdrop:
      'radial-gradient(ellipse at 76% 30%, rgba(232, 188, 172, 0.36), transparent 36%), radial-gradient(ellipse at 22% 76%, rgba(124, 152, 194, 0.3), transparent 44%), linear-gradient(128deg, #243049 0%, #192238 56%, #5c494e 100%)',
    lightLeakColor: 'rgba(232, 186, 172, 0.26)',
    accentHex: '#eec5b4',
    melodyName: 'Song tấu Chiều tan học',
  },
  {
    id: 'details',
    index: '05',
    title: 'Điều nhỏ bé',
    shortTitle: 'Điều nhỏ bé',
    headlinePrimary: 'Những điều',
    headlineAccent: 'nhỏ bé',
    description:
      'Một góc bàn, ô cửa sổ, mẩu giấy hay nét chữ — những chi tiết tưởng như rất nhỏ.',
    cornerNote: 'NHỮNG ĐIỀU Ở LẠI',
    surfaceTone: 'twilight',
    ambientBg:
      'radial-gradient(ellipse at 20% 22%, rgba(124, 156, 148, 0.28), transparent 44%), radial-gradient(ellipse at 82% 72%, rgba(218, 188, 140, 0.24), transparent 42%), linear-gradient(148deg, #0d1725 0%, #1a2b3d 54%, #111b2a 100%)',
    slideBackdrop:
      'radial-gradient(ellipse at 78% 28%, rgba(228, 206, 166, 0.32), transparent 36%), radial-gradient(ellipse at 20% 80%, rgba(114, 154, 148, 0.3), transparent 44%), linear-gradient(128deg, #1c313e 0%, #142232 56%, #4a4c47 100%)',
    lightLeakColor: 'rgba(218, 206, 172, 0.24)',
    accentHex: '#e6d8b5',
    melodyName: 'Hộp nhạc & Cát-sét',
  },
  {
    id: 'yearbook',
    index: '06',
    title: 'Kỷ yếu',
    shortTitle: 'Kỷ yếu',
    headlinePrimary: 'Một cuốn phim',
    headlineAccent: 'mang tên 10B4',
    description:
      'Những khung hình được chọn lại, góp thành cuốn phim thanh xuân của chúng mình.',
    cornerNote: 'CUỐN PHIM CỦA CHÚNG MÌNH',
    surfaceTone: 'twilight',
    ambientBg:
      'radial-gradient(ellipse at 22% 16%, rgba(242, 207, 136, 0.3), transparent 42%), radial-gradient(ellipse at 82% 76%, rgba(84, 114, 168, 0.42), transparent 44%), linear-gradient(148deg, #0a1222 0%, #162441 52%, #0e182c 100%)',
    slideBackdrop:
      'radial-gradient(ellipse at 77% 28%, rgba(245, 212, 148, 0.42), transparent 34%), radial-gradient(ellipse at 22% 80%, rgba(102, 136, 188, 0.32), transparent 44%), linear-gradient(128deg, #182949 0%, #101b32 56%, #564a3e 100%)',
    lightLeakColor: 'rgba(246, 214, 148, 0.32)',
    accentHex: '#f5d490',
    melodyName: 'Hòa tấu Thanh xuân 10B4',
  },
];

export const COLLECTIONS: CollectionItem[] = [
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
  { id: 'c-yearbook-1', slug: 'yearbook-candidates', title: 'Ảnh chọn cho kỷ yếu', description: 'Những khung hình được chọn để kể lại hành trình ba năm.', space: 'yearbook', layout_type: 'exhibition', sort_order: 17 },
];

export const REACTION_META: { key: ReactionKey; label: string }[] = [
  { key: 'like', label: 'Thích' },
  { key: 'heart', label: 'Tim' },
  { key: 'care', label: 'Thương thương' },
  { key: 'cry', label: 'Khóc huhu' },
  { key: 'angry', label: 'Tức giận' },
];
