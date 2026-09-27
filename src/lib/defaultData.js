export const defaultSettings = {
  brand_name: 'Real Metrics Holdings',
  hero_title: 'Homes presented with purpose.',
  hero_subtitle:
    'Thoughtful property advertising for sellers, landlords, agents, and developers across Botswana.',
  email: 'info@realmetricsholdings.com',
  phone: '+267 72 633 424',
  address: 'Gaborone, Botswana',
  about_title: 'Property presentation with a local point of view.',
  about_body: 'We started Real Metrics Holdings to give Botswana property a more considered place in the market. Each listing is shaped to feel clear, credible, and worth someone’s time.',
  contact_intro: 'Whether you are selling, letting, or launching a development, tell us what you need to bring to market.',
  custom_sections: [],
};

export const defaultProperties = [
  {
    id: 'kgale-view',
    title: 'Kgale View Executive Home',
    location: 'Kgale, Gaborone',
    price: 'BWP 3,850,000',
    status: 'For Sale',
    category: 'Residential',
    beds: 4,
    baths: 3,
    size: '420 sqm',
    featured: true,
    description:
      'A high-visibility campaign for a modern executive residence with expansive interiors, secure parking, and a premium buyer-ready image set.',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85',
    ],
  },
  {
    id: 'cbd-apartment',
    title: 'Central Business Apartment',
    location: 'CBD, Gaborone',
    price: 'BWP 12,500 / month',
    status: 'Available',
    category: 'Apartment',
    beds: 2,
    baths: 2,
    size: '118 sqm',
    featured: true,
    description:
      'Modern city living positioned for professionals who need access, security, and polished presentation.',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=85',
    ],
  },
  {
    id: 'phakalane-residence',
    title: 'Phakalane Family Residence',
    location: 'Phakalane',
    price: 'BWP 22,000 / month',
    status: 'Tenanted',
    category: 'Residential',
    beds: 5,
    baths: 4,
    size: '610 sqm',
    featured: false,
    description:
      'A complete property advertising example for landlord campaigns and executive tenant placement.',
    images: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85',
    ],
  },
  {
    id: 'airport-junction-office',
    title: 'Airport Junction Commercial Suite',
    location: 'Block 10, Gaborone',
    price: 'Price on request',
    status: 'Rented',
    category: 'Commercial',
    beds: 0,
    baths: 2,
    size: '260 sqm',
    featured: false,
    description:
      'Commercial placement with clean lead generation and tenant-facing details for leasing teams.',
    images: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85',
    ],
  },
];

export const defaultServices = [
  {
    id: 'listing-campaigns',
    title: 'Listing Campaigns',
    description:
      'Structured property adverts with sharp copy, rich media, and placement-ready details for sale, rental, and tenancy campaigns.',
    icon: 'megaphone',
    sort_order: 1,
  },
  {
    id: 'showcase-pages',
    title: 'Showcase Pages',
    description:
      'Professional property pages with image slideshows, status badges, feature highlights, and inquiry actions.',
    icon: 'layout',
    sort_order: 2,
  },
  {
    id: 'market-presentation',
    title: 'Market Presentation',
    description:
      'Clean visuals, buyer-friendly messaging, and campaign polish for developers, landlords, and agencies.',
    icon: 'chart',
    sort_order: 3,
  },
];

export const defaultTestimonials = [
  {
    id: 'owner',
    name: 'Property Owner',
    role: 'Gaborone',
    quote:
      'The listing looked premium from the first impression and helped position the property with the right buyers.',
    sort_order: 1,
  },
  {
    id: 'partner',
    name: 'Letting Partner',
    role: 'Botswana',
    quote:
      'Real Metrics makes property advertising feel organized, polished, and easy to update.',
    sort_order: 2,
  },
];
