import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  Info, 
  CloudUpload,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { 
  getOfflineQueue, 
  isDeviceOnline, 
  isSimulatedOffline, 
  setSimulatedOffline,
  getRemainingTimeIn24h,
  OfflineSyncItem 
} from '../../lib/offlineSyncManager';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export default function OfflineSyncBanner() {
  const { syncOfflineQueueNow } = useCrewPulse();
  const [online, setOnline] = useState<boolean>(isDeviceOnline());
  const [simulated, setSimulated] = useState<boolean>(isSimulatedOffline());
  const [queue, setQueue] = useState<OfflineSyncItem[]>(getOfflineQueue());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync state on events
  useEffect(() => {
    const handleUpdate = () => {
      setOnline(isDeviceOnline());
      setSimulated(isSimulatedOffline());
      setQueue(getOfflineQueue());
    };

    window.addEventListener('online', handleUpdate);
    window.addEventListener('offline', handleUpdate);
    window.addEventListener('crewpulse_offline_state_changed', handleUpdate);

    // 1-second interval to update remaining time countdowns
    const timer = setInterval(() => {
      setOnline(isDeviceOnline());
      setQueue(getOfflineQueue());
    }, 2000);

    return () => {
      window.removeEventListener('online', handleUpdate);
      window.removeEventListener('offline', handleUpdate);
      window.removeEventListener('crewpulse_offline_state_changed', handleUpdate);
      clearInterval(timer);
    };
  }, []);

  const pendingItems = queue.filter(item => item.status === 'pending');
  const hasPending = pendingItems.length > 0;

  const handleToggleSimulateOffline = () => {
    const nextState = !simulated;
    setSimulatedOffline(nextState);
    setSimulated(nextState);
    setOnline(isDeviceOnline());
    if (nextState) {
      toast.warning('⚡ Simulated Offline Mode ON. Network requests paused, punches will queue locally for 24h auto-sync.');
    } else {
      toast.success('🌐 Simulated Offline Mode OFF. Reconnected! Auto-sync triggering now.');
      if (syncOfflineQueueNow) {
        syncOfflineQueueNow();
      }
    }
  };

  const handleManualSync = async () => {
    if (!online) {
      toast.error('Cannot sync while offline. Please turn off simulated offline or restore your internet connection.');
      return;
    }
    setIsSyncing(true);
    try {
      if (syncOfflineQueueNow) {
        await syncOfflineQueueNow();
      }
      setQueue(getOfflineQueue());
      toast.success('Offline queue check complete!');
    } catch {
      toast.error('Sync encountered an issue.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      {/* Clickable Status Pill for Header / Nav */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-sm active:scale-95",
          !online
            ? "bg-amber-950/80 hover:bg-amber-900/90 border-amber-500/50 text-amber-200 shadow-amber-950/50"
            : hasPending
            ? "bg-cyan-950/80 hover:bg-cyan-900/90 border-cyan-500/50 text-cyan-200"
            : "bg-slate-800/80 hover:bg-slate-800 border-slate-700/70 text-slate-300"
        )}
        title="Click to view 24-Hour Offline Sync Vault & Settings"
      >
        {!online ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
            <span className="whitespace-nowrap">
              ⚡ Offline {hasPending ? `(${pendingItems.length} queued)` : ''}
            </span>
          </>
        ) : hasPending ? (
          <>
            <RefreshCw className={cn("w-3.5 h-3.5 text-cyan-400 flex-shrink-0", isSyncing && "animate-spin")} />
            <span className="whitespace-nowrap text-cyan-300">
              {pendingItems.length} punch{pendingItems.length > 1 ? 'es' : ''} syncing
            </span>
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap text-emerald-300">
              Auto-Sync Active (24h)
            </span>
            <span className="sm:hidden whitespace-nowrap text-emerald-300">
              Synced
            </span>
          </>
        )}
      </button>

      {/* 24-Hour Offline & Cloud Sync Vault Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center text-white border",
                  !online 
                    ? "bg-amber-600/20 border-amber-500/40 text-amber-400"
                    : "bg-cyan-600/20 border-cyan-500/40 text-cyan-400"
                )}>
                  {!online ? <WifiOff className="w-5 h-5" /> : <CloudUpload className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    24-Hour Offline &amp; Auto-Sync Vault
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Continuous clock in/out without internet
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              
              {/* Connection Status Card */}
              <div className={cn(
                "p-4 rounded-xl border flex items-center justify-between gap-3",
                !online 
                  ? "bg-amber-950/40 border-amber-500/30 text-amber-200" 
                  : "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full animate-ping",
                    !online ? "bg-amber-400" : "bg-emerald-400"
                  )} />
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      Status: {!online ? '⚡ Offline (No Internet Connection)' : '🌐 Online & Connected'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {!online 
                        ? 'All clock punches and logins are saved locally and guaranteed for 24h auto-sync.'
                        : 'Real-time sync is operational. Offline queue uploads automatically.'}
                    </p>
                  </div>
                </div>

                {/* Simulate Offline Toggle */}
                <button
                  type="button"
                  onClick={handleToggleSimulateOffline}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 border active:scale-95 flex-shrink-0",
                    simulated
                      ? "bg-amber-600 hover:bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-600/30"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  )}
                  title="Toggle simulated offline mode to test feature without turning off Wi-Fi"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{simulated ? 'Resume Online' : 'Simulate Offline'}</span>
                </button>
              </div>

              {/* 24-Hour Policy Explanation Banner */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>24-Hour Automatic Upload Guarantee:</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Workers can log in, log out, and clock in or out with zero internet access. All punch timestamps and geofence verification details are safely stored on the device. Within <strong>24 hours</strong>, whenever internet access is restored at any moment, the system automatically transmits and registers all punches to the cloud.
                </p>
              </div>

              {/* Queued Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Offline Punch Queue ({queue.length} Total, {pendingItems.length} Pending)
                  </span>
                  {hasPending && online && (
                    <button
                      type="button"
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
                      <span>Sync All Now</span>
                    </button>
                  )}
                </div>

                {queue.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center text-slate-400 text-xs space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                    <p className="font-bold text-slate-300">Queue is Clear</p>
                    <p className="text-slate-500">All clock-ins and clock-outs are fully synchronized with the cloud.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {queue.map(item => {
                      const remaining = getRemainingTimeIn24h(item);
                      const isPending = item.status === 'pending';
                      const isSynced = item.status === 'synced';

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "p-3 rounded-xl border text-xs flex flex-col gap-1.5 transition-all",
                            isPending
                              ? "bg-amber-950/30 border-amber-500/30 text-slate-200"
                              : isSynced
                              ? "bg-slate-950/60 border-slate-800 text-slate-400"
                              : "bg-rose-950/30 border-rose-500/30 text-rose-300"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full font-black text-[10px] tracking-wide",
                                item.type === 'CLOCK_IN'
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : item.type === 'CLOCK_OUT'
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                              )}>
                                {item.type.replace('_', ' ')}
                              </span>
                              <span className="font-bold text-white truncate">
                                {item.userName} ({item.employeeId})
                              </span>
                            </div>

                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                              isPending
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse"
                                : isSynced
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                            )}>
                              {isPending ? '⚡ Queued Locally' : isSynced ? '✓ Synced to Cloud' : 'Expired (>24h)'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>
                              Recorded: {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            {isPending && (
                              <span className="font-mono text-cyan-400 font-bold">
                                {remaining.formatted}
                              </span>
                            )}
                            {isSynced && item.syncedAt && (
                              <span className="text-slate-500">
                                Synced: {new Date(item.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Automatic sync listens for Wi-Fi/4G/5G
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
