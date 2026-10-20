// Single source of truth for categories, statuses, and validation rules.

// 1. CATEGORIES
export const CATEGORIES = [
  {
    value: 'streetlight',
    label: 'Broken streetlight',
    emoji: '💡',
    description: 'Broken, flickering, or non-functional streetlights',
  },
  {
    value: 'water',
    label: 'Water issue',
    emoji: '💧',
    description: 'Burst pipes, water shortages, or low pressure issues',
  },
  {
    value: 'garbage',
    label: 'Garbage collection',
    emoji: '🗑️',
    description: 'Uncollected waste, illegal dumping, or overflowing bins',
  },
  {
    value: 'roads',
    label: 'Roads and potholes',
    emoji: '🚧',
    description: 'Potholes, broken curbs, damaged signage, or drainage blocks',
  },
  {
    value: 'health',
    label: 'Public Health & Sanitation',
    emoji: '🏥',
    description: 'Unsanitary conditions, public clinic concerns, or vector hazards',
  },
  {
    value: 'education',
    label: 'Education & Public Facilities',
    emoji: '🏫',
    description: 'Infrastructure damage at community schools or public buildings',
  },
  {
    value: 'other',
    label: 'Other',
    emoji: '🏛️',
    description: 'Parks, municipal property maintenance, and general concerns',
  },
] as const;

export type RequestCategory = (typeof CATEGORIES)[number]['value'];

export const CATEGORY_MAP: Record<RequestCategory, (typeof CATEGORIES)[number]> =
  CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = cat;
    return acc;
  }, {} as Record<RequestCategory, (typeof CATEGORIES)[number]>);

// Landing page reportable items matching the 6 landing page images
export interface ReportableService {
  title: string;
  category: RequestCategory;
  description: string;
  image: string;
  alt: string;
}

export const REPORTABLE_SERVICES: ReportableService[] = [
  {
    title: 'Streetlights & Lighting',
    category: 'streetlight',
    description: 'Report broken streetlights, flickering fixtures, or dark public walkways.',
    image: '/images/landing/streetlight.webp',
    alt: 'Public streetlights illuminating an urban road',
  },
  {
    title: 'Water Supply & Pipes',
    category: 'water',
    description: 'Report burst water mains, leaking valves, or public water shortages.',
    image: '/images/landing/water.webp',
    alt: 'Clean municipal water pipe system',
  },
  {
    title: 'Waste & Garbage Collection',
    category: 'garbage',
    description: 'Report uncollected garbage piles, overflowing bins, or illegal dumping.',
    image: '/images/landing/garbage.webp',
    alt: 'Refuse collection bins and municipal waste management',
  },
  {
    title: 'Roads & Potholes',
    category: 'roads',
    description: 'Report damaged pavement, dangerous potholes, or broken storm drains.',
    image: '/images/landing/roads.webp',
    alt: 'Pothole on a public roadway requiring tarmac repair',
  },
  {
    title: 'Public Health & Sanitation',
    category: 'health',
    description: 'Report unsanitary conditions, public clinic concerns, or vector hazards.',
    image: '/images/landing/health.webp',
    alt: 'Public health and community medical clinic',
  },
  {
    title: 'Education & Public Facilities',
    category: 'education',
    description: 'Report infrastructure damage at community schools or public buildings.',
    image: '/images/landing/education.webp',
    alt: 'Public community school building and grounds',
  },
];

// 2. STATUSES
export const STATUSES = ['pending', 'in_progress', 'resolved'] as const;

export type RequestStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

// Forward-only transition rule: pending -> in_progress -> resolved
export const NEXT_STATUS: Record<RequestStatus, RequestStatus | null> = {
  pending: 'in_progress',
  in_progress: 'resolved',
  resolved: null,
};

// UI Styling for Status Badges
// pending = grey, in_progress = amber, resolved = green
export const STATUS_CONFIG: Record<
  RequestStatus,
  {
    label: string;
    actionLabel: string | null;
    badgeClasses: string;
    dotClass: string;
  }
> = {
  pending: {
    label: 'Pending',
    actionLabel: 'Mark In Progress',
    badgeClasses:
      'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    dotClass: 'bg-zinc-400',
  },
  in_progress: {
    label: 'In Progress',
    actionLabel: 'Mark Resolved',
    badgeClasses:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    dotClass: 'bg-amber-500 animate-pulse',
  },
  resolved: {
    label: 'Resolved',
    actionLabel: null,
    badgeClasses:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
};

// 3. IMAGE UPLOAD RULES
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_FILE_SIZE_BYTES = MAX_IMAGE_BYTES;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

// 4. USER AND DATA ENTITIES
export type UserRole = 'citizen' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  id_number?: string | null;
  date_of_birth?: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  citizen_id: string;
  category: RequestCategory;
  location: string;
  description: string;
  image_url: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
}
