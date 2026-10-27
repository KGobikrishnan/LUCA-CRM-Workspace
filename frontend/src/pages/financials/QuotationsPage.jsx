import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { Search, Plus, Filter, FileText, Trash2, Edit, ChevronDown, CheckCircle2, TrendingUp, TrendingDown, ArrowRight, X, LayoutGrid, LayoutList } from 'lucide-react';
import api from '../../services/api';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../components/common/Toast';
import { formatCurrency } from '../../utils/currency';
import AddServiceItemModal from '../../components/financials/AddServiceItemModal';
import DocumentViewerModal from '../../components/financials/DocumentViewerModal';

const DEFAULT_TERMS = [
  "Validity: This quotation is valid for 15 days from the date of issue.",
  "Payment Terms: 50% advance to start the project, 50% before final delivery.",
  "GST: Rates mentioned are exclusive of GST (Currently Not Applicable unless specified).",
  "Revisions: Up to 3 rounds of minor revisions are included. Major layout changes will be charged extra.",
  "Content: Text and images must be provided by the client unless 'Content Writing' is purchased."
];

const NewQuotationModal = ({ isOpen, onClose, onSuccess, clients, leads, editQuotation = null }) => {
  const { register, control, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      isForLead: false,
      items: [],
      customTerms: [...DEFAULT_TERMS],
      discountType: '%',
      discountValue: 0,
      gstEnabled: false,
      creditTerms: 'Immediate', // Immediate, 15 Days, 30 Days, High Risk
      createdAt: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      followUp: ''
    }
  });

  useEffect(() => {
    if (editQuotation) {
      let parsedItems = [];
      let parsedTerms = [...DEFAULT_TERMS];
      try {
        parsedItems = typeof editQuotation.items === 'string' ? JSON.parse(editQuotation.items) : (editQuotation.items || []);
      } catch (e) {
        console.error("Failed to parse items", e);
      }
      try {
        parsedTerms = typeof editQuotation.customTerms === 'string' ? JSON.parse(editQuotation.customTerms) : (editQuotation.customTerms || [...DEFAULT_TERMS]);
      } catch (e) {
        console.error("Failed to parse customTerms", e);
      }
      reset({
        isForLead: editQuotation.isForLead || false,
        leadId: editQuotation.leadId || '',
        clientId: editQuotation.clientId || '',
        items: parsedItems,
        customTerms: parsedTerms,
        discountType: editQuotation.discountType || '%',
        discountValue: editQuotation.discountValue || 0,
        gstEnabled: editQuotation.gstEnabled || false,
        creditTerms: editQuotation.creditTerms || 'Immediate',
        createdAt: editQuotation.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        validUntil: editQuotation.validUntil || '',
        followUp: editQuotation.followUp || '',
        notes: editQuotation.notes || ''
      });
    } else {
      reset({
        isForLead: false,
        items: [],
        customTerms: [...DEFAULT_TERMS],
        discountType: '%',
        discountValue: 0,
        gstEnabled: false,
        creditTerms: 'Immediate',
        createdAt: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        followUp: '',
        notes: ''
      });
    }
  }, [editQuotation, reset, isOpen]);
  
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const { showToast } = useToast();
  
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [newTerm, setNewTerm] = useState('');

  const mockId = `QTN-${Math.floor(1000 + Math.random() * 9000)}`;

  // Watch fields for calculations
  const items = useWatch({ control, name: 'items' }) || [];
  const creditTerms = useWatch({ control, name: 'creditTerms' });
  const discountType = useWatch({ control, name: 'discountType' });
  const discountValue = useWatch({ control, name: 'discountValue' });
  const gstEnabled = useWatch({ control, name: 'gstEnabled' });
  const customTerms = useWatch({ control, name: 'customTerms' }) || [];
  const isForLead = useWatch({ control, name: 'isForLead' });

  // Get markup based on credit terms
  const getCreditMarkup = (term) => {
    switch(term) {
      case '15 Days': return 0.05;
      case '30 Days': return 0.10;
      case 'High Risk': return 0.15;
      default: return 0; // Immediate
    }
  };

  const creditMarkup = getCreditMarkup(creditTerms);

  // Calculate totals
  const { grossSubtotal, totalEstCost } = useMemo(() => {
    let gross = 0;
    let cost = 0;
    items.forEach(item => {
      // Apply hidden credit markup to each item's price
      const itemBase = parseFloat(item.price) || 0;
      const itemWithMarkup = itemBase * (1 + creditMarkup);
      gross += itemWithMarkup;
      cost += parseFloat(item.estimatedCost) || 0;
    });
    return { grossSubtotal: gross, totalEstCost: cost };
  }, [items, creditMarkup]);

  // Apply discounts
  let discountAmount = 0;
  const dVal = parseFloat(discountValue) || 0;
  if (discountType === '%') {
    discountAmount = grossSubtotal * (dVal / 100);
  } else if (discountType === 'Rs') {
    discountAmount = dVal;
  }

  const taxableValue = Math.max(0, grossSubtotal - discountAmount);
  const taxAmount = gstEnabled ? taxableValue * 0.18 : 0;
  const grandTotal = taxableValue + taxAmount;

  // Profitability
  const netProfit = grandTotal - totalEstCost;
  const marginPercent = grandTotal > 0 ? (netProfit / grandTotal) * 100 : 0;
  let marginTier = 'Low Margin';
  let marginColor = 'text-red-600 bg-red-50';
  if (marginPercent > 40) { marginTier = 'High Margin'; marginColor = 'text-green-600 bg-green-50'; }
  else if (marginPercent > 20) { marginTier = 'Medium Margin'; marginColor = 'text-amber-600 bg-amber-50'; }

  const profitabilityAnalysis = {
    totalEstCost,
    netProfit,
    marginPercent,
    marginTier
  };

  const handleAddTerm = () => {
    if (newTerm.trim()) {
      setValue('customTerms', [...customTerms, newTerm.trim()]);
      setNewTerm('');
    }
  };

  const handleRemoveTerm = (idx) => {
    setValue('customTerms', customTerms.filter((_, i) => i !== idx));
  };

  const handleAddServiceItem = (item) => {
    append(item);
  };

  const onSubmit = async (data) => {
    try {
      if (data.isForLead && !data.leadId) { showToast('Please select a lead', 'error'); return; }
      if (!data.isForLead && !data.clientId) { showToast('Please select a client', 'error'); return; }
      if (data.items.length === 0) { showToast('Please add at least one line item', 'error'); return; }

      // Map final prices including markup back to items array before sending to DB
      const finalItems = data.items.map(item => ({
        ...item,
        finalPriceApplied: (parseFloat(item.price) || 0) * (1 + creditMarkup)
      }));

      const payload = { 
        ...data, 
        quotationId: editQuotation ? editQuotation.quotationId : mockId,
        items: JSON.stringify(finalItems),
        customTerms: JSON.stringify(data.customTerms),
        profitabilityAnalysis: JSON.stringify(profitabilityAnalysis),
        grossSubtotal,
        discountValue: dVal,
        taxableValue,
        total: grandTotal,
        creditMarkupPercentage: creditMarkup * 100,
        status: editQuotation ? editQuotation.status : 'Draft',
        createdAt: data.createdAt ? `${data.createdAt}T00:00:00` : new Date().toISOString(),
        validUntil: data.validUntil || null,
        followUp: data.followUp || null,
        leadId: data.isForLead ? (data.leadId || null) : null,
        clientId: !data.isForLead ? (data.clientId || null) : null
      };

      if (editQuotation) {
        await api.put(`/quotations/${editQuotation.id}`, payload);
        showToast('Quotation updated successfully!', 'success');
      } else {
        await api.post('/quotations', payload);
        showToast('Quotation created successfully!', 'success');
      }
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save quotation', error);
      showToast('Failed to save quotation.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-5xl h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {editQuotation ? 'Edit Quotation' : 'Create New Quotation'}
            </h2>
            <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded uppercase tracking-wider">{mockId}</span>
              <span>Internal Rate: <strong className="text-indigo-700 dark:text-indigo-400">₹500/hr</strong></span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-700 shadow-sm p-1.5 rounded-md border border-slate-200 dark:border-slate-600">
            ✕
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
          <form id="quotation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Client / Lead Selection & Dates */}
            <div className="grid grid-cols-12 gap-6 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-100">
              
              <div className="col-span-5 border-r border-slate-200 pr-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-bold text-slate-800">Quotation For</label>
                  <div className="flex bg-white dark:bg-slate-700 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button 
                      type="button" 
                      onClick={() => setValue('isForLead', false)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!isForLead ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Existing Client
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setValue('isForLead', true)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${isForLead ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      New Lead
                    </button>
                  </div>
                </div>
                
                {isForLead ? (
                  <div>
                    <select {...register("leadId")} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="">Select Lead</option>
                      {leads.map(l => (
                        <option key={l.id} value={l.id}>{l.companyOrg || l.leadName}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <select {...register("clientId")} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="">Select Client</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.businessName} ({c.primaryContact})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="col-span-7 grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Created Date</label>
                  <input type="date" {...register("createdAt")} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Valid Until</label>
                  <input type="date" {...register("validUntil")} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Follow Up</label>
                  <input type="date" {...register("followUp")} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
            </div>

            {/* Credit Terms */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Credit Terms</label>
              <div className="flex items-center gap-4">
                <select {...register("creditTerms")} className="w-64 bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm">
                  <option value="Immediate">Immediate (0% Markup)</option>
                  <option value="15 Days">15 Days (+5% Markup)</option>
                  <option value="30 Days">30 Days (+10% Markup)</option>
                  <option value="High Risk">High Risk (+15% Markup)</option>
                </select>
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  <span className="font-bold">Note:</span> The {creditMarkup * 100}% markup will be applied invisibly to all service line items in the final invoice.
                </p>
              </div>
            </div>

            {/* Line Items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">Service Line Items</h3>
                <button 
                  type="button" 
                  onClick={() => setIsServiceModalOpen(true)} 
                  className="px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
              
              <div className="p-0">
                {fields.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm bg-white">
                    No items added yet. Click "+ Add Item" to browse the service catalog.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-slate-200 bg-white">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3 text-left">Service details</th>
                        <th className="px-5 py-3 text-center">Qty</th>
                        <th className="px-5 py-3 text-right">Visible Price (₹)</th>
                        <th className="px-5 py-3 text-right">Est. Cost</th>
                        <th className="px-5 py-3 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {fields.map((item, index) => {
                        const basePrice = parseFloat(item.price) || 0;
                        const visiblePrice = basePrice * (1 + creditMarkup); // Applying hidden markup
                        
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 dark:bg-slate-900/30 group">
                            <td className="px-5 py-4">
                              <div className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</div>
                              {item.features?.length > 0 && (
                                <ul className="mt-1 space-y-0.5">
                                  {item.features.map((f, i) => (
                                    <li key={i} className="text-[11px] text-slate-500 flex items-start gap-1">
                                      <span className="text-primary-500">•</span> {f}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {item.addons?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {item.addons.map((a, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] border border-indigo-100">
                                      +{a.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center text-sm font-medium text-slate-700 dark:text-slate-200">{item.qty}</td>
                            <td className="px-5 py-4 text-right">
                              <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(visiblePrice)}</div>
                              {creditMarkup > 0 && (
                                <div className="text-[10px] text-amber-600 line-through decoration-amber-300">
                                  Base: {formatCurrency(basePrice)}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                              {formatCurrency(item.estimatedCost)}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button 
                                type="button" 
                                onClick={() => remove(index)} 
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Scope of Work */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Scope Of Work Summary</label>
              <textarea 
                {...register("notes")} 
                rows="3" 
                placeholder="Enter a brief summary of the project scope..."
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
              ></textarea>
            </div>

            {/* Terms and Layout Breakdown */}
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column - Terms */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Terms & Conditions</label>
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                  <ul className="space-y-2 mb-4">
                    {customTerms.map((term, index) => (
                      <li key={index} className="flex gap-2 items-start text-sm text-slate-700 dark:text-slate-200">
                        <span className="text-primary-500 mt-0.5 text-lg leading-none">•</span>
                        <span className="flex-1">{term}</span>
                        <button type="button" onClick={() => handleRemoveTerm(index)} className="text-slate-400 hover:text-red-500 mt-0.5"><X className="w-4 h-4" /></button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newTerm}
                      onChange={(e) => setNewTerm(e.target.value)}
                      placeholder="Add custom term..."
                      className="flex-1 bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddTerm}
                      className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Profitability Analysis Box */}
                <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" /> Internal Profitability Analysis
                    </h3>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-800/40 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Est. Total Cost</p>
                      <p className="text-sm font-bold text-slate-800">{formatCurrency(totalEstCost)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Est. Net Profit</p>
                      <p className={`text-sm font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(netProfit)}
                      </p>
                    </div>
                    <div className="col-span-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                      <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Margin indicator</p>
                      <div className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 ${marginColor}`}>
                        {marginPercent > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {marginTier} ({marginPercent.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Breakdown Calculation */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Final Breakdown</label>
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Gross Subtotal</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(grossSubtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm bg-white dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Additional Discount</span>
                    <div className="flex gap-2 w-48">
                      <select {...register("discountType")} className="w-1/3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md px-1 py-1.5 text-xs outline-none focus:border-primary-400">
                        <option value="%">%</option>
                        <option value="Rs">Rs</option>
                      </select>
                      <input 
                        type="number" 
                        {...register("discountValue")} 
                        className="w-2/3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-sm text-right outline-none focus:border-primary-400"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs text-green-600 px-1">
                      <span>Discount Applied</span>
                      <span className="font-bold">- {formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-800">Taxable Value</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(taxableValue)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm bg-white dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <label className="font-semibold text-slate-700 flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register("gstEnabled")} className="w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-slate-300 focus:ring-indigo-500" />
                      Enable GST (18%)
                    </label>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(taxAmount)}</span>
                  </div>

                  <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-center text-lg">
                    <span className="font-black text-slate-900 dark:text-white">Grand Total</span>
                    <span className="font-black text-indigo-700 dark:text-indigo-400">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>
        
        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 flex justify-end gap-3 shrink-0 rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">Cancel</button>
          <button type="submit" form="quotation-form" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 shadow-md transition-colors flex items-center gap-2">
            {isSubmitting ? 'Saving...' : (editQuotation ? 'Update Quotation' : 'Save Quotation')}
          </button>
        </div>

      </div>

      <AddServiceItemModal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} onAdd={handleAddServiceItem} />
    </div>
  );
};

const QuotationsPage = () => {
  const [quotations, setQuotations] = useState([]);
  const [viewMode, setViewMode] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'list';
  });
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { showToast } = useToast();

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [qtnsRes, clientsRes, leadsRes] = await Promise.all([
        api.get('/quotations').catch(() => ({ data: [] })),
        api.get('/clients').catch(() => ({ data: [] })),
        api.get('/leads').catch(() => ({ data: [] }))
      ]);
      setQuotations(qtnsRes.data);
      setClients(clientsRes.data);
      setLeads(leadsRes.data);
    } catch (error) {
      console.error('Failed to fetch', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuotation = async (id) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      try {
        await api.delete(`/quotations/${id}`);
        showToast('Quotation deleted successfully', 'success');
        fetchInitialData();
      } catch (err) {
        console.error(err);
        showToast('Failed to delete quotation', 'error');
      }
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      // Find current qtn to just PUT it back with updated status
      const qtn = quotations.find(q => q.id === id);
      if(!qtn) return;
      
      const payload = { ...qtn, status: newStatus };
      await api.put(`/quotations/${id}`, payload);
      setQuotations(quotations.map(q => q.id === id ? { ...q, status: newStatus } : q));
      showToast('Status updated successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Draft': return 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200';
      case 'Sent': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200';
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Rejected': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200';
      case 'Invoiced': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border-purple-200';
      case 'Expired': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200';
      default: return 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200';
    }
  };

  const filteredQuotations = useMemo(() => {
    return quotations.filter(qtn => {
      // Search
      const searchMatch = !debouncedSearch || 
                          qtn.quotationId?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                          (qtn.isForLead ? leads.find(l=>l.id===qtn.leadId)?.companyOrg : clients.find(c=>c.id===qtn.clientId)?.businessName)?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      // Status
      const statusMatch = statusFilter === 'All' || qtn.status === statusFilter;
      
      // Date range
      const itemDate = new Date(qtn.createdAt || qtn.validUntil);
      const fromMatch = !fromDate || itemDate >= new Date(fromDate);
      const toMatch = !toDate || itemDate <= new Date(toDate);

      return searchMatch && statusMatch && fromMatch && toMatch;
    });
  }, [quotations, debouncedSearch, statusFilter, fromDate, toDate, clients, leads]);

  return (
    <div className="space-y-4 lg:space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quotations</h1>
          <p className="text-sm text-slate-500 mt-1">Manage sales estimates, terms, and track profitability.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold text-sm transition-colors shadow-[0_4px_12px_rgba(79,70,229,0.2)]"
        >
          <Plus className="w-5 h-5" /> New Quotation
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800/60 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by ID or Client/Lead..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none pr-2 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Invoiced">Invoiced</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary-500 shadow-sm"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary-500 shadow-sm"
          />
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 ml-auto">
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

      {loading ? (
        <div className="bg-white dark:bg-slate-800/60 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-8 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : quotations.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 border-dashed p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" /></div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No quotations found</h3>
          <p className="text-slate-500 max-w-sm mt-1 mb-6">Create your first quotation to send an estimate with advanced pricing and catalog features.</p>
          <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:bg-indigo-900/40 transition-colors">Create Quotation</button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-800/60 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden animate-in fade-in duration-300">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Quote ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Client / Lead</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800/40 divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredQuotations.map(qtn => {
                const clientObj = clients.find(c => c.id === qtn.clientId);
                const leadObj = leads.find(l => l.id === qtn.leadId);
                const entityName = qtn.isForLead ? (leadObj?.companyOrg || leadObj?.leadName) : (clientObj?.businessName);
                
                return (
                  <tr key={qtn.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      {qtn.createdAt?.split('T')[0] || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">{qtn.quotationId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{entityName || 'Unknown'}</div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase">{qtn.isForLead ? 'Lead' : 'Client'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(qtn.total)}</div>
                      {qtn.grossSubtotal && qtn.grossSubtotal > qtn.total && (
                        <div className="text-xs text-green-600 font-medium">Discount applied</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative inline-block">
                        <select 
                          value={qtn.status || 'Draft'}
                          onChange={(e) => handleStatusChange(qtn.id, e.target.value)}
                          className={`appearance-none text-xs font-bold pl-3 pr-8 py-1.5 rounded-full border outline-none cursor-pointer transition-colors ${getStatusColor(qtn.status || 'Draft')}`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Sent">Sent</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Invoiced">Invoiced</option>
                          <option value="Expired">Expired</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setViewingDocument(qtn)} className="p-1.5 text-slate-400 hover:text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:bg-indigo-900/30 rounded" title="View PDF"><FileText className="w-4 h-4" /></button>
                        <button onClick={() => { setSelectedQuotation(qtn); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteQuotation(qtn.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredQuotations.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    No quotations match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {filteredQuotations.map(qtn => {
            const clientObj = clients.find(c => c.id === qtn.clientId);
            const leadObj = leads.find(l => l.id === qtn.leadId);
            const entityName = qtn.isForLead ? (leadObj?.companyOrg || leadObj?.leadName) : (clientObj?.businessName);
            
            let profitability = null;
            try {
              if (qtn.profitabilityAnalysis) {
                profitability = typeof qtn.profitabilityAnalysis === 'string' ? JSON.parse(qtn.profitabilityAnalysis) : qtn.profitabilityAnalysis;
              }
            } catch(e) {
              console.error(e);
            }

            const marginPercent = profitability?.marginPercent || 0;
            const marginTier = profitability?.marginTier || 'Low Margin';
            let marginColor = 'text-red-600 bg-red-50 dark:bg-red-950/20';
            if (marginPercent > 40) marginColor = 'text-green-600 bg-green-50 dark:bg-green-950/20';
            else if (marginPercent > 20) marginColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/20';

            return (
              <div key={qtn.id} className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between h-full relative group">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded">
                        {qtn.quotationId}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-2 font-medium">
                        {qtn.createdAt?.split('T')[0] || '-'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      qtn.isForLead ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                    }`}>
                      {qtn.isForLead ? 'Lead' : 'Client'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 line-clamp-2">
                    {entityName || 'Unknown'}
                  </h3>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-lg font-black text-indigo-700 dark:text-indigo-400">
                      {formatCurrency(qtn.total)}
                    </span>
                    {qtn.grossSubtotal && qtn.grossSubtotal > qtn.total && (
                      <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded ml-2">Discount applied</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4 mt-auto">
                  <div className="flex justify-between items-center gap-4 mb-4">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                      <div className="relative inline-block">
                        <select 
                          value={qtn.status || 'Draft'}
                          onChange={(e) => handleStatusChange(qtn.id, e.target.value)}
                          className={`appearance-none text-xs font-bold pl-3 pr-8 py-1.5 rounded-full border outline-none cursor-pointer transition-colors ${getStatusColor(qtn.status || 'Draft')}`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Sent">Sent</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Invoiced">Invoiced</option>
                          <option value="Expired">Expired</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Profitability</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${marginColor}`}>
                        {marginPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1 pt-2 border-t border-slate-50 dark:border-slate-800">
                    <button onClick={() => setViewingDocument(qtn)} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 rounded-xl transition-all" title="View PDF">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setSelectedQuotation(qtn); setIsModalOpen(true); }} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-600 rounded-xl transition-all" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteQuotation(qtn.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-xl transition-all" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NewQuotationModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedQuotation(null); }} 
        onSuccess={fetchInitialData} 
        clients={clients}
        leads={leads}
        editQuotation={selectedQuotation}
      />

      <DocumentViewerModal 
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        documentData={viewingDocument}
        type="quotation"
        client={viewingDocument && !viewingDocument.isForLead ? clients.find(c => c.id === viewingDocument.clientId) : null}
        lead={viewingDocument && viewingDocument.isForLead ? leads.find(l => l.id === viewingDocument.leadId) : null}
      />
    </div>
  );
};

export default QuotationsPage;
