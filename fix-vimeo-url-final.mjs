import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, updateDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function main() {
  await signInWithEmailAndPassword(auth, "png.tree0078@gmail.com", "Testing123!");
  const snap = await getDocs(collection(db, "leads"));
  console.log("Found leads:", snap.size);
  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.reviewVideoUrl && data.reviewVideoUrl.includes("1192000101")) {
      await updateDoc(doc.ref, { reviewVideoUrl: `https://player.vimeo.com/video/1192000101?badge=0&autopause=0&player_id=0&app_id=58479` });
      updated++;
      console.log("Updated lead:", doc.id);
    }
  }
  console.log("Total updated:", updated);
  process.exit(0);
}
main().catch(console.error);
