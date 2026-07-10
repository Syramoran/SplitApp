import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { IconDefs } from './components/icons';
import { useAuth } from './context/AuthContext';
import { AddExpense } from './pages/AddExpense';
import { GroupDetail } from './pages/GroupDetail';
import { Groups } from './pages/Groups';
import { Home } from './pages/Home';
import { Insights } from './pages/Insights';
import { Login } from './pages/Login';
import { NewGroup } from './pages/NewGroup';
import { Onboarding } from './pages/Onboarding';
import { Profile } from './pages/Profile';
import { Settle } from './pages/Settle';
import { SettleDone } from './pages/SettleDone';

function Protected() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

/** Pantallas con navegación inferior persistente. */
function WithNav() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
}

export function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app-shell">
      <IconDefs />
      <Routes>
        <Route
          path="/onboarding"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Onboarding />}
        />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

        <Route element={<Protected />}>
          <Route element={<WithNav />}>
            <Route path="/" element={<Home />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/add" element={<AddExpense />} />
          <Route path="/groups/new" element={<NewGroup />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/groups/:id/settle" element={<Settle />} />
          <Route path="/groups/:id/done" element={<SettleDone />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
