'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { getCategories, saveCategory, deleteCategory } from '@/lib/supabase/data';
import { DbCategory } from '@/lib/supabase/types';
import { uploadMedia } from '@/lib/supabase/storage';
import MediaLibraryPicker from '@/components/admin/MediaLibraryPicker';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCat, setEditingCat] = useState<Partial<DbCategory> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);


  const loadData = async () => {
    setLoading(true);
    const cats = await getCategories();
    setCategories(cats);
    setLoading(false);
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
    } catch (err: any) {
      // Deleting a category that still has products is rejected by the
      // foreign key; surface that instead of appearing to succeed.
      alert(err?.message || 'Could not delete the category.');
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

      {/* Grid of Categories */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: '#DFBDB5' }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
          {categories.map((cat) => (
          <div
            key={cat.id}
            style={{
              background: '#141419',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ position: 'relative', height: '140px', background: '#1F1F26' }}>
              <img
                src={cat.image_url || '/assets/product_bracelet.jpg'}
                alt={cat.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
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
        ))}
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
    </div>
  );
}
