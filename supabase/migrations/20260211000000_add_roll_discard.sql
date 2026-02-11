-- Add 'discarded' status to the roll_status enum
alter type roll_status add value if not exists 'discarded';

-- Add discard metadata columns to rolls
alter table rolls add column if not exists discard_reason text;
alter table rolls add column if not exists discard_notes text;
