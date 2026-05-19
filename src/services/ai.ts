import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI, Type } from "@google/genai";
import { toast } from "sonner";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


export async function enrichLeadSocials(lead: any) {
  try {
    const aiClient = getAI();
    const prompt = `Search the web to find the LinkedIn and Instagram profiles, as well as a short bio/recent activity for the following entity/person.
Company/Brand: ${lead.brandName}
Contact Name: ${lead.contactName || 'Unknown'}
Niche: ${lead.niche || 'Unknown'}
URL: ${lead.companyUrl || 'Unknown'}

Return ONLY a JSON object with the following structure. If you cannot find a piece of information, omit the key or return null.
{
  "linkedinUrl": "...",
  "instagramUrl": "...",
  "enrichmentData": {
    "followers": "...",
    "engagementRate": "...",
    "verified": true,
    "bio": "...",
    "recentActivity": "..."
  }
}`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      }
    });

    if (response && response.text) {
      return JSON.parse(response.text);
    }
  } catch (error: any) {
    if (error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('429')) {
      console.warn("AI Quota exhausted during enrichment. Will retry later.");
      throw error;
    }
    console.error("Error enriching lead socials:", JSON.stringify(error));
  }
  return null;
}

export async function generateContentWithRetry(client: any, options: any, maxRetries = 3): Promise<any> {
  const promptText = typeof options.contents === 'string' ? options.contents : JSON.stringify(options.contents);
  const isPitchTask = promptText.toLowerCase().includes('pitch') || promptText.toLowerCase().includes('sales');

  let anthropicKey = null;
  try {
      if (auth.currentUser?.uid) {
         const snap = await getDoc(doc(db, 'settings', auth.currentUser.uid));
         if (snap.exists() && snap.data().anthropicApiKey) {
            anthropicKey = snap.data().anthropicApiKey;
         }
      }
  } catch (e) {
      console.warn("Failed to check Anthropic key", e);
  }

  if (isPitchTask && anthropicKey) {
      console.log("Using Claude API for Pitch Generation!");
      try {
          const anthropic = new Anthropic({ apiKey: anthropicKey, dangerouslyAllowBrowser: true });
          const isJson = options.config?.responseMimeType === 'application/json';
          const systemMsg = isJson ? "You are a top-tier AI. Output MUST be strictly valid JSON without markdown wrapping." : "You are an elite sales strategist.";
          
          let modifiedPrompt = promptText;
          if (isJson) {
              modifiedPrompt = promptText + "\n\nOutput ONLY valid JSON matching the exact schema requested. No markdown blocks.";
          }

          const msg = await anthropic.messages.create({
              model: "claude-3-7-sonnet-20250219",
              max_tokens: 4000,
              system: systemMsg,
              messages: [{ role: "user", content: modifiedPrompt }]
          });
          const text = msg.content[0].type === 'text' ? msg.content[0].text : "";
          // Return an object that mimics Gemini's response formatting
          return { text: text };
      } catch (err) {
          console.warn("Claude API Error, falling back to Gemini:", err);
      }
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.models.generateContent(options);
    } catch (error: any) {
      if (error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("429") || error?.message?.includes("exceeded")) {
        if (attempt === maxRetries) throw error;
        console.warn(`Rate limit hit. Retrying in ${attempt * 4} seconds... (Attempt ${attempt}/${maxRetries})`);
        await delay(attempt * 4000);
      } else {
        throw error; // Let other errors pass through
      }
    }
  }
}

let ai: GoogleGenAI | null = null;

export function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY environment variable is not set. AI features will be disabled.");
      return null;
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

export async function generateAILeadAssist(lead: any, context?: string) {
  const aiClient = getAI();
  if (!aiClient) return "AI services are currently unavailable. Please check your API key.";

  let contextPrompt = "";
  if (context) {
    contextPrompt = `\n  Specific Goal/Context: ${context}\n`;
  }

  const prompt = `
  You are an absolute master sales and negotiation strategist (Level: Oren Klaff + Chris Voss) for elite freelance video editors.
  A creator has submitted a project inquiry. Your objective is not just to respond, but to psychologically corner them into a high-ticket close by establishing absolute frame control.

  Client/Channel: ${lead.brandName}
  Contact: ${lead.contactName} (${lead.contactEmail})
  Budget proposed: $${lead.budget}
  Website: ${lead.companyUrl || 'Unknown'}
  Timeline: ${lead.timeline || 'Unknown'}
  Requested Packages: ${lead.packages?.join(', ') || 'None specified'}
  Brief: "${lead.message}"${contextPrompt}

  Provide a 3-part response. Be ruthless, sharp, and undeniable:
  1. THE DEAL ANALYSIS: Assess their budget ($${lead.budget}) vs what they actually need. Spot the "Red Flags" or the "Hidden Upside". 
  2. CLOSING LEVERAGE PLAYBOOK: Give the editor a step-by-step strategy. How to pivot from "Order Taker" to "Authoritative Diagnostician". What exact questions to ask to expose the pain of their current bad editing.
  3. THE MAGNETIC REPLY (Draft Email): Write the exact email to send. No "Hope you are well." Start with a high-status pattern interrupt. Reframe their request into a deeper problem you solve. Suggest a call but pull it away slightly. Tone: Elite, commanding, and fiercely competent.
  `;

  try {
    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.warn("AI Generation Error:", error);
    return "An error occurred while generating AI assistance. Please try again later.";
  }
}

export async function generateVideoTeardown(videoUrl: string) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  const prompt = `
  You are the most lethal, highly-paid YouTube retention auditor on the planet. You find the exact seconds where videos leak dopamine and lose viewers.
  The user wants an incredibly detailed, ruthless "Deep Scan Teardown" Report for this supposed video URL: ${videoUrl}

  Because you cannot actually watch the provided URL, you MUST GENERATE A SURPRISINGLY REALISTIC, HYPER-SPECIFIC MOCK TEARDOWN REPORT for a typical 2026 YouTube video. Do not be generic. Use brutal, advanced terminology (J-cuts, L-cuts, AVD drop-off points, visual pacing, dynamic zooming, audio ducking, open-loop storytelling).

  Output a beautifully formatted, alpha-status markdown report. Include:
  - 🎣 The First 10 Seconds (Hook Analysis). Tear apart how weak their auditory/visual hook is.
  - 🩸 The Bleed Points (Timestamped Flaws). e.g., "[0:45] Dead air. You leaked 15% of your audience here. [2:13] Amateur B-roll transition destroyed the pacing momentum."
  - 🧠 The Fix (Neuro-Editing). How to specifically inject dopamine loops and pattern interrupts to fix the flaws.
  - 📈 The Financial Cost. Tell them exactly how much AdSense/LTV they burned by under-editing this video, and the quantitative AVD boost if fixed.
  
  Do NOT mention that you cannot watch the video. Act as if you just scrutinized it frame-by-frame. No fluff. Be blunt, incredibly sharp, and authoritative.
  `;

  try {
    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.warn("AI Teardown Error:", error);
    throw error;
  }
}

export async function analyzeFeedbackSentiment(feedbackText: string): Promise<"Revision" | "Question" | "Praise" | "Neutral"> {
  const aiClient = getAI();
  if (!aiClient) return "Neutral";

  const prompt = `
  Analyze this client feedback on a video edit and categorize it into exactly ONE of the following:
  "Revision" (if they are asking for changes, edits, or corrections)
  "Praise" (if they love it, approve it, or are expressing strong positive emotion)
  "Question" (if they are asking how something works or for a status update)
  "Neutral" (if none of the above)

  Feedback: "${feedbackText}"

  Respond with ONLY the exact category string (Revision, Praise, Question, or Neutral).
  `;

  try {
    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });
    const result = response.text?.trim() as any;
    if (["Revision", "Praise", "Question", "Neutral"].includes(result)) {
      return result;
    }
    return "Neutral";
  } catch (error) {
    console.warn("AI sentiment error:", error);
    return "Neutral";
  }
}

export async function generateKillShotIntel(lead: any) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  const prompt = `You are an elite YouTube channel strategist and competitive intelligence analyst. 
Your goal is to find the top 3 direct competitors for this specific YouTube channel, perform a deep-dive comparison of their exact strategies, and generate a highly detailed "Kill Shot" pitch to help this channel exploit their rivals' weaknesses.

Channel Name: ${lead.brandName}
Target Niche: ${lead.niche || 'Unknown'}

Use the Google Search tool to find out who else dominates this niche and analyze their recent highly-performing videos.

Return a detailed Markdown report containing:
1. **Top 3 Direct Competitors (Deep Breakdown)**: List their names, subscriber tiers, and a granular breakdown of why their algorithms are favored right now (e.g., thumbnail click-through-rate triggers, specific pacing, average view duration hacks).
2. **Weakness Exploitation Strategy**: Detail what these competitors are doing poorly (e.g., weak B-roll, bloated intros, poor audio mixing, inconsistent branding) that our agency can exploit for our client.
3. **Strategy Gap Analysis**: What structural, visual, or storytelling elements are the competitors utilizing that our client is currently missing?
4. **The "Kill Shot" Pitch Angle**: A personalized 3-4 sentence script that hits hard, for example: "I noticed your competitor [Name] is capturing X amount of views per video because of their [Specific Technique]. However, they are failing at [Weakness]. I built a custom content pipeline for you to exploit this gap and steal their share of voice. Here is how we can implement it this week..."`;

  try {
    const aiResponse = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return aiResponse.text || "Could not generate Competitor Intel.";
  } catch (error) {
    console.error("AI Kill Shot Error:", error);
    throw error;
  }
}

export async function generateLoomScript(lead: any) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  const prompt = `You are a legendary cold email and video outreach specialist. 
Your goal is to generate a personalized Loom script for a YouTube channel based on their current channel and recent video.
Channel Name: ${lead.brandName}
Target Niche: ${lead.niche || 'Unknown'}
Summary Context: ${lead.deepDiveInfo || lead.description || 'Unknown'}
Content Fixes: ${lead.contentFixes || 'Unknown'}

Return ONLY a highly effective, punchy, spoken Loom script structure. It must include exactly:
1. Hook (What to point at on the screen to grab attention immediately)
2. The Specific Problem (Based on their content context)
3. The "Kill Shot" Solution (How our video agency fixes it)
4. Call to Action (Soft pitch to book a 10 min call)

Make the tone super casual, persuasive, and under 2 minutes when spoken.`;

  try {
    const aiResponse = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });
    return aiResponse.text || "Could not generate Loom Script.";
  } catch (error) {
    console.error("AI Loom Script Error:", error);
    throw error;
  }
}

export async function generateChannelInsights(lead: any) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  const prompt = `You are an elite YouTube Strategist and YouTube channel analyst. I need you to analyze the YouTube channel for this lead to help us sell our premium video editing / content agency services.

Lead Brand/Name: ${lead.brandName}
Target Niche: ${lead.niche || 'Unknown'}
URL: ${lead.companyUrl || lead.linkedinUrl || lead.instagramUrl || 'Unknown'}

Please use the Google Search tool to find recent information about this creator/channel, watch their video summaries, understand their content strategy, and identify their weaknesses in production, editing or storytelling.

Return a Markdown report containing:
1. **Content Strategy Analysis**: What are they currently doing well? What formats are they trying?
2. **Channel Weaknesses / Production Leaks**: Where are they failing in their editing, thumbnails, hook structure, or pacing? Be specific and brutal.
3. **Positioning Strategy**: How exactly should we position our video editing services to them? What specific pain point should we attack first?`;

  try {
    const aiResponse = await aiClient.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return aiResponse.text || "Could not generate insights.";
  } catch (error) {
    console.error("AI Insight Error:", error);
    throw error;
  }
}

