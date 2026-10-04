-- ==============================================================================
-- SECTION LOBBY DATABASE SCHEMA
-- Migration: 003_add_notes_url.sql
-- Description: Add optional url column to notes table for study materials
-- ==============================================================================

ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS url text;
