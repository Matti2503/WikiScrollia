/**
 * WikiScroll - Progressive Web App
 * Vanilla JS Architektur ohne externe Abhängigkeiten
 */

const API_BASE = 'https://de.wikipedia.org/w/api.php?origin=*&format=json';
const STORAGE_KEY = 'wikiscroll_bookmarks_v1';

// Alle 22 Kategorien inkl. Suchlogik und individuellen Hintergrund-Farbverläufen
const CATEGORIES = [
    { id: 'Zufall', label: 'Zufall', icon: '🎲', gradient: 'linear-gradient(135deg, #161624, #2a1b38)', query: null },
    { id: 'Medizin', label: 'Medizin', icon: '🩺', gradient: 'linear-gradient(135deg, #0d1a20, #163642)', query: 'Medizin OR Krankheit OR Anatomie OR Therapie' },
    { id: 'Geschichte', label: 'Geschichte', icon: '🏛️', gradient: 'linear-gradient(135deg, #241b14, #3a271b)', query: 'Geschichte OR historisch OR Jahrhundert OR Antike OR Mittelalter' },
    { id: 'Geographie', label: 'Geografie', icon: '🌍', gradient: 'linear-gradient(135deg, #0b2110, #143d20)', query: 'Stadt OR Staat OR Gebirge OR Fluss OR Insel OR Kontinent' },
    { id: 'Politik', label: 'Politik', icon: '⚖️', gradient: 'linear-gradient(135deg, #101622, #1b283d)', query: 'Politik OR Politiker OR Partei OR Regierung OR Parlament' },
    { id: 'Verschwörungstheorie', label: 'Verschwörungen', icon: '👽', gradient: 'linear-gradient(135deg, #050505, #0c2b12)', query: 'Verschwörungstheorie OR Mysterium OR Kryptid OR Geheimdienst' },
    { id: 'Philosophie', label: 'Philosophie', icon: '🤔', gradient: 'linear-gradient(135deg, #1c130d, #422d21)', query: 'Philosophie OR Philosoph OR Ethik OR Erkenntnistheorie' },
    { id: 'Physik', label: 'Physik', icon: '⚛️', gradient: 'linear-gradient(135deg, #030821, #0c2f54)', query: 'Physik OR Quantenmechanik OR Astrophysik OR Thermodynamik' },
    { id: 'Film', label: 'Film', icon: '🎬', gradient: 'linear-gradient(135deg, #080808, #2c1616)', query: 'Spielfilm OR Regisseur OR Schauspieler OR Filmgeschichte' },
    { id: 'Musik', label: 'Musik', icon: '🎵', gradient: 'linear-gradient(135deg, #11001c, #2b033d)', query: 'Musikgruppe OR Musikalbum OR Sänger OR Musikinstrument OR Komponist' },
    { id: 'Fotografie', label: 'Fotografie', icon: '📸', gradient: 'linear-gradient(135deg, #1a1b1c, #303336)', query: 'Fotografie OR Kamera OR Fotograf OR Objektiv' },
    { id: 'Pflanze', label: 'Pflanzen', icon: '🌿', gradient: 'linear-gradient(135deg, #0c2b20, #1a4a38)', query: 'Pflanzenart OR Baum OR Heilpflanze OR Nutzpflanze OR Botanik' },
    { id: 'Tier', label: 'Tiere', icon: '🐾', gradient: 'linear-gradient(135deg, #261914, #36261f)', query: 'Säugetier OR Vogel OR Fisch OR Insekt OR Reptil OR Tierart' },
    { id: 'Essen', label: 'Essen', icon: '🍔', gradient: 'linear-gradient(135deg, #2b1402, #4d2300)', query: 'Speise OR Lebensmittel OR Getränk OR Kochkunst OR Gewürz' },
    { id: 'Biologie', label: 'Biologie', icon: '🧬', gradient: 'linear-gradient(135deg, #022b10, #044d1c)', query: 'Biologie OR Genetik OR Evolution OR Mikrobiologie OR Ökologie' },
    { id: 'Chemie', label: 'Chemie', icon: '🧪', gradient: 'linear-gradient(135deg, #17022b, #2b044d)', query: 'Chemie OR Molekül OR Chemisches Element OR Biochemie' },
    { id: 'Astronomie', label: 'Weltall', icon: '🌌', gradient: 'linear-gradient(135deg, #050314, #120e36)', query: 'Astronomie OR Planet OR Galaxie OR Stern OR Raumfahrt' },
    { id: 'Sport', label: 'Sport', icon: '🏆', gradient: 'linear-gradient(135deg, #06111f, #0d213b)', query: 'Sportart OR Weltmeisterschaft OR Olympische Spiele OR Leichtathletik' },
    { id: 'Surfen', label: 'Surfen', icon: '🏄', gradient: 'linear-gradient(135deg, #00233b, #004573)', query: 'Wellenreiten OR Surfen OR Surfbrett OR Windsurfen' },
    { id: 'Basketball', label: 'Basketball', icon: '🏀', gradient: 'linear-gradient(135deg, #2e1000, #541d00)', query: 'Basketball OR NBA OR Basketballspieler' },
    { id: 'Fußball', label: 'Fußball', icon: '⚽', gradient: 'linear-gradient(135deg, #001f00, #004000)', query: 'Fußball OR Fußballspieler OR Fußballverein OR Fußball-Weltmeisterschaft' },
    { id: 'Tennis', label: 'Tennis', icon: '🎾', gradient: 'linear-gradient(135deg, #1f1f00, #383800)', query: 'Tennis OR Tennisspieler OR Grand Slam OR Wimbledon' }
];

