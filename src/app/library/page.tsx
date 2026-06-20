import { LoggedInHeader } from '@/components/Header';
import { LibraryView } from '@/components/LibraryView';
import { getLevels, getReadTextsInfo, getReadingStats } from '@/lib/data';
import { readUserName } from '@/lib/userName';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const levels = getLevels();
  const info = getReadTextsInfo();
  const level1Stats = getReadingStats().find((s) => s.level === 1);
  const userName = await readUserName();

  return (
    <>
      <LoggedInHeader
        uniqueWordsNumber={info.uniqueWordsNumber}
        level={1}
        userProgress={level1Stats?.userProgress ?? 0}
        publishedReadersCount={level1Stats?.publishedReadersCount ?? 30}
        userName={userName}
      />
      <LibraryView levels={levels} />
    </>
  );
}