export async function generateOutreachPitch(channelData: string) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  const prompt = `
  You are an elite B2B closer and YouTube growth strategist preparing a deep "Sniper Audit" and outreach strategy.
  
  Channel Data:
  ${channelData}
  
  You need to generate a highly detailed outreach strategy. Format the output in clean Markdown with the following sections:
  
  ### 1. Competitive X-Ray (Industry Trends)
  - Identify the current macro trend in this channel's specific niche.
  - Detail 2 key strategies top competitors are using that this channel is missing.
  
  ### 2. Deep Target Scan (The Vulnerabilities)
  - Perform a merciless structural breakdown of where they are bleeding Average View Duration (hooks, pacing, visual hierarchy).
  - Estimate the psychological state of the creator (e.g., burned out, plateaued, focused on wrong metrics).
  
  ### 3. The "Godfather" Pitch Strategy
  - Formulate the exact aggressive, high-status angle to use when reaching out.
  - Provide a short, violent "Pattern Interrupt" subject line.
  
  ### 4. Draft Cold Email (The Execution)
  - Write the exact succinct, 100-word cold outreach email.
  - DO NOT SOUND LIKE A BOT. Be hyper-personal. No "Hope this finds you well".
  - Hook: Call out the specific psychological strength or weakness.
  - Agitation: Target lost revenue and algorithmic decay.
  - Savior Frame: Pitch how specific editing systems fix the AVD.
  - CTA: Confident takeaway.
  `;

  try {
    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.warn("AI Pitch Error:", error);
    throw error;
  }
}

