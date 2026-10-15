// Penghitung ringkasan kerja per mekanik. Dipakai di papan Mekanik dan halaman detail.

/** BAPP draft atau menunggu TTD yang tidak berubah lebih dari ini dianggap menggantung. */
export const STUCK_DAYS = 3;

export interface BappStatRow {
  mekanik_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  signed_customer_at: string | null;
}

export interface MekanikStats {
  draft: number;
  menunggu: number;
  selesaiBulanIni: number;
  total: number;
  menggantung: number;
  lastActivity: string | null;
  /** rata-rata jam dari BAPP dibuat sampai customer tanda tangan (hanya BAPP selesai) */
  avgDoneHours: number | null;
}

export function emptyStats(): MekanikStats {
  return { draft: 0, menunggu: 0, selesaiBulanIni: 0, total: 0, menggantung: 0, lastActivity: null, avgDoneHours: null };
}

export function buildStatsMap(rows: BappStatRow[], now: Date = new Date()): Map<string, MekanikStats> {
  const map = new Map<string, MekanikStats>();
  const done = new Map<string, { sum: number; count: number }>();
  const stuckMs = STUCK_DAYS * 24 * 60 * 60 * 1000;

  for (const row of rows) {
    const stats = map.get(row.mekanik_id) ?? emptyStats();
    stats.total += 1;

    const isDone = row.status === 'completed' || row.status === 'reviewed';
    const created = new Date(row.created_at);

    if (row.status === 'draft') stats.draft += 1;
    if (row.status === 'signed_mekanik') stats.menunggu += 1;

    if (isDone && created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()) {
      stats.selesaiBulanIni += 1;
    }

    const pending = row.status === 'draft' || row.status === 'signed_mekanik';
    if (pending && now.getTime() - new Date(row.updated_at).getTime() > stuckMs) stats.menggantung += 1;

    if (!stats.lastActivity || row.updated_at > stats.lastActivity) stats.lastActivity = row.updated_at;

    if (isDone && row.signed_customer_at) {
      const hours = (new Date(row.signed_customer_at).getTime() - created.getTime()) / 3_600_000;
      if (hours >= 0) {
        const acc = done.get(row.mekanik_id) ?? { sum: 0, count: 0 };
        acc.sum += hours;
        acc.count += 1;
        done.set(row.mekanik_id, acc);
      }
    }

    map.set(row.mekanik_id, stats);
  }

  for (const [id, acc] of done) {
    const stats = map.get(id);
    if (stats && acc.count > 0) stats.avgDoneHours = acc.sum / acc.count;
  }

  return map;
}

export function formatRelative(iso: string | null, now: Date = new Date()): string {
  if (!iso) return '-';
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
  if (days < 1) return 'Hari ini';
  if (days === 1) return 'Kemarin';
  if (days < 30) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDuration(hours: number | null): string {
  if (hours === null) return '-';
  if (hours < 1) return 'Kurang dari 1 jam';
  if (hours < 48) return `${Math.round(hours)} jam`;
  return `${(hours / 24).toFixed(1).replace('.', ',')} hari`;
}