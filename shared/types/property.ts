// shared/types/property.ts
export interface Property {
  id: string;
  agentId: string;
  title: string;
  description: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  currency: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  areaUnit: 'sqft' | 'sqm';
  yearBuilt?: number;
  features: string[];
  images: PropertyImage[];
  virtualTourUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyImage {
  id: string;
  propertyId: string;
  filename: string;
  originalName: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  order: number;
  createdAt: Date;
}

export interface CreatePropertyData {
  title: string;
  description: string;
  type: PropertyType;
  status?: PropertyStatus;
  price: number;
  currency?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  areaUnit?: 'sqft' | 'sqm';
  yearBuilt?: number;
  features?: string[];
  virtualTourUrl?: string;
  isFeatured?: boolean;
}

export interface UpdatePropertyData extends Partial<CreatePropertyData> {
  status?: PropertyStatus;
  isActive?: boolean;
  viewCount?: number;
}

export interface PropertySearchFilters {
  type?: PropertyType;
  status?: PropertyStatus;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
  country?: string;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minArea?: number;
  maxArea?: number;
  features?: string[];
  agentId?: string;
  isFeatured?: boolean;
  search?: string; // General search term
  sortBy?: PropertySortOption;
  sortOrder?: 'asc' | 'desc';
}

export interface PropertyStats {
  total: number;
  active: number;
  sold: number;
  underContract: number;
  avgPrice: number;
  totalViews: number;
  featured: number;
  byType: { [key in PropertyType]?: number };
  byStatus: { [key in PropertyStatus]?: number };
  priceRange: {
    min: number;
    max: number;
    avg: number;
  };
  recentActivity: {
    newListings: number;
    priceChanges: number;
    statusChanges: number;
  };
}

export interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: Date;
  // Additional property info for convenience
  property?: {
    title: string;
    price: number;
    city: string;
    state: string;
    status: PropertyStatus;
    images: PropertyImage[];
  };
}

export interface PropertyComparison {
  properties: Property[];
  comparison: {
    pricePerSqft: number[];
    features: string[];
    similarities: string[];
    differences: string[];
  };
}

export interface PropertyHistory {
  id: string;
  propertyId: string;
  eventType: PropertyEventType;
  oldValue?: any;
  newValue?: any;
  description: string;
  timestamp: Date;
  agentId: string;
}

export interface PropertyValuation {
  propertyId: string;
  estimatedValue: number;
  valuationDate: Date;
  source: 'automated' | 'professional' | 'cma';
  confidence: number; // 0-100
  factors: {
    location: number;
    size: number;
    condition: number;
    marketTrends: number;
    comparables: number;
  };
  comparableProperties: string[]; // Property IDs
}

export interface PropertyAnalytics {
  propertyId: string;
  views: {
    total: number;
    unique: number;
    lastWeek: number;
    lastMonth: number;
  };
  inquiries: {
    total: number;
    lastWeek: number;
    lastMonth: number;
  };
  favorites: {
    total: number;
    lastWeek: number;
    lastMonth: number;
  };
  marketPerformance: {
    daysOnMarket: number;
    priceChanges: number;
    viewsPerDay: number;
  };
}

// Enums and Types
export enum PropertyType {
  HOUSE = 'house',
  APARTMENT = 'apartment',
  CONDO = 'condo',
  TOWNHOUSE = 'townhouse',
  VILLA = 'villa',
  STUDIO = 'studio',
  DUPLEX = 'duplex',
  PENTHOUSE = 'penthouse',
  COMMERCIAL = 'commercial',
  OFFICE = 'office',
  RETAIL = 'retail',
  WAREHOUSE = 'warehouse',
  LAND = 'land',
  OTHER = 'other'
}

export enum PropertyStatus {
  AVAILABLE = 'available',
  UNDER_CONTRACT = 'under_contract',
  SOLD = 'sold',
  RENTED = 'rented',
  OFF_MARKET = 'off_market',
  PENDING = 'pending',
  DRAFT = 'draft'
}

export enum PropertyEventType {
  CREATED = 'created',
  UPDATED = 'updated',
  PRICE_CHANGED = 'price_changed',
  STATUS_CHANGED = 'status_changed',
  IMAGES_UPDATED = 'images_updated',
  FEATURED_CHANGED = 'featured_changed',
  VIEWED = 'viewed',
  FAVORITED = 'favorited',
  INQUIRY_RECEIVED = 'inquiry_received'
}

export enum PropertySortOption {
  PRICE_LOW_TO_HIGH = 'price_asc',
  PRICE_HIGH_TO_LOW = 'price_desc',
  NEWEST_FIRST = 'created_desc',
  OLDEST_FIRST = 'created_asc',
  MOST_VIEWED = 'views_desc',
  FEATURED_FIRST = 'featured_desc',
  SIZE_LARGE_TO_SMALL = 'area_desc',
  SIZE_SMALL_TO_LARGE = 'area_asc',
  BEDROOMS_DESC = 'bedrooms_desc',
  BEDROOMS_ASC = 'bedrooms_asc'
}

