import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { useToast } from '../../components/common/Toast';

import Logo from '../../assets/logo.png';

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/login', data);
      if (res.status === 200) {
        login(res.data.user, res.data.token);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed', error);
      if (error.response?.status === 401) {
        showToast('Invalid credentials. Please try again.', 'error');
      } else {
        showToast('Login failed. Check your connection.', 'error');
      }
    }
  };

  return (
    <div className="
      min-h-screen
      bg-slate-50 dark:bg-[#0B1121]
      bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]
      dark:from-[#1e293b]/50 dark:via-[#0B1121] dark:to-[#0B1121]
      flex flex-col items-center justify-center
      px-4 py-12
      transition-colors duration-300
    ">

      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-900/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/30 dark:bg-purple-900/10 rounded-full blur-3xl" />
      </div>

      {/* Brand */}
      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex justify-center mb-4">
          <img src={Logo} alt="Navi Promo" className="h-16 w-auto object-contain drop-shadow-xl" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Welcome Back
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
          Sign in to your enterprise workspace
        </p>
      </div>

      {/* Glass Card */}
      <div className="
        relative z-10 w-full max-w-md
        bg-white/70 dark:bg-slate-900/70
        backdrop-blur-2xl
        border border-white/60 dark:border-slate-700/50
        rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/60
        p-8
      ">
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Welcome back</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">Sign in to your workspace</p>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                type="email"
                {...register('email', { required: true })}
                className="
                  block w-full pl-10 pr-4 py-3 rounded-xl text-sm
                  bg-slate-50 dark:bg-slate-800/60
                  border border-slate-200 dark:border-slate-700
                  text-slate-900 dark:text-white
                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                  focus:border-indigo-400 dark:focus:border-indigo-500
                  transition-all
                "
                placeholder="you@navipromo.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500 font-semibold">Email is required</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', { required: true })}
                className="
                  block w-full pl-10 pr-11 py-3 rounded-xl text-sm
                  bg-slate-50 dark:bg-slate-800/60
                  border border-slate-200 dark:border-slate-700
                  text-slate-900 dark:text-white
                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                  focus:border-indigo-400 dark:focus:border-indigo-500
                  transition-all
                "
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500 font-semibold">Password is required</p>
            )}
          </div>

          {/* Remember / Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Remember me</span>
            </label>
            <a href="#" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="
              w-full py-3 px-4 rounded-xl
              text-sm font-black text-white
              bg-indigo-600 hover:bg-indigo-700
              dark:bg-indigo-600 dark:hover:bg-indigo-700
              shadow-lg shadow-indigo-500/30
              focus:outline-none focus:ring-2 focus:ring-indigo-500/50
              transition-all active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Signing in...
              </span>
            ) : 'Sign in →'}
          </button>
        </form>
      </div>

      <p className="relative z-10 mt-6 text-xs text-slate-400 dark:text-slate-600 font-medium">
        © {new Date().getFullYear()} Navi Promo. All rights reserved.
      </p>
    </div>
  );
};

export default LoginPage;
