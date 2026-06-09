import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CalendarPage from './pages/CalendarPage';
import BookingPage from './pages/BookingPage';
import OrdersPage from './pages/OrdersPage';
import VerificationPage from './pages/VerificationPage';
import NoticePage from './pages/NoticePage';
import AdminPage from './pages/AdminPage';
import { useUserStore } from './store/useUserStore';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { role } = useUserStore();
  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/verification" element={<VerificationPage />} />
          <Route path="/verification/:orderId" element={<VerificationPage />} />
          <Route path="/notice" element={<NoticePage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
