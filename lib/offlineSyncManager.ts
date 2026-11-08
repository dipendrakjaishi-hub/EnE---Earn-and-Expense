import { Profile, Shift, Business } from '../types/crewpulse';

export interface OfflineSyncItem {
  id: string;
  type: 'CLOCK_IN' | 'CLOCK_OUT' | 'START_BREAK' | 'END_BREAK' | 'OFFLINE_LOGIN';
  userId: string;
  userName: string;
  employeeId: string;
  businessId: string;
  timestamp: string; // ISO string when user performed the action offline
  createdAt: number; // Date.now() timestamp
  expiresAt: number; // Date.now() + 24 * 60 * 60 * 1000 (24-hour window)
  status: 'pending' | 'syncing' | 'synced' | 'expired';
  payload: any;
  syncedAt?: string;
  syncMessage?: string;
}

const STORAGE_KEY_QUEUE = 'crewpulse_offline_sync_queue';
const STORAGE_KEY_SIMULATED_OFFLINE = 'crewpulse_simulated_offline';
const STORAGE_KEY_CREDENTIAL_VAULT = 'crewpulse_offline_credential_vault';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Helper to broadcast state changes across tabs and components
export const notifyOfflineStateChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('crewpulse_offline_state_changed'));
  }
};

/**
 * Check if the app is currently in simulated offline mode
 */
export const isSimulatedOffline = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY_SIMULATED_OFFLINE) === 'true';
  } catch {
    return false;
  }
};

/**
 * Toggle or set simulated offline mode (for testing without turning off device Wi-Fi)
 */
export const setSimulatedOffline = (enabled: boolean) => {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      localStorage.setItem(STORAGE_KEY_SIMULATED_OFFLINE, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_SIMULATED_OFFLINE);
    }
    notifyOfflineStateChange();
  } catch (e) {
    console.error('Failed to set simulated offline state:', e);
  }
};

/**
 * Check if the device is currently online (true if navigator.onLine is true AND simulation is off)
 */
export const isDeviceOnline = (): boolean => {
  if (typeof window === 'undefined') return true;
  if (isSimulatedOffline()) return false;
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

/**
 * Get all queued offline items
 */
export const getOfflineQueue = (): OfflineSyncItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
    if (!raw) return [];
    const items: OfflineSyncItem[] = JSON.parse(raw);
    
    // Check for 24-hour expiration
    const now = Date.now();
    return items.map(item => {
      if (item.status === 'pending' && now > item.expiresAt) {
        return { ...item, status: 'expired' as const };
      }
      return item;
    });
  } catch {
    return [];
  }
};

/**
 * Save queue items to localStorage
 */
const saveOfflineQueue = (items: OfflineSyncItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(items));
    notifyOfflineStateChange();
  } catch (e) {
    console.error('Failed to save offline queue:', e);
  }
};

/**
 * Add a new offline action to the 24-hour sync queue
 */
export const enqueueOfflineAction = (
  type: OfflineSyncItem['type'],
  payload: any,
  user: Profile,
  businessId: string
): OfflineSyncItem => {
  const now = Date.now();
  const newItem: OfflineSyncItem = {
    id: `off_sync_${now}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    userId: user.id,
    userName: user.full_name,
    employeeId: user.employee_id || 'ST-0000-LDN',
    businessId,
    timestamp: new Date().toISOString(),
    createdAt: now,
    expiresAt: now + TWENTY_FOUR_HOURS_MS, // exactly 24 hours validity
    status: 'pending',
    payload
  };

  const currentQueue = getOfflineQueue();
  saveOfflineQueue([newItem, ...currentQueue]);
  return newItem;
};

/**
 * Update an item's status in the queue
 */
export const updateQueueItemStatus = (
  itemId: string,
  status: OfflineSyncItem['status'],
  syncMessage?: string
) => {
  const items = getOfflineQueue();
  const updated = items.map(item => {
    if (item.id === itemId) {
      return {
        ...item,
        status,
        syncedAt: status === 'synced' ? new Date().toISOString() : item.syncedAt,
        syncMessage: syncMessage || item.syncMessage
      };
    }
    return item;
  });
  saveOfflineQueue(updated);
};

/**
 * Get count of pending punches waiting to sync within 24h
 */
export const getPendingPunchCount = (): number => {
  return getOfflineQueue().filter(item => item.status === 'pending').length;
};

/**
 * Compute remaining time in the 24-hour window for a queued punch
 */
export const getRemainingTimeIn24h = (item: OfflineSyncItem): {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
} => {
  const now = Date.now();
  const diffMs = item.expiresAt - now;

  if (diffMs <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      formatted: '24h window elapsed'
    };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return {
    hours,
    minutes,
    seconds,
    isExpired: false,
    formatted: `${hours}h ${minutes}m left`
  };
};

/**
 * Cache known profiles in the offline credential vault so offline login works
 */
export const cacheProfilesInVault = (profiles: Profile[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CREDENTIAL_VAULT, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to cache credentials vault:', e);
  }
};

/**
 * Authenticate credentials against offline vault
 */
export const verifyOfflineLogin = (
  email: string,
  uniqueId: string,
  password?: string
): { success: boolean; profile?: Profile; error?: string } => {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Storage not accessible' };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_CREDENTIAL_VAULT);
    let profiles: Profile[] = raw ? JSON.parse(raw) : [];

    // Fallback to profiles from general local storage if vault is empty
    if (!profiles.length) {
      const general = localStorage.getItem('crewpulse_profiles');
      if (general) {
        profiles = JSON.parse(general);
      }
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanId = (uniqueId || '').trim().toUpperCase();

    const match = profiles.find(p => {
      const matchEmail = p.email?.trim().toLowerCase() === cleanEmail;
      const matchId = cleanId ? (p.employee_id?.trim().toUpperCase() === cleanId) : true;
      return matchEmail || matchId;
    });

    if (!match) {
      return {
        success: false,
        error: 'No matching user found in offline cache. Please connect to internet to verify new account.'
      };
    }

    if (password && match.password && match.password !== password) {
      return {
        success: false,
        error: 'Incorrect password for offline account.'
      };
    }

    return {
      success: true,
      profile: match
    };
  } catch (e: any) {
    return {
      success: false,
      error: e.message || 'Offline verification failed.'
    };
  }
};

/**
 * Clear synced items older than 48 hours to prevent unbounded storage
 */
export const purgeOldSyncedItems = () => {
  const items = getOfflineQueue();
  const now = Date.now();
  const filtered = items.filter(item => {
    if (item.status === 'synced') {
      const syncedTime = item.syncedAt ? new Date(item.syncedAt).getTime() : item.createdAt;
      return now - syncedTime < 48 * 60 * 60 * 1000;
    }
    return true;
  });
  saveOfflineQueue(filtered);
};
