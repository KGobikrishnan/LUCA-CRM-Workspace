import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Banknote, Check, X, Search, LayoutGrid, List, FileText, Calendar, User, Info } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { useToast } from '../../components/common/Toast';
import { formatCurrency } from '../../utils/currency';

const NewReimbursementModal = ({ isOpen, onClose, onSuccess }) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const { showToast } = useToast();
  const { user } = useAuthStore();

  const onSubmit = async (data) => {
    try {
      const payload = { 
        category: data.category,
        amount: Number(data.amount),
        description: data.description,
        userId: user?.id, 
        status: 'Pending',
        receiptUrl: data.file?.[0] ? `https://dummy-bucket.s3.amazonaws.com/${data.file[0].name}` : null
      };
      await api.post('/reimbursements', payload);
      showToast('Reimbursement claim submitted successfully!', 'success');
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to submit reimbursement', error);
      showToast('Failed to submit claim.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700/60">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Claim Reimbursement</h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Request payback for business expenses.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
        </div>
        
        <div className="p-6">
          <form id="reimb-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Expense Category *</label>
              <select {...register("category", { required: true })} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="Travel">Travel & Fuel</option>
                <option value="Meals">Business Meals</option>
                <option value="Supplies">Office Supplies</option>
                <option value="Hardware">Hardware / Tools</option>
                <option value="Internet">Internet / Phone Bill</option>
                <option value="Other">Other Expenses</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Amount (₹) *</label>
              <input 
                type="number" 
                step="0.01" 
                {...register("amount", { required: true })} 
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Description *</label>
              <textarea 
                rows="3"
                {...register("description", { required: true })} 
                placeholder="Describe what this expense was for..."
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Receipt Document</label>
              <input 
                type="file" 
                {...register("file")} 
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
              />
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">Cancel</button>
          <button type="submit" form="reimb-form" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-black text-white bg-slate-900 hover:bg-black rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
            {isSubmitting ? 'Submitting...' : 'Submit Claim'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReimbursementsPage = () => {
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const [claims, setClaims] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' or 'History'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'list';
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reimbRes, userRes] = await Promise.all([
        api.get('/reimbursements').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] }))
      ]);
      setClaims(reimbRes.data);
      setUsers(userRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      showToast('Failed to sync reimbursement records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isAdmin = useMemo(() => {
    if (!user?.role) return false;
    const r = user.role.toLowerCase().replace(/[^a-z]/g, '');
    return r === 'superadmin' || r === 'admin';
  }, [user]);

  // Access Control: Admins see all, employees see ONLY their own requests
  const visibleClaims = useMemo(() => {
    if (!user) return [];
    
    let mapped = claims.map(c => {
      const applicant = users.find(u => u.id === c.userId);
      return { ...c, applicant };
    });

    if (isAdmin) {
      return mapped;
    } else {
      return mapped.filter(c => c.userId === user.id);
    }
  }, [claims, users, user, isAdmin]);

  // Tab Filtering & Search
  const displayedClaims = useMemo(() => {
    let filtered = visibleClaims;

    if (activeTab === 'Pending') {
      filtered = filtered.filter(c => c.status === 'Pending');
    } else {
      filtered = filtered.filter(c => c.status === 'Approved' || c.status === 'Rejected');
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        (c.description && c.description.toLowerCase().includes(q)) || 
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.applicant?.fullName && c.applicant.fullName.toLowerCase().includes(q))
      );
    }

    return filtered.sort((a, b) => b.id - a.id); // Sort by newest
  }, [visibleClaims, activeTab, searchQuery]);

  // Admin Actions
  const handleAction = async (claimId, newStatus) => {
    try {
      const targetClaim = claims.find(c => c.id === claimId);
      if (!targetClaim) return;

      const payload = {
        ...targetClaim,
        status: newStatus,
        approvedBy: user.id
      };

      await api.put(`/reimbursements/${claimId}`, payload);
      showToast(`Claim successfully ${newStatus.toLowerCase()}!`, 'success');
      fetchData();
    } catch (err) {
      console.error('Failed to update claim', err);
      showToast('Failed to process claim request.', 'error');
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Reimbursement Portal</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">Claim back out-of-pocket business expenses and track payouts.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5" /> File New Claim
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40">
          <div className="flex space-x-2 bg-slate-200/50 dark:bg-slate-700/50 p-1 rounded-xl w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('Pending')} 
              className={`flex-1 sm:flex-initial px-6 py-2 font-bold text-sm rounded-lg transition-all ${activeTab === 'Pending' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Pending claims
            </button>
            <button 
              onClick={() => setActiveTab('History')} 
              className={`flex-1 sm:flex-initial px-6 py-2 font-bold text-sm rounded-lg transition-all ${activeTab === 'History' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Claims History
            </button>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search description, employee..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            {/* List / Grid Toggles */}
            <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-700/50 p-1 rounded-xl border border-slate-200/20">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4.5 h-4.5" />
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                title="List View"
              >
                <List className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-16 text-center text-slate-500 font-bold animate-pulse">Syncing Reimbursement Claims...</div>
        ) : displayedClaims.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center border-t border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-850">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-100/50 dark:border-slate-800">
              <Banknote className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">No claims found</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">There are no {activeTab.toLowerCase()} reimbursement claims matching your current view.</p>
          </div>
        ) : (
          <>
            {/* Desktop List Table View */}
            <div className="overflow-x-auto hidden lg:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/60">
                  <tr>
                    {isAdmin && <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>}
                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expense Category</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Receipt</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    {isAdmin && activeTab === 'Pending' && <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {displayedClaims.map(claim => {
                    const avatarLetter = claim.applicant?.fullName ? claim.applicant.fullName.charAt(0).toUpperCase() : '?';
                    return (
                      <tr key={claim.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-650 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0">{avatarLetter}</div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-sm">{claim.applicant?.fullName}</div>
                                <div className="text-xs text-slate-500 font-medium">{claim.applicant?.employeeId}</div>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {claim.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-650 dark:text-slate-300 max-w-[250px] truncate" title={claim.description}>
                          {claim.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {claim.receiptUrl ? (
                            <a 
                              href={claim.receiptUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" /> View Bill
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 font-bold">No receipt</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900 dark:text-white">
                          {formatCurrency(claim.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            claim.status === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 
                            claim.status === 'Rejected' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 
                            'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                          }`}>
                            {claim.status}
                          </span>
                        </td>
                        {isAdmin && activeTab === 'Pending' && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleAction(claim.id, 'Approved')}
                                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100 shadow-sm"
                                title="Approve Claim"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleAction(claim.id, 'Rejected')}
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-100 shadow-sm"
                                title="Reject Claim"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Grid View */}
            <div className="lg:hidden block divide-y divide-slate-100 dark:divide-slate-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                {displayedClaims.map(claim => {
                  const avatarLetter = claim.applicant?.fullName ? claim.applicant.fullName.charAt(0).toUpperCase() : '?';
                  return (
                    <div key={claim.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between hover:shadow-md transition-all">
                      <div>
                        {/* Profile header (for Admin only) */}
                        {isAdmin && (
                          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100/50 dark:border-slate-700/50">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-650 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0">{avatarLetter}</div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white text-xs truncate">{claim.applicant?.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{claim.applicant?.employeeId}</div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-start gap-4 mb-3">
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {claim.category}
                          </span>
                          
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            claim.status === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 
                            claim.status === 'Rejected' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 
                            'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                          }`}>
                            {claim.status}
                          </span>
                        </div>

                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-4 leading-relaxed line-clamp-2">
                          {claim.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/60 mt-2">
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Amount Requested</span>
                          <span className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(claim.amount)}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {claim.receiptUrl && (
                            <a 
                              href={claim.receiptUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase shadow-sm"
                            >
                              <FileText className="w-3.5 h-3.5" /> Receipt
                            </a>
                          )}
                          
                          {isAdmin && activeTab === 'Pending' && (
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => handleAction(claim.id, 'Approved')}
                                className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-100 shadow-sm"
                                title="Approve Claim"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleAction(claim.id, 'Rejected')}
                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all border border-red-100 shadow-sm"
                                title="Reject Claim"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <NewReimbursementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} />
    </div>
  );
};

export default ReimbursementsPage;
