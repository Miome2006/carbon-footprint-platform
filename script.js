// ===== EMISSION FACTORS (kg CO2 per unit) =====
const F = {
  car_km:        0.21,    // per km
  bike_km:       0.07,    // per km (two-wheeler)
  public_km:     0.03,    // per km (bus/metro)
  flight:        350,     // per flight
  beef_meal:     6.6,     // per meal
  chicken_meal:  1.26,    // per meal
  veg_meal:      0.5,     // per meal
  food_waste_kg: 2.5,     // per kg wasted
  electricity:   0.82,    // per kWh (India grid)
  lpg_cyl:       14.9,    // per cylinder
  ac_hour:       1.2,     // per hour (1.5-ton AC)
  clothing:      7.0,     // per item
  electronic:    300,     // per device
  online_order:  0.5,     // per order (packaging+delivery)
  streaming_hr:  0.036,   // per hour
};

let hasSolar = false;
let myFootprint = 0;
let myName = '';

// ===== PARTICLES =====
function createParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 60 + 20;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      animation-delay: ${Math.random() * 15}s;
      animation-duration: ${Math.random() * 20 + 15}s;
    `;
    container.appendChild(p);
  }
}

// ===== CO2 COUNTER (animated) =====
function animateCounter() {
  const el = document.getElementById('counter-co2');
  const baseDaily = 101369863; // ~37B / 365
  let start = null;
  const target = baseDaily;

  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / 2000, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ===== NAVIGATION =====
function scrollToCalculator() {
  document.getElementById('calculator-section').scrollIntoView({ behavior: 'smooth' });
}

function goToStep(step) {
  // Hide all cards
  document.querySelectorAll('.calc-card').forEach(c => {
    c.classList.remove('active');
    c.style.display = 'none';
  });

  // Hide results too
  const results = document.getElementById('results');
  results.classList.remove('active');

  // Show target step
  const target = document.getElementById('step-' + step);
  if (target) {
    target.style.display = 'block';
    setTimeout(() => target.classList.add('active'), 10);
  }

  // Update step indicators
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById('dot-' + i);
    const line = document.getElementById('line-' + i);
    dot.classList.remove('active', 'done');
    if (line) line.classList.remove('done');

    if (i < step) {
      dot.classList.add('done');
      if (line) line.classList.add('done');
    } else if (i === step) {
      dot.classList.add('active');
    }
  }

  updateLivePreviews();
}

// ===== SOLAR TOGGLE =====
function setSolar(val) {
  hasSolar = val;
  document.getElementById('solar-yes').classList.toggle('active', val);
  document.getElementById('solar-no').classList.toggle('active', !val);
  updateLivePreviews();
}

// ===== LIVE PREVIEWS =====
function getVal(id) {
  const el = document.getElementById(id);
  return el ? (parseFloat(el.value) || 0) : 0;
}

function calcTransport() {
  return (getVal('car_km') * 52 * F.car_km)
       + (getVal('bike_km') * 52 * F.bike_km)
       + (getVal('public_km') * 52 * F.public_km)
       + (getVal('flights') * F.flight);
}
function calcFood() {
  return (getVal('beef_meals') * 52 * F.beef_meal)
       + (getVal('chicken_meals') * 52 * F.chicken_meal)
       + (getVal('veg_meals') * 52 * F.veg_meal)
       + (getVal('food_waste') * 52 * F.food_waste_kg);
}
function calcEnergy() {
  const solar = hasSolar ? 0.6 : 1;
  return ((getVal('electricity') * 12 * F.electricity)
        + (getVal('lpg') * 12 * F.lpg_cyl)
        + (getVal('ac_hours') * 180 * F.ac_hour)) * solar;
}
function calcShopping() {
  return (getVal('clothes') * 12 * F.clothing)
       + (getVal('electronics') * F.electronic)
       + (getVal('online_orders') * 12 * F.online_order)
       + (getVal('streaming') * 365 * F.streaming_hr);
}

function updateLivePreviews() {
  const t = calcTransport();
  const fo = calcFood();
  const e = calcEnergy();
  const s = calcShopping();

  const el1 = document.getElementById('transport-live');
  const el2 = document.getElementById('food-live');
  const el3 = document.getElementById('energy-live');
  const el4 = document.getElementById('shopping-live');

  if (el1) el1.textContent = Math.round(t).toLocaleString('en-IN') + ' kg CO₂/year';
  if (el2) el2.textContent = Math.round(fo).toLocaleString('en-IN') + ' kg CO₂/year';
  if (el3) el3.textContent = Math.round(e).toLocaleString('en-IN') + ' kg CO₂/year';
  if (el4) el4.textContent = Math.round(s).toLocaleString('en-IN') + ' kg CO₂/year';
}

// ===== MAIN CALCULATE =====
function calculateFootprint() {
  const transport = calcTransport();
  const food = calcFood();
  const energy = calcEnergy();
  const shopping = calcShopping();
  const total = transport + food + energy + shopping;
  myFootprint = Math.round(total);

  // Show results
  document.querySelectorAll('.calc-card').forEach(c => {
    c.classList.remove('active');
    c.style.display = 'none';
  });
  const resultsEl = document.getElementById('results');
  resultsEl.style.display = 'block';
  setTimeout(() => resultsEl.classList.add('active'), 10);

  // Update all step dots to done
  for (let i = 1; i <= 4; i++) {
    document.getElementById('dot-' + i).classList.add('done');
    const line = document.getElementById('line-' + i);
    if (line) line.classList.add('done');
  }

  // Animate total score
  animateNumber('total-score', total);

  // Rating
  let rating = '', color = '', desc = '';
  const pct = Math.min(total / 6000, 1);

  if (total < 1200) {
    rating = '🌱 Eco Champion'; color = '#16a34a';
    desc = 'Outstanding! Your footprint is well below average. You are a true climate hero.';
  } else if (total < 2500) {
    rating = '🟢 Green Warrior'; color = '#22a050';
    desc = 'Great job! You are near or below India\'s average. A few more changes and you\'ll be exceptional.';
  } else if (total < 4700) {
    rating = '🟡 Getting There'; color = '#d97706';
    desc = 'You\'re around the global average. There\'s good room for improvement with some lifestyle tweaks.';
  } else {
    rating = '🔴 High Impact'; color = '#dc2626';
    desc = 'Your footprint is above the global average. Time to take action — the tips below will help significantly.';
  }

  const badge = document.getElementById('rating-badge');
  badge.textContent = rating;
  badge.style.background = color + '20';
  badge.style.color = color;

  document.getElementById('rating-desc').textContent = desc;

  // Animated conic gradient on score circle
  const circle = document.getElementById('score-circle');
  const pctDeg = Math.round(pct * 360);
  circle.style.background = `conic-gradient(${color} ${pctDeg}deg, #f1f5f9 ${pctDeg}deg)`;

  // Comparison bars
  document.getElementById('you-val').textContent = Math.round(total).toLocaleString('en-IN');
  const maxVal = Math.max(total, 4700);
  const youPct = Math.min((total / maxVal) * 100, 100);
  document.getElementById('you-bar').style.width = youPct + '%';

  // Chart
  buildChart(transport, food, energy, shopping);

  // Trees needed
  const trees = Math.ceil(total / 21);
  animateNumber('trees-count', trees);

  // Tips
  buildTips(transport, food, energy, shopping);

  // Scroll to results
  setTimeout(() => {
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

// ===== ANIMATE NUMBER =====
function animateNumber(id, target) {
  const el = document.getElementById(id);
  let start = null;
  const duration = 1500;
  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ===== BUILD CHART =====
let myChart = null;
function buildChart(transport, food, energy, shopping) {
  if (myChart) myChart.destroy();
  const ctx = document.getElementById('footprintChart').getContext('2d');

  myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Transport', 'Food', 'Energy', 'Shopping'],
      datasets: [{
        data: [
          Math.round(transport), Math.round(food),
          Math.round(energy), Math.round(shopping)
        ],
        backgroundColor: ['#3b82f6', '#f59e0b', '#a855f7', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 8,
      }]
    },
    options: {
      cutout: '65%',
      plugins: { legend: { display: false } },
      animation: { animateRotate: true, duration: 1000 }
    }
  });

  // Custom legend
  const colors = ['#3b82f6', '#f59e0b', '#a855f7', '#ef4444'];
  const icons = ['🚗', '🍽️', '⚡', '🛍️'];
  const vals = [transport, food, energy, shopping];
  const total = vals.reduce((a, b) => a + b, 0);

  const legendEl = document.getElementById('chart-legend');
  legendEl.innerHTML = ['Transport', 'Food', 'Energy', 'Shopping'].map((label, i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${colors[i]}"></div>
      <span>${icons[i]} ${label}: <strong>${Math.round(vals[i]).toLocaleString('en-IN')} kg</strong>
      (${total > 0 ? Math.round(vals[i]/total*100) : 0}%)</span>
    </div>
  `).join('');
}

// ===== BUILD TIPS =====
const allTips = {
  Transport: [
    { head: 'Use Metro/Bus', body: 'Switch to public transport 3 days/week — saves ~300 kg CO₂/year.' },
    { head: 'Carpool', body: 'Share rides with colleagues or use carpooling apps.' },
    { head: 'Walk Short Trips', body: 'For distances under 2km, walk or cycle instead.' },
    { head: 'Reduce Flights', body: 'Prefer train over domestic flights — up to 90% less CO₂.' },
  ],
  Food: [
    { head: 'Try Meatless Mondays', body: 'Just 1 meat-free day/week saves ~300 kg CO₂/year.' },
    { head: 'Reduce Food Waste', body: 'Plan meals and compost leftovers — 1/3 of food globally is wasted.' },
    { head: 'Buy Local Produce', body: 'Locally grown food has 50% lower transport emissions.' },
    { head: 'Choose Chicken over Beef', body: 'Chicken produces 5x less CO₂ than beef per meal.' },
  ],
  Energy: [
    { head: 'Switch to LED Bulbs', body: 'LED bulbs use 75% less energy and last 25x longer.' },
    { head: 'AC at 24°C', body: 'Every 1°C higher saves 6% electricity. Set AC to 24°C.' },
    { head: 'Consider Solar Panels', body: 'Rooftop solar can cut your electricity bill by 70-90%.' },
    { head: 'Unplug Standby Devices', body: 'Standby power accounts for 10% of your electricity bill.' },
  ],
  Shopping: [
    { head: 'Buy Less, Buy Better', body: 'One quality item that lasts 5 years beats 5 cheap ones.' },
    { head: 'Repair Before Replace', body: 'Repairing electronics extends life and saves 200+ kg CO₂.' },
    { head: 'Buy Second-Hand', body: 'Thrift stores and resale apps save up to 90% of clothing CO₂.' },
    { head: 'Batch Online Orders', body: 'Group multiple purchases into one order to reduce delivery trips.' },
  ]
};

function buildTips(transport, food, energy, shopping) {
  const scores = { Transport: transport, Food: food, Energy: energy, Shopping: shopping };
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  let html = '';
  // Show tips for top 2 worst categories, 2 tips each
  for (let i = 0; i < 2; i++) {
    const cat = sorted[i][0];
    const tips = allTips[cat].slice(0, 2);
    tips.forEach(t => {
      html += `<div class="tip-item"><strong>${cat}: ${t.head}</strong>${t.body}</div>`;
    });
  }

  document.getElementById('tips-grid').innerHTML = html;
}

// ===== LEADERBOARD =====
const defaultLeaderboard = [
  { name: 'Priya S.',   score: 892,  badge: 'badge-eco', label: 'Eco Champion' },
  { name: 'Rahul M.',   score: 1240, badge: 'badge-eco', label: 'Green Warrior' },
  { name: 'Aisha K.',   score: 1580, badge: 'badge-eco', label: 'Green Warrior' },
  { name: 'Dev P.',     score: 2100, badge: 'badge-good', label: 'Getting There' },
  { name: 'Neha R.',    score: 2850, badge: 'badge-good', label: 'Getting There' },
];

function renderLeaderboard() {
  // Load saved entries from localStorage (best-effort)
  let entries = [...defaultLeaderboard];
  try {
    const saved = JSON.parse(localStorage.getItem('eco_leaderboard') || '[]');
    entries = [...entries, ...saved];
  } catch(e) {}

  // Sort
  entries.sort((a, b) => a.score - b.score);

  const rankLabels = ['gold', 'silver', 'bronze'];
  const container = document.getElementById('lb-rows');
  container.innerHTML = entries.slice(0, 8).map((e, i) => `
    <div class="lb-row">
      <div class="lb-rank ${rankLabels[i] || ''}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i+1)}</div>
      <div class="lb-name">${e.name}</div>
      <div class="lb-score">${e.score.toLocaleString('en-IN')} kg CO₂/yr</div>
      <div><span class="lb-badge ${e.badge}">${e.label}</span></div>
    </div>
  `).join('');
}

function addToLeaderboard() {
  const name = prompt('Enter your name for the leaderboard:');
  if (!name || !myFootprint) return;

  // Use Firebase if available, otherwise fall back gracefully
  if (typeof window.addToLeaderboardFirebase === 'function') {
    window.addToLeaderboardFirebase(name, myFootprint);
    document.getElementById('leaderboard-section').scrollIntoView({ behavior: 'smooth' });
    alert(`🎉 Added to leaderboard! Your footprint: ${myFootprint.toLocaleString('en-IN')} kg CO₂/year`);
  } else {
    // Fallback if Firebase hasn't loaded yet
    renderLeaderboard();
    alert(`🎉 Footprint recorded: ${myFootprint.toLocaleString('en-IN')} kg CO₂/year`);
  }
}

// ===== PLEDGES =====
const defaultPledges = [
  { name: 'Ananya', action: 'I will use public transport 3x/week' },
  { name: 'Vikram', action: 'I will plant 5 trees this year' },
  { name: 'Shreya', action: 'I will go meat-free 2 days/week' },
];

function renderPledges(pledges) {
  const container = document.getElementById('pledges-list');
  container.innerHTML = pledges.map(p => `
    <div class="pledge-item">
      <div class="pledge-avatar">${p.name.charAt(0).toUpperCase()}</div>
      <div><strong>${p.name}</strong> pledged: ${p.action}</div>
    </div>
  `).join('');
}

function addPledge() {
  const name = document.getElementById('pledge-name').value.trim();
  const action = document.getElementById('pledge-action').value;
  if (!name) { alert('Please enter your name!'); return; }

  // Use Firebase if available
  if (typeof window.addPledgeFirebase === 'function') {
    window.addPledgeFirebase(name, action);
  } else {
    // Fallback local render
    const container = document.getElementById('pledges-list');
    const el = document.createElement('div');
    el.className = 'pledge-item';
    el.innerHTML = `
      <div class="pledge-avatar">${name.charAt(0).toUpperCase()}</div>
      <div><strong>${name}</strong> pledged: ${action}</div>
    `;
    container.prepend(el);
  }

  document.getElementById('pledge-name').value = '';
  alert(`🌱 Thank you ${name}! Your pledge has been recorded.`);
}

// ===== RESET =====
function resetForm() {
  document.querySelectorAll('input[type="number"]').forEach(i => i.value = '');
  hasSolar = false;
  setSolar(false);
  goToStep(1);
  document.getElementById('calculator-section').scrollIntoView({ behavior: 'smooth' });
}

// ===== AI-STYLE LIFESTYLE ANALYZER (local, no external API) =====
// Runs entirely in-browser: parses keywords/numbers from free text and
// builds a tailored response. No API key, no rate limits, no network calls.

const aiExamples = [
  "I drive to work 20km every day, eat chicken or mutton most nights, and run AC for about 8 hours daily in summer. I rarely use public transport.",
  "I mostly cycle or walk for short trips, eat vegetarian 5 days a week, and have rooftop solar panels at home. I buy clothes rarely.",
  "I travel for work a lot, taking around 8 domestic flights a year. I eat out frequently and order food delivery almost every day."
];

function useExample(idx) {
  document.getElementById('ai-lifestyle-input').value = aiExamples[idx];
}

// Keyword banks per category, with a weight contribution to the estimate
const aiKeywordRules = {
  Transport: [
    { words: ['flight', 'fly', 'flying', 'airport', 'plane'], weight: 1400, note: 'frequent flights' },
    { words: ['drive', 'car', 'commute', 'commuting'], weight: 900, note: 'regular car use' },
    { words: ['bike', 'motorcycle', 'scooter', 'two-wheeler'], weight: 300, note: 'two-wheeler use' },
    { words: ['bus', 'metro', 'train', 'public transport'], weight: -250, note: 'public transport use' },
    { words: ['cycle', 'cycling', 'walk', 'walking'], weight: -300, note: 'walking/cycling' },
  ],
  Food: [
    { words: ['beef', 'mutton', 'red meat'], weight: 700, note: 'red meat consumption' },
    { words: ['chicken', 'fish', 'non-veg', 'non vegetarian', 'meat'], weight: 350, note: 'non-vegetarian diet' },
    { words: ['vegetarian', 'veg', 'vegan', 'plant-based', 'plant based'], weight: -300, note: 'plant-based diet' },
    { words: ['food delivery', 'order food', 'eat out', 'restaurant'], weight: 250, note: 'frequent food delivery/eating out' },
    { words: ['waste', 'wasted', 'leftover'], weight: 150, note: 'food waste' },
  ],
  Energy: [
    { words: ['ac', 'air conditioner', 'air conditioning'], weight: 600, note: 'heavy AC usage' },
    { words: ['solar', 'rooftop panel'], weight: -500, note: 'solar panel use' },
    { words: ['led', 'energy efficient', 'energy-efficient'], weight: -200, note: 'energy-efficient appliances' },
    { words: ['heater', 'geyser'], weight: 200, note: 'water heating' },
  ],
  Shopping: [
    { words: ['online order', 'amazon', 'delivery', 'shopping'], weight: 300, note: 'frequent online shopping' },
    { words: ['new clothes', 'clothing', 'fashion'], weight: 250, note: 'frequent clothing purchases' },
    { words: ['second-hand', 'secondhand', 'thrift', 'repair'], weight: -200, note: 'sustainable shopping habits' },
    { words: ['electronics', 'gadget', 'phone', 'laptop'], weight: 400, note: 'frequent electronics purchases' },
  ]
};

const tipBank = {
  Transport: [
    'Swap 2-3 car commutes a week for metro or bus — cuts transport emissions fast.',
    'Carpool with colleagues for your daily commute to halve your per-trip footprint.',
    'For trips under 2km, walk or cycle instead of driving.',
    'Choose trains over domestic flights where possible — up to 90% less CO₂.',
  ],
  Food: [
    'Try 2 meat-free days a week — a simple swap with a real annual impact.',
    'Choose chicken over red meat when you do eat meat — it emits 5x less CO₂.',
    'Plan meals ahead to cut food waste, which produces methane when it rots.',
    'Cook at home more often — delivery packaging and logistics add hidden emissions.',
  ],
  Energy: [
    'Set your AC to 24°C instead of 18-20°C — each degree saves roughly 6% power.',
    'Switch remaining bulbs to LED — 75% less energy, lasts far longer.',
    'Look into rooftop solar — even a small setup cuts your grid dependence a lot.',
    'Unplug devices on standby — they quietly add up over a year.',
  ],
  Shopping: [
    'Batch your online orders into fewer, larger deliveries to cut logistics emissions.',
    'Buy fewer, higher-quality clothing items that last several years.',
    'Repair electronics before replacing — manufacturing a new device is carbon-heavy.',
    'Try second-hand marketplaces for items you do not need brand new.',
  ]
};

function analyzeTextLocally(text) {
  const lower = text.toLowerCase();

  // Extract any numbers mentioned, to nudge the estimate based on scale
  const numbers = (lower.match(/\d+/g) || []).map(Number);
  const maxNumberMentioned = numbers.length ? Math.max(...numbers) : 0;

  const categoryScores = { Transport: 0, Food: 0, Energy: 0, Shopping: 0 };
  const matchedNotes = { Transport: [], Food: [], Energy: [], Shopping: [] };

  for (const [category, rules] of Object.entries(aiKeywordRules)) {
    for (const rule of rules) {
      const hit = rule.words.some(w => lower.includes(w));
      if (hit) {
        categoryScores[category] += rule.weight;
        matchedNotes[category].push(rule.note);
      }
    }
  }

  // Baseline so the number never looks like zero/empty even with sparse input
  const baseline = 900;
  let total = baseline + Object.values(categoryScores).reduce((a, b) => a + b, 0);

  // Light influence from any numbers the user typed (km, flights, hours etc.)
  if (maxNumberMentioned > 0) {
    total += Math.min(maxNumberMentioned * 8, 1200);
  }

  // Keep it in a believable range
  total = Math.max(600, Math.min(total, 9000));

  // Rank categories by score to find top 2 impact areas
  const ranked = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);
  const positiveCategories = ranked.filter(([, score]) => score > 0).map(([cat]) => cat);
  const negativeCategories = ranked.filter(([, score]) => score < 0).map(([cat]) => cat);
  const topCategories = positiveCategories.slice(0, 2);
  const finalTop = topCategories.length ? topCategories : ranked.slice(0, 2).map(([cat]) => cat);

  // Verdict based on total
  let verdict;
  if (total < 1500) {
    if (negativeCategories.length) {
      verdict = `Your described lifestyle points to a relatively low footprint — your habits around ${negativeCategories.join(' and ').toLowerCase()} are already making a real difference.`;
    } else {
      verdict = "Your described lifestyle points to a relatively low footprint — you're already making several good choices.";
    }
  } else if (total < 3000) {
    verdict = "Your footprint looks close to the national average, with a couple of clear areas to improve.";
  } else if (total < 5500) {
    verdict = "Your described habits suggest an above-average footprint, mainly driven by " + finalTop.join(' and ').toLowerCase() + ".";
  } else {
    verdict = "Your lifestyle as described carries a high footprint, with " + finalTop.join(' and ').toLowerCase() + " as the biggest contributors.";
  }

  // Build tips: prioritize categories the user did NOT already mention doing well
  const tips = [];
  const tipCategories = finalTop.filter(c => !negativeCategories.includes(c));
  if (tipCategories.length === 0) {
    // User is doing well everywhere mentioned — give light-touch maintenance tips
    // from whichever categories had no signal at all (neutral, score === 0)
    const neutral = ranked.filter(([, score]) => score === 0).map(([cat]) => cat);
    const pool = neutral.length ? neutral : Object.keys(tipBank);
    pool.slice(0, 2).forEach(cat => tips.push(tipBank[cat][0]));
  } else {
    tips.push(...tipBank[tipCategories[0]].slice(0, 2));
    if (tipCategories[1]) tips.push(tipBank[tipCategories[1]][0]);
  }
  const usedCats = tipCategories.length ? tipCategories : [];
  const remaining = Object.keys(tipBank).find(c => !usedCats.includes(c) && !negativeCategories.includes(c));
  if (remaining && tips.length < 4) tips.push(tipBank[remaining][0]);

  return {
    estimated_kg_co2_year: Math.round(total),
    top_categories: tipCategories.length ? tipCategories : finalTop,
    verdict,
    tips: tips.slice(0, 4)
  };
}

async function analyzeWithAI() {
  const input = document.getElementById('ai-lifestyle-input').value.trim();
  if (!input) {
    alert('Please describe your lifestyle first!');
    return;
  }

  // Show loading state
  document.getElementById('ai-placeholder').classList.add('hidden');
  document.getElementById('ai-output').classList.add('hidden');
  document.getElementById('ai-loading').classList.remove('hidden');
  document.getElementById('ai-btn-text').textContent = 'Analyzing...';
  document.querySelector('.ai-analyze-btn').disabled = true;

  // Simulate a realistic short "thinking" delay so it feels like a live analysis
  const thinkingTime = 900 + Math.random() * 700;

  try {
    await new Promise(resolve => setTimeout(resolve, thinkingTime));
    const result = analyzeTextLocally(input);
    renderAIOutput(result);
  } catch (err) {
    console.error('Analyzer error:', err);
    showAIError("Something went wrong analyzing your input. Please try rephrasing and try again.");
  } finally {
    document.getElementById('ai-loading').classList.add('hidden');
    document.getElementById('ai-btn-text').textContent = '✨ Analyze My Lifestyle';
    document.querySelector('.ai-analyze-btn').disabled = false;
  }
}

function renderAIOutput(data) {
  const output = document.getElementById('ai-output');
  output.innerHTML = `
    <div class="ai-output-header">
      <span class="ai-badge">✨ AI ANALYSIS</span>
    </div>
    <div class="ai-output-est">~${Math.round(data.estimated_kg_co2_year).toLocaleString('en-IN')} kg CO₂/year</div>
    <div class="ai-output-section">
      <h5>Verdict</h5>
      <p style="font-size:0.9rem; color:var(--gray-700); line-height:1.6;">${data.verdict}</p>
    </div>
    <div class="ai-output-section">
      <h5>Top Impact Areas</h5>
      <p style="font-size:0.9rem; color:var(--gray-700);">${data.top_categories.join(' & ')}</p>
    </div>
    <div class="ai-output-section">
      <h5>Personalized Action Plan</h5>
      <ul>${data.tips.map(t => `<li>${t}</li>`).join('')}</ul>
    </div>
  `;
  output.classList.remove('hidden');
}

function showAIError(message) {
  document.getElementById('ai-loading').classList.add('hidden');
  document.getElementById('ai-placeholder').classList.add('hidden');
  const output = document.getElementById('ai-output');
  output.innerHTML = `<div class="ai-error">⚠️ ${message}</div>`;
  output.classList.remove('hidden');
}


document.addEventListener('DOMContentLoaded', () => {
  // Add live update on all number inputs
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', updateLivePreviews);
  });

  // Init
  createParticles();
  animateCounter();

  // Firebase handles leaderboard and pledges loading automatically
  // Fallback rendering only if Firebase module hasn't loaded
  setTimeout(() => {
    const lbRows = document.getElementById('lb-rows');
    if (lbRows && lbRows.innerHTML.trim() === '') renderLeaderboard();
  }, 3000);

  // Activate step 1
  goToStep(1);

  // Scroll animation for awareness cards
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fact-card, .t-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
});
