import { defaultProperties, defaultServices, defaultSettings, defaultTestimonials } from './defaultData';
import { hasSupabase, supabase, tables } from './supabase';

const localKey = 'real-metrics-cms-v1';

const seed = {
  settings: defaultSettings,
  properties: defaultProperties,
  services: defaultServices,
  testimonials: defaultTestimonials,
};

export const initialCmsData = seed;

const readLocal = () => {
  const saved = window.localStorage.getItem(localKey);
  if (!saved) return seed;
  try {
    return { ...seed, ...JSON.parse(saved) };
  } catch {
    return seed;
  }
};

const writeLocal = (data) => {
  window.localStorage.setItem(localKey, JSON.stringify(data));
};

const ordered = (items) => [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

export async function loadCmsData() {
  if (!hasSupabase) return readLocal();

  const [settingsResult, propertiesResult, servicesResult, testimonialsResult] = await Promise.all([
    supabase.from(tables.settings).select('*').eq('singleton_key', 'main').maybeSingle(),
    supabase.from(tables.properties).select('*').order('created_at', { ascending: false }),
    supabase.from(tables.services).select('*').order('sort_order'),
    supabase.from(tables.testimonials).select('*').order('sort_order'),
  ]);

  const hasError = [settingsResult, propertiesResult, servicesResult, testimonialsResult].some((result) => result.error);
  if (hasError) return readLocal();

  return {
    settings: { ...defaultSettings, ...(settingsResult.data || {}) },
    properties: propertiesResult.data?.length ? propertiesResult.data : defaultProperties,
    services: servicesResult.data?.length ? ordered(servicesResult.data) : defaultServices,
    testimonials: testimonialsResult.data?.length ? ordered(testimonialsResult.data) : defaultTestimonials,
  };
}

export async function saveCmsData(data) {
  if (!hasSupabase) {
    writeLocal(data);
    return data;
  }

  const settingsResult = await supabase
    .from(tables.settings)
    .upsert({ ...data.settings, singleton_key: 'main', updated_at: new Date().toISOString() }, { onConflict: 'singleton_key' });

  if (settingsResult.error) throw settingsResult.error;

  const upsertCollection = async (table, collection) => {
    const payload = collection.map((item) => ({
      ...item,
      updated_at: new Date().toISOString(),
    }));
    const existing = await supabase.from(table).select('id');
    if (existing.error) throw existing.error;

    const retainedIds = new Set(collection.map((item) => item.id));
    const removedIds = (existing.data || []).map((item) => item.id).filter((id) => !retainedIds.has(id));
    if (removedIds.length) {
      const deletion = await supabase.from(table).delete().in('id', removedIds);
      if (deletion.error) throw deletion.error;
    }

    if (payload.length) {
      const result = await supabase.from(table).upsert(payload);
      if (result.error) throw result.error;
    }
  };

  await Promise.all([
    upsertCollection(tables.properties, data.properties),
    upsertCollection(tables.services, data.services),
    upsertCollection(tables.testimonials, data.testimonials),
  ]);

  return data;
}
