import React, { useState, useId, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import { Language, Scenario, SimulationOutput } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { speechLocale } from '../utils/speech';
import { Dialog } from './Dialog';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: Scenario;
  simulation: SimulationOutput;
  language: Language;
  onExecutePrompt: (promptText: string) => void;
}

/** Minimal typing for the (still prefixed in some browsers) Web Speech recognition API. */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  scenario,
  simulation,
  language,
  onExecutePrompt,
}) => {
  const t = TRANSLATIONS[language];
  const titleId = useId();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Stop listening if the dialog closes mid-recording.
  useEffect(() => {
    if (!isOpen) {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      setIsRecording(false);
    }
  }, [isOpen]);

  const zoneName = (id: string) => scenario.zones.find((z) => z.id === id)?.name ?? id;
  const voiZoneName = zoneName(simulation.selectedVoiZoneId);
  const maxVarZoneName = zoneName(simulation.selectedMaxVarZoneId);

  const sampleQueries = [
    simulation.selectedVoiZoneId === simulation.selectedMaxVarZoneId
      ? `Why did both strategies choose ${voiZoneName}?`
      : `Why did AquaSense choose ${voiZoneName} over ${maxVarZoneName}?`,
    "Summarize today's water allocation and regional fairness.",
    'Explain why high uncertainty does not mean high value of information.',
  ];

  const handleStartListening = () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setStatusMessage('Speech recognition is not supported in this browser. Please choose a suggested question below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLocale(language);
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        setTranscript(event.results[0][0].transcript);
        setStatusMessage('');
      };
      recognition.onerror = () => {
        setStatusMessage('Could not capture audio clearly. Please try again or choose a suggested question.');
      };
      recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      setIsRecording(true);
      setStatusMessage(t.voiceListening);
      recognition.start();
    } catch {
      setIsRecording(false);
      setStatusMessage('Microphone is unavailable. Please choose a suggested question below.');
    }
  };

  const handleRunQuery = (textToRun: string) => {
    onExecutePrompt(textToRun);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-xl relative text-left"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-sky-100 text-sky-800">
            <Mic className="w-5 h-5 text-sky-600" aria-hidden="true" />
          </span>
          <div>
            <h2 id={titleId} className="text-base font-bold text-slate-900 tracking-tight">
              AquaSense Voice Assistant & Audio Briefing
            </h2>
            <span className="text-xs text-slate-600">Speech-to-Text & Grounded Audio Synthesis</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close voice assistant"
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Mic Activation Area */}
      <div className="my-6 flex flex-col items-center justify-center text-center">
        <button
          type="button"
          onClick={handleStartListening}
          disabled={isRecording}
          aria-label={isRecording ? 'Listening' : 'Start voice input'}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
            isRecording
              ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
              : 'bg-sky-700 text-white hover:bg-sky-800 hover:scale-105 active:scale-95'
          }`}
        >
          {isRecording ? <MicOff className="w-8 h-8" aria-hidden="true" /> : <Mic className="w-8 h-8" aria-hidden="true" />}
        </button>

        <span className="text-sm font-bold text-slate-900 mt-3">
          {isRecording ? t.voiceListening : 'Click to Speak a Question'}
        </span>
        <p className="text-xs text-slate-600 mt-1 max-w-xs">
          Ask verbally: "{sampleQueries[0]}" or "Summarize today's allocation."
        </p>
        <p role="status" aria-live="polite" className="text-xs text-slate-700 mt-2 min-h-4">
          {statusMessage}
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
            type="button"
            onClick={() => handleRunQuery(transcript)}
            className="px-3 py-1 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs shrink-0 self-center cursor-pointer shadow-xs"
          >
            Ask Copilot
          </button>
        </div>
      )}

      {/* Ready Voice Query Samples */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <span className="text-xs font-bold text-slate-800 block">Or select a one-tap voice query:</span>

        <div className="space-y-1.5">
          {sampleQueries.map((query) => (
            <button
              type="button"
              key={query}
              onClick={() => handleRunQuery(query)}
              className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 hover:text-slate-900 border border-slate-200 flex items-center justify-between group transition-colors cursor-pointer shadow-xs"
            >
              <span>"{query}"</span>
              <Volume2 className="w-4 h-4 text-sky-600" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  );
};
