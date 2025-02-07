import type { Attachment } from 'ai';

import { LoaderIcon } from './icons';

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  onRemove,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
}) => {
  const { name, url, contentType } = attachment;

  return (
    <div className="flex flex-col relative group">
      <div className="w-28 h-24 aspect-video bg-muted/50 border border-zinc-300 rounded-md relative flex flex-col items-center justify-center">
        {!isUploading && onRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -right-1.5 -top-1.5 size-4 rounded-full border border-white bg-zinc-500 hover:bg-primary/90 text-white flex items-center justify-center z-10"
          >
            <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 1.5L8.5 8.5M1.5 8.5L8.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        
        {contentType ? (
          contentType.startsWith('image') ? (
            // NOTE: it is recommended to use next/image for images
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={name ?? 'An image attachment'}
              className="rounded-md size-full object-cover"
            />
          ) : (
            <div className="" />
          )
        ) : (
          <div className="" />
        )}

        {isUploading && (
          <div className="animate-spin absolute text-zinc-500">
            <LoaderIcon />
          </div>
        )}
      </div>
    </div>
  );
};
