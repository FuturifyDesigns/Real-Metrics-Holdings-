create extension if not exists pgcrypto;

alter table public.contact_inquiries add column if not exists privacy_consent boolean not null default false;
alter table public.contact_inquiries add column if not exists consent_version text not null default '2026-09-27';

create table if not exists public.request_rate_limits (
  id bigint generated always as identity primary key,
  action text not null,
  fingerprint text not null,
  created_at timestamptz not null default now()
);
create index if not exists request_rate_limits_lookup on public.request_rate_limits (action, fingerprint, created_at desc);
alter table public.request_rate_limits enable row level security;

create table if not exists public.property_submission_tokens (
  id uuid primary key,
  fingerprint text not null,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  used boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.property_submission_tokens enable row level security;

drop policy if exists "Anyone sends a contact enquiry" on public.contact_inquiries;
drop policy if exists "Anyone submits a property for review" on public.property_submissions;

create or replace function public.consume_rate_limit(p_action text, p_fingerprint text, p_limit integer, p_window interval)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.request_rate_limits where created_at < now() - interval '7 days';
  if (select count(*) from public.request_rate_limits where action = p_action and fingerprint = p_fingerprint and created_at > now() - p_window) >= p_limit then
    raise exception 'Too many requests. Please wait and try again.' using errcode = 'P0001';
  end if;
  insert into public.request_rate_limits (action, fingerprint) values (p_action, p_fingerprint);
end;
$$;
revoke all on function public.consume_rate_limit(text, text, integer, interval) from public, anon, authenticated;

create or replace function public.reserve_property_submission(p_id uuid, p_owner_email text, p_owner_phone text, p_honeypot text default '')
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  client_ip text;
  request_fingerprint text;
begin
  if coalesce(trim(p_honeypot), '') <> '' then raise exception 'Invalid submission'; end if;
  client_ip := split_part(coalesce(headers ->> 'x-forwarded-for', headers ->> 'cf-connecting-ip', ''), ',', 1);
  request_fingerprint := encode(digest(lower(trim(p_owner_email)) || '|' || trim(p_owner_phone) || '|' || trim(client_ip), 'sha256'), 'hex');
  perform public.consume_rate_limit('property-day', request_fingerprint, 3, interval '24 hours');
  perform public.consume_rate_limit('property-week', request_fingerprint, 8, interval '7 days');
  delete from public.property_submission_tokens where expires_at < now() or used = true;
  insert into public.property_submission_tokens (id, fingerprint) values (p_id, request_fingerprint);
  return p_id;
end;
$$;
revoke all on function public.reserve_property_submission(uuid, text, text, text) from public;
grant execute on function public.reserve_property_submission(uuid, text, text, text) to anon, authenticated;

create or replace function public.can_upload_submission_image(object_name text)
returns boolean language plpgsql security definer stable set search_path = public, storage as $$
declare folder text := split_part(object_name, '/', 1);
begin
  if folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then return false; end if;
  return exists (select 1 from public.property_submission_tokens where id = folder::uuid and used = false and expires_at > now())
    and (select count(*) from storage.objects where bucket_id = 'property-submissions' and split_part(name, '/', 1) = folder) < 8;
end;
$$;
revoke all on function public.can_upload_submission_image(text) from public;
grant execute on function public.can_upload_submission_image(text) to anon, authenticated;

create or replace function public.submit_contact_inquiry(p_name text, p_email text, p_phone text, p_inquiry_type text, p_property_id uuid, p_property_title text, p_message text, p_privacy_consent boolean, p_honeypot text default '')
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  inquiry_id uuid := gen_random_uuid();
  headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  client_ip text;
  request_fingerprint text;
begin
  if coalesce(trim(p_honeypot), '') <> '' then raise exception 'Invalid submission'; end if;
  if p_privacy_consent is not true then raise exception 'Privacy consent is required'; end if;
  client_ip := split_part(coalesce(headers ->> 'x-forwarded-for', headers ->> 'cf-connecting-ip', ''), ',', 1);
  request_fingerprint := encode(digest(lower(trim(p_email)) || '|' || trim(p_phone) || '|' || trim(client_ip), 'sha256'), 'hex');
  perform public.consume_rate_limit('contact-hour', request_fingerprint, 5, interval '1 hour');
  perform public.consume_rate_limit('contact-day', request_fingerprint, 12, interval '24 hours');
  insert into public.contact_inquiries (id, name, email, phone, inquiry_type, property_id, property_title, message, privacy_consent, consent_version, status)
  values (inquiry_id, trim(p_name), lower(trim(p_email)), trim(p_phone), p_inquiry_type, p_property_id, coalesce(trim(p_property_title), ''), trim(p_message), true, '2026-09-27', 'new');
  return inquiry_id;
end;
$$;
revoke all on function public.submit_contact_inquiry(text, text, text, text, uuid, text, text, boolean, text) from public;
grant execute on function public.submit_contact_inquiry(text, text, text, text, uuid, text, text, boolean, text) to anon, authenticated;

create or replace function public.submit_property_for_review(p_id uuid, p_owner_name text, p_owner_email text, p_owner_phone text, p_relationship text, p_listing_type text, p_category text, p_title text, p_location text, p_price text, p_bedrooms integer, p_bathrooms integer, p_size text, p_description text, p_images text[], p_consent boolean, p_honeypot text default '')
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  client_ip text;
  request_fingerprint text;
begin
  if coalesce(trim(p_honeypot), '') <> '' then raise exception 'Invalid submission'; end if;
  if p_consent is not true then raise exception 'Submission consent is required'; end if;
  client_ip := split_part(coalesce(headers ->> 'x-forwarded-for', headers ->> 'cf-connecting-ip', ''), ',', 1);
  request_fingerprint := encode(digest(lower(trim(p_owner_email)) || '|' || trim(p_owner_phone) || '|' || trim(client_ip), 'sha256'), 'hex');
  if not exists (select 1 from public.property_submission_tokens where id = p_id and fingerprint = request_fingerprint and used = false and expires_at > now()) then
    raise exception 'Upload reservation is missing or expired';
  end if;
  insert into public.property_submissions (id, owner_name, owner_email, owner_phone, relationship, listing_type, category, title, location, price, bedrooms, bathrooms, size, description, images, consent, status)
  values (p_id, trim(p_owner_name), lower(trim(p_owner_email)), trim(p_owner_phone), p_relationship, p_listing_type, p_category, trim(p_title), trim(p_location), trim(p_price), p_bedrooms, p_bathrooms, coalesce(trim(p_size), ''), trim(p_description), p_images, true, 'pending');
  update public.property_submission_tokens set used = true where id = p_id;
  return p_id;
end;
$$;
revoke all on function public.submit_property_for_review(uuid, text, text, text, text, text, text, text, text, text, integer, integer, text, text, text[], boolean, text) from public;
grant execute on function public.submit_property_for_review(uuid, text, text, text, text, text, text, text, text, text, integer, integer, text, text, text[], boolean, text) to anon, authenticated;

drop policy if exists "Anyone uploads property submission images" on storage.objects;
drop policy if exists "Anyone cleans an incomplete property upload" on storage.objects;
create policy "Anyone uploads property submission images" on storage.objects for insert to anon, authenticated with check (bucket_id = 'property-submissions' and public.can_upload_submission_image(name));
