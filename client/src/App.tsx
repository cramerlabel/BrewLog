import { Route, Routes } from 'react-router-dom';
import { RequireAdmin, RequireAuth } from '@/auth/route-guards';
import { AppShell } from '@/components/layout/AppShell';
import { AccountPage } from '@/pages/AccountPage';
import { LoginPage } from '@/pages/LoginPage';
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
          <Route path="recipes" element={<RecipesPage />} />
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
