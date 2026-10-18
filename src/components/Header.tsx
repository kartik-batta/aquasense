import React from 'react';
import { Droplets, Globe, UserCheck, Play, RotateCcw, Volume2, ShieldCheck } from 'lucide-react';
import { Language, Persona, Scenario } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface HeaderProps {
  currentScenario: Scenario;
  persona: Persona;
  setPersona: (p: Persona) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  onRunSimulation: () => void;
  onResetScenario: () => void;
  onOpenVoiceBriefing: () => void;
  isSimulating: boolean;
  onSelectScenario: (scenarioId: string) => void;
  allScenarios: Scenario[];
}

export const Header: React.FC<HeaderProps> = ({
  currentScenario,
  persona,
  setPersona,
  language,
  setLanguage,
  onRunSimulation,
  onResetScenario,
  onOpenVoiceBriefing,
  isSimulating,
  onSelectScenario,
  allScenarios,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="border-b border-white/10 bg-[#090E17]/90 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand & Mission Statement */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Droplets className="w-5 h-5 animate-pulse text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                AquaSense
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono tracking-normal">
                  v2026.4-ADAPTIVE
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{t.appSubtitle}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t.cupBadge}
              </span>
            </div>
          </div>
        </div>

        {/* Global Controls: Scenarios, Persona, Language, Voice & Run Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Basin Scenario Selector */}
          <div className="relative">
            <select
              aria-label="Select basin scenario"
              value={currentScenario.id}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-slate-900/90 text-xs text-slate-200 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
            >
              {allScenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.totalWaterBudget} kL)
                </option>
              ))}
            </select>
          </div>

          {/* Persona Switcher */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setPersona('executive')}
              title={t.personas.executive.description}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                persona === 'executive'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3 h-3" />
              <span className="hidden sm:inline">Executive</span>
            </button>
            <button
              onClick={() => setPersona('agronomist')}
              title={t.personas.agronomist.description}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                persona === 'agronomist'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Agronomist</span>
              <span className="sm:hidden">Agro</span>
            </button>
            <button
              onClick={() => setPersona('farmer_coop')}
              title={t.personas.farmer_coop.description}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                persona === 'farmer_coop'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Farmer Coop</span>
              <span className="sm:hidden">Coop</span>
            </button>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10 gap-1 text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <select
              aria-label="Select language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-slate-900 text-white">English</option>
              <option value="hi" className="bg-slate-900 text-white">हिन्दी (Hindi)</option>
              <option value="es" className="bg-slate-900 text-white">Español</option>
              <option value="sw" className="bg-slate-900 text-white">Kiswahili</option>
            </select>
          </div>

          {/* Voice Briefing Button */}
          <button
            onClick={onOpenVoiceBriefing}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-cyan-300 hover:text-cyan-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Listen to Executive Audio Synthesis"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">{t.voiceBriefing}</span>
          </button>

          {/* Reset / Randomize Scenario */}
          <button
            onClick={onResetScenario}
            title={t.resetScenario}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Primary Simulation CTA */}
          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? t.running : t.runSimulation}
          </button>

        </div>

      </div>
    </header>
  );
};
