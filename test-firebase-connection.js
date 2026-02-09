import admin from "firebase-admin";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env explicitly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

console.log("Testing Firebase Connection...");
console.log("Project ID:", process.env.FIREBASE_PROJECT_ID);
console.log("Client Email:", process.env.FIREBASE_CLIENT_EMAIL);

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (!privateKey) {
    console.error("ERROR: FIREBASE_PRIVATE_KEY is missing");
    process.exit(1);
}

const formattedKey = privateKey.replace(/\\n/g, "\n");
console.log("Private Key Length (raw):", privateKey.length);
console.log("Private Key Length (formatted):", formattedKey.length);
console.log("Private Key Header:", formattedKey.substring(0, 35));

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: formattedKey,
        }),
    });
    console.log("Firebase initialized.");

    const db = admin.firestore();
    console.log("Attempting to read from Firestore...");
    const collections = await db.listCollections();
    console.log("Successfully connected! Collections:", collections.map(c => c.id));
} catch (error) {
    console.error("FAILED:", error);
}
