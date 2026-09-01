-- Schema for FormCheck

-- Enable pgcrypto for UUIDs if not already enabled
create extension if not exists "pgcrypto";

-- USERS TABLE
create table public.users (
  id uuid references auth.users not null primary key,
  full_name text,
  age integer,
  weight numeric,
  fitness_goal text check (fitness_goal in ('weight_loss', 'muscle_gain', 'maintenance')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;
-- Policies for users
create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can insert their own profile" on public.users
  for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

-- WORKOUT PLANS TABLE
create table public.workout_plans (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  cover_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.workout_plans enable row level security;
-- Policies for workout plans (public read-only)
create policy "Anyone can view workout plans" on public.workout_plans
  for select using (true);

-- EXERCISES TABLE
create table public.exercises (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.workout_plans on delete cascade not null,
  name text not null,
  target_reps integer not null,
  target_sets integer not null,
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.exercises enable row level security;
-- Policies for exercises (public read-only)
create policy "Anyone can view exercises" on public.exercises
  for select using (true);

-- WORKOUT LOGS TABLE
create table public.workout_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  plan_id uuid references public.workout_plans on delete cascade not null,
  total_reps_completed integer not null default 0,
  form_score numeric not null default 0,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.workout_logs enable row level security;
-- Policies for workout logs
create policy "Users can view their own workout logs" on public.workout_logs
  for select using (auth.uid() = user_id);
create policy "Users can insert their own workout logs" on public.workout_logs
  for insert with check (auth.uid() = user_id);


-- INSERT INITIAL SEED DATA
insert into public.workout_plans (id, title, description, difficulty, cover_image_url) values
  ('11111111-1111-1111-1111-111111111111', 'Warmup Routine', 'Dynamic stretching and light squats to get you ready.', 'beginner', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=800'),
  ('22222222-2222-2222-2222-222222222222', 'Core & 6-Pack', 'Intense core session.', 'intermediate', 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&q=80&w=800'),
  ('33333333-3333-3333-3333-333333333333', 'Fat Burn / Cardio', 'Fast-paced bodyweight movements.', 'advanced', 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?auto=format&fit=crop&q=80&w=800');

insert into public.exercises (plan_id, name, target_reps, target_sets, order_index) values
  ('11111111-1111-1111-1111-111111111111', 'Squat', 15, 3, 1),
  ('11111111-1111-1111-1111-111111111111', 'Jumping Jacks', 30, 2, 2),
  ('22222222-2222-2222-2222-222222222222', 'High Knees', 20, 3, 1),
  ('33333333-3333-3333-3333-333333333333', 'Squat', 25, 4, 1);
