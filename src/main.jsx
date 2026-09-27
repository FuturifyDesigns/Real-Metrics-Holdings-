import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight, Bath, BedDouble, Building2, ChartNoAxesCombined, Check, ChevronLeft, ChevronRight,
  Mail, MapPin, Megaphone, Menu, Phone, Ruler, Send, ShieldCheck, X,
} from 'lucide-react';
import { Admin } from './components/Admin';
import { PropertyCard } from './components/PropertyCard';
import { PropertySubmissionPage } from './components/PropertySubmission';
import { loadCmsData, saveCmsData } from './lib/store';
import { hasSupabase, supabase, tables } from './lib/supabase';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const publicAsset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
const routes = ['/', '/properties', '/services', '/about', '/contact', '/list-property', '/admin'];

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
  { image: 'images/hero-residence.png', label: 'Residential', title: 'Homes presented with purpose.', copy: 'Thoughtful property advertising for sellers, landlords, agents, and developers across Botswana.' },
  { image: 'images/hero-apartment.png', label: 'Apartments', title: 'Every detail earns attention.', copy: 'Strong photography, clear information, and a polished presentation that lets each property speak for itself.' },
  { image: 'images/hero-commercial.png', label: 'Commercial', title: 'Property marketing made clear.', copy: 'Professional campaigns for commercial spaces, residential homes, developments, and rental opportunities.' },
  { image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=88', label: 'Premium homes', title: 'Designed to make an entrance.', copy: 'Editorial presentation that gives exceptional homes the space, detail, and credibility they deserve.' },
  { image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=2000&q=88', label: 'Workspaces', title: 'Commercial space, clearly positioned.', copy: 'Confident campaigns that help businesses and investors see the opportunity at a glance.' },
];

const pageImages = {
  properties: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2000&q=88',
  services: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2000&q=88',
  about: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=2000&q=88',
  contact: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=2000&q=88',
  submission: 'https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=2000&q=88',
};

function HeroSlider({ navigate, settings }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % heroSlides.length), 6500);
    return () => window.clearInterval(timer);
  }, []);
  const slides = heroSlides.map((slide, index) => index === 0 ? { ...slide, title: settings.hero_title, copy: settings.hero_subtitle } : slide);
  return (
    <section className="hero" aria-roledescription="carousel">
      {slides.map((slide, index) => <div className={`hero-slide ${index === active ? 'active' : ''}`} key={slide.image} aria-hidden={index !== active}><img src={slide.image.startsWith('http') ? slide.image : publicAsset(slide.image)} alt="" /></div>)}
      <div className="hero-shade" />
      <div className="hero-copy" key={active}>
        <p className="eyebrow light">{slides[active].label}</p>
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
  return <section className="page-intro"><img src={image} alt="" /><div className="page-intro-shade" /><div className="page-intro-copy"><p className="eyebrow light">{eyebrow}</p><h1>{title}</h1><p>{copy}</p></div></section>;
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
      <div className="editorial-image reveal"><img src={publicAsset('images/hero-apartment.png')} alt="Modern apartment interior" /></div>
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
  const images = property.images?.length ? property.images : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=88'];
  const showPrevious = () => setActiveImage((current) => (current - 1 + images.length) % images.length);
  const showNext = () => setActiveImage((current) => (current + 1) % images.length);
  return <main className="property-details-page">
    <section className="property-gallery">
      <div className="property-gallery-main"><img src={images[activeImage]} alt={`${property.title} view ${activeImage + 1}`} />{images.length > 1 && <div className="property-gallery-controls"><button type="button" onClick={showPrevious} aria-label="Previous property image"><ChevronLeft /></button><span>{activeImage + 1} / {images.length}</span><button type="button" onClick={showNext} aria-label="Next property image"><ChevronRight /></button></div>}</div>
      {images.length > 1 && <div className="property-thumbnails" aria-label="Property image gallery">{images.map((image, index) => <button type="button" className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)} key={image}><img src={image} alt={`Show ${property.title} image ${index + 1}`} /></button>)}</div>}
    </section>
    <section className="property-details section"><div className="property-details-copy"><Link className="back-link" to="/properties" onNavigate={navigate}>← Back to properties</Link><p className="eyebrow">{property.category}</p><h1>{property.title}</h1><p className="property-detail-location"><MapPin />{property.location}</p><p className="property-detail-description">{property.description}</p><div className="property-detail-meta"><span><BedDouble /> <strong>{property.beds || 'Studio'}</strong> Bedrooms</span><span><Bath /> <strong>{property.baths}</strong> Bathrooms</span><span><Ruler /> <strong>{property.size || 'Not specified'}</strong> Size</span></div></div><aside className="property-enquiry-card"><span className={`status status-${String(property.status).toLowerCase().replaceAll(' ', '-')}`}>{property.status}</span><p>Asking price</p><strong>{property.price}</strong><p>Interested in this property? Send the full listing details with your enquiry.</p><Link className="primary-button" to={`/contact?property=${encodeURIComponent(property.id)}`} onNavigate={navigate}>Enquire about this property <ArrowRight /></Link></aside></section>
  </main>;
}

