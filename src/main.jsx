import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight, Bath, BedDouble, Building2, ChartNoAxesCombined, Check, ChevronLeft, ChevronRight,
  ImagePlus, Mail, MapPin, Megaphone, Menu, Phone, Ruler, Send, ShieldCheck, X,
} from 'lucide-react';
import { Admin } from './components/Admin';
import { PropertyCard } from './components/PropertyCard';
import { PropertySubmissionPage } from './components/PropertySubmission';
import { loadCmsData, saveCmsData } from './lib/store';
import { hasSupabase, supabase } from './lib/supabase';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const publicAsset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
const routes = ['/', '/properties', '/services', '/about', '/contact', '/list-property', '/privacy', '/terms', '/admin'];

function currentPath() {
  const pathname = window.location.pathname;
  const stripped = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  const normalized = `/${stripped.replace(/^\/+|\/+$/g, '')}`;
  return normalized === '/' || routes.includes(normalized) || normalized.startsWith('/properties/') ? normalized : '/';
}

function Link({ to, onNavigate, children, className = '', ...props }) {
  const href = `${basePath}${to === '/' ? '/' : to}`;
  return <a {...props} className={className} href={href} onClick={(event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState({}, '', href);
    onNavigate(to.split('?')[0]);
  }}>{children}</a>;
}

const heroSlides = [
  { image: 'https://images.unsplash.com/photo-1628012209120-d9db7abf7eab?auto=format&fit=crop&w=1920&q=78', title: 'Homes presented with purpose.', copy: 'Thoughtful property advertising for sellers, landlords, agents, and developers across Botswana.' },
  { image: 'https://images.unsplash.com/photo-1698994705178-d244d73ea573?auto=format&fit=crop&w=1920&q=78', title: 'Every detail earns attention.', copy: 'Strong photography, clear information, and a polished presentation that lets each property speak for itself.' },
  { image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=78', title: 'Property marketing made clear.', copy: 'Professional campaigns for commercial spaces, residential homes, developments, and rental opportunities.' },
  { image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1920&q=78', title: 'Designed to make an entrance.', copy: 'Editorial presentation that gives exceptional homes the space, detail, and credibility they deserve.' },
  { image: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1920&q=78', title: 'Commercial space, clearly positioned.', copy: 'Confident campaigns that help businesses and investors see the opportunity at a glance.' },
];

const pageImages = {
  properties: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2000&q=88',
  services: 'https://images.unsplash.com/photo-1719887805632-de5be825f72b?auto=format&fit=crop&w=1920&q=78',
  about: 'https://images.unsplash.com/photo-1660361339436-ddd4b85372da?auto=format&fit=crop&w=1920&q=78',
  contact: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1920&q=78',
  submission: 'https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=2000&q=88',
};

const editorialSlides = [
  { image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=88', label: 'Light-filled living spaces' },
  { image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1800&q=88', label: 'Refined residential interiors' },
  { image: 'https://images.unsplash.com/photo-1558661091-5cc1b64d0dc5?auto=format&fit=crop&w=1600&q=78', label: 'Considered architectural details' },
  { image: 'https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?auto=format&fit=crop&w=1800&q=88', label: 'Modern homes ready for market' },
];

const serviceDetails = [
  { image: publicAsset('images/service-listing-campaign.jpg'), kicker: 'Campaign strategy', features: ['Listing brief and audience positioning', 'Clear property copy and key selling points', 'Sale, rental, tenancy, and development campaigns'] },
  { image: publicAsset('images/service-showcase-pages.jpg'), kicker: 'Visual presentation', features: ['Image selection and gallery sequencing', 'Mobile-ready property showcase pages', 'Consistent status, pricing, and feature information'] },
  { image: publicAsset('images/service-market-presentation.jpg'), kicker: 'Market readiness', features: ['Human review before publication', 'Qualified enquiry capture and follow-up', 'Content updates as property status changes'] },
];

const aboutSlides = [
  { image: publicAsset('images/about-established-home.jpg'), alt: 'Established modern home in a landscaped setting' },
  { image: publicAsset('images/about-courtyard-home.jpg'), alt: 'Contemporary courtyard residence with a pool' },
  { image: publicAsset('images/about-home-interior.jpg'), alt: 'Bright contemporary kitchen and living space' },
];

function SilentImageSlider({ images, label }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (images.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % images.length), 5000);
    return () => window.clearInterval(timer);
  }, [images.length]);
  return <div className="silent-image-slider reveal" role="region" aria-label={label} aria-roledescription="carousel">{images.map((slide, index) => <img className={index === active ? 'active' : ''} src={slide.image} alt={index === active ? slide.alt : ''} aria-hidden={index !== active} loading="lazy" decoding="async" key={slide.image} />)}</div>;
}

function EditorialSlider() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % editorialSlides.length), 5200);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="editorial-image editorial-slider reveal">{editorialSlides.map((slide, index) => <figure className={index === active ? 'active' : ''} key={slide.image}><img src={slide.image} alt={slide.label} loading="lazy" decoding="async" /><figcaption>{slide.label}</figcaption></figure>)}<div className="editorial-slide-markers" aria-label="Editorial slideshow">{editorialSlides.map((slide, index) => <button type="button" className={index === active ? 'active' : ''} onClick={() => setActive(index)} aria-label={`Show ${slide.label}`} key={slide.image} />)}</div></div>;
}

