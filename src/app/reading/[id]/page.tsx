import { notFound } from 'next/navigation';
import { ReaderView } from '@/components/ReaderView';
import { getReader } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ReadingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reader = getReader(Number(id));
  if (!reader) notFound();

  return (
    <ReaderView
      readerId={reader.id}
      title={reader.title}
      level={reader.level}
      lang={reader.lang ?? 'en'}
    />
  );
}
