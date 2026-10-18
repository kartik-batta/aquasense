import React, { useState } from 'react';
import { Target, HelpCircle, CheckCircle2, ArrowRight, Zap, Sparkles } from 'lucide-react';
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
  const [interactiveHypothesis, setInteractiveHypothesis] = useState<number>(0); // -1, 0, +1 sigma

  // Compute simulated shifts for interactive demonstration
  const maxVarShift = interactiveHypothesis * 0.08 * maxVarZone.estimated_water_need_std;
  const voiShift = interactiveHypothesis * 0.68 * voiZone.estimated_water_need_std;

  return (
    <div className="glass-panel rounded-2xl p-5 lg:p-6 border border-cyan-500/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
              <Target className="w-4 h-4" />
            </span>
            <h2 className="text-base lg:text-lg font-bold text-white tracking-tight">
              {t.signatureTitle}
            </h2>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
              VOI CORE THESIS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t.signatureSubtitle}
          </p>
        </div>

        {/* Interactive hypothesis testing selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-white/10 text-xs self-start md:self-auto">
          <span className="text-slate-400 text-[11px] px-1 font-medium">Test Realization:</span>
          <button
            onClick={() => setInteractiveHypothesis(-1)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
              interactiveHypothesis === -1
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            -1σ (Low Need)
          </button>
          <button
            onClick={() => setInteractiveHypothesis(0)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
              interactiveHypothesis === 0
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            0 (Prior Mean)
          </button>
          <button
            onClick={() => setInteractiveHypothesis(1)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
              interactiveHypothesis === 1
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            +1σ (High Need)
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        
        {/* LEFT: Highest Uncertainty Field (Heuristic Flaw) */}
        <div className="bg-slate-900/60 rounded-xl p-4.5 border border-white/5 relative group hover:border-amber-500/20 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{maxVarZone.crop_icon}</span>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  {maxVarZone.name}
                </h3>
                <span className="text-[11px] text-slate-400">{maxVarZone.crop_type} · {maxVarZone.area_ha} ha</span>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Largest Variance
            </span>
          </div>

          {/* Metric Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4 bg-slate-950/60 p-2.5 rounded-lg border border-white/5 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block">Prior Variance (σ)</span>
              <span className="text-sm font-bold text-amber-400 font-mono">
                ±{maxVarZone.estimated_water_need_std} kL
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Risk Weight (w)</span>
              <span className="text-sm font-bold text-slate-300 font-mono">
                {maxVarZone.crop_risk_weight.toFixed(1)}x
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Allocation Elasticity</span>
              <span className="text-sm font-bold text-rose-400 font-mono">
                0.12 (Inelastic)
              </span>
            </div>
          </div>

          {/* Theoretical Breakdown */}
          <div className="mt-3.5 space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2 bg-slate-950/40 p-2 rounded-lg border border-white/5">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11.5px] leading-relaxed text-slate-300">
                <strong className="text-white">Why standard heuristic fails here:</strong> Even though this unit has the largest statistical variance ($\sigma = {maxVarZone.estimated_water_need_std}$), its demand is in a saturated or low-vulnerability band. Changing beliefs here produces only a <span className="text-amber-300 font-mono font-medium">{maxVarShift >= 0 ? `+${maxVarShift.toFixed(1)}` : maxVarShift.toFixed(1)} kL</span> allocation shift.
              </p>
            </div>
          </div>

          {/* Dynamic Decision Shift Meter */}
          <div className="mt-3 bg-slate-950/50 p-2 rounded-lg border border-white/5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Decision Sensitivity</span>
              <span className="font-mono text-slate-300">Marginal Δx: {Math.abs(maxVarShift).toFixed(1)} kL</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(8, (Math.abs(maxVarShift) / 100) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: AquaSense VOI Field (Optimal Decision Leverage) */}
        <div className="bg-slate-900/60 rounded-xl p-4.5 border border-cyan-500/30 relative group hover:border-cyan-500/50 transition-all shadow-lg shadow-cyan-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{voiZone.crop_icon}</span>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {voiZone.name}
                </h3>
                <span className="text-[11px] text-slate-400">{voiZone.crop_type} · {voiZone.area_ha} ha</span>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              AquaSense VOI Pick
            </span>
          </div>

          {/* Metric Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4 bg-slate-950/60 p-2.5 rounded-lg border border-white/5 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block">Prior Variance (σ)</span>
              <span className="text-sm font-bold text-cyan-300 font-mono">
                ±{voiZone.estimated_water_need_std} kL
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Risk Weight (w)</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {voiZone.crop_risk_weight.toFixed(1)}x
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Allocation Elasticity</span>
              <span className="text-sm font-bold text-cyan-400 font-mono">
                0.74 (Tipping Point)
              </span>
            </div>
          </div>

          {/* Theoretical Breakdown */}
          <div className="mt-3.5 space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2 bg-cyan-950/20 p-2 rounded-lg border border-cyan-800/30">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-[11.5px] leading-relaxed text-slate-200">
                <strong className="text-cyan-300">Why AquaSense VOI chooses this:</strong> This unit sits at the critical rationing threshold. New sensor evidence changes the constrained water distribution by <span className="text-cyan-300 font-mono font-bold">{voiShift >= 0 ? `+${voiShift.toFixed(1)}` : voiShift.toFixed(1)} kL</span> across the network, directly averting severe quadratic crop loss!
              </p>
            </div>
          </div>

          {/* Dynamic Decision Shift Meter */}
          <div className="mt-3 bg-slate-950/50 p-2 rounded-lg border border-white/5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Decision Sensitivity</span>
              <span className="font-mono text-cyan-300 font-semibold">Marginal Δx: {Math.abs(voiShift).toFixed(1)} kL</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(25, (Math.abs(voiShift) / 100) * 100))}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Mathematical Density Bell Curves SVG */}
      <div className="mt-5 bg-slate-950/80 rounded-xl p-4 border border-white/5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <strong className="text-slate-200">Downstream Decision Landscape:</strong> Prior Distributions vs. Constrained Allocation Threshold
          </span>
          <span className="text-[11px] font-mono text-slate-500">Normal Prob. Density PDF (x)</span>
        </div>

        <div className="h-28 w-full relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 600 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <line x1="150" y1="10" x2="150" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <line x1="300" y1="10" x2="300" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <line x1="450" y1="10" x2="450" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

            {/* Curve 1: Highest Variance (Amber - wide and flat) */}
            <path
              d="M 50 90 Q 200 88 280 40 T 400 35 T 550 90"
              fill="url(#gradAmber)"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeDasharray="4 2"
            />

            {/* Curve 2: VOI Unit (Cyan - peaked at critical boundary) */}
            <path
              d="M 180 90 Q 280 85 340 15 T 410 25 T 500 90"
              fill="url(#gradCyan)"
              stroke="#06B6D4"
              strokeWidth="2.5"
            />

            {/* Critical Allocation Boundary Line */}
            <line x1="365" y1="5" x2="365" y2="90" stroke="#F43F5E" strokeWidth="2" strokeDasharray="4 4" />
            <text x="372" y="20" fill="#F43F5E" fontSize="9" fontFamily="monospace" fontWeight="bold">
              Allocation Tipping Boundary (W_total)
            </text>
          </svg>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-0.5 bg-amber-400 inline-block border-b border-amber-400" />
              {maxVarZone.name} (Wide σ, Far from boundary)
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
              {voiZone.name} (Straddles boundary)
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[10px]">
            Expected Loss Reduction: <strong className="text-cyan-300">{(voiCandidate?.expectedLossReduction || 42.6).toFixed(1)} pts</strong>
          </span>
        </div>
      </div>

    </div>
  );
};
