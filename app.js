/* ============================================================
   APP.JS — GIF Description Practice (main application logic)
   ============================================================
   This file handles:
     - Hash-based routing (#page/1, #page/2, #grid, #grid/2, …)
     - Rendering the current page (GIF, questions, answers)
     - GIF pause/play via canvas freeze
     - Navigation (next/prev arrows, keyboard, pagination)
     - Answer reveal toggling (individual + show/hide all)
     - Sidebar menu with search
     - Grid / gallery view with lazy-loaded thumbnails
     - Dark mode (localStorage + system preference)
   ============================================================
   CHANGELOG:
     - Added: parseHash() replaces getPageIndexFromHash() to
       support both #page/N and #grid/N routes.
     - Added: route() as central dispatcher.
     - Added: sidebar (open/close/search/highlight).
     - Added: GIF pause/play via canvas (setupGifPausePlay).
     - Added: numbered pagination with smart ellipsis.
     - Added: grid/gallery view with IntersectionObserver lazy load.
     - Added: gallery toggle button.
     - Added: dark mode toggle with soft navy-slate palette.
     - Removed: random page button.
   ============================================================ */

// ============================================================
//  DOM REFERENCES
// ============================================================

const mainEl          = document.getElementById('main');
const prevBtn         = document.getElementById('prevBtn');
const nextBtn         = document.getElementById('nextBtn');
const galleryBtn      = document.getElementById('galleryBtn');
const darkModeBtn     = document.getElementById('darkModeBtn');
const hamburgerBtn    = document.getElementById('hamburgerBtn');
const sidebarEl       = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
const sidebarSearch   = document.getElementById('sidebarSearch');
const sidebarListEl   = document.getElementById('sidebarList');

// ============================================================
//  STATE
// ============================================================

let currentPageIndex = 0;   // which page from `pages` is shown (0-based)
let currentView      = 'page';  // 'page' or 'grid'
let currentGridPage  = 1;   // which "page" of the gallery grid
let gifPaused        = false;
let sidebarOpen      = false;

// ============================================================
//  CONSTANTS
// ============================================================

const GRID_PAGE_SIZE = 24;  // thumbnails per grid page

// ============================================================
//  ROUTING — parse and set the URL hash
// ============================================================

/**
 * Parse the current hash to determine what to display.
 * Supported formats:
 *   #page/3   → page view, page with id 3
 *   #grid     → gallery view, first grid page
 *   #grid/2   → gallery view, second grid page
 *   (empty)   → defaults to first page
 *
 * Returns an object: { view, pageIndex, gridPage }
 */
