'use client';

import { useEffect, useRef, useState } from 'react';

interface SpeechBubbleProps {
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  petColor?: string;
}

export default function SpeechBubble({ message, position = 'bottom', petColor = '#d4a5c7' }: SpeechBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [adjustedStyle, setAdjustedStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!bubbleRef.current) return;

    const updatePosition = () => {
      const bubble = bubbleRef.current;
      if (!bubble) return;

      const parent = bubble.parentElement;
      if (!parent) return;

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 10;

      // Get bubble dimensions (need to measure after render)
      const bubbleRect = bubble.getBoundingClientRect();
      const bubbleWidth = bubbleRect.width || 200;
      const bubbleHeight = bubbleRect.height || 60;

      // Get parent (pet) position
      const parentRect = parent.getBoundingClientRect();
      const parentCenterX = parentRect.left + parentRect.width / 2;
      const parentCenterY = parentRect.top + parentRect.height / 2;

      // Calculate preferred position
      let finalPosition = position;
      let style: React.CSSProperties = {};

      // On small screens, prefer top/bottom over left/right
      if (viewportWidth < 640 && (position === 'left' || position === 'right')) {
        const topSpace = parentCenterY;
        const bottomSpace = viewportHeight - parentCenterY;
        if (topSpace > bottomSpace && topSpace > bubbleHeight + 20) {
          finalPosition = 'top';
        } else if (bottomSpace > bubbleHeight + 20) {
          finalPosition = 'bottom';
        } else {
          finalPosition = 'bottom'; // Default to bottom if neither fits well
        }
      }

      // Calculate position based on final position
      // Use CSS-based positioning with viewport constraints
      if (finalPosition === 'bottom') {
        const bubbleTop = parentRect.bottom + 8;
        if (bubbleTop + bubbleHeight > viewportHeight - padding) {
          // Switch to top if bottom doesn't fit
          finalPosition = 'top';
          style = {
            bottom: '100%',
            marginBottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: `min(200px, ${viewportWidth - 2 * padding}px)`,
            right: 'auto',
          };
        } else {
          style = {
            top: '100%',
            marginTop: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: `min(200px, ${viewportWidth - 2 * padding}px)`,
            right: 'auto',
          };
        }
      } else if (finalPosition === 'top') {
        const bubbleBottom = parentRect.top - 8;
        if (bubbleBottom - bubbleHeight < padding) {
          // Switch to bottom if top doesn't fit
          finalPosition = 'bottom';
          style = {
            top: '100%',
            marginTop: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: `min(200px, ${viewportWidth - 2 * padding}px)`,
            right: 'auto',
          };
        } else {
          style = {
            bottom: '100%',
            marginBottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: `min(200px, ${viewportWidth - 2 * padding}px)`,
            right: 'auto',
          };
        }
      } else if (finalPosition === 'right') {
        const availableWidth = viewportWidth - parentRect.right - padding - 8;
        style = {
          left: '100%',
          marginLeft: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          maxWidth: `min(200px, ${Math.max(120, availableWidth)}px)`,
          right: 'auto',
        };
      } else { // left
        const availableWidth = parentRect.left - padding - 8;
        style = {
          right: '100%',
          marginRight: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          maxWidth: `min(200px, ${Math.max(120, availableWidth)}px)`,
          left: 'auto',
        };
      }

      setAdjustedStyle(style);
    };

    // Initial calculation
    updatePosition();

    // Update on resize
    const handleResize = () => {
      updatePosition();
    };
    window.addEventListener('resize', handleResize);
    
    // Also update after a short delay to ensure bubble is rendered
    const timeoutId = setTimeout(updatePosition, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [message, position]);

  // Use pet color for border, with some opacity
  const borderColor = `${petColor}cc`; // Add alpha channel (80% opacity)
  const arrowColor = petColor;

  // Determine arrow position based on adjusted style
  const arrowPosition = adjustedStyle.bottom !== undefined ? 'top' :
                        adjustedStyle.top !== undefined ? 'bottom' :
                        adjustedStyle.right !== undefined ? 'left' : 'right';

  return (
    <div
      ref={bubbleRef}
      className="speech-bubble absolute animate-fade-in"
      style={{
        minWidth: '120px',
        width: 'max-content',
        zIndex: 100,
        ...adjustedStyle,
      }}
    >
      <div 
        className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border-2"
        style={{
          borderColor: borderColor,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        <p className="text-sm text-gray-700 font-medium leading-relaxed">{message}</p>
      </div>
      {/* Arrow */}
      <div
        className={`absolute w-0 h-0 ${
          arrowPosition === 'bottom'
            ? 'top-0 left-1/2 -translate-x-1/2 -mt-2 border-l-8 border-r-8 border-t-8 border-transparent'
            : arrowPosition === 'top'
              ? 'bottom-0 left-1/2 -translate-x-1/2 -mb-2 border-l-8 border-r-8 border-b-8 border-transparent'
              : arrowPosition === 'left'
                ? 'right-0 top-1/2 -translate-y-1/2 -mr-2 border-t-8 border-b-8 border-l-8 border-transparent'
                : 'left-0 top-1/2 -translate-y-1/2 -ml-2 border-t-8 border-b-8 border-r-8 border-transparent'
        }`}
        style={{
          ...(arrowPosition === 'bottom' ? { borderTopColor: arrowColor } : {}),
          ...(arrowPosition === 'top' ? { borderBottomColor: arrowColor } : {}),
          ...(arrowPosition === 'left' ? { borderLeftColor: arrowColor } : {}),
          ...(arrowPosition === 'right' ? { borderRightColor: arrowColor } : {}),
        } as React.CSSProperties}
      />
    </div>
  );
}

