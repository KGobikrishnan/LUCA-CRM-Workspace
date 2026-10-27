const SkeletonRow = ({ cols = 5 }) => (
  <tr className="border-b border-slate-50">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className={`h-4 bg-slate-200 rounded-md animate-skeleton ${
          i === 0 ? 'w-20' : i === cols - 1 ? 'w-16' : 'w-full max-w-[180px]'
        }`} />
      </td>
    ))}
  </tr>
);

const SkeletonTable = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header skeleton */}
      <div className="border-b border-slate-100 px-6 py-4">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3 bg-slate-100 rounded animate-skeleton" style={{ width: `${60 + Math.random() * 60}px` }} />
          ))}
        </div>
      </div>
      {/* Rows */}
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SkeletonCards = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div className="h-5 bg-slate-200 rounded animate-skeleton w-24" />
            <div className="h-6 bg-slate-100 rounded-full animate-skeleton w-16" />
          </div>
          <div className="h-6 bg-slate-200 rounded animate-skeleton w-3/4" />
          <div className="h-4 bg-slate-100 rounded animate-skeleton w-1/2" />
          <div className="pt-4 border-t border-slate-50 flex justify-between">
            <div className="h-4 bg-slate-100 rounded animate-skeleton w-20" />
            <div className="h-4 bg-slate-100 rounded animate-skeleton w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};

export { SkeletonTable, SkeletonCards };
export default SkeletonTable;
