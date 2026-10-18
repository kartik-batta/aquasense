import React from 'react';
import { Activity, Battery, Cpu, Radio } from 'lucide-react';
import { SimulationOutput, Zone } from '../types';

interface PersonaViewAgronomistProps {
  simulation: SimulationOutput;
  selectedZone: Zone;
}

export const PersonaViewAgronomist: React.FC<PersonaViewAgronomistProps> = ({
  simulation,
  selectedZone,
}) => {
  const voi = simulation.voiSensing;
  const isMeasured = voi.measuredZones.includes(selectedZone.id);
  const effectiveMean = isMeasured ? selectedZone.hidden_ground_truth_need : selectedZone.estimated_water_need_mean;
  const effectiveStd = isMeasured ? selectedZone.estimated_water_need_std * 0.1 : selectedZone.estimated_water_need_std;

  return (
    <div className="material-card p-6 border border-slate-200 bg-white space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-100 text-sky-800">
              <Activity className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Agronomic Sensor Telemetry & Bayesian Posterior Beliefs
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Gaussian state estimation (μ ± 2σ), soil moisture telemetry, and field sensor network health
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5 font-medium">
            <Radio className="w-3.5 h-3.5 text-sky-600" />
            LoRaWAN Field Mesh: Active
          </span>
        </div>
      </div>

      {/* Selected Zone Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left: Zone Telemetry Card */}
        <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                {selectedZone.crop_icon}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedZone.name}</h3>
                <span className="text-xs text-slate-500">{selectedZone.soil_type} · {selectedZone.area_ha} ha</span>
              </div>
            </div>
            {isMeasured ? (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 font-bold">
                PROBED
              </span>
            ) : (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                PRIOR ONLY
              </span>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Prior Estimate:</span>
              <span className="font-mono text-slate-800 font-medium">μ = {selectedZone.estimated_water_need_mean} kL, σ = ±{selectedZone.estimated_water_need_std} kL</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Posterior State:</span>
              <span className="font-mono text-sky-800 font-bold">μ = {effectiveMean} kL, σ = ±{effectiveStd.toFixed(1)} kL</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Battery Level:</span>
              <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
                <Battery className="w-3.5 h-3.5" />
                {selectedZone.battery_pct}%
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Canopy NDVI:</span>
              <span className="font-mono text-slate-800 font-medium">{selectedZone.ndvi_current} (Baseline: {selectedZone.ndvi_baseline})</span>
            </div>
          </div>
        </div>

        {/* Center & Right: Probability Density Function (μ ± 2σ) */}
        <div className="lg:col-span-2 bg-slate-50 p-4.5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-600" />
              Gaussian Density Distribution: Prior vs. Posterior Belief
            </span>
            <span className="font-mono text-xs text-sky-800 font-semibold">
              95% CI: [{Math.round(effectiveMean - 2 * effectiveStd)}, {Math.round(effectiveMean + 2 * effectiveStd)}] kL
            </span>
          </div>

          {/* SVG Gaussian curve on clean light background */}
          <div className="h-32 w-full relative my-2 bg-white rounded-lg p-2 border border-slate-200">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 500 100"
              preserveAspectRatio="none"
              role="img"
              aria-label={`Belief for ${selectedZone.name}: mean ${effectiveMean} kL, standard deviation ${effectiveStd.toFixed(0)} kL${isMeasured ? ' after sensor measurement' : ' (prior, not yet measured)'}.`}
            >
              <line x1="0" y1="90" x2="500" y2="90" stroke="#CBD5E1" strokeWidth="1" />
              
              {/* Prior curve (wider, dashed) */}
              <path
                d="M 50 90 Q 200 88 250 35 T 450 90"
                fill="none"
                stroke="#D97706"
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
                fill={isMeasured ? "rgba(2, 132, 199, 0.15)" : "rgba(217, 119, 6, 0.1)"}
                stroke={isMeasured ? "#0284C7" : "#D97706"}
                strokeWidth="2.5"
              />

              {/* Mean marker */}
              <line x1="250" y1="10" x2="250" y2="90" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="2 2" />
              <text x="255" y="25" fill="#0284C7" fontSize="10" fontFamily="monospace" fontWeight="bold">
                μ = {effectiveMean} kL
              </text>
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
            <span className="flex items-center gap-1.5 text-amber-700 font-medium">
              <span className="w-2.5 h-0.5 bg-amber-600 inline-block" />
              Dashed Amber: Prior Uncertainty (σ = ±{selectedZone.estimated_water_need_std} kL)
            </span>
            <span className="flex items-center gap-1.5 text-sky-800 font-semibold">
              <span className="w-2.5 h-0.5 bg-sky-600 inline-block" />
              Solid Sky Blue: Posterior Certainty {isMeasured ? '(Sensor Probed)' : '(Awaiting VOI Visit)'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
