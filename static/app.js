(() => {
    /* ======= STATE ======= */
    let currentPage = 1;
    let currentAnimeUrl = '';
    let currentAnimeData = null;
    let currentEpTitle = '';
    let currentEpIdx = -1;
    let historyData = JSON.parse(localStorage.getItem('pyanime_history') || '[]');
    let savedData   = JSON.parse(localStorage.getItem('pyanime_saved')   || '[]');
    let lastMainView = 'grid';
    let lastMainTitle = 'Episode terbaru';
    let lastNavId = 'nav-home';

    /* ======= ELEMENTS ======= */
    const searchInput  = document.getElementById('searchInput');
    const animeGrid    = document.getElementById('animeGrid');
    const loader       = document.getElementById('loader');
    const loadMore     = document.getElementById('loadMore');
    const pageTitle    = document.getElementById('pageTitle');

    const gridView     = document.getElementById('gridView');
    const detailView   = document.getElementById('detailView');
    const watchView    = document.getElementById('watchView');
    const historyView  = document.getElementById('historyView');
    const savedView    = document.getElementById('savedView');
    const genreView    = document.getElementById('genreView');
    const scheduleView = document.getElementById('scheduleView');

    const detailContent  = document.getElementById('detailContent');
    const watchContent   = document.getElementById('watchContent');
    const historyContent = document.getElementById('historyContent');
    const savedContent   = document.getElementById('savedContent');
    const genreContent   = document.getElementById('genreContent');

    document.getElementById('backToDetailBtn').addEventListener('click', () => {
        showView('detail');
        pageTitle.textContent = currentAnimeData?.title || 'Detail Anime';
    });

    /* ======= PWA & MOBILE DETECT ======= */
    function initPWA() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/static/sw.js').catch(err => console.log('SW Reg Failed', err));
        }

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        if (isMobile && !isStandalone) {
            document.querySelector('.main-content').style.display = 'none';
            document.getElementById('sidebar').style.display = 'none';
            document.getElementById('mobileOverlay').classList.remove('hidden');
        }

        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            const btn = document.getElementById('btnInstallPwa');
            const inst = document.getElementById('installInstruction');
            if (btn) {
                btn.classList.remove('hidden');
                inst.classList.remove('hidden');
                btn.addEventListener('click', () => {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        deferredPrompt = null;
                        btn.classList.add('hidden');
                        inst.classList.add('hidden');
                    });
                });
            }
        });
    }

    /* ======= INIT ======= */
    initPWA();
    loadOngoing(1, true);
    setNav('nav-home');

    /* ======= SEARCH ======= */
    let searchTimer;
    searchInput.addEventListener('input', e => {
        clearTimeout(searchTimer);
        const q = e.target.value.trim();
        searchTimer = setTimeout(() => {
            if (q.length > 2) doSearch(q);
            else if (q.length === 0) { loadOngoing(1, true); setNav('nav-home'); }
        }, 500);
    });

    /* ======= VIEW MANAGER ======= */
    const views = { gridView, detailView, watchView, historyView, savedView, genreView, scheduleView };
    function showView(name) {
        Object.values(views).forEach(v => v.classList.add('hidden'));
        views[name + 'View'].classList.remove('hidden');
    }

    function setNav(id) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if (id) document.getElementById(id)?.classList.add('active');
    }

    /* ======= ONGOING ======= */
    async function loadOngoing(page, reset = false) {
        if (reset) {
            currentPage = 1;
            loader.style.display = 'flex';
            animeGrid.innerHTML = '';
            loadMore.classList.add('hidden');
        }
        try {
            const data = await apiFetch(`/api/ongoing?page=${page}`);
            loader.style.display = 'none';
            renderGrid(data, reset);
            currentPage = page;
            loadMore.classList.remove('hidden');
            showView('grid');
            pageTitle.textContent = 'Episode terbaru';
        } catch {
            loader.style.display = 'none';
            animeGrid.innerHTML = emptyState('ri-wifi-off-line', 'Gagal memuat data.');
        }
    }

    /* ======= SEARCH ======= */
    async function doSearch(q) {
        loader.style.display = 'flex';
        animeGrid.innerHTML = '';
        loadMore.classList.add('hidden');
        showView('grid');
        pageTitle.textContent = `Hasil: "${q}"`;
        setNav(null);
        try {
            const data = await apiFetch(`/api/search?title=${encodeURIComponent(q)}`);
            loader.style.display = 'none';
            renderGrid(data, true);
        } catch {
            loader.style.display = 'none';
            animeGrid.innerHTML = emptyState('ri-search-line', 'Tidak ada hasil ditemukan.');
        }
    }

    /* ======= GRID ======= */
    function renderGrid(list, reset) {
        if (!list || !list.length) {
            animeGrid.innerHTML = emptyState('ri-file-search-line', 'Tidak ada anime ditemukan.');
            return;
        }
        const html = list.map(a => `
            <div class="anime-card" onclick="window.openAnime('${esc(a.url)}')">
                <div class="card-poster">
                    <img src="${a.img}" alt="${esc(a.title)}" loading="lazy"
                         onerror="this.src='https://placehold.co/155x207/edf2f7/a0aec0?text=No+Image'">
                    ${a.eps ? `<span class="eps-badge">${a.eps.trim()}</span>` : ''}
                    ${a.hari ? `<span class="day-badge">${a.hari}</span>` : ''}
                </div>
                <div class="card-info">
                    <div class="card-title" title="${esc(a.title)}">${a.title}</div>
                </div>
            </div>
        `).join('');
        if (reset) animeGrid.innerHTML = html;
        else animeGrid.insertAdjacentHTML('beforeend', html);
    }

    /* ======= ANIME DETAIL ======= */
    async function openAnime(url) {
        currentAnimeUrl = url;
        
        // Save current view state before changing to detail
        const currentActive = Object.keys(views).find(k => !views[k].classList.contains('hidden'));
        if (currentActive && currentActive !== 'detailView' && currentActive !== 'watchView') {
            lastMainView = currentActive.replace('View', '');
            lastMainTitle = pageTitle.textContent;
            const activeNav = document.querySelector('.nav-item.active');
            lastNavId = activeNav ? activeNav.id : null;
        }

        setNav(null);
        showView('detail');
        pageTitle.textContent = 'Detail Anime';
        detailContent.innerHTML = `<div class="loader-wrap"><div class="spinner"></div></div>`;
        try {
            const data = await apiFetch(`/api/episodes?url=${encodeURIComponent(url)}`);
            currentAnimeData = data;
            renderDetail(data);
        } catch {
            detailContent.innerHTML = emptyState('ri-error-warning-line', 'Gagal memuat detail.');
        }
    }

    function renderDetail(anime) {
        pageTitle.textContent = anime.title;
        currentEpTitle = anime.title;
        const isSaved = savedData.some(s => s.url === currentAnimeUrl);

        // Parse info into chips
        const infoParts = anime.info.split('\n').filter(Boolean);

        const episodesHtml = anime.episodes.map((ep, i) => `
            <div class="episode-item" id="ep-item-${i}" onclick="window.openWatch(${i})">
                <div class="episode-item-left">
                    <h4>${ep.title}</h4>
                    <span>${ep.date}</span>
                </div>
                <i class="ri-play-circle-line" style="color:var(--accent);font-size:1.1rem;flex-shrink:0;"></i>
            </div>
        `).join('');

        const recHtml = (anime.recommend || []).map(r => `
            <div class="rec-card" onclick="window.openAnime('${esc(r.url)}')">
                <img src="${r.cover}" alt="${esc(r.title)}"
                     onerror="this.src='https://placehold.co/90x135/edf2f7/a0aec0?text=?'">
                <div class="rec-card-title">${r.title}</div>
            </div>
        `).join('');

        detailContent.innerHTML = `
            <!-- TOP: poster + info -->
            <div class="detail-top">
                <div class="detail-poster-wrap">
                    <img src="${anime.cover}" alt="${esc(anime.title)}" class="detail-poster"
                         onerror="this.src='https://placehold.co/160x224/edf2f7/a0aec0?text=No+Image'">
                </div>
                <div class="detail-right">
                    <div class="detail-title">${anime.title}</div>
                    <div class="detail-meta-bar">
                        ${infoParts.map(p => `<span><i class="ri-information-line"></i>${p}</span>`).join('')}
                    </div>
                    <div class="detail-synopsis-short">${anime.sinopsis}</div>
                    <div class="detail-actions">
                        <button class="btn-save ${isSaved ? 'saved' : ''}" id="saveBtnTop"
                                onclick="window.toggleSave('${esc(currentAnimeUrl)}', '${esc(anime.title)}', '${esc(anime.cover)}')">
                            <i class="${isSaved ? 'ri-bookmark-fill' : 'ri-bookmark-line'}"></i>
                            ${isSaved ? 'Tersimpan' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </div>

            <!-- BOTTOM: episode list (left) + sinopsis + rec (right) -->
            <div class="detail-bottom">
                <!-- Left: episode list -->
                <div>
                    <div class="sec-header">Daftar Episode (${anime.episodes.length})</div>
                    <div class="episode-list">${episodesHtml}</div>
                </div>

                <!-- Right: sinopsis + recommendations -->
                <div>
                    <div class="sec-header">Sinopsis</div>
                    <div class="sinopsis-box">
                        <div class="sinopsis-text">${anime.sinopsis}</div>
                    </div>
                    ${recHtml ? `
                    <div style="margin-top:1rem;">
                        <div class="sec-header">Rekomendasi Serupa</div>
                        <div class="rec-grid">${recHtml}</div>
                    </div>` : ''}
                </div>
            </div>
        `;
    }

    /* ======= WATCH EPISODE ======= */
    async function openWatch(epIdx) {
        if (!currentAnimeData) return;
        currentEpIdx = epIdx;
        const ep = currentAnimeData.episodes[epIdx];
        pageTitle.textContent = ep.title;

        showView('watch');

        // Build episode list sidebar
        const epListHtml = currentAnimeData.episodes.map((e, i) => `
            <div class="watch-ep-item ${i === epIdx ? 'active' : ''}" onclick="window.openWatch(${i})">
                ${e.title}
                <span>${e.date}</span>
            </div>
        `).join('');

        watchContent.innerHTML = `
            <div class="watch-layout">
                <div class="watch-left">
                    <!-- Player -->
                    <div class="player-container" id="playerBox">
                        <div class="loader-wrap" style="position:absolute;inset:0;background:#111;z-index:5;border-radius:10px;">
                            <div class="spinner" style="border-color:rgba(255,255,255,0.15);border-top-color:white;"></div>
                        </div>
                    </div>

                    <!-- Controls -->
                    <div class="player-controls">
                        <div class="player-ep-title">${ep.title}</div>
                        <div id="qualityControls">
                            <div class="quality-row">
                                <span class="q-label">Kualitas:</span>
                                <div class="spinner" style="width:16px;height:16px;border-width:2px;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Download -->
                    <div class="dl-section">
                        <h3>Link Unduhan</h3>
                        <div class="dl-links" id="dlLinks">
                            <div class="spinner" style="width:16px;height:16px;border-width:2px;"></div>
                        </div>
                    </div>
                </div>

                <!-- Episode list sidebar -->
                <div class="watch-right">
                    <div class="watch-right-header">Episode List</div>
                    <div class="watch-ep-list">${epListHtml}</div>
                </div>
            </div>
        `;

        // Add to history
        addHistory({ url: ep.url, epTitle: ep.title, animeTitle: currentAnimeData.title, cover: currentAnimeData.cover, timestamp: Date.now() });

        // Fetch streams + downloads in parallel
        try {
            const [sData, dData] = await Promise.all([
                apiFetch(`/api/streams?url=${encodeURIComponent(ep.url)}`),
                apiFetch(`/api/download?url=${encodeURIComponent(ep.url)}`)
            ]);
            renderPlayerControls(sData || {}, dData || {});
        } catch {
            document.getElementById('qualityControls').innerHTML =
                '<span style="font-size:0.8rem;color:#e53e3e;">Gagal memuat stream.</span>';
        }
    }

    function renderPlayerControls(streams, downloads) {
        const order = ['360p', '480p', '720p', '1080p'];
        const avail = order.filter(q => streams[q] && Object.keys(streams[q]).length > 0);
        const defQ = avail.includes('480p') ? '480p' : avail[0];
        const defUrl = defQ ? Object.values(streams[defQ])[0] : null;

        // Render iframe
        const playerBox = document.getElementById('playerBox');
        if (defUrl) {
            playerBox.innerHTML = `<iframe src="${defUrl}" frameborder="0" allowfullscreen allow="autoplay; fullscreen"></iframe>`;
        } else {
            playerBox.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#999;font-size:0.85rem;">Stream tidak tersedia</div>`;
        }

        // Quality + server controls
        let html = '';
        if (avail.length) {
            html += `<div class="quality-row"><span class="q-label">Kualitas:</span>`;
            avail.forEach(q => {
                html += `<button class="quality-btn ${q === defQ ? 'active' : ''}" data-quality="${q}" onclick="window.switchQ(this)">${q}</button>`;
            });
            html += `</div>`;

            avail.forEach(q => {
                html += `<div class="server-row quality-servers" data-quality="${q}" style="display:${q === defQ ? 'flex' : 'none'}">
                    <span class="q-label">Server:</span>`;
                Object.entries(streams[q]).forEach(([srv, sUrl], i) => {
                    html += `<button class="server-btn ${i === 0 ? 'active' : ''}" onclick="window.switchSrv(this,'${esc(sUrl)}')">${srv}</button>`;
                });
                html += `</div>`;
            });
        } else {
            html = '<span style="font-size:0.8rem;color:var(--text-muted);">Tidak ada stream tersedia</span>';
        }
        document.getElementById('qualityControls').innerHTML = html;

        // Download links
        const dlDiv = document.getElementById('dlLinks');
        const dls = Object.entries(downloads).filter(([k]) => k !== 'stream_url');
        dlDiv.innerHTML = dls.length
            ? dls.map(([q, l]) => `<a href="${l}" target="_blank" class="dl-badge"><i class="ri-download-line"></i> ${q}</a>`).join('')
            : '<span style="font-size:0.78rem;color:var(--text-muted);">Tidak ada link unduhan</span>';
    }

    /* ======= HISTORY ======= */
    function addHistory(item) {
        historyData = historyData.filter(h => h.url !== item.url);
        historyData.unshift(item);
        if (historyData.length > 50) historyData = historyData.slice(0, 50);
        localStorage.setItem('pyanime_history', JSON.stringify(historyData));
    }

    function renderHistory() {
        if (!historyData.length) {
            historyContent.innerHTML = emptyState('ri-history-line', 'Belum ada riwayat tontonan.');
            return;
        }
        historyContent.innerHTML = `
            <div class="sec-header" style="margin-bottom:0.75rem;">Riwayat Tontonan</div>
            <div class="episode-list">
                ${historyData.map(h => `
                    <div class="episode-item" onclick="window.openAnimeForWatch('${esc(h.url)}','${esc(h.animeTitle)}','${esc(h.cover || '')}')">
                        <div class="episode-item-left">
                            <h4>${h.epTitle}</h4>
                            <span>${h.animeTitle} · ${new Date(h.timestamp).toLocaleDateString('id-ID')}</span>
                        </div>
                        <i class="ri-play-circle-line" style="color:var(--accent);font-size:1.1rem;"></i>
                    </div>
                `).join('')}
            </div>`;
    }

    /* ======= SAVED ======= */
    function toggleSave(url, title, cover) {
        const idx = savedData.findIndex(s => s.url === url);
        if (idx >= 0) savedData.splice(idx, 1);
        else savedData.unshift({ url, title, cover });
        localStorage.setItem('pyanime_saved', JSON.stringify(savedData));
        openAnime(url); // re-render detail
    }

    function renderSaved() {
        if (!savedData.length) {
            savedContent.innerHTML = emptyState('ri-bookmark-line', 'Belum ada anime yang disimpan.');
            return;
        }
        savedContent.innerHTML = `
            <div class="sec-header" style="margin-bottom:0.75rem;">Anime Tersimpan</div>
            <div class="anime-grid">
                ${savedData.map(a => `
                    <div class="anime-card" onclick="window.openAnime('${esc(a.url)}')">
                        <div class="card-poster">
                            <img src="${a.cover}" alt="${esc(a.title)}" loading="lazy"
                                 onerror="this.src='https://placehold.co/155x207/edf2f7/a0aec0?text=?'">
                        </div>
                        <div class="card-info"><div class="card-title">${a.title}</div></div>
                    </div>
                `).join('')}
            </div>`;
    }

    /* ======= GENRE ======= */
    async function loadGenre() {
        genreContent.innerHTML = `<div class="loader-wrap"><div class="spinner"></div></div>`;
        try {
            const genres = await apiFetch('/api/genres');
            const tabs = Object.entries(genres).map(([name, path], i) =>
                `<button class="genre-tab ${i === 0 ? 'active' : ''}" data-path="${esc(path)}" onclick="window.selectGenre(this)">${name}</button>`
            ).join('');

            genreContent.innerHTML = `
                <div class="genre-tabs">${tabs}</div>
                <div id="genreGrid" class="anime-grid"><div class="loader-wrap"><div class="spinner"></div></div></div>`;

            // Auto-load first genre
            const firstPath = Object.values(genres)[0];
            if (firstPath) loadGenreAnimes(firstPath);
        } catch {
            genreContent.innerHTML = emptyState('ri-error-warning-line', 'Gagal memuat daftar genre.');
        }
    }

    async function loadGenreAnimes(path) {
        const grid = document.getElementById('genreGrid');
        if (!grid) return;
        grid.innerHTML = `<div class="loader-wrap"><div class="spinner"></div></div>`;
        try {
            const list = await apiFetch(`/api/genre?path=${encodeURIComponent(path)}`);
            grid.innerHTML = '';
            renderGridInto(grid, list);
        } catch {
            grid.innerHTML = emptyState('ri-error-warning-line', 'Gagal memuat anime genre.');
        }
    }

    function renderGridInto(container, list) {
        if (!list || !list.length) { container.innerHTML = emptyState('ri-file-search-line', 'Tidak ada anime.'); return; }
        container.innerHTML = list.map(a => `
            <div class="anime-card" onclick="window.openAnime('${esc(a.url)}')">
                <div class="card-poster">
                    <img src="${a.img}" alt="${esc(a.title)}" loading="lazy"
                         onerror="this.src='https://placehold.co/155x207/edf2f7/a0aec0?text=No+Image'">
                    ${a.eps ? `<span class="eps-badge">${a.eps.trim()}</span>` : ''}
                </div>
                <div class="card-info"><div class="card-title" title="${esc(a.title)}">${a.title}</div></div>
            </div>
        `).join('');
    }

    /* ======= SCHEDULE ======= */
    async function loadSchedule() {
        const content = document.getElementById('scheduleContent');
        content.innerHTML = `<div class="loader-wrap"><div class="spinner"></div></div>`;

        // Build schedule from new schedule API
        try {
            const byDay = await apiFetch('/api/schedule');
            const dayOrder = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu', 'Random'];
            const sorted = dayOrder.filter(d => byDay[d]).concat(Object.keys(byDay).filter(d => !dayOrder.includes(d)));

            content.innerHTML = `<div class="schedule-list">` +
                sorted.map(day => `
                    <div class="schedule-day">
                        <div class="day-label">${day}</div>
                        <div class="day-animes">
                            ${byDay[day].map(a => `
                                <div class="anime-card" style="width:120px;flex-shrink:0;" onclick="window.openAnime('${esc(a.url)}')">
                                    <div class="card-poster">
                                        <img src="${a.img || 'https://placehold.co/120x160/edf2f7/a0aec0?text=Anime'}" alt="${esc(a.title)}" loading="lazy">
                                    </div>
                                    <div class="card-info"><div class="card-title">${a.title}</div></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('') + `</div>`;
        } catch {
            content.innerHTML = emptyState('ri-calendar-line', 'Gagal memuat jadwal.');
        }
    }

    /* ======= HELPERS ======= */
    async function apiFetch(path) {
        const res = await fetch(path);
        const json = await res.json();
        if (json.status !== 'success') throw new Error(json.detail || 'API error');
        return json.data;
    }

    function esc(s) {
        return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    }

    function emptyState(icon, msg) {
        return `<div class="empty-state"><i class="${icon}"></i><p>${msg}</p></div>`;
    }

    /* ======= GLOBAL EXPORTS ======= */
    window.openAnime     = openAnime;
    window.loadNextPage  = () => loadOngoing(currentPage + 1, false);
    window.gotoHome      = e => { e?.preventDefault(); searchInput.value = ''; setNav('nav-home'); loadOngoing(1, true); };
    window.gotoHistory   = e => { e?.preventDefault(); setNav('nav-history'); showView('history'); pageTitle.textContent = 'Riwayat'; renderHistory(); };
    window.gotoSaved     = e => { e?.preventDefault(); setNav('nav-saved'); showView('saved'); pageTitle.textContent = 'Tersimpan'; renderSaved(); };
    window.gotoGenre     = e => { e?.preventDefault(); setNav('nav-genre'); showView('genre'); pageTitle.textContent = 'Genre Anime'; loadGenre(); };
    window.gotoSchedule  = e => { e?.preventDefault(); setNav('nav-schedule'); showView('schedule'); pageTitle.textContent = 'Jadwal Anime'; loadSchedule(); };
    window.goBack        = () => { 
        showView(lastMainView); 
        pageTitle.textContent = lastMainTitle; 
        setNav(lastNavId); 
    };
    window.toggleSave    = toggleSave;
    window.openWatch     = openWatch;
    window.selectGenre   = btn => {
        document.querySelectorAll('.genre-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadGenreAnimes(btn.dataset.path);
    };
    window.switchQ = btn => {
        const q = btn.dataset.quality;
        btn.closest('.player-controls').querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.quality-servers').forEach(el => { el.style.display = el.dataset.quality === q ? 'flex' : 'none'; });
        document.querySelector(`.quality-servers[data-quality="${q}"] .server-btn`)?.click();
    };
    window.switchSrv = (btn, url) => {
        btn.closest('.quality-servers').querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const box = document.getElementById('playerBox');
        if (box) box.innerHTML = `<iframe src="${url}" frameborder="0" allowfullscreen allow="autoplay; fullscreen"></iframe>`;
    };
    window.openAnimeForWatch = async (epUrl, animeTitle, cover) => {
        // Open from history - need to find parent anime url
        // Just show a generic watch without episode list
        showView('watch');
        pageTitle.textContent = animeTitle;
        watchContent.innerHTML = `<div class="watch-layout">
            <div class="watch-left">
                <div class="player-container" id="playerBox">
                    <div class="loader-wrap" style="position:absolute;inset:0;background:#111;z-index:5;border-radius:10px;">
                        <div class="spinner" style="border-color:rgba(255,255,255,0.15);border-top-color:white;"></div>
                    </div>
                </div>
                <div class="player-controls">
                    <div class="player-ep-title">${animeTitle}</div>
                    <div id="qualityControls"><div class="spinner" style="width:16px;height:16px;border-width:2px;"></div></div>
                </div>
                <div class="dl-section"><h3>Link Unduhan</h3><div class="dl-links" id="dlLinks"><div class="spinner" style="width:16px;height:16px;border-width:2px;"></div></div></div>
            </div>
            <div class="watch-right">
                <div class="watch-right-header">Episode</div>
                <div class="watch-ep-list"><div class="watch-ep-item active">${animeTitle}</div></div>
            </div>
        </div>`;
        try {
            const [sData, dData] = await Promise.all([
                apiFetch(`/api/streams?url=${encodeURIComponent(epUrl)}`),
                apiFetch(`/api/download?url=${encodeURIComponent(epUrl)}`)
            ]);
            renderPlayerControls(sData || {}, dData || {});
        } catch {
            document.getElementById('qualityControls').innerHTML = '<span style="color:#e53e3e;font-size:0.8rem;">Gagal memuat stream.</span>';
        }
    };
})();
