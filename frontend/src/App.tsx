import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useTheme } from './hooks/useTheme';
import Layout from './components/Layout';
import ProfileSetup from './components/ProfileSetup';
import EntriesList from './components/EntriesList';
import EntryForm from './components/EntryForm';
import { Skeleton } from './components/ui/skeleton';

export default function App() {
  // Initialize theme detection and application
  useTheme();

  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="space-y-4 w-full max-w-md">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="max-w-md space-y-6">
            <h1 className="text-4xl font-bold text-foreground">Welcome to Your Gratitude Journal</h1>
            <p className="text-lg text-muted-foreground">
              A peaceful space to reflect on the moments, people, and experiences that bring joy to your life.
            </p>
            <p className="text-muted-foreground">
              Please sign in to begin your gratitude practice.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show profile setup if needed
  if (showProfileSetup) {
    return (
      <Layout>
        <ProfileSetup />
      </Layout>
    );
  }

  // Show main journal interface
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 py-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Today's Gratitude</h1>
          <p className="text-muted-foreground">What are you grateful for today?</p>
        </div>
        <EntryForm />
        <EntriesList />
      </div>
    </Layout>
  );
}
