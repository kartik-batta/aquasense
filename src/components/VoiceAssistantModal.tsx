import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-xl relative text-left">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-100 text-sky-800">
              <Mic className="w-5 h-5 text-sky-600" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                AquaSense Voice Assistant & Audio Briefing
              </h3>
              <span className="text-xs text-slate-500">Speech-to-Text & Grounded Audio Synthesis</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mic Activation Area */}
        <div className="my-6 flex flex-col items-center justify-center text-center">
          <button
            onClick={handleStartListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                : 'bg-sky-600 text-white hover:bg-sky-700 hover:scale-105 active:scale-95'
            }`}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>

          <span className="text-sm font-bold text-slate-900 mt-3">
            {isRecording ? t.voiceListening : 'Click to Speak a Question'}
          </span>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Ask verbally: "Why was Unit D chosen over Unit A?" or "Summarize today's allocation."
          </p>
        </div>

        {/* Live Transcript Box */}
        {transcript && (
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-800 mb-4 flex items-start justify-between gap-2 shadow-xs">
            <div>
              <span className="text-[11px] text-sky-700 font-bold block mb-0.5">Transcript:</span>
              <p className="font-medium">"{transcript}"</p>
            </div>
            <button
              onClick={() => handleRunQuery(transcript)}
              className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shrink-0 self-center cursor-pointer shadow-xs"
            >
              Ask Copilot
            </button>
          </div>
        )}

        {/* Ready Voice Query Samples */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-800 block">Or select a one-tap voice query:</span>
          
          <div className="space-y-1.5">
            <button
              onClick={() => handleRunQuery("Why did AquaSense choose Unit D over Unit A?")}
              className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 hover:text-slate-900 border border-slate-200 flex items-center justify-between group transition-colors cursor-pointer shadow-xs"
            >
              <span>"Why did AquaSense choose Unit D over Unit A?"</span>
              <Volume2 className="w-4 h-4 text-sky-600" />
            </button>

            <button
              onClick={() => handleRunQuery("Summarize today's water allocation and regional fairness.")}
              className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 hover:text-slate-900 border border-slate-200 flex items-center justify-between group transition-colors cursor-pointer shadow-xs"
            >
              <span>"Summarize today's water allocation and regional fairness."</span>
              <Volume2 className="w-4 h-4 text-sky-600" />
            </button>

            <button
              onClick={() => handleRunQuery("Explain why high uncertainty does not mean high value of information.")}
              className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 hover:text-slate-900 border border-slate-200 flex items-center justify-between group transition-colors cursor-pointer shadow-xs"
            >
              <span>"Explain why high uncertainty does not mean high value of information."</span>
              <Volume2 className="w-4 h-4 text-sky-600" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
