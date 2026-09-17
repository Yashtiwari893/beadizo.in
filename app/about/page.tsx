import React from 'react';
import Link from 'next/link';
import { Heart, Gem, Sparkles, Users } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Story — BEADIZO | Handcrafted Jewellery',
  description: 'Learn about Beadizo, our artisans, handcrafted jewellery journey and passion for creating meaningful pieces.',
};

export default function AboutPage() {
  return (
    <div>
      {/* ================= 03. OUR STORY HERO SECTION ================= */}
      <section className="story-hero-section">
        <img
          src="/assets/story_hero.jpg"
          alt="Artisan hands stringing pearl beads"
          className="story-hero-bg"
        />
        <div className="story-hero-gradient" />

        <div className="container" style={{ width: '100%', position: 'relative' }}>
          <div className="story-hero-inner">
            <span className="hero-tag">OUR STORY</span>
            <h1>
              More Than
              <br />
              Jewellery
            </h1>
            <p>A story of passion, people and little beads that create big moments.</p>
            <Link href="/collections" className="btn-blush">
              EXPLORE COLLECTIONS →
            </Link>
          </div>

          <div className="story-hero-watermark">
            <span>
              Little
              <br />
              Beads
              <br />
              Big Stories
            </span>
          </div>
        </div>
      </section>

      {/* ================= 04. OUR JOURNEY SECTION ================= */}
      <section className="story-journey-section">
        <div className="container">
          <div className="story-journey-grid">
            {/* Left Image */}
            <div className="journey-image-box">
              <img
                src="/assets/product_gifting.jpg"
                alt="Beadizo gift box with thank you note"
              />
            </div>

            {/* Right Text Content */}
            <div className="journey-content-panel">
              <div className="journey-floral-doodle">
                <img
                  src="/assets/story_floral_doodle.png"
                  alt="Crafted with Love Always"
                />
              </div>
              <span className="section-eyebrow">OUR JOURNEY</span>
              <h2>
                It All Started With
                <br />
                A Little Idea
              </h2>
              <div className="journey-divider-line" />

              <p>
                Beadizo was born from a simple belief – that even the smallest things can carry the
                biggest emotions.
              </p>

              <p>
                What started as a passion for handcrafted beads, soon turned into a brand that
                celebrates self-expression, elegance and the little moments that make life beautiful.
              </p>

              <p>
                Each piece we create is a blend of thoughtful design, quality materials and a whole lot
                of love – made for people who appreciate the beauty in details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 05. 4 BRAND PILLARS BAR ================= */}
      <section className="story-pillars-bar">
        <div className="container">
          <div className="story-pillars-grid">
            <div className="story-pillar-col">
              <Heart className="story-pillar-icon" size={26} />
              <h4>Passion</h4>
              <p>We create what we love, with all our heart.</p>
            </div>

            <div className="story-pillar-col">
              <Gem className="story-pillar-icon" size={26} />
              <h4>Quality</h4>
              <p>Only the best materials, for lasting beauty.</p>
            </div>

            <div className="story-pillar-col">
              <Sparkles className="story-pillar-icon" size={26} />
              <h4>Uniqueness</h4>
              <p>Every piece is designed to be special, just like you.</p>
            </div>

            <div className="story-pillar-col">
              <Users className="story-pillar-icon" size={26} />
              <h4>Community</h4>
              <p>A growing family of amazing people like you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 06. MEET THE HEART BEHIND BEADIZO ================= */}
      <section className="story-heart-section">
        <div className="container">
          <div className="story-heart-grid">
            <div className="heart-left-panel">
              <span className="section-eyebrow">MEET THE HEART BEHIND BEADIZO</span>
              <h2>
                A Dream Turned
                <br />
                Into Reality
              </h2>

              <p>
                Beadizo is more than just a brand – it&apos;s a dream nurtured with creativity,
                patience and love. Our goal is to bring handcrafted jewellery closer to your
                everyday life and be a part of your most special moments.
              </p>

              <div className="heart-signature">
                <img
                  src="/assets/story_signature.png"
                  alt="With Love, Team Beadizo"
                />
              </div>
            </div>

            <div className="heart-montage-grid">
              <div className="montage-img-wrap">
                <img
                  src="/assets/col_banner_left.jpg"
                  alt="Hands holding pearl bead strands"
                />
              </div>

              <div className="montage-quote-card">
                <span className="quote-mark">&ldquo;</span>
                <p>
                  Jewellery
                  <br />
                  is not just an accessory,
                  <br />
                  it&apos;s a feeling.
                </p>
                <span className="quote-mark">&rdquo;</span>
                <span className="quote-author">BEADIZO</span>
              </div>

              <div className="montage-img-wrap">
                <img
                  src="/assets/col_banner_right.jpg"
                  alt="Beaded bracelet stack on white stone"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 07. THANK YOU BOTTOM BANNER ================= */}
      <section className="story-thankyou-section">
        <div className="container" style={{ width: '100%' }}>
          <div className="story-thankyou-flex">
            <div className="thankyou-text">
              <span className="thankyou-eyebrow">WITH ALL OUR LOVE</span>
              <h3>
                Thank You For Being
                <br />
                A Part Of Our Story
              </h3>
              <p>Your love and support inspire us to keep creating, one bead at a time.</p>
            </div>

            <div className="thankyou-action-wrap">
              <div className="thankyou-doodle">
                Crafted
                <br />
                with Love
              </div>
              <Link href="/collections" className="btn-blush">
                SHOP NOW →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
