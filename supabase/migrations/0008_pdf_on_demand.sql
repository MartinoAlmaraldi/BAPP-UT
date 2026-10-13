-- PDF sekarang dibuat saat diminta dan tidak disimpan lagi.
-- Hapus link lama (signed URL) yang tersimpan di tabel bapp.
update public.bapp set pdf_url = null where pdf_url is not null;

-- Catatan: file di bucket "pdf-hasil" dihapus lewat dashboard Supabase (Storage), bukan lewat SQL.