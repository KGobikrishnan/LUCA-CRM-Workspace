import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { 
  Search, Plus, Filter, Grid, List, CheckSquare, Clock, 
  AlertCircle, LayoutGrid, Calendar, Users, ShieldCheck, 
  Trash2, Pencil, X, Briefcase, Flag, Activity, 
  ArrowUpCircle, CheckCircle2, MoreVertical, Timer, ClipboardCheck, Eye
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { useToast } from '../../components/common/Toast';
import { SkeletonCards } from '../../components/common/SkeletonTable';
import EmptyState from '../../components/common/EmptyState';
import EntityDetailsModal from '../../components/common/EntityDetailsModal';

const TaskModal = ({ isOpen, onClose, onSuccess, projects, teamMembers, editTask = null }) => {
  const { register, handleSubmit, reset, control, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      taskType: 'Project',
      deliveryType: 'Sprint',
      status: 'To Do',
      priority: 'M',
      qaStatus: 'Pending',
      reworkCount: 0
    }
  });
  const { showToast } = useToast();

  const taskId = useMemo(() => {
    if (editTask) return editTask.taskId;
    return `TSK-${Math.floor(1000 + Math.random() * 9000)}`;
  }, [isOpen, editTask]);

  const selectedPriority = useWatch({ control, name: 'priority' });
  const selectedStatus = useWatch({ control, name: 'status' });
  const selectedQA = useWatch({ control, name: 'qaStatus' });

  useEffect(() => {
    if (editTask) {
      reset(editTask);
    } else {
      reset({
        taskType: 'Project',
        deliveryType: 'Sprint',
        status: 'To Do',
        priority: 'M',
        qaStatus: 'Pending',
        reworkCount: 0,
        title: '',
        description: '',
        projectId: '',
        assignedTo: '',
        reviewerId: '',
        startDate: '',
        dueDate: '',
        estHours: '',
        actHours: ''
      });
    }
  }, [editTask, reset, isOpen]);

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, taskId };
      if (editTask) {
        await api.put(`/tasks/${editTask.id}`, payload);
        showToast('Task updated successfully!', 'success');
      } else {
        await api.post('/tasks', payload);
        showToast('New task assigned!', 'success');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save task', error);
      showToast('Error saving task.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="px-8 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <CheckSquare className="w-6 h-6" />
              {editTask ? 'Edit Task Record' : 'Create New Task'}
            </h2>
            <p className="text-violet-100 text-xs mt-1 font-medium">Tracking execution <span className="bg-white/20 px-2 py-0.5 rounded-full ml-1 text-white font-mono">{taskId}</span></p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all relative z-10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
          <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Section 1: Task Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Task Title *</label>
                <input type="text" {...register("title", { required: true })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:text-white" placeholder="What needs to be done?" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Project Context</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select {...register("projectId")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:text-white appearance-none">
                    <option value="">-- No Project (Internal) --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Task Type</label>
                  <select {...register("taskType")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:text-white">
                    <option value="Project">Project</option>
                    <option value="Support">Support</option>
                    <option value="Internal">Internal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Delivery Type</label>
                  <select {...register("deliveryType")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:text-white">
                    <option value="Sprint">Sprint</option>
                    <option value="Milestone">Milestone</option>
                    <option value="Ad-Hoc">Ad-Hoc</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Workflow & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority Level</label>
                <div className="flex gap-2">
                  {[
                    { val: 'C', label: 'Critical', color: 'bg-red-600' },
                    { val: 'H', label: 'High', color: 'bg-orange-600' },
                    { val: 'M', label: 'Medium', color: 'bg-blue-600' },
                    { val: 'L', label: 'Low', color: 'bg-slate-600' }
                  ].map(p => (
                    <button 
                      key={p.val} type="button" 
                      onClick={() => setValue('priority', p.val)}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all border-2 ${
                        selectedPriority === p.val 
                          ? `${p.color} text-white border-transparent shadow-lg scale-105` 
                          : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      {p.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</label>
                <div className="flex gap-2">
                  {['To Do', 'In Progress', 'Blocked', 'Completed'].map(s => (
                    <button 
                      key={s} type="button" 
                      onClick={() => setValue('status', s)}
                      className={`flex-1 py-2.5 rounded-xl text-[9px] font-black transition-all border-2 ${
                        selectedStatus === s 
                          ? 'bg-violet-600 text-white border-transparent shadow-lg scale-105' 
                          : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3: People & Roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assigned Member</label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select {...register("assignedTo")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:text-white appearance-none">
                    <option value="">-- Choose Member --</option>
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.fullName} ({m.role})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reviewer / QA</label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select {...register("reviewerId")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:text-white appearance-none">
                    <option value="">-- Choose Reviewer --</option>
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Target & Tracking */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                <input type="date" {...register("startDate")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Date</label>
                <input type="date" {...register("dueDate")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Est. Hours</label>
                <input type="number" step="0.5" {...register("estHours")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:text-white" placeholder="0.0" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Act. Hours</label>
                <input type="number" step="0.5" {...register("actHours")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:text-white" placeholder="0.0" />
              </div>
            </div>

            {/* Section 5: QA & Description */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-6">
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">QA Status</label>
                  <div className="space-y-2">
                    {['Pending', 'Passed', 'Failed'].map(q => (
                      <label key={q} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer group transition-all">
                        <input type="radio" value={q} {...register("qaStatus")} className="w-4 h-4 text-violet-600 focus:ring-violet-500" />
                        <span className={`text-xs font-bold ${selectedQA === q ? 'text-violet-600' : 'text-slate-500'}`}>{q}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rework Count</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setValue('reworkCount', Math.max(0, control._formValues.reworkCount - 1))} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold">-</button>
                    <input type="number" {...register("reworkCount")} className="w-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center text-sm font-bold focus:ring-2 focus:ring-violet-500 outline-none dark:text-white" />
                    <button type="button" onClick={() => setValue('reworkCount', (parseInt(control._formValues.reworkCount) || 0) + 1)} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold">+</button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Description</label>
                <textarea {...register("description")} rows="8" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:text-white resize-none shadow-inner" placeholder="Detailed requirements and notes..."></textarea>
              </div>
            </div>

          </form>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all">Cancel</button>
          <button type="submit" form="task-form" disabled={isSubmitting} className="px-8 py-2.5 text-sm font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-600/20 hover:from-violet-700 hover:to-fuchsia-700 transition-all active:scale-95 disabled:opacity-50">
            {isSubmitting ? 'Syncing...' : (editTask ? 'Update Task' : 'Deploy Task')}
          </button>
        </div>
      </div>
    </div>
  );
};

const MyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [viewingEntity, setViewingEntity] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'list';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
        api.get('/users')
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setTeamMembers(usersRes.data);
    } catch (error) {
      console.error('Fetch failed', error);
      showToast('Failed to sync tasks.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/tasks/${taskToDelete.id}`);
      showToast('Task removed from board.', 'success');
      setTaskToDelete(null);
      fetchData();
    } catch (error) {
      showToast('Action failed.', 'error');
    }
  };

  const isAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';

  // Role-based visibility: Admins see all, others see only their own tasks
  const visibleTasks = tasks.filter(t => {
    if (isAdmin) return true;
    const uid = currentUser?.id;
    return t.assignedTo === uid || t.reviewerId === uid;
  });

  const filteredTasks = visibleTasks.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.taskId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filter === 'All'      ? true :
      filter === 'Assigned' ? t.assignedTo === currentUser?.id :
      filter === 'Reviewer' ? t.reviewerId === currentUser?.id :
      filter === 'Critical' ? t.priority === 'C' : true;
    
    return matchesSearch && matchesFilter;
  });

  const getPriorityInfo = (p) => {
    switch(p) {
      case 'C': return { label: 'Critical', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' };
      case 'H': return { label: 'High', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' };
      case 'M': return { label: 'Medium', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'L': return { label: 'Low', color: 'text-slate-600 bg-slate-100 dark:bg-slate-700/50 dark:text-slate-400' };
      default: return { label: 'Normal', color: 'bg-slate-100' };
    }
  };

  const getStatusColor = (s) => {
    switch(s) {
      case 'Completed': return 'bg-emerald-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Blocked': return 'bg-red-500';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Task Matrix</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Streamline your workflow and hit your milestones.</p>
        </div>
        
        <button 
          onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
          className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl hover:from-violet-700 hover:to-fuchsia-700 font-black text-sm transition-all shadow-xl shadow-violet-600/25 active:scale-95 ${!isAdmin ? 'hidden' : ''}`}
        >
          <Plus className="w-5 h-5" /> New Task
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
              placeholder="Search by task title or ID..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-violet-500 outline-none dark:text-white font-medium"
            />
          </div>
          
          <div className="relative">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none pl-11 pr-8 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-violet-500 outline-none font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-inner"
            >
              {isAdmin ? (
                <>
                  <option value="All">All Board Tasks</option>
                  <option value="Assigned">Assigned to Me</option>
                  <option value="Reviewer">My QA Reviews</option>
                  <option value="Critical">Critical Only</option>
                </>
              ) : (
                <>
                  <option value="All">All My Tasks</option>
                  <option value="Assigned">My Assigned</option>
                  <option value="Reviewer">My QA Reviews</option>
                  <option value="Critical">Critical Only</option>
                </>
              )}
            </select>
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-md text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-md text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonCards count={6} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={isAdmin ? "Board is empty" : "No tasks assigned to you"}
          description={isAdmin ? "No tasks match your current view. Create a new task to keep the momentum going." : "You have no tasks assigned as a member or reviewer yet. Contact your Admin."}
          actionLabel={isAdmin ? "New Task" : undefined}
          onAction={isAdmin ? () => setIsModalOpen(true) : undefined}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTasks.map(t => (
            <div key={t.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:border-violet-400 dark:hover:border-violet-500 transition-all duration-300 group relative flex flex-col overflow-hidden">
               <div className={`h-1.5 w-full ${getStatusColor(t.status)}`}></div>
               
               <div className="p-6 flex-1">
                 <div className="flex justify-between items-start mb-4">
                   <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-900 text-slate-500 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 tracking-tighter">
                     {t.taskId}
                   </span>
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewingEntity(t)} className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 rounded-lg transition-all" title="View Details"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setSelectedTask(t); setIsModalOpen(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-violet-600 rounded-lg transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setTaskToDelete(t)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                   </div>
                 </div>

                 <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors leading-tight mb-2">
                   {t.title}
                 </h3>
                 <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 font-medium leading-relaxed">
                   {t.description || 'No description provided.'}
                 </p>

                 <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-slate-50 dark:bg-slate-900/30 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Priority</p>
                     <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${getPriorityInfo(t.priority).color}`}>{getPriorityInfo(t.priority).label}</span>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-900/30 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">QA Status</p>
                     <p className={`text-[9px] font-bold ${t.qaStatus === 'Passed' ? 'text-emerald-600' : t.qaStatus === 'Failed' ? 'text-red-600' : 'text-slate-500'}`}>{t.qaStatus}</p>
                   </div>
                 </div>

                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center text-[10px] font-black text-violet-600 dark:text-violet-300">
                        {teamMembers.find(m => m.id === t.assignedTo)?.fullName?.charAt(0) || 'U'}
                     </div>
                     <p className="text-[10px] font-bold text-slate-500">{t.status}</p>
                   </div>
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                     <Calendar className="w-3 h-3 text-violet-500" />
                     {t.dueDate || 'N/A'}
                   </div>
                 </div>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Details</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Project / Context</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Priority</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking</th>
                <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
              {filteredTasks.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-8 rounded-full ${getStatusColor(t.status)}`}></div>
                      <div>
                        <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors">{t.title}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t.taskId} • {t.taskType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       <Briefcase className="w-3 h-3 text-slate-400" />
                       <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{projects.find(p => p.id === t.projectId)?.projectName || 'Internal'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">{t.status}</span>
                       <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getPriorityInfo(t.priority).color}`}>{getPriorityInfo(t.priority).label}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-[10px] font-black text-slate-700 dark:text-slate-300">{t.estHours || '0'}h</div>
                        <div className="text-[8px] font-medium text-slate-400 uppercase">EST</div>
                      </div>
                      <div>
                        <div className={`text-[10px] font-black ${t.qaStatus === 'Passed' ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>{t.qaStatus}</div>
                        <div className="text-[8px] font-medium text-slate-400 uppercase">QA</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setViewingEntity(t)} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 rounded-xl transition-all" title="View Details"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { setSelectedTask(t); setIsModalOpen(true); }} className="p-2 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-slate-400 hover:text-violet-600 rounded-xl transition-all"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setTaskToDelete(t)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedTask(null); }} 
        onSuccess={fetchData}
        projects={projects}
        teamMembers={teamMembers}
        editTask={selectedTask}
      />

      {/* Delete Confirmation */}
      {taskToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Archive Task?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{taskToDelete.title}"</span>? This will permanently remove the record from your active board.
            </p>
            
            <div className="flex gap-3">
              <button onClick={() => setTaskToDelete(null)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-3 text-sm font-black text-white bg-red-600 hover:bg-red-700 rounded-2xl shadow-lg shadow-red-600/20 transition-all active:scale-95">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <EntityDetailsModal 
        isOpen={!!viewingEntity}
        onClose={() => setViewingEntity(null)}
        data={viewingEntity}
        entityType="task"
      />
    </div>
  );
};

export default MyTasksPage;
