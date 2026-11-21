# MEMORYVERSE 10B4

Ứng dụng React + Vite lưu trữ hành trình ảnh, lời nhắn và nhạc của lớp 10B4. Giao diện gốc được giữ lại; phần Cloud, bình luận, cảm xúc, Realtime và bảo mật được gia cố.

## Chạy local

```bash
npm install
cp .env.example .env.local
npm run dev
```

`GEMINI_API_KEY` chỉ cần khi dùng chức năng AI tương ứng. Các biến `VITE_SUPABASE_*` là cấu hình Supabase phía trình duyệt, vì vậy chỉ điền **anon/publishable key**, tuyệt đối không điền `service_role` hoặc secret key.

## Thiết lập Supabase dùng chung

1. Tạo một project Supabase.
2. Mở **SQL Editor**, chạy toàn bộ tệp `supabase/schema.sql`. Script tạo bảng, bucket `memoryverse`, policy RLS, các RPC chống gửi lặp và bật Realtime cho các bảng cần thiết. Có thể chạy lại để cập nhật các bảng/policy của Memoryverse.
3. Trong **Authentication → Users**, tạo tài khoản quản trị. Mở tài khoản vừa tạo, sao chép UUID và chạy lệnh dưới đây trong SQL Editor:

   ```sql
   update public.profiles
   set role = 'curator'
   where id = 'UUID-TAI-KHOAN-QUAN-TRI';
   ```

4. Lấy **Project URL** và **anon/publishable key** trong Project API Settings. Điền vào `public/config.js`:

   ```js
   window.MEMORYVERSE_CONFIG = {
     SUPABASE_URL: "https://YOUR_PROJECT.supabase.co",
     SUPABASE_ANON_KEY: "YOUR_ANON_OR_PUBLISHABLE_KEY",
     STORAGE_BUCKET: "memoryverse"
   };
   ```

5. Giữ `STORAGE_BUCKET` là `memoryverse` để khớp bucket và policy trong schema. Build và triển khai website. Mọi thiết bị mở cùng URL sẽ đọc chung cấu hình trong `public/config.js`. Có thể thay URL và anon key bằng biến môi trường build `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`; bucket được cố định là `memoryverse` để khớp chính sách Storage.
6. Đăng nhập tài khoản curator trong khu vực quản trị để tải ảnh/nhạc và kiểm duyệt bình luận.

**Lưu ý quan trọng:** nút kết nối trong form quản trị chỉ tạo override tạm thời trong tab hiện tại. Nó không ghi cấu hình lên website đã triển khai và không được lưu trong `localStorage`. Muốn dùng chung, phải cập nhật `public/config.js` (hoặc biến môi trường build) rồi triển khai lại.

## Đồng bộ và chống gửi lặp

- Ảnh gốc, thumbnail và nhạc được lưu trong Supabase Storage; metadata, bình luận và bộ đếm cảm xúc nằm trong PostgreSQL.
- Bình luận được gửi qua `submit_memory_comment`: mã yêu cầu giúp request retry không tạo bình luận trùng; mỗi mã cài đặt có khoảng nghỉ 15 giây giữa hai bình luận.
- Cảm xúc được ghi qua `submit_photo_reaction`: khóa chính `(photo_id, client_id)` chỉ cho một lượt cảm xúc trên mỗi ảnh từ cùng mã cài đặt; cùng mã thiết bị được giới hạn nhịp gửi tối thiểu 2 giây. Khi request trước đã ghi nhưng mất phản hồi, máy chủ trả lại lựa chọn cũ thay vì cộng thêm.
- Supabase Realtime theo dõi ảnh, phân loại, kỷ yếu, bình luận, cảm xúc và nhạc; client tự tải snapshot mới sau khi có thay đổi. Bình luận được đọc qua RPC đã che nội dung Hộp thời gian tới đúng ngày mở khóa; Realtime chỉ phát tín hiệu thay đổi, không phát tán nội dung bình luận thô.
- Mã cài đặt ẩn danh chỉ lưu trong `localStorage` để chống cộng lặp cơ bản. Vì khách không cần đăng nhập, đây không phải định danh con người: người cố tình xóa dữ liệu trình duyệt/đổi thiết bị có thể tạo mã mới hoặc giả mạo mã. Nếu website mở công khai trước lượng truy cập lớn hoặc bị spam có chủ đích, nên bổ sung Cloudflare Turnstile và xác minh token ở Edge Function/server-side.

