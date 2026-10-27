import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { 
  Users, Shield, Plus, Mail, Phone, MapPin, CreditCard, 
  Camera, Briefcase, Building2, UserCircle2, Trash2, Pencil,
  AlertCircle, ChevronRight, X, HeartPulse, Landmark, UserPlus, CheckCircle2, Search, Eye
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { useToast } from '../../components/common/Toast';
import { SkeletonCards } from '../../components/common/SkeletonTable';
import EmptyState from '../../components/common/EmptyState';
import EntityDetailsModal from '../../components/common/EntityDetailsModal';

const MemberModal = ({ isOpen, onClose, onSuccess, editMember = null }) => {
  const [photoPreview, setPhotoPreview] = useState(null);
  const { register, handleSubmit, reset, control, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      role: 'Team',
      jobType: 'Full time',
      department: 'Development',
      bloodGroup: 'O+',
      isActive: true,
      monthlySalary: ''
    }
  });
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  // Watch for "Custom" selections
  const selectedRole = useWatch({ control, name: 'role' });
  const selectedJobType = useWatch({ control, name: 'jobType' });
  const selectedDept = useWatch({ control, name: 'department' });

  useEffect(() => {
    if (editMember) {
      const roleMapFromDb = {
        'SUPER_ADMIN': 'Super Admin',
        'ADMIN': 'Admin',
        'TEAM': 'Team',
        'INTERN': 'Intern'
      };
      const formattedMember = {
        ...editMember,
        role: roleMapFromDb[editMember.role] || editMember.role
      };
      reset(formattedMember);
      setPhotoPreview(editMember.profilePhoto);
    } else {
      reset({
        role: 'Team',
        jobType: 'Full time',
        department: 'Development',
        bloodGroup: 'O+',
        isActive: true,
        fullName: '',
        email: '',
        phone: '',
        designation: '',
        adhaarNumber: '',
        residentialAddress: '',
        parentGuardianName: '',
        emergencyPhone: '',
        bankName: '',
        branchName: '',
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        upiId: '',
        monthlySalary: ''
      });
      setPhotoPreview(null);
    }
  }, [editMember, reset, isOpen]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setValue('profilePhoto', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    try {
      // Ensure boolean type for isActive and parse monthlySalary
      const payload = {
        ...data,
        isActive: data.isActive === 'true' || data.isActive === true,
        monthlySalary: data.monthlySalary ? parseFloat(data.monthlySalary) : null
      };

      if (editMember) {
        await api.put(`/users/${editMember.id}`, payload);
        showToast('Member profile updated successfully!', 'success');
      } else {
        await api.post('/users', payload);
        showToast('New member account created!', 'success');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save member', error);
      showToast(error.response?.data?.message || error.response?.data?.error || 'Error saving member profile', 'error');
    }
  };

  if (!isOpen) return null;

  const CustomSelect = ({ label, name, options, currentVal }) => {
    const [isCustom, setIsCustom] = useState(false);
    
    return (
      <div className="space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        {!isCustom ? (
          <select 
            {...register(name)} 
            onChange={(e) => {
              if (e.target.value === 'Custom') setIsCustom(true);
            }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all shadow-sm"
          >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            <option value="Custom">Custom...</option>
          </select>
        ) : (
          <div className="relative">
            <input 
              type="text" 
              autoFocus
              {...register(name)} 
              placeholder={`Enter custom ${label.toLowerCase()}...`}
              className="w-full bg-white dark:bg-slate-800 border border-primary-500 dark:border-primary-400 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all shadow-sm" 
            />
            <button 
              type="button" 
              onClick={() => setIsCustom(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 hover:text-primary-700 font-bold text-xs"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="px-8 py-5 bg-gradient-to-r from-primary-600 to-indigo-600 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center overflow-hidden group cursor-pointer relative"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] text-white font-bold">CHANGE</div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <UserPlus className="w-6 h-6" />
                {editMember ? 'Update Member Profile' : 'Onboard New Member'}
              </h2>
              <p className="text-primary-100 text-xs mt-1 font-medium">Provisioning system access and HR record</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all relative z-10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
          <form id="member-form" onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            
            {/* Section 1: Professional Access */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                <Briefcase className="w-5 h-5 text-primary-500" />
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Professional Identity</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <CustomSelect label="System Role" name="role" options={['Super Admin', 'Admin', 'Team', 'Intern']} />
                <CustomSelect label="Job Type" name="jobType" options={['Full time', 'Part-Time', 'Free-Launcher', 'Intern']} />
                <CustomSelect label="Department" name="department" options={['Management', 'Development', 'Production - Graphic Designing', 'Production - Video Editors', 'Sales', 'HR']} />
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation (Role)</label>
                  <input
                    type="text"
                    {...register("designation")}
                    placeholder="e.g. Senior Developer"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Salary (₹)</label>
                  <input type="number" {...register("monthlySalary")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" placeholder="0.00" />
                </div>
              </div>
            </div>

            {/* Section 2: Personal Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                <UserCircle2 className="w-5 h-5 text-primary-500" />
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Personal & Contact Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name *</label>
                  <input type="text" {...register("fullName", { required: true })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" placeholder="Member's full name" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address *</label>
                  <input type="email" {...register("email", { required: true })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" placeholder="member@navipromo.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input type="tel" {...register("phone")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Aadhar Card Number</label>
                  <input type="text" {...register("adhaarNumber")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white font-mono" placeholder="0000 0000 0000" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Blood Group</label>
                  <select {...register("bloodGroup")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white">
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Residential Address</label>
                  <input type="text" {...register("residentialAddress")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Emergency Phone</label>
                  <input type="tel" {...register("emergencyPhone")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Parent / Guardian Name</label>
                  <input type="text" {...register("parentGuardianName")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">System Status</label>
                  <select {...register("isActive")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white font-bold">
                    <option value={true}>Active</option>
                    <option value={false}>InActive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Financial Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                <Landmark className="w-5 h-5 text-primary-500" />
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Bank & Financial Records</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bank Name</label>
                  <input type="text" {...register("bankName")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Branch Name</label>
                  <input type="text" {...register("branchName")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Account Holder Name</label>
                  <input type="text" {...register("accountHolderName")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Account Number</label>
                  <input type="text" {...register("accountNumber")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">IFSC Code</label>
                  <input type="text" {...register("ifscCode")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white font-mono uppercase" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">UPI ID / Number</label>
                  <input type="text" {...register("upiId")} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" placeholder="upi@bank / 0000000000" />
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all">Cancel</button>
          <button type="submit" form="member-form" disabled={isSubmitting} className="px-8 py-2.5 text-sm font-black text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl shadow-lg shadow-primary-600/20 hover:from-primary-700 hover:to-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Processing...' : (editMember ? 'Update Member Profile' : 'Create Member Account')}
          </button>
        </div>
      </div>
    </div>
  );
};

const TeamMembersPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [viewingEntity, setViewingEntity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToast();

  const canManage = useMemo(() => {
    if (!currentUser?.role) return false;
    const r = currentUser.role.toLowerCase().replace(/[^a-z]/g, '');
    return r === 'superadmin' || r === 'admin';
  }, [currentUser]);

  const filteredMembers = members.filter(member => 
    member.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setMembers(res.data);
    } catch (error) {
      console.error('Fetch failed', error);
      showToast('Failed to load team members', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!memberToDelete) return;
    try {
      await api.delete(`/users/${memberToDelete.id}`);
      showToast('Member removed successfully', 'success');
      setMemberToDelete(null);
      fetchData();
    } catch (error) {
      showToast('Action failed', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage employee records, access levels, and HR profiles.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search members..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all shadow-sm"
            />
          </div>
          {canManage && (
            <button 
              onClick={() => { setSelectedMember(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl hover:from-primary-700 hover:to-indigo-700 font-bold text-sm shadow-lg shadow-primary-600/25 transition-all active:scale-95 shrink-0"
            >
              <UserPlus className="w-4 h-4" /> Add Member
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <SkeletonCards count={6} />
      ) : filteredMembers.length === 0 ? (
        <EmptyState 
          icon={Users} 
          title={searchQuery ? "No members found" : "No team members"} 
          description={searchQuery ? `No results match your search query "${searchQuery}".` : "Your team directory is empty. Start by onboarding your first team member."}
          actionLabel="Add Member"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map(member => (
            <div key={member.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 overflow-hidden border border-slate-100 dark:border-slate-700">
                    {member.profilePhoto ? (
                      <img src={member.profilePhoto} alt={member.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary-600 font-black text-2xl">
                        {member.fullName?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                      member.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {member.isActive ? 'Active' : 'Suspended'}
                    </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setViewingEntity(member)}
                          className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canManage && (
                          <>
                            <button 
                              onClick={() => { setSelectedMember(member); setIsModalOpen(true); }}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-primary-600 rounded-lg transition-all"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => setMemberToDelete(member)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{member.fullName}</h3>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  <Shield className="w-3.5 h-3.5 text-primary-500" />
                  <p className="text-[11px] font-black uppercase tracking-tight">{member.role} • {member.department}</p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    <Mail className="w-3.5 h-3.5 text-primary-400" />
                    {member.email}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    <Phone className="w-3.5 h-3.5 text-primary-400" />
                    {member.phone || 'No Phone'}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex justify-between items-center text-[10px] font-bold text-slate-500 tracking-wider">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3 h-3" />
                  {member.employeeId}
                </div>
                <div className="flex items-center gap-1 uppercase">
                  <HeartPulse className="w-3 h-3 text-red-500" />
                  {member.bloodGroup || 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <MemberModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedMember(null); }} 
        onSuccess={fetchData}
        editMember={selectedMember}
      />

      {/* Delete Popup */}
      {memberToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 text-red-600 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Remove Member?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Revoking all system access.</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{memberToDelete.fullName}"</span>? This will permanently delete their HR profile and login credentials.
            </p>
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setMemberToDelete(null)} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">Cancel</button>
              <button onClick={handleDelete} className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <EntityDetailsModal 
        isOpen={!!viewingEntity}
        onClose={() => setViewingEntity(null)}
        data={viewingEntity}
        entityType="user"
      />
    </div>
  );
};

export default TeamMembersPage;
