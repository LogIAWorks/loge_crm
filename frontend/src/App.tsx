import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Clients from './pages/Clients';
import Interactions from './pages/Interactions';
import Payments from './pages/Payments';
import Tasks from './pages/Tasks';
import Affiliates from './pages/Affiliates';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './auth';

function CrmRoutes() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/interactions" element={<Interactions />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/affiliates" element={<Affiliates />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function Gate() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return session ? <CrmRoutes /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

export default App;
