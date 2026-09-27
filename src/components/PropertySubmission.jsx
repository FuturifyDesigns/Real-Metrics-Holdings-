import { ArrowLeft, ArrowRight, ImagePlus, Send, Trash2, UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { hasSupabase, supabase } from '../lib/supabase';
import { validatePhoneInput, phoneValidationMessage } from '../lib/validation';

const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const safeFileName = (name) => name
  .toLowerCase()
  .replace(/[^a-z0-9._-]+/g, '-')
  .replace(/^-+|-+$/g, '');

export function PropertySubmissionPage({ pageImage }) {
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const imagesRef = useRef(images);

  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => () => imagesRef.current.forEach(({ preview }) => URL.revokeObjectURL(preview)), []);

  const addImages = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    setMessage('');

    if (images.length + selected.length > MAX_IMAGES) {
      setMessage(`Choose no more than ${MAX_IMAGES} images in total.`);
      return;
    }
    const invalid = selected.find((file) => !ACCEPTED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES);
    if (invalid) {
      setMessage('Each image must be a JPG, PNG, or WebP file no larger than 8 MB.');
      return;
    }
    setImages((current) => [...current, ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  };

  const removeImage = (index) => setImages((current) => {
    URL.revokeObjectURL(current[index].preview);
    return current.filter((_, itemIndex) => itemIndex !== index);
  });

  const moveImage = (index, direction) => setImages((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!event.currentTarget.reportValidity()) return;
    if (!images.length) {
      setMessage('Please add at least one property image.');
      return;
    }
    if (!hasSupabase) {
      setMessage('Online property submissions are temporarily unavailable. Please contact us directly.');
      return;
    }

    setSubmitting(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const submissionId = crypto.randomUUID();
    const uploadedPaths = [];

    try {
      const ownerEmail = String(form.get('owner_email')).trim().toLowerCase();
      const ownerPhone = String(form.get('owner_phone')).trim();
      const { error: reservationError } = await supabase.rpc('reserve_property_submission', {
        p_id: submissionId,
        p_owner_email: ownerEmail,
        p_owner_phone: ownerPhone,
        p_honeypot: String(form.get('company_website') || ''),
      });
      if (reservationError) throw reservationError;

      for (const [index, item] of images.entries()) {
        const path = `${submissionId}/${String(index + 1).padStart(2, '0')}-${crypto.randomUUID()}-${safeFileName(item.file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from('property-submissions')
          .upload(path, item.file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
      }

      const payload = {
        id: submissionId,
        owner_name: String(form.get('owner_name')).trim(),
        owner_email: ownerEmail,
        owner_phone: ownerPhone,
        relationship: form.get('relationship'),
        listing_type: form.get('listing_type'),
        category: form.get('category'),
        title: String(form.get('title')).trim(),
        location: String(form.get('location')).trim(),
        price: String(form.get('price')).trim(),
        bedrooms: Number(form.get('bedrooms') || 0),
        bathrooms: Number(form.get('bathrooms') || 0),
        size: String(form.get('size')).trim(),
        description: String(form.get('description')).trim(),
        images: uploadedPaths,
        consent: form.get('consent') === 'on',
        status: 'pending',
      };
      const { error } = await supabase.rpc('submit_property_for_review', {
        p_id: payload.id,
        p_owner_name: payload.owner_name,
        p_owner_email: payload.owner_email,
        p_owner_phone: payload.owner_phone,
        p_relationship: payload.relationship,
        p_listing_type: payload.listing_type,
        p_category: payload.category,
        p_title: payload.title,
        p_location: payload.location,
        p_price: payload.price,
        p_bedrooms: payload.bedrooms,
        p_bathrooms: payload.bathrooms,
        p_size: payload.size,
        p_description: payload.description,
        p_images: payload.images,
        p_consent: payload.consent,
        p_honeypot: String(form.get('company_website') || ''),
      });
      if (error) throw error;

      images.forEach(({ preview }) => URL.revokeObjectURL(preview));
      setImages([]);
      formElement.reset();
      setMessage('Thank you. Your property has been sent to the Real Metrics team for review.');
    } catch (error) {
      setMessage(error.message || 'We could not submit your property. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return <main>
    <section className="page-intro"><img src={pageImage} alt="Contemporary home prepared for a property listing" /><div className="page-intro-shade" /><div className="page-intro-copy"><p className="eyebrow light">List your property</p><h1>Share it with the market.</h1><p>Send us the complete property brief and image set. Every submission is reviewed before it appears on the website.</p></div></section>
    <section className="submission-section section">
      <div className="submission-intro reveal"><p className="eyebrow">Property submission</p><h2>Tell us everything buyers or tenants should know.</h2><p>Fields marked with an asterisk are required. Add clear, recent images and arrange them in the order you would like them reviewed.</p><div className="submission-note"><strong>What happens next?</strong><span>Our administrator checks the details and images, contacts you if anything is missing, and approves suitable listings for publication.</span></div></div>
      <form className="listing-form reveal" onSubmit={submit}><label className="honeypot" aria-hidden="true">Company website<input name="company_website" tabIndex="-1" autoComplete="off" /></label>
        <fieldset><legend>Your details</legend><div className="form-grid">
          <label>Full name *<input name="owner_name" autoComplete="name" minLength="2" maxLength="80" required /></label>
          <label>Email address *<input name="owner_email" type="email" autoComplete="email" maxLength="120" required /></label>
          <label>Phone number *<input name="owner_phone" type="tel" autoComplete="tel" inputMode="tel" minLength="7" maxLength="20" title={phoneValidationMessage} onInput={validatePhoneInput} required /></label>
          <label>Your relationship to the property *<select name="relationship" required defaultValue=""><option value="" disabled>Select one</option><option>Owner</option><option>Landlord</option><option>Agent</option><option>Developer</option><option>Authorised representative</option></select></label>
        </div></fieldset>
        <fieldset><legend>Property details</legend><div className="form-grid">
          <label>Listing type *<select name="listing_type" required defaultValue=""><option value="" disabled>Select one</option><option value="For Sale">For sale</option><option value="For Rent">For rent</option><option value="Available">Available / other</option></select></label>
          <label>Property category *<select name="category" required defaultValue=""><option value="" disabled>Select one</option><option>Residential</option><option>Apartment</option><option>Commercial</option><option>Land</option><option>Development</option><option>Other</option></select></label>
          <label className="wide">Suggested listing title *<input name="title" minLength="5" maxLength="120" placeholder="e.g. Four-bedroom family home in Phakalane" required /></label>
          <label>Location *<input name="location" minLength="2" maxLength="120" placeholder="Area, town or city" required /></label>
          <label>Price *<input name="price" minLength="2" maxLength="80" placeholder="e.g. BWP 18,000 / month" required /></label>
          <label>Bedrooms<input name="bedrooms" type="number" inputMode="numeric" min="0" max="50" defaultValue="0" /></label>
          <label>Bathrooms<input name="bathrooms" type="number" inputMode="numeric" min="0" max="50" defaultValue="0" /></label>
          <label className="wide">Property size<input name="size" maxLength="60" placeholder="e.g. 320 sqm or 2.4 hectares" /></label>
          <label className="wide">Description *<textarea name="description" rows="7" minLength="40" maxLength="2000" placeholder="Describe the condition, key features, access, parking, security, amenities and availability." required /></label>
        </div></fieldset>
        <fieldset><legend>Property images *</legend><p className="field-help">Upload 1–8 JPG, PNG, or WebP images. Maximum 8 MB each. Use the arrows to arrange them; the first image will be the cover.</p><label className="upload-zone"><UploadCloud /><strong>Choose property images</strong><span>Clear landscape images work best</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addImages} /></label>{images.length > 0 && <div className="image-edit-grid">{images.map((item, index) => <article key={item.preview} className="image-edit-card"><img src={item.preview} alt={`Selected property image ${index + 1}`} /><span>{index === 0 ? 'Cover image' : `Image ${index + 1}`}</span><div><button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label={`Move image ${index + 1} left`}><ArrowLeft /></button><button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} aria-label={`Move image ${index + 1} right`}><ArrowRight /></button><button type="button" onClick={() => removeImage(index)} aria-label={`Remove image ${index + 1}`}><Trash2 /></button></div></article>)}</div>}</fieldset>
        <label className="consent-row"><input name="consent" type="checkbox" required /><span>I am at least 18, am authorised to submit this property, confirm the details and images are accurate, and accept the <a href={`${import.meta.env.BASE_URL}terms`} target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href={`${import.meta.env.BASE_URL}privacy`} target="_blank" rel="noopener noreferrer">Privacy Notice</a>. *</span></label>
        <button className="primary-button" type="submit" disabled={submitting}><ImagePlus size={17} />{submitting ? 'Uploading and submitting…' : 'Submit property for review'}<Send size={16} /></button>
        {message && <p className={`submission-message ${message.startsWith('Thank') ? 'success' : ''}`} role="status" aria-live="polite">{message}</p>}
      </form>
    </section>
  </main>;
}
