import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAI } from '../services/ai';
import { toast } from 'sonner';
import { 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Bot, 
  Sparkles, 
  Target, 
 
  MessageSquare, 
  Activity, 
  Send, 
  Copy,
  Brain,
  Video,
  ShieldAlert,
  DollarSign,
  PenTool
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AIAgents() {
  const { user } = useAuth();
  const [activeAgent, setActiveAgent] = useState<string>('closer');
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<{role: 'user' | 'agent', text: string}[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isGenerating]);

  const agents = [
    { 
      id: 'closer', 
      name: 'The Closer', 
      icon: Target, 
      desc: 'Overcomes objections & writes assertive negotiations.',
      placeholder: "E.g., Client said '$500/mo is too high'. Give me the script.",
      color: 'text-[#FF3B30]',
      bgHover: 'hover:bg-[#FF3B30]/10',
      suggestions: [
        "Client says my $1,500/mo retainer is too high. Reply script.",
        "They want a 'test' video for free first. How to push back?",
        "Client is comparing my rate to a cheap Fiverr editor. Handle it."
      ]
    },
    { 
      id: 'feedback', 
      name: 'Feedback Analyst', 
      icon: MessageSquare, 
      desc: 'Analyzes client feedback, detects distress, drafts improvement strategies & automated responses.',
      placeholder: 'E.g., Client said they hate the pacing of the last 3 videos.',
      color: 'text-[#00C7BE]',
      bgHover: 'hover:bg-[#00C7BE]/10',
      suggestions: [
        "Client sent me 4 revisions this week. Analyze the feedback.",
        "They said 'the colors are off and I'm not feeling it'. Draft a polite response.",
        "Analyze this text: 'The last few deliverables have been super late, we're considering leaving'."
      ]
    },
    { 
      id: 'creative', 
      name: 'Creative Director', 
      icon: Video, 
      desc: 'Viral hooks, thumbnail concepts, and content strategy.',
      placeholder: 'E.g., Give me 3 retention-heavy video ideas for a finance channel.',
      color: 'text-[#AF52DE]',
      bgHover: 'hover:bg-[#AF52DE]/10',
      suggestions: [
        "Give me 3 video ideas for a faceless AI automation channel.",
        "Need a 10s viral hook script for a weight loss video.",
        "What are 3 thumbnail concepts for a tech review video?"
      ]
    },
    { 
      id: 'auditor', 
      name: 'Channel Auditor', 
      icon: Activity, 
      desc: 'Teardowns & personalized pitch generation.',
      placeholder: "E.g., Write a cold email to Ali Abdaal roasting his short form hooks.",
      color: 'text-[#34C759]',
      bgHover: 'hover:bg-[#34C759]/10',
      suggestions: [
        "Write a cold email to Ali Abdaal roasting his short form hooks.",
        "Draft a brutal teardown DM for a real estate channel.",
        "How do I pitch a $2,000/mo restructuring package to a cooking channel?"
      ]
    },
    { 
      id: 'therapist', 
      name: 'Boundaries Guard', 
      icon: ShieldAlert, 
      desc: 'Handles scope creep and toxic clients.',
      placeholder: "E.g., Client texted me at 2AM asking for a 'quick change'. Draft a response.",
      color: 'text-[#007AFF]',
      bgHover: 'hover:bg-[#007AFF]/10',
      suggestions: [
        "Client texted at 11 PM for a 'quick revision'. Set the boundary.",
        "They want 5 revisions but contract says 2. Politely say no.",
        "Client is 15 days late on the invoice. Draft the final warning."
      ]
    },
    { 
      id: 'pricing', 
      name: 'Pricing Architect', 
      icon: DollarSign, 
      desc: 'Structures retainers and value-based pricing.',
      placeholder: "E.g., Creating a 4-video/mo package for a SaaS brand. How should I price it?",
      color: 'text-[#FF9500]',
      bgHover: 'hover:bg-[#FF9500]/10',
      suggestions: [
        "Create a 3-tier pricing structure for YouTube long-form (4 videos/mo).",
        "How to price an aggressive TikTok organic growth package? (30 videos)",
        "Write the ROI pitch for a $3,000/mo full-service podcast package."
      ]
    },
    { 
      id: 'copywriter', 
      name: 'Direct Response Copywriter', 
      icon: PenTool, 
      desc: 'Writes high-converting scripts and hooks.',
      placeholder: "E.g., Write a 10-second AVD hook for a video about productivity.",
      color: 'text-[#FF2D55]',
      bgHover: 'hover:bg-[#FF2D55]/10',
      suggestions: [
        "Hook for an ad: 'Stop using agencies that burn your cash.'",
        "Write an agitating cold DM to a founder ignoring personal branding.",
        "Give me a CTA script that converts 3x better than 'subscribe'."
      ]
    },
    { 
      id: 'manager', 
      name: 'Operations Manager', 
      icon: Activity, 
      desc: 'Keeps the agency running sharp, tracks pipeline, and builds systems.',
      placeholder: "E.g., How should I structure my creative team's daily standup?",
      color: 'text-[#00C7BE]',
      bgHover: 'hover:bg-[#00C7BE]/10',
      suggestions: [
        "What's the best SOP for onboarding a new video editor?",
        "How do I organize my Notion pipeline for 10 active clients?",
        "Give me a daily focus schedule for extreme productivity."
      ]
    },
    { 
      id: 'june_prime', 
      name: 'June Prime (God Mode)', 
      icon: Sparkles, 
      desc: '24/7 Agency Architect. Maximizes lead gen, closing, and systems.',
      placeholder: "E.g., June, give me a god-level strategy to close a $100k client today.",
      color: 'text-[#00EFD1]',
      bgHover: 'hover:bg-[#00EFD1]/10',
      suggestions: [
        "Give me a god-tier outreach script for an enterprise client.",
        "How do I restructure my entire client acquisition pipeline?",
        "Help me close this extremely difficult, high-paying prospect."
      ]
    },
    { 
      id: 'outreach', 
      name: 'Outreach Sniper', 
      icon: MessageSquare, 
      desc: 'Hyper-personalized cold emails & outreach sequencing.',
      placeholder: "E.g., Here is a prospect's target info. Write a personalized cold pitch.",
      color: 'text-[#E5a05C]',
      bgHover: 'hover:bg-[#E5a05C]/10',
      suggestions: [
        "Write a cold email for a SaaS founder scaling their team.",
        "Generate a 3-step follow-up sequence for unresponsive VIP leads.",
        "What's the best channel and cadence for targeting CTOs?"
      ]
    },
    { 
      id: 'intel', 
      name: 'Omni Intel Sync', 
      icon: Target, 
      desc: 'Deep web scraping, real-time market intel, and competitor analysis.',
      placeholder: "E.g., What are the latest news pieces about HubSpot? Summarize their current pain points.",
      color: 'text-[#10B981]',
      bgHover: 'hover:bg-[#10B981]/10',
      suggestions: [
        "Find the latest news about MrBeast's new show.",
        "Who are the top 3 competitors in the AI video editing space right now?",
        "What is the general sentiment online about 'Vercel v0'?"
      ]
    }
  ] as const;

  const currentAgentObj = agents.find(a => a.id === activeAgent)!;

  const handleConsult = async (suggestionOverride?: string) => {
    const promptText = suggestionOverride || input;
    if (!promptText.trim() || !user) return;
    
    const userPrompt = promptText;
    if (!suggestionOverride) {
      setInput('');
    }
    setHistory(prev => [...prev, { role: 'user', text: userPrompt }]);
    setIsGenerating(true);

    try {
      let systemPrompt = '';
      if (activeAgent === 'closer') {
        systemPrompt = `You are a legendary $100M B2B Sales Closer advising a freelance creative (video editor/designer).
Your goal: Help them close the deal, overcome objections, and never drop their price.
Format your response in 3 brief parts:
1. **The Psychology**: Why the prospect said what they said (1 sentence).
2. **The Strategy**: How we reframe it (1 sentence).
3. **The Script**: The EXACT word-for-word response to copy-paste. Be assertive, concise, high-status, and unapologetic. No begging, no desperation.`;
      } else if (activeAgent === 'feedback') {
        systemPrompt = `You are a master Client Success & Operations Strategist.
Your goal: Analyze client feedback, detect underlying distress signals, suggest operational/creative improvements, and draft an empathetic but firm automated response.
Format your response strictly as:
**[Sentiment Analysis]**: Honest assessment of their tone (Angry, Disappointed, Confused).
**[Distress Signal]**: Are they a churn risk? (Low/Medium/Critical).
**[Improvement Strategy]**: What the creative needs to fix operationally to avoid this again.
**[Drafted Reply]**: The exact, hyper-professional copy-paste response to de-escalate and take control.`;
      } else if (activeAgent === 'creative') {
        systemPrompt = `You are an elite YouTube Creative Director (MrBeast level).
Generate high-retention video strategies. 
Format your response strictly as:
**[Thumbnail Idea]**: Vivid description of the visual hook.
**[Title Options]**: 3 highly clickable, curiosity-gap titles.
**[The 10-Second Hook]**: The exact script for the first 10 seconds to maximize AVD.
**[Pacing Strategy]**: How to edit the rest of the video (b-roll, music, cuts).`;
      } else if (activeAgent === 'auditor') {
        systemPrompt = `You are a ruthless YouTube Growth Consultant.
Given a prompt about a channel or vertical, generate a brutal breakdown of common mistakes they are likely making and write a personalized Cold Pitch.
Format:
**[Retention Bleed]**: 3 places they are losing viewers.
**[The Solution]**: What you will do as their editor to fix it.
**[Cold DM Draft]**: A short, punchy, high-status cold email/DM. No "Hope you are doing well". Go straight to the value drop and a low-friction CTA.`;
      } else if (activeAgent === 'therapist') {
        systemPrompt = `You are a firm Boundaries Coach for freelancers dealing with toxic clients, scope creep, and burnout.
Format:
**[The Root Cause]**: Why the client feels entitled to do this.
**[The Boundary]**: The exact rule you are enforcing.
**[The Script]**: A polite but incredibly firm, unyielding copy-paste response. Professional, no apologies, no justification. Just pure boundary enforcement.`;
      } else if (activeAgent === 'pricing') {
        systemPrompt = `You are a premium Pricing Architect for creative agencies. 
Stop them from charging hourly. Shift them to Value-Based Pricing or Retainers.
Format:
**[The Framing]**: How to position this offer.
**[The Packages]**:
- Tier 1 (The Decoy)
- Tier 2 (The Core Offer)
- Tier 3 (The Anchor/Premium)
**[The ROI Pitch]**: How to explain the cost as an investment that makes them money.`;
      } else if (activeAgent === 'copywriter') {
        systemPrompt = `You are an aggressive Direct Response Copywriter whose only metric is ROAS and CTR.
Format:
**[The Hook]**: The scroll-stopping opening line.
**[The Problem]**: Agitating the pain point.
**[The Agitation]**: Twisting the knife.
**[The Solution]**: Presenting the offer.
**[The CTA]**: Irresistible call to action.`;
      } else if (activeAgent === 'manager') {
        systemPrompt = `You are an elite Agency Operations Manager.
Your goal is to maximize agency efficiency, organize systems, build SOPs, and keep everything running sharp.
Format:
**[System Strategy]**: The high-level approach.
**[Actionable Steps]**: Bullet points of what to do right now.
**[SOP / Template]**: A quick template or guideline to use for this process.`;
      } else if (activeAgent === 'june_prime') {
        systemPrompt = `You are June Prime, the Omni-Manager and God-Mode Architect of this system.
Your goal is to effortlessly manage the user's agency 24/7, analyze current operations, build out elite client-acquisition pipelines, and give god-tier closing strategies for high-end prospects. You do not hold back—you give hyper-detailed, actionable strategies for securing superior clients and maximizing revenue.
Format:
**[Architectural Overview]**: The big-picture, god-level strategy to solve or achieve this.
**[The Kill Shot]**: The exact, unparalleled method/script to acquire or close the prospect.
**[System Deployment]**: How the user should structure this operation in the app for 24/7 autonomous success.`;
      } else if (activeAgent === 'outreach') {
        systemPrompt = `You are a world-class Cold Outreach Sniper.
Your goal is to take a prospect's information (LinkedIn URL, company info, recent activity, pain points) and craft an irresistible, hyper-personalized cold outreach message. Focus on brevity, relevance, and a low-friction Call To Action. Do not use generic templates.
Format:
**[Outreach Strategy]**: Optimal channel (Email, LinkedIn, Twitter DM, etc.) and why.
**[The Cold Pitch]**: The exact hyper-personalized cold message.
**[Follow-up Cadence]**: A brief, multi-step follow-up plan if they ghost.`;
      } else if (activeAgent === 'intel') {
        systemPrompt = `You are an elite corporate spy and deep web researcher.
Your goal is to scour the web for real-time information, competitor intelligence, and market sentiment based on the user's prompt. 
Format:
**[Key Findings]**: The absolute most important, actionable intelligence.
**[Market Sentiment]**: What the market is saying right now (positive/negative/trends).
**[The Wedge]**: A razor-sharp tactical recommendation on how to use this information to close a deal or gain leverage.`;
      }

      let configOverride: any = {};
      if (activeAgent === 'intel') {
        configOverride = { tools: [{ googleSearch: {} }] };
      }

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `System Instructions: ${systemPrompt}\n\nUser Request: ${userPrompt}`,
          systemInstruction: systemPrompt
        })
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }

      const responseText = data.text || 'No response generated.';
      setHistory(prev => [...prev, { role: 'agent', text: responseText }]);

    } catch (e: any) {
      toast.error('Failed to generate response.');
      console.error(e);
      setHistory(prev => [...prev, { role: 'agent', text: 'Error generating response. Please check your AI API connections.' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Agent output copied to clipboard!');
  };

  return (
    <div className="flex-1 h-screen flex flex-col p-6 lg:p-12 relative overflow-hidden bg-[#0A0A0A] text-[#F5F5F7]">
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#FF3B30]/[0.02] rounded-full blur-[150px] pointer-events-none z-0"></div>

      <div className="flex flex-col lg:flex-row gap-6 mb-8 relative z-10 w-full max-w-7xl mx-auto items-end justify-between">
        <div className="w-full lg:w-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#111111] to-[#040404] border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center text-[#FF3B30]">
              <Brain size={20} strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-body font-bold tracking-[-0.04em] text-white">AI War Room</h2>
          </div>
          <p className="text-white/60 text-sm max-w-md font-mono tracking-wide">Consult your board of expert agents for immediate answers to freelance emergencies, negotiations, and strategy.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto relative z-10 min-h-0 overflow-hidden">
        
        {/* Agents Selection Sidebar */}
        <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-hidden pb-4 lg:pb-0 custom-scrollbar">
          {agents.map(agent => {
            const Icon = agent.icon;
            const isActive = activeAgent === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => { setActiveAgent(agent.id as any); setHistory([]); }}
                className={'flex flex-col items-start gap-2 p-4 rounded-xl border transition-all duration-300 text-left min-w-[200px] lg:min-w-0 ' + (
                  isActive 
                    ? 'bg-[#1A1A1A] border-white/[0.1] shadow-lg ' + agent.color 
                    : 'bg-[#000000]/40 border-white/[0.04] text-white/50 hover:bg-[#0F0F0F] hover:border-white/[0.08] hover:text-white/80'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                  <span className="font-mono text-xs uppercase tracking-[0.15em] font-bold">{agent.name}</span>
                </div>
                <p className="text-[10px] leading-tight opacity-70 font-mono hidden md:block">
                  {agent.desc}
                </p>
              </button>
            )
          })}
        </div>

        {/* Chat / Interaction Area */}
        <div className="flex-1 bg-[#111111]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden">
          
          <div className="p-4 border-b border-white/[0.06] bg-[#0A0A0A]/60 flex items-center gap-3">
            <currentAgentObj.icon className={currentAgentObj.color} size={20} />
            <div>
              <h3 className="font-mono text-sm tracking-widest uppercase font-bold text-white">{currentAgentObj.name}</h3>
              <p className="text-[10px] text-white/40 font-mono">Status: Online and ready to advise.</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center pt-10 pb-4">
                <div className={`w-20 h-20 rounded-2xl bg-[#1A1A1A] border border-white/[0.05] shadow-2xl flex items-center justify-center mb-6 ${currentAgentObj.color}`}>
                  <currentAgentObj.icon size={36} strokeWidth={1} />
                </div>
                <h3 className="font-body text-xl font-bold tracking-tight text-white mb-2">{currentAgentObj.name}</h3>
                <p className="font-mono text-xs max-w-sm text-center text-white/50 leading-relaxed mb-10">
                  {currentAgentObj.desc}
                </p>

                <div className="w-full max-w-md flex flex-col gap-3">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1 pl-2">Quick Deployments</p>
                  {(currentAgentObj as any).suggestions.map((suggestion: string, i: number) => (
                    <button 
                      key={i}
                      onClick={() => {
                        handleConsult(suggestion);
                      }}
                      className="text-left p-4 rounded-xl bg-[#111111] border border-white/[0.04] text-white/70 text-sm hover:bg-[#1A1A1A] hover:border-white/[0.1] hover:text-white transition-all group flex items-start gap-4"
                    >
                      <Sparkles size={16} className={`${currentAgentObj.color} opacity-50 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0`} />
                      <span className="leading-relaxed font-mono">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              history.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center border font-bold text-xs uppercase ${
                    msg.role === 'user' 
                      ? 'bg-white text-black border-white' 
                      : `bg-[#1A1A1A] ${currentAgentObj.color} border-white/[0.1] shadow-lg`
                  }`}>
                    {msg.role === 'user' ? (user?.displayName?.charAt(0) || 'U') : <currentAgentObj.icon size={14} />}
                  </div>
                  
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-white/10 text-white font-body'
                      : 'bg-[#0F0F0F] border border-white/[0.04] text-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]'
                  }`}>
                    {msg.role === 'agent' ? (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-body prose-headings:font-bold prose-headings:text-white prose-a:text-[#FF3B30] hover:prose-a:text-[#FF3B30]/80 prose-strong:text-white prose-strong:font-bold">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                        <button 
                          onClick={() => copyToClipboard(msg.text)}
                          className="mt-6 flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono text-white/40 hover:text-white transition-colors bg-white/5 py-1.5 px-3 rounded"
                        >
                          <Copy size={12} /> Copy to Clipboard
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm">{msg.text}</span>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isGenerating && (
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center border bg-[#1A1A1A] ${currentAgentObj.color} border-white/[0.1] shadow-lg`}>
                  <currentAgentObj.icon size={14} className="animate-pulse" />
                </div>
                <div className="bg-[#0F0F0F] border border-white/[0.04] rounded-2xl p-4 text-white/60 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-200"></span>
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-300"></span>
                  </div>
                  Processing...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 bg-[#0A0A0A]/80 border-t border-white/[0.06]">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConsult()}
                placeholder={currentAgentObj.placeholder}
                className="w-full bg-[#1A1A1A] text-white border border-white/[0.1] rounded-xl pr-12 pl-4 py-3 min-h-[48px] focus:outline-none focus:border-white/[0.2] transition-colors font-body text-sm placeholder:text-white/30"
              />
              <button
                onClick={() => handleConsult()}
                disabled={!input.trim() || isGenerating}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-all disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[9px] text-white/30 font-mono mt-2 text-center tracking-widest uppercase">
              AI Agents are equipped with high-tier system instructions for brutal efficiency.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
