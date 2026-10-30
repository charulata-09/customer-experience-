-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- HELPER FUNCTIONS (SECURITY DEFINER to avoid recursive policy checks)
create or replace function public.current_role_of_user() returns user_role
language sql stable security definer set search_path = public as
$$ 
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as
$$ 
  select coalesce(public.current_role_of_user() in ('agent','admin'), false);
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ 
  select coalesce(public.current_role_of_user() = 'admin', false);
$$;

-- PREVENT PRIVILEGE ESCALATION ON PROFILES
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

-- ENABLE RLS ON ALL TABLES
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

-- 1. PROFILES POLICIES
create policy "profiles_select_policy" on public.profiles
  for select using (
    auth.uid() = id or public.is_staff()
  );

create policy "profiles_update_own" on public.profiles
  for update using (
    auth.uid() = id or public.is_admin()
  ) with check (
    auth.uid() = id or public.is_admin()
  );

create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin());

-- 2. BRAND SETTINGS POLICIES
create policy "brand_settings_select_all" on public.brand_settings
  for select using (true);

create policy "brand_settings_admin_modify" on public.brand_settings
  for all using (public.is_admin());

-- 3. TICKETS POLICIES
create policy "tickets_customer_select" on public.tickets
  for select using (
    customer_id = auth.uid() or public.is_staff()
  );

create policy "tickets_customer_insert" on public.tickets
  for insert with check (
    customer_id = auth.uid() or public.is_staff()
  );

create policy "tickets_staff_update" on public.tickets
  for update using (
    public.is_staff()
  );

create policy "tickets_admin_delete" on public.tickets
  for delete using (
    public.is_admin()
  );

-- 4. TICKET ANALYSES POLICIES
create policy "ticket_analyses_select" on public.ticket_analyses
  for select using (
    exists (
      select 1 from public.tickets
      where tickets.id = ticket_analyses.ticket_id
      and (tickets.customer_id = auth.uid() or public.is_staff())
    )
  );

create policy "ticket_analyses_staff_write" on public.ticket_analyses
  for all using (public.is_staff());

-- 5. TICKET MESSAGES POLICIES
create policy "ticket_messages_select" on public.ticket_messages
  for select using (
    exists (
      select 1 from public.tickets
      where tickets.id = ticket_messages.ticket_id
      and (tickets.customer_id = auth.uid() or public.is_staff())
    )
  );

create policy "ticket_messages_insert" on public.ticket_messages
  for insert with check (
    (
      sender_type = 'customer' and sender_id = auth.uid() and
      exists (
        select 1 from public.tickets
        where tickets.id = ticket_messages.ticket_id
        and tickets.customer_id = auth.uid()
      )
    )
    or public.is_staff()
  );

-- 6. AI REPLY DRAFTS POLICIES (Invisible to customers)
create policy "drafts_staff_all" on public.ai_reply_drafts
  for all using (public.is_staff());

-- 7. KNOWLEDGE BASE POLICIES
create policy "kb_read_published" on public.kb_articles
  for select using (
    is_published = true or public.is_staff()
  );

create policy "kb_admin_write" on public.kb_articles
  for all using (public.is_admin());

-- 8. CHAT SESSIONS & MESSAGES POLICIES
create policy "chat_sessions_customer_select" on public.chat_sessions
  for select using (customer_id = auth.uid() or public.is_admin());

create policy "chat_sessions_customer_insert" on public.chat_sessions
  for insert with check (customer_id = auth.uid() or public.is_admin());

create policy "chat_messages_customer_select" on public.chat_messages
  for select using (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = chat_messages.session_id
      and (chat_sessions.customer_id = auth.uid() or public.is_admin())
    )
  );

create policy "chat_messages_customer_insert" on public.chat_messages
  for insert with check (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = chat_messages.session_id
      and (chat_sessions.customer_id = auth.uid() or public.is_admin())
    )
  );

-- 9. CSAT FEEDBACK POLICIES
create policy "csat_select" on public.csat_feedback
  for select using (customer_id = auth.uid() or public.is_staff());

create policy "csat_insert_own_resolved" on public.csat_feedback
  for insert with check (
    customer_id = auth.uid() and
    exists (
      select 1 from public.tickets
      where tickets.id = csat_feedback.ticket_id
      and tickets.customer_id = auth.uid()
      and tickets.status in ('resolved', 'closed')
    )
  );

-- 10. CUSTOMER RECOMMENDATIONS POLICIES
create policy "recommendations_staff_select" on public.customer_recommendations
  for select using (public.is_staff());

create policy "recommendations_admin_write" on public.customer_recommendations
  for all using (public.is_admin());

-- 11. INSIGHT REPORTS POLICIES
create policy "insight_reports_staff_select" on public.insight_reports
  for select using (public.is_staff());

create policy "insight_reports_admin_write" on public.insight_reports
  for all using (public.is_admin());

-- 12. LOGS POLICIES (Admin select only)
create policy "ai_usage_logs_admin_select" on public.ai_usage_logs
  for select using (public.is_admin());

create policy "audit_logs_admin_select" on public.audit_logs
  for select using (public.is_admin());
