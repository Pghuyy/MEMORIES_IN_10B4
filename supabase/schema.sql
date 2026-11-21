-- MEMORYVERSE 10B4 — Supabase Cloud Schema & RLS Policies
-- Chạy toàn bộ script này trong Supabase SQL Editor.
-- Nguyên tắc: Ai mở web cũng xem & bình luận được; chỉ Quản trị viên (curator) mới tải ảnh, sửa tên, chọn kỷ yếu, tải nhạc & kiểm duyệt.

create extension if not exists pgcrypto;

-- 1. Bảng hồ sơ phân quyền (curator vs viewer)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'viewer' check (role in ('viewer', 'curator')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 'viewer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_curator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'curator'
  );
$$;

-- 2. Bảng collections (17 mục phân loại ngầm thuộc 6 chương)
create table if not exists public.collections (
  id text primary key,
  slug text unique not null,
  title text not null,
  description text not null default '',
  space text not null check (space in ('everyday', 'chaos', 'milestones', 'people', 'details', 'yearbook')),
  layout_type text not null default 'film-strip',
  cover_image_path text,
  sort_order int not null default 0,
  is_published boolean not null default true
);

insert into public.collections (id, slug, title, description, space, layout_type, sort_order) values
  ('c-everyday-1', 'first-period', 'Trước giờ vào lớp', 'Những phút đầu ngày, khi lớp mình còn đang ngái ngủ.', 'everyday', 'film-strip', 1),
  ('c-everyday-2', 'in-class', 'Trong giờ học', 'Những tiết học, ánh mắt, trang vở và chuyện bên lề.', 'everyday', 'exhibition', 2),
  ('c-everyday-3', 'break-time', 'Giờ ra chơi', 'Mười lăm phút mà có cả nghìn chuyện.', 'everyday', 'scrapbook', 3),
  ('c-everyday-4', 'after-class', 'Tan học rồi', 'Sân trường, hành lang và những bước chân cuối buổi.', 'everyday', 'film-strip', 4),
  ('c-everyday-5', 'class-duty', 'Trực nhật & sinh hoạt', 'Những buổi cùng dọn lớp, họp lớp và ở lại thêm một chút.', 'everyday', 'scrapbook', 5),
  ('c-chaos-1', 'punishment-files', 'Hồ sơ những lần bị phạt', 'Những lần bị nhắc nhở — lưu lại bằng tinh thần vui vẻ.', 'chaos', 'case-files', 6),
  ('c-chaos-2', 'oops-moments', 'Lỡ tay, lỡ lời', 'Những pha bất ngờ khiến cả lớp không nhịn được cười.', 'chaos', 'film-strip', 7),
  ('c-chaos-3', 'funny-faces', 'Biểu cảm khó đỡ', 'Những gương mặt chỉ cần nhìn lại là bật cười.', 'chaos', 'portrait-wall', 8),
  ('c-chaos-4', 'behind-scenes', 'Hậu trường không lên hình', 'Những chuyện vui xảy ra trước và sau khoảnh khắc được chụp.', 'chaos', 'scrapbook', 9),
  ('c-milestones-1', 'october-days', 'Những ngày đặc biệt', 'Các dịp đáng nhớ và hoạt động của tập thể.', 'milestones', 'exhibition', 10),
  ('c-milestones-2', 'stage-sports', 'Sân khấu & hội thao', 'Văn nghệ, thi đấu và những lần cổ vũ hết mình.', 'milestones', 'film-strip', 11),
  ('c-milestones-3', 'class-trips', 'Những chuyến đi', 'Đi cùng nhau, có thêm vài câu chuyện để kể.', 'milestones', 'scrapbook', 12),
  ('c-people-1', 'our-people', 'Gương mặt thân quen', 'Những người tạo nên 10B4.', 'people', 'portrait-wall', 13),
  ('c-people-2', 'friend-groups', 'Hội bạn của chúng mình', 'Những nhóm nhỏ và những lần tụ lại bên nhau.', 'people', 'portrait-wall', 14),
  ('c-details-1', 'little-things', 'Góc lớp & đồ vật', 'Bảng, bàn, cửa sổ và những thứ quá quen thuộc.', 'details', 'scrapbook', 15),
  ('c-details-2', 'notes-and-letters', 'Mẩu giấy & nét chữ', 'Những lời nhắn, trang vở và điều nhỏ xíu được giữ lại.', 'details', 'case-files', 16),
  ('c-yearbook-1', 'yearbook-candidates', 'Ảnh chọn cho kỷ yếu', 'Những khung hình được chọn để kể lại hành trình ba năm.', 'yearbook', 'exhibition', 17)
