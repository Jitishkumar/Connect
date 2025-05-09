-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create users_waiting table for matching users
create table if not exists public.users_waiting (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    status text default 'waiting' check (status in ('waiting', 'matched')),
    gender text not null,
    preferred_gender text,
    timestamp timestamptz default now(),
    created_at timestamptz default now()
);

-- Create calls table for WebRTC signaling
create table if not exists public.calls (
    id uuid default gen_random_uuid() primary key,
    from_user uuid references auth.users(id) on delete cascade not null,
    to_user uuid references auth.users(id) on delete cascade not null,
    signal_data jsonb not null,
    status text default 'pending' check (status in ('pending', 'connected', 'ended')),
    created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.users_waiting enable row level security;
alter table public.calls enable row level security;

-- RLS Policies for users_waiting table
create policy "Users can insert their own waiting record" on public.users_waiting
for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own waiting record" on public.users_waiting
for update to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own waiting record" on public.users_waiting
for delete to authenticated
using (auth.uid() = user_id);

create policy "Users can read waiting records for matching" on public.users_waiting
for select to authenticated
using (true);

-- RLS Policies for calls table
create policy "Users can insert signaling data" on public.calls
for insert to authenticated
with check (auth.uid() = from_user);

create policy "Users can read signaling data intended for them" on public.calls
for select to authenticated
using (auth.uid() = to_user);

create policy "Users can delete their own signaling data" on public.calls
for delete to authenticated
using (auth.uid() = from_user);

-- Cleanup function for stale waiting users
create or replace function public.cleanup_stale_users()
returns void as $$
begin
    delete from public.users_waiting
    where status = 'waiting'
    and timestamp < now() - interval '10 minutes';
end;
$$ language plpgsql;

-- Cleanup function for stale calls
create or replace function public.cleanup_stale_calls()
returns void as $$
begin
    delete from public.calls
    where created_at < now() - interval '10 minutes';
end;
$$ language plpgsql;

-- Create indexes for better performance
create index if not exists idx_users_waiting_status on public.users_waiting(status);
create index if not exists idx_users_waiting_timestamp on public.users_waiting(timestamp);
create index if not exists idx_calls_created_at on public.calls(created_at);