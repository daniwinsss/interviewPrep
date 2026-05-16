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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }
  })
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 }
  }
};

export default function Home() {
  return (
    <Shell showTopBar>
      <div className="relative pt-12 pb-24">
        {/* Hero Background Elements */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#7c8cff] to-[#4c1d95] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-2xl">
              <motion.div variants={fadeUp(0)}>
                <Badge variant="outline" className="mb-8 border-white/10 bg-white/5 py-1.5 px-4 text-xs tracking-widest uppercase">
                  <Sparkles className="w-3.5 h-3.5 mr-2 text-accent" />
                  Now in early access
                </Badge>
              </motion.div>
              <motion.div variants={fadeUp(0.1)}>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
                  The next-gen <br />
                  <span className="text-gradient">Interview OS</span>
                </h1>
              </motion.div>
              <motion.p className="mt-8 text-xl text-white/60 leading-relaxed font-medium" variants={fadeUp(0.2)}>
                A high-fidelity workspace for elite developers. Master AI-driven mock interviews, live coding drills, and core engineering fundamentals in one cinematic dashboard.
              </motion.p>
              <motion.div className="mt-10 flex flex-wrap gap-5" variants={fadeUp(0.3)}>
                <Link to="/interview">
                  <Button size="xl" className="group h-14 px-8 text-base">
                    Start AI Session
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/problems">
                  <Button variant="secondary" size="xl" className="h-14 px-8 text-base border-white/10 bg-white/5 hover:bg-white/10">
                    Explore Problems
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div className="mt-16 flex items-center gap-10 border-t border-white/10 pt-10" variants={fadeUp(0.4)}>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white">98%</span>
                  <span className="text-xs text-white/40 uppercase tracking-widest mt-1">Accuracy</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white">10k+</span>
                  <span className="text-xs text-white/40 uppercase tracking-widest mt-1">Problems</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white">24/7</span>
                  <span className="text-xs text-white/40 uppercase tracking-widest mt-1">AI Support</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-tr from-[#7c8cff]/20 to-transparent blur-2xl opacity-50" />
              <HeroVisual />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-32 pb-32">
        <Section
          title="Engineered for high performance"
          subtitle="Everything you need to land your next role at a top-tier tech company. Integrated, responsive, and insanely fast."
        >
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI Mock Interviews',
                desc: 'Real-time conversational AI that adapts to your performance and provides deep diagnostic feedback.',
                icon: Bot,
                link: '/interview',
                color: 'glow-blue'
              },
              {
                title: 'Global Online Judge',
                desc: 'A robust coding environment supporting 20+ languages with sub-second execution speeds.',
                icon: Code2,
                link: '/problems',
                color: 'glow-purple'
              },
              {
                title: 'Core Fundamentals',
                desc: 'Comprehensive drills across OS, Networking, and Architecture to sharpen your technical edge.',
                icon: Cpu,
                link: '/mcq',
                color: 'glow-blue'
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
                    <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:border-accent/40 ${item.color}`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="mt-8 text-2xl font-bold text-white">{item.title}</h3>
                    <p className="mt-4 text-white/50 leading-relaxed">{item.desc}</p>
                    <div className="mt-8 flex items-center text-sm font-semibold text-accent opacity-0 transition-all group-hover:opacity-100">
                      Launch module <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section
          title="The startup experience"
          subtitle="Stop practicing with outdated tools. Use the OS designed for the future of technical hiring."
        >
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="p-10 surface-strong flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <Badge className="bg-accent/10 text-accent border-accent/20 mb-6">Real-time</Badge>
                <h3 className="text-3xl font-bold text-white">Cinematic Feedback</h3>
                <p className="mt-4 text-white/60 text-lg leading-relaxed max-w-md">
                  Experience a feedback loop that feels premium. No more stale reports—get interactive, deep-dive insights as you code.
                </p>
              </div>
              <div className="absolute top-0 right-0 p-8">
                <Zap className="w-32 h-32 text-white/5" />
              </div>
            </Card>
            <div className="grid gap-8">
              <Card className="p-8 glass flex items-start gap-6">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Distributed Pipeline</h4>
                  <p className="mt-2 text-white/50 leading-relaxed">
                    Our execution engine is distributed across 12 edge regions for zero-latency testing.
                  </p>
                </div>
              </Card>
              <Card className="p-8 glass flex items-start gap-6">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Autonomous Proctor</h4>
                  <p className="mt-2 text-white/50 leading-relaxed">
                    AI proctoring that understands context, not just keywords. It knows your intent.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </Section>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative isolate overflow-hidden bg-white/[0.03] px-6 py-24 text-center shadow-2xl rounded-[40px] border border-white/10 sm:px-16">
            <h2 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Ready to elevate your game?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/60">
              Join 5,000+ developers mastering the technical interview with Antigravity.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/login">
                <Button size="xl" className="px-10">Get Started Free</Button>
              </Link>
              <a href="#" className="text-sm font-semibold leading-6 text-white hover:text-accent transition-colors">
                View documentation <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 blur-3xl" aria-hidden="true">
              <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#7c8cff] to-[#4c1d95] opacity-20" />
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
