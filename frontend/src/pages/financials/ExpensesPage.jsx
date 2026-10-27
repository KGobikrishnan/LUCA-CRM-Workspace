import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Search, Filter, CreditCard, Plus, ArrowLeft, Building2, CheckCircle2, LayoutGrid, LayoutList, Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/common/Toast';
import useDebounce from '../../hooks/useDebounce';
import { formatCurrency } from '../../utils/currency';

// Data Maps for Categories
const CATEGORY_MAP = {
  'Fixed': {
    'Operations (OPEX)': ['Employee & HR', 'Software & Tools', 'Office & Administrative', 'Web & Tech Infrastructure'],
    'Financial & Compliance': ['Professional & Legal', 'Tax & Government']
  },
  'Variable': {
    'Delivery (COGS)': ['Marketing & Advertising', 'Content & Production', 'Sales & Client Servicing', 'Travel & Logistics'],
    'Operations (OPEX)': ['Maintenance & Repair', 'Training & Development'],
    'Financial & Compliance': ['Finance & Banking'],
    'Growth & Assets': ['Miscellaneous']
  },
  'One-Time': {
    'Delivery (COGS)': ['Marketing & Advertising', 'Content & Production', 'Sales & Client Servicing', 'Travel & Logistics'],
    'Operations (OPEX)': ['Maintenance & Repair', 'Training & Development'],
    'Financial & Compliance': ['Finance & Banking'],
    'Growth & Assets': ['Depreciation & Assets', 'Miscellaneous']
  }
};

const SPECIFIC_ITEMS_MAP = {
  'Software & Tools': ['API Credits (OpenAI, Maps)', 'Cloud Hosting (AWS, Vercel)', 'Premium Plugins', 'Third-party APIs'],
  'Web & Tech Infrastructure': ['Domain Registration', 'SSL Certificates', 'Theme Purchases'],
  'Content & Production': ['Stock Images/Videos', 'Voiceover Services', 'Content Writing (Freelance)'],
  'Employee & HR': ['Salaries', 'Internship Stipends', 'Employee Insurance', 'Referral Bonus'],
  'Office & Administrative': ['Office Rent', 'Electricity Bill', 'Internet/Wi-Fi', 'Stationery', 'Water/Tea/Coffee'],
  'Maintenance & Repair': ['Laptop Service', 'AC Repair', 'Office Cleaning/Deep Clean'],
  'Travel & Logistics': ['Client Meeting Travel', 'Fuel', 'Courier Charges', 'Team Dinner'],
  'Marketing & Advertising': ['Facebook/Meta Ads', 'Google Ads', 'LinkedIn Premium', 'Business Cards', 'Event Sponsorship'],
  'Sales & Client Servicing': ['Facebook/Meta Ads', 'Google Ads', 'LinkedIn Premium', 'Business Cards', 'Event Sponsorship'], // Fallback mapping based on prompt structure
  'Depreciation & Assets': ['New Laptops', 'Office Furniture', 'UPS/Inverters', 'Cameras'],
  'Tax & Government': ['GST Payment', 'TDS Filing', 'Professional Tax'],
  'Finance & Banking': ['Bank Service Charges', 'Payment Gateway Fees (Razorpay/Stripe)', 'Forex Conversion Fees']
};

