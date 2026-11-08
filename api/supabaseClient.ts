import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile, Business, Membership, Shift, ShiftBreak, UserRole, JobSite, ShiftExpense, ScheduledShift, ShiftSwapRequest } from '../types/crewpulse';

// Check for real Supabase keys
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==============================================================================
// KYC UNIQUE STAFF CODE GENERATOR
// Format: {First 2 letters of name/initials}-{Birth date and month DDMM}-{Last 3 letters of location}
// Example: Liam Murphy, 21 Feb, London -> LM-2102-LDN
// ==============================================================================
export const generateKYCStaffCode = (fullName: string, dob?: string, locationCode = 'LDN'): string => {
  const cleaned = (fullName || 'Worker').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  let prefix = 'ST';
  if (parts.length >= 2) {
    prefix = `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  } else if (cleaned.length >= 2) {
    prefix = cleaned.substring(0, 2).toUpperCase();
  }

  // DDMM (e.g., 21st Feb -> 2102)
  let dateCode = '0101';
  if (dob) {
    const dateParts = dob.split('-');
    if (dateParts.length === 3) {
      // YYYY-MM-DD
      const day = dateParts[2].padStart(2, '0');
      const month = dateParts[1].padStart(2, '0');
      dateCode = `${day}${month}`;
    } else {
      const d = new Date(dob);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        dateCode = `${day}${month}`;
      }
    }
  }

  // Location uppercase 3 letters (e.g. London -> LDN)
  let loc = (locationCode || 'LDN').trim().replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (loc.length > 3) loc = loc.substring(0, 3);
  loc = loc.padEnd(3, 'X');

  return `${prefix}-${dateCode}-${loc}`;
};

// ==============================================================================
// INITIAL SEED DATA FOR SEAMLESS DEMO AND LOCAL TESTING
// ==============================================================================
const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    email: 'elena@crestlinehospitality.com',
    full_name: 'Elena Rostova',
    employee_id: 'ER-1508-LDN',
    password: 'crew123',
    dob: '1990-08-15',
    working_rights: 'Full-Time',
    working_post: 'Managing Director & CEO',
    kyc_status: 'verified',
    kyc_document_type: 'Passport',
    kyc_location_code: 'LDN',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    phone: '+44 7700 900111'
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    email: 'marcus.vance@crestlinehospitality.com',
    full_name: 'Marcus Vance',
    employee_id: 'MV-0411-LDN',
    password: 'crew123',
    dob: '1988-11-04',
    working_rights: 'Full-Time',
    working_post: 'Senior Event Operations Manager',
    kyc_status: 'verified',
    kyc_document_type: 'Driving Licence',
    kyc_location_code: 'LDN',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    phone: '+44 7700 900222'
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    email: 'liam.murphy@crewteam.co.uk',
    full_name: 'Liam Murphy',
    employee_id: 'LM-2102-LDN',
    password: 'crew123',
    dob: '1998-02-21', // 21st Feb -> 2102
    working_rights: 'Full-Time',
    working_post: 'Lead Banquet Bartender & Mixologist',
    kyc_status: 'verified',
    kyc_document_type: 'Passport',
    kyc_location_code: 'LDN',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    phone: '+44 7700 900333'
  },
  {
    id: 'd4444444-4444-4444-4444-444444444444',
    email: 'sophie.chen@crewteam.co.uk',
    full_name: 'Sophie Chen',
    employee_id: 'SC-0903-LDN',
    password: 'crew123',
    dob: '1999-03-09', // 9th March -> 0903
    working_rights: 'Part-Time',
    working_post: 'Front of House Service Lead',
    kyc_status: 'verified',
    kyc_document_type: 'National ID Card',
    kyc_location_code: 'LDN',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    phone: '+44 7700 900444'
  },
  {
    id: 'e5555555-5555-5555-5555-555555555555',
    email: 'jordan.blake@crewteam.co.uk',
    full_name: 'Jordan Blake',
    employee_id: 'JB-1207-LDN',
    password: 'crew123',
    dob: '2001-07-12', // 12th July -> 1207
    working_rights: 'Part-Time',
    working_post: 'Event Support Assistant',
    kyc_status: 'pending',
    kyc_document_type: 'Driving Licence',
    kyc_location_code: 'LDN',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    phone: '+44 7700 900555'
  }
];

const DEFAULT_BUSINESS: Business = {
  id: 'b0000000-0000-0000-0000-000000000001',
  name: 'Grand Horizon Hotel & Hospitality',
  slug: 'grand-horizon-hotel',
  address: 'London, UK',
  logo_url: '',
  currency: 'GBP',
  timezone: 'Europe/London',
  default_hourly_rate: 15.00,
  overtime_threshold_hours: 8, // Overtime kicks in after 8h/day
  overtime_rate_multiplier: 1.5, // 1.5x regular pay
  night_shift_bonus_rate: 2.00, // +£2.00/hr night bonus
  owner_id: 'a1111111-1111-1111-1111-111111111111',
  invite_code: 'ORG-789'
};

const DEFAULT_EXPENSES: ShiftExpense[] = [
  {
    id: 'exp_1',
    user_id: 'c3333333-3333-3333-3333-333333333333', // Liam Murphy
    business_id: 'b0000000-0000-0000-0000-000000000001',
    shift_id: 's001',
    title: 'Late Night Congestion & Travel Fare',
    category: 'Travel',
    amount: 14.50,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    status: 'approved',
    notes: 'Approved by Elena for midnight event finish'
  },
  {
    id: 'exp_2',
    user_id: 'c3333333-3333-3333-3333-333333333333',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Bar Service Opening Ice & Fruit Prep',
    category: 'Supplies',
    amount: 22.00,
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: 'Receipt attached for cash purchase'
  }
];

const DEFAULT_MEMBERSHIPS: Membership[] = [
  {
    id: 'm1',
    user_id: 'a1111111-1111-1111-1111-111111111111',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    role: 'employer',
    status: 'active',
    allow_employer_edit: true,
    custom_hourly_rate: 28.00
  },
  {
    id: 'm2',
    user_id: 'b2222222-2222-2222-2222-222222222222',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    role: 'manager',
    status: 'active',
    allow_employer_edit: true,
    custom_hourly_rate: 19.50
  },
  {
    id: 'm3',
    user_id: 'c3333333-3333-3333-3333-333333333333',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    role: 'employee',
    status: 'active',
    allow_employer_edit: false, // Worker has toggle OFF by default
    custom_hourly_rate: 15.00
  },
  {
    id: 'm4',
    user_id: 'd4444444-4444-4444-4444-444444444444',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    role: 'employee',
    status: 'active',
    allow_employer_edit: true,
    custom_hourly_rate: 15.50
  },
  {
    id: 'm5',
    user_id: 'e5555555-5555-5555-5555-555555555555',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    role: 'employee',
    status: 'active',
    allow_employer_edit: false,
    custom_hourly_rate: 14.50
  }
];

const DEFAULT_SHIFTS: Shift[] = [
  {
    id: 's001',
    user_id: 'c3333333-3333-3333-3333-333333333333', // Liam Murphy
    business_id: 'b0000000-0000-0000-0000-000000000001',
    clock_in: new Date(Date.now() - 86400000 * 1 - 28800000).toISOString(),
    clock_out: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'completed',
    total_hours: 8.00,
    hourly_rate_at_shift: 15.00,
    estimated_pay: 120.00,
    job_site: 'Somerset House Gala',
    notes: 'Lead bartender in main reception hall',
    location_lat: 51.5113,
    location_lng: -0.1171,
    location_address: 'Somerset House, Strand, London',
    is_manual: false,
    approval_status: 'approved'
  },
  {
    id: 's002',
    user_id: 'd4444444-4444-4444-4444-444444444444', // Sophie Chen
    business_id: 'b0000000-0000-0000-0000-000000000001',
    clock_in: new Date(Date.now() - 86400000 * 2 - 28800000).toISOString(),
    clock_out: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'completed',
    total_hours: 8.00,
    hourly_rate_at_shift: 15.50,
    estimated_pay: 124.00,
    job_site: 'Canary Wharf Banquet',
    notes: 'Buffet service coordination',
    location_lat: 51.5054,
    location_lng: -0.0209,
    location_address: 'Cabot Square, Canary Wharf, London',
    is_manual: false,
    approval_status: 'approved'
  },
  {
    id: 's003',
    user_id: 'e5555555-5555-5555-5555-555555555555', // Jordan Blake
    business_id: 'b0000000-0000-0000-0000-000000000001',
    clock_in: new Date(Date.now() - 86400000 * 3 - 27000000).toISOString(),
    clock_out: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: 'completed',
    total_hours: 7.50,
    hourly_rate_at_shift: 14.50,
    estimated_pay: 108.75,
    job_site: 'Guildhall Event Hall',
    notes: 'Table prep & clearing (Added manually by staff)',
    location_lat: 51.5157,
    location_lng: -0.0920,
    location_address: 'Gresham St, London EC2V 7HH',
    is_manual: true,
    approval_status: 'pending' // Awaiting management review
  }
];

const DEFAULT_JOB_SITES: JobSite[] = [
  {
    id: 'site_1',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    name: 'Somerset House Gala',
    address: 'Strand, London WC2R 1LA',
    latitude: 51.5113,
    longitude: -0.1171,
    radius_meters: 20 // 20m perimeter enforcement
  },
  {
    id: 'site_2',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    name: 'Canary Wharf Banquet Hall',
    address: 'Cabot Square, Canary Wharf, London E14 4QA',
    latitude: 51.5054,
    longitude: -0.0209,
    radius_meters: 20
  },
  {
    id: 'site_3',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    name: 'Guildhall Event Center',
    address: 'Gresham St, London EC2V 7HH',
    latitude: 51.5157,
    longitude: -0.0920,
    radius_meters: 20
  },
  {
    id: 'site_4',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    name: 'Mayfair Private Suite',
    address: '12 Berkeley Square, Mayfair, London W1J 6BQ',
    latitude: 51.5085,
    longitude: -0.1485,
    radius_meters: 20
  }
];

const DEFAULT_SCHEDULED_SHIFTS: ScheduledShift[] = [
  {
    id: 'sched_1',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    user_id: 'c3333333-3333-3333-3333-333333333333', // Liam Murphy
    job_site_id: 'site_1',
    job_site: 'Somerset House Gala',
    address: 'Strand, London WC2R 1LA',
    start_time: new Date(Date.now() + 86400000 * 1 + 3600000 * 9).toISOString(), // Tomorrow
    end_time: new Date(Date.now() + 86400000 * 1 + 3600000 * 17).toISOString(),
    role_title: 'Lead Bartender',
    hourly_rate: 16.00,
    notes: 'Black shirt, black trousers, arrive 15 minutes before opening for cocktail setup',
    uniform_requirements: 'Formal Black / Bar Kit',
    status: 'scheduled',
    created_at: new Date().toISOString(),
    created_by: 'b2222222-2222-2222-2222-222222222222'
  },
  {
    id: 'sched_2',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    user_id: 'c3333333-3333-3333-3333-333333333333', // Liam Murphy
    job_site_id: 'site_4',
    job_site: 'Mayfair Private Suite',
    address: '12 Berkeley Square, Mayfair, London W1J 6BQ',
    start_time: new Date(Date.now() + 86400000 * 3 + 3600000 * 11).toISOString(), // Weekend
    end_time: new Date(Date.now() + 86400000 * 3 + 3600000 * 19).toISOString(),
    role_title: 'VIP Cocktail Specialist',
    hourly_rate: 18.50,
    notes: 'Exclusive client evening service. Geofence verified at Mayfair entrance.',
    uniform_requirements: 'Smart Hospitality Tuxedo / Apron',
    status: 'confirmed',
    confirmed_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    created_at: new Date().toISOString(),
    created_by: 'b2222222-2222-2222-2222-222222222222'
  },
  {
    id: 'sched_3',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    user_id: 'd4444444-4444-4444-4444-444444444444', // Sophie Chen
    job_site_id: 'site_2',
    job_site: 'Canary Wharf Banquet Hall',
    address: 'Cabot Square, Canary Wharf, London E14 4QA',
    start_time: new Date(Date.now() + 86400000 * 2 + 3600000 * 10).toISOString(),
    end_time: new Date(Date.now() + 86400000 * 2 + 3600000 * 18).toISOString(),
    role_title: 'Event Coordinator & Host',
    hourly_rate: 16.50,
    notes: 'Guest check-in & VIP room liaison',
    uniform_requirements: 'Corporate Smart',
    status: 'confirmed',
    confirmed_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    created_at: new Date().toISOString(),
    created_by: 'a1111111-1111-1111-1111-111111111111'
  },
  {
    id: 'sched_4',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    user_id: 'e5555555-5555-5555-5555-555555555555', // Jordan Blake
    job_site_id: 'site_3',
    job_site: 'Guildhall Event Center',
    address: 'Gresham St, London EC2V 7HH',
    start_time: new Date(Date.now() + 86400000 * 4 + 3600000 * 6).toISOString(),
    end_time: new Date(Date.now() + 86400000 * 4 + 3600000 * 14).toISOString(),
    role_title: 'Kitchen Logistics Porter',
    hourly_rate: 14.50,
    notes: 'Morning delivery unboxing & kitchen clearance',
    uniform_requirements: 'Kitchen Whites & Safety Shoes',
    status: 'scheduled',
    created_at: new Date().toISOString(),
    created_by: 'b2222222-2222-2222-2222-222222222222'
  }
];

const DEFAULT_SWAP_REQUESTS: ShiftSwapRequest[] = [
  {
    id: 'swap_1',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    scheduled_shift_id: 'sched_2', // Liam's Mayfair shift
    requester_id: 'c3333333-3333-3333-3333-333333333333', // Liam Murphy
    target_user_id: 'd4444444-4444-4444-4444-444444444444', // Sophie Chen offered cover
    swap_type: 'cover',
    reason: 'University exam study clash on Saturday evening',
    status: 'peer_accepted',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'swap_2',
    business_id: 'b0000000-0000-0000-0000-000000000001',
    scheduled_shift_id: 'sched_4', // Jordan's Guildhall shift
    requester_id: 'e5555555-5555-5555-5555-555555555555', // Jordan Blake
    swap_type: 'cover',
    reason: 'Train strike on Thameslink line early morning',
    status: 'open',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

// Helper to get / set from localStorage
const getLocal = <T>(key: string, defaultVal: T): T => {
  try {
    const raw = localStorage.getItem(`crewpulse_${key}`);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

const setLocal = (key: string, val: any) => {
  try {
    localStorage.setItem(`crewpulse_${key}`, JSON.stringify(val));
  } catch (e) {}
};

// ==============================================================================
// CREWPULSE API CLIENT (Works offline & integrates with Supabase seamlessly)
// ==============================================================================
export const crewpulseApi = {
  // Profiles
  getProfiles: async (): Promise<Profile[]> => {
    return getLocal('profiles', DEFAULT_PROFILES);
  },

  // Active Current User (Defaults to Worker Liam Murphy for Phase 1 Mobile experience)
  getCurrentUser: (): Profile => {
    const saved = getLocal<Profile | null>('current_user', null);
    if (saved) return saved;
    // Default to Worker
    return DEFAULT_PROFILES[2]; // Liam Murphy
  },

  setCurrentUser: (profile: Profile) => {
    setLocal('current_user', profile);
  },

  isAuthenticated: (): boolean => {
    return getLocal<boolean>('is_authenticated', true);
  },

  setAuthenticated: (auth: boolean) => {
    setLocal('is_authenticated', auth);
  },

  login: async (email: string, uniqueId: string, password?: string): Promise<{ success: boolean; profile?: Profile; error?: string }> => {
    const profiles = await crewpulseApi.getProfiles();
    const cleanEmail = email.trim().toLowerCase();
    const cleanId = uniqueId.trim().toUpperCase();

    // Find profile by email (case-insensitive) or unique ID
    let match = profiles.find(p => p.email.toLowerCase() === cleanEmail);
    if (!match && cleanId) {
      match = profiles.find(p => p.employee_id?.toUpperCase() === cleanId);
    }

    if (!match) {
      // Auto-register new staff account with their Gmail and unique ID
      const namePart = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = namePart.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Staff Member';
      const autoId = cleanId || generateKYCStaffCode(formattedName, '1998-02-21', 'LDN');

      match = {
        id: `user_${Date.now()}`,
        email: cleanEmail,
        full_name: formattedName,
        employee_id: autoId,
        password: password || 'crew123',
        dob: '1998-02-21',
        kyc_status: 'verified',
        kyc_document_type: 'Passport',
        kyc_location_code: 'LDN',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        phone: '+44 7700 900888'
      };
      profiles.push(match);
      setLocal('profiles', profiles);
    } else {
      // If unique ID provided and doesn't match employee_id
      if (cleanId && match.employee_id && match.employee_id.toUpperCase() !== cleanId) {
        // If user is Elena/Marcus/Liam, match by ID
        match.employee_id = cleanId;
        await crewpulseApi.updateProfile(match.id, { employee_id: cleanId });
      }
      // If password provided and user has a password, check
      if (password && match.password && match.password !== password) {
        return { success: false, error: 'Incorrect password for this staff account. Please verify credentials.' };
      }
      if (password && !match.password) {
        match.password = password;
        await crewpulseApi.updateProfile(match.id, { password });
      }
    }

    crewpulseApi.setCurrentUser(match);
    setLocal('is_authenticated', true);
    return { success: true, profile: match };
  },

  registerStaff: async (data: {
    fullName: string;
    email: string;
    phone: string;
    locationCode: string;
    dob?: string;
    password?: string;
    organisationName?: string;
    accountType?: 'staff' | 'management';
  }): Promise<{ success: boolean; profile: Profile; generatedId: string; business?: Business }> => {
    const profiles = await crewpulseApi.getProfiles();
    const cleanEmail = data.email.trim().toLowerCase();
    const dob = data.dob || '1998-02-21';
    const loc = (data.locationCode || 'LDN').trim().toUpperCase();
    const generatedId = generateKYCStaffCode(data.fullName, dob, loc);

    let match = profiles.find(p => p.email.toLowerCase() === cleanEmail);
    if (!match) {
      match = {
        id: `user_${Date.now()}`,
        email: cleanEmail,
        full_name: data.fullName.trim(),
        employee_id: generatedId,
        password: data.password || 'crew123',
        dob,
        phone: data.phone.trim(),
        kyc_location_code: loc,
        kyc_status: 'verified',
        kyc_document_type: 'Passport',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      };
      profiles.push(match);
      setLocal('profiles', profiles);
    } else {
      match.full_name = data.fullName.trim();
      match.employee_id = generatedId;
      match.phone = data.phone.trim();
      match.kyc_location_code = loc;
      match.dob = dob;
      if (data.password) match.password = data.password;
      await crewpulseApi.updateProfile(match.id, match);
    }

    // If management creates their account with an organisation name:
    let createdBiz: Business | undefined;
    if (data.organisationName?.trim()) {
      const orgName = data.organisationName.trim();
      const codePart = orgName.replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toUpperCase() || 'ORG';
      createdBiz = {
        id: `biz_${Date.now()}`,
        name: orgName,
        slug: orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        address: `${loc}, UK`,
        currency: 'GBP',
        timezone: 'Europe/London',
        default_hourly_rate: 15.00,
        overtime_threshold_hours: 8,
        overtime_rate_multiplier: 1.5,
        night_shift_bonus_rate: 2.00,
        owner_id: match.id,
        invite_code: `${codePart}-${Math.floor(100 + Math.random() * 900)}`
      };
      const businesses = await crewpulseApi.getBusinesses();
      const nextBizList = [createdBiz, ...businesses.filter(b => b.id !== createdBiz!.id)];
      setLocal('businesses', nextBizList);
      setLocal('current_business', createdBiz);

      // Set membership as employer
      const memberships = getLocal<Membership[]>('memberships', DEFAULT_MEMBERSHIPS);
      memberships.push({
        id: `m_${Date.now()}`,
        user_id: match.id,
        business_id: createdBiz.id,
        role: 'employer',
        status: 'active',
        allow_employer_edit: true
      });
      setLocal('memberships', memberships);
    }

    crewpulseApi.setCurrentUser(match);
    setLocal('is_authenticated', true);
    return { success: true, profile: match, generatedId, business: createdBiz };
  },

  logout: () => {
    setLocal('is_authenticated', false);
  },

  updateProfile: async (id: string, updates: Partial<Profile>): Promise<Profile> => {
    const all = getLocal<Profile[]>('profiles', DEFAULT_PROFILES);
    let updated: Profile = { id, email: '', full_name: '', ...updates };
    let found = false;
    const next = all.map(p => {
      if (p.id === id) {
        found = true;
        updated = { ...p, ...updates };
        return updated;
      }
      return p;
    });
    if (!found) {
      next.push(updated);
    }
    setLocal('profiles', next);
    const curr = crewpulseApi.getCurrentUser();
    if (curr.id === id) {
      setLocal('current_user', updated);
    }
    return updated;
  },

  // Businesses
  getBusinesses: async (): Promise<Business[]> => {
    const list = getLocal<Business[]>('businesses', [DEFAULT_BUSINESS]);
    return list.map(b => {
      if (b.name && b.name.includes('Crestline')) {
        return { ...b, name: 'Organisation', slug: 'organisation' };
      }
      return b;
    });
  },

  createBusiness: async (data: Partial<Business>, ownerId: string): Promise<Business> => {
    const businesses = getLocal<Business[]>('businesses', [DEFAULT_BUSINESS]);
    const newBiz: Business = {
      id: `biz_${Date.now()}`,
      name: data.name || 'My New Business',
      slug: (data.name || 'business').toLowerCase().replace(/\s+/g, '-'),
      address: data.address || '',
      logo_url: data.logo_url || '',
      currency: data.currency || 'GBP',
      timezone: data.timezone || 'Europe/London',
      default_hourly_rate: data.default_hourly_rate || 14.00,
      owner_id: ownerId,
      invite_code: `JOIN-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      created_at: new Date().toISOString()
    };
    businesses.push(newBiz);
    setLocal('businesses', businesses);

    // Create owner membership
    const memberships = getLocal<Membership[]>('memberships', DEFAULT_MEMBERSHIPS);
    memberships.push({
      id: `m_${Date.now()}`,
      user_id: ownerId,
      business_id: newBiz.id,
      role: 'employer',
      status: 'active',
      allow_employer_edit: true
    });
    setLocal('memberships', memberships);

    return newBiz;
  },

  // Memberships
  getMemberships: async (businessId: string): Promise<Membership[]> => {
    const all = getLocal<Membership[]>('memberships', DEFAULT_MEMBERSHIPS);
    const profiles = getLocal<Profile[]>('profiles', DEFAULT_PROFILES);
    return all
      .filter(m => m.business_id === businessId)
      .map(m => ({
        ...m,
        profile: profiles.find(p => p.id === m.user_id)
      }));
  },

  getUserMembership: async (userId: string, businessId: string): Promise<Membership | null> => {
    const all = getLocal<Membership[]>('memberships', DEFAULT_MEMBERSHIPS);
    return all.find(m => m.user_id === userId && m.business_id === businessId) || null;
  },

  updatePermissionToggle: async (userId: string, businessId: string, allow: boolean): Promise<boolean> => {
    const all = getLocal<Membership[]>('memberships', DEFAULT_MEMBERSHIPS);
    const updated = all.map(m => {
      if (m.user_id === userId && m.business_id === businessId) {
        return { ...m, allow_employer_edit: allow };
      }
      return m;
    });
    setLocal('memberships', updated);
    return true;
  },

  // Shifts
  getShifts: async (businessId: string, userId?: string): Promise<Shift[]> => {
    const allShifts = getLocal<Shift[]>('shifts', DEFAULT_SHIFTS);
    const profiles = getLocal<Profile[]>('profiles', DEFAULT_PROFILES);
    
    let filtered = allShifts.filter(s => s.business_id === businessId);
    if (userId) {
      filtered = filtered.filter(s => s.user_id === userId);
    }

    return filtered
      .map(s => ({
        ...s,
        profile: profiles.find(p => p.id === s.user_id)
      }))
      .sort((a, b) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime());
  },

  getActiveShift: async (userId: string, businessId: string): Promise<Shift | null> => {
    const allShifts = getLocal<Shift[]>('shifts', DEFAULT_SHIFTS);
    return allShifts.find(s => 
      s.user_id === userId && 
      s.business_id === businessId && 
      (s.status === 'active' || s.status === 'break')
    ) || null;
  },

  // Job Sites with Pinned Location & 20m Geofence
  getJobSites: async (businessId: string): Promise<JobSite[]> => {
    const all = getLocal<JobSite[]>('job_sites', DEFAULT_JOB_SITES);
    return all.filter(s => s.business_id === businessId);
  },

  saveJobSite: async (site: Partial<JobSite> & { business_id: string }): Promise<JobSite> => {
    const all = getLocal<JobSite[]>('job_sites', DEFAULT_JOB_SITES);
    let updatedSite: JobSite;
    if (site.id) {
      const idx = all.findIndex(s => s.id === site.id);
      if (idx !== -1) {
        updatedSite = { ...all[idx], ...site } as JobSite;
        all[idx] = updatedSite;
      } else {
        updatedSite = site as JobSite;
        all.push(updatedSite);
      }
    } else {
      updatedSite = {
        id: `site_${Date.now()}`,
        business_id: site.business_id,
        name: site.name || 'New Pinned Site',
        address: site.address || 'London UK',
        latitude: site.latitude || 51.5113,
        longitude: site.longitude || -0.1171,
        radius_meters: site.radius_meters || 20 // 20m strict perimeter
      };
      all.push(updatedSite);
    }
    setLocal('job_sites', all);
    return updatedSite;
  },

  clockIn: async (params: {
    userId: string;
    businessId: string;
    jobSite?: string;
    jobSiteId?: string;
    notes?: string;
    locationLat?: number;
    locationLng?: number;
    locationAddress?: string;
    clockInSelfie?: string;
    distanceFromSiteMeters?: number;
    isGeofenceVerified?: boolean;
  }): Promise<Shift> => {
    const shifts = getLocal<Shift[]>('shifts', DEFAULT_SHIFTS);
    const memberships = getLocal<Membership[]>('memberships', DEFAULT_MEMBERSHIPS);
    const businesses = getLocal<Business[]>('businesses', [DEFAULT_BUSINESS]);

    const membership = memberships.find(m => m.user_id === params.userId && m.business_id === params.businessId);
    const business = businesses.find(b => b.id === params.businessId);

    const rate = membership?.custom_hourly_rate ?? business?.default_hourly_rate ?? 14.50;

    const newShift: Shift = {
      id: `shift_${Date.now()}`,
      user_id: params.userId,
      business_id: params.businessId,
      clock_in: new Date().toISOString(),
      status: 'active',
      total_hours: 0,
      hourly_rate_at_shift: rate,
      estimated_pay: 0,
      job_site: params.jobSite || 'Main Site / Assigned Location',
      job_site_id: params.jobSiteId,
      notes: params.notes || '',
      location_lat: params.locationLat,
      location_lng: params.locationLng,
      location_address: params.locationAddress,
      clock_in_selfie: params.clockInSelfie,
      distance_from_site_meters: params.distanceFromSiteMeters,
      is_geofence_verified: params.isGeofenceVerified ?? true,
      is_manual: false,
      approval_status: 'approved',
      breaks: []
    };

    shifts.unshift(newShift);
    setLocal('shifts', shifts);
    return newShift;
  },

  startBreak: async (shiftId: string): Promise<Shift> => {
    const shifts = getLocal<Shift[]>('shifts', DEFAULT_SHIFTS);
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) throw new Error('Shift not found');

    const newBreak: ShiftBreak = {
      id: `brk_${Date.now()}`,
      shift_id: shiftId,
      break_start: new Date().toISOString(),
      duration_minutes: 0
    };

    shift.status = 'break';
    shift.breaks = shift.breaks ? [...shift.breaks, newBreak] : [newBreak];
    setLocal('shifts', shifts);
    return shift;
  },

  endBreak: async (shiftId: string): Promise<Shift> => {
    const shifts = getLocal<Shift[]>('shifts', DEFAULT_SHIFTS);
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift || !shift.breaks || shift.breaks.length === 0) throw new Error('Shift or break not found');

    const lastBreak = shift.breaks[shift.breaks.length - 1];
    if (!lastBreak.break_end) {
      lastBreak.break_end = new Date().toISOString();
      const diffMins = Math.round((new Date(lastBreak.break_end).getTime() - new Date(lastBreak.break_start).getTime()) / 60000);
      lastBreak.duration_minutes = Math.max(1, diffMins);
    }

    shift.status = 'active';
    setLocal('shifts', shifts);
    return shift;
  },

  clockOut: async (params: {
    shiftId: string;
    notes?: string;
    clockOutSelfie?: string;
    distanceFromSiteMeters?: number;
    isGeofenceVerified?: boolean;
  }): Promise<Shift> => {
    const shifts = getLocal<Shift[]>('shifts', DEFAULT_SHIFTS);
    const shift = shifts.find(s => s.id === params.shiftId);
    if (!shift) throw new Error('Shift not found');

    const clockOutTime = new Date().toISOString();
    shift.clock_out = clockOutTime;
    shift.status = 'completed';
    if (params.notes) shift.notes = params.notes;
    if (params.clockOutSelfie) shift.clock_out_selfie = params.clockOutSelfie;
    if (params.distanceFromSiteMeters !== undefined) shift.distance_from_site_meters = params.distanceFromSiteMeters;
    if (params.isGeofenceVerified !== undefined) shift.is_geofence_verified = params.isGeofenceVerified;

    // Calculate break total
    let totalBreakMins = 0;
    if (shift.breaks) {
      shift.breaks.forEach(b => {
        if (!b.break_end) {
          b.break_end = clockOutTime;
          b.duration_minutes = Math.round((new Date(clockOutTime).getTime() - new Date(b.break_start).getTime()) / 60000);
        }
        totalBreakMins += b.duration_minutes || 0;
      });
    }

    const startMs = new Date(shift.clock_in).getTime();
    const endMs = new Date(clockOutTime).getTime();
    const rawHours = (endMs - startMs) / 3600000;
    const breakHours = totalBreakMins / 60;
    const finalHours = Math.max(0.05, Math.round((rawHours - breakHours) * 100) / 100);

    // Business Overtime calculation
    const businesses = getLocal<Business[]>('businesses', [DEFAULT_BUSINESS]);
    const business = businesses.find(b => b.id === shift.business_id);
    const threshold = business?.overtime_threshold_hours || 8;
    const multiplier = business?.overtime_rate_multiplier || 1.5;

    let regularHours = finalHours;
    let overtimeHours = 0;
    if (finalHours > threshold) {
      regularHours = threshold;
      overtimeHours = Math.round((finalHours - threshold) * 100) / 100;
    }

    const regularPay = regularHours * shift.hourly_rate_at_shift;
    const overtimePay = overtimeHours * (shift.hourly_rate_at_shift * multiplier);

    shift.total_hours = finalHours;
    shift.regular_hours = regularHours;
    shift.overtime_hours = overtimeHours;
    shift.overtime_pay = Math.round(overtimePay * 100) / 100;
    shift.estimated_pay = Math.round((regularPay + overtimePay) * 100) / 100;

    setLocal('shifts', shifts);
    return shift;
  },

  // Update existing shift (used by Excel Grid Mode)
  updateShift: async (shiftId: string, updates: Partial<Shift>): Promise<Shift> => {
    const shifts = getLocal<Shift[]>('shifts', DEFAULT_SHIFTS);
    let updatedShift: Shift | null = null;
    const next = shifts.map(s => {
      if (s.id === shiftId) {
        const totalH = updates.total_hours !== undefined ? Number(updates.total_hours) : s.total_hours;
        const rate = updates.hourly_rate_at_shift !== undefined ? Number(updates.hourly_rate_at_shift) : s.hourly_rate_at_shift;
        const otH = updates.overtime_hours !== undefined ? Number(updates.overtime_hours) : (s.overtime_hours || 0);
        const otMultiplier = 1.5;
        const regH = Math.max(0, totalH - otH);
        const regPay = regH * rate;
        const otPay = otH * (rate * otMultiplier);

        updatedShift = {
          ...s,
          ...updates,
          total_hours: totalH,
          hourly_rate_at_shift: rate,
          regular_hours: regH,
          overtime_hours: otH,
          overtime_pay: Math.round(otPay * 100) / 100,
          estimated_pay: Math.round((regPay + otPay) * 100) / 100,
          updated_at: new Date().toISOString()
        };
        return updatedShift;
      }
      return s;
    });
    setLocal('shifts', next);
    return updatedShift || (updates as Shift);
  },

  deleteShift: async (shiftId: string): Promise<boolean> => {
    const shifts = getLocal<Shift[]>('shifts', DEFAULT_SHIFTS);
    setLocal('shifts', shifts.filter(s => s.id !== shiftId));
    return true;
  },

  // Manual Shift Entry with Overtime
  createManualShift: async (data: {
    userId: string;
    businessId: string;
    date: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    jobSite: string;
    notes: string;
  }): Promise<Shift> => {
    const shifts = getLocal<Shift[]>('shifts', DEFAULT_SHIFTS);
    const memberships = getLocal<Membership[]>('memberships', DEFAULT_MEMBERSHIPS);
    const businesses = getLocal<Business[]>('businesses', [DEFAULT_BUSINESS]);

    const membership = memberships.find(m => m.user_id === data.userId && m.business_id === data.businessId);
    const business = businesses.find(b => b.id === data.businessId);

    const rate = membership?.custom_hourly_rate ?? business?.default_hourly_rate ?? 14.50;

    const clockInIso = `${data.date}T${data.startTime}:00`;
    const clockOutIso = `${data.date}T${data.endTime}:00`;

    const startMs = new Date(clockInIso).getTime();
    let endMs = new Date(clockOutIso).getTime();
    if (endMs < startMs) {
      endMs += 86400000; // Overnight
    }

    const rawHours = (endMs - startMs) / 3600000;
    const breakHours = (data.breakMinutes || 0) / 60;
    const workedHours = Math.max(0, Math.round((rawHours - breakHours) * 100) / 100);

    const threshold = business?.overtime_threshold_hours || 8;
    const multiplier = business?.overtime_rate_multiplier || 1.5;

    let regularHours = workedHours;
    let overtimeHours = 0;
    if (workedHours > threshold) {
      regularHours = threshold;
      overtimeHours = Math.round((workedHours - threshold) * 100) / 100;
    }

    const regularPay = regularHours * rate;
    const overtimePay = overtimeHours * (rate * multiplier);

    const isManagerOrOwner = membership?.role === 'employer' || membership?.role === 'manager';
    const approvalStatus: 'approved' | 'pending' = isManagerOrOwner ? 'approved' : 'pending';

    const newShift: Shift = {
      id: `shift_manual_${Date.now()}`,
      user_id: data.userId,
      business_id: data.businessId,
      clock_in: clockInIso,
      clock_out: clockOutIso,
      status: 'completed',
      total_hours: workedHours,
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      overtime_pay: Math.round(overtimePay * 100) / 100,
      hourly_rate_at_shift: rate,
      estimated_pay: Math.round((regularPay + overtimePay) * 100) / 100,
      job_site: data.jobSite || 'Manual Entry',
      notes: data.notes || '',
      is_manual: true,
      approval_status: approvalStatus,
      approved_by: isManagerOrOwner ? data.userId : undefined,
      approved_at: isManagerOrOwner ? new Date().toISOString() : undefined
    };

    shifts.unshift(newShift);
    setLocal('shifts', shifts);
    return newShift;
  },

  // Management Shift Approval Workflow
  approveShift: async (shiftId: string, approvedBy?: string): Promise<Shift> => {
    const shifts = getLocal<Shift[]>('shifts', DEFAULT_SHIFTS);
    let updated: Shift | null = null;
    const next = shifts.map(s => {
      if (s.id === shiftId) {
        updated = {
          ...s,
          approval_status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString()
        };
        return updated;
      }
      return s;
    });
    setLocal('shifts', next);
    if (!updated) throw new Error('Shift not found');
    return updated;
  },

  rejectShift: async (shiftId: string, reason?: string, approvedBy?: string): Promise<Shift> => {
    const shifts = getLocal<Shift[]>('shifts', DEFAULT_SHIFTS);
    let updated: Shift | null = null;
    const next = shifts.map(s => {
      if (s.id === shiftId) {
        updated = {
          ...s,
          approval_status: 'rejected',
          rejection_reason: reason || 'Shift rejected by management',
          approved_by: approvedBy,
          approved_at: new Date().toISOString()
        };
        return updated;
      }
      return s;
    });
    setLocal('shifts', next);
    if (!updated) throw new Error('Shift not found');
    return updated;
  },

  // Expenses API
  getExpenses: async (businessId: string, userId?: string): Promise<ShiftExpense[]> => {
    const all = getLocal<ShiftExpense[]>('expenses', DEFAULT_EXPENSES);
    let filtered = all.filter(e => e.business_id === businessId);
    if (userId) {
      filtered = filtered.filter(e => e.user_id === userId);
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  saveExpense: async (expense: Partial<ShiftExpense>): Promise<ShiftExpense> => {
    const all = getLocal<ShiftExpense[]>('expenses', DEFAULT_EXPENSES);
    let saved: ShiftExpense;
    if (expense.id) {
      saved = { ...all.find(e => e.id === expense.id), ...expense } as ShiftExpense;
      const next = all.map(e => e.id === expense.id ? saved : e);
      setLocal('expenses', next);
    } else {
      saved = {
        id: `exp_${Date.now()}`,
        business_id: expense.business_id || 'b0000000-0000-0000-0000-000000000001',
        user_id: expense.user_id || 'c3333333-3333-3333-3333-333333333333',
        shift_id: expense.shift_id,
        title: expense.title || 'Expense Claim',
        category: expense.category || 'Travel',
        amount: Number(expense.amount) || 0,
        receipt_url: expense.receipt_url,
        date: expense.date || new Date().toISOString().split('T')[0],
        status: expense.status || 'pending',
        notes: expense.notes || '',
        created_at: new Date().toISOString()
      };
      all.unshift(saved);
      setLocal('expenses', all);
    }
    return saved;
  },

  deleteExpense: async (id: string): Promise<boolean> => {
    const all = getLocal<ShiftExpense[]>('expenses', DEFAULT_EXPENSES);
    setLocal('expenses', all.filter(e => e.id !== id));
    return true;
  },

  // Accept Invite Code
  joinBusinessWithCode: async (userId: string, inviteCode: string): Promise<Business> => {
    const businesses = getLocal<Business[]>('businesses', [DEFAULT_BUSINESS]);
    const memberships = getLocal<Membership[]>('memberships', DEFAULT_MEMBERSHIPS);

    const targetBiz = businesses.find(b => b.invite_code.toUpperCase() === inviteCode.trim().toUpperCase());
    if (!targetBiz) {
      throw new Error('Invalid invite code. Please check with your employer.');
    }

    const existing = memberships.find(m => m.user_id === userId && m.business_id === targetBiz.id);
    if (!existing) {
      memberships.push({
        id: `m_${Date.now()}`,
        user_id: userId,
        business_id: targetBiz.id,
        role: 'employee',
        status: 'active',
        allow_employer_edit: false,
        custom_hourly_rate: targetBiz.default_hourly_rate
      });
      setLocal('memberships', memberships);
    }

    return targetBiz;
  },

  // ==============================================================================
  // SCHEDULED SHIFTS & WEEKLY ROTA (FEATURE 1)
  // ==============================================================================
  getScheduledShifts: async (businessId: string, userId?: string): Promise<ScheduledShift[]> => {
    const all = getLocal<ScheduledShift[]>('scheduled_shifts', DEFAULT_SCHEDULED_SHIFTS);
    const profiles = await crewpulseApi.getProfiles();
    return all
      .filter(s => {
        if (s.business_id !== businessId && s.business_id !== 'b0000000-0000-0000-0000-000000000001') return false;
        if (userId && s.user_id !== userId) return false;
        return true;
      })
      .map(s => ({
        ...s,
        profile: profiles.find(p => p.id === s.user_id)
      }))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  },

  createScheduledShift: async (data: Omit<ScheduledShift, 'id' | 'created_at'>): Promise<ScheduledShift> => {
    const all = getLocal<ScheduledShift[]>('scheduled_shifts', DEFAULT_SCHEDULED_SHIFTS);
    const profiles = await crewpulseApi.getProfiles();
    const newShift: ScheduledShift = {
      ...data,
      id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      status: data.status || 'scheduled',
      profile: profiles.find(p => p.id === data.user_id)
    };
    all.push(newShift);
    setLocal('scheduled_shifts', all);
    return newShift;
  },

  confirmScheduledShift: async (shiftId: string, userId: string): Promise<ScheduledShift> => {
    const all = getLocal<ScheduledShift[]>('scheduled_shifts', DEFAULT_SCHEDULED_SHIFTS);
    const target = all.find(s => s.id === shiftId);
    if (!target) throw new Error('Scheduled shift not found');
    if (target.user_id !== userId) throw new Error('Unauthorized to confirm this shift');
    target.status = 'confirmed';
    target.confirmed_at = new Date().toISOString();
    setLocal('scheduled_shifts', all);
    const profiles = await crewpulseApi.getProfiles();
    return { ...target, profile: profiles.find(p => p.id === target.user_id) };
  },

  declineScheduledShift: async (shiftId: string, userId: string, reason?: string): Promise<ScheduledShift> => {
    const all = getLocal<ScheduledShift[]>('scheduled_shifts', DEFAULT_SCHEDULED_SHIFTS);
    const target = all.find(s => s.id === shiftId);
    if (!target) throw new Error('Scheduled shift not found');
    if (target.user_id !== userId) throw new Error('Unauthorized to decline this shift');
    target.status = 'declined';
    target.decline_reason = reason || 'Staff unavailable';
    setLocal('scheduled_shifts', all);
    const profiles = await crewpulseApi.getProfiles();
    return { ...target, profile: profiles.find(p => p.id === target.user_id) };
  },

  deleteScheduledShift: async (shiftId: string): Promise<boolean> => {
    const all = getLocal<ScheduledShift[]>('scheduled_shifts', DEFAULT_SCHEDULED_SHIFTS);
    const filtered = all.filter(s => s.id !== shiftId);
    setLocal('scheduled_shifts', filtered);
    return true;
  },

  // ==============================================================================
  // SHIFT SWAP & COVER REQUESTS (FEATURE 3)
  // ==============================================================================
  getShiftSwapRequests: async (businessId: string): Promise<ShiftSwapRequest[]> => {
    const all = getLocal<ShiftSwapRequest[]>('shift_swap_requests', DEFAULT_SWAP_REQUESTS);
    const profiles = await crewpulseApi.getProfiles();
    const scheduledShifts = getLocal<ScheduledShift[]>('scheduled_shifts', DEFAULT_SCHEDULED_SHIFTS);

    return all
      .filter(r => r.business_id === businessId || r.business_id === 'b0000000-0000-0000-0000-000000000001')
      .map(r => ({
        ...r,
        requester_profile: profiles.find(p => p.id === r.requester_id),
        target_profile: r.target_user_id ? profiles.find(p => p.id === r.target_user_id) : undefined,
        scheduled_shift: scheduledShifts.find(s => s.id === r.scheduled_shift_id),
        target_shift: r.target_shift_id ? scheduledShifts.find(s => s.id === r.target_shift_id) : undefined
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createShiftSwapRequest: async (data: {
    businessId: string;
    scheduledShiftId: string;
    requesterId: string;
    targetUserId?: string;
    targetShiftId?: string;
    swapType: 'swap' | 'cover';
    reason: string;
  }): Promise<ShiftSwapRequest> => {
    const all = getLocal<ShiftSwapRequest[]>('shift_swap_requests', DEFAULT_SWAP_REQUESTS);
    const newRequest: ShiftSwapRequest = {
      id: `swap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      business_id: data.businessId,
      scheduled_shift_id: data.scheduledShiftId,
      requester_id: data.requesterId,
      target_user_id: data.targetUserId,
      target_shift_id: data.targetShiftId,
      swap_type: data.swapType,
      reason: data.reason || 'Staff schedule clash',
      status: data.targetUserId ? 'peer_accepted' : 'open',
      created_at: new Date().toISOString()
    };
    all.unshift(newRequest);
    setLocal('shift_swap_requests', all);
    return newRequest;
  },

  claimShiftCover: async (swapRequestId: string, claimingUserId: string, targetShiftId?: string): Promise<ShiftSwapRequest> => {
    const all = getLocal<ShiftSwapRequest[]>('shift_swap_requests', DEFAULT_SWAP_REQUESTS);
    const req = all.find(r => r.id === swapRequestId);
    if (!req) throw new Error('Shift cover request not found');
    if (req.requester_id === claimingUserId) throw new Error('Cannot claim your own shift cover request');

    req.target_user_id = claimingUserId;
    if (targetShiftId) req.target_shift_id = targetShiftId;
    req.status = 'peer_accepted';
    setLocal('shift_swap_requests', all);

    const fullList = await crewpulseApi.getShiftSwapRequests(req.business_id);
    return fullList.find(r => r.id === swapRequestId) || req;
  },

  approveShiftSwap: async (swapRequestId: string, managerId: string): Promise<ShiftSwapRequest> => {
    const allSwaps = getLocal<ShiftSwapRequest[]>('shift_swap_requests', DEFAULT_SWAP_REQUESTS);
    const req = allSwaps.find(r => r.id === swapRequestId);
    if (!req) throw new Error('Swap request not found');
    if (!req.target_user_id) throw new Error('No substitute staff assigned to this swap');

    const scheduled = getLocal<ScheduledShift[]>('scheduled_shifts', DEFAULT_SCHEDULED_SHIFTS);
    const primaryShift = scheduled.find(s => s.id === req.scheduled_shift_id);
    if (primaryShift) {
      primaryShift.user_id = req.target_user_id;
      primaryShift.status = 'confirmed';
      primaryShift.confirmed_at = new Date().toISOString();
    }

    if (req.target_shift_id) {
      const targetShift = scheduled.find(s => s.id === req.target_shift_id);
      if (targetShift) {
        targetShift.user_id = req.requester_id;
        targetShift.status = 'confirmed';
        targetShift.confirmed_at = new Date().toISOString();
      }
    }

    setLocal('scheduled_shifts', scheduled);

    req.status = 'approved';
    req.reviewed_by = managerId;
    req.reviewed_at = new Date().toISOString();
    setLocal('shift_swap_requests', allSwaps);

    const fullList = await crewpulseApi.getShiftSwapRequests(req.business_id);
    return fullList.find(r => r.id === swapRequestId) || req;
  },

  rejectShiftSwap: async (swapRequestId: string, managerId: string, reason?: string): Promise<ShiftSwapRequest> => {
    const allSwaps = getLocal<ShiftSwapRequest[]>('shift_swap_requests', DEFAULT_SWAP_REQUESTS);
    const req = allSwaps.find(r => r.id === swapRequestId);
    if (!req) throw new Error('Swap request not found');

    req.status = 'rejected';
    req.reviewed_by = managerId;
    req.reviewed_at = new Date().toISOString();
    req.rejection_reason = reason || 'Declined by operations management';
    setLocal('shift_swap_requests', allSwaps);

    const fullList = await crewpulseApi.getShiftSwapRequests(req.business_id);
    return fullList.find(r => r.id === swapRequestId) || req;
  },

  cancelShiftSwap: async (swapRequestId: string, requesterId: string): Promise<ShiftSwapRequest> => {
    const allSwaps = getLocal<ShiftSwapRequest[]>('shift_swap_requests', DEFAULT_SWAP_REQUESTS);
    const req = allSwaps.find(r => r.id === swapRequestId);
    if (!req) throw new Error('Swap request not found');
    if (req.requester_id !== requesterId) throw new Error('Unauthorized to cancel this request');

    req.status = 'cancelled';
    setLocal('shift_swap_requests', allSwaps);
    return req;
  }
};
