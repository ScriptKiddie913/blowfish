import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Globe,
  Search,
  Activity,
  Zap,
  ArrowRight,
  Database,
  Eye,
  Network,
  AlertTriangle,
  Radar,
  Terminal,
  Brain,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSelector } from '@/components/LanguageSelector';

/* ===================================================================== */
/* CONSTANTS                                                              */
/* ===================================================================== */

const COMPANY_LOGO =
  'https://imagizer.imageshack.com/img922/3923/c1TVGF.png';

const FEATURES = [
  {
    icon: Globe,
    title: 'Domain Intelligence',
    description:
      'DNS records, WHOIS data, subdomains, and certificate transparency logs.',
  },
  {
    icon: Search,
    title: 'Dark Web Monitoring',
    description:
      'Scan onion sites, paste dumps, and breach databases for leaked data.',
  },
  {
    icon: Activity,
    title: 'Live Threat Map',
    description:
      'Real-time visualization of global cyber attacks and threat indicators.',
  },
  {
    icon: Database,
    title: 'Breach Detection',
    description:
      'Check if emails, domains, or credentials have been compromised.',
  },
  {
    icon: Network,
    title: 'IP Analysis',
    description:
      'Geolocation, ASN info, reputation scoring, and port scanning.',
  },
  {
    icon: AlertTriangle,
    title: 'CVE Explorer',
    description:
      'Search and analyze vulnerabilities with CVSS scoring and PoC tracking.',
  },
];

const STATS = [
  { value: '768+', label: 'Threat Indicators' },
  { value: '30+', label: 'Data Sources' },
  { value: '24/7', label: 'Monitoring' },
  { value: '99.9%', label: 'Uptime' },
];

/* ===================================================================== */
/* HOME PAGE                                                              */
/* ===================================================================== */

export default function Home() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ================= AUTH REDIRECT ================= */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  /* ================= RENDER ================= */
  return (
    <div
      className={cn(
        'relative min-h-screen text-white overflow-hidden',
        'cursor-[radial-gradient(circle_at_center,rgba(0,255,159,0.6)_0%,rgba(0,255,159,0.4)_25%,transparent_55%)]'
      )}
    >
      {/* ========================================================= */}
      {/* GLOBAL BACKGROUND IMAGE                                  */}
      {/* ========================================================= */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center scale-105 motion-safe:animate-slow-zoom"
        style={{ backgroundImage: "url('/bg1111.png')" }}
      />

      <div className="fixed inset-0 -z-10 bg-slate-950/85 backdrop-blur-sm" />

      {/* ========================================================= */}
      {/* NAVBAR                                                    */}
      {/* ========================================================= */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg border border-primary/25 bg-primary/10 shadow-[0_0_12px_rgba(0,255,159,0.15)]">
                <img
                  src={COMPANY_LOGO}
                  alt="Cipher OSINT Logo"
                  className="h-6 w-6 object-contain"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-primary drop-shadow">
                SoTaNik OSINT
              </span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <LanguageSelector />
              <Link className="text-slate-300 hover:text-white transition-colors" to="/about">
                About
              </Link>
              <Link to="/auth">
                <Button
                  variant="outline"
                  className="border-primary/50 text-primary hover:bg-primary/10 hover:shadow-[0_0_12px_rgba(0,255,159,0.25)] transition-all"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-primary to-cyan-500 text-slate-900 font-semibold shadow-[0_0_20px_rgba(0,255,159,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-transform">
                  Get Started
                </Button>
              </Link>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <LanguageSelector variant="compact" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="hover:bg-primary/10"
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-800/60 animate-fade-in">
              <div className="flex flex-col gap-3">
                <Link
                  to="/about"
                  className="text-slate-300 hover:text-white transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full border-primary/50 text-primary"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-primary to-cyan-500 text-slate-900 font-semibold">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ========================================================= */}
      {/* HERO                                                     */}
      {/* ========================================================= */}
      <section className="relative pt-28 sm:pt-36 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,159,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,159,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6 shadow-[0_0_20px_rgba(0,255,159,0.15)]">
            <Radar className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm text-primary font-medium">
              Advanced Threat Intelligence
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6">
            <span className="block">Cyber Intelligence</span>
            <span className="block bg-gradient-to-r from-primary via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Redefined
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-10">
            Harness the power of OSINT with real-time threat monitoring,
            dark web surveillance, and comprehensive intelligence gathering.
            Your command center for cyber defense.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-cyan-500 text-slate-900 font-semibold px-8 py-6 shadow-[0_0_24px_rgba(0,255,159,0.4)] hover:scale-[1.03] active:scale-[0.97] transition-transform"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 px-8 py-6"
              >
                Learn More
              </Button>
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <div
                key={i}
                className="rounded-xl bg-slate-900/70 border border-slate-800/60 p-6 backdrop-blur hover:border-primary/30 transition-colors"
              >
                <div className="text-3xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FEATURES                                                 */}
      {/* ========================================================= */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Comprehensive Intelligence Suite
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Everything you need to monitor, analyze, and respond to
              cyber threats in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <Card
                key={i}
                className="bg-slate-900/70 border-slate-800/60 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(0,255,159,0.15)] transition-all"
              >
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-primary/10 mb-4 shadow-inner">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* CTA                                                      */}
      {/* ========================================================= */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/10 p-12 text-center shadow-[0_0_40px_rgba(0,255,159,0.2)]">
            <Brain className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">
              Ready To Elevate Your Threat Intelligence?
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto mb-8">
              Join security professionals worldwide who trust SoTaNik OSINT HUB
              for their OSINT needs.
            </p>
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-cyan-500 text-slate-900 font-semibold px-8 shadow-[0_0_30px_rgba(0,255,159,0.4)]"
              >
                Get Started Now
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FOOTER                                                   */}
      {/* ========================================================= */}
      <footer className="py-10 border-t border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border border-primary/20 bg-primary/10">
              <img
                src={COMPANY_LOGO}
                alt="Cipher OSINT Logo"
                className="h-5 w-5 object-contain"
              />
            </div>
            <span className="font-semibold text-slate-300">
              SoTaNik OSINT HUB
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link to="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
          </div>

          <p className="text-sm text-slate-500">
            © 2026 SoTaNik OSINT HUB. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