function parseHash() {
  const hash = window.location.hash;

  // Grid / gallery view
  const gridMatch = hash.match(/^#grid(?:\/(\d+))?$/);
  if (gridMatch) {
    const gp = gridMatch[1] ? parseInt(gridMatch[1], 10) : 1;
    return { view: 'grid', pageIndex: currentPageIndex, gridPage: Math.max(1, gp) };
  }

  // Page view
  const pageMatch = hash.match(/^#page\/(\d+)$/);
  if (pageMatch) {
    const id    = parseInt(pageMatch[1], 10);
    const index = pages.findIndex(p => p.id === id);
    return { view: 'page', pageIndex: index !== -1 ? index : 0, gridPage: currentGridPage };
  }

  // Default — first page
  return { view: 'page', pageIndex: 0, gridPage: 1 };
}

/**
 * Navigate to a specific page by its index in the pages array.
 * Sets the hash, which triggers hashchange → route().
 */
function navigateToPage(index) {
  if (index >= 0 && index < pages.length) {
    window.location.hash = `#page/${pages[index].id}`;
  }
}

/**
 * Navigate to a specific grid page.
 * Sets the hash, which triggers hashchange → route().
 */
function navigateToGrid(gridPage) {
  gridPage = gridPage || 1;
  window.location.hash = gridPage <= 1 ? '#grid' : `#grid/${gridPage}`;
}

// ============================================================
//  CENTRAL ROUTER — called on every hash change
// ============================================================

/**
 * Reads the hash, updates state, and renders the correct view.
 * All navigation ultimately flows through here.
 */
function route() {
  const parsed = parseHash();

  if (parsed.view === 'grid') {
    currentView     = 'grid';
    currentGridPage = parsed.gridPage;

    mainEl.classList.add('main--grid');
    renderGrid(parsed.gridPage);
    hideNavArrows();
    galleryBtn.classList.add('active');
  } else {
    currentView      = 'page';
    currentPageIndex = parsed.pageIndex;

    mainEl.classList.remove('main--grid');
    renderPage(parsed.pageIndex);
    showNavArrows();
    galleryBtn.classList.remove('active');
  }

  updateSidebarHighlight();
}

// ============================================================
//  SIDEBAR
// ============================================================

function openSidebar() {
  sidebarOpen = true;
  sidebarEl.classList.add('open');
  sidebarBackdrop.classList.add('visible');
  document.body.classList.add('sidebar-open');
  hamburgerBtn.setAttribute('aria-expanded', 'true');

  // Focus the search input for quick typing
  setTimeout(() => sidebarSearch.focus(), 100);

  updateSidebarHighlight();
}

function closeSidebar() {
  sidebarOpen = false;
  sidebarEl.classList.remove('open');
  sidebarBackdrop.classList.remove('visible');
  document.body.classList.remove('sidebar-open');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
}

function toggleSidebar() {
  sidebarOpen ? closeSidebar() : openSidebar();
}

/**
 * Populate (or re-populate) the sidebar list.
 * If `filter` is provided, only show matching pages.
 */
function populateSidebar(filter) {
  filter = (filter || '').toLowerCase().trim();
  sidebarListEl.innerHTML = '';

  let matchCount = 0;

  pages.forEach((page, index) => {
    const searchText = `#${page.id} ${page.title}`.toLowerCase();
    if (filter && !searchText.includes(filter)) return;

    matchCount++;

    const li = document.createElement('li');
    li.className = 'sidebar-item';
    li.dataset.index = index;
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');

    li.innerHTML =
      '<span class="sidebar-item-number">#' + page.id + '</span>' +
      '<span class="sidebar-item-title">' + escapeHTML(page.title) + '</span>';

    // Click to navigate
    li.addEventListener('click', () => {
      navigateToPage(index);
      closeSidebar();
    });

    // Enter key also navigates
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        navigateToPage(index);
        closeSidebar();
      }
    });

    sidebarListEl.appendChild(li);
  });

  // Show "no results" if search yields nothing
  if (matchCount === 0 && filter) {
    const empty = document.createElement('li');
    empty.className = 'sidebar-no-results';
    empty.textContent = 'No pages found.';
    sidebarListEl.appendChild(empty);
  }

  updateSidebarHighlight();
}

/**
 * Highlight the current page in the sidebar list.
 */
function updateSidebarHighlight() {
  const items = sidebarListEl.querySelectorAll('.sidebar-item');
  items.forEach(item => {
    const idx = parseInt(item.dataset.index, 10);
    const isActive = (currentView === 'page' && idx === currentPageIndex);
    item.classList.toggle('active', isActive);
  });
}

// Sidebar event listeners (set up once)
hamburgerBtn.addEventListener('click', toggleSidebar);
sidebarCloseBtn.addEventListener('click', closeSidebar);
sidebarBackdrop.addEventListener('click', closeSidebar);

sidebarSearch.addEventListener('input', () => {
  populateSidebar(sidebarSearch.value);
});

// ============================================================
//  PAGE RENDERING
// ============================================================

/**
 * Render the full page view for pages[index].
 */
function renderPage(index) {
  const page = pages[index];
  if (!page) return;

  currentPageIndex = index;
  gifPaused = false;

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

  // Pause/play SVG icons
  const pauseIconSVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="white">' +
    '<rect x="6" y="4" width="4" height="16" rx="1"></rect>' +
    '<rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>';
  const playIconSVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="white">' +
    '<polygon points="7,4 21,12 7,20"></polygon></svg>';

  // Assemble full page HTML
  mainEl.innerHTML = `
    <!-- Page header: number + title -->
    <div class="page-header">
      <span class="page-number">#${page.id}</span>
      <h2 class="page-title">${escapeHTML(page.title)}</h2>
    </div>

    <!-- GIF with loading shimmer + pause/play overlay -->
    <div class="gif-container" id="gifContainer">
      <div class="shimmer" id="gifShimmer">
        <span class="shimmer-icon">🎞️</span>
      </div>
      <img
        src="${page.gifUrl}"
        alt="GIF: ${escapeHTML(page.title)}"
        id="gifImage"
        crossorigin="anonymous"
      >
      <canvas id="gifCanvas" class="gif-canvas"></canvas>
      <div class="gif-overlay" id="gifOverlay">
        <div class="gif-overlay-icon" id="gifOverlayIcon">
          <span class="icon-pause">${pauseIconSVG}</span>
          <span class="icon-play" style="display:none">${playIconSVG}</span>
        </div>
      </div>
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

    <!-- Pagination at the bottom -->
    <div class="pagination" id="pagination"></div>
  `;

  // ---- Post-render setup ----
  setupGifLoading();
  setupGifPausePlay();
  setupAnswerButtons();
  setupToggleAll();
  setupMobileNav();
  updateDesktopArrows();
  renderPagePagination();

  // Scroll to top when navigating to a new page
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
//  GIF LOADING (shimmer → loaded)
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

  img.addEventListener('load', function onLoad() {
    shimmer.classList.add('hidden');
    img.removeEventListener('load', onLoad);
  });

  img.addEventListener('error', function onError() {
    /*
     * If crossorigin="anonymous" caused the load to fail (server
     * doesn't send CORS headers), retry without it. The GIF will
     * load normally. Pause/play via canvas drawImage still works
     * for display — it only taints the canvas, which we never read.
     */
    if (img.hasAttribute('crossorigin')) {
      img.removeAttribute('crossorigin');
      const src = img.getAttribute('src');
      img.removeAttribute('src');
      // Small delay ensures the browser treats this as a new request
      requestAnimationFrame(() => { img.src = src; });
    } else {
      // Image genuinely broken — hide shimmer so user sees alt text
      shimmer.classList.add('hidden');
    }
    img.removeEventListener('error', onError);
  });
}