function HeroSlider({ navigate, settings }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % heroSlides.length), 6500);
    return () => window.clearInterval(timer);
  }, []);
  const slides = heroSlides.map((slide, index) => index === 0 ? { ...slide, title: settings.hero_title, copy: settings.hero_subtitle } : slide);
  return (
    <section className="hero" aria-roledescription="carousel">
      {slides.map((slide, index) => <div className={`hero-slide ${index === active ? 'active' : ''}`} key={slide.image} aria-hidden={index !== active}><img src={slide.image} alt="" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'low'} decoding="async" /></div>)}
      <div className="hero-shade" />
      <div className="hero-copy" key={active}>
        <h1>{slides[active].title}</h1>
        <p>{slides[active].copy}</p>
        <div className="hero-actions">
          <Link className="primary-button" to="/properties" onNavigate={navigate}>View properties <ArrowRight size={18} /></Link>
          <Link className="ghost-button" to="/list-property" onNavigate={navigate}>List a property</Link>
        </div>
      </div>
    </section>
  );
}

function PageIntro({ eyebrow, title, copy, image }) {
  return <section className="page-intro"><img src={image} alt="" loading="eager" fetchPriority="high" decoding="async" /><div className="page-intro-shade" /><div className="page-intro-copy"><p className="eyebrow light">{eyebrow}</p><h1>{title}</h1><p>{copy}</p></div></section>;
}

function HomePage({ data, navigate }) {
  const featured = data.properties.filter((property) => property.featured).slice(0, 3);
  const properties = featured.length ? featured : data.properties.slice(0, 3);
  return <main>
    <HeroSlider navigate={navigate} settings={data.settings} />
    <section className="section home-listings">
      <div className="section-heading reveal"><p className="eyebrow">Selected properties</p><h2>Worth a closer look.</h2><p>Browse current homes, rentals, and commercial opportunities presented by Real Metrics Holdings.</p></div>
      <div className="property-grid home-grid">{properties.map((property) => <PropertyCard key={property.id} property={property} detailHref={`${basePath}/properties/${property.id}`} contactHref={`${basePath}/contact?property=${encodeURIComponent(property.id)}`} onNavigate={navigate} />)}</div>
      <div className="section-action reveal"><Link className="text-link" to="/properties" onNavigate={navigate}>See all properties <ArrowRight size={17} /></Link></div>
    </section>
    <section className="editorial-split">
      <EditorialSlider />
      <div className="editorial-copy reveal"><p className="eyebrow">A better first impression</p><h2>Good property deserves good presentation.</h2><p>We bring together considered copy, carefully selected images, and clear listing information so buyers and tenants can understand the opportunity quickly.</p><Link className="text-link" to="/services" onNavigate={navigate}>How we help <ArrowRight size={17} /></Link></div>
    </section>
    <section className="cta-band reveal"><div><p className="eyebrow light">Have a property to market?</p><h2>Let us present it properly.</h2></div><Link className="light-button" to="/list-property" onNavigate={navigate}>Submit your property <ArrowRight size={18} /></Link></section>
  </main>;
}

