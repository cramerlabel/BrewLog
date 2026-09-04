import { Route, Routes } from 'react-router-dom';
import { RequireAdmin, RequireAuth } from '@/auth/route-guards';
import { AppShell } from '@/components/layout/AppShell';
import { AccountPage } from '@/pages/AccountPage';
import { BatchDetailPage } from '@/pages/BatchDetailPage';
import { EditRecipePage } from '@/pages/EditRecipePage';
import { LoginPage } from '@/pages/LoginPage';
import { NewBatchPage } from '@/pages/NewBatchPage';
import { NewRecipePage } from '@/pages/NewRecipePage';
import { RecipeDetailPage } from '@/pages/RecipeDetailPage';
import { RecipesPage } from '@/pages/RecipesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SummaryPage } from '@/pages/SummaryPage';

function App() {
  return (
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
  );
}

export default App;
