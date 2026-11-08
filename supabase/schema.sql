-- ==============================================================================
-- CREWPULSE - COMPLETE SUPABASE POSTGRES SCHEMA & ROW LEVEL SECURITY (RLS)
-- Free Tier Compatible (Postgres 15+)
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Extends Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. BUSINESSES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    address TEXT,
    logo_url TEXT,
    currency TEXT DEFAULT 'GBP' NOT NULL,
    timezone TEXT DEFAULT 'Europe/London' NOT NULL,
    default_hourly_rate NUMERIC(10, 2) DEFAULT 12.50 NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. MEMBERSHIPS (Multi-tenant junction with role & permissions)
-- ------------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('employer', 'manager', 'employee');
CREATE TYPE membership_status AS ENUM ('active', 'invited', 'disabled');

CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    role user_role DEFAULT 'employee' NOT NULL,
    status membership_status DEFAULT 'active' NOT NULL,
    allow_employer_edit BOOLEAN DEFAULT false NOT NULL, -- Worker permission toggle
    custom_hourly_rate NUMERIC(10, 2), -- Overrides business default if set
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, business_id)
);

-- ------------------------------------------------------------------------------
-- 4. SHIFTS (Clock in/out & manual shifts)
-- ------------------------------------------------------------------------------
CREATE TYPE shift_status AS ENUM ('active', 'break', 'completed');

CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    clock_in TIMESTAMPTZ NOT NULL,
    clock_out TIMESTAMPTZ,
    status shift_status DEFAULT 'active' NOT NULL,
    total_hours NUMERIC(6, 2) DEFAULT 0.00,
    hourly_rate_at_shift NUMERIC(10, 2) NOT NULL,
    estimated_pay NUMERIC(10, 2) DEFAULT 0.00,
    job_site TEXT,
    notes TEXT,
    location_lat NUMERIC(10, 7),
    location_lng NUMERIC(10, 7),
    location_address TEXT,
    is_manual BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. BREAKS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.breaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    break_start TIMESTAMPTZ NOT NULL,
    break_end TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. SCHEDULES (Weekly rota containers)
-- ------------------------------------------------------------------------------
CREATE TYPE schedule_status AS ENUM ('draft', 'published');

CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    status schedule_status DEFAULT 'draft' NOT NULL,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (business_id, week_start_date)
);

-- ------------------------------------------------------------------------------
-- 7. SCHEDULED SHIFTS (Items inside a rota)
-- ------------------------------------------------------------------------------
CREATE TYPE rota_response_status AS ENUM ('pending', 'seen', 'accepted', 'declined', 'no_show');

CREATE TABLE IF NOT EXISTS public.scheduled_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    role_title TEXT,
    job_site TEXT,
    notes TEXT,
    status rota_response_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 8. SHIFT RESPONSES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shift_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheduled_shift_id UUID NOT NULL REFERENCES public.scheduled_shifts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status rota_response_status NOT NULL,
    reason TEXT,
    responded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 9. INVOICES
-- ------------------------------------------------------------------------------
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_address TEXT,
    invoice_number TEXT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    vat_rate NUMERIC(5, 2) DEFAULT 0.00,
    total_hours NUMERIC(8, 2) DEFAULT 0.00,
    subtotal NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    status invoice_status DEFAULT 'draft' NOT NULL,
    payment_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (business_id, invoice_number)
);

-- ------------------------------------------------------------------------------
-- 10. INVOICE ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    hours NUMERIC(6, 2) NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 11. EXPENSES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'supplies',
    amount NUMERIC(10, 2) NOT NULL,
    receipt_url TEXT,
    is_billable BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 12. REPORT SCHEDULES (Automated email reports)
-- ------------------------------------------------------------------------------
CREATE TYPE report_frequency AS ENUM ('weekly', 'monthly');

CREATE TABLE IF NOT EXISTS public.report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    frequency report_frequency DEFAULT 'weekly' NOT NULL,
    recipients TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 13. AUDIT LOG (Immutable trail of shift and wage edits)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- 'shift', 'membership', 'invoice'
    entity_id UUID NOT NULL,
    changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    action TEXT NOT NULL, -- 'create', 'update', 'delete'
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- INDEXES FOR MAXIMUM QUERY SPEED
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_business ON public.memberships(business_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user ON public.shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_business ON public.shifts(business_id);
CREATE INDEX IF NOT EXISTS idx_shifts_clock_in ON public.shifts(clock_in);
CREATE INDEX IF NOT EXISTS idx_breaks_shift ON public.breaks(shift_id);
CREATE INDEX IF NOT EXISTS idx_sched_shifts_user ON public.scheduled_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_business ON public.audit_log(business_id);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is employer or manager of a business
CREATE OR REPLACE FUNCTION public.is_business_admin(b_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.memberships
        WHERE business_id = b_id
          AND user_id = auth.uid()
          AND role IN ('employer', 'manager')
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles RLS
CREATE POLICY "Public profiles are readable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 2. Businesses RLS
CREATE POLICY "Users see businesses they belong to"
    ON public.businesses FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.business_id = businesses.id
              AND memberships.user_id = auth.uid()
        )
        OR owner_id = auth.uid()
    );

CREATE POLICY "Employers can update their business"
    ON public.businesses FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "Any authenticated user can create a business"
    ON public.businesses FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

-- 3. Memberships RLS
CREATE POLICY "Members see peers in same business"
    ON public.memberships FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.is_business_admin(business_id)
    );

CREATE POLICY "Admins can manage memberships"
    ON public.memberships FOR ALL
    TO authenticated
    USING (public.is_business_admin(business_id));

CREATE POLICY "Users can update their own permission toggle"
    ON public.memberships FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- 4. Shifts RLS
CREATE POLICY "Workers view their own shifts, admins view business shifts"
    ON public.shifts FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.is_business_admin(business_id)
    );

CREATE POLICY "Workers can log their own shifts"
    ON public.shifts FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Workers can update own shift, or admins if worker allowed permission"
    ON public.shifts FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR (
            public.is_business_admin(business_id)
            AND EXISTS (
                SELECT 1 FROM public.memberships
                WHERE memberships.business_id = shifts.business_id
                  AND memberships.user_id = shifts.user_id
                  AND memberships.allow_employer_edit = true
            )
        )
    );

-- 5. Breaks RLS
CREATE POLICY "Breaks accessible if shift is accessible"
    ON public.breaks FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.shifts
            WHERE shifts.id = breaks.shift_id
              AND (shifts.user_id = auth.uid() OR public.is_business_admin(shifts.business_id))
        )
    );

-- 6. Audit Log RLS
CREATE POLICY "Business admins can read audit log"
    ON public.audit_log FOR SELECT
    TO authenticated
    USING (public.is_business_admin(business_id));

CREATE POLICY "Audit logs can be created by authenticated users"
    ON public.audit_log FOR INSERT
    TO authenticated
    WITH CHECK (changed_by = auth.uid());
