export interface Product {
  id: string;
  title: string;
  category: 'bracelets' | 'necklaces' | 'earrings' | 'anklets' | 'combos' | 'gifting' | string;
  price: number;
  originalPrice: number;
  img: string;
  rating: number;
  reviewsCount: number;
  description?: string;
  badge?: string;
  gender?: 'men' | 'women' | 'unisex';
}

export const GENDERS = [
  { id: 'all', label: 'All' },
  { id: 'women', label: 'Women' },
  { id: 'men', label: 'Men' },
  { id: 'unisex', label: 'Unisex' },
];

export const BEADIZO_PRODUCTS: Product[] = [
  {
    id: 'blush-charm-bracelet',
    title: 'Blush Charm Bracelet',
    category: 'bracelets',
    price: 699,
    originalPrice: 999,
    img: '/assets/product_bracelet.jpg',
    rating: 5.0,
    reviewsCount: 128,
    description: 'Delicately handcrafted with premium blush crystal beads, 18k gold-plated accents, and an adjustable extender chain. Hypoallergenic and waterproof for daily elegance.',
    badge: 'Bestseller',
    gender: 'women'
  },
  {
    id: 'daisy-bloom-necklace',
    title: 'Daisy Bloom Necklace',
    category: 'necklaces',
    price: 899,
    originalPrice: 1299,
    img: '/assets/product_necklace.jpg',
    rating: 5.0,
    reviewsCount: 96,
    description: 'Charming floral beadwork woven meticulously by hand. Features a dainty daisy pattern with iridescent pearl centerpieces.',
    badge: 'Trending',
    gender: 'women'
  },
  {
    id: 'petal-drop-earrings',
    title: 'Petal Drop Earrings',
    category: 'earrings',
    price: 799,
    originalPrice: 1099,
    img: '/assets/product_earrings.jpg',
    rating: 5.0,
    reviewsCount: 74,
    description: 'Graceful cascading petal droplets made of fine pastel glass beads. Ultra-lightweight with sterling silver ear hooks.',
    badge: 'Limited',
    gender: 'women'
  },
  {
    id: 'golden-pearl-anklet',
    title: 'Golden Pearl Anklet',
    category: 'anklets',
    price: 699,
    originalPrice: 999,
    img: '/assets/product_anklet.jpg',
    rating: 5.0,
    reviewsCount: 52,
    description: 'Lustrous freshwater pearl beads paired with golden seed beads. Waterproof design crafted for beach days and everyday charm.',
    badge: 'Summer Fav',
    gender: 'women'
  },
  {
    id: 'rose-quartz-combo',
    title: 'Rose Quartz Combo',
    category: 'combos',
    price: 1299,
    originalPrice: 1799,
    img: '/assets/product_combo.jpg',
    rating: 5.0,
    reviewsCount: 89,
    description: 'Harmonious duo featuring matching rose quartz charm bracelet and pendant necklace. Arrives in our signature velvet keepsake pouch.',
    badge: 'Value Set',
    gender: 'women'
  },
  {
    id: 'classic-pearl-bracelet',
    title: 'Classic Pearl Bracelet',
    category: 'bracelets',
    price: 749,
    originalPrice: 1099,
    img: '/assets/product_classic_pearl_bracelet.jpg',
    rating: 5.0,
    reviewsCount: 63,
    description: 'Timeless elegance. High-luster round pearls strung on durable stainless steel wire with gold magnetic lock.',
    badge: 'Classic',
    gender: 'unisex'
  },
  {
    id: 'minimal-charm-anklet',
    title: 'Minimal Charm Anklet',
    category: 'anklets',
    price: 799,
    originalPrice: 1199,
    img: '/assets/product_minimal_charm_anklet.jpg',
    rating: 5.0,
    reviewsCount: 41,
    description: 'Delicate micro beads with petite starry charms that catch the light effortlessly. Non-tarnish finish.',
    badge: 'Minimal',
    gender: 'women'
  },
  {
    id: 'obsidian-shield-bracelet',
    title: 'Matte Obsidian Men Bracelet',
    category: 'bracelets',
    price: 849,
    originalPrice: 1199,
    img: '/assets/product_bracelet.jpg',
    rating: 4.9,
    reviewsCount: 58,
    description: 'Handcrafted with natural matte black obsidian beads and gunmetal spacers. Bold, minimal, waterproof and durable.',
    badge: 'Men Exclusive',
    gender: 'men'
  },
  {
    id: 'gift-hamper-box',
    title: 'Gift Hamper Box',
    category: 'gifting',
    price: 1499,
    originalPrice: 2199,
    img: '/assets/product_gifting.jpg',
    rating: 5.0,
    reviewsCount: 112,
    description: 'Curated luxury gifting box with 3 bestselling handcrafted pieces, personalized handwritten note, and premium gift ribbon wrap.',
    badge: 'Gift Choice',
    gender: 'unisex'
  }
];

export const CATEGORIES = [
  { id: 'all', label: 'All Designs' },
  { id: 'bracelets', label: 'Bracelets' },
  { id: 'necklaces', label: 'Necklaces' },
  { id: 'earrings', label: 'Earrings' },
  { id: 'anklets', label: 'Anklets' },
  { id: 'combos', label: 'Combos' },
  { id: 'gifting', label: 'Gifting Box' }
];
