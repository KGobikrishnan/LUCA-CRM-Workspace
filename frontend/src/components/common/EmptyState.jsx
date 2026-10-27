import { FolderOpen, Plus } from 'lucide-react';

const EmptyState = ({ icon: Icon = FolderOpen, title = 'No Data Found', description = 'Get started by creating a new entry.', actionLabel, onAction }) => {
  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-primary-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-semibold text-sm rounded-lg hover:bg-primary-700 transition-all shadow-sm shadow-primary-200 hover:shadow-md hover:shadow-primary-200"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
