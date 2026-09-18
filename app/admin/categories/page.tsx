'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Upload, Loader2, Image as ImageIcon, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { getCategories, saveCategory, deleteCategory, getProducts, deleteCategoriesBatch } from '@/lib/supabase/data';
import { DbCategory, DbProduct } from '@/lib/supabase/types';
import { uploadMedia } from '@/lib/supabase/storage';
import MediaLibraryPicker from '@/components/admin/MediaLibraryPicker';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCat, setEditingCat] = useState<Partial<DbCategory> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Bulk Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [inUseWarning, setInUseWarning] = useState<any | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([getCategories(), getProducts().catch(() => [])]);
      setCategories(cats);
      setProducts(prods);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingCat({
      name: '',
      slug: '',
      image_url: '/assets/product_bracelet.jpg',
      display_order: categories.length + 1,
    });
  };

  const handleEdit = (cat: DbCategory) => {
    setEditingCat({ ...cat });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err: any) {
      // Deleting a category that still has products is rejected by the
      // foreign key; surface that instead of appearing to succeed.
      alert(err?.message || 'Could not delete the category.');
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const allIds = categories.map((c) => c.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  const handleBulkDeleteConfirm = async (force = false) => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    setActionError(null);
    try {
      const res = await deleteCategoriesBatch(selectedIds, force);
      if (res?.inUse && !force) {
        setInUseWarning(res);
        return;
      }
      setCategories((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      setSelectedIds([]);
      setBulkDeleteModalOpen(false);
      setInUseWarning(null);
    } catch (err: any) {
      setActionError(err?.message || 'Could not delete the selected categories.');
    } finally {
      setBulkDeleting(false);
    }
  };


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat?.name) return;

    setSaving(true);
    try {
      const saved = await saveCategory(editingCat);
      setCategories((prev) => {
        const idx = prev.findIndex((c) => c.id === saved.id);
        if (idx > -1) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
      setEditingCat(null);
    } catch (err: any) {
      alert(`Save error: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, 'categories');
      setEditingCat((prev) => (prev ? { ...prev, image_url: url } : null));
    } catch (err: any) {
      alert(`Image upload error: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#FFFFFF', margin: '0 0 4px' }}>
            Categories Management
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#A6A6B2' }}>
            Add, update, or remove jewellery categories shown on the homepage and collections shop.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {categories.length > 0 && (
            <button
              type="button"
              onClick={handleToggleSelectAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: '#EDEDED',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {categories.every((c) => selectedIds.includes(c.id))
                ? 'Deselect All'
                : `Select All (${categories.length})`}
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: '#DFBDB5',
              color: '#0A0A0C',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#FCA5A5',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '0.84rem',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid of Categories */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: '#DFBDB5' }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
          {categories.map((cat) => {
            const isSelected = selectedIds.includes(cat.id);
            const linkedCount = products.filter((p) => p.category_slug === cat.slug).length;

            return (
              <div
                key={cat.id}
                style={{
                  background: isSelected ? 'rgba(223, 189, 181, 0.05)' : '#141419',
                  border: isSelected ? '1px solid #DFBDB5' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: isSelected ? '0 0 0 1px rgba(223, 189, 181, 0.4)' : undefined,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ position: 'relative', height: '140px', background: '#1F1F26' }}>
                  {/* Selector checkbox */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      zIndex: 5,
                      background: 'rgba(0,0,0,0.65)',
                      backdropFilter: 'blur(4px)',
                      borderRadius: '4px',
                      padding: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectOne(cat.id)}
                      aria-label={`Select ${cat.name}`}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#DFBDB5' }}
                    />
                  </div>

                  <img
                    src={cat.image_url || '/assets/product_bracelet.jpg'}
                    alt={cat.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.7)',
                      color: '#DFBDB5',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                  >
                    Order #{cat.display_order}
                  </span>
                </div>

                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', margin: '0 0 4px', fontFamily: 'var(--font-serif)' }}>
                      {cat.name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: '#72727D' }}>Slug: /{cat.slug}</div>
                    <div style={{ marginTop: '6px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '3px',
                          background: linkedCount > 0 ? 'rgba(223, 189, 181, 0.12)' : 'rgba(255,255,255,0.05)',
                          color: linkedCount > 0 ? '#DFBDB5' : '#72727D',
                          fontWeight: 600,
                        }}
                      >
                        {linkedCount} {linkedCount === 1 ? 'product' : 'products'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(cat)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        background: 'rgba(223, 189, 181, 0.15)',
                        color: '#DFBDB5',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#F87171',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Edit / Add Modal */}
      {editingCat && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#141419',
              border: '1px solid rgba(223, 189, 181, 0.3)',
              borderRadius: '8px',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#FFFFFF', margin: '0 0 16px' }}>
              {editingCat.id ? `Edit Category "${editingCat.name}"` : 'Create New Category'}
            </h2>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#DFBDB5', fontWeight: 600, marginBottom: '6px' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingCat.name || ''}
                  onChange={(e) =>
                    setEditingCat({
                      ...editingCat,
                      name: e.target.value,
                      slug: editingCat.id ? editingCat.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    })
                  }
                  placeholder="e.g. Bangles & Kadas"
                  style={{
                    width: '100%',
                    height: '42px',
                    background: '#1F1F26',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '0 12px',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                  Category Slug *
                </label>
                <input
                  type="text"
                  required
                  value={editingCat.slug || ''}
                  onChange={(e) => setEditingCat({ ...editingCat, slug: e.target.value })}
                  placeholder="e.g. bangles-kadas"
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#DFBDB5', fontWeight: 600, marginBottom: '6px' }}>
                  Thumbnail Image
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '6px', overflow: 'hidden', background: '#1F1F26', flexShrink: 0 }}>
                    <img
                      src={editingCat.image_url || '/assets/product_bracelet.jpg'}
                      alt="Category Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 12px',
                          background: 'rgba(255,255,255,0.08)',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          cursor: uploading ? 'wait' : 'pointer',
                          color: '#EDEDED',
                        }}
                      >
                        <input type="file" accept="image/*" disabled={uploading} onChange={handleImageUpload} style={{ display: 'none' }} />
                        {uploading ? <Loader2 size={13} className="lucide-spin" /> : <Upload size={13} />}
                        <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setMediaPickerOpen(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 12px',
                          background: 'rgba(223, 189, 181, 0.12)',
                          border: '1px solid rgba(223, 189, 181, 0.3)',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: '#DFBDB5',
                        }}
                      >
                        <ImageIcon size={13} />
                        <span>Choose from Library</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editingCat.image_url || ''}
                      onChange={(e) => setEditingCat({ ...editingCat, image_url: e.target.value })}
                      placeholder="or paste URL"
                      style={{
                        width: '100%',
                        height: '32px',
                        background: '#1F1F26',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        padding: '0 8px',
                        color: '#FFFFFF',
                        fontSize: '0.78rem',
                        marginTop: '6px',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                  Display Order
                </label>
                <input
                  type="number"
                  value={editingCat.display_order || 1}
                  onChange={(e) => setEditingCat({ ...editingCat, display_order: Number(e.target.value) })}
                  style={{
                    width: '100px',
                    height: '38px',
                    background: '#1F1F26',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    padding: '0 10px',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  style={{ padding: '8px 16px', background: 'transparent', color: '#A6A6B2', border: 'none', cursor: 'pointer', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '8px 20px',
                    background: '#DFBDB5',
                    color: '#0A0A0C',
                    border: 'none',
                    borderRadius: '5px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: saving ? 'wait' : 'pointer',
                  }}
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaLibraryPicker
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        defaultFolder="categories"
        aspectRatio={1}
        title="Select Category Thumbnail"
        onSelect={(url) => setEditingCat((prev) => (prev ? { ...prev, image_url: url } : null))}
      />

      {/* Floating Action Bar for Multiple Selected Categories */}
      {selectedIds.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 90,
            background: '#1A1A22',
            border: '1px solid rgba(223, 189, 181, 0.4)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
            borderRadius: '10px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            maxWidth: '90vw',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} style={{ color: '#DFBDB5' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
              {selectedIds.length} {selectedIds.length === 1 ? 'category' : 'categories'} selected
            </span>
          </div>

          <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.12)' }} />

          <button
            type="button"
            onClick={handleToggleSelectAll}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#D1D5DB',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {categories.every((c) => selectedIds.includes(c.id)) ? 'Deselect All' : 'Select All'}
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedIds([]);
              setInUseWarning(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              fontSize: '0.8rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Clear Selection
          </button>

          <button
            type="button"
            onClick={() => {
              setInUseWarning(null);
              setBulkDeleteModalOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 16px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: 'auto',
            }}
          >
            <Trash2 size={15} />
            Delete Selected ({selectedIds.length})
          </button>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#141419',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', color: '#EF4444' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#FFFFFF', fontWeight: 700 }}>
                Delete {selectedIds.length} {selectedIds.length === 1 ? 'Category' : 'Categories'}?
              </h3>
            </div>

            {/* In-Use Warning Banner */}
            {(() => {
              const selectedCats = categories.filter((c) => selectedIds.includes(c.id));
              const selectedSlugs = selectedCats.map((c) => c.slug);
              const linked = products.filter((p) => selectedSlugs.includes(p.category_slug));

              if (inUseWarning || linked.length > 0) {
                const count = inUseWarning ? (inUseWarning.linkedProducts?.length || linked.length) : linked.length;
                return (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      marginBottom: '16px',
                      color: '#FCD34D',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Warning:</strong> {count} product(s) are currently assigned to these categories.
                    Deleting these categories will remove their category classification on the storefront.
                  </div>
                );
              }
              return (
                <p style={{ fontSize: '0.86rem', color: '#A6A6B2', margin: '0 0 16px', lineHeight: 1.5 }}>
                  This will permanently remove the selected categories from the shop navigation and homepage. This action cannot be undone.
                </p>
              );
            })()}

            {/* Selected items preview list */}
            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                background: '#1F1F26',
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '20px',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {categories
                .filter((c) => selectedIds.includes(c.id))
                .map((c) => {
                  const pCount = products.filter((p) => p.category_slug === c.slug).length;
                  return (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.82rem',
                        color: '#EDEDED',
                      }}
                    >
                      <img
                        src={c.image_url || '/assets/product_bracelet.jpg'}
                        alt={c.name}
                        style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                      />
                      <span style={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </span>
                      <span style={{ color: '#DFBDB5', fontSize: '0.76rem' }}>
                        {pCount} {pCount === 1 ? 'product' : 'products'}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                disabled={bulkDeleting}
                onClick={() => {
                  setBulkDeleteModalOpen(false);
                  setInUseWarning(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#EDEDED',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: bulkDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={bulkDeleting}
                onClick={() => handleBulkDeleteConfirm(!!inUseWarning)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: bulkDeleting ? 'wait' : 'pointer',
                }}
              >
                {bulkDeleting ? (
                  <>
                    <Loader2 size={15} className="lucide-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>
                      {inUseWarning ? 'Delete Anyway (Force)' : `Delete Selected (${selectedIds.length})`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

