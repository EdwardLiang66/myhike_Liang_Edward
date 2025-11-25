// ===========================
// main.js
// Handles user greeting and quote display from Firestore
// ===========================

import { onAuthReady } from "./authentication.js";
import { db } from "./firebaseConfig.js";
import {
  doc,
  onSnapshot,
  getDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

/**
 * Read and display the quote of the day from Firestore.
 * @param {string} day - The name of the day (e.g., "monday", "tuesday").
 */
function readQuote(day) {
  const quoteDocRef = doc(db, "quotes", day); // Reference to the document inside the "quotes" collection

  onSnapshot(
    quoteDocRef,
    (docSnap) => {
      // Listen for real-time updates
      if (docSnap.exists()) {
        document.getElementById("quote-goes-here").innerHTML =
          docSnap.data().quote;
      } else {
        console.log("No such document found in Firestore!");
      }
    },
    (error) => {
      console.error("Error listening to Firestore document: ", error);
    }
  );
}

/**
 * Display the user's name on the dashboard and load the quote of the day.
 */
function showDashboard() {
  const nameElement = document.getElementById("name-goes-here");

  onAuthReady(async (user) => {
    if (!user) {
      location.href = "index.html";
      return;
    }

    // 1. Build a reference to the user document
    const userRef = doc(db, "users", user.uid);

    // 2. Read that document once
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : {};

    // 3. Greet the user
    const name = userData.name || user.displayName || user.email;
    if (nameElement) {
      nameElement.textContent = `${name}!`;
    }

    const today = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    readQuote(today);

    // 4. Read bookmarks as a plain array (no globals)
    const bookmarks = userData.bookmarks || [];

    // 5. Display cards, but now pass userRef and bookmarks (array)
    await displayCardsDynamically(user.uid, bookmarks);
  });
}

// Helper function to add the sample hike documents.
function addHikeData() {
  const hikesRef = collection(db, "hikes");
  console.log("Adding sample hike data...");
  addDoc(hikesRef, {
    code: "BBY01",
    name: "Burnaby Lake Park Trail",
    city: "Burnaby",
    level: "easy",
    details: "A lovely place for a lunch walk.",
    length: 10,
    hike_time: 60,
    lat: 49.2467097082573,
    lng: -122.9187029619698,
    last_updated: serverTimestamp(),
  });
  addDoc(hikesRef, {
    code: "AM01",
    name: "Buntzen Lake Trail",
    city: "Anmore",
    level: "moderate",
    details: "Close to town, and relaxing.",
    length: 10.5,
    hike_time: 80,
    lat: 49.3399431028579,
    lng: -122.85908496766939,
    last_updated: serverTimestamp(),
  });
  addDoc(hikesRef, {
    code: "NV01",
    name: "Mount Seymour Trail",
    city: "North Vancouver",
    level: "hard",
    details: "Amazing ski slope views.",
    length: 8.2,
    hike_time: 120,
    lat: 49.38847101455571,
    lng: -122.94092543551031,
    last_updated: serverTimestamp(),
  });
}

// Run the dashboard function when the page loads
async function seedHikes() {
  const hikesRef = collection(db, "hikes");
  const querySnapshot = await getDocs(hikesRef);

  // Check if the collection is empty
  if (querySnapshot.empty) {
    console.log("Hikes collection is empty. Seeding data...");
    addHikeData();
  } else {
    console.log("Hikes collection already contains data. Skipping seed.");
  }
}

// Call the seeding function when the main.html page loads.
seedHikes();

async function toggleBookmark(userId, hikeDocID) {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data() || {};
  const bookmarks = userData.bookmarks || []; // default to empty array

  const iconId = "save-" + hikeDocID;
  const icon = document.getElementById(iconId);

  const isBookmarked = bookmarks.includes(hikeDocID);

  try {
    if (isBookmarked) {
      // Remove from Firestore array
      await updateDoc(userRef, { bookmarks: arrayRemove(hikeDocID) });

      icon.innerText = "bookmark_border";
    } else {
      // Add to Firestore array
      await updateDoc(userRef, { bookmarks: arrayUnion(hikeDocID) });

      icon.innerText = "bookmark";
    }
  } catch (err) {
    console.error("Error toggling bookmark:", err);
  }
}
async function displayCardsDynamically(userId, bookmarks) {
  let cardTemplate = document.getElementById("hikeCardTemplate");
  const hikesCollectionRef = collection(db, "hikes");

  try {
    const querySnapshot = await getDocs(hikesCollectionRef);
    querySnapshot.forEach((docSnap) => {
      // Clone the card template
      let newcard = cardTemplate.content.cloneNode(true);
      const hike = docSnap.data(); // Get hike data once

      // Populate the card with hike data
      newcard.querySelector(".card-title").textContent = hike.name;
      newcard.querySelector(".card-text").textContent =
        hike.details || `Located in ${hike.city}.`;
      newcard.querySelector(".card-length").textContent = hike.length;

      newcard.querySelector(".card-img-top").src = `./images/${hike.code}.jpg`;

      // Add the link with the document ID
      newcard.querySelector(
        ".read-more"
      ).href = `eachHike.html?docID=${doc.id}`;

      const hikeDocID = docSnap.id;
      const icon = newcard.querySelector("i.material-icons");

      // Give this icon a unique id based on the hike ID
      icon.id = "save-" + hikeDocID;

      // Decide initial state from bookmarks array
      const isBookmarked = bookmarks.includes(hikeDocID);

      // Set initial bookmark icon based on whether this hike is already in the user's bookmarks
      icon.innerText = isBookmarked ? "bookmark" : "bookmark_border";

      // On click, call a toggleBookmark
      icon.onclick = () => toggleBookmark(userId, hikeDocID);

      // Attach the new card to the container
      document.getElementById("hikes-go-here").appendChild(newcard);
    });
  } catch (error) {
    console.error("Error getting documents: ", error);
  }
}

showDashboard();
