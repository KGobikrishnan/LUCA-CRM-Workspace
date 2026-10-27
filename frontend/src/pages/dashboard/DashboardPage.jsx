import { useState, useEffect, useMemo } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/currency';
import { TrendingUp, TrendingDown, IndianRupee, AlertCircle, Target, Clock, Activity, Briefcase, CheckCircle2, AlertTriangle, XCircle, LayoutList, Filter, Users, Star, ArrowUpRight, CheckSquare, ShieldAlert } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuthStore();

  // Normalise role — handles 'Super Admin', 'super_admin', 'Admin', etc.
  const isAdmin = (() => {
    if (!user?.role) return false;
    const r = user.role.toLowerCase().replace(/[^a-z]/g, '');
    return r === 'superadmin' || r === 'admin';
  })();

  const [activeTab, setActiveTab] = useState(isAdmin ? 'finance' : 'work');
  
  // Finance Data
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  
  // Work Data
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [clients, setClients] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [attendances, setAttendances] = useState([]);

  // Work Filters
  const [workFilters, setWorkFilters] = useState({
    status: '',
    project: '',
    client: '',
    team: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const TARGET_GOAL = 500000; // 5 Lakhs

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (activeTab === 'finance' && ledgerEntries.length === 0) {
          const [ledgerRes, invoicesRes] = await Promise.all([
            api.get('/general-ledgers/report'),
            api.get('/invoices')
          ]);
          setLedgerEntries(ledgerRes.data);
          setInvoices(invoicesRes.data);
        } else if ((activeTab === 'work' || activeTab === 'performance') && projects.length === 0) {
          const [projRes, taskRes, ticketRes, clientRes, teamRes] = await Promise.all([
            api.get('/projects'),
            api.get('/tasks'),
            api.get('/support-tickets'),
            api.get('/clients'),
            api.get('/users')
          ]);
          setProjects(projRes.data);
          setTasks(taskRes.data);
          setTickets(ticketRes.data);
          setClients(clientRes.data);
          setTeamMembers(teamRes.data);
        }

        if (activeTab === 'performance' && attendances.length === 0) {
          const attRes = await api.get('/attendances');
          setAttendances(attRes.data);
        }
      } catch (err) {
        console.error("Error fetching dashboard data", err);
        setError("Failed to load dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeTab]);

  // Aggregation Engine - Finance
  const financeAnalysis = useMemo(() => {
    if (activeTab !== 'finance' || (!ledgerEntries.length && !invoices.length)) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthRevenue = 0;
    let monthExpenses = 0;

    const trendMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      trendMap[label] = { name: label, Income: 0, Expense: 0, sortVal: d.getTime() };
    }

    ledgerEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const entryMonth = entryDate.getMonth();
      const entryYear = entryDate.getFullYear();
      
      const debit = Number(entry.debit || 0);
      const credit = Number(entry.credit || 0);

      if (entryMonth === currentMonth && entryYear === currentYear) {
        if (entry.refType === 'Receipt') monthRevenue += credit;
        else if (entry.refType === 'Expense' || entry.refType === 'Payroll') monthExpenses += debit;
      }

      const label = entryDate.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (trendMap[label]) {
        if (entry.refType === 'Receipt') trendMap[label].Income += credit;
        else if (entry.refType === 'Expense' || entry.refType === 'Payroll') trendMap[label].Expense += debit;
      }
    });

    const netProfit = monthRevenue - monthExpenses;
    const margin = monthRevenue > 0 ? ((netProfit / monthRevenue) * 100).toFixed(1) : 0;
    
    let pendingDue = 0;
    invoices.forEach(inv => {
      if (inv.status === 'Unpaid' || inv.status === 'Partially paid' || inv.status === 'Overdue') {
        pendingDue += Number(inv.balanceDue || 0);
      }
    });

    const trendData = Object.values(trendMap).sort((a, b) => a.sortVal - b.sortVal);
    const recentTransactions = [...ledgerEntries].reverse().slice(0, 3);
    const goalProgress = Math.min(((monthRevenue / TARGET_GOAL) * 100), 100).toFixed(1);

    return { monthRevenue, monthExpenses, netProfit, margin, pendingDue, trendData, recentTransactions, goalProgress };
  }, [activeTab, ledgerEntries, invoices]);

  // Aggregation Engine - Work
  const workAnalysis = useMemo(() => {
    if (activeTab !== 'work' || !projects) return null;

    // Top Indicators
    let activeProjectsCount = 0;
    let healthyCount = 0;
    let atRiskCount = 0;
    let criticalCount = 0;

    projects.forEach(p => {
      if (p.status !== 'Completed' && p.status !== 'Cancelled') {
        activeProjectsCount++;
        if (p.health === 'Healthy') healthyCount++;
        else if (p.health === 'At Risk') atRiskCount++;
        else if (p.health === 'Critical') criticalCount++;
      }
    });

    let completedTasks = 0;
    tasks.forEach(t => {
      if (t.status === 'Completed') completedTasks++;
    });
    const taskVelocity = tasks.length > 0 ? ((completedTasks / tasks.length) * 100).toFixed(1) : 0;

    // Build Maps for Filtering
    const projectMap = {}; // id -> project
    projects.forEach(p => projectMap[p.id] = p);

    // Apply Filters to Tasks
    const filteredTasks = tasks.filter(t => {
      if (workFilters.status && t.status !== workFilters.status) return false;
      if (workFilters.project && t.projectId !== workFilters.project) return false;
      if (workFilters.team && t.assignedTo !== workFilters.team) return false;
      
      if (workFilters.client) {
        const proj = projectMap[t.projectId];
        if (!proj || proj.clientId !== workFilters.client) return false;
      }
      return true;
    });

    // Apply Filters to Tickets
    const filteredTickets = tickets.filter(tk => {
      if (workFilters.status && tk.status !== workFilters.status) return false;
      if (workFilters.project && tk.projectId !== workFilters.project) return false;
      if (workFilters.client && tk.clientId !== workFilters.client) return false;
      if (workFilters.team && tk.assigneeId !== workFilters.team) return false;
      return true;
    });

    const userMap = {};
    teamMembers.forEach(u => userMap[u.id] = u.fullName);
    
    const clientMap = {};
    clients.forEach(c => clientMap[c.id] = c.businessName);

    return { 
      activeProjectsCount, healthyCount, atRiskCount, criticalCount, taskVelocity, 
      filteredTasks, filteredTickets, projectMap, userMap, clientMap 
    };
  }, [activeTab, projects, tasks, tickets, clients, teamMembers, workFilters]);

  // Aggregation Engine - Performance
  const performanceAnalysis = useMemo(() => {
    if (activeTab !== 'performance' || !teamMembers.length) return null;

    // 1. Production Rate
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const prodRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

    // 2. Attendance %
    const presentCount = attendances.filter(a => a.status.includes('Present') || a.status.includes('Late') || a.status.includes('Half') || a.status.includes('Over Time')).length;
    const totalAttendances = attendances.length;
    const attRate = totalAttendances > 0 ? ((presentCount / totalAttendances) * 100).toFixed(1) : 0;

    // 3. Client Retention
    const activeClients = clients.filter(c => c.status === 'Active').length;
    const totalClients = clients.length;
    const clientRet = totalClients > 0 ? ((activeClients / totalClients) * 100).toFixed(1) : 0;

    // 4. New Clients & Projects this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let newClientsCount = 0;
    clients.forEach(c => {
      if (c.createdAt) {
        const d = new Date(c.createdAt);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) newClientsCount++;
      } else {
        newClientsCount++;
      }
    });

    let newProjectsCount = 0;
    projects.forEach(p => {
      if (p.createdAt) {
        const d = new Date(p.createdAt);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) newProjectsCount++;
      } else {
        newProjectsCount++; 
      }
    });

    // 5. Per Head Analysis
    const headAnalysis = teamMembers.map(u => {
      const uTasks = tasks.filter(t => t.assignedTo === u.id);
      const uTasksDone = uTasks.filter(t => t.status === 'Completed').length;
      const uProdRate = uTasks.length > 0 ? ((uTasksDone / uTasks.length) * 100).toFixed(1) : 0;

      const uTickets = tickets.filter(t => t.assigneeId === u.id);
      const uTicketsResolved = uTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

      const uProjectIds = new Set(uTasks.map(t => t.projectId).filter(Boolean));
      const uProjectsCount = uProjectIds.size;

      const uAtts = attendances.filter(a => a.userId === u.id);
      const uAttsPresent = uAtts.filter(a => a.status.includes('Present') || a.status.includes('Late') || a.status.includes('Half') || a.status.includes('Over Time')).length;
      const uAttRate = uAtts.length > 0 ? ((uAttsPresent / uAtts.length) * 100).toFixed(1) : 0;

      const rawScore = (uTasksDone * 5) + (uTicketsResolved * 3) + (Number(uProdRate) * 0.2) + (Number(uAttRate) * 0.2);
      const score = Math.min(Math.round(rawScore), 100);

      return {
        ...u,
        tasksDone: uTasksDone,
        prodRate: uProdRate,
        projectsCount: uProjectsCount,
        ticketsResolved: uTicketsResolved,
        attRate: uAttRate,
        score
      };
    }).sort((a, b) => b.score - a.score);

    const topPerformer = headAnalysis.length > 0 ? headAnalysis[0] : null;

    return {
      prodRate, attRate, clientRet, newClientsCount, newProjectsCount, headAnalysis, topPerformer
    };
  }, [activeTab, teamMembers, tasks, tickets, projects, clients, attendances]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const tabs = [
    ...(isAdmin ? [{ id: 'finance', label: 'Finance' }] : []),
    { id: 'work', label: 'Work' },
    { id: 'performance', label: 'Performance' }
  ];

  return (
    <div className="space-y-4 lg:space-y-6 max-w-[1400px] mx-auto pb-12">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800/60 p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{greeting()}, {user?.fullName?.split(' ')[0]}!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 font-medium text-sm">Your workspace overview for today.</p>
        </div>
        <div className="bg-indigo-600 dark:bg-indigo-500/80 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-md whitespace-nowrap">
          {user?.role || 'Admin'}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-full sm:w-fit overflow-x-auto mobile-scroll">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-slate-100 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-slate-100 rounded-2xl" />
            <div className="space-y-6">
              <div className="h-32 bg-slate-100 rounded-2xl" />
              <div className="h-56 bg-slate-100 rounded-2xl" />
            </div>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-black text-red-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-700 font-medium">{error}</p>
          <button 
            onClick={() => {
              if (activeTab === 'finance') setLedgerEntries([]);
              if (activeTab === 'work') setProjects([]);
              if (activeTab === 'performance') setAttendances([]);
            }} 
            className="mt-6 px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && activeTab === 'finance' && financeAnalysis && (
        <div className="space-y-6">
          
          {/* Top Metric Cards */}
          {/* Finance Metric Cards — 2×2 on mobile, 1×4 on desktop */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-6">
            {/* Revenue */}
            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md hidden sm:inline">Revenue</span>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Revenue</h3>
                <p className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(financeAnalysis.monthRevenue)}</p>
              </div>
            </div>

            {/* Net Profit/Loss */}
            <div className={`p-4 lg:p-6 rounded-2xl shadow-sm border flex flex-col justify-between group transition-colors ${financeAnalysis.netProfit >= 0 ? 'bg-slate-900 dark:bg-slate-950 border-slate-800' : 'bg-red-900 border-red-800'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="bg-white/10 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                  <IndianRupee className="w-5 h-5 text-white" />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md hidden sm:inline ${financeAnalysis.netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  {financeAnalysis.margin}%
                </span>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Net {financeAnalysis.netProfit >= 0 ? 'Profit' : 'Loss'}</h3>
                <p className="text-xl lg:text-3xl font-black text-white">{formatCurrency(financeAnalysis.netProfit)}</p>
              </div>
            </div>

            {/* Expenses */}
            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between group hover:border-red-100 dark:hover:border-red-900 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-red-50 dark:bg-red-900/30 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-md hidden sm:inline">Expense</span>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Expenses</h3>
                <p className="text-xl lg:text-3xl font-black text-red-600 dark:text-red-400">-{formatCurrency(financeAnalysis.monthExpenses)}</p>
              </div>
            </div>

            {/* Pending Due */}
            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between group hover:border-amber-100 dark:hover:border-amber-900 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-amber-50 dark:bg-amber-900/30 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md hidden sm:inline">Pending</span>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pending Due</h3>
                <p className="text-xl lg:text-3xl font-black text-amber-600 dark:text-amber-400">{formatCurrency(financeAnalysis.pendingDue)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
            {/* Financial Performance Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base lg:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  Financial Performance
                </h3>
              </div>
              {/* 16:9 aspect ratio on mobile */}
              <div className="aspect-video lg:h-80 lg:aspect-auto w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financeAnalysis.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(value) => `₹${value/1000}k`} dx={-5} />
                    <RechartsTooltip
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
                    <Bar dataKey="Income" name="Revenue Inflow" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Expense" name="Expense Outflow" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Goal + Recent Transactions — Stack on mobile */}
            <div className="flex flex-col gap-3 lg:gap-6">
              <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-28 h-28 bg-indigo-50 dark:bg-indigo-900/20 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm lg:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-500" />
                      Monthly Goal
                    </h3>
                    <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md hidden sm:inline">TARGET: {formatCurrency(TARGET_GOAL)}</span>
                  </div>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-lg lg:text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(financeAnalysis.monthRevenue)}</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Revenue</p>
                    </div>
                    <p className="text-xl lg:text-2xl font-black text-indigo-600 dark:text-indigo-400">{financeAnalysis.goalProgress}%</p>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${financeAnalysis.goalProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 text-right mt-1">{100 - Number(financeAnalysis.goalProgress)}% remaining</p>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60">
                <h3 className="text-sm lg:text-lg font-black text-slate-900 dark:text-white mb-3">Recent Transactions</h3>
                {financeAnalysis.recentTransactions.length === 0 ? (
                  <p className="text-sm font-medium text-slate-500 text-center py-6 bg-slate-50 rounded-xl">No recent transactions.</p>
                ) : (
                  <div className="space-y-4">
                    {financeAnalysis.recentTransactions.map((tx, idx) => (
                      <div key={idx} className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-700/60 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${tx.refType === 'Receipt' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                            {tx.refType === 'Receipt' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white max-w-[140px] sm:max-w-[180px] truncate" title={tx.description}>{tx.description}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{tx.date}</p>
                          </div>
                        </div>
                        <p className={`text-sm font-black ${tx.refType === 'Receipt' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.refType === 'Receipt' ? '+' : '-'}{formatCurrency(tx.credit || tx.debit)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>  {/* end flex-col */}
          </div>  {/* end lg:grid-cols-3 */}
        </div>
      )}

      {/* Work Tab Content */}
      {!loading && !error && activeTab === 'work' && workAnalysis && (
        <div className="space-y-4 lg:space-y-6">
          {/* Active Projects — single row on mobile */}
          <div className="bg-white dark:bg-slate-800/60 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex items-center gap-4 overflow-x-auto mobile-scroll group hover:border-blue-100 dark:hover:border-blue-900 transition-colors">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl"><Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Projects</h3>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{workAnalysis.activeProjectsCount}</p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl"><p className="text-lg font-black text-emerald-600">{workAnalysis.healthyCount}</p><p className="text-[9px] font-bold text-emerald-700 uppercase">Healthy</p></div>
              <div className="text-center bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl"><p className="text-lg font-black text-amber-600">{workAnalysis.atRiskCount}</p><p className="text-[9px] font-bold text-amber-700 uppercase">At Risk</p></div>
              <div className="text-center bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl"><p className="text-lg font-black text-red-600">{workAnalysis.criticalCount}</p><p className="text-[9px] font-bold text-red-700 uppercase">Critical</p></div>
            </div>
          </div>

          {/* Task Velocity + Tasks — 2-col grid on mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 lg:gap-6">
            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between group hover:border-indigo-100 dark:hover:border-indigo-900 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-xl"><Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-md hidden sm:inline">Rate</span>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Task Velocity</h3>
                <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">{workAnalysis.taskVelocity}%</p>
              </div>
            </div>
            <div className="bg-slate-900 dark:bg-slate-950 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-white/10 p-2.5 rounded-xl"><LayoutList className="w-5 h-5 text-white" /></div>
                <span className="text-[9px] font-black uppercase tracking-wider text-white bg-white/20 px-1.5 py-0.5 rounded-md hidden sm:inline">Filtered</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tasks</h3>
                  <p className="text-2xl lg:text-3xl font-black text-white">{workAnalysis.filteredTasks.length}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tickets</h3>
                  <p className="text-2xl lg:text-3xl font-black text-white">{workAnalysis.filteredTickets.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters — icon button toggles slide-down panel */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
            <button
              onClick={() => setShowFilters(f => !f)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Filter className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-bold">Filters</span>
                {(workFilters.status || workFilters.project || workFilters.client || workFilters.team) && (
                  <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full">Active</span>
                )}
              </div>
              <div className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </button>
            {showFilters && (
              <div className="px-4 pb-4 grid grid-cols-2 lg:grid-cols-4 gap-3 border-t border-slate-100 dark:border-slate-700/60 pt-3 animate-slide-down">
                <select value={workFilters.status} onChange={(e) => setWorkFilters(prev => ({...prev, status: e.target.value}))} className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl p-2.5 outline-none w-full">
                  <option value="">All Statuses</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </select>
                <select value={workFilters.project} onChange={(e) => setWorkFilters(prev => ({...prev, project: e.target.value}))} className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl p-2.5 outline-none w-full">
                  <option value="">All Projects</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                </select>
                <select value={workFilters.client} onChange={(e) => setWorkFilters(prev => ({...prev, client: e.target.value}))} className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl p-2.5 outline-none w-full">
                  <option value="">All Clients</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.businessName}</option>)}
                </select>
                <select value={workFilters.team} onChange={(e) => setWorkFilters(prev => ({...prev, team: e.target.value}))} className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl p-2.5 outline-none w-full">
                  <option value="">All Members</option>
                  {teamMembers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Filtered Tasks */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary-500" />
                  Filtered Tasks
                </h3>
                <span className="text-xs font-black bg-primary-100 text-primary-700 px-3 py-1 rounded-full">{workAnalysis.filteredTasks.length} found</span>
              </div>
              <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                {workAnalysis.filteredTasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <CheckCircle2 className="w-12 h-12 text-slate-200 mb-3" />
                    <p className="text-slate-500 font-bold">No tasks match your filters.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workAnalysis.filteredTasks.map(task => (
                      <div key={task.id} className="p-4 border border-slate-100 rounded-xl hover:border-primary-200 hover:shadow-sm transition-all bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-900">{task.title}</h4>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border ${
                            task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            task.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            task.status === 'Review' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mb-3">{workAnalysis.projectMap[task.projectId]?.projectName || 'No Project'}</p>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due: {task.dueDate || 'N/A'}</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{workAnalysis.userMap[task.assignedTo] || 'Unassigned'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Support Tickets */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Support Tickets
                </h3>
                <span className="text-xs font-black bg-red-100 text-red-700 px-3 py-1 rounded-full">{workAnalysis.filteredTickets.length} found</span>
              </div>
              <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                {workAnalysis.filteredTickets.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <XCircle className="w-12 h-12 text-slate-200 mb-3" />
                    <p className="text-slate-500 font-bold">No tickets match your filters.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workAnalysis.filteredTickets.map(ticket => (
                      <div key={ticket.id} className="p-4 border border-slate-100 rounded-xl hover:border-red-200 hover:shadow-sm transition-all bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-900">{ticket.subject}</h4>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border ${
                            ticket.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                            ticket.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mb-3">{workAnalysis.clientMap[ticket.clientId] || 'Internal'}</p>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{ticket.status}</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{workAnalysis.userMap[ticket.assigneeId] || 'Unassigned'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {!loading && !error && activeTab === 'performance' && performanceAnalysis && (
        <div className="space-y-6">
          
          {/* Production Rate, Attendance, Client Retention — 1×3 grid on mobile */}
          <div className="grid grid-cols-3 gap-2 lg:gap-6">
            <div className="bg-white dark:bg-slate-800/60 p-3 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl"><CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /></div>
              </div>
              <div>
                <h3 className="text-[9px] lg:text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Production</h3>
                <p className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white">{performanceAnalysis.prodRate}%</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800/60 p-3 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl"><Users className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
              </div>
              <div>
                <h3 className="text-[9px] lg:text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Attendance</h3>
                <p className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white">{performanceAnalysis.attRate}%</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800/60 p-3 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between group hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded-xl"><Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>
              </div>
              <div>
                <h3 className="text-[9px] lg:text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Retention</h3>
                <p className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white">{performanceAnalysis.clientRet}%</p>
              </div>
            </div>
          </div>

          {/* New Clients + New Projects — 1×2 grid on mobile */}
          <div className="grid grid-cols-2 gap-3 lg:gap-6">
            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2.5 rounded-xl"><ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
                <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">New Clients</h3>
              </div>
              <div className="relative z-10">
                <p className="text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400">+{performanceAnalysis.newClientsCount}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">This Month</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-xl"><Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /></div>
                <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">New Projects</h3>
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-black text-indigo-600 dark:text-indigo-400">+{performanceAnalysis.newProjectsCount}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">This Month</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top Performer Card */}
            {performanceAnalysis.topPerformer && (
              <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full z-0 group-hover:scale-125 transition-transform duration-500"></div>
                
                <div className="relative z-10 mb-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-500 to-purple-500 p-1 mx-auto shadow-xl">
                    {performanceAnalysis.topPerformer.profilePicture ? (
                      <img src={performanceAnalysis.topPerformer.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-slate-900" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center">
                        <span className="text-2xl font-black text-white">{performanceAnalysis.topPerformer.fullName.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-amber-400 text-amber-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-md whitespace-nowrap">
                    <Star className="w-3 h-3 fill-current" /> Top Performer
                  </div>
                </div>

                <div className="relative z-10 w-full">
                  <h3 className="text-2xl font-black text-white mb-1">{performanceAnalysis.topPerformer.fullName}</h3>
                  <p className="text-slate-400 font-bold text-sm mb-6">{performanceAnalysis.topPerformer.role}</p>

                  <div className="bg-black/20 rounded-xl p-4 w-full backdrop-blur-sm border border-white/5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Efficiency Score</p>
                    <p className="text-4xl font-black text-emerald-400">{performanceAnalysis.topPerformer.score}</p>
                    <div className="mt-3 text-xs font-bold text-slate-300 flex items-center justify-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" /> Team Performance is optimal
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Per Head Performance Table — horizontally scrollable */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden flex flex-col">
              <div className="p-4 lg:p-6 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                <div>
                  <h3 className="text-base lg:text-lg font-black text-slate-900 dark:text-white">Per-Head Performance</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">Swipe to see full table</p>
                </div>
              </div>
              <div className="overflow-x-auto flex-1 -webkit-overflow-scrolling-touch">
                <table className="w-full text-left" style={{minWidth: '560px'}}>
                  <thead className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Member</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">Tasks</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">Prod%</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">Att%</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">Projects</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">Tickets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {performanceAnalysis.headAnalysis.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {member.profilePicture ? (
                              <img src={member.profilePicture} alt="Avatar" className="w-7 h-7 rounded-full object-cover shadow-sm" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black text-xs">
                                {member.fullName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">{member.fullName}</p>
                              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{member.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center"><span className="text-sm font-black text-slate-700 dark:text-slate-200">{member.tasksDone}</span></td>
                        <td className="px-4 py-3 whitespace-nowrap text-center"><span className={`text-sm font-black ${Number(member.prodRate) > 75 ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-200'}`}>{member.prodRate}%</span></td>
                        <td className="px-4 py-3 whitespace-nowrap text-center"><span className={`text-sm font-black ${Number(member.attRate) > 85 ? 'text-emerald-600' : Number(member.attRate) < 50 ? 'text-red-600' : 'text-slate-700 dark:text-slate-200'}`}>{member.attRate}%</span></td>
                        <td className="px-4 py-3 whitespace-nowrap text-center"><span className="text-sm font-bold text-slate-500 dark:text-slate-400">{member.projectsCount}</span></td>
                        <td className="px-4 py-3 whitespace-nowrap text-center"><span className="text-sm font-black text-slate-700 dark:text-slate-200">{member.ticketsResolved}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;
