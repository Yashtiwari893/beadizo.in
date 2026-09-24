import React from 'react';
import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/supabase/data';
import { DEFAULT_PRIVACY_POLICY } from '@/lib/legal/defaultPolicies';
import PolicyPageLayout from '@/components/policy/PolicyPageLayout';

export const revalidate = 60; // revalidate every 60s

export const metadata: Metadata = {
  title: 'Privacy Policy | Beadizo Handcrafted Jewellery',
  description:
    'Learn how Beadizo collects, uses, and safeguards your personal data when browsing our collections or placing orders. 100% secure shopping experience.',
  alternates: {
    canonical: 'https://beadizo.in/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy | Beadizo Handcrafted Jewellery',
    description: 'Learn how Beadizo collects, uses, and safeguards your personal data.',
    url: 'https://beadizo.in/privacy-policy',
    siteName: 'Beadizo',
    type: 'website',
  },
};

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();
  const content = settings.privacy_policy || DEFAULT_PRIVACY_POLICY;

  return (
    <PolicyPageLayout
      title="Privacy Policy"
      subtitle="How we respect, protect, and safeguard your personal information and online transactions."
      updatedAt={settings.policies_updated_at || settings.updated_at}
      content={content}
    />
  );
}
