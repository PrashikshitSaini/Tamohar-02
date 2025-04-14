import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import { FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa";

const BookmarksList = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editedNote, setEditedNote] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setBookmarks(userData.bookmarks || []);
        }
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user]);

  const handleRemoveBookmark = async (bookmark) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        bookmarks: arrayRemove(bookmark),
      });

      setBookmarks(
        bookmarks.filter(
          (b) =>
            !(
              b.chapter === bookmark.chapter &&
              b.verse === bookmark.verse &&
              b.timestamp.seconds === bookmark.timestamp.seconds
            )
        )
      );
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  };

  const startEditingNote = (bookmark, note) => {
    // Create a unique identifier using chapter, verse and timestamp
    const id = `${bookmark.chapter}-${bookmark.verse}-${bookmark.timestamp.seconds}`;
    setEditingNoteId(id);
    setEditedNote(note);
  };

  const saveEditedNote = async (bookmark) => {
    if (!user) return;

    try {
      // First remove the old bookmark
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        bookmarks: arrayRemove(bookmark),
      });

      // Then add the updated bookmark
      const updatedBookmark = {
        ...bookmark,
        note: editedNote,
      };

      await updateDoc(userRef, {
        bookmarks: [
          ...bookmarks.filter(
            (b) =>
              !(
                b.chapter === bookmark.chapter &&
                b.verse === bookmark.verse &&
                b.timestamp.seconds === bookmark.timestamp.seconds
              )
          ),
          updatedBookmark,
        ],
      });

      // Update local state
      setBookmarks(
        bookmarks.map((b) =>
          b.chapter === bookmark.chapter &&
          b.verse === bookmark.verse &&
          b.timestamp.seconds === bookmark.timestamp.seconds
            ? updatedBookmark
            : b
        )
      );

      setEditingNoteId(null);
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  if (loading) {
    return <div className="loading">Loading your bookmarks...</div>;
  }

  if (!user) {
    return (
      <div className="login-prompt">
        <h2>Please log in to view your bookmarks</h2>
        <a href="/login" className="btn-primary">
          Log In
        </a>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="empty-bookmarks">
        <h2>No bookmarks yet</h2>
        <p>When you bookmark a shlok, it will appear here</p>
        <a href="/" className="btn-primary">
          Go to Today's Shlok
        </a>
      </div>
    );
  }

  return (
    <div className="bookmarks-container">
      <h2>Your Bookmarked Shloks</h2>

      <div className="bookmarks-list">
        {bookmarks.map((bookmark, index) => {
          const bookmarkId = `${bookmark.chapter}-${bookmark.verse}-${
            bookmark.timestamp?.seconds || index
          }`;
          const isEditing = editingNoteId === bookmarkId;

          return (
            <div key={bookmarkId} className="bookmark-card">
              <div className="bookmark-header">
                <h3>
                  Chapter {bookmark.chapter}, Verse {bookmark.verse}
                </h3>
                <div className="bookmark-actions">
                  <button
                    className="remove-bookmark"
                    onClick={() => handleRemoveBookmark(bookmark)}
                    aria-label="Remove bookmark"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="sanskrit-text">
                <p>{bookmark.sanskrit}</p>
              </div>

              <div className="meaning">
                <h4>Meaning</h4>
                <p>{bookmark.english_meaning}</p>
              </div>

              <div className="application">
                <h4>Life Application</h4>
                <p>{bookmark.application}</p>
              </div>

              <div className="bookmark-note">
                <div className="note-header">
                  <h4>Your Note</h4>
                  {!isEditing ? (
                    <button
                      className="edit-note"
                      onClick={() => startEditingNote(bookmark, bookmark.note)}
                      aria-label="Edit note"
                    >
                      <FaEdit />
                    </button>
                  ) : (
                    <div className="edit-actions">
                      <button
                        onClick={() => saveEditedNote(bookmark)}
                        aria-label="Save note"
                      >
                        <FaSave />
                      </button>
                      <button
                        onClick={() => setEditingNoteId(null)}
                        aria-label="Cancel editing"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>

                {!isEditing ? (
                  <p>{bookmark.note || "No note added"}</p>
                ) : (
                  <textarea
                    value={editedNote}
                    onChange={(e) => setEditedNote(e.target.value)}
                    placeholder="Add your note here..."
                    rows={3}
                  />
                )}
              </div>

              <div className="bookmark-date">
                Bookmarked on:{" "}
                {bookmark.timestamp?.toDate?.().toLocaleDateString() ||
                  "Unknown date"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookmarksList;
