
import React, { useState } from 'react';

interface LocationModalProps {
  onClose: () => void;
  onSubmit: (query: string) => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ onClose, onSubmit }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSubmit(value);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-slate-950 rounded shadow-2xl overflow-hidden border-t-[12px] border-chest-red ios-safe-pb">
        <div className="p-8">
          <h2 className="text-3xl font-black text-white italic tracking-tighter mb-2 text-shadow-md">Search Location</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10">Enter ZIP or Address</p>
          
          <form onSubmit={handleSubmit}>
            <div className="relative mb-10">
              <input 
                autoFocus
                type="text"
                placeholder="Address or Zip..."
                className="w-full h-16 bg-slate-900 border-2 border-slate-700 rounded px-5 text-xl font-black uppercase italic text-white placeholder:text-slate-700 focus:border-chest-red focus:bg-slate-800 transition-all outline-none shadow-inner"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={onClose}
                className="h-14 bg-slate-600 text-white font-black uppercase tracking-widest rounded btn-slate-tactile text-xs text-shadow-sm active:brightness-110"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-14 bg-chest-red text-white font-black uppercase tracking-widest italic rounded btn-tactile text-xs text-shadow-md shadow-lg shadow-chest-red/20"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
