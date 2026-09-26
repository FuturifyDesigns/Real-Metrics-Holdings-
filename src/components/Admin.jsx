import { Save, Plus, Trash2, LogOut, Database, ImagePlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { hasSupabase } from '../lib/supabase';

const statuses = ['Available', 'For Sale', 'For Rent', 'Sold', 'Rented', 'Tenanted'];

const blankProperty = () => ({
  id: crypto.randomUUID(),
  title: 'New Property Advert',
  location: 'Gaborone',
  price: 'BWP ',
  status: 'Available',
  category: 'Residential',
  beds: 3,
  baths: 2,
  size: '250 sqm',
  featured: false,
  description: 'Describe the property campaign, buyer profile, and standout features.',
  images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85'],
});

export function Admin({ data, setData, onSave }) {
  const configuredPasscode = import.meta.env.VITE_ADMIN_PASSCODE || 'realmetrics-admin';
  const [passcode, setPasscode] = useState('');
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem('real-metrics-admin') === 'open');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const sortedProperties = useMemo(() => data.properties, [data.properties]);

  const unlock = (event) => {
    event.preventDefault();
    if (passcode === configuredPasscode) {
      sessionStorage.setItem('real-metrics-admin', 'open');
      setUnlocked(true);
      setMessage('');
    } else {
      setMessage('Incorrect admin passcode.');
    }
  };

  const updateSettings = (field, value) => setData((current) => ({
    ...current,
    settings: { ...current.settings, [field]: value },
  }));

  const updateProperty = (id, field, value) => setData((current) => ({
    ...current,
    properties: current.properties.map((property) => (property.id === id ? { ...property, [field]: value } : property)),
  }));

  const updateImages = (id, value) => {
    const images = value.split('\n').map((item) => item.trim()).filter(Boolean);
    updateProperty(id, 'images', images);
  };

  const removeProperty = (id) => setData((current) => ({
    ...current,
    properties: current.properties.filter((property) => property.id !== id),
  }));

  const addProperty = () => setData((current) => ({
    ...current,
    properties: [blankProperty(), ...current.properties],
  }));

  const save = async () => {
    setSaving(true);
    await onSave(data);
    setSaving(false);
    setMessage(hasSupabase ? 'Saved to Supabase.' : 'Saved in this browser preview. Add Supabase env vars for live database writes.');
  };

  if (!unlocked) {
    return (
      <main className="admin-shell">
        <form className="admin-login" onSubmit={unlock}>
          <img src={`${import.meta.env.BASE_URL}real-metrics-logo.png`} alt="Real Metrics Holdings" />
          <h1>Admin CMS</h1>
          <p>Manage copy, contact details, and property adverts across the site.</p>
          <input value={passcode} onChange={(event) => setPasscode(event.target.value)} type="password" placeholder="Admin passcode" />
          <button type="submit">Unlock CMS</button>
          {message && <span className="form-message">{message}</span>}
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <section className="admin-top">
        <div>
          <p className="eyebrow">Real Metrics CMS</p>
          <h1>Admin Dashboard</h1>
          <p>Update live-ready content for listings, campaign copy, and contact information.</p>
        </div>
        <div className="admin-actions">
          <span className="database-pill"><Database size={15} />{hasSupabase ? 'Supabase connected' : 'Local preview'}</span>
          <button type="button" className="ghost-button" onClick={() => { sessionStorage.removeItem('real-metrics-admin'); setUnlocked(false); }}><LogOut size={16} />Log out</button>
          <button type="button" className="primary-button" onClick={save} disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Save CMS'}</button>
        </div>
      </section>

      <section className="admin-panel">
        <h2>Site Content</h2>
        <div className="admin-grid">
          <label>Hero Title<input value={data.settings.hero_title} onChange={(event) => updateSettings('hero_title', event.target.value)} /></label>
          <label>Email<input value={data.settings.email} onChange={(event) => updateSettings('email', event.target.value)} /></label>
          <label>Phone<input value={data.settings.phone} onChange={(event) => updateSettings('phone', event.target.value)} /></label>
          <label>Address<input value={data.settings.address} onChange={(event) => updateSettings('address', event.target.value)} /></label>
          <label className="wide">Hero Subtitle<textarea value={data.settings.hero_subtitle} onChange={(event) => updateSettings('hero_subtitle', event.target.value)} /></label>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <h2>Advertisements</h2>
          <button type="button" className="primary-button" onClick={addProperty}><Plus size={16} />Add advert</button>
        </div>
        <div className="property-editor-list">
          {sortedProperties.map((property) => (
            <article className="property-editor" key={property.id}>
              <div className="editor-heading">
                <strong>{property.title}</strong>
                <button type="button" aria-label="Delete advert" onClick={() => removeProperty(property.id)}><Trash2 size={16} /></button>
              </div>
              <div className="admin-grid">
                <label>Title<input value={property.title} onChange={(event) => updateProperty(property.id, 'title', event.target.value)} /></label>
                <label>Location<input value={property.location} onChange={(event) => updateProperty(property.id, 'location', event.target.value)} /></label>
                <label>Price<input value={property.price} onChange={(event) => updateProperty(property.id, 'price', event.target.value)} /></label>
                <label>Status<select value={property.status} onChange={(event) => updateProperty(property.id, 'status', event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                <label>Category<input value={property.category} onChange={(event) => updateProperty(property.id, 'category', event.target.value)} /></label>
                <label>Beds<input type="number" value={property.beds} onChange={(event) => updateProperty(property.id, 'beds', Number(event.target.value))} /></label>
                <label>Baths<input type="number" value={property.baths} onChange={(event) => updateProperty(property.id, 'baths', Number(event.target.value))} /></label>
                <label>Size<input value={property.size} onChange={(event) => updateProperty(property.id, 'size', event.target.value)} /></label>
                <label className="check-row"><input type="checkbox" checked={property.featured} onChange={(event) => updateProperty(property.id, 'featured', event.target.checked)} /> Featured advert</label>
                <label className="wide">Description<textarea value={property.description} onChange={(event) => updateProperty(property.id, 'description', event.target.value)} /></label>
                <label className="wide"><span><ImagePlus size={15} />Image URLs, one per line</span><textarea value={(property.images || []).join('\n')} onChange={(event) => updateImages(property.id, event.target.value)} /></label>
              </div>
            </article>
          ))}
        </div>
      </section>
      {message && <div className="toast">{message}</div>}
    </main>
  );
}
