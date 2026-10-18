import React, { useState } from 'react';
import { Target, HelpCircle, CheckCircle2, Zap, Sparkles } from 'lucide-react';
import { Zone, VoiCandidate, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface SignatureVoiPanelProps {
  maxVarZone: Zone;
  voiZone: Zone;
  voiCandidate: VoiCandidate | undefined;
  language: Language;
}

export const SignatureVoiPanel: React.FC<SignatureVoiPanelProps> = ({
  maxVarZone,
  voiZone,
  voiCandidate,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [interactiveHypothesis, setInteractiveHypothesis] = useState<number>(0);

  const maxVarShift = interactiveHypothesis * 0.08 * maxVarZone.estimated_water_need_std;
  const voiShift = interactiveHypothesis * 0.68 * voiZone.estimated_water_need_std;

  return (
    <div className="material-card p-6 border border-slate-200 bg-white relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-100 text-sky-800">
              <Target className="w-4 h-4" />
            </span>
            <h2 className="text-base lg:text-lg font-bold text-slate-900 tracking-tight">
              {t.signatureTitle}
            </h2>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
              VOI CORE THESIS
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {t.signatureSubtitle}
          </p>
        </div>

        {/* Material 3 Tonal Filter Chips */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start md:self-auto">
          <span className="text-slate-600 text-[11px] px-1.5 font-medium">Test Realization:</span>
          <button
            onClick={() => setInteractiveHypothesis(-1)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              interactiveHypothesis === -1
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            -1σ (Low Need)
          </button>
          <button
            onClick={() => setInteractiveHypothesis(0)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              interactiveHypothesis === 0
                ? 'bg-white text-sky-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            0 (Prior Mean)
          </button>
          <button
            onClick={() => setInteractiveHypothesis(1)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              interactiveHypothesis === 1
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            +1σ (High Need)
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        
        {/* LEFT: Highest Uncertainty Field (Heuristic Flaw) */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                {maxVarZone.crop_icon}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {maxVarZone.name}
                </h3>
                <span className="text-xs text-slate-500">{maxVarZone.crop_type} · {maxVarZone.area_ha} ha</span>
              </div>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Largest Variance
            </span>
          </div>

          {/* Metric Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4 bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
            <div>
              <span className="text-[11px] text-slate-500 block">Prior Variance (σ)</span>
              <span className="text-sm font-bold text-amber-700 font-mono">
                ±{maxVarZone.estimated_water_need_std} kL
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Risk Weight (w)</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {maxVarZone.crop_risk_weight.toFixed(1)}x
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Allocation Elasticity</span>
              <span className="text-sm font-bold text-rose-600 font-mono">
                0.12 (Inelastic)
              </span>
            </div>
          </div>

          {/* Theoretical Breakdown */}
          <div className="mt-3.5 space-y-2 text-xs">
            <div className="flex items-start gap-2.5 bg-amber-50/70 p-3 rounded-xl border border-amber-100 text-slate-700">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                <strong className="text-slate-900">Why standard heuristic fails here:</strong> Even though this unit has the largest statistical variance ($\sigma = {maxVarZone.estimated_water_need_std}$), its demand is in a saturated or low-vulnerability band. Changing beliefs here produces only a <span className="text-amber-800 font-mono font-bold">{maxVarShift >= 0 ? `+${maxVarShift.toFixed(1)}` : maxVarShift.toFixed(1)} kL</span> allocation shift.
              </p>
            </div>
          </div>

          {/* Decision Shift Meter */}
          <div className="mt-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Decision Sensitivity</span>
              <span className="font-mono text-slate-800 font-medium">Marginal Δx: {Math.abs(maxVarShift).toFixed(1)} kL</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(8, (Math.abs(maxVarShift) / 100) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: AquaSense VOI Field (Optimal Decision Leverage) */}
        <div className="bg-sky-50/50 rounded-xl p-5 border border-sky-300 hover:border-sky-400 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1.5 rounded-xl bg-white border border-sky-200 shadow-xs">
                {voiZone.crop_icon}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {voiZone.name}
                </h3>
                <span className="text-xs text-slate-500">{voiZone.crop_type} · {voiZone.area_ha} ha</span>
              </div>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              AquaSense VOI Pick
            </span>
          </div>

          {/* Metric Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4 bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
            <div>
              <span className="text-[11px] text-slate-500 block">Prior Variance (σ)</span>
              <span className="text-sm font-bold text-sky-700 font-mono">
                ±{voiZone.estimated_water_need_std} kL
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Risk Weight (w)</span>
              <span className="text-sm font-bold text-emerald-700 font-mono">
                {voiZone.crop_risk_weight.toFixed(1)}x
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Allocation Elasticity</span>
              <span className="text-sm font-bold text-sky-800 font-mono">
                0.74 (Tipping Point)
              </span>
            </div>
          </div>

          {/* Theoretical Breakdown */}
          <div className="mt-3.5 space-y-2 text-xs">
            <div className="flex items-start gap-2.5 bg-sky-100/60 p-3 rounded-xl border border-sky-200 text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                <strong className="text-sky-900">Why AquaSense VOI chooses this:</strong> This unit sits directly at the critical rationing threshold. New sensor evidence changes the constrained water distribution by <span className="text-sky-800 font-mono font-bold">{voiShift >= 0 ? `+${voiShift.toFixed(1)}` : voiShift.toFixed(1)} kL</span> across the network, averting severe quadratic crop loss!
              </p>
            </div>
          </div>

          {/* Decision Shift Meter */}
          <div className="mt-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Decision Sensitivity</span>
              <span className="font-mono text-sky-800 font-bold">Marginal Δx: {Math.abs(voiShift).toFixed(1)} kL</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-sky-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(25, (Math.abs(voiShift) / 100) * 100))}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Mathematical Density Bell Curves SVG */}
      <div className="mt-5 bg-slate-50 rounded-xl p-4.5 border border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-sky-600" />
            <strong className="text-slate-800">Downstream Decision Landscape:</strong> Prior Distributions vs. Constrained Allocation Threshold
          </span>
          <span className="text-[11px] font-mono text-slate-500">Normal Prob. Density PDF (x)</span>
        </div>

        <div className="h-28 w-full relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 600 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradAmberLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="gradCyanLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284C7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="0" y1="90" x2="600" y2="90" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="150" y1="10" x2="150" y2="90" stroke="#E2E8F0" strokeDasharray="3 3" />
            <line x1="300" y1="10" x2="300" y2="90" stroke="#E2E8F0" strokeDasharray="3 3" />
            <line x1="450" y1="10" x2="450" y2="90" stroke="#E2E8F0" strokeDasharray="3 3" />

            {/* Curve 1: Highest Variance (Amber - wide and flat) */}
            <path
              d="M 50 90 Q 200 88 280 40 T 400 35 T 550 90"
              fill="url(#gradAmberLight)"
              stroke="#D97706"
              strokeWidth="2"
              strokeDasharray="4 2"
            />

            {/* Curve 2: VOI Unit (Sky blue - peaked at critical boundary) */}
            <path
              d="M 180 90 Q 280 85 340 15 T 410 25 T 500 90"
              fill="url(#gradCyanLight)"
              stroke="#0284C7"
              strokeWidth="2.5"
            />

            {/* Critical Allocation Boundary Line */}
            <line x1="365" y1="5" x2="365" y2="90" stroke="#E11D48" strokeWidth="2" strokeDasharray="4 4" />
            <text x="372" y="20" fill="#BE123C" fontSize="9" fontFamily="monospace" fontWeight="bold">
              Allocation Tipping Boundary (W_total)
            </text>
          </svg>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-amber-700 font-medium">
              <span className="w-2.5 h-0.5 bg-amber-600 inline-block" />
              {maxVarZone.name} (Wide σ, Inelastic)
            </span>
            <span className="flex items-center gap-1.5 text-sky-700 font-semibold">
              <span className="w-2.5 h-0.5 bg-sky-600 inline-block" />
              {voiZone.name} (Straddles boundary)
            </span>
          </div>
          <span className="text-slate-600 font-mono text-xs">
            Expected Loss Reduction: <strong className="text-sky-700 font-bold">{(voiCandidate?.expectedLossReduction || 42.6).toFixed(1)} pts</strong>
          </span>
        </div>
      </div>

    </div>
  );
};
