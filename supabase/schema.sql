-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.lead_updates (
  id bigint NOT NULL DEFAULT nextval('lead_updates_id_seq'::regclass),
  lead_id bigint,
  content text NOT NULL,
  type text DEFAULT 'Note'::text CHECK (type = ANY (ARRAY['Note'::text, 'Status'::text, 'Activity'::text])),
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT lead_updates_pkey PRIMARY KEY (id),
  CONSTRAINT lead_updates_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT lead_updates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.leads (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  name text NOT NULL,
  phone_number text NOT NULL,
  service text NOT NULL,
  description text,
  date timestamp with time zone,
  status text DEFAULT 'New'::text,
  created_by uuid,
  agent_ids ARRAY DEFAULT '{}'::text[],
  is_converted boolean DEFAULT false,
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text,
  role text DEFAULT 'user'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);