import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';
import { PAGE_WIDTH, PAGE_HEIGHT, MAX_JOB_DESC_ROWS } from './coordinates';

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
    // Gambar tanda centang manual (2 garis pendek), bukan huruf X
    page.drawLine({ start: { x: x + 1.3, y: y + 4 }, end: { x: x + 3.3, y: y + 1.5 }, thickness: 1, color: rgb(0, 0, 0) });
    page.drawLine({ start: { x: x + 3.3, y: y + 1.5 }, end: { x: x + 7, y: y + 6.5 }, thickness: 1, color: rgb(0, 0, 0) });
  }
  page.drawText(label, { x: x + 12, y: y + 0.5, size: 7, font });
}

function hLine(page: PDFPage, x1: number, x2: number, top: number) {
  page.drawLine({ start: { x: x1, y: fromTop(top) }, end: { x: x2, y: fromTop(top) }, thickness: 0.75, color: rgb(0, 0, 0) });
}

function vLine(page: PDFPage, x: number, top1: number, top2: number) {
  page.drawLine({ start: { x, y: fromTop(top1) }, end: { x, y: fromTop(top2) }, thickness: 0.75, color: rgb(0, 0, 0) });
}

function box(page: PDFPage, x1: number, top1: number, x2: number, top2: number) {
  page.drawRectangle({ x: x1, y: fromTop(top2), width: x2 - x1, height: top2 - top1, borderColor: rgb(0, 0, 0), borderWidth: 0.75 });
}

function centeredText(page: PDFPage, font: PDFFont, text: string, x1: number, x2: number, top: number, size: number) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: x1 + (x2 - x1 - w) / 2, y: fromTop(top), size, font });
}

function rightText(page: PDFPage, font: PDFFont, text: string, xRight: number, top: number, size: number) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: xRight - w, y: fromTop(top), size, font });
}

// ===== KOORDINAT PRESISI (hasil ekstraksi langsung dari template F4 asli) =====
const UNIT_TABLE = {
  left: 23.3, right: 586.4,
  top1: 134.1, top2: 147.1, top3: 160.6, bottom: 182.3,
  cols: { model: 23.8, serialNo: 115.3, codeUnit: 193.7, engineModel: 272.2, engineSerialNo: 350.1, smr: 428.5, location: 507.0 },
};

const JOB_DESC_TABLE = { left: 22.3, right: 587.3, top: 199.1, headerBottom: 216.3, bottom: 412.0, cols: [22.3, 50.8, 158.4, 490.2, 587.3] };

const WAKTU_TABLE = { left: 22.9, right: 327.2, top: 455.0, headerBottom: 466.1, bottom: 533.1, colLabel: 152.2, colTanggal: 241.5, rowH: 11.05 };

const CUSTOMER_BOX = { left: 376.3, right: 583.8, top: 455.0, bottom: 534.8 };
const CATATAN_MEKANIK_BOX = { left: 22.3, right: 587.3, top: 557.0, bottom: 649.4 };
const CATATAN_CUSTOMER_BOX = { left: 22.3, right: 587.3, top: 675.6, bottom: 771.2 };
const SIGN_AREA = { left: 22.6, right: 586.9, mid: (22.6 + 586.9) / 2 };
const CUST_HALF_CENTER = (SIGN_AREA.left + SIGN_AREA.mid) / 2;
const MEK_HALF_CENTER = (SIGN_AREA.mid + SIGN_AREA.right) / 2;

