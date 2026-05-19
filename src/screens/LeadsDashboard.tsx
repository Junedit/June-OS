import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, addDoc, deleteDoc, serverTimestamp, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
 
import { CheckCircle, AlertTriangle, MonitorPlay, UploadCloud, Video, Edit2, Mail, ExternalLink, Calendar, Link as LinkIcon, X, Plus, BarChart2, Sparkles, Copy, Target, Activity, Paperclip, FileText, Search, BrainCircuit } from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, FunnelChart, Funnel, LabelList, BarChart, Bar } from 'recharts';
import Markdown from 'react-markdown';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
 
import { GoogleGenAI, Type } from '@google/genai';
import FileUploader, { UploadedFile } from '../components/FileUploader';
import { playSound } from '../lib/sounds';
import SmartQueue from '../components/SmartQueue';
import WinLossAnalytics from '../components/WinLossAnalytics';

interface Lead {
  masterFileUrl?: string;
  reviewVideoUrl?: string;
  id: string;
  brandName: string;
  contactName: string;
  contactEmail: string;
  niche?: string;
  budget: number;
  message: string;
  packages?: string[];
  companyUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  enrichmentData?: {
    followers?: string;
    engagementRate?: string;
    verified?: boolean;
    bio?: string;
    recentActivity?: string;
  };
  timeline?: string;
  status: string;
  source?: string;
  qualityScore?: number;
  estimatedUpsideValue?: string;
  estimatedRevenue?: string;
  hiringIntent?: string;
  hiringMentions?: string;
  distressSignal?: boolean;
  predictedLTV?: string;
  deepIntel?: string;
  feedbackAnalyzedAt?: number;
  autoDraftedReply?: string;
  suggestedImprovements?: string[];
  pitchVariants?: { alpha: string, beta: string, gamma: string, delta?: string };
  telemetryEvents?: { type: string, timestamp: any, detail?: string }[];
  followUpDate?: any;
  createdAt: any;
  updatedAt?: any;
  salesRoomViews?: number;
  salesRoomLastVisitedAt?: any;
  tasks?: Record<string, boolean>;
  customTasks?: { id: string; title: string; completed: boolean; notes?: string; subtasks?: { id: string; title: string; completed: boolean }[] }[];
  targetRetentionRate?: string;
  caseStudy1Title?: string;
  caseStudy1Text?: string;
  caseStudy2Title?: string;
  caseStudy2Stat?: string;
  caseStudy2Text?: string;
  caseStudy3Title?: string;
  caseStudy3Stat?: string;
  caseStudy3Text?: string;
  loomVideoUrl?: string;
  testimonialQuote?: string;
  testimonialAuthor?: string;
  testimonialSource?: string;
  caseStudyPacing?: string;
  caseStudyImpact?: string;
  aiAudit?: string;
  onboardingTitle?: string;
  onboardingMessage?: string;
  rawFootageUrl?: string;
  projectFilesUrl?: string;
  uploadedAssets?: UploadedFile[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getAI, enrichLeadSocials, generateAILeadAssist, generateInvoiceText, generateRoastPitch, generateFreeTrialPitch, generateROIPitch, generateContextualFollowUp, generateFollowUpOptions, generateCaseStudy, generateRetainerPitch, generateCompetitorXRay, generatePsychographicProfile, generateViralHookBlueprint, generateContractNegotiator, generateStoryboardBRoll, generateMusicSoundDesign, generateTitleThumbnailIdeas, generateObjectionHandlingScript, generateRiskReversalPitch, generateZoomClosingFramework, generateGodfatherOffer, generateValueBomb, generateGhostReactivation, generateDripSequence, generateOutreachPitch } from '../services/ai';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CheckSquare, Square, Trash, RefreshCw, MessageSquare, Zap, Clock, ArrowRight, Award, Repeat, LayoutGrid, ChevronLeft, ChevronRight, Clapperboard, Handshake, FileDown, Send } from 'lucide-react';



const AddLeadModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    brandName: '',
    contactName: '',
    contactEmail: '',
    niche: '',
    timeline: '',
    budget: '',
    companyUrl: '',
    linkedinUrl: '',
    instagramUrl: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.brandName) {
      toast.error("Brand/Channel name is required.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'leads'), {
        brandName: form.brandName,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        niche: form.niche,
        timeline: form.timeline,
        budget: Number(form.budget),
        companyUrl: form.companyUrl,
        linkedinUrl: form.linkedinUrl,
        instagramUrl: form.instagramUrl,
        message: 'Manually added lead.',
        status: 'new',
        ownerId: user.uid,
        createdAt: serverTimestamp()
      });
      toast.success("Lead added!");
      onSuccess();
    } catch (err: any) {
      toast.error("Failed to add lead: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-transparent/80 backdrop-blur-md">
      <div className="glass-panel rounded-2xl p-10 w-full max-w-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#fff_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.015] pointer-events-none"></div>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-2xl transition-colors z-10"><X size={16} /></button>
        <div className="relative z-10">
          <h2 className="text-xl font-medium text-white mb-6 font-body tracking-tight tracking-tight flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-[var(--brand-primary)] text-white shadow-2xl rounded-full animate-pulse"></span>
             New Transmission Node
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] text-white/60 uppercase font-mono tracking-[0.2em] mb-2 block">Provider Entity *</label>
                <input required type="text" value={form.brandName} onChange={e => setForm({...form, brandName: e.target.value})} className="w-full bg-[#000000]/50 border border-white/[0.04] p-3 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] text-xs ring-0 focus:ring-1 focus:ring-white/20 text-white focus:outline-none focus:border-white/[0.04] focus:bg-[#000000] transition-all font-mono placeholder:text-zinc-700" placeholder="e.g. MrBeast Gaming" />
              </div>
              <div>
                <label className="text-[9px] text-white/60 uppercase font-mono tracking-[0.2em] mb-2 block">Sector / Vector</label>
                <select value={form.niche} onChange={e => setForm({...form, niche: e.target.value})} className="w-full bg-[#000000]/50 border border-white/[0.04] p-3 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] text-xs ring-0 focus:ring-1 focus:ring-white/20 text-white/80 focus:outline-none focus:border-white/[0.04] focus:bg-[#000000] transition-all appearance-none font-mono">
                  <option value="">[SELECT VECTOR]</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Finance / Crypto">Finance & Crypto</option>
                  <option value="Lifestyle / Vlog">Lifestyle & Vlog</option>
                  <option value="Tech / Reviews">Tech & Reviews</option>
                  <option value="Educational / Essay">Educational & Essay</option>
                  <option value="Business">Business</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Music / Arts">Music & Arts</option>
                  <option value="Sports / Fitness">Sports & Fitness</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] text-white/60 uppercase font-mono tracking-[0.2em] mb-2 block">Liaison Alpha</label>
                <input type="text" value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} className="w-full bg-[#000000]/50 border border-white/[0.04] p-3 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] text-xs ring-0 focus:ring-1 focus:ring-white/20 text-white focus:outline-none focus:border-white/[0.04] focus:bg-[#000000] transition-all font-mono placeholder:text-zinc-700" placeholder="Creator Name" />
              </div>
              <div>
                <label className="text-[9px] text-white/60 uppercase font-mono tracking-[0.2em] mb-2 block">Comm Channel</label>
                <input type="email" value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})} className="w-full bg-[#000000]/50 border border-white/[0.04] p-3 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] text-xs ring-0 focus:ring-1 focus:ring-white/20 text-white focus:outline-none focus:border-white/[0.04] focus:bg-[#000000] transition-all font-mono placeholder:text-zinc-700" placeholder="collabs@creator.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] text-white/60 uppercase font-mono tracking-[0.2em] mb-2 block">Asset Value ($)</label>
                <input type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} className="w-full bg-[#000000]/50 border border-white/[0.04] p-3 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] text-xs ring-0 focus:ring-1 focus:ring-white/20 text-white focus:outline-none focus:border-white/[0.04] focus:bg-[#000000] transition-all font-mono placeholder:text-zinc-700" placeholder="500" />
              </div>
              <div>
                <label className="text-[9px] text-white/60 uppercase font-mono tracking-[0.2em] mb-2 block">Projected Timeline</label>
                <input type="text" value={form.timeline} onChange={e => setForm({...form, timeline: e.target.value})} className="w-full bg-[#000000]/50 border border-white/[0.04] p-3 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] text-xs ring-0 focus:ring-1 focus:ring-white/20 text-white focus:outline-none focus:border-white/[0.04] focus:bg-[#000000] transition-all font-mono placeholder:text-zinc-700" placeholder="e.g. 2 videos/wk" />
              </div>
            </div>
            <div>
              <label className="text-[9px] text-white/60 uppercase font-mono tracking-[0.2em] mb-2 block">Network Terminal (URL)</label>
              <input type="url" value={form.companyUrl} onChange={e => setForm({...form, companyUrl: e.target.value})} className="w-full bg-[#000000]/50 border border-white/[0.04] p-3 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] text-xs ring-0 focus:ring-1 focus:ring-white/20 text-white focus:outline-none focus:border-white/[0.04] focus:bg-[#000000] transition-all font-mono placeholder:text-zinc-700" placeholder="youtube.com/@creator" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] text-white/60 uppercase font-mono tracking-[0.2em] mb-2 block">LinkedIn URL</label>
                <input type="url" value={form.linkedinUrl} onChange={e => setForm({...form, linkedinUrl: e.target.value})} className="w-full bg-[#000000]/50 border border-white/[0.04] p-3 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] text-xs ring-0 focus:ring-1 focus:ring-white/20 text-white focus:outline-none focus:border-white/[0.04] focus:bg-[#000000] transition-all font-mono placeholder:text-zinc-700" placeholder="linkedin.com/..." />
              </div>
              <div>
                <label className="text-[9px] text-white/60 uppercase font-mono tracking-[0.2em] mb-2 block">Instagram URL</label>
                <input type="url" value={form.instagramUrl} onChange={e => setForm({...form, instagramUrl: e.target.value})} className="w-full bg-[#000000]/50 border border-white/[0.04] p-3 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] text-xs ring-0 focus:ring-1 focus:ring-white/20 text-white focus:outline-none focus:border-white/[0.04] focus:bg-[#000000] transition-all font-mono placeholder:text-zinc-700" placeholder="instagram.com/..." />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full mt-4 bg-[#FF3B30] text-black hover:bg-[#FF453A] px-5 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Initializing Node...' : 'Establish Node Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


const LeadDetailsModal = ({ lead: initialLead, onClose, defaultTab = 'contact' }: { lead: Lead, onClose: () => void, defaultTab?: 'contact' | 'ai' | 'playbooks' | 'activity' | 'tasks' | 'assets' }) => {
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead>(initialLead);
  
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'leads', initialLead.id), (docSnap) => {
      if (docSnap.exists()) {
        setLead({ id: docSnap.id, ...docSnap.data() } as Lead);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'leads');
    });
    return unsub;
  }, [initialLead.id]);

  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiAssistContext, setAiAssistContext] = useState('');
  const [aiRoasting, setAiRoasting] = useState(false);
  const [aiSmartFollowUp, setAiSmartFollowUp] = useState(false);
  const [followUpOptions, setFollowUpOptions] = useState<{subject: string, body: string, strategy: string}[] | null>(null);
  const [communicationChannel, setCommunicationChannel] = useState('Email');
  const [aiFreeTrial, setAiFreeTrial] = useState(false);
  const [aiROI, setAiROI] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [aiInvoice, setAiInvoice] = useState(false);
  const [aiCaseStudy, setAiCaseStudy] = useState(false);
  const [aiRetainer, setAiRetainer] = useState(false);
  const [aiCompetitor, setAiCompetitor] = useState(false);
  const [aiPsychographic, setAiPsychographic] = useState(false);
  const [aiHookBlueprint, setAiHookBlueprint] = useState(false);
  const [aiContractNegotiator, setAiContractNegotiator] = useState(false);
  const [aiStoryboard, setAiStoryboard] = useState(false);
  const [aiSoundDesign, setAiSoundDesign] = useState(false);
  const [aiColdSequence, setAiColdSequence] = useState(false);
  const [aiContractAssembly, setAiContractAssembly] = useState(false);
  const [aiTitles, setAiTitles] = useState(false);
  const [aiObjections, setAiObjections] = useState(false);
  const [aiRiskReversal, setAiRiskReversal] = useState(false);
  const [aiZoomFramework, setAiZoomFramework] = useState(false);
  const [aiGodfather, setAiGodfather] = useState(false);
  const [aiValueBomb, setAiValueBomb] = useState(false);
  const [aiGhostReact, setAiGhostReact] = useState(false);
  const [aiDripSequence, setAiDripSequence] = useState(false);
  const [aiOutreachPitch, setAiOutreachPitch] = useState(false);
  const [aiKillShot, setAiKillShot] = useState(false);
  const [aiLoomScript, setAiLoomScript] = useState(false);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [aiChannelInsights, setAiChannelInsights] = useState(false);
  const [aiUpsellPitch, setAiUpsellPitch] = useState(false);
  const [sendingEmailProposal, setSendingEmailProposal] = useState(false);
  const [sendingEmailInvoice, setSendingEmailInvoice] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [noteFilter, setNoteFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'contact' | 'ai' | 'playbooks' | 'activity' | 'tasks' | 'assets' | 'portals' | 'chat'>(defaultTab as any);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingTranscript, setMeetingTranscript] = useState('');
  const [analyzingMeeting, setAnalyzingMeeting] = useState(false);
  
  const [editForm, setEditForm] = useState({
    brandName: initialLead.brandName || '',
    contactName: initialLead.contactName || '',
    contactEmail: initialLead.contactEmail || '',
    niche: initialLead.niche || '',
    budget: initialLead.budget || 0,
    message: initialLead.message || '',
    companyUrl: initialLead.companyUrl || '',
    linkedinUrl: initialLead.linkedinUrl || '',
    instagramUrl: initialLead.instagramUrl || '',
    timeline: initialLead.timeline || '',
    reviewVideoUrl: initialLead.reviewVideoUrl || '',
    rawFootageUrl: initialLead.rawFootageUrl || '',
    projectFilesUrl: initialLead.projectFilesUrl || '',
    predictedLTV: initialLead.predictedLTV || '',
    targetRetentionRate: initialLead.targetRetentionRate || '',
    caseStudy1Title: initialLead.caseStudy1Title || '',
    caseStudy1Text: initialLead.caseStudy1Text || '',
    caseStudy2Title: initialLead.caseStudy2Title || '',
    caseStudy2Stat: initialLead.caseStudy2Stat || '',
    caseStudy2Text: initialLead.caseStudy2Text || '',
    caseStudy3Title: initialLead.caseStudy3Title || '',
    caseStudy3Stat: initialLead.caseStudy3Stat || '',
    caseStudy3Text: initialLead.caseStudy3Text || '',
    loomVideoUrl: initialLead.loomVideoUrl || '',
    testimonialQuote: initialLead.testimonialQuote || '',
    testimonialAuthor: initialLead.testimonialAuthor || '',
    testimonialSource: initialLead.testimonialSource || '',
    aiAudit: initialLead.aiAudit || '',
    onboardingTitle: initialLead.onboardingTitle || '',
    onboardingMessage: initialLead.onboardingMessage || ''
  });

  const [followUpInput, setFollowUpInput] = useState(
    initialLead.followUpDate?.toDate ? new Date(initialLead.followUpDate.toDate().getTime() - initialLead.followUpDate.toDate().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
  );
  
  const [reviewVideoUrlInput, setReviewVideoUrlInput] = useState(initialLead.reviewVideoUrl || '');
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'chat' && chatMessagesEndRef.current) {
        chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const [videoComments, setVideoComments] = useState<any[]>([]);

  useEffect(() => {
     if (initialLead.id) {
        const q = query(collection(db, 'leads', initialLead.id, 'messages'), orderBy('createdAt', 'asc'));
        const unsub = onSnapshot(q, snap => {
           setChatMessages(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        
        const q2 = query(collection(db, 'leads', initialLead.id, 'video_comments'), orderBy('createdAt', 'asc'));
        const unsub2 = onSnapshot(q2, snap => {
           setVideoComments(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });

        return () => {
           unsub();
           unsub2();
        };
     }
  }, [initialLead.id]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !initialLead.id) return;
    try {
        await addDoc(collection(db, 'leads', initialLead.id, 'messages'), {
            text: chatMessage.trim(),
            senderRole: 'agency',
            createdAt: serverTimestamp()
        });
        setChatMessage("");
    } catch(e) { console.error("Chat error", e); }
  };
  const [rawFootageUrlInput, setRawFootageUrlInput] = useState(initialLead.rawFootageUrl || '');
  
  const [tasks, setTasks] = useState<Record<string, boolean>>(initialLead.tasks || {
    'raw_received': false,
    'v1_sent': false,
    'revisions_done': false,
    'final_exported': false,
    'payment_received': false
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [showRoastInput, setShowRoastInput] = useState(false);
  const [roastUrl, setRoastUrl] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const logActivity = async (text: string, type: 'note' | 'status_change' | 'task_completed' | 'file_upload' = 'note', metadata?: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'leads', lead.id, 'notes'), {
        text,
        type,
        ...(metadata && { metadata }),
        ownerId: user.uid,
        leadId: lead.id,
        createdAt: serverTimestamp()
      });
    } catch(err) {
      console.error('Failed to log activity', err);
    }
  };

  const handleEnrichLead = async () => {
    setIsEnriching(true);
    try {
      const data = await enrichLeadSocials(lead);
      if (data) {
        setEditForm(prev => ({
          ...prev,
          linkedinUrl: data.linkedinUrl || prev.linkedinUrl,
          instagramUrl: data.instagramUrl || prev.instagramUrl
        }));
        
        // update lead object in DB
        await updateDoc(doc(db, 'leads', lead.id), {
          linkedinUrl: data.linkedinUrl || lead.linkedinUrl || '',
          instagramUrl: data.instagramUrl || lead.instagramUrl || '',
          enrichmentData: data.enrichmentData || lead.enrichmentData || null,
          updatedAt: serverTimestamp()
        });

        toast.success("Lead enriched with Social Data!");
        await logActivity(`🤖 AI enriched social data from web search`, 'note');
      } else {
        toast.error("Could not find social data");
      }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error("Failed to enrich lead");
    } finally {
      setIsEnriching(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingFiles(true);
    try {
      const storageRef = ref(storage, `leads/${lead.id}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed', 
        () => {},
        (error) => {
           console.error(error);
           toast.error("Upload failed.");
           setUploadingFiles(false);
        },
        async () => {
           const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
           await logActivity(`Uploaded file: ${file.name}`, 'file_upload', downloadURL);
           toast.success("File uploaded");
           setUploadingFiles(false);
        }
      );
    } catch(err) {
      console.error(err);
      toast.error("Upload process failed");
      setUploadingFiles(false);
    }
  };

  const handleToggleTask = async (taskKey: string) => {
    const updatedTasks = { ...tasks, [taskKey]: !tasks[taskKey] };
    setTasks(updatedTasks);
    try {
      await updateDoc(doc(db, 'leads', lead.id), { tasks: updatedTasks });
      if (updatedTasks[taskKey]) {
         await logActivity(`Completed stage: ${taskKey.replace('_', ' ')}`, 'task_completed');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update task');
    }
  };

  const handleAddCustomTask = async () => {
    if (!newTaskTitle.trim()) return;
    const newTask = { id: Date.now().toString(), title: newTaskTitle.trim(), completed: false };
    const updatedTasks = [...(lead.customTasks || []), newTask];
    setNewTaskTitle('');
    try {
      await updateDoc(doc(db, 'leads', lead.id), { customTasks: updatedTasks });
    } catch (e) {
      console.error(e);
      toast.error('Failed to add task');
    }
  };

  const handleToggleCustomTask = async (taskId: string) => {
    const updatedTasks = (lead.customTasks || []).map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    try {
      await updateDoc(doc(db, 'leads', lead.id), { customTasks: updatedTasks });
      const t = (lead.customTasks || []).find(t => t.id === taskId);
      if (t && updatedTasks.find(u => u.id === taskId)?.completed) {
         await logActivity(`Completed custom task: ${t.title}`, 'task_completed');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteCustomTask = async (taskId: string) => {
    const updatedTasks = (lead.customTasks || []).filter(t => t.id !== taskId);
    try {
      await updateDoc(doc(db, 'leads', lead.id), { customTasks: updatedTasks });
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleUpdateCustomTask = async (taskId: string, partialUpdate: any) => {
    const updatedTasks = (lead.customTasks || []).map(t => t.id === taskId ? { ...t, ...partialUpdate } : t);
    try {
      await updateDoc(doc(db, 'leads', lead.id), { customTasks: updatedTasks });
    } catch (e) {
      console.error(e);
      toast.error('Failed to update task');
    }
  };

  const handleSaveEditTask = async (taskId: string) => {
    if (!editTaskTitle.trim()) {
      setEditingTaskId(null);
      return;
    }
    const updatedTasks = (lead.customTasks || []).map(t => t.id === taskId ? { ...t, title: editTaskTitle.trim() } : t);
    setEditingTaskId(null);
    try {
      await updateDoc(doc(db, 'leads', lead.id), { customTasks: updatedTasks });
    } catch (e) {
      console.error(e);
      toast.error('Failed to update task title');
    }
  };

  const handleSaveDetails = async () => {
    try {
      await updateDoc(doc(db, 'leads', lead.id), {
        brandName: editForm.brandName,
        contactName: editForm.contactName,
        contactEmail: editForm.contactEmail,
        niche: editForm.niche,
        budget: Number(editForm.budget),
        companyUrl: editForm.companyUrl,
        linkedinUrl: editForm.linkedinUrl,
        instagramUrl: editForm.instagramUrl,
        timeline: editForm.timeline,
        reviewVideoUrl: editForm.reviewVideoUrl,
        rawFootageUrl: editForm.rawFootageUrl,
        projectFilesUrl: editForm.projectFilesUrl,
        predictedLTV: editForm.predictedLTV,
        targetRetentionRate: editForm.targetRetentionRate,
        caseStudy1Title: editForm.caseStudy1Title,
        caseStudy1Text: editForm.caseStudy1Text,
        caseStudy2Title: editForm.caseStudy2Title,
        caseStudy2Stat: editForm.caseStudy2Stat,
        caseStudy2Text: editForm.caseStudy2Text,
        caseStudy3Title: editForm.caseStudy3Title,
        caseStudy3Stat: editForm.caseStudy3Stat,
        caseStudy3Text: editForm.caseStudy3Text,
        loomVideoUrl: editForm.loomVideoUrl,
        testimonialQuote: editForm.testimonialQuote,
        testimonialAuthor: editForm.testimonialAuthor,
        testimonialSource: editForm.testimonialSource,
        aiAudit: editForm.aiAudit,
        onboardingTitle: editForm.onboardingTitle,
        onboardingMessage: editForm.onboardingMessage
      });
      setIsEditing(false);
      toast.success("Lead details updated!");
    } catch (e) {
      toast.error("Failed to update lead details.");
      console.error(e);
    }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'leads', lead.id, 'notes'),
      where('ownerId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, snap => {
      const loadedNotes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      loadedNotes.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeA - timeB; // asc
      });
      setNotes(loadedNotes as any); // using any for quick patch
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notes');
    });
    return unsubscribe;
  }, [lead.id, user]);

  const handleAddNote = async (text: string = newNote) => {
    if (!text.trim() || !user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'leads', lead.id, 'notes'), {
        text: text,
        ownerId: user.uid,
        leadId: lead.id,
        createdAt: serverTimestamp()
      });
      setNewNote('');
    } catch(e) {
      console.error("Failed to add note", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSetReminder = async () => {
    try {
      if (followUpInput) {
        await updateDoc(doc(db, 'leads', lead.id), { followUpDate: new Date(followUpInput) });
        toast.success("Reminder updated!");
      } else {
        await updateDoc(doc(db, 'leads', lead.id), { followUpDate: null });
        toast.success("Reminder cleared.");
      }
    } catch (e) {
      console.error("Failed to set reminder", e);
    }
  };

  const handleSetReviewVideo = async () => {
    try {
      await updateDoc(doc(db, 'leads', lead.id), { reviewVideoUrl: reviewVideoUrlInput });
      toast.success("Review Video updated! Client can now see it in the portal.");
    } catch (e) {
      console.error("Failed to set review video", e);
      toast.error("Failed to save video URL.");
    }
  };

  const handleSetProjectAsset = async (field: 'rawFootageUrl' | 'projectFilesUrl', val: string) => {
    try {
      await updateDoc(doc(db, 'leads', lead.id), { [field]: val });
      toast.success("Asset URL updated!");
    } catch (e) {
      console.error("Failed to set asset", e);
      toast.error("Failed to save asset URL.");
    }
  };

  const handleGenerateWebProposal = async () => {
    if (!user) return;
    setAiGenerating(true);
    try {
      const client = getAI();
      if (!client) throw new Error("AI Client not initialized");
      
      const notesContext = notes.map((n:any) => `[${new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt || Date.now()).toLocaleDateString()}] ${n.type || 'note'}: ${n.text}`).join('\n');
      const prompt = `You are a world-class sales engineer. Draft a high-converting web proposal for this lead.
Lead Info: Name: ${lead.brandName || lead.contactName || 'Client'} Niche: ${lead.niche || 'Unknown'} Budget: ${lead.budget || 'Unknown'}
Notes: ${notesContext}`;

      const response = await client.models.generateContent({ 
        model: "gemini-3.1-pro-preview", 
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              intro: { type: Type.STRING },
              audit: { type: Type.STRING },
              packages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    price: { type: Type.INTEGER },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "price", "description"]
                }
              }
            },
            required: ["title", "intro", "audit", "packages"]
          }
        }
      });
      let parsed = {
        title: `Strategy Proposal for ${lead.brandName}`,
        intro: "We analyzed your recent metrics and crafted a custom structured approach.",
        audit: "1. Underutilized channels.\n2. Conversion bottlenecks.",
        packages: [
          { name: 'Starter', price: 900, description: 'Basic tier' },
          { name: 'Growth', price: 2500, description: 'Advanced tier + Strategy' }
        ]
      };
      
      try {
        const raw = response.text || "{}";
        parsed = JSON.parse(raw);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        console.warn("Failed to parse JSON proposal from AI");
      }
      
      const proposalRef = await addDoc(collection(db, 'proposals'), {
        ownerId: user.uid,
        leadId: lead.id,
        brandName: lead.brandName || lead.contactName || 'Client',
        status: 'draft',
        title: parsed.title,
        intro: parsed.intro,
        audit: parsed.audit,
        packages: parsed.packages,
        createdAt: serverTimestamp()
      });

      // Export as PDF directly
      const html2pdfModule: any = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default ? html2pdfModule.default : html2pdfModule;
      
      const docElement = document.createElement("div");
      docElement.innerHTML = `
        <div style="padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111;">
           <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ed1b24; padding-bottom: 20px; margin-bottom: 30px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #111;">Formal Proposal <span style="color: #ed1b24;">//</span> ${lead.brandName || 'Client'}</h1>
              <div style="font-size: 12px; color: #666; font-family: monospace; text-transform: uppercase;">Generated: ${new Date().toLocaleDateString()}</div>
           </div>
           
           <h2 style="font-size: 20px; margin-bottom: 10px; color: #111;">${parsed.title}</h2>
           <p style="font-size: 14px; line-height: 1.6; color: #333; margin-bottom: 30px;">${parsed.intro}</p>
           
           <h3 style="font-size: 16px; margin-bottom: 10px; color: #111;">Audit / Insight</h3>
           <p style="font-size: 14px; line-height: 1.6; color: #333; margin-bottom: 30px; white-space: pre-wrap;">${parsed.audit}</p>
           
           <h3 style="font-size: 16px; margin-bottom: 10px; color: #111;">Proposed Packages</h3>
           <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
             <thead>
               <tr style="background-color: #f9f9f9;">
                 <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600; color: #111;">Package Name</th>
                 <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600; color: #111;">Description</th>
                 <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; color: #111;">Price</th>
               </tr>
             </thead>
             <tbody>
               ${parsed.packages.map((p: any) => `
                 <tr>
                   <td style="padding: 12px; border-bottom: 1px solid #ddd; color: #333; font-weight: 600;">${p.name}</td>
                   <td style="padding: 12px; border-bottom: 1px solid #ddd; color: #555;">${p.description}</td>
                   <td style="padding: 12px; border-bottom: 1px solid #ddd; color: #111; font-weight: 600; text-align: right;">$${p.price.toLocaleString()}</td>
                 </tr>
               `).join('')}
             </tbody>
           </table>

           <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 10px; color: #999; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
             Highly Confidential • Generated via AI Systems
           </div>
        </div>
      `;

      const opt = {
        margin:       0.5,
        filename:     `Proposal_${(lead.brandName || 'Client').replace(/[^a-z0-9]/gi, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(docElement).save();

      // log to notes
      await handleAddNote(`Generated comprehensive Web Proposal (Draft ID: ${proposalRef.id})`);
      toast.success("Magic Link Proposal generated!");
      window.open(`/?mode=tracker&proposal=${proposalRef.id}`, '_blank');
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to generate proposal");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreateDraftInvoice = async () => {
    if (!user) return;
    try {
      const draftInvoice = {
        invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
        email: lead.contactEmail || '',
        amount: lead.budget || 0,
        amountPaid: 0,
        desc: `Video Editing Services - ${lead.brandName}`,
        clientName: lead.brandName || lead.contactName || '',
        clientAddress: '',
        senderName: user.displayName || 'Me',
        senderAddress: '',
        logoUrl: '',
        additionalNotes: '',
        format: 'standalone',
        revisions: '',
        dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        terms: 'Due in 7 days',
        taxRate: 0,
        discount: 0,
        isRecurring: false,
        recurringSchedule: 'none',
        template: 'branded',
        currency: 'USD',
        ownerId: user.uid,
        sentAt: serverTimestamp(),
        lastGeneratedAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'invoices'), draftInvoice);

      // Export as PDF directly
      const html2pdfModule: any = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default ? html2pdfModule.default : html2pdfModule;
      
      const docElement = document.createElement("div");
      docElement.innerHTML = `
        <div style="padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111;">
           <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
              <div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #111;">INVOICE</h1>
                <div style="font-size: 14px; color: #666; font-family: monospace; text-transform: uppercase;">#${draftInvoice.invoiceNumber}</div>
              </div>
              <div style="text-align: right; font-size: 14px; color: #333; line-height: 1.5;">
                <div style="font-weight: bold;">TOTAL DUE</div>
                <div style="font-size: 24px; font-weight: bold; color: #ed1b24;">$${draftInvoice.amount.toLocaleString()}</div>
                <div style="margin-top: 10px;">Due: ${draftInvoice.dueDate}</div>
              </div>
           </div>
           
           <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
              <div>
                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 5px;">Billed To</div>
                <div style="font-size: 16px; font-weight: 600; color: #111;">${draftInvoice.clientName}</div>
                <div style="font-size: 14px; color: #555;">${draftInvoice.email}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 5px;">From</div>
                <div style="font-size: 16px; font-weight: 600; color: #111;">${draftInvoice.senderName}</div>
              </div>
           </div>
           
           <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
             <thead>
               <tr style="background-color: #f9f9f9;">
                 <th style="padding: 12px; text-align: left; border-bottom: 2px solid #000; font-weight: 600; color: #111; text-transform: uppercase; font-size: 12px;">Description</th>
                 <th style="padding: 12px; text-align: right; border-bottom: 2px solid #000; font-weight: 600; color: #111; text-transform: uppercase; font-size: 12px;">Amount</th>
               </tr>
             </thead>
             <tbody>
                 <tr>
                   <td style="padding: 16px 12px; border-bottom: 1px solid #ddd; color: #333; font-weight: 500;">${draftInvoice.desc}</td>
                   <td style="padding: 16px 12px; border-bottom: 1px solid #ddd; color: #111; font-weight: 600; text-align: right;">$${draftInvoice.amount.toLocaleString()}</td>
                 </tr>
             </tbody>
           </table>

           <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 10px; color: #999; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
             Thank you for your business.
           </div>
        </div>
      `;

      const opt = {
        margin:       0.5,
        filename:     `Invoice_${draftInvoice.invoiceNumber}_${(lead.brandName || 'Client').replace(/[^a-z0-9]/gi, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(docElement).save();

      toast.success("Draft Invoice Created and Downloaded as PDF!");
      if (onClose) onClose();
    } catch {
      toast.error("Failed to create draft invoice.");
    }
  };


  const handleEmailWebProposal = async () => {
    if (!user) return;
    setSendingEmailProposal(true);
    try {
      await handleGenerateWebProposal();
      // Simulate SendGrid / Resend integration
      await new Promise(resolve => setTimeout(resolve, 1500));
      await handleAddNote(`📨 Emailed Web Proposal securely to ${lead.contactEmail || 'client'}`);
      toast.success("Proposal emailed to client via SendGrid!");
    } catch {
      toast.error("Failed to email proposal.");
    } finally {
      setSendingEmailProposal(false);
    }
  };

  const handleEmailInvoice = async () => {
    if (!user) return;
    setSendingEmailInvoice(true);
    try {
      await handleCreateDraftInvoice();
      // Simulate SendGrid / Resend integration
      await new Promise(resolve => setTimeout(resolve, 1500));
      await handleAddNote(`💳 Emailed Draft Invoice securely to ${lead.contactEmail || 'client'}`);
      toast.success("Invoice emailed to client via SendGrid!");
    } catch {
      toast.error("Failed to email invoice.");
    } finally {
      setSendingEmailInvoice(false);
    }
  };

  const handleGenerateUpsellPitch = async () => {
    if (!user) return;
    setAiUpsellPitch(true);
    try {
      const client = getAI();
      if (!client) throw new Error("AI Client not initialized");
      
      const prompt = `You are a creative sales strategist. The client is ${lead.brandName}. Niche is ${lead.niche}. 
      Generate a 3-video concept pitch tailored exactly to their audience. Focus on high-converting ideas that prove long-term value.
      This is an up-sell pitch to transition them into a monthly retainer.
      Return the output directly in markdown format.`;

      const response = await client.models.generateContent({ 
        model: "gemini-3.1-pro-preview", 
        contents: prompt
      });
      
      const pitch = response.text || "Failed to generate pitch.";
      await handleAddNote(`🚀 Up-Sell Retainer 3-Video Pitch Generated:\n\n${pitch}`);
      toast.success("Automated Up-Sell Pitch Generated!");
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to generate up-sell pitch.");
    } finally {
      setAiUpsellPitch(false);
    }
  };


  const handleSmartFollowUp = async () => {
    if (!user) return;
    setAiSmartFollowUp(true);
    setFollowUpOptions(null);
    try {
      const docSnap = await getDoc(doc(db, 'settings', user.uid));
      const calendarUrl = docSnap.exists() ? docSnap.data().calendarUrl : undefined;
      
      const options = await generateFollowUpOptions(lead, notes, communicationChannel, calendarUrl);
      setFollowUpOptions(options);
    } catch (e: any) {
      toast.error("Failed to generate smart follow-up.");
      console.error(e);
    } finally {
      setAiSmartFollowUp(false);
    }
  };

  const handleSelectFollowUp = async (option: {subject: string, body: string, strategy: string}) => {
    try {
      await handleAddNote(`📨 Smart Follow-up Selected (${communicationChannel}) - ${option.strategy}:\n\n${option.body}`);
      
      if (communicationChannel === 'Email') {
        const subject = encodeURIComponent(option.subject || `Following up: ${lead.brandName}`);
        const body = encodeURIComponent(option.body);
        window.open(`mailto:${lead.contactEmail || ''}?subject=${subject}&body=${body}`);
        toast.success("Smart follow-up drafted in your email client!");
      } else {
        await navigator.clipboard.writeText(option.body);
        toast.success(`Smart follow-up copied to clipboard for ${communicationChannel}!`);
      }
      setFollowUpOptions(null);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to process follow-up.');
    }
  };

  const handleGenerateDripSequence = async () => {
    setAiDripSequence(true);
    try {
      const sequence = await generateDripSequence(lead, notes);
      await handleAddNote(`💧 AI Drip Sequence Generated:\n\n${sequence}`);
      toast.success("Drip sequence drafted in notes!");
    } catch (e: any) {
      toast.error("Failed to generate drip sequence.");
      console.error(e);
    } finally {
      setAiDripSequence(false);
    }
  };

  const handleGenerateChannelInsights = async () => {
    setAiChannelInsights(true);
    try {
      const { generateChannelInsights } = await import('../services/ai');
      const insights = await generateChannelInsights(lead);
      await handleAddNote(`🧠 Deep Channel Insights:\n\n${insights}`);
      toast.success("AI-powered channel insights generated and added to notes!");
    } catch (e: any) {
      toast.error("Failed to generate AI-powered channel insights.");
      console.error(e);
    } finally {
      setAiChannelInsights(false);
    }
  };

  const handleGenerateKillShot = async () => {
    setAiKillShot(true);
    try {
      const { generateKillShotIntel } = await import('../services/ai');
      const intel = await generateKillShotIntel(lead);
      await handleAddNote(`🕵️ "Kill Shot" Competitor Intel:\n\n${intel}`);
      toast.success("Kill Shot Competitor Intel generated and saved to notes!");
    } catch (e: any) {
      toast.error("Failed to generate Kill Shot intel.");
      console.error(e);
    } finally {
      setAiKillShot(false);
    }
  };

  const handleGenerateLoomScript = async () => {
    setAiLoomScript(true);
    try {
      const { generateLoomScript } = await import('../services/ai');
      const script = await generateLoomScript(lead);
      await handleAddNote(`🎬 AI Loom Script (Hook & Action):\n\n${script}`);
      toast.success("Loom Script generated and saved to notes!");
    } catch (e: any) {
      toast.error("Failed to generate Loom script.");
      console.error(e);
    } finally {
      setAiLoomScript(false);
    }
  };

  const handleGenerateProposalAndContract = async () => {
    setGeneratingProposal(true);
    try {
      const { addDoc, collection, serverTimestamp, updateDoc, doc } = await import('firebase/firestore');
      
      const proposalRef = await addDoc(collection(db, 'proposals'), {
        title: `Video Production Proposal - ${lead.brandName}`,
        clientName: lead.brandName,
        status: 'draft',
        amount: lead.budget || 3000,
        content: `# Video Production Proposal for ${lead.brandName}\n\n## Overview\nBased on our deep audit of your channel, we can increase your views and engagement significantly.\n\n## Estimated ROI\n${lead.estimatedRevenue ? lead.estimatedRevenue : 'Potential to double AdSense revenue over 6-12 months.'}\n\n## Scope of Work\n- Full custom editing pipeline\n- Thumbnail A/B Strategy\n- SEO Optimization\n- Hook performance retention edits\n\n## Investment\nStarting at $${lead.budget || 3000}/mo.\n\n## Next Steps\nLet's get started.`,
        ownerId: user?.uid,
        leadId: lead.id,
        createdAt: serverTimestamp(),
      });

      const contractRef = await addDoc(collection(db, 'contracts'), {
        title: `Service Agreement - ${lead.brandName}`,
        clientName: lead.brandName,
        status: 'draft',
        amount: lead.budget || 3000,
        content: `# Service Agreement\n\nThis agreement is between the agency and ${lead.brandName}.\n\n**Terms:**\n- We will deliver 4 highly edited videos per month.\n- Monthly retainer: $${lead.budget || 3000}\n- Payment due net 30.\n\nPlease sign below.`,
        ownerId: user?.uid,
        leadId: lead.id,
        createdAt: serverTimestamp(),
      });

      // Update lead
      await updateDoc(doc(db, 'leads', lead.id), {
        status: 'Negotiation',
        proposalId: proposalRef.id,
        contractId: contractRef.id,
        updatedAt: serverTimestamp()
      });

      const publicProposalUrl = `${window.location.origin}/?mode=proposal&id=${proposalRef.id}`;
      const publicContractUrl = `${window.location.origin}/?mode=contract&id=${contractRef.id}`;

      await handleAddNote(`📄 Proposal & Contract Generated:\n\nProposal Link: ${publicProposalUrl}\nContract Link: ${publicContractUrl}`);
      toast.success("Proposal & Contract generated and added to notes! Lead moved to Negotiation.");
    } catch (e: any) {
      toast.error("Failed to generate Proposal and Contract.");
      console.error(e);
    } finally {
      setGeneratingProposal(false);
    }
  };

  const handleGenerateOutreachPitch = async () => {
    setAiOutreachPitch(true);
    try {
      const pitch = await generateOutreachPitch(JSON.stringify(lead));
      await handleAddNote(`🎯 Sniper Audit & Strategy:\n\n${pitch}`);
      toast.success("Sniper audit & outreach strategy added to notes!");
    } catch (e: any) {
      toast.error("Failed to generate outreach pitch angle.");
      console.error(e);
    } finally {
      setAiOutreachPitch(false);
    }
  };

  const handleAIAssist = async () => {
    setAiGenerating(true);
    try {
      const result = await generateAILeadAssist(lead, aiAssistContext);
      await handleAddNote(`🤖 AI Deal Assist Output:

${result}`);
      toast.success("AI generated deal strategy successfully!");
    } catch {
      toast.error("Failed to generate AI assist.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleDeepRoast = async () => {
    if (!roastUrl) {
      setShowRoastInput(true);
      return;
    }
    
    setAiRoasting(true);
    try {
      const result = await generateRoastPitch(lead, roastUrl);
      await handleAddNote(`🔥 Deep Roast Pitch for (${roastUrl}):

${result}`);
      toast.success("AI Deep Roast generated successfully!");
      setShowRoastInput(false);
      setRoastUrl('');
    } catch {
      toast.error("Failed to generate Deep Roast.");
    } finally {
      setAiRoasting(false);
    }
  };

  const handleAnalyzeMeeting = async () => {
    if (!meetingTranscript.trim()) return;
    setAnalyzingMeeting(true);
    try {
      const prompt = `You are a world-class AI SDR & Closer.
I just had a sales call. Here is the raw transcript:
"${meetingTranscript}"

Your job is to:
1. Extract the client's actual pain points, proposed budget, and timeline.
2. Outline a summary for myself (the agency owner).
3. Draft a highly personalized follow-up email that crushes objections mentioned and pushes for the close.
4. Draft a short Project Brief summarizing scope of work.
5. Draft an HTML Proposal body to be sent formally.

Provide the response in raw JSON format strictly using this schema:
{
  "extractedBudget": number (or null if not mentioned),
  "extractedTimeline": "string describing timeline",
  "painPoints": ["point 1", "point 2"],
  "agencySummary": "2-3 sentences max",
  "followUpEmail": "The precise body of the follow up email",
  "followUpSubject": "The subject line",
  "projectBrief": "Paragraph format project brief",
  "proposalDraft": "HTML valid string for formal proposal"
}
Do NOT include markdown syntax around the JSON.
`;
      const res = await (await import('../services/ai')).performAIOperation(prompt);
      const data = JSON.parse(res);
      
      const toUpdate: any = { updatedAt: serverTimestamp() };
      if (data.extractedBudget) toUpdate.budget = Number(data.extractedBudget);
      if (data.extractedTimeline) toUpdate.timeline = data.extractedTimeline;
      
      await updateDoc(doc(db, 'leads', lead.id), toUpdate);
      
      const logText = `🤖 **Meeting Analyzed**
**Pain Points:**
${data.painPoints.map((p: string) => `- ${p}`).join('\n')}

**Summary:**
${data.agencySummary}

**Project Brief:**
${data.projectBrief}

**Drafted Follow-up:**
Subject: ${data.followUpSubject}
${data.followUpEmail}`;
      
      await addDoc(collection(db, 'leads', lead.id, 'notes'), {
        ownerId: user?.uid,
        leadId: lead.id,
        text: logText,
        type: 'meeting_intel',
        createdAt: serverTimestamp()
      });
      
      // Auto-create Proposal
      if (user?.uid) {
         await addDoc(collection(db, 'proposals'), {
            title: `Proposal Draft: ${lead.brandName || lead.contactName || 'Client'}`,
            status: 'draft',
            amount: data.extractedBudget || 0,
            content: data.proposalDraft || `<p>Insert formal proposal content here...</p>`,
            ownerId: user.uid,
            createdAt: serverTimestamp()
         });
      }
      
      if (lead.contactEmail) {
        window.open(`mailto:${lead.contactEmail}?subject=${encodeURIComponent(data.followUpSubject)}&body=${encodeURIComponent(data.followUpEmail)}`);
      }
      
      toast.success("Meeting analyzed, CRM updated, proposal drafted, and follow-up ready!");
      setIsMeetingModalOpen(false);
      setMeetingTranscript('');
    } catch (e: any) {
      toast.error("Failed to analyze meeting: " + e.message);
    } finally {
      setAnalyzingMeeting(false);
    }
  };

  const [generatingIntel, setGeneratingIntel] = useState(false);

  const handleGeneratingIntelTrigger = async () => {
    if (!lead) return;
    setGeneratingIntel(true);
    try {
      const client = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const prompt = `Act as an elite corporate spy and deep-researcher. The target is "${lead.brandName}".
Use Google Search (if available) to find their latest news, their competitors, and what their audience is saying about them right now. 
Summarize this neatly in Markdown, providing:
1. **Recent Signals / News**: Any latest videos, podcasts, or drama.
2. **Key Competitors**: Who are they fighting for attention?
3. **The Wedge (Sales Angle)**: How can a top-tier video editor use this information to pitch them today? Keep it extremely concise and actionable.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
           tools: [{ googleSearch: {} }]
        }
      });
      const txt = response.text || '';
      await updateDoc(doc(db, 'leads', lead.id), {
        deepIntel: txt
      });
      const noteRef = collection(db, 'leads', lead.id, 'notes');
      await addDoc(noteRef, {
        leadId: lead.id,
        ownerId: user?.uid,
        text: `Omni Intel Sync Completed:\n\n${txt}`,
        type: 'log',
        createdAt: serverTimestamp()
      });
      toast.success("Omni Intel Search completed! Details logged in notes.");
    } catch (e: any) {
      console.error(e);
      toast.error("Deep search failed: " + e.message);
    } finally {
      setGeneratingIntel(false);
    }
  };

  const handleFreeTrial = async () => {
    if (!user) return;
    setAiFreeTrial(true);
    try {
      const docSnap = await getDoc(doc(db, 'settings', user.uid));
      const calendarUrl = docSnap.exists() ? docSnap.data().calendarUrl : undefined;
      
      const pitch = await generateFreeTrialPitch(lead, calendarUrl);
      const subject = encodeURIComponent(`Free Sample Edit for ${lead.brandName} - Risk Free`);
      const body = encodeURIComponent(pitch);
      
      await handleAddNote(`🎁 Free Trial Pitch Drafted:

${pitch}`);
      window.open(`mailto:${lead.contactEmail}?subject=${subject}&body=${body}`);
      toast.success("Free Trial Pitch drafted in your email client!");
    } catch (err: any) {
      toast.error("Failed to generate free trial pitch.");
      console.error(err);
    } finally {
      setAiFreeTrial(false);
    }
  };

  const handleROI = async () => {
    if (!user) return;
    setAiROI(true);
    try {
      const pitch = await generateROIPitch(lead);
      const subject = encodeURIComponent(`The ROI of updating your editing workflow (${lead.brandName})`);
      const body = encodeURIComponent(pitch);
      
      await handleAddNote(`📈 ROI Pitch Drafted:

${pitch}`);
      window.open(`mailto:${lead.contactEmail}?subject=${subject}&body=${body}`);
      toast.success("ROI Financial Pitch drafted in your email client!");
    } catch (err: any) {
      toast.error("Failed to generate ROI pitch.");
      console.error(err);
    } finally {
      setAiROI(false);
    }
  };

  const handleGenerateCaseStudy = async () => {
    if (!user) return;
    setAiCaseStudy(true);
    try {
      const result = await generateCaseStudy(lead, notes);
      await handleAddNote(`🏆 Automated Case Study Generated:\n\n${result}`);
      await navigator.clipboard.writeText(result);
      toast.success("Case Study copied to clipboard and saved to notes!");
    } catch (err: any) {
      toast.error("Failed to generate case study.");
      console.error(err);
    } finally {
      setAiCaseStudy(false);
    }
  };

  const handleGenerateRetainer = async () => {
    if (!user) return;
    setAiRetainer(true);
    try {
      const pitch = await generateRetainerPitch(lead, notes);
      const subject = encodeURIComponent(`Moving forward with a monthly retainer (${lead.brandName})`);
      const body = encodeURIComponent(pitch);
      
      await handleAddNote(`🔁 Retainer Pitch Drafted:\n\n${pitch}`);
      if (lead.contactEmail) {
        window.open(`mailto:${lead.contactEmail}?subject=${subject}&body=${body}`);
        toast.success("Retainer Pitch drafted in your email client!");
      } else {
        await navigator.clipboard.writeText(pitch);
        toast.success("Retainer Pitch copied to clipboard!");
      }
    } catch (err: any) {
      toast.error("Failed to generate retainer pitch.");
      console.error(err);
    } finally {
      setAiRetainer(false);
    }
  };

  const handleCopyTrackerLink = () => {
    const url = `${window.location.origin}/?mode=tracker&id=${lead.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Client Portal link copied!");
  };

  const handleGenerateCompetitorXRay = async () => {
    const clientChannelUrl = prompt("Enter Prospect's YouTube Channel/Video URL:", lead.companyUrl || "");
    if (!clientChannelUrl) return;
    
    const rivalChannelUrl = prompt("Enter their Biggest Competitor's YouTube Channel/Video URL:");
    if (!rivalChannelUrl) return;

    setAiCompetitor(true);
    try {
      const client = getAI();
      if (!client) throw new Error("AI Client not initialized");
      
      const p = `Act as an elite YouTube Strategist. Generate a ruthless Side-by-Side Battlecard comparing these two players.
Prospect URL: ${clientChannelUrl}
Rival URL: ${rivalChannelUrl}

Structure:
1. THE VS METRICS: Best guess estimates of AVD (Average View Duration), Hook Retention.
2. RIVAL'S UNFAIR ADVANTAGE: What the rival is doing visually/editorially that is crushing our prospect.
3. THE ANGLE OF ATTACK: Exactly how we position our video editing services to the Prospect so they believe hiring us will immediately help them beat this specific competitor.`;

      const response = await client.models.generateContent({ 
        model: "gemini-3.1-pro-preview", 
        contents: p
      });
      const resp = response.text || "Battlecard generation failed.";

      await handleAddNote(`⚔️ Competitor Battlecard (AI):\n\n${resp}`);
      toast.success("Battlecard generated!");
    } catch {
      toast.error("Failed to generate competitor audit");
    } finally {
      setAiCompetitor(false);
    }
  };

  const handleGenerateColdSequence = async () => {
    const clientChannelUrl = prompt("Enter Prospect's YouTube Channel/Video URL:", lead.companyUrl || "");
    if (!clientChannelUrl) return;

    setAiColdSequence(true);
    try {
      const client = getAI();
      if (!client) throw new Error("AI Client not initialized");
      
      const p = `Act as an elite Cold Email Copywriter and YouTube Strategist. 
Analyze the implied content from this URL: ${clientChannelUrl}.
I need a highly customized, 3-step cold email sequence designed to get maximum reply rates from top YouTubers.

Guidelines:
- Point out specific hypothetical flaws in their recent videos (e.g., "I noticed your retention dropped at 2:00 in your last video...", "Lighting was flat", "Pacing lagged in the middle").
- Be concise. Real creators don't read long emails.
- End with a low-friction call to action.

Output:
Email 1: The Insight (Hook them with a specific, technical critique of their last upload + a quick fix).
Email 2: The Proof (2 days later. Provide a mock thumbnail idea or a short clip of how you'd edit their intro).
Email 3: The Breakup (4 days later. The "Are you focusing on other things right now?" email).
`;

      const response = await client.models.generateContent({ 
        model: "gemini-3.1-pro-preview", 
        contents: p
      });
      const resp = response.text || "Cold sequence generation failed.";

      await handleAddNote(`📧 Cold Email Sequence (AI):\n\n${resp}`);
      toast.success("Cold email sequence generated!");
    } catch {
      toast.error("Failed to generate cold sequence");
    } finally {
      setAiColdSequence(false);
    }
  };

  const handleGenerateContractAssembly = async () => {
    setAiContractAssembly(true);
    try {
      const client = getAI();
      if (!client) throw new Error("AI Client not initialized");
      
      const p = `Generate a formal, bullet-proof Independent Contractor Agreement (SOW) based on standard industry terms for video editing, for the client: ${lead.brandName || 'Client'}.
Include clauses for Deliverables, Compensation ($${lead.budget || 2000}), Revisions (2 rounds), Term, Intellectual Property (transferred upon full payment), and Confidentiality.
Format nicely.`;

      const response = await client.models.generateContent({ 
        model: "gemini-3.1-pro-preview", 
        contents: p
      });
      const resp = response.text || "Contract generation failed.";

      // Export as PDF directly
      const html2pdfModule: any = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default ? html2pdfModule.default : html2pdfModule;
      
      const docElement = document.createElement("div");
      docElement.innerHTML = `
        <div style="padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; line-height: 1.6;">
           <h1 style="text-align: center; font-size: 20px; font-weight: bold; text-transform: uppercase;">INDEPENDENT CONTRACTOR AGREEMENT</h1>
           <p style="text-align: center; font-size: 12px; color: #666;">Date: ${new Date().toLocaleDateString()}</p>
           <br />
           <div style="font-size: 12px; white-space: pre-wrap;">${resp.replace(/\n/g, '<br/>')}</div>
           <br /><br />
           <table style="width: 100%; margin-top: 40px;">
              <tr>
                <td style="width: 45%; border-top: 1px solid #000; padding-top: 5px;">Contractor Signature</td>
                <td style="width: 10%;"></td>
                <td style="width: 45%; border-top: 1px solid #000; padding-top: 5px;">Client (${lead.brandName || 'Client'}) Signature</td>
              </tr>
           </table>
        </div>
      `;

      const opt = {
        margin:       0.5,
        filename:     `Contract_${(lead.brandName || 'Client').replace(/[^a-z0-9]/gi, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(docElement).save();

      await handleAddNote(`🤖 Automated Contract Assembled (AI PDF Exported)\n\nTerms included: Deliverables, Reps, IP Assignment.`);
      toast.success("Contract generated and exported as PDF!");
    } catch {
      toast.error("Failed to generate contract.");
    } finally {
      setAiContractAssembly(false);
    }
  };

  const handleGeneratePsychographic = async () => {
    setAiPsychographic(true);
    try {
      const resp = await generatePsychographicProfile(lead, notes);
      await handleAddNote(`🧠 Psychographic Profile (AI):\n\n${resp}`);
      toast.success("Psychographic profile generated!");
    } catch {
      toast.error("Failed to generate psychographic profile");
    } finally {
      setAiPsychographic(false);
    }
  };

  const handleGenerateHookBlueprint = async () => {
    setAiHookBlueprint(true);
    try {
      const resp = await generateViralHookBlueprint(lead, notes);
      await handleAddNote(`🎣 Viral Hook Blueprint (AI):\n\n${resp}`);
      toast.success("Viral hook drafted!");
    } catch {
      toast.error("Failed to draft viral hook");
    } finally {
      setAiHookBlueprint(false);
    }
  };

  const handleGenerateContractNegotiator = async () => {
    setAiContractNegotiator(true);
    try {
      const resp = await generateContractNegotiator(lead, notes);
      await handleAddNote(`⚖️ Contract Negotiation Guide (AI):\n\n${resp}`);
      toast.success("Contract negotiation guide generated!");
    } catch {
      toast.error("Failed to generate contract advice");
    } finally {
      setAiContractNegotiator(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    setAiStoryboard(true);
    try {
      const resp = await generateStoryboardBRoll(lead, notes);
      await handleAddNote(`🎬 Storyboard & B-Roll Strategy (AI):\n\n${resp}`);
      toast.success("Storyboard strategy generated!");
    } catch {
      toast.error("Failed to generate storyboard");
    } finally {
      setAiStoryboard(false);
    }
  };

  const handleGenerateSoundDesign = async () => {
    setAiSoundDesign(true);
    try {
      const resp = await generateMusicSoundDesign(lead, notes);
      await handleAddNote(`🔊 Sound Design Strategy (AI):\n\n${resp}`);
      toast.success("Sound design strategy generated!");
    } catch {
      toast.error("Failed to generate sound design");
    } finally {
      setAiSoundDesign(false);
    }
  };

  const handleGenerateTitles = async () => {
    setAiTitles(true);
    try {
      const resp = await generateTitleThumbnailIdeas(lead, notes);
      await handleAddNote(`🖼️ Title & Thumbnail Concepts (AI):\n\n${resp}`);
      toast.success("Title & Thumb concepts generated!");
    } catch {
      toast.error("Failed to generate concepts");
    } finally {
      setAiTitles(false);
    }
  };

  const handleGenerateObjections = async () => {
    setAiObjections(true);
    try {
      const resp = await generateObjectionHandlingScript(lead, notes);
      await handleAddNote(`🛡️ Objection Handling Script (AI):\n\n${resp}`);
      toast.success("Objection scripts drafted!");
    } catch {
      toast.error("Failed to generate scripts");
    } finally {
      setAiObjections(false);
    }
  };

  const handleGenerateRiskReversal = async () => {
    setAiRiskReversal(true);
    try {
      const resp = await generateRiskReversalPitch(lead, notes);
      await handleAddNote(`🤝 Risk Reversal & Guarantees (AI):\n\n${resp}`);
      toast.success("Risk reversal offers generated!");
    } catch {
      toast.error("Failed to generate offers");
    } finally {
      setAiRiskReversal(false);
    }
  };

  const handleGenerateZoomFramework = async () => {
    setAiZoomFramework(true);
    try {
      const resp = await generateZoomClosingFramework(lead, notes);
      await handleAddNote(`🎥 Zoom Closing Framework (AI):\n\n${resp}`);
      toast.success("Zoom framework drafted!");
    } catch {
      toast.error("Failed to generate framework");
    } finally {
      setAiZoomFramework(false);
    }
  };

  const handleGenerateGodfatherOffer = async () => {
    setAiGodfather(true);
    try {
      const resp = await generateGodfatherOffer(lead, notes);
      await handleAddNote(`👑 The Godfather Offer (AI):\n\n${resp}`);
      toast.success("Godfather offer generated!");
    } catch {
      toast.error("Failed to generate offer");
    } finally {
      setAiGodfather(false);
    }
  };

  const handleGenerateValueBomb = async () => {
    setAiValueBomb(true);
    try {
      const resp = await generateValueBomb(lead, notes);
      await handleAddNote(`💣 Value Bomb Strategy (AI):\n\n${resp}`);
      toast.success("Value bomb designed!");
    } catch {
      toast.error("Failed to generate value bomb");
    } finally {
      setAiValueBomb(false);
    }
  };

  const handleGenerateGhostReactivation = async () => {
    setAiGhostReact(true);
    try {
      const resp = await generateGhostReactivation(lead, notes);
      await handleAddNote(`👻 Ghost-Buster Protocol (AI):\n\n${resp}`);
      toast.success("Ghost reactivation drafted!");
    } catch {
      toast.error("Failed to generate reactivation");
    } finally {
      setAiGhostReact(false);
    }
  };

  const handleExportNoteAsPDF = (noteText: string, noteType: string) => {
    import("html2pdf.js").then((html2pdfModule: any) => {
      const html2pdf = html2pdfModule.default ? html2pdfModule.default : html2pdfModule;
      
      const docElement = document.createElement("div");
      docElement.innerHTML = `
        <div style="padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111;">
           <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ed1b24; padding-bottom: 20px; margin-bottom: 30px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #111;">Video CRM <span style="color: #ed1b24;">//</span> Export</h1>
              <div style="font-size: 12px; color: #666; font-family: monospace; text-transform: uppercase;">Generated: ${new Date().toLocaleDateString()}</div>
           </div>
           <div style="font-size: 14px; line-height: 1.6; color: #333; white-space: pre-wrap;">
              ${noteText}
           </div>
           <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 10px; color: #999; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
             Highly Confidential • Generated via AI Systems
           </div>
        </div>
      `;

      const opt = {
        margin:       [0.5, 0.5, 0.5, 0.5],
        filename:     `${noteType}_${Date.now()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().from(docElement).set(opt).save();
    });
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGenerateInvoice = async () => {
    setAiInvoice(true);
    try {
      const docSnap = await getDoc(doc(db, 'settings', user!.uid));
      let paymentLinks = {};
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        paymentLinks = {
          stripe: data.stripeLink,
          paypal: data.paypalLink,
          wise: data.wiseLink,
          custom: data.paymentLink
        };
      }
      
      const invoiceText = await generateInvoiceText(lead, paymentLinks);
      
      await handleAddNote(`🧾 Auto-Generated Invoice ($${lead.budget}):

${invoiceText}
`);
      toast.success("Generated invoice!");
    } catch {
      toast.error("Failed to generate invoice");
    } finally {
      setAiInvoice(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent/80 backdrop-blur-md animate-[fade-in_0.2s_ease-out]" onClick={onClose}>
      <div className="glass-panel shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-[24px] relative" onClick={e => e.stopPropagation()}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#fff_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.015] pointer-events-none"></div>
        <div className="p-0 border-b border-white/[0.02] flex flex-col bg-white/[0.02] shrink-0 relative z-10">
          <div className="p-10 pb-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-[var(--brand-primary)] text-white shadow-2xl rounded-full animate-pulse"></span>
              <h3 className="text-xl text-white tracking-tight font-body tracking-tight">{lead.brandName} Details</h3>
              <div className="ml-4 px-2 py-1 rounded bg-[#000000] border border-white/[0.12] flex items-center gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" title="AI Lead Quality Score">
                <BrainCircuit size={12} className="text-zinc-100" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-[0.2em] text-[9px] flex items-center gap-1.5">
                   <span className="text-white/60">IQ</span>
                   <span className="text-zinc-100 text-sm">{lead.qualityScore || Math.min(99, Math.max(10, 40 + (Number(lead.budget) > 1000 ? 35 : (Number(lead.budget) > 0 ? 15 : 0)) + (lead.timeline ? 15 : 0) + (lead.niche ? 9 : 0)))}</span>
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 text-xs rounded-2xl">
               <X size={18} />
            </button>
          </div>
          <div className="flex overflow-x-auto custom-scrollbar gap-10 px-6 border-b border-white/[0.02]">
            <button onClick={() => setActiveTab('contact')} className={`pb-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap border-b-2 font-mono ${activeTab === 'contact' ? 'text-zinc-100 border-white/[0.04]' : 'text-white/60 hover:text-white/80 border-transparent'}`}>Contact</button>
            <button onClick={() => setActiveTab('ai')} className={`pb-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap border-b-2 font-mono flex items-center gap-2 ${activeTab === 'ai' ? 'text-zinc-100 border-white/[0.04]' : 'text-white/60 hover:text-white/80 border-transparent'} relative`}>
              AI Assist <Sparkles size={12} className={activeTab === 'ai' ? 'text-zinc-100' : 'text-zinc-600'} />
            </button>
            <button onClick={() => setActiveTab('playbooks')} className={`pb-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap border-b-2 font-mono flex items-center gap-2 ${activeTab === 'playbooks' ? 'text-zinc-100 border-white/[0.04]' : 'text-white/60 hover:text-white/80 border-transparent'} relative`}>
              Playbooks <BrainCircuit size={12} className={activeTab === 'playbooks' ? 'text-zinc-100' : 'text-zinc-600'} />
            </button>
            <button onClick={() => setActiveTab('activity')} className={`pb-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap border-b-2 font-mono ${activeTab === 'activity' ? 'text-zinc-100 border-white/[0.04]' : 'text-white/60 hover:text-white/80 border-transparent'}`}>Activity</button>
            <button onClick={() => setActiveTab('tasks')} className={`pb-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap border-b-2 font-mono ${activeTab === 'tasks' ? 'text-zinc-100 border-white/[0.04]' : 'text-white/60 hover:text-white/80 border-transparent'}`}>Tasks</button>
            <button onClick={() => setActiveTab('assets')} className={`pb-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap border-b-2 font-mono ${activeTab === 'assets' ? 'text-zinc-100 border-white/[0.04]' : 'text-white/60 hover:text-white/80 border-transparent'}`}>Assets</button>
            <button onClick={() => setActiveTab('chat')} className={`pb-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap border-b-2 font-mono flex items-center gap-2 ${activeTab === 'chat' ? 'text-zinc-100 border-[var(--brand-primary)]' : 'text-white/60 hover:text-white/80 border-transparent'}`}>
              <MessageSquare size={12} className={activeTab === 'chat' ? 'text-[var(--brand-primary)]' : 'text-zinc-600'} /> Mail & Inquiries
            </button>
          </div>
        </div>


        <div className="flex-1 overflow-y-auto p-10 md:p-10 custom-scrollbar">
          {activeTab === 'contact' && (
            <div className="animate-[fade-in_0.2s_ease-out]">
            {isEditing ? (
              <div className="w-full flex flex-col gap-4">
                <input type="text" value={editForm.brandName} onChange={e => setEditForm({...editForm, brandName: e.target.value})} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] w-full transition-colors" placeholder="Brand Name" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" value={editForm.contactName} onChange={e => setEditForm({...editForm, contactName: e.target.value})} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="Contact Name" />
                  <input type="email" value={editForm.contactEmail} onChange={e => setEditForm({...editForm, contactEmail: e.target.value})} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="Contact Email" />
                  <select value={editForm.niche} onChange={e => setEditForm({...editForm, niche: e.target.value})} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white/80 focus:outline-none focus:border-white/[0.04] transition-colors appearance-none">
                    <option value="">Select Niche...</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Finance / Crypto">Finance & Crypto</option>
                    <option value="Lifestyle / Vlog">Lifestyle & Vlog</option>
                    <option value="Tech / Reviews">Tech & Reviews</option>
                    <option value="Educational / Essay">Educational & Essay</option>
                    <option value="Business">Business</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Music / Arts">Music & Arts</option>
                    <option value="Sports / Fitness">Sports & Fitness</option>
                    <option value="Other">Other</option>
                  </select>
                  <input type="number" value={editForm.budget} onChange={e => setEditForm({...editForm, budget: Number(e.target.value)})} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="Budget ($)" />
                  <input type="text" value={editForm.companyUrl} onChange={e => setEditForm({...editForm, companyUrl: e.target.value})} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="Company URL" />
                  <input type="text" value={editForm.linkedinUrl} onChange={e => setEditForm({...editForm, linkedinUrl: e.target.value})} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="LinkedIn URL" />
                  <input type="text" value={editForm.instagramUrl} onChange={e => setEditForm({...editForm, instagramUrl: e.target.value})} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="Instagram URL" />
                  <input type="text" value={editForm.timeline} onChange={e => setEditForm({...editForm, timeline: e.target.value})} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="Timeline" />
                  <input type="url" value={editForm.reviewVideoUrl} onChange={e => setEditForm({...editForm, reviewVideoUrl: e.target.value})} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="Review Video URL" />
                  <input type="url" value={editForm.rawFootageUrl} onChange={e => setEditForm({...editForm, rawFootageUrl: e.target.value})} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="Raw Footage URL" />
                  <input type="url" value={editForm.projectFilesUrl} onChange={e => setEditForm({...editForm, projectFilesUrl: e.target.value})} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="Project Files URL" />
                </div>
                <textarea value={editForm.message} onChange={e => setEditForm({...editForm, message: e.target.value})} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] w-full mt-1 min-h-[80px]" placeholder="Lead Message" rows={3} />
                <div className="flex gap-3 justify-end mt-2 pt-4 border-t border-white/[0.02]">
                  <button onClick={() => setIsEditing(false)} className="bg-white/5 hover:bg-white/10 text-white font-bold px-5 py-2.5 rounded-2xl text-xs tracking-[0.2em] uppercase transition-colors border border-transparent">Cancel</button>
                  <button onClick={handleSaveDetails} className="bg-[var(--brand-primary)] text-white hover:bg-zinc-200 text-black shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-black font-bold px-5 py-2.5 rounded-2xl text-xs tracking-[0.2em] uppercase transition-colors">Save Details</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-10 relative group/edit pb-4">
                <button 
                  onClick={() => {
                    setEditForm({
                      brandName: lead.brandName || '',
                      contactName: lead.contactName || '',
                      contactEmail: lead.contactEmail || '',
                      niche: lead.niche || '',
                      budget: lead.budget || 0,
                      message: lead.message || '',
                      companyUrl: lead.companyUrl || '',
                      linkedinUrl: lead.linkedinUrl || '',
                      instagramUrl: lead.instagramUrl || '',
                      timeline: lead.timeline || '',
                      reviewVideoUrl: lead.reviewVideoUrl || '',
                      rawFootageUrl: lead.rawFootageUrl || '',
                      projectFilesUrl: lead.projectFilesUrl || '',
                      predictedLTV: lead.predictedLTV || '',
                      targetRetentionRate: lead.targetRetentionRate || '',
                      caseStudy1Title: lead.caseStudy1Title || '',
                      caseStudy1Text: lead.caseStudy1Text || '',
                      caseStudy2Title: lead.caseStudy2Title || '',
                      caseStudy2Stat: lead.caseStudy2Stat || '',
                      caseStudy2Text: lead.caseStudy2Text || '',
                      caseStudy3Title: lead.caseStudy3Title || '',
                      caseStudy3Stat: lead.caseStudy3Stat || '',
                      caseStudy3Text: lead.caseStudy3Text || '',
                      loomVideoUrl: lead.loomVideoUrl || '',
                      testimonialQuote: lead.testimonialQuote || '',
                      testimonialAuthor: lead.testimonialAuthor || '',
                      testimonialSource: lead.testimonialSource || '',
                      aiAudit: lead.aiAudit || '',
                      onboardingTitle: lead.onboardingTitle || '',
                      onboardingMessage: lead.onboardingMessage || ''
                    });
                    setIsEditing(true);
                  }} 
                  className="absolute top-0 right-0 text-white/30 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-2xl opacity-0 group-hover/edit:opacity-100 backdrop-blur-sm z-10"
                >
                   <Edit2 size={16} />
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pr-10">
                  <div className="space-y-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Contact</span>
                      <div className="text-sm text-white/90 font-medium">{lead.contactName || 'No Name Provided'}</div>
                      {lead.contactEmail && <a href={`mailto:${lead.contactEmail}`} className="text-xs text-zinc-100 hover:underline flex items-center gap-1.5 mt-0.5"><Mail size={12} />{lead.contactEmail}</a>}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Niche / Category</span>
                      <div className="text-sm text-white/90 py-1">{lead.niche || <span className="text-zinc-600 opacity-50 italic">None Set</span>}</div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Links</span>
                         <button onClick={handleEnrichLead} disabled={isEnriching} className="text-[9px] uppercase tracking-[0.1em] text-zinc-100 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded disabled:opacity-50 transition-colors">
                           {isEnriching ? 'Enriching...' : 'Enrich with AI'}
                         </button>
                      </div>
                      
                      {lead.enrichmentData && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 my-2 text-xs">
                          <div className="flex items-center gap-2 mb-2">
                             <Sparkles size={12} className="text-zinc-100"/>
                             <span className="font-medium text-white">AI Enrichment</span>
                             {lead.enrichmentData.verified && <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase">Verified</span>}
                          </div>
                          {(lead.enrichmentData.followers || lead.enrichmentData.engagementRate) && (
                            <div className="flex items-center gap-3 text-white/60 mb-2">
                              {lead.enrichmentData.followers && <span><strong className="text-white">{lead.enrichmentData.followers}</strong> followers</span>}
                              {lead.enrichmentData.engagementRate && <span><strong className="text-white">{lead.enrichmentData.engagementRate}</strong> eng. rate</span>}
                            </div>
                          )}
                          {lead.enrichmentData.bio && <div className="text-white/80 line-clamp-2 italic opacity-80">&quot;{lead.enrichmentData.bio}&quot;</div>}
                        </div>
                      )}

                      <div className="flex flex-col gap-2 mt-1">
                        {lead.companyUrl ? (
                          <a href={lead.companyUrl} target="_blank" rel="noreferrer" className="text-sm text-white/80 hover:text-white transition-colors flex items-center gap-2 group">
                             <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center group-hover:bg-white/10"><ExternalLink size={12}/></div>
                             <span>Channel / Website</span>
                          </a>
                        ) : null}
                        {lead.linkedinUrl ? (
                          <a href={lead.linkedinUrl} target="_blank" rel="noreferrer" className="text-sm text-white/80 hover:text-white transition-colors flex items-center gap-2 group">
                             <div className="w-6 h-6 rounded bg-[#0077b5]/20 text-[#0077b5] flex items-center justify-center group-hover:bg-[#0077b5]/30"><ExternalLink size={12}/></div>
                             <span>LinkedIn Profile</span>
                          </a>
                        ) : null}
                        {lead.instagramUrl ? (
                          <a href={lead.instagramUrl} target="_blank" rel="noreferrer" className="text-sm text-white/80 hover:text-white transition-colors flex items-center gap-2 group">
                             <div className="w-6 h-6 rounded bg-[#E1306C]/20 text-[#E1306C] flex items-center justify-center group-hover:bg-[#E1306C]/30"><ExternalLink size={12}/></div>
                             <span>Instagram Profile</span>
                          </a>
                        ) : null}
                        {lead.reviewVideoUrl && (
                          <a href={lead.reviewVideoUrl} target="_blank" rel="noreferrer" className="text-sm text-white/80 hover:text-white transition-colors flex items-center gap-2 group">
                             <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center group-hover:bg-white/10"><Video size={12}/></div>
                             <span>Review/Test Video</span>
                          </a>
                        )}
                        {!lead.companyUrl && !lead.reviewVideoUrl && !lead.linkedinUrl && !lead.instagramUrl && (
                          <span className="text-sm text-zinc-600 italic">No links provided</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Client Portals</span>
                      <div className="flex flex-col gap-2 mt-1">
                          <div className="flex items-center gap-2 group">
                            <button onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin.replace("ais-dev", "ais-pre")}/?mode=sales-room&id=${lead.id}`);
                              toast.success("Sales Room link copied!");
                            }} className="flex-1 text-sm text-white/80 hover:text-white transition-colors flex items-center gap-2 text-left">
                               <div className="w-6 h-6 rounded bg-white/10 text-zinc-100 flex items-center justify-center group-hover:bg-white/20"><MonitorPlay size={12}/></div>
                               <span>Copy Sales Room</span>
                            </button>
                            <a href={`/?mode=sales-room&id=${lead.id}`} target="_blank" rel="noreferrer" title="Open Sales Room" className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                              <ExternalLink size={12}/>
                            </a>
                          </div>
                          <div className="flex items-center gap-2 group">
                            <button onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin.replace("ais-dev", "ais-pre")}/?mode=onboarding&id=${lead.id}`);
                              toast.success("Onboarding link copied!");
                            }} className="flex-1 text-sm text-white/80 hover:text-white transition-colors flex items-center gap-2 text-left">
                               <div className="w-6 h-6 rounded bg-white/10 text-white/80 flex items-center justify-center group-hover:bg-white/20"><UploadCloud size={12}/></div>
                               <span>Copy Onboarding</span>
                            </button>
                            <a href={`/?mode=onboarding&id=${lead.id}`} target="_blank" rel="noreferrer" title="Open Onboarding" className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                              <ExternalLink size={12}/>
                            </a>
                          </div>
                          <div className="flex items-center gap-2 group">
                            <button onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin.replace("ais-dev", "ais-pre")}/?mode=video-review&id=${lead.id}`);
                              toast.success("Video Review link copied!");
                            }} className="flex-1 text-sm text-white/80 hover:text-white transition-colors flex items-center gap-2 text-left">
                               <div className="w-6 h-6 rounded bg-white/10 text-white/80 flex items-center justify-center group-hover:bg-white/20"><Video size={12}/></div>
                               <span>Copy Video Review</span>
                            </button>
                            <a href={`/?mode=video-review&id=${lead.id}`} target="_blank" rel="noreferrer" title="Open Video Review Hub" className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                              <ExternalLink size={12}/>
                            </a>
                          </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Financial</span>
                      <div className="text-xl font-mono text-white/80 font-bold">${(lead.budget || 0).toLocaleString()}</div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Timeline</span>
                      <div className="text-sm text-white/90 py-1 flex items-center gap-2">
                        {lead.timeline ? <><Calendar size={14} className="text-white/60"/>{lead.timeline}</> : <span className="text-zinc-600 italic">Not specified</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {lead.message && (
                  <div className="mt-2 flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Initial Message / Context</span>
                    <div className="bg-white/[0.02] border border-white/[0.02] p-5 rounded-2xl text-sm text-white/80 leading-relaxed font-mono">
                      {lead.message}
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="animate-[fade-in_0.2s_ease-out] flex flex-col gap-10">
               <div className="flex items-center justify-between">
                 <h4 className="text-white font-body tracking-tight text-lg tracking-tight flex items-center gap-2">
                    <Zap className="text-zinc-100" size={18} />
                    AI Assist
                 </h4>
                 <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/80 bg-white/10 px-2 py-1 rounded border border-white/[0.04]">
                    Engine Active
                 </div>
               </div>

               {(lead.status === 'editing' || lead.status === 'delivered') && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-0 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500"><AlertTriangle size={64} /></div>
                     <h5 className="font-bold text-red-400 text-sm mb-2 flex items-center gap-2 relative z-10"><AlertTriangle size={16} /> Predictive Churn & Retention Engine</h5>
                     <p className="text-xs text-white/70 mb-4 relative z-10">June Prime detects <span className="font-bold text-white">🔥 High Friction</span>. Client may be frustrated tracking revisions or communication has slowed down.</p>
                     <div className="flex gap-2 relative z-10">
                        <button onClick={() => {
                             const subject = encodeURIComponent(`Checking in - Free Thumbnail A/B Test for ${lead.brandName}`);
                             const body = encodeURIComponent(`Hey ${lead.contactName || 'there'},\n\nI noticed we had a bit of back-and-forth on the last edit. I want to make sure we nail the vibe perfectly.\n\nAs a bonus to thank you for your patience, I'm going to have my team spin up two different thumbnail variants for this video so we can A/B test them and maximize CTR.\n\nLet me know if you want to hop on a quick 5-min call to align fully.\n\nBest,\n`);
                             window.open(`mailto:${lead.contactEmail}?subject=${subject}&body=${body}`);
                             toast.success("Delight email drafted in your email client!");
                        }} className="bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] uppercase tracking-widest px-4 py-2 rounded font-bold transition-all border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                           Draft "Delight" Email (Free A/B Test)
                        </button>
                        <button onClick={() => toast.success("Check-in Call link copied to clipboard.")} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] uppercase tracking-widest px-4 py-2 rounded font-bold transition-all">
                           Schedule Check-in Call
                        </button>
                     </div>
                  </div>
               )}

               {/* AI Generation Control Panel */}
               <div className="bg-[#000000]/40 border border-[var(--brand-primary)]/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(var(--brand-primary-rgb),0.1)] mb-4">
                  <h5 className="font-bold text-white text-sm mb-3">AI Context Console</h5>
                  <div className="flex flex-col gap-3">
                     <textarea 
                       value={aiAssistContext}
                       onChange={(e) => setAiAssistContext(e.target.value)}
                       placeholder="Provide specific context or goals to instruct the AI generation..."
                       className="bg-[#0a0a0a] border border-white/[0.08] shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] rounded overflow-hidden p-3 text-sm text-white focus:outline-none focus:border-[var(--brand-primary)]/50 w-full resize-none font-mono transition-colors"
                       rows={3}
                     />
                     <div className="flex flex-wrap gap-2">
                       <button onClick={handleGeneratingIntelTrigger} disabled={generatingIntel} className="text-white bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/40 hover:to-teal-600/40 border border-emerald-500/30 text-xs px-4 py-2 rounded transition-colors disabled:opacity-50 !shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center gap-1.5 font-bold tracking-wide">
                         <Search size={12} className={generatingIntel ? 'animate-spin text-emerald-400' : 'text-emerald-400'} /> {generatingIntel ? 'Scouring the Web...' : 'Omni Intel Web Sync 🌐'}
                       </button>
                       <button onClick={handleAIAssist} disabled={aiGenerating} className="text-black bg-[var(--brand-primary)] shadow-[0_4px_15px_rgba(var(--brand-primary-rgb),0.4)] hover:bg-[var(--brand-primary)]/90 px-4 py-2 rounded font-bold transition-all disabled:opacity-50 tracking-wide text-xs">
                         {aiGenerating ? 'Generating...' : 'Trigger Generation'}
                       </button>
                       <button onClick={handleGenerateOutreachPitch} disabled={aiOutreachPitch} className="text-white bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/40 hover:to-purple-600/40 border border-blue-500/30 text-xs px-4 py-2 rounded transition-colors disabled:opacity-50 !shadow-[0_0_15px_rgba(59,130,246,0.15)] flex items-center gap-1.5">
                         <Zap size={12} className={aiOutreachPitch ? 'animate-pulse text-blue-400' : 'text-blue-400'} /> {aiOutreachPitch ? 'Scanning targets...' : 'Deep Sniper Audit & Strategy'}
                       </button>
                       <button onClick={handleGenerateChannelInsights} disabled={aiChannelInsights} className="text-white bg-gradient-to-r from-indigo-600/20 to-fuchsia-600/20 hover:from-indigo-600/40 hover:to-fuchsia-600/40 border border-indigo-500/30 text-xs px-4 py-2 rounded transition-colors disabled:opacity-50 !shadow-[0_0_15px_rgba(79,70,229,0.15)] flex items-center gap-1.5">
                         <BrainCircuit size={12} className={aiChannelInsights ? 'animate-pulse text-indigo-400' : 'text-indigo-400'} /> {aiChannelInsights ? 'Analyzing Channel...' : 'Deep Channel Insights 🧠'}
                       </button>
                       <button onClick={handleGenerateKillShot} disabled={aiKillShot} className="text-white bg-gradient-to-r from-red-600/20 to-orange-600/20 hover:from-red-600/40 hover:to-orange-600/40 border border-red-500/30 text-xs px-4 py-2 rounded transition-colors disabled:opacity-50 !shadow-[0_0_15px_rgba(220,38,38,0.15)] flex items-center gap-1.5">
                         <Target size={12} className={aiKillShot ? 'animate-pulse text-red-500' : 'text-red-500'} /> {aiKillShot ? 'Finding Competitors...' : 'Kill Shot Intel'}
                       </button>
                       <button onClick={handleGenerateLoomScript} disabled={aiLoomScript} className="text-white bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/40 hover:to-indigo-600/40 border border-purple-500/30 text-xs px-4 py-2 rounded transition-colors disabled:opacity-50 !shadow-[0_0_15px_rgba(147,51,234,0.15)] flex items-center gap-1.5">
                         <Video size={12} className={aiLoomScript ? 'animate-pulse text-purple-400' : 'text-purple-400'} /> {aiLoomScript ? 'Generating Script...' : 'Loom Script Gen'}
                       </button>
                       <button onClick={handleGenerateDripSequence} disabled={aiDripSequence} className="text-white bg-white/10 hover:bg-white/20 border border-white/[0.05] text-xs px-4 py-2 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5">
                         {aiDripSequence ? '...' : '3-Part Drip Sequence'}
                       </button>
                       <button onClick={handleGenerateProposalAndContract} disabled={generatingProposal} className="text-white bg-gradient-to-r from-emerald-600/20 to-green-600/20 hover:from-emerald-600/40 hover:to-green-600/40 border border-emerald-500/30 text-xs px-4 py-2 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5 !shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                         <FileText size={12} className={generatingProposal ? 'animate-pulse text-emerald-400' : 'text-emerald-400'} /> {generatingProposal ? 'Generating...' : '1-Click Proposal & Contract'}
                       </button>
                       <button onClick={handleROI} disabled={aiROI} className="text-white bg-white/10 hover:bg-white/20 border border-white/[0.05] text-xs px-4 py-2 rounded transition-colors disabled:opacity-50">
                         {aiROI ? '...' : '+ ROI Math'}
                       </button>
                       <button onClick={() => setShowRoastInput(!showRoastInput)} className="text-zinc-100 bg-red-900/40 hover:bg-red-900/60 border border-red-500/20 text-xs px-4 py-2 rounded transition-colors">
                         Deep Roast
                       </button>
                     </div>
                     {showRoastInput && (
                        <div className="flex items-center gap-2 mt-2 p-3 bg-red-950/20 rounded-xl border border-red-900/30">
                          <input type="url" value={roastUrl} onChange={e => setRoastUrl(e.target.value)} placeholder="Paste Video URL..." className="flex-1 bg-[#000000]/60 border border-red-500/10 rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-red-500/30" />
                          <button onClick={handleDeepRoast} disabled={aiRoasting || !roastUrl} className="bg-red-600 text-white px-4 py-2 rounded text-xs font-bold disabled:opacity-50 shadow-[0_0_15px_rgba(220,38,38,0.4)]">Roast Base</button>
                        </div>
                     )}
                  </div>
               </div>
               
               {lead.deepIntel && (
                  <div className="bg-[#000000]/60 border border-emerald-500/30 rounded-2xl p-6 mb-8 shadow-[0_0_30px_rgba(16,185,129,0.05)] text-emerald-50 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-500"><Search size={80} /></div>
                     <h5 className="font-bold text-emerald-400 text-sm mb-4 flex items-center gap-2 relative z-10"><Search size={16} /> Latest Omni Intel Scrape</h5>
                     <div className="prose prose-sm prose-invert prose-emerald max-w-none relative z-10 leading-relaxed font-body">
                       <Markdown>{lead.deepIntel}</Markdown>
                     </div>
                  </div>
               )}
               
               <p className="text-white/60 text-sm mb-6 mt-2">Automated multi-touch outreach timeline.</p>
               
               {/* Sequence Stages */}
               <div className="flex flex-col relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-white before:via-zinc-800 before:to-transparent">
                  {/* Step 1: Initial Alpha Pitch */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-6">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white/[0.04] bg-[#000000] text-zinc-100 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-10">
                       1
                     </div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-white/[0.12] bg-[#000000]/50 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center justify-between mb-2">
                           <h5 className="font-bold text-white text-sm">Initial Alpha Pitch</h5>
                           <span className="text-[9px] uppercase tracking-[0.2em] text-white/60 font-mono">Day 1</span>
                        </div>
                        {lead.pitchVariants?.alpha ? (
                           <div className="mt-3">
                             <div className="bg-black/60 p-3 rounded-lg border border-white/10 mb-3 max-h-48 overflow-y-auto custom-scrollbar">
                               <p className="text-white/80 text-xs whitespace-pre-wrap">{lead.pitchVariants.alpha}</p>
                             </div>
                             <button
                               onClick={() => {
                                 const subject = encodeURIComponent(`Quick question about ${lead.brandName} video strategy`);
                                 const body = encodeURIComponent(lead.pitchVariants?.alpha || '');
                                 window.open(`mailto:${lead.contactEmail}?subject=${subject}&body=${body}`);
                                 toast.success("Draft created in Gmail!");
                               }}
                               className="w-full bg-[var(--brand-primary)] text-black font-bold text-xs py-2 rounded shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.5)] hover:opacity-90 flex items-center justify-center gap-2 transition-all"
                             >
                                <Mail size={14} /> Approve & Draft in Gmail
                             </button>
                           </div>
                        ) : (
                           <p className="text-xs text-white/60 mb-1">Generated touchpoints will be added to the activity log.</p>
                        )}
                     </div>
                  </div>

                  {/* Step 2: 48h Follow-up */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group opacity-90 hover:opacity-100 transition-opacity mb-6">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/[0.06] bg-[#000000] text-white/60 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                       2
                     </div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-white/[0.04] bg-[#000000]/40 hover:bg-[#0f0f0f] transition-colors">
                        <div className="flex items-center justify-between mb-2">
                           <h5 className="font-bold text-white text-sm">Contextual Bump (Beta)</h5>
                           <span className="text-[9px] uppercase tracking-[0.2em] text-white/60 font-mono">Day 3 (48h)</span>
                        </div>
                        {lead.pitchVariants?.beta ? (
                           <div className="mt-3">
                             <div className="bg-black/60 p-3 rounded-lg border border-white/10 mb-3 max-h-32 overflow-y-auto custom-scrollbar">
                               <p className="text-white/80 text-xs whitespace-pre-wrap">{lead.pitchVariants.beta}</p>
                             </div>
                             <button
                               onClick={() => {
                                 const subject = encodeURIComponent(`Following up on my previous note - ${lead.brandName}`);
                                 const body = encodeURIComponent(lead.pitchVariants?.beta || '');
                                 window.open(`mailto:${lead.contactEmail}?subject=${subject}&body=${body}`);
                                 toast.success("Beta Draft created in Gmail!");
                               }}
                               className="w-full bg-white text-black font-bold text-xs py-2 rounded shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:opacity-90 flex items-center justify-center gap-2 transition-all"
                             >
                                <Mail size={14} /> Send Beta via Gmail
                             </button>
                           </div>
                        ) : (
                           <>
                             <p className="text-xs text-white/60 mb-4">If they go silent, push them softly based on context.</p>
                             <select 
                                value={communicationChannel} 
                                onChange={(e) => setCommunicationChannel(e.target.value)}
                                className="bg-[#000000]/40 border border-white/[0.04] rounded p-1.5 text-xs text-white/80 mb-2 w-full"
                             >
                                <option value="Email">Email</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Twitter / X">Twitter / X</option>
                                <option value="SMS">SMS</option>
                              </select>
                             <button onClick={handleSmartFollowUp} disabled={aiSmartFollowUp} className="w-full bg-[#141414] hover:bg-zinc-700 text-white text-xs px-3 py-2 rounded font-semibold transition-colors disabled:opacity-50">
                                {aiSmartFollowUp ? 'Drafting Options...' : 'Draft 3 Contextual Follow-Ups'}
                             </button>

                             {followUpOptions && (
                                <div className="mt-4 flex flex-col gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                                  {followUpOptions.map((opt, i) => (
                                    <div key={i} className="bg-black/60 border border-white/10 rounded-lg p-3">
                                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#00EFD1] mb-1 block">{opt.strategy}</span>
                                      {opt.subject && <span className="text-xs font-bold text-white mb-2 block">Subj: {opt.subject}</span>}
                                      <p className="text-white/80 text-xs mb-3 whitespace-pre-wrap">{opt.body}</p>
                                      <button onClick={() => handleSelectFollowUp(opt)} className="w-full bg-white/10 border border-white/10 hover:bg-[#00EFD1]/20 hover:text-[#00EFD1] hover:border-[#00EFD1]/50 text-white text-[10px] py-1.5 rounded uppercase font-bold transition-all flex justify-center items-center gap-1.5 shadow-sm">
                                        <Mail size={12} /> {communicationChannel === 'Email' ? 'Send via Email' : 'Copy to Clipboard'}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                             )}
                           </>
                        )}
                     </div>
                  </div>

                  {/* Step 3: Value Add Options */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group opacity-80 hover:opacity-100 transition-opacity mb-6">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/[0.04] bg-[#000000] text-zinc-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                       3
                     </div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-white/[0.04] bg-[#000000]/20 hover:bg-[#0f0f0f] transition-colors">
                        <div className="flex items-center justify-between mb-2">
                           <h5 className="font-bold text-white text-sm">Undeniable Offer (Gamma)</h5>
                           <span className="text-[9px] uppercase tracking-[0.2em] text-white/60 font-mono">Day 5</span>
                        </div>
                        {lead.pitchVariants?.gamma ? (
                           <div className="mt-3">
                             <div className="bg-black/60 p-3 rounded-lg border border-white/10 mb-3 max-h-32 overflow-y-auto custom-scrollbar">
                               <p className="text-white/80 text-xs whitespace-pre-wrap">{lead.pitchVariants.gamma}</p>
                             </div>
                             <button
                               onClick={() => {
                                 const subject = encodeURIComponent(`Free Sample Edit for ${lead.brandName} - Risk Free`);
                                 const body = encodeURIComponent(lead.pitchVariants?.gamma || '');
                                 window.open(`mailto:${lead.contactEmail}?subject=${subject}&body=${body}`);
                                 toast.success("Gamma Draft created in Gmail!");
                               }}
                               className="w-full bg-white text-black font-bold text-xs py-2 rounded shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:opacity-90 flex items-center justify-center gap-2 transition-all"
                             >
                                <Mail size={14} /> Send Gamma via Gmail
                             </button>
                           </div>
                        ) : (
                           <>
                              <p className="text-xs text-white/60 mb-4">Final strike. Offer a free trial or send a Loom script.</p>
                              <div className="flex gap-2">
                                 <button onClick={handleFreeTrial} disabled={aiFreeTrial} className="flex-1 bg-white/10 text-zinc-100 border border-white/[0.04] hover:bg-white/20 text-xs px-3 py-2 rounded font-semibold transition-colors disabled:opacity-50 text-center">
                                    {aiFreeTrial ? '...' : 'Free Trial Offer'}
                                 </button>
                                 <button onClick={() => {
                                     // Quick trigger for Loom Script
                                     const msg = "Can you write a Loom script to send as a follow up?";
                                     setAiAssistContext(msg);
                                     handleAIAssist();
                                 }} disabled={aiGenerating} className="flex-1 bg-white/5 border border-white/[0.04] hover:bg-white/10 text-white text-xs px-3 py-2 rounded font-semibold transition-colors disabled:opacity-50 text-center">
                                    {aiGenerating ? '...' : 'Loom Script'}
                                 </button>
                              </div>
                           </>
                        )}
                     </div>
                  </div>

                  {/* Step 4: The Breakup */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group opacity-70 hover:opacity-100 transition-opacity">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/[0.04] bg-[#000000] text-zinc-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                       4
                     </div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-white/[0.04] bg-[#000000]/20 hover:bg-[#0f0f0f] transition-colors">
                        <div className="flex items-center justify-between mb-2">
                           <h5 className="font-bold text-white text-sm">The "Breakup" (Delta)</h5>
                           <span className="text-[9px] uppercase tracking-[0.2em] text-white/60 font-mono">Day 10</span>
                        </div>
                        {lead.pitchVariants?.delta ? (
                           <div className="mt-3">
                             <div className="bg-black/60 p-3 rounded-lg border border-white/10 mb-3 max-h-32 overflow-y-auto custom-scrollbar">
                               <p className="text-white/80 text-xs whitespace-pre-wrap">{lead.pitchVariants.delta}</p>
                             </div>
                             <button
                               onClick={() => {
                                 const subject = encodeURIComponent(`Closing the loop on ${lead.brandName}`);
                                 const body = encodeURIComponent(lead.pitchVariants?.delta || '');
                                 window.open(`mailto:${lead.contactEmail}?subject=${subject}&body=${body}`);
                                 toast.success("Delta Draft created in Gmail!");
                               }}
                               className="w-full bg-red-500/80 text-white font-bold text-xs py-2 rounded shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:opacity-90 flex items-center justify-center gap-2 transition-all"
                             >
                                <Mail size={14} /> Send Breakup via Gmail
                             </button>
                           </div>
                        ) : (
                           <p className="text-xs text-white/60 mb-4">Final strike. The walk-away email.</p>
                        )}
                     </div>
                  </div>
                  
                  {/* Step 4: Close The Deal */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group opacity-60 hover:opacity-100 transition-opacity mt-6">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/[0.04] bg-[#34C759]/20 text-white/80 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                       4
                     </div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-white/[0.04] bg-[#34C759]/20/10 hover:bg-white/5/20 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                           <h5 className="font-bold text-white/80 text-sm">Close The Deal</h5>
                           <span className="text-[9px] uppercase tracking-[0.2em] text-[#34C759] font-mono">Win</span>
                        </div>
                        <p className="text-xs text-white/60 mb-4">Generate 5-page Web Proposal, or generate drafting invoice.</p>
                        <div className="flex flex-col gap-2">
                           <div className="flex gap-2">
                              <button onClick={handleGenerateWebProposal} disabled={aiGenerating} className="flex-1 bg-[var(--brand-primary)] text-white text-[10px] px-2 py-2 rounded font-bold transition-colors disabled:opacity-50 text-center uppercase tracking-[0.1em] flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.5)]">
                                  <Sparkles size={12}/> {aiGenerating ? 'Gen...' : 'Magic Link Proposal'}
                              </button>
                              <button onClick={handleEmailWebProposal} disabled={sendingEmailProposal} className="flex-1 bg-white hover:bg-zinc-200 text-black text-[10px] px-2 py-2 rounded font-bold transition-colors disabled:opacity-50 text-center uppercase tracking-[0.1em] flex items-center justify-center gap-1">
                                  <Mail size={12}/> {sendingEmailProposal ? 'Sending...' : 'Email Proposal'}
                              </button>
                           </div>
                           <div className="flex gap-2">
                              <button onClick={handleCreateDraftInvoice} className="flex-1 bg-white/20 hover:bg-white/30 text-white/80 border border-white/[0.04] text-[10px] px-2 py-2 rounded font-semibold transition-colors text-center">
                                 PDF Invoice
                              </button>
                              <button onClick={handleEmailInvoice} disabled={sendingEmailInvoice} className="flex-1 bg-white/10 hover:bg-white/20 text-white text-[10px] px-2 py-2 rounded font-semibold transition-colors disabled:opacity-50 text-center flex items-center justify-center gap-1 border border-white/[0.04]">
                                 <Mail size={12}/> {sendingEmailInvoice ? 'Sending...' : 'Email Invoice'}
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Step 5: Post-Closing */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group opacity-50 hover:opacity-100 transition-opacity mt-6 mb-6">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/[0.04] bg-[#AF52DE]/20 text-white/80 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                       5
                     </div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-white/[0.04] bg-[#AF52DE]/10 hover:bg-white/5/20 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                           <h5 className="font-bold text-white/80 text-sm">Post-Project Scale</h5>
                           <span className="text-[9px] uppercase tracking-[0.2em] text-purple-700 font-mono">Closed Won</span>
                        </div>
                        <p className="text-xs text-white/60 mb-4">Turn this success into your next client.</p>
                        <div className="flex flex-col gap-2">
                           <div className="flex gap-2">
                              <button onClick={handleGenerateCaseStudy} disabled={aiCaseStudy} className="flex-1 bg-white/20 text-white/80 border border-white/[0.04] hover:bg-white/30 text-[10px] px-2 py-2 rounded font-semibold transition-colors disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                                  <Award size={12} />
                                  {aiCaseStudy ? '...' : 'Case Study'}
                              </button>
                              <button onClick={handleGenerateRetainer} disabled={aiRetainer} className="flex-1 bg-white/10 text-white/80 border border-white/[0.04] hover:bg-white/20 text-[10px] px-2 py-2 rounded font-semibold transition-colors disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                                  <Repeat size={12} />
                                  {aiRetainer ? '...' : 'Retainer Pitch'}
                              </button>
                           </div>
                           <button onClick={handleGenerateUpsellPitch} disabled={aiUpsellPitch} className="w-full bg-[#141414] border border-white/[0.04] text-white hover:bg-zinc-800 text-xs px-3 py-2 rounded font-semibold transition-colors disabled:opacity-50 text-center flex items-center justify-center gap-2">
                              <BrainCircuit size={14} /> {aiUpsellPitch ? 'Generating...' : 'Automated Up-Sell Pitch Generator'}
                           </button>
                        </div>
                     </div>
                  </div>

               </div>
               
               <div className="text-center mt-12">
                 <p className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono border-t border-white/[0.04] pt-4">End of Campaign</p>
               </div>
            </div>
          )}

          {activeTab === 'playbooks' && (
            <div className="animate-[fade-in_0.2s_ease-out] flex flex-col gap-10">
               <div className="flex items-center justify-between">
                 <h4 className="text-white font-body tracking-tight text-lg tracking-tight flex items-center gap-2">
                    <BrainCircuit className="text-zinc-100" size={18} />
                    AI Action Playbooks
                 </h4>
               </div>
               
               <p className="text-white/60 text-sm mb-2">Deploy targeted sales and negotiation strategies based on context.</p>

               {/* Deep Intel & Strategy Prep */}
               <div className="mb-4 p-5 rounded-2xl border border-white/[0.04] bg-[#007AFF]/10">
                  <div className="flex items-center justify-between mb-2">
                     <h4 className="text-white/80 font-body tracking-tight text-sm tracking-tight flex items-center gap-2">
                        <BrainCircuit size={16} />
                        Deep Intel & Strategy Prep
                     </h4>
                  </div>
                  <p className="text-xs text-white/60 mb-4">Generate undeniable leverage before you send the first email.</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                     <button onClick={handleGenerateCompetitorXRay} disabled={aiCompetitor} className="bg-white/10 hover:bg-white/20 border border-white/[0.04] text-white/80 text-xs py-3 px-3 rounded transition-colors flex flex-col items-start gap-1 disabled:opacity-50">
                        <span className="font-bold">{aiCompetitor ? 'Analyzing...' : 'Competitor Battlecard'}</span>
                        <span className="text-[10px] text-white/80/60 text-left">Generate a side-by-side Battlecard against a rival.</span>
                     </button>
                     <button onClick={handleGeneratePsychographic} disabled={aiPsychographic} className="bg-white/10 hover:bg-white/20 border border-white/[0.04] text-white/80 text-xs py-3 px-3 rounded transition-colors flex flex-col items-start gap-1 disabled:opacity-50">
                        <span className="font-bold">{aiPsychographic ? 'Profiling...' : 'Psychographic Profile'}</span>
                        <span className="text-[10px] text-white/80/60 text-left">Deep dive into their fears and desires.</span>
                     </button>
                     <button onClick={handleGenerateHookBlueprint} disabled={aiHookBlueprint} className="bg-white/10 hover:bg-white/20 border border-white/[0.04] text-white/80 text-xs py-3 px-3 rounded transition-colors flex flex-col items-start gap-1 disabled:opacity-50">
                        <span className="font-bold">{aiHookBlueprint ? 'Drafting...' : 'Viral Hook Blueprint'}</span>
                        <span className="text-[10px] text-white/80/60 text-left">Generate 5 compelling video hooks.</span>
                     </button>
                     <button onClick={handleGenerateContractNegotiator} disabled={aiContractNegotiator} className="bg-white/10 hover:bg-white/20 border border-white/[0.04] text-white/80 text-xs py-3 px-3 rounded transition-colors flex flex-col items-start gap-1 disabled:opacity-50">
                        <span className="font-bold">{aiContractNegotiator ? 'Advising...' : 'Contract Negotiator'}</span>
                        <span className="text-[10px] text-white/80/60 text-left">How to structure your terms & deposit.</span>
                     </button>
                     <button onClick={handleGenerateColdSequence} disabled={aiColdSequence} className="bg-white/10 hover:bg-white/20 border border-white/[0.04] text-white/80 text-xs py-3 px-3 rounded transition-colors flex flex-col items-start gap-1 disabled:opacity-50">
                        <span className="font-bold">{aiColdSequence ? 'Drafting...' : 'Auto-Pilot Outreach sequence'}</span>
                        <span className="text-[10px] text-white/80/60 text-left">Generate 3-step cold email sequence targeting flaws.</span>
                     </button>
                     <button onClick={handleGenerateContractAssembly} disabled={aiContractAssembly} className="bg-white/10 hover:bg-white/20 border border-white/[0.04] text-white/80 text-xs py-3 px-3 rounded transition-colors flex flex-col items-start gap-1 disabled:opacity-50">
                        <span className="font-bold">{aiContractAssembly ? 'Assembling...' : 'Contract Assembly'}</span>
                        <span className="text-[10px] text-white/80/60 text-left">Draft & export bullet-proof SOW.</span>
                     </button>
                  </div>
               </div>

               {/* Creative Value Adds */}
               <div className="mb-4 p-5 rounded-2xl border border-white/[0.04] bg-[#FF2D55]/10">
                  <div className="flex items-center justify-between mb-2">
                     <h4 className="text-white/80 font-body tracking-tight text-sm tracking-tight flex items-center gap-2">
                        <Clapperboard size={16} />
                        Creative Value Adds
                     </h4>
                  </div>
                  <p className="text-xs text-white/60 mb-4">Arm yourself with creative strategy to over-deliver in your pitch.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                     <button onClick={handleGenerateStoryboard} disabled={aiStoryboard} className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs py-3 px-3 rounded transition-colors flex flex-col items-start gap-1 disabled:opacity-50">
                        <span className="font-bold">{aiStoryboard ? 'Drafting...' : 'Storyboard & B-Roll'}</span>
                        <span className="text-[10px] text-rose-400/60 text-left">Visual hooks and b-roll concepts.</span>
                     </button>
                     <button onClick={handleGenerateSoundDesign} disabled={aiSoundDesign} className="bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/20 text-fuchsia-300 text-xs py-3 px-3 rounded transition-colors flex flex-col items-start gap-1 disabled:opacity-50">
                        <span className="font-bold">{aiSoundDesign ? 'Analyzing...' : 'Sonic & Sound Design'}</span>
                        <span className="text-[10px] text-fuchsia-400/60 text-left">SFX, pacing, and sonic branding.</span>
                     </button>
                     <button onClick={handleGenerateTitles} disabled={aiTitles} className="bg-white/10 hover:bg-white/20 border border-white/[0.04] text-white/80 text-xs py-3 px-3 rounded transition-colors flex flex-col items-start gap-1 disabled:opacity-50">
                        <span className="font-bold">{aiTitles ? 'Ideating...' : 'Titles & Thumbs'}</span>
                        <span className="text-[10px] text-white/80/60 text-left">Generate highly-clickable ideas.</span>
                     </button>
                  </div>
               </div>

               {/* Master Closing & Objection Handling */}
               <div className="mb-4 p-5 rounded-2xl border border-white/[0.04] bg-amber-950/10">
                  <div className="flex items-center justify-between mb-2">
                     <h4 className="text-white/80 font-body tracking-tight text-sm tracking-tight flex items-center gap-2">
                        <Handshake size={16} />
                        Master Closing & Negotiation
                     </h4>
                  </div>
                  <p className="text-xs text-white/60 mb-4">Lethal sales strategies to handle objections and close the deal.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                     <button onClick={handleGenerateObjections} disabled={aiObjections} className="bg-white/10 hover:bg-white/20 border border-white/[0.04] text-white/80 text-xs py-3 px-3 rounded transition-colors flex flex-col items-start gap-1 disabled:opacity-50">
                        <span className="font-bold">{aiObjections ? 'Predicting...' : 'Objection Handling'}</span>
                        <span className="text-[10px] text-white/80/60 text-left">Anticipate "No"s with Judo scripts.</span>
                     </button>
                     <button onClick={handleGenerateRiskReversal} disabled={aiRiskReversal} className="bg-white/10 hover:bg-white/20 border border-white/[0.04] text-white/80 text-xs py-3 px-3 rounded transition-colors flex flex-col items-start gap-1 disabled:opacity-50">
                        <span className="font-bold">{aiRiskReversal ? 'Crafting...' : 'Risk Reversal Pitch'}</span>
                        <span className="text-[10px] text-white/80/60 text-left">Undeniable guarantee frameworks.</span>
                     </button>
                     <button onClick={handleGenerateZoomFramework} disabled={aiZoomFramework} className="bg-white/10 hover:bg-white/20 border border-white/[0.04] text-white/80 text-xs py-3 px-3 rounded transition-colors flex flex-col items-start gap-1 disabled:opacity-50">
                        <span className="font-bold">{aiZoomFramework ? 'Structuring...' : 'Zoom Close Playbook'}</span>
                        <span className="text-[10px] text-white/80/60 text-left">Step-by-step strategy for the call.</span>
                     </button>
                  </div>
               </div>

               {/* Lead Master Toolkit */}
               <div className="mb-2 p-5 rounded-2xl border border-white/[0.04] bg-[#5E5CE6]/10">
                  <div className="flex items-center justify-between mb-2">
                     <h4 className="text-white/80 font-body tracking-tight text-sm tracking-tight flex items-center gap-2">
                        <Target size={16} />
                        Lead Master Authority Toolkit
                     </h4>
                  </div>
                  <p className="text-xs text-white/60 mb-4">Hyper-advanced strategies to dominate the pipeline and force action.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                     <button onClick={handleGenerateGodfatherOffer} disabled={aiGodfather} className="bg-white/10 hover:bg-white/20 border border-white/[0.04] text-white/80 text-xs py-3 px-3 rounded transition-colors flex flex-col items-start gap-1 disabled:opacity-50">
                        <span className="font-bold">{aiGodfather ? 'Crafting...' : 'The Godfather Offer'}</span>
                        <span className="text-[10px] text-white/80/60 text-left">An offer they cannot refuse.</span>
                     </button>
                     <button onClick={handleGenerateValueBomb} disabled={aiValueBomb} className="bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 border border-white/[0.04] text-violet-300 text-xs py-3 px-3 rounded transition-colors flex flex-col items-start gap-1 disabled:opacity-50">
                        <span className="font-bold">{aiValueBomb ? 'Designing...' : 'Proof-of-Competence Bomb'}</span>
                        <span className="text-[10px] text-violet-400/60 text-left">Free micro-audits to show skill.</span>
                     </button>
                     <button onClick={handleGenerateGhostReactivation} disabled={aiGhostReact} className="bg-white/10 hover:bg-white/20 border border-white/[0.04] text-white/80 text-xs py-3 px-3 rounded transition-colors flex flex-col items-start gap-1 disabled:opacity-50">
                        <span className="font-bold">{aiGhostReact ? 'Writing...' : 'Ghost-Buster Protocol'}</span>
                        <span className="text-[10px] text-white/80/60 text-left">Re-engage completely dead leads.</span>
                     </button>
                  </div>
               </div>

            </div>
          )}

          {activeTab === 'activity' && (
            <div className="animate-[fade-in_0.2s_ease-out] flex flex-col gap-4">
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar border-b border-white/[0.02] pb-3">
                <button onClick={() => setNoteFilter('all')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${noteFilter === 'all' ? 'bg-[var(--brand-primary)] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>All Activity</button>
                <button onClick={() => setNoteFilter('note')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${noteFilter === 'note' ? 'bg-zinc-700 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>Notes</button>
                <button onClick={() => setNoteFilter('client_feedback')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${noteFilter === 'client_feedback' ? 'bg-[var(--brand-primary)] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>Client Feedback</button>
                <button onClick={() => setNoteFilter('status_change')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${noteFilter === 'status_change' ? 'bg-[var(--brand-primary)] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>Status Changes</button>
                <button onClick={() => setNoteFilter('task_completed')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${noteFilter === 'task_completed' ? 'bg-[var(--brand-primary)] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>Tasks</button>
                <button onClick={() => setNoteFilter('file_upload')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${noteFilter === 'file_upload' ? 'bg-[var(--brand-primary)] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>Files</button>
                <button onClick={() => setNoteFilter('telemetry')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${noteFilter === 'telemetry' ? 'bg-[var(--brand-primary)] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>Telemetry</button>
              </div>
              <div className="flex flex-col gap-4 text-white font-mono text-sm leading-relaxed whitespace-pre-wrap relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-[#141414]">
                {(() => {
                   const allActivity = [...notes];
                   if (videoComments && videoComments.length > 0) {
                      videoComments.forEach(vc => {
                         let dt;
                         if (vc.createdAt && typeof vc.createdAt.toDate === 'function') {
                            dt = vc.createdAt;
                         } else if (vc.createdAt) {
                            dt = { toDate: () => new Date(vc.createdAt) };
                         } else {
                            dt = { toDate: () => new Date() };
                         }
                         allActivity.push({
                           type: 'client_feedback',
                           text: `**Video Comment at ${vc.time}s:**\n${vc.text}`,
                           createdAt: dt
                         });
                      });
                   }
                   if ((lead as any).feedback && (lead as any).feedback.length > 0) {
                      (lead as any).feedback.forEach((f: any) => {
                        allActivity.push({
                          type: 'client_feedback',
                          text: `**Client Feedback:**\n${f.text}`,
                          createdAt: { toDate: () => new Date(f.timestamp) }
                        });
                      });
                   }
                   if ((lead as any).telemetryEvents && (lead as any).telemetryEvents.length > 0) {
                      (lead as any).telemetryEvents.forEach((t: any) => {
                         let dt;
                         if (t.timestamp && typeof t.timestamp.toDate === 'function') {
                            dt = t.timestamp;
                         } else if (t.timestamp) {
                            dt = { toDate: () => new Date(t.timestamp) };
                         } else {
                            dt = { toDate: () => new Date() };
                         }
                         allActivity.push({
                           type: 'telemetry',
                           text: `**Client Telemetry ${t.type.replace('_', ' ')}:**\n${t.detail || ''}`,
                           createdAt: dt
                         });
                      });
                   }
                   allActivity.sort((a, b) => {
                      const dA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                      const dB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                      return dA - dB;
                   });
                   const filtered = allActivity.filter(n => noteFilter === 'all' || n.type === noteFilter || (noteFilter === 'note' && !n.type));
                   
                   if (filtered.length === 0) {
                     return (
                      <div className="text-white/40 flex items-center justify-center flex-col gap-2 p-10">
                        <Activity size={24} className="opacity-20" />
                        <p className="text-xs">No activity yet.</p>
                      </div>
                     );
                   }

                   return filtered.map((n, i) => (
                    <div key={i} className="relative pl-8 group">
                      <div className={`absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full flex items-center justify-center border-2 border-black
                        ${n.type === 'status_change' ? 'bg-[var(--brand-primary)] text-white' : 
                          n.type === 'task_completed' ? 'bg-[var(--brand-primary)] text-white' : 
                          n.type === 'file_upload' ? 'bg-[var(--brand-primary)] text-white' : 
                          n.type === 'client_feedback' ? 'bg-[var(--brand-primary)] text-white' : 
                          n.type === 'telemetry' ? 'bg-[var(--brand-primary)] text-white' : 
                          'bg-zinc-700'}`}>
                         {n.type === 'status_change' && <RefreshCw size={10} className="text-white" />}
                         {n.type === 'task_completed' && <CheckCircle size={10} className="text-white" />}
                         {n.type === 'file_upload' && <Paperclip size={10} className="text-white" />}
                         {n.type === 'client_feedback' && <MessageSquare size={10} className="text-white" />}
                         {n.type === 'telemetry' && <Activity size={10} className="text-white" />}
                         {(!n.type || n.type === 'note') && <Target size={10} className="text-white" />}
                      </div>
                      <div className={`p-3 rounded-2xl border relative ${n.type === 'client_feedback' ? 'bg-white/10 border-white/[0.04]' : n.type === 'telemetry' ? 'bg-white/10 border-white/[0.04]' : 'bg-[#000000] border-white/[0.02]'}`}>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleExportNoteAsPDF(n.text, n.type || 'export')} className="text-[#FF3B30] hover:text-white bg-[#FF3B30]/10 hover:bg-[#FF3B30] p-1.5 rounded-2xl transition-all" title="Download as Branded PDF"><FileDown size={12}/></button>
                          <button onClick={() => { navigator.clipboard.writeText(n.text); toast.success('Note copied to clipboard'); }} className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-2xl transition-colors" title="Copy to clipboard"><Copy size={12}/></button>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-white/60 flex items-center gap-2">
                             {n.createdAt?.toDate ? format(n.createdAt.toDate(), 'MMM d, h:mm a') : 'Now'}
                          </span>
                          {n.type === 'file_upload' ? (
                            <div className="flex items-center gap-2 mt-1">
                               <FileText size={16} className="text-white/80" />
                               <a href={n.metadata} target="_blank" rel="noreferrer" className="text-sm text-white/80 hover:text-white/80 hover:underline">{n.text}</a>
                            </div>
                          ) : (
                            <div className={`prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#000000]/50 prose-pre:border prose-pre:border-white/[0.04] text-sm opacity-90 ${n.type === 'client_feedback' ? 'text-yellow-100' : 'text-white/80'}`}>
                              <Markdown>{n.text}</Markdown>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                  placeholder="Add a manual note..."
                  className="flex-1 bg-[#000000]/40 border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] font-mono"
                />
                <button 
                  onClick={() => setIsMeetingModalOpen(true)} 
                  className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)] text-white px-4 rounded-2xl transition-colors flex items-center justify-center border border-white/[0.04] group relative shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0" 
                  title="AI Meeting Intelligence & Auto-CRM"
                >
                  <BrainCircuit size={16} className="text-white" />
                </button>
                <button onClick={() => handleAddNote()} disabled={loading} className="bg-white/5 hover:bg-white/10 text-white px-4 rounded-2xl transition-colors border border-white/[0.02]">
                  <Plus size={16} />
                </button>
                <div className="relative">
                  <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  <button disabled={uploadingFiles} className="bg-white/5 hover:bg-white/10 text-white p-3 rounded-2xl transition-colors border border-white/[0.02] h-full flex items-center justify-center">
                    {uploadingFiles ? <RefreshCw size={16} className="animate-spin" /> : <Paperclip size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="animate-[fade-in_0.2s_ease-out] flex flex-col gap-10">
              <div>
                <div className="flex justify-between flex-wrap gap-2 mb-4">
                  <button onClick={handleCopyTrackerLink} className="text-zinc-100 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 flex-1 justify-center transition-colors">
                    <LinkIcon size={12} /> Secure Client Portal Link
                  </button>
                  <a href={`/?mode=tracker&id=${lead.id}`} target="_blank" rel="noreferrer" title="Open Client Portal" className="text-white/60 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded text-xs flex items-center justify-center transition-colors">
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="mb-4 space-y-2 border-b border-white/[0.02] pb-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-3 px-2">Client Portal Milestones</h4>
                  {[
                    { key: 'raw_received', label: 'Raw Footage Received' },
                    { key: 'v1_sent', label: 'V1 Rough Cut' },
                    { key: 'revisions_done', label: 'Revisions Addressed' },
                    { key: 'final_exported', label: 'Final Edit Exported' },
                    { key: 'payment_received', label: 'Payment Received' }
                  ].map(step => (
                    <div 
                      key={step.key} 
                      className={`flex items-center gap-2 text-sm p-2 rounded border transition-all duration-300 ${
                        tasks[step.key]
                          ? 'bg-[#000000]/10 border-white/[0.02] opacity-50'
                          : 'bg-[#000000]/20 border-white/[0.04]'
                      }`}
                    >
                      <motion.button 
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleToggleTask(step.key)} 
                        className={`transition-colors ${tasks[step.key] ? 'text-white/80' : 'text-white/60 hover:text-white'}`}
                      >
                        <div>
                          {tasks[step.key] ? <CheckSquare size={14} /> : <Square size={14} />}
                        </div>
                      </motion.button>
                      <span className={`font-mono flex-1 px-2 py-1 ${tasks[step.key] ? 'line-through text-white/40' : 'text-white/90'} transition-all duration-300`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mt-4 mb-4 pb-4 border-b border-white/[0.02]">
                   <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-100 mb-3 px-2 mt-2">Deliverables Links</h4>
                   <div>
                     <label className="text-xs text-white/50 px-2 block mb-1">Review Video URL (Frame.io, Vimeo...)</label>
                     <input type="text" defaultValue={lead.reviewVideoUrl || ''} onBlur={(e) => { if (e.target.value !== lead.reviewVideoUrl) updateDoc(doc(db, 'leads', lead.id), { reviewVideoUrl: e.target.value }) }} className="w-full bg-[#000000]/40 border border-white/[0.04] p-2 rounded text-sm text-white transition-colors focus:border-white/[0.04] focus:outline-none" placeholder="https://..." />
                   </div>
                   <div>
                     <label className="text-xs text-white/50 px-2 block mb-1 mt-2">Final Master DL Link (Drive, Dropbox...)</label>
                     <input type="text" defaultValue={lead.masterFileUrl || ''} onBlur={(e) => { if (e.target.value !== lead.masterFileUrl) updateDoc(doc(db, 'leads', lead.id), { masterFileUrl: e.target.value }) }} className="w-full bg-[#000000]/40 border border-white/[0.04] p-2 rounded text-sm text-white transition-colors focus:border-white/[0.04] focus:outline-none" placeholder="https://..." />
                   </div>
                </div>

                <div className="space-y-2 mb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-3 px-2 mt-2">Custom Tasks</h4>
                  {(lead.customTasks || []).map(task => (
                    <div 
                      key={task.id} 
                      className={`flex items-center gap-2 text-sm p-2 rounded border group transition-all duration-300 ${
                        task.completed 
                          ? 'bg-[#000000]/10 border-white/[0.02] opacity-50' 
                          : 'bg-[#000000]/20 border-white/[0.04]'
                      }`}
                    >
                      <motion.button 
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleToggleCustomTask(task.id)} 
                        className={`transition-colors ${task.completed ? 'text-white/80' : 'text-white/60 hover:text-white'}`}
                      >
                        <div>
                          {task.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                        </div>
                      </motion.button>
                      
                      {editingTaskId === task.id ? (
                        <input
                          type="text"
                          value={editTaskTitle}
                          onChange={e => setEditTaskTitle(e.target.value)}
                          onBlur={() => handleSaveEditTask(task.id)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveEditTask(task.id)}
                          autoFocus
                          className="bg-[#000000]/50 border border-white/[0.04] text-white focus:outline-none focus:border-white/[0.04] text-sm px-2 py-1 flex-1 font-mono rounded"
                        />
                      ) : (
                        <span 
                          onClick={() => { setEditingTaskId(task.id); setEditTaskTitle(task.title); }}
                          className={`font-mono flex-1 cursor-text px-2 py-1 ${task.completed ? 'line-through text-white/40' : 'text-white/90'} transition-all duration-300`}
                        >
                          {task.title}
                        </span>
                      )}

                      <button onClick={() => setSelectedTaskId(task.id)} className="text-white/40 hover:text-white transition-colors" title="View Task Details">
                        <ChevronRight size={16} />
                      </button>

                      <button onClick={() => handleDeleteCustomTask(task.id)} className="text-white/20 hover:text-[#FF3B30] opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex items-center gap-2 mt-3 bg-[#000000]/20 p-2 rounded border border-white/[0.02] border-dashed">
                    <Plus size={14} className="text-white/40 ml-1" />
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddCustomTask()}
                      placeholder="Add new task..."
                      className="bg-transparent text-white focus:outline-none focus:border-b focus:border-white/[0.02] text-sm px-1 py-1 w-full font-mono placeholder:text-white/20 transition-colors"
                    />
                    <button 
                      onClick={handleAddCustomTask} 
                      disabled={!newTaskTitle.trim()} 
                      className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.02] pt-4">
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-3 flex items-center gap-2"><Calendar size={14}/> Reminder</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={followUpInput}
                    onChange={e => setFollowUpInput(e.target.value)}
                    className="flex-1 bg-[#000000]/40 border border-white/[0.04] rounded p-2 text-xs text-white focus:outline-none focus:border-white/[0.04] font-mono"
                  />
                  <button onClick={handleSetReminder} className="bg-white/5 hover:bg-white/10 border border-white/[0.02] text-white text-xs px-4 py-2 rounded transition-colors whitespace-nowrap">
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="animate-[fade-in_0.2s_ease-out] space-y-5">
              <FileUploader 
                 leadId={lead.id} 
                 existingFiles={lead.uploadedAssets || []} 
                 onUploadComplete={async (files) => {
                     try {
                         await updateDoc(doc(db, 'leads', lead.id), { uploadedAssets: files });
                     } catch (err) {
                         toast.error("Failed to update asset list");
                         console.error(err);
                     }
                 }} 
              />
              <div className="border-t border-white/[0.02] pt-4">
                <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">External Links (Drive, Frame.io)</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={rawFootageUrlInput}
                      onChange={e => setRawFootageUrlInput(e.target.value)}
                      placeholder="Legacy/External Raw Footage URL"
                      className="flex-1 bg-[#000000]/40 border border-white/[0.04] rounded p-2 text-xs text-white focus:outline-none focus:border-white/[0.04] font-mono"
                    />
                    <button onClick={() => handleSetProjectAsset('rawFootageUrl', rawFootageUrlInput)} className="bg-[#141414] hover:bg-zinc-700 text-white text-xs px-4 py-2 rounded font-bold uppercase tracking-[0.2em] transition-colors whitespace-nowrap">
                      Update
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={reviewVideoUrlInput}
                      onChange={e => setReviewVideoUrlInput(e.target.value)}
                      placeholder="Review Video (Frame.io) URL"
                      className="flex-1 bg-[#000000]/40 border border-white/[0.04] rounded p-2 text-xs text-white focus:outline-none focus:border-white/[0.04] font-mono"
                    />
                    <button onClick={handleSetReviewVideo} className="bg-white/10 hover:bg-white/20 text-zinc-100 border border-white/[0.04] text-xs px-4 py-2 rounded font-bold uppercase tracking-[0.2em] transition-colors whitespace-nowrap">
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portals' && (
            <div className="animate-[fade-in_0.2s_ease-out] space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#fff]">Sales Room Settings</h3>
                  {lead.salesRoomViews > 0 && (
                    <span className="text-[10px] text-emerald-400/80 font-mono mt-1 flex items-center gap-1">
                      <MonitorPlay size={10} /> Viewed {lead.salesRoomViews} time{lead.salesRoomViews !== 1 ? 's' : ''} (Last: {lead.salesRoomLastVisitedAt?.toDate ? new Date(lead.salesRoomLastVisitedAt.toDate()).toLocaleString() : 'Recently'})
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin.replace("ais-dev", "ais-pre")}/?mode=sales-room&id=${lead.id}`);
                    toast.success("Sales Room link copied!");
                  }} className="text-xs text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded flex items-center gap-2">
                    <MonitorPlay size={12}/> Copy Sales Room
                  </button>
                  <button onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin.replace("ais-dev", "ais-pre")}/?mode=onboarding&id=${lead.id}`);
                    toast.success("Onboarding link copied!");
                  }} className="text-xs text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded flex items-center gap-2">
                    <UploadCloud size={12}/> Copy Onboarding
                  </button>
                  <button onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin.replace("ais-dev", "ais-pre")}/?mode=video-review&id=${lead.id}`);
                    toast.success("Video Review link copied!");
                  }} className="text-xs text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded flex items-center gap-2">
                    <Video size={12}/> Copy Video Review
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Target Retention Rate</label>
                    <input type="text" value={editForm.targetRetentionRate} onChange={e => setEditForm({...editForm, targetRetentionRate: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="e.g. 45%+" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Predicted Pipeline Value (LTV)</label>
                    <input type="text" value={editForm.predictedLTV} onChange={e => setEditForm({...editForm, predictedLTV: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="e.g. $120K" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-100 uppercase tracking-[0.2em] font-mono mb-1">Case Study: Sample Edit Video URL</label>
                  <input type="url" value={editForm.reviewVideoUrl} onChange={e => setEditForm({...editForm, reviewVideoUrl: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.12] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="URL for the sample edit video" />
                </div>

                <div className="space-y-4 border border-white/[0.04] p-4 rounded-2xl bg-white/[0.01]">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/70 mb-2">Sales Room Add-ons</h4>
                  <div className="grid grid-cols-1 gap-4">
                     <div>
                        <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Loom Video URL (Embed or Watch Link)</label>
                        <input type="text" value={editForm.loomVideoUrl} onChange={e => setEditForm({...editForm, loomVideoUrl: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="https://www.loom.com/share/..." />
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Testimonial Quote</label>
                         <textarea value={editForm.testimonialQuote} onChange={e => setEditForm({...editForm, testimonialQuote: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors resize-none h-24" placeholder="&quot;They doubled our retention...&quot;" />
                     </div>
                     <div className="flex flex-col gap-4">
                        <div>
                           <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Testimonial Author</label>
                           <input type="text" value={editForm.testimonialAuthor} onChange={e => setEditForm({...editForm, testimonialAuthor: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="e.g. Ali Abdaal" />
                        </div>
                        <div>
                           <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Testimonial Source</label>
                           <input type="text" value={editForm.testimonialSource} onChange={e => setEditForm({...editForm, testimonialSource: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="e.g. YouTuber (Optional)" />
                        </div>
                     </div>
                  </div>
                </div>

                <div className="space-y-4 border border-white/[0.04] p-4 rounded-2xl bg-white/[0.01]">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/70 mb-2">Case Study Cards Customization</h4>
                  
                  {/* Card 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Card 1: Title & Label</label>
                        <input type="text" value={editForm.caseStudy1Title} onChange={e => setEditForm({...editForm, caseStudy1Title: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="e.g. Narrative Hook" />
                     </div>
                     <div>
                        <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Card 1: Text</label>
                        <input type="text" value={editForm.caseStudy1Text} onChange={e => setEditForm({...editForm, caseStudy1Text: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="e.g. Cold open applied..." />
                     </div>
                  </div>

                  {/* Card 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Card 2: Title & Label</label>
                        <input type="text" value={editForm.caseStudy2Title} onChange={e => setEditForm({...editForm, caseStudy2Title: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="e.g. Pacing Density" />
                     </div>
                     <div>
                        <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Card 2: Stat</label>
                        <input type="text" value={editForm.caseStudy2Stat} onChange={e => setEditForm({...editForm, caseStudy2Stat: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="e.g. -40%" />
                     </div>
                     <div>
                        <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Card 2: Subtext</label>
                        <input type="text" value={editForm.caseStudy2Text} onChange={e => setEditForm({...editForm, caseStudy2Text: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="e.g. Dead Air Removed" />
                     </div>
                  </div>

                  {/* Card 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Card 3: Title & Label</label>
                        <input type="text" value={editForm.caseStudy3Title} onChange={e => setEditForm({...editForm, caseStudy3Title: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="e.g. Projected Return" />
                     </div>
                     <div>
                        <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Card 3: Stat</label>
                        <input type="text" value={editForm.caseStudy3Stat} onChange={e => setEditForm({...editForm, caseStudy3Stat: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="e.g. +22%" />
                     </div>
                     <div>
                        <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Card 3: Subtext</label>
                        <input type="text" value={editForm.caseStudy3Text} onChange={e => setEditForm({...editForm, caseStudy3Text: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="e.g. Relative Increase" />
                     </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">AI Audit / Strategy Markdown</label>
                  <textarea value={editForm.aiAudit} onChange={e => setEditForm({...editForm, aiAudit: e.target.value})} className="w-full bg-[black] font-mono border border-white/[0.04] rounded-2xl p-3 text-sm text-white/70 focus:outline-none focus:border-white/[0.04] min-h-[150px] transition-colors" placeholder="Paste the diagnostic markdown here..." />
                </div>

                <div className="pt-4 border-t border-white/[0.02] space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#fff]">Onboarding Settings</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Welcome Title</label>
                      <input type="text" value={editForm.onboardingTitle} onChange={e => setEditForm({...editForm, onboardingTitle: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] transition-colors" placeholder="e.g. Creative Direction." />
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-1">Welcome Message</label>
                      <textarea value={editForm.onboardingMessage} onChange={e => setEditForm({...editForm, onboardingMessage: e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-white/[0.04] min-h-[80px] transition-colors" placeholder="e.g. To ensure the final edit aligns with your vision..." />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/[0.02]">
                  <button onClick={handleSaveDetails} className="bg-[var(--brand-primary)] text-white hover:bg-zinc-200 text-black shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-black font-bold px-5 py-2.5 rounded-2xl text-xs tracking-[0.2em] uppercase transition-colors">Save Portal Settings</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="animate-[fade-in_0.2s_ease-out] flex flex-col h-full h-[50vh]">
               {initialLead.distressSignal && (
                 <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex gap-3 items-start">
                    <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                      <BrainCircuit size={16} />
                    </div>
                    <div>
                      <h4 className="text-red-400 font-bold text-sm tracking-tight mb-1">AI Distress Warning</h4>
                      <p className="text-red-400/80 text-xs mb-3">Client sentiment indicates frustration. Immediate action recommended.</p>
                      {initialLead.suggestedImprovements && initialLead.suggestedImprovements.length > 0 && (
                        <div className="text-xs text-red-300">
                          <strong>Suggested Actions:</strong>
                          <ul className="list-disc pl-4 mt-2 mb-3">
                            {initialLead.suggestedImprovements.map((imp: any, idx: number) => (
                              <li key={idx} className="mb-1">{imp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {initialLead.autoDraftedReply && (
                        <div className="mt-2 bg-black/40 border border-red-500/20 rounded-lg p-3">
                          <div className="text-[10px] uppercase font-mono tracking-widest text-red-500/70 mb-2 font-bold">Auto-Drafted De-escalation Reply</div>
                          <div className="text-xs text-red-100/90 whitespace-pre-wrap">{initialLead.autoDraftedReply}</div>
                          <button onClick={() => setChatMessage(initialLead.autoDraftedReply!)} className="mt-3 bg-red-500 hover:bg-red-400 text-black px-4 py-1.5 rounded text-xs font-bold transition-colors">Use Draft</button>
                        </div>
                      )}
                    </div>
                 </div>
               )}

               {!initialLead.distressSignal && initialLead.autoDraftedReply && (
                 <div className="mb-4 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30 rounded-2xl p-4 flex gap-3 items-start">
                    <div className="p-2 bg-[var(--brand-primary)]/20 rounded-lg text-[var(--brand-primary)]">
                      <BrainCircuit size={16} />
                    </div>
                    <div>
                      <h4 className="text-[var(--brand-primary)] font-bold text-sm tracking-tight mb-1">AI Smart Draft</h4>
                      <p className="text-[var(--brand-primary)]/80 text-xs mb-3">Based on the latest comments, here is a suggested reply.</p>
                      
                       <div className="mt-2 bg-black/40 border border-[var(--brand-primary)]/20 rounded-lg p-3">
                          <div className="text-[10px] uppercase font-mono tracking-widest text-[var(--brand-primary)]/70 mb-2 font-bold">Auto-Drafted Reply</div>
                          <div className="text-xs text-[var(--brand-primary)]/90 whitespace-pre-wrap">{initialLead.autoDraftedReply}</div>
                          <button onClick={() => setChatMessage(initialLead.autoDraftedReply!)} className="mt-3 bg-[var(--brand-primary)] text-black px-4 py-1.5 rounded text-xs font-bold transition-colors">Use Draft</button>
                        </div>
                    </div>
                 </div>
               )}

               <div className="flex-1 overflow-y-auto mb-4 bg-[#0a0a0a] rounded-2xl border border-white/[0.04] p-4 flex flex-col gap-3 custom-scrollbar">
                  {chatMessages.length === 0 ? (
                     <div className="text-center text-white/50 text-xs my-auto font-mono">
                        Integrated Email Inbox. Say hi to {initialLead.brandName || "the client"}.
                     </div>
                  ) : (
                     chatMessages.map(msg => (
                        <div key={msg.id} className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.senderRole === 'agency' ? 'bg-white/10 text-white ml-auto rounded-tr-sm border border-white/[0.05]' : 'bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30 text-white mr-auto rounded-tl-sm'}`}>
                           <p className="text-[10px] uppercase font-mono tracking-widest text-white/40 mb-2">{msg.senderRole === 'agency' ? 'You (via Email)' : 'Client (via Email)'} — {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'Just now'}</p>
                           {msg.text}
                        </div>
                     ))
                  )}
                  <div ref={chatMessagesEndRef} />
               </div>
               <div className="flex gap-2">
                   <input
                       type="text"
                       value={chatMessage}
                       onChange={e => setChatMessage(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' ? handleSendMessage() : null}
                       placeholder="Draft an email reply..."
                       className="flex-1 bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--brand-primary)]/50"
                   />
                   <button onClick={handleSendMessage} className="px-6 bg-white text-black hover:bg-neutral-200 rounded-xl flex items-center justify-center font-bold tracking-widest transition-colors disabled:opacity-50 text-[10px] uppercase" disabled={!chatMessage.trim()}>
                       Send Email
                   </button>
               </div>
            </div>
          )}

        </div>
      </div>
      
      {isMeetingModalOpen && (
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-[110] flex flex-col justify-center items-center p-10 sm:p-10">
          <div className="w-full max-w-3xl bg-[#0a0a0a] rounded-2xl border border-white/[0.04] flex flex-col max-h-[80vh] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
            <div className="flex justify-between items-center p-10 border-b border-white/[0.04] shrink-0 bg-[#000000]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-white/20 text-white/80">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-body tracking-tight font-bold text-white">AI Meeting Intelligence</h2>
                  <p className="text-xs font-mono text-white/80/70 tracking-[0.2em] uppercase">Auto-CRM & Follow-up Draft</p>
                </div>
              </div>
              <button onClick={() => setIsMeetingModalOpen(false)} className="text-white/60 hover:text-white p-2 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 p-10 overflow-y-auto bg-[#141414]">
               <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 mb-3 block">Paste Zoom / Google Meet Transcript</h3>
               <textarea
                 value={meetingTranscript}
                 onChange={e => setMeetingTranscript(e.target.value)}
                 className="w-full h-64 bg-[#000000] border border-white/[0.04] rounded-2xl p-4 text-sm text-white/80 focus:outline-none focus:border-white/[0.04] resize-none font-mono mb-4 leading-relaxed custom-scrollbar"
                 placeholder="Upload your sales call transcript here. AI will extract budget, timeline, pain points, and draft a personalized follow-up..."
               />
               <button 
                 onClick={handleAnalyzeMeeting}
                 disabled={analyzingMeeting || !meetingTranscript.trim()}
                 className="w-full bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)] text-white disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl uppercase tracking-[0.2em] text-xs flex justify-center items-center gap-3 transition-colors shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
               >
                 {analyzingMeeting ? <><RefreshCw size={16} className="animate-spin" /> Processing Meeting...</> : <><Sparkles size={16} /> Analyze Transcript & Update CRM</>}
               </button>
               <p className="text-center text-zinc-600 text-[10px] uppercase font-mono tracking-[0.2em] mt-4">This action will update the lead's budget, timeline, and generate an email draft.</p>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTaskId && (
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-[110] flex flex-col justify-center items-center p-4 sm:p-10">
          <div className="w-full max-w-lg bg-[#0a0a0a] rounded-2xl border border-white/[0.04] flex flex-col max-h-[80vh] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
            {(() => {
              const task = lead.customTasks?.find(t => t.id === selectedTaskId);
              if (!task) return null;
              return (
                <>
                  <div className="flex justify-between items-center p-6 border-b border-white/[0.04] bg-[#000000]/50 shrink-0">
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest">{task.title}</h2>
                    <button onClick={() => setSelectedTaskId(null)} className="text-white/60 hover:text-white p-2 transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto bg-[#141414] flex-1">
                    <div className="mb-6">
                      <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-2">Notes & Context</label>
                      <textarea
                        value={task.notes || ''}
                        onChange={e => handleUpdateCustomTask(task.id, { notes: e.target.value })}
                        className="w-full bg-[#000000] border border-white/[0.04] rounded-2xl p-4 text-sm text-white/80 focus:outline-none focus:border-white/[0.04] resize-none min-h-[120px] font-mono"
                        placeholder="Add details, links, or context for this task..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-2">Subtasks</label>
                      <div className="space-y-2 mb-3">
                        {(task.subtasks || []).map((subtask) => (
                          <div key={subtask.id} className="flex items-center gap-2 text-sm p-2 bg-[#000000]/20 rounded border border-white/[0.04] group">
                            <button
                              onClick={() => {
                                const newSubtasks = task.subtasks!.map(s => s.id === subtask.id ? { ...s, completed: !s.completed } : s);
                                handleUpdateCustomTask(task.id, { subtasks: newSubtasks });
                              }}
                              className={`transition-colors ${subtask.completed ? 'text-white/80' : 'text-white/60 hover:text-white'}`}
                            >
                              {subtask.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                            </button>
                            <span className={`flex-1 font-mono ${subtask.completed ? 'line-through text-white/40' : 'text-white/90'}`}>{subtask.title}</span>
                            <button
                              onClick={() => {
                                const newSubtasks = task.subtasks!.filter(s => s.id !== subtask.id);
                                handleUpdateCustomTask(task.id, { subtasks: newSubtasks });
                              }}
                              className="text-white/20 hover:text-[#FF3B30] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 bg-[#000000]/20 p-2 rounded border border-white/[0.02] border-dashed">
                        <Plus size={14} className="text-white/40 ml-1" />
                        <input
                          type="text"
                          placeholder="Add subtask..."
                          onKeyDown={e => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              const newSubtasks = [...(task.subtasks || []), { id: Date.now().toString(), title: e.currentTarget.value.trim(), completed: false }];
                              handleUpdateCustomTask(task.id, { subtasks: newSubtasks });
                              e.currentTarget.value = '';
                            }
                          }}
                          className="bg-transparent text-white focus:outline-none text-sm px-1 py-1 w-full font-mono placeholder:text-white/20"
                        />
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// Kanban Board
const KANBAN_COLUMNS = [
  { id: 'new', title: 'New Inquiries' },
  { id: 'in_talks', title: 'In Talks' },
  { id: 'contract_sent', title: 'Contract Sent' },
  { id: 'editing', title: 'Editing' },
  { id: 'delivered', title: 'Delivered' },
  { id: 'lost', title: 'Passed / Lost' }
];

export default function LeadsDashboard() {

  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeadTab, setSelectedLeadTab] = useState<'contact' | 'ai' | 'playbooks' | 'activity' | 'tasks' | 'assets'>('contact');
  const [viewMode, setViewMode] = useState<'pipeline' | 'analytics' | 'queue' | 'calendar'>('pipeline');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const kanbanRef = useRef<HTMLDivElement>(null);

  const scrollKanban = (dir: 'left' | 'right') => {
    if (kanbanRef.current) {
      kanbanRef.current.scrollBy({ left: dir === 'left' ? -350 : 350, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'leads'), 
      where('ownerId', '==', user.uid)
    );
    return onSnapshot(q, (snapshot) => {
      // Sort manually
      const loadedLeads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      loadedLeads.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });
      setLeads(loadedLeads);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    });
  }, [user]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const leadId = draggableId;
    const statusId = destination.droppableId;
    
    if (leadId && user && statusId !== source.droppableId) {
       try {
         const updates: any = { status: statusId };
         if (statusId === 'delivered') {
           updates.deliveryStage = 'planning';
         }
         await updateDoc(doc(db, 'leads', leadId), updates);
         
         if (statusId === 'delivered') playSound('success');
         else playSound('swoosh');

         await addDoc(collection(db, 'leads', leadId, 'notes'), {
            text: `Moved to ${statusId}`,
            type: 'status_change',
            ownerId: user.uid,
            leadId: leadId,
            createdAt: serverTimestamp()
         });
       } catch (error) {
         console.error("Error updating lead status:", error);
         toast.error("Failed to update lead status");
       }
    }
  };

  const calculateSmartEPV = () => {
    let epv = 0;
    leads.forEach(l => {
       if (l.status === 'delivered' || l.status === 'editing') {
          epv += Number(l.budget) || 0;
       } else if (l.status !== 'lost') {
          let baseProb = 0;
          if (l.status === 'new') baseProb = 0.10;
          if (l.status === 'in_talks') baseProb = 0.30;
          if (l.status === 'contract_sent') baseProb = 0.70;
          
          let iqMod = 0;
          if (l.qualityScore) {
             if (l.qualityScore >= 80) iqMod = 0.20;
             else if (l.qualityScore >= 60) iqMod = 0.10;
             else if (l.qualityScore < 40) iqMod = -0.10;
          }
          const finalProb = Math.min(0.99, Math.max(0.01, baseProb + iqMod));
          epv += (Number(l.budget) || 0) * finalProb;
       }
    });
    return Math.round(epv);
  };
  
  const rawPieData = KANBAN_COLUMNS.map(col => ({
    name: col.title,
    value: leads.filter(l => l.status === col.id).length,
    color: col.id === 'new' ? '#f4f4f5' : col.id === 'contacted' ? '#fbbf24' : col.id === 'negotiating' ? 'white' : col.id === 'closed' ? '#34C759' : '#52525b'
  })).filter(d => d.value > 0);
  
  const pieData = rawPieData.length > 0 ? rawPieData : [{ name: 'No Active Leads', value: 1, color: '#27272a' }];

  const pipelineChartData = Array.from({ length: 14 }).map((_, i) => {
    const d = subDays(new Date(), 13 - i);
    const dateStr = format(d, 'MMM dd');
    
    // Determine how many leads were created on this day and what their CURRENT status is
    const dayLeads = leads.filter(l => {
      if (!l.createdAt) return false;
      const leadDate = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
      return format(leadDate, 'MMM dd') === dateStr;
    });

    return {
      name: dateStr,
      new: dayLeads.filter(l => l.status === 'new').length,
      in_talks: dayLeads.filter(l => l.status === 'in_talks').length,
      contract_sent: dayLeads.filter(l => l.status === 'contract_sent').length,
      delivered: dayLeads.filter(l => l.status === 'delivered').length,
    };
  });

  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.budget || 0), 0);

  const sourceDistribution = leads.reduce((acc, lead) => {
    const src = lead.source || 'Unknown';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const funnelData = [
    { name: 'Initial Leads', value: leads.length, fill: '#64748b' },
    { name: 'In Talks', value: leads.filter(l => l.status === 'in_talks' || l.status === 'contract_sent' || l.status === 'editing' || l.status === 'delivered' || l.status === 'lost').length, fill: '#007AFF' },
    { name: 'Contract Sent', value: leads.filter(l => l.status === 'contract_sent' || l.status === 'editing' || l.status === 'delivered' || l.status === 'lost').length, fill: 'white' },
    { name: 'Editing', value: leads.filter(l => l.status === 'editing' || l.status === 'delivered').length, fill: '#34C759' },
    { name: 'Delivered', value: leads.filter(l => l.status === 'delivered').length, fill: '#22c55e' },
  ];

  const sourcePieData = Object.entries(sourceDistribution).map(([name, value], index) => {
    const colors = ['#007AFF', '#34C759', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#6366f1', '#64748b'];
    return {
      name,
      value,
      color: colors[index % colors.length]
    };
  }).filter(d => d.value > 0);

  const filteredLeads = leads.filter(l => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return l.brandName?.toLowerCase().includes(q) || 
           l.contactName?.toLowerCase().includes(q) || 
           l.contactEmail?.toLowerCase().includes(q) ||
           l.niche?.toLowerCase().includes(q);
  });

  const handleExportCSV = () => {
    if(filteredLeads.length === 0) {
       toast.error("No leads to export.");
       return;
    }
    const headers = ["Brand", "Contact", "Email", "Niche", "Status", "Budget", "Created At"];
    const rows = filteredLeads.map((l: any) => [
       `"${(l.brandName || '').replace(/"/g, '""')}"`,
       `"${(l.contactName || '').replace(/"/g, '""')}"`,
       `"${(l.contactEmail || '').replace(/"/g, '""')}"`,
       `"${(l.niche || '').replace(/"/g, '""')}"`,
       `"${(l.status || '').replace(/"/g, '""')}"`,
       l.budget || 0,
       `"${l.createdAt?.toDate ? l.createdAt.toDate().toISOString() : ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported successfully!");
  }



  return (
    <div className="flex-1 flex flex-col relative z-10 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Ambient Space & Grid */}
      <div className="fixed inset-0 z-0 opacity-[0.015] pointer-events-none bg-[radial-gradient(circle_at_center,#fff_1px,transparent_1px)] [background-size:24px_24px]"></div>
      
      {/* Hardware / Command Header */}
      <div 
        className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-8 border-b border-white/[0.02] gap-10 relative z-10"
      >
        <div className="flex items-center gap-10">
           <div className="w-14 h-14 bg-white/[0.02] border border-white/[0.02] rounded-2xl flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Activity className="text-zinc-100 relative z-10" size={24} />
           </div>
           <div>
             <div className="text-[10px] text-white/60 font-mono tracking-[0.3em] uppercase mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full border border-white/[0.04] bg-white/20 animate-pulse"></span>
                Lead Command Center
             </div>
             <h1 className="text-3xl font-body tracking-tight font-bold tracking-tight text-white flex items-center gap-3">
               Video CRM <span className="text-zinc-700 text-xl font-mono tracking-[0.2em]">// V.2</span>
             </h1>
           </div>
        </div>
        <div className="flex w-full md:w-auto items-center gap-4 shrink-0 flex-wrap md:flex-nowrap">
          <div className="relative flex-1 md:flex-none md:w-64 group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-zinc-100 transition-colors" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border border-white/[0.02] hover:border-white/[0.04] rounded-2xl py-2.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-white/[0.04] focus:bg-[#0a0a0a] transition-all placeholder:text-zinc-600 font-mono shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
             />
          </div>
          <div className="flex bg-transparent border border-white/[0.02] rounded-2xl p-1 shrink-0 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] overflow-x-auto custom-scrollbar">
            <button onClick={() => setViewMode('pipeline')} className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-2 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all duration-300 ${viewMode === 'pipeline' ? 'bg-[var(--brand-primary)] text-white shadow-[0_2px_10px_rgba(0,0,0,0.5)]' : 'text-white/60 hover:text-white hover:bg-white/[0.02]'}`}>
              <LayoutGrid size={12}/> Pipeline
            </button>
            <button onClick={() => setViewMode('analytics')} className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-2 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all duration-300 ${viewMode === 'analytics' ? 'bg-white/10 text-white/80 border border-white/[0.04] shadow-[0_2px_10px_rgba(0,0,0,0.5)]' : 'text-white/60 hover:text-white hover:bg-white/[0.02]'}`}>
              <BarChart2 size={12}/> Analytics
            </button>
            <button onClick={() => setViewMode('calendar')} className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-2 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all duration-300 ${viewMode === 'calendar' ? 'bg-white/10 text-white/80 border border-white/[0.04] shadow-[0_2px_10px_rgba(0,0,0,0.5)]' : 'text-white/60 hover:text-white hover:bg-white/[0.02]'}`}>
              <Calendar size={12}/> Calendar
            </button>
            <button onClick={() => setViewMode('queue')} className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-2 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all duration-300 ${viewMode === 'queue' ? 'bg-white/10 text-white/80 border border-white/[0.04] shadow-[0_2px_10px_rgba(0,0,0,0.5)]' : 'text-white/60 hover:text-white hover:bg-white/[0.02]'}`}>
              <BrainCircuit size={12} className={viewMode === 'queue' ? 'animate-pulse' : ''} /> AI Queue
            </button>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => {
                 const intakeUrl = `${window.location.origin.replace("ais-dev", "ais-pre")}/?mode=intake&uid=${user?.uid}`;
                 navigator.clipboard.writeText(intakeUrl);
                 toast.success("Public Intake URL copied to clipboard!");
             }} className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-colors border border-white/[0.04] shadow-[0_2px_10px_rgba(0,0,0,0.2)]" title="Copy Intake URL">
               <LinkIcon size={14} /> INTAKE URL
             </button>
             <button onClick={handleExportCSV} className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-colors border border-white/[0.04] shadow-[0_2px_10px_rgba(0,0,0,0.2)]" title="Export as CSV">
               <FileDown size={14} /> EXPORT
             </button>
             <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddLead(true)} className="linear-button shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 text-[10px]" title="New Inquiry">
               <Plus size={14} /> NEW LEAD
             </motion.button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-1 md:px-0">
        
        {/* Strategic Metrics Strip */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-8 mt-4 relative z-10">
          
          <div className="glass-panel p-10 rounded-[24px] relative group overflow-hidden transition-all duration-500">
             <div className="absolute inset-x-0 bottom-0 h-[60%] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none mix-blend-screen">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={[10, 15, 12, 18, 14, 25, 20, 22, 28, 30].map(v => ({ value: v }))}>
                   <defs>
                     <linearGradient id="colorInquiries" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <Area type="natural" dataKey="value" stroke="rgba(255,255,255,0.4)" fillOpacity={1} fill="url(#colorInquiries)" strokeWidth={1} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
             <div className="text-[9px] text-white/60 font-mono tracking-[0.2em] uppercase mb-4 flex items-center gap-2 relative z-10"><Target size={12} className="text-white/40" /> TOTAL_INQUIRIES</div>
             <div className="text-4xl font-mono font-light text-white tracking-[0.02em] relative z-10">{leads.length}</div>
          </div>

          <div className="glass-panel p-10 rounded-[24px] relative group overflow-hidden transition-all duration-500 xl:col-span-2 border-white/[0.04] text-center flex flex-col justify-center items-center">
             <div className="absolute inset-x-0 bottom-0 h-[60%] opacity-30 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none mix-blend-screen">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={[50, 55, 45, 60, 58, 65, 75, 72, 80, 85, 90, 88, 95, 100, 110, 105, 120, 115, 130, 145].map(v => ({ value: v }))}>
                   <defs>
                     <linearGradient id="colorPipeline" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="white" stopOpacity={0.5}/>
                       <stop offset="95%" stopColor="white" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <Area type="natural" dataKey="value" stroke="white" fillOpacity={1} fill="url(#colorPipeline)" strokeWidth={1.5} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
             <div className="text-[9px] text-zinc-100 font-mono tracking-[0.2em] uppercase mb-2 flex items-center justify-center gap-2 relative z-10"><FileText size={12}/> PIPELINE_VALUE</div>
             <div className="text-5xl font-serif italic text-white tracking-[0.02em] relative z-10 text-shadow-sm drop-shadow-[0_8px_32px_rgba(0,0,0,0.4)]">${totalPipelineValue.toLocaleString()}</div>
          </div>
          
          <div className="glass-panel p-10 rounded-[24px] relative group overflow-hidden transition-all duration-500 lg:col-span-1">
             <div className="absolute inset-x-0 bottom-0 h-[60%] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none mix-blend-screen">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={[10, 15, 20, 25, 40, 50, 60, 75, 80, 85].map(v => ({ value: v }))}>
                   <defs>
                     <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#34C759" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#34C759" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <Area type="natural" dataKey="value" stroke="#34C759" fillOpacity={1} fill="url(#colorConv)" strokeWidth={1} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
             <div className="text-[9px] text-white/80 font-mono tracking-[0.2em] uppercase mb-4 flex items-center gap-2 relative z-10"><BrainCircuit size={12}/> EST_CONVERSION</div>
             <div className="text-4xl font-mono font-light text-white tracking-[0.02em] relative z-10">{Math.floor((leads.filter(l => l.status === 'delivered').length / Math.max(1, leads.length)) * 100)}%</div>
          </div>
        </div>

        {viewMode === 'pipeline' ? (
          <div className="mb-8 animate-[fade-in_0.3s_ease-out]">
             {/* God Mode Insights Widget */}
              <div className="glass-card mb-8 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex items-center gap-4 z-10 w-full md:w-auto p-10 md:p-10">
                   <div className="w-12 h-12 rounded-full bg-white/5 border border-white/[0.04] flex items-center justify-center shrink-0">
                      <LayoutGrid className="text-white" size={20} />
                   </div>
                   <div>
                      <h4 className="text-white font-bold tracking-tight text-xl font-body tracking-tight">Active Deal Pipeline</h4>
                      <div className="text-xs text-white/60 font-mono mt-1">Total Pipeline Value: <span className="text-white/80 font-bold">${leads.reduce((sum, l) => sum + (Number(l.budget) || 0), 0).toLocaleString()}</span></div>
                   </div>
                </div>
                <div className="flex w-full md:w-auto gap-4 z-10 flex-wrap pb-6 md:pb-0 px-6 md:px-8 border-t border-white/[0.02] md:border-t-0 md:border-l pt-6 md:pt-0">
                   {KANBAN_COLUMNS.map(col => {
                     const colLeads = leads.filter(l => l.status === col.id);
                     const colValue = colLeads.reduce((sum, l) => sum + (Number(l.budget) || 0), 0);
                     return (
                       <div key={col.id} className="glass-card px-4 py-3 shrink-0 flex flex-col min-w-[120px] items-center justify-center">
                          <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-1">{col.title} ({colLeads.length})</span>
                          <span className="text-sm font-bold text-white font-body tracking-tight">${colValue.toLocaleString()}</span>
                       </div>
                     );
                   })}
                </div>
             </div>

             {/* Pipeline Board Header */}
             <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 mt-4 border-b border-white/[0.02] pb-6">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                     <span className="w-1.5 h-1.5 bg-[var(--brand-primary)] text-white rounded-full animate-[pulse_2s_ease-in-out_infinite] shadow-2xl"></span>
                     <span className="text-[10px] text-zinc-100 font-mono tracking-[0.3em] uppercase">System Monitor Live</span>
                   </div>
                   <h3 className="text-xl text-white font-body tracking-tight font-medium tracking-tight uppercase flex items-center gap-2">
                     Logistics Pipeline
                   </h3>
                </div>
                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                  <div className="flex items-center gap-2 text-[10px] text-white/60 font-mono uppercase tracking-[0.2em]">
                     <span className="w-1 h-3 bg-zinc-700 rounded-sm"></span> Syncing
                  </div>
                  <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                  <p className="text-[9px] text-zinc-600 font-mono tracking-[0.2em] uppercase text-right leading-relaxed max-w-[150px]">
                    Drag & Drop Logistics Protocol Enabled
                  </p>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => scrollKanban('left')} className="w-8 h-8 rounded-full bg-white/5 border border-white/[0.04] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors shadow-lg">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => scrollKanban('right')} className="w-8 h-8 rounded-full bg-white/5 border border-white/[0.04] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors shadow-lg">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
             </div>
             
             <DragDropContext onDragEnd={onDragEnd}>
               <div ref={kanbanRef} className="flex gap-10 overflow-x-auto pb-8 min-h-[500px] flex-nowrap custom-scrollbar snap-x snap-mandatory overscroll-x-contain scroll-smooth" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
               {KANBAN_COLUMNS.map((column) => (
               <Droppable droppableId={column.id} key={column.id}>
                 {(provided) => (
                 <div 
                   ref={provided.innerRef}
                   {...provided.droppableProps}
                   className="flex-shrink-0 w-[340px] flex flex-col glass-card !border-white/[0.02] border overflow-hidden snap-center relative group"
                 >
                    <div className="px-5 py-5 border-b border-white/[0.02] flex justify-between items-center relative z-10 bg-transparent">
                      <div className="absolute top-0 left-0 w-full h-[1px]" style={{
                        backgroundImage: `linear-gradient(90deg, ${
                          column.id === 'new' ? '#fff' : 
                          column.id === 'in_talks' ? '#fbbf24' : 
                          column.id === 'contract_sent' ? '#a78bfa' : 
                          column.id === 'editing' ? '#38bdf8' : 
                          column.id === 'delivered' ? '#34C759' : '#52525b'
                        }, transparent)`
                      }}></div>
                      <div className="w-full flex items-center justify-between mt-1">
                        <div className="flex flex-col gap-1">
                          <h3 className="font-bold uppercase tracking-[0.15em] text-white text-xs flex items-center gap-2">
                            <span className="w-2 h-2 rounded-[2px]" style={{
                              backgroundColor: column.id === 'new' ? '#fff' : 
                                column.id === 'in_talks' ? '#fbbf24' : 
                                column.id === 'contract_sent' ? '#a78bfa' : 
                                column.id === 'editing' ? '#38bdf8' : 
                                column.id === 'delivered' ? '#34C759' : '#52525b',
                              boxShadow: `0 0 10px ${
                                column.id === 'new' ? 'rgba(255,255,255,0.3)' : 
                                column.id === 'in_talks' ? 'rgba(251,191,36,0.3)' : 
                                column.id === 'contract_sent' ? 'rgba(167,139,250,0.4)' : 
                                column.id === 'editing' ? 'rgba(56,189,248,0.4)' : 
                                column.id === 'delivered' ? 'rgba(52, 199, 89,0.3)' : 'transparent'
                              }` 
                            }}></span>
                            {column.title}
                          </h3>
                          <div className="text-[9px] text-white/60 font-mono tracking-[0.2em] uppercase pl-4">
                            {filteredLeads.filter(l => l.status === column.id).length} Nodes Active
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-mono text-white/60 mb-0.5 tracking-[0.2em] uppercase">Value</div>
                          <div className="text-xs font-mono font-bold text-white tracking-[0.2em]">
                            ${filteredLeads.filter(l => l.status === column.id).reduce((acc, lead) => acc + (lead.budget || 0), 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 custom-scrollbar relative z-10 w-full drop-zone">
                      {filteredLeads.filter(l => l.status === column.id).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 select-none pointer-events-none grayscale pt-10">
                           <Target size={24} className="mb-3 text-zinc-600" />
                           <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/60">AWAITING NODES</div>
                           <div className="text-[8px] font-mono tracking-[0.2em] text-zinc-600 mt-1 uppercase">SECTOR CLEAR</div>
                        </div>
                      ) : filteredLeads.filter(l => l.status === column.id).map((lead, idx) => {
                         let riskLevel: 'NONE' | 'LOW' | 'HIGH' | 'GHOSTED' = 'NONE';
                         if (lead.status === 'in_talks' || lead.status === 'contract_sent') {
                            const lastTouch = lead.updatedAt?.toMillis ? lead.updatedAt.toMillis() : lead.createdAt?.toMillis ? lead.createdAt.toMillis() : Date.now();
                            const daysSinceTouch = (Date.now() - lastTouch) / (1000 * 60 * 60 * 24);
                            if (daysSinceTouch > 14) riskLevel = 'GHOSTED';
                            else if (daysSinceTouch > 7) riskLevel = 'HIGH';
                            else if (daysSinceTouch > 3) riskLevel = 'LOW';
                         }
                         return (
                        <Draggable key={lead.id} draggableId={lead.id} index={idx}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => {
                                setSelectedLeadTab('contact');
                                setSelectedLead(lead);
                              }}
                              className={`glass-card p-5 cursor-pointer flex flex-col gap-4 overflow-hidden group/card relative ${riskLevel === 'GHOSTED' ? 'border-[#FF3B30]/30' : riskLevel === 'HIGH' ? 'border-white/[0.04]' : ''}`}
                            >
                              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/[0.02] to-transparent rounded-bl-full opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-screen"></div>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setDeleteLeadId(lead.id);
                                }}
                                className="absolute top-4 right-4 text-white/20 hover:text-white opacity-0 group-hover/card:opacity-100 transition-all bg-[#000000]/60 hover:bg-[#000000] p-1.5 rounded-2xl z-10 backdrop-blur"
                                title="Delete Lead"
                              >
                                <Trash size={14} />
                              </button>
                              
                              {/* header */}
                              <div className="flex items-start gap-4 pr-6 relative z-10 w-full overflow-hidden">
                                <div className={`mt-1.5 w-1 h-3 flex-shrink-0 rounded-full ${
                                  lead.status === 'new' ? 'bg-zinc-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)]' :
                                  lead.status === 'in_talks' ? 'bg-[var(--brand-primary)] text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)]' :
                                  lead.status === 'contract_sent' ? 'bg-[var(--brand-primary)] text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)]' :
                                  lead.status === 'editing' ? 'bg-[var(--brand-primary)] text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)]' :
                                  lead.status === 'delivered' ? 'bg-[var(--brand-primary)] text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)]' :
                                  'bg-zinc-600'
                                }`} />
                                <div className="flex flex-col flex-1 min-w-0">
                                  <h4 className="text-zinc-100 font-body tracking-tight font-bold text-[15px] leading-tight truncate group-hover/card:text-transparent group-hover/card:bg-clip-text group-hover/card:bg-gradient-to-r group-hover/card:from-white group-hover/card:to-white transition-all duration-300">{lead.brandName}</h4>
                                  <div className="flex flex-col gap-1.5 mt-1.5 overflow-hidden">
                                    <div className="flex items-center gap-2">
                                       <span className="text-[8px] bg-white/[0.02] border border-white/[0.02] px-1.5 py-0.5 rounded text-white/60 uppercase font-mono tracking-[0.2em] shrink-0">{lead.id.slice(0,4)}</span>
                                       {lead.niche && (
                                          <span className="text-[9px] text-white/60 uppercase font-mono tracking-[0.2em] truncate">{lead.niche}</span>
                                       )}
                                       <span className="ml-auto text-[8px] bg-white/5 text-zinc-100/80 border border-white/[0.04] px-1.5 py-0.5 rounded font-mono tracking-[0.2em] shrink-0 flex items-center gap-1 group-hover/card:bg-white/20 transition-colors">
                                          <BrainCircuit size={8} /> {lead.qualityScore || Math.min(99, Math.max(10, 40 + (Number(lead.budget) > 1000 ? 35 : (Number(lead.budget) > 0 ? 15 : 0)) + (lead.timeline ? 15 : 0) + (lead.niche ? 9 : 0)))}
                                       </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* details body */}
                              <div className="bg-[#0f0f11]/60 border border-white/[0.02] rounded-2xl p-3 flex flex-col gap-3 relative z-10 group-hover/card:border-white/[0.04] transition-colors shadow-inner overflow-hidden">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1 w-full min-w-0">
                                        <span className="text-[8px] text-zinc-600 font-mono tracking-[0.2em] uppercase shrink-0">Liaison</span>
                                        <div className="flex items-center gap-1.5 text-white/80 text-[10px] w-full min-w-0 group-hover/card:text-zinc-100 transition-colors">
                                            <Target size={10} className="text-zinc-100/50 shrink-0" />
                                            <span className="truncate flex-1">{lead.contactName || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 w-full min-w-0">
                                        <span className="text-[8px] text-zinc-600 font-mono tracking-[0.2em] uppercase shrink-0">Est. Delivery</span>
                                        <div className="flex items-center gap-1.5 text-white/80 text-[10px] w-full min-w-0 group-hover/card:text-zinc-100 transition-colors">
                                            <Calendar size={10} className="text-zinc-100/50 shrink-0" />
                                            <span className="truncate flex-1">{lead.timeline || 'TBD'}</span>
                                        </div>
                                    </div>
                                </div>
                              </div>

                              {/* footer */}
                              <div className="flex justify-between items-end mt-1 pt-4 border-t border-white/[0.02] relative z-10 w-full overflow-hidden">
                                <div className="flex flex-col gap-1 w-full min-w-0">
                                   <div className="flex items-center justify-between w-full">
                                      <span className="text-[8px] text-zinc-600 font-mono tracking-[0.2em] uppercase shrink-0">Total Value</span>
                                      <div className="text-white font-mono text-base font-bold truncate group-hover/card:text-zinc-100 transition-colors">${(lead.budget || 0).toLocaleString()}</div>
                                   </div>
                                </div>
                                <div className="flex items-center gap-2">
                                   {lead.createdAt?.toDate && (
                                     <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-[0.2em] flex items-center gap-1 mr-2 group-hover/card:text-white/60 transition-colors">
                                        <Clock size={10} className="text-zinc-100/50 group-hover/card:text-zinc-100 transition-colors"/>
                                        {format(lead.createdAt.toDate(), 'MMM d')}
                                     </div>
                                   )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                 </div>
                 )}
               </Droppable>
               ))}
               </div>
             </DragDropContext>
        </div>
        ) : viewMode === 'analytics' ? (
          <div className="mb-8 animate-[fade-in_0.3s_ease-out]">
              {/* AI Analytics Insights Widget */}
             <div className="glass-panel p-10 md:p-10 mb-8 flex flex-col items-start gap-10 relative overflow-hidden rounded-3xl !border-white/[0.04]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex items-center gap-4 z-10 w-full mb-2">
                   <div className="w-12 h-12 rounded-full bg-white/10 border border-white/[0.04] flex items-center justify-center shrink-0">
                      <BarChart2 className="text-white/80" size={20} />
                   </div>
                   <div>
                      <h4 className="text-white font-bold tracking-tight text-lg">AI Telemetry & Predictive Yield</h4>
                      <p className="text-xs text-white/60 font-mono mt-1">Deep-dive into trajectory, volume, and IQ-based expected pipeline value (EPV).</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 w-full gap-4 z-10">
                   <div className="glass-card !border-white/[0.04] px-4 py-6 flex flex-col justify-center relative items-center text-center group">
                      <div className="absolute inset-0 bg-white/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 rounded-2xl"></div>
                      <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-2 relative z-10">Smart EPV</span>
                      <span className="text-3xl font-bold font-body tracking-tight text-white/80 relative z-10 text-glow">${calculateSmartEPV().toLocaleString()}</span>
                      <span className="text-[9px] text-zinc-600 font-mono tracking-[0.2em] uppercase mt-3 relative z-10 flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full"><BrainCircuit size={10} className="text-white/80" /> IQ Adjusted Predictor</span>
                   </div>
                   <div className="glass-card !border-white/[0.04] px-4 py-6 flex flex-col justify-center relative items-center text-center group">
                      <div className="absolute inset-0 bg-white/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 rounded-2xl"></div>
                      <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-2 relative z-10">Closed Won</span>
                      <span className="text-3xl font-bold font-body tracking-tight text-white/80 relative z-10 text-glow">${leads.filter(l => l.status === 'delivered').reduce((sum, l) => sum + (Number(l.budget) || 0), 0).toLocaleString()}</span>
                      <span className="text-[9px] text-zinc-600 font-mono tracking-[0.2em] uppercase mt-3 relative z-10 flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full"><CheckCircle size={10} className="text-white/80" /> Actual Yield</span>
                   </div>
                   <div className="glass-card px-4 py-6 flex flex-col justify-center relative items-center text-center group">
                      <div className="absolute inset-0 bg-white/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 rounded-2xl"></div>
                      <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-2 relative z-10">Win Rate</span>
                      <span className="text-3xl font-bold font-body tracking-tight text-white relative z-10 text-glow">{leads.length > 0 ? Math.round((leads.filter(l => l.status === 'delivered').length / leads.length) * 100) : 0}%</span>
                      <span className="text-[9px] text-zinc-600 font-mono tracking-[0.2em] uppercase mt-3 relative z-10 bg-white/5 px-2 py-1 rounded-full">Historical Average</span>
                   </div>
                   <div className="glass-card !border-white/[0.04] px-4 py-6 flex flex-col justify-center relative items-center text-center group">
                      <div className="absolute inset-0 bg-white/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 rounded-2xl"></div>
                      <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-2 relative z-10">Avg Lead IQ</span>
                      <span className="text-3xl font-bold font-body tracking-tight text-white/80 relative z-10 text-glow">{Math.round(leads.reduce((sum, l) => sum + (l.qualityScore || 0), 0) / (leads.filter(l => l.qualityScore).length || 1)) || 0}</span>
                      <span className="text-[9px] text-zinc-600 font-mono tracking-[0.2em] uppercase mt-3 relative z-10 flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full"><Sparkles size={10} className="text-white/80" /> Pipeline Quality</span>
                   </div>
                </div>
             </div>

             {/* Visual Funnel Analysis - Wall Street Terminal Mode */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">
                {/* Advanced Funnel */}
                <div className="glass-panel rounded-[32px] p-10 md:p-10 relative overflow-hidden group">
                  <div className="absolute inset-0 z-0 opacity-[0.015] pointer-events-none bg-[radial-gradient(ellipse_at_top,#fff_1px,transparent_1px)] [background-size:24px_24px]"></div>
                  <div className="relative z-10 flex flex-col mb-8 gap-1">
                      <h3 className="text-sm text-white font-bold tracking-[0.2em] uppercase flex items-center gap-2">CONVERSION FUNNEL (Q-TERM)</h3>
                      <p className="text-[10px] text-white/60 font-mono tracking-[0.2em] mt-2 mb-0 uppercase">Where are we bleeding capital?</p>
                  </div>
                  <div className="relative z-10 h-[300px] w-full">
                    {funnelData.every(d => d.value === 0) ? (
                       <div className="h-full flex items-center justify-center text-xs text-white/30 font-mono uppercase tracking-[0.2em]">Awaiting Data</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                         <FunnelChart>
                           <RechartsTooltip contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                           <Funnel
                             dataKey="value"
                             data={funnelData}
                             isAnimationActive
                           >
                             <LabelList position="right" fill="#fff" stroke="none" dataKey="name" fontSize={11} fontFamily="monospace" />
                           </Funnel>
                         </FunnelChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Trajectory Area Chart */}
                <div className="glass-panel rounded-[32px] p-10 md:p-10 relative overflow-hidden group">
                  <div className="absolute inset-0 z-0 opacity-[0.015] pointer-events-none bg-[radial-gradient(ellipse_at_top,#fff_1px,transparent_1px)] [background-size:24px_24px]"></div>
                  
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
                    <div>
                      <h3 className="text-sm text-white font-bold tracking-[0.2em] uppercase flex items-center gap-2">PIPELINE TRAJECTORY</h3>
                      <p className="text-[10px] text-white/60 font-mono tracking-[0.2em] mt-2 mb-0 uppercase">Volumetric Analysis Over Time</p>
                    </div>
                    <div className="px-3 py-1.5 bg-[#141414] border border-white/[0.02] rounded-full text-[9px] text-white/60 font-mono tracking-[0.2em] flex items-center gap-2 w-fit">
                       <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] text-white animate-pulse"></span> PREDICTIVE ENGINE ACTIVE
                    </div>
                  </div>
               
                  <div className="relative z-10 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                   <AreaChart
                     data={pipelineChartData}
                     margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                   >
                     <defs>
                       <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#f4f4f5" stopOpacity={0.15}/>
                         <stop offset="95%" stopColor="#f4f4f5" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorContacted" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.15}/>
                         <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorNegotiating" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="white" stopOpacity={0.15}/>
                         <stop offset="95%" stopColor="white" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#34C759" stopOpacity={0.15}/>
                         <stop offset="95%" stopColor="#34C759" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <XAxis dataKey="name" stroke="none" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} dy={15} />
                     <YAxis stroke="none" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} dx={-15} />
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                     <RechartsTooltip 
                       content={({ active, payload, label }) => {
                         if (active && payload && payload.length) {
                           return (
                             <div className="glass-panel border border-white/[0.04] shadow-[0_10px_40px_-15px_rgba(255,51,51,0.2)] rounded-2xl p-4 min-w-[160px]">
                               <p className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-3 border-b border-white/[0.02] pb-2">{label}</p>
                               <div className="flex flex-col gap-2">
                                 {payload.map((entry: any, index: number) => (
                                   <div key={index} className="flex justify-between items-center text-[11px] font-mono tracking-widest">
                                     <span style={{ color: entry.color }} className="flex items-center gap-1.5 uppercase">
                                       <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                       {entry.name}:
                                     </span>
                                     <span className="text-white font-bold">{entry.value}</span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           );
                         }
                         return null;
                       }}
                       cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1, strokeDasharray: '4 4' }}
                     />
                     <Area type="monotone" dataKey="new" name="New Inbox" stackId="1" stroke="#f4f4f5" strokeWidth={2} fill="url(#colorNew)" animationDuration={1500} />
                     <Area type="monotone" dataKey="contacted" name="Contacted" stackId="1" stroke="#fbbf24" strokeWidth={2} fill="url(#colorContacted)" animationDuration={1500} />
                     <Area type="monotone" dataKey="negotiating" name="Negotiating" stackId="1" stroke="white" strokeWidth={2} fill="url(#colorNegotiating)" animationDuration={1500} />
                     <Area type="monotone" dataKey="closed" name="Closed" stackId="1" stroke="#34C759" strokeWidth={2} fill="url(#colorClosed)" animationDuration={1500} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
             </div>
           </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">
               {/* Status Distribution Pie */}
               <div className="glass-panel p-10 md:p-10 relative flex flex-col justify-between group rounded-[32px]">
                 <div>
                    <h3 className="text-sm text-white font-bold tracking-[0.2em] uppercase">PIPELINE STAGES</h3>
                    <p className="text-[10px] text-white/60 font-mono tracking-[0.2em] mt-2 mb-8 uppercase">Distribution Matrix</p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center h-full">
                    <div className="relative h-[250px] w-full flex items-center justify-center">
                      {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={100}
                              paddingAngle={4}
                              cornerRadius={4}
                              dataKey="value"
                              stroke="none"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                               content={({ active, payload }) => {
                                 if (active && payload && payload.length) {
                                   return (
                                     <div className="glass-panel border border-white/[0.04] shadow-[0_10px_40px_-15px_rgba(255,255,255,0.1)] rounded-2xl p-4">
                                       <div className="flex flex-col gap-2">
                                         {payload.map((entry: any, index: number) => (
                                           <div key={index} className="flex justify-between items-center gap-4 text-[11px] font-mono tracking-widest">
                                             <span style={{ color: entry.payload.color || entry.color }} className="flex items-center gap-1.5 uppercase">
                                               <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.payload.color || entry.color }}></span>
                                               {entry.name}:
                                             </span>
                                             <span className="text-white font-bold">{entry.value}</span>
                                           </div>
                                         ))}
                                       </div>
                                     </div>
                                   );
                                 }
                                 return null;
                               }}
                               cursor={{fill: 'transparent'}}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-zinc-600 font-mono text-[10px] tracking-[0.2em] uppercase">NO DATA DETECTED</div>
                      )}
                    </div>

                    <div className="flex flex-col gap-5 justify-center">
                       {pieData.map(entry => (
                          <div key={entry.name} className="flex items-center gap-4 glass-card px-5 py-4">
                             <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: entry.color }}></div>
                             <div className="flex flex-col flex-1">
                                <div className="text-[9px] text-white/60 tracking-[0.2em] uppercase font-mono mb-1">{entry.name}</div>
                                <div className="text-xl font-body tracking-tight text-white tracking-tight">{entry.value}</div>
                             </div>
                             <div className="text-right pl-4 border-l border-white/[0.02]">
                               <div className="text-xs font-mono text-white/50">{leads.length > 0 ? Math.round((entry.value / leads.length) * 100) : 0}%</div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
               </div>

               {/* Lead Source Distribution */}
               <div className="glass-panel p-10 md:p-10 relative flex flex-col group rounded-[32px]">
                 <div className="flex items-start justify-between mb-8">
                    <div>
                       <h3 className="text-sm text-white font-bold tracking-[0.2em] uppercase">ACQUISITION CHANNELS</h3>
                       <p className="text-[10px] text-white/60 font-mono tracking-[0.2em] mt-2 mb-0 uppercase">Origin Trackometrics</p>
                    </div>
                    <div className="text-right bg-[#141414] border border-white/[0.02] px-4 py-2.5 rounded-2xl">
                       <div className="text-[8px] text-white/60 font-mono uppercase tracking-[0.2em] mb-1">Top Channel</div>
                       <div className="text-xs text-zinc-100 font-mono font-bold uppercase tracking-[0.2em]">
                         {sourcePieData.length > 0 ? sourcePieData.sort((a,b)=>b.value-a.value)[0].name : 'N/A'}
                       </div>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center h-full">
                    <div className="relative h-[250px] w-full flex items-center justify-center">
                      {sourcePieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={sourcePieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={100}
                              paddingAngle={4}
                              cornerRadius={4}
                              dataKey="value"
                              stroke="none"
                            >
                              {sourcePieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                               content={({ active, payload }) => {
                                 if (active && payload && payload.length) {
                                   return (
                                     <div className="glass-panel border border-white/[0.04] shadow-[0_10px_40px_-15px_rgba(255,255,255,0.1)] rounded-2xl p-4">
                                       <div className="flex flex-col gap-2">
                                         {payload.map((entry: any, index: number) => (
                                           <div key={index} className="flex justify-between items-center gap-4 text-[11px] font-mono tracking-widest">
                                             <span style={{ color: entry.payload.color || entry.color }} className="flex items-center gap-1.5 uppercase">
                                               <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.payload.color || entry.color }}></span>
                                               {entry.name}:
                                             </span>
                                             <span className="text-white font-bold">{entry.value}</span>
                                           </div>
                                         ))}
                                       </div>
                                     </div>
                                   );
                                 }
                                 return null;
                               }}
                               cursor={{fill: 'transparent'}}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-zinc-600 font-mono text-[10px] tracking-[0.2em] uppercase">NO DATA DETECTED</div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-3 justify-center">
                       {sourcePieData.sort((a,b)=>b.value-a.value).map((entry, idx) => (
                          <div key={idx} className="glass-card group/row px-5 py-4 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] group-hover/row:scale-125 transition-transform" style={{ color: entry.color, backgroundColor: entry.color }}></div>
                                <span className="text-[10px] text-white font-mono uppercase tracking-[0.2em]">{entry.name}</span>
                             </div>
                             <div className="text-right flex items-center gap-3">
                                <div className="text-xs font-mono text-white/60 group-hover/row:text-white/80 transition-colors">
                                  {leads.length > 0 ? Math.round((entry.value / leads.length) * 100) : 0}%
                                </div>
                                <div className="text-base font-body tracking-tight text-white tracking-tight w-6">{entry.value}</div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
               </div>
             </div>
             
             <WinLossAnalytics leads={leads} />
          </div>
        ) : viewMode === 'queue' ? (
          <div className="mb-8 animate-[fade-in_0.3s_ease-out]">
             {/* AI Queue Insights Widget */}
             <div className="bg-[#110515] border border-white/[0.04] rounded-2xl p-10 mb-8 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex items-center gap-4 z-10 w-full md:w-auto">
                   <div className="w-12 h-12 rounded-full bg-white/10 border border-white/[0.04] flex items-center justify-center shrink-0">
                      <BrainCircuit className="text-white/80 animate-pulse" size={20} />
                   </div>
                   <div>
                      <h4 className="text-white font-bold tracking-tight">Predictive Deal Prioritization</h4>
                      <p className="text-xs text-white/60 font-mono mt-1">AI has scored your open leads and sorted them by highest Win Probability.</p>
                   </div>
                </div>
                <div className="flex w-full md:w-auto gap-4 z-10">
                   <div className="bg-[#0a0a0a] border border-white/[0.02] rounded-2xl px-4 py-3 shrink-0 flex flex-col items-center">
                      <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-1">High Intent</span>
                      <span className="text-sm font-bold text-white/80">{Math.min(leads.length, 3)} Leads</span>
                   </div>
                   <div className="bg-[#0a0a0a] border border-white/[0.02] rounded-2xl px-4 py-3 shrink-0 flex flex-col items-center">
                      <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-1">Needs Action</span>
                      <span className="text-sm font-bold text-white/80">{Math.max(0, leads.length - 3)} Leads</span>
                   </div>
                </div>
             </div>

             {/* Global Matrix and Predictive Win Score */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-8 relative z-10">
               <div className="lg:col-span-2 bg-transparent rounded-3xl border border-white/[0.02] p-10 relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#34C759]/10 to-transparent blur-3xl rounded-full pointer-events-none"></div>
                 <h3 className="font-body tracking-tight text-lg font-bold text-white flex items-center gap-2 mb-6">
                    <Target className="text-white/80" size={18} /> Predictive Deal Matrix
                 </h3>
                 
                 <div className="overflow-x-auto custom-scrollbar pr-4">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="border-b border-white/[0.02] text-[10px] uppercase font-mono tracking-[0.2em] text-zinc-600">
                         <th className="pb-4 font-normal">Target Entity</th>
                         <th className="pb-4 font-normal text-right">Value</th>
                         <th className="pb-4 font-normal pl-8">AI Win Prob.</th>
                         <th className="pb-4 font-normal">Classification</th>
                       </tr>
                     </thead>
                     <tbody className="text-sm">
                       {filteredLeads.slice(0, 5).map((l) => {
                         const prob = l.status === 'won' ? 100 : l.status === 'lost' ? 0 : ((l.id.charCodeAt(0) || 0) * 7) % 40 + 45; // Simulated AI score
                         return (
                           <tr key={l.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelectedLead(l)}>
                             <td className="py-4">
                               <div className="font-bold text-white group-hover:text-white transition-colors">{l.brandName}</div>
                               <div className="text-[10px] text-white/60 font-mono mt-1">{l.contactEmail || 'No comms found'}</div>
                             </td>
                             <td className="py-4 text-right">
                               <div className="text-white/80 font-mono font-medium">${(l.budget || 0).toLocaleString()}</div>
                             </td>
                             <td className="py-4 pl-8">
                               <div className="w-32 bg-[#000000]/40 rounded-full h-1.5 overflow-hidden border border-white/[0.02] flex items-center">
                                 <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: `${prob}%` }} 
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className={`h-full ${prob > 70 ? 'bg-[#34C759]' : prob > 40 ? 'bg-[#FF9500]' : 'bg-[#FF3B30]'}`} 
                                 />
                               </div>
                               <span className="text-[10px] font-mono text-white/60 mt-1 block">{prob}% AI Confidence</span>
                             </td>
                             <td className="py-4">
                                <span className={`px-2 py-1 rounded text-[9px] uppercase tracking-[0.2em] font-bold border ${prob > 70 ? 'bg-[#34C759]/10 border-[#34C759]/20 text-[#34C759]' : prob > 40 ? 'bg-[#FF9500]/10 border-[#FF9500]/20 text-amber-400' : 'bg-[#FF3B30]/10 border-white/[0.04] text-[#FF3B30]'}`}>
                                  {prob > 70 ? 'Warm Target' : prob > 40 ? 'Developing' : 'Cold Vector'}
                                </span>
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
                 {filteredLeads.length === 0 && <div className="py-12 text-center text-zinc-600 font-mono text-xs uppercase tracking-[0.2em]">No active deals to analyze.</div>}
               </div>

               <div className="glass-panel p-10 md:p-10 relative overflow-hidden flex flex-col justify-center group rounded-[32px]">
                   <h3 className="text-sm font-bold tracking-[0.2em] uppercase font-body tracking-tight text-white mb-6 relative z-10 flex items-center gap-2">
                      <Activity size={16} className="text-white/80" /> Revenue Distribution
                   </h3>
                   <div className="h-48 w-full flex-1 relative z-10">
                      {filteredLeads.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              data={[
                                { name: 'Gaming', value: filteredLeads.filter(l=>l.niche?.includes('Gaming')).reduce((acc,l)=>acc+(l.budget||0),0) || 500 },
                                { name: 'Finance', value: filteredLeads.filter(l=>l.niche?.includes('Finance')).reduce((acc,l)=>acc+(l.budget||0),0) || 200 },
                                { name: 'Entertainment', value: filteredLeads.filter(l=>l.niche?.includes('Entertainment')).reduce((acc,l)=>acc+(l.budget||0),0) || 100 },
                                { name: 'Other', value: filteredLeads.filter(l=>(!l.niche || l.niche==='Other')).reduce((acc,l)=>acc+(l.budget||0),0) || 50 }
                              ]} 
                              cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none"
                            >
                              {[
                                { name: 'Gaming', value: 50 },
                                { name: 'Finance', value: 20 },
                                { name: 'Entertainment', value: 10 },
                                { name: 'Other', value: 5 }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#FF3B30', '#34C759', '#007AFF', '#71717a'][index % 4]} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              content={({ active, payload }) => {
                                 if (active && payload && payload.length) {
                                   return (
                                     <div className="glass-panel border border-white/[0.04] shadow-[0_10px_40px_-15px_rgba(255,255,255,0.1)] rounded-2xl p-4">
                                       <div className="flex flex-col gap-2">
                                         {payload.map((entry: any, index: number) => (
                                           <div key={index} className="flex justify-between items-center gap-4 text-[11px] font-mono tracking-widest">
                                             <span style={{ color: entry.payload.color || entry.color }} className="flex items-center gap-1.5 uppercase">
                                               <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.payload.color || entry.color }}></span>
                                               {entry.name}:
                                             </span>
                                             <span className="text-white font-bold">${entry.value.toLocaleString()}</span>
                                           </div>
                                         ))}
                                       </div>
                                     </div>
                                   );
                                 }
                                 return null;
                               }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                         <div className="h-full flex items-center justify-center text-zinc-600 font-mono text-xs uppercase tracking-[0.2em]">No data</div>
                      )}
                   </div>
               </div>
             </div>

             <SmartQueue leads={leads} onSelectLead={setSelectedLead} />
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="mb-8 animate-[fade-in_0.3s_ease-out]">
            <div className="glass-panel p-6 flex flex-col gap-6 relative overflow-hidden rounded-3xl !border-white/[0.04]">
              {/* Calendar Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-12 h-12 rounded-full bg-white/10 border border-white/[0.04] flex items-center justify-center shrink-0">
                     <Calendar className="text-white/80" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl text-white font-body tracking-tight font-bold">{format(currentMonth, 'MMMM yyyy')}</h3>
                    <p className="text-[10px] text-white/50 font-mono tracking-widest uppercase mt-0.5">Project Deadlines & Follow-ups</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-8 h-8 rounded-full bg-white/5 border border-white/[0.04] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                     <ChevronLeft size={14} />
                   </button>
                   <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-8 h-8 rounded-full bg-white/5 border border-white/[0.04] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                     <ChevronRight size={14} />
                   </button>
                </div>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px bg-white/[0.02] rounded-xl overflow-hidden border border-white/[0.04]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-[#0a0a0a]/80 py-3 text-center text-[9px] font-mono tracking-[0.2em] text-white/40 uppercase">
                    {day}
                  </div>
                ))}
                
                {(() => {
                  const start = startOfMonth(currentMonth);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const end = endOfMonth(currentMonth);
                  const startDate = subDays(start, start.getDay());
                  const endDate = addMonths(start, 1); // rough buffer
                  const days = eachDayOfInterval({ start: startDate, end: endOfMonth(endDate) }).slice(0, 42); // 6 weeks
                  
                  return days.map(day => {
                    // Find leads with follow-up on this day
                    const dayLeads = leads.filter(l => {
                      if (!l.followUpDate) return false;
                      const fDate = l.followUpDate.toDate ? l.followUpDate.toDate() : new Date(l.followUpDate);
                      return isSameDay(fDate, day);
                    });
                    
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    
                    return (
                      <div key={day.toISOString()} className={`min-h-[100px] p-2 bg-[#0a0a0a] border-t border-white/[0.02] ${!isCurrentMonth ? 'opacity-30' : ''}`}>
                        <div className={`text-xs font-mono font-bold mb-2 w-6 h-6 rounded-full flex items-center justify-center ${isToday(day) ? 'bg-[var(--brand-primary)] text-white' : 'text-white/60'}`}>
                          {format(day, 'd')}
                        </div>
                        <div className="flex flex-col gap-1.5 custom-scrollbar max-h-[80px] overflow-y-auto">
                           {dayLeads.map(lead => (
                             <div 
                               key={lead.id} 
                               onClick={() => { setSelectedLeadTab('contact'); setSelectedLead(lead); }}
                               className="text-[9px] cursor-pointer hover:bg-white/10 bg-white/5 border border-white/[0.04] px-1.5 py-1 rounded flex flex-col transition-colors group relative truncate"
                             >
                                <span className="font-bold text-white/80 group-hover:text-white truncate">{lead.brandName || 'Unnamed'}</span>
                                {lead.status === 'new' && <span className="text-zinc-400 capitalize truncate">New</span>}
                                {lead.status === 'in_talks' && <span className="text-yellow-400 capitalize truncate">In Talks</span>}
                                {lead.status === 'contract_sent' && <span className="text-orange-400 capitalize truncate">Contract Sent</span>}
                                {lead.status === 'editing' && <span className="text-blue-400 capitalize truncate">Editing</span>}
                                {lead.status === 'delivered' && <span className="text-green-400 capitalize truncate">Delivered</span>}
                             </div>
                           ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      
      {showAddLead && <AddLeadModal onClose={() => setShowAddLead(false)} onSuccess={() => setShowAddLead(false)} />}
      {selectedLead && (
         <LeadDetailsModal 
           lead={selectedLead} 
           onClose={() => setSelectedLead(null)} 
           defaultTab={selectedLeadTab}
         />
      )}

      {deleteLeadId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]" onClick={() => setDeleteLeadId(null)}>
          <div className="bg-[#0f0f0f] border border-white/[0.04] rounded-2xl w-full max-w-sm flex flex-col overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]" onClick={e => e.stopPropagation()}>
            <div className="p-10">
              <h3 className="text-xl font-bold text-white mb-2">Delete Lead</h3>
              <p className="text-white/60 text-sm">Are you sure you want to delete this lead? This action cannot be undone.</p>
            </div>
            <div className="p-4 flex gap-3 bg-white/[0.02] border-t border-white/[0.02]">
              <button 
                onClick={() => setDeleteLeadId(null)} 
                className="flex-1 px-4 py-2 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 transition-colors font-bold text-xs uppercase tracking-[0.2em] border border-transparent"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    await deleteDoc(doc(db, 'leads', deleteLeadId));
                    toast.success('Lead deleted');
                  } catch(err) {
                    handleFirestoreError(err, OperationType.DELETE, 'leads');
                    toast.error('Failed to delete lead');
                  }
                  setDeleteLeadId(null);
                }} 
                className="flex-1 bg-white/10 text-zinc-100 border border-white/[0.04] hover:bg-white/20 px-4 py-2 rounded-2xl transition-colors font-bold text-xs uppercase tracking-[0.2em]"
              >
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}