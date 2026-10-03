import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { loggedIn, checking } = useAuth();
  if (checking) return <div className="spinner" style={{ marginTop: '5rem' }} />;
  return loggedIn ? children : <Navigate to="/admin/login" replace />;
}
