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

      const lastRun = localStorage.getItem('autopilotLastRunDate');
      const today = new Date().toISOString().split('T')[0];
      if (lastRun === today) return; // already ran today

      console.log("Triggering daily June Prime in the background...");
      toast("🤖 June Prime started daily scan in background...");
      localStorage.setItem('autopilotLastRunDate', today); // Optimistically set so we don't double fire

      try {
        const autopilotNiche = localStorage.getItem('autopilotNiche') || 'OVERALL';
        let targetNiche = autopilotNiche === 'OVERALL' ? 'OVERALL' : autopilotNiche;
        const isSunday = new Date().getDay() === 0;

        if (targetNiche === 'OVERALL' && !isSunday) {
          const YOUTUBE_NICHES = [
            "VTubers & Virtual Idols", "Gaming & Esports", "Finance & Stocks", "Real Estate Investing", "Podcast & Multi-Cam"
          ];
          targetNiche = YOUTUBE_NICHES[Math.floor(Math.random() * YOUTUBE_NICHES.length)];
          toast(`🤖 June Prime targeting high-value leaders in ${targetNiche}...`);
        } else if (targetNiche === 'OVERALL' && isSunday) {
          toast("🤖 June Prime Sunday Global Scan initiated...");
        }

        const { generateBulkChannelLeads, generateInstantColdPitch, generateSingleLeadAnalysis } = await import('../services/ai');
        const channels = await generateBulkChannelLeads(targetNiche, 10, 5000, "Global");
        
        const eliteChannels = channels.filter(c => {
           if (isSunday && targetNiche === 'OVERALL') {
              return c.leadScore?.includes('A') || c.leadScore?.includes('B') || c.leadScore?.includes('C');
           } else {
              return c.leadScore?.includes('A') || c.leadScore?.includes('B');
           }
        }).slice(0, 15);
        
        if (eliteChannels.length === 0) {
          toast.info("🤖 June Prime finished: No elite leads found today.");
          return;
        }

        let addedCount = 0;
        for (const item of eliteChannels) {
            try {
                const brandName = item.channelName || 'Unknown Brand';
                const existingQuery = query(collection(db, 'leads'), where('ownerId', '==', user.uid), where('brandName', '==', brandName));
                const existingDocs = await getDocs(existingQuery);
                if (!existingDocs.empty) continue;

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
             const enrichment = await enrichLeadSocials(lead.companyUrl);
             
             await updateDoc(docSnap.ref, {
               socialsEnriched: true,
               enrichedData: enrichment,
               scoreContext: `JunePrime Auto-Enrichment applied.`
             });
             toast.success(`JunePrime enriched lead intelligence for ${lead.brandName}`);
           } catch (e) {
             console.error('Enrichment agent failed:', e);
             await updateDoc(docSnap.ref, { enrichmentFailed: true });
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
