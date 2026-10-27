import { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../../assets/logo.png';
import {
  LayoutDashboard, FolderKanban, CheckSquare, LifeBuoy,
  Users, Building2, FileText, Receipt, IndianRupee, Wallet,
  CreditCard, BookOpen, TrendingUp, Clock, CalendarDays,
  Banknote, Key, Settings, UserPlus, LogOut, X, Search
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const NavItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${
        isActive
          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white active:scale-[0.98]'
      }`
    }
  >
    <Icon className="w-[17px] h-[17px] flex-shrink-0" />
    <span className="truncate">{label}</span>
  </NavLink>
);

// Helper to normalise the stored role string for comparison
const isAdminRole = (role) => {
  if (!role) return false;
  const r = role.toLowerCase().replace(/[^a-z]/g, '');
  return r === 'superadmin' || r === 'admin';
};

const getNavSections = (isAdmin) => [
  {
    title: 'General',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    title: 'Work Management',
    items: [
      { to: '/projects', icon: FolderKanban, label: 'Projects' },
      { to: '/tasks', icon: CheckSquare, label: 'My Tasks' },
      { to: '/tickets', icon: LifeBuoy, label: 'Support Tickets' },
    ]
  },
  {
    title: 'CRM & Sales',
    items: [
      { to: '/leads', icon: Users, label: 'Leads Pipeline' },
      { to: '/clients', icon: Building2, label: 'Clients Directory' },
    ]
  },
  // Finance section — admin only
  ...(isAdmin ? [{
    title: 'Financials',
    items: [
      { to: '/quotations', icon: FileText, label: 'Quotations' },
      { to: '/invoices', icon: Receipt, label: 'Invoices' },
      { to: '/receipts', icon: IndianRupee, label: 'Receipts' },
      { to: '/expenses', icon: Wallet, label: 'Expenses' },
      { to: '/payroll', icon: CreditCard, label: 'Payroll' },
      { to: '/ledger', icon: BookOpen, label: 'General Ledger' },
      { to: '/profit-loss', icon: TrendingUp, label: 'Profit & Loss' },
    ]
  }] : []),
  {
    title: 'HR & Operations',
    items: [
      { to: '/attendance', icon: Clock, label: 'Attendance' },
      { to: '/leaves', icon: CalendarDays, label: 'Leave Requests' },
      { to: '/reimbursements', icon: Banknote, label: 'Reimbursements' },
      ...(!isAdmin ? [{ to: '/payroll', icon: CreditCard, label: 'My Payslips' }] : []),
    ]
  },
  // Administration section items — admin only (vault, team, accounts); catalog open to all
  {
    title: 'Administration',
    items: [
      ...(isAdmin ? [
        { to: '/team', icon: Users, label: 'Team Members' },
        { to: '/vault', icon: Key, label: 'Password Vault' },
        { to: '/accounts', icon: UserPlus, label: 'Create Accounts' },
      ] : []),
      { to: '/catalog', icon: Settings, label: 'Service Catalog' },
    ]
  }
];

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuthStore();
  const [search, setSearch] = useState('');

  const isAdmin = isAdminRole(user?.role);
  const navSections = useMemo(() => getNavSections(isAdmin), [isAdmin]);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return navSections;
    const q = search.toLowerCase();
    return navSections
      .map(section => ({
        ...section,
        items: section.items.filter(item => item.label.toLowerCase().includes(q))
      }))
      .filter(section => section.items.length > 0);
  }, [search, navSections]);

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className="
      w-72 lg:w-64 h-screen flex flex-col
      bg-[var(--bg-sidebar)] dark:bg-slate-950/95
      backdrop-blur-xl
      border-r border-slate-200/60 dark:border-slate-800/60
      transition-colors duration-300
    ">
      {/* Brand */}
      <div className="p-5 pb-3 flex items-center justify-between">
        <div className="flex items-center">
          <img src={Logo} alt="Navi Promo" className="h-10 w-auto object-contain drop-shadow-sm" />
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="
            lg:hidden p-2 -mr-1 rounded-xl
            text-slate-400 dark:text-slate-500
            hover:text-slate-600 dark:hover:text-slate-300
            hover:bg-slate-100 dark:hover:bg-slate-800
            transition-all
          "
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick-Jump Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Quick jump..."
            className="
              w-full pl-9 pr-3 py-2 rounded-xl text-sm
              bg-slate-100/80 dark:bg-slate-800/60
              border border-slate-200/60 dark:border-slate-700/60
              text-slate-900 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              focus:outline-none focus:ring-2 focus:ring-indigo-500/30
              focus:border-indigo-400 dark:focus:border-indigo-500
              transition-all
            "
          />
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4 custom-scrollbar overscroll-contain">
        {filteredSections.map((section) => (
          // Don't render a section that ends up with no items (e.g. Administration for non-admin)
          section.items.length > 0 && (
            <div key={section.title}>
              <p className="px-3 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1.5">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem key={item.to} {...item} onClick={handleNavClick} />
                ))}
              </div>
            </div>
          )
        ))}

        {filteredSections.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-400 dark:text-slate-600">
            No matching pages
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="
            w-9 h-9 rounded-xl flex-shrink-0
            bg-indigo-100 dark:bg-indigo-900/30
            text-indigo-700 dark:text-indigo-400
            flex items-center justify-center
            font-black text-sm
          ">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {user?.fullName || 'User'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {user?.role || 'Role'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="
            w-full flex items-center justify-center gap-2 py-2.5
            text-sm font-bold
            text-red-600 dark:text-red-400
            bg-red-50 dark:bg-red-900/10
            hover:bg-red-100 dark:hover:bg-red-900/20
            rounded-xl transition-all active:scale-[0.98]
          "
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
