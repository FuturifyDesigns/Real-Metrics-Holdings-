create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  singleton_key text unique not null default 'main',
  brand_name text not null default 'Real Metrics Holdings',
  hero_title text not null default 'Real estate advertising with measurable presence.',
  hero_subtitle text not null default 'Premium campaigns, polished listing showcases, and market-ready property presentation for sellers, landlords, agents, and developers.',
  email text not null default 'info@realmetricsholdings.com',
  phone text not null default '+267 72 633 424',
  address text default 'Gaborone, Botswana',
  about_title text not null default 'Property presentation with a local point of view.',
  about_body text not null default 'We started Real Metrics Holdings to give Botswana property a more considered place in the market. Each listing is shaped to feel clear, credible, and worth someone''s time.',
  contact_intro text not null default 'Whether you are selling, letting, or launching a development, tell us what you need to bring to market.',
  updated_at timestamptz not null default now()
);

alter table public.site_settings add column if not exists about_title text not null default 'Property presentation with a local point of view.';
alter table public.site_settings add column if not exists about_body text not null default 'We started Real Metrics Holdings to give Botswana property a more considered place in the market. Each listing is shaped to feel clear, credible, and worth someone''s time.';
alter table public.site_settings add column if not exists contact_intro text not null default 'Whether you are selling, letting, or launching a development, tell us what you need to bring to market.';

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null,
  price text not null,
  status text not null check (status in ('Available', 'For Sale', 'For Rent', 'Sold', 'Rented', 'Tenanted')),
  category text not null default 'Residential',
  beds integer default 0,
  baths integer default 0,
  size text default '',
  featured boolean not null default false,
  description text not null default '',
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  icon text not null default 'badge',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default '',
  quote text not null,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

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

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) <= 120),
  phone text not null check (char_length(phone) between 7 and 20),
  inquiry_type text not null check (inquiry_type in ('Property enquiry', 'General enquiry', 'Property search', 'Partnership', 'Website support')),
  property_id uuid references public.properties(id) on delete set null,
  property_title text not null default '' check (char_length(property_title) <= 120),
  message text not null check (char_length(message) between 20 and 1500),
  status text not null default 'new' check (status in ('new', 'contacted', 'resolved')),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

alter table public.site_settings enable row level security;
alter table public.properties enable row level security;
alter table public.services enable row level security;
alter table public.testimonials enable row level security;
alter table public.property_submissions enable row level security;
alter table public.contact_inquiries enable row level security;

drop policy if exists "Public read site settings" on public.site_settings;
drop policy if exists "Public read properties" on public.properties;
drop policy if exists "Public read services" on public.services;
drop policy if exists "Public read testimonials" on public.testimonials;
drop policy if exists "Launch admin writes site settings" on public.site_settings;
drop policy if exists "Launch admin writes properties" on public.properties;
drop policy if exists "Launch admin writes services" on public.services;
drop policy if exists "Launch admin writes testimonials" on public.testimonials;
drop policy if exists "Anyone submits a property for review" on public.property_submissions;
drop policy if exists "Launch admin reviews property submissions" on public.property_submissions;
drop policy if exists "Anyone sends a contact enquiry" on public.contact_inquiries;
drop policy if exists "Launch admin manages contact enquiries" on public.contact_inquiries;

create policy "Public read site settings" on public.site_settings for select using (true);
create policy "Public read properties" on public.properties for select using (true);
create policy "Public read services" on public.services for select using (true);
create policy "Public read testimonials" on public.testimonials for select using (true);

-- Only the approved authenticated administrator can change website content.
create policy "Launch admin writes site settings" on public.site_settings for all to authenticated using ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com') with check ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com');
create policy "Launch admin writes properties" on public.properties for all to authenticated using ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com') with check ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com');
create policy "Launch admin writes services" on public.services for all to authenticated using ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com') with check ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com');
create policy "Launch admin writes testimonials" on public.testimonials for all to authenticated using ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com') with check ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com');
create policy "Anyone submits a property for review" on public.property_submissions for insert to anon, authenticated with check (status = 'pending' and consent = true);
create policy "Launch admin reviews property submissions" on public.property_submissions for all to authenticated using ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com') with check ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com');
create policy "Anyone sends a contact enquiry" on public.contact_inquiries for insert to anon, authenticated with check (status = 'new');
create policy "Launch admin manages contact enquiries" on public.contact_inquiries for all to authenticated using ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com') with check ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com');

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

insert into public.site_settings (singleton_key)
values ('main')
on conflict (singleton_key) do nothing;

insert into public.properties (title, location, price, status, category, beds, baths, size, featured, description, images)
values
('Kgale View Executive Home', 'Kgale, Gaborone', 'BWP 3,850,000', 'For Sale', 'Residential', 4, 3, '420 sqm', true, 'A high-visibility residential listing designed for premium buyer attention with expansive interiors, secure parking, and a clean campaign-ready image set.', array['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85']),
('Central Business Apartment', 'CBD, Gaborone', 'BWP 12,500 / month', 'Available', 'Apartment', 2, 2, '118 sqm', true, 'Modern city living positioned for professionals who need access, security, and polished presentation.', array['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=85']),
('Phakalane Family Residence', 'Phakalane', 'BWP 22,000 / month', 'Tenanted', 'Residential', 5, 4, '610 sqm', false, 'A complete property advertising example for landlord campaigns and executive tenant placement.', array['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85']);

insert into public.services (title, description, icon, sort_order)
values
('Listing Campaigns', 'Structured property adverts with sharp copy, rich media, and placement-ready details for sale, rental, and tenancy campaigns.', 'megaphone', 1),
('Showcase Pages', 'Professional property pages with image slideshows, status badges, feature highlights, and inquiry actions.', 'layout', 2),
('Market Presentation', 'Clean visuals, buyer-friendly messaging, and campaign polish for developers, landlords, and agencies.', 'chart', 3)
on conflict do nothing;

insert into public.testimonials (name, role, quote, sort_order)
values
('Property Owner', 'Gaborone', 'The listing looked premium from the first impression and helped position the property with the right buyers.', 1),
('Letting Partner', 'Botswana', 'Real Metrics makes property advertising feel organized, polished, and easy to update.', 2)
on conflict do nothing;
