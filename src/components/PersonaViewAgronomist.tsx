import React from 'react';
import { Activity, Battery, Cpu, Radio, Shield, Zap } from 'lucide-react';
import { Scenario, SimulationOutput, Language, Zone } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface PersonaViewAgronomistProps {
  scenario: Scenario;
  simulation: SimulationOutput;
  selectedZone: Zone;
  language: Language;
}

export const PersonaViewAgronomist: React.FC<PersonaViewAgronomistProps> = ({
  scenario,
  simulation,
  selectedZone,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const voi = simulation.voiSensing;
  const isMeasured = voi.measuredZones.includes(selectedZone.id);
  const effectiveMean = isMeasured ? selectedZone.hidden_ground_truth_need : selectedZone.estimated_water_need_mean;
  const effectiveStd = isMeasured ? selectedZone.estimated_water_need_std * 0.1 : selectedZone.estimated_water_need_std;

  return (
    <div className="glass-panel rounded-2xl p-5 lg:p-6 border border-white/10 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
              <Activity className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Agronomic Sensor Telemetry & Bayesian Posterior Beliefs
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Gaussian state estimation (μ ± 2σ), soil moisture telemetry, and field sensor network health
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-white/10 text-slate-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            LoRaWAN Field Mesh: Active
          </span>
        </div>
      </div>

      {/* Selected Zone Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left: Zone Telemetry Card */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedZone.crop_icon}</span>
              <div>
                <h3 className="text-sm font-bold text-white">{selectedZone.name}</h3>
                <span className="text-[11px] text-slate-400">{selectedZone.soil_type} · {selectedZone.area_ha} ha</span>
              </div>
            </div>
            {isMeasured ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                PROBED
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5">
                PRIOR ONLY
              </span>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Prior Estimate:</span>
              <span className="font-mono text-slate-200">μ = {selectedZone.estimated_water_need_mean} kL, σ = ±{selectedZone.estimated_water_need_std} kL</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Posterior State:</span>
              <span className="font-mono text-cyan-300 font-bold">μ = {effectiveMean} kL, σ = ±{effectiveStd.toFixed(1)} kL</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Battery Level:</span>
              <span className="font-mono text-emerald-400 flex items-center gap-1">
                <Battery className="w-3.5 h-3.5" />
                {selectedZone.battery_pct}%
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Canopy NDVI:</span>
              <span className="font-mono text-slate-200">{selectedZone.ndvi_current} (Baseline: {selectedZone.ndvi_baseline})</span>
            </div>
          </div>
        </div>

        {/* Center & Right: Probability Density Function (μ ± 2σ) */}
        <div className="lg:col-span-2 bg-slate-900/60 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Gaussian Density Distribution: Prior vs. Posterior Belief
            </span>
            <span className="font-mono text-[11px] text-cyan-400">
              95% Confidence Interval: [{Math.round(effectiveMean - 2 * effectiveStd)}, {Math.round(effectiveMean + 2 * effectiveStd)}] kL
            </span>
          </div>

          {/* SVG Gaussian curve */}
          <div className="h-32 w-full relative my-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
              <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              
              {/* Prior curve (wider, subtle) */}
              <path
                d="M 50 90 Q 200 88 250 35 T 450 90"
                fill="none"
                stroke="rgba(245, 158, 11, 0.4)"
                strokeWidth="2"
                strokeDasharray="4 3"
              />

              {/* Posterior curve (narrower and sharp if measured) */}
              <path
                d={
                  isMeasured
                    ? "M 180 90 Q 240 85 250 10 T 320 90"
                    : "M 50 90 Q 200 88 250 35 T 450 90"
                }
                fill={isMeasured ? "rgba(6, 182, 212, 0.2)" : "rgba(245, 158, 11, 0.15)"}
                stroke={isMeasured ? "#06B6D4" : "#F59E0B"}
                strokeWidth="2.5"
              />

              {/* Mean marker */}
              <line x1="250" y1="10" x2="250" y2="90" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="2 2" />
              <text x="255" y="25" fill="#06B6D4" fontSize="10" fontFamily="monospace">
                μ = {effectiveMean} kL
              </text>
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-amber-400/60 inline-block border-b" />
              Dashed Amber: Prior Uncertainty (σ = ±{selectedZone.estimated_water_need_std} kL)
            </span>
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
              Solid Cyan: Posterior Certainty {isMeasured ? '(Sensor Updated)' : '(Awaiting VOI Visit)'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
