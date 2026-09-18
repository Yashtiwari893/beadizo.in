'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Plus, X, Sparkles, AlertCircle } from 'lucide-react';
import MultiImageUploader from './MultiImageUploader';
import { getCategories, saveProduct, generateProductAiContent } from '@/lib/supabase/data';
import { DbProduct, DbCategory } from '@/lib/supabase/types';

interface ProductFormProps {
  initialData?: DbProduct | null;
  isEdit?: boolean;
}

export default function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [categorySlug, setCategorySlug] = useState(initialData?.category_slug || 'bracelets');
  const [gender, setGender] = useState<'men' | 'women' | 'unisex'>(initialData?.gender || 'unisex');
  const [price, setPrice] = useState(initialData?.price ? String(initialData.price) : '');
  const [originalPrice, setOriginalPrice] = useState(initialData?.original_price ? String(initialData.original_price) : '');
  const [images, setImages] = useState<string[]>(initialData?.images || ['/assets/product_bracelet.jpg']);
  const [badge, setBadge] = useState(initialData?.badge || '');
  const [isAvailable, setIsAvailable] = useState(initialData ? initialData.is_available : true);
  const [isFeatured, setIsFeatured] = useState(initialData ? initialData.is_featured : false);
  const [description, setDescription] = useState(initialData?.description || '');
  const [features, setFeatures] = useState<string[]>(
    initialData?.features || ['100% Anti-Tarnish', 'Waterproof & Sweatproof', 'Hypoallergenic', 'Free Pan-India Delivery']
  );
  const [newFeature, setNewFeature] = useState('');

  // AI Assist State
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [descAiError, setDescAiError] = useState<string | null>(null);
  const [generatingFeatures, setGeneratingFeatures] = useState(false);
  const [featuresAiError, setFeaturesAiError] = useState<string | null>(null);

  const handleGenerateDescription = async () => {
    if (!title.trim()) {
      setDescAiError('Please enter a product title first so AI has context.');
      return;
    }

    setGeneratingDesc(true);
    setDescAiError(null);
    try {
      const result = await generateProductAiContent('description', title.trim(), slug.trim(), description.trim());
      if (typeof result === 'string') {
        setDescription(result);
      }
    } catch (err: any) {
      setDescAiError(err?.message || 'Could not generate description right now. You can write manually.');
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleSuggestFeatures = async () => {
    if (!title.trim()) {
      setFeaturesAiError('Please enter a product title first so AI has context.');
      return;
    }

    setGeneratingFeatures(true);
    setFeaturesAiError(null);
    try {
      const result = await generateProductAiContent('features', title.trim(), slug.trim());
      if (Array.isArray(result)) {
        const newUnique = result.filter((tag) => !features.includes(tag));
        if (newUnique.length > 0) {
          setFeatures((prev) => [...prev, ...newUnique]);
        }
      }
    } catch (err: any) {
      setFeaturesAiError(err?.message || 'Could not suggest features right now. You can add them manually.');
    } finally {
      setGeneratingFeatures(false);
    }
  };

  useEffect(() => {
    async function loadCats() {
      const cats = await getCategories();
      setCategories(cats);
      if (!initialData && cats.length > 0) {
        setCategorySlug(cats[0].slug);
      }
    }
    loadCats();
  }, [initialData]);

  // Auto-generate slug when title changes (if adding new)
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isEdit) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    if (!features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
    }
    setNewFeature('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const numPrice = Number(price) || 0;
  const numOrigPrice = Number(originalPrice) || 0;
  const discountPercent =
    numOrigPrice > numPrice && numOrigPrice > 0
      ? Math.round(((numOrigPrice - numPrice) / numOrigPrice) * 100)
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Product title is required.');
      return;
    }
    if (!price || numPrice <= 0) {
      alert('Please enter a valid selling price.');
      return;
    }
    if (images.length === 0) {
      alert('Please upload or provide at least one product image.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<DbProduct> = {
        id: initialData?.id,
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category_slug: categorySlug,
        price: numPrice,
        original_price: numOrigPrice > 0 ? numOrigPrice : null,
        images,
        description: description.trim(),
        features,
        badge: badge.trim() || null,
        is_available: isAvailable,
        is_featured: isFeatured,
        gender,
        rating: initialData?.rating || 5.0,
        reviews_count: initialData?.reviews_count || 100,
      };

      await saveProduct(payload);
      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      alert(`Save error: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '960px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/admin/products"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              background: '#1F1F26',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DFBDB5',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: '#FFFFFF', margin: 0 }}>
              {isEdit ? `Edit "${initialData?.title}"` : 'Add New Handcrafted Product'}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#A6A6B2' }}>
              Fill in product details, upload photos, and set pricing.
            </p>
          </div>
        </div>

        <button
          type="submit"
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
            fontSize: '0.86rem',
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? <Loader2 size={16} className="lucide-spin" /> : <Save size={16} />}
          <span>{saving ? 'Saving...' : isEdit ? 'Update Product' : 'Publish Product'}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Core Info & Images */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Images Section */}
          <div style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '24px' }}>
            <MultiImageUploader images={images} onChange={setImages} maxImages={6} />
          </div>

          {/* Title & Slug */}
          <div style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '24px' }}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#DFBDB5', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Product Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. Blush Charm Bracelet"
                style={{
                  width: '100%',
                  height: '44px',
                  background: '#1F1F26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '0 14px',
                  color: '#FFFFFF',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#A6A6B2', marginBottom: '6px' }}>
                URL Slug (Handle)
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. blush-charm-bracelet"
                style={{
                  width: '100%',
                  height: '40px',
                  background: '#1F1F26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '0 14px',
                  color: '#EDEDED',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '0.72rem', color: '#72727D', marginTop: '4px', display: 'block' }}>
                Storefront URL will be: <code>/product/{slug || '...'}</code>
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#DFBDB5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Description
                </label>

                <button
                  type="button"
                  disabled={generatingDesc || !title.trim()}
                  onClick={handleGenerateDescription}
                  title={!title.trim() ? 'Enter a Product Title first' : 'Auto-generate compelling SEO description with AI'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    background: !title.trim()
                      ? 'rgba(255,255,255,0.04)'
                      : 'linear-gradient(135deg, rgba(223, 189, 181, 0.22) 0%, rgba(184, 134, 11, 0.18) 100%)',
                    border: !title.trim() ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(223, 189, 181, 0.4)',
                    color: !title.trim() ? '#6B6B78' : '#DFBDB5',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: generatingDesc || !title.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {generatingDesc ? (
                    <>
                      <Loader2 size={13} className="lucide-spin" />
                      <span>Generating description...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>{description.trim() ? 'Regenerate with AI' : 'Generate with AI'}</span>
                    </>
                  )}
                </button>
              </div>

              {descAiError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#FCA5A5',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                    <span>{descAiError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDescAiError(null)}
                    style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of craftsmanship, materials, beads, and sizing... (write manually or click Generate with AI)"
                style={{
                  width: '100%',
                  background: '#1F1F26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  outline: 'none',
                  lineHeight: 1.6,
                }}
              />
            </div>
          </div>

          {/* Features & Specs Tags */}
          <div style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#DFBDB5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Product Features & Badges
              </label>

              <button
                type="button"
                disabled={generatingFeatures || !title.trim()}
                onClick={handleSuggestFeatures}
                title={!title.trim() ? 'Enter a Product Title first' : 'AI will suggest relevant badge tags'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  background: !title.trim()
                    ? 'rgba(255,255,255,0.04)'
                    : 'linear-gradient(135deg, rgba(223, 189, 181, 0.22) 0%, rgba(184, 134, 11, 0.18) 100%)',
                  border: !title.trim() ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(223, 189, 181, 0.4)',
                  color: !title.trim() ? '#6B6B78' : '#DFBDB5',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: generatingFeatures || !title.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {generatingFeatures ? (
                  <>
                    <Loader2 size={13} className="lucide-spin" />
                    <span>Suggesting tags...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Suggest with AI</span>
                  </>
                )}
              </button>
            </div>

            {featuresAiError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                  <span>{featuresAiError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeaturesAiError(null)}
                  style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', padding: 0 }}
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="Type feature (e.g. 18K Gold Plated) and hit Add..."
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
                onClick={handleAddFeature}
                style={{
                  padding: '0 14px',
                  background: '#DFBDB5',
                  color: '#0A0A0C',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {features.map((feat, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    color: '#EDEDED',
                  }}
                >
                  <span>{feat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    style={{ background: 'none', border: 'none', color: '#A6A6B2', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Category & Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Pricing Box */}
          <div style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#FFFFFF', marginBottom: '16px', fontFamily: 'var(--font-serif)' }}>
              Pricing & Offers
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#DFBDB5', marginBottom: '6px' }}>
                Selling Price (₹) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="699"
                style={{
                  width: '100%',
                  height: '42px',
                  background: '#1F1F26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '0 14px',
                  color: '#FFFFFF',
                  fontSize: '1rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#A6A6B2', marginBottom: '6px' }}>
                Original / MRP Price (₹) — Optional
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="999"
                style={{
                  width: '100%',
                  height: '42px',
                  background: '#1F1F26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '0 14px',
                  color: '#A6A6B2',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>

            {discountPercent > 0 && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'rgba(74, 222, 128, 0.1)',
                  border: '1px solid rgba(74, 222, 128, 0.25)',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  color: '#4ADE80',
                  fontWeight: 600,
                }}
              >
                Customer saves {discountPercent}% on this piece!
              </div>
            )}
          </div>

          {/* Category & Badge */}
          <div style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#DFBDB5', marginBottom: '6px' }}>
                Category *
              </label>
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  background: '#1F1F26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '0 12px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#DFBDB5', marginBottom: '6px' }}>
                Audience / Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'men' | 'women' | 'unisex')}
                style={{
                  width: '100%',
                  height: '42px',
                  background: '#1F1F26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '0 12px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="unisex">Unisex (All)</option>
                <option value="women">Women</option>
                <option value="men">Men</option>
              </select>
              <span style={{ fontSize: '0.72rem', color: '#72727D', marginTop: '4px', display: 'block' }}>
                Independent filter attribute used on the storefront.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#A6A6B2', marginBottom: '6px' }}>
                Promotional Badge
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Bestseller, Trending, Limited"
                style={{
                  width: '100%',
                  height: '40px',
                  background: '#1F1F26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '0 12px',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {['Bestseller', 'Trending', 'Limited', 'Summer Fav', 'Value Set'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBadge(b)}
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      background: badge === b ? '#DFBDB5' : 'rgba(255,255,255,0.06)',
                      color: badge === b ? '#0A0A0C' : '#A6A6B2',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visibility & Toggles */}
          <div style={{ background: '#141419', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#FFFFFF', marginBottom: '16px', fontFamily: 'var(--font-serif)' }}>
              Visibility & Stock
            </h3>

            {/* In Stock Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#FFFFFF' }}>Available In Stock</div>
                <div style={{ fontSize: '0.75rem', color: '#72727D' }}>Allows customers to add to bag and order</div>
              </div>
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#DFBDB5' }}
              />
            </div>

            {/* Featured Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#FFFFFF' }}>Featured on Homepage</div>
                <div style={{ fontSize: '0.75rem', color: '#72727D' }}>Display in &ldquo;Loved by Many&rdquo; bestsellers grid</div>
              </div>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#DFBDB5' }}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
