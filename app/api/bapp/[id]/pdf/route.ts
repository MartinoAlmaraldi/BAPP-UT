import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateBappPdfById } from '@/lib/pdf/generateBappPdf';

export const maxDuration = 30;

// PDF dibuat saat diminta dan tidak disimpan.
// ?download=1 membuat browser langsung mengunduh, tanpa itu PDF dibuka di browser.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  // Pakai client user (bukan service role): RLS hanya mengizinkan pemilik BAPP atau admin
  const { data: bapp } = await supabase.from('bapp').select('id, status').eq('id', id).single();
  if (!bapp) {
    return NextResponse.json({ error: 'BAPP tidak ditemukan' }, { status: 404 });
  }

  if (bapp.status !== 'completed' && bapp.status !== 'reviewed') {
    return NextResponse.json({ error: 'PDF tersedia setelah customer menandatangani.' }, { status: 409 });
  }

  try {
    const { bytes, fileName } = await generateBappPdfById(id);
    const download = request.nextUrl.searchParams.get('download') === '1';

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${fileName}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal membuat PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}