// ============================================================
//  GIF PAUSE / PLAY (canvas-based)
// ============================================================

/**
 * Set up click handler on the GIF container to pause/play.
 * Clicking draws the current animation frame to a <canvas>,
 * freezing it. Clicking again resumes the animated <img>.
 */
function setupGifPausePlay() {
  const container = document.getElementById('gifContainer');
  if (!container) return;

  container.addEventListener('click', (e) => {
    // Don't pause if clicking the shimmer (still loading)
    if (e.target.closest('.shimmer:not(.hidden)')) return;
    toggleGifPause();
  });
}

function toggleGifPause() {
  const img     = document.getElementById('gifImage');
  const canvas  = document.getElementById('gifCanvas');
  const container = document.getElementById('gifContainer');

  if (!img || !canvas || !container) return;
  if (!img.complete || img.naturalWidth === 0) return; // not loaded yet

  if (gifPaused) {
    // ---- RESUME ----
    canvas.style.display = 'none';
    img.style.visibility = 'visible';
    gifPaused = false;
  } else {
    // ---- PAUSE: capture current frame to canvas ----
    try {
      const ctx = canvas.getContext('2d');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      canvas.style.display = 'block';
      img.style.visibility = 'hidden';  // hidden, not display:none → keeps layout
      gifPaused = true;
    } catch (err) {
      /*
       * drawImage can technically fail in very rare edge cases.
       * Show a brief toast message and don't crash.
       */
      console.warn('GIF pause not available:', err);
      showPauseUnavailable();
      return;
    }
  }

  updatePausePlayIcon();
}

/**
 * Toggle the play/pause icon SVG and container CSS class.
 */
function updatePausePlayIcon() {
  const container = document.getElementById('gifContainer');
  const pauseIcon = container?.querySelector('.icon-pause');
  const playIcon  = container?.querySelector('.icon-play');

  if (!pauseIcon || !playIcon) return;

  if (gifPaused) {
    pauseIcon.style.display = 'none';
    playIcon.style.display  = 'inline';
    container.classList.add('paused');
  } else {
    pauseIcon.style.display = 'inline';
    playIcon.style.display  = 'none';
    container.classList.remove('paused');
  }
}

/**
 * Flash a "pause not available" toast on the GIF container.
 */
