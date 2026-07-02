function spa(container) {
  history.scrollRestoration = "manual";
  
  const cache = new Map();
  
  // Fetch + cache HTML pages
  async function fetchPage(path) {
    if (cache.has(path)) {
      return cache.get(path);
    }
  
    const promise = fetch(path).then(async (response) => {
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      return response.text();
    });
  
    cache.set(path, promise);
    return promise;
  }
  
  // Navigate
  async function go(path, push = true, state = {}) {
    const app = document.querySelector(container);
  
    const html = await fetchPage(path);
  
    const doc = new DOMParser().parseFromString(html, "text/html");
  
    document.title = doc.title;
  
    const root = doc.querySelector(container);
  
    if (!root) {
      console.error("Couldn't find #root in fetched page.");
      return;
    }
  
    app.innerHTML = root.innerHTML;
  
    setActive();
  
    app.focus?.();
  
    if (push) {
      history.pushState({ scrollY: 0 }, "", path);
      window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, state.scrollY || 0);
    }
  }
  
  // Prefetch on hover / pointer enter
  document.addEventListener(
    "pointerenter",
    (e) => {
      if (!(e.target instanceof Element)) return;
  
      const a = e.target.closest("a");
  
      if (
        !a ||
        a.origin !== location.origin ||
        a.target === "_blank" ||
        a.hasAttribute("download")
      ) {
        return;
      }
  
      fetchPage(a.pathname + a.search).catch(() => {});
    },
    true
  );
  
  // Intercept navigation clicks
  document.addEventListener("click", async (e) => {
    if (!(e.target instanceof Element)) return;
  
    const a = e.target.closest("a");
  
    if (
      !a ||
      a.origin !== location.origin ||
      a.target === "_blank" ||
      a.hasAttribute("download") ||
      e.defaultPrevented ||
      e.button !== 0 ||
      e.ctrlKey ||
      e.metaKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }
  
    e.preventDefault();
  
    history.replaceState(
      { scrollY: window.scrollY },
      "",
      location.pathname + location.search
    );
  
    try {
      await go(a.pathname + a.search);
    } catch (err) {
      console.error(err);
      location.href = a.href;
    }
  });
  
  // Back / forward navigation
  window.addEventListener("popstate", (e) => {
    go(location.pathname + location.search, false, e.state || {});
  });
  
  // Initial history state
  try {
    history.replaceState( 
      { scrollY: window.scrollY },
      "",
      location.pathname + location.search
    );
    // console.log('It works in prod :)');
  } catch (error) {
    // console.error(error);
  }
  
  // Active link highlighting
  function setActive() {
    return;
    document.querySelectorAll("a").forEach((a) => {
      a.classList.toggle("active", a.pathname === location.pathname);
    });
  }
}
spa("body");

// Mobile toggle menu button
// document.querySelector('.vkn-burger').onclick = function(e) {
//   const nav = document.querySelector('.vkn-nav');
//   if (nav.classList.contains('show')) {
//     document.querySelector('.vkn-nav').classList.remove('show');  
//   } else {
//     document.querySelector('.vkn-nav').classList.add('show');  
//   }
// }

document.addEventListener("click", (e) => {
  const nav = e.target.closest('.vkn-burger');
  if (!nav) return;
  if (nav.classList.contains('show')) {
    document.querySelector('.vkn-nav').classList.remove('show');  
  } else {
    document.querySelector('.vkn-nav').classList.add('show');  
  }
});

// Theme toggle — applies .dark on <html>, persists in localStorage
function setThemeToggle() {
  const STORAGE_KEY = "theme";
  const root = document.documentElement;

  // Initialise from storage or system preference
  const stored = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (stored === "dark" || (!stored && prefersDark)) {
    root.classList.add("dark");
  }

  // Wire up toggle buttons (works for any page via event delegation)
  document.addEventListener("click", (e) => {
    const toggle = e.target.closest(".theme-toggle");
    if (!toggle) return;
    root.classList.toggle("dark");
    localStorage.setItem(STORAGE_KEY, root.classList.contains("dark") ? "dark" : "light");
  });
};
setThemeToggle();
