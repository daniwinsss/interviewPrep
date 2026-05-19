import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Code2, Cpu, Globe, Sparkles, Terminal, Zap } from 'lucide-react';
import { AccentHeading } from '../components/AccentHeading';
import { HeroVisual } from '../components/HeroVisual';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Section from '../components/ui/Section';
import Shell from '../components/ui/Shell';

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }
  }
});

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 }
  }
};

export default function Home() {
  return (
    <Shell showTopBar>
      <div className="relative pt-10 pb-24">
        <div className="absolute inset-x-0 -top-32 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-64">
          <div className="relative left-[calc(50%-12rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[18deg] bg-gradient-to-tr from-emerald-200 to-emerald-400 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-2xl">
              <motion.div variants={fadeUp(0)}>
                <Badge variant="accent" className="mb-6 py-1.5 px-4 text-xs tracking-widest uppercase">
                  <Sparkles className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                  PrepDost for placements
                </Badge>
              </motion.div>
              <motion.div variants={fadeUp(0.1)}>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.05]">
                  The premium hub for <br />
                  <span className="text-gradient">AI interview prep</span>
                </h1>
              </motion.div>
              <motion.p className="mt-6 text-xl text-slate-600 leading-relaxed font-medium" variants={fadeUp(0.2)}>
                PrepDost combines AI mock interviews, structured coding practice, and placement analytics in one clean, employer-ready workspace.
              </motion.p>
              <motion.div className="mt-8 flex flex-wrap gap-4" variants={fadeUp(0.3)}>
                <Link to="/interview">
                  <Button size="lg" className="group h-14 px-8 text-base">
                    Mock Interview
                  </Button>
                </Link>
                <Link to="/problems">
                  <Button variant="secondary" size="lg" className="h-14 px-8 text-base">
                    Browse Problems
                  </Button>
                </Link>
              </motion.div>

              <motion.div className="mt-12 grid grid-cols-3 gap-6" variants={fadeUp(0.4)}>
                {[
                  { label: 'Mock Sessions', value: '120K+' },
                  { label: 'Active Learners', value: '26K' },
                  { label: 'Placement Readiness', value: '91%' }
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-soft">
                    <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                    <span className="mt-1 block text-xs text-slate-500 uppercase tracking-widest">{stat.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-tr from-emerald-200/40 to-transparent blur-2xl opacity-60" />
              <HeroVisual />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-28 pb-32">
        <Section
          title="PrepDost advantage"
          subtitle="A clean, structured prep system built for placements, hackathons, and real interview loops."
        >
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI Mock Interviews',
                desc: 'Practice with adaptive AI interviewers, live feedback, and session summaries.',
                icon: Bot,
                link: '/interview'
              },
              {
                title: 'Coding Practice',
                desc: 'Solve curated problems with premium editor UX and performance insights.',
                icon: Code2,
                link: '/problems'
              },
              {
                title: 'Core Concepts',
                desc: 'MCQ practice across OS, DBMS, CN, and core CS fundamentals.',
                icon: Cpu,
                link: '/mcq'
              }
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link to={item.link}>
                  <Card className="group h-full p-8 transition-all hover:translate-y-[-4px]">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center transition-all group-hover:border-emerald-200">
                      <item.icon className="w-6 h-6 text-emerald-700" />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-3 text-slate-600 leading-relaxed">{item.desc}</p>
                    <div className="mt-6 flex items-center text-sm font-semibold text-emerald-700 opacity-0 transition-all group-hover:opacity-100">
                      Explore module <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section
          title="Placement readiness, tracked"
          subtitle="PrepDost blends performance analytics with smart recommendations so you know what to practice next."
        >
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Daily streaks & heatmap',
                desc: 'Stay consistent with daily streaks, topics hit, and active practice windows.',
                icon: Sparkles
              },
              {
                title: 'Smart recommendations',
                desc: 'AI suggests the next best topics based on weak areas and upcoming interviews.',
                icon: Terminal
              },
              {
                title: 'Placement readiness score',
                desc: 'Unified score across DSA, core subjects, and mock interviews.',
                icon: Zap
              }
            ].map((item) => (
              <Card key={item.title} className="p-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-slate-600 leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          title="Live platform preview"
          subtitle="Get a quick look at the AI interview engine, analytics, and daily challenge flow."
        >
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="p-10 surface-strong flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <Badge variant="accent" className="mb-6">AI Insights</Badge>
                <h3 className="text-3xl font-bold text-slate-900">Personalized progress insights</h3>
                <p className="mt-4 text-slate-600 text-lg leading-relaxed max-w-md">
                  PrepDost highlights what matters: confidence gaps, topic mastery, and next steps for placement success.
                </p>
                <div className="mt-8 flex items-center gap-4 text-sm text-slate-500">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  AI-generated revision plan
                </div>
              </div>
              <div className="absolute top-0 right-0 p-8">
                {/* Visual placeholder removed */}
              </div>
            </Card>
            <div className="grid gap-6">
              <Card className="p-7 flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Mock interview analytics</h4>
                  <p className="mt-2 text-slate-600 leading-relaxed">
                    Confidence signals, communication scores, and technical depth in one dashboard.
                  </p>
                </div>
              </Card>
              <Card className="p-7 flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">Daily challenge widget</h4>
                  <p className="mt-2 text-slate-600 leading-relaxed">
                    A focused practice problem every day with quick scoring and streak rewards.
                  </p>
                </div>
              </Card>
              <Card className="p-7 flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">VSCode-grade editor</h4>
                  <p className="mt-2 text-slate-600 leading-relaxed">
                    Cleaner Monaco setup, premium outputs, and performance stats for every run.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </Section>

        <Section
          title="Success stories"
          subtitle="Learners using PrepDost are cracking placements across tech clubs, startups, and MNCs."
        >
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Aarav Mehta',
                role: 'Final year, NIT',
                quote: 'PrepDost helped me move from confusion to a clear plan. My mock scores went up in 3 weeks.'
              },
              {
                name: 'Shreya Nair',
                role: 'Hackathon finalist',
                quote: 'The AI interview feedback is practical and on point. It feels like a real mentor.'
              },
              {
                name: 'Kunal Singh',
                role: 'SDE intern',
                quote: 'The analytics and streaks keep me consistent. It is the most polished prep platform I used.'
              }
            ].map((item) => (
              <Card key={item.name} className="p-7">
                <p className="text-slate-600 leading-relaxed">“{item.quote}”</p>
                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          title="Frequently asked questions"
          subtitle="Everything you need to know before you start your PrepDost journey."
        >
          <div className="grid lg:grid-cols-2 gap-6">
            {[
              {
                q: 'Is PrepDost free for students?',
                a: 'Yes, core features are free. Premium analytics and curated tracks unlock with the pro plan.'
              },
              {
                q: 'Does PrepDost help with placements and hackathons?',
                a: 'Absolutely. The roadmap is built around campus placements, interview loops, and contest prep.'
              },
              {
                q: 'Can I track my topic mastery?',
                a: 'Yes, mastery graphs, streaks, and readiness indicators are part of your dashboard.'
              },
              {
                q: 'How does the AI interview work?',
                a: 'You get a real-time interviewer, live transcript, and actionable feedback after every session.'
              }
            ].map((item) => (
              <Card key={item.q} className="p-7">
                <h4 className="text-lg font-semibold text-slate-900">{item.q}</h4>
                <p className="mt-3 text-slate-600">{item.a}</p>
              </Card>
            ))}
          </div>
        </Section>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative isolate overflow-hidden bg-white/80 px-6 py-20 text-center shadow-soft rounded-[40px] border border-slate-200 sm:px-16">
            <h2 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Ready to prep with PrepDost?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Join thousands of students leveling up their placement readiness with PrepDost.
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-6">
              <Link to="/login">
                <Button size="lg" className="px-10">Get Started Free</Button>
              </Link>
              <Link to="/problems" className="text-sm font-semibold leading-6 text-emerald-700 hover:text-emerald-900 transition-colors">
                Explore practice library <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 blur-3xl" aria-hidden="true">
              <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-emerald-200 to-emerald-400 opacity-30" />
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
