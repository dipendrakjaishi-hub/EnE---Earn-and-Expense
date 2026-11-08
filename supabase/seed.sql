-- ==============================================================================
-- CREWPULSE - SEED DATA SCRIPT
-- 1 Business, 1 Employer, 1 Manager, 5 Employees, 2 Weeks of realistic shifts
-- Paste into Supabase SQL Editor after running schema.sql
-- ==============================================================================

-- 1. Insert Profiles (Simulating authenticated users)
INSERT INTO public.profiles (id, email, full_name, avatar_url, phone)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'elena@crestlinehospitality.com', 'Elena Rostova', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', '+44 7700 900111'),
  ('b2222222-2222-2222-2222-222222222222', 'marcus.vance@crestlinehospitality.com', 'Marcus Vance', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '+44 7700 900222'),
  ('c3333333-3333-3333-3333-333333333333', 'liam.murphy@crewteam.co.uk', 'Liam Murphy', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '+44 7700 900333'),
  ('d4444444-4444-4444-4444-444444444444', 'sophie.chen@crewteam.co.uk', 'Sophie Chen', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', '+44 7700 900444'),
  ('e5555555-5555-5555-5555-555555555555', 'jordan.blake@crewteam.co.uk', 'Jordan Blake', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '+44 7700 900555'),
  ('f6666666-6666-6666-6666-666666666666', 'amara.diallo@crewteam.co.uk', 'Amara Diallo', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150', '+44 7700 900666'),
  ('a7777777-7777-7777-7777-777777777777', 'noah.patel@crewteam.co.uk', 'Noah Patel', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', '+44 7700 900777')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 2. Insert Business
INSERT INTO public.businesses (id, name, slug, address, currency, timezone, default_hourly_rate, owner_id, invite_code)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'Crestline Hospitality & Events',
  'crestline-hospitality',
  '42 St. John Street, Farringdon, London EC1M 4AY',
  'GBP',
  'Europe/London',
  14.50,
  'a1111111-1111-1111-1111-111111111111',
  'CREST-789'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Memberships
INSERT INTO public.memberships (user_id, business_id, role, status, allow_employer_edit, custom_hourly_rate)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000001', 'employer', 'active', true, 28.00),
  ('b2222222-2222-2222-2222-222222222222', 'b0000000-0000-0000-0000-000000000001', 'manager', 'active', true, 19.50),
  ('c3333333-3333-3333-3333-333333333333', 'b0000000-0000-0000-0000-000000000001', 'employee', 'active', false, 15.00),
  ('d4444444-4444-4444-4444-444444444444', 'b0000000-0000-0000-0000-000000000001', 'employee', 'active', true, 15.50),
  ('e5555555-5555-5555-5555-555555555555', 'b0000000-0000-0000-0000-000000000001', 'employee', 'active', false, 14.50),
  ('f6666666-6666-6666-6666-666666666666', 'b0000000-0000-0000-0000-000000000001', 'employee', 'active', true, 16.00),
  ('a7777777-7777-7777-7777-777777777777', 'b0000000-0000-0000-0000-000000000001', 'employee', 'active', false, 14.50)
ON CONFLICT (user_id, business_id) DO NOTHING;

-- 4. Insert 2 Weeks of Realistic Completed and Active Shifts
INSERT INTO public.shifts (
  id, user_id, business_id, clock_in, clock_out, status, total_hours, 
  hourly_rate_at_shift, estimated_pay, job_site, notes, location_lat, location_lng, location_address
)
VALUES
  -- Day -1: Liam Murphy
  ('s0000001-0000-0000-0000-000000000001', 'c3333333-3333-3333-3333-333333333333', 'b0000000-0000-0000-0000-000000000001',
   NOW() - INTERVAL '1 day' + INTERVAL '8 hours', NOW() - INTERVAL '1 day' + INTERVAL '16 hours 30 minutes', 'completed',
   8.00, 15.00, 120.00, 'Somerset House Gala', 'Lead bartender during main reception', 51.5113, -0.1171, 'Somerset House, Strand, London'),
  
  -- Day -2: Sophie Chen
  ('s0000002-0000-0000-0000-000000000002', 'd4444444-4444-4444-4444-444444444444', 'b0000000-0000-0000-0000-000000000001',
   NOW() - INTERVAL '2 days' + INTERVAL '9 hours', NOW() - INTERVAL '2 days' + INTERVAL '17 hours 30 minutes', 'completed',
   8.00, 15.50, 124.00, 'Canary Wharf Banquet', 'Catering service lead', 51.5054, -0.0209, 'Cabot Square, Canary Wharf, London'),

  -- Day -3: Jordan Blake
  ('s0000003-0000-0000-0000-000000000003', 'e5555555-5555-5555-5555-555555555555', 'b0000000-0000-0000-0000-000000000001',
   NOW() - INTERVAL '3 days' + INTERVAL '10 hours', NOW() - INTERVAL '3 days' + INTERVAL '18 hours', 'completed',
   7.50, 14.50, 108.75, 'Guildhall Event Hall', 'Floor setup and table prep', 51.5157, -0.0920, 'Gresham St, London EC2V 7HH'),

  -- Day -4: Amara Diallo
  ('s0000004-0000-0000-0000-000000000004', 'f6666666-6666-6666-6666-666666666666', 'b0000000-0000-0000-0000-000000000001',
   NOW() - INTERVAL '4 days' + INTERVAL '12 hours', NOW() - INTERVAL '4 days' + INTERVAL '21 hours', 'completed',
   8.50, 16.00, 136.00, 'Kensington Roof Gardens', 'Cocktail bar & restocking', 51.5014, -0.1912, '99 Kensington High St, London'),

  -- Day -5: Noah Patel
  ('s0000005-0000-0000-0000-000000000005', 'a7777777-7777-7777-7777-777777777777', 'b0000000-0000-0000-0000-000000000001',
   NOW() - INTERVAL '5 days' + INTERVAL '8 hours', NOW() - INTERVAL '5 days' + INTERVAL '16 hours', 'completed',
   7.50, 14.50, 108.75, 'Somerset House Gala', 'Kitchen porter and glassware clearing', 51.5113, -0.1171, 'Somerset House, Strand, London'),

  -- Today: Liam Murphy is CLOCKED IN (Active right now!)
  ('s0000006-0000-0000-0000-000000000006', 'c3333333-3333-3333-3333-333333333333', 'b0000000-0000-0000-0000-000000000001',
   NOW() - INTERVAL '3 hours 45 minutes', NULL, 'active',
   3.75, 15.00, 56.25, 'The Brewery Chiswell', 'Head bartender for conference dinner', 51.5204, -0.0911, '52 Chiswell St, London EC1Y 4SD')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Breaks
INSERT INTO public.breaks (shift_id, break_start, break_end, duration_minutes)
VALUES
  ('s0000001-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day' + INTERVAL '12 hours', NOW() - INTERVAL '1 day' + INTERVAL '12 hours 30 minutes', 30),
  ('s0000002-0000-0000-0000-000000000002', NOW() - INTERVAL '2 days' + INTERVAL '13 hours', NOW() - INTERVAL '2 days' + INTERVAL '13 hours 30 minutes', 30),
  ('s0000003-0000-0000-0000-000000000003', NOW() - INTERVAL '3 days' + INTERVAL '14 hours', NOW() - INTERVAL '3 days' + INTERVAL '14 hours 30 minutes', 30);