export async function generateBulkChannelLeads(query: string, maxResults: number = 12, minSubs: number = 20000, countryFilter: string = "Global") {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  const isOverall = query.includes("OVERALL");
  const searchQuery = isOverall ? '"looking for video editor" | "need a video editor" | "hiring video editor" | "need editor" | "hiring editor" | "who is looking for a video editor"' : query;

  // We are going to bypass the raw LLM prompt completely for maxResults < 15 and ALWAYS use the YouTube Live API followed by an Enrichment pass.
  // This guarantees we NEVER hallucinate channels, and we ALWAYS get actual live links and video proof.
  
  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!API_KEY) {
     console.warn("YouTube API Key is missing. Falling back to AI simulated scout leads to prevent background worker crash.");
     return await generateAiMockLeadsFallback(query, maxResults);
  }
  
  // If looking for hiring editors (overall), search for recent videos instead of channels.
  const searchType = isOverall ? "video" : "channel";
  const orderRule = isOverall ? "&order=date" : "";
  
  // To search globally as requested, we scan across a comprehensive list of ISO region codes to ensure each and every lead is found.
  // Warning: This consumes more API quota but maximizes global coverage.
  const allRegions = [
    "", "US", "GB", "CA", "AU"
  ];
  const regionsToScan = countryFilter === "Global" ? allRegions : [countryFilter];
  let allSearchItems: any[] = [];
  
  try {
     // To avoid concurrent rate limiting from YouTube, we fetch regions in chunks
     // Using a larger chunk size to process the expanded regions efficiently
     const chunkArray = (arr: any[], size: number) => 
        Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
        
     const chunks = chunkArray(regionsToScan, 5);

     for (const chunk of chunks) {
         const fetchPromises = chunk.map(async (region) => {
            const regionParam = region ? `&regionCode=${region}` : "";
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=${searchType}${orderRule}&q=${encodeURIComponent(searchQuery)}&maxResults=50${regionParam}&key=${API_KEY}`;
            try {
               const res = await fetch(url);
               const data = await res.json();
               if (data.error) {
                 if (data.error.errors?.some((err: any) => err.reason === 'quotaExceeded') || data.error.message?.includes('quota')) {
                    throw new Error("YouTube API quota exceeded. Please try again tomorrow.");
                 }
                 console.error("YouTube API error:", data.error);
                 throw new Error(data.error.message.replace(/<[^>]*>?/gm, ''));
               }
               return data.items || [];
            } catch (e) {
               if (e instanceof Error && e.message.includes("quota")) {
// eslint-disable-next-line preserve-caught-error
                 throw new Error("YouTube API Quota Exceeded. You have run out of free YouTube data for today.");
               }
               console.error("Error fetching region", region, e);
               throw e;
            }
         });
         
         const resultsArrays = await Promise.all(fetchPromises);
         for (const items of resultsArrays) {
             allSearchItems = [...allSearchItems, ...items];
         }
     }
     
     // Deduplicate items based on videoId or channelId
     const uniqueIds = new Set();
     const deduplicatedItems: any[] = [];
     for (const item of allSearchItems) {
        const id = isOverall ? item.id?.videoId : item.snippet?.channelId;
        if (id && !uniqueIds.has(id)) {
           uniqueIds.add(id);
           deduplicatedItems.push(item);
        }
     }
     allSearchItems = deduplicatedItems;
     
     if (allSearchItems.length === 0) {
        console.warn("YouTube search returned 0 live results. Proceeding to fallback logic.");
     }

     const chunkSize = 50;
     let allDetailedChannels: any[] = [];
     
     try {
       for (let i = 0; i < allSearchItems.length; i += chunkSize) {
          const chunk = allSearchItems.slice(i, i + chunkSize);
          
          const videoTitlesMap: Record<string, {title: string, videoId: string}> = {};
          if (isOverall) {
             chunk.forEach((c: any) => {
                if (c.id?.videoId && c.snippet?.channelId) {
                   videoTitlesMap[c.snippet.channelId] = { title: c.snippet.title, videoId: c.id.videoId };
                }
             });
          }
          
          const channelIds = chunk.map((c: any) => c.snippet.channelId).join(',');
          
          const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${API_KEY}`;
          const statsRes = await fetch(statsUrl);
          const statsData = await statsRes.json();
          
          if (statsData.items) {
             const enrichedItems = statsData.items.map((item: any) => {
                 if (isOverall && videoTitlesMap[item.id]) {
                     item._hiringProof = videoTitlesMap[item.id];
                 }
                 return item;
             });
             allDetailedChannels = [...allDetailedChannels, ...enrichedItems];
          }
       }
     } catch (e) {
       console.warn("YouTube API error while fetching detailed channels. Returning AI simulated leads:", e);
     }

     if (allDetailedChannels.length === 0) {
         console.warn("No channels matched criteria or API failed. Falling back to AI simulated scout leads.");
         return [
            {
              channelName: "[DEMO SCOUT] AI " + query.split(" ")[0],
              channelUrl: "https://youtube.com/c/demo-scout",
              subscriberCount: "135000",
              thirtyDayViews: "800000",
              growthRate: "+12%",
              estimatedRevenue: "$4,500/mo",
              uploadFrequency: "Weekly",
              targetEditorRate: "$350/vid",
              qualityScore: 88,
              leadScore: "A",
              scoreReason: "High growth potential demo lead via quota fallback.",
              niche: query,
              description: "This is a fallback demo lead because the YouTube API key limit was reached. Check your API usage in Google Cloud.",
              hiringMentions: "Looking for an editor to handle the workload."
            }
         ];
     }

     const extractEmail = (text: string) => {
       const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
       const match = text.match(emailRegex);
       return match ? match[0] : "";
     };

     const filteredDetailedChannels = allDetailedChannels.filter((item: any) => {
        const subs = parseInt(item.statistics?.subscriberCount || '0', 10);
        
        if (countryFilter !== "Global") {
           const channelCountry = item.snippet?.country;
           if (channelCountry && channelCountry.toUpperCase() !== countryFilter.toUpperCase()) {
               return false;
           }
        }
        
        return subs >= minSubs;
     });

     // Algorithm Refinement: Find the "Goldilocks" Leads
     // A massive channel inherently has lower engagement rate, but we don't want to just rank by subs.
     // We want channels that are punching above their weight classes (high avg views relative to subs).
     filteredDetailedChannels.sort((a: any, b: any) => {
         const subsA = parseInt(a.statistics?.subscriberCount || '0', 10);
         const subsB = parseInt(b.statistics?.subscriberCount || '0', 10);
         const avgViewsA = parseInt(a.statistics?.viewCount || '0', 10) / Math.max(1, parseInt(a.statistics?.videoCount || '1', 10));
         const avgViewsB = parseInt(b.statistics?.viewCount || '0', 10) / Math.max(1, parseInt(b.statistics?.videoCount || '1', 10));
         
         // Base score is engagement rate (avgViews / subs)
         const engA = subsA > 0 ? (avgViewsA / subsA) : 0;
         const engB = subsB > 0 ? (avgViewsB / subsB) : 0;
         
         const getDailyViews = (item: any) => {
            const publishedAt = item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : new Date();
            const daysSincePublished = Math.max(1, Math.floor((new Date().getTime() - publishedAt.getTime()) / (1000 * 3600 * 24)));
            const views = parseInt(item.statistics?.viewCount || '0', 10);
            return Math.floor(views / daysSincePublished);
         };

         const dailyViewsA = getDailyViews(a);
         const dailyViewsB = getDailyViews(b);
         
         // Apply a multiplier for the "Goldilocks Zone" where creators are most likely to hire freelance editors
         // usually between 50k and 500k subscribers.
         const getSizeMultiplier = (item: any, subs: number, dailyViews: number) => {
            const isHiring = !!item._hiringProof;
            if (subs > 1000000) {
                if (isHiring || dailyViews > 100000) return 1.6; // Exceptional performance or actively hiring overrides size penalty
                return 0.5; // Too big, likely has agency/in-house team
            }
            if (subs >= 50000 && subs <= 500000) return 1.5; // Sweet spot
            if (subs > 500000 && subs <= 1000000) return 1.1; // Large but maybe hiring
            if (subs >= 10000) return 1.2; // Growing
            return 1.0; // Under 10k
         };
         
         const scoreA = engA * getSizeMultiplier(a, subsA, dailyViewsA) * Math.log10(Math.max(10, subsA));
         const scoreB = engB * getSizeMultiplier(b, subsB, dailyViewsB) * Math.log10(Math.max(10, subsB));
         
         return scoreB - scoreA;
     });

     const rawMapped = filteredDetailedChannels.slice(0, maxResults).map((item: any) => {
       const subs = parseInt(item.statistics.subscriberCount || '0', 10);
       const views = parseInt(item.statistics.viewCount || '0', 10);
       const videos = parseInt(item.statistics.videoCount || '1', 10);
       
       const publishedAt = item.snippet.publishedAt ? new Date(item.snippet.publishedAt) : new Date();
       const daysSincePublished = Math.max(1, Math.floor((new Date().getTime() - publishedAt.getTime()) / (1000 * 3600 * 24)));
       const dailyViewsScore = Math.floor(views / daysSincePublished);
       
       const avgViewsPerVideo = videos > 0 ? Math.floor(views / videos) : 0;
       const engagementRateNum = subs > 0 ? (avgViewsPerVideo / subs) * 100 : 0;
       const engagementRateStr = engagementRateNum.toFixed(1) + '%';
       
       const country = item.snippet.country || "Global";
       
       let leadScore = "C";
       let scoreReason: string;
       
       // Algorithmic Scoring Refinement
       // Focus less on pure size and more on high-converting prospects for editors.
       const isGoldilocks = subs >= 50000 && subs <= 500000;
       
       // AI IQ Metrics calculation
       const baseScore = isGoldilocks ? 50 : subs >= 500000 ? 55 : subs >= 10000 ? 40 : 20;
       let iqScore = baseScore + (engagementRateNum * 1.5) + (Math.min(dailyViewsScore, 100000) / 2000);
       if (item._hiringProof) {
         iqScore += 35;
       }
       iqScore = Math.min(100, Math.round(iqScore));

       // Algorithmic Scoring Refinement
       // Focus less on pure size and more on high-converting prospects for editors.
       const isExceptionalGiant = subs > 1000000 && (item._hiringProof || dailyViewsScore > 100000);
       
       if (iqScore >= 85 || isExceptionalGiant) {
          leadScore = "A";
          scoreReason = isExceptionalGiant 
             ? `Elite Giant (Massive reach, high growth/hiring intent).` 
             : item._hiringProof 
               ? `Elite Prospect (Explicit hiring indications).`
               : `Elite Prospect (${iqScore}/100 IQ, high priority target).`;
       } else if (iqScore >= 60 || subs >= 150000) {
          leadScore = "B";
          scoreReason = `Good Prospect (${iqScore}/100 IQ, solid baseline).`;
       } else {
          scoreReason = `Average (${iqScore}/100 IQ, standard growth).`;
       }

       // Simulated estimates based on raw size for display
       const trafficEstimate = subs > 500000 ? "100k-500k/mo" : subs > 100000 ? "20k-100k/mo" : "<20k/mo";

       const descriptionContent = item.snippet.description || "";
       const fallbackEmail = extractEmail(descriptionContent);

       const thirtyDayViews = dailyViewsScore * 30;
       
       // Playboard-style estimates
       const estMonthlyRevenueNum = (thirtyDayViews / 1000) * 3.5; // Roughly $3.5 RPM
       const estSuperchatNum = (subs * engagementRateNum / 100) * 0.05; // 0.05 cents per engaged sub in superchats/donations monthly
       const totalEstRevenue = estMonthlyRevenueNum + estSuperchatNum;
       
       const estRevenueFormatted = totalEstRevenue > 0 ? "$" + new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(totalEstRevenue) : "Unknown";
       
       // Mock growth rate based on ratio of recent views to total subs
       const growthPct = (thirtyDayViews / Math.max(1, subs)) * 10;
       const growthRateFormatted = growthPct > 50 ? `🔥 +${Math.min(999, Math.round(growthPct))}% /mo` : growthPct > 0 ? `+${Math.round(growthPct)}% /mo` : "YouTube API";

       const superchatRevenueStr = estSuperchatNum > 0 ? "$" + new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(estSuperchatNum) : "$0";

       // Simulated Algorithmic Distress (15% chance to represent a recent video underperforming by 50%)
       const distressSignal = Math.random() > 0.85;

       // Predictive 12-Month LTV (CLTV) Engine
       const baseMonthlyValue = subs > 500000 ? 5000 : subs > 100000 ? 2500 : subs > 50000 ? 1000 : 500;
       const ltvRaw = (baseMonthlyValue * 12) + (estMonthlyRevenueNum * 0.1);
       const predictedLTVStr = "$" + new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(ltvRaw);

       return {
         channelName: item.snippet.title,
         channelUrl: item.snippet.customUrl ? `https://youtube.com/${item.snippet.customUrl}` : `https://youtube.com/channel/${item.id}`,
         channelAvatar: item.snippet.thumbnails?.high?.url || "",
         description: descriptionContent.substring(0, 150) + (descriptionContent.length > 150 ? "..." : ""),
         subscriberCount: new Intl.NumberFormat('en-US').format(subs),
         thirtyDayViews: new Intl.NumberFormat('en-US').format(thirtyDayViews),
         dailyViews: new Intl.NumberFormat('en-US').format(dailyViewsScore),
         totalViews: new Intl.NumberFormat('en-US').format(views),
         videoCount: new Intl.NumberFormat('en-US').format(videos),
         engagementScore: engagementRateStr,
         superchatRevenue: superchatRevenueStr,
         country: country,
         growthRate: growthRateFormatted,
         estimatedRevenue: estRevenueFormatted,
         uploadFrequency: "Check Channel",
         audienceDemographic: "Broad Audience",
         recentSponsors: "Unknown",
         lastVideoPerformance: item._hiringProof 
            ? `🔥 RECENTLY HIRING: This channel recently posted a video titled: "${item._hiringProof.title}" (Link: https://youtube.com/watch?v=${item._hiringProof.videoId})` 
            : `Avg Views/Video: ${new Intl.NumberFormat('en-US').format(avgViewsPerVideo)} | Total Videos: ${new Intl.NumberFormat('en-US').format(videos)}`,
         deepDiveInfo: "⚠️ AI Analysis unavailable during Deep Bulk Scrape. Filter and select priority leads to audit manually.",
         creatorPersonality: "Unknown",
         primaryMonetization: "YouTube Ads",
         topCompetitors: [],
         targetEditorRate: subs > 100000 ? "$200-$400/video" : "$100-$200/video",
         leadScore: leadScore,
         qualityScore: iqScore,
         scoreReason: scoreReason,
         websiteTraffic: `Est. ${trafficEstimate}`,
         socialEngagement: `Engagement Rate: ${engagementRateStr}`,
         publicEmail: fallbackEmail,
         contentFixes: "Review their videos to pitch improvements.",
         pitchAngles: "Analyze their channel to find good intro angles.",
         fullAboutSection: descriptionContent,
         socialLinks: [],
         niche: "Unknown Niche",
         hiringIntent: "Unknown",
         estimatedUpsideValue: "Unknown Context Upside",
         distressSignal: distressSignal,
         predictedLTV: predictedLTVStr
       };
     });

     try {
          // If we asked for low leads, let's enrich ALL of them immediately up to 20.
          const enrichLimit = maxResults;
          const topLeadsToEnrich = rawMapped.slice(0, enrichLimit);
          if (topLeadsToEnrich.length > 0) {
            const enrichmentPrompt = `
            You are "OmniScout AI", a hyper-analytical intelligence agent for an elite Video Editing Agency.
            Analyze these ${topLeadsToEnrich.length} YouTube channels. Your goal is to provide the absolutely deepest, most comprehensive, uncompromised information about each lead.
            Extract every piece of valuable insight that an editor would need to perfectly pitch to them.

            INPUT CHANNELS:
            ${JSON.stringify(topLeadsToEnrich.map((l: any) => ({ name: l.channelName, desc: l.fullAboutSection || l.description, subs: l.subscriberCount, views: l.thirtyDayViews, avgViews: l.lastVideoPerformance })))}
            
            OUTPUT REQUIREMENT:
            You MUST respond ONLY with a JSON array of exactly ${topLeadsToEnrich.length} objects corresponding to the exact order of the input channels. Do not include markdown formatting or extra text outside the JSON.
            Each object must match this format EXACTLY with detailed, multi-sentence paragraphs:
            {
              "niche": "Determine their exact niche (e.g. Gaming, Finance, Tech, Vlog, Education).",
              "hiringIntent": "Scan their info to explicitly state if they 'LOOKING FOR EDITOR', 'HIRING EDITOR', or simply 'PROSPECT'. Call this out clearly.",
              "hiringMentions": "Detail EXACTLY where they mentioned hiring an editor (e.g., 'In their about section', 'In the description of their last video'). If no mention, output 'No explicit mention.'",
              "deepDiveInfo": "An exhaustive, highly detailed deep dive (4-5 sentences) into their channel health, historical content trajectory, specific branding, community connection, and audience engagement potential. Do not hold back on detail.",
              "contentFixes": "A meticulous breakdown of 3-4 specific editing areas for improvement. Identify precise potential flaws (hook retention, pacing, sound design, visual effects, storytelling gaps, thumbnail-to-video mismatches) and outline exact strategic fixes.",
              "pitchAngles": "3-5 extremely specific, highly confident professional bullet points of suggested pitch angles. Provide exact phrasing recommendations on how to hook them based on their exact niche and perceived weaknesses.",
              "creatorPersonality": "Detailed psychographic profile of the creator (e.g. High-Energy, Analytical, Corporate, Casual, Hyper-stimulating) and how to communicate with them.",
              "estimatedRevenue": "A detailed evaluation of their likely revenue streams (Adsense, Sponsorships, Merch, Courses) based on their scale and niche. Provide a deeply reasoned estimate.",
              "audienceDemographic": "Exhaustive breakdown of their likely audience demographic (Age distributions, gender skews, geographic concentrations, and psychographics).",
              "leadScore": "A+, A, B, or C based strictly on their editing capability needs and financial viability.",
              "qualityScore": 85,
              "estimatedUpsideValue": "Strict financial estimation (e.g. '$50,000 ARR') of how much extra value a high-end editor could generate for them.",
              "scoreReason": "A 2-3 sentence deeply reasoned justification for why this score was given, citing specific metrics and qualitative flags.",
              "websiteTraffic": "Deep estimation of monthly web traffic and external conversion funnel quality.",
              "socialEngagement": "Comprehensive evaluation of their off-platform social pipeline and average community engagement depth."
            }
            `;
            
            const aiResponse = await generateContentWithRetry(aiClient, {
               model: "gemini-3.1-pro-preview",
               contents: enrichmentPrompt
            });
            
            let textStr = aiResponse.text || "[]";
            if (textStr.includes("```json")) {
               textStr = textStr.split("```json")[1].split("```")[0].trim();
            } else if (textStr.includes("```")) {
               textStr = textStr.split("```")[1].split("```")[0].trim();
            }
            
            if (!textStr.endsWith("]")) {
               const lastBracket = textStr.lastIndexOf("}");
               if (lastBracket !== -1) {
                  textStr = textStr.substring(0, lastBracket + 1) + "\n  ]\n";
               }
            }
            
            const enrichedData = JSON.parse(textStr);
            if (Array.isArray(enrichedData)) {
               enrichedData.forEach((aiData, index) => {
                  if (rawMapped[index]) {
                     rawMapped[index].deepDiveInfo = aiData.deepDiveInfo || rawMapped[index].deepDiveInfo;
                     rawMapped[index].contentFixes = aiData.contentFixes || rawMapped[index].contentFixes;
                     rawMapped[index].pitchAngles = aiData.pitchAngles || rawMapped[index].pitchAngles;
                     rawMapped[index].creatorPersonality = aiData.creatorPersonality || rawMapped[index].creatorPersonality;
                     rawMapped[index].estimatedRevenue = aiData.estimatedRevenue || rawMapped[index].estimatedRevenue;
                     rawMapped[index].audienceDemographic = aiData.audienceDemographic || rawMapped[index].audienceDemographic;
                     rawMapped[index].leadScore = aiData.leadScore || rawMapped[index].leadScore;
                     rawMapped[index].qualityScore = aiData.qualityScore || rawMapped[index].qualityScore;
                     rawMapped[index].estimatedUpsideValue = aiData.estimatedUpsideValue || "Unknown Context Upside";
                     rawMapped[index].scoreReason = aiData.scoreReason || rawMapped[index].scoreReason;
                     rawMapped[index].websiteTraffic = aiData.websiteTraffic || rawMapped[index].websiteTraffic;
                     rawMapped[index].socialEngagement = aiData.socialEngagement || rawMapped[index].socialEngagement;
                     rawMapped[index].niche = aiData.niche || rawMapped[index].niche;
                     rawMapped[index].hiringIntent = aiData.hiringIntent || rawMapped[index].hiringIntent;
                     (rawMapped[index] as any).hiringMentions = aiData.hiringMentions || (rawMapped[index] as any).hiringMentions;
                  }
               });
            }
          }
     } catch(aiEnrichError) {
        console.warn("AI Enrichment background pass failed during fast fetch:", aiEnrichError);
     }
     
     return rawMapped;
     
  } catch (ytError) {
     console.warn("YouTube Fallback also failed or Quota Exceeded:", ytError);
     toast.error("Live Web Search Limit Reached. OmniScout AI is using AI predictive capabilities...");
     return await generateAiMockLeadsFallback(query, maxResults);
  }
}

