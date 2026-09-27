import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight, Building2, ChartNoAxesCombined, Check, ChevronLeft, ChevronRight,
  Mail, MapPin, Megaphone, Menu, Phone, Send, ShieldCheck, X,
} from 'lucide-react';
import { Admin } from './components/Admin';
import { PropertyCard } from './components/PropertyCard';
import { loadCmsData, saveCmsData } from './lib/store';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const publicAsset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
const routes = ['/', '/properties', '/services', '/about', '/contact', '/admin'];

function currentPath() {
  const pathname = window.location.pathname;
  const stripped = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  const normalized = `/${stripped.replace(/^\/+|\/+$/g, '')}`;
  return normalized === '/' || routes.includes(normalized) ? normalized : '/';
}

function Link({ to, onNavigate, children, className = '', ...props }) {
  const href = `${basePath}${to === '/' ? '/' : to}`;
  return <a {...props} className={className} href={href} onClick={(event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState({}, '', href);
    onNavigate(to);
  }}>{children}</a>;
}

const heroSlides = [
  { image: 'images/hero-residence.png', label: 'Residential', title: 'Homes presented with purpose.', copy: 'Thoughtful property advertising for sellers, landlords, agents, and developers across Botswana.' },
  { image: 'images/hero-apartment.png', label: 'Apartments', title: 'Every detail earns attention.', copy: 'Strong photography, clear information, and a polished presentation that lets each property speak for itself.' },
  { image: 'images/hero-commercial.png', label: 'Commercial', title: 'Property marketing made clear.', copy: 'Professional campaigns for commercial spaces, residential homes, developments, and rental opportunities.' },
];

function HeroSlider({ navigate, settings }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % heroSlides.length), 6500);
    return () => window.clearInterval(timer);
  }, []);
  const changeSlide = (direction) => setActive((value) => (value + direction + heroSlides.length) % heroSlides.length);
  const slides = heroSlides.map((slide, index) => index === 0 ? { ...slide, title: settings.hero_title, copy: settings.hero_subtitle } : slide);
  return (
    <section className="hero" aria-roledescription="carousel">
      {slides.map((slide, index) => <div className={`hero-slide ${index === active ? 'active' : ''}`} key={slide.image} aria-hidden={index !== active}><img src={publicAsset(slide.image)} alt="" /></div>)}
      <div className="hero-shade" />
      <div className="hero-copy" key={active}>
        <p className="eyebrow light">{slides[active].label}</p>
        <h1>{slides[active].title}</h1>
        <p>{slides[active].copy}</p>
        <div className="hero-actions">
          <Link className="primary-button" to="/properties" onNavigate={navigate}>View properties <ArrowRight size={18} /></Link>
          <Link className="ghost-button" to="/contact" onNavigate={navigate}>List a property</Link>
        </div>
      </div>
      <div className="hero-controls">
        <button type="button" onClick={() => changeSlide(-1)} aria-label="Previous slide"><ChevronLeft /></button>
        <div className="hero-dots">{slides.map((slide, index) => <button key={slide.image} className={index === active ? 'active' : ''} type="button" onClick={() => setActive(index)} aria-label={`Show slide ${index + 1}`} />)}</div>
        <button type="button" onClick={() => changeSlide(1)} aria-label="Next slide"><ChevronRight /></button>
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
      <div className="property-grid home-grid">{properties.map((property) => <PropertyCard key={property.id} property={property} contactHref={`${basePath}/contact`} />)}</div>
      <div className="section-action reveal"><Link className="text-link" to="/properties" onNavigate={navigate}>See all properties <ArrowRight size={17} /></Link></div>
    </section>
    <section className="editorial-split">
      <div className="editorial-image reveal"><img src={publicAsset('images/hero-apartment.png')} alt="Modern apartment interior" /></div>
      <div className="editorial-copy reveal"><p className="eyebrow">A better first impression</p><h2>Good property deserves good presentation.</h2><p>We bring together considered copy, carefully selected images, and clear listing information so buyers and tenants can understand the opportunity quickly.</p><Link className="text-link" to="/services" onNavigate={navigate}>How we help <ArrowRight size={17} /></Link></div>
    </section>
    <section className="cta-band reveal"><div><p className="eyebrow light">Have a property to market?</p><h2>Let us present it properly.</h2></div><Link className="light-button" to="/contact" onNavigate={navigate}>Start a conversation <ArrowRight size={18} /></Link></section>
  </main>;
}

