import { store } from '@/lib/store';
import SourceConfigPage from '@/components/sources/SourceConfigPage';
import { SourcePair } from '@/types';

export const dynamic = 'force-dynamic';

export default async function SourcesPage() {
  let sources: SourcePair[] = [];
  try {
    sources = await store.getSourcePairs();
  } catch (e) {
    console.error('Failed to load source pairs', e);
  }

  return <SourceConfigPage initialSources={sources} />;
}