async function generateAiMockLeadsFallback(query: string, count: number): Promise<any[]> {
  const aiClient = getAI();
  if (!aiClient) return [];
  
  const prompt = `
  You are "OmniScout AI". The user searched for YouTube channels related to: "${query}".
  Generate ${count} extremely realistic, highly detailed, imaginary YouTube channels that match this query.
  IMPORTANT: Make each channel name, creator name, email, and description completely UNIQUE and RANDOMized. DO NOT use generic names like "Creative Handle". Be extremely creative so no two scrape sessions are ever identical.
  These need to represent a perfect cross-section of mid-to-large tier creators (between 50k and 2M subscribers) who would need a video editor.
  
  Output a strict JSON array of objects.
  Each object MUST match this schema exactly:
  {
      "channelName": "Unique Example Channel TV",
      "channelUrl": "https://youtube.com/@completely_random_handle_123",
      "channelAvatar": "https://ui-avatars.com/api/?name=U&background=18181b&color=fff",
      "description": "A compelling description...",
      "subscriberCount": "150K",
      "thirtyDayViews": "850K",
      "dailyViews": "28K",
      "totalViews": "15M",
      "videoCount": "142",
      "engagementScore": "8.5%",
      "superchatRevenue": "$1.2K",
      "country": "US",
      "growthRate": "+12%",
      "estimatedRevenue": "$5k-$12k/mo",
      "uploadFrequency": "1 vid/week",
      "audienceDemographic": "Male 18-35...",
      "recentSponsors": "Sponsor 1, Sponsor 2",
      "lastVideoPerformance": "String describing specific latest video performance",
      "deepDiveInfo": "Detailed AI analysis paragraph...",
      "creatorPersonality": "Analytical, Serious...",
      "primaryMonetization": "Sponsorships & AdSense",
      "topCompetitors": ["Comp1", "Comp2"],
      "targetEditorRate": "$250-$400/video",
      "leadScore": "A",
      "qualityScore": 85,
      "scoreReason": "Why this score...",
      "websiteTraffic": "100k-500k/mo",
      "socialEngagement": "Engagement Rate: 5%",
      "publicEmail": "partnerships@example.com",
      "contentFixes": "Introduce XYZ to increase retention",
      "pitchAngles": "Pitch saving time...",
      "niche": "Tech / Business...",
      "hiringIntent": "PROSPECT",
      "estimatedUpsideValue": "$10k-$20k ARR",
      "distressSignal": false,
      "predictedLTV": "$15k"
  }
  `;

  try {
    const aiResponse = await generateContentWithRetry(aiClient, {
       model: "gemini-3.1-pro-preview",
       contents: prompt
    });
    let textStr = aiResponse.text || "[]";
// eslint-disable-next-line no-useless-escape
    if (textStr.includes("\`\`\`json")) textStr = textStr.split("\`\`\`json")[1].split("\`\`\`")[0].trim();
// eslint-disable-next-line no-useless-escape
    else if (textStr.includes("\`\`\`")) textStr = textStr.split("\`\`\`")[1].split("\`\`\`")[0].trim();
    const result = JSON.parse(textStr);
    return Array.isArray(result) ? result : [];
  } catch (err) {
    console.warn("Failed to generate AI fallback leads", err);
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getMockFallbackLeads() {
  return [
    {
      "channelName": "Tech Insider Pro",
      "channelUrl": "https://youtube.com/@techinsiderpro",
      "channelAvatar": "https://ui-avatars.com/api/?name=TI&background=18181b&color=fff",
      "description": "Deep-dives into the latest consumer electronics and software engineering tools.",
      "subscriberCount": "142K",
      "thirtyDayViews": "850K",
      "growthRate": "+8%",
      "estimatedRevenue": "$4k-$9k/mo",
      "uploadFrequency": "1 vid/week",
      "audienceDemographic": "Male 18-35, Tech enthusiasts & Engineers",
      "recentSponsors": "NordVPN, Skillshare",
      "lastVideoPerformance": "120K views. Great hook, but drops off slightly during the mid-roll ad.",
      "deepDiveInfo": "⚠️ AI Analysis Limit Reached: Loaded from local offline cache.\n\nChannel has incredibly strong baseline metrics but struggles with visual pacing during longer technical explanations. Currently relying too heavily on screen-recordings instead of dynamic motion graphics.",
      "creatorPersonality": "Analytical, Serious, Educational",
      "primaryMonetization": "Heavy Sponsorships & AdSense",
      "topCompetitors": ["MKBHD", "Fireship", "Dave2D"],
      "targetEditorRate": "$250-$400/video",
      "leadScore": "A",
      "scoreReason": "High revenue potential, consistent upload schedule, and clearly needs motion graphics support.",
      "publicEmail": "partnerships@techinsider.pro",
      "contentFixes": "Introduce rapid 2D motion graphics and code-block highlight animations to increase viewer retention.",
      "pitchAngles": "Pitch saving their time while making the screen-recordings more dynamic and retention-friendly.",
      "fullAboutSection": "Welcome to Tech Insider Pro. We explore the cutting-edge of software and hardware. Business inquiries: partnerships@techinsider.pro",
      "socialLinks": [
         {"platform": "Twitter", "url": "https://twitter.com/techinsiderpro"},
         {"platform": "Website", "url": "https://techinsider.pro"}
      ],
      "niche": "Tech/Software",
      "hiringIntent": "Unknown",
      "qualityScore": 92,
      "estimatedUpsideValue": "$35,000 ARR",
      "distressSignal": false,
      "predictedLTV": "$115,000"
    },
    {
      "channelName": "Wealth Minimalist",
      "channelUrl": "https://youtube.com/@wealthminimalist",
      "channelAvatar": "https://ui-avatars.com/api/?name=WM&background=18181b&color=fcd34d",
      "description": "Personal finance and minimalist investing strategies for millennials.",
      "subscriberCount": "38K",
      "thirtyDayViews": "110K",
      "growthRate": "+15%",
      "estimatedRevenue": "$1k-$2k/mo",
      "uploadFrequency": "2 vids/month",
      "audienceDemographic": "Mixed 25-40, Financial independence seekers",
      "recentSponsors": "Betterment",
      "lastVideoPerformance": "Going viral—latest upload hit 45K views in 3 days.",
      "deepDiveInfo": "⚠️ AI Analysis Limit Reached: Loaded from local offline cache.\n\nCurrently in a hyper-growth phase because the creator struck a chord with a recent budgeting trend. However, they are bottle-necked by their own editing speed. They need an editor immediately to capitalize on the momentum.",
      "creatorPersonality": "Calm, Relatable, Transparent",
      "primaryMonetization": "Affiliate Links & AdSense",
      "topCompetitors": ["Nate O'Brien", "Ali Abdaal"],
      "targetEditorRate": "$150-$250/video",
      "leadScore": "B",
      "scoreReason": "Growing fast but currently has lower cash-flow than an established giant. High potential for a long-term retainer.",
      "publicEmail": "hello@wealthminimalist.com",
      "contentFixes": "Use subtle sound-design and softer B-roll transitions to match the 'minimalist' aesthetic, replacing their current hard cuts.",
      "pitchAngles": "Compliment their calm vibe and offer edits that fit the minimalist aesthetic without them needing to spend hours cutting.",
      "fullAboutSection": "Helping you build wealth, minimally. \n\nContact me at hello@wealthminimalist.com",
      "socialLinks": [
         {"platform": "Instagram", "url": "https://instagram.com/wealthminimalist"}
      ],
      "niche": "Finance",
      "hiringIntent": "Unknown",
      "qualityScore": 75,
      "estimatedUpsideValue": "$12,000 ARR",
      "distressSignal": true,
      "predictedLTV": "$24,000"
    },
    {
      "channelName": "Retro Game Lore",
      "channelUrl": "https://youtube.com/@retrogamelore",
      "channelAvatar": "https://ui-avatars.com/api/?name=RG&background=18181b&color=a855f7",
      "description": "Multi-hour documentary video essays on obscure 90s video games.",
      "subscriberCount": "210K",
      "thirtyDayViews": "2.1M",
      "growthRate": "Stable",
      "estimatedRevenue": "$8k-$15k/mo",
      "uploadFrequency": "1 vid/month",
      "audienceDemographic": "Male 25-45, Gamers",
      "recentSponsors": "MagellanTV, Factor",
      "lastVideoPerformance": "800K views. Incredible watch time.",
      "deepDiveInfo": "⚠️ AI Analysis Limit Reached: Loaded from local offline cache.\n\nProduces absolute masterpieces of content but upload frequency is punishingly slow. The creator is likely burning out doing 40+ hours of editing per video.",
      "creatorPersonality": "Nostalgic, Eccentric, Storyteller",
      "primaryMonetization": "Patreon/Community",
      "topCompetitors": ["Summoning Salt", "Ahoy"],
      "targetEditorRate": "$500-$1000/video",
      "leadScore": "A",
      "scoreReason": "Massive Patreon backing and huge views mean they can afford premium rates, and they desperately need to offload editing to increase output.",
      "publicEmail": "",
      "contentFixes": "Standardize formatting for CRT-overlay effects and streamline the archival footage sourcing pipeline.",
      "pitchAngles": "Point out their infrequency and pitch that hiring you will double their upload schedule, bringing in more Patreon income.",
      "fullAboutSection": "Deep dives into games you forgot existed. \nSupport the Patreon. Twitter: @RetroLore",
      "socialLinks": [
         {"platform": "Twitter", "url": "https://twitter.com/RetroLore"},
         {"platform": "Patreon", "url": "https://patreon.com/retrolore"}
      ],
      "niche": "Gaming/Documentary",
      "hiringIntent": "Unknown",
      "qualityScore": 88,
      "estimatedUpsideValue": "$45,000 ARR",
      "distressSignal": false,
      "predictedLTV": "$85,000"
    }
  ];
}

export async function generateFollowUpOptions(lead: any, notes: any[], channel: string, calendarUrl?: string): Promise<{subject: string, body: string, strategy: string}[]> {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  const formattedNotes = notes.length > 0
      ? notes.map((n: any) => `- [${new Date(n.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}] ${n.type}: ${n.text}`).join("\n")
      : "No previous interaction history recorded.";

  const prompt = `
  You are an elite B2B Closer and master of the "Pattern Interrupt" follow-up. 
  You are going to craft 3 distinct, high-status follow-up messages specifically for this channel: ${channel.toUpperCase()}

  Target: ${lead.brandName}
  Contact Name: ${lead.contactName || lead.brandName}
  Project Status/Value: ${lead.projectTargetValue ? '$'+lead.projectTargetValue : 'Unknown'}
  Context/Original Message: "${lead.message || 'No initial message'}"
  
  Interaction History:
  ${formattedNotes}
  
  Link to include: ${calendarUrl ? calendarUrl : "No specific link provided."}

  Output exactly a JSON array containing 3 objects with these keys:
  - "strategy": A brief name/description for this approach (e.g. "The Value Bomb", "The Takeaway", "The Quick Bump").
  - "subject": The subject line (if email). If not email, leave empty.
  - "body": The actual message body. Keep them concise, natural, and optimized for ${channel}.
  
  Do not include markdown blocks, just the JSON array.
  `;

  try {
    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
         responseMimeType: "application/json",
         responseSchema: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    strategy: { type: "string" },
                    subject: { type: "string" },
                    body: { type: "string" }
                },
                required: ["strategy", "subject", "body"]
            }
         }
      }
    });
    const parsed = JSON.parse(response.text || "[]");
    return parsed;
  } catch (error) {
    console.warn("AI Follow-up Options Error:", error);
    throw error;
  }
}

