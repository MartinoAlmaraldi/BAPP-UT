import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateAndUploadBappPdf } from '@/lib/pdf/generateBappPdf';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  // Pakai client user (bukan service role): RLS hanya mengizinkan pemilik BAPP atau admin
  const { data: bapp } = await supabase.from('bapp').select('id').eq('id', id).single();
  if (!bapp) {
    return NextResponse.json({ error: 'BAPP tidak ditemukan' }, { status: 404 });
  }

  try {
    const pdfUrl = await generateAndUploadBappPdf(id);
    return NextResponse.json({ pdfUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal generate PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}