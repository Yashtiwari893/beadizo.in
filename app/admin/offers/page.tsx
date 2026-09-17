'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Save,
  Trash2,
  CheckCircle2,
  Upload,
  Loader2,
  Eye,
  Tag,
  ToggleLeft,
  ToggleRight,
  Gift
} from 'lucide-react';
import { getPopupOffers, savePopupOffer, deletePopupOffer } from '@/lib/supabase/data';
import { DbPopupOffer } from '@/lib/supabase/types';
import { uploadMedia } from '@/lib/supabase/storage';

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<DbPopupOffer[]>([]);
  const [activeOffer, setActiveOffer] = useState<DbPopupOffer | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadOffers = async () => {
    setLoading(true);
    const data = await getPopupOffers();
    setOffers(data);
    if (data.length > 0 && !activeOffer) {
      setActiveOffer(data[0]);
    } else if (data.length === 0) {
      handleCreateNew();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateNew = () => {
    const fresh: DbPopupOffer = {
      id: '',
      title: 'Special Festive Discount ✨',
      subtitle: 'Enjoy 10% OFF on all handcrafted jewellery. Use promo code at checkout.',
      discount_code: 'BEADIZO10',
      badge: 'LIMITED TIME',
      button_text: 'CLAIM OFFER & SHOP →',
      button_link: '/collections',
      is_active: true,
    };
    setActiveOffer(fresh);
  };

  const handleSelectOffer = (offer: DbPopupOffer) => {
    setActiveOffer({ ...offer });
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, 'offers');
      setActiveOffer((prev) => (prev ? { ...prev, image_url: url } : null));
    } catch (err: any) {
      alert(`Upload error: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOffer) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const saved = await savePopupOffer(activeOffer);
      setActiveOffer(saved);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      const data = await getPopupOffers();
      setOffers(data);
    } catch (err: any) {
      alert(`Save error: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      setActiveOffer(offers[0] || null);
      return;
    }
    if (!confirm('Are you sure you want to delete this promotional offer?')) return;
    try {
      await deletePopupOffer(id);
      const updated = await getPopupOffers();
      setOffers(updated);
      setActiveOffer(updated[0] || null);
    } catch (err: any) {
      alert(err?.message || 'Could not delete the offer.');
    }
  };

  const handleToggleActive = async (offer: DbPopupOffer) => {
    try {
      const updated = await savePopupOffer({ ...offer, is_active: !offer.is_active });
      // Re-read after the write: the database trigger may have deactivated a
      // different offer, so local state alone would be stale.
      const refreshed = await getPopupOffers();
      setOffers(refreshed);
      if (activeOffer?.id === offer.id) {
        setActiveOffer(updated);
      }
    } catch (err: any) {
      alert(err?.message || 'Could not update the offer.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div
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
            Popup Offers & Promotions
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#A6A6B2' }}>
            Configure promotional popups, instant discount codes, and seasonal banner alerts for website visitors.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleCreateNew}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              background: '#1D1D26',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            <span>New Offer</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !activeOffer}
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
            <span>{saving ? 'Saving...' : 'Save & Publish'}</span>
          </button>
        </div>
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
          <span>Offer configuration updated successfully! Changes are live on the storefront.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left column: Offer List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              background: '#141419',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#DFBDB5', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gift size={16} />
              <span>Configured Offers ({offers.length})</span>
            </div>

            {loading ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#7E7E8F', fontSize: '0.85rem' }}>
                Loading offers...
              </div>
            ) : offers.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#7E7E8F', fontSize: '0.85rem' }}>
                No offers yet. Click "New Offer" to create one.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {offers.map((offer) => {
                  const isSelected = activeOffer?.id === offer.id;
                  return (
                    <div
                      key={offer.id || Math.random()}
                      onClick={() => handleSelectOffer(offer)}
                      style={{
                        padding: '12px 14px',
                        background: isSelected ? 'rgba(223, 189, 181, 0.12)' : '#1B1B22',
                        border: isSelected ? '1px solid #DFBDB5' : '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? '#DFBDB5' : '#FFFFFF' }}>
                          {offer.title || 'Untitled Offer'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(offer);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: offer.is_active ? '#4ADE80' : '#7E7E8F',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                          }}
                        >
                          {offer.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          <span>{offer.is_active ? 'ACTIVE' : 'OFF'}</span>
                        </button>
                      </div>

                      {offer.discount_code && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Tag size={12} color="#A6A6B2" />
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#DFBDB5', letterSpacing: '0.5px' }}>
                            {offer.discount_code}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Editor & Preview */}
        {activeOffer ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr', gap: '24px', alignItems: 'start' }}>
            {/* Edit Form */}
            <div
              style={{
                background: '#141419',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#DFBDB5' }}>
                  {activeOffer.id ? 'Edit Offer Details' : 'Create New Promotional Popup'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#DFBDB5', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={activeOffer.is_active}
                      onChange={(e) => setActiveOffer({ ...activeOffer, is_active: e.target.checked })}
                      style={{ accentColor: '#DFBDB5' }}
                    />
                    <span>Active on Storefront</span>
                  </label>

                  {activeOffer.id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(activeOffer.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title="Delete offer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                  Offer Title / Main Headline
                </label>
                <input
                  type="text"
                  value={activeOffer.title}
                  onChange={(e) => setActiveOffer({ ...activeOffer, title: e.target.value })}
                  placeholder="e.g. Special Festive Offer ✨"
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
                  Badge Pill Text (optional)
                </label>
                <input
                  type="text"
                  value={activeOffer.badge || ''}
                  onChange={(e) => setActiveOffer({ ...activeOffer, badge: e.target.value })}
                  placeholder="e.g. LIMITED TIME, FESTIVE SALE"
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
                  Discount / Coupon Code
                </label>
                <input
                  type="text"
                  value={activeOffer.discount_code || ''}
                  onChange={(e) => setActiveOffer({ ...activeOffer, discount_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. BEADIZO10"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#1B1B22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#DFBDB5',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    letterSpacing: '1px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                  Subtitle / Promo Description
                </label>
                <textarea
                  rows={3}
                  value={activeOffer.subtitle || ''}
                  onChange={(e) => setActiveOffer({ ...activeOffer, subtitle: e.target.value })}
                  placeholder="e.g. Get an instant 10% discount on your first handcrafted jewellery order."
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

              {/* Optional Creative Image */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                  Promotional Creative Image (Optional)
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={activeOffer.image_url || ''}
                    onChange={(e) => setActiveOffer({ ...activeOffer, image_url: e.target.value })}
                    placeholder="/assets/offer_banner.jpg or https://..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: '#1B1B22',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                    }}
                  />
                  <label
                    style={{
                      padding: '10px 16px',
                      background: '#2A2A35',
                      color: '#DFBDB5',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: uploading ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {uploading ? <Loader2 size={14} className="lucide-spin" /> : <Upload size={14} />}
                    <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                    <input type="file" accept="image/*" onChange={handleUploadImage} disabled={uploading} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={activeOffer.button_text || 'CLAIM OFFER →'}
                    onChange={(e) => setActiveOffer({ ...activeOffer, button_text: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#1B1B22',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
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
                    value={activeOffer.button_link || '/collections'}
                    onChange={(e) => setActiveOffer({ ...activeOffer, button_link: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#1B1B22',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Live Visual Preview */}
            <div
              style={{
                background: '#141419',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#DFBDB5', fontWeight: 600 }}>
                <Eye size={16} />
                <span>Storefront Modal Preview</span>
              </div>

              <div
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  padding: '24px 16px',
                  borderRadius: '10px',
                  border: '1px dashed rgba(255,255,255,0.15)',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '340px',
                    background: '#141418',
                    border: '1px solid rgba(223, 189, 181, 0.25)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
                    textAlign: 'center',
                  }}
                >
                  {activeOffer.image_url && (
                    <div style={{ width: '100%', height: '140px', position: 'relative', overflow: 'hidden', background: '#0A0A0C' }}>
                      <img
                        src={activeOffer.image_url}
                        alt="Offer banner"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  <div style={{ padding: '24px 20px' }}>
                    {activeOffer.badge && (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          background: 'rgba(223, 189, 181, 0.15)',
                          color: '#DFBDB5',
                          borderRadius: '100px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          letterSpacing: '1px',
                          marginBottom: '12px',
                        }}
                      >
                        {activeOffer.badge}
                      </span>
                    )}

                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#FFFFFF', margin: '0 0 8px' }}>
                      {activeOffer.title}
                    </h3>

                    <p style={{ fontSize: '0.8rem', color: '#A6A6B2', margin: '0 0 16px', lineHeight: 1.5 }}>
                      {activeOffer.subtitle}
                    </p>

                    {activeOffer.discount_code && (
                      <div
                        style={{
                          padding: '10px 14px',
                          background: '#0D0D10',
                          border: '1px dashed #DFBDB5',
                          borderRadius: '6px',
                          marginBottom: '18px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', color: '#A6A6B2' }}>USE CODE</span>
                        <span style={{ fontSize: '0.95rem', fontFamily: 'monospace', fontWeight: 700, color: '#DFBDB5', letterSpacing: '1px' }}>
                          {activeOffer.discount_code}
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      style={{
                        width: '100%',
                        padding: '11px',
                        background: '#DFBDB5',
                        color: '#0A0A0C',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        letterSpacing: '0.5px',
                        cursor: 'default',
                      }}
                    >
                      {activeOffer.button_text || 'CLAIM OFFER →'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: '#A6A6B2', padding: '40px', textAlign: 'center' }}>Select or create an offer to edit.</div>
        )}
      </div>
    </div>
  );
}
