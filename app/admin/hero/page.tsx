'use client';

import React, { useEffect, useState } from 'react';
import { Save, Upload, Loader2, Eye, CheckCircle2 } from 'lucide-react';
import { getHeroSlides, saveHeroSlide } from '@/lib/supabase/data';
import { DbHeroSlide } from '@/lib/supabase/types';
import { uploadMedia } from '@/lib/supabase/storage';

export default function AdminHeroPage() {
  const [activeSlide, setActiveSlide] = useState<DbHeroSlide | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getHeroSlides();
      if (data.length > 0) {
        setActiveSlide(data[0]);
      }
    }
    load();
  }, []);

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, 'hero');
      setActiveSlide((prev) => (prev ? { ...prev, image_url: url } : null));
    } catch (err: any) {
      alert(`Upload error: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSlide) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const saved = await saveHeroSlide(activeSlide);
      setActiveSlide(saved);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save error: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  if (!activeSlide) {
    return <div style={{ padding: '40px', color: '#DFBDB5' }}>Loading hero slide settings...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#FFFFFF', margin: '0 0 4px' }}>
            Hero Banner Manager
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#A6A6B2' }}>
            Customize the main banner image, headline, and call-to-actions greeting your visitors.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            background: '#DFBDB5',
            color: '#0A0A0C',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? <Loader2 size={16} className="lucide-spin" /> : <Save size={16} />}
          <span>{saving ? 'Publishing...' : 'Save & Publish Hero'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div
          style={{
            background: 'rgba(74, 222, 128, 0.15)',
            border: '1px solid rgba(74, 222, 128, 0.3)',
            color: '#4ADE80',
            padding: '12px 18px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>Hero banner updated successfully! Live website will reflect changes immediately.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px', alignItems: 'start' }}>
        {/* Editor Form */}
        <div style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Background Image */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#DFBDB5', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hero Background Image
            </label>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '120px', height: '70px', borderRadius: '6px', overflow: 'hidden', background: '#1F1F26', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={activeSlide.image_url} alt="Hero Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: uploading ? 'wait' : 'pointer',
                    color: '#EDEDED',
                  }}
                >
                  <input type="file" accept="image/*" disabled={uploading} onChange={handleUploadBg} style={{ display: 'none' }} />
                  {uploading ? <Loader2 size={14} className="lucide-spin" /> : <Upload size={14} />}
                  <span>{uploading ? 'Uploading to Supabase...' : 'Upload New Hero Photo'}</span>
                </label>
                <input
                  type="text"
                  value={activeSlide.image_url}
                  onChange={(e) => setActiveSlide({ ...activeSlide, image_url: e.target.value })}
                  placeholder="or enter image path /assets/..."
                  style={{
                    width: '100%',
                    height: '36px',
                    background: '#1F1F26',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    padding: '0 10px',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    marginTop: '8px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tag */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#DFBDB5', fontWeight: 600, marginBottom: '6px' }}>
              Eyebrow Tag
            </label>
            <input
              type="text"
              value={activeSlide.tag || ''}
              onChange={(e) => setActiveSlide({ ...activeSlide, tag: e.target.value })}
              placeholder="e.g. HANDCRAFTED JEWELLERY"
              style={{
                width: '100%',
                height: '40px',
                background: '#1F1F26',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '0 12px',
                color: '#FFFFFF',
                fontSize: '0.88rem',
              }}
            />
          </div>

          {/* Headline */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#DFBDB5', fontWeight: 600, marginBottom: '6px' }}>
              Main Headline (Use \n for line break)
            </label>
            <input
              type="text"
              value={activeSlide.headline}
              onChange={(e) => setActiveSlide({ ...activeSlide, headline: e.target.value })}
              placeholder="e.g. Small Beads\nBig Stories"
              style={{
                width: '100%',
                height: '42px',
                background: '#1F1F26',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '0 12px',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#DFBDB5', fontWeight: 600, marginBottom: '6px' }}>
              Sub-description
            </label>
            <textarea
              rows={3}
              value={activeSlide.description || ''}
              onChange={(e) => setActiveSlide({ ...activeSlide, description: e.target.value })}
              placeholder="Thoughtfully crafted pieces, made to add a little more love to your everyday."
              style={{
                width: '100%',
                background: '#1F1F26',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '10px 12px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* Button Text & Link */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                Button Text
              </label>
              <input
                type="text"
                value={activeSlide.button_text || ''}
                onChange={(e) => setActiveSlide({ ...activeSlide, button_text: e.target.value })}
                placeholder="EXPLORE COLLECTIONS →"
                style={{
                  width: '100%',
                  height: '40px',
                  background: '#1F1F26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '0 12px',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                Button Link
              </label>
              <input
                type="text"
                value={activeSlide.button_link || ''}
                onChange={(e) => setActiveSlide({ ...activeSlide, button_link: e.target.value })}
                placeholder="/collections"
                style={{
                  width: '100%',
                  height: '40px',
                  background: '#1F1F26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '0 12px',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>

          {/* Watermark */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
              Handwritten Watermark (Right side)
            </label>
            <input
              type="text"
              value={activeSlide.watermark_text || ''}
              onChange={(e) => setActiveSlide({ ...activeSlide, watermark_text: e.target.value })}
              placeholder="More than\nJewellery"
              style={{
                width: '100%',
                height: '40px',
                background: '#1F1F26',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '0 12px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
              }}
            />
          </div>
        </div>

        {/* Live Preview Card */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '0.82rem', color: '#DFBDB5', fontWeight: 600 }}>
            <Eye size={15} /> Storefront Live Preview
          </div>

          <div
            style={{
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#111116',
              border: '1px solid rgba(255,255,255,0.1)',
              minHeight: '340px',
              padding: '36px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <img
              src={activeSlide.image_url}
              alt="Preview"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.65,
                zIndex: 1,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, rgba(10,10,12,0.92) 0%, rgba(10,10,12,0.6) 60%, rgba(10,10,12,0.2) 100%)',
                zIndex: 2,
              }}
            />

            <div style={{ position: 'relative', zIndex: 3, maxWidth: '300px' }}>
              <span style={{ fontSize: '0.65rem', color: '#DFBDB5', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
                {activeSlide.tag}
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.6rem',
                  color: '#FFFFFF',
                  margin: '8px 0',
                  lineHeight: 1.2,
                  whiteSpace: 'pre-line',
                }}
              >
                {activeSlide.headline.replace('\\n', '\n')}
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#EDEDED', marginBottom: '16px', lineHeight: 1.5 }}>
                {activeSlide.description}
              </p>
              <div
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: '#DFBDB5',
                  color: '#0A0A0C',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: '3px',
                }}
              >
                {activeSlide.button_text}
              </div>
            </div>

            {activeSlide.watermark_text && (
              <div
                style={{
                  position: 'absolute',
                  right: '16px',
                  bottom: '16px',
                  zIndex: 3,
                  fontFamily: 'var(--font-script)',
                  fontSize: '1.3rem',
                  color: '#DFBDB5',
                  opacity: 0.85,
                  textAlign: 'right',
                  whiteSpace: 'pre-line',
                }}
              >
                {activeSlide.watermark_text.replace('\\n', '\n')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
