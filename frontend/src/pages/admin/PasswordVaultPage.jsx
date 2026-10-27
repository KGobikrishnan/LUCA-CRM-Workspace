import { useState, useEffect, useMemo } from 'react';
import { 
  Lock, KeyRound, Eye, EyeOff, ShieldAlert, 
  RefreshCw, Plus, Search, Filter, List as ListIcon, 
  Grid as GridIcon, Edit2, Trash2, ExternalLink, X, Save, AlertTriangle, Building2, UserCircle
} from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const CATEGORIES = ['Personal', 'Client', 'Company Social', 'Net Banking', 'Other'];

const PasswordVaultPage = () => {
  const [vaults, setVaults] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [showFormPassword, setShowFormPassword] = useState(false);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentRecord, setCurrentRecord] = useState(null);
  const [formData, setFormData] = useState({
    category: 'Personal',
    client: null,
    title: '',
    loginUrl: '',
    username: '',
    password: '',
    notes: ''
  });
  
  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const { user } = useAuthStore();
  const isSuperAdmin = useMemo(() => {
    if (!user?.role) return false;
    return user.role.toLowerCase().replace(/[^a-z]/g, '') === 'superadmin';
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vaultsRes, clientsRes] = await Promise.all([
        api.get('/password-vaults').catch(() => ({ data: [] })),
        api.get('/clients').catch(() => ({ data: [] }))
      ]);
      setVaults(vaultsRes.data || []);
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const togglePasswordVisibility = (id) => {
    if (!isSuperAdmin) return;
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'clientId') {
      setFormData(prev => ({ ...prev, client: value ? { id: value } : null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      category: 'Personal',
      client: null,
      title: '',
      loginUrl: '',
      username: '',
      password: '',
      notes: ''
    });
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setModalMode('edit');
    setCurrentRecord(record);
    setFormData({
      category: record.category || 'Personal',
      client: record.client ? { id: record.client.id } : null,
      title: record.title || '',
      loginUrl: record.loginUrl || '',
      username: record.username || '',
      password: record.password || '',
      notes: record.notes || ''
    });
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setCurrentRecord(null);
    setRecordToDelete(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await api.post('/password-vaults', formData);
      } else {
        await api.put(`/password-vaults/${currentRecord.id}`, formData);
      }
      fetchData();
      closeModals();
    } catch (error) {
      console.error('Failed to save record', error);
      alert('Failed to save record. Check console for details.');
    }
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await api.delete(`/password-vaults/${recordToDelete.id}`);
      fetchData();
      closeModals();
    } catch (error) {
      console.error('Failed to delete record', error);
      alert('Failed to delete record');
    }
  };

  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200', text: 'text-slate-400' };
    let score = 0;
    if (pwd.length > 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500', text: 'text-red-500' };
    if (score === 2) return { score, label: 'Fair', color: 'bg-yellow-500', text: 'text-yellow-500' };
    if (score === 3) return { score, label: 'Good', color: 'bg-blue-500', text: 'text-blue-500' };
    return { score, label: 'Strong', color: 'bg-green-500', text: 'text-green-500' };
  };

  const pwdStrength = calculatePasswordStrength(formData.password);

  const filteredVaults = useMemo(() => {
    return vaults.filter(v => {
      const matchesSearch = (v.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (v.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (v.loginUrl?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory ? v.category === filterCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [vaults, searchTerm, filterCategory]);

  const renderCategoryBadge = (category) => {
    const colors = {
      'Personal': 'bg-purple-100 text-purple-700 border-purple-200',
      'Client': 'bg-blue-100 text-blue-700 border-blue-200',
      'Company Social': 'bg-pink-100 text-pink-700 border-pink-200',
      'Net Banking': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Other': 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-md border ${colors[category] || colors['Other']}`}>
        {category || 'Other'}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Lock className="w-6 h-6" />
            </div>
            Password Vault
          </h1>
          <p className="text-sm text-slate-500 mt-1">Secure and dynamic storage for credentials.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={fetchData}
            className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          
          <button 
            onClick={openAddModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Credential
          </button>
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold text-sm">Access Restricted</h3>
            <p className="text-sm mt-1">You do not have permission to view decrypted passwords. Contact a Super Admin.</p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search credentials..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-end md:self-auto">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <GridIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading vault...</p>
        </div>
      ) : filteredVaults.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5">
            <KeyRound className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No credentials found</h3>
          <p className="text-slate-500 max-w-sm mt-2">
            {searchTerm || filterCategory ? "Try adjusting your filters or search terms." : "Start securely storing your credentials by adding a new record."}
          </p>
          {(!searchTerm && !filterCategory) && (
            <button onClick={openAddModal} className="mt-6 text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add your first credential
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVaults.map(vault => (
            <div key={vault.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-100 p-5 transition-all group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  {vault.category === 'Client' ? <Building2 className="w-6 h-6" /> : 
                   vault.category === 'Personal' ? <UserCircle className="w-6 h-6" /> :
                   <Lock className="w-6 h-6" />}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(vault)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setRecordToDelete(vault); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-bold text-slate-900 text-lg truncate mb-1" title={vault.title}>{vault.title || 'Untitled'}</h3>
              
              {vault.loginUrl && (
                <a href={vault.loginUrl.startsWith('http') ? vault.loginUrl : `https://${vault.loginUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mb-4 truncate">
                  {vault.loginUrl} <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
              
              <div className="mt-auto space-y-3 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Username</span>
                  <span className="text-sm font-semibold text-slate-900 truncate max-w-[150px]" title={vault.username}>{vault.username || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Password</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type={visiblePasswords[vault.id] ? "text" : "password"} 
                      value={vault.password || '••••••••'} 
                      readOnly 
                      className="bg-transparent border-none p-0 text-sm font-mono text-slate-700 w-24 text-right focus:ring-0"
                    />
                    {isSuperAdmin && (
                      <button 
                        onClick={() => togglePasswordVisibility(vault.id)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {visiblePasswords[vault.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                {renderCategoryBadge(vault.category)}
                {vault.client && (
                  <span className="text-xs text-slate-500 truncate" title={vault.client.businessName}>
                    {vault.client.businessName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredVaults.map(vault => (
                  <tr key={vault.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{vault.title || 'Untitled'}</span>
                        {vault.loginUrl && (
                          <a href={vault.loginUrl.startsWith('http') ? vault.loginUrl : `https://${vault.loginUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-0.5">
                            {vault.loginUrl}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        {renderCategoryBadge(vault.category)}
                        {vault.client && <span className="text-xs text-slate-500">{vault.client.businessName}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">{vault.username || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <input 
                          type={visiblePasswords[vault.id] ? "text" : "password"} 
                          value={vault.password || '••••••••'} 
                          readOnly 
                          className="bg-slate-50 rounded px-2 py-1 border border-slate-100 text-sm font-mono text-slate-700 w-32 focus:ring-0"
                        />
                        {isSuperAdmin && (
                          <button 
                            onClick={() => togglePasswordVisibility(vault.id)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                          >
                            {visiblePasswords[vault.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(vault)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setRecordToDelete(vault); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {modalMode === 'add' ? <Plus className="w-5 h-5 text-indigo-600" /> : <Edit2 className="w-5 h-5 text-indigo-600" />}
                {modalMode === 'add' ? 'New Credential' : 'Edit Credential'}
              </h2>
              <button onClick={closeModals} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="credential-form" onSubmit={handleSave} className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Category</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      required
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Link Client (Optional)</label>
                    <select 
                      name="clientId"
                      value={formData.client?.id || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="">-- None --</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.businessName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Title / Service Name</label>
                  <input 
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Hostinger CPanel"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Login URL</label>
                  <input 
                    type="text"
                    name="loginUrl"
                    value={formData.loginUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Username / Email</label>
                    <input 
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Password</label>
                    <div className="relative">
                      <input 
                        type={showFormPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Password Strength Indicator */}
                    <div className="mt-2">
                      <div className="flex gap-1 h-1.5">
                        {[1, 2, 3, 4].map((level) => (
                          <div 
                            key={level} 
                            className={`flex-1 rounded-full transition-all duration-300 ${formData.password ? (pwdStrength.score >= level ? pwdStrength.color : 'bg-slate-200') : 'bg-slate-200'}`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs mt-1 font-medium ${formData.password ? pwdStrength.text : 'text-slate-400'}`}>
                        {formData.password ? `Strength: ${pwdStrength.label}` : 'Enter a password'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Notes</label>
                  <textarea 
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Any extra details, PINs, or recovery phrases..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={closeModals}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="credential-form"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Are you sure?</h3>
              <p className="text-slate-500 text-sm">
                You are about to delete the credential <strong className="text-slate-800">{recordToDelete?.title}</strong>. This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex gap-3">
              <button 
                onClick={closeModals}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordVaultPage;
