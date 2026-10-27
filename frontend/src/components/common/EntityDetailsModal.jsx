import React from 'react';
import { X, Info, FileText, User, Briefcase, Tag, CheckCircle2, AlertCircle, Clock, Package } from 'lucide-react';

const formatKey = (key) => {
  // Convert camelCase to Title Case
  const result = key.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
};

const formatValue = (key, value) => {
  if (value === null || value === undefined || value === '') return '-';
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Format arrays (like tags)
  if (Array.isArray(value)) {
    if (value.length === 0) return '-';
    if (typeof value[0] === 'string') {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs border border-indigo-100">{v}</span>)}
        </div>
      );
    }
    return `[${value.length} items]`;
  }

  // Format objects (like JSON strings that might have been parsed)
  if (typeof value === 'object') {
    return '{...}';
  }

  // Check if string looks like a date (ISO)
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
  
  // Date-only string (YYYY-MM-DD)
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  // Special formatting for known currency keys
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes('amount') || lowerKey.includes('price') || lowerKey.includes('budget') || lowerKey.includes('salary')) {
    if (!isNaN(parseFloat(value))) {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
    }
  }

  return value.toString();
};

const getEntityConfig = (type) => {
  switch (type) {
    case 'project':
      return { icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', title: 'Project Details' };
    case 'task':
      return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', title: 'Task Details' };
    case 'ticket':
      return { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', title: 'Support Ticket Details' };
    case 'lead':
      return { icon: Tag, color: 'text-amber-600', bg: 'bg-amber-50', title: 'Lead Details' };
    case 'client':
      return { icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50', title: 'Client Details' };
    case 'member':
      return { icon: User, color: 'text-purple-600', bg: 'bg-purple-50', title: 'Team Member Details' };
    case 'service':
      return { icon: Package, color: 'text-teal-600', bg: 'bg-teal-50', title: 'Service Details' };
    default:
      return { icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50', title: 'Details' };
  }
};

const getStatusColor = (val) => {
  if (typeof val !== 'string') return '';
  const s = val.toLowerCase();
  if (s.includes('active') || s.includes('completed') || s.includes('paid') || s.includes('approved') || s.includes('resolved') || s.includes('won')) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (s.includes('pending') || s.includes('progress') || s.includes('open') || s.includes('hold') || s.includes('draft')) return 'text-amber-700 bg-amber-50 border-amber-200';
  if (s.includes('cancelled') || s.includes('rejected') || s.includes('overdue') || s.includes('failed') || s.includes('lost')) return 'text-rose-700 bg-rose-50 border-rose-200';
  return 'text-slate-700 bg-slate-100 border-slate-200';
};

const EntityDetailsModal = ({ isOpen, onClose, data, entityType }) => {
  if (!isOpen || !data) return null;

  const config = getEntityConfig(entityType);
  const Icon = config.icon;

  // Filter out internal/messy fields usually not needed for a quick view
  const hiddenKeys = ['id', 'password', 'token', 'items', 'customTerms', 'profitabilityAnalysis'];
  
  const entries = Object.entries(data).filter(([key, val]) => !hiddenKeys.includes(key));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bg} dark:bg-slate-800`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {config.title}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-700 shadow-sm hover:shadow rounded-lg border border-slate-200 dark:border-slate-600 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {entries.map(([key, value]) => {
              // Special highlighting for status fields
              const isStatus = key.toLowerCase().includes('status');
              
              return (
                <div key={key} className="flex flex-col gap-1.5 border-b border-slate-100 dark:border-slate-700/50 pb-3 last:border-0 md:last:border-b-0">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {formatKey(key)}
                  </span>
                  
                  {isStatus ? (
                    <div className="flex items-start">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(value)}`}>
                        {formatValue(key, value)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-words">
                      {formatValue(key, value)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 shrink-0 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-[0_4px_12px_rgba(79,70,229,0.2)]">
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};

export default EntityDetailsModal;