const SPECIAL_GRADIENTS = {
    search: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    rabbithole: 'linear-gradient(135deg, #3d1b04, #1a0b00)',
    bookmarks: 'linear-gradient(135deg, #1a1a1a, #2e2e2e)',
    default: '#121212'
};

// Zentraler App-State
const state = {
    mode: '',               // 'category' | 'search' | 'rabbithole'
    value: '',              // Kategorie-ID, Suchbegriff oder Artikel-Titel
    headerTitle: '',        // Angezeigter Titel im Feed-Header
    searchOffset: 0,        // Paginierung für Suche & Rabbit Hole
    articleBuffer: [],      // Vorgeladene Artikel
    seenPageIds: new Set(), // Verhindert Duplikate innerhalb einer Session
    isLoading: false,
    feedHistoryStack: [],   // Speichert Feed-Zustände bei Rabbit-Hole-Sprüngen
    overlayHistoryStack: [] // Speichert Artikel-Verlauf im Vollbild-Lesemodus
};

// DOM-Referenzen
const dom = {
    views: {
        start: document.getElementById('view-start'),
        feed: document.getElementById('view-feed'),
        bookmarks: document.getElementById('view-bookmarks'),
        overlay: document.getElementById('view-overlay')
    },
    categoryGrid: document.getElementById('category-grid'),
    searchForm: document.getElementById('search-form'),
    searchInput: document.getElementById('search-input'),
    btnOpenBookmarks: document.getElementById('btn-open-bookmarks'),
    
    // Feed
    feedScrollContainer: document.getElementById('feed-scroll-container'),
    feedList: document.getElementById('feed-list'),
    feedLoader: document.getElementById('feed-loader'),
    feedLoaderText: document.getElementById('feed-loader-text'),
    feedHeaderTitle: document.getElementById('feed-header-title'),
    btnFeedBack: document.getElementById('btn-feed-back'),
    btnFeedRefresh: document.getElementById('btn-feed-refresh'),
    
    // Bookmarks
    btnBookmarksHome: document.getElementById('btn-bookmarks-home'),
    bookmarksList: document.getElementById('bookmarks-list'),
    
    // Overlay
    btnOverlayClose: document.getElementById('btn-overlay-close'),
    btnOverlayBack: document.getElementById('btn-overlay-back'),
    btnOverlaySave: document.getElementById('btn-overlay-save'),
    overlayHeaderTitle: document.getElementById('overlay-header-title'),
    overlayScrollArea: document.getElementById('overlay-scroll-area'),
    overlayLoader: document.getElementById('overlay-loader'),
    overlayArticleContent: document.getElementById('overlay-article-content')
};

/* =========================================
   INITIALISIERUNG & SERVICE WORKER
   ========================================= */
function initApp() {
    renderCategoryGrid();
    setupEventListeners();
    setupIntersectionObserver();
    registerServiceWorker();
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(err => {
                console.warn('Service Worker Registrierung fehlgeschlagen:', err);
            });
        });
    }
}

