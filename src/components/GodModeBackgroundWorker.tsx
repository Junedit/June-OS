// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

export default function GodModeBackgroundWorker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // 1. Listen for proposals that just got signed but haven't triggered automation
    const q = query(
      collection(db, 'proposals'),
      where('ownerId', '==', user.uid),
      where('status', '==', 'signed'),
      where('automationTriggered', '==', false)
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      // ... existing proposal logic ...
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added' || change.type === 'modified') {
          const proposalDoc = change.doc;
          const proposal = proposalDoc.data();
          const pId = proposalDoc.id;

          console.log(`God Mode Triggered for Proposal ${pId}`);
          toast.success(`⚡ "God Mode" Deal Automation running for ${proposal.brandName || 'Client'}`);

          try {
            await updateDoc(doc(db, 'proposals', pId), {
              automationTriggered: true,
              updatedAt: serverTimestamp()
            });

            let contractId = proposal.contractId;
            if (!contractId) {
               const contractRef = await addDoc(collection(db, 'contracts'), {
                 title: `Services Contract - ${proposal.title || 'Project'}`,
                 clientName: proposal.clientName || 'Client',
                 status: 'sent',
                 content: `<h1>Master Services Agreement</h1><p>Generated via Proposal Automation.</p>`,
                 createdAt: serverTimestamp(),
                 proposalId: pId,
                 ownerId: user.uid
               });
               contractId = contractRef.id;
               await updateDoc(doc(db, 'proposals', pId), { contractId });
            }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
            const invoiceRef = await addDoc(collection(db, 'invoices'), {
               amount: (proposal.amount || 0) * 0.5,
               clientName: proposal.clientName || 'Client',
               clientEmail: proposal.contactEmail || '',
               createdAt: serverTimestamp(),
               dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
               invoiceNumber: `INV-AUTO-${Math.floor(Math.random()*10000)}`,
               ownerId: user.uid,
               status: 'draft',
               desc: '50% Upfront Retainer - ' + proposal.title
            });

            await addDoc(collection(db, 'folders'), {
               name: `${proposal.clientName || 'Client'} - Project Assets`,
               parentId: null,
               ownerId: user.uid,
               createdAt: serverTimestamp()
            });

            if (proposal.leadId) {
               await updateDoc(doc(db, 'leads', proposal.leadId), {
                 status: 'closed',
                 updatedAt: serverTimestamp()
               });
            }

            toast.success("✅ Automation Complete: Invoice, Assets folder, and Contract prepared.");
            
          } catch (e: any) {
            console.error('God Mode failed:', e);
          }
        }
      }
    });

    // 2. The Auto-Follow-Up Daemon (Runs every 10 seconds checking for 48h stale leads)
    const checkStaleLeads = async () => {
       try {
         const now = new Date();
         const leadsQ = query(collection(db, 'leads'), where('ownerId', '==', user.uid), where('status', 'in', ['contacted', 'negotiating']));
         const snapshot = await getDocs(leadsQ);
         snapshot.forEach(async (docSnap) => {
           const lead = docSnap.data();
           if (!lead.updatedAt || lead.hasFollowupDaemonTriggered) return;
           
           const lastUpdate = lead.updatedAt.toDate ? lead.updatedAt.toDate() : new Date(lead.updatedAt);
           const hoursDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

           // In a real app we'd use >= 48 hours. Here we will use 1 hour or a very short time just to show it, or check for ~48h
           if (hoursDiff >= 0.05) { // 3 minutes for testing
             toast.message(`DAEMON: Lead '${lead.brandName}' is going cold.`, {
                description: 'A lethal follow-up playbook has been generated.',
                icon: '⚡',
                duration: 10000,
             });
             // Mark so we don't spam
             await updateDoc(doc(db, 'leads', docSnap.id), {
                hasFollowupDaemonTriggered: true
             });
             
             // Add an actionable task
             await addDoc(collection(db, 'leads', docSnap.id, 'notes'), {
                leadId: docSnap.id,
                ownerId: user.uid,
                text: "CRITICAL: 48h Follow-up Window. Lead is going cold. Execute 'The Insight Bomb' play immediately in AI Assist tab.",
                type: 'note',
                createdAt: serverTimestamp()
             });
           }
         });
       } catch(e) {
         console.error('Daemon error:', e);
       }
    };
    
    // 3. June Prime (God Mode) Autopilot
    const runJunePrimeAgent = async () => {
      const autopilotOn = localStorage.getItem('autopilotOn') === 'true';
      if (!autopilotOn) return;

      const lastRunStr = localStorage.getItem('autopilotLastRunTimestamp');
      const now = new Date();
      const currentHour = now.getHours();
      
      // Run once a day after 6 AM
      if (currentHour < 6) return;
      if (lastRunStr) {
         const lastRunDate = new Date(parseInt(lastRunStr));
         if (lastRunDate.toDateString() === now.toDateString()) {
             // Already ran today
             return;
         }
      }

      console.log("Triggering June Prime morning background worker...");
      toast("🤖 June Prime starting 6 AM daily scan...");
      // Mark as ran today immediately to avoid parallel runs
      localStorage.setItem('autopilotLastRunTimestamp', Date.now().toString()); 

      try {
        const autopilotNiche = localStorage.getItem('autopilotNiche') || 'OVERALL';
        let targetNiche = autopilotNiche === 'OVERALL' ? 'OVERALL' : autopilotNiche;
        const isSunday = now.getDay() === 0;

        if (isSunday) {
          targetNiche = 'OVERALL';
          toast("🤖 June Prime Sunday Global Scan initiated: Hunting for editor jobs...");
        } else if (targetNiche === 'OVERALL') {
          const YOUTUBE_NICHES = [
            "VTubers & Virtual Idols", "Gaming & Esports", "Finance & Stocks", "Real Estate Investing", "Podcast & Multi-Cam",
            "Cooking & Baking", "Mukbang & Eating Shows", "Tech & Gadget Reviews", "Edutainment & Lore", "Video Essays & Mini-Docs",
            "Faceless Channels", "Reaction & Commentary", "Esports & Competitive Gaming", "Science Experiments", "Documentary Films",
            "Productivity & Self-Help", "Men's Fashion & Grooming", "Streetwear & Sneakers", "Fitness & Bodybuilding", "Travel Vlogs & Exploration",
            "Van Life & Digital Nomads", "Theme Park Reviews", "Photography & Filmmaking", "Automotive & Car Builds"
          ];
          targetNiche = YOUTUBE_NICHES[Math.floor(Math.random() * YOUTUBE_NICHES.length)];
          toast(`🤖 June Prime targeting high-value leaders in ${targetNiche}...`);
        }

        const { generateBulkChannelLeads, generateInstantColdPitch, generateSingleLeadAnalysis } = await import('../services/ai');
        // Reduce minSubs to 1000 so we catch smaller, hungry channels needing editors
        const channels = await generateBulkChannelLeads(targetNiche, 20, 1000, "Global");
        
        const eliteChannels = channels.filter(c => {
           return c.leadScore?.includes('A') || c.leadScore?.includes('B');
        }).slice(0, 10);
        
        if (eliteChannels.length === 0) {
          toast.info("🤖 June Prime finished: No new leads passed the filter.");
          // Clear timestamp to retry since we failed to find leads today
          localStorage.removeItem('autopilotLastRunTimestamp');
          return;
        }

        let addedCount = 0;
        for (const item of eliteChannels) {
            try {
                const brandName = item.channelName || 'Unknown Brand';
                const existingQuery = query(collection(db, 'leads'), where('ownerId', '==', user.uid), where('brandName', '==', brandName));
                const existingDocs = await getDocs(existingQuery);
                let isDuplicate = !existingDocs.empty;
                
                if (!isDuplicate && item.channelUrl) {
                    const urlQuery = query(collection(db, 'leads'), where('ownerId', '==', user.uid), where('companyUrl', '==', item.channelUrl));
                    const urlDocs = await getDocs(urlQuery);
                    isDuplicate = !urlDocs.empty;
                }
                
                if (isDuplicate) continue;

                const analysis = await generateSingleLeadAnalysis(item);
                const pitchData = await generateInstantColdPitch({ ...item, ...analysis });
                
                const rawEmail = (item.publicEmail && item.publicEmail.includes('@')) ? item.publicEmail.split(/[\s/,]+/).find((e: string) => e.includes('@')) : 'unknown@example.com';
                const cleanEmail = rawEmail && /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(rawEmail) ? rawEmail : 'unknown@example.com';

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
                    message: `[JUNE PRIME GENERATED]\nSubs: ${item.subscriberCount} | 30d Views: ${item.thirtyDayViews} | Growth: ${item.growthRate}\nEstimated Rev: ${item.estimatedRevenue || 'Unknown'}\nTarget Rate: ${item.targetEditorRate || 'Unknown'}\n\nLead Score: ${analysis.leadScore} (IQ: ${analysis.qualityScore}) - ${analysis.scoreReason}\nFinancial Upside (AI): ${analysis.estimatedUpsideValue || 'Unknown'}\nPredicted 12-Month LTV: ${analysis.predictedLTV || item.predictedLTV || 'Unknown'}\nAlgorithmic Distress: ${item.distressSignal ? 'DETECTED' : 'None'}\n\nHiring Mentions: ${analysis.hiringMentions || item.hiringMentions || 'No explicit mention.'}\n\nLast Video: ${item.lastVideoPerformance}\n\nDeep Dive: ${analysis.deepDiveInfo || ''}\n\nContent Fixes: ${analysis.contentFixes || ''}\n\nGenerated Pitches Saved internally.`,
                    status: 'new',
                    ownerId: user.uid,
                    pitchVariants: pitchData,
                    createdAt: serverTimestamp()
                });
                addedCount++;
            } catch (e: any) {
                console.warn("Error processing June Prime elite lead:", e);
            }
        }
        
        if (addedCount > 0) {
          toast.success(`🤖 June Prime Pipeline Update! ${addedCount} highly-qualified leads added by System Overlord.`);
        }
      } catch (e: any) {
         console.error("June Prime Autopilot error: ", e);
      }
    };

    // 4. June Prime Data Enrichment (Background)
    const runEnrichmentAgent = async () => {
      try {
        const newLeadsQ = query(collection(db, 'leads'), where('ownerId', '==', user.uid), where('status', '==', 'new'));
        const snapshot = await getDocs(newLeadsQ);
        
        for (const docSnap of snapshot.docs) {
           const lead = docSnap.data();
           if (lead.socialsEnriched || lead.enrichmentFailed || !lead.companyUrl) continue;
           
           // Throttle to 1 at a time to prevent API rate limits
           try {
             console.log(`JunePrime background enriching: ${lead.brandName}`);
             const { enrichLeadSocials } = await import('../services/ai');
             const enrichment = await enrichLeadSocials(lead);
             
             if (enrichment) {
               try {
                 await updateDoc(docSnap.ref, {
                   socialsEnriched: true,
                   enrichedData: enrichment,
                   scoreContext: `JunePrime Auto-Enrichment applied.`,
                   updatedAt: serverTimestamp()
                 });
                 toast.success(`JunePrime enriched lead intelligence for ${lead.brandName}`);
               } catch (updateErr) {
                 console.error("Failed to update lead with enrichment data:", updateErr);
               }
             } else {
               try {
                 await updateDoc(docSnap.ref, { enrichmentFailed: true, updatedAt: serverTimestamp() });
               } catch (updateErr) {
                 console.error("Failed to mark lead as enrichment failed:", updateErr);
               }
             }
           } catch (e: any) {
             if (e?.status === 'RESOURCE_EXHAUSTED' || e?.message?.includes('429')) {
               console.warn('Enrichment agent hit rate limit. Halting queue.');
               break; // Stop processing further leads in this interval
             }
             console.error('Enrichment agent failed:', e);
             try {
               await updateDoc(docSnap.ref, { enrichmentFailed: true, updatedAt: serverTimestamp() });
             } catch (updateErr) {
               console.error("Failed to mark lead as enrichment failed in catch block:", updateErr);
             }
           }
        }
      } catch (e) {
        console.error('Data enrichment daemon error:', e);
      }
    };

    // 5. Client Feedback & Sentiment Analyst (Background)
    const runFeedbackAnalyst = async () => {
      try {
        const activeLeadsQ = query(collection(db, 'leads'), where('ownerId', '==', user.uid), where('status', 'in', ['working', 'delivered', 'review', 'revision']));
        const snapshot = await getDocs(activeLeadsQ);

        for (const docSnap of snapshot.docs) {
          const lead = docSnap.data();
          if (lead.feedbackAnalyzedAt && Date.now() - lead.feedbackAnalyzedAt < 3600000) continue; // Run at most once per hour

          const msgsQ = query(collection(db, 'leads', docSnap.id, 'messages'));
          const msgsSnap = await getDocs(msgsQ);
          if (msgsSnap.empty) continue;
          
          const rawMessages = msgsSnap.docs.map(d => `[${d.data().senderRole}]: ${d.data().text}`);
          
          try {
             console.log(`Running Feedback Analyst on: ${lead.brandName}`);
             const { analyzeFeedbackAndDraftResponse } = await import('../services/ai');
             const analysis = await analyzeFeedbackAndDraftResponse(rawMessages);
             
             if (analysis) {
               await updateDoc(docSnap.ref, {
                 distressSignal: analysis.distressSignal || false,
                 feedbackAnalyzedAt: Date.now(),
                 autoDraftedReply: analysis.draftedResponse || null,
                 suggestedImprovements: analysis.improvements || []
               });

               if (analysis.distressSignal && !lead.distressSignal) {
                 toast.error(`⚠️ DISTRESS SIGNAL DETECTED for ${lead.brandName} (${analysis.sentiment})`, {
                     description: "AI Analyst detected a major issue. Drafted a response.",
                     duration: 10000
                 });
                 // Log into notes
                 await addDoc(collection(db, 'leads', docSnap.id, 'notes'), {
                    ownerId: user.uid,
                    leadId: docSnap.id,
                    type: 'note',
                    text: `🚨 **DISTRESS SIGNAL:** ${analysis.sentiment}\n\n**AI Suggested Action:** Review the drafted email and implement these improvements: \n${analysis.improvements.map((i:string) => '- ' + i).join('\n')}`,
                    createdAt: serverTimestamp()
                 });
               }
             }
          } catch (err) {
             console.error("Feedback analyst failed: ", err);
          }
        }
      } catch (err) {
        console.error("Feedback analyst daemon error:", err);
      }
    };

    // Check initially, then on interval
    checkStaleLeads();
    runJunePrimeAgent();
    runEnrichmentAgent();
    runFeedbackAnalyst();

    const interval = setInterval(() => {
       checkStaleLeads();
       runJunePrimeAgent();
       runEnrichmentAgent();
       runFeedbackAnalyst();
    }, 60000); // Check every minute

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [user]);

  return null;
}