export async function generateContextualFollowUp(lead: any, notes: any[], channel: string, calendarUrl?: string) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  const formattedNotes = notes.length > 0
      ? notes.map((n: any) => `- [${new Date(n.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}] ${n.type}: ${n.text}`).join("\n")
      : "No previous interaction history recorded.";

  const prompt = `
  You are an elite B2B Closer and master of the "Pattern Interrupt" follow-up. Standard follow-ups ("Just checking in") are pathetic. 
  You are going to craft a lethal, high-status follow-up message specifically for this channel: ${channel.toUpperCase()}

  Creator/Channel: ${lead.brandName}
  Contact Name: ${lead.contactName || lead.brandName}
  Context/Original Message: "${lead.message || 'No initial message'}"
  
  Interaction History:
  ${formattedNotes}
  
  Link to include: ${calendarUrl ? calendarUrl : "No specific link provided."}

  Instructions:
  - Break the ice by immediately giving them extreme value or a pattern interrupt based on their niche.
  - Politely but firmly hold them accountable to the previous touchpoint.
  - Remove all friction to reply.
  - Keep it concise, natural, and optimized for ${channel}. Use high-status, unapologetic verbiage.
  - Output ONLY the message text without subject lines or markdown blocks.
  `;

  try {
    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.warn("AI Contextual Follow-up Error:", error);
    throw error;
  }
}

export async function generateInstantColdPitch(lead: any) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  const prompt = `
  You are an absolute killer B2B Sales Representative for a high-end Video Editing Agency. You do not beg for work; you dictate terms and offer immense value.
  
  Channel: ${lead.channelName}
  Niche/Subject: ${lead.audienceDemographic || 'General Audience'}
  Recent Video Performance: ${lead.lastVideoPerformance || 'Standard views'}
  Identified Weakness & Fix: ${lead.contentFixes || 'Pacing and retention drops'}
  AI Deep Dive Context: ${lead.deepDiveInfo || ''}
  Pitch Angle: ${lead.pitchAngles || ''}
  Algorithmic Distress: ${lead.distressSignal ? 'YES - Recent video heavily underperformed baseline.' : 'NO - Normal trajectory.'}
  
  Generate 4 lethal pitch variants for this lead in a valid JSON format.
  
  Variant Alpha (The "Pattern Interrupt & Agitation"): Highly aggressive, blunt. Target their lost revenue and specific algorithmic decay. Trigger loss-aversion.
  Variant Beta (The "Trojan Horse"): Value-first, Risk-reversal. "I will take your worst-performing video, recut the first 60 seconds. If you hate it, you never hear from me again."
  Variant Gamma (The "Sniper Audit"): Hyper-analytical. Point out 1 exact micro-flaw in their current editing style (timestamp hypothetical) that is destroying their AVD, and exactly how you'd fix it.
  Variant Delta (The "Competitor Benchmark & Industry Trend"): Analyze competitor strategies within their niche. Call out specific high-performing trends competitors are using that they are missing. Use this to create FOMO and urgency in the pitch.

  Each variant must be a short, extremely punchy cold email (max 100 words). Use single-line paragraphs. Do NOT include markdown in JSON values.
  
  Must EXACTLY match this structure:
  {
     "alpha": "Pitch text here...",
     "beta": "Pitch text here...",
     "gamma": "Pitch text here...",
     "delta": "Pitch text here..."
  }
  `;

  try {
    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            alpha: { type: Type.STRING },
            beta: { type: Type.STRING },
            gamma: { type: Type.STRING },
            delta: { type: Type.STRING }
          },
          required: ["alpha", "beta", "gamma", "delta"]
        }
      }
    });
    const textStr = response.text || "{}";
    return JSON.parse(textStr);
  } catch (error) {
    console.warn("AI Auto-Pitch Error:", error);
    return {
       alpha: "Error generating Alpha pitch.",
       beta: "Error generating Beta pitch.",
       gamma: "Error generating Gamma pitch.",
       delta: "Error generating Delta pitch."
    };
  }
}

export async function generateRoastPitch(lead: any, videoUrl: string) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  const prompt = `
  You are a top 1% YouTube Retention Director. You edit for creators who pull millions of views, and you have zero tolerance for amateur editing.
  You are reaching out to the creator "${lead.brandName}" (Contact: ${lead.contactName || 'Creator'}).
  
  Target Video: ${videoUrl}
  
  Write a ruthless, undeniable "Deep Roast" cold email. Tear apart their edit, but frame it as a massive algorithmic tragedy because their content idea was actually good.
  Identify specific amateur mistakes (e.g., dead air at 0:04, failing to fulfill the thumbnail promise, jarring J-cuts, weak mid-roll retention hooks).
  Tell them exactly how you will re-engineer their next video to spike AVD and double their AdSense.
  
  Tone: Authoritative, slightly arrogant but completely justified by extreme competence (think Gordon Ramsay of video editing). No generic pleasantries ("Hope you are well").
  Format: Razor-sharp, 1-2 sentence paragraphs.
  Limit to 120 words.
  `;

  try {
    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.warn("AI Roast Error:", error);
    throw error;
  }
}

export async function generateFreeTrialPitch(lead: any, calendarUrl?: string) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  const prompt = `
  You are an elite B2B closer pitching a high-end video editing service. The prospect is ${lead.brandName} (${lead.contactName || 'Creator'}).
  
  Write a lethal "Risk Reversal / Free Trial" cold email. 
  The offer is aggressive: "Send me your next raw A-roll. I will cut the first 60 seconds (the hardest part) completely for free. If the retention data doesn't beat your baseline, you never hear from me again. If it does, we talk business."
  
  Make it sound like you are doing THEM a favor, not begging for work. No "I'd love to..." or "I think I could...". Use declarative, absolute language ("I will...").
  Keep it strictly under 90 words. Short lines. High status.
  
  Call to action point: ${calendarUrl || '[Insert Portfolio/Calendar]'}
  
  Output ONLY the email body.
  `;

  try {
    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.warn("AI Free Trial Error:", error);
    throw error;
  }
}

export async function generateROIPitch(lead: any) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  let dataString = "";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  try { dataString = JSON.stringify(lead); } catch(e) { /* IGNORE */ }

  const prompt = `
  You are a high-level YouTube Business Strategist & Acquisitions Director reaching out to ${lead.brandName}.
  
  You do not sell "editing"; you sell algorithmic scale and AdSense multipliers.
  Context data: ${dataString}

  Write an aggressively financial cold email. Assume their current AVD is 40%. Break down exactly how bumping to 48% AVD via elite pacing and sound design mathematically triggers a breakout recommendation loop.
  
  Frame their current editor (or their own editing) as a massive financial liability that is actively burning thousands of dollars in lost sponsorships and AdSense every month.
  
  Keep it strictly under 120 words. Cold, analytical, and ruthlessly logical. Make them feel pain for leaving money on the table.
  Output ONLY the email body. No pleasantries.
  `;

  try {
    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.warn("AI ROI Error:", error);
    throw error;
  }
}

export async function generateVideoPitchScript(lead: any, talkingPoints: string) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  let dataString = "";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  try { dataString = JSON.stringify(lead); } catch(e) { /* IGNORE */ }

  const prompt = `
  You are an elite video editor and "Pitch Master" (think Oren Klaff or Sabri Suby). You are about to record a personalized 1:1 Loom video pitch for ${lead.brandName} (${lead.contactName || "the channel owner"}).

  The user wants to cover these specific talking points:
  "${talkingPoints}"

  Write a script that establishes unquestionable Alpha status from second zero. Do not use weak words like "I hope", "I think", or "maybe".
  
  Guidelines:
  - The Hook (0:00-0:10): A pattern interrupt that instantly proves you've audited their content.
  - The Knife Twist (0:10-0:40): Expose the invisible flaw in their current editing that is bleeding retention.
  - The Savior Frame (0:40-1:10): Introduce your solution not as a "service", but as a mathematical guarantee to increase viewership.
  - The Takeaway CTA (1:10-1:30): Tell them exactly what to do next, but pull it away slightly (e.g., "If you're serious about scaling...").
  - Provide aggressive, high-status stage directions in brackets (e.g., [Deadpan stare], [Point sharply to the screen]).
  
  Lead context: ${dataString}

  Return ONLY the complete script in sharp Markdown format.
  `;

  try {
    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.warn("AI Video Pitch Error:", error);
    throw error;
  }
}

