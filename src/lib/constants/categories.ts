// Centralized category definitions for the entire application
export const CATEGORIES = [
  'Business',
  'Finance & Investing',
  'Philosophy',
  'Religion',
  'History',
  'Politics',
  'Literature',
  'Fiction',
  'Romance',
  'Thriller',
  'Mystery',
  'Science Fiction',
  'Fantasy',
  'Spirituality',
  'Self-Help',
  'Entrepreneurship',
  'Leadership',
  'Biographies',
  'Arts',
  'Music',
  'Cinema & Media',
  'Productivity',
  'Career Growth',
  'Travel',
  'Mathematics',
  'Science',
  'Technology',
  'Health',
  'Psychology'
];

// Category options for UI components (includes "All" option)
export const CATEGORY_OPTIONS = [
  { id: "1", name: "All", slug: "all" },
  ...CATEGORIES.map((category, index) => ({
    id: (index + 2).toString(),
    name: category,
    slug: category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
  }))
];

// Helper function to get category slug from name
export function getCategorySlug(categoryName: string): string {
  return categoryName.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
}

// Helper function to get category name from slug
export function getCategoryName(slug: string): string {
  if (slug === 'all') return 'All';
  
  const category = CATEGORIES.find(cat => 
    getCategorySlug(cat) === slug
  );
  
  return category || slug;
}