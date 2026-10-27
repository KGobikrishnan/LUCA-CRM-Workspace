import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, CalendarOff, Search, Clock, CalendarCheck, FileText, Check, X } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { useToast } from '../../components/common/Toast';

const NewLeaveModal = ({ isOpen, onClose, onSuccess }) => {
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm();
  const { showToast } = useToast();
  const { user } = useAuthStore();

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const calcDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    if (d2 < d1) return 0;
    return Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const onSubmit = async (data) => {
    try {
      const payload = { 
        leaveType: data.leaveType,
        fromDate: data.startDate,
        toDate: data.endDate,
        reason: data.reason,
        userId: user?.id, 
        status: 'Pending' 
      };
      await api.post('/leaves', payload);
      showToast('Leave request submitted successfully!', 'success');
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to request leave', error);
      showToast('Failed to submit leave request.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Request Leave</h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Submit a new time-off request.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <form id="leave-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Leave Category *</label>
              <select {...register("leaveType", { required: true })} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Select Category...</option>
                <option value="Casual">Casual</option>
                <option value="Sick">Sick</option>
                <option value="Privilege">Privilege</option>
                <option value="Work From Home">Work From Home</option>
                <option value="Emergency">Emergency</option>
                <option value="Medical">Medical</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Start Date *</label>
                <input type="date" {...register("startDate", { required: true })} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">End Date *</label>
                <input type="date" {...register("endDate", { required: true })} className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>

            {calcDays > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                <Info className="w-4 h-4" /> You are requesting {calcDays} day{calcDays > 1 ? 's' : ''} of leave.
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Reason *</label>
              <textarea {...register("reason", { required: true })} rows="4" placeholder="Please provide detailed reasoning..." className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" form="leave-form" disabled={isSubmitting || calcDays <= 0} className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-black rounded-lg shadow-md transition-colors disabled:opacity-50 flex items-center gap-2">
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Info = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);


const LeaveRequestsPage = () => {
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('Pending'); // Pending | History
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [leaveRes, userRes] = await Promise.all([
        api.get('/leaves').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] }))
      ]);
      setRequests(leaveRes.data);
      setUsers(userRes.data);
    } catch (error) {
      console.error('Failed to fetch', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format Duration string
  const formatDuration = (from, to) => {
    if (!from || !to) return '-';
    const d1 = new Date(from);
    const d2 = new Date(to);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    
    const fromStr = d1.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const toStr = d2.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    
    if (fromStr === toStr) return `${fromStr} (1 day)`;
    return `${fromStr} - ${toStr} (${diffDays} days)`;
  };

  // Determine visibility logic based on Role
  const visibleData = useMemo(() => {
    if (!user) return [];
    
    let filtered = requests.map(req => {
      const applicant = users.find(u => u.id === req.userId);
      return { ...req, applicant };
    }).filter(req => req.applicant); // must have applicant attached
    
    // Role filtering
    const userRoleNorm = user.role?.toLowerCase().replace(/[^a-z]/g, '');
    if (userRoleNorm === 'team' || userRoleNorm === 'intern') {
      filtered = filtered.filter(req => req.userId === user.id);
    } else if (userRoleNorm === 'admin') {
      filtered = filtered.filter(req => {
        const applicantRoleNorm = req.applicant?.role?.toLowerCase().replace(/[^a-z]/g, '');
        return req.userId === user.id || applicantRoleNorm === 'team' || applicantRoleNorm === 'intern';
      });
    }
    // Super Admin sees all
    
    return filtered;
  }, [requests, users, user]);

  // Statistics Calculation
  const stats = useMemo(() => {
    let pendingActionCount = 0;
    const userRoleNormStats = user?.role?.toLowerCase().replace(/[^a-z]/g, '');
    
    if (userRoleNormStats === 'superadmin') {
      pendingActionCount = visibleData.filter(r => r.status === 'Pending').length;
    } else if (userRoleNormStats === 'admin') {
      pendingActionCount = visibleData.filter(r => 
        r.status === 'Pending' && 
        (r.applicant?.role?.toLowerCase().replace(/[^a-z]/g, '') === 'team' || r.applicant?.role?.toLowerCase().replace(/[^a-z]/g, '') === 'intern')
      ).length;
    } // Team / Interns don't approve, so 0

    const todayStr = new Date().toISOString().split('T')[0];
    const onLeaveToday = visibleData.filter(r => 
      r.status === 'Approved' && 
      r.fromDate <= todayStr && 
      r.toDate >= todayStr
    ).length;

    return {
      pendingAction: pendingActionCount,
      onLeaveToday: onLeaveToday,
      totalRequests: visibleData.length
    };
  }, [visibleData, user]);


  // Tab and Search Filtering
  const displayedData = useMemo(() => {
    let data = visibleData;
    
    if (activeTab === 'Pending') {
      data = data.filter(r => r.status === 'Pending');
    } else {
      // History tab: non-admins see ONLY their own records
      const userRoleNormHistory = user?.role?.toLowerCase().replace(/[^a-z]/g, '');
      const isAdmin = userRoleNormHistory === 'superadmin' || userRoleNormHistory === 'admin';
      data = data.filter(r => r.status === 'Approved' || r.status === 'Rejected');
      if (!isAdmin) {
        data = data.filter(r => r.userId === user?.id);
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(r => 
        (r.requestId && r.requestId.toLowerCase().includes(q)) || 
        (r.applicant?.fullName.toLowerCase().includes(q))
      );
    }
    
    // Sort by appliedOn descending
    return data.sort((a, b) => new Date(b.appliedOn || 0) - new Date(a.appliedOn || 0));
  }, [visibleData, activeTab, searchQuery, user]);


  // Actions
  const handleAction = async (reqId, newStatus) => {
    try {
      const reqToUpdate = requests.find(r => r.id === reqId);
      if (!reqToUpdate) return;
      
      const payload = {
        ...reqToUpdate,
        status: newStatus,
        approvedBy: user.id
      };
      
      await api.put(`/leaves/${reqId}`, payload);
      showToast(`Request ${newStatus.toLowerCase()} successfully`, 'success');
      fetchData();
    } catch (err) {
      console.error('Action failed', err);
      showToast('Failed to perform action', 'error');
    }
  };


  return (
    <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Leave Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">Manage time-off requests and approvals.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-black font-bold text-sm shadow-md transition-all"
        >
          <Plus className="w-5 h-5" /> Request Leave
        </button>
      </div>

      {/* Top Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Action</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.pendingAction}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">On Leave Today</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.onLeaveToday}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Requests</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalRequests}</p>
          </div>
        </div>
      </div>

      {/* Main List Area */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
        
        {/* Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40">
          <div className="flex space-x-2 bg-slate-200/50 dark:bg-slate-700/50 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('Pending')} 
              className={`px-6 py-2 font-bold text-sm rounded-lg transition-all ${activeTab === 'Pending' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Pending Tab
            </button>
            <button 
              onClick={() => setActiveTab('History')} 
              className={`px-6 py-2 font-bold text-sm rounded-lg transition-all ${activeTab === 'History' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              History Tab
            </button>
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by ID or Employee..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-bold animate-pulse">Loading data...</div>
          ) : displayedData.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center border-t border-slate-100 dark:border-slate-700/60">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <CalendarOff className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">No requests found</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">There are no {activeTab.toLowerCase()} leave requests matching your criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/60">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Employee Name</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Dates / Duration</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {displayedData.map(req => {
                  
                  // Action Permission Logic
                  let canAction = false;
                  if (activeTab === 'Pending') {
                    const userRoleNormAction = user?.role?.toLowerCase().replace(/[^a-z]/g, '');
                    const applicantRoleNormAction = req.applicant?.role?.toLowerCase().replace(/[^a-z]/g, '');
                    if (userRoleNormAction === 'superadmin') canAction = true;
                    if (userRoleNormAction === 'admin' && (applicantRoleNormAction === 'team' || applicantRoleNormAction === 'intern')) canAction = true;
                  }

                  return (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-indigo-600 dark:text-indigo-400">{req.requestId || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">{req.applicant?.fullName}</div>
                        <div className="text-xs text-slate-500 font-medium">{req.applicant?.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700 dark:text-slate-200">
                        {formatDuration(req.fromDate, req.toDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-500 dark:text-slate-400">
                        {req.leaveType}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500 max-w-[200px] truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          req.status === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 
                          req.status === 'Rejected' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 
                          'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {canAction ? (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleAction(req.id, 'Approved')}
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                              title="Approve Request"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleAction(req.id, 'Rejected')}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Reject Request"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <NewLeaveModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} />
    </div>
  );
};

export default LeaveRequestsPage;
