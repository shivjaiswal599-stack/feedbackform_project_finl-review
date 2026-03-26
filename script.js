// ═══════════════════════════════════════════════════════
const API_URL = ''; // Empty = same domain (full-stack deployment)
//  script.js  —  HearMe Frontend Logic
//  Sections:
//    1. Particle Canvas
//    2. Tab Switching
//    3. Star Rating
//    4. Form Validation + POST to backend
//    5. Dashboard — load stats + feedbacks
//    6. Charts
//    7. Table render + filter + search
//    8. Delete
//    9. Modal
//   10. Toast
// ═══════════════════════════════════════════════════════

// ── 1. PARTICLE CANVAS ──────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx    = canvas.getContext('2d');
  let W, H, dots = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function spawnDots() {
    dots = [];
    const count = Math.floor((W * H) / 18000);
    for (let i = 0; i < count; i++) {
      dots.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        r:  Math.random() * 1.2 + 0.3,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        a:  Math.random() * 0.5 + 0.1
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    dots.forEach(d => {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0) d.x = W;
      if (d.x > W) d.x = 0;
      if (d.y < 0) d.y = H;
      if (d.y > H) d.y = 0;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 229, 255, ${d.a})`;
      ctx.fill();
    });

    // draw connections
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx   = dots[i].x - dots[j].x;
        const dy   = dots[i].y - dots[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = `rgba(0, 229, 255, ${0.06 * (1 - dist/100)})`;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); spawnDots(); });
  resize(); spawnDots(); draw();
})();

// ── ADMIN PASSWORD PROTECTION ─────────────────────────────
// Password is obfuscated - decode at runtime
const ADMIN_PASSWORD = atob('YWRtaW4xMjM='); // Base64 encoded 'admin123'
const ADMIN_KEY = 'hearme_admin_auth'; // localStorage key
let dashboardUnlocked = false;

// Create dashboard HTML dynamically (hidden from public)
function createDashboardPage() {
  if (document.getElementById('page-dashboard')) return;
  
  const dashboardHTML = `
  <main class="page" id="page-dashboard">
    <div class="page-intro">
      <p class="label-tag">// MISSION CONTROL</p>
      <h1 class="hero-title">FEEDBACK <span>DASHBOARD.</span></h1>
    </div>
    <div class="stats-row">
      <div class="stat-box"><div class="stat-num cyan" id="d-total">—</div><div class="stat-lbl">Total Signals</div></div>
      <div class="stat-box"><div class="stat-num pink" id="d-avg">—</div><div class="stat-lbl">Avg Rating</div></div>
      <div class="stat-box"><div class="stat-num green" id="d-today">—</div><div class="stat-lbl">Today</div></div>
      <div class="stat-box"><div class="stat-num orange" id="d-bugs">—</div><div class="stat-lbl">Bug Reports</div></div>
    </div>
    <div class="charts-row">
      <div class="glass-card chart-card"><p class="chart-title">// Category Breakdown</p><div id="cat-chart" class="bar-chart"></div></div>
      <div class="glass-card chart-card"><p class="chart-title">// Rating Distribution</p><div id="rating-chart" class="bar-chart"></div></div>
    </div>
    <div class="table-controls">
      <div class="filter-group">
        <span class="filter-lbl">Filter:</span>
        <button class="filter-btn active" data-cat="All">All</button>
        <button class="filter-btn" data-cat="General">General</button>
        <button class="filter-btn" data-cat="Bug">Bug</button>
        <button class="filter-btn" data-cat="Feature">Feature</button>
        <button class="filter-btn" data-cat="Praise">Praise</button>
      </div>
      <div class="right-controls">
        <input class="search-box" id="search-box" placeholder="⌕  Search..."/>
        <button class="refresh-btn" id="refresh-btn">↺ Refresh</button>
      </div>
    </div>
    <div class="table-card glass-card">
      <div class="table-head"><span>#</span><span>Sender / Message</span><span>Category</span><span>Rating</span><span>Date</span><span>Action</span></div>
      <div id="table-body"><div class="tbl-empty">⟳ Loading transmissions...</div></div>
    </div>
  </main>`;
  
  document.body.insertAdjacentHTML('beforeend', dashboardHTML);
  
  // Add event listeners for new elements
  document.querySelectorAll('#page-dashboard .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#page-dashboard .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.cat;
      renderTable();
    });
  });
  
  document.getElementById('search-box').addEventListener('input', renderTable);
  document.getElementById('refresh-btn').addEventListener('click', loadDashboard);
}

// Check if this device has been unlocked before
function checkAdminAccess() {
  const isUnlocked = localStorage.getItem(ADMIN_KEY);
  if (isUnlocked === 'true') {
    createDashboardPage();
    showDashboardTab();
    dashboardUnlocked = true;
    console.log('Admin access granted on this device');
  }
}

// Create and show dashboard tab
function showDashboardTab() {
  const tabsNav = document.querySelector('.tabs');
  if (document.querySelector('[data-tab="dashboard"]')) return;
  
  const dashboardTab = document.createElement('button');
  dashboardTab.className = 'tab-btn';
  dashboardTab.setAttribute('data-tab', 'dashboard');
  dashboardTab.innerHTML = '<span class="tab-icon">◉</span> Dashboard';
  dashboardTab.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    dashboardTab.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-dashboard').classList.add('active');
    loadDashboard();
  });
  tabsNav.appendChild(dashboardTab);
}

// Function to unlock dashboard
function unlockDashboard() {
  const password = prompt('Enter admin password:');
  if (password === ADMIN_PASSWORD) {
    dashboardUnlocked = true;
    localStorage.setItem(ADMIN_KEY, 'true');
    createDashboardPage();
    showDashboardTab();
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tab="dashboard"]').classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-dashboard').classList.add('active');
    loadDashboard();
    alert('Dashboard unlocked! This device now has permanent admin access.');
  } else {
    alert('Wrong password! Access denied.');
  }
}

// Check admin access on page load
checkAdminAccess();

// Secret key combination to unlock (Ctrl+Shift+D)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    unlockDashboard();
  }
});

// ── 2. TAB SWITCHING ────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // update button styles
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // switch page
    const target = btn.dataset.tab;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + target).classList.add('active');

    // load dashboard data when switching to it
    if (target === 'dashboard') loadDashboard();
  });
});

// ── 3. STAR RATING ──────────────────────────────────────
let selectedRating = 0;

document.querySelectorAll('.star-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedRating = parseInt(btn.dataset.v);
    updateStars(selectedRating);
    clearErr('err-rating');
  });

  // hover preview
  btn.addEventListener('mouseenter', () => updateStars(parseInt(btn.dataset.v)));
  btn.addEventListener('mouseleave', () => updateStars(selectedRating));
});

function updateStars(val) {
  document.querySelectorAll('.star-btn').forEach((b, i) => {
    b.classList.toggle('active', i < val);
  });
}

// ── ERROR HANDLING FUNCTIONS ───────────────────────────
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function clearErr(id) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = '';
    el.style.display = 'none';
  }
}

function clearAllErrors() {
  ['err-name', 'err-email', 'err-category', 'err-rating', 'err-message'].forEach(clearErr);
}

// ── 4. FORM VALIDATION + POST ────────────────────────────
document.getElementById('submit-btn').addEventListener('click', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  const name     = document.getElementById('inp-name').value.trim();
  const email    = document.getElementById('inp-email').value.trim();
  const message  = document.getElementById('inp-message').value.trim();
  
  // Get FRESH values from Extra-Features.js hidden inputs (or fallbacks)
  const categoryEl = document.getElementById('sig_category');
  const ratingEl = document.getElementById('sig_rating');
  
  // Read values fresh each time validation runs
  let category = '';
  if (categoryEl && categoryEl.value.trim()) {
    category = categoryEl.value.trim();
  } else {
    const catSelect = document.getElementById('inp-category');
    category = catSelect ? catSelect.value.trim() : '';
  }
  
  // Capitalize first letter of category
  if (category) {
    category = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  }
  
  // Get rating from slider or fallback
  let rawRating = 0;
  if (ratingEl && ratingEl.value) {
    rawRating = parseFloat(ratingEl.value);
  } else {
    rawRating = selectedRating;
  }
  let rating = Math.round(rawRating / 2); // 0-10 -> 0-5
  if (rating < 1) rating = 1;
  if (rating > 5) rating = 5;
  
  console.log('Category value:', category, 'from element:', categoryEl ? categoryEl.value : 'no sig_category');
  console.log('Rating value:', rating, 'from element:', ratingEl ? ratingEl.value : 'no sig_rating');

  // clear old errors
  clearAllErrors();

  let ok = true;

  if (!name) {
    showErr('err-name', '⚠ Name is required.');
    ok = false;
  }
  if (!email) {
    showErr('err-email', '⚠ Email is required.');
    ok = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showErr('err-email', '⚠ Enter a valid email address.');
    ok = false;
  }
  if (!category) {
    showErr('err-category', '⚠ Please select a category.');
    ok = false;
  }
  if (!rating || rating === 0) {
    showErr('err-rating', '⚠ Please select a rating.');
    ok = false;
  }
  if (!message) {
    showErr('err-message', '⚠ Message cannot be empty.');
    ok = false;
  }

  if (!ok) return;

  // ── Send POST request to Express backend ──
  const btn  = document.getElementById('submit-btn');
  const text = document.getElementById('btn-text');
  btn.disabled = true;
  text.textContent = '⟳  TRANSMITTING...';

  try {
    // Use XMLHttpRequest instead of fetch for better browser compatibility
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/feedback`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function() {
      console.log('XHR readyState:', xhr.readyState, 'status:', xhr.status);
      if (xhr.readyState === 4) {
        btn.disabled = false;
        text.textContent = 'SEND FEEDBACK';

        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const result = JSON.parse(xhr.responseText);
            console.log('Server response:', result);
            if (result.success) {
              // Clear ALL error messages first
              clearAllErrors();

              // Also hide any error elements that might still be visible
              ['err-name', 'err-email', 'err-category', 'err-rating', 'err-message'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
              });

              // Force show success message
              const toast = document.getElementById('toast');
              if (toast) {
                document.getElementById('toast-icon').textContent = '✅';
                document.getElementById('toast-title').textContent = 'SUCCESS!';
                document.getElementById('toast-body').textContent = 'Your feedback has been saved successfully!';
                toast.classList.remove('err');
                toast.classList.add('show');
                clearTimeout(toastTimer);
                toastTimer = setTimeout(() => {
                  toast.classList.remove('show');
                }, 5000); // Show for 5 seconds
              } else {
                alert('✅ SUCCESS! Your feedback has been saved successfully!');
              }

              // Reset form and update stats
              resetForm();
              loadSideStats();
            } else {
              showToast('⚠ SERVER ERROR', result.error || 'Something went wrong.', true);
            }
          } catch (e) {
            console.error('Parse error:', e, 'Response:', xhr.responseText);
            showToast('⚠ PARSE ERROR', 'Invalid response from server.', true);
          }
        } else {
          console.error('Server error:', xhr.status, xhr.statusText, 'Response:', xhr.responseText);
          let errorMsg = 'Cannot reach server. Is it running?';
          if (xhr.status === 0) {
            errorMsg = 'Network error: Cannot connect to server. Check if server is running on port 3000.';
          } else if (xhr.status === 404) {
            errorMsg = 'Server error: API endpoint not found.';
          } else {
            errorMsg = `Server error: ${xhr.status} ${xhr.statusText}`;
          }
          showToast('⚠ CONNECTION ERROR', errorMsg, true);
        }
      }
    };

    xhr.onerror = function() {
      btn.disabled = false;
      text.textContent = 'SEND FEEDBACK';
      showToast('⚠ NETWORK ERROR', 'Cannot connect to server. Check your connection.', true);
    };

    xhr.send(JSON.stringify({ name, email, category, rating: rating, message }));

  } catch (e) {
    console.error('Form submission error:', e);
    let errorMsg = 'Cannot reach server. Is it running?';
    
    if (e.name === 'TypeError' && e.message.includes('fetch')) {
      errorMsg = 'Network error: Cannot connect to server. Check if server is running on port 3000.';
    } else if (e.message.includes('CORS')) {
      errorMsg = 'CORS error: Browser blocking request. Try a different browser.';
    } else if (e.message.includes('NetworkError')) {
      errorMsg = 'Network error: Check your internet connection.';
    }
    
    showToast('⚠ CONNECTION ERROR', errorMsg, true);
    btn.disabled = false;
    text.textContent = 'SEND FEEDBACK';
  }
});

