import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

// Normalise role string — handles 'Super Admin', 'super_admin', 'SUPER ADMIN', etc.
const normaliseRole = (role = '') => role.toLowerCase().replace(/[^a-z]/g, '');

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const userNorm = normaliseRole(user?.role);
    const hasAccess = allowedRoles.some(r => normaliseRole(r) === userNorm);
    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
