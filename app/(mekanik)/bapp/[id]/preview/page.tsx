import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import BappPreview from '@/components/bapp/BappPreview';
import type { BappWithJobDesc } from '@/types/bapp';

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bapp } = await supabase
    .from('bapp')
    .select('*, job_desc:bapp_job_desc(*)')
    .eq('id', id)
    .single();

  if (!bapp) notFound();

  const sortedBapp: BappWithJobDesc = {
    ...bapp,
    job_desc: (bapp.job_desc ?? []).sort((a: { urutan: number }, b: { urutan: number }) => a.urutan - b.urutan),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-4 pt-6">
        <h1 className="text-lg font-medium">Preview BAPP</h1>
      </div>
      <div className="py-2" />
      <BappPreview bapp={sortedBapp} />
    </div>
  );
}