function resetForm() {
  ['inp-name','inp-email','inp-message'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('inp-category').value = '';
  selectedRating = 0;
  updateStars(0);
}

// Load side panel stats on form page
function loadSideStats() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `${API_URL}/api/stats`, true);
  
  xhr.onload = function() {
    if (xhr.status === 200) {
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.success) {
          const totalEl = document.getElementById('side-total');
          const avgEl = document.getElementById('side-avg');
          if (totalEl) totalEl.textContent = data.data.total;
          if (avgEl && data.data.avg) avgEl.textContent = data.data.avg;
        }
      } catch (e) {
        console.error('Stats parsing error:', e);
      }
    }
  };
  
  xhr.onerror = function() {
    console.error('Stats loading error: Cannot connect to server');
  };
  
  xhr.send();
}

loadSideStats();

let allFeedbacks   = [];
let activeFilter   = 'All';

function loadDashboard() {
  loadStats();
  loadFeedbacks();
}

function loadStats() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `${API_URL}/api/stats`, true);
  // No auth required anymore
  
  xhr.onload = function() {
    if (xhr.status === 200) {
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.success) {
          const { total, todayCount } = data.data;
          const totalEl = document.getElementById('d-total');
          const todayEl = document.getElementById('d-today');
          if (totalEl) totalEl.textContent = total;
          if (todayEl) todayEl.textContent = todayCount;
        }
      } catch (e) {
        console.error('Stats parsing error:', e);
      }
    }
  };
  
  xhr.send();
}

