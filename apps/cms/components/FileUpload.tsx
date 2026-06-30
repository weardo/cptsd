'use client';

import { useState, useRef } from 'react';
import ImageModal from './ImageModal';

type FileUploadProps = {
  onUpload: (file: File) => Promise<void>;
  currentUrl?: string;
  uploading?: boolean;
};

export default function FileUpload({ onUpload, currentUrl, uploading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await onUpload(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.url}
          alt={selectedImage.alt}
          onClose={() => setSelectedImage(null)}
        />
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={uploading}
        />
        
        {currentUrl ? (
        <div className="space-y-2">
          <img
            src={currentUrl}
            alt="Uploaded screenshot"
            className="w-full max-w-md h-auto rounded border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setSelectedImage({ url: currentUrl, alt: 'Uploaded screenshot' })}
          />
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="btn btn-secondary text-sm"
          >
            {uploading ? 'Uploading...' : 'Change Image'}
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? (
            <p className="text-gray-500">Uploading...</p>
          ) : (
            <>
              <p className="text-gray-600 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, GIF up to 10MB
              </p>
            </>
          )}
        </div>
      )}
      </div>
    </>
  );
}

