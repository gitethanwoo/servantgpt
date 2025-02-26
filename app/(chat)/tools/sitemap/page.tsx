'use client';

import { VisualSitemapTool } from '@/components/visual-sitemap-tool';
import { ToolHeader } from '@/components/tool-header';

export default function SitemapPage() {
  return (
    <>
      <ToolHeader selectedToolId="sitemap" />
      <div className="p-6">
        <VisualSitemapTool />
      </div>
    </>
  );
} 