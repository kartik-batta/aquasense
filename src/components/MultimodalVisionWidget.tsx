import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Sparkles, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import { Zone, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface MultimodalVisionWidgetProps {
  selectedZone: Zone;
  onUpdateZoneWithNdvi: (zoneId: string, ndvi: number, deltaStd: number) => void;
  language: Language;
}

export const MultimodalVisionWidget: React.FC<MultimodalVisionWidgetProps> = ({
  selectedZone,
  onUpdateZoneWithNdvi,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedPreset, setSelectedPreset] = useState<'healthy' | 'moderate' | 'severe'>('moderate');
  const [computedNdvi, setComputedNdvi] = useState<number>(selectedZone.ndvi_current);
  const [stressSeverity, setStressSeverity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [appliedNotification, setAppliedNotification] = useState(false);

  // Render synthetic multispectral canopy imagery onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw base canopy texture
    ctx.clearRect(0, 0, width, height);

    // Color gradient based on preset
    let primaryHue = 120; // green for healthy
    let saturation = 70;
    let lightness = 35;
    let baseNdvi = 0.74;

    if (selectedPreset === 'moderate') {
      primaryHue = 65; // yellow-green
      baseNdvi = 0.51;
      setStressSeverity('moderate');
    } else if (selectedPreset === 'severe') {
      primaryHue = 25; // amber-brown drought
      baseNdvi = 0.32;
      setStressSeverity('high');
    } else {
      setStressSeverity('low');
    }

    setComputedNdvi(baseNdvi);

    // Generate procedural crop rows & canopy multispectral false-color bands
    for (let x = 0; x < width; x += 12) {
      for (let y = 0; y < height; y += 12) {
        const noise = (Math.sin(x * 0.05) + Math.cos(y * 0.05) + Math.random() * 0.6) * 15;
        const currentHue = Math.max(10, Math.min(140, primaryHue + noise));
        ctx.fillStyle = `hsl(${currentHue}, ${saturation}%, ${lightness}%)`;
        ctx.fillRect(x, y, 10, 10);
      }
    }

    // Add multispectral HUD grid overlay
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let j = 0; j < height; j += 50) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(width, j);
      ctx.stroke();
    }

    // Reticle center
    ctx.strokeStyle = '#06B6D4';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 24, 0, Math.PI * 2);
    ctx.stroke();

  }, [selectedPreset]);

  const handleApplyNdviToUncertainty = () => {
    // Severe drought/stress shifts uncertainty upward due to erratic stomatal closure
    let deltaStd = 0;
    if (computedNdvi < 0.4) {
      deltaStd = 45; // significantly increase variance
    } else if (computedNdvi < 0.6) {
      deltaStd = 15;
    } else {
      deltaStd = -20; // healthy canopy reduces uncertainty
    }

    onUpdateZoneWithNdvi(selectedZone.id, computedNdvi, deltaStd);
    setAppliedNotification(true);
    setTimeout(() => setAppliedNotification(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Estimate average redness/greenness for NDVI
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let rSum = 0;
      let gSum = 0;
      for (let i = 0; i < imgData.data.length; i += 4) {
        rSum += imgData.data[i];
        gSum += imgData.data[i + 1];
      }
      const ratio = gSum / (rSum + gSum + 1);
      const estimatedNdvi = Number((0.2 + ratio * 0.65).toFixed(2));
      setComputedNdvi(estimatedNdvi);
      setStressSeverity(estimatedNdvi < 0.4 ? 'high' : estimatedNdvi < 0.6 ? 'moderate' : 'low');
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 lg:p-6 border border-white/10 space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
              <Camera className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              {t.droneVisionTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.droneVisionSubtitle}
          </p>
        </div>

        <div className="text-xs text-slate-400">
          Targeting: <strong className="text-cyan-300">{selectedZone.name}</strong>
        </div>
      </div>

      {/* Main Vision Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left 2 Cols: Multispectral Canvas Feed */}
        <div className="lg:col-span-2 relative bg-slate-950 rounded-xl overflow-hidden border border-white/10 shadow-inner">
          <canvas
            ref={canvasRef}
            width={480}
            height={220}
            className="w-full h-48 lg:h-56 object-cover block"
          />

          {/* HUD Overlay telemetry on camera feed */}
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 text-[10px] font-mono text-cyan-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SPECTRAL-BAND: NIR/RED (SENTINEL-2 / DRONE MESH)
          </div>

          <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded border border-white/10 text-xs font-mono flex items-center gap-2">
            <span className="text-slate-400">Canopy NDVI:</span>
            <strong className="text-cyan-300 font-bold text-sm">{computedNdvi.toFixed(2)}</strong>
          </div>
        </div>

        {/* Right Col: Controls, Presets & Bayesian Injection CTA */}
        <div className="flex flex-col justify-between space-y-4">
          
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Select Capture Feed or Upload Custom:
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedPreset('healthy')}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                  selectedPreset === 'healthy'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                Healthy
              </button>
              <button
                onClick={() => setSelectedPreset('moderate')}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                  selectedPreset === 'moderate'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                Moderate Deficit
              </button>
              <button
                onClick={() => setSelectedPreset('severe')}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                  selectedPreset === 'severe'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                Severe Stress
              </button>
            </div>

            {/* Custom Drone Image File Upload */}
            <label className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-dashed border-white/20 text-slate-300 text-xs cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload Drone Multispectral Image</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Action Button: Feed into Bayesian State */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <button
              onClick={handleApplyNdviToUncertainty}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>Inject NDVI Stress into Zone Uncertainty</span>
            </button>

            {appliedNotification && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium justify-center animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zone prior updated! AquaSense re-optimized.</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
