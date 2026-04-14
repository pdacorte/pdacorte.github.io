/**
 * blog.js - Blog listing page module (SPA)
 * Exposes window.BlogPage.init(queryString) for the router to call.
 */

(function () {
  'use strict';

  var POSTS_PER_PAGE = 5;
  var POSTS_JSON_PATH = 'blog/posts/posts.json';
  var DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  var allPosts = [];
  var currentPage = 1;
  var totalPages = 1;
  var postsLoaded = false;
  var postsPromise = null;

  function prefersReducedMotion() {
    if (typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ---- Fetch Posts (cached after first load) ----
  async function fetchPosts() {
    if (postsLoaded) return allPosts;
    if (postsPromise) return postsPromise;

    postsPromise = (async function () {
      try {
        var response = await fetch(POSTS_JSON_PATH);
        if (!response.ok) throw new Error('Failed to load posts');
        var posts = await response.json();

        // Sort by date descending (newest first)
        posts.sort(function (a, b) {
          return new Date(b.date) - new Date(a.date);
        });

        allPosts = posts;
        postsLoaded = true;
        return posts;
      } catch (err) {
        console.error('Error loading posts:', err);
        return [];
      } finally {
        postsPromise = null;
      }
    })();

    return postsPromise;
  }

  // ---- Format Date ----
  function formatDate(dateStr) {
    var date = new Date(dateStr + 'T00:00:00');
    return DATE_FORMATTER.format(date);
  }

  // ---- Escape HTML ----
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ---- Render Blog Cards ----
  function renderPosts(posts, container) {
    container.innerHTML = '';

    if (posts.length === 0) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>' +
            '<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>' +
          '</svg>' +
          '<h3>No posts yet</h3>' +
          '<p>Check back soon for new content.</p>' +
        '</div>';
      return;
    }

    var shouldAnimateCards = !prefersReducedMotion();
    var fragment = document.createDocumentFragment();

    posts.forEach(function (post, index) {
      var card = document.createElement('a');
      card.className = 'blog-card';
      // SPA hash link to the post
      card.href = '#/blog/' + encodeURIComponent(post.file);

      if (shouldAnimateCards) {
        card.classList.add('blog-card-enter');
        card.style.animationDelay = (index * 0.05) + 's';
      }

      var tagsHtml = '';
      if (post.tags && post.tags.length > 0) {
        tagsHtml = '<div class="blog-card-tags">' +
          post.tags.map(function (tag) {
            return '<span class="blog-tag">' + escapeHtml(tag) + '</span>';
          }).join('') +
          '</div>';
      }

      card.innerHTML =
        '<div class="blog-card-date">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>' +
            '<line x1="16" y1="2" x2="16" y2="6"/>' +
            '<line x1="8" y1="2" x2="8" y2="6"/>' +
            '<line x1="3" y1="10" x2="21" y2="10"/>' +
          '</svg>' +
          formatDate(post.date) +
        '</div>' +
        '<h3>' + escapeHtml(post.title) + '</h3>' +
        '<p class="blog-card-summary">' + escapeHtml(post.summary) + '</p>' +
        tagsHtml;

      fragment.appendChild(card);
    });

    container.appendChild(fragment);
  }

  // ---- Pagination ----
  function getPageFromQuery(queryString) {
    var params = new URLSearchParams(queryString || '');
    var page = parseInt(params.get('page'), 10);
    return (page && page > 0) ? page : 1;
  }

  function renderPagination(container) {
    container.innerHTML = '';
    if (totalPages <= 1) return;

    // Previous button
    var prevBtn = document.createElement('button');
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', function () {
      goToPage(currentPage - 1);
    });
    container.appendChild(prevBtn);

    // Page number buttons
    var pages = getPaginationRange(currentPage, totalPages);
    pages.forEach(function (p) {
      if (p === '...') {
        var dots = document.createElement('span');
        dots.className = 'page-info';
        dots.textContent = '...';
        container.appendChild(dots);
      } else {
        var btn = document.createElement('button');
        btn.textContent = p;
        if (p === currentPage) btn.classList.add('active');
        btn.addEventListener('click', function () {
          goToPage(p);
        });
        container.appendChild(btn);
      }
    });

    // Next button
    var nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', function () {
      goToPage(currentPage + 1);
    });
    container.appendChild(nextBtn);
  }

  function getPaginationRange(current, total) {
    if (total <= 7) {
      var range = [];
      for (var i = 1; i <= total; i++) range.push(i);
      return range;
    }

    var pages = [1];
    if (current > 3) pages.push('...');

    var start = Math.max(2, current - 1);
    var end = Math.min(total - 1, current + 1);
    for (var j = start; j <= end; j++) pages.push(j);

    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;

    // Update hash with page query param (without triggering full navigate)
    var newHash = '#/blog';
    if (page > 1) newHash += '?page=' + page;
    window.history.replaceState(null, '', newHash);

    renderCurrentPage();

    if (prefersReducedMotion()) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function renderCurrentPage() {
    var grid = document.getElementById('blog-grid');
    var pagination = document.getElementById('blog-pagination');
    if (!grid || !pagination) return;

    var start = (currentPage - 1) * POSTS_PER_PAGE;
    var end = start + POSTS_PER_PAGE;
    var pagePosts = allPosts.slice(start, end);

    renderPosts(pagePosts, grid);
    renderPagination(pagination);
  }

  // ---- Public init (called by router) ----
  async function init(queryString) {
    var loading = document.getElementById('blog-loading');

    if (loading) loading.style.display = 'flex';

    await fetchPosts();
    totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
    currentPage = Math.min(getPageFromQuery(queryString), totalPages || 1);

    if (loading) loading.style.display = 'none';
    renderCurrentPage();
  }

  function preload() {
    fetchPosts();
  }

  // Expose for the SPA router
  window.BlogPage = {
    init: init,
    preload: preload,
  };
})();
