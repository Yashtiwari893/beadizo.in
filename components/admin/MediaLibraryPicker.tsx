'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import {
  X,
  Upload,
  Image as ImageIcon,
  Crop,
  Trash2,
  Check,
  Search,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Sliders,
  RotateCw,
  Folder,
  CheckSquare,
} from 'lucide-react';
import {
  MediaItem,
  UsageScanResult,
  fetchMediaLibrary,
  checkMediaUsage,
  deleteMediaWithSafety,
  deleteMediaBatchWithSafety,
  BulkDeleteResult,
  uploadMedia,
  uploadMediaBatch,
  BulkUploadProgress,
} from '@/lib/supabase/storage';
import { getCroppedImg, PixelCrop } from '@/lib/utils/cropImage';

export interface MediaLibraryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  multiSelect?: boolean;
  onSelectMultiple?: (urls: string[]) => void;
  defaultFolder?: 'products' | 'categories' | 'hero' | 'offers' | 'settings' | 'instagram';
  aspectRatio?: number; // e.g. 1 for square, 16/9 for banner, 4/5 for insta
  title?: string;
}

const FOLDERS = [
  { id: 'all', label: 'All Media' },
  { id: 'products', label: 'Products' },
  { id: 'categories', label: 'Categories' },
  { id: 'hero', label: 'Hero Banners' },
  { id: 'offers', label: 'Offers' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'settings', label: 'Site Settings' },
] as const;

