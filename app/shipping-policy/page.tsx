import React from 'react';
import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/supabase/data';
import { DEFAULT_SHIPPING_POLICY } from '@/lib/legal/defaultPolicies';
import PolicyPageLayout from '@/components/policy/PolicyPageLayout';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Shipping Policy | Beadizo Handcrafted Jewellery',
  description:
    'Free Pan-India shipping details, delivery timelines, courier partners, and tracking procedures for Beadizo handcrafted jewellery orders.',
  alternates: {
    canonical: 'https://beadizo.in/shipping-policy',
  },
  openGraph: {
    title: 'Shipping Policy | Beadizo Handcrafted Jewellery',
    description: 'Delivery timelines, courier tracking, and shipping terms across India.',
    url: 'https://beadizo.in/shipping-policy',
    siteName: 'Beadizo',
    type: 'website',
  },
};

export default async function ShippingPolicyPage() {
  const settings = await getSiteSettings();
  const content = settings.shipping_policy || DEFAULT_SHIPPING_POLICY;

  return (
    <PolicyPageLayout
      title="Shipping Policy"
      subtitle="Delivery timelines, order dispatch schedules, and tracking across India."
      updatedAt={settings.policies_updated_at || settings.updated_at}
      content={content}
    />
  );
}
