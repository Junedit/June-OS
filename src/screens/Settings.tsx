import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, updateDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { sendPasswordResetEmail, updateEmail } from 'firebase/auth';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Save, Plus, Trash2, Settings as SettingsIcon, Palette, Image as ImageIcon, Users, RefreshCw, Globe, ExternalLink, Copy, Key, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleaningDups, setCleaningDups] = useState(false);
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [themeColor, setThemeColor] = useState('red');
  const [themeHeroUrl, setThemeHeroUrl] = useState('');
  const [calendarUrl, setCalendarUrl] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [stripeLink, setStripeLink] = useState('');
  const [paypalLink, setPaypalLink] = useState('');
  const [wiseLink, setWiseLink] = useState('');
  const [portalLogoUrl, setPortalLogoUrl] = useState('');
  const [portalAgencyName, setPortalAgencyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState('');
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [defaultInvoiceTemplate, setDefaultInvoiceTemplate] = useState('branded');
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(['', '', '']);
  
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const [packages, setPackages] = useState<{id: string, name: string, price: number, description: string}[]>([
    { id: '1', name: 'Standard YouTube Edit', price: 300, description: 'High-retention 8-15 minute edit with B-roll.' },
    { id: '2', name: 'Shorts/Reels Batch', price: 200, description: '4x vertical vids repurposed from long-form.' }
  ]);

  const themes = [
    { id: 'red', name: 'red', color: 'bg-[var(--brand-primary)] text-white' },
    { id: 'obsidian', name: 'Obsidian', color: 'bg-zinc-500' },
    { id: 'bronze', name: 'Bronze', color: 'bg-orange-700' }
  ];

  useEffect(() => {
    if (!user) return;
    
    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'settings', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDisplayName(data.displayName || '');
          setBio(data.bio || '');
          setThemeColor(data.themeColor || 'cyan');
          setThemeHeroUrl(data.themeHeroUrl || '');
          setCalendarUrl(data.calendarUrl || '');
          setPaymentLink(data.paymentLink || '');
          setStripeLink(data.stripeLink || '');
          setPaypalLink(data.paypalLink || '');
          setWiseLink(data.wiseLink || '');
          setPortalLogoUrl(data.portalLogoUrl || '');
          setPortalAgencyName(data.portalAgencyName || '');
          setWebsiteUrl(data.websiteUrl || '');
          setInstagramHandle(data.instagramHandle || '');
          setTwitterHandle(data.twitterHandle || '');
          setYoutubeUrl(data.youtubeUrl || '');
          setZapierWebhookUrl(data.zapierWebhookUrl || '');
          setAnthropicApiKey(data.anthropicApiKey || '');
          setDefaultInvoiceTemplate(data.defaultInvoiceTemplate || 'branded');
          if (data.packages && data.packages.length > 0) {
            setPackages(data.packages);
          }
          if (data.portfolioLinks) {
            setPortfolioLinks((data.portfolioLinks as string[]).concat(['', '', '']).slice(0, 3));
          }
        }

        // Load team members if owner
        if (userRole === 'owner') {
          const usersSnap = await getDocs(collection(db, 'users'));
          const members: any[] = [];
          usersSnap.forEach(d => members.push({ id: d.id, ...d.data() }));
          setTeamMembers(members);
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [user, userRole]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      await setDoc(doc(db, 'settings', user.uid), {
        ownerId: user.uid,
        displayName,
        bio,
        themeColor,
        themeHeroUrl,
        calendarUrl,
        paymentLink,
        stripeLink,
        paypalLink,
        wiseLink,
        portalLogoUrl,
        portalAgencyName,
        websiteUrl,
        instagramHandle,
        twitterHandle,
        youtubeUrl,
        zapierWebhookUrl,
        anthropicApiKey,
        defaultInvoiceTemplate,
        packages,
        portfolioLinks: portfolioLinks.map(l => l.trim())
      }, { merge: true });
      
      toast.success("Settings saved successfully!");
    } catch (e) {
      console.error("Failed to save settings:", e);
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setTeamMembers(members => members.map(m => m.id === userId ? { ...m, role: newRole } : m));
      toast.success("User role updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user role");
    }
  };

  const addPackage = () => {
    setPackages([...packages, { id: Date.now().toString(), name: 'New Package', price: 1000, description: 'Description here.' }]);
  };

  const updatePackage = (id: string, field: string, value: string | number) => {
    setPackages(packages.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePackage = (id: string) => {
    setPackages(packages.filter(p => p.id !== id));
  };

  const handleCleanupDuplicates = async () => {
    if (!user) return;
    setCleaningDups(true);
    const toastId = toast.loading("Scanning for duplicates...");
    try {
      const q = query(collection(db, 'leads'), where('ownerId', '==', user.uid));
      const snap = await getDocs(q);
      const leads = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      
      const brandMap: Record<string, any[]> = {};
      leads.forEach(lead => {
         const key = (lead.brandName || '').trim().toLowerCase();
         if (!key) return; // ignore completely empty ones if any
         if (!brandMap[key]) brandMap[key] = [];
         brandMap[key].push(lead);
      });
      
      let deletedCount = 0;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [brand, group] of Object.entries(brandMap)) {
         if (group.length > 1) {
            // Sort by createdAt ascending (keep oldest)
            group.sort((a, b) => {
               const ta = a.createdAt?.seconds || 0;
               const tb = b.createdAt?.seconds || 0;
               return ta - tb;
            });
            // Delete all except the first one
            for (let i = 1; i < group.length; i++) {
               await deleteDoc(doc(db, 'leads', group[i].id));
               deletedCount++;
            }
         }
      }
      toast.success(`Cleanup complete! Removed ${deletedCount} duplicate leads.`, { id: toastId });
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to clean up duplicates", { id: toastId });
    } finally {
      setCleaningDups(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user || !user.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success("Password reset email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    }
  };

  const handleUpdateEmail = async () => {
    if (!user) return;
    const newEmail = prompt("Enter your new email address:");
    if (!newEmail || !newEmail.includes('@')) return;
    try {
      await updateEmail(user, newEmail);
      toast.success("Email updated successfully!");
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast.error("Please log out and log back in to change your email.");
      } else {
        toast.error(error.message || "Failed to update email.");
      }
    }
  };

  if (loading) {
    return <div className="flex-1 p-10 font-mono text-white/60">Loading settings...</div>;
  }

  return (
    <div className="flex-1 bg-transparent w-full min-h-screen relative flex flex-col z-0">
      <header className="bg-transparent/40 backdrop-blur-[40px] saturate-[1.8] border-b border-white/[0.02] top-0 sticky z-40 flex justify-between items-center w-full px-8 py-5 shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[16px] bg-white/[0.02] flex items-center justify-center border border-white/[0.02] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <SettingsIcon className="text-zinc-100 relative z-10" size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-body tracking-tight font-bold text-white tracking-tight">System Settings</h2>
            <p className="text-[10px] text-white/60 font-mono tracking-[0.2em] uppercase mt-0.5">Configuration & Access</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
             onClick={handleSave}
             disabled={saving}
             className="linear-button shadow-[0_4px_24px_rgba(255,255,255,0.15)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 text-[10px]"
          >
             {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </div>
      </header>

      <div className="p-10 md:p-10 max-w-3xl mx-auto w-full mb-32 space-y-8 relative z-10">

        {userRole === 'owner' && (
          <section className="bg-transparent border border-white/[0.04] rounded-sm p-10 mb-8 backdrop-blur-[40px] saturate-[1.8] relative">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Key size={12} /> Account & Security
                </h3>
             </div>
             
             <div className="flex gap-4">
               <button 
                 onClick={handleUpdateEmail}
                 className="bg-white/5 hover:bg-white/10 text-white border border-white/[0.04] rounded-2xl px-4 py-3 text-xs font-mono tracking-[0.1em] uppercase items-center flex gap-3 transition-colors"
               >
                 <Mail size={14} />
                 Change Linked Email
               </button>
               <button 
                 onClick={handleResetPassword}
                 className="bg-white/5 hover:bg-white/10 text-white border border-white/[0.04] rounded-2xl px-4 py-3 text-xs font-mono tracking-[0.1em] uppercase items-center flex gap-3 transition-colors"
               >
                 <Key size={14} />
                 Send Password Reset
               </button>
             </div>
          </section>
        )}

        {userRole === 'owner' && (
          <section className="bg-transparent border border-white/[0.04] rounded-sm p-10 mb-8 backdrop-blur-[40px] saturate-[1.8] relative">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Users size={12} /> Team Management
                </h3>
                <button 
                  onClick={handleCleanupDuplicates}
                  disabled={cleaningDups}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/[0.04] rounded-2xl px-3 py-1.5 text-[10px] font-mono tracking-[0.2em] uppercase items-center flex gap-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={12} className={cleaningDups ? "animate-spin" : ""} />
                  Clean Duplicate Leads
                </button>
             </div>
             <p className="text-[10px] text-white/40 mb-8 font-mono tracking-widest uppercase">Manage access roles for your organization.</p>
             
             <div className="space-y-4">
               {teamMembers.map(member => (
                 <div key={member.id} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] p-4 rounded-sm">
                   <div>
                     <p className="text-sm text-white font-semibold">{member.displayName || 'Unknown'}</p>
                     <p className="text-xs text-white/50">{member.email}</p>
                   </div>
                   <div className="flex items-center gap-3">
                     <select
                       value={member.role}
                       onChange={e => handleRoleChange(member.id, e.target.value)}
                       disabled={member.id === user?.uid}
                       className="bg-[#000000]/50 border border-white/20 rounded-2xl text-xs text-white p-2 focus:outline-none focus:border-white/20"
                     >
                       <option value="owner">Owner</option>
                       <option value="member">Team Member</option>
                     </select>
                   </div>
                 </div>
               ))}
             </div>
          </section>
        )}

        <section className="bg-transparent border border-white/[0.04] rounded-sm p-10 mb-8 backdrop-blur-[40px] saturate-[1.8] relative">
           <h3 className="text-[10px] font-mono text-white/50 mb-8 uppercase tracking-[0.2em]">Master Identity</h3>
           
           <div className="space-y-8">
             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">Public Alias</label>
               <input 
                 type="text" 
                 value={displayName}
                 onChange={e => setDisplayName(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 p-3 text-2xl font-light text-white focus:outline-none focus:border-white transition-colors"
                 placeholder="e.g. MKBHD"
               />
             </div>
             
             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">Biography Vector</label>
               <textarea 
                 value={bio}
                 onChange={e => setBio(e.target.value)}
                 rows={4}
                 className="w-full bg-white/[0.02] border border-white/[0.04] rounded-sm p-4 text-sm font-light text-white focus:outline-none focus:border-white/[0.02]0 transition-colors resize-none"
                 placeholder="Detail your identity, capability, and operational timeline..."
               />
             </div>

             
             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">Website URL</label>
               <input 
                 type="url" 
                 value={websiteUrl}
                 onChange={e => setWebsiteUrl(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 p-3 text-sm font-light text-white focus:outline-none focus:border-white transition-colors"
                 placeholder="https://yourportfolio.com"
               />
             </div>
             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">Instagram Handle</label>
               <input 
                 type="text" 
                 value={instagramHandle}
                 onChange={e => setInstagramHandle(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 p-3 text-sm font-light text-white focus:outline-none focus:border-white transition-colors"
                 placeholder="@username"
               />
             </div>
             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">X / Twitter Handle</label>
               <input 
                 type="text" 
                 value={twitterHandle}
                 onChange={e => setTwitterHandle(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 p-3 text-sm font-light text-white focus:outline-none focus:border-white transition-colors"
                 placeholder="@username"
               />
             </div>
             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">YouTube URL</label>
               <input 
                 type="url" 
                 value={youtubeUrl}
                 onChange={e => setYoutubeUrl(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 p-3 text-sm font-light text-white focus:outline-none focus:border-white transition-colors"
                 placeholder="https://youtube.com/c/yourchannel"
               />
             </div>

             <div>
               <label className="block text-[10px] text-orange-400/80 uppercase tracking-[0.2em] mb-3 font-mono border border-orange-500/20 px-2 py-1 rounded inline-block bg-orange-500/10">Zapier Webhook URL for Intake</label>
               <input 
                 type="url" 
                 value={zapierWebhookUrl}
                 onChange={e => setZapierWebhookUrl(e.target.value)}
                 className="w-full bg-transparent border-b border-orange-500/30 p-3 text-sm font-light text-white focus:outline-none focus:border-orange-500 transition-colors"
                 placeholder="https://hooks.zapier.com/hooks/catch/..."
               />
               <p className="text-[10px] text-white/30 mt-3 font-mono tracking-widest italic">We will POST lead data here when Public Intake is submitted.</p>
             </div>

             <div>
               <label className="block text-[10px] text-purple-400/80 uppercase tracking-[0.2em] mb-3 font-mono border border-purple-500/20 px-2 py-1 rounded inline-block bg-purple-500/10">Anthropic API Key (Claude)</label>
               <input 
                 type="password" 
                 value={anthropicApiKey}
                 onChange={e => setAnthropicApiKey(e.target.value)}
                 className="w-full bg-transparent border-b border-purple-500/30 p-3 text-sm font-light text-white focus:outline-none focus:border-purple-500 transition-colors"
                 placeholder="sk-ant-..."
               />
               <p className="text-[10px] text-white/30 mt-3 font-mono tracking-widest italic">Optional: Use Claude API for pitch generation and AI tasks.</p>
             </div>

             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">Calendar Endpoint (Follow-Ups)</label>
               <input 
                 type="url" 
                 value={calendarUrl}
                 onChange={e => setCalendarUrl(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 p-3 text-sm font-light text-white focus:outline-none focus:border-white transition-colors"
                 placeholder="https://calendly.com/..."
               />
               <p className="text-[10px] text-white/30 mt-3 font-mono tracking-widest italic">Target for automated AI Deal follow-up injection.</p>
             </div>

             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">Stripe Direct Link</label>
               <input 
                 type="url" 
                 value={stripeLink}
                 onChange={e => setStripeLink(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 p-3 text-sm font-light text-white focus:outline-none focus:border-[#6366f1] transition-colors"
                 placeholder="https://buy.stripe.com/..."
               />
             </div>
             
             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">PayPal Link</label>
               <input 
                 type="url" 
                 value={paypalLink}
                 onChange={e => setPaypalLink(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 p-3 text-sm font-light text-white focus:outline-none focus:border-[#0079c1] transition-colors"
                 placeholder="https://paypal.me/..."
               />
             </div>
             
             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">Wise Payment Link</label>
               <input 
                 type="url" 
                 value={wiseLink}
                 onChange={e => setWiseLink(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 p-3 text-sm font-light text-white focus:outline-none focus:border-[#9fe870] transition-colors"
                 placeholder="https://wise.com/pay/..."
               />
             </div>

             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">Other / Custom Payment Link</label>
               <input 
                 type="url" 
                 value={paymentLink}
                 onChange={e => setPaymentLink(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 p-3 text-sm font-light text-white focus:outline-none focus:border-white transition-colors"
                 placeholder="https://..."
               />
               <p className="text-[10px] text-white/30 mt-3 font-mono tracking-widest italic">You can select which provider to use per-client when generating an invoice.</p>
             </div>

             <div>
               <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">Default Invoice Template</label>
               <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                 {[
                   { id: 'branded', label: 'Branded' },
                   { id: 'minimalist', label: 'Minimalist' },
                   { id: 'detailed', label: 'Detailed' },
                   { id: 'creative', label: 'Creative' },
                   { id: 'corporate', label: 'Corporate' }
                 ].map(template => (
                   <button
                     key={template.id}
                     onClick={() => setDefaultInvoiceTemplate(template.id)}
                     className={`p-4 border rounded font-mono text-xs uppercase tracking-[0.2em] transition-all text-center ${
                       defaultInvoiceTemplate === template.id 
                         ? 'border-white/20 text-zinc-100 bg-white/5' 
                         : 'border-white/[0.04] text-white/50 hover:bg-white/5 hover:border-white/30'
                     }`}
                   >
                     {template.label}
                   </button>
                 ))}
               </div>
             </div>
           </div>
        </section>

        <section className="bg-transparent border border-white/[0.04] rounded-sm p-10 mb-8 backdrop-blur-[40px] saturate-[1.8] relative">
           <h3 className="text-[10px] font-mono text-white/50 mb-6 uppercase tracking-[0.2em]">Public Showcase Array</h3>
           <p className="text-[10px] text-white/40 mb-8 font-mono tracking-widest uppercase">Direct injection points for YouTube media into public profile.</p>
           
           <div className="space-y-6">
             {portfolioLinks.map((link, idx) => (
               <div key={idx}>
                 <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-2 font-mono">Component {idx + 1}</label>
                 <input 
                   type="url" 
                   value={link}
                   onChange={e => {
                     const newLinks = [...portfolioLinks];
                     newLinks[idx] = e.target.value;
                     setPortfolioLinks(newLinks);
                   }}
                   className="w-full bg-transparent border border-white/[0.04] p-3 text-sm font-light text-white focus:outline-none focus:border-white/[0.02]0 transition-colors"
                   placeholder="https://youtu.be/..."
                 />
               </div>
             ))}
           </div>
        </section>

        <section className="bg-transparent border border-white/[0.04] rounded-sm p-10 mb-8 backdrop-blur-[40px] saturate-[1.8] relative">
           <h3 className="text-[10px] font-mono text-white/50 mb-6 uppercase tracking-[0.2em]">Aesthetics & Ambience</h3>
           
           <div className="space-y-8">
             <div>
               <label className="flex items-center gap-2 text-[10px] text-white/50 uppercase tracking-[0.2em] mb-4 font-mono">
                 <Palette size={12} /> Tint Designation
               </label>
               <div className="flex gap-4">
                 {themes.map(t => (
                   <button
                     key={t.id}
                     onClick={() => setThemeColor(t.id)}
                     className={`flex items-center gap-3 px-5 py-3 rounded-full border ${themeColor === t.id ? 'border-white bg-white/5' : 'border-white/[0.04] bg-transparent opacity-50 hover:opacity-100'} transition-all`}
                   >
                     <span className={`w-3 h-3 rounded-full ${t.color}`}></span>
                     <span className="text-[10px] font-mono tracking-[0.2em] text-white uppercase">{t.name}</span>
                   </button>
                 ))}
               </div>
             </div>
             
             <div>
               <label className="flex items-center gap-2 text-[10px] text-white/50 uppercase tracking-[0.2em] mb-3 font-mono">
                 <ImageIcon size={12} /> Hero Environment Layer
               </label>
               <input 
                 type="url" 
                 value={themeHeroUrl}
                 onChange={e => setThemeHeroUrl(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 p-3 text-sm font-light text-white focus:outline-none focus:border-white transition-colors"
                 placeholder="https://images.unsplash.com/..."
               />
               <p className="text-[10px] text-white/30 mt-3 uppercase tracking-widest font-mono">Fallback to master node ambient glow if unspecified.</p>
             </div>
           </div>
        </section>

        <section className="bg-transparent border border-white/[0.04] rounded-sm p-10 backdrop-blur-[40px] saturate-[1.8] relative">
           <div className="flex justify-between items-center mb-8">
             <h3 className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em]">Service Architecture</h3>
             <button 
               onClick={addPackage}
               className="text-[10px] font-semibold text-white hover:text-white uppercase tracking-[0.2em] flex items-center gap-2 transition-colors uppercase"
             >
               <Plus size={12} strokeWidth={2} /> Append Tier
             </button>
           </div>
           
           <div className="space-y-6">
             {packages.map((pkg, index) => (
               <div key={pkg.id} className="bg-white/[0.02] border border-white/[0.04] rounded-sm p-10 relative group flex gap-10 items-start">
                 <div className="text-white/20 font-mono text-2xl font-light w-8 tracking-[0.2em]">
                   {String(index + 1).padStart(2, '0')}
                 </div>
                 
                 <div className="flex-1 space-y-6">
                   <div className="grid grid-cols-3 gap-10">
                     <div className="col-span-2">
                       <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-2 font-mono">Tier Nomenclature</label>
                       <input 
                         type="text" 
                         value={pkg.name}
                         onChange={e => updatePackage(pkg.id, 'name', e.target.value)}
                         className="w-full bg-transparent border-b border-white/20 p-2 text-sm font-light text-white focus:outline-none focus:border-white transition-colors"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-2 font-mono">Valuation ($)</label>
                       <input 
                         type="number" 
                         value={pkg.price}
                         onChange={e => updatePackage(pkg.id, 'price', Number(e.target.value))}
                         className="w-full bg-transparent border-b border-white/20 p-2 text-sm font-light text-white focus:outline-none focus:border-white transition-colors"
                       />
                     </div>
                   </div>
                   <div>
                     <label className="block text-[10px] text-white/50 uppercase tracking-[0.2em] mb-2 font-mono">Scope Vector</label>
                     <input 
                       type="text" 
                       value={pkg.description}
                       onChange={e => updatePackage(pkg.id, 'description', e.target.value)}
                       className="w-full bg-transparent border-b border-white/20 p-2 text-sm font-light text-white focus:outline-none focus:border-white transition-colors"
                     />
                   </div>
                 </div>

                 <button 
                   onClick={() => removePackage(pkg.id)}
                   className="text-white/30 hover:text-[#FF453A] transition-colors p-2 absolute right-4 top-4"
                   title="Remove Package"
                 >
                   <Trash2 size={14} />
                 </button>
               </div>
             ))}
           </div>
        </section>
      </div>
    </div>
  );
}
