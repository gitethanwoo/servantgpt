'use client';

import cx from 'classnames';

export interface Citation {
  id: number;
  url: string;
  text: string;
}

export function Citations({
  citations = [],
  className,
}: {
  citations: Citation[];
  className?: string;
}) {
  console.log('🎯 Citations Component Received:', citations);

  if (!citations.length) {
    console.log('⚠️ No citations to render');
    return null;
  }

  console.log('🎨 Rendering citations:', citations);
  return (
    <div className={cx('flex flex-wrap gap-2', className)}>
      {citations.map((citation) => (
        <a
          key={citation.id}
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800 transition-colors"
        >
          [{citation.id}] {citation.text}
        </a>
      ))}
    </div>
  );
} 