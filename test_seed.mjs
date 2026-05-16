import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "png.tree0078@gmail.com", "Testing123!");
    const userId = cred.user.uid;
    console.log("Logged in as", userId);

    const q = query(collection(db, 'leads'), where('ownerId', '==', userId), where('brandName', '==', 'The Pommer Family'));
    const snap = await getDocs(q);
    
    const leadData = {
        ownerId: userId,
        brandName: "The Pommer Family",
        contactName: "Pommers",
        contactEmail: "Pommersbiz@gmail.com",
        budget: 5500,
        message: "We need an editor to craft the perfect story for our crazy family vlog. 6 girls, 1 boy, lots of memories!",
        status: "negotiating",
        reviewVideoUrl: "https://vimeo.com/reviews/55cfd91b-0689-401d-931c-87004893397e/videos/1192000101",
        companyUrl: "https://www.youtube.com/@Thepommerfamily/featured",
        niche: "Family Vlog",
        targetRetentionRate: "55%+",
        predictedLTV: "$25K+",
        caseStudy1Title: "Chaotic to Cinematic",
        caseStudy1Text: "We restructured the narrative arc to introduce the 'crazy life' tension in the first 5 seconds. Added sound design to amplify the kids' reactions.",
        caseStudy2Title: "Emotional Pacing",
        caseStudy2Stat: "-35%",
        caseStudy2Text: "Dead air removed. Optimized for viewer emotional rollercoaster.",
        caseStudy3Title: "Est. AVD Growth",
        caseStudy3Stat: "+42%",
        caseStudy3Text: "Increase in expected watch time through B-roll pacing.",
        testimonialQuote: "I watched the drafted edit and honestly got chills. It feels like they really *get* our family dynamic.",
        testimonialAuthor: "Creator Feedback",
        aiAudit: "## Initial Audit: The Pommer Family\n\n**Content Archetype:** Family Vlog / Chaos & Heart\n\n**Strengths:** High energy, genuine familial bond, relatable chaos (6 girls, 1 boy). \n**Vulnerability:** Linear storytelling often leads to pacing dips around the 4-minute mark.\n\n**Action Plan**\n1. **Hook Restructuring:** Pull the highest-energy or most chaotic moment to the 0:00-0:05 mark.\n2. **Sound Design Layering:** Use specific audio cues/themes for each child to anchor recurring characters subconsciously.\n3. **Pacing Tightening:** Accelerate B-roll transitions between distinct scenes to eliminate 'dead air'.\n\n**Projected Result:** +35% AVD, breaking the 5-minute barrier on 10+ minute vlogs."
    };

    if (!snap.empty) {
      console.log("Updating existing...");
      const docRef = snap.docs[0].ref;
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(docRef, leadData);
      console.log("Updated!");
      return;
    }

    console.log("Creating new...");
    const leadRef = await addDoc(collection(db, 'leads'), {
        ...leadData,
        createdAt: serverTimestamp()
    });
    console.log("Created lead!");
    
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
