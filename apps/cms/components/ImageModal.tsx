'use client';

import { useEffect } from 'react';

type ImageModalProps = {
  imageUrl: string;
  alt: string;
  onClose: () => void;
};

export default function ImageModal({ imageUrl, alt, onClose }: ImageModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Close modal"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Image */}
        <div className="max-w-full max-h-[80vh] overflow-auto">
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Download button */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 mt-4">
          <a
            href={imageUrl}
            download
            className="btn btn-primary text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            Download Image
          </a>
        </div>
      </div>
    </div>
  );
}

