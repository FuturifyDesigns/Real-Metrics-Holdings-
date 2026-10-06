import { defaultProperties, defaultServices, defaultSettings, defaultTestimonials } from './defaultData';
import { hasSupabase, supabase, tables } from './supabase';

const localKey = 'real-metrics-cms-v1';

const seed = {
  settings: defaultSettings,
  properties: defaultProperties,
  services: defaultServices,
  testimonials: defaultTestimonials,
};

const readCached = () => {
  try {
    const saved = window.localStorage.getItem(localKey);
    return saved ? { ...seed, ...JSON.parse(saved) } : null;
  } catch {
    return null;
  }
};

export const initialCmsData = hasSupabase ? readCached() : (readCached() || seed);

const readLocal = () => readCached() || seed;

const writeLocal = (data) => {
  try {
    const serialized = JSON.stringify(data);
    if (window.localStorage.getItem(localKey) !== serialized) window.localStorage.setItem(localKey, serialized);
  } catch {
    // The live data still works when storage is unavailable.
  }
};

const ordered = (items) => [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

export async function loadCmsData() {
  if (!hasSupabase) return readLocal();

  const [settingsResult, propertiesResult, servicesResult, testimonialsResult] = await Promise.all([
    supabase.from(tables.settings).select('*').eq('singleton_key', 'main').maybeSingle(),
    supabase.from(tables.properties).select('*').order('sort_order').order('created_at', { ascending: false }),
    supabase.from(tables.services).select('*').order('sort_order'),
    supabase.from(tables.testimonials).select('*').order('sort_order'),
  ]);

  const hasError = [settingsResult, propertiesResult, servicesResult, testimonialsResult].some((result) => result.error);
  if (hasError) return readLocal();

  const data = {
    settings: { ...defaultSettings, ...(settingsResult.data || {}) },
    properties: propertiesResult.data ?? defaultProperties,
    services: servicesResult.data ? ordered(servicesResult.data) : defaultServices,
    testimonials: testimonialsResult.data ? ordered(testimonialsResult.data) : defaultTestimonials,
  };
  writeLocal(data);
  return data;
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
    const now = new Date().toISOString();
    const payload = collection.map((item, index) => {
      const { created_at: _rawCreatedAt, updated_at: _rawUpdatedAt, ...rest } = item;
      return {
        ...rest,
        ...(table === tables.properties ? { sort_order: index } : {}),
        updated_at: now,
      };
    });
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

  writeLocal(data);
  return data;
}

export async function deleteCmsItem(collection, id, nextData) {
  const table = tables[collection];
  if (!table) throw new Error('This content type cannot be deleted.');

  if (hasSupabase) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  }

  writeLocal(nextData);
  return nextData;
}
