/* ============================================================
   APP.JS — GIF Description Practice (main application logic)
   ============================================================
   This file handles:
     - Hash-based routing (#page/1, #page/2, #grid)
     - Rendering the current page (GIF, questions, answers)
     - Navigation (next/prev buttons, keyboard arrows, pagination)
     - Answer reveal toggling (individual + show/hide all)
     - Sidebar menu with search/filter
     - Grid / gallery view with lazy loading
   ============================================================ */

// ---- DOM REFERENCES ----

const mainEl          = document.getElementById('main');
const prevBtn         = document.getElementById('prevBtn');
const nextBtn         = document.getElementById('nextBtn');
const menuBtn         = document.getElementById('menuBtn');
const sidebar         = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const sidebarClose    = document.getElementById('sidebarClose');
const sidebarSearch   = document.getElementById('sidebarSearch');
const sidebarList     = document.getElementById('sidebarList');
const galleryBtn      = document.getElementById('galleryBtn');

// ---- STATE ----

let currentPageIndex = 0;   // index in the `pages` array (0-based)
let currentView      = 'page'; // 'page' or 'grid'
let sidebarOpen      = false;

// ============================================================
//  ROUTING — read & write the URL hash
// ============================================================

/**
 * Parse the hash into a route descriptor.
 * Supports:  #page/1  (1-based id)  |  #grid
 * Falls back to { view: 'page', index: 0 } for invalid hashes.
 */
