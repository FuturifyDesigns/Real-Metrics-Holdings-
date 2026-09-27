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

alter table public.contact_inquiries enable row level security;

drop policy if exists "Anyone sends a contact enquiry" on public.contact_inquiries;
drop policy if exists "Launch admin manages contact enquiries" on public.contact_inquiries;
create policy "Anyone sends a contact enquiry" on public.contact_inquiries for insert to anon, authenticated with check (status = 'new');
create policy "Launch admin manages contact enquiries" on public.contact_inquiries for all to authenticated using ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com') with check ((auth.jwt() ->> 'email') = 'info@realmetricsholdings.com');
