'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Save,
  Trash2,
  CheckCircle2,
  Upload,
  Loader2,
  BookOpen,
  Sparkles,
  Eye,
  ExternalLink,
  Tag as TagIcon,
  Clock,
  Globe,
  Image as ImageIcon,
} from 'lucide-react';
import { getBlogPosts, saveBlogPost, deleteBlogPost, generateBlogAiPost } from '@/lib/supabase/data';
import { DbBlogPost } from '@/lib/supabase/types';
import { uploadMedia } from '@/lib/supabase/storage';
import MediaLibraryPicker from '@/components/admin/MediaLibraryPicker';

export default function AdminBlogsPage() {
  const [posts, setPosts] = useState<DbBlogPost[]>([]);
  const [activePost, setActivePost] = useState<DbBlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // AI Modal states
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    const data = await getBlogPosts();
    setPosts(data);
    if (data.length > 0 && !activePost) {
      setActivePost(data[0]);
    } else if (data.length === 0) {
      handleCreateNew();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateNew = () => {
    const fresh: DbBlogPost = {
      id: '',
      slug: 'new-handcrafted-story',
      title: 'New Artisan Story',
      excerpt: 'A brief 2-sentence summary of this article that will show on Google and social media cards.',
      content: `### Discover the Craft\n\nWrite your story here or use our AI Generator to create an entire article in one click.`,
      cover_image: '/assets/product_necklace.jpg',
      tags: ['Handcrafted', 'Style Guide'],
      meta_title: 'New Artisan Story | Beadizo Journal',
      meta_description: 'Discover handcrafted jewellery styling advice and artisan stories from Beadizo.',
      is_published: true,
      published_at: new Date().toISOString(),
      read_time: '4 min read',
    };
    setActivePost(fresh);
  };

  const handleSelectPost = (post: DbBlogPost) => {
    setActivePost({ ...post });
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, 'blogs');
      setActivePost((prev) => (prev ? { ...prev, cover_image: url } : null));
    } catch (err: any) {
      alert(`Upload error: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const saved = await saveBlogPost(activePost);
      setActivePost(saved);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      const data = await getBlogPosts();
      setPosts(data);
    } catch (err: any) {
      alert(`Save error: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      setActivePost(posts[0] || null);
      return;
    }
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await deleteBlogPost(id);
      const updated = await getBlogPosts();
      setPosts(updated);
      setActivePost(updated[0] || null);
    } catch (err: any) {
      alert(err?.message || 'Could not delete the article.');
    }
  };

  const handleGenerateAi = async () => {
    if (!aiTopic.trim()) {
      alert('Please enter a topic or title for the article.');
      return;
    }
    setAiGenerating(true);
    try {
      const generated = await generateBlogAiPost(aiTopic, aiKeywords);
      setActivePost((prev) => ({
        ...(prev || ({} as any)),
        title: generated.title || aiTopic,
        slug: generated.slug || aiTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        excerpt: generated.excerpt || '',
        content: generated.content || '',
        tags: Array.isArray(generated.tags) && generated.tags.length > 0 ? generated.tags : ['Handcrafted', 'Style Guide'],
        meta_title: generated.meta_title || `${generated.title} | Beadizo Journal`,
        meta_description: generated.meta_description || generated.excerpt,
        read_time: generated.read_time || '5 min read',
        is_published: true,
      }));
      setAiModalOpen(false);
      setAiTopic('');
      setAiKeywords('');
    } catch (err: any) {
      alert(`AI Generation error: ${err.message || err}`);
    } finally {
      setAiGenerating(false);
    }
  };

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
            Blog Stories & SEO Journal
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#A6A6B2' }}>
            Publish search-optimized styling guides and stories to rank on Google and attract organic shoppers.
          </p>
        </div>

        <div className="admin-header-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'linear-gradient(135deg, rgba(223, 189, 181, 0.25) 0%, rgba(176, 122, 106, 0.25) 100%)',
              color: '#DFBDB5',
              border: '1px solid #DFBDB5',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <Sparkles size={16} />
            <span>Write with AI ✨</span>
          </button>

          <button
            type="button"
            onClick={handleCreateNew}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
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
            <span>New Story</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !activePost}
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
            <span>{saving ? 'Publishing...' : 'Save & Publish'}</span>
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
          <span>Article updated successfully! The live journal and Google XML sitemap are synchronized.</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="admin-offers-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Posts List */}
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
              <BookOpen size={16} />
              <span>Published Stories ({posts.length})</span>
            </div>

            {loading ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#7E7E8F', fontSize: '0.85rem' }}>
                Loading articles...
              </div>
            ) : posts.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#7E7E8F', fontSize: '0.85rem' }}>
                No stories yet. Click "Write with AI" to generate one.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {posts.map((p) => {
                  const isSelected = activePost?.id === p.id;
                  return (
                    <div
                      key={p.id || Math.random()}
                      onClick={() => handleSelectPost(p)}
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
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: isSelected ? '#DFBDB5' : '#FFFFFF',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginRight: '8px',
                          }}
                        >
                          {p.title}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: p.is_published ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: p.is_published ? '#4ADE80' : '#EF4444',
                          }}
                        >
                          {p.is_published ? 'LIVE' : 'DRAFT'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#8E8E9F' }}>
                        <span>{p.read_time || '4 min'}</span>
                        <span>•</span>
                        <span>/{p.slug}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Editor */}
        {activePost ? (
          <div
            style={{
              background: '#141419',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Editor Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#DFBDB5' }}>
                  {activePost.id ? 'Edit Story' : 'Draft New Story'}
                </span>
                {activePost.slug && (
                  <a
                    href={`/blog/${activePost.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      color: '#A6A6B2',
                      textDecoration: 'none',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <span>View on site</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#DFBDB5', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={activePost.is_published}
                    onChange={(e) => setActivePost({ ...activePost, is_published: e.target.checked })}
                    style={{ accentColor: '#DFBDB5' }}
                  />
                  <span>Published on Storefront</span>
                </label>

                {activePost.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(activePost.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    title="Delete post"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Title & Slug */}
            <div className="admin-two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#DFBDB5', fontWeight: 600, marginBottom: '6px' }}>
                  Article Headline / Title
                </label>
                <input
                  type="text"
                  value={activePost.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    const autoSlug = activePost.slug === activePost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                      ? newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                      : activePost.slug;
                    setActivePost({ ...activePost, title: newTitle, slug: autoSlug });
                  }}
                  placeholder="e.g. How to Style Beaded Bracelets for Everyday Elegance"
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
                  URL Slug (/blog/[slug])
                </label>
                <input
                  type="text"
                  value={activePost.slug}
                  onChange={(e) => setActivePost({ ...activePost, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') })}
                  placeholder="how-to-style-beaded-bracelets"
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
            </div>

            {/* Cover Image Upload */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#DFBDB5', fontWeight: 600, marginBottom: '6px' }}>
                Cover Image Photo
              </label>
              <div className="admin-upload-row" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={activePost.cover_image}
                  onChange={(e) => setActivePost({ ...activePost, cover_image: e.target.value })}
                  placeholder="/assets/product_necklace.jpg or https://..."
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
                    <input type="file" accept="image/*" onChange={handleUploadCover} disabled={uploading} style={{ display: 'none' }} />
                  </label>

                  <button
                    type="button"
                    onClick={() => setMediaPickerOpen(true)}
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

            {/* Tags & Read Time */}
            <div className="admin-two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                  Category Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={activePost.tags?.join(', ') || ''}
                  onChange={(e) => setActivePost({ ...activePost, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
                  placeholder="Handcrafted, Style Guide, Crystal Meanings"
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
                  Estimated Read Time
                </label>
                <input
                  type="text"
                  value={activePost.read_time || '4 min read'}
                  onChange={(e) => setActivePost({ ...activePost, read_time: e.target.value })}
                  placeholder="e.g. 5 min read"
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
            </div>

            {/* Excerpt */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#DFBDB5', fontWeight: 600, marginBottom: '6px' }}>
                Article Excerpt / Social Summary
              </label>
              <textarea
                rows={2}
                value={activePost.excerpt}
                onChange={(e) => setActivePost({ ...activePost, excerpt: e.target.value })}
                placeholder="2-sentence teaser shown in blog grid cards and Google search previews."
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

            {/* Article Content */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', color: '#DFBDB5', fontWeight: 600 }}>
                  Article Body (Supports ### Headings &amp; - Bullet points)
                </label>
                <span style={{ fontSize: '0.72rem', color: '#8E8E9F' }}>
                  Separate paragraphs with blank lines
                </span>
              </div>
              <textarea
                rows={12}
                value={activePost.content}
                onChange={(e) => setActivePost({ ...activePost, content: e.target.value })}
                placeholder="Write your article content..."
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#1B1B22',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  fontFamily: 'monospace',
                }}
              />
            </div>

            {/* SEO Metadata Box */}
            <div
              style={{
                padding: '18px',
                background: '#101014',
                borderRadius: '8px',
                border: '1px solid rgba(223, 189, 181, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#DFBDB5', fontWeight: 700 }}>
                <Globe size={16} />
                <span>Google Search Engine Preview (SEO Meta Tags)</span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#A6A6B2' }}>SEO Title Tag</label>
                  <span style={{ fontSize: '0.7rem', color: (activePost.meta_title || '').length > 60 ? '#EF4444' : '#4ADE80' }}>
                    {(activePost.meta_title || '').length}/60 chars
                  </span>
                </div>
                <input
                  type="text"
                  value={activePost.meta_title || ''}
                  onChange={(e) => setActivePost({ ...activePost, meta_title: e.target.value })}
                  placeholder="e.g. How to Style Beaded Bracelets | Beadizo Journal"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#1B1B22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: '#DFBDB5',
                    fontSize: '0.82rem',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#A6A6B2' }}>SEO Meta Description</label>
                  <span style={{ fontSize: '0.7rem', color: (activePost.meta_description || '').length > 160 ? '#EF4444' : '#4ADE80' }}>
                    {(activePost.meta_description || '').length}/160 chars
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={activePost.meta_description || ''}
                  onChange={(e) => setActivePost({ ...activePost, meta_description: e.target.value })}
                  placeholder="Summary shown in Google search results beneath your page title."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#1B1B22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: '#EDEDED',
                    fontSize: '0.82rem',
                    lineHeight: 1.4,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: '#A6A6B2', padding: '40px', textAlign: 'center' }}>
            Select or create an article to edit.
          </div>
        )}
      </div>

      {/* AI Writer Modal */}
      {aiModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#141419',
              border: '1px solid rgba(223, 189, 181, 0.3)',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#DFBDB5' }}>
              <Sparkles size={20} />
              <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#FFFFFF' }}>
                AI SEO Article Generator
              </h3>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#A6A6B2', lineHeight: 1.5, margin: '0 0 18px' }}>
              Powered by Groq (ultra-fast) with Google Gemini fallback. Automatically drafts an SEO-rich title, URL slug, formatted content, category tags, and meta tags.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#DFBDB5', fontWeight: 600, marginBottom: '6px' }}>
                  Article Topic or Idea
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Why Evil Eye Beaded Bracelets Are So Popular in 2026"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#1B1B22',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A6A6B2', marginBottom: '6px' }}>
                  Target Keywords or Focus (Optional)
                </label>
                <input
                  type="text"
                  value={aiKeywords}
                  onChange={(e) => setAiKeywords(e.target.value)}
                  placeholder="e.g. handmade, evil eye protection, crystal healing"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#1B1B22',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  disabled={aiGenerating}
                  style={{
                    padding: '9px 16px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#EDEDED',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleGenerateAi}
                  disabled={aiGenerating || !aiTopic.trim()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 20px',
                    background: '#DFBDB5',
                    color: '#0A0A0C',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: aiGenerating ? 'wait' : 'pointer',
                  }}
                >
                  {aiGenerating ? <Loader2 size={15} className="lucide-spin" /> : <Sparkles size={15} />}
                  <span>{aiGenerating ? 'Generating Article...' : 'Generate with AI'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MediaLibraryPicker
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        defaultFolder="blogs"
        aspectRatio={16 / 9}
        title="Select Blog Cover Image"
        onSelect={(url) => setActivePost((prev) => (prev ? { ...prev, cover_image: url } : null))}
      />
    </div>
  );
}
