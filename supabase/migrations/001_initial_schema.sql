-- ==============================================================================
-- SECTION LOBBY DATABASE SCHEMA
-- Migration: 001_initial_schema.sql
-- Description: Core tables, enums, indexes, and Row Level Security for Section Lobby
-- ==============================================================================

-- 1. SECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    academic_year TEXT NOT NULL,
    semester TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. MEMBERS TABLE
CREATE TYPE public.member_role AS ENUM ('admin', 'member');
CREATE TYPE public.member_status AS ENUM ('active', 'inactive');

CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    user_id UUID, -- References auth.users(id) when linked to Supabase Auth
    name TEXT NOT NULL,
    email TEXT,
    role public.member_role DEFAULT 'member'::public.member_role NOT NULL,
    status public.member_status DEFAULT 'active'::public.member_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ANNOUNCEMENTS TABLE
CREATE TYPE public.priority_level AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE public.announcement_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority public.priority_level DEFAULT 'normal'::public.priority_level NOT NULL,
    status public.announcement_status DEFAULT 'published'::public.announcement_status NOT NULL,
    published_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMPTZ,
    source_text TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ASSIGNMENTS TABLE
CREATE TYPE public.assignment_status AS ENUM ('pending', 'submitted', 'completed', 'archived');

CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,
    priority public.priority_level DEFAULT 'normal'::public.priority_level NOT NULL,
    status public.assignment_status DEFAULT 'pending'::public.assignment_status NOT NULL,
    source_text TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TASKS TABLE
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'archived');

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    assigned_to TEXT,
    due_at TIMESTAMPTZ,
    priority public.priority_level DEFAULT 'normal'::public.priority_level NOT NULL,
    status public.task_status DEFAULT 'pending'::public.task_status NOT NULL,
    source_text TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. NOTES TABLE
CREATE TYPE public.note_status AS ENUM ('published', 'archived');

CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    subject TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    status public.note_status DEFAULT 'published'::public.note_status NOT NULL,
    source_text TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. EVENTS TABLE
CREATE TYPE public.event_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    location TEXT,
    status public.event_status DEFAULT 'upcoming'::public.event_status NOT NULL,
    source_text TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. RESOURCES TABLE
CREATE TYPE public.resource_status AS ENUM ('active', 'archived');

CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    file_path TEXT,
    category TEXT,
    status public.resource_status DEFAULT 'active'::public.resource_status NOT NULL,
    source_text TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_announcements_section_status ON public.announcements(section_id, status);
CREATE INDEX IF NOT EXISTS idx_assignments_section_due ON public.assignments(section_id, due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_section_due ON public.tasks(section_id, due_at);
CREATE INDEX IF NOT EXISTS idx_events_section_starts ON public.events(section_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_notes_section ON public.notes(section_id);
CREATE INDEX IF NOT EXISTS idx_resources_section ON public.resources(section_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Reading: Any authenticated member of the section can read active content
CREATE POLICY "Allow members to read section content" ON public.sections
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow members to read announcements" ON public.announcements
    FOR SELECT TO authenticated USING (status = 'published');

CREATE POLICY "Allow members to read assignments" ON public.assignments
    FOR SELECT TO authenticated USING (status != 'archived');

CREATE POLICY "Allow members to read tasks" ON public.tasks
    FOR SELECT TO authenticated USING (status != 'archived');

CREATE POLICY "Allow members to read notes" ON public.notes
    FOR SELECT TO authenticated USING (status = 'published');

CREATE POLICY "Allow members to read events" ON public.events
    FOR SELECT TO authenticated USING (status != 'cancelled');

CREATE POLICY "Allow members to read resources" ON public.resources
    FOR SELECT TO authenticated USING (status = 'active');

-- Writing: Only administrators can insert, update, or delete
CREATE POLICY "Allow admins to modify announcements" ON public.announcements
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.members
        WHERE members.user_id = auth.uid() AND members.role = 'admin'
    ));

CREATE POLICY "Allow admins to modify assignments" ON public.assignments
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.members
        WHERE members.user_id = auth.uid() AND members.role = 'admin'
    ));

CREATE POLICY "Allow admins to modify tasks" ON public.tasks
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.members
        WHERE members.user_id = auth.uid() AND members.role = 'admin'
    ));

CREATE POLICY "Allow admins to modify notes" ON public.notes
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.members
        WHERE members.user_id = auth.uid() AND members.role = 'admin'
    ));

CREATE POLICY "Allow admins to modify events" ON public.events
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.members
        WHERE members.user_id = auth.uid() AND members.role = 'admin'
    ));

CREATE POLICY "Allow admins to modify resources" ON public.resources
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.members
        WHERE members.user_id = auth.uid() AND members.role = 'admin'
    ));
