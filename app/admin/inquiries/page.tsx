'use client';

import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Search,
  AlertCircle,
  Trash2,
  Phone,
  Mail,
  Clock,
  Check,
  RotateCcw,
  Eye,
  X,
  Send,
} from 'lucide-react';
import {
  getContactSubmissions,
  markContactSubmissionRead,
  deleteContactSubmission,
} from '@/lib/supabase/data';
import { DbContactSubmission } from '@/lib/supabase/types';

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<DbContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeModalInquiry, setActiveModalInquiry] = useState<DbContactSubmission | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await getContactSubmissions();
      setInquiries(data);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleRead = async (inquiry: DbContactSubmission) => {
    setActionError(null);
    const newStatus = !inquiry.is_read;
    try {
      await markContactSubmissionRead(inquiry.id, newStatus);
      setInquiries((prev) =>
        prev.map((i) => (i.id === inquiry.id ? { ...i, is_read: newStatus } : i))
      );
      if (activeModalInquiry?.id === inquiry.id) {
        setActiveModalInquiry((prev) => (prev ? { ...prev, is_read: newStatus } : null));
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update inquiry status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer inquiry?')) return;
    setActionError(null);
    setDeletingId(id);
    try {
      await deleteContactSubmission(id);
      setInquiries((prev) => prev.filter((i) => i.id !== id));
      if (activeModalInquiry?.id === id) {
        setActiveModalInquiry(null);
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete inquiry.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleReplyWhatsApp = (inquiry: DbContactSubmission) => {
    // Clean phone number: keep digits only
    let cleanPhone = inquiry.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const replyGreeting = `Hi ${inquiry.name}! Thank you for reaching out to Beadizo regarding "${inquiry.inquiry_type}".`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(replyGreeting)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // Auto mark as read if currently unread
    if (!inquiry.is_read) {
      handleToggleRead(inquiry);
    }
  };

  const filteredInquiries = inquiries.filter((item) => {
    if (filterStatus === 'unread' && item.is_read) return false;
    if (filterStatus === 'read' && !item.is_read) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      item.message.toLowerCase().includes(q) ||
      item.inquiry_type.toLowerCase().includes(q)
    );
  });

  const unreadCount = inquiries.filter((i) => !i.is_read).length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.85rem',
                color: '#EDEDED',
                margin: 0,
              }}
            >
              Customer Inquiries
            </h1>
            {unreadCount > 0 && (
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: '#EF4444',
                  color: '#fff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p style={{ color: '#8E8E9F', fontSize: '0.88rem', margin: '6px 0 0' }}>
            Direct customer leads from the storefront contact form. One-click WhatsApp replies.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            background: 'rgba(255,255,255,0.06)',
            color: '#DFBDB5',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            fontSize: '0.84rem',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={15} className={loading ? 'lucide-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {actionError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#FCA5A5',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '0.88rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '420px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#72727D',
            }}
          />
          <input
            type="text"
            placeholder="Search by customer name, phone, message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              background: '#141419',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              color: '#EDEDED',
              fontSize: '0.86rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#141419', padding: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['all', 'unread', 'read'] as const).map((status) => {
            const isSelected = filterStatus === status;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  background: isSelected ? '#DFBDB5' : 'transparent',
                  color: isSelected ? '#0E0E12' : '#A6A6B2',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {status === 'unread' ? `Unread (${unreadCount})` : status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inquiries Table */}
      <div
        style={{
          background: '#141419',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#8E8E9F' }}>
            <RotateCcw size={24} className="lucide-spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading customer inquiries...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#8E8E9F' }}>
            <MessageSquare size={36} style={{ margin: '0 auto 14px', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.05rem', color: '#EDEDED', margin: '0 0 6px' }}>
              No inquiries found
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              {search ? 'Try clearing your search query.' : 'New messages from the contact page will appear here.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '14px 18px', color: '#8E8E9F', fontWeight: 600, width: '40px' }}>Status</th>
                  <th style={{ padding: '14px 18px', color: '#8E8E9F', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '14px 18px', color: '#8E8E9F', fontWeight: 600 }}>Inquiry Type</th>
                  <th style={{ padding: '14px 18px', color: '#8E8E9F', fontWeight: 600, width: '38%' }}>Message</th>
                  <th style={{ padding: '14px 18px', color: '#8E8E9F', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '14px 18px', color: '#8E8E9F', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.map((inquiry) => {
                  const isUnread = !inquiry.is_read;
                  const dateStr = new Date(inquiry.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={inquiry.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: isUnread ? 'rgba(223, 189, 181, 0.04)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Status Dot */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                        <button
                          onClick={() => handleToggleRead(inquiry)}
                          title={isUnread ? 'Mark as read' : 'Mark as unread'}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: isUnread ? '#EF4444' : '#4ADE80',
                              boxShadow: isUnread ? '0 0 8px rgba(239, 68, 68, 0.5)' : 'none',
                            }}
                          />
                        </button>
                      </td>

                      {/* Customer Info */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: isUnread ? 700 : 600, color: '#EDEDED', marginBottom: '4px' }}>
                          {inquiry.name}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.78rem', color: '#A6A6B2' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Phone size={12} color="#DFBDB5" />
                            <span>{inquiry.phone}</span>
                          </span>
                          {inquiry.email && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <Mail size={12} color="#DFBDB5" />
                              <span>{inquiry.email}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Inquiry Type */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            background: 'rgba(255,255,255,0.06)',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#DFBDB5',
                            fontWeight: 500,
                          }}
                        >
                          {inquiry.inquiry_type}
                        </span>
                      </td>

                      {/* Message Preview */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                        <p
                          onClick={() => setActiveModalInquiry(inquiry)}
                          title="Click to view full message"
                          style={{
                            margin: 0,
                            color: isUnread ? '#FFF' : '#C7C7D1',
                            fontSize: '0.84rem',
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            cursor: 'pointer',
                          }}
                        >
                          {inquiry.message}
                        </p>
                        <button
                          onClick={() => setActiveModalInquiry(inquiry)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '4px 0 0',
                            color: '#DFBDB5',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={12} /> View full message
                        </button>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top', whiteSpace: 'nowrap', color: '#8E8E9F', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={12} />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {/* Reply on WhatsApp */}
                          <button
                            onClick={() => handleReplyWhatsApp(inquiry)}
                            title="Reply on WhatsApp"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              background: '#25D366',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <Send size={13} />
                            <span>WhatsApp</span>
                          </button>

                          {/* Toggle Read */}
                          <button
                            onClick={() => handleToggleRead(inquiry)}
                            title={isUnread ? 'Mark as read' : 'Mark as unread'}
                            style={{
                              padding: '6px 10px',
                              background: 'rgba(255,255,255,0.06)',
                              color: '#DFBDB5',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <Check size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(inquiry.id)}
                            disabled={deletingId === inquiry.id}
                            title="Delete inquiry"
                            style={{
                              padding: '6px 10px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#F87171',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
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

      {/* Full Message Detail Modal */}
      {activeModalInquiry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setActiveModalInquiry(null)}
        >
          <div
            style={{
              background: '#141419',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '100%',
              padding: '28px',
              color: '#EDEDED',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#DFBDB5',
                    fontWeight: 700,
                  }}
                >
                  {activeModalInquiry.inquiry_type}
                </span>
                <h2 style={{ fontSize: '1.4rem', margin: '4px 0 0', color: '#FFF' }}>
                  {activeModalInquiry.name}
                </h2>
              </div>
              <button
                onClick={() => setActiveModalInquiry(null)}
                style={{ background: 'none', border: 'none', color: '#A6A6B2', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px 16px', borderRadius: '6px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} color="#DFBDB5" />
                <span><strong>Phone:</strong> {activeModalInquiry.phone}</span>
              </div>
              {activeModalInquiry.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} color="#DFBDB5" />
                  <span><strong>Email:</strong> {activeModalInquiry.email}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8E8E9F' }}>
                <Clock size={14} />
                <span>
                  <strong>Received:</strong>{' '}
                  {new Date(activeModalInquiry.created_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8E8E9F', marginBottom: '8px' }}>
                Message
              </h4>
              <div
                style={{
                  background: '#0E0E12',
                  padding: '16px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {activeModalInquiry.message}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => handleToggleRead(activeModalInquiry)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#DFBDB5',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '5px',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                {activeModalInquiry.is_read ? 'Mark as Unread' : 'Mark as Read'}
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleDelete(activeModalInquiry.id)}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#F87171',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '5px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
                <button
                  onClick={() => handleReplyWhatsApp(activeModalInquiry)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    background: '#25D366',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Send size={14} /> Reply On WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