function parseHash() {
  const hash = window.location.hash;

  if (hash === '#grid') {
    return { view: 'grid' };
  }

  const match = hash.match(/^#page\/(\d+)$/);
  if (match) {
    const id    = parseInt(match[1], 10);
    const index = pages.findIndex(p => p.id === id);
    if (index !== -1) return { view: 'page', index: index };
  }

  return { view: 'page', index: 0 };
}

/**
 * Update the URL hash without triggering a full page reload.
 */
function setHash(value) {
  window.location.hash = value;
}

// ============================================================
//  RENDERING — build the HTML for the current page
// ============================================================

/**
 * Render the full page view for `pages[index]`.
 */
function renderPage(index) {
  const page = pages[index];
  if (!page) return;

  currentView      = 'page';
  currentPageIndex = index;

  // Restore desktop arrows (may have been hidden by grid view)
  prevBtn.style.display = '';
  nextBtn.style.display = '';

  // Remove grid-wide layout class
  mainEl.classList.remove('main--grid');

  // Update gallery button state
  galleryBtn.classList.remove('header-btn--active');

  // Update hash if it doesn't already match
  const expectedHash = `#page/${page.id}`;
  if (window.location.hash !== expectedHash) {
    setHash(`page/${page.id}`);
  }

  // Build questions HTML
  const questionsHTML = page.questions.map((q, i) => `
    <div class="question-card">
      <span class="question-label">Q${i + 1}</span>
      <p class="question-text">${escapeHTML(q.question)}</p>
      <button class="show-answer-btn" data-index="${i}" aria-expanded="false">
        Show Answer
      </button>
      <div class="answer-wrapper" id="answer-${i}">
        <p class="answer-text">${escapeHTML(q.answer)}</p>
      </div>
    </div>
  `).join('');

  // Full page HTML
  mainEl.innerHTML = `
    <!-- Page header with number + title -->
    <div class="page-header">
      <span class="page-number">#${page.id}</span>
      <h2 class="page-title">${escapeHTML(page.title)}</h2>
    </div>

    <!-- GIF with loading shimmer -->
    <div class="gif-container" id="gifContainer">
      <div class="shimmer" id="gifShimmer">
        <span class="shimmer-icon">🎞️</span>
      </div>
      <img
        src="${page.gifUrl}"
        alt="GIF: ${escapeHTML(page.title)}"
        id="gifImage"
      >
    </div>

    <!-- Mobile navigation (shown below GIF on small screens) -->
    <div class="mobile-nav">
      <button class="mobile-nav-btn" id="mobilePrev" ${index === 0 ? 'disabled' : ''}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        Prev
      </button>
      <span class="page-indicator">${index + 1} / ${pages.length}</span>
      <button class="mobile-nav-btn" id="mobileNext" ${index === pages.length - 1 ? 'disabled' : ''}>
        Next
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>
      </button>
    </div>

    <!-- Toggle all answers -->
    <div class="toggle-all-wrapper">
      <button class="toggle-all-btn" id="toggleAllBtn">Show All Answers</button>
    </div>

    <!-- Question cards -->
    <div class="questions-list">
      ${questionsHTML}
    </div>

    <!-- Pagination -->
    ${buildPaginationHTML(index)}
  `;

  // ---- Post-render setup ----
  setupGifLoading();
  setupAnswerButtons();
  setupToggleAll();
  setupMobileNav();
  updateDesktopArrows();
  setupPagination();

  // Update sidebar highlight if it's open
  if (sidebarOpen) {
    populateSidebarList(sidebarSearch.value);
  }

  // Scroll to top when navigating to a new page
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
//  GRID / GALLERY VIEW
// ============================================================

/**
 * Render the gallery grid showing all pages as thumbnail cards.
 * Uses Intersection Observer for lazy-loading GIF thumbnails.
 */
function renderGrid() {
  currentView = 'grid';

  // Update hash
  if (window.location.hash !== '#grid') {
    setHash('grid');
  }

  // Hide desktop nav arrows in grid view
  prevBtn.style.display = 'none';
  nextBtn.style.display = 'none';

  // Widen the main container for the grid
  mainEl.classList.add('main--grid');

  // Mark gallery button as active
  galleryBtn.classList.add('header-btn--active');

  const cardsHTML = pages.map(page => `
    <a class="grid-card" href="#page/${page.id}">
      <div class="grid-card-thumb">
        <img
          class="grid-card-img"
          data-src="${page.gifUrl}"
          alt="GIF: ${escapeHTML(page.title)}"
        >
        <div class="grid-card-shimmer">
          <span class="shimmer-icon">🎞️</span>
        </div>
      </div>
      <div class="grid-card-info">
        <span class="grid-card-num">#${page.id}</span>
        <span class="grid-card-title">${escapeHTML(page.title)}</span>
      </div>
    </a>
  `).join('');

  mainEl.innerHTML = `
    <div class="grid-header">
      <h2 class="grid-heading">All GIFs</h2>
      <span class="grid-count">${pages.length} pages</span>
    </div>
    <div class="grid-container" id="gridContainer">
      ${cardsHTML}
    </div>
  `;

  setupGridLazyLoading();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Set up Intersection Observer to lazy-load GIF thumbnails
 * as they scroll into view. Only visible cards load their GIF.
 */
function setupGridLazyLoading() {
  const container = document.getElementById('gridContainer');
  if (!container) return;

  const images = container.querySelectorAll('.grid-card-img');

  // Fallback for very old browsers without IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    images.forEach(img => { img.src = img.dataset.src; });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;

        img.addEventListener('load', () => {
          const shimmer = img.parentElement.querySelector('.grid-card-shimmer');
          if (shimmer) shimmer.classList.add('hidden');
        });
        img.addEventListener('error', () => {
          const shimmer = img.parentElement.querySelector('.grid-card-shimmer');
          if (shimmer) shimmer.classList.add('hidden');
        });

        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '200px 0px',  // pre-load 200px before visible
    threshold: 0.01
  });

  images.forEach(img => observer.observe(img));
}

// ============================================================
//  PAGINATION — smart ellipsis page numbers
// ============================================================

/**
 * Generate an array of page numbers and '...' markers.
 * Always shows first page, last page, and ±delta pages around current.
 * Example: [1, '...', 5, 6, 7, 8, 9, '...', 50]
 *
 * @param {number} current - 1-based current page number
 * @param {number} total   - total number of pages
 * @param {number} delta   - pages to show on each side of current
 */
function buildPaginationRange(current, total, delta) {
  delta = delta || 2;
  const range = [];
  const left  = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);

  if (left > 2) range.push('...');

  for (let i = left; i <= right; i++) {
    range.push(i);
  }

  if (right < total - 1) range.push('...');

  if (total > 1) range.push(total);

  return range;
}

/**
 * Build the pagination nav HTML for the given page index.
 */
function buildPaginationHTML(currentIndex) {
  const total = pages.length;
  if (total <= 1) return '';

  const current = currentIndex + 1; // convert 0-based to 1-based
  const items   = buildPaginationRange(current, total, 2);

  let html = '<nav class="pagination" aria-label="Page navigation">';

  // Previous arrow
  html += `<button class="pagination-btn pagination-arrow" data-page="${current - 1}"
           ${current === 1 ? 'disabled' : ''} aria-label="Previous page">&larr;</button>`;

  // Page numbers and ellipses
  items.forEach(item => {
    if (item === '...') {
      html += '<span class="pagination-ellipsis">&hellip;</span>';
    } else {
      const isActive = item === current;
      html += `<button class="pagination-btn ${isActive ? 'pagination-btn--active' : ''}"
               data-page="${item}" ${isActive ? 'aria-current="page"' : ''}>${item}</button>`;
    }
  });

  // Next arrow
  html += `<button class="pagination-btn pagination-arrow" data-page="${current + 1}"
           ${current === total ? 'disabled' : ''} aria-label="Next page">&rarr;</button>`;

  html += '</nav>';
  return html;
}

