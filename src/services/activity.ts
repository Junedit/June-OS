import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export async function addGlobalActivity(text: string, type: 'ai' | 'deal' | 'payment' | 'system' = 'system') {
  if (!auth.currentUser) return;
  try {
    await addDoc(collection(db, 'activity_logs'), {
      text,
      type,
      ownerId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.error('Failed to log activity', e);
  }
}
