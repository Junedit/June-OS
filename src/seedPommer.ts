import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const pommerLeadFallback = {
      brandName: "The Pommer Family",
      contactName: "Pommers",
      contactEmail: "Pommersbiz@gmail.com",
      budget: 5500,
      message: "We need an editor to craft the perfect story for our crazy family vlog. 6 girls, 1 boy, lots of memories!",
      status: "negotiating",
      reviewVideoUrl: "https://vimeo.com/1192000101",
      companyUrl: "https://www.youtube.com/@Thepommerfamily/featured",
      niche: "Family Vlog",
      targetRetentionRate: "4,000 Hrs",
      predictedLTV: "$3.5K/mo",
      caseStudy1Title: "The 3 Second Hook",
      caseStudy1Text: "We pulled the highest tension moment taking 7 kids to Target straight to 0:00, creating an irresistible hook.",
      caseStudy2Title: "Narrative Arc",
      caseStudy2Stat: "+200%",
      caseStudy2Text: "Turning disconnected clips into a cohesive, highly engaging 10 minute long form story.",
      caseStudy3Title: "Monetization Target",
      caseStudy3Stat: "4K",
      caseStudy3Text: "Required watch hours to unlock AdSense and brand deal revenue.",
      testimonialQuote: "",
      testimonialAuthor: "",
      aiAudit: `The Gap Nobody Told You About
1 million views. 1.2K subscribers Not monetized That's not a content problem that's a packaging problem.

What You Have Going For You
You have what most channels spend years trying to build a real naturally watchable family The puppy video hitting 116K views without any strategy behind it proves the algorithm already likes you The raw ingredients are all there.

What's Quietly Working Against You

The Shorts Trap: Every video you post is a Short Shorts don't count toward the 4,000 watch hours YouTube requires for monetization You've accumulated a million views and earned zero watch hours from it You're filling YouTube's bucket not your own

Invisible Titles: Your titles are invisible to new audiences. "Quick a target run" tells the algorithm nothing "Taking 7 Kids to Target (Chaos Ensues)" tells it everything.

Missing Structure: Your videos have no hook in the first 3 seconds, no narrative structure, and no CTA at the end Viewers watch and leave with no reason to subscribe.

The Fix
One long form video per week Real family life, properly edited, with a clear premise Four videos and your watch hours start moving toward monetization seriously.

What This Unlocks
Target, HelloFresh, pet brands, teen beauty they're already showing up in your content naturally Once the channel is professionally packaged, that becomes $2,000 4,500 per month in AdSense and brand deals.

You're already doing the hard part You just need someone to package it properly That's exactly what I do.`
};

export async function seedPommerLead(userId: string) {
  if (!userId) return;
  const q = query(collection(db, 'leads'), where('ownerId', '==', userId), where('brandName', '==', 'The Pommer Family'));
  const snap = await getDocs(q);
  
  const leadData = {
      ownerId: userId,
      ...pommerLeadFallback
    };

  try {
    if (!snap.empty) {
      // update existing
      try {
        const docRef = snap.docs[0].ref;
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(docRef, leadData);
      } catch (e) {
        console.warn("Skipping lead update block", e);
      }
      return;
    }

    const leadRef = await addDoc(collection(db, 'leads'), {
        ...leadData,
        createdAt: serverTimestamp()
    });
    
    // Also add an audit note
    await addDoc(collection(db, 'leads', leadRef.id, 'notes'), {
      ownerId: userId,
      leadId: leadRef.id,
      text: "Did a deep analysis of The Pommer Family channel. They have 6 girls and 1 boy, so the chaos is their biggest asset. We need to frame editing around controlling that chaos for high retention. Added Vimeo review link and seeded Sales Room.",
      type: "note",
      createdAt: serverTimestamp()
    });
    console.log("Seeded Pommer lead!");
  } catch(e) {
    console.error("Failed to seed lead", e);
  }
}
