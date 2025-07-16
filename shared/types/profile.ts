export interface Profile {
  id: string;
  adherantId: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileData {
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  website?: string;
}
