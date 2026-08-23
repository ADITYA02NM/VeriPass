import React, { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { ScreenType } from '../types';
import { TopAppBar } from '../components/TopAppBar';
import { aiChat, getUsage, ApiError, AiChatMessage, UserInfo, UsageInfo } from '../lib/api';
import { autoX402Pay } from '../lib/x402pay';

interface AIChatScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
  user: UserInfo | null;
}

const SUGGESTIONS = [
  'Inventory Agent — How many products are in my inventory?',
  'Search Agent — Find products matching tea',
  'Compare Agent — Compare MED-2026-004 and FAKE-WATCH-7',
  'Market Agent — What is the market price of DJ-TEA-2023-8991?',
];

/** Markdown components styled to match the VeriPass pixel theme. */
const markdownComponents = {
  p: (props: any) => <p className="text-[14px] leading-relaxed my-1.5 first:mt-0 last:mb-0" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-5 my-1.5 space-y-1 text-[14px]" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-5 my-1.5 space-y-1 text-[14px]" {...props} />,
  li: (props: any) => <li className="leading-relaxed" {...props} />,
  strong: (props: any) => <strong className="font-bold text-[var(--vp-saffron-text)]" {...props} />,
  em: (props: any) => <em className="italic" {...props} />,
  code: ({ inline, className, children, ...props }: any) =>
    inline ? (
      <code className="bg-[var(--vp-container-low)] border border-[var(--vp-ink)]/30 px-1.5 py-0.5 rounded font-mono text-[13px] text-[var(--vp-cyan-text)]" {...props}>
        {children}
      </code>
    ) : (
      <pre className="bg-[var(--vp-ink)] text-[var(--vp-cream-text)] border-2 border-[var(--vp-ink)] p-3 my-2 overflow-x-auto font-mono text-[13px]" {...props}>
        <code>{children}</code>
      </pre>
    ),
  pre: (props: any) => <div {...props} />,
  h1: (props: any) => <h1 className="font-pixel text-[17px] uppercase tracking-wider mt-2 mb-1" {...props} />,
  h2: (props: any) => <h2 className="font-pixel text-[16px] uppercase tracking-wider mt-2 mb-1" {...props} />,
  h3: (props: any) => <h3 className="font-pixel text-[15px] uppercase tracking-wider mt-2 mb-1" {...props} />,
  blockquote: (props: any) => <blockquote className="border-l-4 border-[var(--vp-saffron)] pl-3 my-2 italic text-[var(--vp-muted)]" {...props} />,
  a: (props: any) => <a className="text-[var(--vp-cyan-text)] underline break-all" target="_blank" rel="noreferrer" {...props} />,
  hr: () => <hr className="border-[var(--vp-outline)] my-2" />,
  table: (props: any) => (
    <div className="overflow-x-auto my-2">
      <table className="border-collapse border-2 border-[var(--vp-ink)] text-[13px]" {...props} />
    </div>
  ),
  th: (props: any) => <th className="border border-[var(--vp-ink)] bg-[var(--vp-container-low)] px-2 py-1 font-pixel text-[12px] uppercase" {...props} />,
  td: (props: any) => <td className="border border-[var(--vp-ink)] px-2 py-1" {...props} />,
};

/**
 * VeriPass AI — agentic orchestrator managing 7 specialist agents.
 * COST: 0.003–0.005 ALGO per question via x402 — paid AUTOMATICALLY.
 */
