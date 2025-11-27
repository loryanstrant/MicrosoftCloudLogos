/**
 * Microsoft Cloud Product Logos - Web Application
 * Main JavaScript file for logo gallery functionality
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        itemsPerPage: 48,
        githubBaseUrl: 'https://github.com/loryanstrant/MicrosoftCloudLogos/blob/main/',
        rawBaseUrl: 'https://raw.githubusercontent.com/loryanstrant/MicrosoftCloudLogos/main/',
        docsBaseUrl: './' // For reference links - relative to GitHub Pages
    };

    // Constants for year filter values
    const YEAR_VALUES = {
        CURRENT: 'current',
        LEGACY: 'legacy'
    };

    // Fallback image for when logo images fail to load
    const FALLBACK_IMAGE_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f2f1' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23a19f9d' font-size='12'%3ENo Preview%3C/text%3E%3C/svg%3E";

    // Reference logos in the docs folder
    const REFERENCE_LOGOS = [
        { name: 'Excel', file: 'Excel-256x256.png' },
        { name: 'Forms', file: 'Forms-256x256.png' },
        { name: 'Loop', file: 'Loop-256x256.png' },
        { name: 'M365 Copilot', file: 'M365Copilot-256x256.png' },
        { name: 'OneDrive', file: 'OneDrive-256x256.png' },
        { name: 'OneNote', file: 'OneNote-256x256.png' },
        { name: 'Outlook', file: 'Outlook-256x256.png' },
        { name: 'Planner', file: 'Planner-256x256.png' },
        { name: 'PowerPoint', file: 'PowerPoint-256x256.png' },
        { name: 'SharePoint', file: 'SharePoint-256x256.png' },
        { name: 'Stream', file: 'Stream-256x256.png' },
        { name: 'Teams', file: 'Teams-256x256.png' },
        { name: 'Viva Engage', file: 'VivaEngage-256x256.png' },
        { name: 'Whiteboard', file: 'Whiteboard-256x256.png' },
        { name: 'Word', file: 'Word-256x256.png' }
    ];

    // Folder structure for browser
    const FOLDER_STRUCTURE = [
        'Azure',
        'Copilot (not M365)',
        'Dynamics 365',
        'Entra',
        'Fabric',
        'Microsoft 365',
        'Power Platform',
        'Viva',
        'other',
        'zzLEGACY logos'
    ];

    // State
    const state = {
        filteredLogos: [],
        displayedCount: 0,
        currentFilters: {
            search: '',
            family: '',
            style: '',
            year: '',
            format: ''
        },
        sortBy: 'name-asc',
        currentFolder: '',
        charts: {}
    };

    // DOM Elements
    const elements = {
        tabs: document.querySelectorAll('.nav-tab'),
        tabContents: {
            home: document.getElementById('home-tab'),
            gallery: document.getElementById('gallery-tab'),
            folders: document.getElementById('folders-tab'),
            reference: document.getElementById('reference-tab')
        },
        searchInput: document.getElementById('search-input'),
        familyFilter: document.getElementById('family-filter'),
        styleFilter: document.getElementById('style-filter'),
        yearFilter: document.getElementById('year-filter'),
        formatFilter: document.getElementById('format-filter'),
        sortSelect: document.getElementById('sort-select'),
        clearFiltersBtn: document.getElementById('clear-filters'),
        resultsCount: document.getElementById('results-count'),
        gallery: document.getElementById('logo-gallery'),
        loadMoreBtn: document.getElementById('load-more-btn'),
        loadMoreContainer: document.getElementById('load-more-container'),
        modal: document.getElementById('logo-modal'),
        modalImage: document.getElementById('modal-image'),
        modalTitle: document.getElementById('modal-title'),
        modalFamily: document.getElementById('modal-family'),
        modalStyle: document.getElementById('modal-style'),
        modalYear: document.getElementById('modal-year'),
        modalFormat: document.getElementById('modal-format'),
        modalSize: document.getElementById('modal-size'),
        modalDownload: document.getElementById('modal-download'),
        modalGithub: document.getElementById('modal-github'),
        modalClose: document.querySelector('.modal-close'),
        totalLogos: document.getElementById('total-logos'),
        productFamilies: document.getElementById('product-families'),
        uniqueProducts: document.getElementById('unique-products'),
        themeToggle: document.getElementById('theme-toggle'),
        folderBreadcrumb: document.getElementById('folder-breadcrumb'),
        folderGrid: document.getElementById('folder-grid'),
        referenceTableBody: document.getElementById('reference-table-body')
    };

    /**
     * Initialize the application
     */
    function init() {
        // Initialize theme
        initTheme();

        // Check if logoData is available
        if (typeof logoData === 'undefined') {
            console.error('Logo data not loaded');
            return;
        }

        // Initialize stats on home page
        updateStats();

        // Initialize charts (wrapped in try-catch in case Chart.js is not loaded)
        try {
            if (typeof Chart !== 'undefined') {
                initCharts();
            }
        } catch (e) {
            console.warn('Charts could not be initialized:', e);
        }

        // Populate filter dropdowns
        populateFamilyFilter();
        populateYearFilter();

        // Initialize gallery
        state.filteredLogos = [...logoData];
        sortLogos();
        renderGallery();

        // Initialize folder browser
        renderFolderBrowser('');

        // Initialize reference links
        renderReferenceLinks();

        // Set up event listeners
        setupEventListeners();
    }

    /**
     * Initialize theme from localStorage or system preference
     */
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    /**
     * Toggle between light and dark theme
     */
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update charts for new theme
        updateChartsTheme();
    }

    /**
     * Update home page statistics
     */
    function updateStats() {
        const families = new Set(logoData.map(l => l.family));
        const uniqueProductNames = new Set(logoData.map(l => l.name));

        elements.totalLogos.textContent = logoData.length.toLocaleString();
        elements.productFamilies.textContent = families.size;
        elements.uniqueProducts.textContent = uniqueProductNames.size;
    }

    /**
     * Initialize charts
     */
    function initCharts() {
        // Get family distribution
        const familyCounts = {};
        const uniqueLogosPerFamily = {};
        
        logoData.forEach(logo => {
            familyCounts[logo.family] = (familyCounts[logo.family] || 0) + 1;
            if (!uniqueLogosPerFamily[logo.family]) {
                uniqueLogosPerFamily[logo.family] = new Set();
            }
            uniqueLogosPerFamily[logo.family].add(logo.name);
        });

        const families = Object.keys(familyCounts).sort();
        const counts = families.map(f => familyCounts[f]);
        const uniqueCounts = families.map(f => uniqueLogosPerFamily[f].size);

        // Color palette
        const colors = [
            '#0078D4', '#50A0F0', '#005A9E', '#00BCF2', '#008272',
            '#107C10', '#B4009E', '#5C2D91', '#D83B01', '#A4262C'
        ];

        // Family chart
        const familyChartCtx = document.getElementById('family-chart');
        if (familyChartCtx) {
            state.charts.familyChart = new Chart(familyChartCtx, {
                type: 'doughnut',
                data: {
                    labels: families,
                    datasets: [{
                        data: counts,
                        backgroundColor: colors.slice(0, families.length),
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 12,
                                padding: 8,
                                font: { size: 11 }
                            }
                        }
                    }
                }
            });
        }

        // Unique logos per family chart
        const uniqueLogosCtx = document.getElementById('unique-logos-chart');
        if (uniqueLogosCtx) {
            state.charts.uniqueLogosChart = new Chart(uniqueLogosCtx, {
                type: 'bar',
                data: {
                    labels: families,
                    datasets: [{
                        label: 'Unique Logos',
                        data: uniqueCounts,
                        backgroundColor: colors.slice(0, families.length),
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        updateChartsTheme();
    }

    /**
     * Update charts theme colors
     */
    function updateChartsTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#F3F2F1' : '#201F1E';
        const gridColor = isDark ? '#3B3A39' : '#E1DFDD';

        Object.values(state.charts).forEach(chart => {
            if (chart && chart.options) {
                if (chart.options.plugins && chart.options.plugins.legend) {
                    chart.options.plugins.legend.labels.color = textColor;
                }
                if (chart.options.scales) {
                    if (chart.options.scales.x) {
                        chart.options.scales.x.ticks = { color: textColor };
                        chart.options.scales.x.grid = { color: gridColor };
                    }
                    if (chart.options.scales.y) {
                        chart.options.scales.y.ticks = { color: textColor };
                        chart.options.scales.y.grid = { color: gridColor };
                    }
                }
                chart.update();
            }
        });
    }

    /**
     * Populate the product family filter dropdown
     */
    function populateFamilyFilter() {
        const families = [...new Set(logoData.map(l => l.family))].sort();
        
        families.forEach(family => {
            const option = document.createElement('option');
            option.value = family;
            option.textContent = family;
            elements.familyFilter.appendChild(option);
        });
    }

    /**
     * Populate the year filter dropdown with available years
     */
    function populateYearFilter() {
        const years = [...new Set(logoData.map(l => l.year))].filter(y => y !== YEAR_VALUES.CURRENT && y !== YEAR_VALUES.LEGACY);
        years.sort().reverse();

        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            elements.yearFilter.appendChild(option);
        });
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Theme toggle
        elements.themeToggle.addEventListener('click', toggleTheme);

        // Tab navigation
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });

        // Search input (debounced)
        let searchTimeout;
        elements.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                state.currentFilters.search = e.target.value.toLowerCase().trim();
                applyFilters();
            }, 300);
        });

        // Filter dropdowns
        elements.familyFilter.addEventListener('change', (e) => {
            state.currentFilters.family = e.target.value;
            applyFilters();
        });

        elements.styleFilter.addEventListener('change', (e) => {
            state.currentFilters.style = e.target.value;
            applyFilters();
        });

        elements.yearFilter.addEventListener('change', (e) => {
            state.currentFilters.year = e.target.value;
            applyFilters();
        });

        elements.formatFilter.addEventListener('change', (e) => {
            state.currentFilters.format = e.target.value;
            applyFilters();
        });

        // Sort dropdown
        elements.sortSelect.addEventListener('change', (e) => {
            state.sortBy = e.target.value;
            sortLogos();
            state.displayedCount = 0;
            renderGallery();
        });

        // Clear filters button
        elements.clearFiltersBtn.addEventListener('click', clearFilters);

        // Load more button
        elements.loadMoreBtn.addEventListener('click', loadMore);

        // Modal events
        elements.modalClose.addEventListener('click', closeModal);
        elements.modal.addEventListener('click', (e) => {
            if (e.target === elements.modal) {
                closeModal();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    /**
     * Switch between tabs
     * @param {string} tabName - Name of the tab to switch to
     */
    function switchTab(tabName) {
        // Update tab buttons
        elements.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        Object.entries(elements.tabContents).forEach(([name, content]) => {
            if (content) {
                content.classList.toggle('active', name === tabName);
            }
        });
    }

    /**
     * Apply all filters to the logo data
     */
    function applyFilters() {
        state.filteredLogos = logoData.filter(logo => {
            // Search filter
            if (state.currentFilters.search) {
                const searchTerm = state.currentFilters.search;
                const searchableText = `${logo.name} ${logo.family} ${logo.filename}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            // Family filter
            if (state.currentFilters.family && logo.family !== state.currentFilters.family) {
                return false;
            }

            // Style filter
            if (state.currentFilters.style) {
                if (state.currentFilters.style === 'monochrome') {
                    if (!logo.style.includes('monochrome')) {
                        return false;
                    }
                } else if (logo.style !== state.currentFilters.style) {
                    return false;
                }
            }

            // Year filter
            if (state.currentFilters.year && logo.year !== state.currentFilters.year) {
                return false;
            }

            // Format filter
            if (state.currentFilters.format && logo.format !== state.currentFilters.format) {
                return false;
            }

            return true;
        });

        sortLogos();
        state.displayedCount = 0;
        renderGallery();
    }

    /**
     * Sort the filtered logos based on current sort setting
     */
    function sortLogos() {
        const [field, direction] = state.sortBy.split('-');
        const modifier = direction === 'desc' ? -1 : 1;

        state.filteredLogos.sort((a, b) => {
            let comparison = 0;

            switch (field) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'family':
                    comparison = a.family.localeCompare(b.family) || a.name.localeCompare(b.name);
                    break;
                case 'format':
                    comparison = a.format.localeCompare(b.format) || a.name.localeCompare(b.name);
                    break;
                default:
                    comparison = a.name.localeCompare(b.name);
            }

            return comparison * modifier;
        });
    }

    /**
     * Clear all filters
     */
    function clearFilters() {
        state.currentFilters = {
            search: '',
            family: '',
            style: '',
            year: '',
            format: ''
        };

        elements.searchInput.value = '';
        elements.familyFilter.value = '';
        elements.styleFilter.value = '';
        elements.yearFilter.value = '';
        elements.formatFilter.value = '';

        applyFilters();
    }

    /**
     * Render the logo gallery
     */
    function renderGallery() {
        const startIndex = state.displayedCount;
        const endIndex = startIndex + CONFIG.itemsPerPage;
        const logosToShow = state.filteredLogos.slice(startIndex, endIndex);

        // Clear gallery if starting fresh
        if (startIndex === 0) {
            elements.gallery.innerHTML = '';
        }

        // Update results count
        elements.resultsCount.textContent = `${state.filteredLogos.length.toLocaleString()} logos found`;

        // Show empty state if no results
        if (state.filteredLogos.length === 0) {
            elements.gallery.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <h3>No logos found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            elements.loadMoreContainer.style.display = 'none';
            return;
        }

        // Create logo cards
        const fragment = document.createDocumentFragment();
        logosToShow.forEach(logo => {
            const card = createLogoCard(logo);
            fragment.appendChild(card);
        });

        elements.gallery.appendChild(fragment);
        state.displayedCount = endIndex;

        // Update load more button visibility
        const hasMore = state.displayedCount < state.filteredLogos.length;
        elements.loadMoreContainer.style.display = hasMore ? 'block' : 'none';
        elements.loadMoreBtn.disabled = !hasMore;
    }

    /**
     * Create a logo card element
     * @param {Object} logo - Logo data object
     * @returns {HTMLElement} - The logo card element
     */
    function createLogoCard(logo) {
        const card = document.createElement('div');
        card.className = 'logo-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `View ${logo.name} logo`);

        const imageUrl = buildRawImageUrl(logo.path);

        card.innerHTML = `
            <div class="logo-card-inner">
                <div class="logo-image-container">
                    <img src="${imageUrl}" alt="${escapeHtml(logo.name)}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE_SVG}'">
                </div>
                <span class="logo-format-badge">${logo.format}</span>
            </div>
            <h3 class="logo-name">${escapeHtml(logo.name)}</h3>
            <span class="logo-family">${logo.family}</span>
        `;

        // Click handler
        card.addEventListener('click', () => openModal(logo));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(logo);
            }
        });

        return card;
    }

    /**
     * Load more logos
     */
    function loadMore() {
        renderGallery();
    }

    /**
     * Open the logo modal
     * @param {Object} logo - Logo data object
     */
    function openModal(logo) {
        const imageUrl = buildRawImageUrl(logo.path);
        const githubUrl = buildGithubUrl(logo.path);

        elements.modalImage.src = imageUrl;
        elements.modalImage.alt = logo.name;
        elements.modalTitle.textContent = logo.name;
        elements.modalFamily.textContent = logo.family;
        elements.modalStyle.textContent = formatStyle(logo.style);
        elements.modalYear.textContent = formatYear(logo.year);
        elements.modalFormat.textContent = logo.format;
        elements.modalSize.textContent = logo.size || 'Variable';
        elements.modalDownload.href = imageUrl;
        elements.modalDownload.download = logo.filename;
        elements.modalGithub.href = githubUrl;

        elements.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close the logo modal
     */
    function closeModal() {
        elements.modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    /**
     * Format style for display
     * @param {string} style - Raw style string
     * @returns {string} - Formatted style string
     */
    function formatStyle(style) {
        const styleMap = {
            'full-color': 'Full Color',
            'monochrome': 'Monochrome',
            'monochrome-positive': 'Monochrome (Positive)',
            'monochrome-negative': 'Monochrome (Negative)',
            'positive': 'Positive',
            'negative': 'Negative'
        };
        return styleMap[style] || style;
    }

    /**
     * Format year for display
     * @param {string} year - Raw year string
     * @returns {string} - Formatted year string
     */
    function formatYear(year) {
        if (year === YEAR_VALUES.CURRENT) return 'Current';
        if (year === YEAR_VALUES.LEGACY) return 'Legacy';
        return year;
    }

    /**
     * Build URL for raw image access
     * @param {string} path - Logo path
     * @returns {string} - Full URL for raw image
     */
    function buildRawImageUrl(path) {
        return CONFIG.rawBaseUrl + encodeURIComponent(path).replace(/%2F/g, '/');
    }

    /**
     * Build URL for GitHub file view
     * @param {string} path - Logo path
     * @returns {string} - Full URL for GitHub file
     */
    function buildGithubUrl(path) {
        return CONFIG.githubBaseUrl + encodeURIComponent(path).replace(/%2F/g, '/');
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Render the folder browser
     * @param {string} currentPath - Current folder path
     */
    function renderFolderBrowser(currentPath) {
        state.currentFolder = currentPath;
        
        // Render breadcrumb
        renderBreadcrumb(currentPath);
        
        // Get folders and files for current path
        const foldersAndFiles = getFoldersAndFiles(currentPath);
        
        // Render folder grid
        elements.folderGrid.innerHTML = '';
        
        // Render folders
        foldersAndFiles.folders.forEach(folder => {
            const folderItem = document.createElement('div');
            folderItem.className = 'folder-item';
            folderItem.innerHTML = `
                <span class="folder-icon">📁</span>
                <span class="folder-name">${escapeHtml(folder)}</span>
            `;
            folderItem.addEventListener('click', () => {
                const newPath = currentPath ? `${currentPath}/${folder}` : folder;
                renderFolderBrowser(newPath);
            });
            elements.folderGrid.appendChild(folderItem);
        });
        
        // Render files (logos)
        foldersAndFiles.files.forEach(logo => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            const imageUrl = buildRawImageUrl(logo.path);
            fileItem.innerHTML = `
                <img src="${imageUrl}" alt="${escapeHtml(logo.name)}" class="file-preview" loading="lazy" onerror="this.src='${FALLBACK_IMAGE_SVG}'">
                <span class="file-name">${escapeHtml(logo.filename)}</span>
            `;
            fileItem.addEventListener('click', () => openModal(logo));
            elements.folderGrid.appendChild(fileItem);
        });
        
        // Show empty state if no items
        if (foldersAndFiles.folders.length === 0 && foldersAndFiles.files.length === 0) {
            elements.folderGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📂</div>
                    <h3>Empty folder</h3>
                    <p>No files or subfolders found</p>
                </div>
            `;
        }
    }

    /**
     * Render breadcrumb navigation
     * @param {string} currentPath - Current folder path
     */
    function renderBreadcrumb(currentPath) {
        elements.folderBreadcrumb.innerHTML = '';
        
        // Root
        const rootItem = document.createElement('span');
        rootItem.className = currentPath ? 'breadcrumb-item' : 'breadcrumb-current';
        rootItem.textContent = 'Root';
        if (currentPath) {
            rootItem.addEventListener('click', () => renderFolderBrowser(''));
        }
        elements.folderBreadcrumb.appendChild(rootItem);
        
        if (currentPath) {
            const parts = currentPath.split('/');
            parts.forEach((part, index) => {
                // Separator
                const separator = document.createElement('span');
                separator.className = 'breadcrumb-separator';
                separator.textContent = ' / ';
                elements.folderBreadcrumb.appendChild(separator);
                
                // Part
                const partPath = parts.slice(0, index + 1).join('/');
                const isLast = index === parts.length - 1;
                const partItem = document.createElement('span');
                partItem.className = isLast ? 'breadcrumb-current' : 'breadcrumb-item';
                partItem.textContent = part;
                if (!isLast) {
                    partItem.addEventListener('click', () => renderFolderBrowser(partPath));
                }
                elements.folderBreadcrumb.appendChild(partItem);
            });
        }
    }

    /**
     * Get folders and files for a given path
     * @param {string} currentPath - Current folder path
     * @returns {Object} - Object with folders and files arrays
     */
    function getFoldersAndFiles(currentPath) {
        const folders = new Set();
        const files = [];
        
        logoData.forEach(logo => {
            const logoPath = logo.path;
            
            if (currentPath) {
                // Check if logo is in current path or subfolder
                if (!logoPath.startsWith(currentPath + '/')) return;
                
                const relativePath = logoPath.substring(currentPath.length + 1);
                const parts = relativePath.split('/');
                
                if (parts.length === 1) {
                    // File in current folder
                    files.push(logo);
                } else {
                    // Subfolder
                    folders.add(parts[0]);
                }
            } else {
                // Root level
                const parts = logoPath.split('/');
                if (parts.length === 1) {
                    files.push(logo);
                } else {
                    folders.add(parts[0]);
                }
            }
        });
        
        return {
            folders: [...folders].sort((a, b) => a.localeCompare(b)),
            files: files.sort((a, b) => a.filename.localeCompare(b.filename))
        };
    }

    /**
     * Render reference links table
     */
    function renderReferenceLinks() {
        elements.referenceTableBody.innerHTML = '';
        
        REFERENCE_LOGOS.forEach(logo => {
            const row = document.createElement('tr');
            const relativeUrl = logo.file;
            
            row.innerHTML = `
                <td><img src="${relativeUrl}" alt="${escapeHtml(logo.name)}" class="reference-link-preview" loading="lazy"></td>
                <td>${escapeHtml(logo.name)}</td>
                <td><code class="reference-link-url">${relativeUrl}</code></td>
                <td><button class="copy-btn" data-url="${relativeUrl}">Copy URL</button></td>
            `;
            
            // Add copy functionality
            const copyBtn = row.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => {
                const fullUrl = window.location.origin + window.location.pathname.replace('index.html', '') + relativeUrl;
                navigator.clipboard.writeText(fullUrl).then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = 'Copy URL';
                    }, 2000);
                }).catch(() => {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = fullUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = 'Copy URL';
                    }, 2000);
                });
            });
            
            elements.referenceTableBody.appendChild(row);
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
