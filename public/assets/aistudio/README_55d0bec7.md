# MEMORYVERSE — Những kỉ niệm đáng nhớ của 10B4

MEMORYVERSE là một hành trình ảnh duy nhất dành cho lớp 10B4 (2026–2029). Sáu chủ đề được tổ chức thành sáu chương nối tiếp nhau; người xem vuốt ngang để đi qua từng chương, chạm ảnh để xem lớn và để lại lời nhắn.

## Trải nghiệm mới

- **Một trang chính, sáu chương:** Đời thường → Chuyện khó đỡ → Dấu mốc → Con người → Điều nhỏ bé → Kỷ yếu.
- **Không còn lưới album hoặc các trang chức năng tách biệt:** bỏ lưới album, bộ lọc, trang ảnh gần đây, dòng thời gian và khu kỷ yếu độc lập. 17 album vẫn được giữ ở tầng dữ liệu để phân loại ảnh, nhưng không biến thành 17 nơi phải mở riêng.
- **Một khung ảnh lớn tại một thời điểm:** mỗi chương chọn một ảnh thật làm ảnh chủ đạo; vuốt ngang, nhấn mũi tên, chọn dấu chương hoặc dùng phím trái/phải để chuyển chương.
- **Dải phim tinh gọn:** ảnh của chương hiện tại nằm trong một dải ngang ở dưới. Không có lưới ảnh dày đặc; chạm ảnh để mở trình xem.
- **Một trình xem và bình luận thống nhất:** xem ảnh lớn, vuốt qua ảnh kế tiếp, đọc và gửi lời nhắn ngay tại cùng một nơi. Khách không cần tạo tài khoản để xem hoặc bình luận.
- **Tìm kiếm toàn kho:** tìm theo tiêu đề ảnh, chú thích, nhãn hoặc tên album. Kết quả xuất hiện trong dải ảnh, không chuyển người xem sang trang khác.
- **Quản lý ảnh thu gọn:** chỉ còn một nút biểu tượng nhỏ ở đầu trang. Phần thêm ảnh, đăng nhập curator và kiểm duyệt bình luận vẫn được giữ riêng.
- **Chất film và Liquid Glass:** ánh sáng xanh chạng vạng, vàng nắng, hạt film nhẹ, kính mờ và chuyển động tiết chế. Ảnh gốc không bị phủ bộ lọc màu.
- **Không dùng ảnh giả:** bản xem thử không chèn ảnh stock hay ảnh minh họa giả làm ảnh lớp. Khi chưa có ảnh thật, chương dùng nền ánh sáng trừu tượng và ghi rõ đang chờ ảnh.
- **Ưu tiên điện thoại:** vùng vuốt có chiều rộng đầy màn hình, ảnh không bị cắt khỏi trình xem, nút điều hướng và phần bình luận được bố trí theo chiều dọc.

## Cấu trúc thư mục

```text
MEMORYVERSE/
├── index.html
├── styles.css
├── app.js
├── config.js
├── supabase/
│   ├── schema.sql
│   └── functions/submit-comment/index.ts
├── tests/smoke_test.py
├── ARCHITECTURE.md
└── README.md
```

## Chạy bản xem thử

Không cần cài thư viện frontend. Cần Python 3; Internet chỉ cần thiết nếu muốn tải phông chữ từ Google Fonts.

1. Giải nén ZIP.
2. Mở Terminal/CMD trong thư mục `MEMORYVERSE_V2`.
3. Chạy:

   ```bash
   python -m http.server 8000
   ```

4. Mở `http://localhost:8000`.

Bản xem thử bắt đầu với kho ảnh trống có chủ đích để không gán ảnh minh họa thành kỉ niệm thật của lớp. Có thể mở biểu tượng ✦ ở góc phải, chọn ảnh từ máy và gán vào chương/album để thử giao diện. Dữ liệu demo và bình luận demo chỉ nằm trong trình duyệt hiện tại, không đồng bộ cho cả lớp.

## Thêm ảnh khi triển khai thật

### 1. Tạo Supabase và chạy SQL

1. Tạo project Supabase.
2. Mở SQL Editor và chạy toàn bộ `supabase/schema.sql`.
3. Script tạo bảng, policy RLS, bucket ảnh và 17 album mẫu. 17 album này phục vụ phân loại ảnh phía sau; giao diện thành viên chỉ hiển thị sáu chương.

