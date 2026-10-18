import { useState, useMemo, useCallback, useEffect, type ReactNode } from 'react';
import { Bot, Sliders, Droplets } from 'lucide-react';
import { Persona, Language, Scenario } from './types';
import { PRESET_SCENARIOS, generateRandomScenario } from './utils/scenarios';
import { runCompleteSimulation } from './utils/simulationEngine';
import { TRANSLATIONS } from './utils/translations';
import { speechLocale, stripMarkdown } from './utils/speech';

import { Header } from './components/Header';
import { KpiScorecard } from './components/KpiScorecard';
import { SignatureVoiPanel } from './components/SignatureVoiPanel';
import { GisFieldGrid } from './components/GisFieldGrid';
import { BaselineComparisonMatrix } from './components/BaselineComparisonMatrix';
import { PersonaViewExecutive } from './components/PersonaViewExecutive';
import { PersonaViewAgronomist } from './components/PersonaViewAgronomist';
import { PersonaViewFarmer } from './components/PersonaViewFarmer';
import { MultimodalVisionWidget } from './components/MultimodalVisionWidget';
import { CopilotDrawer } from './components/CopilotDrawer';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { ScenarioSandbox } from './components/ScenarioSandbox';
import { PersonaSwitcher, PERSONA_STYLES } from './components/PersonaSwitcher';

type SectionId = 'personaView' | 'signature' | 'matrix' | 'grid' | 'vision';

/** Section order per persona: each audience sees what matters to it first. */
const SECTION_ORDER: Record<Persona, SectionId[]> = {
  executive: ['personaView', 'signature', 'matrix', 'grid', 'vision'],
  agronomist: ['personaView', 'vision', 'grid', 'signature', 'matrix'],
  farmer_coop: ['personaView', 'grid', 'matrix', 'signature'],
};

const PERSONA_BANNER: Record<Persona, { panel: string; icon: string; badge: string }> = {
  executive: {
    panel: 'bg-gradient-to-r from-indigo-50/90 via-white to-sky-50/70 border-indigo-200',
    icon: 'bg-indigo-600',
    badge: 'bg-indigo-100 text-indigo-900 border border-indigo-300',
  },
  agronomist: {
    panel: 'bg-gradient-to-r from-teal-50/90 via-white to-cyan-50/70 border-teal-200',
    icon: 'bg-teal-600',
    badge: 'bg-teal-100 text-teal-900 border border-teal-300',
  },
  farmer_coop: {
    panel: 'bg-gradient-to-r from-emerald-50/90 via-white to-amber-50/70 border-emerald-200',
    icon: 'bg-emerald-600',
    badge: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
  },
};

