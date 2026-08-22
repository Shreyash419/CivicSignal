'use client';

// ============================================================
// CivicSignal — Dual Role Authentication Portal
// Citizen & Government Body Login / Registration + Firebase
// ============================================================

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  Shield,
  Users,
  Building2,
  Lock,
  Mail,
  User,
  MapPin,
  Phone,
  Briefcase,
  BadgeCheck,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Country, UserRole } from '@/types';
import { cn } from '@/lib/utils';

const countries: Country[] = ['India', 'Brazil', 'Russia', 'China', 'South Africa'];

const governmentDepartments = [
  'Urban Infrastructure & Public Works',
  'Water Resources & Sanitation',
  'Road Transport & Highways',
  'Health & Family Welfare',
  'Power & Renewable Energy',
  'Digital Public Infrastructure & IT',
  'Environment, Forest & Climate',
  'District Administration & Municipal Board',
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get('role');
  const redirectParam = searchParams.get('redirect');

  const { userProfile, role, login, register, demoLogin, loading: authLoading } = useAuth();

  const [activeRole, setActiveRole] = useState<UserRole>(
    initialRoleParam === 'government' ? 'government' : 'citizen'
  );
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState<Country>('India');
  const [region, setRegion] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState(governmentDepartments[0]);
  const [designation, setDesignation] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');

  // Auto redirect if already authenticated
  useEffect(() => {
    if (userProfile && !isLoading) {
      if (redirectParam) {
        router.push(redirectParam);
      } else if (userProfile.role === 'government') {
        router.push('/governance');
      } else {
        router.push('/citizen');
      }
    }
  }, [userProfile, router, redirectParam, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (authMode === 'signin') {
        if (!email || !password) {
          throw new Error('Please enter both email and password.');
        }
        const profile = await login(email, password);
        setSuccessMessage(`Welcome back, ${profile.displayName}! Redirecting...`);
        setTimeout(() => {
          if (profile.role === 'government') {
            router.push('/governance');
          } else {
            router.push('/citizen');
          }
        }, 600);
      } else {
        // Registration
        if (!email || !password || !displayName) {
          throw new Error('Please fill in all mandatory fields.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (activeRole === 'government' && !designation) {
          throw new Error('Please specify your official designation.');
        }

        const profile = await register({
          email,
          password,
          displayName,
          role: activeRole,
          country,
          region: region || 'Patna',
          phoneNumber,
          department: activeRole === 'government' ? department : undefined,
          designation: activeRole === 'government' ? designation : undefined,
          badgeNumber: activeRole === 'government' ? (badgeNumber || `BRICS-ID-${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
        });

        setSuccessMessage(`Account registered successfully for ${profile.displayName}! Redirecting...`);
        setTimeout(() => {
          if (activeRole === 'government') {
            router.push('/governance');
          } else {
            router.push('/citizen');
          }
        }, 600);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An authentication error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (targetRole: UserRole) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const profile = demoLogin(targetRole);
      setSuccessMessage(`Logged in as Demo ${targetRole === 'government' ? 'Official' : 'Citizen'} (${profile.displayName})! Redirecting...`);
      setTimeout(() => {
        if (targetRole === 'government') {
          router.push('/governance');
        } else {
          router.push('/citizen');
        }
      }, 500);
    } catch (err: any) {
      setErrorMessage('Could not initialize demo login.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--background)' }}>
      {/* Top Navbar */}
      <header className="border-b" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm" style={{ color: 'var(--primary)' }}>BRICS AI</span>
              <span className="text-xs block" style={{ color: 'var(--foreground-muted)', lineHeight: 1 }}>Governance Platform</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Firebase Firestore Active
            </div>
            <Link href="/" className="text-xs font-medium px-3 py-1.5 rounded-lg border hover:bg-slate-50 transition-colors" style={{ color: 'var(--foreground-muted)', borderColor: 'var(--border)' }}>
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Authentication Card Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-xl">
          {/* Header Banner */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border bg-blue-50 text-blue-700 border-blue-200">
              <Zap className="w-3.5 h-3.5" />
              Digital Public Infrastructure Unified Access
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--primary)' }}>
              {authMode === 'signin' ? 'Sign in to CivicSignal' : 'Create CivicSignal Account'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              {activeRole === 'citizen'
                ? 'Submit community complaints, track resolution timelines, and voice infrastructure needs.'
                : 'Access geospatial demand hotspots, infrastructure deficit matrix, and AI policy recommendations.'}
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl mb-6 border bg-slate-100/80 border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveRole('citizen');
                setErrorMessage(null);
              }}
              className={cn(
                'flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200',
                activeRole === 'citizen'
                  ? 'bg-white text-blue-700 shadow-sm border border-blue-100 ring-2 ring-blue-500/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              )}
            >
              <div className={cn('p-1.5 rounded-lg', activeRole === 'citizen' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600')}>
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="leading-none text-xs font-bold uppercase tracking-wider">Citizen</p>
                <p className="text-[11px] opacity-75 font-normal">Public Voice & Tracking</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole('government');
                setErrorMessage(null);
              }}
              className={cn(
                'flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200',
                activeRole === 'government'
                  ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100 ring-2 ring-indigo-500/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              )}
            >
              <div className={cn('p-1.5 rounded-lg', activeRole === 'government' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600')}>
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="leading-none text-xs font-bold uppercase tracking-wider">Government Body</p>
                <p className="text-[11px] opacity-75 font-normal">Ministry & Analytics</p>
              </div>
            </button>
          </div>

          {/* Quick Demo Credentials Bar */}
          <div className="p-3.5 rounded-xl border bg-amber-50/70 border-amber-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Want instant testing? One-click demo access:
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDemoLogin('citizen')}
                disabled={isLoading}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Users className="w-3 h-3" />
                Demo Citizen
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('government')}
                disabled={isLoading}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Building2 className="w-3 h-3" />
                Demo Official
              </button>
            </div>
          </div>

          {/* Card Container */}
          <div className="card p-6 sm:p-8 shadow-xl border border-slate-200 rounded-2xl bg-white">
            {/* Mode Switcher: Sign In vs Register */}
            <div className="flex border-b pb-4 mb-6" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMessage(null);
                }}
                className={cn(
                  'flex-1 text-center py-2 text-sm font-semibold border-b-2 -mb-[18px] transition-colors',
                  authMode === 'signin'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage(null);
                }}
                className={cn(
                  'flex-1 text-center py-2 text-sm font-semibold border-b-2 -mb-[18px] transition-colors',
                  authMode === 'register'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                Create Account
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl border bg-red-50 border-red-200 text-red-700 text-xs flex items-start gap-2.5 mb-5 animate-scale-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Authentication Error</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3.5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 mb-5 animate-scale-in">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name for Registration */}
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
                    {activeRole === 'government' ? 'Official Full Name' : 'Full Name'} *
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder={activeRole === 'government' ? 'e.g. Dr. Elena Rossi' : 'e.g. Rajesh Kumar'}
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="input-field pl-10 text-sm w-full"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
                  {activeRole === 'government' ? 'Official Government Email' : 'Email Address'} *
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder={activeRole === 'government' ? 'official.name@ministry.brics.gov' : 'name@domain.com'}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field pl-10 text-sm w-full"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Password *
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10 text-sm w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 flex items-center justify-center transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Specific Registration Fields */}
              {authMode === 'register' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Country */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
                        Country *
                      </label>
                      <div className="relative flex items-center">
                        <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                          value={country}
                          onChange={e => setCountry(e.target.value as Country)}
                          className="input-field pl-10 pr-8 text-sm w-full appearance-none cursor-pointer"
                        >
                          {countries.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Region / Jurisdiction */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
                        {activeRole === 'government' ? 'Jurisdiction Region' : 'City / Region'}
                      </label>
                      <div className="relative flex items-center">
                        <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="e.g. Patna, Delhi, São Paulo"
                          value={region}
                          onChange={e => setRegion(e.target.value)}
                          className="input-field pl-10 text-sm w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Citizen Phone */}
                  {activeRole === 'citizen' && (
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
                        Phone Number (Optional)
                      </label>
                      <div className="relative flex items-center">
                        <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={phoneNumber}
                          onChange={e => setPhoneNumber(e.target.value)}
                          className="input-field pl-10 text-sm w-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Government Official Specific Fields */}
                  {activeRole === 'government' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
                          Ministry / Department *
                        </label>
                        <div className="relative flex items-center">
                          <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <select
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                            className="input-field pl-10 pr-8 text-sm w-full appearance-none cursor-pointer"
                          >
                            {governmentDepartments.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
                            Official Designation *
                          </label>
                          <div className="relative flex items-center">
                            <Shield className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. Chief Regional Director"
                              value={designation}
                              onChange={e => setDesignation(e.target.value)}
                              className="input-field pl-10 text-sm w-full"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
                            Gov Employee / Badge ID
                          </label>
                          <div className="relative flex items-center">
                            <BadgeCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="e.g. BRICS-GOV-9842"
                              value={badgeNumber}
                              onChange={e => setBadgeNumber(e.target.value)}
                              className="input-field pl-10 text-sm w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full py-3 px-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md mt-6 disabled:opacity-60',
                  activeRole === 'government'
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting to Firebase...
                  </>
                ) : (
                  <>
                    {authMode === 'signin' ? `Sign In as ${activeRole === 'government' ? 'Official' : 'Citizen'}` : `Register as ${activeRole === 'government' ? 'Official' : 'Citizen'}`}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Privacy & Security Note */}
            <div className="mt-6 pt-4 border-t text-center text-xs flex items-center justify-center gap-1.5 text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Protected by BRICS Digital Public Infrastructure & Firebase Security Rules
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}>
        BRICS AI Governance Platform · Secure Citizen & Official Authentication
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            Loading Authentication Portal...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
