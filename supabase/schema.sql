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

alter table public.site_settings enable row level security;
alter table public.properties enable row level security;
alter table public.services enable row level security;
alter table public.testimonials enable row level security;

drop policy if exists "Public read site settings" on public.site_settings;
drop policy if exists "Public read properties" on public.properties;
drop policy if exists "Public read services" on public.services;
drop policy if exists "Public read testimonials" on public.testimonials;
drop policy if exists "Launch admin writes site settings" on public.site_settings;
drop policy if exists "Launch admin writes properties" on public.properties;
drop policy if exists "Launch admin writes services" on public.services;
drop policy if exists "Launch admin writes testimonials" on public.testimonials;

create policy "Public read site settings" on public.site_settings for select using (true);
create policy "Public read properties" on public.properties for select using (true);
create policy "Public read services" on public.services for select using (true);
create policy "Public read testimonials" on public.testimonials for select using (true);

-- Only the approved authenticated administrator can change website content.
create policy "Launch admin writes site settings" on public.site_settings for all to authenticated using ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com') with check ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com');
create policy "Launch admin writes properties" on public.properties for all to authenticated using ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com') with check ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com');
create policy "Launch admin writes services" on public.services for all to authenticated using ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com') with check ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com');
create policy "Launch admin writes testimonials" on public.testimonials for all to authenticated using ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com') with check ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com');

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
