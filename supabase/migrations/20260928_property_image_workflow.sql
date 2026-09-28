alter table public.property_submissions
  drop constraint if exists property_submissions_images_check;

alter table public.property_submissions
  add constraint property_submissions_images_check
  check (cardinality(images) between 1 and 20);

create or replace function public.can_upload_submission_image(object_name text)
returns boolean
language plpgsql
security definer
stable
set search_path = public, storage
as $$
declare folder text := split_part(object_name, '/', 1);
begin
  if folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then return false; end if;
  return exists (select 1 from public.property_submission_tokens where id = folder::uuid and used = false and expires_at > now())
    and (select count(*) from storage.objects where bucket_id = 'property-submissions' and split_part(name, '/', 1) = folder) < 20;
end;
$$;

revoke all on function public.can_upload_submission_image(text) from public;
grant execute on function public.can_upload_submission_image(text) to anon, authenticated;
