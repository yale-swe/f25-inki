-- ============================================================================
-- Documents Table Schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.documents (
  -- Primary Key
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  owner_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Public Identifier
  public_id         TEXT DEFAULT gen_short_id_12() UNIQUE,
  
  -- Document Metadata
  title             TEXT,
  description       TEXT,
  mime_type         TEXT,
  
  -- Storage Information
  storage_bucket    TEXT,
  storage_path      TEXT,
  file_path         TEXT,  -- legacy field
  
  -- File Size
  bytes             BIGINT,
  file_size         BIGINT,  -- legacy field
  
  -- Document Properties
  page_count        INT,
  status            TEXT NOT NULL DEFAULT 'processing',
  
  -- Content
  raw_text          TEXT,
  raw_text_bytes    BIGINT GENERATED ALWAYS AS (octet_length(raw_text)) STORED,
  summary           TEXT,  -- extracted/generated summary text
  
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_documents_owner_id 
  ON public.documents(owner_id);

CREATE INDEX IF NOT EXISTS idx_documents_public_id 
  ON public.documents(public_id);

CREATE INDEX IF NOT EXISTS idx_documents_status 
  ON public.documents(status);

CREATE INDEX IF NOT EXISTS idx_documents_created_at 
  ON public.documents(created_at DESC);

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;