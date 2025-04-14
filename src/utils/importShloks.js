import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";

// Function to import shloks from the CSV array to Firestore
export async function importShlokaToFirestore(shloksArray) {
  try {
    console.log(`Starting import of ${shloksArray.length} shloks...`);

    // Check how many shloks are already in the database
    const shloksCollection = collection(db, "shloks");
    const existingShlokaSnapshot = await getDocs(shloksCollection);
    console.log(
      `Found ${existingShlokaSnapshot.size} existing shloks in Firestore`
    );

    let importCount = 0;
    let skipCount = 0;

    for (const shlok of shloksArray) {
      // Check if this shlok already exists (by chapter and verse)
      const q = query(
        shloksCollection,
        where("chapter", "==", shlok.chapter),
        where("verse", "==", shlok.verse)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // This shlok doesn't exist yet, add it
        await addDoc(shloksCollection, {
          chapter: parseInt(shlok.chapter, 10),
          verse: parseInt(shlok.verse, 10),
          sanskrit: shlok.sanskrit,
          transliteration: shlok.transliteration,
          english_meaning: shlok.english_meaning,
          application: shlok.application,
        });
        importCount++;
      } else {
        skipCount++;
      }
    }

    console.log(
      `Import complete. Added: ${importCount}, Skipped (already exists): ${skipCount}`
    );
    return { success: true, added: importCount, skipped: skipCount };
  } catch (error) {
    console.error("Error importing shloks:", error);
    return { success: false, error: error.message };
  }
}


