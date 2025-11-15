'use client';

interface SpeechBubbleProps {
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function SpeechBubble({ message, position = 'bottom' }: SpeechBubbleProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`speech-bubble absolute ${positionClasses[position]} animate-fade-in`}
      style={{
        maxWidth: '200px',
        minWidth: '120px',
      }}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg border-2 border-soft-lavender">
        <p className="text-sm text-gray-700 font-medium leading-relaxed">{message}</p>
      </div>
      {/* Arrow */}
      <div
        className={`absolute w-0 h-0 ${
          position === 'bottom'
            ? 'top-0 left-1/2 -translate-x-1/2 -mt-2 border-l-8 border-r-8 border-t-8 border-transparent border-t-white/95'
            : position === 'top'
              ? 'bottom-0 left-1/2 -translate-x-1/2 -mb-2 border-l-8 border-r-8 border-b-8 border-transparent border-b-white/95'
              : position === 'left'
                ? 'right-0 top-1/2 -translate-y-1/2 -mr-2 border-t-8 border-b-8 border-l-8 border-transparent border-l-white/95'
                : 'left-0 top-1/2 -translate-y-1/2 -ml-2 border-t-8 border-b-8 border-r-8 border-transparent border-r-white/95'
        }`}
      />
    </div>
  );
}

