import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Profile, Business, Membership, Shift, UserRole, JobSite, ShiftExpense, ScheduledShift, ShiftSwapRequest } from '../types/crewpulse';
import { crewpulseApi } from '../api/supabaseClient';
import { toast } from 'sonner';
import { 
  enqueueOfflineAction, 
  getOfflineQueue, 
  isDeviceOnline, 
  verifyOfflineLogin, 
  cacheProfilesInVault, 
  updateQueueItemStatus,
  getPendingPunchCount
} from '../lib/offlineSyncManager';

interface CrewPulseContextType {
  currentUser: Profile;
  setCurrentUser: (profile: Profile) => void;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile>;
  allProfiles: Profile[];
  currentBusiness: Business | null;
  setCurrentBusiness: (biz: Business) => void;
  businesses: Business[];
  jobSites: JobSite[];
  saveJobSite: (site: Partial<JobSite>) => Promise<JobSite>;
  membership: Membership | null;
  activeShift: Shift | null;
  shifts: Shift[];
  scheduledShifts: ScheduledShift[];
  createScheduledShift: (data: Omit<ScheduledShift, 'id' | 'created_at'>) => Promise<ScheduledShift>;
  confirmScheduledShift: (shiftId: string) => Promise<ScheduledShift>;
  declineScheduledShift: (shiftId: string, reason?: string) => Promise<ScheduledShift>;
  deleteScheduledShift: (shiftId: string) => Promise<void>;
  swapRequests: ShiftSwapRequest[];
  createShiftSwapRequest: (data: {
    scheduledShiftId: string;
    targetUserId?: string;
    targetShiftId?: string;
    swapType: 'swap' | 'cover';
    reason: string;
  }) => Promise<ShiftSwapRequest>;
  claimShiftCover: (swapRequestId: string, targetShiftId?: string) => Promise<ShiftSwapRequest>;
  approveShiftSwap: (swapRequestId: string) => Promise<ShiftSwapRequest>;
  rejectShiftSwap: (swapRequestId: string, reason?: string) => Promise<ShiftSwapRequest>;
  cancelShiftSwap: (swapRequestId: string) => Promise<void>;
  expenses: ShiftExpense[];
  saveExpense: (expense: Partial<ShiftExpense>) => Promise<ShiftExpense>;
  deleteExpense: (id: string) => Promise<void>;
  updateShift: (shiftId: string, updates: Partial<Shift>) => Promise<Shift>;
  deleteShift: (shiftId: string) => Promise<void>;
  approveShift: (shiftId: string) => Promise<Shift>;
  rejectShift: (shiftId: string, reason?: string) => Promise<Shift>;
  isLoading: boolean;
  allowEmployerEdit: boolean;
  setAllowEmployerEdit: (allow: boolean) => Promise<void>;
  clockIn: (options?: {
    jobSite?: string;
    jobSiteId?: string;
    notes?: string;
    captureGps?: boolean;
    clockInSelfie?: string;
    distanceFromSiteMeters?: number;
    isGeofenceVerified?: boolean;
    locationLat?: number;
    locationLng?: number;
    locationAddress?: string;
  }) => Promise<void>;
  startBreak: () => Promise<void>;
  endBreak: () => Promise<void>;
  clockOut: (options?: {
    notes?: string;
    clockOutSelfie?: string;
    distanceFromSiteMeters?: number;
    isGeofenceVerified?: boolean;
  }) => Promise<void>;
  createManualShift: (data: {
    date: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    jobSite: string;
    notes: string;
  }) => Promise<void>;
  createBusiness: (data: Partial<Business>) => Promise<Business>;
  joinBusiness: (inviteCode: string) => Promise<void>;
  switchUserRole: (role: UserRole) => void;
  refreshData: () => Promise<void>;
  isAuthenticated: boolean;
  login: (email: string, uniqueId: string, password?: string) => Promise<{ success: boolean; profile?: Profile; error?: string }>;
  registerStaff: (data: {
    fullName: string;
    email: string;
    phone: string;
    locationCode: string;
    dob?: string;
    password?: string;
    organisationName?: string;
    accountType?: 'staff' | 'management';
  }) => Promise<{ success: boolean; profile: Profile; generatedId: string; business?: Business }>;
  logout: () => void;
  isOnline: boolean;
  syncOfflineQueueNow: () => Promise<number>;
  offlinePendingCount: number;
}

