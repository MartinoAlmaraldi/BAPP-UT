import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';
import { PAGE_WIDTH, PAGE_HEIGHT, MAX_JOB_DESC_ROWS, BAPP_COORDINATES } from './coordinates';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const HARI_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];

function fromTop(top: number): number {
  return PAGE_HEIGHT - top;
}

interface JobDescRow {
  urutan: number;
  component: string | null;
  job_desc: string | null;
  remarks: string | null;
}

interface BappData {
  id: string;
  mekanik_id: string;
  nomor_form: string;
  tanggal_penyerahan: string | null;
  nama_customer: string | null;
  unit_model: string | null;
  unit_serial_no: string | null;
  unit_code: string | null;
  unit_location: string | null;
  engine_model: string | null;
  engine_serial_no: string | null;
  smr: string | null;
  kondisi_unit: string | null;
  kesiapan_unit: string | null;
  hasil_pekerjaan: string | null;
  status_pekerjaan: string | null;
  catatan_mekanik: string | null;
  catatan_customer: string | null;
  nama_customer_ttd: string | null;
  signature_mekanik_url: string | null;
  signature_customer_url: string | null;
  cust_request_at: string | null;
  mech_sent_at: string | null;
  start_diagnose_at: string | null;
  start_waiting_at: string | null;
  start_job_at: string | null;
  finish_job_at: string | null;
  job_desc: JobDescRow[];
  namaMekanik?: string | null;
}

async function getConfigValue(key: string): Promise<string> {
  const { data } = await supabaseAdmin.from('config').select('value').eq('key', key).single();
  return data?.value ?? '';
}

async function fetchImageBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal fetch image: ' + res.status);
  return res.arrayBuffer();
}

function formatDateTime(value: string | null): { tanggal: string; jam: string } {
  if (!value) return { tanggal: '', jam: '' };
  const d = new Date(value);
  return {
    tanggal: d.toLocaleDateString('id-ID'),
    jam: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };
}

function drawCheckbox(page: PDFPage, font: PDFFont, label: string, x: number, top: number, checked: boolean) {
  const y = fromTop(top);
  page.drawRectangle({ x, y, width: 8, height: 8, borderColor: rgb(0, 0, 0), borderWidth: 0.8 });
  if (checked) {
    page.drawText('X', { x: x + 1, y: y + 0.5, size: 7, font });
  }
  page.drawText(label, { x: x + 12, y: y + 0.5, size: 8, font });
}

function hLine(page: PDFPage, x1: number, x2: number, top: number) {
  page.drawLine({ start: { x: x1, y: fromTop(top) }, end: { x: x2, y: fromTop(top) }, thickness: 0.75, color: rgb(0, 0, 0) });
}

function vLine(page: PDFPage, x: number, top1: number, top2: number) {
  page.drawLine({ start: { x, y: fromTop(top1) }, end: { x, y: fromTop(top2) }, thickness: 0.75, color: rgb(0, 0, 0) });
}

function box(page: PDFPage, x: number, top: number, width: number, height: number) {
  page.drawRectangle({ x, y: fromTop(top + height), width, height, borderColor: rgb(0, 0, 0), borderWidth: 0.75 });
}

// Menulis teks rata tengah dalam rentang kolom [x1, x2] pada baseline 'top'
function centeredText(page: PDFPage, font: PDFFont, text: string, x1: number, x2: number, top: number, size: number) {
  const textWidth = font.widthOfTextAtSize(text, size);
  const x = x1 + (x2 - x1 - textWidth) / 2;
  page.drawText(text, { x, y: fromTop(top), size, font });
}

// Boundary baris tabel waktu proses persis hasil ekstraksi dari template asli
const WAKTU_ROW_BOUNDS = [455.2, 466.4, 477.4, 488.5, 499.6, 510.7, 521.7, 533.3];

