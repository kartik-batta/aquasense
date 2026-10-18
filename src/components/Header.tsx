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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 py-3 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                AquaSense
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono tracking-tight">
                  M3 Adaptive
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{t.appSubtitle}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {t.cupBadge}
              </span>
            </div>
          </div>
        </div>

        {/* Material 3 App Bar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Scenario Selector */}
          <div className="relative">
            <select
              aria-label="Select basin scenario"
              value={currentScenario.id}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 text-xs text-slate-800 font-medium border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-colors cursor-pointer"
            >
              {allScenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.totalWaterBudget} kL)
                </option>
              ))}
            </select>
          </div>

          {/* Material 3 Segmented Button - Persona Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setPersona('executive')}
              title={t.personas.executive.description}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                persona === 'executive'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3 h-3 text-sky-600" />
              <span className="hidden sm:inline">Executive</span>
            </button>
            <button
              onClick={() => setPersona('agronomist')}
              title={t.personas.agronomist.description}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                persona === 'agronomist'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="hidden sm:inline">Agronomist</span>
              <span className="sm:hidden">Agro</span>
            </button>
            <button
              onClick={() => setPersona('farmer_coop')}
              title={t.personas.farmer_coop.description}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                persona === 'farmer_coop'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="hidden sm:inline">Farmer Coop</span>
              <span className="sm:hidden">Coop</span>
            </button>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-300 gap-1.5 text-xs text-slate-700">
            <Globe className="w-3.5 h-3.5 text-sky-600" />
            <select
              aria-label="Select language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="es">Español</option>
              <option value="sw">Kiswahili</option>
            </select>
          </div>

          {/* Voice Briefing Button */}
          <button
            onClick={onOpenVoiceBriefing}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-sky-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Listen to Executive Audio Synthesis"
          >
            <Volume2 className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden md:inline">{t.voiceBriefing}</span>
          </button>

          {/* Reset Scenario Button */}
          <button
            onClick={onResetScenario}
            title={t.resetScenario}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Primary Material CTA Button */}
          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? t.running : t.runSimulation}
          </button>

        </div>

      </div>
    </header>
  );
};
