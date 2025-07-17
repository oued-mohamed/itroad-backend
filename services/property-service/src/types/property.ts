// services/property-service/src/types/property.ts
export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  type: 'house' | 'apartment' | 'condo' | 'townhouse' | 'land' | 'commercial';
  status: 'active' | 'pending' | 'sold' | 'inactive';
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  features: string[];
  photos: PropertyPhoto[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyPhoto {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
}

export interface PropertyFilter {
  type?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  state?: string;
}
