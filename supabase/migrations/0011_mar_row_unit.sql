alter table public.mar_rows
    add column if not exists unit_model text,
    add column if not exists unit_serial_no text;