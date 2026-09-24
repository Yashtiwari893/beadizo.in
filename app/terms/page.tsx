import React from 'react';
import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/supabase/data';
import { DEFAULT_TERMS_CONDITIONS } from '@/lib/legal/defaultPolicies';
import PolicyPageLayout from '@/components/policy/PolicyPageLayout';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Terms & Conditions | Beadizo Handcrafted Jewellery',
  description:
    'Read the terms of service governing the use of Beadizo website, product purchases, handcrafted characteristics, and intellectual property.',
  alternates: {
    canonical: 'https://beadizo.in/terms',
  },
  openGraph: {
    title: 'Terms & Conditions | Beadizo Handcrafted Jewellery',
    description: 'Terms of service governing use and purchases on Beadizo.',
    url: 'https://beadizo.in/terms',
    siteName: 'Beadizo',
    type: 'website',
  },
};

export default async function TermsPage() {
  const settings = await getSiteSettings();
  const content = settings.terms_conditions || DEFAULT_TERMS_CONDITIONS;

  return (
    <PolicyPageLayout
      title="Terms &amp; Conditions"
      subtitle="The terms and guidelines governing product purchases, warranties, and website usage."
      updatedAt={settings.policies_updated_at || settings.updated_at}
      content={content}
    />
  );
}
