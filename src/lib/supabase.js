import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabase = Boolean(url && anonKey);
export const supabase = hasSupabase ? createClient(url, anonKey) : null;

export const tables = {
  settings: 'site_settings',
  properties: 'properties',
  services: 'services',
  testimonials: 'testimonials',
};
