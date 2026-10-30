import { PDFDocument, StandardFonts, rgb, PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';
import { PAGE_WIDTH, PAGE_HEIGHT } from './coordinates';
import { formatDurasiDesimal, hitungDurasiMenit, jamInput } from '@/lib/mar';
import { MAX_MAR_ROWS } from '@/lib/validation/marSchema';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// ===== KOORDINAT (satuan pt, "top" = jarak dari tepi atas halaman) =====
// Diukur dari foto formulir MAR, jadi kalau ada yang meleset cukup ubah angka di sini.
const LEFT = 24.2;
const RIGHT = 582.4;

// Batas kolom: Date, Unit Model SN, WO Number, NO Operation, Job Description,
// Start, Finish, Durasi Hour, HM/KM, Status Job, Remark, Check
const COLS = [24.2, 58.7, 101.0, 145.8, 202.6, 301.8, 339.9, 379.2, 418.5, 461.4, 499.6, 544.3, 582.4];

const SIGN_BOX_TOP = 154.9; // kotak "Diisi Supervisor" dan "Diisi Adm."
const HEADER_TOP = 171.3;
const HEADER_TOP_SIGN = 183.0; // kolom Remark dan Check mulai di bawah kotak "Diisi ..."
const BODY_TOP = 208.7;
const BODY_BOTTOM = 826.0;
const ROW_H = (BODY_BOTTOM - BODY_TOP) / MAX_MAR_ROWS;

const FOOTER_TOP = 835.0;
const FOOTER_BOTTOM = 911.0;

const HEADERS: string[][] = [
  ['Date'],
  ['Unit', 'Model', 'SN'],
  ['WO', 'Number'],
  ['NO', 'Operation'],
  ['Job Description'],
  ['Start'],
  ['Finish'],
  ['Durasi', 'Hour'],
  ['HM/KM'],
  ['Status', 'Job', '(F/NF)'],
  ['Remark'],
  ['Check'],
];

const BLACK = rgb(0, 0, 0);

export interface MarPdfData {
  id: string;
  mekanik_id: string;
  nama: string | null;
  nrp: string | null;
  tanggal: string | null;
  nama_customer: string | null;
  unit_model: string | null;
  unit_serial_no: string | null;
  wo_number: string | null;
  no_operation: string | null;
  smr: string | null;
  signature_mekanik_url: string | null;
  nama_customer_ttd: string | null;
  signature_customer_url: string | null;
  rows: {
    urutan: number;
    job_description: string | null;
    start_time: string | null;
    finish_time: string | null;
    status_job: string | null;
  }[];
}

function fromTop(top: number): number {
  return PAGE_HEIGHT - top;
}

function line(page: PDFPage, x1: number, top1: number, x2: number, top2: number, thickness = 0.6) {
  page.drawLine({
    start: { x: x1, y: fromTop(top1) },
    end: { x: x2, y: fromTop(top2) },
    thickness,
    color: BLACK,
  });
}

function rect(page: PDFPage, x1: number, top1: number, x2: number, top2: number, thickness = 0.9) {
  page.drawRectangle({
    x: x1,
    y: fromTop(top2),
    width: x2 - x1,
    height: top2 - top1,
    borderColor: BLACK,
    borderWidth: thickness,
  });
}

// Teks rata tengah horizontal. "baselineTop" = posisi garis dasar huruf.
function centered(page: PDFPage, font: PDFFont, text: string, x1: number, x2: number, baselineTop: number, size: number) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: x1 + (x2 - x1 - w) / 2, y: fromTop(baselineTop), size, font });
}

// ===== HELPER TEKS =====
function truncate(font: PDFFont, text: string, maxWidth: number, size: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && font.widthOfTextAtSize(t + '...', size) > maxWidth) t = t.slice(0, -1);
  return t + '...';
}

function wrapText(font: PDFFont, text: string, maxWidth: number, size: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let current = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = current ? current + ' ' + word : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) {
        lines.push(current);
        current = '';
      }
      // Satu kata lebih lebar dari kolom: potong per huruf
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > maxWidth && rest.length > 1) {
        let cut = rest.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) cut -= 1;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      current = rest;
    }
    if (current) lines.push(current);
  }
  return lines;
}

const CELL_MAX_SIZE = 7;
const CELL_MIN_SINGLE_SIZE = 5.5;
const CELL_WRAP_SIZE = 5.5;

