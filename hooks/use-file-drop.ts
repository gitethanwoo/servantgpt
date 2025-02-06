import { useState, useEffect, type DragEvent } from 'react';

export function useFileDrop() {
  const [isDragging, setIsDragging] = useState(false);
  
  useEffect(() => {
    let dragCounter = 0;

    function handleDragOver(e: DragEvent<HTMLElement> | any) {
      e.preventDefault();
      e.stopPropagation();
    }

    function handleDrop(e: DragEvent<HTMLElement> | any) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      setIsDragging(false);
    }

    function handleDragEnter(e: DragEvent<HTMLElement> | any) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      setIsDragging(true);
    }

    function handleDragLeave(e: DragEvent<HTMLElement> | any) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    }

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
    };
  }, []);

  return { isDragging };
} 