const NewExpenseModal = ({ isOpen, onClose, onSuccess, clients, editExpense = null }) => {
  const [step, setStep] = useState(1);
  const [selectedNature, setSelectedNature] = useState('');
  const [users, setUsers] = useState([]);
  
  const { register, control, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      expenseNature: '',
      category: '',
      expenseId: 'Auto-generated on save',
      incurredOn: new Date().toISOString().split('T')[0],
      paymentSource: 'Company Bank',
      paymentMode: 'Bank Transfer'
    }
  });

  useEffect(() => {
    if (isOpen) {
      api.get('/users')
        .then(res => setUsers(res.data.filter(u => u.isActive)))
        .catch(err => console.error("Failed to fetch users", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (editExpense) {
      setSelectedNature(editExpense.expenseNature);
      setStep(2); // Skip Step 1 (Nature & Category select) on edit
      reset({
        expenseNature: editExpense.expenseNature || '',
        category: editExpense.category || '',
        specificItem: editExpense.specificItem || '',
        expenseTitle: editExpense.expenseTitle || '',
        clientId: editExpense.clientId || '',
        userId: editExpense.userId || '',
        payPeriod: editExpense.payPeriod || '',
        vendor: editExpense.vendor || '',
        paymentSource: editExpense.paymentSource || 'Company Bank',
        paymentMode: editExpense.paymentMode || 'Bank Transfer',
        amount: editExpense.amount || 0,
        totalAmount: editExpense.totalAmount || 0,
        payableAmount: editExpense.payableAmount || 0,
        transactionId: editExpense.transactionId || '',
        description: editExpense.description || '',
        incurredOn: editExpense.incurredOn || editExpense.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        expenseId: editExpense.expenseId || ''
      });
    } else {
      setSelectedNature('');
      setStep(1);
      reset({
        expenseNature: '',
        category: '',
        specificItem: '',
        expenseTitle: '',
        clientId: '',
        userId: '',
        payPeriod: '',
        vendor: '',
        paymentSource: 'Company Bank',
        paymentMode: 'Bank Transfer',
        amount: '',
        totalAmount: '',
        payableAmount: '',
        transactionId: '',
        description: '',
        incurredOn: new Date().toISOString().split('T')[0],
        expenseId: 'Auto-generated on save'
      });
    }
  }, [editExpense, reset, isOpen]);

  const { showToast } = useToast();
  const watchCategory = useWatch({ control, name: 'category' });
  const watchSpecificItem = useWatch({ control, name: 'specificItem' });
  const watchUserId = useWatch({ control, name: 'userId' });

  useEffect(() => {
    if (watchUserId && users.length > 0) {
      const selectedUser = users.find(u => u.id === watchUserId);
      if (selectedUser) {
        setValue('vendor', selectedUser.fullName);
      }
    }
  }, [watchUserId, users, setValue]);

  // Handle nature selection
  const handleNatureSelect = (nature) => {
    setSelectedNature(nature);
    setValue('expenseNature', nature);
    setValue('category', ''); // Reset category
  };

  // Move to step 2 when category is selected
  const handleCategorySelect = (cat) => {
    setValue('category', cat);
    setStep(2);
  };

  const getSpecificItems = () => {
    if (!watchCategory) return [];
    return SPECIFIC_ITEMS_MAP[watchCategory] || ['Other'];
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        createdAt: editExpense ? editExpense.createdAt : new Date().toISOString()
      };
      
      if (payload.expenseId === 'Auto-generated on save') {
        payload.expenseId = '';
      }

      if (editExpense) {
        await api.put(`/expenses/${editExpense.id}`, payload);
        showToast('Expense updated successfully!', 'success');
      } else {
        await api.post('/expenses', payload);
        showToast('Expense recorded successfully!', 'success');
      }
      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Failed to save expense', error);
      showToast('Failed to save expense.', 'error');
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedNature('');
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 shrink-0">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {step === 1 ? 'Nature & Category' : 'Expense Details'}
          </h2>
          <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-700 shadow-sm p-1.5 rounded-md border border-slate-200 dark:border-slate-600">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-800 custom-scrollbar">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Nature Selection */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">1. Select Expense Nature</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  
                  <button type="button" onClick={() => handleNatureSelect('Fixed')} className={`text-left p-4 rounded-xl border-2 transition-all ${selectedNature === 'Fixed' ? 'border-primary-500 bg-indigo-50 dark:bg-indigo-900/30/50 ring-4 ring-primary-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <h4 className="font-bold text-slate-900 dark:text-white">Fixed</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Recurring (Rent, Salaries)</p>
                  </button>

                  <button type="button" onClick={() => handleNatureSelect('Variable')} className={`text-left p-4 rounded-xl border-2 transition-all ${selectedNature === 'Variable' ? 'border-primary-500 bg-indigo-50 dark:bg-indigo-900/30/50 ring-4 ring-primary-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <h4 className="font-bold text-slate-900 dark:text-white">Variable</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Fluctuating (Ads, Travel)</p>
                  </button>

                  <button type="button" onClick={() => handleNatureSelect('One-Time')} className={`text-left p-4 rounded-xl border-2 transition-all ${selectedNature === 'One-Time' ? 'border-primary-500 bg-indigo-50 dark:bg-indigo-900/30/50 ring-4 ring-primary-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <h4 className="font-bold text-slate-900 dark:text-white">One-Time</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Assets, Equipments, Repairs</p>
                  </button>

                </div>
              </div>

              {/* Category Selection */}
              {selectedNature && (
                <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">2. Select Category</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(CATEGORY_MAP[selectedNature]).map(([groupName, categories]) => (
                      <div key={groupName} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase">{groupName}</h4>
                        <div className="space-y-2">
                          {categories.map(cat => (
                            <button key={cat} type="button" onClick={() => handleCategorySelect(cat)} className="w-full text-left px-4 py-2.5 rounded-lg bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 hover:border-indigo-300 hover:shadow-sm text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-between group">
                              {cat}
                              <ArrowLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 rotate-180 text-primary-500 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {step === 2 && (
            <form id="expense-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
              
              {/* Context Banner */}
              <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-primary-100 rounded-xl p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white dark:bg-slate-800/60 p-2 rounded-lg shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400/80 uppercase tracking-wider">{selectedNature} Expense</p>
                    <p className="text-sm font-bold text-primary-900">{watchCategory}</p>
                  </div>
                </div>
                {!editExpense && (
                  <button type="button" onClick={() => setStep(1)} className="text-xs font-bold bg-white px-3 py-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 border border-primary-200 shadow-sm hover:bg-indigo-50 dark:bg-indigo-900/30 transition-colors">Change</button>
                )}
              </div>

              {/* Primary Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Expense Name/Title *</label>
                  <input type="text" {...register("expenseTitle", { required: true })} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Monthly AWS Bill" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Specific Item *</label>
                  <select {...register("specificItem", { required: true })} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Select Specific Item</option>
                    {getSpecificItems().map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Associated Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Link Client (Optional)</label>
                  <select {...register("clientId")} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">-- No Client Linked --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.businessName}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Paid To (Vendor) *</label>
                  <input type="text" {...register("vendor", { required: true })} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Amazon Web Services" />
                </div>
              </div>

              {watchCategory === 'Employee & HR' && watchSpecificItem === 'Salaries' && (
                <div className="grid grid-cols-2 gap-6 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1.5">Select Employee *</label>
                    <select {...register("userId", { required: true })} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="">-- Select Employee --</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1.5">Pay Period *</label>
                    <input type="month" {...register("payPeriod", { required: true })} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
              )}

              {/* Financials Box */}
              <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Financial Breakdown</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Base Amount</label>
                    <input type="number" step="0.01" {...register("amount")} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Total Bill Value</label>
                    <input type="number" step="0.01" {...register("totalAmount")} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">Payable Amount (Paid) *</label>
                    <input type="number" step="0.01" {...register("payableAmount", { required: true })} className="w-full bg-white border-2 border-primary-200 rounded-lg p-2.5 text-sm font-black text-indigo-700 dark:text-indigo-400 focus:border-primary-500 outline-none shadow-[0_0_0_2px_rgba(79,70,229,0.1)]" placeholder="0.00" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Source</label>
                    <select {...register("paymentSource")} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="Company Bank">Company Bank</option>
                      <option value="Company Card">Company Card</option>
                      <option value="Petty Cash">Petty Cash</option>
                      <option value="Owner Personal Pocket">Owner Personal Pocket</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Mode</label>
                    <select {...register("paymentMode")} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date Incurred *</label>
                  <input type="date" {...register("incurredOn", { required: true })} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Transaction ID / Reference</label>
                  <input type="text" {...register("transactionId")} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Receipt No. or Txn ID" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description / Notes</label>
                <textarea {...register("description")} rows="2" className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Additional details regarding this expense..."></textarea>
              </div>

            </form>
          )}

        </div>

        {/* Modal Footer */}
        {step === 2 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 flex justify-between items-center shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-b-2xl">
            <button type="button" onClick={() => setStep(1)} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={handleClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-300 dark:border-slate-600">Cancel</button>
              <button type="submit" form="expense-form" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 shadow-md transition-colors flex items-center gap-2">
                {isSubmitting ? 'Saving...' : (editExpense ? 'Update Expense' : 'Record Expense')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [viewMode, setViewMode] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'list';
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [natureFilter, setNatureFilter] = useState('All');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expRes, cliRes] = await Promise.all([
        api.get('/expenses').catch(() => ({ data: [] })),
        api.get('/clients').catch(() => ({ data: [] }))
      ]);
      setExpenses(expRes.data);
      setClients(cliRes.data);
    } catch (error) {
      console.error('Failed to fetch', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await api.delete(`/expenses/${id}`);
        showToast('Expense deleted successfully', 'success');
        fetchData();
      } catch (err) {
        console.error(err);
        showToast('Failed to delete expense', 'error');
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalOutflow = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + Number(exp.payableAmount || exp.amount || 0), 0);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const searchMatch = !debouncedSearch || 
                          exp.expenseTitle?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                          exp.vendor?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                          exp.expenseId?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const natureMatch = natureFilter === 'All' || exp.expenseNature === natureFilter || 
                          (natureFilter === 'Operations' && exp.category?.includes('Operations')) ||
                          (natureFilter === 'Delivery' && exp.category?.includes('Delivery')) ||
                          (natureFilter === 'Personal' && exp.paymentSource === 'Owner Personal Pocket');

      return searchMatch && natureMatch;
    }).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [expenses, debouncedSearch, natureFilter]);

  return (
    <div className="space-y-4 lg:space-y-6 max-w-[1400px] mx-auto">
      {/* Header & Total Outflow */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Expenses Command Center</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Track outgoing money and vendor payments.</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="bg-slate-50 px-5 py-3 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Outflow</span>
            <span className="text-2xl font-black text-red-600 tracking-tight">{formatCurrency(totalOutflow)}</span>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Record Expense
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800/60 p-1.5 rounded-xl shadow-sm border border-slate-200">
          {['All', 'Delivery', 'Operations', 'Personal'].map(filter => (
            <button 
              key={filter}
              onClick={() => setNatureFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${natureFilter === filter ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="relative min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search expense title, vendor, ID..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-shadow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            <button 
              type="button"
              onClick={() => setViewMode('list')} 
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
              title="List View"
            >
              <LayoutList className="w-4.5 h-4.5" />
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('grid')} 
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-8 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"><CreditCard className="w-8 h-8 text-slate-400 dark:text-slate-500" /></div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No expenses logged</h3>
          <p className="text-slate-500 max-w-sm mt-1 mb-6">Record an expense to see it in your command center.</p>
          <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">Record Expense</button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden animate-in fade-in duration-300">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700/50">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Expense Details</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Category / Domain</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Context</th>
                <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Payable AMT</th>
                <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800/40 divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredExpenses.map(exp => {
                const clientObj = clients.find(c => c.id === exp.clientId);
                return (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{exp.incurredOn || exp.createdAt?.split('T')[0] || '-'}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{exp.expenseId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{exp.expenseTitle || '-'}</div>
                      <div className="text-xs font-medium text-slate-500 mt-0.5">Paid to: <span className="font-bold text-slate-700 dark:text-slate-200">{exp.vendor || '-'}</span></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          exp.expenseNature === 'Fixed' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' : 
                          exp.expenseNature === 'Variable' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400'
                        }`}>
                          {exp.expenseNature}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{exp.category}</span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 truncate max-w-[200px]" title={exp.specificItem}>↳ {exp.specificItem}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {clientObj ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md border border-slate-200">
                          <Building2 className="w-3 h-3 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
                          <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{clientObj.businessName}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-400 italic">Internal</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(exp.payableAmount || exp.amount || 0)}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{exp.paymentMode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelectedExpense(exp); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteExpense(exp.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {filteredExpenses.map(exp => {
            const clientObj = clients.find(c => c.id === exp.clientId);
            return (
              <div key={exp.id} className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between h-full relative group">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{exp.expenseId}</span>
                      <p className="text-[11px] text-slate-400 mt-2 font-medium">
                        {exp.incurredOn || exp.createdAt?.split('T')[0] || '-'}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      exp.expenseNature === 'Fixed' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' : 
                      exp.expenseNature === 'Variable' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400'
                    }`}>
                      {exp.expenseNature}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white mb-1 line-clamp-2">
                    {exp.expenseTitle || '-'}
                  </h3>
                  <div className="text-xs font-semibold text-slate-500 mb-4">
                    Paid to: <span className="font-bold text-slate-700 dark:text-slate-200">{exp.vendor || '-'}</span>
                  </div>

                  <div className="space-y-2 mb-4 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Category</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{exp.category}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Domain</span>
                      <span className="text-[11px] font-medium text-slate-500 truncate block">↳ {exp.specificItem}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4 mt-auto">
                  <div className="flex justify-between items-center gap-4 mb-4">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Payable Amount</span>
                      <span className="text-lg font-black text-red-600">{formatCurrency(exp.payableAmount || exp.amount || 0)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Context</span>
                      {clientObj ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-750 rounded border border-slate-200">
                          <Building2 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 truncate max-w-[80px]">{clientObj.businessName}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 italic">Internal</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-50 dark:border-slate-800 pt-3">
                    <div>
                      <span className="text-slate-400 block mb-0.5 font-medium">Source</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{exp.paymentSource}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5 font-medium">Reference</span>
                      <span className="font-mono text-[10px] text-slate-600 bg-slate-50 dark:bg-slate-750 px-1 py-0.5 rounded block truncate" title={exp.transactionId}>{exp.transactionId || '-'}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1 pt-2 mt-3 border-t border-slate-50 dark:border-slate-800">
                    <button onClick={() => { setSelectedExpense(exp); setIsModalOpen(true); }} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-600 rounded-xl transition-all" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteExpense(exp.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-xl transition-all" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NewExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedExpense(null); }} 
        onSuccess={fetchData} 
        clients={clients} 
        editExpense={selectedExpense}
      />
    </div>
  );
};

export default ExpensesPage;
