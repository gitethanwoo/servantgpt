import { VisualSitemapTool } from '@/components/visual-sitemap-tool';

export const metadata = {
  title: 'Visual Sitemap Generator',
  description: 'Generate visual sitemaps for websites and export to Figma',
};

export default function SitemapPage() {
  return (
    <div className="mt-8">
      <VisualSitemapTool />
    </div>
  );
} 