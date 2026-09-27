create table if not exists public.property_submissions (
  id uuid primary key default gen_random_uuid(),
  owner_name text not null check (char_length(owner_name) between 2 and 80),
  owner_email text not null check (char_length(owner_email) <= 120),
  owner_phone text not null check (char_length(owner_phone) between 7 and 20),
  relationship text not null check (relationship in ('Owner', 'Landlord', 'Agent', 'Developer', 'Authorised representative')),
  listing_type text not null check (listing_type in ('For Sale', 'For Rent', 'Available')),
  category text not null check (category in ('Residential', 'Apartment', 'Commercial', 'Land', 'Development', 'Other')),
  title text not null check (char_length(title) between 5 and 120),
  location text not null check (char_length(location) between 2 and 120),
  price text not null check (char_length(price) between 2 and 80),
  bedrooms integer not null default 0 check (bedrooms between 0 and 50),
  bathrooms integer not null default 0 check (bathrooms between 0 and 50),
  size text not null default '' check (char_length(size) <= 60),
  description text not null check (char_length(description) between 40 and 2000),
  images text[] not null check (cardinality(images) between 1 and 8),
  consent boolean not null check (consent = true),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text not null default '',
  approved_property_id uuid references public.properties(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.property_submissions enable row level security;

drop policy if exists "Anyone submits a property for review" on public.property_submissions;
drop policy if exists "Launch admin reviews property submissions" on public.property_submissions;
create policy "Anyone submits a property for review" on public.property_submissions for insert to anon, authenticated with check (status = 'pending' and consent = true);
create policy "Launch admin reviews property submissions" on public.property_submissions for all to authenticated using ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com') with check ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com');

drop function if exists public.approve_property_submission(uuid);
create or replace function public.approve_property_submission(submission_id uuid, published_images text[])
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  submission public.property_submissions%rowtype;
  property_id uuid := gen_random_uuid();
begin
  if (auth.jwt() ->> 'email') <> 'info@realmetricsholdings.com' then
    raise exception 'Not authorised';
  end if;
  select * into submission from public.property_submissions where id = submission_id and status = 'pending' for update;
  if not found then raise exception 'Pending submission not found'; end if;
  if cardinality(published_images) <> cardinality(submission.images) then raise exception 'Approved image set is incomplete'; end if;
  insert into public.properties (id, title, location, price, status, category, beds, baths, size, featured, description, images)
  values (property_id, submission.title, submission.location, submission.price, submission.listing_type, submission.category, submission.bedrooms, submission.bathrooms, submission.size, false, submission.description, published_images);
  update public.property_submissions set status = 'approved', approved_property_id = property_id, reviewed_at = now() where id = submission_id;
  return property_id;
end;
$$;

grant execute on function public.approve_property_submission(uuid, text[]) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-submissions', 'property-submissions', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone uploads property submission images" on storage.objects;
drop policy if exists "Launch admin manages property submission images" on storage.objects;
drop policy if exists "Launch admin manages approved property images" on storage.objects;
create policy "Anyone uploads property submission images" on storage.objects for insert to anon, authenticated with check (bucket_id = 'property-submissions');
create policy "Launch admin manages property submission images" on storage.objects for all to authenticated using (bucket_id = 'property-submissions' and (auth.jwt() ->> 'email') = 'info@realmetricsholdings.com') with check (bucket_id = 'property-submissions' and (auth.jwt() ->> 'email') = 'info@realmetricsholdings.com');
create policy "Launch admin manages approved property images" on storage.objects for all to authenticated using (bucket_id = 'property-images' and (auth.jwt() ->> 'email') = 'info@realmetricsholdings.com') with check (bucket_id = 'property-images' and (auth.jwt() ->> 'email') = 'info@realmetricsholdings.com');
