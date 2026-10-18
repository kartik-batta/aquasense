import React from 'react';
import { Radio, Battery, Droplets, MapPin, Eye, AlertTriangle } from 'lucide-react';
import { Zone, SimulationOutput, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface GisFieldGridProps {
  zones: Zone[];
  simulation: SimulationOutput;
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  language: Language;
}

export const GisFieldGrid: React.FC<GisFieldGridProps> = ({
  zones,
  simulation,
  selectedZoneId,
  onSelectZone,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const voiPolicy = simulation.voiSensing;
  const measuredIds = voiPolicy.measuredZones;

  return (
    <div className="glass-panel rounded-2xl p-5 lg:p-6 border border-white/10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
              <MapPin className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              {t.fieldGridTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.fieldGridSubtitle}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50 inline-block animate-pulse" />
            <span className="text-slate-300">Measured (VOI)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-700 border border-amber-500/40 inline-block" />
            <span className="text-slate-400">Uncertainty (±2σ)</span>
          </span>
        </div>
      </div>

      {/* Grid of Agricultural Management Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {zones.map((zone) => {
          const isSelected = selectedZoneId === zone.id;
          const isMeasured = measuredIds.includes(zone.id);
          const allocatedWater = voiPolicy.allocations[zone.id] || 0;
          const priorMean = zone.estimated_water_need_mean;
          const std = zone.estimated_water_need_std;
          const satisfactionRatio = Math.min(1.0, allocatedWater / (zone.hidden_ground_truth_need || priorMean));
          const satisfactionPct = Math.round(satisfactionRatio * 100);

          return (
            <div
              key={zone.id}
              onClick={() => onSelectZone(zone.id)}
              className={`rounded-xl p-4 transition-all cursor-pointer relative overflow-hidden text-left border ${
                isSelected
                  ? 'bg-slate-900/90 border-cyan-400 shadow-lg shadow-cyan-500/15'
                  : isMeasured
                  ? 'bg-slate-900/75 border-cyan-500/40 hover:border-cyan-400'
                  : 'bg-slate-900/50 border-white/5 hover:border-white/20'
              }`}
            >
              {/* Uncertainty halo indicator for high variance zones */}
              {std > 100 && (
                <div 
                  className="absolute -top-10 -right-10 w-28 h-28 rounded-full border border-amber-500/20 pointer-events-none animate-pulse"
                  style={{ animationDuration: '4s' }}
                />
              )}

              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-1.5 rounded-lg bg-slate-950/80 border border-white/5 shadow-inner">
                    {zone.crop_icon}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                      {zone.name}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {zone.crop_type} · {zone.area_ha} ha · {zone.soil_type}
                    </span>
                  </div>
                </div>

                {/* Sensor Active Tag */}
                {isMeasured && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 font-semibold shadow-sm">
                    <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                    VOI PROBE
                  </span>
                )}
              </div>

              {/* Water Allocation Progress vs Estimated Need */}
              <div className="mt-3.5 bg-slate-950/60 p-2.5 rounded-lg border border-white/5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-cyan-400" />
                    Allocated / Prior Need:
                  </span>
                  <span className="font-mono text-slate-200 font-medium">
                    <strong className="text-cyan-300">{allocatedWater.toFixed(1)}</strong> / {priorMean} kL
                  </span>
                </div>

                {/* Progress bar with uncertainty range indicator */}
                <div className="w-full bg-slate-800 rounded-full h-2 relative overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      satisfactionPct >= 85
                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                        : satisfactionPct >= 65
                        ? 'bg-gradient-to-r from-amber-500 to-cyan-400'
                        : 'bg-gradient-to-r from-rose-500 to-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, (allocatedWater / priorMean) * 100))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>Satisfaction: {satisfactionPct}%</span>
                  <span>Uncertainty: ±{std} kL</span>
                </div>
              </div>

              {/* Telemetry and Crop Risk Badges */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span 
                      className={`w-1.5 h-1.5 rounded-full ${
                        zone.telemetry_status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`} 
                    />
                    <span className="capitalize text-[10.5px]">{zone.telemetry_status}</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[10.5px]">
                    <Battery className="w-3 h-3 text-slate-400" />
                    {zone.battery_pct}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] text-slate-400">
                    Risk w: <strong className="text-slate-300 font-mono">{zone.crop_risk_weight.toFixed(1)}</strong>
                  </span>
                  <span className="text-[10.5px] text-cyan-400 hover:underline flex items-center gap-0.5">
                    <Eye className="w-3 h-3" />
                    Inspect
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
