'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Brain,
  Globe,
  MapPin,
  BarChart3,
  MessageSquare,
  Shield,
  ChevronRight,
  Zap,
  TrendingUp,
  Users,
  CheckCircle,
  Activity,
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'Multilingual Citizen Feedback',
    description: 'Accept complaints in 20+ languages. AI translates and normalises inputs from text, voice, and images in real-time.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Brain,
    title: 'AI Complaint Intelligence',
    description: 'Gemini-powered classification assigns categories, severity, and priority to each complaint with >92% accuracy.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: Activity,
    title: 'Infrastructure Gap Detection',
    description: 'Cross-reference complaint density with existing infrastructure maps to identify real service gaps — not just noise.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    icon: MapPin,
    title: 'Demand Hotspot Mapping',
    description: 'Geospatial clustering surfaces high-demand regions on interactive maps with colour-coded priority overlays.',
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    icon: TrendingUp,
    title: 'Predictive Prioritisation',
    description: 'AI scores each issue using demand, population impact, and gap metrics — enabling evidence-based decisions.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: BarChart3,
    title: 'AI Policy Recommendations',
    description: 'Each hotspot generates an explainable recommendation with evidence, projected impact, and estimated cost.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
];

const steps = [
  { step: '01', label: 'Citizen Input', desc: 'Citizen submits a complaint in any language via text, voice, or image', icon: MessageSquare },
  { step: '02', label: 'AI Understanding', desc: 'Gemini AI classifies, translates, and assigns severity and category', icon: Brain },
  { step: '03', label: 'Data Fusion', desc: 'Complaints are aggregated geographically and correlated with infrastructure data', icon: Globe },
  { step: '04', label: 'Priority Analysis', desc: 'AI scores regions using demand, population impact, and infrastructure gap', icon: BarChart3 },
  { step: '05', label: 'Policy Recommendation', desc: 'Government receives explainable, evidence-based recommendations', icon: Shield },
];

const countries = [
  { name: 'Brazil', flag: '🇧🇷', stats: '2,100+ cities', color: 'bg-green-50 border-green-200', highlight: 'text-green-700' },
  { name: 'Russia', flag: '🇷🇺', stats: '85 federal subjects', color: 'bg-blue-50 border-blue-200', highlight: 'text-blue-700' },
  { name: 'India', flag: '🇮🇳', stats: '36 states & UTs', color: 'bg-orange-50 border-orange-200', highlight: 'text-orange-700' },
  { name: 'China', flag: '🇨🇳', stats: '34 provinces', color: 'bg-red-50 border-red-200', highlight: 'text-red-700' },
  { name: 'South Africa', flag: '🇿🇦', stats: '9 provinces', color: 'bg-purple-50 border-purple-200', highlight: 'text-purple-700' },
];

