'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getSiteSettings } from '@/lib/supabase/data';

export default function AnnouncementBar() {
  const [text, setText] = useState('Free Shipping on all orders above ₹999  |  Extra 10% OFF on your first order');
  const [active, setActive] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const settings = await getSiteSettings();
        if (settings) {
          setText(settings.announcement_text);
          setActive(settings.announcement_active !== false);
        }
      } catch {}
    }
    load();
  }, []);

  if (!active) return null;

  return (
    <aside className="announcement-bar" aria-label="Announcement">
      <div className="container">
        <p>
          <Sparkles
            size={12}
            style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}
          />{' '}
          {text}{' '}
          <Sparkles
            size={12}
            style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }}
          />
        </p>
      </div>
    </aside>
  );
}
