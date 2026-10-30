-- Perkuat keamanan storage

-- 1. Tanda tangan: bucket jadi private, hanya PNG, maksimal 1 MB.
update storage.buckets
set public = false,
    file_size_limit = 1048576,
    allowed_mime_types = array['image/png']
where id = 'signatures';

-- 2. Foto profil: tetap publik (dipakai langsung di <img>), tapi hanya JPEG, maksimal 5 MB.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg']
where id = 'avatars';