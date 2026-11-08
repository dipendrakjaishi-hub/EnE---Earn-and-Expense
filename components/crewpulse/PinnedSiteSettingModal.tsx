import React, { useState } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { JobSite } from '../../types/crewpulse';
import { cn } from '../../lib/utils';
import { X, MapPin, Navigation, Check, Sliders, Building, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface PinnedSiteSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PinnedSiteSettingModal({ isOpen, onClose }: PinnedSiteSettingModalProps) {
  const { jobSites, saveJobSite, currentBusiness } = useCrewPulse();

  const [selectedSiteId, setSelectedSiteId] = useState<string>(jobSites[0]?.id || 'new');
  const [siteName, setSiteName] = useState(jobSites[0]?.name || 'Central London Venue');
  const [siteAddress, setSiteAddress] = useState(jobSites[0]?.address || 'London, UK');
  const [latitude, setLatitude] = useState(jobSites[0]?.latitude || 51.5113);
  const [longitude, setLongitude] = useState(jobSites[0]?.longitude || -0.1171);
  const [radiusMeters, setRadiusMeters] = useState(jobSites[0]?.radius_meters || 20); // Default 20m
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSelectSite = (id: string) => {
    setSelectedSiteId(id);
    if (id === 'new') {
      setSiteName('');
      setSiteAddress('');
      setLatitude(51.5074);
      setLongitude(-0.1278);
      setRadiusMeters(20);
    } else {
      const site = jobSites.find(s => s.id === id);
      if (site) {
        setSiteName(site.name);
        setSiteAddress(site.address);
        setLatitude(site.latitude);
        setLongitude(site.longitude);
        setRadiusMeters(site.radius_meters || 20);
      }
    }
  };

  const handleCaptureCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        setLatitude(lat);
        setLongitude(lng);
        setIsLocating(false);
        toast.success(`Current GPS coordinates pinned: (${lat}, ${lng})!`);
      },
      (err) => {
        setIsLocating(false);
        toast.error(`GPS Error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName) return;

    setIsSaving(true);
    try {
      await saveJobSite({
        id: selectedSiteId === 'new' ? undefined : selectedSiteId,
        name: siteName,
        address: siteAddress,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius_meters: Number(radiusMeters)
      });
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save site location');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-white flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Pinned Site Geofence Settings
              </h3>
              <p className="text-xs text-slate-400">
                Configure GPS coordinates and strict 20m perimeter
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Site Selector / New */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Select Site to Configure
            </label>
            <select
              value={selectedSiteId}
              onChange={(e) => handleSelectSite(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
            >
              {jobSites.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.radius_meters}m perimeter)
                </option>
              ))}
              <option value="new">+ Pin New Job Site</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Site / Venue Name
            </label>
            <input
              type="text"
              required
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. Somerset House Gala, Site B"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Address (Optional)
            </label>
            <input
              type="text"
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              placeholder="e.g. Strand, London WC2R 1LA"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
            />
          </div>

          {/* GPS Coordinates Box with 1-click Pin Current Location */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                Pinned GPS Coordinates
              </span>
              <button
                type="button"
                onClick={handleCaptureCurrentLocation}
                disabled={isLocating}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <MapPin className="w-3 h-3" />
                {isLocating ? 'Locating...' : 'Pin My Current Spot'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Latitude</span>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Longitude</span>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Strict Radius Setting (20m, 50m, 100m) */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Allowed Clock-In Perimeter Radius
              </label>
              <span className="text-xs font-black font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {radiusMeters} Meters
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[20, 50, 100].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusMeters(r)}
                  className={cn(
                    "py-2 px-3 rounded-xl text-xs font-bold transition-all border",
                    radiusMeters === r
                      ? "bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-600/20"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  )}
                >
                  {r === 20 ? '20m (Strict)' : `${r}m`}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 mt-1">
              If staff try to clock in or out from further than <strong>{radiusMeters}m</strong> away, the system will block their attempt.
            </p>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-1/2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Saving Site...' : 'Save Site Perimeter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
