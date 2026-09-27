import { Database, ImagePlus, LogOut, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { hasSupabase, supabase } from '../lib/supabase';

const statuses = ['Available', 'For Sale', 'For Rent', 'Sold', 'Rented', 'Tenanted'];
const adminEmail = 'info@realmetricsholdings.com';

const blankProperty = () => ({
  id: crypto.randomUUID(), title: 'New Property', location: 'Gaborone', price: 'BWP ', status: 'Available', category: 'Residential', beds: 3, baths: 2, size: '250 sqm', featured: false, description: '', images: [],
});
const blankService = () => ({ id: crypto.randomUUID(), title: 'New service', description: '', icon: 'megaphone', sort_order: 99 });
const blankTestimonial = () => ({ id: crypto.randomUUID(), name: 'Client name', role: 'Gaborone', quote: '', sort_order: 99 });

export function Admin({ data, setData, onSave }) {
  const [email, setEmail] = useState(adminEmail);
  const [password, setPassword] = useState('');
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(hasSupabase);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const sortedProperties = useMemo(() => data.properties, [data.properties]);

  useEffect(() => {
    if (!hasSupabase) return;
    supabase.auth.getSession().then(({ data: authData }) => { setSession(authData.session); setChecking(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!hasSupabase) { setMessage('Supabase is not configured for this deployment.'); return; }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage('The email or password is incorrect.');
  };

  const logout = async () => { await supabase.auth.signOut(); setSession(null); };
  const updateSettings = (field, value) => setData((current) => ({ ...current, settings: { ...current.settings, [field]: value } }));
  const updateCollection = (collection, id, field, value) => setData((current) => ({ ...current, [collection]: current[collection].map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  const removeItem = (collection, id) => setData((current) => ({ ...current, [collection]: current[collection].filter((item) => item.id !== id) }));
  const addItem = (collection, item) => setData((current) => ({ ...current, [collection]: [item, ...current[collection]] }));
  const updateImages = (id, value) => updateCollection('properties', id, 'images', value.split('\n').map((item) => item.trim()).filter(Boolean));

  const save = async () => {
    setSaving(true); setMessage('');
    try { await onSave(data); setMessage('Changes saved.'); }
    catch (error) { setMessage(error.message || 'Could not save the changes.'); }
    finally { setSaving(false); }
  };

  if (checking) return <main className="admin-shell"><div className="loading">Checking session...</div></main>;
  if (!session || session.user.email?.toLowerCase() !== adminEmail) return <main className="admin-shell"><form className="admin-login" onSubmit={login}><img src={`${import.meta.env.BASE_URL}real-metrics-logo.png`} alt="Real Metrics Holdings" /><p className="eyebrow">Private access</p><h1>Admin CMS</h1><p>Sign in to manage website content and property advertisements.</p><label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required /></label><label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required /></label><button className="primary-button" type="submit">Sign in</button>{message && <span className="form-message">{message}</span>}</form></main>;

  return <main className="admin-shell">
    <section className="admin-top"><div><p className="eyebrow">Real Metrics CMS</p><h1>Admin Dashboard</h1><p>Manage the content shown across the website.</p></div><div className="admin-actions"><span className="database-pill"><Database size={15} />Supabase connected</span><button type="button" className="ghost-button" onClick={logout}><LogOut size={16} />Log out</button><button type="button" className="primary-button" onClick={save} disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Save changes'}</button></div></section>

    <section className="admin-panel"><h2>Website content</h2><div className="admin-grid"><label>Homepage title<input value={data.settings.hero_title} onChange={(e) => updateSettings('hero_title', e.target.value)} /></label><label>Email<input value={data.settings.email} onChange={(e) => updateSettings('email', e.target.value)} /></label><label>Phone<input value={data.settings.phone} onChange={(e) => updateSettings('phone', e.target.value)} /></label><label>Address<input value={data.settings.address} onChange={(e) => updateSettings('address', e.target.value)} /></label><label className="wide">Homepage introduction<textarea value={data.settings.hero_subtitle} onChange={(e) => updateSettings('hero_subtitle', e.target.value)} /></label><label className="wide">About page title<input value={data.settings.about_title || ''} onChange={(e) => updateSettings('about_title', e.target.value)} /></label><label className="wide">About page text<textarea value={data.settings.about_body || ''} onChange={(e) => updateSettings('about_body', e.target.value)} /></label><label className="wide">Contact page introduction<textarea value={data.settings.contact_intro || ''} onChange={(e) => updateSettings('contact_intro', e.target.value)} /></label></div></section>

    <section className="admin-panel"><div className="panel-heading"><h2>Properties</h2><button type="button" className="primary-button" onClick={() => addItem('properties', blankProperty())}><Plus size={16} />Add property</button></div><div className="property-editor-list">{sortedProperties.map((property) => <article className="property-editor" key={property.id}><div className="editor-heading"><strong>{property.title}</strong><button type="button" aria-label="Delete property" onClick={() => removeItem('properties', property.id)}><Trash2 size={16} /></button></div><div className="admin-grid"><label>Title<input value={property.title} onChange={(e) => updateCollection('properties', property.id, 'title', e.target.value)} /></label><label>Location<input value={property.location} onChange={(e) => updateCollection('properties', property.id, 'location', e.target.value)} /></label><label>Price<input value={property.price} onChange={(e) => updateCollection('properties', property.id, 'price', e.target.value)} /></label><label>Status<select value={property.status} onChange={(e) => updateCollection('properties', property.id, 'status', e.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>Category<input value={property.category} onChange={(e) => updateCollection('properties', property.id, 'category', e.target.value)} /></label><label>Bedrooms<input type="number" value={property.beds} onChange={(e) => updateCollection('properties', property.id, 'beds', Number(e.target.value))} /></label><label>Bathrooms<input type="number" value={property.baths} onChange={(e) => updateCollection('properties', property.id, 'baths', Number(e.target.value))} /></label><label>Size<input value={property.size} onChange={(e) => updateCollection('properties', property.id, 'size', e.target.value)} /></label><label className="check-row"><input type="checkbox" checked={property.featured} onChange={(e) => updateCollection('properties', property.id, 'featured', e.target.checked)} /> Featured</label><label className="wide">Description<textarea value={property.description} onChange={(e) => updateCollection('properties', property.id, 'description', e.target.value)} /></label><label className="wide"><span><ImagePlus size={15} /> Image URLs, one per line</span><textarea value={(property.images || []).join('\n')} onChange={(e) => updateImages(property.id, e.target.value)} /></label></div></article>)}</div></section>

    <section className="admin-panel"><div className="panel-heading"><h2>Services</h2><button type="button" className="primary-button" onClick={() => addItem('services', blankService())}><Plus size={16} />Add service</button></div><div className="cms-editor-list">{data.services.map((service) => <article className="property-editor" key={service.id}><div className="editor-heading"><strong>{service.title}</strong><button type="button" aria-label="Delete service" onClick={() => removeItem('services', service.id)}><Trash2 size={16} /></button></div><div className="admin-grid"><label>Title<input value={service.title} onChange={(e) => updateCollection('services', service.id, 'title', e.target.value)} /></label><label>Icon<select value={service.icon} onChange={(e) => updateCollection('services', service.id, 'icon', e.target.value)}><option value="megaphone">Megaphone</option><option value="layout">Building</option><option value="chart">Chart</option></select></label><label className="wide">Description<textarea value={service.description} onChange={(e) => updateCollection('services', service.id, 'description', e.target.value)} /></label></div></article>)}</div></section>

    <section className="admin-panel"><div className="panel-heading"><h2>Testimonials</h2><button type="button" className="primary-button" onClick={() => addItem('testimonials', blankTestimonial())}><Plus size={16} />Add testimonial</button></div><div className="cms-editor-list">{data.testimonials.map((item) => <article className="property-editor" key={item.id}><div className="editor-heading"><strong>{item.name}</strong><button type="button" aria-label="Delete testimonial" onClick={() => removeItem('testimonials', item.id)}><Trash2 size={16} /></button></div><div className="admin-grid"><label>Name<input value={item.name} onChange={(e) => updateCollection('testimonials', item.id, 'name', e.target.value)} /></label><label>Role or location<input value={item.role} onChange={(e) => updateCollection('testimonials', item.id, 'role', e.target.value)} /></label><label className="wide">Quote<textarea value={item.quote} onChange={(e) => updateCollection('testimonials', item.id, 'quote', e.target.value)} /></label></div></article>)}</div></section>
    {message && <div className="toast">{message}</div>}
  </main>;
}
