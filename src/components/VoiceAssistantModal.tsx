import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { Language, Persona, Scenario, SimulationOutput } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: Scenario;
  simulation: SimulationOutput;
  persona: Persona;
  language: Language;
  onExecutePrompt: (promptText: string) => void;
  onSpeakText: (text: string) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  scenario,
  simulation,
  persona,
  language,
  onExecutePrompt,
  onSpeakText,
}) => {
  const t = TRANSLATIONS[language];
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setRecognitionSupported(true);
    }
  }, []);

  const handleStartListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscript("Speech recognition is not supported in this browser. Please click a suggested voice query below.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'es' ? 'es-ES' : language === 'sw' ? 'sw-KE' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsRecording(true);
      setTranscript(t.voiceListening);

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript;
        setTranscript(spokenText);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        setTranscript("Could not capture audio clearly. Please try clicking one of the sample questions.");
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  const handleRunQuery = (textToRun: string) => {
    onExecutePrompt(textToRun);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-[#0B0F17] border border-cyan-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Mic className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                AquaSense Voice Assistant & Audio Briefing
              </h3>
              <span className="text-xs text-slate-400">Speech-to-Text & Grounded Audio Synthesis</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mic Activation Area */}
        <div className="my-6 flex flex-col items-center justify-center text-center">
          <button
            onClick={handleStartListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40 ring-4 ring-rose-500/30'
                : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 hover:scale-105 shadow-lg shadow-cyan-500/30'
            }`}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8 font-bold" />}
          </button>

          <span className="text-xs font-semibold text-white mt-3">
            {isRecording ? t.voiceListening : 'Click to Speak a Question'}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
            Ask verbally: "Why was Unit D chosen over Unit A?" or "Summarize today's allocation."
          </p>
        </div>

        {/* Live Transcript Box */}
        {transcript && (
          <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 text-xs text-slate-200 mb-4 flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] text-cyan-400 font-mono block mb-0.5">Transcript:</span>
              <p className="font-medium">"{transcript}"</p>
            </div>
            <button
              onClick={() => handleRunQuery(transcript)}
              className="px-2.5 py-1 rounded bg-cyan-500 text-slate-950 font-bold text-xs shrink-0 self-center"
            >
              Ask Copilot
            </button>
          </div>
        )}

        {/* Ready Voice Query Samples */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <span className="text-xs font-semibold text-slate-300 block">Or select a one-tap voice query:</span>
          
          <div className="space-y-1.5">
            <button
              onClick={() => handleRunQuery("Why did AquaSense choose Unit D over Unit A?")}
              className="w-full text-left p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-xs text-slate-300 hover:text-white border border-white/5 flex items-center justify-between group transition-colors"
            >
              <span>"Why did AquaSense choose Unit D over Unit A?"</span>
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100" />
            </button>

            <button
              onClick={() => handleRunQuery("Summarize today's water allocation and regional fairness.")}
              className="w-full text-left p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-xs text-slate-300 hover:text-white border border-white/5 flex items-center justify-between group transition-colors"
            >
              <span>"Summarize today's water allocation and regional fairness."</span>
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100" />
            </button>

            <button
              onClick={() => handleRunQuery("Explain why high uncertainty does not mean high value of information.")}
              className="w-full text-left p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-xs text-slate-300 hover:text-white border border-white/5 flex items-center justify-between group transition-colors"
            >
              <span>"Explain why high uncertainty does not mean high value of information."</span>
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
