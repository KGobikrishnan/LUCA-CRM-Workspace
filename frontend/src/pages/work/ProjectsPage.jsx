import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { 
  Search, Plus, Filter, Grid, List, MoreVertical, Calendar, 
  FolderKanban, AlertCircle, CheckCircle2, LayoutGrid, Clock,
  ArrowUpCircle, Heart, Users, Pencil, Trash2, X, Briefcase,
  Flag, Activity, UserPlus, Building2, CheckCircle, Eye
} from 'lucide-react';
import api from '../../services/api';
import { SkeletonCards } from '../../components/common/SkeletonTable';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../components/common/Toast';
import EntityDetailsModal from '../../components/common/EntityDetailsModal';

const ProjectModal = ({ isOpen, onClose, onSuccess, clients, teamMembers, editProject = null }) => {
  const { register, handleSubmit, reset, control, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      type: 'One-Time',
      status: 'Active',
      priority: 'Medium',
      health: 'Green',
      teamMembers: []
    }
  });
  const { showToast } = useToast();

  const projectId = useMemo(() => {
    if (editProject) return editProject.projectId;
    return `PRJ-${Math.floor(1000 + Math.random() * 9000)}`;
  }, [isOpen, editProject]);

  const selectedPriority = useWatch({ control, name: 'priority' });
  const selectedHealth = useWatch({ control, name: 'health' });
  const selectedTeam = useWatch({ control, name: 'teamMembers' }) || [];

  useEffect(() => {
    if (editProject) {
      reset({
        ...editProject,
        teamMembers: editProject.teamMembers?.map(m => m.id) || []
      });
    } else {
      reset({
        type: 'One-Time',
        status: 'Active',
        priority: 'Medium',
        health: 'Green',
        teamMembers: [],
        projectName: '',
        description: '',
        startDate: '',
        targetEnd: '',
        actualEnd: '',
        clientId: ''
      });
    }
  }, [editProject, reset, isOpen]);

  const onSubmit = async (data) => {
    try {
      // Map team member IDs back to objects for the backend if needed, 
      // but usually, the backend expects a list of IDs or objects.
      // Based on our ManyToMany setup, we might need to send objects or IDs.
      const payload = { 
        ...data, 
        projectId,
        teamMembers: data.teamMembers.map(id => ({ id })) 
      };

      if (editProject) {
        await api.put(`/projects/${editProject.id}`, payload);
        showToast('Project updated successfully!', 'success');
      } else {
        await api.post('/projects', payload);
        showToast('New project launched!', 'success');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save project', error);
      showToast('Error saving project.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="px-8 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FolderKanban className="w-6 h-6" />
              {editProject ? 'Edit Project' : 'Launch New Project'}
            </h2>
            <p className="text-blue-100 text-xs mt-1 font-medium">Tracking engagement <span className="bg-white/20 px-2 py-0.5 rounded-full ml-1 text-white font-mono">{projectId}</span></p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all relative z-10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
          <form id="project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Section 1: Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Project Name *</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" {...register("projectName", { required: true })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" placeholder="e.g. Website Redesign Q4" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Client *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select {...register("clientId", { required: true })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none">
                    <option value="">-- Select Client --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.businessName}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Project Type</label>
                <select {...register("type")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white">
                  <option value="One-Time">One-Time Project</option>
                  <option value="Monthly Retainer">Monthly Retainer</option>
                  <option value="AMC">Annual Maintenance (AMC)</option>
                </select>
              </div>
            </div>

            {/* Section 2: Timeline & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                <input type="date" {...register("startDate")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target End</label>
                <input type="date" {...register("targetEnd")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                <select {...register("status")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900">
                  <option value="Onboarding">Onboarding</option>
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Section 3: Priority & Health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority Level</label>
                <div className="flex flex-wrap gap-2">
                  {['Low', 'Medium', 'High', 'Critical'].map(p => (
                    <button 
                      key={p} type="button" 
                      onClick={() => setValue('priority', p)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                        selectedPriority === p 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-95' 
                          : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Health Indicator</label>
                <div className="flex gap-4">
                  {[
                    { val: 'Green', color: 'bg-emerald-500', label: 'On Track' },
                    { val: 'Amber', color: 'bg-amber-500', label: 'At Risk' },
                    { val: 'Red', color: 'bg-red-500', label: 'Critical' }
                  ].map(h => (
                    <button 
                      key={h.val} type="button"
                      onClick={() => setValue('health', h.val)}
                      className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                        selectedHealth === h.val 
                          ? `border-${h.val === 'Green' ? 'emerald' : h.val === 'Amber' ? 'amber' : 'red'}-500 bg-${h.val === 'Green' ? 'emerald' : h.val === 'Amber' ? 'amber' : 'red'}-50 dark:bg-${h.val === 'Green' ? 'emerald' : h.val === 'Amber' ? 'amber' : 'red'}-900/20`
                          : 'border-transparent bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full ${h.color} shadow-sm`}></div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{h.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 4: Team & Scope */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Allocation</label>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
                  <div className="space-y-2">
                    {teamMembers.map(member => (
                      <label key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-500">
                            {member.fullName?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{member.fullName}</p>
                            <p className="text-[10px] text-slate-400">{member.role}</p>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          value={member.id}
                          checked={selectedTeam.includes(member.id)}
                          onChange={(e) => {
                            const val = e.target.value;
                            const current = [...selectedTeam];
                            if (e.target.checked) current.push(val);
                            else {
                              const idx = current.indexOf(val);
                              if (idx > -1) current.splice(idx, 1);
                            }
                            setValue('teamMembers', current);
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">Selected: {selectedTeam.length} members</p>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Description / Scope</label>
                <textarea {...register("description")} rows="6" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none shadow-inner" placeholder="Detailed project scope and deliverables..."></textarea>
              </div>
            </div>

          </form>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all">Cancel</button>
          <button type="submit" form="project-form" disabled={isSubmitting} className="px-8 py-2.5 text-sm font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95 disabled:opacity-50">
            {isSubmitting ? 'Launching...' : (editProject ? 'Update Project' : 'Save & Launch Project')}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [viewingEntity, setViewingEntity] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, clientsRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/clients'),
        api.get('/users')
      ]);
      setProjects(projectsRes.data);
      setClients(clientsRes.data);
      setTeamMembers(usersRes.data);
    } catch (error) {
      console.error('Fetch failed', error);
      showToast('Connection error. Failed to load projects.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!projectToDelete) return;
    try {
      await api.delete(`/projects/${projectToDelete.id}`);
      showToast('Project removed permanently.', 'success');
      setProjectToDelete(null);
      fetchData();
    } catch (error) {
      showToast('Delete failed.', 'error');
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.projectId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = useMemo(() => {
    const active = projects.filter(p => p.status === 'Active').length;
    const critical = projects.filter(p => p.health === 'Red').length;
    const done = projects.filter(p => p.status === 'Completed').length;
    return { active, critical, done };
  }, [projects]);

  const getHealthColor = (health) => {
    switch(health) {
      case 'Green': return 'bg-emerald-500';
      case 'Amber': return 'bg-amber-500';
      case 'Red': return 'bg-red-500';
      default: return 'bg-slate-300';
    }
  };

  const getPriorityColor = (p) => {
    switch(p) {
      case 'Critical': return 'text-red-600 bg-red-100';
      case 'High': return 'text-amber-600 bg-amber-100';
      case 'Medium': return 'text-blue-600 bg-blue-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Project Command Center</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Coordinate, track, and deliver excellence across all engagements.</p>
        </div>
        
        <button 
          onClick={() => { setSelectedProject(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 font-black text-sm transition-all shadow-xl shadow-blue-600/25 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Launch Project
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Projects', value: stats.active, icon: Activity, color: 'blue' },
          { label: 'Critical Attention', value: stats.critical, icon: AlertCircle, color: 'red' },
          { label: 'Completed Deliveries', value: stats.done, icon: CheckCircle, color: 'emerald' }
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
            </div>
          </div>
        ))}
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
              placeholder="Search by project name or ID..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-medium"
            />
          </div>
          
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-11 pr-8 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-inner"
            >
              <option value="All">All Statuses</option>
              <option value="Onboarding">Onboarding</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonCards count={6} />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Your dashboard is clean. Launch a new project to start tracking your next big delivery."
          actionLabel="Launch Project"
          onAction={() => setIsModalOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 group relative flex flex-col overflow-hidden">
               {/* Health Indicator Top Bar */}
               <div className={`h-1.5 w-full ${getHealthColor(p.health)}`}></div>
               
               <div className="p-6 flex-1">
                 <div className="flex justify-between items-start mb-4">
                   <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-900 text-slate-500 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 tracking-tighter">
                     {p.projectId}
                   </span>
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewingEntity(p)} className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 rounded-lg transition-all" title="View Details"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setSelectedProject(p); setIsModalOpen(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 rounded-lg transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setProjectToDelete(p)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                   </div>
                 </div>

                 <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight mb-2">
                   {p.projectName}
                 </h3>
                 <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 font-medium leading-relaxed">
                   {p.description || 'No description provided.'}
                 </p>

                 <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                     <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{p.status}</p>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Priority</p>
                     <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${getPriorityColor(p.priority)}`}>{p.priority}</span>
                   </div>
                 </div>

                 <div className="flex items-center justify-between">
                   <div className="flex -space-x-2">
                     {p.teamMembers?.length > 0 ? (
                       p.teamMembers.map((m, i) => (
                         <div key={i} title={m.fullName} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-[10px] font-black text-blue-600 dark:text-blue-300">
                           {m.fullName?.charAt(0)}
                         </div>
                       ))
                     ) : (
                       <span className="text-[10px] font-bold text-slate-400 italic">No team allocated</span>
                     )}
                   </div>
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                     <Clock className="w-3 h-3 text-blue-500" />
                     {p.targetEnd || 'N/A'}
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
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Project & Client</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Priority</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
              {filteredProjects.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${getHealthColor(p.health)}`}></div>
                      <div>
                        <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{p.projectName}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{p.projectId} • {clients.find(c => c.id === p.clientId)?.businessName || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">{p.type}</td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">{p.status}</span>
                       <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getPriorityColor(p.priority)}`}>{p.priority}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{p.targetEnd || 'N/A'}</div>
                    <div className="text-[10px] font-medium text-slate-400">Target Completion</div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setViewingEntity(p)} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 rounded-xl transition-all" title="View Details"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { setSelectedProject(p); setIsModalOpen(true); }} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-600 rounded-xl transition-all"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setProjectToDelete(p)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedProject(null); }} 
        onSuccess={fetchData}
        clients={clients}
        teamMembers={teamMembers}
        editProject={selectedProject}
      />

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Delete Project?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{projectToDelete.projectName}"</span>? This will permanently remove all associated tasks and timelines.
            </p>
            
            <div className="flex gap-3">
              <button onClick={() => setProjectToDelete(null)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-3 text-sm font-black text-white bg-red-600 hover:bg-red-700 rounded-2xl shadow-lg shadow-red-600/20 transition-all active:scale-95">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <EntityDetailsModal 
        isOpen={!!viewingEntity}
        onClose={() => setViewingEntity(null)}
        data={viewingEntity}
        entityType="project"
      />
    </div>
  );
};

export default ProjectsPage;