const serviceIcon = (icon) => icon === 'layout' ? <Building2 /> : icon === 'chart' ? <ChartNoAxesCombined /> : <Megaphone />;

function ServicesPage({ services, navigate }) {
  return <main>
    <PageIntro eyebrow="Our services" title="Property marketing, handled with care." copy="From first brief to published campaign, we make each listing clear, attractive, and easy to act on." image={pageImages.services} />
    <section className="section service-page-grid">{services.map((service, index) => <article className="service-row reveal" key={service.id}><span className="service-number">0{index + 1}</span><div className="service-icon">{serviceIcon(service.icon)}</div><div><h2>{service.title}</h2><p>{service.description}</p></div></article>)}</section>
    <section className="process-band"><div className="section-heading reveal"><p className="eyebrow light">Our approach</p><h2>Simple from brief to enquiry.</h2></div><div className="process-grid"><div className="reveal"><strong>01</strong><h3>Share the property</h3><p>Send the details, images, location, price, and availability.</p></div><div className="reveal"><strong>02</strong><h3>We shape the advert</h3><p>We organise the story and present the property with clarity.</p></div><div className="reveal"><strong>03</strong><h3>Reach the market</h3><p>Your campaign goes live with direct paths for serious enquiries.</p></div></div></section>
    <section className="cta-band reveal"><div><p className="eyebrow light">Ready to begin?</p><h2>Bring us your next listing.</h2></div><Link className="light-button" to="/list-property" onNavigate={navigate}>List your property <ArrowRight size={18} /></Link></section>
  </main>;
}

function AboutPage({ settings, testimonials }) {
  return <main>
    <PageIntro eyebrow="About us" title={settings.about_title} copy="Real Metrics Holdings helps property owners and professionals show the market what makes a place worth considering." image={pageImages.about} />
    <section className="about-page section"><div className="about-statement reveal"><p className="eyebrow">Real Metrics Holdings</p><h2>Local understanding. A sharper standard.</h2></div><div className="about-body reveal"><p>{settings.about_body}</p><p>Our work is grounded in honest information, strong visual judgement, and a smooth experience for both advertisers and property seekers.</p></div></section>
    <section className="values-band"><article className="reveal"><ShieldCheck /><h3>Clear information</h3><p>Every campaign makes price, status, location, and key property details easy to understand.</p></article><article className="reveal"><Check /><h3>Considered presentation</h3><p>Photography and copy work together without overstatement or unnecessary noise.</p></article><article className="reveal"><MapPin /><h3>Botswana focused</h3><p>Our platform is shaped around the local property market and the people moving through it.</p></article></section>
    {testimonials.length > 0 && <section className="section testimonial-section"><div className="section-heading reveal"><p className="eyebrow">Client perspective</p><h2>What good presentation changes.</h2></div><div className="testimonial-grid">{testimonials.map((item) => <blockquote className="reveal" key={item.id}>“{item.quote}”<cite>{item.name}<span>{item.role}</span></cite></blockquote>)}</div></section>}
  </main>;
}

