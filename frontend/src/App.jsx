import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';

// Work Management
import ProjectsPage from './pages/work/ProjectsPage';
import MyTasksPage from './pages/work/MyTasksPage';
import SupportTicketsPage from './pages/work/SupportTicketsPage';

// CRM
import LeadsPipelinePage from './pages/crm/LeadsPipelinePage';
import ClientDirectoryPage from './pages/crm/ClientDirectoryPage';

// Financials
import QuotationsPage from './pages/financials/QuotationsPage';
import InvoicesPage from './pages/financials/InvoicesPage';
import ReceiptsPage from './pages/financials/ReceiptsPage';
import ExpensesPage from './pages/financials/ExpensesPage';
import PayrollPage from './pages/financials/PayrollPage';
import GeneralLedgerPage from './pages/financials/GeneralLedgerPage';
import ProfitLossPage from './pages/financials/ProfitLossPage';

// HR
import AttendancePage from './pages/hr/AttendancePage';
import LeaveRequestsPage from './pages/hr/LeaveRequestsPage';
import ReimbursementsPage from './pages/hr/ReimbursementsPage';

// Admin
import TeamMembersPage from './pages/admin/TeamMembersPage';
import CreateAccountPage from './pages/admin/CreateAccountPage';
import PasswordVaultPage from './pages/admin/PasswordVaultPage';
import ServiceCatalogPage from './pages/admin/ServiceCatalogPage';

import { ToastProvider } from './components/common/Toast';

function App() {
  return (
    <ToastProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Work Management */}
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/tasks" element={<MyTasksPage />} />
              <Route path="/tickets" element={<SupportTicketsPage />} />

              {/* CRM & Sales */}
              <Route path="/leads" element={<LeadsPipelinePage />} />
              <Route path="/clients" element={<ClientDirectoryPage />} />

              {/* Financials - Restricted */}
              <Route element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Super_Admin']} />}>
                <Route path="/quotations" element={<QuotationsPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/receipts" element={<ReceiptsPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/ledger" element={<GeneralLedgerPage />} />
                <Route path="/profit-loss" element={<ProfitLossPage />} />
              </Route>

              {/* HR */}
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/leaves" element={<LeaveRequestsPage />} />
              <Route path="/reimbursements" element={<ReimbursementsPage />} />

              {/* Admin - Restricted (Except Catalog maybe, but user said Team members, Password vault, Create account) */}
              <Route element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Super_Admin']} />}>
                <Route path="/team" element={<TeamMembersPage />} />
                <Route path="/accounts" element={<CreateAccountPage />} />
                <Route path="/vault" element={<PasswordVaultPage />} />
              </Route>
              <Route path="/catalog" element={<ServiceCatalogPage />} />

            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
