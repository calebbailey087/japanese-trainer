import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { usePagesLocation, usePagesSearch } from '@/routing/hash-location';
import { Shell } from '@/components/shell';
import Setup from '@/pages/setup';
import Practice from '@/pages/practice';
import Progress from '@/pages/progress';
import Settings from '@/pages/settings';
import Learn from '@/pages/learn';
import Review from '@/pages/review';
import Library from '@/pages/library';
import Custom from '@/pages/custom';
import About from '@/pages/about';
import { ThemeRoot } from '@/themes/theme-root';
import { applySavedThemeEarly } from '@/themes/themes';

applySavedThemeEarly();

const queryClient = new QueryClient();

function Router() {
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Setup} />
          <Route path="/practice" component={Practice} />
          <Route path="/progress" component={Progress} />
          <Route path="/settings" component={Settings} />
          <Route path="/learn" component={Learn} />
          <Route path="/review" component={Review} />
          <Route path="/library" component={Library} />
          <Route path="/custom" component={Custom} />
          <Route path="/about" component={About} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Shell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeRoot />
        <WouterRouter hook={import.meta.env.VITE_ROUTER_MODE === 'hash' ? usePagesLocation : undefined} searchHook={import.meta.env.VITE_ROUTER_MODE === 'hash' ? usePagesSearch : undefined} base={import.meta.env.VITE_ROUTER_MODE === 'hash' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
