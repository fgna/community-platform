'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useUploadImage } from '@/hooks/use-uploads';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
  maxSize?: number;
}

export function ImageUpload({ onUpload, currentUrl, maxSize = 5 * 1024 * 1024 }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadImage();

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > maxSize) {
      setError(`Image too large. Maximum ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const result = await uploadMutation.mutateAsync(file);
      setPreview(result.url);
      onUpload(result.url);
    } catch {
      setError('Upload failed. Please try again.');
      setPreview(currentUrl || null);
    }
  }, [maxSize, currentUrl, onUpload, uploadMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="relative rounded-lg cursor-pointer transition-all overflow-hidden"
        style={{
          border: dragOver ? '2px dashed var(--theme-primary)' : '2px dashed var(--theme-border)',
          background: dragOver ? 'rgba(197,168,128,0.05)' : 'rgba(255,255,255,0.02)',
          minHeight: preview ? 'auto' : '120px',
        }}
      >
        {uploadMutation.isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--theme-primary)' }} />
          </div>
        )}

        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            {dragOver ? (
              <Upload size={24} style={{ color: 'var(--theme-primary)' }} />
            ) : (
              <ImageIcon size={24} style={{ color: 'var(--theme-text-muted)' }} />
            )}
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              {dragOver ? 'Drop image here' : 'Click or drag an image to upload'}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)', opacity: 0.6 }}>
              JPEG, PNG, GIF, WebP · Max {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