export const AIChatScreen: React.FC<AIChatScreenProps> = ({ onNavigate, user }) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  useEffect(() => {
    getUsage()
      .then((u: UsageInfo) => setUsage(u))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking, paying]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking || paying) return;
    const history = messages.slice(-8);
    setMessages((m) => [...m, { role: 'user', content: trimmed }]);
    setInput('');
    setThinking(true);
    setError(null);
    try {
      let res;
      let paidAmt: string | null = null;
      try {
        res = await aiChat(trimmed, history);
      } catch (e) {
        // ---- AUTO-PAY: 402 → pay silently (no user tap) → retry once ----
        if (e instanceof ApiError && e.status === 402) {
          setPaying(true);
          try {
            const payRes = await autoX402Pay(user?.walletAddress, '0.005');
            paidAmt = payRes.amount;
            res = await aiChat(trimmed, history);
          } finally {
            setPaying(false);
          }
        } else {
          throw e;
        }
      }
      // Amount used is shown at the end of the answer
      const footer = paidAmt
        ? `\n\n---\n⚡ **PAID ${paidAmt} ALGO** VIA X402 · AUTOMATIC`
        : '';
      setMessages((m) => [...m, { role: 'assistant', content: res.reply + footer }]);
    } catch (e: any) {
      console.error('[ai-chat]', e);
      if (e?.message?.includes('connected') || e?.message?.includes('declined')) {
        setError('PAYMENT CANCELLED IN WALLET — approve the Pera prompt to use AI');
      } else {
        setError(e instanceof ApiError ? e.message : 'AI SERVICE ERROR — TRY AGAIN');
      }
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="bg-[var(--vp-cream)] min-h-screen flex flex-col pt-16 pb-24">
      <TopAppBar
        currentScreen="ai-chat"
        onNavigate={onNavigate}
        onBack={() => onNavigate('scan', 'push_back')}
        showBack
        title="AI ASSISTANT"
      />
      <main className="w-full max-w-2xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-4 flex-1">
        {/* ============ Balance strip ============ */}
        <section className="voxel-border bg-[var(--vp-ink)] text-[var(--vp-cream-text)] px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--vp-cyan)]">auto_awesome</span>
            <span className="font-pixel text-[14px] uppercase tracking-wider">
              {user ? user.identifier : 'guest'} · x402 AUTO-PAY · ≤0.005 ALGO/QUESTION
            </span>
          </div>
        </section>

        {/* ============ Mini usage bar ============ */}
        {usage && (
          <section className="voxel-border bg-[var(--vp-white)] px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[var(--vp-ink-text)]">api</span>
              <span className="font-pixel text-[12px] uppercase tracking-wider text-[var(--vp-ink-text)]">
                {Math.max(0, (usage?.freeLimit ?? 3) - (usage?.used ?? 0)) > 0
                  ? `${Math.max(0, (usage?.freeLimit ?? 3) - (usage?.used ?? 0))} FREE SCANS LEFT`
                  : 'ALGO PAY-PER-USE · x402'}
              </span>
            </div>
            <div className="h-2 w-24 bg-[var(--vp-container-low)] border border-[var(--vp-ink)]/30">
              <div
                className="h-full bg-[var(--vp-green)]"
                style={{ width: `${Math.min(100, ((usage?.used ?? 0) / (usage?.freeLimit ?? 3)) * 100)}%` }}
              />
            </div>
            <span className="font-pixel text-[12px] uppercase tracking-wider text-[var(--vp-saffron-text)]">
              x402
            </span>
          </section>
        )}

        {/* ============ Chat area ============ */}
        <section className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[55vh] pr-1">
          {messages.length === 0 && !thinking && !paying && (
            <div className="flex flex-col gap-3">
              <div className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-4 voxel-shadow">
                <p className="font-pixel text-[16px] text-[var(--vp-ink-text)] uppercase tracking-wider">
                  Ask me anything about your supply chain
                </p>
                <p className="text-[14px] text-[var(--vp-muted)] mt-1">
                  I manage 7 specialist agents (Inventory, Passport, Market, Usage, Proof,
                  Search, Compare). Payments happen automatically via x402 — no prompts,
                  just answers. Max 0.005 ALGO per question.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="font-pixel text-[12px] uppercase tracking-wider border-2 border-[var(--vp-ink)] bg-[var(--vp-cream)] px-3 py-2 voxel-shadow-sm hover:bg-[var(--vp-container-high)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer text-[var(--vp-ink-text)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] px-4 py-3 border-2 border-[var(--vp-ink)] ${
                m.role === 'user'
                  ? 'self-end bg-[var(--vp-ink)] text-[var(--vp-cream-text)] voxel-shadow'
                  : 'self-start bg-[var(--vp-white)] text-[var(--vp-ink-text)] voxel-shadow'
              }`}
            >
              {m.role === 'assistant' ? (
                <Markdown components={markdownComponents}>{m.content}</Markdown>
              ) : (
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          ))}

          {thinking && !paying && (
            <div className="self-start bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] px-4 py-3 voxel-shadow">
              <p className="font-pixel text-[13px] text-[var(--vp-ink-text)] uppercase tracking-widest animate-pulse">
                VeriPass AI is thinking…
              </p>
            </div>
          )}
          {paying && (
            <div className="self-start bg-[var(--vp-success-container)] border-2 border-[var(--vp-green)] px-4 py-3 voxel-shadow">
              <p className="font-pixel text-[13px] text-[var(--vp-green-text)] uppercase tracking-widest animate-pulse flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                Auto-paying agents via x402… no action needed
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </section>

        {error && (
          <div className="flex flex-col gap-2">
            <p className="font-pixel text-[13px] text-[var(--vp-magenta-text)] uppercase tracking-wider">{error}</p>
          </div>
        )}

        {/* ============ Input ============ */}
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Ask about inventory, status, pricing, guides…"
            className="flex-1 border-2 border-[var(--vp-ink)] bg-[var(--vp-white)] px-4 py-3 text-[15px] text-[var(--vp-ink-text)] placeholder-[var(--vp-outline)] focus:outline-none focus:bg-[var(--vp-surface)]"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={thinking || paying || !input.trim()}
            className="font-pixel text-[14px] uppercase tracking-wider bg-[var(--vp-ink)] text-[var(--vp-cream-text)] border-2 border-[var(--vp-ink)] px-4 py-3 voxel-shadow-sm hover:bg-[var(--vp-saffron)] hover:text-[var(--vp-black-text)] disabled:opacity-40 transition-all cursor-pointer"
          >
            {thinking || paying ? '…' : 'Send'}
          </button>
        </div>
      </main>
    </div>
  );
};
