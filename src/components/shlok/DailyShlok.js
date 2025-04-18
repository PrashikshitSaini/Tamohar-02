import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import { FaBookmark, FaRegBookmark, FaShare } from "react-icons/fa";
import { useAuthState } from "react-firebase-hooks/auth";
import API_BASE_URL from "../../api/config";

// Hardcoded default shlok to display if API loading fails
const DEFAULT_SHLOK = {
  chapter: "2",
  verse: "47",
  sanskrit:
    "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन | मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ||२-४७||",
  transliteration:
    "karmaṇy-evādhikāras te mā phaleṣhu kadāchana mā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi",
  english_meaning:
    "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself to be the cause of the results of your activities, and never be attached to inaction.",
  application:
    "Focus on doing your best work without being attached to results. This approach reduces anxiety and promotes excellence through detachment.",
};

const DailyShlok = () => {
  const [shlok, setShlok] = useState(DEFAULT_SHLOK); // Start with default
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [user] = useAuthState(auth);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDailyShlok = async () => {
      try {
        setLoading(true);
        let todayShlok;

        // First try to get today's shlok from the backend API
        try {
          // Get the daily shlok (same for all users on a given day)
          const response = await fetch(`${API_BASE_URL}/api/shloks/daily`);

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();
          if (data.success && data.shlok) {
            todayShlok = data.shlok;
            console.log(
              `Loaded daily shlok for ${new Date().toLocaleDateString()}`
            );
          } else {
            throw new Error("No daily shlok data in API response");
          }
        } catch (apiError) {
          console.warn(
            "Error fetching from API, falling back to local implementation:",
            apiError
          );

          // Fallback: Implement the same deterministic algorithm locally
          const response = await fetch(
            `${process.env.PUBLIC_URL}/data/gita-shloks.csv`
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.status}`);
          }

          const text = await response.text();

          // Check if we have valid content
          if (!text || text.length < 10) {
            throw new Error("CSV file is empty or too short");
          }

          // Parse CSV properly, trim any comment at the beginning
          let cleanText = text;
          if (text.startsWith("//")) {
            // Find the first newline and remove everything before it
            const firstNewline = text.indexOf("\n");
            if (firstNewline !== -1) {
              cleanText = text.substring(firstNewline + 1);
            }
          }

          const rows = cleanText
            .split("\n")
            .filter((row) => row.trim().length > 0);

          if (rows.length < 2) {
            throw new Error("CSV file doesn't have enough data rows");
          }

          // Get headers from first row
          const headers = rows[0].split(",").map((h) => h.trim());
          const dataRows = rows.slice(1);

          // Generate a deterministic shlok based on today's date - SAME ALGORITHM AS BACKEND
          const today = new Date();
          const dateString = `${today.getFullYear()}-${
            today.getMonth() + 1
          }-${today.getDate()}`;

          // Create a deterministic hash from the date string
          const dateHash = dateString.split("").reduce((acc, char) => {
            return acc + char.charCodeAt(0);
          }, 0);

          // Use the hash to select a shlok for today
          const todayIndex = Math.abs(dateHash % dataRows.length);

          // Select today's shlok
          const selectedRow = dataRows[todayIndex];

          // Parse the CSV row
          const parseCSV = (rowText) => {
            const result = [];
            let insideQuotes = false;
            let currentValue = "";

            for (let i = 0; i < rowText.length; i++) {
              const char = rowText[i];

              if (char === '"') {
                // Toggle the insideQuotes flag
                insideQuotes = !insideQuotes;
              } else if (char === "," && !insideQuotes) {
                // If we encounter a comma outside quotes, this is a field delimiter
                result.push(currentValue.trim());
                currentValue = "";
              } else {
                // Otherwise, add the character to the current value
                currentValue += char;
              }
            }

            // Add the last field
            if (currentValue) {
              result.push(currentValue.trim());
            }

            return result;
          };

          const fields = parseCSV(selectedRow);

          // Create shlok object with all required fields
          todayShlok = {};
          headers.forEach((header, index) => {
            if (index < fields.length) {
              // Clean up quotes if present
              let value = fields[index];
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
              }
              todayShlok[header] = value;
            } else {
              todayShlok[header] = "";
            }
          });

          console.log(
            `Generated daily shlok locally for ${dateString}, index: ${todayIndex}`
          );

          // Verify we have all required fields
          if (!todayShlok.sanskrit || !todayShlok.english_meaning) {
            console.error(
              "Missing required fields in parsed shlok:",
              todayShlok
            );
            throw new Error("Missing required fields in parsed shlok");
          }
        }

        // Update state with today's shlok
        setShlok(todayShlok);

        // Check if this shlok is bookmarked by the user
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const bookmarks = userData.bookmarks || [];

            const isCurrentShlokBookmarked = bookmarks.some(
              (bookmark) =>
                bookmark.chapter === todayShlok.chapter &&
                bookmark.verse === todayShlok.verse
            );

            setIsBookmarked(isCurrentShlokBookmarked);
          }
        }
      } catch (err) {
        console.error("Error fetching shlok:", err);
        setError(err.message);
        // Keep using the default shlok set in state initialization
      } finally {
        setLoading(false);
      }
    };

    fetchDailyShlok();
  }, [user]);

  const handleBookmark = async () => {
    if (!user) {
      alert("Please sign in to bookmark shloks");
      return;
    }

    if (isBookmarked) {
      try {
        // Find the bookmark to remove
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        const bookmarks = userData.bookmarks || [];

        const updatedBookmarks = bookmarks.filter(
          (bookmark) =>
            !(
              bookmark.chapter === shlok.chapter &&
              bookmark.verse === shlok.verse
            )
        );

        await updateDoc(doc(db, "users", user.uid), {
          bookmarks: updatedBookmarks,
        });

        setIsBookmarked(false);
      } catch (error) {
        console.error("Error removing bookmark:", error);
      }
    } else {
      setShowNoteInput(true);
    }
  };

  const saveBookmarkWithNote = async () => {
    try {
      const userRef = doc(db, "users", user.uid);

      // Create the bookmark object
      const bookmark = {
        chapter: shlok.chapter,
        verse: shlok.verse,
        sanskrit: shlok.sanskrit,
        transliteration: shlok.transliteration,
        english_meaning: shlok.english_meaning,
        application: shlok.application,
        note: note,
        timestamp: new Date(),
      };

      // Add the bookmark to the user's bookmarks array
      await updateDoc(userRef, {
        bookmarks: arrayUnion(bookmark),
      });

      setIsBookmarked(true);
      setShowNoteInput(false);
      setNote("");
    } catch (error) {
      console.error("Error saving bookmark:", error);
    }
  };

  const shareVerse = async () => {
    const shareText = `Bhagavad Gita - Chapter ${shlok.chapter}, Verse ${shlok.verse}\n\n${shlok.sanskrit}\n\n${shlok.english_meaning}\n\nFrom Tamohar App`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Daily Wisdom from Bhagavad Gita",
          text: shareText,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(shareText);
      alert("Verse copied to clipboard!");
    }
  };

  if (loading) {
    return <div className="loading">Loading today's wisdom...</div>;
  }

  if (error) {
    return <div className="error">Error loading today's shlok: {error}</div>;
  }

  if (!shlok) {
    return <div className="error">Failed to load today's shlok.</div>;
  }

  return (
    <div className="shlok-container">
      <div className="date-banner">
        <h3>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h3>
      </div>

      <div className="shlok-card">
        <div className="shlok-header">
          <h2>Today's Wisdom</h2>
          <span className="chapter-verse">
            Chapter {shlok?.chapter || ""}, Verse {shlok?.verse || ""}
          </span>
        </div>

        <div className="sanskrit-text">
          <div className="sanskrit-heading">
            <h3>Shlok</h3>
            <div className="decorative-line"></div>
          </div>
          <p>{shlok?.sanskrit || ""}</p>
        </div>

        <div className="transliteration">
          <p>
            <em>{shlok?.transliteration || ""}</em>
          </p>
        </div>

        <div className="meaning">
          <div className="section-heading">
            <h3>Meaning</h3>
            <div className="decorative-line"></div>
          </div>
          <p>{shlok?.english_meaning || ""}</p>
        </div>

        <div className="application">
          <div className="section-heading">
            <h3>Life Application</h3>
            <div className="decorative-line"></div>
          </div>
          <p>{shlok?.application || ""}</p>
        </div>

        <div className="shlok-actions">
          <button
            className="action-button bookmark-button"
            onClick={handleBookmark}
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
            <span>{isBookmarked ? " Bookmarked" : " Bookmark"}</span>
          </button>

          <button className="action-button share-button" onClick={shareVerse}>
            <FaShare />
            <span>Share</span>
          </button>
        </div>

        {showNoteInput && (
          <div className="note-input-container">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why does this shlok resonate with you? (optional)"
              rows={3}
            />
            <div className="note-actions">
              <button
                onClick={() => setShowNoteInput(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={saveBookmarkWithNote}
                className="save-note btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {user && isBookmarked && (
          <div className="bookmark-info">
            <p>This verse is in your bookmarks</p>
          </div>
        )}
      </div>

      <div className="inspiration-note">
        <p>
          "When you find your path, you must not be afraid. You need to have
          sufficient courage to make mistakes."
        </p>
        <span className="quote-author">— Spiritual wisdom</span>
      </div>
    </div>
  );
};

export default DailyShlok;
