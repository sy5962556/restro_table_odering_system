import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Building2, Phone, ExternalLink, RefreshCw, CheckCircle, AlertOctagon } from 'lucide-react';
import api from '../../services/api';

export default function LocationMonitor({ onControlRestaurant }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/location-monitor');
      if (res.data.success) {
        setLocations(res.data.locations);
      }
    } catch (err) {
      console.error('Failed to fetch location monitor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const cities = Array.from(new Set(locations.map(l => l.city))).filter(Boolean);

  const filtered = locations.filter(loc => {
    const matchesCity = selectedCity === 'ALL' || loc.city === selectedCity;
    const matchesSearch = !searchTerm ||
      loc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.address?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCity && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 text-slate-100 min-h-screen bg-slate-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase text-purple-400 bg-purple-950/60 border border-purple-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Operational Location Monitor
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1.5">Restaurant GPS & City Dispatch</h1>
          <p className="text-xs text-slate-400">Track geographical coordinates, city coverage, and status across all platform tenants.</p>
        </div>

        <button
          onClick={fetchLocations}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
          <span>Refresh Locations</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-1/3">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter city, restaurant name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold">City Filter:</span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Cities ({locations.length})</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Location Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-16 text-slate-500 font-bold animate-pulse text-xs">
            Loading geographical location monitor data…
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-500 font-bold text-xs">
            No restaurant locations found matching criteria.
          </div>
        ) : (
          filtered.map((loc) => (
            <div key={loc._id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={loc.logo}
                      alt={loc.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-800"
                    />
                    <div>
                      <h3 className="font-extrabold text-sm text-white">{loc.name}</h3>
                      <span className="text-[11px] font-mono font-bold text-purple-400">{loc.code}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    loc.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    loc.status === 'SUSPENDED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                    'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {loc.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                  <div className="flex items-start gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>{loc.address}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-mono">
                    <span>GPS: {loc.lat?.toFixed(4)}, {loc.lng?.toFixed(4)}</span>
                    <span className="text-slate-400 font-sans font-bold">{loc.city}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{loc.phone}</span>
                </div>

                <button
                  onClick={() => onControlRestaurant(loc, 'dashboard')}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-1.5"
                >
                  <span>Control Workspace</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
