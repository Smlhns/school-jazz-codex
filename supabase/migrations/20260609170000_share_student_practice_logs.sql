drop policy if exists "Students can read their own profile" on public.profiles;
drop policy if exists "Authenticated users can read profiles" on public.profiles;
drop policy if exists "Students can read their own practice" on public.practice_logs;
drop policy if exists "Authenticated users can read practice" on public.practice_logs;

create policy "Authenticated users can read profiles"
on public.profiles
for select
to authenticated
using (true);

create policy "Authenticated users can read practice"
on public.practice_logs
for select
to authenticated
using (true);
