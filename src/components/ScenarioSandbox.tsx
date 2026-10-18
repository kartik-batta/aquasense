import React, { useState } from 'react';
import { Sliders, Droplets, Radio, X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl relative text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-100 text-sky-800">
              <Sliders className="w-5 h-5 text-sky-600" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {t.scenarios.customSandbox}
              </h3>
              <span className="text-xs text-slate-500">Stress-test resource and sensing constraints</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-5 my-5 text-xs">
          
          {/* Total Water Budget W_total */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-bold flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sky-600" />
                Total Basin Water Budget (W_total):
              </span>
              <span className="font-mono text-sky-800 font-bold text-sm">{budget} kL</span>
            </div>
            <input
              type="range"
              min={1800}
              max={5000}
              step={100}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Severe Drought (1800 kL)</span>
              <span>Abundant Storage (5000 kL)</span>
            </div>
          </div>

          {/* Sensor Observation Budget K */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-bold flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-sky-600" />
                Sensor Observation Budget (K):
              </span>
              <span className="font-mono text-sky-800 font-bold text-sm">{sensorBudget} Measurements</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((k) => (
                <button
                  key={k}
                  onClick={() => setSensorBudget(k)}
                  className={`py-2 rounded-xl font-mono font-bold text-xs border transition-all cursor-pointer ${
                    sensorBudget === k
                      ? 'bg-sky-100 text-sky-800 border-sky-400 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  K = {k}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApplySandbox(budget, sensorBudget);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Apply & Re-Optimize
          </button>
        </div>

      </div>
    </div>
  );
};
