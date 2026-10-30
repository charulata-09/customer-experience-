-- ==============================================================================
-- CX COPILOT: UNIFIED INITIAL SCHEMA, RLS POLICIES & SEED DATA MIGRATION
-- ==============================================================================

create extension if not exists "pgcrypto";

-- 1. ENUMS
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

-- 2. TABLES

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

-- BRAND SETTINGS (single-row-per-admin-org)
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

-- AI ANALYSES
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

-- TICKET MESSAGES
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

-- CHAT SESSIONS & MESSAGES
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

-- CUSTOMER RECOMMENDATIONS
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

-- 3. TRIGGERS & FUNCTIONS
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

-- 4. RLS HELPER FUNCTIONS
create or replace function public.current_role_of_user() returns user_role
language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid(); $$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce(public.current_role_of_user() in ('agent','admin'), false); $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce(public.current_role_of_user() = 'admin', false); $$;

create or replace function public.check_role_change() returns trigger as $$
begin
  if new.role <> old.role and not public.is_admin() then
    raise exception 'Unauthorized: Only administrators can modify user roles';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation before update on public.profiles
  for each row execute function public.check_role_change();

-- 5. ENABLE RLS
alter table public.profiles enable row level security;
alter table public.brand_settings enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_analyses enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.ai_reply_drafts enable row level security;
alter table public.kb_articles enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.csat_feedback enable row level security;
alter table public.customer_recommendations enable row level security;
alter table public.insight_reports enable row level security;
alter table public.ai_usage_logs enable row level security;
alter table public.audit_logs enable row level security;

-- 6. RLS POLICIES (Drop existing to be idempotent)
drop policy if exists "profiles_select_policy" on public.profiles;
create policy "profiles_select_policy" on public.profiles for select using (auth.uid() = id or public.is_staff());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles for all using (public.is_admin());

drop policy if exists "brand_settings_select_all" on public.brand_settings;
create policy "brand_settings_select_all" on public.brand_settings for select using (true);

drop policy if exists "brand_settings_admin_modify" on public.brand_settings;
create policy "brand_settings_admin_modify" on public.brand_settings for all using (public.is_admin());

drop policy if exists "tickets_customer_select" on public.tickets;
create policy "tickets_customer_select" on public.tickets for select using (customer_id = auth.uid() or public.is_staff());

drop policy if exists "tickets_customer_insert" on public.tickets;
create policy "tickets_customer_insert" on public.tickets for insert with check (customer_id = auth.uid() or public.is_staff());

drop policy if exists "tickets_staff_update" on public.tickets;
create policy "tickets_staff_update" on public.tickets for update using (public.is_staff());

drop policy if exists "tickets_admin_delete" on public.tickets;
create policy "tickets_admin_delete" on public.tickets for delete using (public.is_admin());

drop policy if exists "ticket_analyses_select" on public.ticket_analyses;
create policy "ticket_analyses_select" on public.ticket_analyses for select using (
  exists (select 1 from public.tickets where tickets.id = ticket_analyses.ticket_id and (tickets.customer_id = auth.uid() or public.is_staff()))
);

drop policy if exists "ticket_analyses_staff_write" on public.ticket_analyses;
create policy "ticket_analyses_staff_write" on public.ticket_analyses for all using (public.is_staff());

drop policy if exists "ticket_messages_select" on public.ticket_messages;
create policy "ticket_messages_select" on public.ticket_messages for select using (
  exists (select 1 from public.tickets where tickets.id = ticket_messages.ticket_id and (tickets.customer_id = auth.uid() or public.is_staff()))
);

drop policy if exists "ticket_messages_insert" on public.ticket_messages;
create policy "ticket_messages_insert" on public.ticket_messages for insert with check (
  (sender_type = 'customer' and sender_id = auth.uid() and exists (select 1 from public.tickets where tickets.id = ticket_messages.ticket_id and tickets.customer_id = auth.uid()))
  or public.is_staff()
);