function ContactPage({ settings, property }) {
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const propertySummary = property ? `${property.title} — ${property.location} — ${property.price}\nStatus: ${property.status}\nCategory: ${property.category}\nBedrooms: ${property.beds || 'Studio'}\nBathrooms: ${property.baths}\nSize: ${property.size || 'Not specified'}\n\n${property.description}` : '';
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
      status: 'new',
    };
    try {
      if (!hasSupabase) throw new Error('Online enquiries are temporarily unavailable. Please email us directly.');
      const { error } = await supabase.from(tables.inquiries).insert(inquiry);
      if (error) throw error;
      setFormMessage('Your enquiry has been saved. Your email application is opening with the details ready to send.');
      const subject = encodeURIComponent(`${inquiry.inquiry_type}${property ? `: ${property.title}` : ''} from ${inquiry.name}`);
      const body = encodeURIComponent(`Name: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone}\nInquiry: ${inquiry.inquiry_type}${propertySummary ? `\n\nProperty details:\n${propertySummary}` : ''}\n\nMessage:\n${inquiry.message}`);
      window.location.href = `mailto:${settings.email}?subject=${subject}&body=${body}`;
      formElement.reset();
    } catch (error) {
      setFormMessage(error.message || 'We could not save your enquiry. Please try again.');
    } finally { setSubmitting(false); }
  };
  return <main>
    <PageIntro eyebrow="Contact" title="Let's talk property." copy={settings.contact_intro} image={pageImages.contact} />
    <section className="contact-page section"><div className="contact-details reveal"><p className="eyebrow">Get in touch</p><h2>{property ? `Enquire about ${property.title}` : 'How can we help?'}</h2><p>{property ? 'The property details have been added to your enquiry. Enter your contact information and a personal message so our team can respond.' : 'For property submissions, use our dedicated listing form. For general enquiries, partnerships, or support, send us a message here.'}</p><a href={`mailto:${settings.email}`}><Mail /><span><small>Email</small>{settings.email}</span></a><a href={`tel:${settings.phone.replaceAll(' ', '')}`}><Phone /><span><small>Phone</small>{settings.phone}</span></a><div className="contact-location"><MapPin /><span><small>Location</small>{settings.address}</span></div></div><form className="contact-form reveal" onSubmit={submit}>{property && <label className="wide">Selected property details<textarea className="readonly-details" value={propertySummary} rows="7" readOnly /></label>}<label>Your name *<input name="name" autoComplete="name" minLength="2" maxLength="80" required /></label><label>Email address *<input name="email" type="email" autoComplete="email" maxLength="120" required /></label><label>Phone number *<input name="phone" type="tel" autoComplete="tel" inputMode="tel" pattern="[+0-9][0-9 ()-]{6,19}" title="Enter a valid phone number using digits, spaces, brackets, + or -." required /></label><label>Inquiry type *<select name="inquiry_type" defaultValue={property ? 'Property enquiry' : ''} required><option value="" disabled>Select one</option><option>Property enquiry</option><option>General enquiry</option><option>Property search</option><option>Partnership</option><option>Website support</option></select></label><label className="wide">How can we help? *<textarea name="message" rows="7" minLength="20" maxLength="1500" defaultValue={property ? `I am interested in ${property.title} in ${property.location}. Please contact me with more information and the next steps.` : ''} required /></label><button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Saving enquiry…' : 'Send enquiry'} <Send size={17} /></button>{formMessage && <p className="contact-form-message wide" role="status">{formMessage}</p>}</form></section>
  </main>;
}

function Header({ path, navigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [['/', 'Home'], ['/properties', 'Properties'], ['/services', 'Services'], ['/about', 'About'], ['/contact', 'Contact']];
  return <header className="site-header"><Link className="brand" to="/" onNavigate={navigate} aria-label="Real Metrics Holdings home"><img src={publicAsset('real-metrics-logo-transparent.png')} alt="Real Metrics Holdings" /></Link><nav className={`nav ${menuOpen ? 'open' : ''}`} aria-label="Primary navigation">{links.map(([to, label]) => <Link key={to} className={path === to ? 'active' : ''} to={to} onNavigate={(next) => { setMenuOpen(false); navigate(next); }}>{label}</Link>)}</nav><Link className="header-cta" to="/list-property" onNavigate={navigate}>List your property <ArrowRight size={16} /></Link><button className="menu-button" type="button" onClick={() => setMenuOpen((current) => !current)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button></header>;
}

function Footer({ settings, navigate }) {
  return <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><img src={publicAsset('real-metrics-logo-transparent.png')} alt="Real Metrics Holdings" /><p>Professional property advertising and listing presentation across Botswana.</p></div><div className="footer-links"><h3>Company</h3><Link to="/about" onNavigate={navigate}>About</Link><Link to="/services" onNavigate={navigate}>Services</Link><Link to="/properties" onNavigate={navigate}>Properties</Link><Link to="/list-property" onNavigate={navigate}>List a property</Link></div><div className="footer-links"><h3>Contact</h3><a href={`mailto:${settings.email}`}>{settings.email}</a><a href={`tel:${settings.phone.replaceAll(' ', '')}`}>{settings.phone}</a><span>{settings.address}</span></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Real Metrics Holdings</span><a href="https://futurifydesigns.com" target="_blank" rel="noopener noreferrer">Built by Futurify Designs</a></div></footer>;
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
    if (path === '/about') return <AboutPage settings={data.settings} testimonials={data.testimonials} />;
    if (path === '/contact') {
      const propertyId = new URLSearchParams(window.location.search).get('property');
      return <ContactPage settings={data.settings} property={data.properties.find((item) => String(item.id) === propertyId)} />;
    }
    if (path === '/list-property') return <PropertySubmissionPage pageImage={pageImages.submission} />;
    return <HomePage data={data} navigate={navigate} />;
  }, [data, path]);
  if (!data) return <div className="loading">Real Metrics Holdings</div>;
  if (path === '/admin') return page;
  return <><Header path={path} navigate={navigate} />{page}<Footer settings={data.settings} navigate={navigate} /></>;
}

createRoot(document.getElementById('root')).render(<App />);
