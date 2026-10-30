import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateMarPdf, marFileName } from '@/lib/pdf/generateMarPdf';
import { marFormSchema } from '@/lib/validation/marSchema';

export const maxDuration = 30;

// PDF MAR dibuat langsung dari data form dan tidak disimpan di mana pun.
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  }

  // Validasi ulang di server, karena validasi di browser bisa dilewati
  const parsed = marFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }, { status: 400 });
  }

  const { data: logo } = await supabase.from('config').select('value').eq('key', 'logo_url').single();

  try {
    const bytes = await generateMarPdf(parsed.data, logo?.value ?? null);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="' + marFileName(parsed.data) + '"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal membuat PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}