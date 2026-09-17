import { NextRequest, NextResponse } from 'next/server';
import { generateAndUploadBappPdf } from '@/lib/pdf/generateBappPdf';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const pdfUrl = await generateAndUploadBappPdf(id);
    return NextResponse.json({ pdfUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal generate PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}