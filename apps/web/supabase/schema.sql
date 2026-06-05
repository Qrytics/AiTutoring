-- Native booking MVP schema
-- Run this in your Supabase SQL editor before using the in-app scheduler.

create extension if not exists pgcrypto;

create table if not exists available_slots (
	id uuid primary key default gen_random_uuid(),
	start_time timestamptz not null,
	end_time timestamptz not null,
	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	constraint available_slots_time_order check (end_time > start_time)
);

create unique index if not exists available_slots_unique_start_time_idx
	on available_slots (start_time);

create table if not exists bookings (
	id uuid primary key default gen_random_uuid(),
	slot_id uuid not null references available_slots(id) on delete restrict,
	slot_start timestamptz not null,
	slot_end timestamptz not null,
	timezone text not null default 'UTC',
	reservation_token text,
	status text not null default 'reserved',
	reservation_expires_at timestamptz not null,
	customer_email text,
	session_type text,
	stripe_session_id text unique,
	paid_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint bookings_status_check check (status in ('reserved', 'paid', 'cancelled', 'expired')),
	constraint bookings_slot_time_order check (slot_end > slot_start)
);

alter table bookings
	add column if not exists reservation_token text;

create index if not exists bookings_slot_id_idx on bookings (slot_id);
create index if not exists bookings_status_idx on bookings (status);
create index if not exists bookings_reservation_expires_idx on bookings (reservation_expires_at);
create index if not exists bookings_reservation_token_idx on bookings (reservation_token);

create table if not exists stripe_webhook_events (
	id text primary key,
	type text not null,
	payload jsonb not null,
	received_at timestamptz not null default now(),
	processed_at timestamptz,
	processing_error text
);

create index if not exists stripe_webhook_events_processed_idx
	on stripe_webhook_events (processed_at);

create or replace function set_updated_at_timestamp()
returns trigger as $$
begin
	new.updated_at = now();
	return new;
end;
$$ language plpgsql;

drop trigger if exists bookings_set_updated_at on bookings;

create trigger bookings_set_updated_at
before update on bookings
for each row
execute function set_updated_at_timestamp();

-- Optional seed data: add future slots manually in UTC.
-- Example:
-- insert into available_slots (start_time, end_time) values
-- ('2026-06-05T17:00:00Z', '2026-06-05T18:00:00Z'),
-- ('2026-06-06T18:00:00Z', '2026-06-06T19:00:00Z');
