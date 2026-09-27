import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight, Bath, BedDouble, Building2, ChartNoAxesCombined, Check, ChevronLeft, ChevronRight,
  ImagePlus, Mail, MapPin, Megaphone, Pencil, Phone, Plus, Ruler, Save, Send, ShieldCheck, X,
} from 'lucide-react';
import { Admin } from './components/Admin';
import { PropertyCard } from './components/PropertyCard';
import { PropertySubmissionPage } from './components/PropertySubmission';
import { initialCmsData, loadCmsData, saveCmsData } from './lib/store';
import { hasSupabase, supabase } from './lib/supabase';
import './styles.css';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const publicAsset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
const siteUrl = 'https://realmetricsholdings.com';
const seoPages = {
  '/': { title: 'Real Metrics Holdings | Property Advertising in Botswana', description: 'Real Metrics Holdings provides professional property advertising and listings in Botswana, alongside food products and GeoHub geoscience consulting services.' },
  '/properties': { title: 'Properties for Sale and Rent | Real Metrics Holdings', description: 'Explore professionally presented residential, rental, and commercial property listings in Botswana.' },
  '/services': { title: 'Property Advertising Services | Real Metrics Holdings', description: 'Property campaign strategy, listing copy, showcase pages, and market-ready presentation for Botswana property owners and professionals.' },
  '/products': { title: 'Food & Agricultural Products | Real Metrics Holdings', description: 'Explore salts, grains, cereals, legumes, nuts, spices, roots, and specialty produce for wholesale and commercial enquiries.' },
  '/products/enquire': { title: 'Food Product Enquiry | Real Metrics Holdings', description: 'Send a private food and agricultural product sourcing enquiry to Real Metrics Holdings.', noindex: true },
  '/geohub': { title: 'GeoHub Geoscience Consulting Botswana | Real Metrics Holdings', description: 'Borehole advisory, water testing, geophysical surveys, geological exploration, land surveying, environmental assessments, and soil testing in Botswana.' },
  '/about': { title: 'About Real Metrics Holdings | Botswana', description: 'Learn about Real Metrics Holdings and its approach to clear information, strong presentation, and trusted service in Botswana.' },
  '/contact': { title: 'Contact Real Metrics Holdings | Botswana', description: 'Contact Real Metrics Holdings about property advertising, listings, partnerships, and general enquiries in Botswana.' },
  '/list-property': { title: 'List Your Property | Real Metrics Holdings', description: 'Submit a Botswana property for review and professional presentation by Real Metrics Holdings.' },
  '/privacy': { title: 'Privacy Notice | Real Metrics Holdings', description: 'Read how Real Metrics Holdings collects, uses, protects, and retains personal information.' },
  '/terms': { title: 'Terms of Service | Real Metrics Holdings', description: 'Read the terms that apply when using the Real Metrics Holdings website and services.' },
  '/admin': { title: 'Admin | Real Metrics Holdings', description: 'Private website administration.', noindex: true },
};
const notFoundSeo = { title: 'Page Not Found | Real Metrics Holdings', description: 'The requested page could not be found.', noindex: true };

