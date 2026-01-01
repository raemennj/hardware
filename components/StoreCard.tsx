
import React, { useEffect, useRef, useState } from 'react';
import { Store, UserLocation } from '../types';
import L from 'leaflet';

interface StoreCardProps {
  store: Store;
  userLocation: UserLocation | null;
  isFeatured?: boolean;
  isCompact?: boolean;
  onOpenMaps: (store: Store) => void;
}

const StoreCard: React.FC<StoreCardProps> = ({ store, userLocation, isFeatured, isCompact, onOpenMaps }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    if (isFeatured && mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        dragging: !L.Browser.mobile,
        touchZoom: true,
        scrollWheelZoom: false,
      }).setView([store.lat, store.lng], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Marker mimics Google Maps "Hardware" pin style
      const storeIcon = L.divIcon({
        html: `<div class="w-10 h-10 bg-[#1A73E8] rounded-full border-2 border-white shadow-2xl flex items-center justify-center text-white">
                 <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 40 40"><path d="M28.5,11.5c-2.1-2.1-5.5-2.1-7.6,0l-9.4,9.4c-0.4,0.4-0.4,1,0,1.4l2.1,2.1l-4.1,4.1c-0.4,0.4-0.4,1,0,1.4l1.4,1.4c0.4,0.4,1,0.4,1.4,0l4.1-4.1l2.1,2.1c0.4,0.4,1,0.4,1.4,0l9.4-9.4C30.6,17,30.6,13.6,28.5,11.5z M25.4,17.1l-1.4-1.4l4.2-4.2l1.4,1.4L25.4,17.1z"/></svg>
               </div>`,
        className: '', iconSize: [40, 40], iconAnchor: [20, 20],
      });

      L.marker([store.lat, store.lng], { icon: storeIcon }).addTo(map);

      if (userLocation) {
        setRouteLoading(true);
        fetch(`https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${store.lng},${store.lat}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (data.routes && data.routes[0]) {
              const polyline = L.geoJSON(data.routes[0].geometry, {
                style: { color: '#1A73E8', weight: 6, opacity: 0.8 }
              }).addTo(map);
              map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
            }
          })
          .catch(() => {}).finally(() => setRouteLoading(false));
      }
      mapRef.current = map;
      
      const handleResize = () => {
        if (mapRef.current) mapRef.current.invalidateSize();
      };
      
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, [isFeatured, store.id, userLocation]);

  const renderStatus = () => {
    if (store.isOpen === true) return <span className="text-[10px] font-black text-emerald-400 uppercase italic tracking-wider">Open Now</span>;
    if (store.isOpen === false) return <span className="text-[10px] font-black text-rose-400 uppercase italic tracking-wider">Closed</span>;
    return <span className="text-[10px] font-black text-slate-400 uppercase italic">Hours unknown</span>;
  };

  if (isCompact) {
    return (
      <div 
        className="flex items-center justify-between p-5 rounded-lg bg-slate-700 border border-slate-600 active:bg-slate-600 transition-all shadow-md cursor-pointer hover:border-slate-500"
      >
        <div className="flex items-center flex-1 min-w-0 mr-4">
          {store.logoUrl && (
             <div className="w-9 h-9 rounded-full border border-slate-500 bg-white flex-shrink-0 mr-4 overflow-hidden p-1 shadow-inner flex items-center justify-center">
               <img src={store.logoUrl} alt="" className="w-full h-full object-contain" />
             </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-white truncate leading-tight mb-1 tracking-tight text-shadow-sm">{store.name}</h4>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black text-rose-300">{store.distance.toFixed(1)} MI</span>
              <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
              {renderStatus()}
            </div>
          </div>
        </div>
        <div 
          onClick={(e) => { e.stopPropagation(); onOpenMaps(store); }} 
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-500 border border-slate-400 text-white flex-shrink-0 shadow-sm active:scale-90 transition-all active:bg-slate-400"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-slate-900 border-t-8 border-chest-red shadow-2xl border-x border-b border-slate-800/50">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center min-w-0">
          {store.logoUrl && (
            <div className="w-12 h-12 rounded-lg border border-slate-700 bg-white flex-shrink-0 mr-4 overflow-hidden p-2 shadow-sm flex items-center justify-center">
              <img src={store.logoUrl} alt="" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <h3 className="text-2xl font-black text-white tracking-tighter italic truncate leading-none text-shadow-md">{store.name}</h3>
            <div className="mt-3 flex items-center space-x-3">
              {renderStatus()}
              <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{store.phone ? 'Phone available' : 'No phone'}</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg text-center ml-2 flex-shrink-0 shadow-inner">
          <span className="text-xl font-black text-white block leading-none tracking-tight">{store.distance.toFixed(1)}</span>
          <span className="text-[9px] font-black text-slate-500 uppercase block leading-none mt-1">MILES</span>
        </div>
      </div>

      <div className="relative w-full h-64 bg-slate-950 metal-bezel mb-8 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full"></div>
        {routeLoading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <div className="w-8 h-8 border-4 border-chest-red border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-1 border-l-4 border-slate-800 pl-4">
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Store Address</p>
          <p className="text-slate-100 text-sm font-bold leading-snug">{store.address}</p>
        </div>
      </div>

      <button
        onClick={() => onOpenMaps(store)}
        className="w-full h-16 mb-5 bg-chest-red text-white font-black uppercase tracking-widest italic rounded-lg flex items-center justify-center space-x-3 btn-tactile text-shadow-md text-sm"
      >
        <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
        <span>Get Driving Directions</span>
      </button>

      <div className="grid grid-cols-2 gap-4">
        <a href={store.phone ? `tel:${store.phone}` : '#'} className={`h-14 bg-slate-600 border border-slate-500 rounded-lg flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-widest text-white shadow-sm btn-slate-tactile ${!store.phone ? 'opacity-20 pointer-events-none' : 'active:brightness-110 active:scale-95 transition-all'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
          <span className="text-shadow-sm">Call Shop</span>
        </a>
        <a href={store.website || '#'} target="_blank" className={`h-14 bg-slate-600 border border-slate-500 rounded-lg flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-widest text-white shadow-sm btn-slate-tactile ${!store.website ? 'opacity-20 pointer-events-none' : 'active:brightness-110 active:scale-95 transition-all'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
          <span className="text-shadow-sm">Website</span>
        </a>
      </div>
    </div>
  );
};

export default StoreCard;
