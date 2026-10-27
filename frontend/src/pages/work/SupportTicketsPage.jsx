import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { 
  Search, Plus, Filter, LifeBuoy, MoreVertical, Calendar, 
  Trash2, Pencil, X, Briefcase, Flag, Activity, 
  CheckCircle2, Users, Building2, Ticket, AlertCircle, Clock,
  ChevronDown, ShieldCheck, UserPlus, Send, Eye, LayoutGrid, LayoutList
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { useToast } from '../../components/common/Toast';
import { SkeletonCards } from '../../components/common/SkeletonTable';
import EmptyState from '../../components/common/EmptyState';
import EntityDetailsModal from '../../components/common/EntityDetailsModal';

const TicketModal = ({ isOpen, onClose, onSuccess, clients, projects, teamMembers, editTicket = null }) => {
  const { register, handleSubmit, reset, control, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      status: 'Open',
      priority: 'Medium'
    }
  });
  const { showToast } = useToast();

  const ticketId = useMemo(() => {
    if (editTicket) return editTicket.ticketId;
    return `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
  }, [isOpen, editTicket]);

  const selectedPriority = useWatch({ control, name: 'priority' });

  useEffect(() => {
    if (editTicket) {
      reset(editTicket);
    } else {
      reset({
        status: 'Open',
        priority: 'Medium',
        subject: '',
        issueDescription: '',
        clientId: '',
        projectId: '',
        assigneeId: ''
      });
    }
  }, [editTicket, reset, isOpen]);

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, ticketId };
      if (editTicket) {
        await api.put(`/support-tickets/${editTicket.id}`, payload);
        showToast('Ticket updated successfully!', 'success');
      } else {
        await api.post('/support-tickets', payload);
        showToast('Ticket logged. Support is on the way!', 'success');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save ticket', error);
      showToast('Error saving ticket.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="px-8 py-5 bg-gradient-to-r from-red-500 to-rose-600 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <LifeBuoy className="w-6 h-6 animate-pulse" />
              {editTicket ? 'Edit Support Ticket' : 'Log New Support Ticket'}
            </h2>
            <p className="text-red-100 text-xs mt-1 font-medium">Critical response tracking <span className="bg-white/20 px-2 py-0.5 rounded-full ml-1 text-white font-mono">{ticketId}</span></p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all relative z-10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
          <form id="ticket-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Section 1: Subject */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject / Issue Title *</label>
                <div className="relative">
                  <Ticket className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" {...register("subject", { required: true })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none dark:text-white" placeholder="e.g. Server Latency Issue in Production" />
                </div>
              </div>
            </div>

            {/* Section 2: Entities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reporting Client *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select {...register("clientId", { required: true })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-red-500 outline-none dark:text-white appearance-none">
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.businessName}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Related Project</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select {...register("projectId")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-red-500 outline-none dark:text-white appearance-none">
                    <option value="">-- Independent Issue --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Status & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolution Status</label>
                <select {...register("status")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-red-600 focus:ring-2 focus:ring-red-500 outline-none dark:bg-slate-900">
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority Escalation</label>
                <div className="flex gap-2">
                  {['Low', 'Medium', 'High', 'Critical'].map(p => (
                    <button 
                      key={p} type="button" 
                      onClick={() => setValue('priority', p)}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all border-2 ${
                        selectedPriority === p 
                          ? 'bg-red-600 text-white border-transparent shadow-lg scale-105' 
                          : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 4: Assignee & Description */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assign Support Engineer</label>
                  <div className="relative">
                    <UserPlus className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select {...register("assigneeId")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-red-500 outline-none dark:text-white appearance-none">
                      <option value="">-- Choose Assignee --</option>
                      {teamMembers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                    </select>
                  </div>
                </div>
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-slate-400 uppercase">Created On</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{editTicket ? new Date(editTicket.createdOn).toLocaleString() : 'Now (Auto)'}</p>
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Description / Log</label>
                <textarea {...register("issueDescription")} rows="8" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-red-500 outline-none dark:text-white resize-none shadow-inner" placeholder="Detailed technical description of the issue reported by the client..."></textarea>
              </div>
            </div>

          </form>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all">Cancel</button>
          <button type="submit" form="ticket-form" disabled={isSubmitting} className="px-8 py-2.5 text-sm font-black text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-xl shadow-lg shadow-red-600/20 hover:from-red-600 hover:to-rose-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Syncing...' : (editTicket ? 'Update Ticket' : 'Dispatch Ticket')}
          </button>
        </div>
      </div>
    </div>
  );
};

const SupportTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [viewMode, setViewMode] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'list';
  });
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [viewingEntity, setViewingEntity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, clientsRes, projectsRes, usersRes] = await Promise.all([
        api.get('/support-tickets'),
        api.get('/clients'),
        api.get('/projects'),
        api.get('/users')
      ]);
      setTickets(ticketsRes.data);
      setClients(clientsRes.data);
      setProjects(projectsRes.data);
      setTeamMembers(usersRes.data);
    } catch (error) {
      console.error('Fetch failed', error);
      showToast('Failed to sync tickets.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const ticket = tickets.find(t => t.id === id);
      await api.put(`/support-tickets/${id}`, { ...ticket, status: newStatus });
      showToast(`Ticket status updated to ${newStatus}`, 'success');
      fetchData();
    } catch (error) {
      showToast('Status update failed.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!ticketToDelete) return;
    try {
      await api.delete(`/support-tickets/${ticketToDelete.id}`);
      showToast('Ticket removed permanently.', 'success');
      setTicketToDelete(null);
      fetchData();
    } catch (error) {
      showToast('Delete action failed.', 'error');
    }
  };

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin';

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.ticketId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'All' ? true : t.status === statusFilter;
    
    // Access Control: Only show assigned tickets unless Admin
    const isAssignedToMe = t.assigneeId === currentUser?.id;
    const hasAccess = isAdmin || isAssignedToMe;

    return matchesSearch && matchesFilter && hasAccess;
  });

  const getPriorityInfo = (p) => {
    switch(p) {
      case 'Critical': return { label: 'Critical', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' };
      case 'High': return { label: 'High', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' };
      case 'Medium': return { label: 'Medium', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' };
      default: return { label: 'Low', color: 'text-slate-600 bg-slate-100 dark:bg-slate-700/50' };
    }
  };

  const getStatusStyle = (s) => {
    switch(s) {
      case 'Open': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'In Progress': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      case 'Waiting': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      case 'Resolved': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-800';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Support Desk</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Rapid response and technical resolution hub.</p>
        </div>
        
        <button 
          onClick={() => { setSelectedTicket(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl hover:from-red-600 hover:to-rose-700 font-black text-sm transition-all shadow-xl shadow-red-600/25 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Log Ticket
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ticket ID or subject..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-red-500 outline-none dark:text-white font-medium"
            />
          </div>
          
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-11 pr-8 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-red-500 outline-none font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-inner"
            >
              <option value="All">All Ticket Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting">Waiting</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
             <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           </div>
         </div>
 
         <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
           <button 
             onClick={() => setViewMode('list')} 
             className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-md text-red-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
             title="List View"
           >
             <LayoutList className="w-4 h-4" />
           </button>
           <button 
             onClick={() => setViewMode('grid')} 
             className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-md text-red-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
             title="Grid View"
           >
             <LayoutGrid className="w-4 h-4" />
           </button>
         </div>
       </div>

      {loading ? (
        <SkeletonCards count={6} />
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No support requests"
          description="Looks like everything is running smoothly. Your ticket queue is currently empty."
          actionLabel="Log New Ticket"
          onAction={() => setIsModalOpen(true)}
        />
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket ID & Subject</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Client / Project</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Update</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                {filteredTickets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-red-600 transition-colors">{t.subject}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t.ticketId}</div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{clients.find(c => c.id === t.clientId)?.businessName || 'N/A'}</div>
                      <div className="text-[10px] font-medium text-slate-400">{projects.find(p => p.id === t.projectId)?.projectName || 'Independent Ticket'}</div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-[10px] font-black text-red-600">
                          {teamMembers.find(m => m.id === t.assigneeId)?.fullName?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{teamMembers.find(m => m.id === t.assigneeId)?.fullName || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                       <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getPriorityInfo(t.priority).color}`}>{getPriorityInfo(t.priority).label}</span>
                    </td>
                    <td className="px-8 py-4">
                       <select 
                         value={t.status}
                         onChange={(e) => handleStatusUpdate(t.id, e.target.value)}
                         className={`text-[10px] font-black px-3 py-1.5 rounded-xl border-none focus:ring-2 focus:ring-red-500 cursor-pointer transition-all ${getStatusStyle(t.status)}`}
                       >
                         <option value="Open">Open</option>
                         <option value="In Progress">In Progress</option>
                         <option value="Waiting">Waiting</option>
                         <option value="Resolved">Resolved</option>
                         <option value="Closed">Closed</option>
                       </select>
                    </td>
                    <td className="px-8 py-4 text-xs font-bold text-slate-500">
                      {new Date(t.createdOn).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setViewingEntity(t)} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 rounded-xl transition-all" title="View Details"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => { setSelectedTicket(t); setIsModalOpen(true); }} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-xl transition-all"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setTicketToDelete(t)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {filteredTickets.map(t => {
            const clientName = clients.find(c => c.id === t.clientId)?.businessName || 'N/A';
            const projectName = projects.find(p => p.id === t.projectId)?.projectName || 'Independent Ticket';
            const assigneeName = teamMembers.find(m => m.id === t.assigneeId)?.fullName || 'Unassigned';
            const assigneeInitial = teamMembers.find(m => m.id === t.assigneeId)?.fullName?.charAt(0) || '?';
            return (
              <div key={t.id} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between h-full relative group">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.ticketId}</span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white mt-1 group-hover:text-red-600 transition-colors line-clamp-2">
                        {t.subject}
                      </h3>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${getPriorityInfo(t.priority).color}`}>
                      {getPriorityInfo(t.priority).label}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-xs font-bold truncate">{clientName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-xs font-medium truncate">{projectName}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4 mt-auto">
                  <div className="flex justify-between items-center gap-4 mb-4">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                      <select 
                        value={t.status}
                        onChange={(e) => handleStatusUpdate(t.id, e.target.value)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-xl border-none focus:ring-2 focus:ring-red-500 cursor-pointer transition-all ${getStatusStyle(t.status)}`}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Waiting">Waiting</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-[10px] font-black text-red-600 shrink-0">
                        {assigneeInitial}
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Assignee</span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[80px] block">{assigneeName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {new Date(t.createdOn).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewingEntity(t)} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 rounded-xl transition-all" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedTicket(t); setIsModalOpen(true); }} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-xl transition-all" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setTicketToDelete(t)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-xl transition-all" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TicketModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedTicket(null); }} 
        onSuccess={fetchData}
        clients={clients}
        projects={projects}
        teamMembers={teamMembers}
        editTicket={selectedTicket}
      />

      {/* Delete Confirmation */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Close Ticket Forever?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">
              Are you sure you want to delete ticket <span className="font-bold text-slate-900 dark:text-white">"{ticketToDelete.subject}"</span>? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button onClick={() => setTicketToDelete(null)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-3 text-sm font-black text-white bg-red-600 hover:bg-red-700 rounded-2xl shadow-lg shadow-red-600/20 transition-all active:scale-95">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <EntityDetailsModal 
        isOpen={!!viewingEntity}
        onClose={() => setViewingEntity(null)}
        data={viewingEntity}
        entityType="ticket"
      />
    </div>
  );
};

export default SupportTicketsPage;
