import React, { useEffect, useRef, useState } from 'react';
import { ScreenType } from '../types';
import { TopAppBar } from '../components/TopAppBar';
import { aiChat, getUsage, ApiError, AiChatMessage, UserInfo, UsageInfo } from '../lib/api';

interface AIChatScreenProps {
  onNavigate: (screen: ScreenType, transition?: 'push' | 'push_back' | 'none') => void;
  user: UserInfo | null;
}

const SUGGESTIONS = [
  'Inventory Agent (0.001) — How many products are in my inventory?',
  'Search Agent (0.005) — Find products matching tea',
  'Compare Agent (0.005) — Compare MED-2026-004 and FAKE-WATCH-7',
  'Market Agent (0.002) — What is the market price of DJ-TEA-2023-8991?',
];

/**
 * VeriPass AI — agentic orchestrator managing 8 specialist agents.
 * COST: 1–5 credits per question (0.001–0.005 ALGO via x402) depending on the
 * agent used. Credits are consumed first; when they run out the server answers
 * 402 with an x402 challenge until a valid X-Pay-Signature is presented.
 */
export const AIChatScreen: React.FC<AIChatScreenProps> = ({ onNavigate, user }) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [credits, setCredits] = useState(0);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  useEffect(() => {
    getUsage()
      .then((u: UsageInfo) => {
        setUsage(u);
        setCredits(u?.credits ?? 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    const history = messages.slice(-8);
    setMessages((m) => [...m, { role: 'user', content: trimmed }]);
    setInput('');
    setThinking(true);
    setError(null);
    try {
      const res = await aiChat(trimmed, history);
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
      // refresh usage after successful call
      getUsage().then((u: UsageInfo) => { setUsage(u); setCredits(u?.credits ?? 0); }).catch(() => {});
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setError('NOT ENOUGH CREDITS — BUY A PLAN TO CONTINUE USING AI');
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
              {user ? user.identifier : 'guest'} · {credits} CREDITS · 1–5 / QUESTION
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
                  ? `${Math.max(0, (usage?.freeLimit ?? 3) - (usage?.used ?? 0))} FREE LEFT`
                  : `0 FREE · ${usage?.credits ?? 0} CREDITS REMAIN`}
              </span>
            </div>
            <div className="h-2 w-24 bg-[var(--vp-container-low)] border border-[var(--vp-ink)]/30">
              <div
                className="h-full bg-[var(--vp-green)]"
                style={{ width: `${Math.min(100, ((usage?.used ?? 0) / (usage?.freeLimit ?? 3)) * 100)}%` }}
              />
            </div>
            <span className="font-pixel text-[12px] uppercase tracking-wider text-[var(--vp-saffron-text)]">
              {usage?.credits ?? 0} CREDITS
            </span>
          </section>
        )}

        {/* ============ Chat area ============ */}
        <section className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[55vh] pr-1">
          {messages.length === 0 && !thinking && (
            <div className="flex flex-col gap-3">
              <div className="bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] p-4 voxel-shadow">
                <p className="font-pixel text-[16px] text-[var(--vp-ink-text)] uppercase tracking-wider">
                  Ask me anything about your supply chain
                </p>
                <p className="text-[14px] text-[var(--vp-muted)] mt-1">
I manage 8 specialist agents (Inventory, Passport, Market, Usage, Proof, Guide,
Search, Compare). Ask anything — 1–5 credits per question (0.001–0.005 ALGO)
depending on the agent used.
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
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}

          {thinking && (
            <div className="self-start bg-[var(--vp-white)] border-2 border-[var(--vp-ink)] px-4 py-3 voxel-shadow">
              <p className="font-pixel text-[13px] text-[var(--vp-ink-text)] uppercase tracking-widest animate-pulse">
                VeriPass AI is thinking…
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </section>

        {error && (
          <div className="flex flex-col gap-2">
            <p className="font-pixel text-[13px] text-[var(--vp-magenta-text)] uppercase tracking-wider">{error}</p>
            {error.includes('NOT ENOUGH CREDITS') && (
              <button
                type="button"
                onClick={() => onNavigate('pricing', 'push')}
                className="self-start font-pixel text-[13px] uppercase tracking-wider border-2 border-[var(--vp-ink)] bg-[var(--vp-saffron)] text-[var(--vp-ink-text)] px-3 py-1.5 voxel-shadow-sm hover:bg-[#e8871f] cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">shopping_cart</span>
                VIEW PLANS
              </button>
            )}
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
            disabled={thinking || !input.trim()}
            className="font-pixel text-[14px] uppercase tracking-wider bg-[var(--vp-ink)] text-[var(--vp-cream-text)] border-2 border-[var(--vp-ink)] px-4 py-3 voxel-shadow-sm hover:bg-[var(--vp-saffron)] hover:text-[var(--vp-black-text)] disabled:opacity-40 transition-all cursor-pointer"
          >
            {thinking ? '…' : 'Send'}
          </button>
        </div>
      </main>
    </div>
  );
};