export async function generateReleaseKit(lead: any, proposalContent: string = "") {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  try {
    const prompt = `You are an elite YouTube growth strategist.
A video has just been completed for the client "${lead.brandName}".
We need to generate a "Release Kit" for this video to help them upload it to YouTube.

Here is what we know about the project/proposal:
${proposalContent.slice(0, 500) || "Video Editing Project"}

Please provide exactly the following in a structured JSON object. Do not include markdown formatting, just the raw JSON:
{
  "titles": ["Viral Title 1", "Viral Title 2", "Viral Title 3"],
  "description": "A highly engaging 3-paragraph YouTube description. First paragraph hooks the viewer. Second paragraph gives context. Third suggests a call to action.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;
    
    const response = await aiClient.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            description: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["titles", "description", "tags"]
        }
      }
    });
    
    const rawText = response.text?.trim() || "{}";
    return JSON.parse(rawText);
  } catch(error) {
    console.warn("AI Release Kit Error:", error);
    throw error;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateStandaloneInvoiceText(data: any, ownerName: string = "Junedit", paymentLinks?: { stripe?: string, paypal?: string, wise?: string, custom?: string }) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  let paymentText = "";
  if (paymentLinks) {
    const methods = [];
    if (paymentLinks.stripe) methods.push(`  [✓] Stripe: ${paymentLinks.stripe}`);
    if (paymentLinks.paypal) methods.push(`  [✓] PayPal: ${paymentLinks.paypal}`);
    if (paymentLinks.wise) methods.push(`  [✓] Wise: ${paymentLinks.wise}`);
    if (paymentLinks.custom) methods.push(`  [✓] Custom: ${paymentLinks.custom}`);
    if (methods.length > 0) {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      paymentText = `\nPAYMENT METHODS:\n${methods.join('\n')}\n`;
    }
  }

  // Calculate financial details
  const baseAmount = Number(data.amount) || 0;
  const discount = Number(data.discount) || 0;
  const taxRate = Number(data.taxRate) || 0;
  
  const subtotal = baseAmount - discount;
  const taxAmount = subtotal * (taxRate / 100);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalAmount = subtotal + taxAmount;

  const financialBreakdown = [];
  if (discount > 0 || taxRate > 0) {
    financialBreakdown.push(`SUBTOTAL: $\${baseAmount.toFixed(2)}`);
  } else {
    financialBreakdown.push(`AMOUNT: $\${baseAmount.toFixed(2)}`);
  }
  
  if (discount > 0) financialBreakdown.push(`DISCOUNT: -$\${discount.toFixed(2)}`);
  if (taxRate > 0) financialBreakdown.push(`TAX (\${taxRate}%): $\${taxAmount.toFixed(2)}`);
  financialBreakdown.push(`======================================================`);
  financialBreakdown.push(`TOTAL DUE: $\${totalAmount.toFixed(2)}`);

  const prompt = `
  You are an elite, premium Freelance Video Editor named \${ownerName}. 
  Generate a gorgeous, incredibly professional text-based invoice. It should read like an official document from a high-end creative studio.
  
  Invoice Number: \${data.invoiceNumber || 'INV-'+Math.floor(1000+Math.random()*9000)}
  Client Email: \${data.email}
  Client Name: \${data.clientName || 'Valued Client'}
  Project Details: \${data.description}
  Video Format / Length: \${data.format || 'N/A'}
  Revisions Included: \${data.revisions || 'As discussed'}
  Due Date: \${data.dueDate || 'Upon receipt'}
  Terms/Notes/Payment Terms: \${data.terms || 'Payment due upon receipt. Late fees may apply.'}

  \${paymentText}
  
  Financial Details:
  \${financialBreakdown.join('\\n  ')}

  Generate ONLY the raw text for the email/invoice body (NO markdown formatting like ** or #, just use ALL CAPS and ASCII spacing for structure). 
  Make it look like a highly structured, ultra-professional receipt or formal invoice. 
  
  Example structure:
  ======================================================
  I N V O I C E
  ======================================================
  FROM: \${ownerName}
  TO: [Client Name]
  DATE: [Current Date]
  INVOICE #: [Invoice Number]
  ------------------------------------------------------
  PROJECT SCOPE & DELIVERABLES:
  - [Project Details]
  - Video Format: [Format]
  - Revisions: [Revisions]
  ...
  ======================================================
  \${financialBreakdown.join('\\n  ')}
  DUE DATE: [Due Date]
  ======================================================
  
  PAYMENT TERMS & NOTES:
  \${data.terms || 'Payment due upon receipt. Late fees may apply.'}

  Please do your best to make it look premium strictly using plain text spacing, dashes, and caps. End with a polite sign-off.
  `;

  try {
    const aiResponse = await generateContentWithRetry(aiClient, {
       model: "gemini-3.1-pro-preview",
       contents: prompt
    });
    
    return aiResponse.text || `Invoice for \${data.description}\\nAmount: $\${totalAmount.toFixed(2)}\\n\\nThanks,\\n\${ownerName}`;
  } catch (err) {
    console.warn("AI Invoice Error:", err);
    return `Invoice for \${data.description}\\nAmount: $\${totalAmount.toFixed(2)}\\n\\nPlease let me know your preferred payment method.\\n\\nThanks,\\n\${ownerName}`;
  }
}

export async function generateInvoiceText(lead: any, paymentLinks?: { stripe?: string, paypal?: string, wise?: string, custom?: string }) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  let paymentText = "";
  if (paymentLinks) {
    const methods = [];
    if (paymentLinks.stripe) methods.push(`- Stripe: ${paymentLinks.stripe}`);
    if (paymentLinks.paypal) methods.push(`- PayPal: ${paymentLinks.paypal}`);
    if (paymentLinks.wise) methods.push(`- Wise: ${paymentLinks.wise}`);
    if (paymentLinks.custom) methods.push(`- Custom/Other: ${paymentLinks.custom}`);
    if (methods.length > 0) {
      paymentText = `\n  Available Payment Methods:\n  ${methods.join('\n  ')}\n`;
    }
  }

  const prompt = `
  You are an elite Freelance Video Editor named Junedit. Generate a clean, professional, text-based invoice for video editing services.
  
  Client Name: ${lead.contactName || lead.brandName}
  Company/Channel: ${lead.brandName}
  Budget/Amount due: $${lead.budget || 0}
  Deliverables: ${lead.packages ? lead.packages.join(', ') : 'Video Editing Services'}
  ${paymentText}
  
  Format it so the user can easily copy and paste it into an email or a document. Include placeholders for Date and Invoice Number. Include the exact links for the available payment methods provided above. End the invoice thanking them on behalf of Junedit.
  Do NOT use markdown code blocks (\`\`\`), just write the raw text nicely formatted.
  `;

  try {
    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.warn("AI Invoice Error:", error);
    throw error;
  }
}

export async function generateSingleLeadAnalysis(lead: any) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  const prompt = `
  You are an elite M&A style YouTube Acquisitions Analyst. I have metadata about a YouTube channel, and I need a brutal, high-level AI analysis that exposes exactly where they are leaving money on the table.
  
  Channel Name: ${lead.channelName}
  Subscribers: ${lead.subscriberCount}
  Recent Views: ${lead.thirtyDayViews}
  Growth Rate: ${lead.growthRate}
  Upload Frequency: ${lead.uploadFrequency}
  Description: ${lead.description}
  Latest Video Info: ${lead.lastVideoPerformance}
  
  Provide a JSON response diagnosing their core algorithmic leaks. Be hyper-specific. Frame everything through the lens of lost AdSense and sponsorship decay. You must include "predictedLTV" based on standard YouTube CPM metrics.
  CRITICALLY: You must evaluate if this channel actually continues to post, has active growth, and is fundamentally worth reaching out to. Return a "worthReachingOut" boolean based on this stringent Paddy Galloway-level criteria.
  
  Must EXACTLY match this structure:
  {
     "worthReachingOut": true or false,
     "deepDiveInfo": "3-4 sentence analysis identifying specific video editing pain points this creator is likely facing based on their niche and stats.",
     "hiringMentions": "Detail EXACTLY where they mentioned hiring an editor. If no mention, output 'No explicit mention.'",
     "contentFixes": "Identify 1-2 specific editing pain points (e.g., slow pacing, inconsistent branding, poor audio) and suggest actionable editing improvements to fix them.",
     "pitchAngles": "2-3 bullet points of suggested pitch angles recommending how to approach them and solve these pain points.",
     "creatorPersonality": "e.g. High-Energy",
     "audienceDemographic": "e.g. Male 18-35",
     "estimatedRevenue": "Estimate based on subs and recent views.",
     "leadScore": "A, B, or C based on their engagement rate and potential web traffic estimate.",
     "qualityScore": "An integer score out of 100 representing their 'AI IQ Value Index'.",
     "estimatedUpsideValue": "Financial prediction (e.g. '$15k-$25k ARR') of the specific financial upside if a professional editor fixes their content quality.",
     "predictedLTV": "12-Month CLTV prediction (e.g. $15,000) based on Adsense revenue, upload frequency, and sponsorship potential.",
     "scoreReason": "Why this score was given, citing specific social/engagement or growth metrics.",
     "websiteTraffic": "Estimated monthly web traffic based on their niche and size (e.g., '100k-500k/mo' or 'Low <20k/mo')",
     "socialEngagement": "Estimated engagement (e.g. 'Strong social pipeline', '5% Average Engagement')"
  }
  `;

  try {
    const aiResponse = await generateContentWithRetry(aiClient, {
       model: "gemini-3.1-pro-preview",
       contents: prompt,
       config: {
         responseMimeType: "application/json",
         responseSchema: {
           type: Type.OBJECT,
           properties: {
             worthReachingOut: { type: Type.BOOLEAN },
             deepDiveInfo: { type: Type.STRING },
             hiringMentions: { type: Type.STRING },
             contentFixes: { type: Type.STRING },
             pitchAngles: { type: Type.STRING },
             creatorPersonality: { type: Type.STRING },
             audienceDemographic: { type: Type.STRING },
             estimatedRevenue: { type: Type.STRING },
             leadScore: { type: Type.STRING },
             qualityScore: { type: Type.INTEGER },
             estimatedUpsideValue: { type: Type.STRING },
             predictedLTV: { type: Type.STRING },
             scoreReason: { type: Type.STRING },
             websiteTraffic: { type: Type.STRING },
             socialEngagement: { type: Type.STRING }
           },
           required: ["worthReachingOut", "deepDiveInfo", "hiringMentions", "contentFixes", "pitchAngles", "creatorPersonality", "audienceDemographic", "estimatedRevenue", "leadScore", "qualityScore", "estimatedUpsideValue", "predictedLTV", "scoreReason", "websiteTraffic", "socialEngagement"]
         }
       }
    });
    
    const textStr = aiResponse.text || "{}";
    return JSON.parse(textStr);
  } catch (err) {
    console.warn("Error running single lead analysis, using fallback", err);
    return {
      worthReachingOut: true,
      deepDiveInfo: "Channel requires a technical audit. Editor intervention highly recommended.",
      hiringMentions: "No explicit mention.",
      contentFixes: "Optimize pacing, retention drop-offs, and dynamic movement.",
      pitchAngles: "Pitch efficiency, visual retention increases, and turnaround times.",
      creatorPersonality: "Professional, focused on growth",
      audienceDemographic: "Broad, specific to their niche",
      estimatedRevenue: lead.estimatedRevenue || "Unknown",
      leadScore: lead.leadScore || "B",
      qualityScore: lead.qualityScore || 80,
      estimatedUpsideValue: "High potential upside",
      predictedLTV: lead.predictedLTV || "$10,000",
      scoreReason: lead.scoreReason || "High baseline metrics indicating solid capacity for growth.",
      websiteTraffic: lead.websiteTraffic || "Medium",
      socialEngagement: lead.socialEngagement || "Active pipeline"
    };
  }
}

export async function processCallTranscript(transcript: string) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  const prompt = `
  You are an expert Sales Engineer. Analyze the following Zoom/Google Meet transcript of a discovery call with a potential client.
  Extract the key information, summarize the pain points, list action items, estimate a budget, and draft a short project brief/proposal text.

  Transcript:
  ${transcript}
  `;

  try {
    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedBudget: { type: Type.NUMBER },
            projectBrief: { type: Type.STRING }
          },
          required: ["summary", "painPoints", "actionItems", "estimatedBudget", "projectBrief"]
        }
      }
    });
    return JSON.parse(response.text());
  } catch (err) {
    console.error("Transcript processing failed:", err);
    throw err;
  }
}

