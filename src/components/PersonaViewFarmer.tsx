import React from 'react';
import { Users, Calendar, Volume2, CheckCircle2, AlertCircle, Droplet } from 'lucide-react';
import { Scenario, SimulationOutput, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface PersonaViewFarmerProps {
  scenario: Scenario;
  simulation: SimulationOutput;
  language: Language;
  onSpeakSchedule: (text: string) => void;
}

export const PersonaViewFarmer: React.FC<PersonaViewFarmerProps> = ({
  scenario,
  simulation,
  language,
  onSpeakSchedule,
}) => {
  const t = TRANSLATIONS[language];
  const voi = simulation.voiSensing;

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const scheduleSummaryText = `Farmer Cooperative Water Advisory for ${scenario.basin}. Total allocated water is ${voi.totalAllocated} thousand liters across ${scenario.zones.length} community units. All canal gates are calibrated with zero overdraft.`;

  return (
    <div className="glass-panel rounded-2xl p-5 lg:p-6 border border-white/10 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Farmer Cooperative & Community Irrigation Schedule
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Clear, transparent canal gate opening times, equitable water volumes, and plain-language community advisories
          </p>
        </div>

        <button
          onClick={() => onSpeakSchedule(scheduleSummaryText)}
          className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Play Voice Schedule</span>
        </button>
      </div>

      {/* Plain Language Delivery Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {scenario.zones.map((zone, idx) => {
          const allocated = voi.allocations[zone.id] || 0;
          const day = daysOfWeek[idx % daysOfWeek.length];
          const timeSlot = idx % 2 === 0 ? '06:00 AM - 12:00 PM' : '01:00 PM - 07:00 PM';
          const satisfaction = voi.satisfactions[zone.id] || 0.8;

          return (
            <div
              key={zone.id}
              className="bg-slate-900/70 p-4 rounded-xl border border-white/5 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{zone.crop_icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{zone.name}</h3>
                    <span className="text-[11px] text-slate-400">{zone.crop_type}</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5">
                  {day}
                </span>
              </div>

              {/* Actionable plain language schedule */}
              <div className="bg-slate-950/70 p-3 rounded-lg border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1 font-medium">
                    <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                    Delivery Volume:
                  </span>
                  <span className="font-mono text-cyan-300 font-bold text-sm">
                    {allocated.toFixed(0)} kL
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Canal Gate Window:</span>
                  <span className="font-medium text-slate-200">{timeSlot}</span>
                </div>
              </div>

              {/* Satisfaction & Advisory Note */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">Crop Health Protection:</span>
                {satisfaction >= 0.85 ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Optimal Supply
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Conservation Mode
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
