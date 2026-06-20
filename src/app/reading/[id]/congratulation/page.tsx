import { notFound } from 'next/navigation';
import { Congratulation } from '@/components/Congratulation';
import { getReader } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function CongratulationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reader = getReader(Number(id));
  if (!reader) notFound();

  return <Congratulation readerId={reader.id} />;
}
