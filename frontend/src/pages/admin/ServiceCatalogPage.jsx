import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { 
  Search, Plus, Filter, Package, Trash2, Pencil, X,
  Tag, List, DollarSign, CheckCircle2, AlertCircle,
  PlusCircle, MinusCircle, CheckSquare, Eye
} from 'lucide-react';
import api from '../../services/api';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../components/common/Toast';
import { SkeletonCards } from '../../components/common/SkeletonTable';
import EmptyState from '../../components/common/EmptyState';
import EntityDetailsModal from '../../components/common/EntityDetailsModal';
import useAuthStore from '../../store/authStore';

const CATEGORY_GROUPS = {
  'Digital Marketing': ['Social Media Marketing', 'SEO Optimization', 'Meta Ads Management', 'Google Ads'],
  'Development': ['Website Development', 'Fullstack Development', 'App Development'],
  'Promotion Kit': ['Branding Kit', 'Print Promotion', 'Corporate Gifting']
};

const PRICING_MODELS = ['Fixed Price', 'Starts From', 'Range', 'Percentage(%)'];

const ServiceModal = ({ isOpen, onClose, onSuccess, editService = null }) => {
  const { register, handleSubmit, reset, control, setValue, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      category: 'Digital Marketing',
      serviceGroup: 'Social Media Marketing',
      variantName: '',
      pricingModel: 'Fixed Price',
      basePrice: '',
      description: '',
      taxApplicable: false,
    }
  });

  const { showToast } = useToast();
  const [isManualGroup, setIsManualGroup] = useState(false);
  const [manualGroupText, setManualGroupText] = useState('');
  
  // Custom states for dynamic lists
  const [features, setFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState('');
  
  const [addons, setAddons] = useState([]);
  const [addonNameInput, setAddonNameInput] = useState('');
  const [addonPriceInput, setAddonPriceInput] = useState('');

  const selectedCategory = useWatch({ control, name: 'category' });
  const selectedGroup = useWatch({ control, name: 'serviceGroup' });

  useEffect(() => {
    if (editService) {
      reset({
        ...editService,
        features: undefined,
        optionalAddons: undefined
      });
      
      const categoryGroups = CATEGORY_GROUPS[editService.category] || [];
      if (!categoryGroups.includes(editService.serviceGroup)) {
        setIsManualGroup(true);
        setManualGroupText(editService.serviceGroup);
        setValue('serviceGroup', 'Create New Heading(Manual Input)');
      } else {
        setIsManualGroup(false);
        setManualGroupText('');
      }

      setFeatures(editService.features ? (typeof editService.features === 'string' ? JSON.parse(editService.features) : editService.features) : []);
      setAddons(editService.optionalAddons ? (typeof editService.optionalAddons === 'string' ? JSON.parse(editService.optionalAddons) : editService.optionalAddons) : []);
    } else {
      reset({
        category: 'Digital Marketing',
        serviceGroup: 'Social Media Marketing',
        variantName: '',
        pricingModel: 'Fixed Price',
        basePrice: '',
        description: '',
        taxApplicable: false,
      });
      setIsManualGroup(false);
      setManualGroupText('');
      setFeatures([]);
      setAddons([]);
    }
  }, [editService, reset, isOpen, setValue]);

  // Handle category change -> reset group
  useEffect(() => {
    if (!editService && isOpen) {
      const defaultGroup = CATEGORY_GROUPS[selectedCategory]?.[0] || '';
      setValue('serviceGroup', defaultGroup);
      setIsManualGroup(false);
      setManualGroupText('');
    }
  }, [selectedCategory, setValue, editService, isOpen]);

  // Handle group change -> check manual
  useEffect(() => {
    if (selectedGroup === 'Create New Heading(Manual Input)') {
      setIsManualGroup(true);
    } else {
      setIsManualGroup(false);
    }
  }, [selectedGroup]);

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleAddAddon = () => {
    if (addonNameInput.trim() && addonPriceInput.trim()) {
      setAddons([...addons, { name: addonNameInput.trim(), price: addonPriceInput.trim() }]);
      setAddonNameInput('');
      setAddonPriceInput('');
    }
  };

  const handleRemoveAddon = (index) => {
    setAddons(addons.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    try {
      const finalGroup = isManualGroup ? manualGroupText : data.serviceGroup;
      if (!finalGroup) {
        showToast('Service Group is required', 'error');
        return;
      }

      const payload = { 
        ...data, 
        serviceGroup: finalGroup,
        features: JSON.stringify(features),
        optionalAddons: JSON.stringify(addons)
      };

      if (editService) {
        await api.put(`/service-catalog/${editService.id}`, payload);
        showToast('Service updated successfully!', 'success');
      } else {
        await api.post('/service-catalog', payload);
        showToast('Service added successfully!', 'success');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save service', error);
      showToast('Failed to save service. Please check your connection.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300 overflow-y-auto pt-20 pb-10">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="px-8 py-5 bg-gradient-to-r from-primary-600 to-indigo-600 flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              {editService ? 'Update Service Details' : 'Add New Service'}
            </h2>
            <p className="text-primary-100 text-xs mt-1 font-medium">
              Service ID: <span className="bg-white/20 px-2 py-0.5 rounded-full ml-1 text-white">{editService?.serviceId || 'Auto-generated on save'}</span>
            </p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all relative z-10 backdrop-blur-sm">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50 flex-1 max-h-[70vh]">
          <form id="service-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Row 1: Category and Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Category *</label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select 
                    {...register("category")} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none appearance-none transition-all dark:text-white shadow-sm"
                  >
                    {Object.keys(CATEGORY_GROUPS).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Service Group (Heading) *</label>
                <div className="relative mb-2">
                  <List className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select 
                    {...register("serviceGroup")} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none appearance-none transition-all dark:text-white shadow-sm"
                  >
                    {(CATEGORY_GROUPS[selectedCategory] || []).map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                    <option value="Create New Heading(Manual Input)">Create New Heading (Manual Input)</option>
                  </select>
                </div>
                {isManualGroup && (
                  <input 
                    type="text" 
                    value={manualGroupText}
                    onChange={(e) => setManualGroupText(e.target.value)}
                    required={isManualGroup}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white shadow-sm" 
                    placeholder="Enter custom service group" 
                  />
                )}
              </div>
            </div>

            {/* Row 2: Variant Name & Pricing Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Variant Name</label>
                <div className="relative">
                  <Package className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    {...register("variantName")} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white shadow-sm" 
                    placeholder="e.g. Basic Plan, Premium Plan" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Pricing Model</label>
                  <select 
                    {...register("pricingModel")} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none appearance-none transition-all dark:text-white shadow-sm"
                  >
                    {PRICING_MODELS.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Base Price</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="number" 
                      {...register("basePrice")} 
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-10 text-sm font-bold text-primary-600 focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white shadow-sm" 
                      placeholder="0.00" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Description & GST */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Description</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register("taxApplicable")} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Tax Applicable (GST)</span>
                </label>
              </div>
              <textarea 
                {...register("description")} 
                rows="4" 
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white shadow-sm" 
                placeholder="Detailed description of the service..."
              ></textarea>
            </div>

            {/* Row 4: Feature List */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Feature List</label>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white" 
                  placeholder="e.g. 5 Custom Graphics" 
                />
                <button 
                  type="button" 
                  onClick={handleAddFeature}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-sm transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> Add
                </button>
              </div>
              {features.length > 0 && (
                <ul className="space-y-2 mt-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {features.map((feat, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-4 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <CheckSquare className="w-4 h-4 text-primary-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{feat}</span>
                      </div>
                      <button type="button" onClick={() => handleRemoveFeature(idx)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                        <MinusCircle className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Row 5: Optional Add-Ons */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Optional Add-Ons</label>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={addonNameInput}
                  onChange={(e) => setAddonNameInput(e.target.value)}
                  className="flex-[2] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white" 
                  placeholder="Add-on Name" 
                />
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={addonPriceInput}
                    onChange={(e) => setAddonPriceInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAddon())}
                    className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white" 
                    placeholder="Price" 
                  />
                </div>
                <button 
                  type="button" 
                  onClick={handleAddAddon}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-sm transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> Add
                </button>
              </div>
              {addons.length > 0 && (
                <ul className="space-y-2 mt-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {addons.map((addon, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-4 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <PlusCircle className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{addon.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">₹{addon.price}</span>
                        <button type="button" onClick={() => handleRemoveAddon(idx)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                          <MinusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </form>
        </div>
        
        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="service-form" 
            disabled={isSubmitting} 
            className="px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-primary-600/25 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isSubmitting ? 'Saving...' : (editService ? 'Update Service' : 'Save Service')}
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

const ServiceCatalogPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [viewingEntity, setViewingEntity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/service-catalog');
      setServices(res.data);
    } catch (error) {
      console.error('Failed to fetch service catalog', error);
      setError('Failed to load services. Please try again later.');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      await api.delete(`/service-catalog/${serviceToDelete.id}`);
      showToast('Service deleted successfully', 'success');
      setServiceToDelete(null);
      fetchServices();
    } catch (error) {
      console.error('Failed to delete service', error);
      showToast('Failed to delete service', 'error');
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = services.filter(srv => {
    const term = debouncedSearchTerm.toLowerCase();
    const matchesSearch = 
      srv.variantName?.toLowerCase().includes(term) || 
      srv.serviceGroup?.toLowerCase().includes(term) ||
      srv.serviceId?.toLowerCase().includes(term);
      
    const matchesCategory = categoryFilter === 'All' ? true : srv.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColors = (category) => {
    switch(category) {
      case 'Digital Marketing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
      case 'Development': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200';
      case 'Promotion Kit': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Service Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage all your offered services and pricing packages.</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => {
              setSelectedService(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl hover:from-primary-700 hover:to-indigo-700 font-bold text-sm transition-all shadow-lg shadow-primary-600/25 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Service
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none transition-all dark:text-white shadow-inner"
            />
          </div>
          
          <div className="relative">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-inner"
            >
              <option value="All">All Categories</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="Development">Development</option>
              <option value="Promotion Kit">Promotion Kit</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonCards count={8} />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-red-900 dark:text-red-400 mb-2">Error Loading Services</h3>
          <p className="text-red-700 dark:text-red-500 max-w-md">{error}</p>
          <button onClick={fetchServices} className="mt-8 px-6 py-2.5 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200">
            Try Again
          </button>
        </div>
      ) : filteredServices.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No services found"
          description="We couldn't find any services matching your current filters. Add a new service to get started."
          actionLabel="Add Service"
          onAction={() => {
            setSelectedService(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {filteredServices.map(srv => (
            <div key={srv.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative group">
              <div className={`h-2 w-full absolute top-0 left-0 ${srv.category === 'Digital Marketing' ? 'bg-blue-500' : srv.category === 'Development' ? 'bg-purple-500' : 'bg-orange-500'}`}></div>
              
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md border ${getCategoryColors(srv.category)}`}>
                    {srv.category}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setViewingEntity(srv)}
                      className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <>
                        <button 
                          onClick={() => { setSelectedService(srv); setIsModalOpen(true); }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-primary-600 rounded-lg transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setServiceToDelete(srv)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{srv.serviceId}</span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {srv.serviceGroup}
                </h3>
                {srv.variantName && (
                  <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-3 truncate">{srv.variantName}</p>
                )}
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{srv.pricingModel}</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">
                      ₹{Number(srv.basePrice).toLocaleString()}
                    </p>
                  </div>
                  {srv.taxApplicable && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md">+ GST</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ServiceModal 
        isOpen={isModalOpen} 
        editService={selectedService}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedService(null);
        }} 
        onSuccess={fetchServices}
      />

      {isAdmin && serviceToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 text-red-600 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Delete Service?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete <span className="font-bold">"{serviceToDelete.serviceGroup} {serviceToDelete.variantName && `(${serviceToDelete.variantName})`}"</span>? All associated data will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                No, Keep it
              </button>
              <button 
                onClick={handleDeleteService}
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
        entityType="service"
      />
    </div>
  );
};

export default ServiceCatalogPage;
