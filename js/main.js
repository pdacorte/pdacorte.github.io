/**
 * main.js - SPA Router, Theme, Mobile Menu
 *
 * Hash-based routing: #/ (home), #/about, #/blog, #/blog/filename.md
 * Page partials are fetched from pages/ directory and injected into #app.
 * After injection, page-specific init functions are called (Blog.init, Post.init).
 */

(function () {
  'use strict';

  // ---- Configuration ----
  var TRANSITION_MS = 120; // page enter duration (match CSS)
  var currentRoute = null;
  var activeNavigationId = 0;
  var partialCache = {};
  var partialPromises = {};
  var suppressNextHashChange = false;

  // ---- Theme ----
  function getStoredTheme() {
    return localStorage.getItem('theme') || 'dark';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeToggle(theme);
  }

  function updateThemeToggle(theme) {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    var sunIcon = toggle.querySelector('.icon-sun');
    var moonIcon = toggle.querySelector('.icon-moon');
    var label = toggle.querySelector('.toggle-label');

    if (theme === 'dark') {
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
      if (label) label.textContent = 'Light mode';
    } else {
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
      if (label) label.textContent = 'Dark mode';
    }
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  // Apply saved theme immediately to prevent flash
  setTheme(getStoredTheme());

  // ---- Router ----

  /**
   * Parse the hash into a route object.
   * Examples:
   *   #/           -> { page: 'home', param: null }
   *   #/about      -> { page: 'about', param: null }
   *   #/blog       -> { page: 'blog', param: null }
   *   #/blog?page=2 -> { page: 'blog', param: null, query: 'page=2' }
   *   #/blog/my-post.md -> { page: 'post', param: 'my-post.md' }
   */
  function parseHash() {
    var hash = window.location.hash || '#/';
    // Remove the leading '#'
    var path = hash.substring(1);

    // Separate query string if present
    var queryIndex = path.indexOf('?');
    var query = '';
    if (queryIndex !== -1) {
      query = path.substring(queryIndex + 1);
      path = path.substring(0, queryIndex);
    }

    // Normalize: ensure leading slash, remove trailing slash (except root)
    if (!path.startsWith('/')) path = '/' + path;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);

    // Route matching
    if (path === '/' || path === '') {
      return { page: 'home', param: null, query: query };
    }
    if (path === '/about') {
      return { page: 'about', param: null, query: query };
    }
    if (path === '/blog') {
      return { page: 'blog', param: null, query: query };
    }
    // Blog post: #/blog/filename.md
    var blogMatch = path.match(/^\/blog\/(.+\.md)$/);
    if (blogMatch) {
      return { page: 'post', param: blogMatch[1], query: query };
    }

    // Fallback to home
    return { page: 'home', param: null, query: query };
  }

  /**
   * Map a route page name to its partial HTML file.
   */
  function getPartialPath(page) {
    var map = {
      home: 'pages/home.html',
      about: 'pages/about.html',
      blog: 'pages/blog.html',
      post: 'pages/post.html',
    };
    return map[page] || map.home;
  }

  /**
   * Map a route page name to a document title.
   */
  function getPageTitle(page) {
    var map = {
      home: 'Paulo da Corte - Portfolio',
      about: 'About - Paulo da Corte',
      blog: 'Blog - Paulo da Corte',
      post: 'Blog Post - Paulo da Corte',
    };
    return map[page] || map.home;
  }

  /**
   * Fetch a page partial's HTML content.
   */
  async function fetchPartial(path) {
    if (partialCache[path]) return partialCache[path];
    if (partialPromises[path]) return partialPromises[path];

    partialPromises[path] = (async function () {
      try {
        var response = await fetch(path);
        if (!response.ok) throw new Error('Failed to load ' + path);

        var html = await response.text();
        partialCache[path] = html;
        return html;
      } finally {
        delete partialPromises[path];
      }
    })();

    return partialPromises[path];
  }

  function shouldAnimateTransitions() {
    if (typeof window.matchMedia !== 'function') return true;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function queuePageInit(route, navigationId) {
    setTimeout(function () {
      if (navigationId !== activeNavigationId) return;

      initPage(route).catch(function (err) {
        console.error('Page init error:', err);
      });
    }, 0);
  }

  /**
   * Navigate to a route. Handles transition animation.
   * @param {boolean} isInitial - true on first load (no fade-out needed)
   */
  async function navigate(isInitial) {
    var route = parseHash();

    // Skip if same route (unless it's initial load)
    if (!isInitial && currentRoute &&
        currentRoute.page === route.page &&
        currentRoute.param === route.param &&
        currentRoute.query === route.query) {
      return;
    }

    var navigationId = ++activeNavigationId;

    var app = document.getElementById('app');
    if (!app) return;

    var shouldAnimate = (!isInitial && shouldAnimateTransitions());
    var partialPromise = fetchPartial(getPartialPath(route.page));

    // Phase 1: Fetch and inject new content
    try {
      var html = await partialPromise;
      if (navigationId !== activeNavigationId) return;
      app.innerHTML = html;
    } catch (err) {
      if (navigationId !== activeNavigationId) return;
      console.error('Navigation error:', err);
      app.innerHTML = '<div class="empty-state"><h3>Page not found</h3><p><a href="#/">Go home</a></p></div>';
    }

    // Phase 3: Update state
    currentRoute = route;
    document.title = getPageTitle(route.page);
    highlightActiveNav(route.page);

    // Phase 3: Fade in new content as soon as partial HTML is ready
    app.classList.remove('page-exit');
    if (shouldAnimate) {
      app.classList.add('page-enter');

      // Remove animation class after it completes
      setTimeout(function () {
        if (navigationId !== activeNavigationId) return;
        app.classList.remove('page-enter');
      }, TRANSITION_MS + 80);
    } else {
      app.classList.remove('page-enter');
    }

    // Scroll to top
    if (window.scrollY > 0) {
      window.scrollTo(0, 0);
    }

    // Phase 4: Run page-specific init after next paint (keeps interactions snappy)
    queuePageInit(route, navigationId);
  }

  /**
   * Call the appropriate page initializer after injecting HTML.
   */
  async function initPage(route) {
    switch (route.page) {
      case 'blog':
        if (typeof window.BlogPage !== 'undefined') {
          await window.BlogPage.init(route.query);
        }
        break;
      case 'post':
        if (typeof window.PostPage !== 'undefined') {
          await window.PostPage.init(route.param);
        }
        break;
      // home and about are static -- no JS init needed
    }
  }

  // ---- Active Nav Highlighting ----
  function highlightActiveNav(page) {
    var links = document.querySelectorAll('.sidebar-nav a');
    links.forEach(function (link) {
      var linkPage = link.getAttribute('data-page');
      // 'post' pages highlight the 'blog' nav item
      var isActive = (linkPage === page) || (page === 'post' && linkPage === 'blog');
      if (isActive) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // ---- Theme Toggle ----
  function setupThemeToggle() {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    updateThemeToggle(getStoredTheme());
    toggle.addEventListener('click', toggleTheme);
  }

  // ---- Mobile Menu ----
  function setupMobileMenu() {
    var hamburger = document.getElementById('hamburger');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');

    if (!hamburger || !sidebar) return;

    function openMenu() {
      hamburger.classList.add('active');
      sidebar.classList.add('open');
      if (overlay) {
        overlay.style.display = 'block';
        window.requestAnimationFrame(function () {
          overlay.classList.add('active');
        });
      }
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      hamburger.classList.remove('active');
      sidebar.classList.remove('open');
      if (overlay) {
        overlay.classList.remove('active');
        setTimeout(function () {
          overlay.style.display = 'none';
        }, 250);
      }
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', function () {
      if (sidebar.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    // Close on nav link click (mobile)
    sidebar.addEventListener('click', function (e) {
      if (e.target.closest('.sidebar-nav a')) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  function preloadPartials() {
    var pages = ['home', 'about', 'blog', 'post'];

    pages.forEach(function (page) {
      fetchPartial(getPartialPath(page)).catch(function () {
        // Ignore preload errors; normal navigation will handle failures.
      });
    });
  }

  function preloadPageData() {
    if (typeof window.BlogPage !== 'undefined' && typeof window.BlogPage.preload === 'function') {
      window.BlogPage.preload();
    }

    if (typeof window.PostPage !== 'undefined' && typeof window.PostPage.preload === 'function') {
      window.PostPage.preload();
    }
  }

  function schedulePreload() {
    var run = function () {
      preloadPageData();
    };

    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(run);
    } else {
      setTimeout(run, 1500);
    }
  }

  // ---- Intercept internal link clicks for SPA navigation ----
  function setupLinkInterception() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;

      var href = link.getAttribute('href');
      if (!href) return;

      // Only intercept hash links (internal SPA navigation)
      if (href.startsWith('#')) {
        e.preventDefault();
        // Update hash (which triggers hashchange -> navigate)
        if (window.location.hash !== href) {
          suppressNextHashChange = true;
          window.location.hash = href;
          navigate(false);
        } else {
          // Same hash -- force re-navigate (e.g., clicking current page)
          navigate(false);
        }
      }
      // External links (http://, https://, etc.) pass through normally
    });
  }

  // ---- Init ----
  document.addEventListener('DOMContentLoaded', function () {
    setupThemeToggle();
    setupMobileMenu();
    setupLinkInterception();

    // If no hash present, set default
    if (!window.location.hash || window.location.hash === '#') {
      suppressNextHashChange = true;
      window.location.hash = '#/';
    }

    // Initial page load
    preloadPartials();
    navigate(true);

    // Warm up route/data caches outside the interaction path
    schedulePreload();

    // Listen for hash changes (back/forward buttons, link clicks)
    window.addEventListener('hashchange', function () {
      if (suppressNextHashChange) {
        suppressNextHashChange = false;
        return;
      }
      navigate(false);
    });
  });
})();
