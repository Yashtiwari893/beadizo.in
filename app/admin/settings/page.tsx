'use client';

import React, { useEffect, useState } from 'react';
import {
  Save,
  Loader2,
  CheckCircle2,
  Phone,
  Megaphone,
  Sparkles,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { getSiteSettings, saveSiteSettings } from '@/lib/supabase/data';
import { DbSiteSettings } from '@/lib/supabase/types';
import { uploadMedia } from '@/lib/supabase/storage';
import MediaLibraryPicker from '@/components/admin/MediaLibraryPicker';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<DbSiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadingEditorial, setUploadingEditorial] = useState(false);
  const [uploadingCraft, setUploadingCraft] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'editorial_image_url' | 'craft_image_url' | null>(null);


  useEffect(() => {
    async function load() {
      const data = await getSiteSettings();
      setSettings(data);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const saved = await saveSiteSettings(settings);
      setSettings(saved);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save error: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (field: 'editorial_image_url' | 'craft_image_url', file: File) => {
    if (field === 'editorial_image_url') setUploadingEditorial(true);
    else setUploadingCraft(true);

    try {
      const url = await uploadMedia(file, 'settings');
      setSettings((prev) => (prev ? { ...prev, [field]: url } : null));
    } catch (err: any) {
      alert(`Upload error: ${err.message || err}`);
    } finally {
      if (field === 'editorial_image_url') setUploadingEditorial(false);
      else setUploadingCraft(false);
    }
  };

  if (!settings) {
    return <div style={{ padding: '40px', color: '#DFBDB5' }}>Loading site settings...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div
        className="admin-page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#FFFFFF', margin: '0 0 4px' }}>
            Store Settings & Content
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#A6A6B2' }}>
            Configure contact coordinates, announcement ticker, free delivery thresholds, and homepage editorial story blocks.
          </p>
        </div>

        <button
          className="admin-header-save-btn"
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
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
          <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
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
          <span>Settings saved successfully! Storefront header, footer, and banners updated.</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Contact & Ordering Info */}
        <div
          style={{
            background: '#141419',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 600, color: '#DFBDB5', marginBottom: '18px' }}>
            <Phone size={18} />
            <span>Contact & WhatsApp Ordering</span>
          </div>

          <div className="admin-contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                WhatsApp Phone Number (with country code, e.g. 919324556148)
              </label>
              <input
                type="text"
                value={settings.whatsapp_phone}
                onChange={(e) => setSettings({ ...settings, whatsapp_phone: e.target.value })}
                placeholder="919324556148"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#1B1B22',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#7E7E8F' }}>
                All "Order on WhatsApp" and customer support clicks open chats with this phone number.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                Customer Support Email
              </label>
              <input
                type="email"
                value={settings.contact_email}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                placeholder="shamairakhan712@gmail.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#1B1B22',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#7E7E8F' }}>
                Displayed in the footer and order receipt confirmations.
              </p>
            </div>
          </div>
        </div>

        {/* Announcement Bar & Shipping */}
        <div
          style={{
            background: '#141419',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 600, color: '#DFBDB5', marginBottom: '18px' }}>
            <Megaphone size={18} />
            <span>Top Announcement Ticker & Shipping</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="announcementActive"
                checked={settings.announcement_active}
                onChange={(e) => setSettings({ ...settings, announcement_active: e.target.checked })}
                style={{ accentColor: '#DFBDB5', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="announcementActive" style={{ fontSize: '0.85rem', color: '#FFFFFF', cursor: 'pointer' }}>
                Enable Announcement Bar at top of website
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                Announcement Message Text
              </label>
              <input
                type="text"
                value={settings.announcement_text}
                onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                placeholder="Free Shipping on all orders above ₹999  |  Extra 10% OFF on your first order"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#1B1B22',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <div className="admin-threshold-input" style={{ maxWidth: '300px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                Free Shipping Threshold Amount (₹)
              </label>
              <input
                type="number"
                value={settings.free_shipping_threshold}
                onChange={(e) => setSettings({ ...settings, free_shipping_threshold: Number(e.target.value) })}
                placeholder="999"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#1B1B22',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#DFBDB5',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              />
            </div>
          </div>
        </div>

        {/* Editorial Story Section ("Jewellery That Feels Like You") */}
        <div
          style={{
            background: '#141419',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 600, color: '#DFBDB5', marginBottom: '18px' }}>
            <Sparkles size={18} />
            <span>Homepage Story Section: "Jewellery That Feels Like You"</span>
          </div>

          <div className="admin-settings-section-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                  Section Headline
                </label>
                <input
                  type="text"
                  value={settings.editorial_headline || ''}
                  onChange={(e) => setSettings({ ...settings, editorial_headline: e.target.value })}
                  placeholder="Jewellery That Feels Like You"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#1B1B22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                  Section Subtext / Philosophy
                </label>
                <textarea
                  rows={3}
                  value={settings.editorial_subtext || ''}
                  onChange={(e) => setSettings({ ...settings, editorial_subtext: e.target.value })}
                  placeholder="Minimal, meaningful and made to be a part of your everyday moments."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#1B1B22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                  Editorial Image URL or Upload
                </label>
                <div className="admin-upload-row" style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={settings.editorial_image_url || ''}
                    onChange={(e) => setSettings({ ...settings, editorial_image_url: e.target.value })}
                    placeholder="/assets/jewellery_feels_like_you.png"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      width: '100%',
                      padding: '10px 14px',
                      background: '#1B1B22',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                    }}
                  />
                  <div className="admin-upload-btn-group" style={{ display: 'flex', gap: '8px' }}>
                    <label
                      style={{
                        padding: '10px 14px',
                        background: '#2A2A35',
                        color: '#DFBDB5',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: uploadingEditorial ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {uploadingEditorial ? <Loader2 size={14} className="lucide-spin" /> : <Upload size={14} />}
                      <span>{uploadingEditorial ? 'Uploading...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleUploadImage('editorial_image_url', e.target.files[0])}
                        disabled={uploadingEditorial}
                        style={{ display: 'none' }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget('editorial_image_url')}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(223, 189, 181, 0.12)',
                        border: '1px solid rgba(223, 189, 181, 0.3)',
                        color: '#DFBDB5',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <ImageIcon size={14} />
                      <span>From Library</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnail preview */}
            <div style={{ background: '#0D0D10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#7E7E8F', marginBottom: '8px' }}>Image Preview</div>
              {settings.editorial_image_url ? (
                <div style={{ width: '100%', height: '160px', overflow: 'hidden', borderRadius: '6px', background: '#000' }}>
                  <img src={settings.editorial_image_url} alt="Editorial preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.8rem' }}>
                  No image selected
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Craft Banner Section ("More Than Jewellery") */}
        <div
          style={{
            background: '#141419',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 600, color: '#DFBDB5', marginBottom: '18px' }}>
            <Sparkles size={18} />
            <span>Homepage Craft Banner: "More Than Jewellery"</span>
          </div>

          <div className="admin-settings-section-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                  Banner Headline
                </label>
                <input
                  type="text"
                  value={settings.craft_headline || ''}
                  onChange={(e) => setSettings({ ...settings, craft_headline: e.target.value })}
                  placeholder="More Than Jewellery"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#1B1B22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                  Banner Craft Story / Description
                </label>
                <textarea
                  rows={3}
                  value={settings.craft_description || ''}
                  onChange={(e) => setSettings({ ...settings, craft_description: e.target.value })}
                  placeholder="Every bead tells a story – of tradition, craftsmanship and the little moments that make life beautiful."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#1B1B22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                  Craft Banner Image URL or Upload
                </label>
                <div className="admin-upload-row" style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={settings.craft_image_url || ''}
                    onChange={(e) => setSettings({ ...settings, craft_image_url: e.target.value })}
                    placeholder="/assets/more_than_jewellery.png"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      width: '100%',
                      padding: '10px 14px',
                      background: '#1B1B22',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                    }}
                  />
                  <div className="admin-upload-btn-group" style={{ display: 'flex', gap: '8px' }}>
                    <label
                      style={{
                        padding: '10px 14px',
                        background: '#2A2A35',
                        color: '#DFBDB5',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: uploadingCraft ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {uploadingCraft ? <Loader2 size={14} className="lucide-spin" /> : <Upload size={14} />}
                      <span>{uploadingCraft ? 'Uploading...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleUploadImage('craft_image_url', e.target.files[0])}
                        disabled={uploadingCraft}
                        style={{ display: 'none' }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget('craft_image_url')}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(223, 189, 181, 0.12)',
                        border: '1px solid rgba(223, 189, 181, 0.3)',
                        color: '#DFBDB5',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <ImageIcon size={14} />
                      <span>From Library</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnail preview */}
            <div style={{ background: '#0D0D10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#7E7E8F', marginBottom: '8px' }}>Banner Preview</div>
              {settings.craft_image_url ? (
                <div style={{ width: '100%', height: '160px', overflow: 'hidden', borderRadius: '6px', background: '#000' }}>
                  <img src={settings.craft_image_url} alt="Craft preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.8rem' }}>
                  No image selected
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      <MediaLibraryPicker
        isOpen={mediaPickerTarget !== null}
        onClose={() => setMediaPickerTarget(null)}
        defaultFolder="settings"
        title={
          mediaPickerTarget === 'editorial_image_url'
            ? 'Select Editorial Story Photo'
            : 'Select Craft Story Banner Photo'
        }
        onSelect={(url) => {
          if (mediaPickerTarget) {
            setSettings((prev) => (prev ? { ...prev, [mediaPickerTarget]: url } : null));
            setMediaPickerTarget(null);
          }
        }}
      />
    </div>
  );
}
