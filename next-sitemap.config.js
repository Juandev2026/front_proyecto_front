/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://tudominio.com',
  generateRobotsTxt: false, // We already have robots.txt
  exclude: ['/admin/*', '/login', '/register', '/forgot-password', '/reset-password'],
  generateIndexSitemap: false,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  // Optional: Add additional paths
  additionalPaths: async (config) => [
    await config.transform(config, '/'),
    await config.transform(config, '/about'),
    await config.transform(config, '/news'),
    await config.transform(config, '/cursos'),
    await config.transform(config, '/materials'),
  ],
}
