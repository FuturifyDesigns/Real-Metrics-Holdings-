create or replace function public.reserve_property_submission(p_id uuid, p_owner_email text, p_owner_phone text, p_honeypot text default '')
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  client_ip text;
  request_fingerprint text;
  ip_fingerprint text;
begin
  if coalesce(trim(p_honeypot), '') <> '' then raise exception 'Invalid submission'; end if;
  if char_length(trim(p_owner_email)) not between 3 and 120 or position('@' in p_owner_email) < 2 then raise exception 'Invalid email address'; end if;
  if char_length(trim(p_owner_phone)) not between 7 and 20 then raise exception 'Invalid phone number'; end if;
  client_ip := trim(split_part(coalesce(headers ->> 'x-forwarded-for', headers ->> 'x-real-ip', ''), ',', 1));
  request_fingerprint := encode(digest(lower(trim(p_owner_email)) || '|' || trim(p_owner_phone) || '|' || client_ip, 'sha256'), 'hex');
  if client_ip <> '' then
    ip_fingerprint := encode(digest(client_ip, 'sha256'), 'hex');
    perform public.consume_rate_limit('property-ip-day', ip_fingerprint, 10, interval '24 hours');
    perform public.consume_rate_limit('property-ip-week', ip_fingerprint, 20, interval '7 days');
  end if;
  perform public.consume_rate_limit('property-day', request_fingerprint, 3, interval '24 hours');
  perform public.consume_rate_limit('property-week', request_fingerprint, 8, interval '7 days');
  delete from public.property_submission_tokens where expires_at < now() or used = true;
  insert into public.property_submission_tokens (id, fingerprint) values (p_id, request_fingerprint);
  return p_id;
end;
$$;
revoke all on function public.reserve_property_submission(uuid, text, text, text) from public;
grant execute on function public.reserve_property_submission(uuid, text, text, text) to anon, authenticated;

create or replace function public.submit_contact_inquiry(p_name text, p_email text, p_phone text, p_inquiry_type text, p_property_id uuid, p_property_title text, p_message text, p_privacy_consent boolean, p_honeypot text default '')
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  inquiry_id uuid := gen_random_uuid();
  headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  client_ip text;
  request_fingerprint text;
  ip_fingerprint text;
begin
  if coalesce(trim(p_honeypot), '') <> '' then raise exception 'Invalid submission'; end if;
  if p_privacy_consent is not true then raise exception 'Privacy consent is required'; end if;
  if char_length(trim(p_name)) not between 2 and 80 then raise exception 'Invalid name'; end if;
  if char_length(trim(p_email)) not between 3 and 120 or position('@' in p_email) < 2 then raise exception 'Invalid email address'; end if;
  if char_length(trim(p_phone)) not between 7 and 20 then raise exception 'Invalid phone number'; end if;
  if char_length(trim(p_message)) not between 20 and 1500 then raise exception 'Invalid message'; end if;
  if p_inquiry_type not in ('Property enquiry', 'General enquiry', 'Property search', 'Partnership', 'Website support') then raise exception 'Invalid inquiry type'; end if;
  client_ip := trim(split_part(coalesce(headers ->> 'x-forwarded-for', headers ->> 'x-real-ip', ''), ',', 1));
  request_fingerprint := encode(digest(lower(trim(p_email)) || '|' || trim(p_phone) || '|' || client_ip, 'sha256'), 'hex');
  if client_ip <> '' then
    ip_fingerprint := encode(digest(client_ip, 'sha256'), 'hex');
    perform public.consume_rate_limit('contact-ip-hour', ip_fingerprint, 20, interval '1 hour');
    perform public.consume_rate_limit('contact-ip-day', ip_fingerprint, 40, interval '24 hours');
  end if;
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
  client_ip := trim(split_part(coalesce(headers ->> 'x-forwarded-for', headers ->> 'x-real-ip', ''), ',', 1));
  request_fingerprint := encode(digest(lower(trim(p_owner_email)) || '|' || trim(p_owner_phone) || '|' || client_ip, 'sha256'), 'hex');
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