function currentPath() {
  const pathname = window.location.pathname;
  const stripped = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  const normalized = `/${stripped.replace(/^\/+|\/+$/g, '')}`;
  return normalized;
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

const productGroups = [
  { number: '01', title: 'Salts', items: ['Fine salt', 'Coarse salt'], copy: 'Everyday and bulk salt options for trade, food-service, and distribution enquiries.' },
  { number: '02', title: 'Grains & cereals', items: ['Sorghum', 'White maize', 'Yellow maize', 'Wheat grain'], copy: 'Staple grains sourced for dependable supply conversations and market requirements.' },
  { number: '03', title: 'Legumes & nuts', items: ['Dilobe (Bambara groundnuts)', 'Peanuts', 'Cashew nuts', 'Beans'], copy: 'A practical portfolio of high-demand pulses and nuts for wholesale and commercial buyers.' },
  { number: '04', title: 'Spices & roots', items: ['Cloves', 'Ginger', 'Turmeric'], copy: 'Aromatic ingredients selected for retail, food preparation, and trade requirements.' },
  { number: '05', title: 'Fruit & specialty produce', items: ['Soursop'], copy: 'Specialty produce enquiries handled according to availability and requested quantities.' },
];

const geohubServices = [
  { title: 'Water tests and reporting', image: 'geohub-water-testing.jpg', alt: 'Borehole water samples and field testing equipment', copy: 'Field sampling and clear reporting help clients understand water quality and make informed decisions about use, treatment, and ongoing monitoring.' },
  { title: 'Environmental impact assessment', image: 'geohub-environmental-impact.jpg', alt: 'Environmental assessment equipment beside a marked drainage area', copy: 'Site conditions, environmental sensitivities, and potential project effects are reviewed so risks can be identified before work begins.' },
  { title: 'Pre-drilling borehole advisory', image: 'geohub-predrilling.jpg', alt: 'Site maps, GPS equipment and survey markers at a proposed borehole location', copy: 'Available geological and geophysical evidence is considered before drilling to support practical siting, scope, and contractor discussions.' },
  { title: 'Borehole drilling supervision', image: 'geohub-hero.jpg', alt: 'Borehole drilling rig operating in open terrain', copy: 'Technical oversight during drilling helps document progress, monitor the encountered ground, and keep the work aligned with the agreed programme.' },
  { title: 'Borehole pumping tests', image: 'geohub-pumping-test.jpg', alt: 'Borehole pumping test with discharge channel and pressure gauge', copy: 'Controlled pumping and recovery observations are used to assess borehole performance and provide evidence for sustainable operating decisions.' },
  { title: 'Borehole registration', image: 'geohub-registration.jpg', alt: 'Completed and protected borehole headworks', copy: 'Project records and supporting information are organised to assist clients with the applicable borehole registration and documentation process.' },
  { title: 'Geophysical surveys', image: 'geohub-geophysical.jpg', alt: 'Geophysical survey instruments positioned across exposed ground', copy: 'Non-invasive field measurements help investigate subsurface conditions and guide groundwater, geological, and development planning.' },
  { title: 'Geological exploration', image: 'geohub-geological-exploration.jpg', alt: 'Rock core samples and geological field instruments', copy: 'Field observations, sampling, and geological interpretation support early-stage exploration and a stronger understanding of the project area.' },
  { title: 'Land surveying', image: 'geohub-land-surveying.jpg', alt: 'Total station and survey prism at a marked development site', copy: 'Accurate site measurements and setting-out information give landowners and project teams a dependable spatial basis for planning and construction.' },
  { title: 'Construction soil testing', image: 'geohub-soil-testing.jpg', alt: 'Soil testing apparatus and an exposed construction-site soil profile', copy: 'Ground and material testing provides practical information about site soils to support earthworks, foundations, and construction quality decisions.' },
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

function HeroSlider({ navigate, settings, editMode = false, onEdit }) {
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
        {editMode && active === 0 && <EditTrigger label="Edit homepage headline" className="hero-live-edit" onClick={() => onEdit({ type: 'settings', title: 'Homepage hero', fields: [{ key: 'hero_title', label: 'Headline' }, { key: 'hero_subtitle', label: 'Introduction', multiline: true }] })} />}
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

function AdditionalServices({ navigate, compact = false }) {
  return <section className={`additional-services section${compact ? ' compact' : ''}`} id="additional-services"><div className="section-heading"><p className="eyebrow">More from the group</p><h2>Specialist services beyond property.</h2><p>Explore two additional service areas, each with a dedicated team, clear capabilities, and its own page.</p></div><div className="additional-service-grid"><Link className="additional-service-card products-card" to="/products" onNavigate={navigate}><img src={publicAsset('images/food-products-hero.jpg')} alt="Grains, spices, nuts and food commodities" loading="lazy" decoding="async" /><span>Food & agricultural products</span><h3>Reliable products for trade and supply.</h3><p>Salts, grains, cereals, legumes, nuts, spices, roots, and specialty produce.</p><strong>Explore the portfolio <ArrowRight /></strong></Link><Link className="additional-service-card geohub-card" to="/geohub" onNavigate={navigate}><img src={publicAsset('images/geohub-hero.jpg')} alt="Borehole drilling and geoscience fieldwork" loading="lazy" decoding="async" /><span>GeoHub geoscience consulting</span><h3>Grounded advice from survey to water testing.</h3><p>Borehole advisory, geophysical surveys, environmental assessments, soil tests, and reporting.</p><strong>Explore GeoHub <ArrowRight /></strong></Link></div></section>;
}

function HomePage({ data, navigate, editMode = false, onEdit }) {
  const featured = data.properties.filter((property) => property.featured).slice(0, 3);
  const properties = featured.length ? featured : data.properties.slice(0, 3);
  return <main>
    <HeroSlider navigate={navigate} settings={data.settings} editMode={editMode} onEdit={onEdit} />
    <section className="section home-listings">
      <div className="section-heading reveal"><p className="eyebrow">Selected properties</p><h2>Worth a closer look.</h2><p>Browse current homes, rentals, and commercial opportunities presented by Real Metrics Holdings.</p></div>
      <div className="property-grid home-grid">{properties.map((property) => <PropertyCard key={property.id} property={property} detailHref={`${basePath}/properties/${property.id}`} contactHref={`${basePath}/contact?property=${encodeURIComponent(property.id)}`} onNavigate={navigate} editMode={editMode} onEdit={onEdit} />)}</div>
      <div className="section-action reveal"><Link className="text-link" to="/properties" onNavigate={navigate}>See all properties <ArrowRight size={17} /></Link></div>
    </section>
    <section className="editorial-split">
      <EditorialSlider />
      <div className="editorial-copy reveal"><p className="eyebrow">A better first impression</p><h2>Good property deserves good presentation.</h2><p>We bring together considered copy, carefully selected images, and clear listing information so buyers and tenants can understand the opportunity quickly.</p><Link className="text-link" to="/services" onNavigate={navigate}>How we help <ArrowRight size={17} /></Link></div>
    </section>
    {(data.settings.custom_sections || []).map((section) => <section className="custom-content-section section" key={section.id}>{editMode && <EditTrigger label={`Edit ${section.title}`} onClick={() => onEdit({ type: 'section', id: section.id, title: 'Custom section' })} />}<p className="eyebrow">Real Metrics Holdings</p><h2>{section.title}</h2><p>{section.body}</p></section>)}
    <AdditionalServices navigate={navigate} compact />
    <section className="cta-band reveal"><div><p className="eyebrow light">Have a property to market?</p><h2>Let us present it properly.</h2></div><Link className="light-button" to="/list-property" onNavigate={navigate}>Submit your property <ArrowRight size={18} /></Link></section>
  </main>;
}

function PropertiesPage({ properties, navigate, editMode = false, onEdit }) {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'For Sale', 'For Rent', 'Available', 'Sold', 'Rented', 'Tenanted'];
  const visible = filter === 'All' ? properties : properties.filter((property) => property.status === filter);
  return <main>
    <PageIntro eyebrow="Properties" title="Find the right place." copy="Explore properties for sale and rent, along with recently completed campaigns." image={pageImages.properties} />
    <section className="section"><div className="filter-bar" aria-label="Filter properties by status">{filters.map((item) => <button className={filter === item ? 'active' : ''} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>{visible.length ? <div className="property-grid">{visible.map((property) => <PropertyCard key={property.id} property={property} detailHref={`${basePath}/properties/${property.id}`} contactHref={`${basePath}/contact?property=${encodeURIComponent(property.id)}`} onNavigate={navigate} editMode={editMode} onEdit={onEdit} />)}</div> : <p className="empty-state">No properties match this status yet.</p>}</section>
  </main>;
}

function PropertyDetailsPage({ property, navigate, editMode = false, onEdit }) {
  const [activeImage, setActiveImage] = useState(0);
  const hasImages = Boolean(property.images?.length);
  const images = hasImages ? property.images : [publicAsset('real-metrics-logo-transparent.png')];
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
      <div className={`property-gallery-main${hasImages ? '' : ' no-images'}`}>{images.map((image, index) => <img className={index === activeImage ? 'active' : ''} src={image} alt={index === activeImage ? `${property.title} view ${activeImage + 1}` : ''} aria-hidden={index !== activeImage} loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'low'} decoding="async" key={image} />)}<div className="gallery-caption"><span>{property.category}</span><strong>{property.title}</strong></div>{images.length > 1 && <div className="property-gallery-controls"><button type="button" onClick={showPrevious} aria-label="Previous property image"><ChevronLeft /></button><span>{activeImage + 1} / {images.length}</span><button type="button" onClick={showNext} aria-label="Next property image"><ChevronRight /></button></div>}</div>
      {images.length > 1 && <div className="property-thumbnails" aria-label="Property image gallery">{images.map((image, index) => <button type="button" className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)} key={image}><img src={image} alt={`Show ${property.title} image ${index + 1}`} loading="lazy" decoding="async" /></button>)}</div>}
    </section>
    <section className="property-details section"><div className="property-details-copy">{editMode && <EditTrigger label={`Edit ${property.title}`} onClick={() => onEdit({ type: 'property', id: property.id, title: 'Property details' })} />}<Link className="back-link" to="/properties" onNavigate={navigate}>← Back to properties</Link><p className="eyebrow">{property.category}</p><h1>{property.title}</h1><p className="property-detail-location"><MapPin />{property.location}</p><p className="property-detail-description">{property.description}</p><div className="property-detail-meta"><span><BedDouble /> <strong>{property.beds || 'Studio'}</strong> Bedrooms</span><span><Bath /> <strong>{property.baths}</strong> Bathrooms</span><span><Ruler /> <strong>{property.size || 'Not specified'}</strong> Size</span></div><div className="property-detail-note"><h2>Property overview</h2><p>This listing is currently marked <strong>{property.status.toLowerCase()}</strong>. Review the complete gallery above, then enquire to confirm availability, arrange a viewing, or request any additional information from the Real Metrics team.</p></div></div><aside className="property-enquiry-card"><img src={images[0]} alt={`${property.title} enquiry preview`} loading="lazy" decoding="async" /><span className={`status status-${String(property.status).toLowerCase().replaceAll(' ', '-')}`}>{property.status}</span><p>Asking price</p><strong>{property.price}</strong><p>Interested in this property? Its image and full listing details will be attached to your enquiry.</p><Link className="primary-button" to={`/contact?property=${encodeURIComponent(property.id)}`} onNavigate={navigate}>Enquire about this property <ArrowRight /></Link></aside></section>
  </main>;
}

const serviceIcon = (icon) => icon === 'layout' ? <Building2 /> : icon === 'chart' ? <ChartNoAxesCombined /> : <Megaphone />;

function ServicesPage({ services, navigate, editMode = false, onEdit }) {
  return <main>
    <PageIntro eyebrow="Our services" title="Property marketing, handled with care." copy="From first brief to published campaign, we make each listing clear, attractive, and easy to act on." image={pageImages.services} />
    <section className="services-intro section"><div><p className="eyebrow">Complete listing support</p><h2>Every stage of the property story, brought together.</h2></div><p>We combine practical property information, considered visual direction, and a clear route to enquiry. Owners, landlords, agents, and developers get one organised workflow from submission to publication.</p></section>
    <section className="service-showcases">{services.map((service, index) => { const detail = serviceDetails[index % serviceDetails.length]; return <article className="service-showcase reveal" key={service.id}>{editMode && <EditTrigger label={`Edit ${service.title}`} className="service-live-edit" onClick={() => onEdit({ type: 'service', id: service.id, title: 'Service content' })} />}<div className="service-showcase-image"><img src={detail.image} alt={`${service.title} service`} loading="lazy" decoding="async" /><span>0{index + 1}</span></div><div className="service-showcase-copy"><div className="service-icon">{serviceIcon(service.icon)}</div><p className="eyebrow">{detail.kicker}</p><h2>{service.title}</h2><p>{service.description}</p><ul>{detail.features.map((feature) => <li key={feature}><Check size={17} />{feature}</li>)}</ul></div></article>; })}</section>
    <section className="process-band"><div className="section-heading reveal"><p className="eyebrow light">Our approach</p><h2>Simple from brief to enquiry.</h2></div><div className="process-grid"><div className="reveal"><strong>01</strong><h3>Share the property</h3><p>Send the details, images, location, price, and availability.</p></div><div className="reveal"><strong>02</strong><h3>We shape the advert</h3><p>We organise the story and present the property with clarity.</p></div><div className="reveal"><strong>03</strong><h3>Reach the market</h3><p>Your campaign goes live with direct paths for serious enquiries.</p></div></div></section>
    <section className="service-assurance section"><div className="section-heading reveal"><p className="eyebrow">Built for confidence</p><h2>Clear information. Human review. Better enquiries.</h2></div><div className="assurance-grid"><article><ShieldCheck /><h3>Reviewed before publishing</h3><p>Every owner-submitted listing enters a private approval queue before it can appear publicly.</p></article><article><ImagePlus /><h3>Gallery-first presentation</h3><p>Images are arranged into responsive slideshows so visitors can explore every property properly.</p></article><article><Mail /><h3>Enquiries stay connected</h3><p>Property context and visitor contact details reach the admin inbox together for useful follow-up.</p></article></div></section>
    <AdditionalServices navigate={navigate} />
    <section className="cta-band reveal"><div><p className="eyebrow light">Ready to begin?</p><h2>Bring us your next listing.</h2></div><Link className="light-button" to="/list-property" onNavigate={navigate}>List your property <ArrowRight size={18} /></Link></section>
  </main>;
}

function FoodProductsPage({ navigate }) {
  return <main className="venture-page food-products-page">
    <section className="venture-hero"><img src={publicAsset('images/food-products-hero.jpg')} alt="Food commodities including grains, salts, nuts, spices and soursop" fetchPriority="high" decoding="async" /><div className="venture-hero-shade" /><div className="venture-hero-copy"><p className="eyebrow light">Food & agricultural products</p><h1>Everyday commodities. Carefully brought together.</h1><p>A focused portfolio of salts, staple grains, cereals, legumes, nuts, spices, roots, and specialty produce for commercial and wholesale enquiries.</p><Link className="primary-button" to="/products/enquire" onNavigate={navigate}>Discuss your requirements <ArrowRight /></Link></div></section>
    <section className="venture-intro section"><div><p className="eyebrow">Our product portfolio</p><h2>From staple grains to distinctive ingredients.</h2></div><p>We connect buyers with a practical range of food and agricultural products. Tell us the product, quantity, preferred specification, and delivery requirement so the team can confirm current availability and next steps.</p></section>
    <section className="product-portfolio section">{productGroups.map((group) => <article key={group.title}><span>{group.number}</span><h3>{group.title}</h3><p>{group.copy}</p><ul>{group.items.map((item) => <li key={item}><Check size={16} />{item}</li>)}</ul></article>)}</section>
    <section className="venture-feature"><img src={publicAsset('images/food-grains.jpg')} alt="Sacks of sorghum, maize, wheat, beans, peanuts and cashews" loading="lazy" decoding="async" /><div><p className="eyebrow">Staple supply</p><h2>Grains, legumes, and nuts for real market needs.</h2><p>Our core portfolio covers widely used staples alongside versatile legumes and nuts. Enquiries can be shaped around product type, volume, intended use, and delivery expectations.</p><ul><li><Check />Clear product and quantity briefs</li><li><Check />Wholesale and commercial enquiries</li><li><Check />Availability confirmed before commitment</li></ul></div></section>
    <section className="venture-feature reverse"><img src={publicAsset('images/food-spices.jpg')} alt="Salt, cloves, ginger, turmeric and soursop" loading="lazy" decoding="async" /><div><p className="eyebrow">Distinctive ingredients</p><h2>Flavor, function, and specialty produce.</h2><p>Fine and coarse salt sit alongside cloves, ginger, turmeric, and soursop to create a balanced range for food-service, retail, and specialist supply conversations.</p><Link className="text-link" to="/products/enquire" onNavigate={navigate}>Request product information <ArrowRight /></Link></div></section>
    <section className="venture-steps section"><div><span>01</span><h3>Share your brief</h3><p>Specify the products, quantities, grade or format, and intended destination.</p></div><div><span>02</span><h3>Confirm availability</h3><p>The team reviews the requirement and confirms what can be supplied.</p></div><div><span>03</span><h3>Coordinate next steps</h3><p>Pricing, timing, and fulfilment details are discussed before commitment.</p></div></section>
    <section className="cta-band"><div><p className="eyebrow light">Product enquiry</p><h2>Tell us what you need to source.</h2></div><Link className="light-button" to="/products/enquire" onNavigate={navigate}>Start an enquiry <ArrowRight /></Link></section>
  </main>;
}

function GeoHubPage({ navigate }) {
  return <main className="venture-page geohub-page">
    <section className="venture-hero geohub-venture-hero"><img src={publicAsset('images/geohub-hero.jpg')} alt="Borehole drilling rig operating in a southern African landscape" fetchPriority="high" decoding="async" /><div className="venture-hero-shade" /><div className="venture-hero-copy"><p className="eyebrow light">GeoHub · Solid geoscience solutions</p><h1>Know the ground before you build, drill, or invest.</h1><p>Geoscience consulting and borehole advisory for farmers, mines, infrastructure teams, and construction projects across Botswana.</p><a className="primary-button" href="mailto:info@geohub.co.bw">Contact GeoHub <ArrowRight /></a></div></section>
    <section className="geohub-intro section"><div><p className="eyebrow">Technical services</p><h2>Field insight translated into practical decisions.</h2><p>GeoHub brings together groundwater, geological, environmental, surveying, and construction-ground services in one clear technical offering.</p></div><aside><strong>Mobile enquiries</strong><a href="tel:+26772633424">+267 72 633 424</a><strong>Email</strong><a href="mailto:info@geohub.co.bw">info@geohub.co.bw</a><strong>Website</strong><a href="https://www.geohub.co.bw" target="_blank" rel="noopener noreferrer">www.geohub.co.bw</a></aside></section>
    <section className="geohub-service-grid section">{geohubServices.map((service, index) => <article key={service.title}><img src={publicAsset(`images/${service.image}`)} alt={service.alt} loading="lazy" decoding="async" /><div><span>{String(index + 1).padStart(2, '0')}</span><h3>{service.title}</h3><p>{service.copy}</p></div></article>)}</section>
    <section className="venture-feature geohub-feature"><img src={publicAsset('images/geohub-geophysical.jpg')} alt="Geophysical survey equipment across exposed terrain" loading="lazy" decoding="async" /><div><p className="eyebrow">Survey before drilling</p><h2>Better subsurface understanding, fewer blind decisions.</h2><p>Geophysical surveys and pre-drilling advisory help clients assess site conditions, target groundwater investigations, and plan field activity with stronger evidence.</p><ul><li><Check />Geophysical survey planning</li><li><Check />Pre-drilling borehole advisory</li><li><Check />Geological exploration support</li><li><Check />Land surveying coordination</li></ul></div></section>
    <section className="venture-feature reverse geohub-feature"><img src={publicAsset('images/geohub-water-testing.jpg')} alt="Borehole water sampling and field testing equipment" loading="lazy" decoding="async" /><div><p className="eyebrow">Water and borehole assurance</p><h2>Testing, supervision, and reporting from field to handover.</h2><p>From drilling supervision to pumping tests, water testing, reporting, and registration, GeoHub supports the technical steps that turn a borehole project into a documented asset.</p><ul><li><Check />Drilling supervision and pumping tests</li><li><Check />Water tests and reporting</li><li><Check />Borehole registration support</li></ul></div></section>
    <section className="geohub-audiences section"><p className="eyebrow light">Who we support</p><h2>Technical clarity for land, water, and construction decisions.</h2><div><span>Farmers & landowners</span><span>Mines & exploration teams</span><span>Infrastructure projects</span><span>Construction professionals</span></div></section>
    <section className="cta-band geohub-cta"><div><p className="eyebrow light">Plan with evidence</p><h2>Bring GeoHub into the project early.</h2></div><a className="light-button" href="mailto:info@geohub.co.bw">Request a consultation <ArrowRight /></a></section>
  </main>;
}

function AboutPage({ settings, navigate, editMode = false, onEdit }) {
  return <main>
    <div className="editable-page-intro">{editMode && <EditTrigger label="Edit about page introduction" onClick={() => onEdit({ type: 'settings', title: 'About page', fields: [{ key: 'about_title', label: 'Page title' }, { key: 'about_body', label: 'About text', multiline: true }] })} />}<PageIntro eyebrow="About us" title={settings.about_title} copy="Real Metrics Holdings helps property owners and professionals show the market what makes a place worth considering." image={pageImages.about} /></div>
    <section className="about-page section"><div className="about-statement reveal"><p className="eyebrow">Real Metrics Holdings</p><h2>Local understanding. A sharper standard.</h2></div><div className="about-body reveal"><p>{settings.about_body}</p><p>Our work is grounded in honest information, strong visual judgement, and a smooth experience for both advertisers and property seekers.</p><Link className="text-link" to="/services" onNavigate={navigate}>Explore our approach <ArrowRight size={17} /></Link></div></section>
    <section className="page-slider-section"><SilentImageSlider images={aboutSlides} label="Residential property slideshow" /></section>
    <section className="about-principles section"><div><span>Botswana focused</span><p>Built around the local property market, its owners, professionals, buyers, and tenants.</p></div><div><span>Human reviewed</span><p>Every submitted listing is checked before publication to protect quality and trust.</p></div><div><span>Detail led</span><p>Strong images and accurate information work together to help people decide with confidence.</p></div></section>
    <section className="values-band"><article className="reveal"><ShieldCheck /><h3>Clear information</h3><p>Every campaign makes price, status, location, and key property details easy to understand.</p></article><article className="reveal"><Check /><h3>Considered presentation</h3><p>Photography and copy work together without overstatement or unnecessary noise.</p></article><article className="reveal"><MapPin /><h3>Botswana focused</h3><p>Our platform is shaped around the local property market and the people moving through it.</p></article></section>
    <section className="cta-band reveal"><div><p className="eyebrow light">A property worth presenting?</p><h2>Give it a clearer place in the market.</h2></div><Link className="light-button" to="/list-property" onNavigate={navigate}>Submit a property <ArrowRight size={18} /></Link></section>
  </main>;
}

function ProductEnquiryPage({ settings, navigate }) {
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true); setFormMessage('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get('name')).trim();
    const email = String(form.get('email')).trim().toLowerCase();
    const phone = String(form.get('phone')).trim();
    const organisation = String(form.get('organisation')).trim();
    const product = String(form.get('product')).trim();
    const quantity = String(form.get('quantity')).trim();
    const destination = String(form.get('destination')).trim();
    const notes = String(form.get('message')).trim();
    const message = `Product: ${product}\nQuantity / volume: ${quantity}\nDelivery destination: ${destination}\nOrganisation: ${organisation || 'Not provided'}\n\nAdditional requirements:\n${notes}`;
    try {
      if (!hasSupabase) throw new Error('Online enquiries are temporarily unavailable. Please email us directly.');
      const { error } = await supabase.rpc('submit_contact_inquiry', {
        p_name: name,
        p_email: email,
        p_phone: phone,
        p_inquiry_type: 'Food product enquiry',
        p_property_id: null,
        p_property_title: `Product enquiry: ${product}`,
        p_message: message,
        p_privacy_consent: form.get('privacy_consent') === 'on',
        p_honeypot: String(form.get('company_website') || ''),
      });
      if (error) throw error;
      setFormMessage('Your product enquiry has been saved. Your email application is opening with the details ready to send.');
      const subject = encodeURIComponent(`Food product enquiry: ${product} from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`);
      window.location.href = `mailto:${settings.email}?subject=${subject}&body=${body}`;
      formElement.reset();
    } catch (error) {
      setFormMessage(error.message || 'We could not save your enquiry. Please try again.');
    } finally { setSubmitting(false); }
  };
  return <main className="product-enquiry-page">
    <section className="product-enquiry-hero"><img src={publicAsset('images/food-products-hero.jpg')} alt="Grains, pulses, nuts, spices and specialty produce" fetchPriority="high" decoding="async" /><div><p className="eyebrow light">Food & agricultural products</p><h1>Tell us what you need.</h1><p>This enquiry is handled separately from property requests. Share the product, quantity, specification, and destination so the supply team can review your requirement.</p></div></section>
    <section className="contact-page product-enquiry-content section"><div className="contact-details reveal"><Link className="back-link" to="/products" onNavigate={navigate}>← Back to product portfolio</Link><p className="eyebrow">Product enquiry</p><h2>A clearer brief gets a faster answer.</h2><p>Please provide realistic quantities and any required grade, packaging, delivery date, or destination information. Availability and commercial terms are confirmed before any commitment.</p><img className="product-enquiry-side-image" src={publicAsset('images/food-grains.jpg')} alt="Sacks containing grains, legumes and nuts" loading="lazy" decoding="async" /><a href={`mailto:${settings.email}`}><Mail /><span><small>Email</small>{settings.email}</span></a><a href={`tel:${settings.phone.replaceAll(' ', '')}`}><Phone /><span><small>Phone</small>{settings.phone}</span></a></div><form className="contact-form product-enquiry-form reveal" onSubmit={submit}><label className="honeypot" aria-hidden="true">Company website<input name="company_website" tabIndex="-1" autoComplete="off" /></label><label>Your name *<input name="name" autoComplete="name" minLength="2" maxLength="80" required /></label><label>Organisation<input name="organisation" autoComplete="organization" maxLength="120" /></label><label>Email address *<input name="email" type="email" autoComplete="email" maxLength="120" required /></label><label>Phone number *<input name="phone" type="tel" autoComplete="tel" inputMode="tel" pattern="[+0-9][0-9 ()-]{6,19}" title="Enter a valid phone number using digits, spaces, brackets, + or -." required /></label><label>Product required *<select name="product" defaultValue="" required><option value="" disabled>Select a product</option>{productGroups.flatMap((group) => group.items).map((item) => <option key={item}>{item}</option>)}<option>Multiple products</option></select></label><label>Quantity or volume *<input name="quantity" maxLength="100" placeholder="e.g. 20 tonnes or 100 × 25 kg bags" required /></label><label className="wide">Delivery destination *<input name="destination" maxLength="160" placeholder="Town, district, or country" required /></label><label className="wide">Specifications and additional requirements *<textarea name="message" rows="7" minLength="20" maxLength="1500" placeholder="Tell us about grade, packaging, preferred delivery timing, intended use, or the mix of products required." required /></label><label className="consent-row wide"><input name="privacy_consent" type="checkbox" required /><span>I agree to the processing of my information as explained in the <a href={`${basePath}/privacy`} target="_blank" rel="noopener noreferrer">Privacy Notice</a> and accept the <a href={`${basePath}/terms`} target="_blank" rel="noopener noreferrer">Terms of Service</a>. *</span></label><button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Saving enquiry…' : 'Send product enquiry'} <Send size={17} /></button>{formMessage && <p className="contact-form-message wide" role="status">{formMessage}</p>}</form></section>
  </main>;
}

