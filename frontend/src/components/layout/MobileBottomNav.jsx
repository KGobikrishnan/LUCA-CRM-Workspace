import { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Users, Receipt, MoreHorizontal, CheckSquare, Clock } from 'lucide-react';
import useAuthStore from '../../store/authStore';

// Helper to normalise the stored role string for comparison
const isAdminRole = (role) => {
  if (!role) return false;
  const r = role.toLowerCase().replace(/[^a-z]/g, '');
  return r === 'superadmin' || r === 'admin';
};

const MobileBottomNav = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  const isAdmin = useMemo(() => isAdminRole(user?.role), [user]);

  // Regular items for Non-Admins (Home, Tasks, Projects, Attendance, CRM)
  const regularNavItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/tasks', icon: CheckSquare, label: 'Task' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/attendance', icon: Clock, label: 'Attendance' },
    { to: '/leads', icon: Users, label: 'CRM' },
  ];

  // Items for Admin (Home, Projects, CRM, Finance)
  const adminNavItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/leads', icon: Users, label: 'CRM' },
    { to: '/invoices', icon: Receipt, label: 'Finance' },
  ];

  const moreRoutes = ['/tasks', '/tickets', '/attendance', '/team', '/vault', '/catalog', '/accounts', '/leaves', '/reimbursements'];

  if (!isAdmin) {
    // Render only the 5 specific items for non-admins
    return (
      <nav className="
        fixed bottom-0 left-0 right-0 z-30 lg:hidden
        bg-white/90 dark:bg-slate-950/90
        backdrop-blur-xl
        border-t border-slate-200/60 dark:border-slate-800/60
        safe-area-bottom
        transition-colors duration-300
      ">
        <div className="flex items-center justify-around h-16 px-1">
          {regularNavItems.map((item) => {
            const isActive = location.pathname === item.to ||
              (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center gap-1 flex-1 py-1 relative"
              >
                {isActive && (
                  <span className="absolute top-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
                <item.icon
                  className={`w-[22px] h-[22px] transition-all duration-200 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 scale-110'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span
                  className={`text-[10px] font-bold transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    );
  }

  // Otherwise render the Admin navbar with More button
  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-30 lg:hidden
      bg-white/90 dark:bg-slate-950/90
      backdrop-blur-xl
      border-t border-slate-200/60 dark:border-slate-800/60
      safe-area-bottom
      transition-colors duration-300
    ">
      <div className="flex items-center justify-around h-16 px-1">
        {adminNavItems.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-1 relative"
            >
              {isActive && (
                <span className="absolute top-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              )}
              <item.icon
                className={`w-[22px] h-[22px] transition-all duration-200 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 scale-110'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span
                className={`text-[10px] font-bold transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}

        <NavLink
          to="/tasks"
          className="flex flex-col items-center justify-center gap-1 flex-1 py-1 relative"
        >
          {moreRoutes.includes(location.pathname) && (
            <span className="absolute top-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
          )}
          <MoreHorizontal
            className={`w-[22px] h-[22px] transition-all ${
              moreRoutes.includes(location.pathname)
                ? 'text-indigo-600 dark:text-indigo-400 scale-110'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          />
          <span
            className={`text-[10px] font-bold transition-colors ${
              moreRoutes.includes(location.pathname)
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            More
          </span>
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
