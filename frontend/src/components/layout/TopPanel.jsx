import { useLocation } from 'react-router-dom';
import { ChevronRight, Menu, Sun, Moon } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import NotificationPanel from './NotificationPanel';
import Logo from '../../assets/logo.png';

const routeLabels = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/tasks': 'My Tasks',
  '/tickets': 'Support Tickets',
  '/leads': 'Leads Pipeline',
  '/clients': 'Clients Directory',
  '/quotations': 'Quotations',
  '/invoices': 'Invoices',
  '/receipts': 'Receipts',
  '/expenses': 'Expenses',
  '/payroll': 'Payroll',
  '/ledger': 'General Ledger',
  '/profit-loss': 'Profit & Loss',
  '/attendance': 'Attendance',
  '/leaves': 'Leave Requests',
  '/reimbursements': 'Reimbursements',
  '/team': 'Team Members',
  '/vault': 'Password Vault',
  '/catalog': 'Service Catalog',
  '/accounts': 'Create Accounts',
};

const routeSections = {
  '/dashboard': 'General',
  '/projects': 'Work Management',
  '/tasks': 'Work Management',
  '/tickets': 'Work Management',
  '/leads': 'CRM & Sales',
  '/clients': 'CRM & Sales',
  '/quotations': 'Financials',
  '/invoices': 'Financials',
  '/receipts': 'Financials',
  '/expenses': 'Financials',
  '/payroll': 'Financials',
  '/ledger': 'Financials',
  '/profit-loss': 'Financials',
  '/attendance': 'HR & Operations',
  '/leaves': 'HR & Operations',
  '/reimbursements': 'HR & Operations',
  '/team': 'Administration',
  '/vault': 'Administration',
  '/catalog': 'Administration',
  '/accounts': 'Administration',
};

const TopPanel = ({ onMenuToggle }) => {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const shortDate = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  });

  const currentPath = location.pathname;
  const pageLabel = routeLabels[currentPath] || 'Page';
  const sectionLabel = routeSections[currentPath] || '';

  return (
    <header
      className="
        sticky top-0 z-20 h-14
        bg-[var(--bg-topbar)] dark:bg-slate-900/80
        backdrop-blur-xl
        border-b border-slate-200/60 dark:border-slate-700/60
        flex items-center justify-between px-4 lg:px-6
        transition-colors duration-300
      "
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="
            lg:hidden p-2 -ml-1.5 rounded-xl
            text-slate-500 dark:text-slate-400
            hover:text-slate-900 dark:hover:text-white
            hover:bg-slate-100 dark:hover:bg-slate-800
            transition-all active:scale-95
          "
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm">
          <img src={Logo} alt="Logo" className="hidden lg:inline h-5 w-auto opacity-70 grayscale" />
          {sectionLabel && (
            <>
              <ChevronRight className="hidden lg:inline w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              <span className="hidden lg:inline text-slate-500 dark:text-slate-400 font-medium">
                {sectionLabel}
              </span>
            </>
          )}
          <ChevronRight className="hidden lg:inline w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          <span className="font-bold text-slate-900 dark:text-white text-base lg:text-sm">
            {pageLabel}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Date */}
        <div className="text-right hidden sm:block">
          <p className="hidden lg:block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {currentDate}
          </p>
          <p className="lg:hidden text-xs font-medium text-slate-600 dark:text-slate-400">
            {shortDate}
          </p>
          <p className="hidden lg:block text-[11px] text-slate-400 dark:text-slate-500">
            {user?.city || 'India'}
          </p>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="
            p-2 rounded-xl transition-all active:scale-95
            text-slate-500 dark:text-slate-400
            hover:text-indigo-600 dark:hover:text-indigo-400
            hover:bg-indigo-50 dark:hover:bg-indigo-900/20
          "
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light'
            ? <Moon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            : <Sun className="w-[18px] h-[18px]" />
          }
        </button>

        {/* Live Notification Panel */}
        <NotificationPanel />

        {/* User avatar — mobile only */}
        <div className="
          lg:hidden w-8 h-8 rounded-lg
          bg-indigo-100 dark:bg-indigo-900/30
          text-indigo-700 dark:text-indigo-400
          flex items-center justify-center
          font-black text-xs
        ">
          {user?.fullName?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  );
};

export default TopPanel;