function PropertiesPage({ properties, navigate }) {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'For Sale', 'For Rent', 'Available', 'Sold', 'Rented', 'Tenanted'];
  const visible = filter === 'All' ? properties : properties.filter((property) => property.status === filter);
  return <main>
    <PageIntro eyebrow="Properties" title="Find the right place." copy="Explore properties for sale and rent, along with recently completed campaigns." image={pageImages.properties} />
    <section className="section"><div className="filter-bar" aria-label="Filter properties by status">{filters.map((item) => <button className={filter === item ? 'active' : ''} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>{visible.length ? <div className="property-grid">{visible.map((property) => <PropertyCard key={property.id} property={property} detailHref={`${basePath}/properties/${property.id}`} contactHref={`${basePath}/contact?property=${encodeURIComponent(property.id)}`} onNavigate={navigate} />)}</div> : <p className="empty-state">No properties match this status yet.</p>}</section>
  </main>;
}

function PropertyDetailsPage({ property, navigate }) {
  const [activeImage, setActiveImage] = useState(0);
  const images = property.images?.length ? property.images : ['https://images.unsplash.com/photo-1691425700585-c108acad6467?auto=format&fit=crop&w=1600&q=78'];
  const showPrevious = () => setActiveImage((current) => (current - 1 + images.length) % images.length);
  const showNext = () => setActiveImage((current) => (current + 1) % images.length);
  useEffect(() => { setActiveImage(0); }, [property.id]);
  useEffect(() => {
    if (images.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setActiveImage((current) => (current + 1) % images.length), 5200);
    return () => window.clearInterval(timer);
  }, [images.length]);
  return <main className="property-details-page">
    <section className="property-gallery">
      <div className="property-gallery-main">{images.map((image, index) => <img className={index === activeImage ? 'active' : ''} src={image} alt={index === activeImage ? `${property.title} view ${activeImage + 1}` : ''} aria-hidden={index !== activeImage} loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'low'} decoding="async" key={image} />)}<div className="gallery-caption"><span>{property.category}</span><strong>{property.title}</strong></div>{images.length > 1 && <div className="property-gallery-controls"><button type="button" onClick={showPrevious} aria-label="Previous property image"><ChevronLeft /></button><span>{activeImage + 1} / {images.length}</span><button type="button" onClick={showNext} aria-label="Next property image"><ChevronRight /></button></div>}</div>
      {images.length > 1 && <div className="property-thumbnails" aria-label="Property image gallery">{images.map((image, index) => <button type="button" className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)} key={image}><img src={image} alt={`Show ${property.title} image ${index + 1}`} loading="lazy" decoding="async" /></button>)}</div>}
    </section>
    <section className="property-details section"><div className="property-details-copy"><Link className="back-link" to="/properties" onNavigate={navigate}>← Back to properties</Link><p className="eyebrow">{property.category}</p><h1>{property.title}</h1><p className="property-detail-location"><MapPin />{property.location}</p><p className="property-detail-description">{property.description}</p><div className="property-detail-meta"><span><BedDouble /> <strong>{property.beds || 'Studio'}</strong> Bedrooms</span><span><Bath /> <strong>{property.baths}</strong> Bathrooms</span><span><Ruler /> <strong>{property.size || 'Not specified'}</strong> Size</span></div><div className="property-detail-note"><h2>Property overview</h2><p>This listing is currently marked <strong>{property.status.toLowerCase()}</strong>. Review the complete gallery above, then enquire to confirm availability, arrange a viewing, or request any additional information from the Real Metrics team.</p></div></div><aside className="property-enquiry-card"><img src={images[0]} alt={`${property.title} enquiry preview`} loading="lazy" decoding="async" /><span className={`status status-${String(property.status).toLowerCase().replaceAll(' ', '-')}`}>{property.status}</span><p>Asking price</p><strong>{property.price}</strong><p>Interested in this property? Its image and full listing details will be attached to your enquiry.</p><Link className="primary-button" to={`/contact?property=${encodeURIComponent(property.id)}`} onNavigate={navigate}>Enquire about this property <ArrowRight /></Link></aside></section>
  </main>;
}

const serviceIcon = (icon) => icon === 'layout' ? <Building2 /> : icon === 'chart' ? <ChartNoAxesCombined /> : <Megaphone />;

