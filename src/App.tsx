import React, { useState, useMemo, useCallback } from 'react';
import { Bot, Sliders, Droplets, UserCheck, Activity, Users, ArrowRight } from 'lucide-react';
import { Persona, Language, Scenario, SimulationOutput } from './types';
import { PRESET_SCENARIOS, generateRandomScenario } from './utils/scenarios';
import { runCompleteSimulation } from './utils/simulationEngine';
import { TRANSLATIONS } from './utils/translations';

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

export default function App() {
  const [currentScenario, setCurrentScenario] = useState<Scenario>(PRESET_SCENARIOS[0]);
  const [persona, setPersona] = useState<Persona>('executive');
  const [language, setLanguage] = useState<Language>('en');

  // Simulation State computed deterministically
  const [simulation, setSimulation] = useState<SimulationOutput>(() =>
    runCompleteSimulation(PRESET_SCENARIOS[0])
  );

  const [selectedZoneId, setSelectedZoneId] = useState<string>(() =>
    simulation.selectedVoiZoneId || PRESET_SCENARIOS[0].zones[0]?.id || ''
  );

  // Modals & Drawer states
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const t = TRANSLATIONS[language];

  // Selected Zone object
  const selectedZone = useMemo(() => {
    return currentScenario.zones.find((z) => z.id === selectedZoneId) || currentScenario.zones[0];
  }, [currentScenario, selectedZoneId]);

  // Max Uncertainty zone & VOI zone for the signature panel
  const maxVarZone = useMemo(() => {
    return (
      currentScenario.zones.find((z) => z.id === simulation.selectedMaxVarZoneId) ||
      currentScenario.zones[0]
    );
  }, [currentScenario, simulation.selectedMaxVarZoneId]);

  const voiZone = useMemo(() => {
    return (
      currentScenario.zones.find((z) => z.id === simulation.selectedVoiZoneId) ||
      currentScenario.zones[0]
    );
  }, [currentScenario, simulation.selectedVoiZoneId]);

  const voiCandidateInfo = useMemo(() => {
    return simulation.candidateVois.find((c) => c.zoneId === simulation.selectedVoiZoneId);
  }, [simulation]);

  // Run simulation handler
  const handleRunSimulation = useCallback(() => {
    setIsSimulating(true);
    setTimeout(() => {
      const result = runCompleteSimulation(currentScenario);
      setSimulation(result);
      setIsSimulating(false);
    }, 300);
  }, [currentScenario]);

  // Scenario selection handler
  const handleSelectScenario = useCallback((scenarioId: string) => {
    const found = PRESET_SCENARIOS.find((s) => s.id === scenarioId);
    if (found) {
      setCurrentScenario(found);
      const res = runCompleteSimulation(found);
      setSimulation(res);
      setSelectedZoneId(res.selectedVoiZoneId);
    }
  }, []);

  // Reset scenario or randomize
  const handleResetScenario = useCallback(() => {
    const randomized = generateRandomScenario(currentScenario.totalWaterBudget, currentScenario.sensorBudget);
    setCurrentScenario(randomized);
    const res = runCompleteSimulation(randomized);
    setSimulation(res);
    setSelectedZoneId(res.selectedVoiZoneId);
  }, [currentScenario.totalWaterBudget, currentScenario.sensorBudget]);

  // Update zone from Drone NDVI multispectral analysis
  const handleUpdateZoneWithNdvi = useCallback((zoneId: string, ndvi: number, deltaStd: number) => {
    setCurrentScenario((prev) => {
      const updatedZones = prev.zones.map((z) => {
        if (z.id === zoneId) {
          const newStd = Math.max(25, z.estimated_water_need_std + deltaStd);
          const newMean = ndvi < 0.45 ? Math.round(z.estimated_water_need_mean * 1.1) : z.estimated_water_need_mean;
          return {
            ...z,
            ndvi_current: ndvi,
            estimated_water_need_std: newStd,
            estimated_water_need_mean: newMean,
          };
        }
        return z;
      });
      const updatedScenario = { ...prev, zones: updatedZones };
      const newSim = runCompleteSimulation(updatedScenario);
      setSimulation(newSim);
      return updatedScenario;
    });
  }, []);

  // Sandbox budget & sensor updates
  const handleApplySandbox = useCallback((newBudget: number, newSensorBudget: number) => {
    setCurrentScenario((prev) => {
      const updated = {
        ...prev,
        totalWaterBudget: newBudget,
        sensorBudget: newSensorBudget,
      };
      const res = runCompleteSimulation(updated);
      setSimulation(res);
      return updated;
    });
  }, []);

  // Audio speech synthesis helper
  const handleSpeakText = useCallback((textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'es' ? 'es-ES' : language === 'sw' ? 'sw-KE' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [language]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-sky-500/20 selection:text-sky-900">
      
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
        isSimulating={isSimulating}
        onSelectScenario={handleSelectScenario}
        allScenarios={PRESET_SCENARIOS}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* Scenario Banner / Constraints Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 material-card p-4 border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-sky-100 text-sky-800">
              <Droplets className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-900 tracking-wide">
                Active Basin: {currentScenario.name}
              </span>
              <span className="text-xs text-slate-500 block line-clamp-1">
                {currentScenario.description}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 shadow-2xs">
              <span className="text-slate-500 font-medium">Available Water Budget:</span>
              <strong className="text-sky-800 font-mono font-bold">{currentScenario.totalWaterBudget.toLocaleString()} kL</strong>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 shadow-2xs">
              <span className="text-slate-500 font-medium">Sensor Quota:</span>
              <strong className="text-sky-800 font-mono font-bold">{currentScenario.sensorBudget} Units</strong>
            </span>
            <button
              onClick={() => setIsSandboxOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold border border-sky-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-600" />
              <span>Adjust Constraints</span>
            </button>
          </div>
        </div>

        {/* Dynamic Persona & Vibe Adaptive Banner */}
        <div className={`p-4.5 rounded-2xl border transition-all duration-300 shadow-xs ${
          persona === 'executive'
            ? 'bg-gradient-to-r from-indigo-50/90 via-white to-sky-50/70 border-indigo-200'
            : persona === 'agronomist'
            ? 'bg-gradient-to-r from-teal-50/90 via-white to-cyan-50/70 border-teal-200'
            : 'bg-gradient-to-r from-emerald-50/90 via-white to-amber-50/70 border-emerald-200'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl text-white shadow-xs transition-colors shrink-0 ${
                persona === 'executive' ? 'bg-indigo-600' : persona === 'agronomist' ? 'bg-teal-600' : 'bg-emerald-600'
              }`}>
                {persona === 'executive' ? <UserCheck className="w-5 h-5" /> : persona === 'agronomist' ? <Activity className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500 font-mono">
                    Active Operational Vibe:
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    persona === 'executive'
                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                      : persona === 'agronomist'
                      ? 'bg-teal-100 text-teal-900 border border-teal-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}>
                    {t.personas[persona].title} ({t.personas[persona].subtitle})
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                  {t.personas[persona].description}
                </p>
              </div>
            </div>

            {/* Quick Persona Switcher in Banner */}
            <div className="flex items-center gap-1.5 self-start md:self-center shrink-0 bg-white/90 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setPersona('executive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  persona === 'executive'
                    ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Executive</span>
              </button>
              <button
                onClick={() => setPersona('agronomist')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  persona === 'agronomist'
                    ? 'bg-teal-600 text-white shadow-xs ring-2 ring-teal-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Agronomist</span>
              </button>
              <button
                onClick={() => setPersona('farmer_coop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  persona === 'farmer_coop'
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Farmer Coop</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Top Row: KPI Scorecard */}
        <KpiScorecard simulation={simulation} language={language} />

        {/* 3. Persona-Adaptive Intelligence View (Immediately Adapts upon Persona Switch) */}
        {persona === 'executive' && (
          <div className="space-y-6">
            <PersonaViewExecutive
              scenario={currentScenario}
              simulation={simulation}
              language={language}
            />
            <SignatureVoiPanel
              maxVarZone={maxVarZone}
              voiZone={voiZone}
              voiCandidate={voiCandidateInfo}
              language={language}
            />
            <BaselineComparisonMatrix
              simulation={simulation}
              zones={currentScenario.zones}
              language={language}
            />
            <div className="space-y-6">
              <GisFieldGrid
                zones={currentScenario.zones}
                simulation={simulation}
                selectedZoneId={selectedZoneId}
                onSelectZone={(id) => setSelectedZoneId(id)}
                language={language}
              />
              <MultimodalVisionWidget
                selectedZone={selectedZone}
                onUpdateZoneWithNdvi={handleUpdateZoneWithNdvi}
                language={language}
              />
            </div>
          </div>
        )}

        {persona === 'agronomist' && (
          <div className="space-y-6">
            <PersonaViewAgronomist
              scenario={currentScenario}
              simulation={simulation}
              selectedZone={selectedZone}
              language={language}
            />
            <MultimodalVisionWidget
              selectedZone={selectedZone}
              onUpdateZoneWithNdvi={handleUpdateZoneWithNdvi}
              language={language}
            />
            <GisFieldGrid
              zones={currentScenario.zones}
              simulation={simulation}
              selectedZoneId={selectedZoneId}
              onSelectZone={(id) => setSelectedZoneId(id)}
              language={language}
            />
            <SignatureVoiPanel
              maxVarZone={maxVarZone}
              voiZone={voiZone}
              voiCandidate={voiCandidateInfo}
              language={language}
            />
            <BaselineComparisonMatrix
              simulation={simulation}
              zones={currentScenario.zones}
              language={language}
            />
          </div>
        )}

        {persona === 'farmer_coop' && (
          <div className="space-y-6">
            <PersonaViewFarmer
              scenario={currentScenario}
              simulation={simulation}
              language={language}
              onSpeakSchedule={handleSpeakText}
            />
            <GisFieldGrid
              zones={currentScenario.zones}
              simulation={simulation}
              selectedZoneId={selectedZoneId}
              onSelectZone={(id) => setSelectedZoneId(id)}
              language={language}
            />
            <BaselineComparisonMatrix
              simulation={simulation}
              zones={currentScenario.zones}
              language={language}
            />
            <SignatureVoiPanel
              maxVarZone={maxVarZone}
              voiZone={voiZone}
              voiCandidate={voiCandidateInfo}
              language={language}
            />
          </div>
        )}

      </main>

      {/* Material 3 Extended Floating Action Button (FAB) */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
      >
        <Bot className="w-4 h-4 fill-current" />
        <span>Grounded Copilot</span>
        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
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
      />

      {/* Voice Assistant & Synthesis Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        scenario={currentScenario}
        simulation={simulation}
        persona={persona}
        language={language}
        onExecutePrompt={(q) => {
          setIsCopilotOpen(true);
        }}
        onSpeakText={handleSpeakText}
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
      <footer className="border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 bg-white mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-700 font-medium">AquaSense: Decision-Aware Value-of-Information & Constrained Water Intelligence</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
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
