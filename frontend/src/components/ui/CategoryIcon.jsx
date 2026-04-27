import { Wallet, Coins, Tag, ShoppingCart, Coffee, Utensils, Bike, Gem, Gamepad2, Pill, Gift, Plane, Dog, Baby, Briefcase, Car } from 'lucide-react';

const MakeupIcon = ({ size = 24, className, strokeWidth = 2 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" strokeDasharray="2 2" />
    <circle cx="14" cy="14" r="2.5" fill="currentColor" />
  </svg>
);

export const VECTOR_ICONS = {
  'ic-wallet': Wallet,
  'ic-briefcase': Briefcase,
  'ic-money': Coins,
  'ic-tag': Tag,
  'ic-cart': ShoppingCart,
  'ic-coffee': Coffee,
  'ic-food': Utensils,
  'ic-bike': Bike,
  'ic-car': Car,
  'ic-makeup': MakeupIcon,
  'ic-ring': Gem,
  'ic-game': Gamepad2,
  'ic-pill': Pill,
  'ic-gift': Gift,
  'ic-plane': Plane,
  'ic-dog': Dog,
  'ic-baby': Baby,
};

export const CATEGORY_VECTORS = Object.keys(VECTOR_ICONS);

export const CategoryIcon = ({ name, size = 24, className = '', strokeWidth = 2 }) => {
  if (!name) return null;

  // 1. Cek apakah ini ikon vektor (berawalan ic-)
  if (name.startsWith('ic-') && VECTOR_ICONS[name]) {
    const IconComponent = VECTOR_ICONS[name];
    return <IconComponent size={size} className={className} strokeWidth={strokeWidth} />;
  }

  // 2. Backward Compatibility: Render sebagai teks Emoji jika data lama
  return (
    <span 
      className={className} 
      style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {name}
    </span>
  );
};
