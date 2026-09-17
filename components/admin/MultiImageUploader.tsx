'use client';

import React, { useState } from 'react';
import { Upload, X, Star, Link as LinkIcon, Loader2, AlertCircle } from 'lucide-react';
import { uploadMedia, deleteMedia, BUCKET_NAME } from '@/lib/supabase/storage';
import { safeImageUrl } from '@/lib/security/sanitize';

interface MultiImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function MultiImageUploader({
  images,
  onChange,
  maxImages = 6,
}: MultiImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 1. Client-side validation: Check every file type and size BEFORE uploading
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate MIME type or fallback extension
      const isValidType =
        ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) ||
        /\.(jpe?g|png|webp|gif)$/i.test(file.name);

      if (!isValidType) {
        setValidationError(
          `"${file.name}" is not a supported format. Please upload JPEG, PNG, WEBP, or GIF images only.`
        );
        e.target.value = '';
        return; // Halt immediately, do not attempt upload
      }

      // Validate file size (< 5MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        setValidationError(
          `"${file.name}" is ${sizeMb}MB, which exceeds the 5MB size limit. Please upload an image under 5MB.`
        );
        e.target.value = '';
        return; // Halt immediately, do not attempt upload
      }
    }

    // 2. Perform upload
    setUploading(true);
    const uploadedUrls: string[] = [];
    let failure: string | null = null;

    try {
      for (let i = 0; i < files.length; i++) {
        if (images.length + uploadedUrls.length >= maxImages) {
          failure = `Only ${maxImages} images are allowed; the rest were skipped.`;
          break;
        }
        try {
          uploadedUrls.push(await uploadMedia(files[i], 'products'));
        } catch (err: any) {
          // Report the first failure but keep whatever already uploaded,
          // instead of discarding the whole batch.
          failure = `${files[i].name}: ${err?.message || 'upload failed'}`;
          break;
        }
      }
    } finally {
      if (uploadedUrls.length > 0) onChange([...images, ...uploadedUrls]);
      if (failure) setValidationError(failure);
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddUrl = () => {
    const raw = urlInput.trim();
    if (!raw) return;

    if (images.length >= maxImages) {
      setValidationError(`Maximum of ${maxImages} images allowed.`);
      return;
    }

    // Pasted URLs were previously stored verbatim, so `javascript:` or
    // `data:text/html` could be written straight into the product record and
    // later rendered as an <img src> on the public storefront.
    const safe = safeImageUrl(raw, '');
    if (!safe || safe !== raw) {
      setValidationError('Only https:// image links or local /assets/... paths are allowed.');
      return;
    }

    if (images.includes(safe)) {
      setValidationError('That image has already been added.');
      return;
    }

    setValidationError(null);
    onChange([...images, safe]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemove = async (index: number) => {
    const removedUrl = images[index];
    const next = images.filter((_, i) => i !== index);
    onChange(next);
    if (removedUrl && removedUrl.includes(BUCKET_NAME)) {
      try {
        await deleteMedia(removedUrl);
      } catch {
        // Safe silence
      }
    }
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const target = images[index];
    const remaining = images.filter((_, i) => i !== index);
    onChange([target, ...remaining]);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#DFBDB5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Product Images ({images.length}/{maxImages})
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          style={{ background: 'none', border: 'none', color: '#DFBDB5', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <LinkIcon size={12} /> {showUrlInput ? 'Hide URL input' : 'Add image via URL'}
        </button>
      </div>

      {/* Validation Error Alert Banner */}
      {validationError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#FCA5A5',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '0.82rem',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
            <span>{validationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            title="Dismiss error"
            style={{
              background: 'none',
              border: 'none',
              color: '#FCA5A5',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {showUrlInput && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image URL (https://... or /assets/...)"
            style={{
              flex: 1,
              height: '38px',
              background: '#1F1F26',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              padding: '0 12px',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={handleAddUrl}
            style={{
              padding: '0 16px',
              background: '#DFBDB5',
              color: '#0A0A0C',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>
      )}

      {/* Grid of Existing Images */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px', marginBottom: '14px' }}>
        {images.map((src, idx) => (
          <div
            key={src + idx}
            style={{
              position: 'relative',
              aspectRatio: '1/1',
              borderRadius: '6px',
              overflow: 'hidden',
              background: '#1B1B22',
              border: idx === 0 ? '2px solid #DFBDB5' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <img
              src={src}
              alt={`Product preview ${idx + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Primary Cover Badge */}
            {idx === 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  left: '6px',
                  background: '#DFBDB5',
                  color: '#0A0A0C',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  padding: '2px 5px',
                  borderRadius: '3px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Cover
              </span>
            )}

            {/* Actions overlay */}
            <div
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                display: 'flex',
                gap: '4px',
              }}
            >
              {idx !== 0 && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(idx)}
                  title="Make this the primary cover image"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#FDE047',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Star size={12} fill="#FDE047" />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleRemove(idx)}
                title="Remove image"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(239,68,68,0.85)',
                  border: 'none',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={13} />
              </button>
            </div>
          </div>
        ))}

        {/* Upload Drop Button */}
        {images.length < maxImages && (
          <label
            style={{
              aspectRatio: '1/1',
              borderRadius: '6px',
              border: '2px dashed rgba(223, 189, 181, 0.35)',
              background: 'rgba(223, 189, 181, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: uploading ? 'wait' : 'pointer',
              color: '#A6A6B2',
              transition: 'border-color 0.2s ease',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              disabled={uploading}
              onChange={handleFiles}
              style={{ display: 'none' }}
            />
            {uploading ? (
              <>
                <Loader2 size={20} className="lucide-spin" style={{ color: '#DFBDB5', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.68rem', marginTop: '6px', color: '#DFBDB5' }}>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={20} style={{ color: '#DFBDB5', marginBottom: '6px' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#EDEDED' }}>Upload Photo</span>
                <span style={{ fontSize: '0.65rem', color: '#72727D' }}>Max 5MB (JPG, PNG, WEBP, GIF)</span>
              </>
            )}
          </label>
        )}
      </div>

      <p style={{ fontSize: '0.72rem', color: '#72727D', margin: 0 }}>
        The first image is used as the primary catalog thumbnail. Click the star icon to set any photo as main. Maximum 5MB per file.
      </p>
    </div>
  );
}
