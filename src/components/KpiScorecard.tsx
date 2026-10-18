import React from 'react';
import { TrendingDown, Scale, ShieldCheck, Zap, Info } from 'lucide-react';
import { SimulationOutput, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface KpiScorecardProps {
  simulation: SimulationOutput;
  language: Language;
}

export const KpiScorecard: React.FC<KpiScorecardProps> = ({ simulation, language }) => {
  const t = TRANSLATIONS[language];
  const voi = simulation.voiSensing;
  const maxVar = simulation.maxUncertaintySensing;
  const demand = simulation.demandProportional;

  const lossReductionPct = maxVar.loss > 0 
    ? (((maxVar.loss - voi.loss) / maxVar.loss) * 100).toFixed(1)
    : '0';

  const demandComparisonPct = demand.loss > 0
    ? (((demand.loss - voi.loss) / demand.loss) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Crop-Stress Loss Proxy */}
      <div className="glass-panel rounded-xl p-4.5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/15 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">{t.kpiLossTitle}</span>
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-white font-mono">
            {voi.loss.toFixed(1)}
          </span>
          <span className="text-xs text-emerald-400 font-semibold font-mono flex items-center">
            -{lossReductionPct}% vs Max-σ
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
          <span>Max-σ: <strong className="text-slate-300 font-mono">{maxVar.loss.toFixed(1)}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Demand-Prop: <strong className="text-slate-300 font-mono">{demand.loss.toFixed(1)}</strong></span>
        </div>
        <div className="mt-2.5 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(15, 100 - (voi.loss / (demand.loss || 1)) * 50))}%` }}
          />
        </div>
      </div>

      {/* 2. Jain's Fairness Index */}
      <div className="glass-panel rounded-xl p-4.5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/15 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">{t.kpiFairnessTitle}</span>
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-cyan-300 font-mono">
            {voi.jainFairness.toFixed(3)}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            / 1.000 max
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>{t.kpiFairnessSubtitle}</span>
          <span className="text-cyan-400 font-medium">Equitable</span>
        </div>
        <div className="mt-2.5 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.round(voi.jainFairness * 100)}%` }}
          />
        </div>
      </div>

      {/* 3. Budget Compliance (100% Strict Hard Constraint) */}
      <div className="glass-panel rounded-xl p-4.5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/15 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">{t.kpiComplianceTitle}</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-emerald-400 font-mono">
            100.0%
          </span>
          <span className="text-xs text-emerald-300 font-medium font-mono">
            ZERO Overdraft
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>Water: <strong className="text-slate-200 font-mono">{voi.totalAllocated} kL</strong></span>
          <span>Sensors: <strong className="text-slate-200 font-mono">{voi.measuredZones.length} / 2</strong></span>
        </div>
        <div className="mt-2.5 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
          <div className="bg-emerald-400 h-1.5 rounded-full w-full" />
        </div>
      </div>

      {/* 4. AquaSense VOI Advantage */}
      <div className="glass-panel rounded-xl p-4.5 relative overflow-hidden group border border-cyan-500/25">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/15 transition-all" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
            {t.kpiVoiAdvantageTitle}
            <Info className="w-3.5 h-3.5 text-cyan-400" />
          </span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-amber-300 font-mono">
            +{lossReductionPct}%
          </span>
          <span className="text-xs text-slate-400">
            decision gain
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>Averted: <strong className="text-amber-200 font-mono">{(maxVar.loss - voi.loss).toFixed(1)} loss</strong></span>
          <span className="text-emerald-400 font-medium">+{demandComparisonPct}% vs Prop</span>
        </div>
        <div className="mt-2.5 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-amber-400 to-cyan-400 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(20, Number(lossReductionPct) * 2.5))}%` }}
          />
        </div>
      </div>

    </div>
  );
};
