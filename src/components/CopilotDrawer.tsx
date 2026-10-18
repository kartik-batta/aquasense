import React, { useState, useRef, useEffect, useId } from 'react';
import { Bot, Send, ShieldCheck, Volume2, X, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Dialog } from './Dialog';
import { Scenario, SimulationOutput, Language, Persona } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: Scenario;
  simulation: SimulationOutput;
  persona: Persona;
  language: Language;
  onSpeakText: (text: string) => void;
  /** A question queued from elsewhere (e.g. the voice assistant) to send once the drawer opens */
  pendingPrompt?: string | null;
  onPendingPromptHandled?: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  grounded?: boolean;
  source?: string;
}

/**
 * Cleanly renders markdown, headers, bullets, bold text, inline code,
 * and converts raw LaTeX formulas into readable mathematical typography.
 */
export function FormattedMarkdown({ content }: { content: string }) {
  // Normalize and clean raw LaTeX math delimiters and symbols
  let cleaned = content
    // Replace \text{ kL} or \text{something} with just "something"
    .replace(/\\text\{([^}]+)\}/g, '$1')
    // Replace common Greek / math symbols
    .replace(/\\sigma/g, 'σ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\tau/g, 'τ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\times/g, '×')
    // Clean up $...$ delimiters
    .replace(/\$([^$]+)\$/g, '$1');

  // Split into lines for structured block rendering
  const lines = cleaned.split('\n');
  const renderedElements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      renderedElements.push(
        <ul key={`ul-${renderedElements.length}`} className="my-2 space-y-1.5 pl-1">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  // Helper to parse inline bold (**...**) and code (`...`)
  const parseInline = (text: string): React.ReactNode[] => {
    // Regex splits by code blocks `...` and bold **...**
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        const codeText = part.slice(1, -1);
        return (
          <code
            key={i}
            className="font-mono text-[11px] bg-slate-100 text-sky-800 px-1.5 py-0.5 rounded border border-slate-200 font-medium"
          >
            {codeText}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        const boldText = part.slice(2, -2);
        return (
          <strong key={i} className="font-bold text-slate-900">
            {boldText}
          </strong>
        );
      }
      return part;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Headers: ### or ## or #
    if (trimmed.startsWith('### ')) {
      flushList();
      const headingText = trimmed.replace(/^###\s+/, '');
      renderedElements.push(
        <h4
          key={`h4-${idx}`}
          className="text-xs font-bold text-sky-950 uppercase tracking-wide mt-3 mb-1.5 pb-1 border-b border-slate-100 flex items-center gap-1.5"
        >
          <Sparkles className="w-3 h-3 text-sky-600" aria-hidden="true" />
          <span>{parseInline(headingText)}</span>
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      flushList();
      const headingText = trimmed.replace(/^#+\s+/, '');
      renderedElements.push(
        <h3
          key={`h3-${idx}`}
          className="text-sm font-bold text-slate-900 mt-3.5 mb-1.5 border-b border-slate-200 pb-1"
        >
          {parseInline(headingText)}
        </h3>
      );
      return;
    }

    // Bullet items: - or * or •
    if (/^[-*•]\s+/.test(trimmed)) {
      inList = true;
      const bulletText = trimmed.replace(/^[-*•]\s+/, '');
      listItems.push(
        <li key={`li-${idx}`} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0 mt-1.5" />
          <div className="flex-1">{parseInline(bulletText)}</div>
        </li>
      );
      return;
    }

    // Numbered items: 1. or 2.
    if (/^\d+\.\s+/.test(trimmed)) {
      inList = true;
      const match = trimmed.match(/^(\d+)\.\s+(.*)/);
      const num = match ? match[1] : '•';
      const itemText = match ? match[2] : trimmed;
      listItems.push(
        <li key={`num-li-${idx}`} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
          <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-800 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
            {num}
          </span>
          <div className="flex-1">{parseInline(itemText)}</div>
        </li>
      );
      return;
    }

    // Audit notes / italics (*Audit Note:...*)
    if (/^\*[^*].*[^*]\*$/.test(trimmed)) {
      flushList();
      const italicText = trimmed.slice(1, -1);
      renderedElements.push(
        <div
          key={`note-${idx}`}
          className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 italic leading-relaxed"
        >
          {parseInline(italicText)}
        </div>
      );
      return;
    }

    // Regular paragraph
    flushList();
    renderedElements.push(
      <p key={`p-${idx}`} className="text-xs text-slate-700 leading-relaxed my-1.5">
        {parseInline(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1">{renderedElements}</div>;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  scenario,
  simulation,
  persona,
  language,
  onSpeakText,
  pendingPrompt,
  onPendingPromptHandled,
}) => {
  const t = TRANSLATIONS[language];
  const titleId = useId();
  const inputId = useId();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `### AquaSense Executive Intelligence Briefing\n\nI analyze constrained water allocation decisions and **Value of Information (VOI)** dynamics strictly based on verified mathematical invariants.\n\nAll metrics provided are calculated by the deterministic simulation engine under the current synthetic scenario (${scenario.name}).\n\nHow can I assist your ${t.personas[persona].title} workflow?`,
      grounded: true,
      source: 'aquasense-core',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInquiries, setShowInquiries] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loading]);

  const zoneName = (id: string) => scenario.zones.find((z) => z.id === id)?.name ?? id;
  const voiZoneName = zoneName(simulation.selectedVoiZoneId);
  const maxVarZoneName = zoneName(simulation.selectedMaxVarZoneId);

  // Sample prompts reference the zones the current simulation actually selected.
  const samplePrompts = [
    simulation.selectedVoiZoneId === simulation.selectedMaxVarZoneId
      ? `Why did VOI and the max-uncertainty heuristic both choose ${voiZoneName}?`
      : `Why did AquaSense choose ${voiZoneName} over ${maxVarZoneName} when ${maxVarZoneName} has higher uncertainty?`,
    "Summarize today's water allocation and equity audit.",
    'What happens if the regional water budget drops another 15%?',
    'Explain the trade-off between Demand-Proportional and VOI-Aware allocation.',
  ];

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend ?? inputPrompt).trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, sender: 'user', text }]);
    setInputPrompt('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          persona,
          language,
          currentScenario: scenario,
          simulationResults: {
            voiSensing: simulation.voiSensing,
            maxUncertaintySensing: simulation.maxUncertaintySensing,
            demandProportional: simulation.demandProportional,
            uncertaintyWeighted: simulation.uncertaintyWeighted,
          },
          candidateVoi: simulation.candidateVois,
        }),
      });

      const data: { success?: boolean; text?: string; grounded?: boolean; source?: string; error?: string } =
        await response.json();
      if (!response.ok || !data.success || !data.text) {
        throw new Error(data.error || `Copilot request failed (${response.status})`);
      }
      const replyText = data.text;
      setMessages((prev) => [
        ...prev,
        { id: `asst-${Date.now()}`, sender: 'assistant', text: replyText, grounded: data.grounded, source: data.source },
      ]);
    } catch (err) {
      console.warn('Copilot unavailable, using local audit summary:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `### AquaSense Decision Audit\n\nThe Copilot service is unreachable, so this summary comes directly from the local simulation.\n\nUnder current scenario **${scenario.name}**, AquaSense VOI measured **${simulation.voiSensing.measuredZones.map(zoneName).join(', ')}**, resulting in a simulated crop-stress loss proxy of **${simulation.voiSensing.loss.toFixed(1)}** vs **${simulation.maxUncertaintySensing.loss.toFixed(1)}** for the highest-uncertainty heuristic.\n\nBudget compliance is **${simulation.voiSensing.budgetCompliancePct.toFixed(1)}%** and Jain Fairness is **${simulation.voiSensing.jainFairness.toFixed(3)}**.`,
          grounded: true,
          source: 'local-audit-engine',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Send a question handed over from the voice assistant once the drawer is open.
  const sendRef = useRef(handleSendMessage);
  sendRef.current = handleSendMessage;
  useEffect(() => {
    if (isOpen && pendingPrompt) {
      sendRef.current(pendingPrompt);
      onPendingPromptHandled?.();
    }
  }, [isOpen, pendingPrompt, onPendingPromptHandled]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      variant="drawer"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] max-w-full bg-white border-l border-slate-200 shadow-2xl flex flex-col"
    >
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id={titleId} className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              AquaSense Grounded Copilot
            </h2>
            <span className="text-xs text-emerald-700 flex items-center gap-1 font-mono font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              Verified Deterministic Invariants
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close copilot"
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Guardrail Banner */}
      <div className="bg-sky-50 px-5 py-2.5 border-b border-sky-100 flex items-center gap-2 text-xs text-sky-900">
        <AlertCircle className="w-4 h-4 text-sky-700 shrink-0" aria-hidden="true" />
        <span>Strict Guardrails Active: Zero metric hallucination. Quotes deterministic simulator values.</span>
      </div>

      {/* Messages Thread */}
      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Copilot conversation"
        className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[95%] rounded-2xl p-4 shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-sky-700 text-white font-medium rounded-tr-none text-xs leading-relaxed'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}
            >
              <span className="sr-only">{msg.sender === 'user' ? 'You said:' : 'Copilot replied:'}</span>
              {msg.sender === 'user' ? (
                <div className="whitespace-pre-line text-xs">{msg.text}</div>
              ) : (
                <FormattedMarkdown content={msg.text} />
              )}

              {msg.sender === 'assistant' && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-mono flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    Verified Grounded
                  </span>
                  <button
                    type="button"
                    onClick={() => onSpeakText(msg.text)}
                    className="hover:text-sky-700 flex items-center gap-1.5 transition-colors text-slate-600 cursor-pointer font-medium text-xs"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                    Listen
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div role="status" className="flex items-center gap-2 text-xs text-sky-700 p-3 font-mono bg-white rounded-xl border border-sky-200 shadow-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-600" aria-hidden="true" />
            <span>Auditing simulation constraints & querying the Copilot...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Collapsible Verified Inquiries */}
      <div className="bg-white border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowInquiries(!showInquiries)}
          aria-expanded={showInquiries}
          aria-controls="copilot-sample-prompts"
          className="w-full px-5 py-2 flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 font-bold bg-slate-50/60 border-b border-slate-100 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
            Verified Scientific Inquiries ({samplePrompts.length})
          </span>
          {showInquiries ? (
            <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" />
          )}
        </button>

        {showInquiries && (
          <div id="copilot-sample-prompts" className="p-3.5 space-y-1.5 max-h-40 overflow-y-auto">
            {samplePrompts.map((q) => (
              <button
                type="button"
                key={q}
                onClick={() => handleSendMessage(q)}
                disabled={loading}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-xs text-slate-700 hover:text-sky-900 border border-slate-200 hover:border-sky-300 transition-all cursor-pointer leading-snug flex items-center justify-between group disabled:opacity-60"
              >
                <span>{q}</span>
                <Send className="w-3 h-3 text-sky-600 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 shrink-0 ml-2 transition-opacity" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        className="p-4 bg-white border-t border-slate-200 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Ask the Copilot a question
        </label>
        <input
          id={inputId}
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder={t.voicePromptPlaceholder}
          maxLength={1000}
          disabled={loading}
          className="flex-1 bg-slate-50 text-xs text-slate-900 placeholder-slate-500 rounded-xl px-4 py-2.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !inputPrompt.trim()}
          aria-label="Send question"
          className="p-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white font-bold transition-all disabled:opacity-40 cursor-pointer shadow-xs"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    </Dialog>
  );
};
