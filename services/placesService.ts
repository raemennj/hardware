
import { Store } from '../types';
import { calculateDistance } from './geoService';

const RADIUS_METERS = 80467; // 50 miles

export const normalizeBrand = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('home depot')) return 'Home Depot';
  if (n.includes('lowe')) return "Lowe's";
  if (n.includes('ace hardware')) return 'Ace Hardware';
  if (n.includes('menards')) return 'Menards';
  if (n.includes('harbor freight')) return 'Harbor Freight';
  if (n.includes('true value')) return 'True Value';
  if (n.includes('grainger')) return 'Grainger';
  if (n.includes('sherwin')) return 'Sherwin-Williams';
  if (n.includes('tractor supply')) return 'Tractor Supply Co.';
  if (n.includes('do it best')) return 'Do It Best';
  if (n.includes('northern tool')) return 'Northern Tool';
  if (n.includes('west marine')) return 'West Marine';
  if (n.includes('builders firstsource')) return 'Builders FirstSource';
  return name;
};

const getBrandLogo = (brandName: string, website?: string): string => {
  const normalized = brandName.toLowerCase();
  
  // 1. Clearbit for major brands
  if (normalized === 'home depot') return 'https://logo.clearbit.com/homedepot.com';
  if (normalized === "lowe's") return 'https://logo.clearbit.com/lowes.com';
  if (normalized === 'ace hardware') return 'https://logo.clearbit.com/acehardware.com';
  if (normalized === 'menards') return 'https://logo.clearbit.com/menards.com';
  if (normalized === 'harbor freight') return 'https://logo.clearbit.com/harborfreight.com';
  if (normalized === 'true value') return 'https://logo.clearbit.com/truevalue.com';
  if (normalized === 'grainger') return 'https://logo.clearbit.com/grainger.com';
  if (normalized === 'sherwin-williams') return 'https://logo.clearbit.com/sherwin-williams.com';
  if (normalized === 'tractor supply co.') return 'https://logo.clearbit.com/tractorsupply.com';
  if (normalized === 'do it best') return 'https://logo.clearbit.com/doitbest.com';
  if (normalized === 'northern tool') return 'https://logo.clearbit.com/northerntool.com';
  if (normalized === 'west marine') return 'https://logo.clearbit.com/westmarine.com';
  if (normalized === 'builders firstsource') return 'https://logo.clearbit.com/bldr.com';
  
  // 2. Google Favicon service for local shops with sites
  if (website) {
    try {
      const url = new URL(website);
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
    } catch (e) {
      // invalid URL, fall through
    }
  }

  // 3. Official Google Maps Hardware Category Icon (Fallback)
  // Blue circle (#1A73E8) with white wrench/hammer
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%231A73E8'/%3E%3Cpath fill='white' d='M28.5,11.5c-2.1-2.1-5.5-2.1-7.6,0l-9.4,9.4c-0.4,0.4-0.4,1,0,1.4l2.1,2.1l-4.1,4.1c-0.4,0.4-0.4,1,0,1.4l1.4,1.4c0.4,0.4,1,0.4,1.4,0l4.1-4.1l2.1,2.1c0.4,0.4,1,0.4,1.4,0l9.4-9.4C30.6,17,30.6,13.6,28.5,11.5z M25.4,17.1l-1.4-1.4l4.2-4.2l1.4,1.4L25.4,17.1z'/%3E%3C/svg%3E`;
};

const checkIsOpen = (openingHours: string | undefined): boolean | null => {
  if (!openingHours) return null;
  try {
    const now = new Date();
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const currentDay = days[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    if (openingHours.toLowerCase().includes('24/7')) return true;

    const parts = openingHours.split(';').map(p => p.trim());
    for (const part of parts) {
      const match = part.match(/([A-Z][a-z](-[A-Z][a-z])?) (\d{2}):(\d{2})-(\d{2}):(\d{2})/);
      if (match) {
        const range = match[1];
        const startH = parseInt(match[3]);
        const startM = parseInt(match[4]);
        const endH = parseInt(match[5]);
        const endM = parseInt(match[6]);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        let dayMatch = false;
        if (range.includes('-')) {
          const [startDay, endDay] = range.split('-');
          const startIndex = days.indexOf(startDay);
          const endIndex = days.indexOf(endDay);
          const currentIndex = days.indexOf(currentDay);
          if (startIndex <= endIndex) {
            dayMatch = currentIndex >= startIndex && currentIndex <= endIndex;
          } else {
            dayMatch = currentIndex >= startIndex || currentIndex <= endIndex;
          }
        } else {
          dayMatch = range === currentDay;
        }

        if (dayMatch) {
          return currentTime >= startTotal && currentTime <= endTotal;
        }
      }
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const fetchStoresFromOSM = async (lat: number, lng: number): Promise<Store[]> => {
  const query = `[out:json];
    (
      node["shop"~"hardware|doityourself|building_materials"](around:${RADIUS_METERS},${lat},${lng});
      way["shop"~"hardware|doityourself|building_materials"](around:${RADIUS_METERS},${lat},${lng});
    );
    out center;`;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('OSM Server error');
    const data = await response.json();
    
    return data.elements.map((el: any) => {
      const name = el.tags.name || 'Local Shop';
      const latStore = el.lat || el.center.lat;
      const lngStore = el.lon || el.center.lon;
      const distance = calculateDistance(lat, lng, latStore, lngStore);
      const openingHours = el.tags.opening_hours;
      const normalizedBrand = normalizeBrand(name);
      const website = el.tags.website || el.tags['contact:website'];
      
      const address = [
        el.tags['addr:housenumber'],
        el.tags['addr:street'],
        el.tags['addr:city'],
        el.tags['addr:postcode']
      ].filter(Boolean).join(' ') || 'Address not listed';

      return {
        id: `${el.id}`,
        name,
        address,
        lat: latStore,
        lng: lngStore,
        distance,
        brand: normalizedBrand,
        phone: el.tags.phone || el.tags['contact:phone'],
        website,
        openingHours,
        isOpen: checkIsOpen(openingHours),
        logoUrl: getBrandLogo(normalizedBrand, website)
      };
    }).sort((a: Store, b: Store) => a.distance - b.distance);
  } catch (error) {
    console.error('OSM Fetch error:', error);
    throw error;
  }
};
