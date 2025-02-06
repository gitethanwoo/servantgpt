import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon } from './icons';

interface DragOverlayProps {
  isVisible: boolean;
}

export function DragOverlay({ isVisible }: DragOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="rounded-full bg-muted p-6">
              <ImageIcon className="size-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Drop your files here</h3>
            <p className="text-sm text-muted-foreground">
              Upload files by dropping them anywhere on this window
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 