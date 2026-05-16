import { initializeApp } from 'firebase/app';
import { getFirestore, getDocs, collection } from 'firebase/firestore';
import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);
getDocs(collection(db, "contracts")).then(d => {
  console.log("contracts:", d.docs.map(x => ({id: x.id, ...x.data()})));
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
