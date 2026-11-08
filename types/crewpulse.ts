export type UserRole = 'employer' | 'manager' | 'employee';
export type MembershipStatus = 'active' | 'invited' | 'disabled';
export type ShiftStatus = 'active' | 'break' | 'completed';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  phone_number?: string;
  address?: string;
  short_note?: string; // Professional note (visible to employer/roster)
  bio?: string; // Private personal notes/bio
  trade?: string; // e.g. Bartender, Site Crew, Cleaning
  hourly_rate_preference?: number;
  employee_id?: string; // Unique company-provided staff ID number (e.g. LM-2102-LDN)
  password?: string; // Password set by user
  dob?: string; // Date of birth (YYYY-MM-DD) for KYC & staff code generation
  working_rights?: 'Full-Time' | 'Part-Time' | 'Student Visa (20h/wk)' | 'Flexible'; // Part-time or Full-time working right
  working_post?: string; // Working post / designation (e.g. Senior Banquet Bartender, Front of House Supervisor)
  kyc_status?: 'unverified' | 'pending' | 'verified';
  kyc_document_type?: string; // Passport, Driving Licence, National ID Card
  kyc_document_url?: string;
  kyc_location_code?: string; // e.g. LDN, MAN, BIR
  kyc_submitted_at?: string;
  wallpaper_work?: string;
  wallpaper_income?: string;
  wallpaper_chat?: string;
  wallpaper_expenses?: string;
  wallpaper_customise?: string;
  notifications_enabled?: boolean;
  dark_mode?: boolean;
  gps_consent?: boolean;
  created_at?: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  address?: string;
  logo_url?: string;
  currency: string;
  timezone: string;
  default_hourly_rate: number;
  overtime_threshold_hours?: number; // e.g. 8 hours daily cap
  overtime_rate_multiplier?: number; // e.g. 1.5x
  night_shift_bonus_rate?: number; // e.g. +£2.00/hr
  owner_id: string;
  invite_code: string;
  created_at?: string;
}

export interface Membership {
  id: string;
  user_id: string;
  business_id: string;
  role: UserRole;
  status: MembershipStatus;
  allow_employer_edit: boolean;
  custom_hourly_rate?: number;
  profile?: Profile;
  business?: Business;
  created_at?: string;
}

export interface ShiftBreak {
  id: string;
  shift_id: string;
  break_start: string;
  break_end?: string;
  duration_minutes: number;
  created_at?: string;
}

export interface JobSite {
  id: string;
  business_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number; // Max allowed distance (e.g. 20 meters)
}

export interface ShiftExpense {
  id: string;
  shift_id?: string;
  user_id: string;
  business_id: string;
  title: string;
  category: string; // e.g. Travel, Food, Supplies, Parking, Tools
  amount: number;
  currency?: string;
  receipt_url?: string;
  date?: string;
  status: 'pending' | 'approved' | 'reimbursed';
  notes?: string;
  created_at?: string;
}

export interface Shift {
  id: string;
  user_id: string;
  business_id: string;
  clock_in: string;
  clock_out?: string;
  status: ShiftStatus;
  total_hours: number;
  regular_hours?: number;
  overtime_hours?: number;
  overtime_pay?: number;
  hourly_rate_at_shift: number;
  estimated_pay: number;
  expense_total?: number;
  expenses?: ShiftExpense[];
  job_site?: string;
  job_site_id?: string;
  notes?: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  clock_in_selfie?: string;
  clock_out_selfie?: string;
  distance_from_site_meters?: number;
  is_geofence_verified?: boolean;
  is_manual?: boolean;
  approval_status?: 'approved' | 'pending' | 'rejected';
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  is_offline_recorded?: boolean;
  synced_to_cloud?: boolean;
  offline_recorded_at?: string;
  synced_at?: string;
  breaks?: ShiftBreak[];
  profile?: Profile;
  created_at?: string;
  updated_at?: string;
}

export interface ShiftFilterOptions {
  status?: string;
  timeRange?: 'today' | 'week' | 'month' | 'all';
  searchQuery?: string;
}

export type ShiftScheduleStatus = 'scheduled' | 'confirmed' | 'declined' | 'completed' | 'cancelled';

export interface ScheduledShift {
  id: string;
  business_id: string;
  user_id: string;
  job_site: string;
  job_site_id?: string;
  address: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  role_title: string; // e.g. Lead Bartender, Kitchen Porter, SIA Security
  hourly_rate: number;
  notes?: string;
  uniform_requirements?: string;
  status: ShiftScheduleStatus;
  decline_reason?: string;
  confirmed_at?: string;
  created_at?: string;
  created_by?: string;
  profile?: Profile;
}

export type SwapType = 'swap' | 'cover';
export type SwapStatus = 'open' | 'peer_accepted' | 'approved' | 'rejected' | 'cancelled';

export interface ShiftSwapRequest {
  id: string;
  business_id: string;
  scheduled_shift_id: string;
  scheduled_shift?: ScheduledShift;
  requester_id: string;
  requester_profile?: Profile;
  target_user_id?: string;
  target_profile?: Profile;
  target_shift_id?: string;
  target_shift?: ScheduledShift;
  swap_type: SwapType;
  reason: string;
  status: SwapStatus;
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