/**
 * Attach click handler to pagination buttons (event delegation).
 */
function setupPagination() {
  const pagination = mainEl.querySelector('.pagination');
  if (!pagination) return;

  pagination.addEventListener('click', (e) => {
    const btn = e.target.closest('.pagination-btn');
    if (!btn || btn.disabled) return;

    const pageNum = parseInt(btn.dataset.page, 10);
    if (isNaN(pageNum)) return;

    renderPage(pageNum - 1); // convert 1-based to 0-based
  });
}

// ============================================================
//  GIF LOADING
// ============================================================

function setupGifLoading() {
  const img     = document.getElementById('gifImage');
  const shimmer = document.getElementById('gifShimmer');

  if (!img || !shimmer) return;

  // If the image is already cached, hide shimmer immediately
  if (img.complete && img.naturalWidth > 0) {
    shimmer.classList.add('hidden');
    return;
  }

  img.addEventListener('load', () => {
    shimmer.classList.add('hidden');
  });

  // On error, still hide shimmer so the broken-image icon shows
  img.addEventListener('error', () => {
    shimmer.classList.add('hidden');
  });
}

// ============================================================
//  ANSWER TOGGLING
// ============================================================

function setupAnswerButtons() {
  const buttons = mainEl.querySelectorAll('.show-answer-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const i       = btn.getAttribute('data-index');
      const wrapper = document.getElementById(`answer-${i}`);
      const isOpen  = wrapper.classList.contains('open');

      if (isOpen) {
        wrapper.classList.remove('open');
        btn.textContent = 'Show Answer';
        btn.setAttribute('aria-expanded', 'false');
      } else {
        wrapper.classList.add('open');
        btn.textContent = 'Hide Answer';
        btn.setAttribute('aria-expanded', 'true');
      }

      syncToggleAllLabel();
    });
  });
}

function setupToggleAll() {
  const toggleBtn = document.getElementById('toggleAllBtn');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const wrappers = mainEl.querySelectorAll('.answer-wrapper');
    const buttons  = mainEl.querySelectorAll('.show-answer-btn');
    const allOpen  = [...wrappers].every(w => w.classList.contains('open'));

    if (allOpen) {
      wrappers.forEach(w => w.classList.remove('open'));
      buttons.forEach(b => {
        b.textContent = 'Show Answer';
        b.setAttribute('aria-expanded', 'false');
      });
      toggleBtn.textContent = 'Show All Answers';
    } else {
      wrappers.forEach(w => w.classList.add('open'));
      buttons.forEach(b => {
        b.textContent = 'Hide Answer';
        b.setAttribute('aria-expanded', 'true');
      });
      toggleBtn.textContent = 'Hide All Answers';
    }
  });
}

/**
 * Keep the "Show All / Hide All" label accurate after
 * individual answers are toggled.
 */
function syncToggleAllLabel() {
  const toggleBtn = document.getElementById('toggleAllBtn');
  if (!toggleBtn) return;

  const wrappers = mainEl.querySelectorAll('.answer-wrapper');
  const allOpen  = [...wrappers].every(w => w.classList.contains('open'));

  toggleBtn.textContent = allOpen ? 'Hide All Answers' : 'Show All Answers';
}

// ============================================================
//  SIDEBAR MENU
// ============================================================

function openSidebar() {
  sidebarOpen = true;
  sidebar.classList.add('open');
  sidebarBackdrop.classList.add('visible');
  sidebar.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  sidebarSearch.value = '';
  populateSidebarList('');
  sidebarSearch.focus();

  // Scroll the active item into view
  requestAnimationFrame(() => {
    const activeItem = sidebarList.querySelector('.sidebar-item--active');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  });
}

