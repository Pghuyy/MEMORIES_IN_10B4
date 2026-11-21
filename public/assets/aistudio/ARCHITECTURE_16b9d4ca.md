# MEMORYVERSE — Đặc tả trải nghiệm và kiến trúc

## 1. Mục tiêu

MEMORYVERSE là một hành trình khám phá liên tục cho tập thể lớp 10B4 (2026–2029), không phải trang quản lý album. Thành viên ở lại trên cùng một trang để lướt qua sáu chương, chạm ảnh để xem lớn và trò chuyện ngay bên cạnh kỉ niệm đó.

### Nguyên tắc giao diện

- Một trang chính, một khung ảnh lớn tại một thời điểm, một luồng khám phá ngang.
- Phong cách film lãng mạn: ánh sáng tự nhiên, xanh chạng vạng, sắc vàng nắng, chữ serif thanh lịch, hạt film nhẹ.
- Thành phần điều khiển dùng Liquid Glass có tiết chế: kính mờ, viền sáng mảnh, nền trong suốt; tránh để hiệu ứng che ảnh hoặc làm giảm khả năng đọc.
- Ảnh gốc không bị áp một bộ lọc màu. Không sử dụng ảnh stock hoặc ảnh minh họa như thể là ảnh thật của lớp.
- Điện thoại là ưu tiên; hỗ trợ vuốt cảm ứng, nút mũi tên, dấu chương, bàn phím và `prefers-reduced-motion`.
- Toàn bộ nội dung giao diện viết bằng tiếng Việt.

## 2. Hành trình sáu chương

Thứ tự cố định:

1. Đời thường
2. Chuyện khó đỡ
3. Dấu mốc
4. Con người
5. Điều nhỏ bé
6. Kỷ yếu

Mỗi chương là một slide toàn chiều rộng trong `#journeyTrack`. Container dùng `display:flex`, `overflow-x:auto`, `scroll-snap-type:x mandatory` và native touch momentum. Chương hiện tại được cập nhật theo vị trí cuộn; người xem có thể vuốt, chạm dấu chương, dùng mũi tên hoặc phím trái/phải.

Mỗi slide lấy một ảnh đã xuất bản trong chương tương ứng làm ảnh chủ đạo. Khi chưa có ảnh thật, slide dùng nền ánh sáng trừu tượng, không tạo ảnh giả. Chạm ảnh chủ đạo mở cùng trình xem ảnh dùng cho toàn website.

## 3. Dải ảnh theo chương

`#photoRibbon` là dải phim nằm dưới sân khấu chính. Dải chỉ hiển thị ảnh thuộc chương đang chọn; không có lưới ảnh hoặc trang album riêng. 17 album vẫn tồn tại trong dữ liệu để người quản lý phân loại một ảnh vào nhiều nhóm. Thành viên không phải mở từng album để tìm ảnh.

Tìm kiếm ở đầu trang tìm trong tiêu đề, chú thích, nhãn và tên album trên toàn bộ kho ảnh. Kết quả xuất hiện ở dải ảnh hiện tại, không điều hướng sang trang khác.

## 4. Trình xem ảnh và bình luận

Một modal `#viewer` dùng chung cho mọi chương:

- Ảnh gốc hiển thị bằng `object-fit:contain`, không cắt nội dung; khung xem trên điện thoại cao linh hoạt để ảnh dọc có đủ không gian.
- Có nút lưu ảnh gốc về thiết bị; cloud dùng Storage `.download()` để tải đúng file gốc chứ không phải thumbnail.
- Có thể chuyển ảnh bằng vuốt, nút mũi tên hoặc phím trái/phải.
- Thông tin ảnh, nhãn và lời nhắn được đặt trong cùng trình xem.
- Khách nhập tên hiển thị và bình luận mà không cần đăng nhập.
- Bình luận trả lời qua `parent_id`; curator có thể ẩn hoặc xóa bình luận.

## 5. Quản lý ảnh

Quản lý ảnh chỉ xuất hiện dưới dạng một nút biểu tượng nhỏ ở đầu trang. Curator đăng nhập để:

- Tải một hoặc nhiều ảnh.
- Gán ảnh vào một hoặc nhiều album trong 17 album dữ liệu.
- Thêm ngày chụp, chú thích và nhãn.
- Đặt tên riêng cho từng ảnh khi upload và đổi tên lại ngay trong trình xem.
- Tải bản gốc từ Supabase Storage về máy; giữ lại tên gốc và phần mở rộng.
- Phân loại Ảnh ứng viên / FINAL; xuất bản kỷ yếu in được hoặc lưu PDF từ nhóm FINAL.
- Kiểm duyệt bình luận.

Ở chế độ xem thử, tải ảnh và bình luận chỉ nằm trong trình duyệt hiện tại; giao diện hiển thị nhắc nhở rõ ràng. Bản xem thử không dùng ảnh stock/ảnh minh họa giả làm ảnh lớp.

## 6. Quyền truy cập và dữ liệu

| Vai trò | Xem ảnh | Bình luận | Tải ảnh | Kiểm duyệt |
|---|---|---|---|---|
| Người có đường dẫn | Có | Có | Không | Không |
| Curator | Có | Có | Có | Có |

Mô hình dữ liệu hiện có được giữ nguyên: `profiles`, `collections`, `photos`, `photo_collections`, `tags`, `photo_tags`, `comments`, `yearbook_picks`. Một ảnh có thể thuộc nhiều album nhưng chỉ lưu một bản gốc.

### Storage

- `originals/` giữ bản gốc.
- `thumbs/` giữ thumbnail WebP tối ưu cho dải ảnh và điện thoại.
- Thumbnail cạnh dài tối đa 1000 px; trình xem dùng ảnh gốc.

## 7. Luồng dữ liệu

### Xem ảnh

Browser → Supabase client (publishable key) → public read policy → metadata + URL Storage.

### Tải ảnh

Curator login → role check → upload bản gốc + thumbnail → insert `photos` → insert quan hệ `photo_collections`/`photo_tags`. RLS và Storage policy là lớp bảo vệ thực tế; ẩn nút ở frontend không thay thế bảo mật.

### Bình luận

Form → Turnstile token → Supabase Edge Function `submit-comment` → xác minh token và rate limit → insert qua function. Không mở quyền insert trực tiếp cho anonymous vào bảng comments.

## 8. Các giới hạn cần xác nhận khi triển khai

Chế độ xem thử có thể kiểm tra cấu trúc hành trình, thao tác vuốt, tìm kiếm, trình xem, bình luận local và upload thử trong trình duyệt. Chưa thể xác minh Auth, RLS, Storage, Edge Function, Turnstile, quota/dung lượng hoặc sao lưu nếu chưa cấu hình project Supabase cụ thể.
