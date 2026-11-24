-- ==============================================================================
-- Schema: BrainTumor 3D Cases
-- Description: Stores metadata, cloud storage URLs, and precomputed clinical telemetry
-- ==============================================================================

-- 1. Create cases table
create table if not exists public.cases (
    case_id text primary key,
    case_number integer not null,
    title text not null,
    description text,
    image_url text not null,
    label_url text not null,
    volume_cm3 double precision,
    centroid_x double precision,
    centroid_y double precision,
    centroid_z double precision,
    anatomical_region text,
    hemisphere text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS) and allow public read access
alter table public.cases enable row level security;

create policy "Allow public read access on cases"
    on public.cases for select
    using (true);

create policy "Allow service role full access on cases"
    on public.cases for all
    using (auth.role() = 'service_role');

-- 3. Storage buckets (mri-images, tumor-labels)
-- Note: Buckets can be created via Supabase Dashboard -> Storage or via script
insert into storage.buckets (id, name, public)
values 
    ('mri-images', 'mri-images', true),
    ('tumor-labels', 'tumor-labels', true)
on conflict (id) do update set public = true;

-- Allow public read access to storage
create policy "Allow public read access to mri-images"
    on storage.objects for select
    using (bucket_id = 'mri-images');

create policy "Allow public read access to tumor-labels"
    on storage.objects for select
    using (bucket_id = 'tumor-labels');

create policy "Allow service role write to storage"
    on storage.objects for all
    using (auth.role() = 'service_role');