function renderCategoryGrid() {
    const fragment = document.createDocumentFragment();
    CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'category-btn';
        btn.dataset.categoryId = cat.id;
        btn.dataset.categoryLabel = cat.label;
        btn.innerHTML = `<span>${cat.icon}</span> <span>${cat.label}</span>`;
        fragment.appendChild(btn);
    });
    dom.categoryGrid.appendChild(fragment);
}

/* =========================================
   DESIGN & VIEW NAVIGATION
   ========================================= */
function switchView(viewName) {
    Object.values(dom.views).forEach(el => {
        if (el !== dom.views.overlay) el.classList.remove('active');
    });
    if (dom.views[viewName]) {
        dom.views[viewName].classList.add('active');
    }
}

function applyBackgroundTheme(mode, value) {
    let bg = SPECIAL_GRADIENTS.default;
    if (mode === 'search') {
        bg = SPECIAL_GRADIENTS.search;
    } else if (mode === 'rabbithole') {
        bg = SPECIAL_GRADIENTS.rabbithole;
    } else if (mode === 'bookmarks') {
        bg = SPECIAL_GRADIENTS.bookmarks;
    } else if (mode === 'category') {
        const found = CATEGORIES.find(c => c.id === value);
        if (found) bg = found.gradient;
    }
    document.documentElement.style.setProperty('--dynamic-bg', bg);
}

function goHome() {
    closeOverlay();
    state.feedHistoryStack = [];
    state.articleBuffer = [];
    state.seenPageIds.clear();
    dom.feedList.innerHTML = '';
    applyBackgroundTheme('default');
    updateFeedBackButtonUI();
    switchView('start');
}

/* =========================================
   BOOKMARKS / LOCAL STORAGE
   ========================================= */
function getBookmarks() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function isBookmarked(pageId) {
    return getBookmarks().some(item => String(item.pageId) === String(pageId));
}

