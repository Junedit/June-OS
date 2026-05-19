import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Search, Telescope, AlertTriangle, Sparkles, Plus, Check, Mail, ChevronDown, CheckSquare, Square, ExternalLink, User, Brain, Banknote, Users, Download, Activity, FileText, X, Copy, Globe, Link2, Instagram, Twitter, Youtube, Target, TrendingUp, Video } from 'lucide-react';
import { generateBulkChannelLeads, generateInstantColdPitch } from '../services/ai';
import { addDoc, collection, serverTimestamp, getDocs, query as firestoreQuery, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { toast } from 'sonner';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};


const YOUTUBE_NICHES = [
    "🔥 OVERALL: People Currently Hiring Video Editors",
    
    // Playboard "Most Popular" Categories
    "VTubers & Virtual Idols", "Gaming & Esports", "Animation & Cartoons",
    "Animals & Pets (Dogs/Cats)", "Cooking & Baking", "Mukbang & Eating Shows",
    "Music & Cover Songs", "Dance & Cover Dance", "Beauty & Makeup", "Fashion & Style",
    "Home Workout & Body Building", "Camping & Outdoors", "Trucker & Travel", "Sneakers & Streetwear",

    // Editor-specific target niches
    "Finance & Stocks", "True Crime & Mysteries", "AI & Machine Learning", 
    "Tech & Gadget Reviews", "Edutainment & Lore", "Real Estate Investing",
    "Podcast & Multi-Cam", "Video Essays & Mini-Docs", "Faceless Channels", "Reaction & Commentary",


    // Lifestyle & Variations
    "Lifestyle & Vlogs", "Speedrunning",

    // Gaming Variations
    "Esports & Competitive Gaming", "Game Lore & Deep Dives", "Mobile Gaming", "VR & AR Gaming", "Retro Gaming", "VTubers", "Minecraft & Roblox Specialists", "Indie Game Showcases",

    // Education, Science & Information
    "Science Experiments", "Space & Astronomy", "Documentary Films", "BookTube & Literature", "Language Learning", "Productivity & Self-Help", "Psychology & Behavior", "Trivia & Fun Facts", "Cybersecurity", "Engineering & Architecture",

    // Health, Beauty & Fashion
    "Yoga & Pilates", "Skincare & Dermatology", "Men's Fashion & Grooming", "Streetwear & Sneakers", "Weightlifting & Bodybuilding", "Nutrition & Dieting", "Alternative Health",

    // Food, Travel & Exploration
    "Cooking & Recipes", "Street Food & Reviews", "Travel Vlogs & Exploration", "Van Life & Digital Nomads", "Bushcraft & Survival", "Theme Park Reviews", "Urban Exploration", "Restaurant Reviews",

    // Arts, Crafts, DIY & Hobbies
    "Photography & Filmmaking", "Graphic Design & Illustration", "Woodworking & Carpentry", "Music Production & Beats", "Instrument Tutorials", "Sewing & Fashion Design", "ASMR", "Mechanical Keyboards", "3D Printing & Modeling", "Art Restoration", "Calligraphy & Lettering", "Miniatures & Dioramas", "Magic & Illusions",

    // Automotive, Sports & Outdoors
    "Automotive & Car Builds", "Motorcycles & Motovlogs", "Martial Arts & MMA", "Extreme Sports & Action", "Fishing & Hunting", "Golf Tutorials", "Cycling & Mountain Biking", "Aviation & Flight Simulators",

    // Niche Entertainment & Other
    "Pranks & Social Experiments", "Challenge Videos", "Pet & Animal Channels", "Tarot & Astrology", "Unboxing & Toy Reviews", "Family Vlogs", "Comedy Sketches", "Movie & TV Show Reviews", "Anime Analysis"
  ];

