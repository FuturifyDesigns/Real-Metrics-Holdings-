import { mkdir, readFile, writeFile } from 'node:fs/promises';

const siteUrl = 'https://realmetricsholdings.com';
const pages = [
  { path: '', title: 'Real Metrics Holdings | Property Advertising in Botswana', description: 'Real Metrics Holdings provides professional property advertising and listings in Botswana, alongside food products and GeoHub geoscience consulting services.' },
  { path: 'properties', title: 'Properties for Sale and Rent | Real Metrics Holdings', description: 'Explore professionally presented residential, rental, and commercial property listings in Botswana.' },
  { path: 'services', title: 'Property Advertising Services | Real Metrics Holdings', description: 'Property campaign strategy, listing copy, showcase pages, and market-ready presentation for Botswana property owners and professionals.' },
  { path: 'products', title: 'Food & Agricultural Products | Real Metrics Holdings', description: 'Explore salts, grains, cereals, legumes, nuts, spices, roots, and specialty produce for wholesale and commercial enquiries.' },
  { path: 'geohub', title: 'GeoHub Geoscience Consulting Botswana | Real Metrics Holdings', description: 'Borehole advisory, water testing, geophysical surveys, geological exploration, land surveying, environmental assessments, and soil testing in Botswana.' },
  { path: 'about', title: 'About Real Metrics Holdings | Botswana', description: 'Learn about Real Metrics Holdings and its approach to clear information, strong presentation, and trusted service in Botswana.' },
  { path: 'contact', title: 'Contact Real Metrics Holdings | Botswana', description: 'Contact Real Metrics Holdings about property advertising, listings, partnerships, and general enquiries in Botswana.' },
  { path: 'list-property', title: 'List Your Property | Real Metrics Holdings', description: 'Submit a Botswana property for review and professional presentation by Real Metrics Holdings.' },
  { path: 'privacy', title: 'Privacy Notice | Real Metrics Holdings', description: 'Read how Real Metrics Holdings collects, uses, protects, and retains personal information.' },
  { path: 'terms', title: 'Terms of Service | Real Metrics Holdings', description: 'Read the terms that apply when using the Real Metrics Holdings website and services.' },
  { path: 'products/enquire', title: 'Food Product Enquiry | Real Metrics Holdings', description: 'Send a private food and agricultural product sourcing enquiry to Real Metrics Holdings.', noindex: true },
  { path: 'admin', title: 'Admin | Real Metrics Holdings', description: 'Private website administration.', noindex: true },
];

const template = await readFile('dist/index.html', 'utf8');

for (const page of pages) {
  if (!page.path) continue;
  const canonical = `${siteUrl}/${page.path}`;
  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${page.description}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${page.title}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${page.description}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta name="robots" content="[^"]*"\s*\/>/, `<meta name="robots" content="${page.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}" />`)
    .replace(/<meta name="googlebot" content="[^"]*"\s*\/>/, `<meta name="googlebot" content="${page.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}" />`);
  await mkdir(`dist/${page.path}`, { recursive: true });
  await writeFile(`dist/${page.path}/index.html`, html);
}

const notFound = template
  .replace(/<title>[^<]*<\/title>/, '<title>Page Not Found | Real Metrics Holdings</title>')
  .replace(/<meta name="description" content="[^"]*"\s*\/>/, '<meta name="description" content="The requested page could not be found." />')
  .replace(/<meta name="robots" content="[^"]*"\s*\/>/, '<meta name="robots" content="noindex, nofollow" />')
  .replace(/<meta name="googlebot" content="[^"]*"\s*\/>/, '<meta name="googlebot" content="noindex, nofollow" />');
await writeFile('dist/404.html', notFound);
