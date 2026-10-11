export interface StyledIconChoice {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
}

/**
 * Dedicated Account & Wallet Icon Presets (Banks, Cards, Cash, Mobile Wallets, Vaults)
 */
export const ACCOUNT_ICON_PRESETS: StyledIconChoice[] = [
  { id: 'acc-bank', nameAr: 'حساب بنكي', nameEn: 'Bank Account', icon: 'Landmark', color: '#0284C7' },
  { id: 'acc-building', nameAr: 'مبنى مصرفي', nameEn: 'Bank Branch', icon: 'Building2', color: '#1E40AF' },
  { id: 'acc-card', nameAr: 'بطاقة وفيزا', nameEn: 'Card / Debit', icon: 'CreditCard', color: '#2563EB' },
  { id: 'acc-cash', nameAr: 'كاش ونقد', nameEn: 'Cash / Banknote', icon: 'Banknote', color: '#10B981' },
  { id: 'acc-coins', nameAr: 'عملات وفكة', nameEn: 'Coins & Petty Cash', icon: 'Coins', color: '#F59E0B' },
  { id: 'acc-wallet', nameAr: 'محفظة إلكترونية', nameEn: 'Mobile Wallet / Vodafone Cash', icon: 'Smartphone', color: '#EA580C' },
  { id: 'acc-instapay', nameAr: 'إنستاباي ودفع سريع', nameEn: 'Instapay / Fast Transfer', icon: 'QrCode', color: '#7C3AED' },
  { id: 'acc-leather', nameAr: 'محفظة جيب', nameEn: 'Pocket Wallet', icon: 'Wallet', color: '#78716C' },
  { id: 'acc-savings', nameAr: 'حصالة توفير', nameEn: 'Savings Piggy', icon: 'PiggyBank', color: '#059669' },
  { id: 'acc-vault', nameAr: 'خزنة أمانات', nameEn: 'Safe / Vault', icon: 'Lock', color: '#475569' },
  { id: 'acc-invest', nameAr: 'أسهم واستثمار', nameEn: 'Investments', icon: 'TrendingUp', color: '#0D9488' },
];

/**
 * Dedicated Category Icon Presets (Life Needs & Spending Purposes)
 */
export const CATEGORY_ICON_PRESETS: StyledIconChoice[] = [
  { id: 'cat-food', nameAr: 'طعام ومطاعم', nameEn: 'Food & Dining', icon: 'Utensils', color: '#EF4444' },
  { id: 'cat-coffee', nameAr: 'قهوة وكافيهات', nameEn: 'Coffee & Drinks', icon: 'Coffee', color: '#B45309' },
  { id: 'cat-groceries', nameAr: 'سوبرماركت وتموين', nameEn: 'Groceries', icon: 'ShoppingCart', color: '#F97316' },
  { id: 'cat-transport', nameAr: 'مواصلات وتنقل', nameEn: 'Transport', icon: 'Car', color: '#3B82F6' },
  { id: 'cat-fuel', nameAr: 'بنزين ووقود', nameEn: 'Fuel / Gas', icon: 'Fuel', color: '#D97706' },
  { id: 'cat-bills', nameAr: 'فواتير وإيصالات', nameEn: 'Bills & Invoices', icon: 'Receipt', color: '#EAB308' },
  { id: 'cat-electricity', nameAr: 'كهرباء وطاقة', nameEn: 'Electricity', icon: 'Zap', color: '#FBBF24' },
  { id: 'cat-water', nameAr: 'مياه ومرافق', nameEn: 'Water & Utilities', icon: 'Droplets', color: '#06B6D4' },
  { id: 'cat-internet', nameAr: 'إنترنت واتصالات', nameEn: 'Internet & Telecom', icon: 'Wifi', color: '#6366F1' },
  { id: 'cat-shopping', nameAr: 'تسوق وشراء', nameEn: 'Shopping', icon: 'ShoppingBag', color: '#8B5CF6' },
  { id: 'cat-clothes', nameAr: 'ملابس ومظهر', nameEn: 'Clothing', icon: 'Shirt', color: '#EC4899' },
  { id: 'cat-health', nameAr: 'صحة وعلاج', nameEn: 'Health & Clinic', icon: 'HeartPulse', color: '#F43F5E' },
  { id: 'cat-meds', nameAr: 'صيدلية وأدوية', nameEn: 'Pharmacy & Meds', icon: 'Pill', color: '#E11D48' },
  { id: 'cat-entertainment', nameAr: 'سينما وترفيه', nameEn: 'Entertainment', icon: 'Film', color: '#A855F7' },
  { id: 'cat-gaming', nameAr: 'ألعاب واشتراكات', nameEn: 'Gaming', icon: 'Gamepad2', color: '#9333EA' },
  { id: 'cat-education', nameAr: 'تعليم وكورسات', nameEn: 'Education', icon: 'GraduationCap', color: '#10B981' },
  { id: 'cat-books', nameAr: 'كتب وثقافة', nameEn: 'Books & Learning', icon: 'BookOpen', color: '#059669' },
  { id: 'cat-home', nameAr: 'منزل وأثاث', nameEn: 'Home & Housing', icon: 'Home', color: '#64748B' },
  { id: 'cat-fitness', nameAr: 'رياضة ولياقة', nameEn: 'Fitness & Gym', icon: 'Dumbbell', color: '#0EA5E9' },
  { id: 'cat-travel', nameAr: 'سفر وسياحة', nameEn: 'Travel & Trips', icon: 'Plane', color: '#38BDF8' },
  { id: 'cat-gift', nameAr: 'هدايا ومناسبات', nameEn: 'Gifts', icon: 'Gift', color: '#D946EF' },
  { id: 'cat-charity', nameAr: 'خير وصدقات', nameEn: 'Charity & Giving', icon: 'HandHeart', color: '#14B8A6' },
  { id: 'cat-salary', nameAr: 'راتب ومكافأة', nameEn: 'Salary & Income', icon: 'Briefcase', color: '#10B981' },
  { id: 'cat-freelance', nameAr: 'عمل حر', nameEn: 'Freelance Work', icon: 'Laptop', color: '#4F46E5' },
  { id: 'cat-tag', nameAr: 'عام وأخرى', nameEn: 'General / Other', icon: 'Tag', color: '#64748B' },
];

/**
 * Backward compatibility alias
 */
export const PRESET_STYLED_ICONS: StyledIconChoice[] = [
  ...ACCOUNT_ICON_PRESETS,
  ...CATEGORY_ICON_PRESETS
];