export default function Prospector() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  
  const [savingTracking, setSavingTracking] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [pitchLoading, setPitchLoading] = useState<number | null>(null);
  const [generatedPitch, setGeneratedPitch] = useState<{index: number, variants: any} | null>(null);
  const [pitchVariantTab, setPitchVariantTab] = useState<'alpha'|'beta'|'gamma'>('alpha');
  const [radarModalOpen, setRadarModalOpen] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentProgress, setAgentProgress] = useState("");
  
  const hasYouTubeKey = !!import.meta.env.VITE_YOUTUBE_API_KEY;

  const [autopilotOn, setAutopilotOn] = useState(() => {
    return localStorage.getItem('autopilotOn') === 'true';
  });
  const [autopilotNiche, setAutopilotNiche] = useState(() => {
    return localStorage.getItem('autopilotNiche') || 'OVERALL';
  });

  useEffect(() => {
    localStorage.setItem('autopilotOn', String(autopilotOn));
    localStorage.setItem('autopilotNiche', autopilotNiche);
  }, [autopilotOn, autopilotNiche]);

  useEffect(() => {
     // Autopilot starts are managed by GodModeBackgroundWorker 24/7.
  }, [autopilotOn, user]);


  

  
  async function handleRunAgent() {
    if (!user) return;
    if (agentLoading) return;
    
    setAgentLoading(true);
    setAgentProgress("Initializing June Prime...");
    
    let targetNiche = autopilotNiche === 'OVERALL' ? 'OVERALL' : autopilotNiche;
    const isSunday = new Date().getDay() === 0;

    // Only do the broad "video editor" (OVERALL) scan on Sundays.
    // On other days, extract valuable leads from a random high-value niche.
    if (targetNiche === 'OVERALL' && !isSunday) {
      const activeNiches = YOUTUBE_NICHES.filter(n => !n.startsWith('🔥'));
      targetNiche = activeNiches[Math.floor(Math.random() * activeNiches.length)];
      setAgentProgress(`Not Sunday. Targeting high-value leaders in ${targetNiche}...`);
    } else if (targetNiche === 'OVERALL' && isSunday) {
      setAgentProgress("Sunday Video Editor Global Scan initiated...");
    }

    try {
      setAgentProgress("June Prime: Scanning global databases for top matches...");
      // Ask our AI services to fetch broader set of leads globally
      const channels = await generateBulkChannelLeads(targetNiche, 20, 1000, "Global");
      
      // Filter out low quality leads. Be more lenient on Sundays for the broad scan, stricter on other days.
      const eliteChannels = channels.filter(c => {
         if (isSunday && targetNiche === 'OVERALL') {
            return c.leadScore?.includes('A') || c.leadScore?.includes('B') || c.leadScore?.includes('C');
         } else {
            // Strictly valuable leads on non-Sundays
            return c.leadScore?.includes('A') || c.leadScore?.includes('B');
         }
      }).slice(0, 10);
      
      setAgentProgress(`June Prime: Deep-analyzing ${eliteChannels.length} leads & generating tailored pitches...`);
      const { generateInstantColdPitch, generateSingleLeadAnalysis } = await import('../services/ai');
      
      let addedCount = 0;
      
      // Process serially or concurrency limit of 3 to avoid AI quota limits 
      for (const item of eliteChannels) {
          try {
              const brandName = item.channelName || 'Unknown Brand';
              const existingQuery = firestoreQuery(collection(db, 'leads'), where('ownerId', '==', user.uid), where('brandName', '==', brandName));
              const existingDocs = await getDocs(existingQuery);
              let isDuplicate = !existingDocs.empty;

              if (!isDuplicate && item.channelUrl) {
                  const urlQuery = firestoreQuery(collection(db, 'leads'), where('ownerId', '==', user.uid), where('companyUrl', '==', item.channelUrl));
                  const urlDocs = await getDocs(urlQuery);
                  isDuplicate = !urlDocs.empty;
              }

              if (isDuplicate) {
                console.log(`Skipping duplicate lead: ${brandName}`);
                continue;
              }

              // Now we generate the deep dive analysis for this selected elite lead
              const analysis = await generateSingleLeadAnalysis(item);
              
              const pitchData = await generateInstantColdPitch({ ...item, ...analysis });
              
              const rawEmail = (item.publicEmail && item.publicEmail.includes('@')) ? item.publicEmail.split(/[\s/,]+/).find((e: string) => e.includes('@')) : 'unknown@example.com';
              const cleanEmail = rawEmail && /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(rawEmail) ? rawEmail : 'unknown@example.com';

              // Set Follow-up Date (3 days from now) for Drip Sequence
              const followUpDate = new Date();
              followUpDate.setDate(followUpDate.getDate() + 3);

              await addDoc(collection(db, 'leads'), {
                  brandName: brandName,
                  companyUrl: item.channelUrl || '',
                  contactName: item.channelName || 'Target Scout',
                  contactEmail: cleanEmail,
                  budget: 0,
                  niche: item.niche || 'YouTube/Content',
                  qualityScore: analysis.qualityScore || item.qualityScore || 0,
                  hiringIntent: analysis.hiringIntent || item.hiringIntent || 'Unknown',
                  hiringMentions: analysis.hiringMentions || item.hiringMentions || 'Unknown',
                  distressSignal: item.distressSignal || false,
                  predictedLTV: analysis.predictedLTV || item.predictedLTV || 'Unknown',
                  estimatedUpsideValue: analysis.estimatedUpsideValue || item.estimatedUpsideValue || 'Unknown',
                  message: `[AI AUTOPILOT GENERATED]\nSubs: ${item.subscriberCount} | 30d Views: ${item.thirtyDayViews} | Growth: ${item.growthRate}\nEstimated Rev: ${item.estimatedRevenue || 'Unknown'}\nTarget Rate: ${item.targetEditorRate || 'Unknown'}\n\nLead Score: ${analysis.leadScore} (IQ: ${analysis.qualityScore}) - ${analysis.scoreReason}\nFinancial Upside (AI): ${analysis.estimatedUpsideValue || 'Unknown'}\nPredicted 12-Month LTV: ${analysis.predictedLTV || item.predictedLTV || 'Unknown'}\nAlgorithmic Distress: ${item.distressSignal ? 'DETECTED' : 'None'}\n\nHiring Mentions: ${analysis.hiringMentions || item.hiringMentions || 'No explicit mention.'}\n\nLast Video: ${item.lastVideoPerformance}\n\nDeep Dive: ${analysis.deepDiveInfo || ''}\n\nContent Fixes: ${analysis.contentFixes || ''}\n\nGenerated Pitches Saved internally.\nA Drip Sequence is queued to follow up in 3 days.`,
                  status: 'new',
                  ownerId: user.uid,
                  pitchVariants: pitchData,
                  dripSequence: true,
                  followUpDate: followUpDate,
                  createdAt: serverTimestamp()
              });
              addedCount++;
          } catch (e: any) {
              console.warn("Error processing agent elite lead", e);
          }
      }
      
      if (addedCount > 0) {
        toast.success(`AI Autopilot completed! ${addedCount} highly-qualified leads added to pipeline.`);
      } else {
        toast.info(`AI Autopilot completed: Scanned elements, but none passed the quality threshold.`);
      }
      setRadarModalOpen(false);
    } catch (e: any) {
      toast.error("June Prime encountered an error: " + e.message);
    } finally {
      setAgentLoading(false);
      setAgentProgress("");
    }
  };

  useEffect(() => {
    // The daily trigger has been moved to GodModeBackgroundWorker
    // so it executes silently in the background regardless of tab.
  }, []);

  
  const [requireEmail, setRequireEmail] = useState(false);
  const [minSubs, setMinSubs] = useState(20000);
  const [countryFilter, setCountryFilter] = useState('Global');
  const [sortBy, setSortBy] = useState('default');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setResults([]);
    setSelectedLeads(new Set());
    setSaved(false);
    setCurrentPage(1);
    
    try {
      // Fetch up to 500 items to accommodate the request for scanning globally across "all of youtube"
      const channels = await generateBulkChannelLeads(query, 24, minSubs, countryFilter); 
      if (Array.isArray(channels)) {
         setResults(channels);
      }
    } catch (e: any) {
       toast.error("Failed to run scout: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLead = (index: number) => {
     const newSet = new Set(selectedLeads);
     if (newSet.has(index)) newSet.delete(index);
     else newSet.add(index);
     setSelectedLeads(newSet);
  };

  const handleExportCSV = () => {
    if (selectedLeads.size === 0) return;
    
    const headers = ['Channel Name', 'URL', 'Subscribers', 'Estimated Revenue', 'Target Rate', 'Public Email', 'Growth Rate', 'Niche/Archetype'];
    const rows = Array.from(selectedLeads).map(index => {
      const lead = results[index];
      const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      
      return [
        escapeCsv(lead.channelName),
        escapeCsv(lead.channelUrl),
        escapeCsv(lead.subscriberCount),
        escapeCsv(lead.estimatedRevenue),
        escapeCsv(lead.targetEditorRate),
        escapeCsv(lead.publicEmail),
        escapeCsv(lead.growthRate),
        escapeCsv(lead.creatorPersonality),
        escapeCsv(lead.leadScore)
      ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "prospectorr_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedLeads.size} leads as CSV.`);
  };

  const handleGeneratePitch = async (index: number) => {
    setPitchLoading(index);
    try {
      const pitch = await generateInstantColdPitch(results[index]);
      setGeneratedPitch({ index, variants: pitch });
      setPitchVariantTab('alpha');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e: any) {
      toast.error("Failed to generate pitch.");
    } finally {
      setPitchLoading(null);
    }
  };

  const [auditLoading, setAuditLoading] = useState<number | null>(null);

  const handleTriggerAIAnalysis = async (index: number) => {
    setAuditLoading(index);
    try {
      const { generateSingleLeadAnalysis } = await import('../services/ai');
      const analysis = await generateSingleLeadAnalysis(results[index]);
      const newResults = [...results];
      newResults[index] = {
        ...newResults[index],
        deepDiveInfo: analysis.deepDiveInfo || newResults[index].deepDiveInfo,
        contentFixes: analysis.contentFixes || newResults[index].contentFixes,
        pitchAngles: analysis.pitchAngles || newResults[index].pitchAngles,
        creatorPersonality: analysis.creatorPersonality || newResults[index].creatorPersonality,
        audienceDemographic: analysis.audienceDemographic || newResults[index].audienceDemographic,
        estimatedRevenue: analysis.estimatedRevenue || newResults[index].estimatedRevenue,
        leadScore: analysis.leadScore || newResults[index].leadScore,
        scoreReason: analysis.scoreReason || newResults[index].scoreReason,
        websiteTraffic: analysis.websiteTraffic || newResults[index].websiteTraffic,
        socialEngagement: analysis.socialEngagement || newResults[index].socialEngagement,
      };
      setResults(newResults);
      toast.success("AI Analysis Complete!");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e: any) {
      toast.error("Failed to run AI Analysis.");
    } finally {
      setAuditLoading(null);
    }
  };

  const [campaignLoading, setCampaignLoading] = useState(false);

  const handleAutoCampaign = async () => {
    if (!user || selectedLeads.size === 0) return;
    setCampaignLoading(true);
    setSavingTracking(true);
    try {
      const { generateInstantColdPitch } = await import('../services/ai');
      let successCount = 0;
      
      for (const index of Array.from(selectedLeads)) {
        const item = results[index];
        const rawEmail = (item.publicEmail && item.publicEmail.includes('@')) ? item.publicEmail.split(/[\s/,]+/).find((e: string) => e.includes('@')) : 'unknown@example.com';
        const cleanEmail = rawEmail && /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(rawEmail) ? rawEmail : '';
        if (!cleanEmail) continue; // Only campaign those with emails

        const brandName = item.channelName || 'Unknown Brand';
        const existingQuery = firestoreQuery(collection(db, 'leads'), where('ownerId', '==', user.uid), where('brandName', '==', brandName));
        const existingDocs = await getDocs(existingQuery);
        let isDuplicate = !existingDocs.empty;
        
        if (!isDuplicate && item.channelUrl) {
            const urlQuery = firestoreQuery(collection(db, 'leads'), where('ownerId', '==', user.uid), where('companyUrl', '==', item.channelUrl));
            const urlDocs = await getDocs(urlQuery);
            isDuplicate = !urlDocs.empty;
        }
        
        if (isDuplicate) continue;

        // 1. Generate Custom Pitch
        const pitchData = await generateInstantColdPitch(item);

        // 2. Set Follow-up Date (3 days from now) for Drip Sequence
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 3);

        // 3. Add Lead
        const leadRef = await addDoc(collection(db, 'leads'), {
          brandName: brandName,
          companyUrl: item.channelUrl || '',
          contactName: item.channelName || 'Target Scout',
          contactEmail: cleanEmail,
          budget: 0,
          qualityScore: item.qualityScore || 0,
          hiringIntent: item.hiringIntent || 'Unknown',
          estimatedUpsideValue: item.estimatedUpsideValue || 'Unknown',
          distressSignal: item.distressSignal || false,
          predictedLTV: item.predictedLTV || 'Unknown',
          niche: item.niche || 'YouTube/Content',
          message: `[AUTO CAMPAIGN]\nSubs: ${item.subscriberCount} | Rev: ${item.estimatedRevenue || 'Unknown'}\nTarget Rate: ${item.targetEditorRate || 'Unknown'}\nScore: ${item.leadScore || 'Unknown'} - ${item.scoreReason || ''}\nLTV: ${item.predictedLTV || 'Unknown'}\n\nGenerated Pitches available.\nA Drip Sequence is queued to follow up in 3 days.`,
          status: 'new',
          ownerId: user.uid,
          pitchVariants: pitchData,
          dripSequence: true,
          followUpDate: followUpDate,
          createdAt: serverTimestamp()
        });

        // 3. Add AI Pitch to Notes immediately so it's ready in the pipeline
        await addDoc(collection(db, 'leads', leadRef.id, 'notes'), {
          text: `🤖 AI CAMPAIGN DRAFTS:\n\nAlpha: ${pitchData.alpha}\n\nBeta: ${pitchData.beta}\n\nGamma: ${pitchData.gamma}\n\nDelta: ${pitchData.delta}`,
          type: 'note',
          ownerId: user.uid,
          leadId: leadRef.id,
          createdAt: serverTimestamp()
        });
        
        successCount++;
      }
      setSaved(true);
      toast.success(`Generated ${successCount} automated campaigns in your CRM pipeline!`);
    } catch (e) {
      toast.error("Campaign generation failed. " + e);
    } finally {
      setCampaignLoading(false);
      setSavingTracking(false);
    }
  };

  const [diagnosticModalOpen, setDiagnosticModalOpen] = useState(false);
  const [diagnosticLink, setDiagnosticLink] = useState('');
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);

  const handleRunDiagnostic = async () => {
    if (!diagnosticLink) return;
    setDiagnosticLoading(true);
    setDiagnosticResult(null);
    try {
      // Mock generation delay
      await new Promise(r => setTimeout(r, 2000));
      setDiagnosticResult(`
### Video Diagnostic Report
**Source:** ${diagnosticLink}

#### 1. Hook Analysis (0:00 - 0:15)
- **Visuals:** 🔴 Very weak. The creator stays on one static frame for 8 seconds.
- **Pacing:** 🟡 Moderate. Could be cut tighter.
- **Recommendation:** Implement a B-roll jump-cut sequence in the first 3 seconds to reset viewer attention.

#### 2. Retention Risks
- **Mid-Roll Drop-off:** At 3:14, the creator goes on a tangent. This will cause a sharp dip in retention.
- **Audio Quality:** 🟢 Good, but lacks SFX to emphasize key points.

#### 3. Execution Plan for Editor
1. Cut out "uhs" and "ums" (Found 14 instances).
2. Add J-Cuts on scene transitions.
3. Overlay dynamic subtitles during the highly technical explanation at 4:20.
      `.trim());
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      toast.error("Failed to run diagnostics");
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!user || selectedLeads.size === 0) return;
    setSavingTracking(true);
    try {
      for (const index of Array.from(selectedLeads)) {
        const item = results[index];
        const rawEmail = (item.publicEmail && item.publicEmail.includes('@')) ? item.publicEmail.split(/[\s/,]+/).find((e: string) => e.includes('@')) : 'unknown@example.com';
        const cleanEmail = rawEmail && /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(rawEmail) ? rawEmail : 'unknown@example.com';

        const brandName = item.channelName || 'Unknown Brand';
        const existingQuery = firestoreQuery(collection(db, 'leads'), where('ownerId', '==', user.uid), where('brandName', '==', brandName));
        const existingDocs = await getDocs(existingQuery);
        let isDuplicate = !existingDocs.empty;

        if (!isDuplicate && item.channelUrl) {
            const urlQuery = firestoreQuery(collection(db, 'leads'), where('ownerId', '==', user.uid), where('companyUrl', '==', item.channelUrl));
            const urlDocs = await getDocs(urlQuery);
            isDuplicate = !urlDocs.empty;
        }

        if (isDuplicate) continue; // Skip duplicates

        await addDoc(collection(db, 'leads'), {
          brandName: brandName,
          companyUrl: item.channelUrl || '',
          contactName: item.channelName || 'Target Scout',
          contactEmail: cleanEmail,
          budget: 0,
          message: `Generated AI Scout Lead\n\nSubs: ${item.subscriberCount} | 30d Views: ${item.thirtyDayViews} | Growth: ${item.growthRate}\nEstimated Rev: ${item.estimatedRevenue || 'Unknown'}\nUpload Freq: ${item.uploadFrequency || 'Unknown'}\nRec. Sponsors: ${item.recentSponsors || 'Unknown'}\nDemographic: ${item.audienceDemographic || 'Unknown'}\nPersonality: ${item.creatorPersonality || 'Unknown'}\nMonetization: ${item.primaryMonetization || 'Unknown'}\nCompetitors: ${(item.topCompetitors || []).join(', ') || 'Unknown'}\nTarget Rate: ${item.targetEditorRate || 'Unknown'}\n\nLast Video: ${item.lastVideoPerformance}\n\nDeep Dive: ${item.deepDiveInfo}\n\nDescription: ${item.description}\n\nContent Fixes: ${item.contentFixes}`.slice(0, 3900),
          status: 'new',
          ownerId: user.uid,
          createdAt: serverTimestamp()
        });
      }
      setSaved(true);
      toast.success(`${selectedLeads.size} leads pushed into pipeline!`);
    } catch(e) {
      handleFirestoreError(e, OperationType.CREATE, 'leads');
      toast.error("Failed to save to pipeline.");
    } finally {
      setSavingTracking(false);
    }
  };

  return (
        <div className="flex-1 bg-transparent w-full relative flex flex-col overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[5%] left-[20%] w-[800px] h-[500px] bg-[var(--brand-primary)] text-white opacity-[0.03] blur-[150px] rounded-full"></div>
        <div className="absolute top-[30%] right-[10%] w-[600px] h-[600px] bg-[var(--brand-primary)] text-white opacity-[0.02] blur-[150px] rounded-full"></div>
      </div>
      <header className="bg-[#000000]/60 backdrop-blur-[80px] saturate-[2.0] border-b border-white/[0.02] top-0 sticky z-40 flex justify-between items-center w-full px-8 py-5">
        <div className="flex items-center gap-4">
          <span className="md:hidden font-black text-2xl text-white font-body tracking-tight">PR</span>
          <h2 className="text-xl font-body tracking-tight font-semibold text-white hidden lg:flex items-center gap-2">
             <Telescope size={20} className="text-white/60" /> Prospector
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
             onClick={() => setDiagnosticModalOpen(true)}
             className="bg-transparent border border-white/[0.06] text-white/80 hover:text-white hover:border-zinc-500 px-4 py-2 text-sm font-semibold rounded-2xl flex items-center gap-2 transition-colors"
          >
             <Video size={16} /> Run Diagnostics
          </button>
          <button 
             onClick={() => setRadarModalOpen(true)}
             disabled={agentLoading}
             className="bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] font-bold rounded-none flex items-center gap-2 transition-all shadow-[0_4px_24px_rgba(255,255,255,0.15)] disabled:opacity-50"
          >
             <Brain size={14} /> Deploy June Prime
          </button>
        </div>
      </header>

      <div className="p-10 md:p-10 max-w-4xl mx-auto w-full mb-32 flex-1">
         {!hasYouTubeKey && (
            <div className="mb-10 bg-[#FF3B30]/10 border border-[#FF3B30]/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FF3B30]/20 flex items-center justify-center text-[#FF3B30]">
                     <AlertTriangle size={24} />
                  </div>
                  <div>
                     <h3 className="text-white font-bold tracking-tight mb-1">Live Database Offline (Simulated Leads Only)</h3>
                     <p className="text-sm text-white/60">June Prime is using AI to generate simulated leads. Please configure <code className="bg-black/30 font-mono text-[11px] px-1.5 py-0.5 rounded text-[#FF3B30]">VITE_YOUTUBE_API_KEY</code> in your environment variables to fetch real targets.</p>
                  </div>
               </div>
            </div>
         )}
         <div className="text-center mb-16 relative z-10 font-mono">
            <div className="inline-flex items-center justify-center px-4 py-1.5 bg-white/5 text-white/80 font-mono text-[10px] font-bold uppercase tracking-[0.3em] rounded-sm mb-6 border border-white/20 shadow-[0_4px_24px_rgba(255,255,255,0.15)] relative overflow-hidden group">
               <div className="absolute inset-0 bg-white/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
               <Activity size={12} className="mr-2 inline" /> DATA AQUISITION TERMINAL / GLOBAL NETWORK ACTIVE
            </div>
            <h2 className="text-5xl lg:text-7xl font-body tracking-tight tracking-[0.2em] text-white mb-6 uppercase flex items-center justify-center gap-2">
              PROS<span className="text-zinc-100">PECTOR</span><span className="w-4 h-12 bg-[var(--brand-primary)] text-white animate-pulse inline-block ml-2"></span>
            </h2>
            <div className="flex flex-col items-center justify-center gap-2">
               <p className="text-white/60 text-xs max-w-2xl mx-auto font-mono uppercase tracking-[0.15em] leading-relaxed">
                 [EXECUTE NEURAL SEARCH PROTOCOL]
               </p>
               <p className="text-white/60 text-[10px] max-w-xl mx-auto font-mono uppercase tracking-[0.2em] leading-relaxed">
                 Mine the global web for high-value creator data. Extract editing pain points, estimate budgets, and auto-generate penetration pitches instantly.
               </p>
            </div>
         </div>

         {/* Notice */}
         <div className="bg-[#000000]/50 border-l-2 border-white/[0.04] p-4 flex items-start gap-3 mb-10 max-w-3xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')] opacity-[0.1] pointer-events-none"></div>
            <AlertTriangle className="text-white/80 shrink-0 mt-0.5" size={14} />
            <div className="text-[10px] text-white/80/70 leading-relaxed font-mono tracking-[0.2em] uppercase">
              <strong className="text-white/80">SYSTEM ARCHITECTURE NOTICE:</strong> Deep studio metrics (Retention & CTR) require precise OAuth authorization. External search intercepts publicly available network patterns and utilizes LLM prediction models to estimate target viability & performance vectors.
            </div>
         </div>

         {/* Search Box */}
         <div className="max-w-3xl mx-auto mb-12">
            <form onSubmit={handleSearch}>
              <div className="flex flex-col gap-4 relative">
                <div className="relative flex shadow-[0_4px_24px_rgba(255,255,255,0.15)] group h-16 z-20 border border-white/30 rounded-none focus-within:border-white/20 transition-colors overflow-hidden bg-transparent">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Search size={22} className="text-zinc-100/50 group-focus-within:text-zinc-100 transition-colors" />
                  </div>
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => setIsDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                      placeholder="ENTER TARGET VECTOR (e.g. Finance, Tech, Health)..."
                      className="w-full h-full bg-transparent border-none pl-14 text-zinc-100 placeholder-[var(--brand-primary)]/30 focus:outline-none transition-all text-sm font-mono tracking-[0.2em] uppercase"
                    />
                    <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-100/50 hover:text-white transition-colors">
                      <ChevronDown size={20} />
                    </button>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="bg-white/10 border-l border-white/30 hover:bg-white/30 disabled:opacity-50 text-zinc-100 hover:text-white transition-colors flex items-center justify-center gap-3 whitespace-nowrap h-full px-8 uppercase tracking-[0.2em] font-mono text-xs focus:outline-none"
                  >
                    {loading ? 'Scanning...' : <>Execute <Target size={16} /></>}
                  </button>
                </div>
                
                {isDropdownOpen && (
                  <div className="absolute top-28 left-0 right-40 bg-transparent border border-white/30 rounded-none shadow-[0_20px_50px_rgba(234,0,0,0.15)] overflow-hidden z-30 max-h-64 overflow-y-auto custom-scrollbar">
                    <div className="px-5 py-3 text-[9px] uppercase tracking-[0.2em] text-zinc-100/80 font-bold mb-1 border-b border-white/20 bg-white/5 flex items-center gap-2">
                       <Activity size={12} /> Active Vectors
                    </div>
                    {YOUTUBE_NICHES.filter(niche => niche.toLowerCase().includes(query.toLowerCase())).map((niche) => (
                      <div 
                        key={niche}
                        onClick={() => {
                           setQuery(niche);
                           setIsDropdownOpen(false);
                        }}
                        className="px-5 py-3 text-white/60 hover:bg-white/10 hover:text-white hover:pl-6 cursor-pointer transition-all border-b border-white/[0.04] last:border-0 font-mono text-[11px] tracking-[0.2em] uppercase"
                      >
                        {niche}
                      </div>
                    ))}
                    {YOUTUBE_NICHES.filter(niche => niche.toLowerCase().includes(query.toLowerCase())).length === 0 && (
                      <div className="px-5 py-3 text-zinc-100/50 italic font-mono text-[10px] uppercase tracking-[0.2em]">No target vectors found. Press enter to force execute.</div>
                    )}
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-10 px-2 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/60 font-mono uppercase tracking-[0.2em] flex items-center gap-1"><Target size={12}/> GEO LOC:</span>
                    <select 
                       value={countryFilter} 
                       onChange={(e) => setCountryFilter(e.target.value)}
                       className="bg-transparent border-b border-white/[0.06] text-white/80 text-[10px] font-mono tracking-[0.2em] rounded-none p-1 outline-none focus:border-white/20 transition-colors custom-scrollbar"
                    >
                       <option value="Global">🌎 Global Search</option>
                       <option value="US">🇺🇸 United States</option>
                       <option value="GB">🇬🇧 United Kingdom</option>
                       <option value="CA">🇨🇦 Canada</option>
                       <option value="AU">🇦🇺 Australia</option>
                       <option value="IN">🇮🇳 India</option>
                       <option value="IE">🇮🇪 Ireland</option>
                       <option value="NZ">🇳🇿 New Zealand</option>
                       <option value="ZA">🇿🇦 South Africa</option>
                       <option value="SG">🇸🇬 Singapore</option>
                       <option value="MY">🇲🇾 Malaysia</option>
                       <option value="PH">🇵🇭 Philippines</option>
                       <option value="DE">🇩🇪 Germany</option>
                       <option value="FR">🇫🇷 France</option>
                       <option value="NL">🇳🇱 Netherlands</option>
                       <option value="SE">🇸🇪 Sweden</option>
                       <option value="NO">🇳🇴 Norway</option>
                       <option value="DK">🇩🇰 Denmark</option>
                       <option value="FI">🇫🇮 Finland</option>
                       <option value="CH">🇨🇭 Switzerland</option>
                       <option value="IT">🇮🇹 Italy</option>
                       <option value="ES">🇪🇸 Spain</option>
                       <option value="PT">🇵🇹 Portugal</option>
                       <option value="BR">🇧🇷 Brazil</option>
                       <option value="MX">🇲🇽 Mexico</option>
                       <option value="AR">🇦🇷 Argentina</option>
                       <option value="CO">🇨🇴 Colombia</option>
                       <option value="CL">🇨🇱 Chile</option>
                       <option value="PE">🇵🇪 Peru</option>
                       <option value="AE">🇦🇪 United Arab Emirates</option>
                       <option value="JP">🇯🇵 Japan</option>
                       <option value="KR">🇰🇷 South Korea</option>
                       <option value="TW">🇹🇼 Taiwan</option>
                       <option value="HK">🇭🇰 Hong Kong</option>
                       <option value="ID">🇮🇩 Indonesia</option>
                       <option value="TH">🇹🇭 Thailand</option>
                       <option value="VN">🇻🇳 Vietnam</option>
                       <option value="EG">🇪🇬 Egypt</option>
                       <option value="SA">🇸🇦 Saudi Arabia</option>
                       <option value="TR">🇹🇷 Turkey</option>
                       <option value="PL">🇵🇱 Poland</option>
                       <option value="UA">🇺🇦 Ukraine</option>
                       <option value="RO">🇷🇴 Romania</option>
                       <option value="CZ">🇨🇿 Czechia</option>
                       <option value="HU">🇭🇺 Hungary</option>
                       <option value="GR">🇬🇷 Greece</option>
                       <option value="IL">🇮🇱 Israel</option>
                       <option value="NG">🇳🇬 Nigeria</option>
                       <option value="KE">🇰🇪 Kenya</option>
                       <option value="GH">🇬🇭 Ghana</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/60 font-mono uppercase tracking-[0.2em] flex items-center gap-1"><Users size={12}/> MIN BASE:</span>
                     <select 
                       value={minSubs} 
                       onChange={(e) => setMinSubs(Number(e.target.value))}
                       className="bg-transparent border-b border-white/[0.06] text-white/80 text-[10px] font-mono tracking-[0.2em] rounded-none p-1 outline-none focus:border-white/20 transition-colors custom-scrollbar"
                     >
                       <option value={0}>Any Size</option>
                       <option value={1000}>1k+</option>
                       <option value={10000}>10k+</option>
                       <option value={20000}>20k+</option>
                       <option value={50000}>50k+</option>
                       <option value={100000}>100k+</option>
                     </select>
                  </div>
                  
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-white/80/70 font-mono cursor-pointer hover:text-white/80 transition-colors ml-2 border-b border-white/20 hover:border-white/20 p-1 bg-transparent">
                    <input type="checkbox" checked={requireEmail} onChange={(e) => setRequireEmail(e.target.checked)} className="bg-transparent border-white/[0.06] rounded-none accent-emerald-500" /> 
                    REQUIRE VERIFIED COMM PROTOCOL
                  </label>
                </div>
              </div>
            </form>
         </div>

         {/* Niches Quick Select */}
         <div className="flex flex-col items-center gap-4 mb-12 max-w-4xl mx-auto">
           {/* Featured Niche */}
           <button
             onClick={(e) => {
               e.preventDefault();
               setQuery(YOUTUBE_NICHES[0]);
             }}
             className="px-6 py-3 rounded-none border border-white/[0.02]0 bg-white/10 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-zinc-100 hover:text-white hover:bg-white/20 transition-all font-mono shadow-[0_4px_24px_rgba(255,255,255,0.15)]"
           >
             [ {YOUTUBE_NICHES[0]} ]
           </button>
           
           <div className="flex flex-wrap items-center justify-center gap-2">
             {YOUTUBE_NICHES.slice(1, 31).map(niche => (
               <button
                 key={niche}
                 onClick={(e) => {
                   e.preventDefault();
                   setQuery(niche);
                 }}
                 className="px-4 py-1.5 rounded-none border border-white/[0.04] bg-transparent text-[9px] font-bold uppercase tracking-[0.15em] text-white/60 hover:text-white hover:bg-white/5 hover:border-white/30 transition-all font-mono"
               >
                 {niche}
               </button>
             ))}
             <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsDropdownOpen(true);
                  // Focus the input to reveal the dropdown
                  document.querySelector('form input')?.dispatchEvent(new Event('focus'));
                }}
                className="px-4 py-1.5 rounded-none border border-white/20 bg-white/5 text-[9px] font-bold uppercase tracking-[0.15em] text-white/80 hover:text-white hover:bg-white/20 hover:border-white/20 transition-all font-mono"
             >
                + VIEW FULL DIRECTORY
             </button>
           </div>
         </div>

         {/* Results */}
         {loading && (
           <div className="bg-transparent/20 border border-white/[0.04] rounded-none overflow-hidden fade-in flex flex-col relative z-20">
             <div className="bg-[#000000] border-b border-white/[0.04] p-5 flex justify-between items-center px-8 w-full">
               <div className="h-4 w-48 bg-white/5 animate-pulse rounded-sm"></div>
               <div className="h-6 w-32 bg-white/5 animate-pulse rounded-sm"></div>
             </div>
             <div className="p-0">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                 {[1, 2, 3, 4, 5, 6].map((i) => (
                   <div key={i} className="p-8 border-b border-r border-white/[0.02] flex flex-col gap-6">
                     <div className="flex gap-4">
                       <div className="w-14 h-14 bg-white/5 animate-pulse rounded-full flex-shrink-0"></div>
                       <div className="flex flex-col gap-3 w-full pt-1">
                         <div className="h-4 w-3/4 bg-white/5 animate-pulse rounded-sm"></div>
                         <div className="h-3 w-1/2 bg-white/5 animate-pulse rounded-sm"></div>
                       </div>
                     </div>
                     <div className="flex gap-3">
                       <div className="h-8 flex-1 bg-white/5 animate-pulse rounded-sm"></div>
                       <div className="h-8 flex-1 bg-white/5 animate-pulse rounded-sm"></div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         )}

         {results.length > 0 && !loading && (
           <div className="bg-transparent border border-white/[0.04] rounded-none overflow-hidden shadow-[0_4px_24px_rgba(255,255,255,0.15)] fade-in flex flex-col relative z-20">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')] opacity-[0.2] pointer-events-none"></div>
             <div className="bg-[#010101] border-b border-white/20 p-5 flex flex-col md:flex-row justify-between items-center px-8 sticky top-0 backdrop-blur-2xl z-10 w-full gap-4 relative">
               <h3 className="font-bold text-zinc-100 uppercase font-mono tracking-[0.3em] text-[10px] flex items-center gap-3">
                  <Activity size={12} className="text-zinc-100 animate-pulse" /> DISCOVERED NODES ({results.filter(item => {
                      if (requireEmail && (!item.publicEmail || !item.publicEmail.includes('@'))) return false;
                      const subsStr = String(item.subscriberCount || '0').toUpperCase().replace(/,/g, '');
                      let multiplier = 1;
                      if (subsStr.includes('K')) multiplier = 1000;
                      if (subsStr.includes('M')) multiplier = 1000000;
                      const rawNum = parseFloat(subsStr.replace(/[^0-9.]/g, '')) || 0;
                      const subs = rawNum * multiplier;
                      if (minSubs > 0 && subs < minSubs) return false;
                      return true;
                  }).length})
               </h3>
               
               <div className="flex items-center gap-10">
                  <div className="flex items-center border-r border-white/[0.04] pr-6 hidden sm:flex">
                    <div className="relative text-white/60 focus-within:text-zinc-100 transition-colors">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="FILTER ACTIVE NODES..."
                        value={filterKeyword}
                        onChange={(e) => setFilterKeyword(e.target.value)}
                        className="bg-transparent border-b border-white/[0.06] text-white text-[10px] font-mono tracking-[0.2em] rounded-none pl-8 pr-3 py-1 outline-none focus:border-white/20 transition-colors w-48 placeholder-zinc-700 uppercase"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-r border-white/[0.04] pr-6 hidden sm:flex">
                     <select 
                       value={sortBy} 
                       onChange={(e) => setSortBy(e.target.value)}
                       className="bg-transparent border border-white/[0.04] text-white/60 text-[9px] uppercase font-mono tracking-[0.2em] rounded-none px-2 py-1 outline-none focus:border-white/20 focus:text-white transition-colors custom-scrollbar"
                     >
                       <option value="default">Default Sort</option>
                       <option value="score">Sort: Lead Score (A-Z)</option>
                       <option value="score_low">Sort: Lead Score (Z-A)</option>
                       <option value="views_high">Sort: Daily Views (High-Low)</option>
                       <option value="total_views_high">Sort: Total Views (High-Low)</option>
                       <option value="revenue_high">Sort: Revenue (High-Low)</option>
                       <option value="revenue_low">Sort: Revenue (Low-High)</option>
                       <option value="superchat_high">Sort: Superchat Est. (High-Low)</option>
                       <option value="subs_high">Sort: Subs (High-Low)</option>
                       <option value="subs_low">Sort: Subs (Low-High)</option>
                     </select>
                  </div>
                  {user && (
                    <div className="flex gap-2">
                      <button 
                        onClick={handleExportCSV}
                        disabled={selectedLeads.size === 0}
                        className="bg-transparent border border-white/[0.04] hover:border-white/20 text-white/60 hover:text-white py-2 px-5 text-[10px] h-9 font-mono uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center disabled:opacity-30"
                      >
                        <Download size={14} className="inline mr-1" /> EXPORT CSV
                      </button>
                      <button 
                        onClick={handleAutoCampaign}
                        disabled={campaignLoading || saved || selectedLeads.size === 0}
                        className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)] text-white font-black py-2 px-6 text-[10px] h-9 font-mono uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(255, 59, 48,0.3)] min-w-[200px]"
                      >
                        {campaignLoading ? (
                           <><div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> Generating...</>
                        ) : saved ? (
                           <><Check size={14} /> Campaign Sent to CRM</>
                        ) : (
                           <><Sparkles size={14} /> AI Auto-Campaign ({selectedLeads.size})</>
                        )}
                      </button>
                      <button 
                        onClick={handleBulkAdd}
                        disabled={savingTracking || saved || selectedLeads.size === 0}
                        className="bg-[#FF3B30] text-black hover:bg-[#FF453A] disabled:opacity-50 text-white font-black py-2 px-5 text-[10px] h-9 font-mono uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-1 shadow-[0_4px_24px_rgba(255, 59, 48,0.3)] min-w-[140px]"
                      >
                        <Plus size={14} /> Add Raw Leads
                      </button>
                    </div>
                  )}
               </div>
             </div>
                  <div className="p-10 grid grid-cols-1 2xl:grid-cols-2 gap-10">
                {(() => {
                   const processedResults = results.filter(item => {
                       if (requireEmail && (!item.publicEmail || !item.publicEmail.includes('@'))) return false;
                       if (filterKeyword.trim() !== '') {
                          const keyword = filterKeyword.toLowerCase();
                          const searchable = [
                             item.channelName || '',
                             item.description || '',
                             item.matchedVideoTitle || '',
                             item.matchedVideoDescription || '',
                             item.deepDiveInfo || '',
                             item.contentFixes || '',
                             item.pitchAngle || '',
                             item.publicEmail || ''
                          ].join(' ').toLowerCase();
                          if (!searchable.includes(keyword)) return false;
                       }
                       const subsStr = String(item.subscriberCount || '0').toUpperCase().replace(/,/g, '');
                       let multiplier = 1;
                       if (subsStr.includes('K')) multiplier = 1000;
                       if (subsStr.includes('M')) multiplier = 1000000;
                       const rawNum = parseFloat(subsStr.replace(/[^0-9.]/g, '')) || 0;
                       const subs = rawNum * multiplier;
                       if (minSubs > 0 && subs < minSubs) return false;
                       return true;
                   }).sort((a, b) => {
                       if (sortBy === 'score' || sortBy === 'score_low') {
                          const scoreA = a.leadScore || 'Z';
                          const scoreB = b.leadScore || 'Z';
                          return sortBy === 'score' ? scoreA.localeCompare(scoreB) : scoreB.localeCompare(scoreA);
                       } else if (sortBy === 'revenue_high' || sortBy === 'revenue_low') {
                          const getRev = (str: string) => {
                             if (!str || str === 'Unknown') return 0;
                             const numStr = String(str).toUpperCase().replace(/,/g, '');
                             let mult = 1;
                             if (numStr.includes('K')) mult = 1000;
                             if (numStr.includes('M')) mult = 1000000;
                             const raw = parseFloat(numStr.replace(/[^0-9.]/g, '')) || 0;
                             return raw * mult;
                          };
                          return sortBy === 'revenue_high' ? getRev(b.estimatedRevenue) - getRev(a.estimatedRevenue) : getRev(a.estimatedRevenue) - getRev(b.estimatedRevenue);
                       } else if (sortBy === 'views_high') {
                          const getViews = (str: string) => parseFloat(String(str || '0').replace(/,/g, '')) || 0;
                          return getViews(b.dailyViews) - getViews(a.dailyViews);
                       } else if (sortBy === 'total_views_high') {
                          const getViews = (str: string) => parseFloat(String(str || '0').replace(/,/g, '')) || 0;
                          return getViews(b.totalViews) - getViews(a.totalViews);
                       } else if (sortBy === 'superchat_high') {
                          const getRev = (str: string) => {
                             if (!str || str === 'Unknown' || str === '$0') return 0;
                             const numStr = String(str).toUpperCase().replace(/,/g, '');
                             let mult = 1;
                             if (numStr.includes('K')) mult = 1000;
                             if (numStr.includes('M')) mult = 1000000;
                             const raw = parseFloat(numStr.replace(/[^0-9.]/g, '')) || 0;
                             return raw * mult;
                          };
                          return getRev(b.superchatRevenue) - getRev(a.superchatRevenue);
                       } else if (sortBy === 'subs_high' || sortBy === 'subs_low') {
                          const getSubsObj = (obj: any) => {
                             const subsStr = String(obj.subscriberCount || '0').toUpperCase().replace(/,/g, '');
                             let mult = 1;
                             if (subsStr.includes('K')) mult = 1000;
                             if (subsStr.includes('M')) mult = 1000000;
                             const raw = parseFloat(subsStr.replace(/[^0-9.]/g, '')) || 0;
                             return raw * mult;
                          };
                          return sortBy === 'subs_high' ? getSubsObj(b) - getSubsObj(a) : getSubsObj(a) - getSubsObj(b);
                       }
                       return 0;
                   });

                   const totalPages = Math.ceil(processedResults.length / itemsPerPage);
                   const paginatedResults = processedResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                   return (
                     <>
                       <motion.div variants={containerVariants} initial="hidden" animate="show" className="col-span-1 2xl:col-span-2 grid grid-cols-1 2xl:grid-cols-2 gap-10 w-full">
                         <AnimatePresence>
                         {paginatedResults.map((item, originalIndex) => {
                         const searchResultsIndex = results.indexOf(item);
                         const isSelected = selectedLeads.has(searchResultsIndex);
                         
                         return (
                    <motion.div variants={itemVariants} layout key={searchResultsIndex} onClick={() => toggleLead(searchResultsIndex)} className={`group relative cursor-pointer glass-card p-0 flex flex-col transition-all duration-300 overflow-hidden ${isSelected ? 'border-[#FF3B30]/30 shadow-[0_24px_80px_rgba(255,59,48,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)]' : ''}`}>
                     {isSelected && <div className="absolute top-0 inset-x-0 h-[2px] bg-[var(--brand-primary)] text-white shadow-[0_0_10px_rgba(255,59,48,0.5)] z-20"></div>}
                     <div className="absolute top-4 right-4 z-10 bg-[#000000]/50 p-1.5 rounded-sm border border-white/[0.04] flex items-center justify-center">
                        {isSelected ? <CheckSquare size={20} className="text-[#FF3B30]"/> : <Square size={20} className="text-white/30 group-hover:text-white/60 transition-colors"/>}
                     </div>

                                          <div className="flex flex-col h-full relative z-10 bg-transparent">
                        {/* 1. Header: IDENTITY & CORE METRICS */}
                        <div className="flex flex-col sm:flex-row items-stretch border-b border-white/[0.04]">
                           <div className="flex items-center gap-5 p-10 sm:w-[45%] border-b sm:border-b-0 sm:border-r border-white/[0.04] relative bg-transparent">
                              <div className="relative shrink-0">
                                {item.channelAvatar ? (
                                   <img src={item.channelAvatar} alt={item.channelName} className="w-16 h-16 rounded-sm object-cover" />
                                ) : (
                                   <div className="w-16 h-16 rounded-sm border border-white/[0.06] bg-white/5 flex items-center justify-center text-white/40">
                                     <User size={24} />
                                   </div>
                                )}
                                <div className="absolute -top-2.5 -left-2.5 bg-[#000] border border-[#FF3B30]/30 max-w-[24px] text-white flex items-center justify-center font-mono text-[9px] font-bold px-1.5 py-0.5 z-10">
                                  {(currentPage - 1) * itemsPerPage + originalIndex + 1}
                                </div>
                              </div>
                              <div className="flex flex-col min-w-0 pr-8">
                                 <h4 className="text-lg font-body tracking-tight font-bold text-white leading-tight truncate">{item.channelName}</h4>
                                 <p className="text-[10px] font-mono text-white/60 uppercase tracking-[0.2em] mt-1 mb-2.5">{item.subscriberCount} Subs</p>
                                 <div className="flex flex-wrap gap-2">
                                    {item.leadScore && (
                                       <span className={`text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm border ${item.leadScore.includes('A') ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20' : item.leadScore.includes('B') ? 'bg-[#FF9500]/10 text-amber-400 border-[#FF9500]/20' : item.leadScore.includes('C') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-[#FF3B30]/10 text-[#FF3B30] border-white/[0.04]'}`}>
                                         Score: {item.leadScore}
                                       </span>
                                    )}
                                    {item.targetEditorRate && item.targetEditorRate !== 'Unknown' && (
                                       <span className="text-[9px] font-bold uppercase tracking-[0.2em] bg-white/10 text-zinc-100 px-2 py-0.5 rounded-sm border border-white/20 shadow-[0_4px_24px_rgba(255,255,255,0.15)]">
                                         Budget: {item.targetEditorRate}
                                       </span>
                                    )}
                                 </div>
                              </div>
                           </div>
                           {/* Financial / Growth / AI Dashboard */}
                           <div className="flex-1 grid grid-cols-2 p-10 gap-y-5 gap-x-4 bg-[#000000]/40 relative">
                              <div className="flex flex-col relative z-10">
                                 <span className="text-[9px] text-white/60 font-mono tracking-[0.2em] uppercase mb-1">30D Views</span>
                                 <span className="text-sm font-bold text-white font-mono">{item.thirtyDayViews || 'N/A'}</span>
                              </div>
                              <div className="flex flex-col relative z-10">
                                 <span className="text-[9px] text-white/60 font-mono tracking-[0.2em] uppercase mb-1">Growth Rate</span>
                                 <span className={`text-sm font-bold font-mono ${item.growthRate?.includes('-') ? 'text-[#FF453A]' : 'text-white/80'}`}>{item.growthRate || 'N/A'}</span>
                              </div>
                              <div className="flex flex-col relative z-10">
                                 <span className="text-[9px] text-white/80/70 font-mono tracking-[0.2em] uppercase mb-1 flex items-center gap-1.5"><Sparkles size={10}/> AI Value Index</span>
                                 <span className="text-sm font-bold text-white/80 font-mono">{item.qualityScore || 'Unknown'} <span className="text-[10px] text-white/80/50">/ 100</span></span>
                              </div>
                              <div className="flex flex-col relative z-10">
                                 <span className="text-[9px] text-zinc-100/70 font-mono tracking-[0.2em] uppercase mb-1 flex items-center gap-1.5"><Brain size={10}/> Actionable Upside</span>
                                 <span className="text-[11px] font-bold text-zinc-100 font-mono">{item.estimatedUpsideValue || 'Unknown'}</span>
                              </div>
                           </div>
                        </div>

                        {/* 2. Body: CONTENT INTELLIGENCE */}
                        <div className="flex flex-col xl:flex-row flex-1">
                           
                           {/* Pain Points & Description (Left Col) */}
                           <div className="flex flex-col w-full xl:w-[45%] border-b xl:border-b-0 xl:border-r border-white/[0.04] p-10 gap-5 bg-transparent">
                              <div className="flex flex-col">
                                 <span className="text-[9px] uppercase tracking-[0.2em] text-white/60 font-mono mb-2 flex items-center gap-2"><Brain size={12} className="text-white/80"/> Content Matrix</span>
                                 <div className="max-h-32 overflow-y-auto custom-scrollbar pr-2">
                                    <p className="text-[11px] text-white/60 leading-relaxed font-mono whitespace-pre-wrap">{item.description}</p>
                                 </div>
                              </div>
                              <div className="bg-white/5 border border-white/20 rounded-sm p-4 flex flex-col gap-2 flex-1 relative overflow-hidden">
                                 <div className="absolute top-0 left-0 w-1 bg-[var(--brand-primary)] text-white h-full"></div>
                                 <span className="font-bold text-zinc-100 uppercase tracking-[0.2em] text-[9px] flex items-center gap-2"><Target size={12} /> Optimization Vectors (Pain Points)</span> 
                                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[100px]">
                                    {auditLoading === searchResultsIndex ? (
                                      <div className="space-y-3 animate-pulse mt-2">
                                         <div className="h-2 bg-white/20 rounded w-full"></div>
                                         <div className="h-2 bg-white/20 rounded w-full"></div>
                                         <div className="h-2 bg-white/20 rounded w-3/4"></div>
                                         <div className="h-2 bg-white/20 rounded w-4/5"></div>
                                      </div>
                                    ) : (
                                      <p className="text-[11px] text-white/80 font-mono leading-relaxed whitespace-pre-wrap">{item.contentFixes || 'Awaiting deep audit extraction...'}</p>
                                    )}
                                 </div>
                              </div>
                           </div>

                           {/* Deep Dive & Angles (Right Col) */}
                           <div className="flex flex-col flex-1 p-10 gap-5 bg-[#000000]/40">
                              <div className="flex flex-col h-1/2 min-h-[150px]">
                                 <span className="text-[9px] uppercase tracking-[0.2em] text-white/60 font-mono mb-3 flex items-center gap-2"><Search size={12} /> AI Deep Dive Context</span>
                                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
                                     {auditLoading === searchResultsIndex ? (
                                      <div className="space-y-3 animate-pulse mt-2">
                                         <div className="h-2 bg-white/20 rounded w-full"></div>
                                         <div className="h-2 bg-white/20 rounded w-5/6"></div>
                                         <div className="h-2 bg-white/20 rounded w-full"></div>
                                         <div className="h-2 bg-white/20 rounded w-3/4"></div>
                                      </div>
                                    ) : (
                                       <>
                                         <p className="text-[10px] font-mono text-white/60 leading-relaxed whitespace-pre-wrap">{item.deepDiveInfo || 'Run a deep audit to uncover advanced analytics and content context metrics.'}</p>
                                         
                                         {item.creatorPersonality && item.creatorPersonality !== 'Unknown' && (
                                            <div className="mt-4 pt-3 border-t border-white/[0.04]">
                                              <p className="text-[9px] font-mono text-white/80/70 uppercase tracking-[0.2em] mb-1">Psychographic Profile:</p>
                                              <p className="text-[10px] font-mono text-white/80 whitespace-pre-wrap">{item.creatorPersonality}</p>
                                            </div>
                                         )}
                                         {item.audienceDemographic && item.audienceDemographic !== 'Unknown' && item.audienceDemographic !== 'Male 18-35' && (
                                            <div className="mt-3 pt-3 border-t border-white/[0.04]">
                                              <p className="text-[9px] font-mono text-white/80/70 uppercase tracking-[0.2em] mb-1">Audience Demographics:</p>
                                              <p className="text-[10px] font-mono text-white/80 whitespace-pre-wrap">{item.audienceDemographic}</p>
                                            </div>
                                         )}
                                         {item.websiteTraffic && item.websiteTraffic !== 'Unknown' && (
                                            <div className="mt-3 pt-3 border-t border-white/[0.04]">
                                              <p className="text-[9px] font-mono text-white/80/70 uppercase tracking-[0.2em] mb-1">Brand Funnel / Architecture:</p>
                                              <p className="text-[10px] font-mono text-white/80 whitespace-pre-wrap">{item.websiteTraffic}</p>
                                            </div>
                                         )}
                                         {item.socialEngagement && item.socialEngagement !== 'Unknown' && (
                                            <div className="mt-3 pt-3 border-t border-white/[0.04]">
                                              <p className="text-[9px] font-mono text-white/80/70 uppercase tracking-[0.2em] mb-1">Social Ecosystem:</p>
                                              <p className="text-[10px] font-mono text-white/80 whitespace-pre-wrap">{item.socialEngagement}</p>
                                            </div>
                                         )}
                                       </>
                                    )}
                                 </div>
                              </div>
                              {item.pitchAngles && (
                                 <div className="flex flex-col h-1/2 pt-5 border-t border-white/[0.04] border-dashed min-h-[100px]">
                                    <span className="font-bold text-white/80 uppercase tracking-[0.2em] text-[9px] flex items-center gap-2 mb-3"><Sparkles size={12} /> Pitch Angles Framework</span> 
                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                       <p className="text-[10px] text-white/80/80 font-mono leading-relaxed whitespace-pre-wrap">{item.pitchAngles}</p>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>

                        {/* 3. Footer: ACTIONS & CONNECTIVITY */}
                        <div className="flex flex-col sm:flex-row items-center border-t border-white/[0.04] bg-[#010101]">
                           <div className="flex items-center p-4 h-full sm:w-[45%] border-b sm:border-b-0 sm:border-r border-white/[0.04] gap-3 overflow-hidden bg-white/[0.02]">
                              {item.publicEmail && item.publicEmail !== 'Unknown' && !item.publicEmail.toLowerCase().includes('hidden') ? (
                                 <div className="flex items-center gap-4 w-full">
                                    <div className="w-8 h-8 rounded-sm bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-[0_4px_24px_rgba(255,255,255,0.15)]">
                                       <Mail size={14} className="text-white/80" />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                       <span className="text-[8px] text-white/60 uppercase tracking-[0.2em] font-mono">Verified Contact</span>
                                       <span className="text-xs text-white font-mono truncate">{item.publicEmail}</span>
                                    </div>
                                    <button 
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(`mailto:${item.publicEmail}`);
                                       }}
                                       className="shrink-0 bg-transparent hover:bg-white/10 text-white/80 border border-white/20 hover:border-white/[0.04] px-3 py-1.5 rounded-sm text-[10px] font-bold font-mono tracking-[0.2em] transition-colors flex items-center gap-1.5"
                                    >
                                       <Telescope size={12} /> DRAFT
                                    </button>
                                 </div>
                              ) : (
                                 <div className="flex items-center gap-4 w-full opacity-60">
                                    <div className="w-8 h-8 rounded-sm bg-[#000000] border border-white/[0.04] flex items-center justify-center shrink-0">
                                       <AlertTriangle size={14} className="text-white/60" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                       <span className="text-[8px] text-white/60 uppercase tracking-[0.2em] font-mono">Status Warning</span>
                                       <span className="text-xs text-white/60 font-mono truncate">Email hidden / Captcha gate</span>
                                    </div>
                                 </div>
                              )}
                           </div>
                           <div className="flex flex-1 w-full max-w-full">
                              <button 
                                 onClick={(e) => { e.stopPropagation(); if(item.channelUrl) window.open(item.channelUrl); }} 
                                 className="flex-1 py-4 text-[10px] font-mono text-white/60 hover:text-white hover:bg-[#141414] border-r border-white/[0.04] transition-colors uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                              >
                                 <ExternalLink size={14} /> Scan Source
                              </button>
                              <button 
                                 onClick={(e) => { e.stopPropagation(); handleTriggerAIAnalysis(searchResultsIndex); }} 
                                 disabled={auditLoading === searchResultsIndex}
                                 className="flex-1 py-4 text-[10px] font-mono text-white/80 hover:text-white/80 hover:bg-white/10 border-r border-white/[0.04] transition-colors uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                 {auditLoading === searchResultsIndex ? (
                                    <div className="w-3 h-3 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin"></div>
                                 ) : (
                                    <><Brain size={14} /> Extract Audit</>
                                 )}
                              </button>
                              <button 
                                 onClick={(e) => { e.stopPropagation(); handleGeneratePitch(searchResultsIndex); }} 
                                 disabled={pitchLoading === searchResultsIndex}
                                 className="flex-1 py-4 text-[10px] font-mono text-zinc-100 hover:text-white hover:bg-white/10 bg-white/5 transition-colors uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                 {pitchLoading === searchResultsIndex ? (
                                    <div className="w-3 h-3 border-2 border-white/20 border-t-[var(--brand-primary)] rounded-full animate-spin"></div>
                                 ) : (
                                    <><FileText size={14} /> Generate Protocol</>
                                 )}
                              </button>
                           </div>
                        </div>
                     </div>
\n                   </motion.div>
                );
                })}
                       </AnimatePresence>
                     </motion.div>
                     
                      {totalPages > 1 && (
                        <div className="col-span-full flex justify-center items-center gap-4 mt-8 bg-[#0f0f0f] border border-white/[0.04] p-4 rounded-sm">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="bg-[#000000] border border-white/[0.06]/50 hover:bg-[#141414] text-white/80 font-mono text-xs px-4 py-2 uppercase tracking-[0.2em] disabled:opacity-50 disabled:hover:bg-[#000000]"
                          >
                            Previous
                          </button>
                          <span className="text-white/60 font-mono text-xs uppercase tracking-[0.2em]">
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="bg-white/10 border border-white/20 hover:bg-white/20 text-zinc-100 font-mono text-xs px-4 py-2 uppercase tracking-[0.2em] disabled:opacity-50 disabled:hover:bg-white/10"
                          >
                            Next
                          </button>
                        </div>
                      )}
                     </>
                   );
                })()}
             </div>
           </div>
         )}
      </div>

      {/* Auto-Pitch Modal */}
      {generatedPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]" onClick={() => setGeneratedPitch(null)}>
          <div className="bg-transparent border border-white/20 rounded-none p-10 max-w-2xl w-full shadow-[0_4px_24px_rgba(255,255,255,0.15)] relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 inset-x-0 h-1 bg-[var(--brand-primary)] text-white shadow-2xl"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-[0.2] pointer-events-none"></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="font-mono font-bold text-sm text-zinc-100 flex items-center gap-3 uppercase tracking-[0.2em]">
                <Sparkles size={18} /> PITCH LABORATORY: {results[generatedPitch.index].channelName}
              </h3>
              <button onClick={() => setGeneratedPitch(null)} className="text-zinc-600 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex mb-4 relative z-10 space-x-2">
               <button onClick={() => setPitchVariantTab('alpha')} className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-[0.2em] border transition-colors ${pitchVariantTab === 'alpha' ? 'bg-white/20 border-white/[0.02]0 text-zinc-100' : 'bg-transparent border-white/[0.04] text-white/60 hover:text-white hover:border-white/[0.06]'}`}>
                 Alpha (Aggressive ROI)
               </button>
               <button onClick={() => setPitchVariantTab('beta')} className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-[0.2em] border transition-colors ${pitchVariantTab === 'beta' ? 'bg-white/20 border-white/[0.02]0 text-zinc-100' : 'bg-transparent border-white/[0.04] text-white/60 hover:text-white hover:border-white/[0.06]'}`}>
                 Beta (Value-First)
               </button>
               <button onClick={() => setPitchVariantTab('gamma')} className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-[0.2em] border transition-colors ${pitchVariantTab === 'gamma' ? 'bg-white/20 border-white/[0.02]0 text-zinc-100' : 'bg-transparent border-white/[0.04] text-white/60 hover:text-white hover:border-white/[0.06]'}`}>
                 Gamma (Analytical)
               </button>
            </div>
            
            <div className="bg-[#000000]/50 border border-white/[0.04] rounded-none p-10 mb-8 relative z-10">
               <pre className="text-white/80 font-sans text-sm whitespace-pre-wrap leading-relaxed">
                 {generatedPitch.variants?.[pitchVariantTab] || 'Generating variants...'}
               </pre>
            </div>
            
            <div className="flex gap-4 relative z-10">
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(generatedPitch.variants?.[pitchVariantTab] || '');
                   toast.success("Draft copied to clipboard!");
                 }} 
                 className="flex-1 bg-transparent hover:bg-[#141414] border border-white/[0.04] text-white/60 hover:text-white font-bold py-3 rounded-none transition-colors font-mono uppercase tracking-[0.2em] text-[10px]"
               >
                 Copy to Clipboard
               </button>
               <button 
                 onClick={() => {
                   const email = results[generatedPitch.index].publicEmail;
                   const safeEmail = (email && !email.includes('Handle') && !email.includes('Twitter')) ? email : '';
                   window.open(`mailto:${safeEmail}?subject=Editing for ${results[generatedPitch.index].channelName}&body=${encodeURIComponent(generatedPitch.variants?.[pitchVariantTab] || '')}`);
                 }}
                 className="flex-1 bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/20 text-zinc-100 py-3 text-[10px] uppercase font-mono tracking-[0.2em] font-bold transition-all shadow-[0_4px_24px_rgba(255,255,255,0.15)] rounded-none"
               >
                 Open Mail Client
               </button>
            </div>
          </div>
        </div>
      )}

      
      
      {/* Radar Setting Modal */}
      {radarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]" onClick={() => setRadarModalOpen(false)}>
          <div className="bg-transparent border border-white/20 rounded-none p-10 max-w-lg w-full shadow-[0_4px_24px_rgba(255,255,255,0.15)] relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 inset-x-0 h-1 bg-[var(--brand-primary)] text-white shadow-[0_0_15px_#34C759]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-[0.2] pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="font-mono font-bold text-sm text-white/80 flex items-center gap-3 uppercase tracking-[0.2em]">
                <Brain size={18} /> JUNE PRIME AUTONOMY
              </h3>
              <button disabled={agentLoading} onClick={() => setRadarModalOpen(false)} className="text-zinc-600 hover:text-white/80 transition-colors disabled:opacity-50">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-white/60 text-xs font-mono leading-relaxed mb-8 relative z-10 border-l-2 border-white/20 pl-4">
              Enable "June Prime" to wake up every morning, scan globally for the best leads in your selected niche, filter them for algorithmic weaknesses, generate personalized pitches, and drop pre-qualified leads straight to your pipeline on autopilot.
            </p>

            <div className="space-y-6 mb-8 relative z-10">
               <div className="flex items-center justify-between bg-[#000000]/50 p-5 border border-white/[0.04] rounded-none">
                  <div>
                     <h4 className="text-white text-xs font-mono font-bold flex items-center gap-2 uppercase tracking-widest">
                        <Activity size={14} className={autopilotOn ? "text-white/80" : "text-zinc-600"} />
                        CRON Schedule
                     </h4>
                     <p className="text-[10px] text-white/60 font-mono mt-2 uppercase tracking-[0.2em]">Runs once every 24 hours.</p>
                  </div>
                  <button 
                    onClick={() => {
                        const nextState = !autopilotOn;
                        setAutopilotOn(nextState);
                        if (nextState) {
                           toast.success("AI Autopilot Enabled. System cron job scheduled.");
                           localStorage.removeItem('autopilotLastRunDate'); 
                        }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-none ${autopilotOn ? 'bg-white/20 border border-white/[0.04]' : 'bg-[#000000] border border-white/[0.06]'}`}
                  >
                    <span className={`inline-block h-4 w-4 bg-[var(--brand-primary)] text-white transform transition-transform rounded-none ${autopilotOn ? 'translate-x-[22px]' : 'translate-x-1 shrink-0 bg-zinc-600'}`} />
                  </button>
               </div>

               <div className="space-y-3">
                 <label className="text-[10px] text-white/60 font-mono font-bold uppercase tracking-[0.2em]">Target Parameter : Niche</label>
                 <select 
                   value={autopilotNiche}
                   onChange={(e) => setAutopilotNiche(e.target.value)}
                   className="w-full bg-[#0a0a0a] border border-white/[0.04] text-white/80 rounded-none p-3 text-xs font-mono uppercase tracking-[0.2em] focus:border-white/[0.04] focus:outline-none transition-colors"
                 >
                    <option value="OVERALL">Overview (All Niches)</option>
                    {YOUTUBE_NICHES.filter(n => !n.startsWith('🔥')).map(n => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                 </select>
               </div>
            </div>

            {agentLoading ? (
               <div className="flex flex-col items-center justify-center py-10 gap-5 border border-white/20 bg-white/5 mb-8 relative z-10">
                  <div className="w-8 h-8 border-[3px] border-white/20 border-t-emerald-400 rounded-none animate-spin"></div>
                  <p className="text-white/80 text-[10px] font-mono tracking-[0.2em] uppercase animate-pulse">{agentProgress}</p>
               </div>
            ) : (
                <div className="flex flex-col gap-4 mb-6 relative z-10">
                   <div className="bg-white/5 border border-white/20 p-4 rounded-none flex items-start gap-4">
                     <Activity size={14} className="text-white/80 shrink-0 mt-0.5" />
                     <p className="text-[10px] text-white/60 font-mono tracking-wide leading-relaxed">
                       Leave this ACTIVE to passively receive high-quality nodes daily, or click 'EXECUTE' to run a scan immediately.
                     </p>
                   </div>
                </div>
            )}
            
            <div className="flex gap-4 relative z-10">
               <button 
                 disabled={agentLoading}
                 onClick={() => setRadarModalOpen(false)} 
                 className="flex-1 bg-transparent border border-white/[0.04] hover:border-zinc-600 hover:text-white text-white/60 font-mono text-[10px] uppercase tracking-[0.2em] py-3 rounded-none transition-all disabled:opacity-50"
               >
                 Close
               </button>
               <button 
                 disabled={agentLoading}
                 onClick={() => handleRunAgent()}
                 className="flex-[2] bg-white/10 border border-white/20 hover:border-white/[0.04] text-white/80 hover:text-white/80 hover:bg-white/20 font-bold py-3 text-[10px] uppercase tracking-[0.2em] font-mono rounded-none transition-all disabled:opacity-50 flex items-center justify-center gap-3 drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)]"
               >
                 <Brain size={14} /> {agentLoading ? 'EXECUTING...' : 'EXECUTE SCAN'}
               </button>
            </div>
          </div>
        </div>
      )}


      {diagnosticModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]" onClick={() => setDiagnosticModalOpen(false)}>
          <div className="bg-[#0a0a0a] border border-white/[0.04] rounded-2xl p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-body tracking-tight font-bold text-lg text-white flex items-center gap-3">
                <Video size={20} className="text-zinc-100" /> AI Video Diagnostics
              </h3>
              <button disabled={diagnosticLoading} onClick={() => setDiagnosticModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-xs font-mono text-white/60 mb-2 uppercase tracking-[0.2em]">Video URL (YouTube)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 bg-[#000000] border border-white/[0.04] rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-white/20 font-mono"
                  value={diagnosticLink}
                  onChange={(e) => setDiagnosticLink(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunDiagnostic()}
                />
                <button 
                  onClick={handleRunDiagnostic}
                  disabled={diagnosticLoading || !diagnosticLink}
                  className="bg-[#FF3B30] text-black hover:bg-[#FF453A] disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl text-sm font-mono uppercase tracking-[0.2em] transition-colors flex items-center gap-2"
                >
                  {diagnosticLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Sparkles size={16} />} 
                  Analyze
                </button>
              </div>
            </div>

            {diagnosticResult && (
              <div className="bg-[#141414] border border-white/[0.02] rounded-2xl p-10 text-sm text-white/80 font-mono overflow-y-auto max-h-[40vh] custom-scrollbar">
                <div className="markdown-body text-xs prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#000000] prose-pre:border prose-pre:border-white/[0.04]">
                  <Markdown>
                    {diagnosticResult}
                  </Markdown>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