function ServicesPage({ services, navigate }) {
  return <main>
    <PageIntro eyebrow="Our services" title="Property marketing, handled with care." copy="From first brief to published campaign, we make each listing clear, attractive, and easy to act on." image={pageImages.services} />
    <section className="services-intro section"><div><p className="eyebrow">Complete listing support</p><h2>Every stage of the property story, brought together.</h2></div><p>We combine practical property information, considered visual direction, and a clear route to enquiry. Owners, landlords, agents, and developers get one organised workflow from submission to publication.</p></section>
    <section className="service-showcases">{services.map((service, index) => { const detail = serviceDetails[index % serviceDetails.length]; return <article className="service-showcase reveal" key={service.id}><div className="service-showcase-image"><img src={detail.image} alt={`${service.title} service`} loading="lazy" decoding="async" /><span>0{index + 1}</span></div><div className="service-showcase-copy"><div className="service-icon">{serviceIcon(service.icon)}</div><p className="eyebrow">{detail.kicker}</p><h2>{service.title}</h2><p>{service.description}</p><ul>{detail.features.map((feature) => <li key={feature}><Check size={17} />{feature}</li>)}</ul></div></article>; })}</section>
    <section className="process-band"><div className="section-heading reveal"><p className="eyebrow light">Our approach</p><h2>Simple from brief to enquiry.</h2></div><div className="process-grid"><div className="reveal"><strong>01</strong><h3>Share the property</h3><p>Send the details, images, location, price, and availability.</p></div><div className="reveal"><strong>02</strong><h3>We shape the advert</h3><p>We organise the story and present the property with clarity.</p></div><div className="reveal"><strong>03</strong><h3>Reach the market</h3><p>Your campaign goes live with direct paths for serious enquiries.</p></div></div></section>
    <section className="service-assurance section"><div className="section-heading reveal"><p className="eyebrow">Built for confidence</p><h2>Clear information. Human review. Better enquiries.</h2></div><div className="assurance-grid"><article><ShieldCheck /><h3>Reviewed before publishing</h3><p>Every owner-submitted listing enters a private approval queue before it can appear publicly.</p></article><article><ImagePlus /><h3>Gallery-first presentation</h3><p>Images are arranged into responsive slideshows so visitors can explore every property properly.</p></article><article><Mail /><h3>Enquiries stay connected</h3><p>Property context and visitor contact details reach the admin inbox together for useful follow-up.</p></article></div></section>
    <section className="cta-band reveal"><div><p className="eyebrow light">Ready to begin?</p><h2>Bring us your next listing.</h2></div><Link className="light-button" to="/list-property" onNavigate={navigate}>List your property <ArrowRight size={18} /></Link></section>
  </main>;
}

function AboutPage({ settings, navigate }) {
  return <main>
    <PageIntro eyebrow="About us" title={settings.about_title} copy="Real Metrics Holdings helps property owners and professionals show the market what makes a place worth considering." image={pageImages.about} />
    <section className="about-page section"><div className="about-statement reveal"><p className="eyebrow">Real Metrics Holdings</p><h2>Local understanding. A sharper standard.</h2></div><div className="about-body reveal"><p>{settings.about_body}</p><p>Our work is grounded in honest information, strong visual judgement, and a smooth experience for both advertisers and property seekers.</p><Link className="text-link" to="/services" onNavigate={navigate}>Explore our approach <ArrowRight size={17} /></Link></div></section>
    <section className="page-slider-section"><SilentImageSlider images={aboutSlides} label="Residential property slideshow" /></section>
    <section className="about-principles section"><div><span>Botswana focused</span><p>Built around the local property market, its owners, professionals, buyers, and tenants.</p></div><div><span>Human reviewed</span><p>Every submitted listing is checked before publication to protect quality and trust.</p></div><div><span>Detail led</span><p>Strong images and accurate information work together to help people decide with confidence.</p></div></section>
    <section className="values-band"><article className="reveal"><ShieldCheck /><h3>Clear information</h3><p>Every campaign makes price, status, location, and key property details easy to understand.</p></article><article className="reveal"><Check /><h3>Considered presentation</h3><p>Photography and copy work together without overstatement or unnecessary noise.</p></article><article className="reveal"><MapPin /><h3>Botswana focused</h3><p>Our platform is shaped around the local property market and the people moving through it.</p></article></section>
    <section className="cta-band reveal"><div><p className="eyebrow light">A property worth presenting?</p><h2>Give it a clearer place in the market.</h2></div><Link className="light-button" to="/list-property" onNavigate={navigate}>Submit a property <ArrowRight size={18} /></Link></section>
  </main>;
}