## Chuyển dữ liệu ngoại tuyến cũ lên Cloud

Nếu website trước đây đã có ảnh/nhạc/bình luận trong kho của trình duyệt, hãy **xuất tệp sao lưu ngoại tuyến trước khi bật Cloud** trong Quản trị → Quản lý → Sao lưu & Khôi phục. Nếu Cloud đã được cấu hình ở tab này, bấm **Ngắt kết nối** tạm thời để hiện lại nút xuất; xuất xong mới kết nối Cloud lại. Sau khi đã cấu hình Supabase và đăng nhập curator, vào cùng khu vực, chọn **Chuyển kho dữ liệu cũ lên Cloud** và chọn tệp JSON vừa xuất.

Việc nhập giữ UUID ảnh và bình luận khi có thể, ánh xạ lại ảnh trùng theo SHA-256, khôi phục nhạc và bình luận, đồng thời hợp nhất bộ đếm cảm xúc cũ theo hướng không cộng lặp (dùng giá trị lớn hơn giữa kho cũ và kho Cloud). Bản sao cũ chỉ lưu bộ đếm tổng hợp nên không thể phục hồi chính xác thiết bị/người đã bấm từng cảm xúc; các lượt mới sau chuyển đổi được quản lý riêng theo mã thiết bị. Tệp sao lưu gốc không bị thay đổi. Nếu file nhập bị gián đoạn, có thể chọn lại; ảnh/bình luận có ID cũ sẽ được bỏ qua nếu đã có.

**Không tự động lấy dữ liệu từ mọi máy của học sinh.** Dữ liệu ngoại tuyến vốn chỉ nằm trên từng trình duyệt; chỉ tệp sao lưu được chủ động cung cấp mới chuyển được lên Cloud.

## Kiểm tra phân quyền

- Khách: đọc ảnh đã công khai, phân loại, nhạc, bình luận đang hiển thị và số cảm xúc; gửi bình luận qua RPC; gửi cảm xúc qua RPC.
- Curator: tải/sửa/xóa ảnh, quản lý phân loại và kỷ yếu, tải/xóa nhạc, ẩn/hiện/xóa bình luận, chuyển dữ liệu sao lưu cũ.
- Bảng vote cảm xúc và hai bảng giới hạn nhịp bình luận/cảm xúc không cho `anon`/`authenticated` đọc hoặc ghi trực tiếp.
- `profiles` không có policy cho khách tự nâng quyền. Chỉ chủ project chạy SQL mới đổi role thành `curator`.
- Storage bucket công khai để trình duyệt hiển thị ảnh/nhạc; quyền upload/update/delete yêu cầu curator. Script chỉ dọn các policy Storage có nhắc rõ bucket `memoryverse` để không vô tình phá bucket của ứng dụng khác. Nếu tái sử dụng một Supabase project có nhiều ứng dụng, hãy kiểm tra các policy Storage hiện hữu trước khi bật Cloud; policy ghi/xóa quá rộng ở `storage.objects` có thể cộng quyền ngoài ý muốn.

Để rà soát policy Storage hiện có trong Supabase SQL Editor:

```sql
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
```

Chỉ giữ lại policy ghi/xóa của bucket khác khi điều kiện thực sự giới hạn đúng bucket đó; với Memoryverse, chỉ curator được upload, update hoặc delete. Nên dùng một Supabase project riêng cho website này để việc phân quyền dễ kiểm soát hơn.

## Lệnh kiểm tra

```bash
npm run lint
npm run build
```
