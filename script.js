// Release Notes Interactive Functionality
class ReleaseNotesApp {
    constructor() {
        this.versionItems = document.querySelectorAll('.version-item');
        this.releaseContents = document.querySelectorAll('.release-content');
        this.searchInput = document.getElementById('searchInput');
        this.versionList = document.getElementById('versionList');
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadActiveVersion();
        this.setupSearch();
        this.setupKeyboardNavigation();
        this.addScrollToTopButton();
    }

    bindEvents() {
        // Version item click events
        this.versionItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const version = item.dataset.version;
                this.showVersion(version);
                this.setActiveVersion(item);
                this.updateURL(version);
            });

            // Add hover effect for better UX
            item.addEventListener('mouseenter', () => {
                if (!item.classList.contains('active')) {
                    item.style.transform = 'translateX(4px)';
                }
            });

            item.addEventListener('mouseleave', () => {
                if (!item.classList.contains('active')) {
                    item.style.transform = 'translateX(0)';
                }
            });
        });

        // Search input events
        this.searchInput.addEventListener('input', this.debounce((e) => {
            this.handleSearch(e.target.value);
        }, 300));

        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleSearchEnter();
            }
        });

        // Window events
        window.addEventListener('popstate', () => {
            this.loadVersionFromURL();
        });

        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
    }

    showVersion(version) {
        // Hide all release contents
        this.releaseContents.forEach(content => {
            content.classList.remove('active');
        });

        // Show selected version content
        const targetContent = document.querySelector(`[data-version="${version}"]`);
        if (targetContent && targetContent.classList.contains('release-content')) {
            targetContent.classList.add('active');
            
            // Scroll to top of content area
            const contentArea = document.querySelector('.content-area');
            contentArea.scrollTop = 0;
            
            // Add smooth reveal animation
            setTimeout(() => {
                targetContent.style.opacity = '1';
                targetContent.style.transform = 'translateY(0)';
            }, 50);
        } else {
            // Show default content if version not found
            const defaultContent = document.querySelector('.default-content');
            if (defaultContent) {
                defaultContent.classList.add('active');
            }
        }
    }

    setActiveVersion(activeItem) {
        // Remove active class from all items
        this.versionItems.forEach(item => {
            item.classList.remove('active');
            item.style.transform = 'translateX(0)';
        });

        // Add active class to selected item
        activeItem.classList.add('active');
        activeItem.style.transform = 'translateX(8px)';

        // Scroll the active item into view if needed
        this.scrollToActiveItem(activeItem);
    }

    scrollToActiveItem(item) {
        const sidebar = document.querySelector('.sidebar');
        const itemRect = item.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();

        if (itemRect.top < sidebarRect.top || itemRect.bottom > sidebarRect.bottom) {
            item.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    loadActiveVersion() {
        // Check URL for version parameter
        const urlVersion = this.getVersionFromURL();
        if (urlVersion) {
            this.loadVersion(urlVersion);
        } else {
            // Load first version by default
            const firstItem = this.versionItems[0];
            if (firstItem) {
                const version = firstItem.dataset.version;
                this.showVersion(version);
                this.setActiveVersion(firstItem);
            }
        }
    }

    loadVersion(version) {
        const versionItem = document.querySelector(`[data-version="${version}"]`);
        if (versionItem && versionItem.classList.contains('version-item')) {
            this.showVersion(version);
            this.setActiveVersion(versionItem);
        }
    }

    getVersionFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('version');
    }

    loadVersionFromURL() {
        const version = this.getVersionFromURL();
        if (version) {
            this.loadVersion(version);
        }
    }

    updateURL(version) {
        const url = new URL(window.location);
        url.searchParams.set('version', version);
        window.history.pushState({}, '', url);
    }

    setupSearch() {
        this.originalVersionItems = Array.from(this.versionItems);
    }

    handleSearch(query) {
        const normalizedQuery = query.toLowerCase().trim();
        
        if (normalizedQuery === '') {
            // Show all versions
            this.showAllVersions();
            this.removeHighlights();
            return;
        }

        let hasResults = false;
        this.versionItems.forEach(item => {
            const versionText = item.textContent.toLowerCase();
            const isMatch = versionText.includes(normalizedQuery);
            
            if (isMatch) {
                item.style.display = 'flex';
                this.highlightText(item, normalizedQuery);
                hasResults = true;
            } else {
                item.style.display = 'none';
                this.removeHighlight(item);
            }
        });

        // Show no results message if needed
        this.toggleNoResultsMessage(!hasResults);
    }

    handleSearchEnter() {
        // Find first visible version and select it
        const firstVisible = Array.from(this.versionItems).find(item => 
            item.style.display !== 'none'
        );
        
        if (firstVisible) {
            firstVisible.click();
            this.searchInput.blur();
        }
    }

    showAllVersions() {
        this.versionItems.forEach(item => {
            item.style.display = 'flex';
        });
        this.toggleNoResultsMessage(false);
    }

    highlightText(element, query) {
        const versionNumber = element.querySelector('.version-number');
        if (versionNumber) {
            const originalText = versionNumber.dataset.originalText || versionNumber.textContent;
            versionNumber.dataset.originalText = originalText;
            
            const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
            const highlightedText = originalText.replace(regex, '<span class="highlight">$1</span>');
            versionNumber.innerHTML = highlightedText;
        }
    }

    removeHighlight(element) {
        const versionNumber = element.querySelector('.version-number');
        if (versionNumber && versionNumber.dataset.originalText) {
            versionNumber.textContent = versionNumber.dataset.originalText;
        }
    }

    removeHighlights() {
        this.versionItems.forEach(item => {
            this.removeHighlight(item);
        });
    }

    toggleNoResultsMessage(show) {
        let noResultsMsg = document.querySelector('.no-results-message');
        
        if (show && !noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results-message';
            noResultsMsg.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #6b7280;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
                    <div style="font-weight: 500; margin-bottom: 0.25rem;">No versions found</div>
                    <div style="font-size: 0.875rem;">Try adjusting your search terms</div>
                </div>
            `;
            this.versionList.appendChild(noResultsMsg);
        } else if (!show && noResultsMsg) {
            noResultsMsg.remove();
        }
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Handle keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'f':
                        e.preventDefault();
                        this.searchInput.focus();
                        break;
                    case 'k':
                        e.preventDefault();
                        this.navigateVersions('up');
                        break;
                    case 'j':
                        e.preventDefault();
                        this.navigateVersions('down');
                        break;
                }
            }

            // Handle escape key
            if (e.key === 'Escape') {
                if (document.activeElement === this.searchInput) {
                    this.searchInput.blur();
                    this.searchInput.value = '';
                    this.handleSearch('');
                }
            }
        });
    }

    navigateVersions(direction) {
        const activeItem = document.querySelector('.version-item.active');
        if (!activeItem) return;

        const visibleItems = Array.from(this.versionItems).filter(item => 
            item.style.display !== 'none'
        );
        const currentIndex = visibleItems.indexOf(activeItem);
        
        let nextIndex;
        if (direction === 'up') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : visibleItems.length - 1;
        } else {
            nextIndex = currentIndex < visibleItems.length - 1 ? currentIndex + 1 : 0;
        }

        const nextItem = visibleItems[nextIndex];
        if (nextItem) {
            nextItem.click();
        }
    }

    addScrollToTopButton() {
        const scrollButton = document.createElement('button');
        scrollButton.innerHTML = '↑';
        scrollButton.className = 'scroll-to-top';
        scrollButton.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            background: #4f46e5;
            color: white;
            border: none;
            font-size: 1.25rem;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        `;

        document.body.appendChild(scrollButton);

        // Show/hide button based on scroll
        const contentArea = document.querySelector('.content-area');
        contentArea.addEventListener('scroll', this.debounce(() => {
            if (contentArea.scrollTop > 300) {
                scrollButton.style.opacity = '1';
                scrollButton.style.visibility = 'visible';
            } else {
                scrollButton.style.opacity = '0';
                scrollButton.style.visibility = 'hidden';
            }
        }, 100));

        // Scroll to top on click
        scrollButton.addEventListener('click', () => {
            contentArea.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    handleResize() {
        // Adjust layout for mobile
        const isMobile = window.innerWidth <= 1024;
        const sidebar = document.querySelector('.sidebar');
        
        if (isMobile) {
            sidebar.style.position = 'static';
            sidebar.style.height = 'auto';
        } else {
            sidebar.style.position = 'sticky';
            sidebar.style.height = 'calc(100vh - 120px)';
        }
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReleaseNotesApp();
    
    // Add loading animation
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 1;
        transition: opacity 0.5s;
    `;
    loadingOverlay.innerHTML = '<div class="loading"></div>';
    
    document.body.appendChild(loadingOverlay);
    
    // Hide loading after initialization
    setTimeout(() => {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.remove();
        }, 500);
    }, 1000);
});

// Add some helper functions to window for external access
window.ReleaseNotesHelpers = {
    scrollToVersion: (version) => {
        const versionItem = document.querySelector(`[data-version="${version}"]`);
        if (versionItem) {
            versionItem.click();
        }
    },
    
    searchVersions: (query) => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = query;
            searchInput.dispatchEvent(new Event('input'));
        }
    }
};