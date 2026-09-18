'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Star,
  Trash2,
  Edit,
  ExternalLink,
  Package,
  Loader2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { getProducts, getCategories, saveProduct, deleteProduct, deleteProductsBatch } from '@/lib/supabase/data';
import { DbProduct, DbCategory } from '@/lib/supabase/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Bulk Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);


  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
      setProducts(prods);
      setCategories(cats);
    } catch (err: any) {
      setActionError(err?.message || 'Could not load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // These writes can now fail loudly (expired session, validation, DB error)
  // instead of being silently swallowed, so the UI only updates after the
  // server confirms — no more optimistic state that contradicts the database.
  const persistToggle = async (product: DbProduct, patch: Partial<DbProduct>) => {
    setActionError(null);
    const updated = { ...product, ...patch };
    try {
      await saveProduct(updated);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
    } catch (err: any) {
      setActionError(err?.message || 'Could not update the product.');
    }
  };

  const handleToggleStock = (product: DbProduct) =>
    persistToggle(product, { is_available: !product.is_available });

  const handleToggleFeatured = (product: DbProduct) =>
    persistToggle(product, { is_featured: !product.is_featured });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    setActionError(null);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setActionError(err?.message || 'Could not delete the product.');
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category_slug === categoryFilter;
    const matchesGender = genderFilter === 'all' || (p.gender || 'unisex').toLowerCase() === genderFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesGender;
  });

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const filteredIds = filtered.map((p) => p.id);
    const allFilteredSelected =
      filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    setActionError(null);
    try {
      await deleteProductsBatch(selectedIds);
      setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      setBulkDeleteModalOpen(false);
    } catch (err: any) {
      setActionError(err?.message || 'Could not delete the selected products.');
    } finally {
      setBulkDeleting(false);
    }
  };


  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#FFFFFF', margin: '0 0 4px' }}>
            Products Catalog
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#A6A6B2' }}>
            Manage pricing, multiple photos, availability, and featured designs.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: '#DFBDB5',
            color: '#0A0A0C',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '0.84rem',
            textDecoration: 'none',
          }}
        >
          <Plus size={16} /> Add New Product
        </Link>
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

      {/* Filter & Search Bar */}
      <div
        style={{
          background: '#141419',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#72727D' }} />
          <input
            type="text"
            placeholder="Search by product name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              background: '#1F1F26',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '0 14px 0 38px',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            height: '40px',
            background: '#1F1F26',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: '0 12px',
            color: '#FFFFFF',
            fontSize: '0.85rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          style={{
            height: '40px',
            background: '#1F1F26',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: '0 12px',
            color: '#FFFFFF',
            fontSize: '0.85rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="all">All Genders</option>
          <option value="women">Women</option>
          <option value="men">Men</option>
          <option value="unisex">Unisex</option>
        </select>

        <span style={{ fontSize: '0.8rem', color: '#72727D', marginLeft: 'auto' }}>
          Showing {filtered.length} of {products.length} products
        </span>
      </div>

      {/* Table */}
      <div style={{ background: '#141419', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#DFBDB5' }}>Loading products...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#A6A6B2' }}>
            <Package size={36} style={{ color: '#DFBDB5', margin: '0 auto 12px', opacity: 0.7 }} />
            <h3 style={{ fontSize: '1.1rem', color: '#FFFFFF', marginBottom: '6px' }}>No products found</h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '340px', margin: '0 auto 16px' }}>
              No items match your search or filter criteria. Add a new piece to your catalog!
            </p>
            <Link
              href="/admin/products/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#DFBDB5',
                color: '#0A0A0C',
                borderRadius: '5px',
                fontWeight: 700,
                fontSize: '0.8rem',
                textDecoration: 'none',
              }}
            >
              <Plus size={14} /> Create Product
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', color: '#A6A6B2', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: '14px 12px 14px 20px', width: '36px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && filtered.every((p) => selectedIds.includes(p.id))}
                      onChange={handleToggleSelectAll}
                      title="Select / Deselect all filtered products"
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#DFBDB5' }}
                    />
                  </th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Product & Images</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Gender</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Selling Price</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Original Price</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'center' }}>Stock Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'center' }}>Featured</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((prod) => {
                  const hasDiscount = prod.original_price && prod.original_price > prod.price;
                  const discountPercent = hasDiscount
                    ? Math.round(((prod.original_price! - prod.price) / prod.original_price!) * 100)
                    : 0;
                  const isSelected = selectedIds.includes(prod.id);

                  return (
                    <tr
                      key={prod.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: isSelected ? 'rgba(223, 189, 181, 0.08)' : undefined,
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '14px 12px 14px 20px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(prod.id)}
                          aria-label={`Select ${prod.title}`}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#DFBDB5' }}
                        />
                      </td>

                      {/* Product details */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

                          <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', background: '#1F1F26' }}>
                            <img
                              src={prod.images[0] || '/assets/product_bracelet.jpg'}
                              alt={prod.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {prod.images.length > 1 && (
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: '2px',
                                  right: '2px',
                                  background: 'rgba(0,0,0,0.7)',
                                  color: '#fff',
                                  fontSize: '0.62rem',
                                  padding: '1px 4px',
                                  borderRadius: '2px',
                                }}
                              >
                                +{prod.images.length - 1}
                              </span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{prod.title}</span>
                              {prod.badge && (
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    background: 'rgba(223, 189, 181, 0.2)',
                                    color: '#DFBDB5',
                                    padding: '1px 6px',
                                    borderRadius: '3px',
                                    textTransform: 'uppercase',
                                    fontWeight: 700,
                                  }}
                                >
                                  {prod.badge}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#72727D', marginTop: '2px' }}>
                              /{prod.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '14px 16px', color: '#EDEDED', textTransform: 'capitalize' }}>
                        <span style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.78rem' }}>
                          {prod.category_slug}
                        </span>
                      </td>

                      {/* Gender */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            background:
                              prod.gender === 'women'
                                ? 'rgba(244, 114, 182, 0.15)'
                                : prod.gender === 'men'
                                ? 'rgba(96, 165, 250, 0.15)'
                                : 'rgba(255,255,255,0.06)',
                            color:
                              prod.gender === 'women'
                                ? '#F472B6'
                                : prod.gender === 'men'
                                ? '#60A5FA'
                                : '#D1D5DB',
                            borderRadius: '4px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {prod.gender || 'unisex'}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#FFFFFF' }}>
                        ₹{prod.price.toLocaleString('en-IN')}
                      </td>

                      {/* Original Price */}
                      <td style={{ padding: '14px 16px', color: '#72727D' }}>
                        {prod.original_price ? (
                          <div>
                            <span style={{ textDecoration: 'line-through' }}>₹{prod.original_price.toLocaleString('en-IN')}</span>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: '#4ADE80', fontWeight: 600 }}>
                              Save {discountPercent}%
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Stock Switch */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStock(prod)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: prod.is_available ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: prod.is_available ? '#4ADE80' : '#F87171',
                          }}
                        >
                          {prod.is_available ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                          <span>{prod.is_available ? 'In Stock' : 'Sold Out'}</span>
                        </button>
                      </td>

                      {/* Featured Switch */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(prod)}
                          title="Toggle show on Homepage Bestsellers"
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            border: 'none',
                            cursor: 'pointer',
                            background: prod.is_featured ? 'rgba(253, 224, 71, 0.2)' : 'rgba(255,255,255,0.06)',
                            color: prod.is_featured ? '#FDE047' : '#72727D',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Star size={14} fill={prod.is_featured ? '#FDE047' : 'none'} />
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Link
                            href={`/product/${prod.slug || prod.id}`}
                            target="_blank"
                            title="View product on live store"
                            style={{
                              padding: '6px',
                              background: 'rgba(255,255,255,0.06)',
                              color: '#A6A6B2',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <ExternalLink size={14} />
                          </Link>

                          <Link
                            href={`/admin/products/${prod.id}`}
                            title="Edit product"
                            style={{
                              padding: '6px 10px',
                              background: '#DFBDB5',
                              color: '#0A0A0C',
                              borderRadius: '4px',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Edit size={13} /> Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(prod.id, prod.title)}
                            title="Delete product"
                            style={{
                              padding: '6px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#F87171',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Action Bar for Multiple Selected Products */}
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
              {selectedIds.length} {selectedIds.length === 1 ? 'product' : 'products'} selected
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
            {filtered.length > 0 && filtered.every((p) => selectedIds.includes(p.id))
              ? 'Deselect All'
              : 'Select All Filtered'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds([])}
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
            onClick={() => setBulkDeleteModalOpen(true)}
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
            zIndex: 100,
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
                Delete {selectedIds.length} {selectedIds.length === 1 ? 'Product' : 'Products'}?
              </h3>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#A6A6B2', margin: '0 0 16px', lineHeight: 1.5 }}>
              This will permanently remove the selected products from your catalog and database. This action cannot be undone.
            </p>

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
              {products
                .filter((p) => selectedIds.includes(p.id))
                .map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.82rem',
                      color: '#EDEDED',
                    }}
                  >
                    <img
                      src={p.images[0] || '/assets/product_bracelet.jpg'}
                      alt={p.title}
                      style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                    />
                    <span style={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </span>
                    <span style={{ color: '#DFBDB5', fontSize: '0.78rem' }}>₹{p.price.toLocaleString('en-IN')}</span>
                  </div>
                ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                disabled={bulkDeleting}
                onClick={() => setBulkDeleteModalOpen(false)}
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
                onClick={handleBulkDeleteConfirm}
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
                    <span>Delete {selectedIds.length} {selectedIds.length === 1 ? 'Product' : 'Products'}</span>
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

