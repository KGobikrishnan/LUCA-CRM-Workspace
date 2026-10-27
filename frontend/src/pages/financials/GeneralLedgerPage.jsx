import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Search, Download, TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';
import api from '../../services/api';
import useDebounce from '../../hooks/useDebounce';
import { formatCurrency } from '../../utils/currency';

const GeneralLedgerPage = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Set default dates to current month
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/general-ledgers/report');
      setEntries(res.data);
    } catch (error) {
      console.error('Failed to fetch general ledger report', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Analysis Engine
  const analysis = useMemo(() => {
    let openingBalance = 0;
    let incomeThisPeriod = 0;
    let expensesThisPeriod = 0;

    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);
    
    // Normalize time to end of day for comparison
    toDateObj.setHours(23, 59, 59, 999);

    const filteredRows = [];
    let runningBalance = 0;

    // Entries are sorted chronologically from backend
    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const debit = Number(entry.debit || 0);
      const credit = Number(entry.credit || 0);

      // Pre-Period: Calculate Opening Balance
      if (entryDate < fromDateObj) {
        openingBalance += credit;
        openingBalance -= debit;
      } 
      // In-Period: Calculate Stats and Add to Table
      else if (entryDate >= fromDateObj && entryDate <= toDateObj) {
        incomeThisPeriod += credit;
        expensesThisPeriod += debit;

        // Apply search filter if necessary
        const matchesSearch = !debouncedSearch || 
          entry.refId?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
          entry.description?.toLowerCase().includes(debouncedSearch.toLowerCase());

        if (matchesSearch) {
          filteredRows.push({ ...entry }); // Store temp row
        }
      }
    });

    // Calculate running balance specifically for the displayed table
    runningBalance = openingBalance;
    const finalRows = filteredRows.map(row => {
      runningBalance += Number(row.credit || 0);
      runningBalance -= Number(row.debit || 0);
      return { ...row, balance: runningBalance };
    });

    const closingBalance = openingBalance + incomeThisPeriod - expensesThisPeriod;

    return {
      openingBalance,
      incomeThisPeriod,
      expensesThisPeriod,
      closingBalance,
      rows: finalRows.reverse() // Often desirable to see newest at top, but balance is sequential
    };
  }, [entries, fromDate, toDate, debouncedSearch]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 lg:space-y-6 max-w-[1400px] mx-auto print-container">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Ledger Management</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Unified view of all credits, debits, and balances.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4" /> Expert Ledger PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between no-print">
        <div className="flex items-center gap-4 bg-white dark:bg-slate-800/60 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 px-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From:</label>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent dark:bg-transparent outline-none focus:ring-0 p-0 border-none"
            />
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
          <div className="flex items-center gap-2 px-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To:</label>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent dark:bg-transparent outline-none focus:ring-0 p-0 border-none"
            />
          </div>
        </div>

        <div className="relative min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Search Reference ID, Description..." 
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-shadow"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Top Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print-cards">
        <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between print-card-override">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg">
              <Wallet className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Opening Balance</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(analysis.openingBalance)}</p>
        </div>

        <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between print-card-override">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Income This Period</p>
          </div>
          <p className="text-2xl font-black text-emerald-600">+{formatCurrency(analysis.incomeThisPeriod)}</p>
        </div>

        <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between print-card-override">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expenses This Period</p>
          </div>
          <p className="text-2xl font-black text-red-600">-{formatCurrency(analysis.expensesThisPeriod)}</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between print-card-override print-black">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/10 p-2 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Closing Balance</p>
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(analysis.closingBalance)}</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : analysis.rows.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"><BookOpen className="w-8 h-8 text-slate-300" /></div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No ledger entries</h3>
            <p className="text-slate-500 max-w-sm mt-1 mb-6">No transactions found for the selected period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 print-table">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Ref Type</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Ref ID</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-right text-[11px] font-black text-slate-500 uppercase tracking-wider">Debit (Out)</th>
                  <th className="px-6 py-4 text-right text-[11px] font-black text-slate-500 uppercase tracking-wider">Credit (In)</th>
                  <th className="px-6 py-4 text-right text-[11px] font-black text-slate-500 uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800/40 divide-y divide-slate-100 dark:divide-slate-700/50">
                {/* Print Opening Balance Row */}
                <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">As of {fromDate}</td>
                  <td colSpan="5" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Opening Balance</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-slate-900 dark:text-white">{formatCurrency(analysis.openingBalance)}</td>
                </tr>
                {/* Main Rows */}
                {analysis.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700 dark:text-slate-200">{row.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        row.refType === 'Receipt' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                        row.refType === 'Expense' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' :
                        'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                      }`}>
                        {row.refType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">{row.refId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-slate-200 max-w-[250px] truncate" title={row.description}>
                      {row.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-500">
                      {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-emerald-600">
                      {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-slate-900 dark:text-white">
                      {formatCurrency(row.balance)}
                    </td>
                  </tr>
                ))}
                {/* Print Closing Balance Row */}
                <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">End of Period</td>
                  <td colSpan="5" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Closing Balance</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-slate-900 dark:text-white">{formatCurrency(analysis.closingBalance)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

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
          .print-table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #e2e8f0 !important;
          }
          /* Custom Title for Print */
          .print-container::before {
            content: "General Ledger Report (Export)";
            display: block;
            font-size: 24px;
            font-weight: 900;
            margin-bottom: 24px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default GeneralLedgerPage;
