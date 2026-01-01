
export interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  brand: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  isOpen?: boolean | null; // null means unknown
  logoUrl?: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  label: string;
}

export interface CategoryResult {
  brand: string;
  nearest: Store | null;
  others: Store[];
  minDistance: number;
}