function ContactPage({ settings, property, editMode = false, onEdit }) {
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const propertySummary = property ? `${property.title} — ${property.location} — ${property.price}\nStatus: ${property.status}\nCategory: ${property.category}\nBedrooms: ${property.beds || 'Studio'}\nBathrooms: ${property.baths}\nSize: ${property.size || 'Not specified'}\n\n${property.description}` : '';
  const propertyImage = property ? (property.images?.[0] || publicAsset('real-metrics-logo-transparent.png')) : '';
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
    <div className="editable-page-intro">{editMode && <EditTrigger label="Edit contact page" onClick={() => onEdit({ type: 'settings', title: 'Contact page', fields: [{ key: 'contact_intro', label: 'Page introduction', multiline: true }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'address', label: 'Address' }] })} />}<PageIntro eyebrow="Contact" title="Let's talk property." copy={settings.contact_intro} image={pageImages.contact} /></div>
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

function EditTrigger({ label, onClick, className = '' }) {
  return <button className={`live-edit-button ${className}`} type="button" onClick={onClick} aria-label={label}><Pencil size={14} />Edit</button>;
}

function LiveEditPanel({ editor, data, onClose, onCommit }) {
  const property = editor.type === 'property' ? data.properties.find((item) => item.id === editor.id) : null;
  const service = editor.type === 'service' ? data.services.find((item) => item.id === editor.id) : null;
  const section = editor.type === 'section' && editor.id ? (data.settings.custom_sections || []).find((item) => item.id === editor.id) : null;
  const source = editor.type === 'settings' ? Object.fromEntries(editor.fields.map((field) => [field.key, data.settings[field.key] || ''])) : property || service || section || { id: crypto.randomUUID(), title: '', body: '' };
  const [draft, setDraft] = useState(source);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const definitions = editor.type === 'settings' ? editor.fields : editor.type === 'property' ? [
    { key: 'title', label: 'Property title' }, { key: 'location', label: 'Location' }, { key: 'price', label: 'Price' },
    { key: 'status', label: 'Status', options: ['Available', 'For Sale', 'For Rent', 'Sold', 'Rented', 'Tenanted'] },
    { key: 'category', label: 'Category' }, { key: 'beds', label: 'Bedrooms', type: 'number' }, { key: 'baths', label: 'Bathrooms', type: 'number' },
    { key: 'size', label: 'Size' }, { key: 'featured', label: 'Featured on homepage', type: 'checkbox' }, { key: 'description', label: 'Description', multiline: true },
  ] : editor.type === 'service' ? [{ key: 'title', label: 'Service title' }, { key: 'description', label: 'Description', multiline: true }] : [{ key: 'title', label: 'Section title' }, { key: 'body', label: 'Section text', multiline: true }];
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    let next = data;
    if (editor.type === 'settings') next = { ...data, settings: { ...data.settings, ...draft } };
    if (editor.type === 'property') next = { ...data, properties: data.properties.map((item) => item.id === editor.id ? { ...item, ...draft } : item) };
    if (editor.type === 'service') next = { ...data, services: data.services.map((item) => item.id === editor.id ? { ...item, ...draft } : item) };
    if (editor.type === 'section') {
      const sections = data.settings.custom_sections || [];
      next = { ...data, settings: { ...data.settings, custom_sections: editor.id ? sections.map((item) => item.id === editor.id ? { ...item, ...draft } : item) : [...sections, draft] } };
    }
    try { await onCommit(next); }
    catch (saveError) { setError(saveError.message || 'The change could not be saved.'); setSaving(false); }
  };
  const removeSection = async () => {
    const next = { ...data, settings: { ...data.settings, custom_sections: (data.settings.custom_sections || []).filter((item) => item.id !== editor.id) } };
    setSaving(true);
    try { await onCommit(next); } catch (saveError) { setError(saveError.message || 'The section could not be deleted.'); setSaving(false); }
  };
  return <div className="live-editor-overlay" role="dialog" aria-modal="true" aria-label="Edit live website content"><form className="live-editor-panel" onSubmit={submit}><header><div><span>Live editor</span><h2>{editor.title || (editor.id ? 'Edit content' : 'Add section')}</h2></div><button type="button" onClick={onClose} aria-label="Close editor"><X /></button></header><div className="live-editor-fields">{definitions.map((field) => field.type === 'checkbox' ? <label className="live-editor-check" key={field.key}><input type="checkbox" checked={Boolean(draft[field.key])} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.checked }))} />{field.label}</label> : <label key={field.key}>{field.label}{field.options ? <select value={draft[field.key] || ''} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : field.multiline ? <textarea rows="6" value={draft[field.key] || ''} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))} /> : <input type={field.type || 'text'} value={draft[field.key] ?? ''} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: field.type === 'number' ? Number(event.target.value) : event.target.value }))} />}</label>)}</div>{error && <p className="live-editor-error">{error}</p>}<footer>{editor.type === 'section' && editor.id && <button className="live-editor-delete" type="button" onClick={removeSection}>Delete section</button>}<button className="primary-button" type="submit" disabled={saving}><Save size={16} />{saving ? 'Publishing…' : 'Publish change'}</button></footer></form></div>;
}

