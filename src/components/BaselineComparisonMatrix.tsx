import React, { useState } from 'react';
import { Layers, TrendingDown, Scale, ShieldCheck, ChevronRight } from 'lucide-react';
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
      color: '#64748B',
      isAquaSense: false,
    },
    {
      id: 'uncertainty_weighted',
      name: '2. Uncertainty-Weighted',
      description: 'Tilts allocation toward higher variance & risk weights (No sensing)',
      data: simulation.uncertaintyWeighted,
      color: '#D97706',
      isAquaSense: false,
    },
    {
      id: 'max_uncertainty_sensing',
      name: '3. Max Uncertainty Sensing',
      description: 'Greedily measures unit with largest σ, then optimizes allocation',
      data: simulation.maxUncertaintySensing,
      color: '#BE185D',
      isAquaSense: false,
    },
    {
      id: 'voi_sensing',
      name: '4. AquaSense Decision-Aware VOI',
      description: 'Simulates downstream loss reduction; measures critical tipping threshold',
      data: simulation.voiSensing,
      color: '#0284C7',
      isAquaSense: true,
    },
  ];

  const minLoss = Math.min(...policies.map(p => p.data.loss));

  return (
    <div className="material-card p-6 border border-slate-200 bg-white">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-100 text-sky-800">
              <Layers className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {t.matrixTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            {t.matrixSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowZoneDetails(!showZoneDetails)}
          aria-expanded={showZoneDetails}
          className="text-xs text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>{showZoneDetails ? 'Hide Zone Quotas' : 'View Zone-by-Zone Quotas'}</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showZoneDetails ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Policy Scorecards Comparison Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
        {policies.map((p) => {
          const isWinner = p.data.loss === minLoss;
          const lossDiff = p.data.loss - minLoss;

          return (
            <div
              key={p.id}
              className={`rounded-2xl p-4.5 transition-all relative border ${
                p.isAquaSense
                  ? 'bg-sky-50/70 border-sky-400 shadow-sm ring-1 ring-sky-300'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {p.isAquaSense && (
                <div className="absolute -top-2.5 right-3 bg-sky-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  AQUASENSE OPTIMAL
                </div>
              )}

              <div className="flex items-center justify-between gap-1">
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                  {p.name}
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2 h-8 leading-snug">
                {p.description}
              </p>

              {/* Loss Proxy & Delta */}
              <div className="mt-4 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 flex items-center gap-1 font-medium">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                    Crop-Stress Loss:
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 font-mono">
                    {p.data.loss.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                  <span>Delta vs Optimal:</span>
                  <span className={`font-mono font-semibold ${isWinner ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {isWinner ? '0.0 (Best)' : `+${lossDiff.toFixed(1)}`}
                  </span>
                </div>
              </div>

              {/* Jain's Fairness & Budget Compliance */}
              <div className="mt-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1 font-medium">
                    <Scale className="w-3.5 h-3.5 text-sky-600" />
                    Jain Fairness:
                  </span>
                  <span className="font-mono text-sky-800 font-bold">
                    {p.data.jainFairness.toFixed(3)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Hard Budget Audit:
                  </span>
                  <span className="font-mono text-emerald-800 font-bold">
                    {p.data.totalAllocated} kL ({p.data.budgetCompliancePct.toFixed(0)}% compliant)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                  <span>Measured Units (K):</span>
                  <span className="font-mono text-slate-800 font-medium">
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
        <div className="mt-5 pt-4 border-t border-slate-200 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs font-mono bg-slate-50">
                <th className="py-2.5 px-3 rounded-l-lg">Zone / Crop Unit</th>
                <th className="py-2.5 px-3">Prior Mean (μ)</th>
                <th className="py-2.5 px-3">Uncertainty (σ)</th>
                <th className="py-2.5 px-3">True Need (Hidden)</th>
                <th className="py-2.5 px-3 text-slate-600">1. Demand-Prop</th>
                <th className="py-2.5 px-3 text-amber-700">2. Uncert-Weight</th>
                <th className="py-2.5 px-3 text-pink-700">3. Max-Uncert</th>
                <th className="py-2.5 px-3 text-sky-800 font-bold rounded-r-lg">4. AquaSense VOI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-slate-50 font-mono">
                  <td className="py-2.5 px-3 font-sans text-slate-900 flex items-center gap-2">
                    <span>{zone.crop_icon}</span>
                    <span className="font-medium">{zone.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{zone.estimated_water_need_mean} kL</td>
                  <td className="py-2.5 px-3 text-amber-700">±{zone.estimated_water_need_std} kL</td>
                  <td className="py-2.5 px-3 text-slate-700 font-medium">{zone.hidden_ground_truth_need} kL</td>
                  <td className="py-2.5 px-3 text-slate-600">{simulation.demandProportional.allocations[zone.id] || 0} kL</td>
                  <td className="py-2.5 px-3 text-amber-800">{simulation.uncertaintyWeighted.allocations[zone.id] || 0} kL</td>
                  <td className="py-2.5 px-3 text-pink-800">{simulation.maxUncertaintySensing.allocations[zone.id] || 0} kL</td>
                  <td className="py-2.5 px-3 text-sky-800 font-bold bg-sky-50/60">{simulation.voiSensing.allocations[zone.id] || 0} kL</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