function loadFeedbacks() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `${API_URL}/api/feedback`, true);
  
  xhr.onload = function() {
    if (xhr.status === 200) {
      try {
        const data = JSON.parse(xhr.responseText);
        if (!data.success) return;
        allFeedbacks = data.data;
        renderTable();
      } catch (e) {
        console.error('Feedbacks parsing error:', e);
        document.getElementById('table-body').innerHTML =
          '<div class="tbl-empty">⚠ Error loading data.</div>';
      }
    } else {
      document.getElementById('table-body').innerHTML =
        '<div class="tbl-empty">⚠ Cannot connect to server.</div>';
    }
  };
  
  xhr.onerror = function() {
    document.getElementById('table-body').innerHTML =
      '<div class="tbl-empty">⚠ Cannot connect to server.</div>';
  };
  
  xhr.send();
}

// Refresh button
document.getElementById('refresh-btn').addEventListener('click', loadDashboard);

// ── 6. CHARTS ────────────────────────────────────────────
function renderCatChart(catResult) {
  const cats   = ['General','Bug','Feature','Praise'];
  const colors = { General:'#3a4a70', Bug:'#ff2d55', Feature:'#00e5ff', Praise:'#00ffb3' };
  const max    = Math.max(...catResult.map(c => c.count), 1);

  document.getElementById('cat-chart').innerHTML = cats.map(cat => {
    const obj = catResult.find(c => c._id === cat);
    const cnt = obj ? obj.count : 0;
    const pct = ((cnt / max) * 100).toFixed(1);
    return `
      <div class="bar-row">
        <span class="bar-key">${cat}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:0%; background:${colors[cat]}"
               data-target="${pct}"></div>
        </div>
        <span class="bar-count">${cnt}</span>
      </div>`;
  }).join('');

  // animate after paint
  requestAnimationFrame(() => {
    document.querySelectorAll('#cat-chart .bar-fill').forEach(el => {
      el.style.width = el.dataset.target + '%';
    });
  });
}

