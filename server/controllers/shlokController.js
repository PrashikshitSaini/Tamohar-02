const fs = require("fs");
const path = require("path");

// Path to the CSV file - handle both development and production environments
const csvPath =
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "../../data/gita-shloks.csv")
    : path.resolve(__dirname, "../../data/gita-shloks.csv");

// Add a fallback path in case the primary path doesn't exist
const fallbackCsvPath = path.resolve(
  __dirname,
  "../../public/data/gita-shloks.csv"
);

/**
 * Parse a CSV row, handling quoted fields correctly
 * @param {string} row The CSV row to parse
 * @returns {string[]} Array of parsed fields
 */
const parseCSVRow = (row) => {
  const result = [];
  let insideQuotes = false;
  let currentValue = "";

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(currentValue.trim());
      currentValue = "";
    } else {
      currentValue += char;
    }
  }

  // Add the last field
  if (currentValue) {
    result.push(currentValue.trim());
  }

  return result;
};

/**
 * Read and parse the CSV file into an array of shlok objects
 * @returns {Promise<Array>} Array of shlok objects
 */
const readShloksFromCSV = async () => {
  try {
    // Try the primary path first
    let actualCsvPath = csvPath;

    if (!fs.existsSync(csvPath)) {
      console.warn(`CSV file not found at primary path: ${csvPath}`);

      // Try the fallback path
      if (fs.existsSync(fallbackCsvPath)) {
        console.log(`Using fallback CSV path: ${fallbackCsvPath}`);
        actualCsvPath = fallbackCsvPath;
      } else {
        console.error(
          `CSV file not found at fallback path either: ${fallbackCsvPath}`
        );
        return [];
      }
    }

    const csvData = fs.readFileSync(actualCsvPath, "utf8");
    const rows = csvData.split("\n").filter((row) => row.trim().length > 0);

    // Skip header and comments
    let startRow = 0;
    while (
      startRow < rows.length &&
      (rows[startRow].startsWith("//") ||
        rows[startRow].includes("chapter,verse"))
    ) {
      startRow++;
    }

    if (startRow >= rows.length) {
      console.error("No valid data rows found in CSV");
      return [];
    }

    // Parse all data rows
    const shloks = [];
    for (let i = startRow; i < rows.length; i++) {
      const columns = parseCSVRow(rows[i]);

      if (columns.length >= 5) {
        shloks.push({
          chapter: columns[0].trim(),
          verse: columns[1].trim(),
          sanskrit: columns[2].trim().replace(/^"|"$/g, ""),
          transliteration: columns[3].trim().replace(/^"|"$/g, ""),
          english_meaning: columns[4].trim().replace(/^"|"$/g, ""),
          application: columns[5]?.trim().replace(/^"|"$/g, "") || "",
        });
      }
    }

    console.log(`Successfully loaded ${shloks.length} shloks from CSV`);
    return shloks;
  } catch (error) {
    console.error("Error reading or parsing shlok CSV:", error);
    throw error;
  }
};

/**
 * Get a random shlok from the CSV file
 * @returns {Promise<Object|null>} A shlok object or null if none available
 */
const getRandomShlok = async () => {
  try {
    const shloks = await readShloksFromCSV();
    if (shloks.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * shloks.length);
    return shloks[randomIndex];
  } catch (error) {
    console.error("Error getting random shlok:", error);
    throw error;
  }
};

/**
 * Get the daily shlok based on current date
 * This ensures all users see the same shlok on a given day
 * @returns {Promise<Object|null>} Today's shlok object or null if none available
 */
const getDailyShlok = async () => {
  try {
    const shloks = await readShloksFromCSV();
    if (shloks.length === 0) {
      return null;
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const dateString = `${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}`;

    // Create a deterministic hash from the date string
    const dateHash = dateString.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    // Use the hash to select a shlok for today
    const shlokIndex = Math.abs(dateHash % shloks.length);

    console.log(
      `Daily shlok for ${dateString}: index ${shlokIndex} of ${shloks.length}`
    );
    return shloks[shlokIndex];
  } catch (error) {
    console.error("Error getting daily shlok:", error);
    throw error;
  }
};

/**
 * Get a specific shlok by chapter and verse
 * @param {string|number} chapter The chapter number
 * @param {string|number} verse The verse number
 * @returns {Promise<Object|null>} The requested shlok or null if not found
 */
const getShlokByChapterVerse = async (chapter, verse) => {
  try {
    const shloks = await readShloksFromCSV();

    // Convert to strings for comparison
    const targetChapter = String(chapter).trim();
    const targetVerse = String(verse).trim();

    return (
      shloks.find(
        (shlok) =>
          String(shlok.chapter).trim() === targetChapter &&
          String(shlok.verse).trim() === targetVerse
      ) || null
    );
  } catch (error) {
    console.error("Error getting shlok by chapter and verse:", error);
    throw error;
  }
};

module.exports = {
  getRandomShlok,
  getDailyShlok,
  getShlokByChapterVerse,
};
