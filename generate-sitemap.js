import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import path from 'path';

// ✅ Your domain
const hostname = 'https://www.compliance-ease.com';

// ✅ Static routes from your Router
const routes = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/login', changefreq: 'monthly', priority: 0.5 },
    { url: '/signup', changefreq: 'monthly', priority: 0.6 },
    { url: '/free-trial', changefreq: 'weekly', priority: 0.8 },
    { url: '/demo', changefreq: 'weekly', priority: 0.8 },
    { url: '/automation', changefreq: 'weekly', priority: 0.7 },
    { url: '/compliance-assessment', changefreq: 'weekly', priority: 0.7 },
    { url: '/dashboard', changefreq: 'weekly', priority: 0.7 },
    { url: '/subscription', changefreq: 'monthly', priority: 0.6 },
    { url: '/subscription-success', changefreq: 'monthly', priority: 0.6 },
];

// ✅ Dynamic route template (ReportDetail)
const dynamicRoutes = [
    // Example static IDs — replace with real report IDs from DB later
    { url: '/report/1', changefreq: 'weekly', priority: 0.6 },
    { url: '/report/2', changefreq: 'weekly', priority: 0.6 },
];

const sitemap = new SitemapStream({ hostname });

// Write routes
[...routes, ...dynamicRoutes].forEach(route => sitemap.write(route));
sitemap.end();

// Save to dist/sitemap.xml after build
streamToPromise(sitemap).then(sm => {
    const outputPath = path.resolve('./dist/sitemap.xml');
    createWriteStream(outputPath).write(sm.toString());
    console.log(`✅ Sitemap generated at ${outputPath}`);
});
