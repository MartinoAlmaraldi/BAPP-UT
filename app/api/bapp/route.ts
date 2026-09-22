import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'Belum diimplementasikan' }, { status: 501 });
}