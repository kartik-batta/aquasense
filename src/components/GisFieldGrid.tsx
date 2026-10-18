import React from 'react';
import { Radio, Battery, Droplets, MapPin, Eye } from 'lucide-react';
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
    <div className="material-card p-6 border border-slate-200 bg-white">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-100 text-sky-800">
              <MapPin className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {t.fieldGridTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            {t.fieldGridSubtitle}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" />
            <span className="text-slate-800">Measured (VOI)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-400 inline-block" />
            <span className="text-slate-600">Uncertainty (±2σ)</span>
          </span>
        </div>
      </div>

      {/* Grid of Agricultural Management Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className={`rounded-2xl p-4.5 transition-all cursor-pointer relative overflow-hidden text-left border ${
                isSelected
                  ? 'bg-sky-50/40 border-sky-500 shadow-md ring-2 ring-sky-500/10'
                  : isMeasured
                  ? 'bg-white border-sky-300 shadow-xs hover:border-sky-400'
                  : 'bg-white border-slate-200 shadow-xs hover:border-slate-300 hover:shadow'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-2 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                    {zone.crop_icon}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                      {zone.name}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {zone.crop_type} · {zone.area_ha} ha · {zone.soil_type}
                    </span>
                  </div>
                </div>

                {/* Sensor Active Tag */}
                {isMeasured && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1 font-bold shadow-xs">
                    <Radio className="w-3 h-3 text-sky-600 animate-pulse" />
                    VOI PROBE
                  </span>
                )}
              </div>

              {/* Water Allocation Progress vs Estimated Need */}
              <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-600 flex items-center gap-1 font-medium">
                    <Droplets className="w-3.5 h-3.5 text-sky-600" />
                    Allocated / Prior:
                  </span>
                  <span className="font-mono text-slate-800 font-semibold">
                    <strong className="text-sky-800">{allocatedWater.toFixed(1)}</strong> / {priorMean} kL
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200/80 rounded-full h-2 relative overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      satisfactionPct >= 85
                        ? 'bg-emerald-600'
                        : satisfactionPct >= 65
                        ? 'bg-sky-600'
                        : 'bg-amber-600'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, (allocatedWater / priorMean) * 100))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5 font-mono">
                  <span>Satisfaction: <strong className="text-slate-800">{satisfactionPct}%</strong></span>
                  <span>Uncertainty: <strong className="text-slate-800">±{std} kL</strong></span>
                </div>
              </div>

              {/* Telemetry and Crop Risk Badges */}
              <div className="mt-3.5 flex items-center justify-between text-xs text-slate-600 pt-2.5 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span 
                      className={`w-2 h-2 rounded-full ${
                        zone.telemetry_status === 'online' ? 'bg-emerald-600' : 'bg-amber-500'
                      }`} 
                    />
                    <span className="capitalize">{zone.telemetry_status}</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono text-slate-500">
                    <Battery className="w-3.5 h-3.5 text-slate-600" />
                    {zone.battery_pct}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500">
                    Risk w: <strong className="text-slate-800 font-mono">{zone.crop_risk_weight.toFixed(1)}</strong>
                  </span>
                  <span className="text-sky-700 font-medium hover:underline flex items-center gap-0.5">
                    <Eye className="w-3.5 h-3.5" />
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
