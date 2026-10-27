import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Users, RefreshCw, Eye, CheckCircle2, Calculator, Wallet, Clock, Check, FileText, Printer, Shield, Info } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { useToast } from '../../components/common/Toast';
import { formatCurrency } from '../../utils/currency';

// Helper to convert number to currency words (simple Indian Rupee format)
const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numToWordsLessThanThousand = (n) => {
    if (n === 0) return '';
    let temp = '';
    if (n >= 100) {
      temp += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (temp !== '') temp += 'and ';
      if (n < 20) {
        temp += a[n];
      } else {
        temp += b[Math.floor(n / 10)] + ' ' + a[n % 10];
      }
    }
    return temp;
  };

  if (num === 0) return 'Zero';
  let words = '';
  
  // Crores
  if (Math.floor(num / 10000000) > 0) {
    words += numToWordsLessThanThousand(Math.floor(num / 10000000)) + 'Crore ';
    num %= 10000000;
  }
  // Lakhs
  if (Math.floor(num / 100000) > 0) {
    words += numToWordsLessThanThousand(Math.floor(num / 100000)) + 'Lakh ';
    num %= 100000;
  }
  // Thousands
  if (Math.floor(num / 1000) > 0) {
    words += numToWordsLessThanThousand(Math.floor(num / 1000)) + 'Thousand ';
    num %= 1000;
  }
  // Remaining
  words += numToWordsLessThanThousand(Math.floor(num));
  return words.trim() + ' Rupees Only';
};