drop policy if exists "drafts_staff_all" on public.ai_reply_drafts;
create policy "drafts_staff_all" on public.ai_reply_drafts for all using (public.is_staff());

drop policy if exists "kb_read_published" on public.kb_articles;
create policy "kb_read_published" on public.kb_articles for select using (is_published = true or public.is_staff());

drop policy if exists "kb_admin_write" on public.kb_articles;
create policy "kb_admin_write" on public.kb_articles for all using (public.is_admin());

drop policy if exists "chat_sessions_customer_select" on public.chat_sessions;
create policy "chat_sessions_customer_select" on public.chat_sessions for select using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "chat_sessions_customer_insert" on public.chat_sessions;
create policy "chat_sessions_customer_insert" on public.chat_sessions for insert with check (customer_id = auth.uid() or public.is_admin());

drop policy if exists "chat_messages_customer_select" on public.chat_messages;
create policy "chat_messages_customer_select" on public.chat_messages for select using (
  exists (select 1 from public.chat_sessions where chat_sessions.id = chat_messages.session_id and (chat_sessions.customer_id = auth.uid() or public.is_admin()))
);

drop policy if exists "chat_messages_customer_insert" on public.chat_messages;
create policy "chat_messages_customer_insert" on public.chat_messages for insert with check (
  exists (select 1 from public.chat_sessions where chat_sessions.id = chat_messages.session_id and (chat_sessions.customer_id = auth.uid() or public.is_admin()))
);

drop policy if exists "csat_select" on public.csat_feedback;
create policy "csat_select" on public.csat_feedback for select using (customer_id = auth.uid() or public.is_staff());

drop policy if exists "csat_insert_own_resolved" on public.csat_feedback;
create policy "csat_insert_own_resolved" on public.csat_feedback for insert with check (
  customer_id = auth.uid() and exists (select 1 from public.tickets where tickets.id = csat_feedback.ticket_id and tickets.customer_id = auth.uid() and tickets.status in ('resolved', 'closed'))
);

drop policy if exists "recommendations_staff_select" on public.customer_recommendations;
create policy "recommendations_staff_select" on public.customer_recommendations for select using (public.is_staff());

drop policy if exists "recommendations_admin_write" on public.customer_recommendations;
create policy "recommendations_admin_write" on public.customer_recommendations for all using (public.is_admin());

drop policy if exists "insight_reports_staff_select" on public.insight_reports;
create policy "insight_reports_staff_select" on public.insight_reports for select using (public.is_staff());

drop policy if exists "insight_reports_admin_write" on public.insight_reports;
create policy "insight_reports_admin_write" on public.insight_reports for all using (public.is_admin());

drop policy if exists "ai_usage_logs_admin_select" on public.ai_usage_logs;
create policy "ai_usage_logs_admin_select" on public.ai_usage_logs for select using (public.is_admin());

drop policy if exists "audit_logs_admin_select" on public.audit_logs;
create policy "audit_logs_admin_select" on public.audit_logs for select using (public.is_admin());

