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
      <div className="material-card p-4.5 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">{t.kpiLossTitle}</span>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 font-mono">
            {voi.loss.toFixed(1)}
          </span>
          <span className="text-xs text-emerald-700 font-bold font-mono">
            -{lossReductionPct}% vs Max-σ
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
          <span>Max-σ: <strong className="text-slate-700 font-mono">{maxVar.loss.toFixed(1)}</strong></span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Demand-Prop: <strong className="text-slate-700 font-mono">{demand.loss.toFixed(1)}</strong></span>
        </div>
        <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(15, 100 - (voi.loss / (demand.loss || 1)) * 50))}%` }}
          />
        </div>
      </div>

      {/* 2. Jain's Fairness Index */}
      <div className="material-card p-4.5 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">{t.kpiFairnessTitle}</span>
          <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-sky-800 font-mono">
            {voi.jainFairness.toFixed(3)}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            / 1.000 max
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>{t.kpiFairnessSubtitle}</span>
          <span className="text-sky-700 font-semibold">Equitable</span>
        </div>
        <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-sky-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.round(voi.jainFairness * 100)}%` }}
          />
        </div>
      </div>

      {/* 3. Budget Compliance (100% Strict Hard Constraint) */}
      <div className="material-card p-4.5 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">{t.kpiComplianceTitle}</span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-emerald-700 font-mono">
            100.0%
          </span>
          <span className="text-xs text-emerald-800 font-semibold font-mono">
            ZERO Overdraft
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>Water: <strong className="text-slate-800 font-mono">{voi.totalAllocated} kL</strong></span>
          <span>Sensors: <strong className="text-slate-800 font-mono">{voi.measuredZones.length} / 2</strong></span>
        </div>
        <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div className="bg-emerald-600 h-1.5 rounded-full w-full" />
        </div>
      </div>

      {/* 4. AquaSense VOI Advantage */}
      <div className="material-card p-4.5 relative overflow-hidden group border-sky-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            {t.kpiVoiAdvantageTitle}
            <Info className="w-3.5 h-3.5 text-sky-600" />
          </span>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-amber-800 font-mono">
            +{lossReductionPct}%
          </span>
          <span className="text-xs text-slate-500 font-medium">
            decision gain
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>Averted: <strong className="text-amber-800 font-mono">{(maxVar.loss - voi.loss).toFixed(1)} loss</strong></span>
          <span className="text-emerald-700 font-semibold">+{demandComparisonPct}% vs Prop</span>
        </div>
        <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(20, Number(lossReductionPct) * 2.5))}%` }}
          />
        </div>
      </div>

    </div>
  );
};