const ViewPayslipModal = ({ isOpen, onClose, payroll, employeeName, employeeId, role }) => {
  const { selectedPeriod } = useAuthStore();
  
  if (!isOpen || !payroll) return null;

  const handlePrint = () => {
    window.print();
  };

  const periodLabel = () => {
    const [year, month] = payroll.payPeriod.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const earningsTotal = Number(payroll.basicSalary || 0) + Number(payroll.additions || 0) + Number(payroll.manualBonus || 0);
  const deductionsTotal = Number(payroll.deductions || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col print:shadow-none print:w-full print:max-w-full border border-slate-100 dark:border-slate-700/60 print:border-none">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 print:hidden">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-650" /> Official Payslip
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
        </div>

        {/* Printable Slips Document */}
        <div className="p-8 space-y-6 overflow-y-auto print:p-0 print:overflow-visible text-slate-800 dark:text-slate-200">
          
          {/* Slip Header Info */}
          <div className="flex justify-between items-start border-b pb-6 border-slate-200 dark:border-slate-700">
            <div>
              <h1 className="text-2xl font-black text-indigo-700 dark:text-indigo-400">NAVI PROMO</h1>
              <p className="text-xs text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Corporate Headquarters & Operations</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-450 text-[10px] font-black uppercase tracking-wider rounded-xl border border-indigo-150">
                Salary Payslip
              </span>
              <p className="text-xs font-black mt-2.5 text-slate-705 dark:text-slate-350">{periodLabel()}</p>
            </div>
          </div>

          {/* Employee Corporate Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-700/60 text-xs">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Employee Name</span>
              <span className="font-bold text-slate-805 dark:text-white">{employeeName}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Employee ID</span>
              <span className="font-bold text-slate-805 dark:text-white font-mono">{employeeId || 'EMP-XXXX'}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Designation</span>
              <span className="font-bold text-slate-805 dark:text-white">{role || 'Team Member'}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Payment Mode</span>
              <span className="font-bold text-slate-850 dark:text-white">Bank Transfer</span>
            </div>
          </div>

          {/* Core Pay Breakdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            {/* Earnings Column */}
            <div className="space-y-3">
              <h3 className="font-black text-xs text-indigo-700 dark:text-indigo-450 uppercase tracking-wider border-b pb-2 border-slate-200 dark:border-slate-700">Earnings Details</h3>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Basic Salary</span>
                <span className="font-bold">{formatCurrency(payroll.basicSalary)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Auto-Allowances (OT/Night)</span>
                <span className="font-bold">+{formatCurrency(payroll.additions || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b pb-3 border-dashed border-slate-200">
                <span className="text-slate-500 font-medium">Performance Bonus</span>
                <span className="font-bold">+{formatCurrency(payroll.manualBonus || 0)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 font-black">
                <span>Gross Earnings</span>
                <span className="text-indigo-650">{formatCurrency(earningsTotal)}</span>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="space-y-3">
              <h3 className="font-black text-xs text-red-650 dark:text-red-400 uppercase tracking-wider border-b pb-2 border-slate-200 dark:border-slate-700">Deductions Details</h3>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Loss of Pay (LOP) / Tax</span>
                <span className="font-bold text-red-500">-{formatCurrency(payroll.deductions || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b pb-3 border-dashed border-slate-200">
                <span className="text-slate-500 font-medium">Other Deductions</span>
                <span className="font-bold">₹0.00</span>
              </div>
              <div className="flex justify-between items-center pt-1 font-black">
                <span>Total Deductions</span>
                <span className="text-red-500">{formatCurrency(deductionsTotal)}</span>
              </div>
            </div>
          </div>

          {/* Net Salary Summary Block */}
          <div className="bg-indigo-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-0.5">Net Payable Salary</span>
              <p className="text-[11px] font-bold text-indigo-100 italic capitalize">{numberToWords(payroll.netPay)}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black">{formatCurrency(payroll.netPay)}</span>
            </div>
          </div>

          {/* Remarks/Remarks Footer */}
          <div className="text-xs text-slate-400 border-t pt-5 border-slate-200 dark:border-slate-700">
            <p className="font-bold text-slate-500 mb-1">Official Remarks:</p>
            <p className="italic font-medium">{payroll.notes || 'No remarks provided.'}</p>
            <p className="text-[10px] text-slate-450 mt-4 text-center">This is a system-generated corporate document and requires no physical signature.</p>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 flex justify-end gap-3 print:hidden">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">Close</button>
          <button onClick={handlePrint} className="px-5 py-2.5 text-sm font-black text-white bg-slate-900 hover:bg-black rounded-xl shadow-md transition-all flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>

      </div>
    </div>
  );
};

const AdjustPayrollModal = ({ isOpen, onClose, payroll, employeeName, onSuccess }) => {
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const { showToast } = useToast();

  useEffect(() => {
    if (payroll && isOpen) {
      reset({
        additions: payroll.additions || 0,
        manualBonus: payroll.manualBonus || 0,
        deductions: payroll.deductions || 0,
        notes: payroll.notes || `Generated for ${payroll.payPeriod}`
      });
    }
  }, [payroll, isOpen, reset]);

  const watchAdditions = useWatch({ control, name: 'additions' });
  const watchBonus = useWatch({ control, name: 'manualBonus' });
  const watchDeductions = useWatch({ control, name: 'deductions' });

  const netPayable = useMemo(() => {
    if (!payroll) return 0;
    const base = Number(payroll.basicSalary || 0);
    const adds = Number(watchAdditions || 0);
    const bonus = Number(watchBonus || 0);
    const deds = Number(watchDeductions || 0);
    return base + adds + bonus - deds;
  }, [payroll, watchAdditions, watchBonus, watchDeductions]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...payroll,
        additions: Number(data.additions),
        manualBonus: Number(data.manualBonus),
        deductions: Number(data.deductions),
        notes: data.notes,
        status: 'Processed',
        netPay: netPayable
      };
      
      await api.put(`/payroll/${payroll.id}`, payload);
      showToast('Payroll adjusted successfully!', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update payroll', error);
      showToast('Failed to adjust payroll.', 'error');
    }
  };

  if (!isOpen || !payroll) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-100 dark:border-slate-700/60 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Adjust Payroll
            </h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Modify employee salary breaks & performance payouts.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">✕</button>
        </div>
        
        <div className="p-6">
          <form id="payroll-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-150 dark:border-slate-700/60 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Employee</label>
                  <p className="font-bold text-slate-900 dark:text-white text-base">{employeeName}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Base Salary</label>
                  <p className="font-black text-slate-900 dark:text-white text-base">{formatCurrency(payroll.basicSalary)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Auto-Allowances (Night/OT)</label>
                <input type="number" step="0.01" {...register("additions")} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Manual Bonus</label>
                <input type="number" step="0.01" {...register("manualBonus")} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Total Deductions (LOP / Taxes)</label>
              <input type="number" step="0.01" {...register("deductions")} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Admin Remarks / Notes</label>
              <input type="text" {...register("notes")} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-150 flex justify-between items-center mt-6">
              <span className="font-bold text-indigo-800 dark:text-indigo-300">Net Payable</span>
              <span className="text-2xl font-black text-indigo-750 dark:text-indigo-400">{formatCurrency(netPayable)}</span>
            </div>
            
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">Cancel</button>
          <button type="submit" form="payroll-form" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-black text-white bg-slate-900 hover:bg-black rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save Adjustments'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PayrollPage = () => {
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const [payrolls, setPayrolls] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Set default period to current YYYY-MM
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [modalData, setModalData] = useState(null);
  const [payslipModalData, setPayslipModalData] = useState(null);

  const isAdmin = useMemo(() => {
    if (!user?.role) return false;
    const r = user.role.toLowerCase().replace(/[^a-z]/g, '');
    return r === 'superadmin' || r === 'admin';
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const isUserAdmin = user?.role && ['superadmin', 'admin'].includes(user.role.toLowerCase().replace(/[^a-z]/g, ''));
      const [payrollRes, userRes] = await Promise.all([
        isUserAdmin ? api.get(`/payroll?period=${selectedPeriod}`) : api.get('/payroll'),
        api.get('/users')
      ]);
      
      setPayrolls(payrollRes.data);
      
      const userMap = {};
      userRes.data.forEach(u => {
        userMap[u.id] = {
          fullName: u.fullName,
          employeeId: u.employeeId,
          role: u.role
        };
      });
      setUsers(userMap);
      
    } catch (error) {
      console.error('Failed to fetch data', error);
      showToast('Failed to load payroll data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, user]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await api.post(`/payroll/generate?period=${selectedPeriod}`);
      setPayrolls(res.data);
      showToast(`Generated payroll for ${selectedPeriod}`, 'success');
    } catch (error) {
      console.error('Failed to generate payroll', error);
      showToast('Failed to calculate payroll.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkDone = async (payroll) => {
    try {
      const payload = { ...payroll, status: 'Completed' };
      await api.put(`/payroll/${payroll.id}`, payload);
      showToast('Salary disbursed and marked as Paid!', 'success');
      fetchData(); // Refresh to update cards
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  // Calculations for Admin Console
  const stats = useMemo(() => {
    let total = 0;
    let disbursed = 0;
    let pending = 0;

    payrolls.forEach(p => {
      const amount = Number(p.netPay || 0);
      total += amount;
      if (p.status === 'Completed') {
        disbursed += amount;
      } else {
        pending += amount;
      }
    });

    return { total, disbursed, pending };
  }, [payrolls]);

  // Employee View Personal Payroll Record
  const personalPayroll = useMemo(() => {
    if (isAdmin) return null;
    return payrolls.find(p => p.userId === user?.id && p.payPeriod === selectedPeriod) || null;
  }, [payrolls, user, isAdmin, selectedPeriod]);

  const personalPayrollsList = useMemo(() => {
    if (isAdmin) return [];
    return payrolls
      .filter(p => p.userId === user?.id)
      .sort((a, b) => b.payPeriod.localeCompare(a.payPeriod));
  }, [payrolls, user, isAdmin]);

  // Format month title
  const formattedMonthTitle = useMemo(() => {
    if (!selectedPeriod) return '';
    const [year, month] = selectedPeriod.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [selectedPeriod]);

  // Printable Payslip click handler for employee
  const handleViewPayslipClick = () => {
    if (!personalPayroll) return;
    setPayslipModalData({
      payroll: personalPayroll,
      name: user.fullName,
      employeeId: user.employeeId,
      role: user.role
    });
  };

  return (
    <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* ---------------- ADMIN VIEW ---------------- */}
      {isAdmin && (
        <>
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60">
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Payroll Management</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">Automated corporate salary calculation & disbursements.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input 
                type="month" 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-205 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-auto text-slate-900 dark:text-white"
              />
              <button 
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-black font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-70 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} /> 
                {generating ? 'Calculating...' : 'Calculate Sheet'}
              </button>
            </div>
          </div>

          {/* Top Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex items-center gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Payroll Cost</p>
                <p className="text-xl lg:text-2xl font-black text-slate-905 dark:text-white">{formatCurrency(stats.total)}</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex items-center gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Disbursed (Paid)</p>
                <p className="text-xl lg:text-2xl font-black text-emerald-600">{formatCurrency(stats.disbursed)}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex items-center gap-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl text-amber-600 dark:text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pending Payouts</p>
                <p className="text-xl lg:text-2xl font-black text-amber-600">{formatCurrency(stats.pending)}</p>
              </div>
            </div>
          </div>

          {/* Main Table Area */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center">
              <h2 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-indigo-650" /> Salary Sheet
              </h2>
              <span className="text-xs font-black bg-white dark:bg-slate-800/60 px-3 py-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                {formattedMonthTitle}
              </span>
            </div>

            {loading ? (
              <div className="p-16 text-center text-slate-500 font-bold animate-pulse">Loading salary records...</div>
            ) : payrolls.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4"><Users className="w-8 h-8 text-slate-400 dark:text-slate-500" /></div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">No payroll records generated</h3>
                <p className="text-slate-500 text-sm max-w-sm mt-1 mb-6">Click Calculate Sheet to automatically generate payroll records based on employees attendance and basic packages.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/60">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Base Salary</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Additions</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deductions</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Pay</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {payrolls.map(pay => {
                      const empInfo = users[pay.userId] || { fullName: 'Unknown User', employeeId: 'EMP-XXXX' };
                      return (
                        <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">{empInfo.fullName}</div>
                            <div className="text-[10px] text-slate-500 font-medium font-mono mt-0.5">{empInfo.employeeId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-650 dark:text-slate-300">
                            {formatCurrency(pay.basicSalary)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                            +{formatCurrency(Number(pay.additions || 0) + Number(pay.manualBonus || 0))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-500">
                            -{formatCurrency(pay.deductions)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-indigo-700 dark:text-indigo-400">
                            {formatCurrency(pay.netPay)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                              pay.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                              pay.status === 'Processed' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' :
                              'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                            }`}>
                              {pay.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-2">
                              {pay.status !== 'Completed' ? (
                                <>
                                  <button 
                                    onClick={() => setModalData({ payroll: pay, name: empInfo.fullName })}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:bg-indigo-900/30 rounded-xl transition-all border border-slate-100 dark:border-slate-700/60 shadow-sm"
                                    title="Adjust Allowances"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleMarkDone(pay)}
                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:bg-emerald-950/30 rounded-xl transition-all border border-slate-100 dark:border-slate-700/60 shadow-sm"
                                    title="Disburse Payout"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setPayslipModalData({ payroll: pay, name: empInfo.fullName, employeeId: empInfo.employeeId, role: empInfo.role })}
                                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-all"
                                  title="View Payslip"
                                >
                                  <FileText className="w-3.5 h-3.5" /> Slip
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ---------------- EMPLOYEE VIEW ---------------- */}
      {!isAdmin && (
        <>
          {/* Header & Month Picker */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60">
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">My Payslips Portal</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">Review your monthly disbursements and download formal payslips.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Pay Period:</span>
              <input 
                type="month" 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-205 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white w-full sm:w-auto"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-505 font-bold animate-pulse">Syncing personal earnings...</div>
          ) : (
            <>
              {!personalPayroll ? (
                <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-16 flex flex-col items-center justify-center text-center mb-6">
                  <div className="w-16 h-16 bg-slate-55 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4"><Calculator className="w-8 h-8 text-slate-400" /></div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">No salary details generated</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Salary sheet for {formattedMonthTitle} has not been compiled by the Admin yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mb-6">
                  
                  {/* Personal earnings detail columns */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 font-black text-slate-900 dark:text-white mb-4 text-base border-b pb-3 flex items-center gap-2">
                      <h3 className="font-black text-slate-900 dark:text-white mb-4 text-base border-b pb-3 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-indigo-650" /> Salary Breakdown ({formattedMonthTitle})
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Base Salary</span>
                          <span className="text-base font-black text-slate-800 dark:text-slate-200">{formatCurrency(personalPayroll.basicSalary)}</span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Allowances & Bonus</span>
                          <span className="text-base font-black text-emerald-600">+{formatCurrency(Number(personalPayroll.additions || 0) + Number(personalPayroll.manualBonus || 0))}</span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Deductions</span>
                          <span className="text-base font-black text-red-500">-{formatCurrency(personalPayroll.deductions)}</span>
                        </div>

                        <div className="bg-indigo-900 text-white p-4 rounded-xl flex flex-col justify-center">
                          <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block mb-1">Net Pay</span>
                          <span className="text-lg font-black">{formatCurrency(personalPayroll.netPay)}</span>
                        </div>
                      </div>

                      {personalPayroll.notes && (
                        <div className="mt-5 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 flex items-start gap-2.5">
                          <Info className="w-4.5 h-4.5 text-indigo-650 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-0.5">Corporate Note:</span>
                            <span className="font-medium text-slate-600 dark:text-slate-400 italic">"{personalPayroll.notes}"</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payslip Print Action Card */}
                  <div className="lg:col-span-1 bg-white dark:bg-slate-800/60 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mb-4 border border-indigo-100/50">
                      <FileText className="w-10 h-10 text-indigo-650" />
                    </div>
                    
                    <h3 className="font-black text-slate-900 dark:text-white text-base">Monthly Salary Slip</h3>
                    <p className="text-xs font-bold text-slate-450 dark:text-slate-400 mt-0.5">{formattedMonthTitle}</p>
                    
                    <div className="w-full mt-5 mb-6 py-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/60">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Disbursement Status</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        personalPayroll.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {personalPayroll.status === 'Completed' ? 'Disbursed / Paid' : 'Pending Processing'}
                      </span>
                    </div>

                    <button 
                      onClick={handleViewPayslipClick}
                      className="w-full py-3 bg-slate-900 hover:bg-black text-white font-black rounded-xl text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 uppercase"
                    >
                      <Eye className="w-4 h-4" /> View / Print Payslip
                    </button>
                  </div>

                </div>
              )}

              {/* Past Disbursements History Section */}
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-4 lg:p-6">
                <div className="mb-4">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-650" /> Past Disbursements History
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">A complete list of your past salary payslips and payment statuses.</p>
                </div>
                
                {personalPayrollsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-medium">No past payslip records found.</div>
                ) : (
                  <>
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/60">
                          <tr>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pay Period</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Base Salary</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Additions</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deductions</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Pay</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {personalPayrollsList.map(pay => {
                            const [year, month] = pay.payPeriod.split('-');
                            const dateLabel = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                            return (
                              <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-800 dark:text-slate-200">
                                  {dateLabel}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-650 dark:text-slate-300">
                                  {formatCurrency(pay.basicSalary)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                                  +{formatCurrency(Number(pay.additions || 0) + Number(pay.manualBonus || 0))}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-500">
                                  -{formatCurrency(pay.deductions)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-indigo-700 dark:text-indigo-400">
                                  {formatCurrency(pay.netPay)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                    pay.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                                    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                                  }`}>
                                    {pay.status === 'Completed' ? 'Paid' : 'Pending'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <button
                                    onClick={() => setPayslipModalData({ payroll: pay, name: user.fullName, employeeId: user.employeeId, role: user.role })}
                                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1 transition-all inline-flex align-middle"
                                    title="View Payslip"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card List View */}
                    <div className="md:hidden space-y-4">
                      {personalPayrollsList.map(pay => {
                        const [year, month] = pay.payPeriod.split('-');
                        const dateLabel = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                        return (
                          <div key={pay.id} className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-black text-slate-800 dark:text-slate-200">{dateLabel}</span>
                              <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                                pay.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {pay.status === 'Completed' ? 'Paid' : 'Pending'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase font-bold">Base</span>
                                <span className="font-bold text-slate-700 dark:text-slate-350">{formatCurrency(pay.basicSalary)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase font-bold">Net Payable</span>
                                <span className="font-black text-indigo-650 dark:text-indigo-400">{formatCurrency(pay.netPay)}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => setPayslipModalData({ payroll: pay, name: user.fullName, employeeId: user.employeeId, role: user.role })}
                              className="w-full py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Payslip
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Corporate payslip modal view */}
      {payslipModalData && (
        <ViewPayslipModal 
          isOpen={!!payslipModalData}
          onClose={() => setPayslipModalData(null)}
          payroll={payslipModalData.payroll}
          employeeName={payslipModalData.name}
          employeeId={payslipModalData.employeeId}
          role={payslipModalData.role}
        />
      )}

      {/* Adjust payroll overrides modal (Admin only) */}
      {modalData && (
        <AdjustPayrollModal 
          isOpen={!!modalData} 
          onClose={() => setModalData(null)} 
          payroll={modalData.payroll} 
          employeeName={modalData.name}
          onSuccess={fetchData} 
        />
      )}
    </div>
  );
};

export default PayrollPage;