function showPauseUnavailable() {
  const container = document.getElementById('gifContainer');
  if (!container) return;

  const msg = document.createElement('div');
  msg.className = 'pause-unavailable';
  msg.textContent = 'Pause not available for this GIF';
  container.appendChild(msg);

  // Remove after animation completes
  setTimeout(() => msg.remove(), 2400);
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
      // Hide all
      wrappers.forEach(w => w.classList.remove('open'));
      buttons.forEach(b => {
        b.textContent = 'Show Answer';
        b.setAttribute('aria-expanded', 'false');
      });
      toggleBtn.textContent = 'Show All Answers';
    } else {
      // Show all
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
//  NAVIGATION (next / prev)
// ============================================================

/** Go to the previous page (if possible). */
function goPrev() {
  if (currentView !== 'page') return;
  if (currentPageIndex > 0) {
    navigateToPage(currentPageIndex - 1);
  }
}

/** Go to the next page (if possible). */
function goNext() {
  if (currentView !== 'page') return;
  if (currentPageIndex < pages.length - 1) {
    navigateToPage(currentPageIndex + 1);
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

/** Hide desktop arrows (used in grid view). */
function hideNavArrows() {
  prevBtn.style.display = 'none';
  nextBtn.style.display = 'none';
}

/** Show desktop arrows (revert to CSS default — media query handles visibility). */
function showNavArrows() {
  prevBtn.style.display = '';
  nextBtn.style.display = '';
}

// Desktop arrow click handlers (set up once)
prevBtn.addEventListener('click', goPrev);
nextBtn.addEventListener('click', goNext);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  // Don't hijack arrows if user is typing in an input/textarea
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  // Escape closes sidebar
  if (e.key === 'Escape' && sidebarOpen) {
    closeSidebar();
    return;
  }

  // Arrow keys only work in page view
  if (currentView !== 'page') return;

  if (e.key === 'ArrowLeft')  goPrev();
  if (e.key === 'ArrowRight') goNext();
});

// ============================================================
//  GALLERY TOGGLE
// ============================================================

galleryBtn.addEventListener('click', () => {
  if (currentView === 'grid') {
    // Return to the last-viewed page
    navigateToPage(currentPageIndex);
  } else {
    // Open the gallery
    navigateToGrid(1);
  }
});

// ============================================================
//  PAGINATION — Smart Ellipsis
// ============================================================

/**
 * Generate the array of page numbers (and '...' markers) to display.
 * Always shows first and last page, plus a window of ±2 around current.
 *
 * Example with 50 pages, current=25:
 *   [1, '...', 23, 24, 25, 26, 27, '...', 50]
 */
function getPaginationRange(current, total) {
  // If few enough pages, just show them all
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const delta = 2;  // pages to show on each side of current
  const range = [];
  const left  = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  // Always include page 1
  range.push(1);

  // Ellipsis after page 1 if there's a gap
  if (left > 2) range.push('...');

  // Window around current page
  for (let i = left; i <= right; i++) {
    range.push(i);
  }

  // Ellipsis before last page if there's a gap
  if (right < total - 1) range.push('...');

  // Always include last page
  if (total > 1) range.push(total);

  return range;
}

/**
 * Build pagination HTML and attach click handlers.
 * Used by both the page view and the grid view.
 *
 * @param {HTMLElement} container  - the .pagination div
 * @param {number}      current   - 1-based current page number
 * @param {number}      total     - total number of pages
 * @param {function}    onNavigate - called with 1-based page number
 */
function buildPagination(container, current, total, onNavigate) {
  if (!container || total <= 1) return;

  const range = getPaginationRange(current, total);

  // Left arrow SVG (reused from nav arrows)
  const leftArrow = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
  const rightArrow = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>';

  let html = '';

  // Previous arrow
  html += '<button class="pagination-btn" data-pag="' + (current - 1) + '"' +
    (current === 1 ? ' disabled' : '') + '>' + leftArrow + '</button>';

  // Page numbers and ellipses
  range.forEach(item => {
    if (item === '...') {
      html += '<span class="pagination-ellipsis">…</span>';
    } else {
      html += '<button class="pagination-btn' +
        (item === current ? ' active' : '') +
        '" data-pag="' + item + '">' + item + '</button>';
    }
  });

  // Next arrow
  html += '<button class="pagination-btn" data-pag="' + (current + 1) + '"' +
    (current === total ? ' disabled' : '') + '>' + rightArrow + '</button>';

  container.innerHTML = html;

  // Attach click handlers
  container.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const num = parseInt(btn.dataset.pag, 10);
      if (num >= 1 && num <= total) {
        onNavigate(num);
      }
    });
  });
}

/**
 * Render pagination for the page view (at the bottom of the page).
 */
function renderPagePagination() {
  const container = document.getElementById('pagination');
  const current   = currentPageIndex + 1;  // 1-based
  const total     = pages.length;

  buildPagination(container, current, total, (pageNum) => {
    navigateToPage(pageNum - 1);  // convert to 0-based index
  });
}

// ============================================================
//  GRID / GALLERY VIEW
// ============================================================

/**
 * Render the gallery grid for a given grid page number (1-based).
 */
