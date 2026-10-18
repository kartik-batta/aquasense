import React, { useState, useMemo, useCallback } from 'react';
import { Bot, Sliders, Volume2, Sparkles, Droplets, Info } from 'lucide-react';
import { Persona, Language, Scenario, SimulationOutput, Zone } from './types';
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
    }, 350);
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
          // If NDVI is very low, crop water need mean increases due to drought stress
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
    <div className="min-h-screen bg-[#070B12] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* 1. Header */}
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
        
        {/* Scenario Banner / Sandbox Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
              <Droplets className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-white tracking-wide">
                Active Basin: {currentScenario.name}
              </span>
              <span className="text-xs text-slate-400 block line-clamp-1">
                {currentScenario.description}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono self-start sm:self-auto">
            <span className="px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-white/5">
              W_total: <strong className="text-cyan-300">{currentScenario.totalWaterBudget} kL</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-white/5">
              Sensors K: <strong className="text-cyan-300">{currentScenario.sensorBudget}</strong>
            </span>
            <button
              onClick={() => setIsSandboxOpen(true)}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 transition-colors flex items-center gap-1"
            >
              <Sliders className="w-3 h-3" />
              <span>Adjust Constraints</span>
            </button>
          </div>
        </div>

        {/* 2. Top Row: KPI Scorecard */}
        <KpiScorecard simulation={simulation} language={language} />

        {/* 3. Signature Interaction: Max Uncertainty vs AquaSense VOI Field */}
        <SignatureVoiPanel
          maxVarZone={maxVarZone}
          voiZone={voiZone}
          voiCandidate={voiCandidateInfo}
          language={language}
        />

        {/* 4. GIS Field Grid & Drone Multispectral Scanner */}
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

        {/* 5. Persona-Adaptive Intelligence View */}
        <div className="transition-all">
          {persona === 'executive' && (
            <PersonaViewExecutive
              scenario={currentScenario}
              simulation={simulation}
              language={language}
            />
          )}

          {persona === 'agronomist' && (
            <PersonaViewAgronomist
              scenario={currentScenario}
              simulation={simulation}
              selectedZone={selectedZone}
              language={language}
            />
          )}

          {persona === 'farmer_coop' && (
            <PersonaViewFarmer
              scenario={currentScenario}
              simulation={simulation}
              language={language}
              onSpeakSchedule={handleSpeakText}
            />
          )}
        </div>

        {/* 6. Matched Baseline Comparative Matrix */}
        <BaselineComparisonMatrix
          simulation={simulation}
          zones={currentScenario.zones}
          language={language}
        />

      </main>

      {/* Floating Grounded Gemini Copilot Trigger */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-cyan-300/40"
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
      <footer className="border-t border-white/5 py-6 px-4 text-center text-xs text-slate-500 bg-[#070B12]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>AquaSense: Decision-Aware Value-of-Information & Constrained Water Intelligence</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>AI Builder Cup 2026</span>
            <span aria-hidden="true">·</span>
            <span>Mathematical Loss Proxy</span>
            <span aria-hidden="true">·</span>
            <span>Zero Water Overdraft</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
