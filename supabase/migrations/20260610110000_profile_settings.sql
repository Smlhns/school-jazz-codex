alter table public.profiles
add column if not exists username text;

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('student', 'parent', 'teacher', 'admin'));

create or replace function public.prevent_unsafe_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() = old.id
      and coalesce(public.current_user_role(), '') not in ('teacher', 'admin')
      and not (old.role in ('student', 'parent') and new.role in ('student', 'parent'))
    then
      raise exception 'Teacher and admin access must be approved by an admin.';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists prevent_unsafe_profile_role_change on public.profiles;

create trigger prevent_unsafe_profile_role_change
before update on public.profiles
for each row
execute function public.prevent_unsafe_profile_role_change();