function ContactPage({ settings, property }) {
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const propertySummary = property ? `${property.title} — ${property.location} — ${property.price}\nStatus: ${property.status}\nCategory: ${property.category}\nBedrooms: ${property.beds || 'Studio'}\nBathrooms: ${property.baths}\nSize: ${property.size || 'Not specified'}\n\n${property.description}` : '';
  const propertyImage = property?.images?.[0];
  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true); setFormMessage('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const inquiry = {
      name: String(form.get('name')).trim(),
      email: String(form.get('email')).trim().toLowerCase(),
      phone: String(form.get('phone')).trim(),
      inquiry_type: String(form.get('inquiry_type')),
      property_id: property && /^[0-9a-f-]{36}$/i.test(property.id) ? property.id : null,
      property_title: property?.title || '',
      message: String(form.get('message')).trim(),
      privacy_consent: form.get('privacy_consent') === 'on',
      status: 'new',
    };
    try {
      if (!hasSupabase) throw new Error('Online enquiries are temporarily unavailable. Please email us directly.');
      const { error } = await supabase.rpc('submit_contact_inquiry', {
        p_name: inquiry.name,
        p_email: inquiry.email,
        p_phone: inquiry.phone,
        p_inquiry_type: inquiry.inquiry_type,
        p_property_id: inquiry.property_id,
        p_property_title: inquiry.property_title,
        p_message: inquiry.message,
        p_privacy_consent: inquiry.privacy_consent,
        p_honeypot: String(form.get('company_website') || ''),
      });
      if (error) throw error;
      setFormMessage('Your enquiry has been saved. Your email application is opening with the details ready to send.');
      const subject = encodeURIComponent(`${inquiry.inquiry_type}${property ? `: ${property.title}` : ''} from ${inquiry.name}`);
      const body = encodeURIComponent(`Name: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone}\nInquiry: ${inquiry.inquiry_type}${propertySummary ? `\n\nProperty details:\n${propertySummary}${propertyImage ? `\nProperty image: ${propertyImage}` : ''}` : ''}\n\nMessage:\n${inquiry.message}`);
      window.location.href = `mailto:${settings.email}?subject=${subject}&body=${body}`;
      formElement.reset();
    } catch (error) {
      setFormMessage(error.message || 'We could not save your enquiry. Please try again.');
    } finally { setSubmitting(false); }
  };
  return <main>
    <PageIntro eyebrow="Contact" title="Let's talk property." copy={settings.contact_intro} image={pageImages.contact} />
    <section className="contact-page section"><div className="contact-details reveal"><p className="eyebrow">Get in touch</p><h2>{property ? `Enquire about ${property.title}` : 'How can we help?'}</h2>{property && <div className="enquiry-property-preview">{propertyImage && <img src={propertyImage} alt={property.title} loading="lazy" decoding="async" />}<div><span>{property.status}</span><strong>{property.title}</strong><small><MapPin size={14} />{property.location}</small><b>{property.price}</b></div></div>}<p>{property ? 'The property image and details have been added to your enquiry. Enter your contact information and a personal message so our team can respond.' : 'For property submissions, use our dedicated listing form. For general enquiries, partnerships, or support, send us a message here.'}</p><a href={`mailto:${settings.email}`}><Mail /><span><small>Email</small>{settings.email}</span></a><a href={`tel:${settings.phone.replaceAll(' ', '')}`}><Phone /><span><small>Phone</small>{settings.phone}</span></a><div className="contact-location"><MapPin /><span><small>Location</small>{settings.address}</span></div></div><form className="contact-form reveal" onSubmit={submit}><label className="honeypot" aria-hidden="true">Company website<input name="company_website" tabIndex="-1" autoComplete="off" /></label>{property && <label className="wide">Selected property details<textarea className="readonly-details" value={propertySummary} rows="7" readOnly /></label>}<label>Your name *<input name="name" autoComplete="name" minLength="2" maxLength="80" required /></label><label>Email address *<input name="email" type="email" autoComplete="email" maxLength="120" required /></label><label>Phone number *<input name="phone" type="tel" autoComplete="tel" inputMode="tel" pattern="[+0-9][0-9 ()-]{6,19}" title="Enter a valid phone number using digits, spaces, brackets, + or -." required /></label><label>Inquiry type *<select name="inquiry_type" defaultValue={property ? 'Property enquiry' : ''} required><option value="" disabled>Select one</option><option>Property enquiry</option><option>General enquiry</option><option>Property search</option><option>Partnership</option><option>Website support</option></select></label><label className="wide">How can we help? *<textarea name="message" rows="7" minLength="20" maxLength="1500" defaultValue={property ? `I am interested in ${property.title} in ${property.location}. Please contact me with more information and the next steps.` : ''} required /></label><label className="consent-row wide"><input name="privacy_consent" type="checkbox" required /><span>I agree to the processing of my information as explained in the <a href={`${basePath}/privacy`} target="_blank" rel="noopener noreferrer">Privacy Notice</a> and accept the <a href={`${basePath}/terms`} target="_blank" rel="noopener noreferrer">Terms of Service</a>. *</span></label><button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Saving enquiry…' : 'Send enquiry'} <Send size={17} /></button>{formMessage && <p className="contact-form-message wide" role="status">{formMessage}</p>}</form></section>
  </main>;
}

