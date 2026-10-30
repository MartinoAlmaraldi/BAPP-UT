function toMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

// Selisih Start sampai Finish dalam menit. Kalau Finish lebih kecil dari Start, dianggap lewat tengah malam.
export function hitungDurasiMenit(start: string | null | undefined, finish: string | null | undefined): number | null {
  const s = toMinutes(start ?? '');
  const f = toMinutes(finish ?? '');
  if (s === null || f === null) return null;
  let selisih = f - s;
  if (selisih < 0) selisih += 24 * 60;
  return selisih;
}

// Kolom Durasi Hour di PDF: jam desimal, misalnya 2,5
export function formatDurasiDesimal(menit: number | null): string {
  if (menit === null) return '';
  return String(Math.round((menit / 60) * 100) / 100).replace('.', ',');
}

// Langkah 2: "2 Jam", "30 Menit", "2 Jam 30 Menit"
export function formatDurasiPanjang(menit: number | null): string {
  if (menit === null) return '-';
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  if (jam === 0) return sisa + ' Menit';
  if (sisa === 0) return jam + ' Jam';
  return jam + ' Jam ' + sisa + ' Menit';
}

// Preview: "2 j 30 m"
export function formatDurasiRingkas(menit: number | null): string {
  if (menit === null) return '-';
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  if (jam === 0) return sisa + ' m';
  if (sisa === 0) return jam + ' j';
  return jam + ' j ' + sisa + ' m';
}

// "08:00:00" atau "08:00" menjadi "08:00" untuk <input type="time">
export function jamInput(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : '';
}

// "08:00" menjadi "08.00" untuk tampilan preview
export function jamTampil(value: string | null | undefined): string {
  return value ? value.slice(0, 5).replace(':', '.') : '-';
}