import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateMarPdfById } from '@/lib/pdf/generateMarPdf';

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

  // Pakai client user (bukan service role): RLS hanya mengizinkan pemilik MAR
  const { data: mar } = await supabase.from('mar').select('id, status').eq('id', id).single();
  if (!mar) {
    return NextResponse.json({ error: 'MAR tidak ditemukan' }, { status: 404 });
  }

  if (mar.status !== 'completed') {
    return NextResponse.json({ error: 'PDF tersedia setelah customer menandatangani.' }, { status: 409 });
  }

  try {
    const { bytes, fileName } = await generateMarPdfById(id);
    const download = request.nextUrl.searchParams.get('download') === '1';

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': (download ? 'attachment' : 'inline') + '; filename="' + fileName + '"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal membuat PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}