import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Search, Filter, ReceiptIndianRupee, Plus, LayoutList, LayoutGrid, CheckCircle2, Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/common/Toast';
import useDebounce from '../../hooks/useDebounce';
import { formatCurrency } from '../../utils/currency';
import DocumentViewerModal from '../../components/financials/DocumentViewerModal';

const NewReceiptModal = ({ isOpen, onClose, onSuccess, clients, invoices, editReceipt = null }) => {
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      receiptId: 'Auto-generated on save',
      paymentDate: new Date().toISOString().split('T')[0],
      isLinkedToInvoice: false,
      receivedBy: 'admin',
      paymentMode: 'Bank Transfer',
      paymentPurpose: 'Service Income'
    }
  });

  useEffect(() => {
    if (editReceipt) {
      reset({
        receiptId: editReceipt.receiptId || '',
        paymentDate: editReceipt.paymentDate || editReceipt.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        isLinkedToInvoice: editReceipt.isLinkedToInvoice || false,
        invoiceId: editReceipt.invoiceId || '',
        clientId: editReceipt.clientId || '',
        amount: editReceipt.amount || 0,
        paymentMode: editReceipt.paymentMode || 'Bank Transfer',
        paymentPurpose: editReceipt.paymentPurpose || 'Service Income',
        referenceNumber: editReceipt.referenceNumber || '',
        notes: editReceipt.notes || '',
        receivedBy: editReceipt.receivedBy || 'admin'
      });
    } else {
      reset({
        receiptId: 'Auto-generated on save',
        paymentDate: new Date().toISOString().split('T')[0],
        isLinkedToInvoice: false,
        invoiceId: '',
        clientId: '',
        amount: '',
        paymentMode: 'Bank Transfer',
        paymentPurpose: 'Service Income',
        referenceNumber: '',
        notes: '',
        receivedBy: 'admin'
      });
    }
  }, [editReceipt, reset, isOpen]);
  
  const { showToast } = useToast();

  const selectedClientId = useWatch({ control, name: 'clientId' });
  const isLinkedToInvoice = useWatch({ control, name: 'isLinkedToInvoice' });

  const clientInvoices = useMemo(() => {
    if (!selectedClientId) return [];
    return invoices.filter(inv => inv.clientId === selectedClientId);
  }, [selectedClientId, invoices]);

  const onSubmit = async (data) => {
    try {
      if (!data.clientId) {
        showToast('Please select a client', 'error');
        return;
      }
      if (data.isLinkedToInvoice && !data.invoiceId) {
        showToast('Please select an invoice to link', 'error');
        return;
      }

      const payload = { 
        ...data,
        createdAt: editReceipt ? editReceipt.createdAt : new Date().toISOString()
      };
      
      // Clear the "Auto-generated" placeholder so backend generates one
      if (payload.receiptId === 'Auto-generated on save') {
        payload.receiptId = ''; 
      }

      if (editReceipt) {
        await api.put(`/receipts/${editReceipt.id}`, payload);
        showToast('Payment receipt updated successfully!', 'success');
      } else {
        await api.post('/receipts', payload);
        showToast('Payment receipt logged successfully!', 'success');
      }
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save receipt', error);
      showToast('Failed to save payment receipt.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 shrink-0">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ReceiptIndianRupee className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {editReceipt ? 'Edit Payment Receipt' : 'New Manual Payment Receipt'}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-700 shadow-sm p-1.5 rounded-md border border-slate-200 dark:border-slate-600">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="receipt-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Payment Receipt ID</label>
                <input type="text" {...register("receiptId")} readOnly className="w-full bg-slate-200/50 border-transparent rounded-lg p-2.5 text-sm font-medium text-slate-500 cursor-not-allowed outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Payment Date *</label>
                <input type="date" {...register("paymentDate", { required: true })} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            
            {/* Payment Details */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-800">Payment Details</h3>
              </div>
              <div className="p-5 space-y-5 bg-white">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Name *</label>
                  <select {...register("clientId", { required: true })} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.businessName} ({c.primaryContact})</option>)}
                  </select>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input type="checkbox" {...register("isLinkedToInvoice")} className="w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-slate-300 focus:ring-indigo-500" />
                    <span className="text-sm font-bold text-slate-800">Link To Existing Invoice?</span>
                  </label>
                  
                  {isLinkedToInvoice && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Invoice</label>
                      <select {...register("invoiceId")} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option value="">-- Choose an Invoice --</option>
                        {clientInvoices.length === 0 && <option value="" disabled>No invoices found for this client</option>}
                        {clientInvoices.map(inv => (
                          <option key={inv.id} value={inv.id}>{inv.invoiceId} - Total: {formatCurrency(inv.total)} - Status: {inv.paymentStatus}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-800">Transaction Details</h3>
              </div>
              <div className="p-5 bg-white dark:bg-slate-800 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount Received (₹) *</label>
                    <input type="number" step="0.01" {...register("amount", { required: true })} className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:font-normal" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Mode *</label>
                    <select {...register("paymentMode", { required: true })} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online Gateway">Online Gateway</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Purpose *</label>
                    <select {...register("paymentPurpose", { required: true })} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="Service Income">Service Income</option>
                      <option value="Advance Payment">Advance Payment</option>
                      <option value="Adjustment/Misc">Adjustment/Misc</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Reference / Cheque No.</label>
                    <input type="text" {...register("referenceNumber")} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. UTR Number or Cheque ID" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes / Description</label>
                  <textarea {...register("notes")} rows="2" className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Add any extra details..."></textarea>
                </div>
              </div>
            </div>

            {/* Footer Form Meta */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Received By</label>
              <input type="text" {...register("receivedBy")} className="w-full bg-white dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none max-w-sm" />
            </div>

          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 flex justify-end gap-3 shrink-0 rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">Cancel</button>
          <button type="submit" form="receipt-form" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 shadow-md transition-colors flex items-center gap-2">
            {isSubmitting ? 'Saving...' : (editReceipt ? 'Update Receipt' : 'Save Receipt')}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReceiptsPage = () => {
  const [receipts, setReceipts] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'list';
  }); // 'list' or 'grid'
  const [viewingDocument, setViewingDocument] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('All Modes');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, cliRes, invRes] = await Promise.all([
        api.get('/receipts').catch(() => ({ data: [] })),
        api.get('/clients').catch(() => ({ data: [] })),
        api.get('/invoices').catch(() => ({ data: [] }))
      ]);
      setReceipts(recRes.data);
      setClients(cliRes.data);
      setInvoices(invRes.data);
    } catch (error) {
      console.error('Failed to fetch', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReceipt = async (id) => {
    if (window.confirm("Are you sure you want to delete this receipt?")) {
      try {
        await api.delete(`/receipts/${id}`);
        showToast('Receipt deleted successfully', 'success');
        fetchData();
      } catch (err) {
        console.error(err);
        showToast('Failed to delete receipt', 'error');
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredReceipts = useMemo(() => {
    return receipts.filter(rec => {
      // Text Search
      const searchMatch = !debouncedSearch || 
                          rec.receiptId?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                          clients.find(c=>c.id===rec.clientId)?.businessName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                          rec.referenceNumber?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      // Mode
      const modeMatch = modeFilter === 'All Modes' || rec.paymentMode === modeFilter;
      
      // Date Range
      const itemDate = new Date(rec.paymentDate || rec.createdAt);
      const fromMatch = !fromDate || itemDate >= new Date(fromDate);
      const toMatch = !toDate || itemDate <= new Date(toDate);

      return searchMatch && modeMatch && fromMatch && toMatch;
    }).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [receipts, debouncedSearch, modeFilter, fromDate, toDate, clients]);

  return (
    <div className="space-y-4 lg:space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Receipts</h1>
          <p className="text-sm text-slate-500 mt-1">Record and manage manual payments received from clients.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold text-sm transition-colors shadow-[0_4px_12px_rgba(79,70,229,0.2)]"
        >
          <Plus className="w-5 h-5" /> Record Payment
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800/60 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search ID, Client or Ref..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <select 
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none pr-2 cursor-pointer"
            >
              <option value="All Modes">All Modes</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary-500 shadow-sm"
            />
            <span className="text-slate-400 text-sm font-medium">to</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary-500 shadow-sm"
            />
          </div>
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
      ) : filteredReceipts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 border-dashed p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"><ReceiptIndianRupee className="w-8 h-8 text-slate-400 dark:text-slate-500" /></div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No receipts found</h3>
          <p className="text-slate-500 max-w-sm mt-1 mb-6">Log a payment when a client transfers funds or settles an invoice.</p>
          <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:bg-indigo-900/40 transition-colors">Record Payment</button>
        </div>
      ) : (
        viewMode === 'list' ? (
          <div className="bg-white dark:bg-slate-800/60 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Receipt ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800/40 divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredReceipts.map(rec => {
                  const clientObj = clients.find(c => c.id === rec.clientId);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                        {rec.paymentDate || rec.createdAt?.split('T')[0] || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">{rec.receiptId}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{clientObj?.businessName || 'Unknown'}</div>
                        {rec.isLinkedToInvoice && <div className="text-[10px] font-bold text-blue-600 bg-blue-50 inline-block px-1.5 py-0.5 rounded uppercase mt-1">Invoice Linked</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-black text-emerald-600">+{formatCurrency(rec.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{rec.paymentMode}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                        {rec.paymentPurpose}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                        {rec.referenceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 opacity-60 hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewingDocument(rec)} className="p-1.5 text-slate-400 hover:text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:bg-indigo-900/30 rounded" title="View PDF">
                            <ReceiptIndianRupee className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedReceipt(rec); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteReceipt(rec.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
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
            {filteredReceipts.map(rec => {
              const clientObj = clients.find(c => c.id === rec.clientId);
              return (
                <div key={rec.id} className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between h-full relative group">
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div>
                        <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded">{rec.receiptId}</span>
                        <p className="text-[11px] text-slate-400 mt-2 font-medium">{rec.paymentDate || rec.createdAt?.split('T')[0]}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-lg font-black text-emerald-600">+{formatCurrency(rec.amount)}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{clientObj?.businessName || 'Unknown'}</h4>
                      {rec.isLinkedToInvoice && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">Invoice Linked</span>}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4 mt-auto">
                    <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                      <div>
                        <span className="text-slate-400 block mb-0.5 font-medium">Mode</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{rec.paymentMode}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5 font-medium">Purpose</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{rec.paymentPurpose}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block mb-0.5 font-medium">Reference</span>
                        <span className="font-mono text-xs text-slate-600 bg-slate-50 dark:bg-slate-750 px-2 py-1 rounded block truncate">{rec.referenceNumber || '-'}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-1 pt-2 border-t border-slate-50 dark:border-slate-800">
                      <button onClick={() => setViewingDocument(rec)} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 rounded-xl transition-all font-bold" title="View PDF">
                        View
                      </button>
                      <button onClick={() => { setSelectedReceipt(rec); setIsModalOpen(true); }} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-600 rounded-xl transition-all" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteReceipt(rec.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-xl transition-all" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      <NewReceiptModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedReceipt(null); }} 
        onSuccess={fetchData} 
        clients={clients} 
        invoices={invoices} 
        editReceipt={selectedReceipt}
      />

      <DocumentViewerModal 
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        documentData={viewingDocument}
        type="receipt"
        client={viewingDocument ? clients.find(c => c.id === viewingDocument.clientId) : null}
      />
    </div>
  );
};

export default ReceiptsPage;