function drawAllTables(page: PDFPage) {
  const LEFT = 23;
  const RIGHT = 585.8;

  const unitTop = 133.8;
  const unitMidRow = 147.4;
  const unitDataRow = 160.8;
  const unitBottom = 182.5;

  box(page, LEFT, unitTop, RIGHT - LEFT, unitBottom - unitTop);
  hLine(page, LEFT, RIGHT, unitMidRow);
  hLine(page, LEFT, RIGHT, unitDataRow);

  vLine(page, 296, unitTop, unitMidRow);
  vLine(page, 449, unitTop, unitBottom);
  vLine(page, 512, unitTop, unitBottom);
  [130, 209, 366].forEach((x) => vLine(page, x, unitMidRow, unitBottom));

  const jdTop = 198.7;
  const jdHeaderBottom = 216.6;
  const jdBottom = 412.4;

  box(page, LEFT, jdTop, RIGHT - LEFT, jdBottom - jdTop);
  hLine(page, LEFT, RIGHT, jdHeaderBottom);

  [65, 228, 508].forEach((x) => vLine(page, x, jdTop, jdBottom));

  const rowHeight = (jdBottom - jdHeaderBottom) / MAX_JOB_DESC_ROWS;
  for (let i = 1; i < MAX_JOB_DESC_ROWS; i++) {
    hLine(page, LEFT, RIGHT, jdHeaderBottom + i * rowHeight);
  }

  const wpRight = 327;
  box(page, LEFT, WAKTU_ROW_BOUNDS[0], wpRight - LEFT, WAKTU_ROW_BOUNDS[7] - WAKTU_ROW_BOUNDS[0]);
  vLine(page, 165, WAKTU_ROW_BOUNDS[0], WAKTU_ROW_BOUNDS[7]);
  vLine(page, 260, WAKTU_ROW_BOUNDS[0], WAKTU_ROW_BOUNDS[7]);
  WAKTU_ROW_BOUNDS.slice(1, -1).forEach((top) => hLine(page, LEFT, wpRight, top));

  box(page, 389.6, 457.9, 585.8 - 389.6, 533 - 457.9);
  box(page, LEFT, 546.6, RIGHT - LEFT, 660 - 546.6);
  box(page, LEFT, 665.1, RIGHT - LEFT, 800 - 665.1);

  hLine(page, 90, 240, 878);
  hLine(page, 400, 550, 878);
}

