import React from 'react';
import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/supabase/data';
import { DEFAULT_REFUND_POLICY } from '@/lib/legal/defaultPolicies';
import PolicyPageLayout from '@/components/policy/PolicyPageLayout';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Refund & Exchange Policy | Beadizo Handcrafted Jewellery',
  description:
    'Our transparent return, replacement, and exchange guidelines for Beadizo handcrafted jewellery. 48-hour transit damage protection and seamless resolutions.',
  alternates: {
    canonical: 'https://beadizo.in/refund-policy',
  },
  openGraph: {
    title: 'Refund & Exchange Policy | Beadizo Handcrafted Jewellery',
    description: 'Guidelines on returns, exchanges, and refunds at Beadizo.',
    url: 'https://beadizo.in/refund-policy',
    siteName: 'Beadizo',
    type: 'website',
  },
};

export default async function RefundPolicyPage() {
  const settings = await getSiteSettings();
  const content = settings.refund_policy || DEFAULT_REFUND_POLICY;

  return (
    <PolicyPageLayout
      title="Refund &amp; Exchange Policy"
      subtitle="Clear and fair guidelines for transit damage replacements, returns, and refunds."
      updatedAt={settings.policies_updated_at || settings.updated_at}
      content={content}
    />
  );
}
