import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, BadgeCheck, Building2, ChartNoAxesCombined, Home, Mail, MapPin, Megaphone, Menu, Phone, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Admin } from './components/Admin';
import { PropertyCard } from './components/PropertyCard';
import { loadCmsData, saveCmsData } from './lib/store';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [data, setData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [routeHash, setRouteHash] = useState(window.location.hash);
  const isAdmin = routeHash === '#admin' || window.location.pathname.endsWith('/admin');

  useEffect(() => {
    loadCmsData().then(setData);
  }, []);

  useEffect(() => {
    const syncHash = () => setRouteHash(window.location.hash);
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  useEffect(() => {
    if (!data || isAdmin) return;

    const ctx = gsap.context(() => {
      gsap.from('.hero-copy > *', {
        y: 28,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.11,
      });

      gsap.from('.hero-search', {
        y: 36,
        opacity: 0,
        duration: 0.85,
        delay: 0.35,
        ease: 'power3.out',
      });

      gsap.utils.toArray('.reveal').forEach((element) => {
        gsap.from(element, {
          scrollTrigger: {
            trigger: element,
            start: 'top 86%',
          },
          y: 34,
          opacity: 0,
          duration: 0.75,
          ease: 'power3.out',
        });
      });
    });

    return () => ctx.revert();
  }, [data, isAdmin]);

  if (!data) return <div className="loading">Real Metrics Holdings</div>;
  if (isAdmin) return <Admin data={data} setData={setData} onSave={saveCmsData} />;

  const { settings, properties, services, testimonials } = data;
  const featured = properties.find((property) => property.featured) || properties[0];

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Real Metrics Holdings home">
          <img src={`${import.meta.env.BASE_URL}real-metrics-logo.png`} alt="" />
          <span>Real Metrics</span>
        </a>
        <nav className={menuOpen ? 'nav open' : 'nav'} aria-label="Primary navigation">
          {['Properties', 'Services', 'About', 'Future', 'Contact'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}>{item}</a>
          ))}
          <a className="admin-link" href="#admin">Admin</a>
        </nav>
        <a className="header-contact" href={`tel:${settings.phone.replaceAll(' ', '')}`}><Phone size={16} />{settings.phone}</a>
        <button className="menu-button" type="button" onClick={() => setMenuOpen((current) => !current)} aria-label="Toggle menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-copy">
            <p className="eyebrow"><Sparkles size={16} /> Botswana property advertising</p>
            <h1>{settings.hero_title}</h1>
            <p>{settings.hero_subtitle}</p>
            <div className="hero-actions">
              <a className="primary-button" href="#properties">View listings <ArrowRight size={18} /></a>
              <a className="ghost-button" href="#contact">Advertise a property</a>
            </div>
          </div>
          <div className="hero-search">
            <div className="search-tabs">
              <span>Buy</span><span>Rent</span><span>Sold</span><span>Tenanted</span>
            </div>
            <div className="search-card">
              <label>Location<span>Gaborone and surrounding areas</span></label>
              <label>Campaign Type<span>Sale, rental, tenancy, showcase</span></label>
              <a href="#properties">Explore adverts <ArrowRight size={16} /></a>
            </div>
          </div>
        </section>

        <section className="metrics-band reveal">
          <div><strong>Real estate first</strong><span>Built to expand into future RMH ideas</span></div>
          <div><strong>Full CMS</strong><span>Edit listings, status, content, and media</span></div>
          <div><strong>Mobile refined</strong><span>Compact, tactile, and campaign-ready</span></div>
        </section>

        <section id="properties" className="section">
          <div className="section-heading reveal">
            <p className="eyebrow"><Home size={16} /> Current Advertisements</p>
            <h2>Property campaigns with status clarity and polished media.</h2>
            <p>Every advert can be updated through the admin CMS with availability, sale, rental, sold, rented, or tenanted status.</p>
          </div>
          <div className="property-grid">
            {properties.map((property) => <PropertyCard key={property.id} property={property} />)}
          </div>
        </section>

        <section className="feature-strip">
          <div className="feature-image reveal">
            <img src={featured.images?.[0]} alt={featured.title} />
          </div>
          <div className="feature-copy reveal">
            <p className="eyebrow">Featured Campaign</p>
            <h2>{featured.title}</h2>
            <p>{featured.description}</p>
            <div className="feature-list">
              <span><BadgeCheck size={18} /> verified presentation</span>
              <span><ShieldCheck size={18} /> campaign status controls</span>
              <span><ChartNoAxesCombined size={18} /> room for analytics later</span>
            </div>
          </div>
        </section>

        <section id="services" className="section dark-section">
          <div className="section-heading reveal">
            <p className="eyebrow"><Megaphone size={16} /> Services</p>
            <h2>Advertising infrastructure for professional property teams.</h2>
          </div>
          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card reveal" key={service.id}>
                <div className="service-icon">{service.icon === 'layout' ? <Building2 /> : service.icon === 'chart' ? <ChartNoAxesCombined /> : <Megaphone />}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="about-section">
          <div className="about-copy reveal">
            <p className="eyebrow">About Real Metrics Holdings</p>
            <h2>Premium real estate advertising today, extensible business platform tomorrow.</h2>
            <p>Real Metrics Holdings presents properties with the polish buyers and tenants expect: sharp visuals, direct calls to action, and clear listing intelligence. The CMS foundation leaves space for future divisions, services, analytics, and campaign products without rebuilding the site from scratch.</p>
          </div>
          <div className="testimonial-stack">
            {testimonials.map((testimonial) => (
              <blockquote className="reveal" key={testimonial.id}>
                “{testimonial.quote}”
                <cite>{testimonial.name}<span>{testimonial.role}</span></cite>
              </blockquote>
            ))}
          </div>
        </section>

        <section id="future" className="future-section reveal">
          <p className="eyebrow">Built For What Comes Next</p>
          <h2>Future modules can plug into the same brand system.</h2>
          <div className="future-grid">
            <span>Developer campaigns</span>
            <span>Property analytics</span>
            <span>Agent roster</span>
            <span>Lead tracking</span>
            <span>Investment opportunities</span>
            <span>Project showcases</span>
          </div>
        </section>

        <section id="contact" className="contact-section">
          <div className="contact-card reveal">
            <p className="eyebrow">Contact</p>
            <h2>Advertise a property with Real Metrics Holdings.</h2>
            <p>Send the property details, status, location, price, and available images. The campaign can be formatted into a polished advert and managed through the CMS.</p>
            <div className="contact-links">
              <a href={`mailto:${settings.email}`}><Mail size={18} />{settings.email}</a>
              <a href={`tel:${settings.phone.replaceAll(' ', '')}`}><Phone size={18} />{settings.phone}</a>
              <span><MapPin size={18} />{settings.address}</span>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <img src={`${import.meta.env.BASE_URL}real-metrics-logo.png`} alt="Real Metrics Holdings" />
        <span>© {new Date().getFullYear()} Real Metrics Holdings. Professional real estate advertising.</span>
      </footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