// Isi sel: kecilkan font dulu, kalau masih tidak muat bungkus jadi maksimal 2 baris, sisanya dipotong "..."
function fitCell(font: PDFFont, text: string, maxWidth: number): { lines: string[]; size: number } {
  let size = CELL_MAX_SIZE;
  while (size > CELL_MIN_SINGLE_SIZE && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.25;
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return { lines: [text], size };

  const lines = wrapText(font, text, maxWidth, CELL_WRAP_SIZE);
  if (lines.length <= 2) return { lines, size: CELL_WRAP_SIZE };

  const second = truncate(font, lines.slice(1).join(' '), maxWidth, CELL_WRAP_SIZE);
  return { lines: [lines[0], second], size: CELL_WRAP_SIZE };
}

function drawCell(page: PDFPage, font: PDFFont, text: string, colIndex: number, rowTop: number, align: 'left' | 'center') {
  if (!text) return;
  const x1 = COLS[colIndex];
  const x2 = COLS[colIndex + 1];
  const pad = 2;
  const { lines, size } = fitCell(font, text, x2 - x1 - pad * 2);
  const leading = size * 1.15;
  const centerTop = rowTop + ROW_H / 2;

  lines.forEach((lineText, i) => {
    const lineCenter = centerTop + (i - (lines.length - 1) / 2) * leading;
    const w = font.widthOfTextAtSize(lineText, size);
    const x = align === 'center' ? x1 + (x2 - x1 - w) / 2 : x1 + pad;
    page.drawText(lineText, { x, y: fromTop(lineCenter + size * 0.35), size, font });
  });
}

function formatTanggal(value: string | null): string {
  if (!value) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? m[3] + '/' + m[2] + '/' + m[1] : value;
}

// ===== GAMBAR BAGIAN-BAGIAN FORMULIR =====
function drawGrid(page: PDFPage) {
  // Kotak "Diisi Supervisor" dan "Diisi Adm." di atas kolom Remark dan Check
  rect(page, COLS[10], SIGN_BOX_TOP, COLS[11] - 3, HEADER_TOP_SIGN);
  rect(page, COLS[11] + 3, SIGN_BOX_TOP, COLS[12], HEADER_TOP_SIGN);

  // Baris judul kolom
  rect(page, LEFT, HEADER_TOP, COLS[10], BODY_TOP);
  rect(page, COLS[10], HEADER_TOP_SIGN, RIGHT, BODY_TOP);

  // Badan tabel
  rect(page, LEFT, BODY_TOP, RIGHT, BODY_BOTTOM);

  // Garis antar kolom
  for (let i = 1; i < COLS.length - 1; i++) {
    const top = i >= 10 ? HEADER_TOP_SIGN : HEADER_TOP;
    line(page, COLS[i], top, COLS[i], BODY_BOTTOM);
  }

  // Garis antar baris
  for (let r = 1; r < MAX_MAR_ROWS; r++) {
    const top = BODY_TOP + r * ROW_H;
    line(page, LEFT, top, RIGHT, top, 0.5);
  }
}

function drawColumnHeaders(page: PDFPage, fontBold: PDFFont) {
  const size = 7;
  const leading = 8.2;

  HEADERS.forEach((lines, i) => {
    const top = i >= 10 ? HEADER_TOP_SIGN : HEADER_TOP;
    const centerTop = (top + BODY_TOP) / 2;
    lines.forEach((text, j) => {
      const lineCenter = centerTop + (j - (lines.length - 1) / 2) * leading;
      centered(page, fontBold, text, COLS[i], COLS[i + 1], lineCenter + size * 0.35, size);
    });
  });

  const boxes = [
    { x1: COLS[10], x2: COLS[11] - 3, lines: ['Diisi', 'Supervisor'] },
    { x1: COLS[11] + 3, x2: COLS[12], lines: ['Diisi', 'Adm.'] },
  ];
  const boxSize = 6.5;
  const boxLeading = 7.5;
  const boxCenter = (SIGN_BOX_TOP + HEADER_TOP_SIGN) / 2;

  boxes.forEach((b) => {
    b.lines.forEach((text, j) => {
      const lineCenter = boxCenter + (j - (b.lines.length - 1) / 2) * boxLeading;
      centered(page, fontBold, text, b.x1, b.x2, lineCenter + boxSize * 0.35, boxSize);
    });
  });
}

function drawTop(page: PDFPage, font: PDFFont, fontBold: PDFFont, logo: PDFImage | null, nama: string, nrp: string) {
  if (logo) {
    page.drawImage(logo, { x: 23, y: fromTop(58), width: 32, height: 32 });
  }
  page.drawText('PT UNITED TRACTORS Tbk', { x: 60, y: fromTop(39), size: 9, font: fontBold });
  page.drawText('Banjarmasin', { x: 60, y: fromTop(52), size: 7.5, font });

  centered(page, fontBold, 'MECHANIC ACTIVITY REPORT', 0, PAGE_WIDTH, 71, 10);
  centered(page, fontBold, '(MAR)', 0, PAGE_WIDTH, 82, 10);

  page.drawText('Name', { x: 246.8, y: fromTop(123), size: 8, font: fontBold });
  page.drawText(':', { x: 289, y: fromTop(123), size: 8, font: fontBold });
  page.drawText(truncate(font, nama, 100, 8), { x: 297, y: fromTop(123), size: 8, font });

  page.drawText('NRP', { x: 246.8, y: fromTop(144), size: 8, font: fontBold });
  page.drawText(':', { x: 289, y: fromTop(144), size: 8, font: fontBold });
  page.drawText(truncate(font, nrp, 100, 8), { x: 297, y: fromTop(144), size: 8, font });
  line(page, 243, 150.2, 400, 150.2, 0.9);
}

interface FooterBox {
  x1: number;
  x2: number;
  title: string;
  nama: string;
  jabatan: string;
  signature: PDFImage | null;
}

function drawFooter(page: PDFPage, font: PDFFont, fontBold: PDFFont, boxes: FooterBox[]) {
  boxes.forEach((b) => {
    rect(page, b.x1, FOOTER_TOP, b.x2, FOOTER_BOTTOM);
    centered(page, fontBold, b.title, b.x1, b.x2, FOOTER_TOP + 17, 8);

    // Gambar tanda tangan di antara judul dan baris Nama
    if (b.signature) {
      const dims = b.signature.scaleToFit(100, 26);
      const cx = (b.x1 + b.x2) / 2;
      page.drawImage(b.signature, { x: cx - dims.width / 2, y: fromTop(879), width: dims.width, height: dims.height });
    }

    const rows = [
      { label: 'Nama', value: b.nama, baseline: 885.5 },
      { label: 'Jabatan', value: b.jabatan, baseline: 899 },
    ];

    rows.forEach((r) => {
      page.drawText(r.label, { x: b.x1 + 10, y: fromTop(r.baseline), size: 7.5, font: fontBold });
      page.drawText(':', { x: b.x1 + 46, y: fromTop(r.baseline), size: 7.5, font: fontBold });
      page.drawLine({
        start: { x: b.x1 + 50, y: fromTop(r.baseline + 1.5) },
        end: { x: b.x2 - 10, y: fromTop(r.baseline + 1.5) },
        thickness: 0.6,
        color: BLACK,
        dashArray: [0.8, 1.6],
      });
      if (r.value) {
        page.drawText(truncate(font, r.value, b.x2 - 10 - (b.x1 + 53), 8), {
          x: b.x1 + 53,
          y: fromTop(r.baseline),
          size: 8,
          font,
        });
      }
    });
  });
}

async function loadLogo(pdfDoc: PDFDocument): Promise<PDFImage | null> {
  try {
    const { data } = await supabaseAdmin.from('config').select('value').eq('key', 'logo_url').single();
    if (!data?.value) return null;
    const res = await fetch(data.value);
    if (!res.ok) return null;
    return await pdfDoc.embedPng(await res.arrayBuffer());
  } catch (err) {
    console.error('Gagal ambil logo:', err);
    return null;
  }
}

// Tanda tangan ada di bucket "signatures". Nilai di database berupa path (atau URL publik lama).
// Diambil lewat service role, dan hanya dari folder milik mekanik pemilik MAR ini.
async function loadSignature(
  pdfDoc: PDFDocument,
  value: string | null,
  mekanikId: string,
  marId: string
): Promise<PDFImage | null> {
  if (!value) return null;
  try {
    const marker = '/signatures/';
    const index = value.indexOf(marker);
    const path = (value.startsWith('http') && index !== -1 ? value.slice(index + marker.length) : value).split('?')[0];

    if (!path.startsWith(mekanikId + '/mar-' + marId + '-')) {
      throw new Error('Path tanda tangan tidak valid');
    }

    const { data, error } = await supabaseAdmin.storage.from('signatures').download(path);
    if (error || !data) throw new Error('Gagal ambil tanda tangan');
    return await pdfDoc.embedPng(await data.arrayBuffer());
  } catch (err) {
    console.error('Gagal ambil tanda tangan MAR:', err);
    return null;
  }
}

export async function generateMarPdf(data: MarPdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Mechanic Activity Report (MAR)');
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const logo = await loadLogo(pdfDoc);
  const sigMekanik = await loadSignature(pdfDoc, data.signature_mekanik_url, data.mekanik_id, data.id);
  const sigCustomer = await loadSignature(pdfDoc, data.signature_customer_url, data.mekanik_id, data.id);

  // Huruf di luar set font standar (misal emoji) diganti "?" supaya PDF tidak gagal dibuat
  const supported = new Set(font.getCharacterSet());
  const clean = (text: string | null | undefined): string =>
    Array.from((text ?? '').replace(/\s+/g, ' ').trim())
      .map((ch) => (supported.has(ch.codePointAt(0) ?? 0) ? ch : '?'))
      .join('');

  drawGrid(page);
  drawColumnHeaders(page, fontBold);
  drawTop(page, font, fontBold, logo, clean(data.nama), clean(data.nrp));

  const unitText = clean([data.unit_model, data.unit_serial_no].filter((v) => v && v.trim()).join(' / '));
  const tanggalText = clean(formatTanggal(data.tanggal));
  const sortedRows = [...data.rows].sort((a, b) => a.urutan - b.urutan).slice(0, MAX_MAR_ROWS);

  sortedRows.forEach((row, i) => {
    const rowTop = BODY_TOP + i * ROW_H;
    const menit = hitungDurasiMenit(row.start_time, row.finish_time);

    drawCell(page, font, tanggalText, 0, rowTop, 'center');
    drawCell(page, font, unitText, 1, rowTop, 'left');
    drawCell(page, font, clean(data.wo_number), 2, rowTop, 'left');
    drawCell(page, font, clean(data.no_operation), 3, rowTop, 'left');
    drawCell(page, font, clean(row.job_description), 4, rowTop, 'left');
    drawCell(page, font, clean(jamInput(row.start_time)), 5, rowTop, 'center');
    drawCell(page, font, clean(jamInput(row.finish_time)), 6, rowTop, 'center');
    drawCell(page, font, clean(formatDurasiDesimal(menit)), 7, rowTop, 'center');
    drawCell(page, font, clean(data.smr), 8, rowTop, 'center');
    drawCell(page, font, clean(row.status_job), 9, rowTop, 'center');
    // Kolom Remark (supervisor) dan Check (admin) dikosongkan, diisi manual
  });

  drawFooter(page, font, fontBold, [
    {
      x1: 39.3,
      x2: 266.0,
      title: 'Mengetahui',
      nama: clean(data.nama_customer_ttd ?? data.nama_customer),
      jabatan: 'Customer',
      signature: sigCustomer,
    },
    {
      x1: 337.5,
      x2: 563.7,
      title: 'Dibuat Oleh',
      nama: clean(data.nama),
      jabatan: 'Mekanik',
      signature: sigMekanik,
    },
  ]);

  return pdfDoc.save();
}

function buildFileName(data: MarPdfData): string {
  const nama = (data.nama ?? '')
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const tanggal = data.tanggal ?? new Date().toISOString().slice(0, 10);
  return ['MAR', nama, tanggal].filter(Boolean).join('-') + '.pdf';
}

export async function generateMarPdfById(marId: string): Promise<{ bytes: Uint8Array; fileName: string }> {
  const { data: mar, error } = await supabaseAdmin
    .from('mar')
    .select('*, rows:mar_rows(*)')
    .eq('id', marId)
    .single();

  if (error || !mar) throw new Error('MAR tidak ditemukan');

  const data = mar as MarPdfData;
  const bytes = await generateMarPdf(data);
  return { bytes, fileName: buildFileName(data) };
}