// Constants
export const PROPERTY_TYPES = [
  { value: PropertyType.HOUSE, label: 'House' },
  { value: PropertyType.APARTMENT, label: 'Apartment' },
  { value: PropertyType.CONDO, label: 'Condo' },
  { value: PropertyType.TOWNHOUSE, label: 'Townhouse' },
  { value: PropertyType.VILLA, label: 'Villa' },
  { value: PropertyType.STUDIO, label: 'Studio' },
  { value: PropertyType.DUPLEX, label: 'Duplex' },
  { value: PropertyType.PENTHOUSE, label: 'Penthouse' },
  { value: PropertyType.COMMERCIAL, label: 'Commercial' },
  { value: PropertyType.OFFICE, label: 'Office' },
  { value: PropertyType.RETAIL, label: 'Retail' },
  { value: PropertyType.WAREHOUSE, label: 'Warehouse' },
  { value: PropertyType.LAND, label: 'Land' },
  { value: PropertyType.OTHER, label: 'Other' }
];

export const PROPERTY_STATUSES = [
  { value: PropertyStatus.AVAILABLE, label: 'Available', color: 'green' },
  { value: PropertyStatus.UNDER_CONTRACT, label: 'Under Contract', color: 'yellow' },
  { value: PropertyStatus.SOLD, label: 'Sold', color: 'blue' },
  { value: PropertyStatus.RENTED, label: 'Rented', color: 'purple' },
  { value: PropertyStatus.OFF_MARKET, label: 'Off Market', color: 'gray' },
  { value: PropertyStatus.PENDING, label: 'Pending', color: 'orange' },
  { value: PropertyStatus.DRAFT, label: 'Draft', color: 'gray' }
];

export const PROPERTY_FEATURES = [
  // Amenities
  'pool', 'gym', 'spa', 'sauna', 'tennis_court', 'basketball_court',
  'playground', 'garden', 'rooftop_terrace', 'balcony', 'patio',
  'deck', 'fireplace', 'hot_tub', 'barbecue_area',
  
  // Interior Features
  'hardwood_floors', 'marble_floors', 'tile_floors', 'carpet',
  'granite_countertops', 'marble_countertops', 'stainless_steel_appliances',
  'updated_kitchen', 'walk_in_closet', 'built_in_wardrobes',
  'central_air', 'heating', 'ceiling_fans', 'skylights',
  'high_ceilings', 'crown_molding', 'wainscoting',
  
  // Technology
  'smart_home', 'security_system', 'intercom', 'video_surveillance',
  'fiber_internet', 'cable_ready', 'surround_sound',
  
  // Parking & Storage
  'garage', 'covered_parking', 'parking_space', 'storage_unit',
  'basement', 'attic', 'wine_cellar', 'pantry',
  
  // Building Amenities
  'elevator', 'doorman', 'concierge', 'valet_parking',
  'package_service', 'dry_cleaning', 'housekeeping',
  
  // Views & Location
  'ocean_view', 'mountain_view', 'city_view', 'garden_view',
  'park_view', 'water_view', 'golf_course_view',
  'waterfront', 'beachfront', 'lakefront',
  
  // Utilities & Services
  'laundry_in_unit', 'laundry_on_floor', 'utilities_included',
  'internet_included', 'cable_included', 'furnished', 'pet_friendly',
  
  // Accessibility
  'wheelchair_accessible', 'elevator_access', 'ramp_access',
  
  // Energy & Environment
  'solar_panels', 'energy_efficient', 'green_building',
  'eco_friendly', 'double_pane_windows', 'insulation'
];

export const AREA_UNITS = [
  { value: 'sqft', label: 'Square Feet (sq ft)' },
  { value: 'sqm', label: 'Square Meters (sq m)' }
];

export const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
  { value: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$' },
  { value: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥' },
  { value: 'CHF', label: 'Swiss Franc (CHF)', symbol: 'CHF' },
  { value: 'CNY', label: 'Chinese Yuan (¥)', symbol: '¥' }
];

// Utility Types
export type PropertyFormData = Omit<CreatePropertyData, 'features'> & {
  features: string[];
  images?: File[];
};

export type PropertyListItem = Pick<Property, 
  'id' | 'title' | 'type' | 'status' | 'price' | 'currency' | 
  'city' | 'state' | 'bedrooms' | 'bathrooms' | 'area' | 'areaUnit' | 
  'isFeatured' | 'viewCount' | 'createdAt'
> & {
  primaryImage?: PropertyImage;
  agentName?: string;
};

export type PropertyPreview = Pick<Property,
  'id' | 'title' | 'price' | 'currency' | 'address' | 'city' | 
  'state' | 'bedrooms' | 'bathrooms' | 'area' | 'areaUnit'
> & {
  primaryImage?: PropertyImage;
};

// API Response Types
export interface PropertyResponse {
  success: boolean;
  data: Property;
  message?: string;
}

export interface PropertyListResponse {
  success: boolean;
  data: PropertyListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters?: PropertySearchFilters;
}

export interface PropertyStatsResponse {
  success: boolean;
  data: PropertyStats;
}

export interface PropertyAnalyticsResponse {
  success: boolean;
  data: PropertyAnalytics;
}