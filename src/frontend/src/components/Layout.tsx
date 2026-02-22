import LoginButton from './LoginButton';
import ThemeToggle from './ThemeToggle';
import { Heart } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear();
  const appIdentifier = encodeURIComponent(window.location.hostname || 'gratitude-journal');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-warm-500 to-warm-600 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Gratitude Journal</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LoginButton />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4">
        {children}
      </main>

      <footer className="border-t border-border bg-card/30 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {currentYear} · Built with{' '}
            <Heart className="inline w-3 h-3 text-warm-500 fill-warm-500" /> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-warm-600 hover:text-warm-700 transition-colors underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
