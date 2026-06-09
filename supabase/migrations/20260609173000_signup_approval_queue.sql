do $$
declare
  trigger_record record;
begin
  for trigger_record in
    select trigger_name
    from information_schema.triggers
    where event_object_schema = 'public'
      and event_object_table = 'signup_interests'
  loop
    execute format('drop trigger if exists %I on public.signup_interests', trigger_record.trigger_name);
  end loop;
end $$;

alter table public.signup_interests
add column if not exists status text not null default 'new'
  check (status in ('new', 'contacted', 'approved', 'rejected')),
add column if not exists reviewed_at timestamptz,
add column if not exists reviewed_by uuid references auth.users(id),
add column if not exists admin_notes text;

drop policy if exists "Staff can update signup interest" on public.signup_interests;

create policy "Staff can update signup interest"
on public.signup_interests
for update
to authenticated
using (public.current_user_role() in ('teacher', 'admin'))
with check (public.current_user_role() in ('teacher', 'admin'));
