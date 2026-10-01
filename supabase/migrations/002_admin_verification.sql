-- ==============================================================================
-- SECTION LOBBY DATABASE SCHEMA
-- Migration: 002_admin_verification.sql
-- Description: Server-side stored procedure, SHA-256 credential hashing,
--              and role elevation (members.role = 'admin')
-- ==============================================================================

-- 1. Enable pgcrypto for cryptographic SHA-256 digest functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create admin_credentials table to store hashed administrator credentials
CREATE TABLE IF NOT EXISTS public.admin_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL UNIQUE,
    label TEXT DEFAULT 'Primary Administrator Credential',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on admin_credentials
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Deny direct access to client roles; credentials can only be verified via SECURITY DEFINER RPC
CREATE POLICY "Deny direct client access to admin_credentials" ON public.admin_credentials
    FOR ALL TO public
    USING (false);

-- 3. Seed default SHA-256 credential record for 'admin_only'
-- SHA-256('admin_only') = 'fbd0c695b8ed60f33cc81576a7e8b62571f36aabfebc18aa16488317fe7fb247'
INSERT INTO public.admin_credentials (code_hash, label)
VALUES (
    encode(digest('admin_only', 'sha256'), 'hex'),
    'Default Section Administrator'
)
ON CONFLICT (code_hash) DO NOTHING;

-- 4. Server-Side Verification Procedure (verify_admin_access)
-- Pipeline:
-- verify-admin-access -> SHA-256(input) -> Supabase credential record match -> members.role = 'admin'
CREATE OR REPLACE FUNCTION public.verify_admin_access(access_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_input_hash TEXT;
    v_matched_section_id UUID;
    v_target_section_id UUID;
BEGIN
    -- 1. Obtain current authenticated user from Supabase Auth session
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required: User must be signed in to verify admin access';
    END IF;

    -- 2. Validate input code
    IF access_code IS NULL OR trim(access_code) = '' THEN
        RETURN FALSE;
    END IF;

    -- 3. Compute SHA-256 hex digest of input code
    v_input_hash := encode(digest(trim(access_code), 'sha256'), 'hex');

    -- 4. Query admin_credentials table for matching credential record
    SELECT section_id INTO v_matched_section_id
    FROM public.admin_credentials
    WHERE code_hash = v_input_hash
    LIMIT 1;

    -- If a matching credential record exists, elevate user's role in members table
    IF FOUND THEN
        -- Determine section context (or fallback to default first section)
        SELECT id INTO v_target_section_id FROM public.sections LIMIT 1;
        v_target_section_id := COALESCE(v_matched_section_id, v_target_section_id);

        -- Update existing member record for current user
        UPDATE public.members
        SET role = 'admin'::public.member_role,
            status = 'active'::public.member_status
        WHERE user_id = v_user_id;

        -- If no member record exists yet for this user_id, insert one
        IF NOT FOUND THEN
            INSERT INTO public.members (
                section_id,
                user_id,
                name,
                role,
                status
            ) VALUES (
                v_target_section_id,
                v_user_id,
                'Administrator',
                'admin'::public.member_role,
                'active'::public.member_status
            );
        END IF;

        RETURN TRUE;
    END IF;

    -- If no match in credentials, check if user is already an active admin in members
    IF EXISTS (
        SELECT 1 FROM public.members
        WHERE user_id = v_user_id 
          AND role = 'admin'::public.member_role
          AND status = 'active'::public.member_status
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Restrict execution: authenticated users can invoke this verification procedure
REVOKE EXECUTE ON FUNCTION public.verify_admin_access(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_access(TEXT) TO authenticated;
