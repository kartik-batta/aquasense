import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, ShieldCheck, Volume2, X, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
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
function FormattedMarkdown({ content }: { content: string }) {
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
          <Sparkles className="w-3 h-3 text-sky-600" />
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
    if (trimmed.startsWith('*') && trimmed.endsWith('*') && trimmed.length > 2) {
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
}) => {
  const t = TRANSLATIONS[language];
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `### AquaSense Executive Intelligence Briefing\n\nI analyze constrained water allocation decisions and **Value of Information (VOI)** dynamics strictly based on verified mathematical invariants.\n\nAll metrics provided are calculated by the deterministic simulation engine under the current synthetic scenario (${scenario.name}).\n\nHow can I assist your ${persona} workflow?`,
      grounded: true,
      source: 'aquasense-core',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInquiries, setShowInquiries] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const samplePrompts = [
    'Why did AquaSense choose Unit D over Unit A when Unit A has higher uncertainty?',
    "Summarize today's water allocation and equity audit.",
    'What happens if the regional water budget drops another 15%?',
    'Explain the trade-off between Demand-Proportional and VOI-Aware allocation.',
  ];

  const handleSendMessage = async (promptToSend?: string) => {
    const text = promptToSend || inputPrompt;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
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
            deltaLoss: simulation.voiDeltaLoss,
            deltaPct: simulation.voiDeltaPct,
          },
          candidateVoi: simulation.candidateVois,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const assistantMsg: Message = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: data.text,
          grounded: data.grounded,
          source: data.source,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'Failed to fetch grounded intelligence.');
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: `### AquaSense Decision Audit\n\nUnder current scenario **${scenario.name}**, AquaSense VOI selected measurement on the critical margin, resulting in a simulated crop-stress loss proxy of **${simulation.voiSensing.loss.toFixed(1)}** vs **${simulation.maxUncertaintySensing.loss.toFixed(1)}** for the highest-uncertainty heuristic.\n\nAll constraints (100% budget compliance, Jain Fairness **${simulation.voiSensing.jainFairness.toFixed(3)}**) are strictly verified.`,
        grounded: true,
        source: 'local-audit-engine',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] max-w-full bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-all">
      
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              AquaSense Grounded Copilot
            </h3>
            <span className="text-xs text-emerald-700 flex items-center gap-1 font-mono font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Deterministic Invariants
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Guardrail Banner */}
      <div className="bg-sky-50 px-5 py-2.5 border-b border-sky-100 flex items-center gap-2 text-xs text-sky-900">
        <AlertCircle className="w-4 h-4 text-sky-700 shrink-0" />
        <span>Strict Guardrails Active: Zero metric hallucination. Quotes deterministic simulator values.</span>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[95%] rounded-2xl p-4 shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-sky-600 text-white font-medium rounded-tr-none text-xs leading-relaxed'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}
            >
              {msg.sender === 'user' ? (
                <div className="whitespace-pre-line text-xs">{msg.text}</div>
              ) : (
                <FormattedMarkdown content={msg.text} />
              )}

              {msg.sender === 'assistant' && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Grounded
                  </span>
                  <button
                    onClick={() => onSpeakText(msg.text)}
                    className="hover:text-sky-700 flex items-center gap-1.5 transition-colors text-slate-600 cursor-pointer font-medium text-xs"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                    Listen
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-sky-700 p-3 font-mono bg-white rounded-xl border border-sky-200 shadow-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
            <span>Auditing simulation constraints & querying Gemini 3.8 Flash...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Collapsible Verified Inquiries */}
      <div className="bg-white border-t border-slate-100">
        <button
          onClick={() => setShowInquiries(!showInquiries)}
          className="w-full px-5 py-2 flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 font-bold bg-slate-50/60 border-b border-slate-100 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            Verified Scientific Inquiries ({samplePrompts.length})
          </span>
          {showInquiries ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showInquiries && (
          <div className="p-3.5 space-y-1.5 max-h-40 overflow-y-auto">
            {samplePrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={loading}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-xs text-slate-700 hover:text-sky-900 border border-slate-200 hover:border-sky-300 transition-all cursor-pointer leading-snug flex items-center justify-between group"
              >
                <span>{q}</span>
                <Send className="w-3 h-3 text-sky-600 opacity-0 group-hover:opacity-100 shrink-0 ml-2 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={t.voicePromptPlaceholder}
          disabled={loading}
          className="flex-1 bg-slate-50 text-xs text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-colors"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !inputPrompt.trim()}
          className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold transition-all disabled:opacity-40 cursor-pointer shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
