import { useState, useEffect, useMemo } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { Clock, CheckCircle2, XCircle, LogOut, FileText, Calendar as CalendarIcon, Info, Search, Edit2, Save, Plus, Trash2, Gift, Sun } from 'lucide-react';

const getMobileStatusLabel = (statusStr) => {
  if (!statusStr) return { abbrev: 'A', class: 'bg-red-500 text-white dark:bg-red-600' };
  if (statusStr.includes('Present (OT Sunday)') || statusStr.includes('OT')) return { abbrev: 'OT', class: 'bg-purple-600 text-white dark:bg-purple-700' };
  if (statusStr.includes('Present')) return { abbrev: 'P', class: 'bg-emerald-500 text-white dark:bg-emerald-600' };
  if (statusStr.includes('Late')) return { abbrev: 'L', class: 'bg-orange-500 text-white dark:bg-orange-600' };
  if (statusStr.includes('Half')) return { abbrev: 'HD', class: 'bg-amber-500 text-white dark:bg-amber-600' };
  if (statusStr.includes('Over Time')) return { abbrev: 'OT', class: 'bg-purple-500 text-white dark:bg-purple-600' };
  if (statusStr.includes('Holiday')) return { abbrev: 'H', class: 'bg-teal-500 text-white dark:bg-teal-600' };
  if (statusStr.includes('Absent')) return { abbrev: 'A', class: 'bg-red-500 text-white dark:bg-red-600' };
  if (statusStr.includes('Leave')) return { abbrev: 'LV', class: 'bg-rose-500 text-white dark:bg-rose-600' };
  if (statusStr.includes('WFH') || statusStr.includes('Work From Home')) return { abbrev: 'W', class: 'bg-blue-500 text-white dark:bg-blue-600' };
  return { abbrev: '•', class: 'bg-slate-500 text-white dark:bg-slate-600' };
};