function PrivacyPage({ settings }) {
  return <main className="legal-page"><PageIntro eyebrow="Privacy" title="Your information, handled with care." copy="This notice explains what personal data Real Metrics Holdings collects, why we use it, and the choices available to you." image="https://images.unsplash.com/photo-1706808849802-8f876ade0d1f?auto=format&fit=crop&w=1920&q=78" /><article className="legal-content section"><div className="legal-summary"><p><strong>Last updated:</strong> 27 September 2026</p><p>Real Metrics Holdings is the data controller for information collected through this website. This notice is designed around Botswana’s Data Protection Act 2024, which commenced on 14 January 2025.</p><a href={`mailto:${settings.email}`}>{settings.email}</a></div><div className="legal-sections">
    <section><h2>1. Information we collect</h2><p>When you contact us or enquire about a property, we collect your name, email address, telephone number, enquiry type, message, and the property you selected. When you submit a property, we also collect your relationship to the property, listing information, images, and your confirmation that you are authorised to submit them. Our hosting and security providers may process basic technical information such as IP address, browser type, timestamps, and security logs.</p></section>
    <section><h2>2. Why we use it</h2><p>We use personal data to respond to enquiries, review and publish authorised listings, operate the admin workflow, prevent spam and abuse, maintain security, update property status, and meet legal obligations. We do not sell personal data or use it for unrelated automated profiling.</p></section>
    <section><h2>3. Legal bases</h2><p>Depending on the interaction, processing is based on your consent, steps requested before entering an agreement, performance of an agreement, compliance with legal obligations, or our legitimate interests in operating a secure property advertising service. You may withdraw consent for future processing, although lawful processing already completed remains unaffected.</p></section>
    <section><h2>4. Sharing and international processing</h2><p>We share only what is necessary with service providers that host the website, database, storage, email workflow, and security infrastructure. Some providers may process data outside Botswana. Where international processing occurs, we assess the provider and use appropriate contractual, organisational, and technical safeguards as required by applicable law. Publicly approved property listings and their images are intentionally made visible to website visitors; owner contact details are not published.</p></section>
    <section><h2>5. Retention</h2><p>Contact enquiries are generally retained for up to 24 months after the last interaction. Rejected or withdrawn property submissions are normally removed within 90 days after review; approved submission records are retained only as long as reasonably needed to administer the listing and resolve disputes. Security logs may be retained for shorter or longer periods where required to investigate abuse or comply with law. We may retain limited records where a legal claim or statutory duty requires it.</p></section>
    <section><h2>6. Your rights</h2><p>Subject to the Act and lawful exceptions, you may request information about our processing, access your personal data, correct inaccurate data, request erasure or restriction, receive portable data, object to certain processing, and withdraw consent. You may also lodge a complaint with Botswana’s Information and Data Protection Commission.</p></section>
    <section><h2>7. Security and breaches</h2><p>We use access controls, row-level database security, private review storage, administrator authentication, validation, rate controls, data minimisation, and encrypted HTTPS connections. No system can guarantee absolute security. If a qualifying personal-data breach occurs, we will assess it and notify the competent authority and affected people where the Act requires.</p></section>
    <section><h2>8. Children and sensitive data</h2><p>This property service is not directed to children, and users must be at least 18 years old to submit a property. Do not send identity documents, financial account information, health information, or other sensitive personal data through ordinary website forms unless we specifically request it through an appropriate secure process.</p></section>
    <section><h2>9. Contact and requests</h2><p>To exercise a privacy right, withdraw consent, or ask a question, email <a href={`mailto:${settings.email}`}>{settings.email}</a> or use the contact details displayed on this website. We may need to verify your identity before acting on a request.</p></section>
  </div></article></main>;
}

