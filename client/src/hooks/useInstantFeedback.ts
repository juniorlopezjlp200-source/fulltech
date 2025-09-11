import { useCallback, useRef } from 'react';

export function useInstantFeedback() {
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerInstantFeedback = useCallback((element: HTMLElement, callback: () => void) => {
    // Clear any previous timeout
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    // Add instant visual feedback
    element.style.transform = 'scale(0.98)';
    element.style.transition = 'transform 0.05s ease-out';
    
    // Execute the callback immediately (navigation)
    callback();
    
    // Reset the visual state
    feedbackTimeoutRef.current = setTimeout(() => {
      element.style.transform = 'scale(1)';
      setTimeout(() => {
        element.style.transition = '';
      }, 100);
    }, 50);
  }, []);

  const createInstantClickHandler = useCallback((callback: () => void) => {
    return (event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      const element = event.currentTarget;
      triggerInstantFeedback(element, callback);
    };
  }, [triggerInstantFeedback]);

  return {
    createInstantClickHandler,
    triggerInstantFeedback
  };
}