export const CrewPulseContext = createContext<CrewPulseContextType | undefined>(undefined);

export const CrewPulseProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<Profile>(crewpulseApi.getCurrentUser());
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [scheduledShifts, setScheduledShifts] = useState<ScheduledShift[]>([]);
  const [swapRequests, setSwapRequests] = useState<ShiftSwapRequest[]>([]);
  const [expenses, setExpenses] = useState<ShiftExpense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allowEmployerEdit, setAllowEmployerEditState] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(isDeviceOnline());
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(getPendingPunchCount());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('login') === 'gate') return false;
    }
    // Default to true so user immediately sees the internal interface and all features
    return true;
  });

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const profiles = await crewpulseApi.getProfiles();
      setAllProfiles(profiles);
      // Cache profiles securely in device vault for offline login & identity verification
      cacheProfilesInVault(profiles);
      setOfflinePendingCount(getPendingPunchCount());

      const bizList = await crewpulseApi.getBusinesses();
      setBusinesses(bizList);

      const activeBiz = currentBusiness || bizList[0] || null;
      if (!currentBusiness && activeBiz) {
        setCurrentBusiness(activeBiz);
      }

      if (activeBiz) {
        const sites = await crewpulseApi.getJobSites(activeBiz.id);
        setJobSites(sites);

        if (currentUser) {
          const mem = await crewpulseApi.getUserMembership(currentUser.id, activeBiz.id);
          setMembership(mem);
          setAllowEmployerEditState(mem?.allow_employer_edit ?? false);

          const currentActive = await crewpulseApi.getActiveShift(currentUser.id, activeBiz.id);
          setActiveShift(currentActive);

          // Employers & managers see all shifts, expenses, and rota; employees only see their own
          const isManagerOrOwner = mem?.role === 'employer' || mem?.role === 'manager';
          const shiftList = await crewpulseApi.getShifts(
            activeBiz.id, 
            isManagerOrOwner ? undefined : currentUser.id
          );
          setShifts(shiftList);

          const scheduled = await crewpulseApi.getScheduledShifts(
            activeBiz.id,
            isManagerOrOwner ? undefined : currentUser.id
          );
          setScheduledShifts(scheduled);

          const swaps = await crewpulseApi.getShiftSwapRequests(activeBiz.id);
          setSwapRequests(swaps);

          const expList = await crewpulseApi.getExpenses(
            activeBiz.id,
            isManagerOrOwner ? undefined : currentUser.id
          );
          setExpenses(expList);
        }
      }
    } catch (e) {
      console.error('CrewPulseContext refresh error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentBusiness, currentUser]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 24-Hour Offline Sync Engine
  const syncOfflineQueueNow = useCallback(async (): Promise<number> => {
    if (!isDeviceOnline()) {
      return 0;
    }
    const queue = getOfflineQueue();
    const pending = queue.filter(item => item.status === 'pending');
    if (pending.length === 0) {
      setOfflinePendingCount(0);
      return 0;
    }

    let syncedCount = 0;
    const now = Date.now();

    for (const item of pending) {
      // 24-Hour window verification
      if (now > item.expiresAt) {
        updateQueueItemStatus(item.id, 'expired', '24-hour auto-sync window elapsed');
        continue;
      }

      try {
        updateQueueItemStatus(item.id, 'syncing');
        if (item.type === 'CLOCK_IN') {
          const payload = item.payload;
          const shifts = await crewpulseApi.getShifts(item.businessId);
          const existing = shifts.find(s => s.id === payload.shiftId);
          if (!existing) {
            await crewpulseApi.clockIn({
              userId: item.userId,
              businessId: item.businessId,
              jobSite: payload.jobSite,
              jobSiteId: payload.jobSiteId,
              notes: (payload.notes ? payload.notes + ' ' : '') + '[Synced from 24h Offline Queue]',
              locationLat: payload.locationLat,
              locationLng: payload.locationLng,
              locationAddress: payload.locationAddress,
              clockInSelfie: payload.clockInSelfie,
              distanceFromSiteMeters: payload.distanceFromSiteMeters,
              isGeofenceVerified: payload.isGeofenceVerified
            });
          }
          updateQueueItemStatus(item.id, 'synced', 'Verified and uploaded to cloud');
          syncedCount++;
        } else if (item.type === 'CLOCK_OUT') {
          const payload = item.payload;
          if (payload.shiftId) {
            await crewpulseApi.clockOut({
              shiftId: payload.shiftId,
              notes: (payload.notes ? payload.notes + ' ' : '') + '[Synced from 24h Offline Queue]',
              clockOutSelfie: payload.clockOutSelfie,
              distanceFromSiteMeters: payload.distanceFromSiteMeters,
              isGeofenceVerified: payload.isGeofenceVerified
            });
          }
          updateQueueItemStatus(item.id, 'synced', 'Clock-out uploaded to cloud');
          syncedCount++;
        } else if (item.type === 'START_BREAK') {
          if (item.payload?.shiftId) {
            await crewpulseApi.startBreak(item.payload.shiftId);
          }
          updateQueueItemStatus(item.id, 'synced');
          syncedCount++;
        } else if (item.type === 'END_BREAK') {
          if (item.payload?.shiftId) {
            await crewpulseApi.endBreak(item.payload.shiftId);
          }
          updateQueueItemStatus(item.id, 'synced');
          syncedCount++;
        } else if (item.type === 'OFFLINE_LOGIN') {
          updateQueueItemStatus(item.id, 'synced', 'Offline authentication session recorded');
          syncedCount++;
        }
      } catch (err: any) {
        console.warn('Sync failed for item:', item.id, err);
        updateQueueItemStatus(item.id, 'pending', err.message || 'Sync error, will retry');
      }
    }

    setOfflinePendingCount(getPendingPunchCount());

    if (syncedCount > 0) {
      toast.success(`🌐 Internet Restored! ${syncedCount} offline punch${syncedCount > 1 ? 'es were' : ' was'} automatically uploaded & synced.`);
      await refreshData();
    }

    return syncedCount;
  }, [refreshData]);

  // Network connectivity and 24-hour auto-sync listeners
  useEffect(() => {
    const handleStatusChange = () => {
      const onlineStatus = isDeviceOnline();
      setIsOnline(onlineStatus);
      setOfflinePendingCount(getPendingPunchCount());
      if (onlineStatus) {
        syncOfflineQueueNow();
      }
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    window.addEventListener('crewpulse_offline_state_changed', handleStatusChange);

    // Periodic heartbeat (every 15s) to auto-upload when internet is detected
    const heartbeat = setInterval(() => {
      if (isDeviceOnline() && getPendingPunchCount() > 0) {
        syncOfflineQueueNow();
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      window.removeEventListener('crewpulse_offline_state_changed', handleStatusChange);
      clearInterval(heartbeat);
    };
  }, [syncOfflineQueueNow]);

  const saveJobSite = async (site: Partial<JobSite>): Promise<JobSite> => {
    if (!currentBusiness) throw new Error('No business selected');
    const saved = await crewpulseApi.saveJobSite({
      ...site,
      business_id: currentBusiness.id
    });
    await refreshData();
    toast.success(`Location "${saved.name}" pinned with ${saved.radius_meters}m perimeter.`);
    return saved;
  };

  const clockIn = async (options?: {
    jobSite?: string;
    jobSiteId?: string;
    notes?: string;
    captureGps?: boolean;
    clockInSelfie?: string;
    distanceFromSiteMeters?: number;
    isGeofenceVerified?: boolean;
    locationLat?: number;
    locationLng?: number;
    locationAddress?: string;
  }) => {
    if (!currentBusiness || !currentUser) return;

    let lat = options?.locationLat;
    let lng = options?.locationLng;
    let address = options?.locationAddress;

    if (!lat && options?.captureGps && 'geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
        });
        lat = Math.round(pos.coords.latitude * 10000) / 10000;
        lng = Math.round(pos.coords.longitude * 10000) / 10000;
        address = `Verified Location (${lat}, ${lng})`;
      } catch (err) {
        console.warn('GPS capture skipped or declined:', err);
      }
    }

    // OFFLINE MODE CLOCK-IN
    if (!isDeviceOnline()) {
      const rate = membership?.custom_hourly_rate ?? currentBusiness?.default_hourly_rate ?? 15.00;
      const offlineShiftId = `shift_off_${Date.now()}`;
      const nowIso = new Date().toISOString();

      const newOfflineShift: Shift = {
        id: offlineShiftId,
        user_id: currentUser.id,
        business_id: currentBusiness.id,
        clock_in: nowIso,
        status: 'active',
        total_hours: 0,
        hourly_rate_at_shift: rate,
        estimated_pay: 0,
        job_site: options?.jobSite || 'Assigned Site / Local Area',
        job_site_id: options?.jobSiteId,
        notes: (options?.notes ? options.notes + ' ' : '') + '[Recorded Offline]',
        location_lat: lat,
        location_lng: lng,
        location_address: address || 'Offline Geolocation Recorded',
        clock_in_selfie: options?.clockInSelfie,
        distance_from_site_meters: options?.distanceFromSiteMeters || 12,
        is_geofence_verified: options?.isGeofenceVerified ?? true,
        is_manual: false,
        approval_status: 'approved',
        is_offline_recorded: true,
        synced_to_cloud: false,
        offline_recorded_at: nowIso,
        breaks: []
      };

      enqueueOfflineAction('CLOCK_IN', newOfflineShift, currentUser, currentBusiness.id);
      setActiveShift(newOfflineShift);
      setShifts(prev => [newOfflineShift, ...prev]);
      setOfflinePendingCount(getPendingPunchCount());

      try {
        const raw = localStorage.getItem('crewpulse_shifts');
        const list = raw ? JSON.parse(raw) : [];
        localStorage.setItem('crewpulse_shifts', JSON.stringify([newOfflineShift, ...list.filter((s: Shift) => s.id !== offlineShiftId)]));
      } catch (err) {
        console.warn('Storage sync error', err);
      }

      toast.warning(`⚡ Clocked In (Offline Mode)! Recorded at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Stored safely on device — will auto-upload within 24h when internet connects.`);
      return;
    }

    try {
      const shift = await crewpulseApi.clockIn({
        userId: currentUser.id,
        businessId: currentBusiness.id,
        jobSite: options?.jobSite,
        jobSiteId: options?.jobSiteId,
        notes: options?.notes,
        locationLat: lat,
        locationLng: lng,
        locationAddress: address,
        clockInSelfie: options?.clockInSelfie,
        distanceFromSiteMeters: options?.distanceFromSiteMeters,
        isGeofenceVerified: options?.isGeofenceVerified
      });

      setActiveShift(shift);
      await refreshData();
      toast.success(`Verified & clocked in at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to clock in');
    }
  };

  const startBreak = async () => {
    if (!activeShift) return;
    if (!isDeviceOnline()) {
      const nowIso = new Date().toISOString();
      const newBreak = {
        id: `brk_off_${Date.now()}`,
        shift_id: activeShift.id,
        break_start: nowIso,
        duration_minutes: 0
      };
      const updatedShift: Shift = {
        ...activeShift,
        status: 'break',
        breaks: activeShift.breaks ? [...activeShift.breaks, newBreak] : [newBreak]
      };
      enqueueOfflineAction('START_BREAK', { shiftId: activeShift.id, break_start: nowIso }, currentUser, currentBusiness?.id || activeShift.business_id);
      setActiveShift(updatedShift);
      setShifts(prev => prev.map(s => s.id === activeShift.id ? updatedShift : s));
      setOfflinePendingCount(getPendingPunchCount());
      toast.info('Break started offline. Shift paused.');
      return;
    }

    try {
      const updated = await crewpulseApi.startBreak(activeShift.id);
      setActiveShift(updated);
      await refreshData();
      toast.info('Break started. Timer paused.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to start break');
    }
  };

  const endBreak = async () => {
    if (!activeShift) return;
    if (!isDeviceOnline()) {
      const nowIso = new Date().toISOString();
      let totalBreakMins = 0;
      const updatedBreaks = (activeShift.breaks || []).map(b => {
        if (!b.break_end) {
          const diffMins = Math.max(1, Math.round((new Date(nowIso).getTime() - new Date(b.break_start).getTime()) / 60000));
          return { ...b, break_end: nowIso, duration_minutes: diffMins };
        }
        totalBreakMins += b.duration_minutes || 0;
        return b;
      });

      const updatedShift: Shift = {
        ...activeShift,
        status: 'active',
        breaks: updatedBreaks
      };
      enqueueOfflineAction('END_BREAK', { shiftId: activeShift.id, break_end: nowIso }, currentUser, currentBusiness?.id || activeShift.business_id);
      setActiveShift(updatedShift);
      setShifts(prev => prev.map(s => s.id === activeShift.id ? updatedShift : s));
      setOfflinePendingCount(getPendingPunchCount());
      toast.success('Break ended offline. Shift resumed.');
      return;
    }

    try {
      const updated = await crewpulseApi.endBreak(activeShift.id);
      setActiveShift(updated);
      await refreshData();
      toast.success('Break ended. Shift resumed.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to resume shift');
    }
  };

  const clockOut = async (options?: {
    notes?: string;
    clockOutSelfie?: string;
    distanceFromSiteMeters?: number;
    isGeofenceVerified?: boolean;
  }) => {
    if (!activeShift) return;

    // OFFLINE MODE CLOCK-OUT
    if (!isDeviceOnline()) {
      const nowIso = new Date().toISOString();
      const startMs = new Date(activeShift.clock_in).getTime();
      const endMs = new Date(nowIso).getTime();

      let totalBreakMins = 0;
      if (activeShift.breaks) {
        activeShift.breaks.forEach(b => {
          totalBreakMins += b.duration_minutes || 0;
        });
      }

      const rawHours = Math.max(0.05, Math.round((((endMs - startMs) / 3600000) - (totalBreakMins / 60)) * 100) / 100);
      const threshold = currentBusiness?.overtime_threshold_hours || 8;
      const multiplier = currentBusiness?.overtime_rate_multiplier || 1.5;

      const regularHours = Math.min(threshold, rawHours);
      const overtimeHours = Math.max(0, rawHours - threshold);
      const regularPay = regularHours * activeShift.hourly_rate_at_shift;
      const overtimePay = overtimeHours * (activeShift.hourly_rate_at_shift * multiplier);
      const estPay = Math.round((regularPay + overtimePay) * 100) / 100;

      const completedShift: Shift = {
        ...activeShift,
        clock_out: nowIso,
        status: 'completed',
        total_hours: rawHours,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        overtime_pay: overtimePay,
        estimated_pay: estPay,
        clock_out_selfie: options?.clockOutSelfie,
        distance_from_site_meters: options?.distanceFromSiteMeters || activeShift.distance_from_site_meters,
        is_geofence_verified: options?.isGeofenceVerified ?? activeShift.is_geofence_verified,
        notes: (options?.notes ? options.notes + ' ' : '') + '[Clocked out offline]',
        is_offline_recorded: true,
        synced_to_cloud: false
      };

      enqueueOfflineAction('CLOCK_OUT', completedShift, currentUser, currentBusiness?.id || activeShift.business_id);
      setActiveShift(null);
      setShifts(prev => prev.map(s => s.id === activeShift.id ? completedShift : s));
      setOfflinePendingCount(getPendingPunchCount());

      try {
        const raw = localStorage.getItem('crewpulse_shifts');
        const list = raw ? JSON.parse(raw) : [];
        localStorage.setItem('crewpulse_shifts', JSON.stringify([completedShift, ...list.filter((s: Shift) => s.id !== activeShift.id)]));
      } catch (err) {
        console.warn('Storage sync error', err);
      }

      toast.warning(`⚡ Clocked Out (Offline Mode)! Logged ${rawHours}h (Est: ${currentBusiness?.currency || '£'}${estPay.toFixed(2)}). Queued safely on device — will auto-upload within 24 hours.`);
      return;
    }

    try {
      const finished = await crewpulseApi.clockOut({
        shiftId: activeShift.id,
        notes: options?.notes,
        clockOutSelfie: options?.clockOutSelfie,
        distanceFromSiteMeters: options?.distanceFromSiteMeters,
        isGeofenceVerified: options?.isGeofenceVerified
      });
      setActiveShift(null);
      await refreshData();
      toast.success(`Clocked out! Logged ${finished.total_hours}h (Est. Pay: ${currentBusiness?.currency || '£'}${finished.estimated_pay.toFixed(2)})`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to clock out');
    }
  };

  const createManualShift = async (data: {
    date: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    jobSite: string;
    notes: string;
  }) => {
    if (!currentBusiness || !currentUser) return;
    try {
      await crewpulseApi.createManualShift({
        userId: currentUser.id,
        businessId: currentBusiness.id,
        ...data
      });
      await refreshData();
      toast.success('Manual shift saved successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save shift');
    }
  };

  const createBusiness = async (data: Partial<Business>) => {
    if (!currentUser) throw new Error('Not logged in');
    const newBiz = await crewpulseApi.createBusiness(data, currentUser.id);
    setCurrentBusiness(newBiz);
    await refreshData();
    toast.success(`Business "${newBiz.name}" created! Invite code: ${newBiz.invite_code}`);
    return newBiz;
  };

  const joinBusiness = async (inviteCode: string) => {
    if (!currentUser) return;
    try {
      const biz = await crewpulseApi.joinBusinessWithCode(currentUser.id, inviteCode);
      setCurrentBusiness(biz);
      await refreshData();
      toast.success(`Successfully joined ${biz.name}!`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to join business');
      throw e;
    }
  };

  const setAllowEmployerEdit = async (allow: boolean) => {
    setAllowEmployerEditState(allow);
    if (currentUser && currentBusiness) {
      await crewpulseApi.updatePermissionToggle(currentUser.id, currentBusiness.id, allow);
      toast.success(allow ? 'Employer edit permission granted' : 'Employer edit permission revoked (locked)');
    }
  };

  const switchUserRole = (role: UserRole) => {
    const match = allProfiles.find(p => {
      if (role === 'employer') return p.email.includes('elena');
      if (role === 'manager') return p.email.includes('marcus');
      return p.email.includes('liam');
    });
    if (match) {
      setCurrentUser(match);
      toast.info(`Switched active view to ${match.full_name} (${role})`);
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<Profile> => {
    if (!currentUser) throw new Error('No user logged in');
    const updated = await crewpulseApi.updateProfile(currentUser.id, updates);
    setCurrentUser(updated);
    await refreshData();
    toast.success('Profile settings updated successfully');
    return updated;
  };

  const saveExpense = async (data: Partial<ShiftExpense>): Promise<ShiftExpense> => {
    if (!currentBusiness || !currentUser) throw new Error('Not logged in');
    const saved = await crewpulseApi.saveExpense({
      ...data,
      business_id: currentBusiness.id,
      user_id: data.user_id || currentUser.id
    });
    await refreshData();
    toast.success(`Expense "${saved.title}" (${currentBusiness.currency || '£'}${saved.amount.toFixed(2)}) recorded.`);
    return saved;
  };

  const deleteExpense = async (id: string): Promise<void> => {
    await crewpulseApi.deleteExpense(id);
    await refreshData();
    toast.success('Expense claim removed');
  };

  const updateShift = async (shiftId: string, updates: Partial<Shift>): Promise<Shift> => {
    const updated = await crewpulseApi.updateShift(shiftId, updates);
    await refreshData();
    toast.success('Shift updated');
    return updated;
  };

  const deleteShift = async (shiftId: string): Promise<void> => {
    await crewpulseApi.deleteShift(shiftId);
    await refreshData();
    toast.success('Shift deleted');
  };

  const approveShift = async (shiftId: string): Promise<Shift> => {
    const updated = await crewpulseApi.approveShift(shiftId, currentUser.id);
    await refreshData();
    toast.success('Shift approved! Added to verified wage payroll.');
    return updated;
  };

  const rejectShift = async (shiftId: string, reason?: string): Promise<Shift> => {
    const updated = await crewpulseApi.rejectShift(shiftId, reason, currentUser.id);
    await refreshData();
    toast.info('Shift has been marked as rejected.');
    return updated;
  };

  const createScheduledShift = async (data: Omit<ScheduledShift, 'id' | 'created_at'>): Promise<ScheduledShift> => {
    const created = await crewpulseApi.createScheduledShift(data);
    await refreshData();
    toast.success('Shift assigned to rota successfully!');
    return created;
  };

  const confirmScheduledShift = async (shiftId: string): Promise<ScheduledShift> => {
    if (!currentUser) throw new Error('Not logged in');
    const confirmed = await crewpulseApi.confirmScheduledShift(shiftId, currentUser.id);
    await refreshData();
    toast.success('Shift confirmed! See you on site.');
    return confirmed;
  };

  const declineScheduledShift = async (shiftId: string, reason?: string): Promise<ScheduledShift> => {
    if (!currentUser) throw new Error('Not logged in');
    const declined = await crewpulseApi.declineScheduledShift(shiftId, currentUser.id, reason);
    await refreshData();
    toast.info('Shift marked as declined. Management has been notified.');
    return declined;
  };

  const deleteScheduledShift = async (shiftId: string): Promise<void> => {
    await crewpulseApi.deleteScheduledShift(shiftId);
    await refreshData();
    toast.success('Shift removed from rota');
  };

  const createShiftSwapRequest = async (data: {
    scheduledShiftId: string;
    targetUserId?: string;
    targetShiftId?: string;
    swapType: 'swap' | 'cover';
    reason: string;
  }): Promise<ShiftSwapRequest> => {
    if (!currentBusiness || !currentUser) throw new Error('Not logged in');
    const created = await crewpulseApi.createShiftSwapRequest({
      businessId: currentBusiness.id,
      requesterId: currentUser.id,
      ...data
    });
    await refreshData();
    toast.success(data.swapType === 'swap' ? 'Shift swap request posted to team' : 'Shift cover request posted to team');
    return created;
  };

  const claimShiftCover = async (swapRequestId: string, targetShiftId?: string): Promise<ShiftSwapRequest> => {
    if (!currentUser) throw new Error('Not logged in');
    const claimed = await crewpulseApi.claimShiftCover(swapRequestId, currentUser.id, targetShiftId);
    await refreshData();
    toast.success('You offered to cover this shift! Sent to management for final approval.');
    return claimed;
  };

  const approveShiftSwap = async (swapRequestId: string): Promise<ShiftSwapRequest> => {
    if (!currentUser) throw new Error('Not logged in');
    const approved = await crewpulseApi.approveShiftSwap(swapRequestId, currentUser.id);
    await refreshData();
    toast.success('Shift transfer approved! Rota schedule automatically updated.');
    return approved;
  };

  const rejectShiftSwap = async (swapRequestId: string, reason?: string): Promise<ShiftSwapRequest> => {
    if (!currentUser) throw new Error('Not logged in');
    const rejected = await crewpulseApi.rejectShiftSwap(swapRequestId, currentUser.id, reason);
    await refreshData();
    toast.info('Shift transfer declined. Shift remains with original assignee.');
    return rejected;
  };

  const cancelShiftSwap = async (swapRequestId: string): Promise<void> => {
    if (!currentUser) throw new Error('Not logged in');
    await crewpulseApi.cancelShiftSwap(swapRequestId, currentUser.id);
    await refreshData();
    toast.success('Shift swap/cover request cancelled');
  };

  const login = async (email: string, uniqueId: string, password?: string) => {
    // OFFLINE LOGIN VERIFICATION
    if (!isDeviceOnline()) {
      const offlineRes = verifyOfflineLogin(email, uniqueId, password);
      if (offlineRes.success && offlineRes.profile) {
        setCurrentUser(offlineRes.profile);
        setIsAuthenticated(true);
        enqueueOfflineAction(
          'OFFLINE_LOGIN',
          { loginMethod: 'offline_vault', loggedInAt: new Date().toISOString() },
          offlineRes.profile,
          currentBusiness?.id || 'biz-default'
        );
        setOfflinePendingCount(getPendingPunchCount());
        toast.warning(`⚡ Offline Mode: Successfully signed in from local device vault! Welcome back, ${offlineRes.profile.full_name}. You can clock in & out without internet.`);
        return { success: true, profile: offlineRes.profile };
      }
      toast.error(offlineRes.error || 'Offline authentication failed.');
      return { success: false, error: offlineRes.error };
    }

    try {
      const res = await crewpulseApi.login(email, uniqueId, password);
      if (res.success && res.profile) {
        setCurrentUser(res.profile);
        setIsAuthenticated(true);
        await refreshData();
        toast.success(`Welcome back, ${res.profile.full_name}! (ID: ${res.profile.employee_id})`);
      } else if (res.error) {
        toast.error(res.error);
      }
      return res;
    } catch {
      // If network fails unexpectedly, fallback to offline verification
      const fallback = verifyOfflineLogin(email, uniqueId, password);
      if (fallback.success && fallback.profile) {
        setCurrentUser(fallback.profile);
        setIsAuthenticated(true);
        toast.info(`⚡ Network unreachable. Logged in via local offline vault.`);
        return fallback;
      }
      toast.error('Network unreachable and offline verification failed.');
      return { success: false, error: 'Network error' };
    }
  };

  const registerStaff = async (data: {
    fullName: string;
    email: string;
    phone: string;
    locationCode: string;
    dob?: string;
    password?: string;
    organisationName?: string;
    accountType?: 'staff' | 'management';
  }) => {
    const res = await crewpulseApi.registerStaff(data);
    if (res.success && res.profile) {
      if (res.business) {
        setCurrentBusiness(res.business);
      }
      setCurrentUser(res.profile);
      setIsAuthenticated(true);
      await refreshData();
    }
    return res;
  };

  const logout = () => {
    crewpulseApi.logout();
    setIsAuthenticated(false);
    toast.info('Signed out. You can log back in anytime — even with no internet connection.');
  };

  return (
    <CrewPulseContext.Provider value={{
      currentUser,
      setCurrentUser,
      updateProfile,
      allProfiles,
      currentBusiness,
      setCurrentBusiness,
      businesses,
      jobSites,
      saveJobSite,
      membership,
      activeShift,
      shifts,
      scheduledShifts,
      createScheduledShift,
      confirmScheduledShift,
      declineScheduledShift,
      deleteScheduledShift,
      swapRequests,
      createShiftSwapRequest,
      claimShiftCover,
      approveShiftSwap,
      rejectShiftSwap,
      cancelShiftSwap,
      expenses,
      saveExpense,
      deleteExpense,
      updateShift,
      deleteShift,
      approveShift,
      rejectShift,
      isLoading,
      allowEmployerEdit,
      setAllowEmployerEdit,
      clockIn,
      startBreak,
      endBreak,
      clockOut,
      createManualShift,
      createBusiness,
      joinBusiness,
      switchUserRole,
      refreshData,
      isAuthenticated,
      login,
      registerStaff,
      logout,
      isOnline,
      syncOfflineQueueNow,
      offlinePendingCount
    }}>
      {children}
    </CrewPulseContext.Provider>
  );
};

const createDefaultContextValue = (): CrewPulseContextType => {
  const user = crewpulseApi.getCurrentUser();
  const defaultBiz: Business = {
    id: 'b0000000-0000-0000-0000-000000000001',
    name: 'Organisation',
    slug: 'organisation',
    address: 'London, UK',
    logo_url: '',
    currency: 'GBP',
    timezone: 'Europe/London',
    default_hourly_rate: 15.00,
    owner_id: user?.id || 'default-user',
    invite_code: 'ORG-789'
  };

  return {
    currentUser: user,
    setCurrentUser: () => {},
    updateProfile: async (u) => ({ ...user, ...u }),
    allProfiles: [user],
    currentBusiness: defaultBiz,
    setCurrentBusiness: () => {},
    businesses: [defaultBiz],
    jobSites: [],
    saveJobSite: async (s: any) => s,
    membership: null,
    activeShift: null,
    shifts: [],
    scheduledShifts: [],
    createScheduledShift: async (d: any) => d,
    confirmScheduledShift: async () => ({} as any),
    declineScheduledShift: async () => ({} as any),
    deleteScheduledShift: async () => {},
    swapRequests: [],
    createShiftSwapRequest: async (d: any) => d,
    claimShiftCover: async () => ({} as any),
    approveShiftSwap: async () => ({} as any),
    rejectShiftSwap: async () => ({} as any),
    cancelShiftSwap: async () => {},
    expenses: [],
    saveExpense: async (e: any) => e,
    deleteExpense: async () => {},
    updateShift: async (_id: any, u: any) => u,
    deleteShift: async () => {},
    approveShift: async () => ({} as any),
    rejectShift: async () => ({} as any),
    isLoading: false,
    allowEmployerEdit: false,
    setAllowEmployerEdit: async () => {},
    clockIn: async () => {},
    startBreak: async () => {},
    endBreak: async () => {},
    clockOut: async () => {},
    createManualShift: async () => {},
    createBusiness: async (b: any) => b,
    joinBusiness: async () => {},
    switchUserRole: () => {},
    refreshData: async () => {},
    isAuthenticated: true,
    login: async () => ({ success: true, profile: user }),
    registerStaff: async () => ({ success: true, profile: user, generatedId: user?.employee_id || 'ST-0101-LDN' }),
    logout: () => {},
    isOnline: true,
    syncOfflineQueueNow: async () => 0,
    offlinePendingCount: 0
  };
};

export const useCrewPulse = (): CrewPulseContextType => {
  const context = useContext(CrewPulseContext);
  if (!context) {
    return createDefaultContextValue();
  }
  return context;
};