export default function MediaLibraryPicker({
  isOpen,
  onClose,
  onSelect,
  multiSelect = false,
  onSelectMultiple,
  defaultFolder = 'products',
  aspectRatio: initialAspect,
  title = 'Media Library',
}: MediaLibraryPickerProps) {
  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Multi-select state
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  // Uploading state (in Tab 2)
  const [uploadFolder, setUploadFolder] = useState<string>(defaultFolder);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<BulkUploadProgress | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Array<{ filename: string; error: string }>>([]);
  const [recentUploads, setRecentUploads] = useState<string[]>([]);

  // Crop Tool state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropTargetFolder, setCropTargetFolder] = useState<string>(defaultFolder);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<number | undefined>(initialAspect || 1);
  const [cropSaving, setCropSaving] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [checkingUsage, setCheckingUsage] = useState(false);
  const [usageData, setUsageData] = useState<UsageScanResult | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk Delete modal state
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkCheckingUsage, setBulkCheckingUsage] = useState(false);
  const [bulkUsageData, setBulkUsageData] = useState<BulkDeleteResult | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Load media library
  const loadMedia = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchMediaLibrary();
      setMediaList(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load media items.');
    } finally {
      setLoading(false);
    }
  }, []);

  const onCropComplete = useCallback(
    (_croppedArea: any, croppedAreaPixels: PixelCrop) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  useEffect(() => {
    if (isOpen) {
      loadMedia();
      setSelectedUrls([]);
      setRecentUploads([]);
      setUploadErrors([]);
      setUploadProgress(null);
      setBulkDeleteModalOpen(false);
      setBulkUsageData(null);
      if (defaultFolder && defaultFolder !== 'products') {
        setSelectedFolder(defaultFolder);
        setUploadFolder(defaultFolder);
      }
    }
  }, [isOpen, defaultFolder, loadMedia]);

  // Filtered media items
  const filteredMedia = mediaList.filter((item) => {
    const matchesFolder = selectedFolder === 'all' || item.folder === selectedFolder;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.folder.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  // Selection helpers
  const toggleSelectUrl = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const selectAllVisible = () => {
    const visibleUrls = filteredMedia.map((m) => m.url);
    const allSelected = visibleUrls.length > 0 && visibleUrls.every((u) => selectedUrls.includes(u));
    if (allSelected) {
      setSelectedUrls((prev) => prev.filter((u) => !visibleUrls.includes(u)));
    } else {
      setSelectedUrls((prev) => Array.from(new Set([...prev, ...visibleUrls])));
    }
  };

  // Bulk Delete Actions
  const handleOpenBulkDelete = async () => {
    if (selectedUrls.length === 0) return;
    setBulkDeleteModalOpen(true);
    setBulkCheckingUsage(true);
    setBulkUsageData(null);

    try {
      const result = await deleteMediaBatchWithSafety(selectedUrls, false);
      setBulkUsageData(result);
    } catch {
      setBulkUsageData(null);
    } finally {
      setBulkCheckingUsage(false);
    }
  };

  const handleConfirmBulkDelete = async (force = false) => {
    if (selectedUrls.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await deleteMediaBatchWithSafety(selectedUrls, force);
      if (!res.success && res.inUse) {
        setBulkUsageData(res);
        return;
      }

      // Removal succeeded
      const deletedSet = new Set(selectedUrls);
      setMediaList((prev) => prev.filter((m) => !deletedSet.has(m.url)));
      setSelectedUrls([]);
      setBulkDeleteModalOpen(false);
      setBulkUsageData(null);
      await loadMedia();
    } catch (err: any) {
      alert(`Bulk delete error: ${err?.message || err}`);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Handle image selection
  const handleItemClick = (item: MediaItem) => {
    if (multiSelect) {
      if (selectedUrls.includes(item.url)) {
        setSelectedUrls(selectedUrls.filter((u) => u !== item.url));
      } else {
        setSelectedUrls([...selectedUrls, item.url]);
      }
    } else {
      onSelect(item.url);
      onClose();
    }
  };

  const handleConfirmMultiSelect = () => {
    if (onSelectMultiple && selectedUrls.length > 0) {
      onSelectMultiple(selectedUrls);
      onClose();
    }
  };

  // Upload handler in Tab 2 (Supports batch up to 20 images with progress & WebP conversion)
  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    const allFiles = Array.from(rawFiles);
    const maxBatch = 20;
    const filesToUpload = allFiles.slice(0, maxBatch);
    const skippedCount = allFiles.length - filesToUpload.length;

    setUploading(true);
    setErrorMsg(null);
    setUploadErrors([]);
    setUploadProgress({ current: 0, total: filesToUpload.length, filename: '' });

    try {
      const result = await uploadMediaBatch(filesToUpload, uploadFolder, (progress) => {
        setUploadProgress(progress);
      });

      if (result.urls.length > 0) {
        setRecentUploads((prev) => [...result.urls, ...prev]);
        await loadMedia();
      }

      const errors = [...result.errors];
      if (skippedCount > 0) {
        errors.push({
          filename: 'Batch Limit',
          error: `Maximum 20 images allowed at once. ${skippedCount} file(s) were skipped.`,
        });
      }

      if (errors.length > 0) {
        setUploadErrors(errors);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  // Open Crop Modal for an image
  const handleOpenCrop = (imageSrc: string, folder = 'products') => {
    setCropImageSrc(imageSrc);
    setCropTargetFolder(folder);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCropModalOpen(true);
  };

  const handleSaveCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;

    setCropSaving(true);
    setErrorMsg(null);
    try {
      const croppedFile = await getCroppedImg(
        cropImageSrc,
        croppedAreaPixels,
        rotation,
        `cropped-${Date.now()}.jpg`
      );

      const uploadedUrl = await uploadMedia(croppedFile, cropTargetFolder);
      setCropModalOpen(false);
      await loadMedia();

      // If in single-select mode, we can directly select the cropped version!
      if (!multiSelect) {
        onSelect(uploadedUrl);
        onClose();
      } else {
        setSelectedUrls((prev) => [...prev, uploadedUrl]);
        setActiveTab('library');
      }
    } catch (err: any) {
      alert(`Cropping error: ${err?.message || err}`);
    } finally {
      setCropSaving(false);
    }
  };

  // Delete handling
  const handleOpenDelete = async (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(item);
    setDeleteModalOpen(true);
    setCheckingUsage(true);
    setUsageData(null);

    try {
      const result = await checkMediaUsage(item.url);
      setUsageData(result);
    } catch {
      // If usage check fails, default to safe null
      setUsageData(null);
    } finally {
      setCheckingUsage(false);
    }
  };

  const handleConfirmDelete = async (force = false) => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteMediaWithSafety(itemToDelete.url, force);
      if (!res.success && res.inUse) {
        setUsageData({
          inUse: true,
          usageCount: res.usages?.length || 0,
          usages: res.usages || [],
        });
        return;
      }

      // Deletion succeeded
      setMediaList((prev) => prev.filter((m) => m.url !== itemToDelete.url));
      setSelectedUrls((prev) => prev.filter((u) => u !== itemToDelete.url));
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      alert(`Deletion failed: ${err?.message || err}`);
    } finally {
      setDeleting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1020px',
          height: '86vh',
          maxHeight: '820px',
          backgroundColor: '#121217',
          border: '1px solid rgba(223, 189, 181, 0.2)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#15151C',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(223, 189, 181, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DFBDB5',
              }}
            >
              <ImageIcon size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#FFFFFF', fontWeight: 600 }}>{title}</h2>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#A6A6B2' }}>
                Browse existing store images or upload new ones
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Tab navigation */}
            <div
              style={{
                display: 'flex',
                background: '#1D1D26',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('library')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'library' ? '#DFBDB5' : 'transparent',
                  color: activeTab === 'library' ? '#0A0A0C' : '#A6A6B2',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Browse Library ({mediaList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'upload' ? '#DFBDB5' : 'transparent',
                  color: activeTab === 'upload' ? '#0A0A0C' : '#A6A6B2',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Upload size={13} />
                Upload New
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: '#A6A6B2',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab 1: Library View */}
        {activeTab === 'library' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Filter Bar */}
            <div
              style={{
                padding: '12px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#14141A',
              }}
            >
              {/* Folder Pills */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                {FOLDERS.map((f) => {
                  const isSelected = selectedFolder === f.id;
                  const count =
                    f.id === 'all'
                      ? mediaList.length
                      : mediaList.filter((m) => m.folder === f.id).length;

                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFolder(f.id)}
                      style={{
                        padding: '5px 11px',
                        borderRadius: '20px',
                        border: isSelected
                          ? '1px solid #DFBDB5'
                          : '1px solid rgba(255,255,255,0.08)',
                        background: isSelected ? 'rgba(223, 189, 181, 0.15)' : '#1B1B24',
                        color: isSelected ? '#DFBDB5' : '#8E8E9B',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span>{f.label}</span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          opacity: 0.7,
                          padding: '1px 5px',
                          borderRadius: '10px',
                          background: isSelected ? '#DFBDB5' : 'rgba(255,255,255,0.06)',
                          color: isSelected ? '#0A0A0C' : '#FFFFFF',
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Select All & Search & Refresh */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {filteredMedia.length > 0 && (
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    title={
                      filteredMedia.every((m) => selectedUrls.includes(m.url))
                        ? 'Deselect all visible images'
                        : 'Select all visible images'
                    }
                    style={{
                      height: '32px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      background:
                        filteredMedia.length > 0 &&
                        filteredMedia.every((m) => selectedUrls.includes(m.url))
                          ? 'rgba(223, 189, 181, 0.2)'
                          : '#1B1B24',
                      border:
                        filteredMedia.length > 0 &&
                        filteredMedia.every((m) => selectedUrls.includes(m.url))
                          ? '1px solid #DFBDB5'
                          : '1px solid rgba(255,255,255,0.08)',
                      color:
                        filteredMedia.length > 0 &&
                        filteredMedia.every((m) => selectedUrls.includes(m.url))
                          ? '#DFBDB5'
                          : '#EDEDED',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <CheckSquare size={13} />
                    <span>
                      {filteredMedia.length > 0 &&
                      filteredMedia.every((m) => selectedUrls.includes(m.url))
                        ? 'Deselect All'
                        : `Select All (${filteredMedia.length})`}
                    </span>
                  </button>
                )}

                <div
                  style={{
                    position: 'relative',
                    width: '200px',
                  }}
                >
                  <Search
                    size={14}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#71717A',
                    }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search file name..."
                    style={{
                      width: '100%',
                      height: '32px',
                      background: '#1B1B24',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      padding: '0 10px 0 32px',
                      color: '#FFFFFF',
                      fontSize: '0.78rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={loadMedia}
                  title="Reload images"
                  disabled={loading}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: '#1B1B24',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#A6A6B2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: loading ? 'wait' : 'pointer',
                  }}
                >
                  <RefreshCw size={14} className={loading ? 'lucide-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div
                style={{
                  margin: '12px 24px 0',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={15} color="#EF4444" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Media Grid */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 24px',
              }}
            >
              {loading && mediaList.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#DFBDB5',
                    gap: '10px',
                  }}
                >
                  <Loader2 size={28} className="lucide-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '0.85rem' }}>Loading media files from storage...</span>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '240px',
                    color: '#71717A',
                    textAlign: 'center',
                  }}
                >
                  <ImageIcon size={38} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#DFBDB5' }}>No images found</p>
                  <p style={{ margin: '4px 0 14px', fontSize: '0.78rem' }}>
                    {searchQuery
                      ? 'Try adjusting your search keywords'
                      : 'No images uploaded in this folder yet.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    style={{
                      padding: '7px 16px',
                      background: '#DFBDB5',
                      color: '#0A0A0C',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Upload Images
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '14px',
                  }}
                >
                  {filteredMedia.map((item) => {
                    const isSelected = selectedUrls.includes(item.url);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        style={{
                          position: 'relative',
                          aspectRatio: '1/1',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#181820',
                          border: isSelected
                            ? '2px solid #DFBDB5'
                            : '1px solid rgba(255,255,255,0.08)',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 0 12px rgba(223, 189, 181, 0.4)' : 'none',
                          transition: 'transform 0.12s ease, border-color 0.12s ease',
                        }}
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />

                        {/* Top action icons */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            display: 'flex',
                            gap: '4px',
                            zIndex: 2,
                          }}
                        >
                          {/* Crop action */}
                          <button
                            type="button"
                            title="Crop / Edit this image"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCrop(item.url, item.folder);
                            }}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              background: 'rgba(0, 0, 0, 0.75)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: '#DFBDB5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <Crop size={12} />
                          </button>

                          {/* Delete action */}
                          <button
                            type="button"
                            title="Delete file permanently"
                            onClick={(e) => handleOpenDelete(item, e)}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              background: 'rgba(239, 68, 68, 0.8)',
                              border: 'none',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* Selection Checkbox (always accessible for bulk selection & bulk delete) */}
                        <button
                          type="button"
                          title={isSelected ? 'Deselect image' : 'Select image'}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectUrl(item.url);
                          }}
                          style={{
                            position: 'absolute',
                            top: '6px',
                            left: '6px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '5px',
                            background: isSelected ? '#DFBDB5' : 'rgba(0,0,0,0.65)',
                            border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0A0A0C',
                            cursor: 'pointer',
                            zIndex: 2,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </button>

                        {/* Bottom Tag Bar */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '4px 6px',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            pointerEvents: 'none',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.62rem',
                              color: '#DFBDB5',
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '65%',
                            }}
                          >
                            {item.folder}
                          </span>
                          <span style={{ fontSize: '0.58rem', color: '#A1A1AA' }}>
                            {formatBytes(item.size)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Multi-Select & Bulk Actions Footer */}
            {(multiSelect || selectedUrls.length > 0) && (
              <div
                style={{
                  padding: '12px 24px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  background: '#15151C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  animation: 'fadeIn 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: '#A6A6B2' }}>
                  <div>
                    <strong style={{ color: '#FFFFFF' }}>{selectedUrls.length}</strong> image
                    {selectedUrls.length === 1 ? '' : 's'} selected
                  </div>
                  {selectedUrls.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedUrls([])}
                      style={{
                        padding: '4px 10px',
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#A6A6B2',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                      }}
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {/* Bulk Delete Button */}
                  {selectedUrls.length > 0 && (
                    <button
                      type="button"
                      onClick={handleOpenBulkDelete}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#FCA5A5',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <Trash2 size={14} color="#EF4444" />
                      <span>Delete Selected ({selectedUrls.length})</span>
                    </button>
                  )}

                  {/* Insert Selected (only for multiSelect form picker) */}
                  {multiSelect && onSelectMultiple && (
                    <button
                      type="button"
                      onClick={handleConfirmMultiSelect}
                      disabled={selectedUrls.length === 0}
                      style={{
                        padding: '8px 20px',
                        background: selectedUrls.length > 0 ? '#DFBDB5' : 'rgba(223, 189, 181, 0.2)',
                        color: selectedUrls.length > 0 ? '#0A0A0C' : '#6B6B7A',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: selectedUrls.length > 0 ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Check size={14} />
                      Insert Selected ({selectedUrls.length})
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Upload New View */}
        {activeTab === 'upload' && (
          <div
            style={{
              flex: 1,
              padding: '30px 40px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* Folder selection for upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '0.84rem', color: '#DFBDB5', fontWeight: 600 }}>
                Upload destination folder:
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {FOLDERS.filter((f) => f.id !== 'all').map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setUploadFolder(f.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border:
                        uploadFolder === f.id
                          ? '1px solid #DFBDB5'
                          : '1px solid rgba(255,255,255,0.08)',
                      background: uploadFolder === f.id ? 'rgba(223, 189, 181, 0.15)' : '#1B1B24',
                      color: uploadFolder === f.id ? '#DFBDB5' : '#8E8E9B',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Folder size={12} />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Errors Alert Banner */}
            {uploadErrors.length > 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#FCA5A5',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <AlertTriangle size={15} color="#EF4444" />
                    <span>Some files could not be uploaded ({uploadErrors.length}):</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadErrors([])}
                    title="Dismiss"
                    style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {uploadErrors.map((err, idx) => (
                    <li key={idx}>
                      <strong>{err.filename}:</strong> {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Drop Zone */}
            <label
              style={{
                border: '2px dashed rgba(223, 189, 181, 0.35)',
                borderRadius: '12px',
                padding: '48px 24px',
                background: 'rgba(223, 189, 181, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading ? 'wait' : 'pointer',
                textAlign: 'center',
                transition: 'border-color 0.2s ease',
              }}
            >
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading}
                onChange={handleUploadFiles}
                style={{ display: 'none' }}
              />

              {uploading && uploadProgress ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '380px' }}>
                  <Loader2
                    size={38}
                    className="lucide-spin"
                    style={{ color: '#DFBDB5', animation: 'spin 1s linear infinite', marginBottom: '14px' }}
                  />
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>
                    Uploading {uploadProgress.current} of {uploadProgress.total}...
                  </span>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: '#DFBDB5',
                      opacity: 0.85,
                      marginBottom: '14px',
                      maxWidth: '320px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {uploadProgress.filename || 'Processing image...'}
                  </span>
                  {/* Progress bar */}
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(5, Math.round((uploadProgress.current / uploadProgress.total) * 100))}%`,
                        height: '100%',
                        background: '#DFBDB5',
                        transition: 'width 0.25s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#8E8E9B', marginTop: '10px' }}>
                    Auto-converting to WebP (80% quality) • Capped at 1600px
                  </span>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'rgba(223, 189, 181, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#DFBDB5',
                      marginBottom: '14px',
                    }}
                  >
                    <Upload size={24} />
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: '#FFFFFF' }}>
                    Click or drag & drop images to bulk upload
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#8E8E9B', marginTop: '6px' }}>
                    Select up to 20 images at once • Max 5MB each • Auto-converted to WebP
                  </span>
                </>
              )}
            </label>

            {/* Recently uploaded in this session */}
            {recentUploads.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#DFBDB5',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Uploaded in this session ({recentUploads.length}):</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('library')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#DFBDB5',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    View in Library →
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {recentUploads.map((url, idx) => (
                    <div
                      key={url + idx}
                      style={{
                        position: 'relative',
                        aspectRatio: '1/1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid rgba(223, 189, 181, 0.3)',
                        background: '#1A1A22',
                      }}
                    >
                      <img src={url} alt="Recent upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.6)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          opacity: 0,
                          transition: 'opacity 0.15s ease',
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0')}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (multiSelect) {
                              if (onSelectMultiple) onSelectMultiple([url]);
                            } else {
                              onSelect(url);
                            }
                            onClose();
                          }}
                          style={{
                            padding: '4px 10px',
                            background: '#DFBDB5',
                            color: '#0A0A0C',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Select Image
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenCrop(url, uploadFolder)}
                          style={{
                            padding: '4px 10px',
                            background: 'rgba(255,255,255,0.15)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Crop size={11} /> Crop
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================
          CROP TOOL MODAL OVERLAY
          ========================================================= */}
      {cropModalOpen && cropImageSrc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(10px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => !cropSaving && setCropModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '820px',
              backgroundColor: '#16161E',
              border: '1px solid rgba(223, 189, 181, 0.25)',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 30px 70px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Crop Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crop size={18} color="#DFBDB5" />
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#FFFFFF' }}>Crop & Adjust Image</h3>
              </div>
              <button
                type="button"
                disabled={cropSaving}
                onClick={() => setCropModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#A6A6B2',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Cropper Container */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '420px',
                background: '#0B0B0E',
              }}
            >
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={selectedAspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Controls Bar */}
            <div
              style={{
                padding: '16px 20px',
                background: '#121217',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {/* Aspect Ratio Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.76rem', color: '#DFBDB5', fontWeight: 600 }}>Aspect Ratio:</span>
                {[
                  { label: '1:1 (Square - Product/Category)', val: 1 },
                  { label: '4:5 (Portrait - Instagram)', val: 4 / 5 },
                  { label: '16:9 (Landscape - Hero Banner)', val: 16 / 9 },
                  { label: 'Free', val: undefined },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSelectedAspect(preset.val)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border:
                        selectedAspect === preset.val
                          ? '1px solid #DFBDB5'
                          : '1px solid rgba(255,255,255,0.1)',
                      background: selectedAspect === preset.val ? '#DFBDB5' : '#1A1A22',
                      color: selectedAspect === preset.val ? '#0A0A0C' : '#FFFFFF',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Sliders and Rotate */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                {/* Zoom Slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '300px' }}>
                  <Sliders size={14} color="#A6A6B2" />
                  <span style={{ fontSize: '0.74rem', color: '#A6A6B2' }}>Zoom</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#DFBDB5' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#FFFFFF', minWidth: '32px' }}>
                    {zoom.toFixed(1)}x
                  </span>
                </div>

                {/* Rotate Button */}
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: '#1A1A22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#EDEDED',
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RotateCw size={13} />
                  <span>Rotate 90° ({rotation}°)</span>
                </button>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    disabled={cropSaving}
                    onClick={() => setCropModalOpen(false)}
                    style={{
                      padding: '8px 16px',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#EDEDED',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={cropSaving}
                    onClick={handleSaveCrop}
                    style={{
                      padding: '8px 20px',
                      background: '#DFBDB5',
                      color: '#0A0A0C',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: cropSaving ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {cropSaving ? (
                      <>
                        <Loader2 size={14} className="lucide-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Save & Use Cropped</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SAFETY DELETE CONFIRMATION MODAL
          ========================================================= */}
      {deleteModalOpen && itemToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => !deleting && setDeleteModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#16161F',
              border: usageData?.inUse
                ? '1px solid rgba(239, 68, 68, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: usageData?.inUse ? 'rgba(239, 68, 68, 0.15)' : 'rgba(223, 189, 181, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: usageData?.inUse ? '#EF4444' : '#DFBDB5',
                  flexShrink: 0,
                }}
              >
                {usageData?.inUse ? <AlertTriangle size={22} /> : <Trash2 size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#FFFFFF' }}>
                  {usageData?.inUse ? 'Image is currently in use!' : 'Delete image from storage?'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#A6A6B2', lineHeight: 1.4 }}>
                  {itemToDelete.name}
                </p>
              </div>
            </div>

            {/* Thumbnail Preview */}
            <div
              style={{
                width: '100%',
                height: '110px',
                borderRadius: '6px',
                overflow: 'hidden',
                background: '#0D0D11',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={itemToDelete.url}
                alt="File preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Usage Check Section */}
            {checkingUsage ? (
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8rem',
                  color: '#DFBDB5',
                }}
              >
                <Loader2 size={15} className="lucide-spin" />
                <span>Scanning database to check if this image is being used...</span>
              </div>
            ) : usageData?.inUse ? (
              <div
                style={{
                  padding: '14px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '0.82rem', color: '#FCA5A5', fontWeight: 600 }}>
                  ⚠️ Warning: This image is actively used in {usageData.usageCount} location(s):
                </div>
                <div
                  style={{
                    maxHeight: '130px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {usageData.usages.map((u, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: '0.78rem',
                        color: '#EDEDED',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: '3px',
                          background: 'rgba(255,255,255,0.1)',
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          color: '#DFBDB5',
                        }}
                      >
                        {u.type}
                      </span>
                      <strong>{u.title}</strong>
                      <span style={{ color: '#8E8E9B', fontSize: '0.72rem' }}>({u.location})</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#FCA5A5', marginTop: '4px' }}>
                  Permanently deleting this file will cause broken images on your live storefront.
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#A6A6B2',
                  lineHeight: 1.4,
                }}
              >
                This image is not currently used in any products, categories, banners, or offers. It is safe to delete.
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModalOpen(false)}
                style={{
                  padding: '8px 16px',
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

              {usageData?.inUse ? (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => handleConfirmDelete(true)}
                  style={{
                    padding: '8px 16px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: deleting ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {deleting ? <Loader2 size={14} className="lucide-spin" /> : <Trash2 size={14} />}
                  <span>Delete Anyway (Force)</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={deleting || checkingUsage}
                  onClick={() => handleConfirmDelete(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: deleting || checkingUsage ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {deleting ? <Loader2 size={14} className="lucide-spin" /> : <Trash2 size={14} />}
                  <span>Delete Permanently</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SAFETY BULK DELETE CONFIRMATION MODAL
          ========================================================= */}
      {bulkDeleteModalOpen && selectedUrls.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => !bulkDeleting && setBulkDeleteModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: '#16161F',
              border: bulkUsageData?.inUse
                ? '1px solid rgba(239, 68, 68, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: bulkUsageData?.inUse ? 'rgba(239, 68, 68, 0.15)' : 'rgba(223, 189, 181, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: bulkUsageData?.inUse ? '#EF4444' : '#DFBDB5',
                  flexShrink: 0,
                }}
              >
                {bulkUsageData?.inUse ? <AlertTriangle size={22} /> : <Trash2 size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#FFFFFF' }}>
                  {bulkUsageData?.inUse
                    ? 'Some selected images are in use!'
                    : `Delete ${selectedUrls.length} images from storage?`}
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#A6A6B2', lineHeight: 1.4 }}>
                  {selectedUrls.length} file{selectedUrls.length === 1 ? '' : 's'} selected for permanent deletion.
                </p>
              </div>
            </div>

            {/* Selected Thumbnails Preview Grid */}
            <div
              style={{
                width: '100%',
                maxHeight: '130px',
                overflowY: 'auto',
                borderRadius: '8px',
                background: '#0D0D11',
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '10px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(55px, 1fr))',
                gap: '8px',
              }}
            >
              {selectedUrls.map((url, idx) => (
                <div
                  key={url + idx}
                  style={{
                    aspectRatio: '1/1',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: '#1A1A22',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <img src={url} alt="Selected preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>

            {/* Usage Check Section */}
            {bulkCheckingUsage ? (
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8rem',
                  color: '#DFBDB5',
                }}
              >
                <Loader2 size={15} className="lucide-spin" />
                <span>Scanning database to check if any of these images are being used...</span>
              </div>
            ) : bulkUsageData?.inUse ? (
              <div
                style={{
                  padding: '14px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '0.82rem', color: '#FCA5A5', fontWeight: 600 }}>
                  ⚠️ Warning: {bulkUsageData.inUseCount} of the selected images are actively used:
                </div>
                <div
                  style={{
                    maxHeight: '140px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {bulkUsageData.inUseItems?.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: '0.76rem',
                        color: '#EDEDED',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '6px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {item.usages.map((u, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                padding: '1px 5px',
                                borderRadius: '3px',
                                background: 'rgba(255,255,255,0.1)',
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                color: '#DFBDB5',
                              }}
                            >
                              {u.type}
                            </span>
                            <strong>{u.title}</strong>
                            <span style={{ color: '#8E8E9B', fontSize: '0.7rem' }}>({u.location})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#FCA5A5', marginTop: '4px' }}>
                  Force-deleting these files will cause broken images on your live storefront.
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#A6A6B2',
                  lineHeight: 1.4,
                }}
              >
                None of these images are currently linked to active products, categories, banners, or offers. It is safe to delete them.
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                disabled={bulkDeleting}
                onClick={() => setBulkDeleteModalOpen(false)}
                style={{
                  padding: '8px 16px',
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

              {bulkUsageData?.inUse ? (
                <button
                  type="button"
                  disabled={bulkDeleting}
                  onClick={() => handleConfirmBulkDelete(true)}
                  style={{
                    padding: '8px 16px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: bulkDeleting ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {bulkDeleting ? <Loader2 size={14} className="lucide-spin" /> : <Trash2 size={14} />}
                  <span>Delete All Anyway (Force)</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={bulkDeleting || bulkCheckingUsage}
                  onClick={() => handleConfirmBulkDelete(true)}
                  style={{
                    padding: '8px 16px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: bulkDeleting || bulkCheckingUsage ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {bulkDeleting ? <Loader2 size={14} className="lucide-spin" /> : <Trash2 size={14} />}
                  <span>Delete {selectedUrls.length} Files Permanently</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
