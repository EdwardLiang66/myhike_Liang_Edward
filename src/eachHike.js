// ===========================
// eachHike.js
// Display a specific hike's details based on Firestore document ID
// ===========================

import { db } from "./firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";
import {collection, query, where, getDocs} from "firebase/firestore";
async function displayHike() {
  // Get the "docID" from the URL
  const params = new URLSearchParams(window.location.search);
  const hikeID = params.get("docID");

  if (!hikeID) {
    console.error("No hike ID found in the URL!");
    return;
  }

  try {
    // Reference to the specific hike document
    const hikeRef = doc(db, "hikes", hikeID);
    const hikeSnap = await getDoc(hikeRef);

    if (hikeSnap.exists()) {
      const hike = hikeSnap.data();

      // Update the HTML with the hike information
      document.getElementById("hikeName").textContent = hike.name;
      document.getElementById("hikeImage").src = `./images/${hike.code}.jpg`;
      document.getElementById("hikeImage").alt = hike.name;
    } else {
      console.error("No such hike document found!");
    }
  } catch (error) {
    console.error("Error retrieving hike details:", error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const writeReviewBtn = document.getElementById('writeReviewBtn');
  writeReviewBtn.addEventListener('click', saveHikeDocumentIDAndRedirect);
});

function saveHikeDocumentIDAndRedirect() {
  const params = new URL(window.location.href);
  const hikeID = params.searchParams.get("docID");

  if (!hikeID) {
    console.warn("No hike ID found in URL. Cannot continue.");
    return;
  }

  // Save the hike ID locally
  localStorage.setItem('hikeDocID', hikeID);

  // Redirect to the review page
  window.location.href = 'review.html';
}
// Run when the page loads
displayHike();

async function populateReviews() {
  console.log("test");
  const hikeCardTemplate = document.getElementById("reviewCardTemplate");
  const hikeCardGroup = document.getElementById("reviewCardGroup");

  // Get hike ID from the URL (e.g. ?docID=abc123)
  const params = new URL(window.location.href);
  const hikeID = params.searchParams.get("docID");
  if (!hikeID) {
    console.warn("No hike ID found in URL.");
    return;
  }

  try {
    // Build the query for reviews that match this hikeDocID
    const q = query(collection(db, "reviews"), where("hikeDocID", "==", hikeID));
    const querySnapshot = await getDocs(q);

    console.log("Found", querySnapshot.size, "reviews");

    querySnapshot.forEach((docSnap) => {
    
      // Extract all the data from Firestore document
      const data = docSnap.data();
      const title = data.title || "(No title)";
      const level = data.level || "(Not specified)";
      const season = data.season || "(Not specified)";
      const description = data.description || "";
      const flooded = data.flooded || "(unknown)";
      const scrambled = data.scrambled || "(unknown)";
      const rating = data.rating || 0;
 
      // Format the time
      let time = "";
      if (data.timestamp?.toDate) {
        time = data.timestamp.toDate().toLocaleString();
      }

      // Clone the template and fill in the fields
      const reviewCard = hikeCardTemplate.content.cloneNode(true);

	    // Populate the different elements in the card with data
      reviewCard.querySelector(".title").textContent = title;
      reviewCard.querySelector(".time").textContent = time;
      reviewCard.querySelector(".level").textContent = `Level: ${level}`;
      reviewCard.querySelector(".season").textContent = `Season: ${season}`;
      reviewCard.querySelector(".scrambled").textContent = `Scrambled: ${scrambled}`;
      reviewCard.querySelector(".flooded").textContent = `Flooded: ${flooded}`;
      reviewCard.querySelector(".description").textContent = `Description: ${description}`;

      // ⭐ Populate the star rating dynamically
      let starRating = "";
      for (let i = 0; i < rating; i++) {
        starRating += '<span class="material-icons">star</span>';
      }
      for (let i = rating; i < 5; i++) {
        starRating += '<span class="material-icons">star_outline</span>';
      }
      reviewCard.querySelector(".star-rating").innerHTML = starRating;

      // Add the filled-in card to the page
      hikeCardGroup.appendChild(reviewCard);
    });
  } catch (error) {
    console.error("Error loading reviews:", error);
  }
}

// Run it
populateReviews();
