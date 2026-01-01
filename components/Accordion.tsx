
import React, { useState, useEffect, useRef } from 'react';
import { CategoryResult, Store, UserLocation } from '../types';
import StoreCard from './StoreCard';

interface AccordionSectionProps {
  data: CategoryResult;
  userLocation: UserLocation | null;
  isOpen: boolean;
  onToggle: (brand: string) => void;
  onOpenMaps: (store: Store) => void;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ data, userLocation, isOpen, onToggle, onOpenMaps }) => {
  const [showAll, setShowAll] = useState(false);
  const [isOthersExpanded, setIsOthersExpanded] = useState(false);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(data.nearest?.id || null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (data.nearest && (!activeStoreId || !([...data.others, data.nearest].some(s => s.id === activeStoreId)))) {
      setActiveStoreId(data.nearest.id);
    }
  }, [data.nearest, data.others]);

  useEffect(() => {
    if (!isOpen) {
      setIsOthersExpanded(false);
      setShowAll(false);
    }
  }, [isOpen]);

  const allStores = [data.nearest, ...data.others].filter((s): s is Store => s !== null);
  const activeStore = allStores.find(s => s.id === activeStoreId) || data.nearest;
  const otherStores = allStores.filter(s => s.id !== activeStoreId);
  
  const displayedOthers = showAll ? otherStores : otherStores.slice(0, 5);
  const hasMore = otherStores.length > 5;

  const brandLogo = activeStore?.logoUrl;
  
  // Official Google Maps Hardware Category Icon reconstruction
  const googleMapsFallback = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%231A73E8'/%3E%3Cpath fill='white' d='M28.5,11.5c-2.1-2.1-5.5-2.1-7.6,0l-9.4,9.4c-0.4,0.4-0.4,1,0,1.4l2.1,2.1l-4.1,4.1c-0.4,0.4-0.4,1,0,1.4l1.4,1.4c0.4,0.4,1,0.4,1.4,0l4.1-4.1l2.1,2.1c0.4,0.4,1,0.4,1.4,0l9.4-9.4C30.6,17,30.6,13.6,28.5,11.5z M25.4,17.1l-1.4-1.4l4.2-4.2l1.4,1.4L25.4,17.1z'/%3E%3C/svg%3E`;

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const timer = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          window.dispatchEvent(new Event('resize'));
        }
      }, 350);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSwitchStore = (id: string) => {
    setActiveStoreId(id);
    setLogoError(false);
    setTimeout(() => {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  return (
    <div ref={containerRef} className="mb-px overflow-hidden accordion-container">
      <button
        onClick={() => onToggle(data.brand)}
        className={`w-full py-7 flex items-center justify-between px-6 drawer-toggle active:brightness-110 transition-all border-b border-slate-900/50 ${isOpen ? 'bg-slate-500' : 'bg-slate-600'}`}
      >
        <div className="flex items-center min-w-0">
          <div className={`w-1.5 h-10 transition-colors duration-300 mr-4 flex-shrink-0 ${isOpen ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-chest-red'}`}></div>
          
          <div className="w-11 h-11 rounded-xl bg-white border-2 border-slate-400/30 flex-shrink-0 mr-4 overflow-hidden shadow-lg p-1.5 flex items-center justify-center relative">
            {!brandLogo ? (
              <div className="absolute inset-0 bg-slate-200 animate-pulse"></div>
            ) : (
              <img 
                src={logoError ? googleMapsFallback : brandLogo} 
                alt="" 
                className="w-full h-full object-contain transition-opacity duration-300"
                onError={() => setLogoError(true)}
              />
            )}
          </div>
          
          <span className={`text-xl font-black truncate transition-colors duration-300 tracking-tight text-shadow-sm ${isOpen ? 'text-white' : 'text-slate-100'}`}>
            {data.brand}
          </span>
          <span className="ml-2 text-[10px] text-slate-100 font-black bg-black/30 px-2 py-0.5 rounded-full border border-white/10">
            {allStores.length}
          </span>
        </div>
        <div className="flex items-center space-x-3 ml-2 flex-shrink-0">
          <div className={`transition-all duration-300 px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-sm border ${isOpen ? 'bg-white border-white text-chest-black' : 'bg-chest-red border-chest-red text-white'}`}>
            {activeStore?.distance.toFixed(1)} MI
          </div>
          <svg 
            className={`w-5 h-5 transition-transform duration-500 ${isOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </button>

      <div className={`accordion-content ${isOpen ? 'open' : ''} bg-slate-900/60 backdrop-blur-sm`}>
        <div className="p-4 sm:p-6">
          {activeStore && (
            <div className="mb-6">
              <div className="text-[10px] font-black text-chest-red uppercase tracking-widest mb-4 flex items-center">
                <span className="bg-chest-red/30 w-8 h-[1px] mr-3"></span>
                Active Selection
                <span className="bg-chest-red/30 w-8 h-[1px] ml-3"></span>
              </div>
              <StoreCard store={activeStore} userLocation={userLocation} isFeatured={true} onOpenMaps={onOpenMaps} />
            </div>
          )}
          
          {otherStores.length > 0 && (
            <div className="mt-4">
              <button 
                onClick={() => setIsOthersExpanded(!isOthersExpanded)}
                className={`w-full py-4 px-4 flex items-center justify-between rounded-lg border btn-slate-tactile transition-all duration-300 group ${isOthersExpanded ? 'bg-slate-500 border-slate-400' : 'bg-slate-600 border-slate-500'}`}
              >
                <div className="flex items-center text-[10px] font-black text-white uppercase tracking-widest">
                  <div className={`w-1.5 h-1.5 rounded-full mr-3 transition-colors ${isOthersExpanded ? 'bg-white animate-pulse shadow-[0_0_8px_white]' : 'bg-slate-400'}`}></div>
                  More {data.brand} Locations ({otherStores.length})
                </div>
                <svg 
                  className={`w-4 h-4 text-white/60 transition-transform duration-300 ${isOthersExpanded ? 'rotate-180 text-white' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOthersExpanded ? 'max-height-5000 mt-4 opacity-100' : 'max-h-0 opacity-0'}`} style={{ maxHeight: isOthersExpanded ? '5000px' : '0' }}>
                <div className="space-y-3 pb-2">
                  {displayedOthers.map(store => (
                    <div key={store.id} onClick={() => handleSwitchStore(store.id)}>
                      <StoreCard 
                        store={store} 
                        userLocation={userLocation}
                        isCompact={true} 
                        onOpenMaps={() => {}} 
                      />
                    </div>
                  ))}
                  
                  {hasMore && !showAll && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowAll(true); }}
                      className="w-full mt-4 py-4 bg-slate-500 border border-slate-400 rounded text-[11px] font-black uppercase text-white flex items-center justify-center space-x-2 active:bg-slate-400 transition-all btn-slate-tactile"
                    >
                      <span>Show {otherStores.length - 5} additional stores</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccordionSection;
