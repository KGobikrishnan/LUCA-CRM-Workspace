import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { 
  Search, Plus, Filter, Building2, MapPin, Mail, Phone, Users, 
  Globe, MessageCircle, CreditCard, ShieldCheck, X, Pencil, Trash2,
  AlertCircle, Briefcase, Landmark, CheckCircle2, LayoutGrid, Eye
} from 'lucide-react';
import api from '../../services/api';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../components/common/Toast';
import { SkeletonCards } from '../../components/common/SkeletonTable';
import EmptyState from '../../components/common/EmptyState';
import EntityDetailsModal from '../../components/common/EntityDetailsModal';
import useAuthStore from '../../store/authStore';

const ClientModal = ({ isOpen, onClose, onSuccess, leads, editClient = null }) => {
  const { register, handleSubmit, reset, control, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      type: 'Business',
      status: 'Active',
      paymentTerms: 'Advance',
      gstRegistered: false
    }
  });
  const { showToast } = useToast();

  const clientId = useMemo(() => {
    if (editClient) return editClient.clientId;
    return `CLT-${Math.floor(100000 + Math.random() * 900000)}`;
  }, [isOpen, editClient]);

  // Watch fields
  const gstRegistered = useWatch({ control, name: 'gstRegistered' });
  const importLeadId = useWatch({ control, name: 'importLeadId' });
  const phone = useWatch({ control, name: 'phone' });
  const sameAsPhone = useWatch({ control, name: 'sameAsPhone' });

  // Handle Edit Data
  useEffect(() => {
    if (editClient) {
      reset({
        ...editClient,
        sameAsPhone: editClient.phone === editClient.whatsapp
      });
    } else {
      reset({
        type: 'Business',
        status: 'Active',
        paymentTerms: 'Advance',
        gstRegistered: false,
        businessName: '',
        primaryContact: '',
        email: '',
        phone: '',
        whatsapp: '',
        designation: '',
        address: '',
        city: '',
        website: '',
        gstNumber: '',
        billingAddress: ''
      });
    }
  }, [editClient, reset, isOpen]);

  // Sync WhatsApp with Phone
  useEffect(() => {
    if (sameAsPhone && phone) {
      setValue('whatsapp', phone);
    }
  }, [sameAsPhone, phone, setValue]);

  // Handle Lead Import
  useEffect(() => {
    if (importLeadId && leads && !editClient) {
      const selectedLead = leads.find(l => l.id === importLeadId);
      if (selectedLead) {
        setValue('businessName', selectedLead.companyOrg || selectedLead.leadName);
        setValue('primaryContact', selectedLead.leadName);
        setValue('email', selectedLead.email);
        setValue('phone', selectedLead.phone);
        setValue('whatsapp', selectedLead.whatsapp || selectedLead.phone);
        setValue('address', selectedLead.address);
        setValue('city', selectedLead.city);
        setValue('type', selectedLead.type === 'Individual' ? 'Individual' : 'Business');
        setValue('designation', 'Decision Maker');
        showToast(`Imported data from ${selectedLead.leadName}`, 'success');
      }
    }
  }, [importLeadId, leads, setValue, showToast, editClient]);

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, clientId };
      if (editClient) {
        await api.put(`/clients/${editClient.id}`, payload);
        showToast('Client profile updated!', 'success');
      } else {
        await api.post('/clients', payload);
        showToast('New client profile created!', 'success');
      }
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save client', error);
      showToast('Error saving client profile.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
        {/* Premium Header */}
        <div className="px-8 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Building2 className="w-6 h-6" />
              {editClient ? 'Edit Client Profile' : 'Setup New Client'}
            </h2>
            <p className="text-emerald-100 text-xs mt-1 font-medium">Client ID: <span className="bg-white/20 px-2 py-0.5 rounded-full ml-1 text-white">{clientId}</span></p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all relative z-10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
          <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Import Logic (Only for New Clients) */}
            {!editClient && leads && leads.length > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Import from Leads</h3>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">Convert an existing lead to a client instantly</p>
                  </div>
                </div>
                <select 
                  {...register("importLeadId")} 
                  className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 dark:text-white font-bold"
                >
                  <option value="">-- Choose a Lead to Import Details --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.leadName} {l.companyOrg ? `(${l.companyOrg})` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Row 1: Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Business / Client Name *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" {...register("businessName", { required: true })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" placeholder="Company or Individual Name" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary Contact Person *</label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" {...register("primaryContact", { required: true })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" placeholder="John Doe" />
                </div>
              </div>
            </div>

            {/* Row 2: Type, Status, Designation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Client Type</label>
                <select {...register("type")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white">
                  <option value="Individual">Individual</option>
                  <option value="Business">Business</option>
                  <option value="Organization">Organization</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                <select {...register("status")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white">
                  <option value="Active">Active</option>
                  <option value="InActive">In-Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Designation</label>
                <input type="text" {...register("designation")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" placeholder="Proprietor / Manager" />
              </div>
            </div>

            {/* Row 3: Communication */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                <input type="tel" {...register("phone")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" placeholder="+91 00000 00000" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" {...register("sameAsPhone")} className="w-3 h-3 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-600">Same as Phone</span>
                  </label>
                </div>
                <input type="tel" {...register("whatsapp")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <input type="email" {...register("email")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" placeholder="client@example.com" />
              </div>
            </div>

            {/* Row 4: Web & Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Website / Portfolio</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" {...register("website")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" placeholder="https://www.clientwebsite.com" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">City / Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" {...register("city")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                </div>
              </div>
            </div>

            {/* Row 5: Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Communication Address</label>
                <textarea {...register("address")} rows="3" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white resize-none"></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billing Address</label>
                <textarea {...register("billingAddress")} rows="3" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white resize-none"></textarea>
              </div>
            </div>

            {/* Row 6: Finance & GST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    GST Registration
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" {...register("gstRegistered")} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                
                {gstRegistered && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">GST Number</label>
                    <input type="text" {...register("gstNumber")} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white uppercase font-mono tracking-wider" placeholder="33AAAAA0000A1Z5" />
                  </div>
                )}
              </div>

              <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  Payment Terms
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Advance', '50-50', 'Monthly', 'Milestone based'].map(term => (
                    <label key={term} className="cursor-pointer">
                      <input type="radio" value={term} {...register("paymentTerms")} className="peer hidden" />
                      <div className="text-center py-2 text-[10px] font-black rounded-lg transition-all peer-checked:bg-emerald-600 peer-checked:text-white text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 peer-checked:border-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-700 uppercase tracking-tighter">
                        {term}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all">Cancel</button>
          <button type="submit" form="client-form" disabled={isSubmitting} className="px-8 py-2.5 text-sm font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition-all active:scale-95 disabled:opacity-50">
            {isSubmitting ? 'Saving...' : (editClient ? 'Update Client' : 'Save Client Profile')}
          </button>
        </div>
      </div>
    </div>
  );
};

const ClientDirectoryPage = () => {
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [viewingEntity, setViewingEntity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [clientsRes, leadsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/leads')
      ]);
      setClients(clientsRes.data);
      setLeads(leadsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setError('Connection failed. Please check the backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await api.delete(`/clients/${clientToDelete.id}`);
      showToast('Client profile deleted!', 'success');
      setClientToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Delete failed', error);
      showToast('Failed to delete client', 'error');
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.businessName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                          client.primaryContact?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Client Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your active clients, billing, and contact details.</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => {
              setSelectedClient(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 font-bold text-sm transition-all shadow-lg shadow-emerald-600/25 active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Client
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
              placeholder="Search business name or contact..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white shadow-inner"
            />
          </div>
          
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-inner"
            >
              <option value="All">All Clients</option>
              <option value="Active">Active</option>
              <option value="InActive">In-Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonCards count={6} />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 dark:text-red-400">{error}</h3>
          <button onClick={fetchData} className="mt-4 px-6 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold rounded-xl">Retry Connection</button>
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clients found"
          description="Your client directory is currently empty. Start by converting a lead or adding a new client profile manually."
          actionLabel="Add First Client"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filteredClients.map(client => (
            <div key={client.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 group flex flex-col relative overflow-hidden">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full border border-transparent shadow-sm ${
                    client.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    client.status === 'InActive' ? 'bg-slate-100 text-slate-700' :
                    client.status === 'On Hold' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {client.status}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setViewingEntity(client); }}
                      className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedClient(client); setIsModalOpen(true); }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-600 rounded-lg transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setClientToDelete(client); }}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                  {client.businessName}
                </h3>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-4 mt-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  <p className="text-xs font-semibold truncate uppercase tracking-tight">{client.primaryContact} • {client.designation || client.type}</p>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    {client.phone}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    <Mail className="w-3.5 h-3.5 text-emerald-500" />
                    {client.email}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    {client.city}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 rounded-b-3xl flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-500 tracking-wider">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                    <Landmark className="w-3 h-3 text-emerald-500" />
                    {client.paymentTerms}
                  </div>
                  {client.gstRegistered && (
                    <div className="flex items-center gap-1 uppercase text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-3 h-3" />
                      GST Verified
                    </div>
                  )}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                  ID: {client.clientId}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedClient(null); }} 
        onSuccess={fetchData}
        leads={leads}
        editClient={selectedClient}
      />

      {isAdmin && clientToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 text-red-600 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Delete Client?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{clientToDelete.businessName}"</span>? This will remove all their billing and contact information.
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                No, Keep
              </button>
              <button 
                onClick={handleDeleteClient}
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
        entityType="client"
      />
    </div>
  );
};

export default ClientDirectoryPage;
