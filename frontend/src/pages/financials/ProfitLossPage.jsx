import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, IndianRupee, PieChart as PieChartIcon, Download, Filter, Target } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currency';

const ProfitLossPage = () => {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [clients, setClients] = useState([]);
  
  // Set default dates to current year to date (YTD) for better P&L
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0]; // Jan 1st of current year
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0]; // Today
  });
  
  const [selectedClient, setSelectedClient] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ledgerRes, clientsRes] = await Promise.all([
        api.get('/general-ledgers/report'),
        api.get('/clients')
      ]);
      setEntries(ledgerRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Failed to fetch P&L data', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Aggregation Engine
  const analysis = useMemo(() => {
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);
    toDateObj.setHours(23, 59, 59, 999);

    let totalRevenue = 0;
    let totalExpenses = 0;

    const incomeByCategory = {};
    const expensesByCategory = {};

    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      
      // Filter by Date
      if (entryDate >= fromDateObj && entryDate <= toDateObj) {
        
        // Filter by Client (if selected)
        if (selectedClient && entry.clientId !== selectedClient) {
          return; // Skip this entry
        }

        const debit = Number(entry.debit || 0);
        const credit = Number(entry.credit || 0);
        const category = entry.category || 'Uncategorized';

        if (entry.refType === 'Receipt') {
          totalRevenue += credit;
          incomeByCategory[category] = (incomeByCategory[category] || 0) + credit;
        } else if (entry.refType === 'Expense' || entry.refType === 'Payroll') {
          totalExpenses += debit;
          expensesByCategory[category] = (expensesByCategory[category] || 0) + debit;
        }
      }
    });

    const netProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    // Format for charts
    const pieData = Object.keys(expensesByCategory).map(key => ({
      name: key,
      value: expensesByCategory[key]
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    // Group by month for BarChart
    const monthlyDataMap = {};
    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= fromDateObj && entryDate <= toDateObj) {
        if (selectedClient && entry.clientId !== selectedClient) return;
        
        const monthYear = entryDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthlyDataMap[monthYear]) {
          monthlyDataMap[monthYear] = { name: monthYear, Income: 0, Expense: 0 };
        }
        monthlyDataMap[monthYear].Income += Number(entry.credit || 0);
        monthlyDataMap[monthYear].Expense += Number(entry.debit || 0);
      }
    });
    
    // Sort months chronologically
    const barData = Object.values(monthlyDataMap).sort((a, b) => {
      const dateA = new Date(a.name);
      const dateB = new Date(b.name);
      return dateA - dateB;
    });

    return { 
      totalRevenue, 
      totalExpenses, 
      netProfit, 
      margin, 
      incomeByCategory, 
      expensesByCategory,
      pieData,
      barData
    };
  }, [entries, fromDate, toDate, selectedClient]);

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString();

  return (
    <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto print-container pb-12">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Profit & Loss</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Financial performance report and analysis.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4" /> Export P&L
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-slate-800/60 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/60 no-print">
        <div className="flex items-center gap-2 text-slate-500 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-200">
          <Filter className="w-4 h-4 ml-1" />
          <span className="text-xs font-bold uppercase tracking-wider mr-2">Filters:</span>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-200">
          <label className="text-xs font-bold text-slate-500 uppercase">From:</label>
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent dark:bg-transparent outline-none cursor-pointer"
          />
          <span className="text-slate-300">|</span>
          <label className="text-xs font-bold text-slate-500 uppercase">To:</label>
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent dark:bg-transparent outline-none cursor-pointer"
          />
        </div>

        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 text-sm font-bold rounded-lg focus:ring-indigo-500 focus:border-primary-500 block p-2.5 outline-none ml-auto"
        >
          <option value="">All Clients (Global View)</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.businessName}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          <div className="h-32 bg-slate-100 rounded-2xl"></div>
          <div className="h-32 bg-slate-100 rounded-2xl"></div>
          <div className="h-32 bg-slate-100 rounded-2xl"></div>
          <div className="h-32 bg-slate-100 rounded-2xl"></div>
        </div>
      ) : (
        <>
          {/* Top Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print-cards">
            {/* Revenue */}
            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between print-card-override">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Income</p>
              </div>
              <p className="text-2xl font-black text-emerald-600">{formatCurrency(analysis.totalRevenue)}</p>
            </div>

            {/* Expenses */}
            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between print-card-override">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Expense</p>
              </div>
              <p className="text-2xl font-black text-red-600">{formatCurrency(analysis.totalExpenses)}</p>
            </div>

            {/* Net Profit */}
            <div className={`p-5 rounded-2xl shadow-sm border flex flex-col justify-between print-card-override print-black ${analysis.netProfit >= 0 ? 'bg-slate-900 border-slate-800' : 'bg-red-900 border-red-800'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/10 p-2 rounded-lg">
                  <IndianRupee className="w-5 h-5 text-white" />
                </div>
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Net {analysis.netProfit >= 0 ? 'Profit' : 'Loss'}</p>
              </div>
              <p className="text-2xl font-black text-white">{formatCurrency(analysis.netProfit)}</p>
            </div>
            
            {/* Margin */}
            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between print-card-override">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg">
                  <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Profit Margin</p>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{analysis.margin}%</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
            {/* Financial Overview Bar Chart */}
            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                Financial Overview
              </h3>
              <div className="h-72 w-full">
                {analysis.barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                      <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                      <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-400 dark:text-slate-500">No data available for this period.</div>
                )}
              </div>
            </div>

            {/* Expense Breakdown Pie Chart */}
            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-red-500" />
                Expense Breakdown
              </h3>
              <div className="h-72 w-full">
                {analysis.pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analysis.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {analysis.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-400 dark:text-slate-500">No expenses recorded for this period.</div>
                )}
              </div>
            </div>
          </div>

          {/* P&L Statement */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden print-statement">
            <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-center">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Profit & Loss Statement</h2>
              <div className="flex justify-center gap-6 mt-3">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="uppercase tracking-wider mr-1 text-slate-400 dark:text-slate-500">Period Selected:</span> {fromDate} <span className="mx-1">to</span> {toDate}
                </p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="uppercase tracking-wider mr-1 text-slate-400 dark:text-slate-500">Generated On:</span> {todayStr}
                </p>
              </div>
              {selectedClient && (
                <div className="mt-3">
                  <span className="inline-block text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg border border-primary-100">
                    Filtered by Client: {clients.find(c => c.id === selectedClient)?.businessName || 'Unknown'}
                  </span>
                </div>
              )}
            </div>

            <div className="p-8">
              <table className="w-full text-left border-collapse">
                <tbody>
                  {/* Income Section */}
                  <tr>
                    <td colSpan="2" className="py-3 border-b-2 border-slate-900 dark:border-slate-600 font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Income / Revenue</td>
                  </tr>
                  {Object.keys(analysis.incomeByCategory).length === 0 ? (
                    <tr>
                      <td className="py-3 text-sm font-medium text-slate-400 italic">No income recorded.</td>
                      <td className="py-3 text-right text-sm font-medium text-slate-400 dark:text-slate-500">₹0.00</td>
                    </tr>
                  ) : (
                    Object.entries(analysis.incomeByCategory).map(([category, amount]) => (
                      <tr key={category} className="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50/50 dark:bg-slate-900/30">
                        <td className="py-3 text-sm font-bold text-slate-700 dark:text-slate-300 pl-4">{category}</td>
                        <td className="py-3 text-right text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(amount)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-emerald-50/50 dark:bg-emerald-950/20">
                    <td className="py-4 text-sm font-black text-slate-900 dark:text-slate-100 pl-4 uppercase tracking-wider">Total Income</td>
                    <td className="py-4 text-right text-base font-black text-emerald-600">{formatCurrency(analysis.totalRevenue)}</td>
                  </tr>

                  {/* Spacer */}
                  <tr><td colSpan="2" className="py-4"></td></tr>

                  {/* Expenses Section */}
                  <tr>
                    <td colSpan="2" className="py-3 border-b-2 border-slate-900 dark:border-slate-650 font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Operating Expenses</td>
                  </tr>
                  {Object.keys(analysis.expensesByCategory).length === 0 ? (
                    <tr>
                      <td className="py-3 text-sm font-medium text-slate-400 italic">No expenses recorded.</td>
                      <td className="py-3 text-right text-sm font-medium text-slate-400 dark:text-slate-500">₹0.00</td>
                    </tr>
                  ) : (
                    Object.entries(analysis.expensesByCategory).map(([category, amount]) => (
                      <tr key={category} className="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50/50 dark:bg-slate-900/30">
                        <td className="py-3 text-sm font-bold text-slate-700 dark:text-slate-300 pl-4">{category}</td>
                        <td className="py-3 text-right text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(amount)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-red-50/50 dark:bg-red-950/20">
                    <td className="py-4 text-sm font-black text-slate-900 dark:text-slate-100 pl-4 uppercase tracking-wider">Total Expenses</td>
                    <td className="py-4 text-right text-base font-black text-red-600">{formatCurrency(analysis.totalExpenses)}</td>
                  </tr>

                  {/* Spacer */}
                  <tr><td colSpan="2" className="py-6"></td></tr>

                  {/* Net Profit Section */}
                  <tr className={analysis.netProfit >= 0 ? "bg-slate-900" : "bg-red-900"}>
                    <td className="py-5 px-6 rounded-l-xl text-base font-black text-white uppercase tracking-wider">Net {analysis.netProfit >= 0 ? 'Profit' : 'Loss'}</td>
                    <td className="py-5 px-6 rounded-r-xl text-right text-xl font-black text-white">{formatCurrency(analysis.netProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-cards {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 16px !important;
            margin-bottom: 24px !important;
          }
          .print-card-override {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            break-inside: avoid;
          }
          .print-black {
            background-color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-black p, .print-black svg {
            color: white !important;
          }
          .print-statement {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfitLossPage;
