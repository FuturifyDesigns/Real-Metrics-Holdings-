alter table public.contact_inquiries
  drop constraint if exists contact_inquiries_inquiry_type_check;

alter table public.contact_inquiries
  add constraint contact_inquiries_inquiry_type_check
  check (inquiry_type in ('Property enquiry', 'General enquiry', 'Property search', 'Partnership', 'Website support', 'Food product enquiry'));

create or replace function public.submit_contact_inquiry(p_name text, p_email text, p_phone text, p_inquiry_type text, p_property_id uuid, p_property_title text, p_message text, p_privacy_consent boolean, p_honeypot text default '')
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
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
  if p_inquiry_type not in ('Property enquiry', 'General enquiry', 'Property search', 'Partnership', 'Website support', 'Food product enquiry') then raise exception 'Invalid inquiry type'; end if;
  client_ip := trim(split_part(coalesce(headers ->> 'x-forwarded-for', headers ->> 'x-real-ip', ''), ',', 1));
  request_fingerprint := encode(digest(lower(trim(p_email)) || '|' || trim(p_phone) || '|' || trim(client_ip), 'sha256'), 'hex');
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