function renderRatingChart(ratingResult) {
  const max    = Math.max(...ratingResult.map(r => r.count), 1);
  const colors = ['#ff2d55','#ff7b00','#ff7b00','#00ffb3','#00ffb3'];

  document.getElementById('rating-chart').innerHTML = [1,2,3,4,5].map(star => {
    const obj = ratingResult.find(r => r._id === star);
    const cnt = obj ? obj.count : 0;
    const pct = ((cnt / max) * 100).toFixed(1);
    return `
      <div class="bar-row">
        <span class="bar-key">${star} Star${star > 1 ? 's':''}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:0%; background:${colors[star-1]}"
               data-target="${pct}"></div>
        </div>
        <span class="bar-count">${cnt}</span>
      </div>`;
  }).join('');

  requestAnimationFrame(() => {
    document.querySelectorAll('#rating-chart .bar-fill').forEach(el => {
      el.style.width = el.dataset.target + '%';
    });
  });
}


// ── 7. TABLE ─────────────────────────────────────────────
// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.cat;
    renderTable();
  });
});

// Search
document.getElementById('search-box').addEventListener('input', renderTable);

function renderTable() {
  const search = document.getElementById('search-box').value.toLowerCase();
  const body   = document.getElementById('table-body');

  const list = allFeedbacks.filter(f => {
    const matchCat = activeFilter === 'All' || f.category === activeFilter;
    const matchQ   = !search ||
      f.name.toLowerCase().includes(search)    ||
      f.message.toLowerCase().includes(search) ||
      f.email.toLowerCase().includes(search);
    return matchCat && matchQ;
  });

  if (list.length === 0) {
    body.innerHTML = '<div class="tbl-empty">∅ No transmissions found.</div>';
    return;
  }

  // badge class map
  const badgeMap = { General:'b-general', Bug:'b-bug', Feature:'b-feature', Praise:'b-praise' };
  // rating colour class
  const rClass   = r => r >= 4 ? 'r' + r : r === 3 ? 'r3' : 'r' + r;

  body.innerHTML = list.map((f, i) => {
    const date = new Date(f.createdAt).toLocaleDateString('en', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    return `
      <div class="tbl-row" onclick="openModal('${f._id}')">
        <span class="tbl-id">${String(i+1).padStart(2,'0')}</span>
        <span>
          <div class="tbl-name">${f.name}</div>
          <div class="tbl-preview">${f.message}</div>
        </span>
        <span><span class="badge ${badgeMap[f.category]}">${f.category}</span></span>
        <span class="tbl-rating ${rClass(f.rating)}">${f.rating}/5</span>
        <span class="tbl-date">${date}</span>
        <span>
          <button class="del-btn" onclick="deleteFeedback(event,'${f._id}')">Delete</button>
        </span>
      </div>`;
  }).join('');
}


// ── 8. DELETE ─────────────────────────────────────────────
function deleteFeedback(e, id) {
  e.stopPropagation();           // don't open modal
  if (!confirm('Delete this feedback?')) return;

  const xhr = new XMLHttpRequest();
  xhr.open('DELETE', `${API_URL}/api/feedback/${id}`, true);
  xhr.setRequestHeader('Authorization', 'Bearer admin123');
  
  xhr.onload = function() {
    if (xhr.status === 401) {
      alert('Unauthorized! Please unlock dashboard first.');
      return;
    }
    if (xhr.status === 200) {
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.success) {
          allFeedbacks = allFeedbacks.filter(f => f._id !== id);
          renderTable();
          loadStats();               // refresh charts + counts
          showToast('◈ DELETED', 'Feedback removed successfully.', false);
        } else {
          showToast('⚠ ERROR', 'Could not delete feedback.', true);
        }
      } catch (e) {
        showToast('⚠ ERROR', 'Invalid response from server.', true);
      }
    } else {
      showToast('⚠ ERROR', 'Could not delete. Server error.', true);
    }
  };
  
  xhr.onerror = function() {
    showToast('⚠ ERROR', 'Could not delete. Server unreachable.', true);
  };
  
  xhr.send();
}