function saveBookmark(pageId, title) {
    const list = getBookmarks();
    if (!list.some(item => String(item.pageId) === String(pageId))) {
        list.push({
            pageId: String(pageId),
            title: title,
            savedAt: Date.now()
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
    syncSaveButtonsUI(pageId);
}

function removeBookmark(pageId) {
    const list = getBookmarks().filter(item => String(item.pageId) !== String(pageId));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    renderBookmarksView();
    syncSaveButtonsUI(pageId);
}

function syncSaveButtonsUI(pageId) {
    const saved = isBookmarked(pageId);
    // Alle passenden Buttons im Feed aktualisieren
    document.querySelectorAll(`.js-save-btn[data-page-id="${pageId}"]`).forEach(btn => {
        btn.classList.toggle('saved', saved);
        btn.innerHTML = `<span class="btn-icon">${saved ? '🔐' : '🔒'}</span> <span class="btn-text">${saved ? 'Gespeichert' : 'Speichern'}</span>`;
    });

    // Overlay-Button aktualisieren, falls derselbe Artikel offen ist
    if (String(dom.btnOverlaySave.dataset.pageId) === String(pageId)) {
        dom.btnOverlaySave.classList.toggle('saved', saved);
        dom.btnOverlaySave.innerHTML = `<span class="btn-icon">${saved ? '🔐' : '🔒'}</span> <span class="btn-text">${saved ? 'Gespeichert' : 'Speichern'}</span>`;
    }
}

function openBookmarksView() {
    applyBackgroundTheme('bookmarks');
    renderBookmarksView();
    switchView('bookmarks');
}

function renderBookmarksView() {
    const saved = getBookmarks().sort((a, b) => b.savedAt - a.savedAt);
    dom.bookmarksList.innerHTML = '';

    if (saved.length === 0) {
        dom.bookmarksList.innerHTML = '<p class="empty-state">Du hast noch keine Artikel gespeichert. Ab ins Rabbit Hole!</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    saved.forEach(article => {
        const item = document.createElement('div');
        item.className = 'saved-item';

        const link = document.createElement('a');
        link.href = `./wiki/${encodeURIComponent(article.title.replace(/ /g, '_'))}`;
        link.dataset.wikiTitle = article.title;
        link.textContent = article.title;

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'delete-btn';
        delBtn.dataset.deleteId = article.pageId;
        delBtn.textContent = 'Löschen';

        item.appendChild(link);
        item.appendChild(delBtn);
        fragment.appendChild(item);
    });

    dom.bookmarksList.appendChild(fragment);
}

/* =========================================
   DOOMSCROLL FEED & RABBIT HOLE ENGINE
   ========================================= */
async function startFeed(mode, value, headerTitle) {
    state.mode = mode;
    state.value = value;
    state.headerTitle = headerTitle;
    state.searchOffset = 0;
    state.articleBuffer = [];
    state.seenPageIds.clear();

    dom.feedHeaderTitle.textContent = headerTitle;
    dom.feedList.innerHTML = '';
    dom.feedScrollContainer.scrollTop = 0;
    dom.feedLoader.classList.remove('hidden');
    dom.feedLoaderText.textContent = 'Lade mehr Wissen...';

    applyBackgroundTheme(mode, value);
    updateFeedBackButtonUI();
    switchView('feed');

    await loadMoreArticlesToDOM(2);
}

function enterRabbitHole(articleTitle) {
    closeOverlay();

    // Aktuellen Feed-Zustand auf den Stack legen
    state.feedHistoryStack.push({
        mode: state.mode,
        value: state.value,
        headerTitle: state.headerTitle,
        searchOffset: state.searchOffset,
        articleBuffer: [...state.articleBuffer],
        seenPageIds: new Set(state.seenPageIds),
        feedHtml: dom.feedList.innerHTML,
        scrollTop: dom.feedScrollContainer.scrollTop
    });

    startFeed('rabbithole', articleTitle, `🐇 ${articleTitle}`);
}

function handleFeedBackNavigation() {
    if (state.feedHistoryStack.length > 0) {
        const prevState = state.feedHistoryStack.pop();
        state.mode = prevState.mode;
        state.value = prevState.value;
        state.headerTitle = prevState.headerTitle;
        state.searchOffset = prevState.searchOffset;
        state.articleBuffer = prevState.articleBuffer;
        state.seenPageIds = prevState.seenPageIds;

        dom.feedHeaderTitle.textContent = state.headerTitle;
        dom.feedList.innerHTML = prevState.feedHtml;
        dom.feedLoader.classList.remove('hidden');
        dom.feedLoaderText.textContent = 'Lade mehr Wissen...';

        applyBackgroundTheme(state.mode, state.value);
        updateFeedBackButtonUI();

        // Gespeicherten Status der Buttons im wiederhergestellten DOM abgleichen
        document.querySelectorAll('.js-save-btn').forEach(btn => {
            syncSaveButtonsUI(btn.dataset.pageId);
        });

        requestAnimationFrame(() => {
            dom.feedScrollContainer.scrollTop = prevState.scrollTop;
        });
    } else {
        goHome();
    }
}

function updateFeedBackButtonUI() {
    if (state.feedHistoryStack.length > 0) {
        dom.btnFeedBack.textContent = '⬅️ Zurück';
    } else {
        dom.btnFeedBack.textContent = '✖ Home';
    }
}

function refreshCurrentFeed() {
    dom.feedList.innerHTML = '';
    state.articleBuffer = [];
    dom.feedScrollContainer.scrollTop = 0;
    dom.feedLoader.classList.remove('hidden');
    loadMoreArticlesToDOM(2);
}

async function fetchBatchIntoBuffer() {
    if (state.mode === 'category' && state.value === 'Zufall') {
        const url = `${API_BASE}&action=query&generator=random&grnnamespace=0&grnlimit=10&prop=extracts|pageimages&piprop=thumbnail&pithumbsize=800&exintro=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.query && data.query.pages) {
            state.articleBuffer.push(...Object.values(data.query.pages));
        }
        return;
    }

    let searchQuery = '';
    let offset = 0;

    if (state.mode === 'category') {
        const catObj = CATEGORIES.find(c => c.id === state.value);
        searchQuery = catObj && catObj.query ? catObj.query : state.value;
        offset = Math.floor(Math.random() * 450);
    } else if (state.mode === 'search') {
        searchQuery = state.value;
        offset = state.searchOffset;
        state.searchOffset += 10;
    } else if (state.mode === 'rabbithole') {
        searchQuery = `morelike:${state.value}`;
        offset = state.searchOffset;
        state.searchOffset += 10;
    }

    const url = `${API_BASE}&action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrnamespace=0&gsrlimit=10&gsroffset=${offset}&prop=extracts|pageimages&piprop=thumbnail&pithumbsize=800&exintro=1`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.query && data.query.pages) {
        const pages = Object.values(data.query.pages);
        if (state.mode === 'category') {
            // Zufällig mischen für Kategorien
            pages.sort(() => Math.random() - 0.5);
        } else {
            // Bei Suche & Rabbit Hole strikt nach Relevanz-Index (index) sortieren
            pages.sort((a, b) => (a.index || 0) - (b.index || 0));
        }
        state.articleBuffer.push(...pages);
    } else if (state.mode === 'category' && offset > 0) {
        // Fallback auf Offset 0, falls der Zufalls-Offset zu hoch war
        const fallbackUrl = `${API_BASE}&action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrnamespace=0&gsrlimit=10&gsroffset=0&prop=extracts|pageimages&piprop=thumbnail&pithumbsize=800&exintro=1`;
        const fbRes = await fetch(fallbackUrl);
        const fbData = await fbRes.json();
        if (fbData.query && fbData.query.pages) {
            const pages = Object.values(fbData.query.pages).sort(() => Math.random() - 0.5);
            state.articleBuffer.push(...pages);
        }
    }
}

async function loadMoreArticlesToDOM(count = 1) {
    if (state.isLoading) return;
    state.isLoading = true;

    try {
        let rendered = 0;
        let attempts = 0;

        while (rendered < count && attempts < 4) {
            attempts++;
            if (state.articleBuffer.length === 0) {
                await fetchBatchIntoBuffer();
            }

            if (state.articleBuffer.length === 0) {
                dom.feedLoaderText.textContent = 'Ende des Rabbit Holes erreicht.';
                break;
            }

            const candidate = state.articleBuffer.shift();
            if (candidate && candidate.extract && !state.seenPageIds.has(candidate.pageid)) {
                state.seenPageIds.add(candidate.pageid);
                renderFeedCard(candidate);
                rendered++;
            }
        }
    } catch (err) {
        console.error('Fehler beim Laden des Feeds:', err);
        dom.feedLoaderText.textContent = 'Netzwerkfehler. Bitte Verbindung prüfen.';
    } finally {
        state.isLoading = false;
    }
}

function renderFeedCard(article) {
    const card = document.createElement('article');
    card.className = 'post-card';

    const hasImage = Boolean(article.thumbnail && article.thumbnail.source);
    if (hasImage) {
        const img = document.createElement('img');
        img.className = 'post-image';
        img.src = article.thumbnail.source.replace(/^\/\//, 'https://');
        img.alt = article.title;
        img.loading = 'lazy';
        card.appendChild(img);
    }

    const content = document.createElement('div');
    content.className = 'post-content';

    if (hasImage) {
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'toggle-img-btn js-toggle-img';
        toggleBtn.innerHTML = '⬇️ Bild ausblenden';
        content.appendChild(toggleBtn);
    }

    const titleEl = document.createElement('h3');
    titleEl.className = 'post-title';
    const titleLink = document.createElement('a');
    titleLink.href = `./wiki/${encodeURIComponent(article.title.replace(/ /g, '_'))}`;
    titleLink.dataset.wikiTitle = article.title;
    titleLink.textContent = article.title;
    titleEl.appendChild(titleLink);
    content.appendChild(titleEl);

    const textEl = document.createElement('div');
    textEl.className = 'post-text';
    textEl.innerHTML = sanitizeWikiHtml(article.extract);
    content.appendChild(textEl);

    card.appendChild(content);

    // Action Bar
    const actions = document.createElement('div');
    actions.className = 'post-actions';

    const saved = isBookmarked(article.pageid);
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = `action-btn js-save-btn ${saved ? 'saved' : ''}`;
    saveBtn.dataset.pageId = article.pageid;
    saveBtn.dataset.title = article.title;
    saveBtn.title = 'Artikel speichern';
    saveBtn.innerHTML = `<span class="btn-icon">${saved ? '🔐' : '🔒'}</span> <span class="btn-text">${saved ? 'Gespeichert' : 'Speichern'}</span>`;

    const rabbitBtn = document.createElement('button');
    rabbitBtn.type = 'button';
    rabbitBtn.className = 'action-btn rabbit-hole-btn js-rabbit-btn';
    rabbitBtn.dataset.title = article.title;
    rabbitBtn.title = 'Ähnliche Artikel im Rabbit Hole öffnen';
    rabbitBtn.innerHTML = `<span class="btn-icon">🐇</span> <span class="btn-text">Rabbit Hole</span>`;

    const readBtn = document.createElement('button');
    readBtn.type = 'button';
    readBtn.className = 'action-btn read-more-btn js-read-btn';
    readBtn.dataset.pageId = article.pageid;
    readBtn.title = 'Vollständigen Artikel lesen';
    readBtn.innerHTML = `<span class="btn-icon">📖</span> <span class="btn-text">Weiterlesen</span>`;

    actions.appendChild(saveBtn);
    actions.appendChild(rabbitBtn);
    actions.appendChild(readBtn);
    card.appendChild(actions);

    dom.feedList.appendChild(card);
}

/* =========================================
   VOLLTEXT-OVERLAY & ARTIKEL-VERLAUF
   ========================================= */
async function openFullArticle(identifier, isPageId = false, isHistoryBack = false) {
    dom.views.overlay.classList.add('active');

    if (!isHistoryBack) {
        state.overlayHistoryStack.push({ identifier, isPageId });
    }

    dom.btnOverlayBack.classList.toggle('hidden', state.overlayHistoryStack.length <= 1);
    dom.overlayArticleContent.innerHTML = '';
    dom.overlayHeaderTitle.textContent = 'Lade...';
    dom.overlayLoader.classList.remove('hidden');
    dom.overlayScrollArea.scrollTop = 0;

    // Save-Button während des Ladens neutralisieren
    dom.btnOverlaySave.dataset.pageId = '';
    dom.btnOverlaySave.dataset.title = '';

    const queryParam = isPageId ? `pageid=${encodeURIComponent(identifier)}` : `page=${encodeURIComponent(identifier)}&redirects=1`;

    try {
        const res = await fetch(`${API_BASE}&action=parse&${queryParam}&prop=text|displaytitle&formatversion=2`);
        const data = await res.json();

        if (data.parse) {
            const pageId = data.parse.pageid;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data.parse.displaytitle;
            const plainTitle = tempDiv.textContent || tempDiv.innerText || String(identifier);

            dom.overlayHeaderTitle.textContent = plainTitle;
            dom.overlayArticleContent.innerHTML = sanitizeWikiHtml(data.parse.text);

            // Overlay Save-Button konfigurieren
            dom.btnOverlaySave.dataset.pageId = pageId;
            dom.btnOverlaySave.dataset.title = plainTitle;
            syncSaveButtonsUI(pageId);
        } else {
            dom.overlayHeaderTitle.textContent = 'Nicht gefunden';
            dom.overlayArticleContent.innerHTML = '<p class="empty-state">Dieser Artikel konnte leider nicht geladen werden.</p>';
        }
    } catch (err) {
        console.error('Fehler beim Laden des Volltextes:', err);
        dom.overlayHeaderTitle.textContent = 'Fehler';
        dom.overlayArticleContent.innerHTML = '<p class="empty-state">Verbindungsfehler beim Laden des Artikels.</p>';
    } finally {
        dom.overlayLoader.classList.add('hidden');
    }
}

function goBackInOverlayHistory() {
    if (state.overlayHistoryStack.length > 1) {
        state.overlayHistoryStack.pop();
        const prev = state.overlayHistoryStack[state.overlayHistoryStack.length - 1];
        openFullArticle(prev.identifier, prev.isPageId, true);
    }
}

function closeOverlay() {
    dom.views.overlay.classList.remove('active');
    dom.overlayArticleContent.innerHTML = '';
    state.overlayHistoryStack = [];
}

/**
 * Bereinigt Wikipedia-HTML:
 * 1. Repariert protokoll-relative Bild-URLs (//upload.wikimedia.org -> https://upload.wikimedia.org)
 * 2. Wandelt interne /wiki/-Pfade in relative Pfade um, damit keine absoluten Root-Pfade entstehen
 */
function sanitizeWikiHtml(rawHtml) {
    if (!rawHtml) return '';
    return rawHtml
        .replace(/src="\/\//g, 'src="https://')
        .replace(/srcset="\/\//g, 'srcset="https://')
        .replace(/href="\/wiki\//g, 'href="./wiki/');
}

/* =========================================
   EVENT LISTENERS & INTERSECTION OBSERVER
   ========================================= */
function setupEventListeners() {
    // 1. Suche auf dem Startscreen
    dom.searchForm.addEventListener('submit', e => {
        e.preventDefault();
        const query = dom.searchInput.value.trim();
        if (query) {
            dom.searchInput.blur();
            startFeed('search', query, `🔍 ${query}`);
        }
    });

    // 2. Kategorie-Auswahl (Event Delegation)
    dom.categoryGrid.addEventListener('click', e => {
        const btn = e.target.closest('.category-btn');
        if (!btn) return;
        startFeed('category', btn.dataset.categoryId, btn.dataset.categoryLabel);
    });

    // 3. Lesezeichen öffnen & schließen
    dom.btnOpenBookmarks.addEventListener('click', openBookmarksView);
    dom.btnBookmarksHome.addEventListener('click', goHome);

    dom.bookmarksList.addEventListener('click', e => {
        const delBtn = e.target.closest('.delete-btn');
        if (delBtn) {
            removeBookmark(delBtn.dataset.deleteId);
        }
    });

    // 4. Feed Header Buttons
    dom.btnFeedBack.addEventListener('click', handleFeedBackNavigation);
    dom.btnFeedRefresh.addEventListener('click', refreshCurrentFeed);

    // 5. Feed Card Interaktionen (Speichern, Rabbit Hole, Weiterlesen, Bild ein-/ausblenden)
    dom.feedList.addEventListener('click', e => {
        const toggleImgBtn = e.target.closest('.js-toggle-img');
        if (toggleImgBtn) {
            const card = toggleImgBtn.closest('.post-card');
            card.classList.toggle('image-hidden');
            toggleImgBtn.innerHTML = card.classList.contains('image-hidden')
                ? '⬆️ Bild einblenden'
                : '⬇️ Bild ausblenden';
            return;
        }

        const saveBtn = e.target.closest('.js-save-btn');
        if (saveBtn) {
            saveBookmark(saveBtn.dataset.pageId, saveBtn.dataset.title);
            return;
        }

        const rabbitBtn = e.target.closest('.js-rabbit-btn');
        if (rabbitBtn) {
            enterRabbitHole(rabbitBtn.dataset.title);
            return;
        }

        const readBtn = e.target.closest('.js-read-btn');
        if (readBtn) {
            openFullArticle(readBtn.dataset.pageId, true);
        }
    });

    // 6. Overlay Buttons
    dom.btnOverlayClose.addEventListener('click', closeOverlay);
    dom.btnOverlayBack.addEventListener('click', goBackInOverlayHistory);
    dom.btnOverlaySave.addEventListener('click', () => {
        const { pageId, title } = dom.btnOverlaySave.dataset;
        if (pageId && title) {
            saveBookmark(pageId, title);
        }
    });

    // 7. Globaler Wikipedia-Link-Interceptor (fängt alle Artikel-Links in Vorschau, Volltext & Lesezeichen ab)
    document.addEventListener('click', e => {
        const link = e.target.closest('a');
        if (!link) return;

        // Direkter Treffer über data-Attribut
        if (link.dataset.wikiTitle) {
            e.preventDefault();
            openFullArticle(link.dataset.wikiTitle, false);
            return;
        }

        const href = link.getAttribute('href');
        if (!href) return;

        // Interne Anker innerhalb eines Artikels ignorieren
        if (href.startsWith('#')) {
            e.preventDefault();
            return;
        }

        // Wikipedia-Artikel-Links erkennen und im Overlay öffnen
        if (href.startsWith('./wiki/') || href.startsWith('/wiki/') || href.includes('de.wikipedia.org/wiki/')) {
            e.preventDefault();
            let rawTitle = href
                .replace(/^https?:\/\/de\.wikipedia\.org\/wiki\//, '')
                .replace(/^\.?\/wiki\//, '')
                .split('#')[0];

            // Spezialseiten oder Datei-Seiten (z.B. Bild-Detailseiten) ignorieren bzw. Titel extrahieren
            const decodedTitle = decodeURIComponent(rawTitle);
            if (!decodedTitle.startsWith('Datei:') && !decodedTitle.startsWith('Spezial:')) {
                openFullArticle(decodedTitle, false);
            }
            return;
        }

        // Externe Weblinks in neuem Browser-Tab öffnen
        if (href.startsWith('http')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

function setupIntersectionObserver() {
    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !state.isLoading && dom.views.feed.classList.contains('active')) {
            loadMoreArticlesToDOM(2);
        }
    }, {
        root: dom.feedScrollContainer,
        rootMargin: '250px'
    });

    observer.observe(dom.feedLoader);
}

// App starten
document.addEventListener('DOMContentLoaded', initApp);
