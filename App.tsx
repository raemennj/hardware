
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Store, UserLocation, CategoryResult } from './types';
import { geocodeAddress } from './services/geoService';
import { fetchStoresFromOSM } from './services/placesService';
import { resolveBrandLogo } from './services/brandingService';
import AccordionSection from './components/Accordion';
import LocationModal from './components/LocationModal';

const App: React.FC = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [brandLogos, setBrandLogos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Group and enrich stores with dynamically resolved logos
  const categories = useMemo(() => {
    const groups: Record<string, Store[]> = {};
    stores.forEach(store => {
      const brandKey = store.brand;
      if (!groups[brandKey]) groups[brandKey] = [];
      groups[brandKey].push({
        ...store,
        logoUrl: brandLogos[brandKey] || store.logoUrl
      });
    });
    
    const results: CategoryResult[] = Object.keys(groups).map(brand => {
      const brandStores = groups[brand].sort((a, b) => a.distance - b.distance);
      return {
        brand,
        nearest: brandStores[0],
        others: brandStores.slice(1),
        minDistance: brandStores[0].distance
      };
    });
    
    return results.sort((a, b) => a.minDistance - b.minDistance);
  }, [stores, brandLogos]);

  const loadData = useCallback(async (lat: number, lng: number, label: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchStoresFromOSM(lat, lng);
      setStores(results);
      
      if (results.length > 0) {
        setOpenSection(results[0].brand);
        
        // Asynchronously resolve logos for each unique brand found
        const uniqueBrands = Array.from(new Set(results.map(s => s.brand)));
        uniqueBrands.forEach(async (brand) => {
          const logo = await resolveBrandLogo(brand);
          setBrandLogos(prev => ({ ...prev, [brand]: logo }));
        });
      } else {
        setError('No stores found within 50 miles.');
      }
    } catch (err) {
      setError('Unable to reach store database.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLocateMe = useCallback(() => {
    setLoading(true);
    if (!navigator.geolocation) {
      setLoading(false);
      setIsLocationModalOpen(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude, label: 'GPS Location' });
        await loadData(latitude, longitude, 'GPS Location');
      },
      (err) => {
        setLoading(false);
        setIsLocationModalOpen(true);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [loadData]);

  const handleManualLocation = async (query: string) => {
    setIsLocationModalOpen(false);
    setLoading(true);
    const result = await geocodeAddress(query);
    if (result) {
      setLocation(result);
      await loadData(result.lat, result.lng, result.label);
    } else {
      setLoading(false);
      setError('Location not found. Try a ZIP code.');
    }
  };

  const handleOpenMaps = (store: Store) => {
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;
    window.location.href = webUrl;
  };

  useEffect(() => {
    handleLocateMe();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-chest-darker ios-safe-pb">
      <header className="sticky top-0 z-50 toolbox-header ios-safe-pt">
        <div className="px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col">
             <h1 className="text-3xl font-black text-white italic tracking-tighter leading-none text-shadow-md">
              HARDWARE <span className="text-slate-300/80">STORES</span>
            </h1>
            <div className="w-16 h-1 bg-white/20 mt-1 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.4)]"></div>
          </div>
          <button 
            onClick={handleLocateMe}
            className="w-14 h-14 flex items-center justify-center rounded-xl bg-white/20 text-white active:bg-white/40 transition-all border border-white/20 shadow-lg"
            aria-label="Refresh location"
          >
            <svg className={`w-7 h-7 text-shadow-md ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            </svg>
          </button>
        </div>
        {location && (
          <div className="px-6 pb-4">
            <button 
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center text-[10px] font-black uppercase text-white bg-white/10 rounded-lg border border-white/20 px-4 py-2.5 transition-colors active:bg-white/30 truncate max-w-full shadow-inner"
            >
              <svg className="w-3.5 h-3.5 mr-2 text-chest-red drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
              <span className="truncate text-shadow-sm">{location.label}</span>
              <svg className="w-3 h-3 ml-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 mt-1">
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-800 border-t-chest-red rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-chest-red rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] opacity-80">Searching nearby...</p>
          </div>
        )}

        {error && !loading && (
          <div className="mx-6 mt-16 bg-slate-900/50 p-10 rounded-2xl border-2 border-slate-800 text-center shadow-xl">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <p className="text-white font-bold mb-8 text-sm uppercase tracking-wide opacity-90">{error}</p>
            <button onClick={handleLocateMe} className="w-full py-5 bg-chest-red text-white font-black uppercase rounded-xl btn-tactile text-sm text-shadow-md">Try Again</button>
          </div>
        )}

        {!loading && !error && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {categories.map(cat => (
              <AccordionSection 
                key={cat.brand} 
                data={cat} 
                userLocation={location}
                isOpen={openSection === cat.brand}
                onToggle={(brand) => setOpenSection(prev => prev === brand ? null : brand)}
                onOpenMaps={handleOpenMaps}
              />
            ))}
            
            <div className="h-10"></div>
          </div>
        )}
      </main>

      {isLocationModalOpen && (
        <LocationModal onClose={() => setIsLocationModalOpen(false)} onSubmit={handleManualLocation} />
      )}
    </div>
  );
};

export default App;