function renderGrid(gridPage) {
  const totalGridPages = Math.max(1, Math.ceil(pages.length / GRID_PAGE_SIZE));
  gridPage = Math.min(Math.max(1, gridPage), totalGridPages);
  currentGridPage = gridPage;

  const startIdx = (gridPage - 1) * GRID_PAGE_SIZE;
  const endIdx   = Math.min(startIdx + GRID_PAGE_SIZE, pages.length);
  const slice    = pages.slice(startIdx, endIdx);

  // Build card HTML
  const cardsHTML = slice.map((page, i) => {
    const globalIndex = startIdx + i;
    return `
      <div class="grid-card" data-page-index="${globalIndex}">
        <div class="grid-card-gif">
          <img
            class="grid-card-img"
            data-src="${page.gifUrl}"
            alt="GIF: ${escapeHTML(page.title)}"
          >
          <div class="grid-card-shimmer">🎞️</div>
        </div>
        <div class="grid-card-info">
          <span class="grid-card-number">#${page.id}</span>
          <span class="grid-card-title">${escapeHTML(page.title)}</span>
        </div>
      </div>
    `;
  }).join('');

  mainEl.innerHTML = `
    <div class="grid-header">
      <h2 class="grid-title">📚 All Pages</h2>
      <p class="grid-subtitle">
        ${pages.length} page${pages.length !== 1 ? 's' : ''} total
        ${totalGridPages > 1 ? ' · Grid page ' + gridPage + ' of ' + totalGridPages : ''}
      </p>
    </div>

    <div class="grid-container" id="gridContainer">
      ${cardsHTML}
    </div>

    <div class="pagination" id="gridPagination"></div>
  `;

  // Card click → navigate to that page
  mainEl.querySelectorAll('.grid-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.pageIndex, 10);
      navigateToPage(idx);
    });
  });

  // Lazy-load GIF thumbnails with IntersectionObserver
  setupGridLazyLoading();

  // Grid pagination
  const paginationEl = document.getElementById('gridPagination');
  buildPagination(paginationEl, gridPage, totalGridPages, (gp) => {
    navigateToGrid(gp);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Use IntersectionObserver to lazy-load GIF thumbnails.
 * Only starts loading the image when the card scrolls near the viewport.
 */
function setupGridLazyLoading() {
  const images = mainEl.querySelectorAll('.grid-card-img');

  // If IntersectionObserver isn't available, load all immediately
  if (!('IntersectionObserver' in window)) {
    images.forEach(img => loadGridImage(img));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadGridImage(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '300px',  // start loading 300px before visible
    threshold: 0
  });

  images.forEach(img => observer.observe(img));
}

/**
 * Load a single grid thumbnail image from its data-src attribute.
 */
function loadGridImage(img) {
  const src = img.dataset.src;
  if (!src) return;

  img.addEventListener('load', () => {
    img.classList.add('loaded');
    const shimmer = img.parentElement?.querySelector('.grid-card-shimmer');
    if (shimmer) shimmer.style.display = 'none';
  });

  img.addEventListener('error', () => {
    const shimmer = img.parentElement?.querySelector('.grid-card-shimmer');
    if (shimmer) shimmer.textContent = '❌';
  });

  img.src = src;
  img.removeAttribute('data-src');
}

// ============================================================
//  HASH CHANGE LISTENER
//  Routes all navigation (back/forward, link clicks, etc.)
// ============================================================

window.addEventListener('hashchange', () => {
  route();
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
//  DARK MODE
// ============================================================

/**
 * Initialize dark mode based on:
 *   1. localStorage preference (if user previously toggled)
 *   2. System preference via prefers-color-scheme
 * Updates the <html> data-theme attribute and the toggle icon.
 */
function initDarkMode() {
  const saved = localStorage.getItem('theme');

  if (saved === 'dark' || saved === 'light') {
    // Use saved preference
    setTheme(saved);
  } else {
    // No saved preference — follow system setting
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }

  // Listen for system theme changes (only applies if no manual override)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
}

/**
 * Apply a theme ('dark' or 'light') to the document.
 */
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  updateDarkModeIcon(theme);
}

/**
 * Toggle between dark and light mode.
 * Saves the preference to localStorage so it persists.
 */
function toggleDarkMode() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';

  setTheme(next);
  localStorage.setItem('theme', next);
}

/**
 * Update the dark mode button icon — 🌙 for light mode, ☀️ for dark mode.
 */
function updateDarkModeIcon(theme) {
  const icon = darkModeBtn?.querySelector('.dark-mode-icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// Dark mode button click handler
darkModeBtn.addEventListener('click', toggleDarkMode);

// ============================================================
//  BOOT — initialize the app on load
// ============================================================

(function init() {
  // Initialize dark mode before rendering (prevents flash)
  initDarkMode();

  // Populate sidebar with all pages
  populateSidebar();

  // Set default hash if none is present
  if (!window.location.hash) {
    history.replaceState(null, '', '#page/1');
  }

  // Render the correct view based on the current hash
  route();
})();
