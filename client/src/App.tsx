import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { RequireAdmin, RequireAuth } from '@/auth/route-guards';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/skeleton';

const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const SummaryPage = lazy(() => import('@/pages/SummaryPage').then((m) => ({ default: m.SummaryPage })));
const NewBatchPage = lazy(() => import('@/pages/NewBatchPage').then((m) => ({ default: m.NewBatchPage })));
const BatchDetailPage = lazy(() =>
  import('@/pages/BatchDetailPage').then((m) => ({ default: m.BatchDetailPage })),
);
const RecipesPage = lazy(() => import('@/pages/RecipesPage').then((m) => ({ default: m.RecipesPage })));
const NewRecipePage = lazy(() => import('@/pages/NewRecipePage').then((m) => ({ default: m.NewRecipePage })));
const RecipeDetailPage = lazy(() =>
  import('@/pages/RecipeDetailPage').then((m) => ({ default: m.RecipeDetailPage })),
);
const EditRecipePage = lazy(() =>
  import('@/pages/EditRecipePage').then((m) => ({ default: m.EditRecipePage })),
);
const AccountPage = lazy(() => import('@/pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

function PageFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<SummaryPage />} />
            <Route path="batches/new" element={<NewBatchPage />} />
            <Route path="batches/:id" element={<BatchDetailPage />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="recipes/new" element={<NewRecipePage />} />
            <Route path="recipes/:id" element={<RecipeDetailPage />} />
            <Route path="recipes/:id/edit" element={<EditRecipePage />} />
            <Route path="account" element={<AccountPage />} />

            <Route element={<RequireAdmin />}>
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