export default function App() {
  const [currentScenario, setCurrentScenario] = useState<Scenario>(PRESET_SCENARIOS[0]);
  const [persona, setPersona] = useState<Persona>('executive');
  const [language, setLanguage] = useState<Language>('en');
  const [runCount, setRunCount] = useState(0);

  // The simulation is a pure, deterministic function of the scenario.
  // runCount only refreshes the run timestamp when the user re-runs explicitly.
  const simulation = useMemo(
    () => runCompleteSimulation(currentScenario),
    [currentScenario, runCount]
  );

  // Empty selection means "follow the VOI-selected zone".
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  // Modals & Drawer states
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [pendingCopilotPrompt, setPendingCopilotPrompt] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);

  const t = TRANSLATIONS[language];

  // Keep the document language in sync for screen readers and hyphenation.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const findZone = useCallback(
    (id: string) => currentScenario.zones.find((z) => z.id === id),
    [currentScenario]
  );

  const selectedZone =
    findZone(selectedZoneId) ?? findZone(simulation.selectedVoiZoneId) ?? currentScenario.zones[0];
  const maxVarZone = findZone(simulation.selectedMaxVarZoneId) ?? currentScenario.zones[0];
  const voiZone = findZone(simulation.selectedVoiZoneId) ?? currentScenario.zones[0];

  const handleRunSimulation = useCallback(() => setRunCount((n) => n + 1), []);

  const handleSelectScenario = useCallback((scenarioId: string) => {
    const found = PRESET_SCENARIOS.find((s) => s.id === scenarioId);
    if (found) {
      setCurrentScenario(found);
      setSelectedZoneId('');
    }
  }, []);

  const handleResetScenario = useCallback(() => {
    setCurrentScenario((prev) => generateRandomScenario(prev.totalWaterBudget, prev.sensorBudget));
    setSelectedZoneId('');
  }, []);

  // Update zone prior from drone NDVI multispectral analysis
  const handleUpdateZoneWithNdvi = useCallback((zoneId: string, ndvi: number, deltaStd: number) => {
    setCurrentScenario((prev) => ({
      ...prev,
      zones: prev.zones.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              ndvi_current: ndvi,
              estimated_water_need_std: Math.max(25, z.estimated_water_need_std + deltaStd),
              estimated_water_need_mean:
                ndvi < 0.45 ? Math.round(z.estimated_water_need_mean * 1.1) : z.estimated_water_need_mean,
            }
          : z
      ),
    }));
  }, []);

  const handleApplySandbox = useCallback((newBudget: number, newSensorBudget: number) => {
    setCurrentScenario((prev) => ({ ...prev, totalWaterBudget: newBudget, sensorBudget: newSensorBudget }));
  }, []);

  const handleSpeakText = useCallback((textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(stripMarkdown(textToSpeak));
    utterance.lang = speechLocale(language);
    window.speechSynthesis.speak(utterance);
  }, [language]);

  const handleAskCopilot = useCallback((question: string) => {
    setPendingCopilotPrompt(question);
    setIsCopilotOpen(true);
  }, []);

  const banner = PERSONA_BANNER[persona];
  const BannerIcon = PERSONA_STYLES[persona].icon;

  const sections: Record<SectionId, ReactNode> = {
    personaView:
      persona === 'executive' ? (
        <PersonaViewExecutive scenario={currentScenario} simulation={simulation} language={language} />
      ) : persona === 'agronomist' ? (
        <PersonaViewAgronomist simulation={simulation} selectedZone={selectedZone} />
      ) : (
        <PersonaViewFarmer
          scenario={currentScenario}
          simulation={simulation}
          onSpeakSchedule={handleSpeakText}
        />
      ),
    signature: (
      <SignatureVoiPanel
        scenario={currentScenario}
        maxVarZone={maxVarZone}
        voiZone={voiZone}
        candidateVois={simulation.candidateVois}
        language={language}
      />
    ),
    matrix: (
      <BaselineComparisonMatrix simulation={simulation} zones={currentScenario.zones} language={language} />
    ),
    grid: (
      <GisFieldGrid
        zones={currentScenario.zones}
        simulation={simulation}
        selectedZoneId={selectedZone?.id ?? ''}
        onSelectZone={setSelectedZoneId}
        language={language}
      />
    ),
    vision: (
      <MultimodalVisionWidget
        selectedZone={selectedZone}
        onUpdateZoneWithNdvi={handleUpdateZoneWithNdvi}
        language={language}
      />
    ),
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-sky-500/20 selection:text-sky-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-sky-700 focus:text-white focus:text-xs focus:font-bold"
      >
        Skip to main content
      </a>

      {/* 1. Header (Material 3 App Bar) */}
      <Header
        currentScenario={currentScenario}
        persona={persona}
        setPersona={setPersona}
        language={language}
        setLanguage={setLanguage}
        onRunSimulation={handleRunSimulation}
        onResetScenario={handleResetScenario}
        onOpenVoiceBriefing={() => setIsVoiceModalOpen(true)}
        onSelectScenario={handleSelectScenario}
        allScenarios={PRESET_SCENARIOS}
      />

      {/* Screen-reader announcement whenever results change */}
      <p className="sr-only" role="status" aria-live="polite">
        {`Simulation updated for ${currentScenario.name}. AquaSense VOI measured ${simulation.voiSensing.measuredZones
          .map((id) => findZone(id)?.name ?? id)
          .join(', ')}; simulated loss ${simulation.voiSensing.loss.toFixed(1)}.`}
      </p>

      {/* Main Container */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6 focus:outline-none">

        {/* Scenario Banner / Constraints Bar */}
        <section
          aria-label="Active scenario constraints"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 material-card p-4 border border-slate-200 bg-white shadow-xs"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-sky-100 text-sky-800">
              <Droplets className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-900 tracking-wide">
                Active Basin: {currentScenario.name}
              </span>
              <span className="text-xs text-slate-600 block line-clamp-1">
                {currentScenario.description}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 shadow-2xs">
              <span className="text-slate-600 font-medium">Available Water Budget:</span>
              <strong className="text-sky-800 font-mono font-bold">{currentScenario.totalWaterBudget.toLocaleString()} kL</strong>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 shadow-2xs">
              <span className="text-slate-600 font-medium">Sensor Quota:</span>
              <strong className="text-sky-800 font-mono font-bold">{currentScenario.sensorBudget} Units</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsSandboxOpen(true)}
              aria-haspopup="dialog"
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold border border-sky-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
              <span>Adjust Constraints</span>
            </button>
          </div>
        </section>

        {/* Persona-adaptive banner */}
        <section
          aria-label="Active persona"
          className={`p-4.5 rounded-2xl border transition-all duration-300 shadow-xs ${banner.panel}`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl text-white shadow-xs transition-colors shrink-0 ${banner.icon}`}>
                <BannerIcon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-600 font-mono">
                    Active Operational Vibe:
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${banner.badge}`}>
                    {t.personas[persona].title} ({t.personas[persona].subtitle})
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                  {t.personas[persona].description}
                </p>
              </div>
            </div>

            <PersonaSwitcher
              persona={persona}
              setPersona={setPersona}
              language={language}
              className="self-start md:self-center shrink-0 bg-white/90 shadow-2xs"
            />
          </div>
        </section>

        {/* 2. Top Row: KPI Scorecard */}
        <KpiScorecard simulation={simulation} language={language} />

        {/* 3. Persona-adaptive sections, ordered for the active audience */}
        <div className="space-y-6">
          {SECTION_ORDER[persona].map((id) => (
            <div key={id}>{sections[id]}</div>
          ))}
        </div>
      </main>

      {/* Material 3 Extended Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setIsCopilotOpen(true)}
        aria-haspopup="dialog"
        className="fixed bottom-6 right-6 z-40 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white font-bold text-xs shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
      >
        <Bot className="w-4 h-4 fill-current" aria-hidden="true" />
        <span>Grounded Copilot</span>
        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" aria-hidden="true" />
      </button>

      {/* Slide-out Grounded Copilot Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        scenario={currentScenario}
        simulation={simulation}
        persona={persona}
        language={language}
        onSpeakText={handleSpeakText}
        pendingPrompt={pendingCopilotPrompt}
        onPendingPromptHandled={() => setPendingCopilotPrompt(null)}
      />

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        scenario={currentScenario}
        simulation={simulation}
        language={language}
        onExecutePrompt={handleAskCopilot}
      />

      {/* Scenario Sandbox Modal */}
      <ScenarioSandbox
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        scenario={currentScenario}
        onApplySandbox={handleApplySandbox}
        language={language}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-600 bg-white mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="text-slate-700 font-medium">AquaSense: Decision-Aware Value-of-Information & Constrained Water Intelligence</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <span>Adaptive Watershed Management</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Mathematical Loss Proxy</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Zero Water Overdraft</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
