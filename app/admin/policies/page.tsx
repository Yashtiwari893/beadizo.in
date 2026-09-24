'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Save,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  FileText,
  Truck,
  ExternalLink,
  RotateCcw,
  Eye,
  Edit3,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { getSiteSettings, saveSiteSettings } from '@/lib/supabase/data';
import { DbSiteSettings } from '@/lib/supabase/types';
import {
  DEFAULT_PRIVACY_POLICY,
  DEFAULT_REFUND_POLICY,
  DEFAULT_TERMS_CONDITIONS,
  DEFAULT_SHIPPING_POLICY,
} from '@/lib/legal/defaultPolicies';

type PolicyTab = 'privacy' | 'refund' | 'terms' | 'shipping';

interface TabConfig {
  id: PolicyTab;
  label: string;
  field: keyof Pick<DbSiteSettings, 'privacy_policy' | 'refund_policy' | 'terms_conditions' | 'shipping_policy'>;
  liveUrl: string;
  icon: LucideIcon;
  defaultTemplate: string;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: 'privacy',
    label: 'Privacy Policy',
    field: 'privacy_policy',
    liveUrl: '/privacy-policy',
    icon: ShieldCheck,
    defaultTemplate: DEFAULT_PRIVACY_POLICY,
    description: 'Outlines data collection, payment security, cookies, and customer rights under Indian IT regulations.',
  },
  {
    id: 'refund',
    label: 'Refund & Exchange',
    field: 'refund_policy',
    liveUrl: '/refund-policy',
    icon: RefreshCw,
    defaultTemplate: DEFAULT_REFUND_POLICY,
    description: 'Guidelines on unboxing videos, 48-hour transit damage replacement, non-returnable items, and refund turnaround.',
  },
  {
    id: 'terms',
    label: 'Terms & Conditions',
    field: 'terms_conditions',
    liveUrl: '/terms',
    icon: FileText,
    defaultTemplate: DEFAULT_TERMS_CONDITIONS,
    description: 'Contract terms governing user purchases, handmade natural bead variations, intellectual property, and jurisdiction.',
  },
  {
    id: 'shipping',
    label: 'Shipping Policy',
    field: 'shipping_policy',
    liveUrl: '/shipping-policy',
    icon: Truck,
    defaultTemplate: DEFAULT_SHIPPING_POLICY,
    description: 'Delivery zones across India, 1-2 day dispatch timelines, free shipping thresholds, and tracking updates.',
  },
];

