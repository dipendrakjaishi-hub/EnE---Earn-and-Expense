export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  phone_number?: string;
  address?: string;
  short_note?: string;
  profile_picture?: string;
  created_date?: string;
  updated_date?: string;
}

export interface TrustedPerson {
  id: string;
  email: string;
  name: string;
  relation: string; // wife, mother, father, etc.
  access_level: 'read' | 'write';
  created_by: string;
}

export interface Company {
  id: string;
  name: string;
  hourly_rate?: number;
  currency?: string;
  overtime_rate?: number;
  overtime_start_hours?: number;
  color?: string;
  is_active?: boolean;
  created_by: string;
}

export interface WorkShift {
  id: string;
  company_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  break_minutes?: number;
  job_description?: string;
  total_hours?: number;
  hourly_rate?: number;
  total_income?: number;
  remarks?: string;
  visibility?: 'private' | 'shared';
  shared_with?: string[];
  month?: number;
  year?: number;
  created_by: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category?: string;
  date?: string;
  company_id?: string;
  is_deductible?: boolean;
  notes?: string;
  receipt_url?: string;
  created_by: string;
}

export interface UserSettings {
  id: string;
  theme?: 'light' | 'dark' | 'auto';
  currency?: string;
  date_format?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  week_start?: 'monday' | 'sunday' | 'saturday';
  profile_picture?: string;
  bio?: string;
  subscription_tier?: 'free' | 'premium';
  extra_company_slots?: number;
  notifications_enabled?: boolean;
  punch_reminder?: boolean;
  payday_reminder?: boolean;
  wallpaper_home?: string;
  wallpaper_work?: string;
  wallpaper_income?: string;
  wallpaper_chat?: string;
  wallpaper_expenses?: string;
  wallpaper_customise?: string;
  wallpaper_settings?: string;
  wallpaper_profile?: string;
  encryption_enabled?: boolean;
  expense_categories?: string[];
  disappearing_messages_default?: number;
  created_by: string;
}

export interface ChatMessage {
  id: string;
  sender_email: string;
  receiver_email?: string;
  group_id?: string;
  content: string;
  is_read?: boolean;
  created_date?: string;
  shift_id?: string;
  attachment_url?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  members: string[]; // emails
  type: 'private' | 'group';
  created_by: string;
}

export interface IncomeGoal {
  id: string;
  title: string;
  target_amount: number;
  current_progress: number;
  category: string;
  period: string; // e.g., "Monthly Savings", "Yearly Investment"
  created_by: string;
  created_at?: string;
}