function drawAllTables(page: PDFPage) {
  // Tabel Unit/Engine
  box(page, UNIT_TABLE.left, UNIT_TABLE.top1, UNIT_TABLE.right, UNIT_TABLE.bottom);
  // Garis header1/header2 dan header2/data HANYA untuk area UNIT+ENGINE, SMR & LOCATION menyatu (rowspan)
  hLine(page, UNIT_TABLE.left, UNIT_TABLE.cols.smr, UNIT_TABLE.top2);
  hLine(page, UNIT_TABLE.left, UNIT_TABLE.right, UNIT_TABLE.top3);
  vLine(page, UNIT_TABLE.cols.engineModel - 0.5, UNIT_TABLE.top1, UNIT_TABLE.top2); // UNIT|ENGINE (header1)
  vLine(page, UNIT_TABLE.cols.smr, UNIT_TABLE.top1, UNIT_TABLE.bottom);
  vLine(page, UNIT_TABLE.cols.location, UNIT_TABLE.top1, UNIT_TABLE.bottom);
  [UNIT_TABLE.cols.serialNo, UNIT_TABLE.cols.codeUnit, UNIT_TABLE.cols.engineModel, UNIT_TABLE.cols.engineSerialNo].forEach((x) =>
    vLine(page, x, UNIT_TABLE.top2, UNIT_TABLE.bottom)
  );

  // Tabel Job Desc
  box(page, JOB_DESC_TABLE.left, JOB_DESC_TABLE.top, JOB_DESC_TABLE.right, JOB_DESC_TABLE.bottom);
  hLine(page, JOB_DESC_TABLE.left, JOB_DESC_TABLE.right, JOB_DESC_TABLE.headerBottom);
  JOB_DESC_TABLE.cols.slice(1, -1).forEach((x) => vLine(page, x, JOB_DESC_TABLE.top, JOB_DESC_TABLE.bottom));
  const jdRowH = (JOB_DESC_TABLE.bottom - JOB_DESC_TABLE.headerBottom) / MAX_JOB_DESC_ROWS;
  for (let i = 1; i < MAX_JOB_DESC_ROWS; i++) hLine(page, JOB_DESC_TABLE.left, JOB_DESC_TABLE.right, JOB_DESC_TABLE.headerBottom + i * jdRowH);

  // Tabel Waktu Proses
  box(page, WAKTU_TABLE.left, WAKTU_TABLE.top, WAKTU_TABLE.right, WAKTU_TABLE.bottom);
  vLine(page, WAKTU_TABLE.colLabel, WAKTU_TABLE.top, WAKTU_TABLE.bottom);
  vLine(page, WAKTU_TABLE.colTanggal, WAKTU_TABLE.top, WAKTU_TABLE.bottom);
  for (let i = 1; i <= 6; i++) hLine(page, WAKTU_TABLE.left, WAKTU_TABLE.right, WAKTU_TABLE.headerBottom + (i - 1) * WAKTU_TABLE.rowH);

  // Kotak Customer, Catatan, TTD
  box(page, CUSTOMER_BOX.left, CUSTOMER_BOX.top, CUSTOMER_BOX.right, CUSTOMER_BOX.bottom);
  box(page, CATATAN_MEKANIK_BOX.left, CATATAN_MEKANIK_BOX.top, CATATAN_MEKANIK_BOX.right, CATATAN_MEKANIK_BOX.bottom);
  box(page, CATATAN_CUSTOMER_BOX.left, CATATAN_CUSTOMER_BOX.top, CATATAN_CUSTOMER_BOX.right, CATATAN_CUSTOMER_BOX.bottom);

}

