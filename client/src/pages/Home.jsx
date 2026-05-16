import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Bot, Code2, Database, Terminal } from 'lucide-react';
import { AccentHeading } from '../components/AccentHeading';
import { HeroVisual } from '../components/HeroVisual';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Section from '../components/ui/Section';
import Shell from '../components/ui/Shell';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }
  })
};

export default function Home() {
  return (
    <Shell showTopBar>
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/70 px-6 py-12 md:px-12 md:py-16 shadow-float">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -top-32 -right-24 w-72 h-72 bg-white/10 blur-[160px]" />
        <div className="relative grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <Badge variant="outline" className="mb-6">Premium AI Interview OS</Badge>
            <AccentHeading text="Build unstoppable interview clarity" />
            <p className="text-lg text-white/70 mt-6 max-w-xl leading-relaxed">
              A focused, high-contrast workspace that blends AI mock interviews, curated problem sets, and core subject drills into one premium prep cockpit.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/interview">
                <Button size="lg" icon={<ArrowUpRight className="w-4 h-4" />}>
                  Start AI interview
                </Button>
              </Link>
              <Link to="/problems">
                <Button variant="secondary" size="lg">
                  Explore problem sets
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-white/60">
              {['Realtime feedback', 'Voice + live coding', 'Enterprise-grade clarity'].map((item) => (
                <div key={item} className="glass px-4 py-3">{item}</div>
              ))}
            </div>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.15}>
            <HeroVisual />
          </motion.div>
        </div>
      </div>

      <div className="mt-20 space-y-20">
        <Section
          title="All-in-one interview command center"
          subtitle="Navigate seamlessly between live coding, AI interviews, and core subject drills with a consistent, premium experience."
        >
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[
              {
                title: 'Online Judge',
                subtitle: 'Secure, production-grade evaluation pipeline',
                icon: Terminal,
                copy: 'Run against curated test suites with instant feedback and rich performance insights.',
                link: '/problems'
              },
              {
                title: 'AI Mock Interviews',
                subtitle: 'Conversational + voice-enabled sessions',
                icon: Bot,
                copy: 'Simulate real interviewer pressure with live prompts, phases, and guidance.',
                link: '/interview'
              },
              {
                title: 'Core Subjects',
                subtitle: 'MCQ drills with adaptive difficulty',
                icon: Database,
                copy: 'Sharpen fundamentals across OS, DBMS, Networks, and Architecture.',
                link: '/mcq'
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={fadeUp}
                  custom={0.1 * idx}
                >
                  <Link to={item.link} className="block h-full">
                    <Card className="h-full flex flex-col gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                        <p className="text-sm text-white/60 mt-2">{item.subtitle}</p>
                        <p className="text-sm text-white/70 mt-4 leading-relaxed">{item.copy}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                        Explore module <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </Section>

        <Section
          title="Why teams love the experience"
          subtitle="Every surface is engineered for clarity, speed, and confidence. Perfect for demos, recruiting pipelines, or personal mastery."
          action={(
            <Link to="/login">
              <Button variant="outline">Get started</Button>
            </Link>
          )}
        >
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              {
                title: 'High-contrast workflow',
                copy: 'Premium black + white palette, tuned typography, and sharp hierarchy for perfect readability.'
              },
              {
                title: 'Seamless navigation',
                copy: 'Move between practice modes with zero clutter and an always-on command center feel.'
              },
              {
                title: 'Demo ready polish',
                copy: 'Motion design and micro-interactions deliver the wow factor without sacrificing speed.'
              }
            ].map((item) => (
              <Card key={item.title} hover={false} className="surface-strong">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-white/65 mt-4 leading-relaxed">{item.copy}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          title="Move faster with focused onboarding"
          subtitle="Start a session in seconds. The platform auto-configures the right flow based on your intent." 
        >
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Pick a mode', copy: 'Interview, problems, or core subjects.' },
              { step: '02', title: 'Personalize', copy: 'Select topics, language, or repo.' },
              { step: '03', title: 'Start', copy: 'Enter a distraction-free workspace.' }
            ].map((item) => (
              <Card key={item.step} hover={false} className="glass">
                <p className="text-sm font-semibold text-white/70">{item.step}</p>
                <h3 className="text-lg font-semibold text-white mt-2">{item.title}</h3>
                <p className="text-sm text-white/60 mt-3">{item.copy}</p>
              </Card>
            ))}
          </div>
        </Section>
      </div>
    </Shell>
  );
}
