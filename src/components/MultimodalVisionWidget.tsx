import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Sparkles, CheckCircle2 } from 'lucide-react';
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
  const [appliedNotification, setAppliedNotification] = useState(false);

  // Render synthetic multispectral canopy imagery onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    let primaryHue = 120; // green
    let saturation = 70;
    let lightness = 38;
    let baseNdvi = 0.74;

    if (selectedPreset === 'moderate') {
      primaryHue = 65; // yellow-green
      baseNdvi = 0.51;
    } else if (selectedPreset === 'severe') {
      primaryHue = 28; // amber-brown drought
      baseNdvi = 0.32;
    }

    setComputedNdvi(baseNdvi);

    // Generate procedural crop rows & false-color multispectral bands
    for (let x = 0; x < width; x += 12) {
      for (let y = 0; y < height; y += 12) {
        const noise = (Math.sin(x * 0.05) + Math.cos(y * 0.05) + Math.random() * 0.6) * 15;
        const currentHue = Math.max(10, Math.min(140, primaryHue + noise));
        ctx.fillStyle = `hsl(${currentHue}, ${saturation}%, ${lightness}%)`;
        ctx.fillRect(x, y, 10, 10);
      }
    }

    // Multispectral HUD grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
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

    // Reticle
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 22, 0, Math.PI * 2);
    ctx.stroke();

  }, [selectedPreset]);

  const handleApplyNdviToUncertainty = () => {
    let deltaStd = 0;
    if (computedNdvi < 0.4) {
      deltaStd = 45;
    } else if (computedNdvi < 0.6) {
      deltaStd = 15;
    } else {
      deltaStd = -20;
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
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="material-card p-6 border border-slate-200 bg-white space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-100 text-sky-800">
              <Camera className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {t.droneVisionTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            {t.droneVisionSubtitle}
          </p>
        </div>

        <div className="text-xs text-slate-600">
          Targeting: <strong className="text-sky-800 font-bold">{selectedZone.name}</strong>
        </div>
      </div>

      {/* Main Vision Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left 2 Cols: Multispectral Canvas Feed */}
        <div className="lg:col-span-2 relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-300 shadow-inner">
          <canvas
            ref={canvasRef}
            width={480}
            height={220}
            className="w-full h-48 lg:h-56 object-cover block"
          />

          {/* HUD Overlay telemetry on camera feed */}
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[11px] font-mono text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SPECTRAL-BAND: NIR/RED (SENTINEL-2 / DRONE MESH)
          </div>

          <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-mono flex items-center gap-2">
            <span className="text-slate-300">Canopy NDVI:</span>
            <strong className="text-sky-300 font-extrabold text-sm">{computedNdvi.toFixed(2)}</strong>
          </div>
        </div>

        {/* Right Col: Controls, Presets & Bayesian Injection CTA */}
        <div className="flex flex-col justify-between space-y-4">
          
          <div>
            <span className="text-xs font-bold text-slate-800 block mb-2">
              Select Capture Feed or Upload Custom:
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedPreset('healthy')}
                className={`px-2 py-1.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                  selectedPreset === 'healthy'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Healthy
              </button>
              <button
                onClick={() => setSelectedPreset('moderate')}
                className={`px-2 py-1.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                  selectedPreset === 'moderate'
                    ? 'bg-amber-50 text-amber-800 border-amber-400 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Moderate
              </button>
              <button
                onClick={() => setSelectedPreset('severe')}
                className={`px-2 py-1.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                  selectedPreset === 'severe'
                    ? 'bg-rose-50 text-rose-800 border-rose-400 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Severe Stress
              </button>
            </div>

            {/* Custom Drone Image File Upload */}
            <label className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 text-slate-700 text-xs font-medium cursor-pointer transition-colors shadow-xs">
              <Upload className="w-3.5 h-3.5 text-sky-600" />
              <span>Upload Drone Multispectral Image</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Action Button: Feed into Bayesian State */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleApplyNdviToUncertainty}
              className="w-full py-2.5 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Inject NDVI Stress into Zone Uncertainty</span>
            </button>

            {appliedNotification && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold justify-center animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zone prior updated! AquaSense re-optimized.</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