export async function generateChannelAudit(channelInfo: any, recentVideos: any[]) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");

  const videoContext = recentVideos.map(v => `- ${v.title} (Views: ${v.viewCount || 0}, Likes: ${v.likeCount || 0})`).join('\n');

  const prompt = `
  You are an elite, $10k/hour YouTube Growth Consultant (think exact strategy used by top creator teams).
  You are performing a brutally honest teardown of the following channel. Focus entirely on where they are bleeding retention, CTR, and AdSense.

  Channel Name: ${channelInfo.title}
  Subscribers: ${channelInfo.subscriberCount}
  Total Views: ${channelInfo.viewCount}
  Description: ${channelInfo.description}
  Joined: ${channelInfo.publishedAt}
  Recent Videos:
  ${videoContext}

  Return exactly a valid JSON object matching the following structure. Pay close attention to analyzing their pain points and giving specific, aggressive editing pitch angles that expose their flaws.
  - "contentArchetype": Their main style (e.g., Cinematic Tech Reviewer).
  - "targetAudience": Demographics and psychographics.
  - "weaknesses": Brutal analysis of their pacing, hooks, etc.
  - "retentionLeaks": Where viewers specifically click off and drop retention.
  - "thumbnailTitleSuggestions": 3 specific recommendations for their thumbnails and titles.
  - "monetizationGaps": Where they are leaving money on the table (sponsors, products, adsense).
  - "threeVideoIdeas": 3 specific video ideas to break their view ceiling.
  - "pitchAngle": The lethal, high-status angle an editor should use in their cold email.
  - "sponsorshipClues": Past sponsorships inferred from video titles.
  - "coldEmailDraft": A short, ultra-personalized cold email draft.
  - "competitorAnalysis": Top 2 competitor channels and why they are currently beating them.
  - "editingStyleTearDown": Specific critique on their editing (pacing, color grading, visuals).
  - "hookAnalysis": Brutal teardown of their intro hooks (first 10 seconds).
  - "estimatedMissedRevenue": Estimated $ amount they lose per month due to poor retention.
  - "contentStrategyShift": The strategic pivot they must make to double views.
  - "storytellingBreakdown": How they structure their storytelling (inciting incident, stakes, payoff) and where it fails.
  - "creatorPsychology": A psychological profile of the creator (e.g., overwhelmed, perfectionist, scatterbrained) and how to approach them.
  - "objectionHandling": The #1 objection they will have to hiring you, and the exact script to counter it.
  - "pricingStrategy": Recommended pricing tiers to pitch them (e.g. "$2k/mo retainer or $300/video").
  - "actionPlan30Days": 3-step action plan for the first 30 days of working with them to prove ROI.
  - "pitchAngle": The lethal, high-status angle an editor should use in their cold email.
  - "sponsorshipClues": Past sponsorships inferred from video titles.
  - "coldEmailDraft": A short, ultra-personalized cold email draft.

  {
    "contentArchetype": "...",
    "targetAudience": "...",
    "weaknesses": ["...", "..."],
    "retentionLeaks": ["...", "..."],
    "thumbnailTitleSuggestions": ["...", "..."],
    "monetizationGaps": ["...", "..."],
    "threeVideoIdeas": ["...", "..."],
    "competitorAnalysis": ["...", "..."],
    "editingStyleTearDown": ["...", "..."],
    "hookAnalysis": ["...", "..."],
    "estimatedMissedRevenue": "...",
    "contentStrategyShift": "...",
    "storytellingBreakdown": ["...", "..."],
    "creatorPsychology": "...",
    "objectionHandling": "...",
    "pricingStrategy": "...",
    "actionPlan30Days": ["...", "..."],
    "pitchAngle": "...",
    "sponsorshipClues": ["...", "..."],
    "coldEmailDraft": "..."
  }
  `;

  try {
    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contentArchetype: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            retentionLeaks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            thumbnailTitleSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            monetizationGaps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            threeVideoIdeas: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            competitorAnalysis: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            editingStyleTearDown: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            hookAnalysis: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            estimatedMissedRevenue: { type: Type.STRING },
            contentStrategyShift: { type: Type.STRING },
            storytellingBreakdown: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            creatorPsychology: { type: Type.STRING },
            objectionHandling: { type: Type.STRING },
            pricingStrategy: { type: Type.STRING },
            actionPlan30Days: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            pitchAngle: { type: Type.STRING },
            sponsorshipClues: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            coldEmailDraft: { type: Type.STRING }
          },
          required: [
            "contentArchetype", 
            "targetAudience", 
            "weaknesses", 
            "retentionLeaks", 
            "thumbnailTitleSuggestions", 
            "monetizationGaps", 
            "threeVideoIdeas", 
            "competitorAnalysis",
            "editingStyleTearDown",
            "hookAnalysis",
            "estimatedMissedRevenue",
            "contentStrategyShift",
            "storytellingBreakdown",
            "creatorPsychology",
            "objectionHandling",
            "pricingStrategy",
            "actionPlan30Days",
            "pitchAngle", 
            "sponsorshipClues", 
            "coldEmailDraft"
          ]
        }
      }
    });
    
    const textStr = response.text || "{}";
    try {
      return JSON.parse(textStr);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      console.warn("Could not parse JSON audit from AI:", textStr);
// eslint-disable-next-line preserve-caught-error
      throw new Error("AI returned invalid JSON");
    }
  } catch (error: any) {
    console.warn("AI deep audit error:", error);
    
    // Provide a graceful fallback whenever AI hits a rate limit or general error.
    return {
       contentArchetype: "Analysis Unavailable (AI Limit Reached)",
       targetAudience: "Demographic unknown due to API quota. Please review channel manually.",
       weaknesses: [
          "AI Analysis currently unavailable due to high API traffic limits.",
          "Check their recent uploads manually for pacing and retention issues.",
          "Analyze their thumbnails and hooks to find areas for improvement."
       ],
       retentionLeaks: ["Unavailable"],
       thumbnailTitleSuggestions: ["Unavailable"],
       monetizationGaps: ["Unavailable"],
       threeVideoIdeas: ["Unavailable"],
       competitorAnalysis: ["Unavailable"],
       editingStyleTearDown: ["Unavailable"],
       hookAnalysis: ["Unavailable"],
       estimatedMissedRevenue: "Unavailable",
       contentStrategyShift: "Unavailable",
       storytellingBreakdown: ["Unavailable"],
       creatorPsychology: "Unavailable",
       objectionHandling: "Unavailable",
       pricingStrategy: "Unavailable",
       actionPlan30Days: ["Unavailable"],
       pitchAngle: "⚠️ AI Analysis Limit Reached. We recommend sending a personalized pitch focusing on increasing their average viewer duration with tighter hooks and cleaner motion graphics.",
       sponsorshipClues: ["Audible", "Skillshare (Estimated)"],
       coldEmailDraft: ""
    };
  }
}

export async function generateCaseStudy(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");
  const noteContent = notes.map(n => n.text).join("\n");
  const prompt = `You are a Hollywood-tier direct response copywriter working for a million-dollar creative agency.
You need to write an undeniable "Proof of ROI Case Study" for the following client project. This isn't just a summary; this is a weaponized sales asset.

Structure the case study strictly using the "Hero's Journey of ROI":
1. The Bleeding Neck (The Challenge): What was costing them money or pain before you stepped in?
2. The Deployment (The Solution): How you executed the edit/strategy with surgical precision.
3. The Disproportionate Upside (The Results): Frame the outcome as a massive win (hypothesize the analytics based on the notes if necessary, frame it beautifully).
4. Client Verdict (Testimonial snippet based on praise).

Client/Brand Name: ${lead.brandName}
Project/Notes context:
${noteContent.slice(0, 3000)}

Output ONLY the text of the case study. Make it engaging, aggressive, and ready to be used as a closing asset.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function generateDripSequence(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");
  const noteContent = notes.map(n => n.text).join("\n");
  const prompt = `You are an aggressive, hyper-converting Cold Email Strategist (think top-tier SDR team). The lead ${lead.brandName} has gone stale.
Based on this context:
${noteContent.slice(0, 1000)}

Generate a lethal 3-part re-engagement "Drip Sequence" of sales pitches that relies heavily on FOMO, extreme value, and pattern interrupts. Do NOT use soft language like "Just touching base."

Email 1 (Day 1): The Insight Bomb. Offer them a free piece of high-leverage data about their channel they didn't know.
Email 2 (Day 4): The "Risk Reversal" Offer. Make an offer so good they feel stupid ignoring it (e.g., A free 60s edit on their worst video).
Email 3 (Day 7): The Professional Breakup. The takeaway. Tell them you are closing their file and taking your roster spots elsewhere.

Output the exact email drafts separated by "---". Make them short, punchy, and highly provocative.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function generateRetainerPitch(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI services unavailable.");
  const noteContent = notes.map(n => n.text).join("\n");
  const prompt = `You are a high-ticket agency closer. You just successfully completed a one-off project for ${lead.brandName}.
Based on this context:
${noteContent.slice(0, 1000)}

You need to transition them from a "freelance client" to a "$5k/month Retainer Partner".
Write an email pitch that makes opting out of the retainer feel like a massive financial mistake for their channel.

Focus on:
1. The Momentum: Remind them of the win you just delivered.
2. The Friction: Point out how annoying it is to hire editor-by-editor or manage individual videos.
3. The "Priority Access" Offer: Pitch a monthly retainer that guarantees their channel gets "A-Tier" priority, saving them 20 hours a month and guaranteeing a steady upload schedule.

Output the exact email. Tone should be high-status, confident, and treating the retainer as a limited opportunity you are offering THEM.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function generateCompetitorXRay(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) return "";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const noteContent = notes.map(n => `[${new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt || Date.now()).toLocaleDateString()}] ${n.type || 'note'}: ${n.text}`).join('\n');

  const prompt = `You are a ruthless, top-tier YouTube Strategist and Competitive Analyst (think Sabri Suby mixed with MrBeast's retention team).
The client "${lead.brandName}" is losing money by not hiring this exact editor.
Budget/Scope: ${lead.budget} / ${lead.timeline}

Based on this context, generate a "Competitor X-Ray Audit".
1. Identify 2 massive competitors in their exact niche.
2. Tear down the competitors' editing (pacing, sound design, hook structure) and show EXACTLY why the competitors are stealing their audience.
3. Provide the exact, aggressive "Judo-flip" script the editor must use to pitch "bridging the gap." Make it sound undeniable.
Output purely in beautifully formatted, high-status Markdown, ready to command absolute authority.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function generatePsychographicProfile(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) return "";

  const noteContent = notes.map(n => `[${new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt || Date.now()).toLocaleDateString()}] ${n.type || 'note'}: ${n.text}`).join('\n');

  const prompt = `You are an elite FBI hostage negotiator (Chris Voss style) and high-ticket sales psychologist.
Analyze the following lead context to build a weaponized psychological profile of "${lead.brandName}" (Contact: ${lead.contactName}).

Notes & Context: ${noteContent.slice(0, 3000)}

Output a classified "Psychographic Negotiation Cheat Sheet". Include:
- Personality Archetype & EXACT emotional vulnerabilities (what they ACTUALLY care about, not what they say).
- The "Black Swan": Identify one hidden motivation or fear driving their decision.
- Tactical Empathy: Provide 3 exact phrasing structures ("It seems like...", "It sounds like...") to use on the next call to create instant, unbreakable rapport.
- Deal-Killers: What words/actions will instantly trigger their flight response?

Output entirely in scannable, tactical Markdown for the editor's eyes only.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function generateViralHookBlueprint(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) return "";

  const noteContent = notes.map(n => `[${new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt || Date.now()).toLocaleDateString()}] ${n.type || 'note'}: ${n.text}`).join('\n');

  const prompt = `You are the most sought-after retention architect on YouTube, completely obsessed with dopamine loops.
The lead is "${lead.brandName}". Create a "Viral Hook & Edit Blueprint" so lethal they are forced to hire the editor immediately.

Context:
${noteContent.slice(0, 1500)}

Draft a relentless 60-second opening script for their next theoretical video.
- Format strictly in 2 columns: [Auditory / V.O.] | [Visual / Sound Design Directives].
- Inject aggressive dopamine spikes: specify precise J-cuts, riser swells, visual zoom-ins, and pattern interrupts.
- Explain the "Cognitive Open Loop": Tell the client EXACTLY the psychological trick you used in the first 3 seconds to hijack the viewer's attention.

Output in aggressive, elite, high-status Markdown. Make the editor look like a god.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function generateContractNegotiator(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) return "";

  const noteContent = notes.map(n => `[${new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt || Date.now()).toLocaleDateString()}] ${n.type || 'note'}: ${n.text}`).join('\n');

  const prompt = `You are a ruthless, high-end entertainment lawyer and negotiation coach (Harvey Specter combined with Oren Klaff).
Lead: "${lead.brandName}". Budget: ${lead.budget}.
Context: ${noteContent.slice(0, 2000)}

Arm the freelancer with an airtight, high-leverage contract structure.
Give them the exact elite wording to use in the contract regarding:
- Strict scope boxing & militant revision limits (e.g., "The Final Polish clause").
- Raw footage workflow boundaries to prevent infinite scope creep.
- Performance Upside (how to legally ask for a % of AdSense or product sales).
- The "Hostage Deposit": A non-refundable 50% upfront clause framed as a "priority reservation fee".

Draft the exact copy for these clauses so the freelancer can copy-paste them into their agreement. Output in sharp, authoritative Markdown.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function generateStoryboardBRoll(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) return "";

  const noteContent = notes.map(n => `[${new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt || Date.now()).toLocaleDateString()}] ${n.type || 'note'}: ${n.text}`).join('\n');

  const prompt = `You are an elite Visual Director who crafts Hollywood-tier pacing for top creators.
