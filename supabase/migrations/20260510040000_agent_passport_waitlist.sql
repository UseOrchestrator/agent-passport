create table if not exists public.agent_passport_waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  company text not null,
  provider text not null,
  building text not null,
  pain text not null,
  call_opt_in boolean not null default false,
  source text not null default 'agent-passport',
  created_at timestamptz not null default now()
);

alter table public.agent_passport_waitlist enable row level security;

drop policy if exists "Anyone can join Agent Passport waitlist"
  on public.agent_passport_waitlist;

create policy "Anyone can join Agent Passport waitlist"
  on public.agent_passport_waitlist
  for insert
  with check (true);

drop policy if exists "Service role can read Agent Passport waitlist"
  on public.agent_passport_waitlist;

create policy "Service role can read Agent Passport waitlist"
  on public.agent_passport_waitlist
  for select
  using (auth.role() = 'service_role');