// ── 9. MODAL ─────────────────────────────────────────────
function openModal(id) {
  const f = allFeedbacks.find(f => f._id === id);
  if (!f) return;

  const stars = '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating);
  const date  = new Date(f.createdAt).toLocaleString();

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-field">
      <div class="modal-lbl">// Name</div>
      <div class="modal-val">${f.name}</div>
    </div>
    <div class="modal-field">
      <div class="modal-lbl">// Email</div>
      <div class="modal-val">${f.email}</div>
    </div>
    <div class="modal-field">
      <div class="modal-lbl">// Category</div>
      <div class="modal-val">${f.category}</div>
    </div>
    <div class="modal-field">
      <div class="modal-lbl">// Rating</div>
      <div class="modal-val" style="color:var(--cyan);font-size:1.1rem;letter-spacing:0.1em">${stars} &nbsp;${f.rating}/5</div>
    </div>
    <div class="modal-field">
      <div class="modal-lbl">// Message</div>
      <div class="modal-val">${f.message}</div>
    </div>
    <div class="modal-field">
      <div class="modal-lbl">// Submitted</div>
      <div class="modal-val">${date}</div>
    </div>
  `;

  document.getElementById('modal-bg').classList.add('open');
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-bg').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-bg')) closeModal();
});
function closeModal() {
  document.getElementById('modal-bg').classList.remove('open');
}


// ── 10. TOAST ────────────────────────────────────────────
let toastTimer;
function showToast(title, body, isErr) {
  const toast = document.getElementById('toast');
  if (!toast) {
    console.error('Toast element not found! Using alert fallback.');
    alert(isErr ? `❌ ${title}: ${body}` : `✅ ${title}: ${body}`);
    return;
  }

  // Clear any existing timer
  clearTimeout(toastTimer);

  // Update content
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-body').textContent = body;

  // Update styling
  toast.classList.toggle('err', isErr);
  toast.classList.add('show');

  // Auto-hide after 4 seconds
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}