export async function generateBappPdf(bapp: BappData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  drawAllTables(page);

  // ===== HEADER =====
  const logoUrl = await getConfigValue('logo_url');
  if (!logoUrl) {
    console.log('PERINGATAN: logo_url kosong di tabel config, logo tidak akan tampil.');
  }
  if (logoUrl) {
    try {
      const logoBytes = await fetchImageBytes(logoUrl);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      page.drawImage(logoImage, { x: 23, y: fromTop(58), width: 32, height: 32 });
    } catch (err) {
      console.error('Gagal ambil logo:', err);
    }
  }

  page.drawText('PT UNITED TRACTORS Tbk.', { x: 64, y: fromTop(48), size: 13, font: fontBold });
  rightText(page, fontBold, bapp.nomor_form, 586.4, 32, 8);
  centeredText(page, fontBold, 'BERITA ACARA PENYERAHAN PEKERJAAN', 0, PAGE_WIDTH, 83, 10);
  centeredText(page, fontBold, '( B A P P )', 0, PAGE_WIDTH, 96, 10);

  // ===== PARAGRAF PEMBUKA (campuran bold & regular dalam satu baris) =====
  const tanggalDate = bapp.tanggal_penyerahan ? new Date(bapp.tanggal_penyerahan) : null;
  const hariStr = tanggalDate ? HARI_NAMES[tanggalDate.getDay()] : '....................................................';
  const tanggalAngka = tanggalDate
    ? String(tanggalDate.getDate()).padStart(2, '0') + '/' + String(tanggalDate.getMonth() + 1).padStart(2, '0') + '/' + tanggalDate.getFullYear()
    : '…………../……………../……………..';

  let x = 23;
  const size1 = 8;
  const writeSeq = (segs: { text: string; bold: boolean }[], top: number) => {
    let curX = 23;
    segs.forEach((seg) => {
      const f = seg.bold ? fontBold : font;
      page.drawText(seg.text, { x: curX, y: fromTop(top), size: size1, font: f });
      curX += f.widthOfTextAtSize(seg.text, size1);
    });
  };

  writeSeq(
    [
      { text: 'Pada hari ' + hariStr + ' tanggal (' + tanggalAngka + ') telah dilakukan penyerahan pekerjaan dari ', bold: false },
      { text: 'PT. UNITED', bold: true },
    ],
    113.5
  );
  writeSeq(
    [
      { text: 'TRACTORS Tbk. kepada ', bold: true },
      { text: bapp.nama_customer ?? '......................................................................................................................', bold: false },
      { text: ' sebagai berikut :', bold: true },
    ],
    128.5
  );

  // ===== HEADER TABEL UNIT/ENGINE (size 8, bold) =====
  // Catatan: baseline = tengah_baris + (size * 0.3) supaya teks benar2 center, TIDAK menembus garis atas
  centeredText(page, fontBold, 'UNIT', UNIT_TABLE.left, UNIT_TABLE.cols.engineModel, 143.5, 8);
  centeredText(page, fontBold, 'ENGINE', UNIT_TABLE.cols.engineModel, UNIT_TABLE.cols.smr, 143.5, 8);
  centeredText(page, fontBold, 'SMR', UNIT_TABLE.cols.smr, UNIT_TABLE.cols.location, 145, 8);
  centeredText(page, fontBold, '(HM/KM)', UNIT_TABLE.cols.smr, UNIT_TABLE.cols.location, 154, 8);
  centeredText(page, fontBold, 'LOCATION', UNIT_TABLE.cols.location, UNIT_TABLE.right, 150, 8);
  centeredText(page, fontBold, 'MODEL', UNIT_TABLE.cols.model, UNIT_TABLE.cols.serialNo, 156, 8);
  centeredText(page, fontBold, 'SERIAL NO.', UNIT_TABLE.cols.serialNo, UNIT_TABLE.cols.codeUnit, 156, 8);
  centeredText(page, fontBold, 'CODE UNIT', UNIT_TABLE.cols.codeUnit, UNIT_TABLE.cols.engineModel, 156, 8);
  centeredText(page, fontBold, 'MODEL', UNIT_TABLE.cols.engineModel, UNIT_TABLE.cols.engineSerialNo, 156, 8);
  centeredText(page, fontBold, 'SERIAL NO.', UNIT_TABLE.cols.engineSerialNo, UNIT_TABLE.cols.smr, 156, 8);

  const unitRowY = fromTop((UNIT_TABLE.top3 + UNIT_TABLE.bottom) / 2 + 3);
  page.drawText(bapp.unit_model ?? '', { x: UNIT_TABLE.cols.model + 4, y: unitRowY, size: 8, font });
  page.drawText(bapp.unit_serial_no ?? '', { x: UNIT_TABLE.cols.serialNo + 4, y: unitRowY, size: 8, font });
  page.drawText(bapp.unit_code ?? '', { x: UNIT_TABLE.cols.codeUnit + 4, y: unitRowY, size: 8, font });
  page.drawText(bapp.engine_model ?? '', { x: UNIT_TABLE.cols.engineModel + 4, y: unitRowY, size: 8, font });
  page.drawText(bapp.engine_serial_no ?? '', { x: UNIT_TABLE.cols.engineSerialNo + 4, y: unitRowY, size: 8, font });
  page.drawText(bapp.smr ?? '', { x: UNIT_TABLE.cols.smr + 4, y: unitRowY, size: 8, font });
  page.drawText(bapp.unit_location ?? '', { x: UNIT_TABLE.cols.location + 4, y: unitRowY, size: 8, font });

  page.drawText('Pekerjaan yang telah dilakukan pada unit tersebut adalah :', { x: 23, y: fromTop(193.5), size: 8, font });

  // ===== HEADER TABEL JOB DESC =====
  centeredText(page, fontBold, 'NO', JOB_DESC_TABLE.cols[0], JOB_DESC_TABLE.cols[1], 210, 8);
  centeredText(page, fontBold, 'COMPONENT', JOB_DESC_TABLE.cols[1], JOB_DESC_TABLE.cols[2], 210, 8);
  centeredText(page, fontBold, 'JOB DESC', JOB_DESC_TABLE.cols[2], JOB_DESC_TABLE.cols[3], 210, 8);
  centeredText(page, fontBold, 'REMARKS', JOB_DESC_TABLE.cols[3], JOB_DESC_TABLE.cols[4], 210, 8);

  const jdRowH2 = (JOB_DESC_TABLE.bottom - JOB_DESC_TABLE.headerBottom) / MAX_JOB_DESC_ROWS;
  const sortedJobDesc = [...bapp.job_desc].sort((a, b) => a.urutan - b.urutan).slice(0, MAX_JOB_DESC_ROWS);
  sortedJobDesc.forEach((row, i) => {
    const rowTop = JOB_DESC_TABLE.headerBottom + i * jdRowH2 + 12.5;
    const y = fromTop(rowTop);
    page.drawText(String(row.urutan), { x: JOB_DESC_TABLE.cols[0] + 8, y, size: 8, font });
    page.drawText(row.component ?? '', { x: JOB_DESC_TABLE.cols[1] + 5, y, size: 8, font });
    page.drawText((row.job_desc ?? '').slice(0, 60), { x: JOB_DESC_TABLE.cols[2] + 5, y, size: 8, font });
    page.drawText(row.remarks ?? '', { x: JOB_DESC_TABLE.cols[3] + 5, y, size: 8, font });
  });

  // ===== KESIMPULAN (campuran bold & regular) =====
  page.drawText(
    'Mekanik PT. UNITED TRACTORS Tbk. bersama petugas lapangan telah melakukan uji coba terhadap unit tersebut di atas dengan kesimpulan unit',
    { x: 23, y: fromTop(425.6), size: 8, font }
  );
  const kondisiText = bapp.kondisi_unit === 'baik' ? 'BAIK' : 'TIDAK BAIK';
  const kesiapanText = bapp.kesiapan_unit === 'siap' ? 'SIAP' : 'TIDAK SIAP';
  writeSeq(
    [
      { text: 'dalam kondisi ', bold: false },
      { text: '( ' + kondisiText + ' ) dan ( ' + kesiapanText + ' )', bold: true },
      { text: ' untuk operasi.', bold: false },
    ],
    436.2
  );
  page.drawText('Demikian Berita Acara Penyerahan Pekerjaan ini kami buat untuk dapat dipergunakan sebagaimana mestinya.', {
    x: 23,
    y: fromTop(446.8),
    size: 8,
    font,
  });

  // ===== TABEL WAKTU PROSES =====
  centeredText(page, fontBold, 'Tanggal', WAKTU_TABLE.colLabel, WAKTU_TABLE.colTanggal, 463, 8);
  centeredText(page, fontBold, 'Jam', WAKTU_TABLE.colTanggal, WAKTU_TABLE.right, 463, 8);

  const waktuLabels = ['Cust Request', 'Mech Sent', 'Start Diagnose', 'Start Waiting', 'Start Job', 'Finish Job'];
  const waktuValues = [bapp.cust_request_at, bapp.mech_sent_at, bapp.start_diagnose_at, bapp.start_waiting_at, bapp.start_job_at, bapp.finish_job_at];
  waktuValues.forEach((value, i) => {
    const rowTop = WAKTU_TABLE.headerBottom + i * WAKTU_TABLE.rowH + 7.5;
    page.drawText(waktuLabels[i], { x: 26, y: fromTop(rowTop), size: 7, font: fontBold });
    const { tanggal, jam } = formatDateTime(value);
    page.drawText(tanggal, { x: WAKTU_TABLE.colLabel + 8, y: fromTop(rowTop), size: 7, font });
    page.drawText(jam, { x: WAKTU_TABLE.colTanggal + 8, y: fromTop(rowTop), size: 7, font });
  });

  // ===== KOTAK DIISI OLEH CUSTOMER =====
  page.drawText('DIISI OLEH CUSTOMER', { x: CUSTOMER_BOX.left + 10, y: fromTop(470), size: 8, font: fontBold });
  page.drawText('Berilah tanda pada kotak dimaksud :', { x: CUSTOMER_BOX.left + 10, y: fromTop(481), size: 7, font: fontBold });
  page.drawText('HASIL PEKERJAAN UT :', { x: CUSTOMER_BOX.left + 10, y: fromTop(490.5), size: 7, font: fontBold });

  drawCheckbox(page, fontBold, 'Memuaskan', CUSTOMER_BOX.left + 10, 500, bapp.hasil_pekerjaan === 'memuaskan');
  drawCheckbox(page, fontBold, 'Tidak Memuaskan', CUSTOMER_BOX.left + 100, 500, bapp.hasil_pekerjaan === 'tidak_memuaskan');
  drawCheckbox(page, fontBold, 'Selesai', CUSTOMER_BOX.left + 10, 523, bapp.status_pekerjaan === 'selesai');
  drawCheckbox(page, fontBold, 'Tidak Selesai', CUSTOMER_BOX.left + 100, 523, bapp.status_pekerjaan === 'tidak_selesai');

  // ===== CATATAN =====
  page.drawText('Catatan diisi Mekanik UT :', { x: 23, y: fromTop(551), size: 8, font: fontBold });
  page.drawText((bapp.catatan_mekanik ?? '').slice(0, 100), { x: 30, y: fromTop(570), size: 8, font });

  page.drawText('Catatan diisi Customer :', { x: 23, y: fromTop(669.6), size: 8, font: fontBold });
  page.drawText((bapp.catatan_customer ?? '').slice(0, 100), { x: 30, y: fromTop(690), size: 8, font });

  // ===== TANDA TANGAN (simetris/mirror kiri-kanan) =====
  const titleLW = 150;
  centeredText(page, font, bapp.nama_customer ?? '', CUST_HALF_CENTER - titleLW / 2, CUST_HALF_CENTER + titleLW / 2, 801.6, 8);
  centeredText(page, fontBold, 'PT. UNITED TRACTORS Tbk.', MEK_HALF_CENTER - titleLW / 2, MEK_HALF_CENTER + titleLW / 2, 801.6, 8);
  hLine(page, CUST_HALF_CENTER - titleLW / 2, CUST_HALF_CENTER + titleLW / 2, 804.5);
  hLine(page, MEK_HALF_CENTER - titleLW / 2, MEK_HALF_CENTER + titleLW / 2, 804.5);

  const sigW = 100;
  const sigH = 55;
  if (bapp.signature_customer_url) {
    try {
      const bytes = await fetchImageBytes(bapp.signature_customer_url);
      const img = await pdfDoc.embedPng(bytes);
      page.drawImage(img, { x: CUST_HALF_CENTER - sigW / 2, y: fromTop(865), width: sigW, height: sigH });
    } catch (err) {
      console.error('Gagal ambil signature customer:', err);
    }
  }
  if (bapp.signature_mekanik_url) {
    try {
      const bytes = await fetchImageBytes(bapp.signature_mekanik_url);
      const img = await pdfDoc.embedPng(bytes);
      page.drawImage(img, { x: MEK_HALF_CENTER - sigW / 2, y: fromTop(865), width: sigW, height: sigH });
    } catch (err) {
      console.error('Gagal ambil signature mekanik:', err);
    }
  }

  centeredText(page, font, bapp.nama_customer_ttd ?? '', SIGN_AREA.left, SIGN_AREA.mid, 872, 8);
  centeredText(page, font, bapp.namaMekanik ?? '', SIGN_AREA.mid, SIGN_AREA.right, 872, 8);

  const ulW = 150;
  hLine(page, CUST_HALF_CENTER - ulW / 2, CUST_HALF_CENTER + ulW / 2, 878);
  hLine(page, MEK_HALF_CENTER - ulW / 2, MEK_HALF_CENTER + ulW / 2, 878);

  centeredText(page, fontBold, 'CUSTOMER', SIGN_AREA.left, SIGN_AREA.mid, 891, 8);
  centeredText(page, fontBold, 'MEKANIK', SIGN_AREA.mid, SIGN_AREA.right, 891, 8);

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