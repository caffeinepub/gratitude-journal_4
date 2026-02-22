import { useGetUserEntries } from '../hooks/useQueries';
import EntryCard from './EntryCard';
import { Skeleton } from './ui/skeleton';
import { Sparkles } from 'lucide-react';

export default function EntriesList() {
  const { data: entries, isLoading } = useGetUserEntries();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Your Gratitude Journey</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-warm-100 dark:bg-warm-900/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-warm-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Start Your Gratitude Practice</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Begin by writing about something you're grateful for today. It can be big or small—every moment of gratitude counts.
          </p>
        </div>
      </div>
    );
  }

  // Sort entries by timestamp (most recent first)
  const sortedEntries = [...entries].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Your Gratitude Journey</h2>
      <div className="space-y-4">
        {sortedEntries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
