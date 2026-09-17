import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import UnitDataForm from '@/components/form/UnitDataForm';

export default async function NewBappPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-4 pt-6">
        <h1 className="text-lg font-medium">BAPP baru</h1>
      </div>

      <div className="flex gap-1.5 px-4 py-4">
        <div className="h-1 flex-1 rounded-full bg-black" />
        <div className="h-1 flex-1 rounded-full bg-gray-200" />
        <div className="h-1 flex-1 rounded-full bg-gray-200" />
      </div>

      <p className="px-4 pb-3 text-xs text-gray-500">Langkah 1 dari 3 &middot; Info umum &amp; data unit</p>

      <UnitDataForm />
    </div>
  );
}