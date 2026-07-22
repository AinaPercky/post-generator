-- MIGRATION: Add composite index to speed up magazine post queries
-- This index improves queries filtering by type and ordering by created_at DESC.

CREATE INDEX IF NOT EXISTS saved_posts_type_created_at_desc_idx
ON public.saved_posts (type, created_at DESC);
