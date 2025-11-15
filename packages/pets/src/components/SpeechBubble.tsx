'use client';

interface SpeechBubbleProps {
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  petColor?: string;
}

export default function SpeechBubble({ message, position = 'bottom', petColor = '#d4a5c7' }: SpeechBubbleProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Use pet color for border, with some opacity
  const borderColor = `${petColor}cc`; // Add alpha channel (80% opacity)
  const arrowColor = petColor;

  return (
    <div
      className={`speech-bubble absolute ${positionClasses[position]} animate-fade-in`}
      style={{
        maxWidth: '200px',
        minWidth: '120px',
        zIndex: 100,
      }}
    >
      <div 
        className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border-2"
        style={{
          borderColor: borderColor,
        }}
      >
        <p className="text-sm text-gray-700 font-medium leading-relaxed">{message}</p>
      </div>
      {/* Arrow */}
      <div
        className={`absolute w-0 h-0 ${
          position === 'bottom'
            ? 'top-0 left-1/2 -translate-x-1/2 -mt-2 border-l-8 border-r-8 border-t-8 border-transparent'
            : position === 'top'
              ? 'bottom-0 left-1/2 -translate-x-1/2 -mb-2 border-l-8 border-r-8 border-b-8 border-transparent'
              : position === 'left'
                ? 'right-0 top-1/2 -translate-y-1/2 -mr-2 border-t-8 border-b-8 border-l-8 border-transparent'
                : 'left-0 top-1/2 -translate-y-1/2 -ml-2 border-t-8 border-b-8 border-r-8 border-transparent'
        }`}
        style={{
          ...(position === 'bottom' ? { borderTopColor: arrowColor } : {}),
          ...(position === 'top' ? { borderBottomColor: arrowColor } : {}),
          ...(position === 'left' ? { borderLeftColor: arrowColor } : {}),
          ...(position === 'right' ? { borderRightColor: arrowColor } : {}),
        } as React.CSSProperties}
      />
    </div>
  );
}