function LiveEditorBar({ path, onAddSection }) {
  return <aside className="live-editor-bar"><span><Pencil size={15} />Live editing</span>{path === '/' && <button type="button" onClick={onAddSection}><Plus size={15} />Add section</button>}<a href={`${basePath}/admin`}>Back to dashboard</a></aside>;
}

function Header({ path, navigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [['/', 'Home'], ['/properties', 'Properties'], ['/services', 'Services'], ['/about', 'About'], ['/contact', 'Contact']];
  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);
  const closeAndNavigate = (next) => { setMenuOpen(false); navigate(next); };
  return <header className="site-header"><Link className="brand" to="/" onNavigate={navigate} aria-label="Real Metrics Holdings home"><img src={publicAsset('real-metrics-logo-transparent.png')} alt="Real Metrics Holdings" decoding="async" /></Link><nav id="primary-navigation" className={`nav ${menuOpen ? 'open' : ''}`} aria-label="Primary navigation">{links.map(([to, label]) => <Link key={to} className={path === to ? 'active' : ''} to={to} onNavigate={closeAndNavigate}>{label}</Link>)}<Link className="mobile-nav-cta" to="/list-property" onNavigate={closeAndNavigate}>List your property <ArrowRight size={17} /></Link></nav><Link className="header-cta" to="/list-property" onNavigate={navigate}>List your property <ArrowRight size={16} /></Link><button className={`menu-button ${menuOpen ? 'open' : ''}`} type="button" onClick={() => setMenuOpen((current) => !current)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="primary-navigation"><span className="menu-icon" aria-hidden="true"><i /><i /><i /></span></button></header>;
}

function Footer({ settings, navigate, editMode = false, onEdit }) {
  return <footer className="site-footer">{editMode && <EditTrigger label="Edit contact details" className="footer-live-edit" onClick={() => onEdit({ type: 'settings', title: 'Contact details', fields: [{ key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'address', label: 'Address' }] })} />}<div className="footer-main"><div className="footer-brand"><img src={publicAsset('real-metrics-logo-transparent.png')} alt="Real Metrics Holdings" loading="lazy" decoding="async" /><p>Professional property advertising and listing presentation across Botswana.</p></div><div className="footer-links"><h3>Company</h3><Link to="/about" onNavigate={navigate}>About</Link><Link to="/services" onNavigate={navigate}>Services</Link><Link to="/products" onNavigate={navigate}>Food products</Link><Link to="/geohub" onNavigate={navigate}>GeoHub</Link><Link to="/properties" onNavigate={navigate}>Properties</Link><Link to="/list-property" onNavigate={navigate}>List a property</Link></div><div className="footer-links"><h3>Legal</h3><Link to="/privacy" onNavigate={navigate}>Privacy notice</Link><Link to="/terms" onNavigate={navigate}>Terms of service</Link></div><div className="footer-links"><h3>Contact</h3><a href={`mailto:${settings.email}`}>{settings.email}</a><a href={`tel:${settings.phone.replaceAll(' ', '')}`}>{settings.phone}</a><span>{settings.address}</span></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Real Metrics Holdings</span><a href="https://futurifydesigns.com" target="_blank" rel="noopener noreferrer">Built by Futurify Designs</a></div></footer>;
}

function NotFoundPage({ navigate }) {
  return <main className="not-found-page section"><p className="eyebrow">404</p><h1>That page is not here.</h1><p>The address may have changed, or the page may no longer be available.</p><Link className="primary-button" to="/" onNavigate={navigate}>Return home <ArrowRight size={16} /></Link></main>;
}

function App() {
  const [data, setData] = useState(initialCmsData);
  const [path, setPath] = useState(currentPath());
  const [liveEditing] = useState(() => new URLSearchParams(window.location.search).get('edit') === '1');
  const [liveAuthorized, setLiveAuthorized] = useState(false);
  const [editor, setEditor] = useState(null);
  useEffect(() => { loadCmsData().then(setData); }, []);
  useEffect(() => {
    const page = seoPages[path] || notFoundSeo;
    const canonicalPath = page.noindex ? '/' : path;
    const canonical = `${siteUrl}${canonicalPath === '/' ? '/' : canonicalPath}`;
    document.title = page.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', page.description);
    document.querySelector('meta[name="robots"]')?.setAttribute('content', page.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', page.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', page.description);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
  }, [path]);
  useEffect(() => {
    if (!liveEditing || !hasSupabase) return;
    supabase.auth.getSession().then(({ data: authData }) => setLiveAuthorized(authData.session?.user?.email?.toLowerCase() === 'info@realmetricsholdings.com'));
  }, [liveEditing]);
  useEffect(() => { const sync = () => setPath(currentPath()); window.addEventListener('popstate', sync); return () => window.removeEventListener('popstate', sync); }, []);
  useEffect(() => {
    if (path === '/admin') return undefined;
    window.scrollTo({ top: 0, behavior: 'instant' });
    const elements = Array.from(document.querySelectorAll('.reveal'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [data, path]);
  const navigate = (next) => setPath(next);
  const editMode = liveEditing && liveAuthorized;
  const commitLiveChange = async (next) => { await saveCmsData(next); setData(next); setEditor(null); };
  const page = useMemo(() => {
    if (!data) return null;
    if (path === '/admin') return <Admin data={data} setData={setData} onSave={saveCmsData} />;
    if (path === '/properties') return <PropertiesPage properties={data.properties} navigate={navigate} editMode={editMode} onEdit={setEditor} />;
    if (path.startsWith('/properties/')) {
      let propertyId = '';
      try { propertyId = decodeURIComponent(path.slice('/properties/'.length)); } catch { return <NotFoundPage navigate={navigate} />; }
      const property = data.properties.find((item) => String(item.id) === propertyId);
      return property ? <PropertyDetailsPage property={property} navigate={navigate} editMode={editMode} onEdit={setEditor} /> : <NotFoundPage navigate={navigate} />;
    }
    if (path === '/services') return <ServicesPage services={data.services} navigate={navigate} editMode={editMode} onEdit={setEditor} />;
    if (path === '/products') return <FoodProductsPage navigate={navigate} />;
    if (path === '/products/enquire') return <ProductEnquiryPage settings={data.settings} navigate={navigate} />;
    if (path === '/geohub') return <GeoHubPage navigate={navigate} />;
    if (path === '/about') return <AboutPage settings={data.settings} navigate={navigate} editMode={editMode} onEdit={setEditor} />;
    if (path === '/contact') {
      const propertyId = new URLSearchParams(window.location.search).get('property');
      return <ContactPage settings={data.settings} property={data.properties.find((item) => String(item.id) === propertyId)} editMode={editMode} onEdit={setEditor} />;
    }
    if (path === '/list-property') return <PropertySubmissionPage pageImage={pageImages.submission} />;
    if (path === '/privacy') return <PrivacyPage settings={data.settings} />;
    if (path === '/terms') return <TermsPage settings={data.settings} />;
    if (path === '/') return <HomePage data={data} navigate={navigate} editMode={editMode} onEdit={setEditor} />;
    return <NotFoundPage navigate={navigate} />;
  }, [data, path, editMode]);
  if (!data) return <><Header path={path} navigate={navigate} /><main className="page-pending" aria-busy="true" /></>;
  if (path === '/admin') return page;
  return <><Header path={path} navigate={navigate} />{editMode && <LiveEditorBar path={path} onAddSection={() => setEditor({ type: 'section', title: 'Add homepage section' })} />}{page}<Footer settings={data.settings} navigate={navigate} editMode={editMode} onEdit={setEditor} />{editor && <LiveEditPanel key={`${editor.type}-${editor.id || 'new'}`} editor={editor} data={data} onClose={() => setEditor(null)} onCommit={commitLiveChange} />}</>;
}

createRoot(document.getElementById('root')).render(<App />);
