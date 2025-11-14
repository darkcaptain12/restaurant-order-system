import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import WaiterDashboard from './pages/WaiterDashboard';
import KitchenDashboard from './pages/KitchenDashboard';
import BarDashboard from './pages/BarDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CashierDashboard from './pages/CashierDashboard';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/waiter"
          element={
            <ProtectedRoute allowedRoles={['waiter']}>
              <WaiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={['kitchen']}>
              <KitchenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bar"
          element={
            <ProtectedRoute allowedRoles={['bar']}>
              <BarDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier"
          element={
            <ProtectedRoute allowedRoles={['cashier']}>
              <CashierDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