export default function AdminPoliciesPage() {
  const [activeTab, setActiveTab] = useState<PolicyTab>('privacy');
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Policy text states
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [refundPolicy, setRefundPolicy] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const s = await getSiteSettings();
        setPrivacyPolicy(s.privacy_policy || DEFAULT_PRIVACY_POLICY);
        setRefundPolicy(s.refund_policy || DEFAULT_REFUND_POLICY);
        setTermsConditions(s.terms_conditions || DEFAULT_TERMS_CONDITIONS);
        setShippingPolicy(s.shipping_policy || DEFAULT_SHIPPING_POLICY);
        setLastUpdated(s.policies_updated_at || s.updated_at || null);
      } catch (err) {
        console.error('Failed to load policies:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const currentTabConfig = TABS.find((t) => t.id === activeTab) || TABS[0];

  const getCurrentText = () => {
    switch (activeTab) {
      case 'privacy':
        return privacyPolicy;
      case 'refund':
        return refundPolicy;
      case 'terms':
        return termsConditions;
      case 'shipping':
        return shippingPolicy;
      default:
        return '';
    }
  };

  const handleTextChange = (val: string) => {
    switch (activeTab) {
      case 'privacy':
        setPrivacyPolicy(val);
        break;
      case 'refund':
        setRefundPolicy(val);
        break;
      case 'terms':
        setTermsConditions(val);
        break;
      case 'shipping':
        setShippingPolicy(val);
        break;
    }
  };

  const handleRestoreDefault = () => {
    if (
      window.confirm(
        `Are you sure you want to reset "${currentTabConfig.label}" to the pre-written legal template? Any unsaved edits will be replaced.`
      )
    ) {
      handleTextChange(currentTabConfig.defaultTemplate);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const nowIso = new Date().toISOString();
      await saveSiteSettings({
        privacy_policy: privacyPolicy,
        refund_policy: refundPolicy,
        terms_conditions: termsConditions,
        shipping_policy: shippingPolicy,
        policies_updated_at: nowIso,
      });

      setLastUpdated(nowIso);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      alert(`Save error: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#B07A6A' }}>
        <Loader2 size={32} className="lucide-spin" style={{ margin: '0 auto 12px' }} />
        <p style={{ fontSize: '0.95rem' }}>Loading legal policy documents...</p>
      </div>
    );
  }

  const currentText = getCurrentText();
  const wordCount = currentText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = currentText.length;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: 'rgba(176, 122, 106, 0.12)',
              color: '#B07A6A',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            <ShieldCheck size={13} /> Legal &amp; Compliance Management
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
              fontSize: '1.85rem',
              margin: '0 0 6px',
              color: 'var(--admin-text, #1A1A2E)',
            }}
          >
            Legal Policies &amp; Store Terms
          </h1>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--admin-subtext, #72727D)', maxWidth: '650px' }}>
            Edit, update, and manage your live store policies. Changes save directly to the database and reflect live on customer storefront pages and during checkout.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href={currentTabConfig.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 500,
              textDecoration: 'none',
              backgroundColor: 'var(--admin-card, #FFFFFF)',
              color: 'var(--admin-text, #1A1A2E)',
              border: '1px solid var(--admin-border, rgba(0,0,0,0.1))',
            }}
          >
            <ExternalLink size={14} /> View Live Page
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 20px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              backgroundColor: savedSuccess ? '#10B981' : '#B07A6A',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 2px 10px rgba(176, 122, 106, 0.25)',
              transition: 'all 0.2s ease',
            }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="lucide-spin" /> Saving...
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 size={16} /> All Policies Saved!
              </>
            ) : (
              <>
                <Save size={16} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Bar */}
      {savedSuccess && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10B981',
            color: '#10B981',
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} />
          <span>Policies successfully updated and synchronized across all storefront pages!</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--admin-border, rgba(0,0,0,0.08))',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 18px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: isActive ? '3px solid #B07A6A' : '3px solid transparent',
                backgroundColor: isActive ? 'var(--admin-card, #FFFFFF)' : 'transparent',
                color: isActive ? '#B07A6A' : 'var(--admin-subtext, #72727D)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Meta & Controls Bar */}
      <div
        style={{
          backgroundColor: 'var(--admin-card, #FFFFFF)',
          borderRadius: '12px',
          border: '1px solid var(--admin-border, rgba(0,0,0,0.08))',
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--admin-text, #1A1A2E)' }}>
              {currentTabConfig.label}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(0,0,0,0.05)',
                color: 'var(--admin-subtext, #72727D)',
                fontFamily: 'monospace',
              }}
            >
              {currentTabConfig.liveUrl}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--admin-subtext, #72727D)' }}>
            {currentTabConfig.description}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Preview vs Edit Toggle */}
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: '1px solid var(--admin-border, rgba(0,0,0,0.12))',
              backgroundColor: previewMode ? 'rgba(176, 122, 106, 0.1)' : 'var(--admin-bg, #F4F5F7)',
              color: previewMode ? '#B07A6A' : 'var(--admin-text, #1A1A2E)',
            }}
          >
            {previewMode ? (
              <>
                <Edit3 size={13} /> Switch to Editor
              </>
            ) : (
              <>
                <Eye size={13} /> Preview Live Layout
              </>
            )}
          </button>

          {/* Reset to Default Template */}
          <button
            type="button"
            onClick={handleRestoreDefault}
            title="Reset this policy to the comprehensive legal template"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              color: '#EF4444',
            }}
          >
            <RotateCcw size={13} /> Reset Template
          </button>
        </div>
      </div>

      {/* Editor / Preview Area */}
      <div
        style={{
          backgroundColor: 'var(--admin-card, #FFFFFF)',
          borderRadius: '12px',
          border: '1px solid var(--admin-border, rgba(0,0,0,0.08))',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}
      >
        {previewMode ? (
          /* Live Markdown Preview */
          <div style={{ padding: '32px 36px', minHeight: '480px', lineHeight: 1.8 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '20px',
              }}
            >
              <Eye size={12} /> Storefront Live Preview
            </div>

            {currentText.split('\n\n').map((block, idx) => {
              const trimmed = block.trim();
              if (!trimmed) return null;

              if (trimmed.startsWith('## ')) {
                return (
                  <h2
                    key={idx}
                    style={{
                      fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                      fontSize: '1.4rem',
                      color: 'var(--admin-text, #1A1A2E)',
                      margin: idx === 0 ? '0 0 12px' : '28px 0 12px',
                      paddingBottom: '6px',
                      borderBottom: '1px solid var(--admin-border, rgba(0,0,0,0.06))',
                    }}
                  >
                    {trimmed.replace(/^##\s*/, '')}
                  </h2>
                );
              }

              if (trimmed.startsWith('### ')) {
                return (
                  <h3
                    key={idx}
                    style={{
                      fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                      fontSize: '1.15rem',
                      color: 'var(--admin-text, #1A1A2E)',
                      margin: '20px 0 8px',
                    }}
                  >
                    {trimmed.replace(/^###\s*/, '')}
                  </h3>
                );
              }

              if (trimmed.startsWith('- ')) {
                const items = trimmed.split('\n').filter((l) => l.trim().startsWith('- '));
                return (
                  <ul key={idx} style={{ paddingLeft: '22px', margin: '10px 0 16px' }}>
                    {items.map((item, itemIdx) => (
                      <li
                        key={itemIdx}
                        style={{ fontSize: '0.92rem', color: 'var(--admin-text, #2D2D3A)', marginBottom: '6px' }}
                      >
                        {item.replace(/^-\s*/, '')}
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p
                  key={idx}
                  style={{
                    fontSize: '0.92rem',
                    color: 'var(--admin-text, #2D2D3A)',
                    lineHeight: 1.7,
                    marginBottom: '14px',
                  }}
                >
                  {trimmed}
                </p>
              );
            })}
          </div>
        ) : (
          /* Plain-Text / Markdown Editor */
          <div>
            <textarea
              value={currentText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`Enter ${currentTabConfig.label} text here (Markdown format supported: ## Section, - bullets)...`}
              style={{
                width: '100%',
                minHeight: '520px',
                padding: '24px',
                fontSize: '0.92rem',
                lineHeight: 1.7,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                color: 'var(--admin-text, #1A1A2E)',
                backgroundColor: 'var(--admin-card, #FFFFFF)',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />

            {/* Bottom Status & Hints Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                backgroundColor: 'var(--admin-bg, #F9FAFB)',
                borderTop: '1px solid var(--admin-border, rgba(0,0,0,0.06))',
                fontSize: '0.78rem',
                color: 'var(--admin-subtext, #72727D)',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={13} />
                <span>
                  Formatting tip: Use <strong>## Section Title</strong> for headings, <strong>- item</strong> for bullets, and <strong>**text**</strong> for bold.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{charCount} characters</span>
                {lastUpdated && (
                  <>
                    <span>•</span>
                    <span>
                      Saved:{' '}
                      {new Date(lastUpdated).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Action */}
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 28px',
            borderRadius: '8px',
            fontSize: '0.92rem',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            backgroundColor: savedSuccess ? '#10B981' : '#B07A6A',
            color: '#FFFFFF',
            border: 'none',
            boxShadow: '0 2px 10px rgba(176, 122, 106, 0.25)',
          }}
        >
          {saving ? (
            <>
              <Loader2 size={16} className="lucide-spin" /> Saving Changes...
            </>
          ) : savedSuccess ? (
            <>
              <CheckCircle2 size={16} /> Saved Successfully!
            </>
          ) : (
            <>
              <Save size={16} /> Save All Policies
            </>
          )}
        </button>
      </div>
    </div>
  );
}
