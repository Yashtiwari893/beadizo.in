'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';
import { getInstagramPosts, saveInstagramPost, deleteInstagramPost } from '@/lib/supabase/data';
import { DbInstagramPost } from '@/lib/supabase/types';
import { uploadMedia } from '@/lib/supabase/storage';
import MediaLibraryPicker from '@/components/admin/MediaLibraryPicker';

export default function AdminInstagramPage() {
  const [posts, setPosts] = useState<DbInstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Partial<DbInstagramPost> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);


  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getInstagramPosts(true); // include inactive for admin
      setPosts(data);
    } catch (err) {
      console.error('Failed to load instagram posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    const nextOrder = posts.length > 0 ? Math.max(...posts.map((p) => p.display_order || 0)) + 1 : 1;
    setEditingPost({
      image_url: '',
      post_link: 'https://www.instagram.com/beadizo.in',
      caption: '',
      display_order: nextOrder,
      is_active: true,
    });
  };

  const handleEdit = (post: DbInstagramPost) => {
    setEditingPost({ ...post });
  };

  const handleToggleActive = async (post: DbInstagramPost) => {
    try {
      const updated = await saveInstagramPost({ ...post, is_active: !post.is_active });
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showToast(updated.is_active ? 'Post is now visible on storefront.' : 'Post hidden from storefront.');
    } catch (err: any) {
      alert(`Could not toggle status: ${err?.message || err}`);
    }
  };

  const handleDelete = async (id: string, caption?: string | null) => {
    const label = caption ? `"${caption}"` : 'this Instagram post';
    if (!confirm(`Are you sure you want to remove ${label}?`)) return;

    try {
      await deleteInstagramPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      showToast('Instagram post removed successfully.');
    } catch (err: any) {
      alert(`Delete error: ${err?.message || err}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost?.image_url) {
      alert('Please upload or provide an image URL for the post.');
      return;
    }

    setSaving(true);
    try {
      const saved = await saveInstagramPost(editingPost);
      setPosts((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id);
        if (idx > -1) {
          const next = [...prev];
          next[idx] = saved;
          return next.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        }
        return [...prev, saved].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      });
      setEditingPost(null);
      showToast('Instagram post saved and published successfully!');
    } catch (err: any) {
      alert(`Save error: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadMedia(file, 'instagram');
      setEditingPost((prev) => (prev ? { ...prev, image_url: url } : null));
    } catch (err: any) {
      alert(`Upload error: ${err?.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  const activePostsCount = posts.filter((p) => p.is_active).length;

  return (
    <div>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <InstagramIcon size={22} color="#DFBDB5" />
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#FFFFFF', margin: 0 }}>
              Instagram Feed Manager
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#A6A6B2' }}>
            Manage the &ldquo;Follow Us @Beadizo&rdquo; photos on the homepage. Upload lookbook images and link directly to Instagram posts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#DFBDB5',
            color: '#0A0A0C',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
          }}
        >
          <Plus size={16} /> Add Instagram Post
        </button>
      </div>

      {/* Toast Notification */}
      {successMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            background: 'rgba(74, 222, 128, 0.15)',
            border: '1px solid rgba(74, 222, 128, 0.35)',
            borderRadius: '6px',
            color: '#4ADE80',
            fontSize: '0.85rem',
            marginBottom: '20px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Layout Guidance Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '14px 18px',
          background: '#16161D',
          border: '1px solid rgba(223, 189, 181, 0.2)',
          borderRadius: '8px',
          marginBottom: '28px',
        }}
      >
        <Sparkles size={18} color="#DFBDB5" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.82rem', lineHeight: 1.5, color: '#D6D6DF' }}>
          <strong style={{ color: '#FFFFFF' }}>Layout Recommendation: </strong>
          Currently showing <strong style={{ color: '#DFBDB5' }}>{activePostsCount} active posts</strong> on the homepage.
          We recommend keeping between <span style={{ color: '#DFBDB5', fontWeight: 600 }}>4 to 8 images</span> (6 or 7 looks best on wide screens) so the strip remains elegant and visually balanced.
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#DFBDB5' }}>
          <Loader2 size={24} className="lucide-spin" style={{ margin: '0 auto 12px' }} />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading Instagram posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div
          style={{
            padding: '48px',
            background: '#141419',
            border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <InstagramIcon size={36} color="#A6A6B2" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
          <h3 style={{ margin: '0 0 6px', color: '#FFFFFF', fontSize: '1.1rem' }}>No Instagram Posts Yet</h3>
          <p style={{ margin: '0 0 18px', color: '#A6A6B2', fontSize: '0.85rem' }}>
            Click &ldquo;Add Instagram Post&rdquo; above to upload your first photo.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              padding: '9px 18px',
              background: '#DFBDB5',
              color: '#0A0A0C',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            + Add First Post
          </button>
        </div>
      ) : (
        <>
          {/* Posts Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '18px',
              marginBottom: '36px',
            }}
          >
            {posts.map((post) => (
              <div
                key={post.id}
                style={{
                  background: '#141419',
                  border: `1px solid ${post.is_active ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.2)'}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'border-color 0.2s ease',
                  opacity: post.is_active ? 1 : 0.65,
                }}
              >
                {/* Thumbnail */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#1C1C24' }}>
                  <img
                    src={post.image_url}
                    alt={post.caption || 'Instagram feed post'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Order Badge */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(10, 10, 12, 0.85)',
                      color: '#DFBDB5',
                      padding: '3px 7px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    #{post.display_order}
                  </span>

                  {/* Status Badge */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: post.is_active ? 'rgba(34, 197, 94, 0.85)' : 'rgba(100, 116, 139, 0.85)',
                      color: '#FFFFFF',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {post.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>

                {/* Details */}
                <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {post.caption && (
                      <p style={{ margin: '0 0 6px', fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {post.caption}
                      </p>
                    )}
                    <a
                      href={post.post_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.74rem',
                        color: '#DFBDB5',
                        textDecoration: 'none',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <ExternalLink size={12} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {post.post_link.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@')}
                      </span>
                    </a>
                  </div>

                  {/* Actions Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '14px',
                      paddingTop: '10px',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Toggle Active Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(post)}
                      title={post.is_active ? 'Hide from storefront' : 'Show on storefront'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'transparent',
                        border: 'none',
                        color: post.is_active ? '#4ADE80' : '#A6A6B2',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {post.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span>{post.is_active ? 'Active' : 'Hidden'}</span>
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(post)}
                        title="Edit post"
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          border: 'none',
                          color: '#FFFFFF',
                          padding: '6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id, post.caption)}
                        title="Delete post"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: 'none',
                          color: '#EF4444',
                          padding: '6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Live Storefront Preview */}
          <div
            style={{
              background: '#141419',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '24px',
              marginTop: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontSize: '0.82rem', color: '#DFBDB5', fontWeight: 600 }}>
              <Eye size={15} /> Storefront Live Preview
            </div>

            <div style={{ textAlign: 'center', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#DFBDB5' }}>
                FOLLOW US @BEADIZO
              </span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#FFFFFF', margin: '4px 0 20px' }}>
                Be a part of our beautiful journey
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.max(activePostsCount, 4)}, 1fr)`,
                  gap: '8px',
                  maxWidth: '900px',
                  margin: '0 auto',
                }}
              >
                {posts
                  .filter((p) => p.is_active)
                  .slice(0, 8)
                  .map((p) => (
                    <div
                      key={p.id}
                      style={{
                        position: 'relative',
                        aspectRatio: '1/1',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        background: '#1C1C24',
                      }}
                    >
                      <img src={p.image_url} alt="lookbook preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Modal */}
      {editingPost && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#181820',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '520px',
              padding: '26px',
              color: '#EDEDED',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: '#FFFFFF' }}>
                {editingPost.id ? 'Edit Instagram Post' : 'Add New Instagram Post'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                style={{ background: 'none', border: 'none', color: '#A6A6B2', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Image Upload & Preview */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#DFBDB5', marginBottom: '8px' }}>
                  Post Image *
                </label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      background: '#111116',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {editingPost.image_url ? (
                      <img
                        src={editingPost.image_url}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <InstagramIcon size={28} color="#A6A6B2" style={{ opacity: 0.4 }} />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                          fontWeight: 600,
                        }}
                      >
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          disabled={uploading}
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                        {uploading ? <Loader2 size={14} className="lucide-spin" /> : <Upload size={14} />}
                        <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setMediaPickerOpen(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          background: 'rgba(223, 189, 181, 0.12)',
                          border: '1px solid rgba(223, 189, 181, 0.3)',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: '#DFBDB5',
                        }}
                      >
                        <ImageIcon size={14} />
                        <span>Choose from Library</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={editingPost.image_url || ''}
                      onChange={(e) => setEditingPost({ ...editingPost, image_url: e.target.value })}
                      placeholder="or enter image URL..."
                      style={{
                        width: '100%',
                        height: '34px',
                        background: '#111116',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        padding: '0 10px',
                        color: '#FFFFFF',
                        fontSize: '0.78rem',
                        marginTop: '8px',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Instagram Post Link */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#DFBDB5', marginBottom: '6px' }}>
                  Instagram Post / Profile URL *
                </label>
                <input
                  type="text"
                  required
                  value={editingPost.post_link || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, post_link: e.target.value })}
                  placeholder="https://www.instagram.com/p/C_abc123... or https://www.instagram.com/beadizo.in"
                  style={{
                    width: '100%',
                    height: '38px',
                    background: '#111116',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '0 12px',
                    color: '#FFFFFF',
                    fontSize: '0.84rem',
                  }}
                />
                <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#8E8E9F' }}>
                  When visitors click this image on the homepage, this Instagram link will open safely in a new tab.
                </p>
              </div>

              {/* Caption / Internal Note */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#DFBDB5', marginBottom: '6px' }}>
                  Caption / Label (Optional)
                </label>
                <input
                  type="text"
                  value={editingPost.caption || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, caption: e.target.value })}
                  placeholder="e.g. Handmade Rose Quartz Bracelet"
                  style={{
                    width: '100%',
                    height: '38px',
                    background: '#111116',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '0 12px',
                    color: '#FFFFFF',
                    fontSize: '0.84rem',
                  }}
                />
              </div>

              {/* Display Order & Active Toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#DFBDB5', marginBottom: '6px' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingPost.display_order ?? 0}
                    onChange={(e) => setEditingPost({ ...editingPost, display_order: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      height: '38px',
                      background: '#111116',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      padding: '0 12px',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#DFBDB5', marginBottom: '6px' }}>
                    Visibility Status
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      height: '38px',
                      padding: '0 12px',
                      background: '#111116',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      color: editingPost.is_active ? '#4ADE80' : '#A6A6B2',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={editingPost.is_active ?? true}
                      onChange={(e) => setEditingPost({ ...editingPost, is_active: e.target.checked })}
                      style={{ cursor: 'pointer', accentColor: '#DFBDB5' }}
                    />
                    <span>{editingPost.is_active ? 'Active (Visible)' : 'Hidden'}</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  disabled={saving}
                  style={{
                    padding: '9px 16px',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#EDEDED',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 20px',
                    background: '#DFBDB5',
                    color: '#0A0A0C',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: saving ? 'wait' : 'pointer',
                  }}
                >
                  {saving && <Loader2 size={14} className="lucide-spin" />}
                  <span>{saving ? 'Saving...' : 'Save & Publish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaLibraryPicker
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        defaultFolder="instagram"
        aspectRatio={4 / 5}
        title="Select Instagram Feed Image"
        onSelect={(url) => setEditingPost((prev) => (prev ? { ...prev, image_url: url } : null))}
      />
    </div>
  );
}
