import { ArrowRight, Bath, BedDouble, MapPin, MoveUpRight, Ruler } from 'lucide-react';
import { useEffect, useState } from 'react';

const statusClass = (status) => `status status-${String(status).toLowerCase().replaceAll(' ', '-')}`;

export function PropertyCard({ property, contactHref = '/contact', detailHref, onNavigate }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const images = property.images?.length ? property.images : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85'];

  useEffect(() => {
    setImageIndex(0);
  }, [property.id]);

  useEffect(() => {
    if (paused || images.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setImageIndex((current) => (current + 1) % images.length), 4200);
    return () => window.clearInterval(timer);
  }, [images.length, paused]);

  const next = () => setImageIndex((current) => (current + 1) % images.length);
  const prev = () => setImageIndex((current) => (current - 1 + images.length) % images.length);
  const follow = (event, href) => {
    if (!onNavigate || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState({}, '', href);
    const url = new URL(href, window.location.origin);
    const appBase = import.meta.env.BASE_URL.replace(/\/$/, '');
    onNavigate(url.pathname.startsWith(appBase) ? url.pathname.slice(appBase.length) || '/' : url.pathname);
  };

  return (
    <article className={`property-card reveal${property.featured ? ' featured-card' : ''}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      <div className="property-media">
        {images.map((image, index) => <img className={index === imageIndex ? 'active' : ''} src={image} alt={index === imageIndex ? `${property.title}, gallery image ${index + 1}` : ''} aria-hidden={index !== imageIndex} key={image} />)}
        <a className="property-media-link" href={detailHref} onClick={(event) => follow(event, detailHref)} aria-label={`View full details for ${property.title}`} />
        <span className={statusClass(property.status)}>{property.status}</span>
        {property.featured && <span className="featured-pill">Featured</span>}
        {images.length > 1 && (
          <div className="property-gallery-ui">
            <div className="property-card-dots" aria-label={`${property.title} image slideshow`}>{images.map((image, index) => <button type="button" className={index === imageIndex ? 'active' : ''} onClick={() => setImageIndex(index)} aria-label={`Show image ${index + 1}`} key={image} />)}</div>
            <div className="slider-controls"><button type="button" onClick={prev} aria-label="Previous image">‹</button><span>{imageIndex + 1}/{images.length}</span><button type="button" onClick={next} aria-label="Next image">›</button></div>
          </div>
        )}
      </div>
      <div className="property-body">
        <div className="property-card-heading">
          <p className="eyebrow">{property.category}</p><strong>{property.price}</strong>
        </div>
        <div>
          <h3><a href={detailHref} onClick={(event) => follow(event, detailHref)}>{property.title}</a></h3>
          <p className="location"><MapPin size={15} />{property.location}</p>
        </div>
        <p className="property-description">{property.description}</p>
        <div className="property-meta">
          <span><BedDouble size={16} />{property.beds || 'Studio'}</span>
          <span><Bath size={16} />{property.baths}</span>
          <span><Ruler size={16} />{property.size}</span>
        </div>
        <div className="property-footer">
          <a className="property-details-button" href={detailHref} onClick={(event) => follow(event, detailHref)}>View details <ArrowRight size={16} /></a>
          <a className="property-enquire-link" href={contactHref} onClick={(event) => follow(event, contactHref)} aria-label={`Ask about ${property.title}`}>Enquire <MoveUpRight size={16} /></a>
        </div>
      </div>
    </article>
  );
}
