create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  instrument text,
  created_at timestamptz not null default now()
);

create table if not exists public.practice_logs (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.profiles(id) on delete cascade,
  practiced_on date not null default current_date,
  song text not null,
  minutes integer not null check (minutes > 0 and minutes <= 180),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.signup_interests (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.practice_logs enable row level security;
alter table public.signup_interests enable row level security;

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create policy "Students can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.current_user_role() in ('teacher', 'admin'));

create policy "Students can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Staff can manage profiles"
on public.profiles
for all
to authenticated
using (public.current_user_role() in ('teacher', 'admin'))
with check (public.current_user_role() in ('teacher', 'admin'));

create policy "Students can read their own practice"
on public.practice_logs
for select
to authenticated
using (student_id = auth.uid() or public.current_user_role() in ('teacher', 'admin'));

create policy "Students can add their own practice"
on public.practice_logs
for insert
to authenticated
with check (student_id = auth.uid());

create policy "Students can update their own practice"
on public.practice_logs
for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

create policy "Staff can manage practice"
on public.practice_logs
for all
to authenticated
using (public.current_user_role() in ('teacher', 'admin'))
with check (public.current_user_role() in ('teacher', 'admin'));

create policy "Anyone can register interest"
on public.signup_interests
for insert
to anon, authenticated
with check (true);

create policy "Staff can read signup interest"
on public.signup_interests
for select
to authenticated
using (public.current_user_role() in ('teacher', 'admin'));
