import React from 'react';
import { Users, Volume2, CheckCircle2, AlertCircle, Droplet } from 'lucide-react';
import { Scenario, SimulationOutput } from '../types';

interface PersonaViewFarmerProps {
  scenario: Scenario;
  simulation: SimulationOutput;
  onSpeakSchedule: (text: string) => void;
}

export const PersonaViewFarmer: React.FC<PersonaViewFarmerProps> = ({
  scenario,
  simulation,
  onSpeakSchedule,
}) => {
  const voi = simulation.voiSensing;

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const scheduleSummaryText = `Farmer Cooperative Water Advisory for ${scenario.basin}. Total allocated water is ${voi.totalAllocated} thousand liters across ${scenario.zones.length} community units. All canal gates are calibrated with zero overdraft.`;

  return (
    <div className="material-card p-6 border border-slate-200 bg-white space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Users className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Farmer Cooperative & Community Irrigation Schedule
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Clear, transparent canal gate opening times, equitable water volumes, and plain-language community advisories
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSpeakSchedule(scheduleSummaryText)}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
          <span>Play Voice Schedule</span>
        </button>
      </div>

      {/* Plain Language Delivery Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenario.zones.map((zone, idx) => {
          const allocated = voi.allocations[zone.id] || 0;
          const day = daysOfWeek[idx % daysOfWeek.length];
          const timeSlot = idx % 2 === 0 ? '06:00 AM - 12:00 PM' : '01:00 PM - 07:00 PM';
          const satisfaction = voi.satisfactions[zone.id] ?? 0;

          return (
            <div
              key={zone.id}
              className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-3 relative overflow-hidden shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    {zone.crop_icon}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{zone.name}</h3>
                    <span className="text-xs text-slate-600">{zone.crop_type}</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {day}
                </span>
              </div>

              {/* Actionable plain language schedule */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span className="flex items-center gap-1 font-medium">
                    <Droplet className="w-3.5 h-3.5 text-sky-600" />
                    Delivery Volume:
                  </span>
                  <span className="font-mono text-sky-800 font-extrabold text-sm">
                    {allocated.toFixed(0)} kL
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <span>Canal Gate Window:</span>
                  <span className="font-semibold text-slate-800">{timeSlot}</span>
                </div>
              </div>

              {/* Satisfaction & Advisory Note */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Crop Health Protection:</span>
                {satisfaction >= 0.85 ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Optimal Supply
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
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
