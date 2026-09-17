'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { getProductByIdOrSlug } from '@/lib/supabase/data';
import { DbProduct } from '@/lib/supabase/types';

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id as string;
  const [product, setProduct] = useState<DbProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (id) {
        const p = await getProductByIdOrSlug(id);
        setProduct(p);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '40px', color: '#DFBDB5' }}>Loading product details...</div>;
  }

  if (!product) {
    return (
      <div style={{ padding: '40px', color: '#F87171' }}>
        Product not found. It may have been deleted.
      </div>
    );
  }

  return <ProductForm initialData={product} isEdit={true} />;
}