-- 7. INITIAL KNOWLEDGE BASE SEED DATA
insert into public.kb_articles (id, title, domain, category, content, is_published)
values
  ('a0000000-0000-0000-0000-000000000001', 'Standard Refund and Return Policy', 'ecommerce', 'refund_return', 'Customers are eligible for a full refund on unworn, unopened, or defective items within 30 days of confirmed delivery. Return shipping is free when using our pre-paid return label generated from the orders portal. Refunds are credited back to the original payment method within 3 to 5 business days after our warehouse inspects the returned package. Perishable goods and personalized custom items are non-refundable unless damaged upon receipt.', true),
  ('a0000000-0000-0000-0000-000000000002', 'Tracking and Expedited Shipping Delays', 'ecommerce', 'delivery_logistics', 'Standard shipping takes 3-5 business days. Express shipping delivers in 1-2 business days. If a shipment tracking status has not updated in more than 48 hours, or if an order has exceeded the guaranteed delivery window, customers qualify for an immediate shipping fee refund. In case of marked-delivered packages not found by the recipient, we wait 24 hours for carrier drop-off reconciliation before initiating a free replacement or store credit.', true),
  ('a0000000-0000-0000-0000-000000000003', 'Disputed Charges & Fraudulent Card Activity', 'banking_fintech', 'billing_payment', 'If an unauthorized or duplicate transaction appears on your account, temporarily freeze the associated card instantly via the Security tab in your dashboard. You have up to 60 days from the statement date to dispute unauthorized charges. Our fraud mitigation unit reviews disputes within 24 to 48 business hours and issues a provisional credit during the merchant investigation period.', true),
  ('a0000000-0000-0000-0000-000000000004', 'Two-Factor Authentication (2FA) and Account Recovery', 'banking_fintech', 'account_access', 'For security, passcodes sent via SMS or Authenticator Apps expire after 5 minutes. If you lose access to your primary authentication device, submit your government-issued ID and recent selfie verification through our secure identity portal. Account recovery verification is completed within 2 hours during normal business hours (8 AM - 8 PM EST). Support agents will never ask for your password or full 2FA code.', true),
  ('a0000000-0000-0000-0000-000000000005', 'SaaS Subscription Renewal, Upgrades, and Seat Licenses', 'saas', 'billing_payment', 'All annual subscriptions renew automatically on the billing anniversary unless cancelled at least 14 days prior. Workspace admins can add or remove user seats at any time; billing is prorated to the exact remaining days in the billing cycle. If an account downgrades to a lower tier, active team data remains accessible in read-only mode for 90 days before archiving.', true),
  ('a0000000-0000-0000-0000-000000000006', 'API Rate Limiting, 429 Status Codes, and Webhook Retries', 'saas', 'technical_issue', 'The standard API rate limit is 1,000 requests per minute per API key. When a 429 Too Many Requests response is returned, client applications should respect the Retry-After header and implement exponential backoff. Webhook delivery endpoints that return 5xx errors or time out after 10 seconds are retried up to 5 times over a 24-hour window.', true),
  ('a0000000-0000-0000-0000-000000000007', 'Roaming Data Passes and International Coverage', 'telecom', 'service_quality', 'International roaming data passes can be activated through the mobile app prior to or upon arrival in over 140 supported countries. Daily passes provide 2GB of high-speed data followed by unlimited 2G speeds. If high-speed connectivity fails abroad, toggle Airplane mode or select the partner carrier manually in network settings. Support can provision an emergency network reset remotely.', true),
  ('a0000000-0000-0000-0000-000000000008', 'Flight and Hotel Booking Cancellation / Rescheduling Policy', 'travel_hospitality', 'refund_return', 'Flight bookings can be changed or cancelled with full credit within 24 hours of initial reservation. Beyond 24 hours, airline fare rules apply. Hotel reservations booked under Flexible terms can be cancelled up to 48 hours prior to check-in for a 100% refund. In the event of airline flight cancellations, passengers are entitled to immediate alternate flight booking or an unrestricted cash refund.', true),
  ('a0000000-0000-0000-0000-000000000009', 'Late Food Delivery, Missing Items, and Spillage Compensation', 'food_delivery', 'delivery_logistics', 'If your food order arrives 25 minutes or more past the estimated delivery window, a $10 on-time guarantee credit is automatically applied to your account. For missing or damaged items, upload a photo through the order help screen to receive an immediate refund or redelivery voucher within 15 minutes without needing to wait in customer service queues.', true),
  ('a0000000-0000-0000-0000-000000000010', 'Telehealth Appointment Rescheduling & Prescription Refills', 'healthcare_services', 'general_inquiry', 'Appointments with specialists or primary care physicians can be rescheduled free of charge up to 4 hours prior to the scheduled consultation. Prescription refills can be requested electronically through the patient dashboard and are sent to your designated pharmacy within 24 hours after physician approval. In case of medical emergencies, dial emergency services immediately.', true)
on conflict (id) do update set
  title = excluded.title,
  domain = excluded.domain,
  category = excluded.category,
  content = excluded.content,
  is_published = excluded.is_published;