on conflict (id) do nothing;

-- 3. Bảng photos
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  original_filename text,
  caption text,
  taken_at date,
  storage_path text not null,
  thumbnail_path text,
  width int not null default 0,
  height int not null default 0,
  sha256 text unique,
  is_published boolean not null default true,
  uploader_name text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.photos add column if not exists original_filename text;
alter table public.photos add column if not exists uploader_name text;

create table if not exists public.photo_collections (
  photo_id uuid not null references public.photos(id) on delete cascade,
  collection_id text not null references public.collections(id) on delete cascade,
  primary key (photo_id, collection_id)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table if not exists public.photo_tags (
  photo_id uuid not null references public.photos(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (photo_id, tag_id)
);

-- 4. Bảng kỷ yếu
create table if not exists public.yearbook_picks (
  photo_id uuid primary key references public.photos(id) on delete cascade,
  pick_type text not null default 'candidate' check (pick_type in ('candidate', 'final')),
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

-- 5. Bảng bình luận & Hộp thời gian 10B4 (khách không cần đăng nhập vẫn gửi được)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  author_name text not null check (char_length(trim(author_name)) between 2 and 40),
  body text not null check (char_length(trim(body)) between 2 and 600),
  unlock_date date,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.comments add column if not exists unlock_date date;
alter table public.comments add column if not exists client_id uuid;
alter table public.comments add column if not exists request_id uuid;
create unique index if not exists comments_client_request_unique
  on public.comments (client_id, request_id)
  where client_id is not null and request_id is not null;

-- Bộ đếm giới hạn tốc độ gửi bình luận theo mã cài đặt ẩn danh.
-- Bảng này chỉ được truy cập qua RPC SECURITY DEFINER, không đọc/ghi trực tiếp từ trình duyệt.
create table if not exists public.comment_rate_limits (
  client_id uuid primary key,
  last_comment_at timestamptz not null default now()
);

create table if not exists public.reaction_rate_limits (
  client_id uuid primary key,
  last_reaction_at timestamptz not null default now()
);

-- Bảng tín hiệu realtime không chứa nội dung bình luận.
-- Body của hộp thời gian được che ở RPC get_memory_comments cho tới ngày mở.
create table if not exists public.comment_activity (
  photo_id uuid primary key references public.photos(id) on delete cascade,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_comment_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_photo_id uuid;
begin
  v_photo_id := case when tg_op = 'DELETE' then old.photo_id else new.photo_id end;
  insert into public.comment_activity (photo_id, updated_at)
  values (v_photo_id, now())
  on conflict (photo_id) do update set updated_at = excluded.updated_at;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists comments_touch_activity on public.comments;
create trigger comments_touch_activity
  after insert or update or delete on public.comments
  for each row execute procedure public.touch_comment_activity();

create or replace function public.get_memory_comments()
returns table (
  id uuid,
  photo_id uuid,
  parent_id uuid,
  author_name text,
  body text,
  unlock_date date,
  is_hidden boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.photo_id,
    c.parent_id,
    c.author_name,
    case
      when public.is_curator() or c.unlock_date is null or c.unlock_date <= current_date
      then c.body
      else ''
    end as body,
    c.unlock_date,
    c.is_hidden,
    c.created_at
  from public.comments c
  where (c.is_hidden = false or public.is_curator())
    and (
      public.is_curator()
      or exists (
        select 1 from public.photos p
        where p.id = c.photo_id and p.is_published = true
      )
    )
  order by c.created_at asc;
$$;
revoke all on function public.get_memory_comments() from public;
revoke all on function public.touch_comment_activity() from public;
grant execute on function public.get_memory_comments() to anon, authenticated;

-- RPC giúp gửi bình luận đúng một lần kể cả khi mạng chập chờn gửi lại request.
create or replace function public.submit_memory_comment(
  p_photo_id uuid,
  p_parent_id uuid,
  p_author_name text,
  p_body text,
  p_unlock_date date,
  p_client_id uuid,
  p_request_id uuid
)
returns public.comments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.comments%rowtype;
  v_comment public.comments%rowtype;
  v_allowed uuid;
begin
  if p_client_id is null or p_request_id is null then
    raise exception 'Thiếu mã gửi bình luận hợp lệ.';
  end if;

  -- Khóa cùng một request trong lúc xử lý: lần retry song song sẽ đọc lại bản ghi đã tạo.
  perform pg_advisory_xact_lock(hashtextextended(p_client_id::text || ':' || p_request_id::text, 0));

  select * into v_existing
  from public.comments
  where client_id = p_client_id and request_id = p_request_id;
  if found then
    return v_existing;
  end if;

  if p_author_name is null or char_length(trim(p_author_name)) not between 2 and 40 then
    raise exception 'Tên người gửi phải có từ 2 đến 40 ký tự.';
  end if;
  if p_body is null or char_length(trim(p_body)) not between 2 and 600 then
    raise exception 'Bình luận phải có từ 2 đến 600 ký tự.';
  end if;
  if not exists (
    select 1 from public.photos where id = p_photo_id and is_published = true
  ) then
    raise exception 'Ảnh này không còn được công khai.';
  end if;
  if p_parent_id is not null and not exists (
    select 1 from public.comments
    where id = p_parent_id and photo_id = p_photo_id and is_hidden = false
      and (public.is_curator() or unlock_date is null or unlock_date <= current_date)
  ) then
    raise exception 'Bình luận được trả lời không tồn tại.';
  end if;

  insert into public.comment_rate_limits (client_id, last_comment_at)
  values (p_client_id, now())
  on conflict (client_id) do update
    set last_comment_at = now()
    where public.comment_rate_limits.last_comment_at <= now() - interval '15 seconds'
  returning client_id into v_allowed;

  if v_allowed is null then
    raise exception 'Bạn gửi hơi nhanh. Vui lòng thử lại sau 15 giây.';
  end if;

  insert into public.comments (
    photo_id, parent_id, author_name, body, unlock_date,
    is_hidden, client_id, request_id
  ) values (
    p_photo_id, p_parent_id, trim(p_author_name), trim(p_body), p_unlock_date,
    false, p_client_id, p_request_id
  ) returning * into v_comment;

  return v_comment;
end;
$$;
revoke all on function public.submit_memory_comment(uuid, uuid, text, text, date, uuid, uuid) from public;
grant execute on function public.submit_memory_comment(uuid, uuid, text, text, date, uuid, uuid) to anon, authenticated;

-- 6. Bảng cảm xúc nhanh cho từng ảnh (Like, Tim, Thương thương, Khóc huhu, Tức giận)
create table if not exists public.photo_reactions (
  photo_id uuid primary key references public.photos(id) on delete cascade,
  like_count int not null default 0,
  heart_count int not null default 0,
  care_count int not null default 0,
  cry_count int not null default 0,
  angry_count int not null default 0
);

alter table public.photo_reactions add column if not exists like_count int not null default 0;
alter table public.photo_reactions add column if not exists heart_count int not null default 0;
alter table public.photo_reactions add column if not exists care_count int not null default 0;
alter table public.photo_reactions add column if not exists cry_count int not null default 0;
alter table public.photo_reactions add column if not exists angry_count int not null default 0;

-- Mỗi trình duyệt/thiết bị chỉ được ghi nhận một cảm xúc cho một ảnh.
-- Bảng vote khóa chống cộng trùng; bảng rate limit chặn thao tác quá nhanh.
create table if not exists public.photo_reaction_votes (
  photo_id uuid not null references public.photos(id) on delete cascade,
  client_id uuid not null,
  reaction_key text not null check (reaction_key in ('like', 'heart', 'care', 'cry', 'angry')),
  created_at timestamptz not null default now(),
  primary key (photo_id, client_id)
);

drop function if exists public.submit_photo_reaction(uuid, text, uuid);
create function public.submit_photo_reaction(
  p_photo_id uuid,
  p_key text,
  p_client_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
  v_existing_key text;
  v_allowed uuid;
begin
  if p_client_id is null then
    raise exception 'Thiếu mã thiết bị hợp lệ.';
  end if;
  if p_key is null or p_key not in ('like', 'heart', 'care', 'cry', 'angry') then
    raise exception 'Loại cảm xúc không hợp lệ.';
  end if;
  if not exists (
    select 1 from public.photos where id = p_photo_id and is_published = true
  ) then
    raise exception 'Ảnh này không còn được công khai.';
  end if;

  -- Nếu phản hồi lần trước bị mất, trả lại đúng lựa chọn đã ghi thay vì cộng lần nữa.
  select reaction_key into v_existing_key
  from public.photo_reaction_votes
  where photo_id = p_photo_id and client_id = p_client_id;
  if found then
    return v_existing_key;
  end if;

  insert into public.reaction_rate_limits (client_id, last_reaction_at)
  values (p_client_id, now())
  on conflict (client_id) do update
    set last_reaction_at = now()
    where public.reaction_rate_limits.last_reaction_at <= now() - interval '2 seconds'
  returning client_id into v_allowed;

  if v_allowed is null then
    raise exception 'Bạn thao tác hơi nhanh. Vui lòng thử lại sau ít giây.';
  end if;

  insert into public.photo_reaction_votes (photo_id, client_id, reaction_key)
  values (p_photo_id, p_client_id, p_key)
  on conflict (photo_id, client_id) do nothing;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    select reaction_key into v_existing_key
    from public.photo_reaction_votes
    where photo_id = p_photo_id and client_id = p_client_id;
    return v_existing_key;
  end if;

  insert into public.photo_reactions (photo_id) values (p_photo_id)
  on conflict (photo_id) do nothing;

  update public.photo_reactions
  set like_count = like_count + case when p_key = 'like' then 1 else 0 end,
      heart_count = heart_count + case when p_key = 'heart' then 1 else 0 end,
      care_count = care_count + case when p_key = 'care' then 1 else 0 end,
      cry_count = cry_count + case when p_key = 'cry' then 1 else 0 end,
      angry_count = angry_count + case when p_key = 'angry' then 1 else 0 end
  where photo_id = p_photo_id;

  return p_key;
end;
$$;
revoke all on function public.submit_photo_reaction(uuid, text, uuid) from public;
grant execute on function public.submit_photo_reaction(uuid, text, uuid) to anon, authenticated;
-- Xóa RPC cũ vì nó cho phép cộng bộ đếm trực tiếp mà không kiểm tra trùng.
drop function if exists public.increment_photo_reaction(uuid, text);

-- Các RPC nhập kho cũ được giới hạn cho curator đã đăng nhập.
-- Comments: giữ nguyên UUID, thứ tự thời gian, trả lời, ngày mở khóa và trạng thái ẩn.
create or replace function public.import_legacy_comments(p_comments jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_photo_id uuid;
  v_id uuid;
  v_parent_id uuid;
  v_rows integer;
  v_total integer := 0;
  v_author text;
  v_body text;
begin
  if not public.is_curator() then
    raise exception 'Chỉ Quản trị viên mới được nhập dữ liệu cũ.';
  end if;
  if p_comments is null or jsonb_typeof(p_comments) <> 'array' then
    raise exception 'Danh sách bình luận trong bản sao lưu không hợp lệ.';
  end if;

  for v_item in select value from jsonb_array_elements(p_comments)
  loop
    v_photo_id := nullif(v_item->>'photo_id', '')::uuid;
    v_author := trim(coalesce(v_item->>'author_name', ''));
    v_body := trim(coalesce(v_item->>'body', ''));
    if v_photo_id is null
      or v_author is null or char_length(v_author) not between 2 and 40
      or v_body is null or char_length(v_body) not between 2 and 600
      or not exists (select 1 from public.photos where id = v_photo_id)
    then
      continue;
    end if;

    v_id := coalesce(nullif(v_item->>'id', '')::uuid, gen_random_uuid());
    v_parent_id := nullif(v_item->>'parent_id', '')::uuid;
    if v_parent_id is not null and not exists (
      select 1 from public.comments where id = v_parent_id and photo_id = v_photo_id
    ) then
      v_parent_id := null;
    end if;

    insert into public.comments (
      id, photo_id, parent_id, author_name, body, unlock_date,
      is_hidden, created_at, client_id, request_id
    ) values (
      v_id, v_photo_id, v_parent_id, v_author, v_body,
      nullif(v_item->>'unlock_date', '')::date,
      coalesce((v_item->>'is_hidden')::boolean, false),
      coalesce(nullif(v_item->>'created_at', '')::timestamptz, now()),
      null, null
    ) on conflict (id) do nothing;

    get diagnostics v_rows = row_count;
    v_total := v_total + v_rows;
  end loop;

  return v_total;
end;
$$;
revoke all on function public.import_legacy_comments(jsonb) from public;
grant execute on function public.import_legacy_comments(jsonb) to authenticated;

-- Reactions cũ chỉ còn bộ đếm tổng hợp, không có danh tính người đã bấm.
-- Dùng GREATEST để nhập lại cùng một tệp không cộng lặp số cũ.
drop function if exists public.merge_legacy_reaction_counts(jsonb, uuid);
drop function if exists public.merge_legacy_reaction_counts(jsonb);
create function public.merge_legacy_reaction_counts(p_reactions jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_photo_id uuid;
  v_rows integer;
  v_total integer := 0;
  v_like integer;
  v_heart integer;
  v_care integer;
  v_cry integer;
  v_angry integer;
begin
  if not public.is_curator() then
    raise exception 'Chỉ Quản trị viên mới được nhập dữ liệu cảm xúc cũ.';
  end if;
  if p_reactions is null or jsonb_typeof(p_reactions) <> 'array' then
    raise exception 'Danh sách cảm xúc trong bản sao lưu không hợp lệ.';
  end if;

  for v_item in select value from jsonb_array_elements(p_reactions)
  loop
    v_photo_id := nullif(v_item->>'photo_id', '')::uuid;
    if v_photo_id is null or not exists (
      select 1 from public.photos where id = v_photo_id
    ) then
      continue;
    end if;

    v_like := greatest(0, coalesce((v_item->>'like')::integer, 0));
    v_heart := greatest(0, coalesce((v_item->>'heart')::integer, 0));
    v_care := greatest(0, coalesce((v_item->>'care')::integer, 0));
    v_cry := greatest(0, coalesce((v_item->>'cry')::integer, 0));
    v_angry := greatest(0, coalesce((v_item->>'angry')::integer, 0));

    insert into public.photo_reactions (
      photo_id, like_count, heart_count, care_count, cry_count, angry_count
    ) values (v_photo_id, v_like, v_heart, v_care, v_cry, v_angry)
    on conflict (photo_id) do update set
      like_count = greatest(public.photo_reactions.like_count, excluded.like_count),
      heart_count = greatest(public.photo_reactions.heart_count, excluded.heart_count),
      care_count = greatest(public.photo_reactions.care_count, excluded.care_count),
      cry_count = greatest(public.photo_reactions.cry_count, excluded.cry_count),
      angry_count = greatest(public.photo_reactions.angry_count, excluded.angry_count);

    get diagnostics v_rows = row_count;
    v_total := v_total + v_rows;
  end loop;

  return v_total;
end;
$$;
revoke all on function public.merge_legacy_reaction_counts(jsonb) from public;
grant execute on function public.merge_legacy_reaction_counts(jsonb) to authenticated;

-- 7. Bảng nhạc nền MP3 tùy chỉnh theo từng chương
create table if not exists public.chapter_audio (
  chapter_id text primary key check (chapter_id in ('everyday', 'chaos', 'milestones', 'people', 'details', 'yearbook')),
  file_name text not null,
  storage_path text not null,
  updated_at timestamptz not null default now()
);

-- 8. Bật Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.photos enable row level security;
alter table public.photo_collections enable row level security;
alter table public.tags enable row level security;
alter table public.photo_tags enable row level security;
alter table public.yearbook_picks enable row level security;
alter table public.comments enable row level security;
alter table public.comment_activity enable row level security;
alter table public.photo_reactions enable row level security;
alter table public.photo_reaction_votes enable row level security;
alter table public.comment_rate_limits enable row level security;
alter table public.reaction_rate_limits enable row level security;
alter table public.chapter_audio enable row level security;

revoke all on table public.photo_reaction_votes from anon, authenticated;
revoke all on table public.comment_rate_limits, public.reaction_rate_limits from anon, authenticated;
grant select on table public.comment_activity to anon, authenticated;
revoke insert, update, delete on table public.comment_activity from anon, authenticated;

-- Dọn mọi policy cũ trên đúng các bảng của Memoryverse trước khi áp bộ policy chuẩn.
-- Tránh policy cũ không cùng tên vô tình vẫn cho phép khách ghi/xóa dữ liệu.
do $$
declare
  v_policy record;
begin
  for v_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'profiles', 'collections', 'photos', 'photo_collections', 'tags',
        'photo_tags', 'yearbook_picks', 'comments', 'comment_activity', 'photo_reactions',
        'photo_reaction_votes', 'comment_rate_limits', 'reaction_rate_limits', 'chapter_audio'
      ])
  loop
    execute format('drop policy %I on %I.%I',
      v_policy.policyname, v_policy.schemaname, v_policy.tablename);
  end loop;

  -- Chỉ dọn policy Storage có nhắc tới bucket của Memoryverse, không chạm bucket khác.
  for v_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (coalesce(qual, '') || coalesce(with_check, '')) ilike '%memoryverse%'
  loop
    execute format('drop policy %I on %I.%I',
      v_policy.policyname, v_policy.schemaname, v_policy.tablename);
  end loop;
end;
$$;

-- Policy cho profiles
drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles
  for select using (auth.uid() = id or public.is_curator());

-- Policy công khai cho tất cả mọi người mở web xem (không cần tài khoản)
drop policy if exists "Public read collections" on public.collections;
create policy "Public read collections" on public.collections
  for select using (is_published = true or public.is_curator());

drop policy if exists "Public read photos" on public.photos;
create policy "Public read photos" on public.photos
  for select using (is_published = true or public.is_curator());

drop policy if exists "Public read photo_collections" on public.photo_collections;
create policy "Public read photo_collections" on public.photo_collections
  for select using (
    public.is_curator() or exists (
      select 1 from public.photos p
      where p.id = photo_collections.photo_id and p.is_published = true
    )
  );

drop policy if exists "Public read tags" on public.tags;
create policy "Public read tags" on public.tags
  for select using (true);

drop policy if exists "Public read photo_tags" on public.photo_tags;
create policy "Public read photo_tags" on public.photo_tags
  for select using (
    public.is_curator() or exists (
      select 1 from public.photos p
      where p.id = photo_tags.photo_id and p.is_published = true
    )
  );

drop policy if exists "Public read yearbook_picks" on public.yearbook_picks;
create policy "Public read yearbook_picks" on public.yearbook_picks
  for select using (
    public.is_curator() or exists (
      select 1 from public.photos p
      where p.id = yearbook_picks.photo_id and p.is_published = true
    )
  );

drop policy if exists "Public read visible comments" on public.comments;
drop policy if exists "Curator read all comments" on public.comments;
create policy "Curator read all comments" on public.comments
  for select using (public.is_curator());

-- Khách gửi qua RPC; đọc qua get_memory_comments() để không lộ trước nội dung hộp thời gian.
drop policy if exists "Guest submit comment" on public.comments;

drop policy if exists "Public read comment activity" on public.comment_activity;
create policy "Public read comment activity" on public.comment_activity
  for select using (
    public.is_curator() or exists (
      select 1 from public.photos p
      where p.id = comment_activity.photo_id and p.is_published = true
    )
  );

drop policy if exists "Public read reactions" on public.photo_reactions;
create policy "Public read reactions" on public.photo_reactions
  for select using (
    public.is_curator() or exists (
      select 1 from public.photos p
      where p.id = photo_reactions.photo_id and p.is_published = true
    )
  );

drop policy if exists "Public read chapter_audio" on public.chapter_audio;
create policy "Public read chapter_audio" on public.chapter_audio
  for select using (true);

-- Policy ghi / sửa / xóa CHỈ dành cho Quản trị viên (curator)
drop policy if exists "Curator write photos" on public.photos;
create policy "Curator write photos" on public.photos
  for all using (public.is_curator()) with check (public.is_curator());

drop policy if exists "Curator write photo_collections" on public.photo_collections;
create policy "Curator write photo_collections" on public.photo_collections
  for all using (public.is_curator()) with check (public.is_curator());

drop policy if exists "Curator write tags" on public.tags;
create policy "Curator write tags" on public.tags
  for all using (public.is_curator()) with check (public.is_curator());

drop policy if exists "Curator write photo_tags" on public.photo_tags;
create policy "Curator write photo_tags" on public.photo_tags
  for all using (public.is_curator()) with check (public.is_curator());

drop policy if exists "Curator write yearbook_picks" on public.yearbook_picks;
create policy "Curator write yearbook_picks" on public.yearbook_picks
  for all using (public.is_curator()) with check (public.is_curator());

drop policy if exists "Curator moderate comments" on public.comments;
create policy "Curator moderate comments" on public.comments
  for update using (public.is_curator()) with check (public.is_curator());

drop policy if exists "Curator delete comments" on public.comments;
create policy "Curator delete comments" on public.comments
  for delete using (public.is_curator());

drop policy if exists "Curator write chapter_audio" on public.chapter_audio;
create policy "Curator write chapter_audio" on public.chapter_audio
  for all using (public.is_curator()) with check (public.is_curator());

-- 9. Storage Bucket công khai cho ảnh & nhạc
insert into storage.buckets (id, name, public)
values ('memoryverse', 'memoryverse', true)
on conflict (id) do update set public = true;

drop policy if exists "Public view memoryverse objects" on storage.objects;
create policy "Public view memoryverse objects" on storage.objects
  for select using (bucket_id = 'memoryverse');

drop policy if exists "Curator upload memoryverse objects" on storage.objects;
create policy "Curator upload memoryverse objects" on storage.objects
  for insert with check (bucket_id = 'memoryverse' and public.is_curator());

drop policy if exists "Curator update memoryverse objects" on storage.objects;
create policy "Curator update memoryverse objects" on storage.objects
  for update
  using (bucket_id = 'memoryverse' and public.is_curator())
  with check (bucket_id = 'memoryverse' and public.is_curator());

drop policy if exists "Curator delete memoryverse objects" on storage.objects;
create policy "Curator delete memoryverse objects" on storage.objects
  for delete using (bucket_id = 'memoryverse' and public.is_curator());

-- HƯỚNG DẪN CẤP QUYỀN QUẢN TRỊ (CHẠY SAU KHI TẠO USER TRONG AUTHENTICATION -> USERS):
-- update public.profiles set role = 'curator' where id = 'DIEN-UUID-TAI-KHOAN-QUAN-TRI-VAO-DAY';


-- 10. Bật Supabase Realtime cho các bảng công khai cần cập nhật trực tiếp.
-- Có kiểm tra trước để script có thể chạy lại an toàn.
do $$
declare
  v_table text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    -- App subscribes to comment_activity (sanitized signal), never to raw comments.

    foreach v_table in array array[
      'photos', 'photo_collections', 'photo_tags', 'tags',
      'yearbook_picks', 'comment_activity', 'photo_reactions', 'chapter_audio'
    ] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = v_table
      ) then
        execute format('alter publication supabase_realtime add table public.%I', v_table);
      end if;
    end loop;
  end if;
end;
$$;

-- Kiểm tra trong Supabase Dashboard: Database -> Publications -> supabase_realtime.
-- Không bao giờ đặt service_role key trong frontend/public/config.js.
