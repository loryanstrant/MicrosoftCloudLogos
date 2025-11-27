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
        rawBaseUrl: 'https://raw.githubusercontent.com/loryanstrant/MicrosoftCloudLogos/main/'
    };

    // Constants for year filter values
    const YEAR_VALUES = {
        CURRENT: 'current',
        LEGACY: 'legacy'
    };

    // Fallback image for when logo images fail to load
    const FALLBACK_IMAGE_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f2f1' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23a19f9d' font-size='12'%3ENo Preview%3C/text%3E%3C/svg%3E";

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
        sortBy: 'name-asc'
    };

    // DOM Elements
    const elements = {
        tabs: document.querySelectorAll('.nav-tab'),
        tabContents: {
            home: document.getElementById('home-tab'),
            gallery: document.getElementById('gallery-tab')
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
        formatsCount: document.getElementById('formats-count')
    };

    /**
     * Initialize the application
     */
    function init() {
        // Check if logoData is available
        if (typeof logoData === 'undefined') {
            console.error('Logo data not loaded');
            return;
        }

        // Initialize stats on home page
        updateStats();

        // Populate filter dropdowns
        populateFamilyFilter();
        populateYearFilter();

        // Initialize gallery
        state.filteredLogos = [...logoData];
        sortLogos();
        renderGallery();

        // Set up event listeners
        setupEventListeners();
    }

    /**
     * Update home page statistics
     */
    function updateStats() {
        const families = new Set(logoData.map(l => l.family));
        const formats = new Set(logoData.map(l => l.format));

        elements.totalLogos.textContent = logoData.length.toLocaleString();
        elements.productFamilies.textContent = families.size;
        elements.formatsCount.textContent = formats.size;
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
            content.classList.toggle('active', name === tabName);
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
                    <img src="${imageUrl}" alt="${logo.name}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE_SVG}'">
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

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