function closeSidebar() {
  sidebarOpen = false;
  sidebar.classList.remove('open');
  sidebarBackdrop.classList.remove('visible');
  sidebar.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/**
 * Populate the sidebar page list, filtered by a search string.
 * Matches against page title and page number.
 */
function populateSidebarList(filter) {
  const lowerFilter = filter.toLowerCase().trim();

  const filtered = pages
    .map((p, idx) => ({ page: p, index: idx }))
    .filter(item => {
      if (!lowerFilter) return true;
      return (
        item.page.title.toLowerCase().includes(lowerFilter) ||
        String(item.page.id).includes(lowerFilter)
      );
    });

  if (filtered.length === 0) {
    sidebarList.innerHTML = '<p class="sidebar-empty">No pages found.</p>';
    return;
  }

  sidebarList.innerHTML = filtered.map(item => {
    const isActive = currentView === 'page' && item.index === currentPageIndex;
    return `
      <button class="sidebar-item ${isActive ? 'sidebar-item--active' : ''}"
              data-index="${item.index}">
        <span class="sidebar-item-num">#${item.page.id}</span>
        <span class="sidebar-item-title">${escapeHTML(item.page.title)}</span>
      </button>
    `;
  }).join('');
}

// Sidebar event listeners (set up once)
menuBtn.addEventListener('click', () => {
  sidebarOpen ? closeSidebar() : openSidebar();
});

sidebarBackdrop.addEventListener('click', closeSidebar);
sidebarClose.addEventListener('click', closeSidebar);

sidebarSearch.addEventListener('input', (e) => {
  populateSidebarList(e.target.value);
});

// Event delegation for sidebar page items
sidebarList.addEventListener('click', (e) => {
  const item = e.target.closest('.sidebar-item');
  if (!item) return;

  const index = parseInt(item.dataset.index, 10);
  closeSidebar();
  renderPage(index);
});

// ============================================================
//  GALLERY BUTTON
// ============================================================

galleryBtn.addEventListener('click', () => {
  if (currentView === 'grid') {
    renderPage(currentPageIndex);
  } else {
    renderGrid();
  }
});

// ============================================================
//  NAVIGATION
// ============================================================

/** Go to the previous page (if possible). */
function goPrev() {
  if (currentView !== 'page') return;
  if (currentPageIndex > 0) {
    renderPage(currentPageIndex - 1);
  }
}

/** Go to the next page (if possible). */
function goNext() {
  if (currentView !== 'page') return;
  if (currentPageIndex < pages.length - 1) {
    renderPage(currentPageIndex + 1);
  }
}

/** Mobile inline nav buttons. */
function setupMobileNav() {
  const prev = document.getElementById('mobilePrev');
  const next = document.getElementById('mobileNext');

  if (prev) prev.addEventListener('click', goPrev);
  if (next) next.addEventListener('click', goNext);
}

/** Desktop fixed side arrows — enable/disable based on position. */
function updateDesktopArrows() {
  prevBtn.disabled = (currentPageIndex === 0);
  nextBtn.disabled = (currentPageIndex === pages.length - 1);
}

// Desktop arrow click handlers (set up once)
prevBtn.addEventListener('click', goPrev);
nextBtn.addEventListener('click', goNext);

// Keyboard navigation (Left / Right arrow keys + ESC for sidebar)
document.addEventListener('keydown', (e) => {
  // ESC closes sidebar
  if (e.key === 'Escape' && sidebarOpen) {
    closeSidebar();
    return;
  }

  // Don't hijack arrows if user is typing in an input/textarea
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  // No arrow nav in grid view
  if (currentView !== 'page') return;

  if (e.key === 'ArrowLeft')  goPrev();
  if (e.key === 'ArrowRight') goNext();
});

// ============================================================
//  HASH CHANGE LISTENER
//  Handles browser back/forward buttons
// ============================================================

window.addEventListener('hashchange', () => {
  // Close sidebar on any navigation
  if (sidebarOpen) closeSidebar();

  const route = parseHash();

  if (route.view === 'grid') {
    if (currentView !== 'grid') {
      renderGrid();
    }
  } else {
    if (currentView !== 'page' || route.index !== currentPageIndex) {
      renderPage(route.index);
    }
  }
});

// ============================================================
//  UTILITY
// ============================================================

/**
 * Basic HTML escaping to prevent accidental injection
 * from data.js content. Not a security measure (we trust
 * our own data), just good practice.
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ============================================================
//  BOOT — render the initial view on load
// ============================================================

(function init() {
  const route = parseHash();
  if (route.view === 'grid') {
    renderGrid();
  } else {
    renderPage(route.index);
  }
})();