const stats = [
  { label: 'Citizens Served', value: '3.2B+', icon: Users },
  { label: 'BRICS Nations', value: '5', icon: Globe },
  { label: 'AI Accuracy', value: '92%', icon: Brain },
  { label: 'Languages Supported', value: '20+', icon: MessageSquare },
];

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm" style={{ color: 'var(--primary)' }}>BRICS AI</span>
              <span className="text-xs block" style={{ color: 'var(--foreground-muted)', lineHeight: 1 }}>Governance Platform</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:text-blue-600 transition-colors" style={{ color: 'var(--foreground-muted)' }}>Features</a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-blue-600 transition-colors" style={{ color: 'var(--foreground-muted)' }}>How It Works</a>
            <a href="#brics" className="text-sm font-medium hover:text-blue-600 transition-colors" style={{ color: 'var(--foreground-muted)' }}>BRICS Nations</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/citizen" className="btn-secondary text-sm px-4 py-2">Citizen Portal</Link>
            <Link href="/governance" className="btn-primary text-sm px-4 py-2">Governance Dashboard</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.08) 0%, transparent 70%)',
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border" style={{ background: '#EFF6FF', color: 'var(--accent)', borderColor: '#BFDBFE' }}>
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Digital Public Infrastructure
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6" style={{ color: 'var(--primary)', lineHeight: 1.1 }}>
            Turning Citizen Voices Into
            <br />
            <span style={{ color: 'var(--accent)' }}>Smarter Governance.</span>
          </h1>

          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
            An AI-powered Digital Public Infrastructure platform that transforms multilingual citizen feedback into actionable infrastructure priorities and evidence-based policy recommendations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/citizen" className="btn-primary text-base px-6 py-3">
              Enter Citizen Portal
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/governance" className="btn-secondary text-base px-6 py-3">
              Open Governance Dashboard
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Flow diagram */}
          <div className="max-w-4xl mx-auto">
            <div className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-wider mb-6" style={{ color: 'var(--foreground-muted)' }}>Platform Intelligence Flow</p>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {[
                  { label: 'Citizen Feedback', icon: MessageSquare, color: '#2563EB' },
                  { label: 'AI Analysis', icon: Brain, color: '#7C3AED' },
                  { label: 'Demand Hotspots', icon: MapPin, color: '#EA580C' },
                  { label: 'Policy Recommendations', icon: Shield, color: '#16A34A' },
                ].map((item, i) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: item.color + '18', border: `1px solid ${item.color}30` }}>
                        <item.icon className="w-5 h-5" style={{ color: item.color }} />
                      </div>
                      <span className="text-xs font-medium mt-2 text-center" style={{ color: 'var(--foreground)', maxWidth: 80 }}>{item.label}</span>
                    </div>
                    {i < 3 && (
                      <ArrowRight className="w-5 h-5 flex-shrink-0 hidden sm:block" style={{ color: 'var(--border)' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-2">
                  <stat.icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div className="text-3xl font-bold mb-1" style={{ color: 'var(--primary)' }}>{stat.value}</div>
                <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Platform Capabilities</p>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--primary)' }}>
              Built for Government-Grade Intelligence
            </h2>
            <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: 'var(--foreground-muted)' }}>
              From multilingual input to explainable policy recommendations — every step is designed for real-world governance at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(feature => (
              <div key={feature.title} className="card group cursor-default">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${feature.bg}`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold mb-2 text-base" style={{ color: 'var(--primary)' }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20" style={{ background: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-label mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--primary)' }}>
              From Complaint to Policy in 5 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Steps list */}
            <div className="space-y-4">
              {steps.map((step, i) => (
                <button
                  key={step.step}
                  className="w-full text-left p-4 rounded-xl border transition-all duration-200"
                  style={{
                    background: activeStep === i ? '#EFF6FF' : 'var(--background)',
                    borderColor: activeStep === i ? '#BFDBFE' : 'var(--border)',
                  }}
                  onClick={() => setActiveStep(i)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: activeStep === i ? 'var(--accent)' : '#F1F5F9', color: activeStep === i ? 'white' : 'var(--foreground-muted)' }}>
                      {step.step}
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1" style={{ color: 'var(--primary)' }}>{step.label}</p>
                      <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{step.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Active step detail */}
            <div className="card p-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: '#EFF6FF' }}>
                {(() => {
                  const Icon = steps[activeStep].icon;
                  return <Icon className="w-8 h-8" style={{ color: 'var(--accent)' }} />;
                })()}
              </div>
              <div className="text-sm font-semibold mb-2" style={{ color: 'var(--accent)' }}>Step {steps[activeStep].step}</div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--primary)' }}>{steps[activeStep].label}</h3>
              <p className="leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{steps[activeStep].desc}</p>

              <div className="mt-6 flex gap-2">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-200"
                    style={{
                      width: activeStep === i ? 32 : 8,
                      background: activeStep === i ? 'var(--accent)' : '#CBD5E1',
                    }}
                    onClick={() => setActiveStep(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BRICS */}
      <section id="brics" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Global Architecture</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--primary)' }}>
              Designed for BRICS Nations
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--foreground-muted)' }}>
              The platform is architectured as a country-agnostic Digital Public Infrastructure layer, integrating citizen feedback and public-development data across all five BRICS nations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
            {countries.map(country => (
              <div key={country.name} className={`card border ${country.color} text-center hover:shadow-md transition-shadow`}>
                <div className="text-4xl mb-3">{country.flag}</div>
                <h3 className={`font-bold text-lg mb-1 ${country.highlight}`}>{country.name}</h3>
                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{country.stats}</p>
                <div className="mt-3 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs font-medium text-green-600">Connected</span>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-8 text-center" style={{ background: 'var(--primary)' }}>
            <Globe className="w-10 h-10 mx-auto mb-4 text-blue-200" />
            <h3 className="text-2xl font-bold mb-3 text-white">Country-Agnostic Architecture</h3>
            <p className="text-blue-100 max-w-2xl mx-auto mb-6">
              The platform uses standardised data schemas and multilingual AI to work across different governance structures, languages, and data ecosystems — ready to onboard any nation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['REST API Integration', 'Multilingual NLP', 'Federated Data Model', 'Privacy-First Design', 'Open Standards'].map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-blue-100 border border-white/20">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: 'var(--surface)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--primary)' }}>
            Ready to see it in action?
          </h2>
          <p className="text-lg mb-8" style={{ color: 'var(--foreground-muted)' }}>
            Explore the citizen portal or the governance dashboard to see how AI turns complaints into clear, evidence-based decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/citizen" className="btn-primary text-base px-8 py-3">
              <Users className="w-4 h-4" />
              Enter Citizen Portal
            </Link>
            <Link href="/governance" className="btn-secondary text-base px-8 py-3">
              <BarChart3 className="w-4 h-4" />
              Open Governance Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <Globe className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>BRICS AI Governance Platform</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
            Built for BRICS Digital Public Infrastructure Hackathon · Powered by Gemini AI
          </p>
          <div className="flex gap-4">
            <Link href="/citizen" className="text-xs hover:text-blue-600 transition-colors" style={{ color: 'var(--foreground-muted)' }}>Citizen Portal</Link>
            <Link href="/governance" className="text-xs hover:text-blue-600 transition-colors" style={{ color: 'var(--foreground-muted)' }}>Governance</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