function TermsPage({ settings }) {
  return <main className="legal-page"><PageIntro eyebrow="Terms of service" title="Clear terms for using this website." copy="These terms apply when you browse listings, send an enquiry, or submit a property to Real Metrics Holdings." image="https://images.unsplash.com/photo-1706808849780-7a04fbac83ef?auto=format&fit=crop&w=1920&q=78" /><article className="legal-content section"><div className="legal-summary"><p><strong>Last updated:</strong> 27 September 2026</p><p>By using this website, you agree to these terms. If you do not agree, please do not submit information or use the listing services.</p><a href={`mailto:${settings.email}`}>{settings.email}</a></div><div className="legal-sections">
    <section><h2>1. The service</h2><p>Real Metrics Holdings provides property advertising, presentation, and enquiry-routing services. We are not, merely by displaying a listing, the owner, seller, landlord, estate agent, valuer, lender, conveyancer, or legal adviser for that property unless a separate written agreement expressly says otherwise.</p></section>
    <section><h2>2. Listing information</h2><p>Property information may be supplied by owners, landlords, agents, developers, or authorised representatives. We review submissions for presentation and apparent completeness, but users must independently verify ownership, availability, measurements, condition, pricing, permissions, and all material facts before relying on a listing or entering a transaction.</p></section>
    <section><h2>3. Your submissions</h2><p>You confirm that submitted information is accurate, current, lawful, and not misleading; that you are at least 18; and that you have authority to provide the property details and images. You grant us a non-exclusive, royalty-free licence to host, format, reproduce, and display approved submission content for advertising the property. You retain ownership of your content.</p></section>
    <section><h2>4. Review and removal</h2><p>We may edit presentation, request supporting information, reject a submission, change its status, suspend it, or remove it where information is incomplete, unlawful, misleading, insecure, outdated, disputed, or inconsistent with our service. Approval is not guaranteed.</p></section>
    <section><h2>5. Acceptable use</h2><p>You must not upload malware, unlawful material, personal information about another person without authority, discriminatory content, copied images without permission, false listings, automated spam, or content that infringes intellectual-property or privacy rights. Do not attempt to bypass access controls, rate limits, validation, or administrator authentication.</p></section>
    <section><h2>6. Enquiries and transactions</h2><p>Enquiries are sent to our administrative inbox and may also open your email application with a prepared message. You are responsible for confirming that an email was actually sent. Any property viewing, negotiation, payment, due diligence, or transaction is undertaken between the relevant parties and should use qualified professional advice where appropriate.</p></section>
    <section><h2>7. Availability and third-party services</h2><p>We aim to keep the website accurate and available but do not promise uninterrupted service. Hosting, database, storage, mapping, image, and email services may be operated by third parties under their own terms. Links to other websites do not imply endorsement.</p></section>
    <section><h2>8. Liability</h2><p>To the extent permitted by Botswana law, we are not liable for indirect or consequential loss, missed opportunities, inaccurate third-party listing information, or decisions made without independent verification. Nothing in these terms excludes liability that cannot lawfully be excluded.</p></section>
    <section><h2>9. Privacy, changes, and governing law</h2><p>Our Privacy Notice forms part of these terms. We may update these pages when the service or law changes, with the revised date shown above. These terms are governed by the laws of Botswana, and disputes are subject to the jurisdiction of Botswana’s courts unless applicable law requires otherwise.</p></section>
    <section><h2>10. Contact</h2><p>Questions about these terms may be sent to <a href={`mailto:${settings.email}`}>{settings.email}</a>.</p></section>
  </div></article></main>;
}

