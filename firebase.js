// ===== FIREBASE SETUP =====
// Your Firebase project: carbon-footprint-platfor-f2401
// ⚠️ Like the AI key, this config is visible in source — that's normal and
// safe for frontend apps. Security is handled by Firestore Rules.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkEwQYJxTUZwfMhwBqiWpEBxWfJWdw_28",
  authDomain: "carbon-footprint-platfor-f2401.firebaseapp.com",
  projectId: "carbon-footprint-platfor-f2401",
  storageBucket: "carbon-footprint-platfor-f2401.firebasestorage.app",
  messagingSenderId: "638894049208",
  appId: "1:638894049208:web:68ec75c3548111b0b9b14d",
  measurementId: "G-MJ362TZ6JY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ===== LEADERBOARD — FIREBASE VERSION =====

// Called from script.js after user clicks "Join Leaderboard"
window.addToLeaderboardFirebase = async function(name, score) {
  let badge, label;
  if (score < 1200)      { badge = 'badge-eco';  label = 'Eco Champion'; }
  else if (score < 2500) { badge = 'badge-eco';  label = 'Green Warrior'; }
  else if (score < 4700) { badge = 'badge-good'; label = 'Getting There'; }
  else                   { badge = 'badge-avg';  label = 'High Impact'; }

  try {
    await addDoc(collection(db, 'leaderboard'), {
      name,
      score,
      badge,
      label,
      createdAt: serverTimestamp()
    });
    console.log('Leaderboard entry saved to Firebase ✅');
    await loadLeaderboardFromFirebase();
  } catch (err) {
    console.error('Firebase leaderboard write error:', err);
    // Fallback: still render locally so UI doesn't break
    renderLeaderboardLocal(name, score, badge, label);
  }
};

async function loadLeaderboardFromFirebase() {
  try {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('score', 'asc'),
      limit(8)
    );
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => doc.data());

    if (entries.length === 0) {
      // No entries yet — show defaults
      renderDefaultLeaderboard();
      return;
    }

    renderLeaderboardEntries(entries);
  } catch (err) {
    console.error('Firebase leaderboard read error:', err);
    renderDefaultLeaderboard();
  }
}

function renderLeaderboardEntries(entries) {
  const rankLabels = ['gold', 'silver', 'bronze'];
  const container = document.getElementById('lb-rows');
  if (!container) return;

  container.innerHTML = entries.map((e, i) => `
    <div class="lb-row" style="animation-delay:${i * 0.05}s">
      <div class="lb-rank ${rankLabels[i] || ''}">
        ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1)}
      </div>
      <div class="lb-name">${e.name}</div>
      <div class="lb-score">${Number(e.score).toLocaleString('en-IN')} kg CO₂/yr</div>
      <div><span class="lb-badge ${e.badge}">${e.label}</span></div>
    </div>
  `).join('');
}

function renderDefaultLeaderboard() {
  const defaults = [
    { name: 'Priya S.',  score: 892,  badge: 'badge-eco',  label: 'Eco Champion' },
    { name: 'Rahul M.',  score: 1240, badge: 'badge-eco',  label: 'Green Warrior' },
    { name: 'Aisha K.',  score: 1580, badge: 'badge-eco',  label: 'Green Warrior' },
    { name: 'Dev P.',    score: 2100, badge: 'badge-good', label: 'Getting There' },
    { name: 'Neha R.',   score: 2850, badge: 'badge-good', label: 'Getting There' },
  ];
  renderLeaderboardEntries(defaults);
}

function renderLeaderboardLocal(name, score, badge, label) {
  // Emergency fallback — just prepend the new entry to whatever's showing
  const container = document.getElementById('lb-rows');
  if (!container) return;
  const newRow = document.createElement('div');
  newRow.className = 'lb-row';
  newRow.innerHTML = `
    <div class="lb-rank">🆕</div>
    <div class="lb-name">${name}</div>
    <div class="lb-score">${score.toLocaleString('en-IN')} kg CO₂/yr</div>
    <div><span class="lb-badge ${badge}">${label}</span></div>
  `;
  container.prepend(newRow);
}

// ===== PLEDGES — FIREBASE VERSION =====

window.addPledgeFirebase = async function(name, action) {
  try {
    await addDoc(collection(db, 'pledges'), {
      name,
      action,
      createdAt: serverTimestamp()
    });
    console.log('Pledge saved to Firebase ✅');
    await loadPledgesFromFirebase();
  } catch (err) {
    console.error('Firebase pledge write error:', err);
    // Fallback render locally
    appendPledgeLocal(name, action);
  }
};

async function loadPledgesFromFirebase() {
  try {
    const q = query(
      collection(db, 'pledges'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    const pledges = snapshot.docs.map(doc => doc.data());

    if (pledges.length === 0) {
      renderDefaultPledges();
      return;
    }

    renderPledgeEntries(pledges);
  } catch (err) {
    console.error('Firebase pledge read error:', err);
    renderDefaultPledges();
  }
}

function renderPledgeEntries(pledges) {
  const container = document.getElementById('pledges-list');
  if (!container) return;
  container.innerHTML = pledges.map(p => `
    <div class="pledge-item">
      <div class="pledge-avatar">${p.name.charAt(0).toUpperCase()}</div>
      <div><strong>${p.name}</strong> pledged: ${p.action}</div>
    </div>
  `).join('');
}

function renderDefaultPledges() {
  const defaults = [
    { name: 'Ananya', action: 'I will use public transport 3x/week' },
    { name: 'Vikram', action: 'I will plant 5 trees this year' },
    { name: 'Shreya', action: 'I will go meat-free 2 days/week' },
  ];
  renderPledgeEntries(defaults);
}

function appendPledgeLocal(name, action) {
  const container = document.getElementById('pledges-list');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'pledge-item';
  el.innerHTML = `
    <div class="pledge-avatar">${name.charAt(0).toUpperCase()}</div>
    <div><strong>${name}</strong> pledged: ${action}</div>
  `;
  container.prepend(el);
}

// ===== INIT: Load data when page is ready =====
document.addEventListener('DOMContentLoaded', () => {
  loadLeaderboardFromFirebase();
  loadPledgesFromFirebase();
});
