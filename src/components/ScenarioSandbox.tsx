import React, { useState } from 'react';
import { Sliders, Droplets, Radio, RefreshCw, X } from 'lucide-react';
import { Scenario, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface ScenarioSandboxProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: Scenario;
  onApplySandbox: (newBudget: number, newSensorBudget: number) => void;
  language: Language;
}

export const ScenarioSandbox: React.FC<ScenarioSandboxProps> = ({
  isOpen,
  onClose,
  scenario,
  onApplySandbox,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [budget, setBudget] = useState(scenario.totalWaterBudget);
  const [sensorBudget, setSensorBudget] = useState(scenario.sensorBudget);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-[#0B0F17] border border-cyan-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {t.scenarios.customSandbox}
              </h3>
              <span className="text-xs text-slate-400">Stress-test resource and sensing constraints</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-5 my-5 text-xs">
          
          {/* Total Water Budget W_total */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-cyan-400" />
                Total Basin Water Budget (W_total):
              </span>
              <span className="font-mono text-cyan-300 font-bold text-sm">{budget} kL</span>
            </div>
            <input
              type="range"
              min={1800}
              max={5000}
              step={100}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Severe Drought (1800 kL)</span>
              <span>Abundant Storage (5000 kL)</span>
            </div>
          </div>

          {/* Sensor Observation Budget K */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-cyan-400" />
                Sensor Observation Budget (K):
              </span>
              <span className="font-mono text-cyan-300 font-bold text-sm">{sensorBudget} Measurements</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((k) => (
                <button
                  key={k}
                  onClick={() => setSensorBudget(k)}
                  className={`py-2 rounded-lg font-mono font-bold text-xs border transition-all ${
                    sensorBudget === k
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  K = {k}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-white/10 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApplySandbox(budget, sensorBudget);
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
          >
            Apply & Re-Optimize
          </button>
        </div>

      </div>
    </div>
  );
};