function PropertiesPage({ properties }) {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'For Sale', 'For Rent', 'Available', 'Sold', 'Rented', 'Tenanted'];
  const visible = filter === 'All' ? properties : properties.filter((property) => property.status === filter);
  return <main>
    <PageIntro eyebrow="Properties" title="Find the right place." copy="Explore properties for sale and rent, along with recently completed campaigns." image={publicAsset('images/hero-residence.png')} />
    <section className="section"><div className="filter-bar" aria-label="Filter properties by status">{filters.map((item) => <button className={filter === item ? 'active' : ''} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>{visible.length ? <div className="property-grid">{visible.map((property) => <PropertyCard key={property.id} property={property} contactHref={`${basePath}/contact`} />)}</div> : <p className="empty-state">No properties match this status yet.</p>}</section>
  </main>;
}

const serviceIcon = (icon) => icon === 'layout' ? <Building2 /> : icon === 'chart' ? <ChartNoAxesCombined /> : <Megaphone />;

function ServicesPage({ services, navigate }) {
  return <main>
    <PageIntro eyebrow="Our services" title="Property marketing, handled with care." copy="From first brief to published campaign, we make each listing clear, attractive, and easy to act on." image={publicAsset('images/hero-commercial.png')} />
    <section className="section service-page-grid">{services.map((service, index) => <article className="service-row reveal" key={service.id}><span className="service-number">0{index + 1}</span><div className="service-icon">{serviceIcon(service.icon)}</div><div><h2>{service.title}</h2><p>{service.description}</p></div></article>)}</section>
    <section className="process-band"><div className="section-heading reveal"><p className="eyebrow light">Our approach</p><h2>Simple from brief to enquiry.</h2></div><div className="process-grid"><div className="reveal"><strong>01</strong><h3>Share the property</h3><p>Send the details, images, location, price, and availability.</p></div><div className="reveal"><strong>02</strong><h3>We shape the advert</h3><p>We organise the story and present the property with clarity.</p></div><div className="reveal"><strong>03</strong><h3>Reach the market</h3><p>Your campaign goes live with direct paths for serious enquiries.</p></div></div></section>
    <section className="cta-band reveal"><div><p className="eyebrow light">Ready to begin?</p><h2>Bring us your next listing.</h2></div><Link className="light-button" to="/contact" onNavigate={navigate}>Contact us <ArrowRight size={18} /></Link></section>
  </main>;
}

function AboutPage({ settings, testimonials }) {
  return <main>
    <PageIntro eyebrow="About us" title={settings.about_title} copy="Real Metrics Holdings helps property owners and professionals show the market what makes a place worth considering." image={publicAsset('images/hero-apartment.png')} />
    <section className="about-page section"><div className="about-statement reveal"><p className="eyebrow">Real Metrics Holdings</p><h2>Local understanding. A sharper standard.</h2></div><div className="about-body reveal"><p>{settings.about_body}</p><p>Our work is grounded in honest information, strong visual judgement, and a smooth experience for both advertisers and property seekers.</p></div></section>
    <section className="values-band"><article className="reveal"><ShieldCheck /><h3>Clear information</h3><p>Every campaign makes price, status, location, and key property details easy to understand.</p></article><article className="reveal"><Check /><h3>Considered presentation</h3><p>Photography and copy work together without overstatement or unnecessary noise.</p></article><article className="reveal"><MapPin /><h3>Botswana focused</h3><p>Our platform is shaped around the local property market and the people moving through it.</p></article></section>
    {testimonials.length > 0 && <section className="section testimonial-section"><div className="section-heading reveal"><p className="eyebrow">Client perspective</p><h2>What good presentation changes.</h2></div><div className="testimonial-grid">{testimonials.map((item) => <blockquote className="reveal" key={item.id}>“{item.quote}”<cite>{item.name}<span>{item.role}</span></cite></blockquote>)}</div></section>}
  </main>;
}

function ContactPage({ settings }) {
  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Property enquiry from ${form.get('name')}`);
    const body = encodeURIComponent(`Name: ${form.get('name')}\nPhone: ${form.get('phone')}\nProperty/location: ${form.get('property')}\n\n${form.get('message')}`);
    window.location.href = `mailto:${settings.email}?subject=${subject}&body=${body}`;
  };
  return <main>
    <PageIntro eyebrow="Contact" title="Let's talk property." copy={settings.contact_intro} image={publicAsset('images/hero-commercial.png')} />
    <section className="contact-page section"><div className="contact-details reveal"><p className="eyebrow">Get in touch</p><h2>Tell us what you are bringing to market.</h2><p>Share the property type, location, asking price, availability, and any images you already have.</p><a href={`mailto:${settings.email}`}><Mail /><span><small>Email</small>{settings.email}</span></a><a href={`tel:${settings.phone.replaceAll(' ', '')}`}><Phone /><span><small>Phone</small>{settings.phone}</span></a><div className="contact-location"><MapPin /><span><small>Location</small>{settings.address}</span></div></div><form className="contact-form reveal" onSubmit={submit}><label>Your name<input name="name" required /></label><label>Phone number<input name="phone" required /></label><label className="wide">Property or location<input name="property" required /></label><label className="wide">How can we help?<textarea name="message" rows="6" required /></label><button className="primary-button" type="submit">Send enquiry <Send size={17} /></button></form></section>
  </main>;
}

function Header({ path, navigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [['/', 'Home'], ['/properties', 'Properties'], ['/services', 'Services'], ['/about', 'About'], ['/contact', 'Contact']];
  return <header className="site-header"><Link className="brand" to="/" onNavigate={navigate} aria-label="Real Metrics Holdings home"><img src={publicAsset('real-metrics-logo.png')} alt="Real Metrics Holdings" /></Link><nav className={`nav ${menuOpen ? 'open' : ''}`} aria-label="Primary navigation">{links.map(([to, label]) => <Link key={to} className={path === to ? 'active' : ''} to={to} onNavigate={(next) => { setMenuOpen(false); navigate(next); }}>{label}</Link>)}</nav><Link className="header-cta" to="/contact" onNavigate={navigate}>List your property <ArrowRight size={16} /></Link><button className="menu-button" type="button" onClick={() => setMenuOpen((current) => !current)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button></header>;
}

function Footer({ settings, navigate }) {
  return <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><img src={publicAsset('real-metrics-logo.png')} alt="Real Metrics Holdings" /><p>Professional property advertising and listing presentation across Botswana.</p></div><div className="footer-links"><h3>Company</h3><Link to="/about" onNavigate={navigate}>About</Link><Link to="/services" onNavigate={navigate}>Services</Link><Link to="/properties" onNavigate={navigate}>Properties</Link></div><div className="footer-links"><h3>Contact</h3><a href={`mailto:${settings.email}`}>{settings.email}</a><a href={`tel:${settings.phone.replaceAll(' ', '')}`}>{settings.phone}</a><span>{settings.address}</span></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Real Metrics Holdings</span><span>Real estate advertising, Botswana</span></div></footer>;
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
    if (path === '/properties') return <PropertiesPage properties={data.properties} />;
    if (path === '/services') return <ServicesPage services={data.services} navigate={navigate} />;
    if (path === '/about') return <AboutPage settings={data.settings} testimonials={data.testimonials} />;
    if (path === '/contact') return <ContactPage settings={data.settings} />;
    return <HomePage data={data} navigate={navigate} />;
  }, [data, path]);
  if (!data) return <div className="loading">Real Metrics Holdings</div>;
  if (path === '/admin') return page;
  return <><Header path={path} navigate={navigate} />{page}<Footer settings={data.settings} navigate={navigate} /></>;
}

createRoot(document.getElementById('root')).render(<App />);