function Header({ path, navigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [['/', 'Home'], ['/properties', 'Properties'], ['/services', 'Services'], ['/about', 'About'], ['/contact', 'Contact']];
  return <header className="site-header"><Link className="brand" to="/" onNavigate={navigate} aria-label="Real Metrics Holdings home"><img src={publicAsset('real-metrics-logo-transparent.png')} alt="Real Metrics Holdings" /></Link><nav className={`nav ${menuOpen ? 'open' : ''}`} aria-label="Primary navigation">{links.map(([to, label]) => <Link key={to} className={path === to ? 'active' : ''} to={to} onNavigate={(next) => { setMenuOpen(false); navigate(next); }}>{label}</Link>)}</nav><Link className="header-cta" to="/list-property" onNavigate={navigate}>List your property <ArrowRight size={16} /></Link><button className="menu-button" type="button" onClick={() => setMenuOpen((current) => !current)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button></header>;
}

function Footer({ settings, navigate }) {
  return <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><img src={publicAsset('real-metrics-logo-transparent.png')} alt="Real Metrics Holdings" loading="lazy" decoding="async" /><p>Professional property advertising and listing presentation across Botswana.</p></div><div className="footer-links"><h3>Company</h3><Link to="/about" onNavigate={navigate}>About</Link><Link to="/services" onNavigate={navigate}>Services</Link><Link to="/properties" onNavigate={navigate}>Properties</Link><Link to="/list-property" onNavigate={navigate}>List a property</Link></div><div className="footer-links"><h3>Legal</h3><Link to="/privacy" onNavigate={navigate}>Privacy notice</Link><Link to="/terms" onNavigate={navigate}>Terms of service</Link></div><div className="footer-links"><h3>Contact</h3><a href={`mailto:${settings.email}`}>{settings.email}</a><a href={`tel:${settings.phone.replaceAll(' ', '')}`}>{settings.phone}</a><span>{settings.address}</span></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Real Metrics Holdings</span><a href="https://futurifydesigns.com" target="_blank" rel="noopener noreferrer">Built by Futurify Designs</a></div></footer>;
}

function App() {
  const [data, setData] = useState(null);
  const [path, setPath] = useState(currentPath());
  useEffect(() => { loadCmsData().then(setData); }, []);
  useEffect(() => { const sync = () => setPath(currentPath()); window.addEventListener('popstate', sync); return () => window.removeEventListener('popstate', sync); }, []);
  useEffect(() => {
    if (!data || path === '/admin') return undefined;
    window.scrollTo({ top: 0, behavior: 'instant' });
    const ctx = gsap.context(() => { gsap.utils.toArray('.reveal').forEach((element) => gsap.from(element, { scrollTrigger: { trigger: element, start: 'top 88%' }, y: 34, opacity: 0, duration: 0.8, ease: 'power3.out' })); });
    return () => ctx.revert();
  }, [data, path]);
  const navigate = (next) => setPath(next);
  const page = useMemo(() => {
    if (!data) return null;
    if (path === '/admin') return <Admin data={data} setData={setData} onSave={saveCmsData} />;
    if (path === '/properties') return <PropertiesPage properties={data.properties} navigate={navigate} />;
    if (path.startsWith('/properties/')) {
      const propertyId = decodeURIComponent(path.slice('/properties/'.length));
      const property = data.properties.find((item) => String(item.id) === propertyId);
      return property ? <PropertyDetailsPage property={property} navigate={navigate} /> : <PropertiesPage properties={data.properties} navigate={navigate} />;
    }
    if (path === '/services') return <ServicesPage services={data.services} navigate={navigate} />;
    if (path === '/about') return <AboutPage settings={data.settings} navigate={navigate} />;
    if (path === '/contact') {
      const propertyId = new URLSearchParams(window.location.search).get('property');
      return <ContactPage settings={data.settings} property={data.properties.find((item) => String(item.id) === propertyId)} />;
    }
    if (path === '/list-property') return <PropertySubmissionPage pageImage={pageImages.submission} />;
    if (path === '/privacy') return <PrivacyPage settings={data.settings} />;
    if (path === '/terms') return <TermsPage settings={data.settings} />;
    return <HomePage data={data} navigate={navigate} />;
  }, [data, path]);
  if (!data) return <div className="loading">Real Metrics Holdings</div>;
  if (path === '/admin') return page;
  return <><Header path={path} navigate={navigate} />{page}<Footer settings={data.settings} navigate={navigate} /></>;
}

createRoot(document.getElementById('root')).render(<App />);
