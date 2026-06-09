create policy "Students can create their own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid() and role = 'student');
