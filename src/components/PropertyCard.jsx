import { Bath, BedDouble, MapPin, MoveUpRight, Ruler } from 'lucide-react';
import { useState } from 'react';

const statusClass = (status) => `status status-${String(status).toLowerCase().replaceAll(' ', '-')}`;

export function PropertyCard({ property, contactHref = '/contact' }) {
  const [imageIndex, setImageIndex] = useState(0);
  const images = property.images?.length ? property.images : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85'];

  const next = () => setImageIndex((current) => (current + 1) % images.length);
  const prev = () => setImageIndex((current) => (current - 1 + images.length) % images.length);

  return (
    <article className="property-card reveal">
      <div className="property-media">
        <img src={images[imageIndex]} alt={property.title} />
        <span className={statusClass(property.status)}>{property.status}</span>
        {property.featured && <span className="featured-pill">Featured</span>}
        {images.length > 1 && (
          <div className="slider-controls" aria-label={`${property.title} image slideshow`}>
            <button type="button" onClick={prev} aria-label="Previous image">‹</button>
            <button type="button" onClick={next} aria-label="Next image">›</button>
          </div>
        )}
      </div>
      <div className="property-body">
        <div>
          <p className="eyebrow">{property.category}</p>
          <h3>{property.title}</h3>
          <p className="location"><MapPin size={15} />{property.location}</p>
        </div>
        <p className="property-description">{property.description}</p>
        <div className="property-meta">
          <span><BedDouble size={16} />{property.beds || 'Studio'}</span>
          <span><Bath size={16} />{property.baths}</span>
          <span><Ruler size={16} />{property.size}</span>
        </div>
        <div className="property-footer">
          <strong>{property.price}</strong>
          <a href={contactHref} aria-label={`Ask about ${property.title}`}>Enquire <MoveUpRight size={16} /></a>
        </div>
      </div>
    </article>
  );
}