const AttendancePage = () => {
  const { user } = useAuthStore();
  const isAdmin = useMemo(() => {
    if (!user?.role) return false;
    const r = user.role.toLowerCase().replace(/[^a-z]/g, '');
    return r === 'superadmin' || r === 'admin';
  }, [user]);
  
  const [viewMode, setViewMode] = useState('Employee'); // Employee | Admin
  const [employeeTab, setEmployeeTab] = useState('Daily'); // Daily | Monthly
  const [adminTab, setAdminTab] = useState('Daily'); // Daily | Monthly | Holidays
  
  const [attendances, setAttendances] = useState([]);
  const [users, setUsers] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Daily Entry State
  const [todayRecord, setTodayRecord] = useState(null);
  const [notes, setNotes] = useState('');
  
  // Admin State
  const [adminDate, setAdminDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminSelectedUserId, setAdminSelectedUserId] = useState('');
  
  // Holiday Calendar State (Admin)
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '', type: 'Festival' });

  const [editingRecord, setEditingRecord] = useState(null); 

  // Review tab State (Admin)
  const [reviewMonth, setReviewMonth] = useState(new Date().getMonth()); // 0-11
  const [reviewYear, setReviewYear] = useState(new Date().getFullYear());
  const [reviewSearchQuery, setReviewSearchQuery] = useState(''); 
  const [leaves, setLeaves] = useState([]);

  // Monthly Calendar View State (Shared between Employee and Admin views)
  const [monthlyViewMonth, setMonthlyViewMonth] = useState(new Date().getMonth()); // 0-11
  const [monthlyViewYear, setMonthlyViewYear] = useState(new Date().getFullYear());

  const fetchCoreData = async () => {
    try {
      setLoading(true);
      const [attRes, userRes, holRes, leaveRes] = await Promise.all([
        api.get('/attendances').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/holidays').catch(() => ({ data: [] })),
        api.get('/leaves').catch(() => ({ data: [] }))
      ]);
      setAttendances(attRes.data);
      setUsers(userRes.data);
      setHolidays(holRes.data);
      setLeaves(leaveRes.data);
      if (userRes.data.length > 0 && !adminSelectedUserId) {
        setAdminSelectedUserId(userRes.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch attendance data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoreData();
  }, []);

  useEffect(() => {
    // Isolate today's record for the logged-in user
    if (!user || attendances.length === 0) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const record = attendances.find(a => a.userId === user.id && a.date === todayStr);
    setTodayRecord(record || null);
    if (record) setNotes(record.notes || '');
  }, [attendances, user]);

  // --- ATTENDANCE LOGIC: Office Hours 10:00 AM – 7:00 PM ---
  const formatWorkedTime = (diffHrs) => {
    const h = Math.floor(diffHrs);
    const m = Math.round((diffHrs - h) * 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  const calculateStatus = (checkInStr, checkOutStr, dbStatusStr = 'Active') => {
    // If Admin explicitly set a manual status, bypass calculations
    if (dbStatusStr && dbStatusStr !== 'Active') return dbStatusStr;
    if (!checkInStr) return 'Absent';

    // Parse check-in time
    const [inH, inM] = checkInStr.split(':').map(Number);

    // Late = checked in after 10:15 AM
    const isLate = inH > 10 || (inH === 10 && inM > 15);

    if (!checkOutStr) {
      return isLate ? 'Late (Active)' : 'Present (Active)';
    }

    // Calculate worked hours
    const [outH, outM] = checkOutStr.split(':').map(Number);
    const diffMs = (outH * 60 + outM - (inH * 60 + inM)) * 60 * 1000;
    const diffHrs = diffMs / (1000 * 60 * 60);
    const workedLabel = formatWorkedTime(diffHrs);

    if (diffHrs < 0) return 'Invalid Times';
    if (diffHrs < 4.5) return `Half Day (${workedLabel})`;
    if (diffHrs >= 9) {
      // Overtime: worked more than 9 hours
      if (diffHrs > 9.25 && !isLate) return `Over Time (${workedLabel})`;
      return isLate ? `Late (${workedLabel})` : `Present (${workedLabel})`;
    }
    // Between 4.5h and 9h — normal
    return isLate ? `Late (${workedLabel})` : `Present (${workedLabel})`;
  };


  const getStatusColor = (statusStr) => {
    if (!statusStr) return 'bg-slate-50 border-slate-100 text-slate-400';
    if (statusStr.startsWith('Holiday')) return 'bg-teal-50 border-teal-200 text-teal-700';
    if (statusStr.startsWith('Present (OT Sunday)')) return 'bg-violet-50 border-violet-200 text-violet-700';
    if (statusStr.includes('Present')) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (statusStr.includes('Late')) return 'bg-orange-50 border-orange-200 text-orange-700';
    if (statusStr.includes('Half')) return 'bg-amber-50 border-amber-200 text-amber-700';
    if (statusStr.includes('Over Time')) return 'bg-purple-50 border-purple-200 text-purple-700';
    if (statusStr.includes('Leave')) return 'bg-rose-50 border-rose-250 text-rose-700';
    if (statusStr.includes('Absent')) return 'bg-red-50 border-red-200 text-red-700';
    if (statusStr.includes('WFH') || statusStr.includes('Duty')) return 'bg-blue-50 border-blue-200 text-blue-700';
    return 'bg-slate-50 border-slate-100 text-slate-500';
  };

  const getStatusPillColor = (statusStr) => {
    if (!statusStr) return 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300';
    if (statusStr.startsWith('Holiday')) return 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400';
    if (statusStr.startsWith('Present (OT Sunday)')) return 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400';
    if (statusStr.includes('Present')) return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400';
    if (statusStr.includes('Late')) return 'bg-orange-100 text-orange-700';
    if (statusStr.includes('Half')) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400';
    if (statusStr.includes('Over Time')) return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400';
    if (statusStr.includes('Leave')) return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400';
    if (statusStr.includes('Absent')) return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400';
    if (statusStr.includes('WFH') || statusStr.includes('Duty')) return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400';
    return 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300';
  };

  const handleCheckIn = async () => {
    try {
      const today = new Date();
      const payload = {
        userId: user.id,
        date: today.toISOString().split('T')[0],
        checkIn: today.toTimeString().split(' ')[0], // HH:mm:ss
        status: 'Active' 
      };
      await api.post('/attendances', payload);
      fetchCoreData();
    } catch (err) {
      console.error('Check-in failed', err);
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    try {
      const today = new Date();
      const payload = {
        ...todayRecord,
        checkOut: today.toTimeString().split(' ')[0],
        notes: notes
      };
      await api.put(`/attendances/${todayRecord.id}`, payload);
      fetchCoreData();
    } catch (err) {
      console.error('Check-out failed', err);
    }
  };

  const saveNotes = async () => {
    if (!todayRecord) return;
    try {
      const payload = { ...todayRecord, notes: notes };
      await api.put(`/attendances/${todayRecord.id}`, payload);
      setTodayRecord(payload);
    } catch (err) {
      console.error('Failed to save notes', err);
    }
  };

  // Helper: get holiday info for a date string
  const getHolidayForDate = (dateStr) => {
    return holidays.find(h => h.date === dateStr) || null;
  };

  // Monthly Overview Logic (Reusable)
  const generateMonthlyCalendar = (targetUserId, targetMonth = new Date().getMonth(), targetYear = new Date().getFullYear()) => {
    if (!targetUserId) return [];
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const record = attendances.find(a => a.userId === targetUserId && a.date === dateStr);
      const holiday = getHolidayForDate(dateStr);
      const dateObj = new Date(dateStr + 'T00:00:00');
      const isSunday = dateObj.getDay() === 0;

      // Find if there is an approved leave request matching this date
      const approvedLeave = leaves.find(l => 
        l.userId === targetUserId && 
        l.status === 'Approved' && 
        l.fromDate <= dateStr && 
        l.toDate >= dateStr
      );

      days.push({ day: i, date: dateStr, record: record || null, holiday, isSunday, approvedLeave: approvedLeave || null });
    }
    return days;
  };

  // Helper: resolve display status for a calendar day
  const getDayStatus = (day) => {
    const { record, holiday, isSunday, approvedLeave } = day;
    // If employee worked on a holiday/Sunday/Leave day → Present (OT Sunday)
    if (record && record.checkIn && (isSunday || holiday || approvedLeave)) {
      return 'Present (OT Sunday)';
    }
    // If it's an approved leave day
    if (approvedLeave) return `Leave (${approvedLeave.leaveType})`;
    // If it's a holiday
    if (holiday) return `Holiday (${holiday.name})`;
    if (isSunday) return 'Holiday (Sunday)';
    // Normal attendance status
    if (record) return calculateStatus(record.checkIn, record.checkOut, record.status);
    return 'Absent';
  };


  const employeeMonthlyData = useMemo(() => generateMonthlyCalendar(user?.id, monthlyViewMonth, monthlyViewYear), [attendances, user, leaves, monthlyViewMonth, monthlyViewYear]);
  const adminMonthlyData = useMemo(() => generateMonthlyCalendar(adminSelectedUserId, monthlyViewMonth, monthlyViewYear), [attendances, adminSelectedUserId, leaves, monthlyViewMonth, monthlyViewYear]);

  const firstDayIndex = useMemo(() => {
    return new Date(monthlyViewYear, monthlyViewMonth, 1).getDay();
  }, [monthlyViewMonth, monthlyViewYear]);

  // Admin Daily Data Logic
  const adminDailyData = useMemo(() => {
    if (viewMode !== 'Admin' || adminTab !== 'Daily') return [];
    let filtered = attendances.filter(a => a.date === adminDate);
    
    return users.map(u => {
      const record = filtered.find(a => a.userId === u.id);
      return { user: u, record: record };
    }).filter(item => item.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [attendances, users, adminDate, searchQuery, viewMode, adminTab]);

  // Admin Employee Review Stats Aggregation
  const reviewStats = useMemo(() => {
    if (viewMode !== 'Admin' || adminTab !== 'Review') return [];

    // Calculate days in the selected month
    const daysInMonth = new Date(reviewYear, reviewMonth + 1, 0).getDate();
    
    // Build list of active office dates (weekdays that are not holidays)
    const officeDates = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${reviewYear}-${String(reviewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const holiday = getHolidayForDate(dateStr);
      const dateObj = new Date(dateStr + 'T00:00:00');
      const isSunday = dateObj.getDay() === 0;
      if (!isSunday && !holiday) {
        officeDates.push(dateStr);
      }
    }
    
    const expectedOfficeDaysCount = officeDates.length;

    // Filter attendances for the selected month
    const monthPrefix = `${reviewYear}-${String(reviewMonth + 1).padStart(2, '0')}`;
    const monthlyAtts = attendances.filter(a => a.date.startsWith(monthPrefix));

    return users.map(u => {
      const userAtts = monthlyAtts.filter(a => a.userId === u.id);
      
      let presentCount = 0;
      let lateCount = 0;
      let halfDayCount = 0;
      let overtimeCount = 0;
      let leaveCount = 0;
      let absentCount = 0;

      // We determine status for each office day
      officeDates.forEach(dateStr => {
        const record = userAtts.find(a => a.date === dateStr);
        
        // Find approved leave request
        const approvedLeave = leaves.find(l => 
          l.userId === u.id && 
          l.status === 'Approved' && 
          l.fromDate <= dateStr && 
          l.toDate >= dateStr
        );

        if (record) {
          const status = calculateStatus(record.checkIn, record.checkOut, record.status);
          if (status.includes('Absent')) {
            if (approvedLeave) {
              leaveCount++;
            } else {
              absentCount++;
            }
          } else if (status.includes('Leave') || status.includes('LOP')) {
            leaveCount++;
          } else {
            // Worked days
            presentCount++;
            if (status.includes('Late')) lateCount++;
            if (status.includes('Half')) halfDayCount++;
            if (status.includes('Over Time') || status.includes('OT')) overtimeCount++;
          }
        } else {
          // No record on an expected office day
          if (approvedLeave) {
            leaveCount++;
          } else {
            absentCount++;
          }
        }
      });

      // Also count OT/Sundays or OT worked on holidays outside expected office days
      const nonOfficeDates = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${reviewYear}-${String(reviewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (!officeDates.includes(dateStr)) {
          nonOfficeDates.push(dateStr);
        }
      }
      nonOfficeDates.forEach(dateStr => {
        const record = userAtts.find(a => a.date === dateStr);
        if (record && record.checkIn) {
          // User worked on a Sunday/holiday
          const status = calculateStatus(record.checkIn, record.checkOut, record.status);
          presentCount++; // Mark as present/worked
          overtimeCount++; // Count as overtime day
          if (status.includes('Late')) lateCount++;
          if (status.includes('Half')) halfDayCount++;
        }
      });

      // Attendance rate: Present Days / Expected Office Days * 100
      const rate = expectedOfficeDaysCount > 0 
        ? Math.round((presentCount / expectedOfficeDaysCount) * 100) 
        : 0;

      return {
        user: u,
        stats: {
          expectedOfficeDays: expectedOfficeDaysCount,
          present: presentCount,
          late: lateCount,
          halfDay: halfDayCount,
          overtime: overtimeCount,
          leave: leaveCount,
          absent: absentCount,
          rate: rate > 100 ? 100 : rate // Cap at 100%
        }
      };
    }).filter(item => item.user.fullName.toLowerCase().includes(reviewSearchQuery.toLowerCase()));
  }, [attendances, users, holidays, reviewMonth, reviewYear, reviewSearchQuery, viewMode, adminTab, leaves]);


  // --- ADMIN OVERRIDE LOGIC ---
  const handleAdminEditClick = (u, record) => {
    setEditingRecord({
      userId: u.id,
      userFullName: u.fullName,
      id: record?.id || null,
      date: adminDate,
      checkIn: record?.checkIn || '',
      checkOut: record?.checkOut || '',
      status: record?.status || 'Active', // Default to active to let math engine work
      notes: record?.notes || ''
    });
  };

  const handleAdminOverrideSave = async () => {
    if (!editingRecord) return;
    try {
      const payload = {
        userId: editingRecord.userId,
        date: editingRecord.date,
        checkIn: editingRecord.checkIn || null,
        checkOut: editingRecord.checkOut || null,
        status: editingRecord.status,
        notes: editingRecord.notes
      };

      if (editingRecord.id) {
        // Update existing
        await api.put(`/attendances/${editingRecord.id}`, payload);
      } else {
        // Create new
        await api.post('/attendances', payload);
      }
      
      setEditingRecord(null);
      fetchCoreData();
    } catch (err) {
      console.error('Failed to save override', err);
      alert('Failed to save override.');
    }
  };


  if (loading && attendances.length === 0) {
    return <div className="p-8 text-center animate-pulse font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">Loading Attendance System...</div>;
  }

  return (
    <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto pb-12 relative">
      
      {/* Header & Role Switch */}
      <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Attendance Management</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">Track daily check-ins, working hours, and generate reports.</p>
        </div>
        {isAdmin && (
          <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setViewMode('Employee')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'Employee' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Employee Mode
            </button>
            <button
              onClick={() => setViewMode('Admin')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'Admin' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Admin Mode
            </button>
          </div>
        )}
      </div>

      {/* ---------------- EMPLOYEE MODE ---------------- */}
      {viewMode === 'Employee' && (
        <div className="space-y-6">
          <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto whitespace-nowrap mobile-scroll scrollbar-none">
            <button
              onClick={() => setEmployeeTab('Daily')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${employeeTab === 'Daily' ? 'border-primary-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            >
              Daily Entry
            </button>
            <button
              onClick={() => setEmployeeTab('Monthly')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${employeeTab === 'Monthly' ? 'border-primary-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            >
              Monthly Overview
            </button>
          </div>

          {employeeTab === 'Daily' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Check In/Out Panel */}
              <div className="lg:col-span-1 bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-10 h-10 text-primary-500" />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                <p className="text-sm font-bold text-slate-500 mb-6">Office Hours: <span className="text-indigo-600 font-black">10:00 AM – 7:00 PM</span></p>

                {todayRecord ? (
                  <div className="w-full space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Check In</p>
                        <p className="text-lg font-black text-emerald-600">{todayRecord.checkIn}</p>
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>

                    {todayRecord.checkOut ? (
                      <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Check Out</p>
                          <p className="text-lg font-black text-orange-600">{todayRecord.checkOut}</p>
                        </div>
                        <LogOut className="w-6 h-6 text-orange-500" />
                      </div>
                    ) : (
                      <button 
                        onClick={handleCheckOut}
                        className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-5 h-5" /> CHECK OUT
                      </button>
                    )}

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Calculated Status</p>
                      <div className={`px-4 py-2 rounded-lg font-black inline-block ${getStatusPillColor(calculateStatus(todayRecord.checkIn, todayRecord.checkOut, todayRecord.status))}`}>
                        {calculateStatus(todayRecord.checkIn, todayRecord.checkOut, todayRecord.status)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={handleCheckIn}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" /> CHECK IN NOW
                  </button>
                )}
              </div>

              {/* Work Notes Panel */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Daily Work Notes</h3>
                </div>
                <p className="text-sm font-medium text-slate-500 mb-4">
                  Log the tasks and projects you worked on today. This will be automatically saved when you check out, or you can type it throughout the day.
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={saveNotes}
                  disabled={!todayRecord || todayRecord.checkOut !== null}
                  placeholder={!todayRecord ? "Please check in to start typing notes..." : "E.g., Completed the frontend logic for Attendance module..."}
                  className="flex-1 w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium"
                ></textarea>
                {todayRecord && !todayRecord.checkOut && (
                  <p className="text-xs font-bold text-slate-400 mt-3 text-right">Notes are saved automatically when you click outside the box.</p>
                )}
              </div>
            </div>
          )}

          {employeeTab === 'Monthly' && (
            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60">
              <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6 text-primary-500" />
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Monthly Overview</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <select 
                    value={monthlyViewMonth}
                    onChange={(e) => setMonthlyViewMonth(Number(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-lg p-2.5 outline-none w-36"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>
                  <select 
                    value={monthlyViewYear}
                    onChange={(e) => setMonthlyViewYear(Number(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-lg p-2.5 outline-none w-28"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-2 sm:gap-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className={`text-center font-black text-xs uppercase tracking-wider py-2 ${d === 'Sun' ? 'text-teal-500' : 'text-slate-400'}`}>{d}</div>
                ))}
                
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-16 sm:h-24" />
                ))}
                
                {employeeMonthlyData.map(day => {
                  const status = getDayStatus(day);
                  const statusColor = getStatusColor(status);
                  const isSundayOrHol = day.isSunday || day.holiday;
                  const workedOnHol = day.record && day.record.checkIn && isSundayOrHol;
                  const mobileLabel = getMobileStatusLabel(status);

                  return (
                    <div key={day.day} className={`relative p-1.5 sm:p-4 rounded-xl border ${statusColor} group transition-all hover:shadow-md cursor-pointer h-16 sm:h-24 flex flex-col justify-between items-center sm:items-start`}>
                      <div className="flex items-center justify-between w-full">
                        <span className={`font-black text-sm sm:text-lg ${day.isSunday ? 'text-teal-600' : ''}`}>{day.day}</span>
                        {workedOnHol && <span className="text-[8px] sm:text-[9px] font-black text-violet-600 bg-violet-100 px-1 rounded hidden sm:inline-block">+10pts</span>}
                      </div>
                      
                      {/* Desktop view */}
                      <span className="text-[10px] font-bold uppercase tracking-wider truncate hidden sm:block w-full">{status}</span>
                      
                      {/* Mobile view badge */}
                      <span className={`sm:hidden text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm shrink-0 ${mobileLabel.class}`}>
                        {mobileLabel.abbrev}
                      </span>
                      
                      {(day.record?.notes || day.approvedLeave) && (
                        <div className="absolute z-50 hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-xs font-medium p-3 rounded-xl shadow-xl space-y-2 pointer-events-none text-left">
                          {day.record?.notes && (
                            <div>
                              <p className="font-bold text-indigo-400 mb-0.5">Work Notes:</p>
                              <p className="text-slate-200">{day.record.notes}</p>
                            </div>
                          )}
                          {day.approvedLeave && (
                            <div>
                              <p className="font-bold text-rose-450 mb-0.5">Approved Leave ({day.approvedLeave.leaveType}):</p>
                              <p className="text-slate-250 font-bold">{day.approvedLeave.reason}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Calendar Legend */}
              <div className="mt-4 flex flex-wrap gap-2.5 sm:gap-4 items-center justify-center text-[10px] sm:text-xs font-bold text-slate-500 border-t border-slate-150 dark:border-slate-700/60 pt-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Present (P)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-red-500"></span>
                  <span>Absent (A)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-orange-500"></span>
                  <span>Late (L)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-500"></span>
                  <span>Half Day (HD)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-teal-500"></span>
                  <span>Holiday (H)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-purple-500"></span>
                  <span>Overtime (OT)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- ADMIN MODE ---------------- */}
      {viewMode === 'Admin' && (
        <div className="space-y-6">
          <div className="flex space-x-1 border-b border-slate-200 dark:border-slate-700 overflow-x-auto whitespace-nowrap mobile-scroll scrollbar-none">
            <button
              onClick={() => setAdminTab('Daily')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${adminTab === 'Daily' ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Company Daily Entry
            </button>
            <button
              onClick={() => setAdminTab('Monthly')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${adminTab === 'Monthly' ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Employee Monthly Overview
            </button>
            <button
              onClick={() => setAdminTab('Holidays')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${adminTab === 'Holidays' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Gift className="w-4 h-4" /> Holiday Calendar
            </button>
            <button
              onClick={() => setAdminTab('Review')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${adminTab === 'Review' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <FileText className="w-4 h-4" /> Employee Review
            </button>
          </div>

          {/* ADMIN: DAILY ENTRY TAB */}
          {adminTab === 'Daily' && (
            <>
              <div className="bg-white dark:bg-slate-800/60 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
                  <input 
                    type="date" 
                    value={adminDate}
                    onChange={(e) => setAdminDate(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-lg focus:ring-indigo-500 focus:border-primary-500 block p-2.5 outline-none w-full sm:w-auto"
                  />
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search Employee..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
                {/* Desktop View Table */}
                <div className="overflow-x-auto hidden lg:block">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 dark:border-slate-700/60">
                      <tr>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Check In</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Check Out</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Override</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {adminDailyData.map(({ user, record }) => {
                        const status = record ? calculateStatus(record.checkIn, record.checkOut, record.status) : 'Absent';
                        return (
                          <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-bold text-slate-900 dark:text-white">{user.fullName}</div>
                              <div className="text-xs text-slate-500 font-medium">{user.employeeId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">{user.role}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900 dark:text-white">{record?.checkIn || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900 dark:text-white">{record?.checkOut || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${getStatusPillColor(status)}`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button 
                                onClick={() => handleAdminEditClick(user, record)}
                                className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg transition-colors flex items-center justify-end w-full gap-2 font-bold text-xs uppercase"
                              >
                                <Edit2 className="w-4 h-4" /> Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="lg:hidden block divide-y divide-slate-100 dark:divide-slate-700/50">
                  {adminDailyData.map(({ user, record }) => {
                    const status = record ? calculateStatus(record.checkIn, record.checkOut, record.status) : 'Absent';
                    return (
                      <div key={user.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{user.fullName}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{user.employeeId} · {user.role}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${getStatusPillColor(status)} shrink-0`}>
                            {status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Check In</span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">{record?.checkIn || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Check Out</span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">{record?.checkOut || '-'}</span>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button 
                            onClick={() => handleAdminEditClick(user, record)}
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black shadow-sm transition-all hover:bg-black flex items-center gap-1.5 uppercase"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit Override
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {adminDailyData.length === 0 && (
                  <div className="p-8 text-center text-slate-500 font-bold">No employees found.</div>
                )}
              </div>
            </>
          )}

          {/* ADMIN: MONTHLY OVERVIEW TAB */}
          {adminTab === 'Monthly' && (
            <div className="bg-white dark:bg-slate-800/60 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60">
              <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6 text-primary-500" />
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Employee Monthly Records</h3>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <select 
                    value={monthlyViewMonth}
                    onChange={(e) => setMonthlyViewMonth(Number(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-lg p-2.5 outline-none w-36"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>
                  <select 
                    value={monthlyViewYear}
                    onChange={(e) => setMonthlyViewYear(Number(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-lg p-2.5 outline-none w-28"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  
                  <span className="text-slate-300 dark:text-slate-750">|</span>
                  
                  <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Select Employee:</label>
                  <select 
                    value={adminSelectedUserId}
                    onChange={(e) => setAdminSelectedUserId(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-lg focus:ring-indigo-500 focus:border-primary-500 p-2.5 outline-none w-64"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.fullName} ({u.employeeId})</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-2 sm:gap-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center font-black text-slate-400 text-xs uppercase tracking-wider py-2">{d}</div>
                ))}
                
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-16 sm:h-24" />
                ))}
                
              {adminMonthlyData.map(day => {
                const status = getDayStatus(day);
                const statusColor = getStatusColor(status);
                const workedOnHol = day.record && day.record.checkIn && (day.isSunday || day.holiday);
                const mobileLabel = getMobileStatusLabel(status);
                return (
                  <div key={day.day} className={`relative p-1.5 sm:p-4 rounded-xl border ${statusColor} group transition-all hover:shadow-md cursor-pointer h-16 sm:h-24 flex flex-col justify-between items-center sm:items-start`}>
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-black text-sm sm:text-lg ${day.isSunday ? 'text-teal-600' : ''}`}>{day.day}</span>
                      {workedOnHol && <span className="text-[8px] sm:text-[9px] font-black text-violet-600 bg-violet-100 px-1 rounded hidden sm:inline-block">+10</span>}
                    </div>
                    
                    {/* Desktop view */}
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate hidden sm:block w-full">{status}</span>
                    
                    {/* Mobile view badge */}
                    <span className={`sm:hidden text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm shrink-0 ${mobileLabel.class}`}>
                      {mobileLabel.abbrev}
                    </span>
                    
                    {(day.record?.notes || day.approvedLeave) && (
                      <div className="absolute z-50 hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-xs font-medium p-3 rounded-xl shadow-xl space-y-2 pointer-events-none text-left">
                        {day.record?.notes && (
                          <div>
                            <p className="font-bold text-indigo-400 mb-0.5">Work Notes:</p>
                            <p className="text-slate-200">{day.record.notes}</p>
                          </div>
                        )}
                        {day.approvedLeave && (
                          <div>
                            <p className="font-bold text-rose-450 mb-0.5">Approved Leave ({day.approvedLeave.leaveType}):</p>
                            <p className="text-slate-250 font-bold">{day.approvedLeave.reason}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>

              {/* Calendar Legend */}
              <div className="mt-4 flex flex-wrap gap-2.5 sm:gap-4 items-center justify-center text-[10px] sm:text-xs font-bold text-slate-500 border-t border-slate-150 dark:border-slate-700/60 pt-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Present (P)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-red-500"></span>
                  <span>Absent (A)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-orange-500"></span>
                  <span>Late (L)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-500"></span>
                  <span>Half Day (HD)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-teal-500"></span>
                  <span>Holiday (H)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-purple-500"></span>
                  <span>Overtime (OT)</span>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN: HOLIDAY CALENDAR TAB */}
          {adminTab === 'Holidays' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-teal-500" /> Add Company Holiday
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input type="date" value={newHoliday.date}
                    onChange={e => setNewHoliday({...newHoliday, date: e.target.value})}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-xl p-3 outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <input type="text" placeholder="Holiday Name (e.g. Diwali)" value={newHoliday.name}
                    onChange={e => setNewHoliday({...newHoliday, name: e.target.value})}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-xl p-3 outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <select value={newHoliday.type} onChange={e => setNewHoliday({...newHoliday, type: e.target.value})}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-xl p-3 outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Festival">Festival Holiday</option>
                    <option value="Government">Government Holiday</option>
                    <option value="Special">Special Holiday</option>
                    <option value="Optional">Optional Holiday</option>
                  </select>
                  <button onClick={async () => {
                    if (!newHoliday.date || !newHoliday.name) return;
                    try { await api.post('/holidays', newHoliday); setNewHoliday({ date: '', name: '', type: 'Festival' }); fetchCoreData(); }
                    catch(e) { console.error('Holiday add failed', e); }
                  }} className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg hover:from-teal-700 hover:to-emerald-700 transition-all active:scale-95">
                    <Plus className="w-4 h-4" /> Add Holiday
                  </button>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60">
                  <h4 className="font-black text-slate-900 dark:text-white">All Holidays ({holidays.length})</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">Visible to all employees. Every Sunday is automatically a rest day.</p>
                </div>
                {holidays.length === 0 ? (
                  <div className="p-12 text-center"><Sun className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500 font-bold">No holidays added yet.</p></div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {holidays.map(h => (
                      <div key={h.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/30 rounded-xl flex items-center justify-center"><Gift className="w-5 h-5 text-teal-600" /></div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white">{h.name}</p>
                            <p className="text-xs font-bold text-slate-500">{h.date} · <span className="text-teal-600">{h.type} Holiday</span></p>
                          </div>
                        </div>
                        {!h.autoGenerated && (
                          <button onClick={async () => { try { await api.delete(`/holidays/${h.id}`); fetchCoreData(); } catch(e) { console.error('Delete failed', e); } }}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 rounded-lg transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADMIN: EMPLOYEE REVIEW TAB */}
          {adminTab === 'Review' && (
            <div className="space-y-6">
              {/* Review Filter Toolbar */}
              <div className="bg-white dark:bg-slate-800/60 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
                  {/* Month Selector */}
                  <select 
                    value={reviewMonth}
                    onChange={(e) => setReviewMonth(Number(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-lg focus:ring-indigo-500 focus:border-primary-500 p-2.5 outline-none w-full sm:w-44"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>
                  
                  {/* Year Selector */}
                  <select 
                    value={reviewYear}
                    onChange={(e) => setReviewYear(Number(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-lg focus:ring-indigo-500 focus:border-primary-500 p-2.5 outline-none w-full sm:w-32"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                
                {/* Search Field */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search Employee..." 
                    value={reviewSearchQuery}
                    onChange={(e) => setReviewSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                  />
                </div>
              </div>

              {/* Review Statistics Grid */}
              {reviewStats.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-12 text-center shadow-sm border border-slate-100 dark:border-slate-700/60">
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">No employee attendance review data found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reviewStats.map(({ user: emp, stats }) => {
                    const avatarLetter = emp.fullName ? emp.fullName.charAt(0).toUpperCase() : '?';
                    return (
                      <div key={emp.id} className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between group hover:shadow-md transition-all">
                        <div>
                          {/* Profile Header */}
                          <div className="flex items-center gap-3.5 mb-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-lg border border-indigo-100/50 shrink-0">
                              {avatarLetter}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-slate-900 dark:text-white text-base truncate">{emp.fullName}</h4>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{emp.employeeId} · <span className="text-indigo-600 dark:text-indigo-400 font-black">{emp.role}</span></p>
                            </div>
                          </div>

                          {/* expected days stats row */}
                          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Expected Days</span>
                              <span className="text-sm font-black text-slate-800 dark:text-slate-200">{stats.expectedOfficeDays} Days</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Days Present</span>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{stats.present} Days</span>
                            </div>
                          </div>

                          {/* Attendance Rate Meter */}
                          <div className="mt-4 mb-5">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1.5">
                              <span>Attendance Rate</span>
                              <span className="font-black text-indigo-600 dark:text-indigo-400">{stats.rate}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                                style={{ width: `${stats.rate}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Breakdown Metrics Grid */}
                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                          {/* Present Badge */}
                          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 p-2 rounded-xl text-center">
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block">{stats.present}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Present</span>
                          </div>

                          {/* Late Badge */}
                          <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100/50 dark:border-orange-900/30 p-2 rounded-xl text-center">
                            <span className="text-xs font-black text-orange-700 dark:text-orange-400 block">{stats.late}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Late</span>
                          </div>

                          {/* Half Day Badge */}
                          <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 p-2 rounded-xl text-center">
                            <span className="text-xs font-black text-amber-700 dark:text-amber-400 block">{stats.halfDay}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Half Day</span>
                          </div>

                          {/* Overtime Badge */}
                          <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/50 dark:border-purple-900/30 p-2 rounded-xl text-center">
                            <span className="text-xs font-black text-purple-700 dark:text-purple-400 block">{stats.overtime}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">OT Days</span>
                          </div>

                          {/* Leave Badge */}
                          <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 p-2 rounded-xl text-center">
                            <span className="text-xs font-black text-rose-700 dark:text-rose-400 block">{stats.leave}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Leaves</span>
                          </div>

                          {/* Absent Badge */}
                          <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 p-2 rounded-xl text-center">
                            <span className="text-xs font-black text-red-700 dark:text-red-400 block">{stats.absent}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Absent</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- ADMIN OVERRIDE MODAL --- */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Admin Override</h3>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">Editing <span className="text-indigo-600 dark:text-indigo-400">{editingRecord.userFullName}</span> for {editingRecord.date}</p>
              </div>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2">Check In Time (HH:mm:ss)</label>
                  <input 
                    type="time" step="1"
                    value={editingRecord.checkIn || ''}
                    onChange={(e) => setEditingRecord({...editingRecord, checkIn: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 text-sm font-bold rounded-lg focus:ring-indigo-500 focus:border-primary-500 p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2">Check Out Time (HH:mm:ss)</label>
                  <input 
                    type="time" step="1"
                    value={editingRecord.checkOut || ''}
                    onChange={(e) => setEditingRecord({...editingRecord, checkOut: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 text-sm font-bold rounded-lg focus:ring-indigo-500 focus:border-primary-500 p-2.5 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Manual Status Override</label>
                <select
                  value={editingRecord.status}
                  onChange={(e) => setEditingRecord({...editingRecord, status: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 text-sm font-bold rounded-lg focus:ring-indigo-500 focus:border-primary-500 p-2.5 outline-none"
                >
                  <option value="Active">Auto-Calculate (Based on times)</option>
                  <option value="Present">Force: Present</option>
                  <option value="Absent">Force: Absent</option>
                  <option value="Medical Leave (LOP)">Medical Leave (LOP)</option>
                  <option value="Emergency Leave (LOP)">Emergency Leave (LOP)</option>
                  <option value="Work From Home (-10%)">Work From Home (-10%)</option>
                  <option value="On Duty (Field)">On Duty (Field)</option>
                  <option value="Night Shift (+10%)">Night Shift (+10%)</option>
                  <option value="Leave (LOP)">Leave (LOP)</option>
                </select>
                <p className="text-xs font-bold text-slate-400 mt-2">Select 'Auto-Calculate' to let the system generate status from the times above.</p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Admin Notes</label>
                <textarea
                  value={editingRecord.notes}
                  onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})}
                  placeholder="E.g., User forgot to check out, manually overridden."
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 text-sm font-medium rounded-lg focus:ring-indigo-500 focus:border-primary-500 p-3 outline-none resize-none h-24"
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setEditingRecord(null)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdminOverrideSave}
                className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-black rounded-lg transition-colors flex items-center gap-2 shadow-md"
              >
                <Save className="w-4 h-4" /> Save Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
