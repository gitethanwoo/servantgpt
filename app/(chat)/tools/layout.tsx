import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Tools Suite',
  description: 'Access a suite of AI-powered tools for transcription, analysis, and visualization',
  keywords: 'AI tools, transcription, sentiment analysis, sitemap generator, YouTube transcript',
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* The header will be provided by each tool page */}
      <div className="container mx-auto h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
} 