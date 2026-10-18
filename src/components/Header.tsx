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
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-colors ${
            persona === 'executive' ? 'bg-indigo-600' : persona === 'agronomist' ? 'bg-teal-600' : 'bg-emerald-600'
          }`}>
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                AquaSense
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full font-mono tracking-tight transition-colors ${
                  persona === 'executive'
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : persona === 'agronomist'
                    ? 'bg-teal-100 text-teal-800 border border-teal-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {persona === 'executive' ? 'Executive Mode' : persona === 'agronomist' ? 'Agronomist Mode' : 'Farmer Coop Mode'}
                </span>
              </h1>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              <span>{t.appSubtitle}</span>
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
                  {s.name} ({s.totalWaterBudget.toLocaleString()} kL)
                </option>
              ))}
            </select>
          </div>

          {/* Material 3 Segmented Button - Persona Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setPersona('executive')}
              title={t.personas.executive.description}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                persona === 'executive'
                  ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Executive</span>
            </button>
            <button
              onClick={() => setPersona('agronomist')}
              title={t.personas.agronomist.description}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                persona === 'agronomist'
                  ? 'bg-teal-600 text-white shadow-xs ring-2 ring-teal-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>Agronomist</span>
            </button>
            <button
              onClick={() => setPersona('farmer_coop')}
              title={t.personas.farmer_coop.description}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                persona === 'farmer_coop'
                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>Farmer Coop</span>
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
