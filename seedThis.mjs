import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, query, where } from 'firebase/firestore';
import { seedPommerLead } from './src/seedPommer.js'; // Might not work in js exactly