### 2. Cấu hình frontend

Trong **Project Settings → API**, lấy Project URL và `anon` / publishable key. Điền vào `config.js`:

```js
window.MEMORYVERSE_CONFIG = {
  SUPABASE_URL: "https://YOUR_PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_ANON_OR_PUBLISHABLE_KEY",
  STORAGE_BUCKET: "memoryverse",
  TURNSTILE_SITE_KEY: "YOUR_CLOUDFLARE_TURNSTILE_SITE_KEY"
};
```

Chỉ dùng `anon` / publishable key ở frontend. Không đưa `service_role` key vào bất kỳ tệp giao diện nào.

### 3. Cấp quyền curator

1. Trong Supabase → Authentication → Users, tạo tài khoản quản lý.
2. Sao chép UUID tài khoản.
3. Chạy trong SQL Editor, thay UUID bằng ID thật:

   ```sql
   update public.profiles
   set role = 'curator'
   where id = 'YOUR-AUTH-USER-UUID';
   ```

Chỉ hồ sơ có `role = 'curator'` được phép tải và quản lý ảnh ở bản cloud. Khách trong lớp không cần tài khoản.

### 4. Bật bình luận công khai

Luồng bình luận: người xem nhập tên hiển thị và lời nhắn → Turnstile xác minh → Edge Function kiểm tra và giới hạn tần suất → lưu bình luận.

1. Tạo widget Cloudflare Turnstile và thêm domain website.
2. Điền Site Key vào `config.js`.
3. Cài Supabase CLI và liên kết project:

   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Đặt secret cho Edge Function:

   ```bash
   supabase secrets set TURNSTILE_SECRET_KEY=YOUR_TURNSTILE_SECRET_KEY IP_HASH_SALT=MAKE_A_LONG_RANDOM_SECRET
   ```

5. Deploy:

   ```bash
   supabase functions deploy submit-comment --no-verify-jwt
   ```

Khi chưa cấu hình Turnstile và Edge Function, bình luận cloud chưa hoạt động. Không mở quyền ghi trực tiếp vào bảng bình luận cho khách ẩn danh.

### 5. Cập nhật cơ sở dữ liệu cho tên file gốc

Nếu project Supabase đã được tạo từ bản cũ, chạy lại phần schema SQL mới trong `supabase/schema.sql`. Lệnh `alter table ... add column if not exists original_filename` bổ sung trường lưu tên file gốc mà không xóa dữ liệu hiện có.

### 6. Triển khai website

Có thể tải các tệp frontend (`index.html`, `styles.css`, `app.js`, `config.js`) lên GitHub Pages, Netlify hoặc hosting tĩnh. Thư mục `supabase/` và `tests/` không cần public cùng giao diện.

## Quyền riêng tư và an toàn dữ liệu

- Nếu chọn chế độ ai có đường dẫn đều xem được, ảnh trong bucket public có URL công khai và có thể được chia sẻ lại. Chỉ tải ảnh mà người xuất hiện trong ảnh cảm thấy thoải mái khi chia sẻ.
- `noindex` chỉ đề nghị công cụ tìm kiếm không lập chỉ mục; đây không phải mật khẩu hay hàng rào bảo mật.
- Tên hiển thị khi bình luận không xác minh danh tính.
- Ảnh gốc và thumbnail được lưu riêng. Khi Supabase đã cấu hình, người quản lý có thể xóa ảnh gốc khỏi điện thoại sau khi tải lên thành công và kiểm tra ảnh đã xuất hiện trong kho; sau này dùng nút “Lưu ảnh gốc về máy” để khôi phục. Không áp dụng cho bản xem thử local: dữ liệu demo chỉ nằm trong bộ nhớ của trang, không phải sao lưu đám mây. Hãy sao lưu Storage và metadata ra một nơi khác định kỳ.
- Tuyệt đối không đưa Supabase `service_role` key vào frontend.

## Kiểm thử

Chạy:

```bash
python tests/smoke_test.py
node --check app.js
```

Các kiểm tra tĩnh xác nhận sáu chương theo đúng thứ tự, dải ảnh ngang, tìm kiếm, trình xem/bình luận, quyền curator, upload và schema bảo mật. Việc đồng bộ ảnh/bình luận giữa nhiều thiết bị chỉ có thể xác nhận sau khi kết nối project Supabase thật.
