import React, { useState } from 'react';
import { Layers, CheckCircle2, TrendingDown, Scale, ShieldCheck, ChevronRight } from 'lucide-react';
import { SimulationOutput, Zone, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface BaselineComparisonMatrixProps {
  simulation: SimulationOutput;
  zones: Zone[];
  language: Language;
}

export const BaselineComparisonMatrix: React.FC<BaselineComparisonMatrixProps> = ({
  simulation,
  zones,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [showZoneDetails, setShowZoneDetails] = useState(false);

  const policies = [
    {
      id: 'demand_proportional',
      name: '1. Demand-Proportional',
      description: 'Allocates strictly proportional to mean estimated need (No sensing)',
      data: simulation.demandProportional,
      color: '#94A3B8',
      isAquaSense: false,
    },
    {
      id: 'uncertainty_weighted',
      name: '2. Uncertainty-Weighted',
      description: 'Tilts allocation toward higher variance & risk weights (No sensing)',
      data: simulation.uncertaintyWeighted,
      color: '#F59E0B',
      isAquaSense: false,
    },
    {
      id: 'max_uncertainty_sensing',
      name: '3. Max Uncertainty Sensing',
      description: 'Greedily measures unit with largest σ, then optimizes allocation',
      data: simulation.maxUncertaintySensing,
      color: '#EC4899',
      isAquaSense: false,
    },
    {
      id: 'voi_sensing',
      name: '4. AquaSense Decision-Aware VOI',
      description: 'Simulates downstream loss reduction; measures critical tipping threshold',
      data: simulation.voiSensing,
      color: '#06B6D4',
      isAquaSense: true,
    },
  ];

  const minLoss = Math.min(...policies.map(p => p.data.loss));
  const maxLoss = Math.max(...policies.map(p => p.data.loss));

  return (
    <div className="glass-panel rounded-2xl p-5 lg:p-6 border border-white/10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
              <Layers className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              {t.matrixTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.matrixSubtitle}
          </p>
        </div>

        <button
          onClick={() => setShowZoneDetails(!showZoneDetails)}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          <span>{showZoneDetails ? 'Hide Zone Quotas' : 'View Zone-by-Zone Quotas'}</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showZoneDetails ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Policy Scorecards Comparison Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        {policies.map((p) => {
          const isWinner = p.data.loss === minLoss;
          const lossDiff = p.data.loss - minLoss;

          return (
            <div
              key={p.id}
              className={`rounded-xl p-4 transition-all relative border ${
                p.isAquaSense
                  ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900/80 border-cyan-500/50 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/60 border-white/5 hover:border-white/15'
              }`}
            >
              {p.isAquaSense && (
                <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  AQUASENSE OPTIMAL
                </div>
              )}

              <div className="flex items-center justify-between gap-1">
                <h3 className="text-xs font-bold text-white tracking-tight">
                  {p.name}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 h-8 leading-snug">
                {p.description}
              </p>

              {/* Loss Proxy & Delta */}
              <div className="mt-4 bg-slate-950/70 p-3 rounded-lg border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    Crop-Stress Loss:
                  </span>
                  <span className="text-sm font-extrabold text-white font-mono">
                    {p.data.loss.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>Delta vs Optimal:</span>
                  <span className={`font-mono font-medium ${isWinner ? 'text-emerald-400 font-bold' : 'text-rose-400'}`}>
                    {isWinner ? '0.0 (Best)' : `+${lossDiff.toFixed(1)}`}
                  </span>
                </div>
              </div>

              {/* Jain's Fairness & Budget Compliance */}
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-cyan-400" />
                    Jain Fairness:
                  </span>
                  <span className="font-mono text-cyan-300 font-medium">
                    {p.data.jainFairness.toFixed(3)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Hard Budget Audit:
                  </span>
                  <span className="font-mono text-emerald-400 font-medium">
                    {p.data.totalAllocated} kL (100%)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                  <span>Measured Units (K):</span>
                  <span className="font-mono text-slate-300">
                    {p.data.measuredZones.length > 0 ? p.data.measuredZones.join(', ') : 'None (Blind)'}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Expandable Zone-by-Zone Allocation Breakdown Table */}
      {showZoneDetails && (
        <div className="mt-5 pt-4 border-t border-white/10 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px] font-mono">
                <th className="py-2.5 px-3">Zone / Crop Unit</th>
                <th className="py-2.5 px-3">Prior Mean (μ)</th>
                <th className="py-2.5 px-3">Uncertainty (σ)</th>
                <th className="py-2.5 px-3">True Need (Hidden)</th>
                <th className="py-2.5 px-3 text-slate-300">1. Demand-Prop</th>
                <th className="py-2.5 px-3 text-amber-400">2. Uncert-Weight</th>
                <th className="py-2.5 px-3 text-pink-400">3. Max-Uncert</th>
                <th className="py-2.5 px-3 text-cyan-300 font-bold">4. AquaSense VOI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-slate-900/40 font-mono">
                  <td className="py-2.5 px-3 font-sans text-slate-200 flex items-center gap-2">
                    <span>{zone.crop_icon}</span>
                    <span className="font-medium">{zone.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{zone.estimated_water_need_mean} kL</td>
                  <td className="py-2.5 px-3 text-amber-400">±{zone.estimated_water_need_std} kL</td>
                  <td className="py-2.5 px-3 text-slate-300">{zone.hidden_ground_truth_need} kL</td>
                  <td className="py-2.5 px-3 text-slate-400">{simulation.demandProportional.allocations[zone.id] || 0} kL</td>
                  <td className="py-2.5 px-3 text-amber-300">{simulation.uncertaintyWeighted.allocations[zone.id] || 0} kL</td>
                  <td className="py-2.5 px-3 text-pink-300">{simulation.maxUncertaintySensing.allocations[zone.id] || 0} kL</td>
                  <td className="py-2.5 px-3 text-cyan-300 font-bold bg-cyan-950/20">{simulation.voiSensing.allocations[zone.id] || 0} kL</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
