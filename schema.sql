-- Run in Supabase SQL editor. Events hold NO personal data: type, anonymous metadata, short random device id.
create table events(id bigint generated always as identity primary key,type text not null,meta jsonb default '{}',device text,created_at timestamptz default now());
create table bot_users(wa_hash text primary key,consent boolean default false,lang text default 'en',joined_at timestamptz default now());
alter table events enable row level security;
alter table bot_users enable row level security; -- no policies: reachable only with the server-side service key
create policy "add anonymous events" on events for insert to anon with check (true);
create policy "read anonymous events" on events for select to anon using (true);
alter publication supabase_realtime add table events;