export async function generateBappPdf(bapp: BappData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const c = BAPP_COORDINATES;

  drawAllTables(page);

  const logoUrl = await getConfigValue('logo_url');
  if (logoUrl) {
    try {
      const logoBytes = await fetchImageBytes(logoUrl);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      page.drawImage(logoImage, { x: c.header.logoX, y: fromTop(c.header.logoTop), width: c.header.logoSize, height: c.header.logoSize });
    } catch (err) {
      console.error('Gagal ambil logo:', err);
    }
  }

  page.drawText('PT UNITED TRACTORS Tbk.', { x: 64, y: fromTop(50), size: 13, font: fontBold });
  page.drawText(bapp.nomor_form, { x: c.header.nomorFormX, y: fromTop(c.header.nomorFormTop), size: 8, font });
  page.drawText('BERITA ACARA PENYERAHAN PEKERJAAN', { x: 180, y: fromTop(85.5), size: 11, font: fontBold });
  page.drawText('( B A P P )', { x: 275, y: fromTop(100), size: 11, font: fontBold });

  const tanggalDate = bapp.tanggal_penyerahan ? new Date(bapp.tanggal_penyerahan) : null;
  const hariStr = tanggalDate ? HARI_NAMES[tanggalDate.getDay()] : '......................';
  const tanggalAngka = tanggalDate
    ? String(tanggalDate.getDate()).padStart(2, '0') + '/' + String(tanggalDate.getMonth() + 1).padStart(2, '0') + '/' + tanggalDate.getFullYear()
    : '............/............/............';

  page.drawText('Pada hari ' + hariStr + ' tanggal (' + tanggalAngka + ') telah dilakukan penyerahan pekerjaan dari PT. UNITED', {
    x: 23,
    y: fromTop(121.6),
    size: 8,
    font,
  });
  page.drawText('TRACTORS Tbk. kepada ' + (bapp.nama_customer ?? '') + ' sebagai berikut :', {
    x: 23,
    y: fromTop(131),
    size: 8,
    font,
  });

  // Header tabel unit/engine, semua di-tengah-kan sesuai kolomnya
  centeredText(page, fontBold, 'UNIT', 23, 296, 142, 7);
  centeredText(page, fontBold, 'ENGINE', 296, 449, 142, 7);
  centeredText(page, fontBold, 'SMR', 449, 512, 140, 6);
  centeredText(page, fontBold, '(HM/KM)', 449, 512, 147, 6);
  centeredText(page, fontBold, 'LOCATION', 512, 585.8, 143, 6);
  centeredText(page, fontBold, 'MODEL', 23, 130, 156, 6);
  centeredText(page, fontBold, 'SERIAL NO.', 130, 209, 156, 6);
  centeredText(page, fontBold, 'CODE UNIT', 209, 296, 156, 6);
  centeredText(page, fontBold, 'MODEL', 296, 366, 156, 6);
  centeredText(page, fontBold, 'SERIAL NO.', 366, 449, 156, 6);

  const unitRowY = fromTop(c.unitTable.rowTop);
  page.drawText(bapp.unit_model ?? '', { x: c.unitTable.columns.model, y: unitRowY, size: 8, font });
  page.drawText(bapp.unit_serial_no ?? '', { x: c.unitTable.columns.serialNo, y: unitRowY, size: 8, font });
  page.drawText(bapp.unit_code ?? '', { x: c.unitTable.columns.codeUnit, y: unitRowY, size: 8, font });
  page.drawText(bapp.engine_model ?? '', { x: c.unitTable.columns.engineModel, y: unitRowY, size: 8, font });
  page.drawText(bapp.engine_serial_no ?? '', { x: c.unitTable.columns.engineSerialNo, y: unitRowY, size: 8, font });
  page.drawText(bapp.smr ?? '', { x: c.unitTable.columns.smr, y: unitRowY, size: 8, font });
  page.drawText(bapp.unit_location ?? '', { x: c.unitTable.columns.location, y: unitRowY, size: 8, font });

  page.drawText('Pekerjaan yang telah dilakukan pada unit tersebut adalah :', { x: 23, y: fromTop(192), size: 8, font });

  centeredText(page, fontBold, 'NO', 23, 65, 209, 7);
  centeredText(page, fontBold, 'COMPONENT', 65, 228, 209, 7);
  centeredText(page, fontBold, 'JOB DESC', 228, 508, 209, 7);
  centeredText(page, fontBold, 'REMARKS', 508, 585.8, 209, 7);

  const rowHeight = (c.jobDesc.bottom - c.jobDesc.top) / MAX_JOB_DESC_ROWS;
  const sortedJobDesc = [...bapp.job_desc].sort((a, b) => a.urutan - b.urutan).slice(0, MAX_JOB_DESC_ROWS);

  sortedJobDesc.forEach((row, i) => {
    const rowTop = c.jobDesc.top + i * rowHeight + 4;
    const y = fromTop(rowTop);
    page.drawText(String(row.urutan), { x: c.jobDesc.columns.no, y, size: 8, font });
    page.drawText(row.component ?? '', { x: c.jobDesc.columns.component, y, size: 8, font });
    page.drawText((row.job_desc ?? '').slice(0, 60), { x: c.jobDesc.columns.jobDesc, y, size: 8, font });
    page.drawText(row.remarks ?? '', { x: c.jobDesc.columns.remarks, y, size: 8, font });
  });

  page.drawText(
    'Mekanik PT. UNITED TRACTORS Tbk. bersama petugas lapangan telah melakukan uji coba terhadap unit tersebut di atas dengan kesimpulan unit',
    { x: 23, y: fromTop(427.3), size: 8, font }
  );
  const kondisiText = bapp.kondisi_unit === 'baik' ? 'BAIK' : 'TIDAK BAIK';
  const kesiapanText = bapp.kesiapan_unit === 'siap' ? 'SIAP' : 'TIDAK SIAP';
  page.drawText('dalam kondisi ( ' + kondisiText + ' ) dan ( ' + kesiapanText + ' ) untuk operasi.', { x: 23, y: fromTop(438), size: 8, font: fontBold });
  page.drawText('Demikian Berita Acara Penyerahan Pekerjaan ini kami buat untuk dapat dipergunakan sebagaimana mestinya.', {
    x: 23,
    y: fromTop(448.4),
    size: 8,
    font,
  });

  centeredText(page, fontBold, 'Tanggal', 23, 260, 463, 7);
  centeredText(page, fontBold, 'Jam', 260, 327, 463, 7);

  const waktuLabels = ['Cust Request', 'Mech Sent', 'Start Diagnose', 'Start Waiting', 'Start Job', 'Finish Job'];
  const waktuValues = [bapp.cust_request_at, bapp.mech_sent_at, bapp.start_diagnose_at, bapp.start_waiting_at, bapp.start_job_at, bapp.finish_job_at];

  waktuValues.forEach((value, i) => {
    const rowTopBound = WAKTU_ROW_BOUNDS[i + 1];
    const rowBottomBound = WAKTU_ROW_BOUNDS[i + 2];
    const textTop = (rowTopBound + rowBottomBound) / 2 + 2.5;
    page.drawText(waktuLabels[i], { x: 26, y: fromTop(textTop), size: 7, font });
    const { tanggal, jam } = formatDateTime(value);
    page.drawText(tanggal, { x: c.waktuProses.columns.tanggal, y: fromTop(textTop), size: 7, font });
    page.drawText(jam, { x: c.waktuProses.columns.jam, y: fromTop(textTop), size: 7, font });
  });

  page.drawText('DIISI OLEH CUSTOMER', { x: 400, y: fromTop(468), size: 7, font: fontBold });
  page.drawText('Berilah tanda pada kotak dimaksud :', { x: 400, y: fromTop(478), size: 6, font });
  page.drawText('HASIL PEKERJAAN UT :', { x: 400, y: fromTop(487), size: 6, font: fontBold });

  drawCheckbox(page, font, 'Memuaskan', c.customerCheckbox.memuaskanX, c.customerCheckbox.memuaskanTop, bapp.hasil_pekerjaan === 'memuaskan');
  drawCheckbox(page, font, 'Tidak Memuaskan', c.customerCheckbox.tidakMemuaskanX, c.customerCheckbox.tidakMemuaskanTop, bapp.hasil_pekerjaan === 'tidak_memuaskan');
  drawCheckbox(page, font, 'Selesai', c.customerCheckbox.selesaiX, c.customerCheckbox.selesaiTop, bapp.status_pekerjaan === 'selesai');
  drawCheckbox(page, font, 'Tidak Selesai', c.customerCheckbox.tidakSelesaiX, c.customerCheckbox.tidakSelesaiTop, bapp.status_pekerjaan === 'tidak_selesai');

  page.drawText('Catatan diisi Mekanik UT :', { x: 23, y: fromTop(543), size: 8, font: fontBold });
  page.drawText((bapp.catatan_mekanik ?? '').slice(0, 100), { x: c.catatan.mekanikX, y: fromTop(c.catatan.mekanikTop), size: 8, font });

  page.drawText('Catatan diisi Customer :', { x: 23, y: fromTop(662), size: 8, font: fontBold });
  page.drawText((bapp.catatan_customer ?? '').slice(0, 100), { x: c.catatan.customerX, y: fromTop(c.catatan.customerTop), size: 8, font });

  page.drawText('PT. UNITED TRACTORS Tbk.', { x: 400, y: fromTop(809), size: 8, font: fontBold });

  if (bapp.signature_mekanik_url) {
    try {
      const bytes = await fetchImageBytes(bapp.signature_mekanik_url);
      const img = await pdfDoc.embedPng(bytes);
      page.drawImage(img, { x: c.signature.mekanikX, y: fromTop(870), width: c.signature.width, height: c.signature.height });
    } catch (err) {
      console.error('Gagal ambil signature mekanik:', err);
    }
  }

  if (bapp.signature_customer_url) {
    try {
      const bytes = await fetchImageBytes(bapp.signature_customer_url);
      const img = await pdfDoc.embedPng(bytes);
      page.drawImage(img, { x: c.signature.customerX, y: fromTop(870), width: c.signature.width, height: c.signature.height });
    } catch (err) {
      console.error('Gagal ambil signature customer:', err);
    }
  }

  // Nama tertulis di ATAS garis TTD (bukan di posisi label CUSTOMER/MEKANIK)
  centeredText(page, font, bapp.nama_customer_ttd ?? '', 90, 240, 875, 8);
  centeredText(page, font, bapp.namaMekanik ?? '', 400, 550, 875, 8);

  // Garis TTD di top=878 (sudah digambar di drawAllTables). Label CUSTOMER/MEKANIK di bawah garis.
  centeredText(page, fontBold, 'CUSTOMER', 90, 240, 894, 8);
  centeredText(page, fontBold, 'MEKANIK', 400, 550, 894, 8);

  return pdfDoc.save();
}

export async function generateAndUploadBappPdf(bappId: string): Promise<string> {
  const { data: bapp, error } = await supabaseAdmin
    .from('bapp')
    .select('*, job_desc:bapp_job_desc(*)')
    .eq('id', bappId)
    .single();

  if (error || !bapp) throw new Error('BAPP tidak ditemukan');

  const { data: mekanik } = await supabaseAdmin.from('users').select('name').eq('id', bapp.mekanik_id).single();

  const pdfBytes = await generateBappPdf({ ...bapp, namaMekanik: mekanik?.name ?? null } as BappData);
  const filePath = bapp.mekanik_id + '/bapp-' + bapp.id + '.pdf';

  const { error: uploadError } = await supabaseAdmin.storage.from('pdf-hasil').upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });

  if (uploadError) throw uploadError;

  const { data: urlData, error: urlError } = await supabaseAdmin.storage.from('pdf-hasil').createSignedUrl(filePath, 60 * 60 * 24 * 7);

  if (urlError || !urlData) throw urlError ?? new Error('Gagal membuat signed URL');

  await supabaseAdmin.from('bapp').update({ pdf_url: urlData.signedUrl }).eq('id', bapp.id);

  return urlData.signedUrl;
}