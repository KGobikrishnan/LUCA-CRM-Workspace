import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { 
  Search, Plus, Filter, Users, Phone, Mail, KanbanSquare, 
  AlertCircle, Building2, MapPin, Globe, MessageCircle, 
  Layers, Flag, CircleDollarSign, CheckCircle2, X,
  Pencil, Trash2, Eye
} from 'lucide-react';
import api from '../../services/api';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../components/common/Toast';
import { SkeletonCards } from '../../components/common/SkeletonTable';
import EmptyState from '../../components/common/EmptyState';
import EntityDetailsModal from '../../components/common/EntityDetailsModal';
import useAuthStore from '../../store/authStore';

const LeadModal = ({ isOpen, onClose, onSuccess, editLead = null }) => {
  const { register, handleSubmit, reset, control, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      type: 'Business',
      status: 'New',
      pipelineStage: 'Lead',
      priority: 'Medium',
      source: 'Website'
    }
  });
  const { showToast } = useToast();

  // Handle setting edit data
  useEffect(() => {
    if (editLead) {
      reset({
        ...editLead,
        expectedValue: editLead.expectedValue?.toString() || ''
      });
    } else {
      reset({
        type: 'Business',
        status: 'New',
        pipelineStage: 'Lead',
        priority: 'Medium',
        source: 'Website',
        leadName: '',
        companyOrg: '',
        email: '',
        phone: '',
        whatsapp: '',
        city: '',
        address: '',
        requirementSummary: '',
        expectedValue: ''
      });
    }
  }, [editLead, reset, isOpen]);

  // Generate a unique Lead ID when modal opens for NEW leads only
  const leadId = useMemo(() => {
    if (editLead) return editLead.leadId;
    return `LD-${Math.floor(100000 + Math.random() * 900000)}`;
  }, [isOpen, editLead]);

  // Watch for phone changes to handle the "same as phone" checkbox logic
  const phone = useWatch({ control, name: 'phone' });
  const sameAsPhone = useWatch({ control, name: 'sameAsPhone' });

  useEffect(() => {
    if (sameAsPhone && phone) {
      setValue('whatsapp', phone);
    }
  }, [sameAsPhone, phone, setValue]);

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, leadId };
      if (editLead) {
        await api.put(`/leads/${editLead.id}`, payload);
        showToast('Lead updated successfully!', 'success');
      } else {
        await api.post('/leads', payload);
        showToast('Lead captured successfully!', 'success');
      }
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save lead', error);
      showToast('Failed to save lead. Please check your connection.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
        {/* Premium Header with Gradient */}
        <div className="px-8 py-5 bg-gradient-to-r from-primary-600 to-indigo-600 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              {editLead ? 'Update Lead Details' : 'Capture New Lead'}
            </h2>
            <p className="text-primary-100 text-xs mt-1 font-medium">Lead ID: <span className="bg-white/20 px-2 py-0.5 rounded-full ml-1 text-white">{leadId}</span></p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all relative z-10 backdrop-blur-sm">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
          <form id="lead-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Row 1: Identification */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Lead Name *</label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    {...register("leadName", { required: true })} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none transition-all dark:text-white shadow-sm" 
                    placeholder="Full name of the contact person" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Lead Type</label>
                <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <label className="cursor-pointer">
                    <input type="radio" value="Individual" {...register("type")} className="peer hidden" />
                    <div className="text-center py-2 text-xs font-bold rounded-lg transition-all peer-checked:bg-primary-600 peer-checked:text-white text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">Individual</div>
                  </label>
                  <label className="cursor-pointer">
                    <input type="radio" value="Business" {...register("type")} className="peer hidden" />
                    <div className="text-center py-2 text-xs font-bold rounded-lg transition-all peer-checked:bg-primary-600 peer-checked:text-white text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">Business</div>
                  </label>
                </div>
              </div>
            </div>

            {/* Row 2: Company & Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Company / Organization</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    {...register("companyOrg")} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none transition-all dark:text-white shadow-sm" 
                    placeholder="Company name (if any)" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Lead Source</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select 
                    {...register("source")} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none appearance-none transition-all dark:text-white shadow-sm"
                  >
                    <option value="Website">Website</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Referral">Referral</option>
                    <option value="Walkin">Walk-in</option>
                    <option value="Phone call">Phone Call</option>
                    <option value="Whatsapp">WhatsApp</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 3: Communication */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="tel" 
                    {...register("phone")} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none transition-all dark:text-white shadow-sm" 
                    placeholder="+91 00000 00000" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                  WhatsApp
                  <label className="flex items-center gap-1.5 cursor-pointer group">
                    <input type="checkbox" {...register("sameAsPhone")} className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-800" />
                    <span className="text-[10px] normal-case font-semibold text-slate-400 group-hover:text-primary-600 transition-colors">Same as Phone</span>
                  </label>
                </label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="tel" 
                    {...register("whatsapp")} 
                    disabled={sameAsPhone}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none transition-all dark:text-white shadow-sm disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-400" 
                    placeholder="+91 00000 00000" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="email" 
                    {...register("email")} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none transition-all dark:text-white shadow-sm" 
                    placeholder="email@example.com" 
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">City / Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    {...register("city")} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none transition-all dark:text-white shadow-sm" 
                    placeholder="e.g. Mumbai, Maharashtra" 
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Full Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <textarea 
                    {...register("address")} 
                    rows="1" 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none transition-all dark:text-white shadow-sm" 
                    placeholder="Street, Landmark, Area..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Row 5: Pipeline & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Current Status</label>
                <div className="relative">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select 
                    {...register("status")} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none appearance-none transition-all dark:text-white shadow-sm"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Follow-Up">Follow-Up</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Converted">Converted</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Pipeline Stage</label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select 
                    {...register("pipelineStage")} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none appearance-none transition-all dark:text-white shadow-sm"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Prospect">Prospect</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Client">Client</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                <div className="relative">
                  <Flag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select 
                    {...register("priority")} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none appearance-none transition-all dark:text-white shadow-sm"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 6: Requirements & Value */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Requirement Summary</label>
                <textarea 
                  {...register("requirementSummary")} 
                  rows="2" 
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none transition-all dark:text-white shadow-sm" 
                  placeholder="What is the lead looking for?"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Expected Value (INR)</label>
                <div className="relative">
                  <CircleDollarSign className="w-4 h-4 text-primary-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="number" 
                    {...register("expectedValue")} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm font-bold text-primary-600 dark:text-primary-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none transition-all shadow-sm" 
                    placeholder="0.00" 
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
        
        {/* Footer with Blur Effect */}
        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="lead-form" 
            disabled={isSubmitting} 
            className="px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-primary-600/25 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isSubmitting ? 'Processing...' : (editLead ? 'Update Lead' : 'Capture Lead')}
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const LeadsPipelinePage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [viewingEntity, setViewingEntity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/leads');
      setLeads(res.data);
    } catch (error) {
      console.error('Failed to fetch leads', error);
      setError('Failed to load leads. Please try again later.');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    try {
      await api.delete(`/leads/${leadToDelete.id}`);
      showToast('Lead deleted successfully', 'success');
      setLeadToDelete(null);
      fetchLeads();
    } catch (error) {
      console.error('Failed to delete lead', error);
      showToast('Failed to delete lead', 'error');
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.leadName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                          lead.companyOrg?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'New': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Contacted': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Follow-Up': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Qualified': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Won': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200';
      case 'Lost': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leads Pipeline</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track and manage potential clients through the sales funnel.</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl hover:from-primary-700 hover:to-indigo-700 font-bold text-sm transition-all shadow-lg shadow-primary-600/25 active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Lead
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or company..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none transition-all dark:text-white shadow-inner"
            />
          </div>
          
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-inner"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Follow-Up">Follow-Up</option>
              <option value="Qualified">Qualified</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Grid View */}
      {loading ? (
        <SkeletonCards count={8} />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-red-900 dark:text-red-400 mb-2">Error Loading Pipeline</h3>
          <p className="text-red-700 dark:text-red-500 max-w-md">{error}</p>
          <button 
            onClick={fetchLeads} 
            className="mt-8 px-6 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold rounded-xl hover:bg-red-200 transition-all active:scale-95"
          >
            Try Again
          </button>
        </div>
      ) : filteredLeads.length === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="Your pipeline is empty"
          description="No leads match your criteria. Time to start prospecting and add new leads to fill up your pipeline!"
          actionLabel="Add Your First Lead"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {filteredLeads.map(lead => (
            <div key={lead.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-primary-400 dark:hover:border-primary-500 transition-all duration-300 group flex flex-col relative overflow-hidden">
              {/* Lead Indicator Line */}
              <div className={`absolute top-0 left-0 w-full h-1 ${
                lead.priority === 'High' ? 'bg-red-500' : 
                lead.priority === 'Medium' ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}></div>
              
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full border border-transparent shadow-sm ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingEntity(lead);
                      }}
                      className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-primary-600 rounded-lg transition-all"
                          title="Edit Lead"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setLeadToDelete(lead);
                          }}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
                  {lead.leadName}
                </h3>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-4 mt-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <p className="text-xs font-semibold truncate uppercase tracking-tight">{lead.companyOrg || 'Individual'}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 min-h-[4.5rem]">
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 italic leading-relaxed">
                    "{lead.requirementSummary || 'No specific requirements logged yet.'}"
                  </p>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 rounded-b-3xl flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-500 tracking-wider">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                    <Layers className="w-3 h-3 text-primary-500" />
                    {lead.pipelineStage}
                  </div>
                  <div className="flex items-center gap-1 uppercase">
                    <Globe className="w-3 h-3" />
                    {lead.source}
                  </div>
                </div>
                {lead.expectedValue && (
                  <div className="text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm font-black text-xs">
                    ₹{Number(lead.expectedValue).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <LeadModal 
        isOpen={isModalOpen} 
        editLead={selectedLead}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }} 
        onSuccess={fetchLeads}
      />

      {isAdmin && leadToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 text-red-600 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Delete Lead?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete <span className="font-bold">"{leadToDelete.leadName}"</span>? All associated data will be permanently removed from the database.
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setLeadToDelete(null)}
                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                No, Keep it
              </button>
              <button 
                onClick={handleDeleteLead}
                className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <EntityDetailsModal 
        isOpen={!!viewingEntity}
        onClose={() => setViewingEntity(null)}
        data={viewingEntity}
        entityType="lead"
      />
    </div>
  );
};

export default LeadsPipelinePage;
