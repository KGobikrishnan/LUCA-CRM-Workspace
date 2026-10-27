import { useState, useEffect } from 'react';
import { Search, X, Plus, Package, Check, Hash } from 'lucide-react';
import api from '../../services/api';

const AddServiceItemModal = ({ isOpen, onClose, onAdd }) => {
  const [services, setServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  
  // Customization state
  const [workingHours, setWorkingHours] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [customFeatures, setCustomFeatures] = useState([]);
  const [newCustomFeature, setNewCustomFeature] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]); // from default
  
  const internalRatePerHour = 500;

  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  const fetchServices = async () => {
    try {
      const res = await api.get('/service-catalog');
      setServices(res.data || []);
    } catch (err) {
      console.error('Failed to fetch services', err);
    }
  };

  const handleSelectService = (srv) => {
    setSelectedService(srv);
    setWorkingHours(1);
    setQuantity(1);
    
    // Parse features if stored as JSON string
    let parsedFeatures = [];
    if (srv.features) {
      try {
        parsedFeatures = typeof srv.features === 'string' ? JSON.parse(srv.features) : srv.features;
      } catch(e) {}
    }
    setSelectedFeatures(Array.isArray(parsedFeatures) ? parsedFeatures : []);
    
    setCustomFeatures([]);
    setSelectedAddons([]);
  };

  const handleAddCustomFeature = () => {
    if (newCustomFeature.trim()) {
      setCustomFeatures([...customFeatures, newCustomFeature.trim()]);
      setNewCustomFeature('');
    }
  };

  const handleRemoveCustomFeature = (idx) => {
    setCustomFeatures(customFeatures.filter((_, i) => i !== idx));
  };

  const handleRemoveFeature = (feat) => {
    setSelectedFeatures(selectedFeatures.filter(f => f !== feat));
  };

  const toggleAddon = (addon) => {
    const exists = selectedAddons.find(a => a.name === addon.name);
    if (exists) {
      setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const calculateItemPrice = () => {
    if (!selectedService) return 0;
    let base = parseFloat(selectedService.basePrice) || 0;
    
    // Add addon prices
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
    
    return (base + addonsTotal) * quantity;
  };
  
  const calculateEstimatedCost = () => {
    return workingHours * internalRatePerHour * quantity;
  };

  const handleAddToInvoice = () => {
    if (!selectedService) return;
    
    const finalPrice = calculateItemPrice();
    const estCost = calculateEstimatedCost();
    
    const allFeatures = [...selectedFeatures, ...customFeatures];
    
    const structuredItem = {
      serviceCatalogId: selectedService.id,
      name: `${selectedService.category} - ${selectedService.variantName}`,
      description: selectedService.description,
      basePrice: selectedService.basePrice,
      price: finalPrice,
      qty: quantity,
      workingHours: workingHours,
      estimatedCost: estCost,
      features: allFeatures,
      addons: selectedAddons,
      serviceGroup: selectedService.serviceGroup,
      serviceId: selectedService.serviceId
    };

    onAdd(structuredItem);
    onClose();
  };

  const filteredServices = services.filter(s => 
    s.category?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.variantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.serviceId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" />
            Add Service Item
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Search & List */}
          <div className="w-1/2 border-r border-slate-100 flex flex-col bg-white">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search services by ID, Name or Category..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => handleSelectService({
                  category: 'Custom Service',
                  variantName: 'Custom',
                  description: '',
                  basePrice: 0,
                  serviceId: 'CUSTOM',
                  serviceGroup: 'Custom'
                })}
                className="mt-3 w-full py-2 border border-dashed border-primary-300 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
              >
                + Add Custom Item
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {filteredServices.map(srv => (
                <div 
                  key={srv.id} 
                  onClick={() => handleSelectService(srv)}
                  className={`p-3 mb-2 rounded-lg cursor-pointer border transition-all ${selectedService?.id === srv.id ? 'border-primary-500 bg-primary-50' : 'border-slate-100 hover:border-primary-200 hover:bg-slate-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">{srv.serviceId}</span>
                        <span className="text-xs font-medium text-slate-500">{srv.serviceGroup}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{srv.category} - {srv.variantName}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{srv.description}</p>
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      ₹{srv.basePrice}
                    </div>
                  </div>
                </div>
              ))}
              {filteredServices.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">No services found.</div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview & Customization */}
          <div className="w-1/2 flex flex-col bg-slate-50/50 overflow-y-auto custom-scrollbar">
            {selectedService ? (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{selectedService.category} - {selectedService.variantName}</h3>
                  <div className="flex gap-2 mb-3">
                    <span className="text-xs font-medium bg-primary-100 text-primary-700 px-2 py-1 rounded">{selectedService.serviceGroup}</span>
                    <span className="text-xs font-medium bg-slate-200 text-slate-700 px-2 py-1 rounded">{selectedService.serviceId}</span>
                  </div>
                  <p className="text-sm text-slate-600">{selectedService.description}</p>
                </div>

                {/* Configuration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Base Price (₹)</label>
                    <input 
                      type="number" 
                      value={selectedService.basePrice} 
                      onChange={(e) => setSelectedService({...selectedService, basePrice: parseFloat(e.target.value) || 0})}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
                    <input 
                      type="number" 
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Actual Working Hours (for cost est.)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Est. Internal Cost: ₹{calculateEstimatedCost()}</p>
                </div>

                {/* Features */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Deliverables & Features</h4>
                  <div className="space-y-2">
                    {selectedFeatures.map((feat, i) => (
                      <div key={i} className="flex justify-between items-center bg-white border border-slate-200 p-2 rounded text-sm">
                        <span>{feat}</span>
                        <button onClick={() => handleRemoveFeature(feat)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {customFeatures.map((feat, i) => (
                      <div key={`custom-${i}`} className="flex justify-between items-center bg-white border border-slate-200 p-2 rounded text-sm">
                        <span>{feat} <span className="text-xs text-primary-600 ml-1">(Custom)</span></span>
                        <button onClick={() => handleRemoveCustomFeature(i)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input 
                      type="text" 
                      value={newCustomFeature}
                      onChange={(e) => setNewCustomFeature(e.target.value)}
                      placeholder="Add custom feature..." 
                      className="flex-1 bg-white border border-slate-300 rounded p-2 text-sm outline-none focus:border-primary-500"
                    />
                    <button onClick={handleAddCustomFeature} className="bg-slate-100 px-3 rounded text-sm font-medium hover:bg-slate-200">Add</button>
                  </div>
                </div>

                {/* Add-ons */}
                {selectedService.optionalAddons && (() => {
                  let parsedAddons = [];
                  try {
                    parsedAddons = typeof selectedService.optionalAddons === 'string' ? JSON.parse(selectedService.optionalAddons) : selectedService.optionalAddons;
                  } catch(e) {}
                  
                  if (!Array.isArray(parsedAddons) || parsedAddons.length === 0) return null;

                  return (
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-2">Optional Add-ons</h4>
                      <div className="space-y-2">
                        {parsedAddons.map((addon, i) => {
                          const isSelected = selectedAddons.some(a => a.name === addon.name);
                          return (
                            <div 
                              key={i} 
                              onClick={() => toggleAddon(addon)}
                              className={`flex justify-between items-center border p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-white hover:border-primary-300'}`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary-600 border-primary-600' : 'border-slate-300'}`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm font-medium">{addon.name}</span>
                              </div>
                              <span className="text-sm font-bold">+₹{addon.price}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <Package className="w-12 h-12 mb-3 text-slate-300" />
                <p>Select a service from the catalog to configure and add it to your quotation.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center z-10">
          <div className="text-slate-600">
            {selectedService && (
              <>Item Total: <span className="text-lg font-bold text-slate-900 ml-1">₹{calculateItemPrice()}</span></>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button 
              onClick={handleAddToInvoice} 
              disabled={!selectedService}
              className="px-6 py-2 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add To Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddServiceItemModal;
