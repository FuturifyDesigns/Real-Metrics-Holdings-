import { ArrowDown, ArrowUp, CheckCircle2, Clock3, ExternalLink, LogOut, Mail, Pencil, Plus, Save, Trash2, Upload, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { hasSupabase, supabase } from '../lib/supabase';

const statuses = ['Available', 'For Sale', 'For Rent', 'Sold', 'Rented', 'Tenanted'];
const adminEmail = 'info@realmetricsholdings.com';

const blankProperty = () => ({
  id: crypto.randomUUID(), title: 'New Property', location: 'Gaborone', price: 'Price on request', status: 'Available', category: 'Residential', beds: 0, baths: 0, size: '', featured: false, description: '', images: [], sort_order: 0,
});
const blankService = () => ({ id: crypto.randomUUID(), title: 'New service', description: '', icon: 'megaphone', sort_order: 99 });

export function Admin({ data, setData, onSave }) {
  const [email, setEmail] = useState(adminEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(hasSupabase);
  const [saving, setSaving] = useState(false);
  const [activePanel, setActivePanel] = useState('overview');
  const [editingProperty, setEditingProperty] = useState('');
  const [uploading, setUploading] = useState('');
  const [message, setMessage] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [reviewImages, setReviewImages] = useState({});
  const [reviewing, setReviewing] = useState('');
  const [inquiries, setInquiries] = useState([]);
  const sortedProperties = useMemo(() => data.properties, [data.properties]);
  const pendingSubmissions = useMemo(() => submissions.filter((item) => item.status === 'pending'), [submissions]);
  const openInquiries = useMemo(() => inquiries.filter((item) => item.status !== 'resolved'), [inquiries]);

  useEffect(() => {
    if (!hasSupabase) return;
    supabase.auth.getSession().then(({ data: authData }) => { setSession(authData.session); setChecking(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || session.user.email?.toLowerCase() !== adminEmail) return;
    supabase.from('property_submissions').select('*').order('created_at', { ascending: false }).then(async ({ data: rows, error }) => {
      if (error) setMessage(error.message);
      else {
        const nextRows = rows || [];
        setSubmissions(nextRows);
        const paths = nextRows.flatMap((item) => item.images || []);
        if (paths.length) {
          const { data: signed, error: imageError } = await supabase.storage.from('property-submissions').createSignedUrls(paths, 3600);
          if (imageError) setMessage(imageError.message);
          else setReviewImages(Object.fromEntries((signed || []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl])));
        }
      }
    });
    supabase.from('contact_inquiries').select('*').order('created_at', { ascending: false }).then(({ data: rows, error }) => {
      if (error) setMessage(error.message);
      else setInquiries(rows || []);
    });
  }, [session]);

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
  const addProperty = () => {
    const property = blankProperty();
    setData((current) => ({ ...current, properties: [...current.properties, property] }));
    setEditingProperty(property.id);
  };
  const moveProperty = (id, direction) => setData((current) => {
    const properties = [...current.properties];
    const index = properties.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= properties.length) return current;
    [properties[index], properties[target]] = [properties[target], properties[index]];
    return { ...current, properties };
  });
  const moveImage = (propertyId, imageIndex, direction) => setData((current) => ({ ...current, properties: current.properties.map((property) => {
    if (property.id !== propertyId) return property;
    const images = [...(property.images || [])];
    const target = imageIndex + direction;
    if (target < 0 || target >= images.length) return property;
    [images[imageIndex], images[target]] = [images[target], images[imageIndex]];
    return { ...property, images };
  }) }));
  const removeImage = async (propertyId, image) => {
    const marker = '/storage/v1/object/public/property-images/';
    if (image.includes(marker)) {
      const path = decodeURIComponent(image.split(marker)[1]);
      await supabase.storage.from('property-images').remove([path]);
    }
    setData((current) => ({ ...current, properties: current.properties.map((property) => property.id === propertyId ? { ...property, images: (property.images || []).filter((item) => item !== image) } : property) }));
  };
  const uploadImages = async (propertyId, files) => {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    const property = data.properties.find((item) => item.id === propertyId);
    if ((property?.images?.length || 0) + selected.length > 8) { setMessage('A property can have up to 8 images.'); return; }
    if (selected.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024)) { setMessage('Use JPG, PNG, or WebP images no larger than 8 MB each.'); return; }
    setUploading(propertyId); setMessage('');
    try {
      const urls = [];
      for (const file of selected) {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${propertyId}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from('property-images').upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        urls.push(supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl);
      }
      setData((current) => ({ ...current, properties: current.properties.map((item) => item.id === propertyId ? { ...item, images: [...(item.images || []), ...urls] } : item) }));
      setMessage(`${urls.length} image${urls.length === 1 ? '' : 's'} uploaded. Save changes to publish.`);
    } catch (error) { setMessage(error.message || 'The images could not be uploaded.'); }
    finally { setUploading(''); }
  };

  const approveSubmission = async (submission) => {
    setReviewing(submission.id); setMessage('');
    try {
      const publishedImages = [];
      for (const sourcePath of submission.images) {
        const { data: imageFile, error: downloadError } = await supabase.storage.from('property-submissions').download(sourcePath);
        if (downloadError) throw downloadError;
        const fileName = sourcePath.split('/').pop();
        const destination = `${submission.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('property-images').upload(destination, imageFile, { contentType: imageFile.type, upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicImage } = supabase.storage.from('property-images').getPublicUrl(destination);
        publishedImages.push(publicImage.publicUrl);
      }
      const { data: propertyId, error } = await supabase.rpc('approve_property_submission', { submission_id: submission.id, published_images: publishedImages });
      if (error) throw error;
      const { data: property, error: propertyError } = await supabase.from('properties').select('*').eq('id', propertyId).single();
      if (propertyError) throw propertyError;
      setData((current) => ({ ...current, properties: [property, ...current.properties.filter((item) => item.id !== property.id)] }));
      setSubmissions((current) => current.map((item) => item.id === submission.id ? { ...item, status: 'approved', approved_property_id: propertyId } : item));
      setMessage(`${submission.title} approved and published.`);
    } catch (error) { setMessage(error.message || 'Could not approve the submission.'); }
    finally { setReviewing(''); }
  };

  const rejectSubmission = async (submission) => {
    setReviewing(submission.id); setMessage('');
    try {
      const { error } = await supabase.from('property_submissions').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', submission.id);
      if (error) throw error;
      setSubmissions((current) => current.map((item) => item.id === submission.id ? { ...item, status: 'rejected' } : item));
      setMessage(`${submission.title} was rejected.`);
    } catch (error) { setMessage(error.message || 'Could not reject the submission.'); }
    finally { setReviewing(''); }
  };

  const resolveInquiry = async (inquiry) => {
    setReviewing(inquiry.id); setMessage('');
    try {
      const { error } = await supabase.from('contact_inquiries').update({ status: 'resolved', handled_at: new Date().toISOString() }).eq('id', inquiry.id);
      if (error) throw error;
      setInquiries((current) => current.map((item) => item.id === inquiry.id ? { ...item, status: 'resolved' } : item));
      setMessage(`Enquiry from ${inquiry.name} marked as resolved.`);
    } catch (error) { setMessage(error.message || 'Could not update the enquiry.'); }
    finally { setReviewing(''); }
  };

  const save = async () => {
    setSaving(true); setMessage('');
    try { await onSave(data); setMessage('Changes saved.'); }
    catch (error) { setMessage(error.message || 'Could not save the changes.'); }
    finally { setSaving(false); }
  };

  if (checking) return <main className="admin-shell admin-auth-shell"><div className="admin-session-check">Checking session…</div></main>;
  if (!session || session.user.email?.toLowerCase() !== adminEmail) return <main className="admin-shell admin-auth-shell"><form className="admin-login" onSubmit={login}><img src={`${import.meta.env.BASE_URL}real-metrics-logo-transparent.png`} alt="Real Metrics Holdings" /><p className="eyebrow">Private access</p><h1>Admin CMS</h1><p>Sign in to manage website content and property advertisements.</p><label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required /></label><label>Password<div className="password-field"><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" required /><button className="password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? 'Hide' : 'Show'}</button></div></label><button className="primary-button" type="submit">Sign in</button>{message && <span className="form-message">{message}</span>}</form></main>;

  const tabs = [
    ['overview', 'Overview'], ['properties', 'Properties'], ['submissions', `Submissions (${pendingSubmissions.length})`],
    ['inquiries', `Enquiries (${openInquiries.length})`], ['content', 'Site content'], ['services', 'Services'],
  ];

  return <main className="admin-shell">
    <section className="admin-top"><div><p className="eyebrow">Real Metrics CMS</p><h1>Admin Dashboard</h1><p>Choose one area to manage, or edit content directly on the live website.</p></div><div className="admin-actions"><a className="admin-live-button" href={`${import.meta.env.BASE_URL}?edit=1`}>Edit live site <ExternalLink size={16} /></a><button type="button" className="admin-logout" onClick={logout}><LogOut size={16} />Log out</button><button type="button" className="primary-button" onClick={save} disabled={saving}><Save size={16} />{saving ? 'Saving…' : 'Save changes'}</button></div></section>

    <nav className="admin-tabs" aria-label="Dashboard sections">{tabs.map(([id, label]) => <button type="button" className={activePanel === id ? 'active' : ''} onClick={() => setActivePanel(id)} key={id}>{label}</button>)}</nav>

    {activePanel === 'overview' && <section className="admin-overview"><button type="button" onClick={() => setActivePanel('properties')}><strong>{data.properties.length}</strong><span>Published properties</span><small>Manage listings and galleries</small></button><button type="button" onClick={() => setActivePanel('submissions')}><strong>{pendingSubmissions.length}</strong><span>Awaiting approval</span><small>Review owner submissions</small></button><button type="button" onClick={() => setActivePanel('inquiries')}><strong>{openInquiries.length}</strong><span>Open enquiries</span><small>Respond and mark resolved</small></button><a href={`${import.meta.env.BASE_URL}?edit=1`}><Pencil /><span>Edit the live website</span><small>Change visible content in context</small></a></section>}

    {activePanel === 'content' && <section className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">Website</p><h2>Contact and core content</h2></div><a className="text-link" href={`${import.meta.env.BASE_URL}?edit=1`}>Edit visually <ExternalLink size={15} /></a></div><div className="admin-grid"><label>Homepage title<input value={data.settings.hero_title} onChange={(e) => updateSettings('hero_title', e.target.value)} /></label><label>Email<input value={data.settings.email} onChange={(e) => updateSettings('email', e.target.value)} /></label><label>Phone<input value={data.settings.phone} onChange={(e) => updateSettings('phone', e.target.value)} /></label><label>Address<input value={data.settings.address} onChange={(e) => updateSettings('address', e.target.value)} /></label><label className="wide">Homepage introduction<textarea value={data.settings.hero_subtitle} onChange={(e) => updateSettings('hero_subtitle', e.target.value)} /></label><label className="wide">About page title<input value={data.settings.about_title || ''} onChange={(e) => updateSettings('about_title', e.target.value)} /></label><label className="wide">About page text<textarea value={data.settings.about_body || ''} onChange={(e) => updateSettings('about_body', e.target.value)} /></label><label className="wide">Contact page introduction<textarea value={data.settings.contact_intro || ''} onChange={(e) => updateSettings('contact_intro', e.target.value)} /></label></div></section>}

    {activePanel === 'submissions' && <section className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">Review queue</p><h2>Property submissions</h2></div><span className="submission-count"><Clock3 size={16} />{pendingSubmissions.length} awaiting approval</span></div>{pendingSubmissions.length ? <div className="submission-review-list">{pendingSubmissions.map((submission) => <article className="submission-review" key={submission.id}><div className="submission-review-images">{submission.images.map((image, index) => reviewImages[image] ? <img src={reviewImages[image]} alt={`${submission.title} ${index + 1}`} key={image} /> : <div className="review-image-loading" key={image}>Loading image…</div>)}</div><div className="submission-review-heading"><div><span>{submission.listing_type} · {submission.category}</span><h3>{submission.title}</h3><p>{submission.location} · {submission.price}</p></div><time dateTime={submission.created_at}>{new Date(submission.created_at).toLocaleDateString()}</time></div><p>{submission.description}</p><dl><div><dt>Submitted by</dt><dd>{submission.owner_name} ({submission.relationship})</dd></div><div><dt>Contact</dt><dd><a href={`mailto:${submission.owner_email}`}>{submission.owner_email}</a> · <a href={`tel:${submission.owner_phone}`}>{submission.owner_phone}</a></dd></div><div><dt>Details</dt><dd>{submission.bedrooms} beds · {submission.bathrooms} baths · {submission.size || 'Size not supplied'}</dd></div></dl><div className="review-actions"><button className="approve-button" type="button" disabled={reviewing === submission.id} onClick={() => approveSubmission(submission)}><CheckCircle2 size={17} />Approve and publish</button><button className="reject-button" type="button" disabled={reviewing === submission.id} onClick={() => rejectSubmission(submission)}><XCircle size={17} />Reject</button></div></article>)}</div> : <div className="admin-empty"><CheckCircle2 /><p>No property submissions are waiting for review.</p></div>}</section>}

    {activePanel === 'inquiries' && <section className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">Inbox</p><h2>Contact enquiries</h2></div><span className="submission-count"><Mail size={16} />{openInquiries.length} open</span></div>{openInquiries.length ? <div className="inquiry-list">{openInquiries.map((inquiry) => <article className="inquiry-card" key={inquiry.id}><div className="inquiry-heading"><div><span>{inquiry.inquiry_type}</span><h3>{inquiry.property_title || `Enquiry from ${inquiry.name}`}</h3></div><time dateTime={inquiry.created_at}>{new Date(inquiry.created_at).toLocaleString()}</time></div><p>{inquiry.message}</p><div className="inquiry-contact"><strong>{inquiry.name}</strong><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a><a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a></div><div className="review-actions"><a className="approve-button" href={`mailto:${inquiry.email}?subject=${encodeURIComponent(`Re: ${inquiry.property_title || inquiry.inquiry_type}`)}`}><Mail size={17} />Reply by email</a><button className="reject-button" type="button" disabled={reviewing === inquiry.id} onClick={() => resolveInquiry(inquiry)}><CheckCircle2 size={17} />Mark resolved</button></div></article>)}</div> : <div className="admin-empty"><CheckCircle2 /><p>No contact enquiries need attention.</p></div>}</section>}

    {activePanel === 'properties' && <section className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">Listings</p><h2>Properties</h2></div><button type="button" className="primary-button" onClick={addProperty}><Plus size={16} />Add property</button></div><p className="admin-panel-intro">Open a property to edit every detail, upload and arrange gallery images, or publish it without images—the site logo will be shown automatically.</p><div className="property-admin-list">{sortedProperties.map((property, index) => { const open = editingProperty === property.id; const preview = property.images?.[0] || `${import.meta.env.BASE_URL}real-metrics-logo-transparent.png`; return <article className={`property-admin-card${open ? ' open' : ''}`} key={property.id}><header><img className={property.images?.length ? '' : 'placeholder'} src={preview} alt="" /><div><span>{property.status} · {property.category}</span><h3>{property.title}</h3><p>{property.location} · {property.price}</p><small>{property.beds || 'Studio'} beds · {property.baths || 0} baths · {property.size || 'Size not specified'} · {property.images?.length || 0} images</small></div><div className="property-admin-actions"><button type="button" disabled={index === 0} onClick={() => moveProperty(property.id, -1)} aria-label="Move property up"><ArrowUp /></button><button type="button" disabled={index === sortedProperties.length - 1} onClick={() => moveProperty(property.id, 1)} aria-label="Move property down"><ArrowDown /></button><button type="button" className="edit" onClick={() => setEditingProperty(open ? '' : property.id)}><Pencil />{open ? 'Close' : 'Edit'}</button><button type="button" className="delete" onClick={() => { if (window.confirm(`Delete ${property.title}?`)) removeItem('properties', property.id); }} aria-label={`Delete ${property.title}`}><Trash2 /></button></div></header>{open && <div className="property-admin-editor"><div className="admin-image-manager"><div className="admin-image-grid">{property.images?.length ? property.images.map((image, imageIndex) => <figure key={image}><img src={image} alt={`${property.title} ${imageIndex + 1}`} /><figcaption><button type="button" disabled={imageIndex === 0} onClick={() => moveImage(property.id, imageIndex, -1)} aria-label="Move image left"><ArrowUp /></button><button type="button" disabled={imageIndex === property.images.length - 1} onClick={() => moveImage(property.id, imageIndex, 1)} aria-label="Move image right"><ArrowDown /></button><button type="button" onClick={() => removeImage(property.id, image)} aria-label="Remove image"><Trash2 /></button></figcaption></figure>) : <div className="admin-no-images"><img src={`${import.meta.env.BASE_URL}real-metrics-logo-transparent.png`} alt="" /><span>No property images yet. The logo will be used on the live site.</span></div>}</div><label className="image-upload-button"><Upload size={17} />{uploading === property.id ? 'Uploading…' : 'Upload images'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading === property.id} onChange={(event) => { uploadImages(property.id, event.target.files); event.target.value = ''; }} /></label><small>JPG, PNG, or WebP · up to 8 images · 8 MB each</small></div><div className="admin-grid"><label>Title<input value={property.title} onChange={(e) => updateCollection('properties', property.id, 'title', e.target.value)} /></label><label>Location<input value={property.location} onChange={(e) => updateCollection('properties', property.id, 'location', e.target.value)} /></label><label>Price<input value={property.price} onChange={(e) => updateCollection('properties', property.id, 'price', e.target.value)} /></label><label>Status<select value={property.status} onChange={(e) => updateCollection('properties', property.id, 'status', e.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>Category<input value={property.category} onChange={(e) => updateCollection('properties', property.id, 'category', e.target.value)} /></label><label>Bedrooms<input type="number" min="0" value={property.beds} onChange={(e) => updateCollection('properties', property.id, 'beds', Number(e.target.value))} /></label><label>Bathrooms<input type="number" min="0" value={property.baths} onChange={(e) => updateCollection('properties', property.id, 'baths', Number(e.target.value))} /></label><label>Size<input value={property.size} onChange={(e) => updateCollection('properties', property.id, 'size', e.target.value)} /></label><label className="check-row"><input type="checkbox" checked={property.featured} onChange={(e) => updateCollection('properties', property.id, 'featured', e.target.checked)} /> Featured on homepage</label><label className="wide">Full description<textarea rows="5" value={property.description} onChange={(e) => updateCollection('properties', property.id, 'description', e.target.value)} /></label></div></div>}</article>; })}</div></section>}

    {activePanel === 'services' && <section className="admin-panel"><div className="panel-heading"><h2>Services</h2><button type="button" className="primary-button" onClick={() => addItem('services', blankService())}><Plus size={16} />Add service</button></div><div className="cms-editor-list">{data.services.map((service) => <article className="property-editor" key={service.id}><div className="editor-heading"><strong>{service.title}</strong><button type="button" aria-label="Delete service" onClick={() => removeItem('services', service.id)}><Trash2 size={16} /></button></div><div className="admin-grid"><label>Title<input value={service.title} onChange={(e) => updateCollection('services', service.id, 'title', e.target.value)} /></label><label>Icon<select value={service.icon} onChange={(e) => updateCollection('services', service.id, 'icon', e.target.value)}><option value="megaphone">Megaphone</option><option value="layout">Building</option><option value="chart">Chart</option></select></label><label className="wide">Description<textarea value={service.description} onChange={(e) => updateCollection('services', service.id, 'description', e.target.value)} /></label></div></article>)}</div></section>}
    {message && <div className="toast">{message}</div>}
  </main>;
}