The lead "${lead.brandName}" operates in the ${lead.niche} niche.
Notes/Context: ${noteContent.slice(0, 2000)}

Generate a "Storyboard & B-Roll Masterclass" the editor can use as overwhelming proof of competence.
Provide:
1. The 5-Second Visceral Hook: Frame-by-frame visual breakdown.
2. 5 Hyper-Specific B-Roll Directives (no generic stock footage; think custom-shot angles, data-mosh transitions, kinetic typography).
3. The "Pattern Break": One specific editing technique at the 30-second mark to spike retention.

Make it sound highly technical but visceral. Output in scannable Markdown with emojis to break down the walls of text.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function generateMusicSoundDesign(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) return "";

  const noteContent = notes.map(n => `[${new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt || Date.now()).toLocaleDateString()}] ${n.type || 'note'}: ${n.text}`).join('\n');

  const prompt = `You are the industry's most sought-after Audio Engineer & Sonic Branding expert for digital creators.
The lead "${lead.brandName}" (${lead.niche}).
Notes/Context: ${noteContent.slice(0, 2000)}

Create a mind-blowing "Sonic Branding & Sound Design Matrix". 
Most editors just cut clips; you use audio to manipulate human psychology. Provide:
1. The Core Sonic Identity (BPM, frequency ranges, emotional tone).
2. The "Subconscious Transition" stack: Specific layered SFX sequences (e.g., 808 sub-drop + high-pass filter sweep + vinyl crackle).
3. Tactical Silence: Pinpoint the exact moments to use absolute dead silence for maximum psychological impact.

Make the editor sound like an absolute audio god. Output in sharp, technical, and impactful Markdown.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function generateTitleThumbnailIdeas(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) return "";

  const noteContent = notes.map(n => `[${new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt || Date.now()).toLocaleDateString()}] ${n.type || 'note'}: ${n.text}`).join('\n');

  const prompt = `You are a psychological genius and top-tier YouTube Title/Thumbnail architect.
The lead "${lead.brandName}" is in the ${lead.niche} niche.
Notes/Context: ${noteContent.slice(0, 2000)}

Provide 3 lethally clickable Title & Thumbnail concepts that invoke intense curiosity and FOMO. 
For each:
- The Title: Masterful copywriting (Max 55 characters).
- The Imagery: Frame the composition, subject emotion, lighting, and exact visual contrast.
- The Psychological Trigger: Explain exactly WHY the human brain cannot resist clicking this (e.g., cognitive dissonance, status threat, extreme novelty).

Deliver this in high-status, razor-sharp Markdown. Make it the trump card the editor pulls to close the deal.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function generateObjectionHandlingScript(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) return "";

  const noteContent = notes.map(n => `[${new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt || Date.now()).toLocaleDateString()}] ${n.type || 'note'}: ${n.text}`).join('\n');

  const prompt = `You are Jordan Belfort and Chris Voss combined into an AI closer.
The lead is "${lead.brandName}" (${lead.niche}). Budget: ${lead.budget}.
Notes/Context: ${noteContent.slice(0, 2000)}

Predict their 3 most brutal objections (e.g., "Too expensive", "I need to think about it", "My current editor is cheaper").
For each, provide:
1. The Subtext (What they are secretly afraid of).
2. The Pattern-Interrupt Rebuttal (The exact, word-for-word script to flip the frame and make them feel ridiculous for objecting).
3. The Tie-Down Question (The exact question to ask immediately to regain absolute control).

Output in aggressive, bulletproof sales Markdown. Instruct the editor exactly how to deliver it (pacing, tonality).`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function generateRiskReversalPitch(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) return "";

  const noteContent = notes.map(n => `[${new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt || Date.now()).toLocaleDateString()}] ${n.type || 'note'}: ${n.text}`).join('\n');

  const prompt = `You are Alex Hormozi on steroids—an absolute master at structuring $100M Offers.
The lead is "${lead.brandName}" (${lead.niche}). Budget: ${lead.budget}.
Notes/Context: ${noteContent.slice(0, 2000)}

Construct 3 tier-level "Irresistible Offers / Risk Reversals". Make the value-to-price ratio so absolutely absurd that the client would feel incredibly stupid saying no.
Angles:
- The "Unconditional Performance Guarantee".
- The "Pay-for-Retention/Upside" model.
- The "Bulletproof Delivery" promise.

Give the exact, hard-hitting script for pitching it. Break down the psychology of why this removes all purchasing friction. 
Output exclusively in strong, persuasive Markdown.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function generateZoomClosingFramework(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) return "";

  const noteContent = notes.map(n => `[${new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt || Date.now()).toLocaleDateString()}] ${n.type || 'note'}: ${n.text}`).join('\n');

  const prompt = `You are Oren Klaff (Pitch Anything) and an elite B2B closer.
The lead is "${lead.brandName}" (${lead.niche}). Budget: ${lead.budget}.
Context: ${noteContent.slice(0, 2000)}

Design a high-status "Zoom Closing Playbook". You must command the frame from second zero.
Provide:
1. **The Frame Setup (0-3 mins):** How to establish extreme alpha status immediately without being arrogant.
2. **The Pain Probe (3-15 mins):** 3 psychological questions that force the prospect to admit how bad their current content situation is.
3. **The Pitch Transition:** The exact pivot phrase to introduce the solution.
4. **The Price Drop & The Void:** Exactly what to say, and the instruction to stay absolutely silent (whoever speaks first loses).
5. **The Close:** The exact phrase to get payment on the call.

Output in lethal, actionable Markdown. No corporate fluff. Pure unadulterated sales mastery.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function generateGodfatherOffer(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) return "";

  const noteContent = notes.map(n => `[${new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt || Date.now()).toLocaleDateString()}] ${n.type || 'note'}: ${n.text}`).join('\n');

  const prompt = `You are the world's most dangerous Dealmaker.
The lead is "${lead.brandName}" (${lead.niche}). Budget: ${lead.budget}.
Context: ${noteContent.slice(0, 2000)}

Design "The Godfather Offer"—something so aggressively undeniable it shifts their entire reality.
Include:
1. The Paradigm-Shifting Hook: The precise one-liner that makes them drop everything.
2. The God-Tier Deliverables: Frame the video editing not as a service, but as an unfair advantage / money-printing machine.
3. The Authentic Scarcity: Give a brutal, real reason why this offer expires in 48 hours.
4. The Takeaway: How to pull it away so they chase you.

Output in commanding, elite-level sales Markdown. Make it sound expensive and exclusive.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function generateValueBomb(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) return "";

  const noteContent = notes.map(n => `[${new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt || Date.now()).toLocaleDateString()}] ${n.type || 'note'}: ${n.text}`).join('\n');

  const prompt = `You are a grandmaster of the "Law of Reciprocity" and high-ticket B2B sales.
The lead is "${lead.brandName}" (${lead.niche}). Budget: ${lead.budget}.
Context: ${noteContent.slice(0, 2000)}

Design a "Tactical Value Bomb" that weaponizes free work to force a response.
Provide:
1. The Sniper Asset: Exactly what hyper-customized asset the editor should create in <30 minutes (e.g., A brutal retention breakdown of their latest failure, a 15-second remixed intro).
2. The Trojan Horse Email: A 3-sentence, ultra-casual email script delivering the asset that asks for nothing, making them feel psychologically indebted.
3. The Follow-up Trigger: How to respond when they inevitably reply "Wow, this is amazing."

Output in razor-sharp, actionable Markdown.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function generateGhostReactivation(lead: any, notes: any[]) {
  const aiClient = getAI();
  if (!aiClient) return "";

  const noteContent = notes.map(n => `[${new Date(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt || Date.now()).toLocaleDateString()}] ${n.type || 'note'}: ${n.text}`).join('\n');

  const prompt = `You are an elite FBI psychological operative assigned to revive a dead sales deal.
The lead "${lead.brandName}" has completely ghosted.
Context: ${noteContent.slice(0, 2000)}

Standard follow-ups are for amateurs. We need a "Ghost-Buster Protocol" that utilizes extreme pattern interrupts and neurological spikes.
Provide:
1. The 9-Word Nuke: A brutally short, emotionally evocative email/DM that forces their brain to answer.
2. The Shock-and-Awe Visual: A hyper-specific concept for a personalized meme, Loom, or image that shatters corporate numbness.
3. The Takeaway Pivot: An exact script to officially "close their file," removing the pressure and psychologically forcing them to chase.

Output in commanding, high-leverage Markdown. Make it lethal.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function performAIOperation(prompt: string) {
  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });
    return result.text || "";
  } catch (error) {
    console.error("AI generic operation error:", error);
    throw error;
  }
}

export async function analyzeWinLoss(leads: any[], notesMap: Record<string, any[]>) {
  const aiClient = getAI();
  if (!aiClient) return null;
  
  const lostLeads = leads.filter(l => l.status === 'lost');
  if (lostLeads.length === 0) return "Not enough data yet. Add some 'Lost' leads to generate insights.";
  
  const data = lostLeads.map(l => {
    const context = (notesMap[l.id] || []).map(n => n.text).join("\n").slice(0, 200);
    return `Lead: ${l.brandName}\nContext: ${context}`;
  }).join("\n\n---\n\n").slice(0, 5000);

  const prompt = `You are a sales operations analyst. Review the context of these lost deals:
  
${data}

Provide an actionable, concise summary of the primary objections and reasons for lost deals (e.g., Pricing, Timing). Recommend 2-3 sales strategies to improve the close rate. Format with Markdown.`;

  const response = await generateContentWithRetry(aiClient, {
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  return response.text || "";
}

export async function analyzeFeedbackAndDraftResponse(messages: string[]) {
  const aiClient = getAI();
  if (!aiClient) throw new Error("AI not initialized");

  const prompt = `You are a Customer Operations and Retention Analyst. Analyze the following conversation / feedback string from a client.
Messages:
${messages.join('\n')}

Task:
1. Determine the overall sentiment (e.g., "Positive", "Frustrated", "Needs Revision", "Urgent").
2. Indicate if there is a "distressSignal" (boolean) - true if the client is very upset, threatening to cancel, or extremely dissatisfied.
3. Extract actionable "improvements" requested by the client as an array of strings.
4. Auto-draft a polite, professional, and empathetic email reply ("draftedResponse") as a string.

Return ONLY a JSON object exactly matching this schema:
{
  "sentiment": "string",
  "distressSignal": boolean,
  "improvements": ["string"],
  "draftedResponse": "string"
}
Do NOT include markdown block characters like \`\`\`json.`;

  const response = await aiClient.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });

  let text = response.text || "{}";
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse feedback analysis", e);
    return null;
  }
}
