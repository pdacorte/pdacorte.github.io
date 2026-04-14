/**
 * post.js - Single blog post viewer module (SPA)
 * Exposes window.PostPage.init(filename) for the router to call.
 */

(function () {
  'use strict';

  var POSTS_DIR = 'blog/posts/';
  var POSTS_JSON = 'blog/posts/posts.json';
  var DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  var postMetaCache = null;
  var postMetaPromise = null;
  var markdownCache = {};
  var markdownPromises = {};

  // ---- Format Date ----
  function formatDate(dateStr) {
    var date = new Date(dateStr + 'T00:00:00');
    return DATE_FORMATTER.format(date);
  }

  // ---- Fetch post metadata from posts.json ----
  async function fetchPostMetaList() {
    if (postMetaCache) return postMetaCache;
    if (postMetaPromise) return postMetaPromise;

    postMetaPromise = (async function () {
      try {
        var response = await fetch(POSTS_JSON);
        if (!response.ok) return [];

        var posts = await response.json();
        postMetaCache = posts;
        return posts;
      } catch (err) {
        return [];
      } finally {
        postMetaPromise = null;
      }
    })();

    return postMetaPromise;
  }

  async function fetchPostMeta(filename) {
    try {
      var posts = await fetchPostMetaList();
      return posts.find(function (p) { return p.file === filename; }) || null;
    } catch (err) {
      return null;
    }
  }

  async function fetchMarkdown(filename) {
    if (markdownCache[filename]) return markdownCache[filename];
    if (markdownPromises[filename]) return markdownPromises[filename];

    markdownPromises[filename] = (async function () {
      try {
        var response = await fetch(POSTS_DIR + filename);
        if (!response.ok) {
          throw new Error('Post not found');
        }

        var markdown = await response.text();
        markdownCache[filename] = markdown;
        return markdown;
      } finally {
        delete markdownPromises[filename];
      }
    })();

    return markdownPromises[filename];
  }

  // ---- Load and render a post ----
  async function loadPost(filename) {
    var titleEl = document.getElementById('post-title');
    var metaEl = document.getElementById('post-meta');
    var contentEl = document.getElementById('post-content');
    var loadingEl = document.getElementById('post-loading');
    var headerEl = document.getElementById('post-header');

    try {
      // Fetch metadata and markdown in parallel
      var results = await Promise.all([
        fetchPostMeta(filename),
        fetchMarkdown(filename),
      ]);

      var meta = results[0];
      var markdown = results[1];

      // Render markdown using marked.js
      if (typeof marked === 'undefined') {
        throw new Error('Markdown renderer not loaded');
      }

      var html = marked.parse(markdown);

      // Update page
      if (loadingEl) loadingEl.style.display = 'none';
      if (headerEl) headerEl.style.display = 'block';

      if (meta) {
        if (titleEl) titleEl.textContent = meta.title;
        if (metaEl) metaEl.textContent = formatDate(meta.date);
        document.title = meta.title + ' - Blog';
      } else {
        var titleMatch = markdown.match(/^#\s+(.+)$/m);
        var title = titleMatch ? titleMatch[1] : filename.replace('.md', '');
        if (titleEl) titleEl.textContent = title;
        document.title = title + ' - Blog';
      }

      if (contentEl) {
        contentEl.innerHTML = html;
        // Remove the first h1 from rendered content since it's in the header
        var firstH1 = contentEl.querySelector('h1:first-child');
        if (firstH1) firstH1.remove();
      }

    } catch (err) {
      console.error('Error loading post:', err);
      if (loadingEl) loadingEl.style.display = 'none';
      if (contentEl) {
        contentEl.innerHTML =
          '<div class="empty-state">' +
            '<h3>Post not found</h3>' +
            '<p>The requested post could not be loaded. <a href="#/blog">Back to blog</a></p>' +
          '</div>';
      }
    }
  }

  // ---- Public init (called by router) ----
  async function init(filename) {
    if (!filename) {
      // No post specified, go to blog listing
      window.location.hash = '#/blog';
      return;
    }

    // Decode in case the filename was URL-encoded in the hash
    filename = decodeURIComponent(filename);

    // Validate filename (prevent path traversal)
    if (filename.includes('/') || filename.includes('\\') || !filename.endsWith('.md')) {
      window.location.hash = '#/blog';
      return;
    }

    await loadPost(filename);
  }

  function preload() {
    fetchPostMetaList();
  }

  if (typeof marked !== 'undefined' && typeof marked.setOptions === 'function') {
    marked.setOptions({ breaks: false, gfm: true });
  }

  // Expose for the SPA router
  window.PostPage = {
    init: init,
    preload: preload,
  };
})();
