create extension if not exists "pgcrypto";

-- ENUM-LIKE TYPES
do $$ begin
  create type user_role as enum ('customer','agent','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_status as enum ('open','in_progress','awaiting_customer','resolved','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type urgency_level as enum ('low','medium','high','critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sentiment_label as enum ('very_negative','negative','neutral','positive','very_positive');
exception when duplicate_object then null; end $$;

-- PROFILES (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  email text not null,
  role user_role not null default 'customer',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- BRAND SETTINGS (single-row-per-admin-org; keep simple: one global row)
create table if not exists public.brand_settings (
  id int primary key default 1 check (id = 1),
  brand_name text not null default 'Acme',
  brand_voice_guidelines text not null default 'Warm, clear, respectful, solution-focused.',
  forbidden_phrases text[] not null default '{}',
  signature text not null default 'The Acme Support Team',
  default_tone text not null default 'empathetic'
    check (default_tone in ('empathetic','professional','friendly','concise')),
  updated_at timestamptz not null default now()
);
insert into public.brand_settings (id) values (1) on conflict do nothing;

-- TICKETS
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  assigned_agent_id uuid references public.profiles(id) on delete set null,
  domain text not null check (domain in ('ecommerce','banking_fintech','telecom','saas','travel_hospitality','healthcare_services','food_delivery','education')),
  channel text not null check (channel in ('web','chat','email','social','phone')),
  subject text not null check (char_length(subject) between 5 and 120),
  message text not null check (char_length(message) between 20 and 3000),
  reference_id text,
  preferred_contact text check (preferred_contact in ('email','phone','in_app')),
  status ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists idx_tickets_customer on public.tickets(customer_id);
create index if not exists idx_tickets_status on public.tickets(status);
create index if not exists idx_tickets_created on public.tickets(created_at desc);

-- AI ANALYSES (1:1 per ticket, re-analysis overwrites via upsert)
create table if not exists public.ticket_analyses (
  ticket_id uuid primary key references public.tickets(id) on delete cascade,
  sentiment sentiment_label not null,
  sentiment_score numeric(4,3) not null check (sentiment_score between -1 and 1),
  intent text not null,
  category text not null,
  urgency urgency_level not null,
  churn_risk int not null check (churn_risk between 0 and 100),
  emotions text[] not null default '{}',
  key_entities jsonb not null default '[]'::jsonb,
  summary text not null,
  escalate boolean not null default false,
  escalation_reason text,
  model text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_analyses_urgency on public.ticket_analyses(urgency);
create index if not exists idx_analyses_category on public.ticket_analyses(category);

-- MESSAGES (thread on a ticket)
create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  sender_type text not null check (sender_type in ('customer','agent','ai','system')),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_ticket on public.ticket_messages(ticket_id, created_at);

-- AI REPLY DRAFTS
create table if not exists public.ai_reply_drafts (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  tone text not null,
  draft_text text not null,
  suggested_actions jsonb not null default '[]'::jsonb,
  kb_article_ids uuid[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','approved','discarded')),
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_drafts_ticket on public.ai_reply_drafts(ticket_id);

-- KNOWLEDGE BASE
create table if not exists public.kb_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 150),
  domain text not null,
  category text not null,
  content text not null check (char_length(content) between 20 and 8000),
  is_published boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_kb_domain_cat on public.kb_articles(domain, category);
create index if not exists idx_kb_search on public.kb_articles using gin (to_tsvector('english', title || ' ' || content));

-- CHAT
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  domain text not null default 'ecommerce',
  escalated_ticket_id uuid references public.tickets(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_msgs_session on public.chat_messages(session_id, created_at);

-- CSAT
create table if not exists public.csat_feedback (
  ticket_id uuid primary key references public.tickets(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);

-- CUSTOMER RECOMMENDATIONS (AI next-best-action cache)
create table if not exists public.customer_recommendations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  recommendations jsonb not null,
  health_score int not null check (health_score between 0 and 100),
  created_at timestamptz not null default now()
);

-- INSIGHT REPORTS
create table if not exists public.insight_reports (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  report jsonb not null,
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);

-- AI USAGE + AUDIT LOGS
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  feature text not null,
  model text not null,
  latency_ms int,
  input_chars int,
  output_chars int,
  success boolean not null,
  error_message text,
  created_at timestamptz not null default now()
);
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- TRIGGERS
create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_tickets_updated on public.tickets;
create trigger trg_tickets_updated before update on public.tickets
  for each row execute function public.set_updated_at();

drop trigger if exists trg_kb_updated on public.kb_articles;
create trigger trg_kb_updated before update on public.kb_articles
  for each row execute function public.set_updated_at();

-- AUTO-CREATE PROFILE ON SIGNUP (role always 'customer'; roles elevated only by admin)
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name','New User'), new.email, 'customer')
  on conflict (id) do update set email = excluded.email;
  return new;
end; $$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
