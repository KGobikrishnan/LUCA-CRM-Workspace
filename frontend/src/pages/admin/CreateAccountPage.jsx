import { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, ShieldCheck, Users, Info, ArrowLeft, 
  Trash2, Edit2, KeyRound, CheckCircle, AlertTriangle, Key, ShieldAlert
} from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/common/Toast';
import useAuthStore from '../../store/authStore';

const CreateAccountPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const canManageUsers = useMemo(() => {
    if (!currentUser?.role) return false;
    const r = currentUser.role.toLowerCase().replace(/[^a-z]/g, '');
    return r === 'superadmin' || r === 'admin';
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch (error) {
      console.error('Failed to fetch users', error);
      showToast('Failed to load user data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers) {
      fetchData();
    }
  }, [canManageUsers]);

  if (!canManageUsers) {
    return (
      <div className="p-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-500 max-w-md">Only Admins and Super Admins can manage system access and create accounts.</p>
      </div>
    );
  }

  const usersWithAccess = useMemo(() => users.filter(u => u.hasAccess), [users]);
  const selectedUser = useMemo(() => users.find(u => u.id === selectedUserId), [users, selectedUserId]);

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!selectedUser || !password) return;

    try {
      setIsSubmitting(true);
      await api.post(`/users/${selectedUser.id}/access`, { password });
      showToast(`Access granted for ${selectedUser.fullName}`, 'success');
      setPassword('');
      setSelectedUserId('');
      fetchData();
    } catch (error) {
      console.error('Failed to grant access', error);
      showToast('Failed to assign password.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!recordToDelete) return;
    try {
      await api.delete(`/users/${recordToDelete.id}/access`);
      showToast(`Access revoked for ${recordToDelete.fullName}`, 'success');
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
      if (selectedUserId === recordToDelete.id) {
        setSelectedUserId('');
      }
      fetchData();
    } catch (error) {
      console.error('Failed to revoke access', error);
      showToast('Failed to revoke access.', 'error');
    }
  };

  const handleEditClick = (u) => {
    setSelectedUserId(u.id);
    setPassword('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button 
            onClick={() => navigate('/team')}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Team Directory
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-indigo-600" />
            System Access Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Assign passwords and revoke login access for team members.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Accounts</p>
            <p className="text-xl font-bold text-slate-900">{usersWithAccess.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                Grant or Update Access
              </h3>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleGrantAccess} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Select Team Member</label>
                  <select 
                    value={selectedUserId}
                    onChange={(e) => { setSelectedUserId(e.target.value); setPassword(''); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="">-- Choose a user --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.employeeId}) - {u.role} {u.hasAccess ? '✓' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedUser && (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Profile Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Full Name</p>
                        <p className="text-sm font-semibold text-slate-900">{selectedUser.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="text-sm font-semibold text-slate-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Role</p>
                        <p className="text-sm font-semibold text-slate-900">{selectedUser.role}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Department</p>
                        <p className="text-sm font-semibold text-slate-900">{selectedUser.department || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedUser && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {selectedUser.hasAccess ? 'Update Login Password' : 'Set Login Password'}
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter a secure password..."
                          required
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono"
                        />
                      </div>
                      <p className="text-sm text-indigo-600 mt-2 flex items-center gap-1.5 font-medium">
                        <CheckCircle className="w-4 h-4" /> 
                        This Password will enable Dashboard access for <strong className="font-bold underline">{selectedUser.email}</strong>
                      </p>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button 
                        type="submit" 
                        disabled={isSubmitting || !password} 
                        className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        {isSubmitting ? 'Saving...' : 'Active Account'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Security Policy */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 shadow-lg text-slate-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="w-32 h-32" />
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 relative z-10">
              <Info className="w-5 h-5 text-indigo-400" />
              Security Policy
            </h3>
            <ul className="space-y-4 text-sm relative z-10">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                <p><strong className="text-white">Username:</strong> The Employee's registered email address acts as their unique identifier.</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                <p><strong className="text-white">Revocation:</strong> Deleting an account here instantly removes the password, permanently blocking login access until re-assigned.</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                <p><strong className="text-white">History:</strong> Employee records are not deleted from the database, only their dashboard access is revoked.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Accounts Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registered System Accounts</h3>
            <p className="text-sm text-slate-500 mt-0.5">List of all users currently holding login access.</p>
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading accounts...</div>
        ) : usersWithAccess.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No active accounts</h3>
            <p className="text-sm text-slate-500">Assign a password to a user to grant them access.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Password</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {usersWithAccess.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">••••••••</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Update Password"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setRecordToDelete(user); setIsDeleteModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Revoke Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revoke Access Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Revoke Access?</h3>
              <p className="text-slate-500 text-sm">
                You are about to instantly block login access for <strong className="text-slate-800">{recordToDelete?.fullName}</strong>. Their data will be preserved.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex gap-3">
              <button 
                onClick={() => { setIsDeleteModalOpen(false); setRecordToDelete(null); }}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRevokeAccess}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateAccountPage;
