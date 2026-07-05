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
  const burger = e.target.closest('.vkn-burger');
  if (!burger) return; 
  const nav = document.querySelector('.vkn-nav');
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

// ToDo
function toDo() {
  console.log('test');
  const STORAGE_KEY = "klar-todo-items";
  const listEl = document.querySelector("[data-todo-list]");
  const formEl = document.querySelector("[data-todo-form]");
  const inputEl = document.querySelector("[data-todo-input]");
  const emptyEl = document.querySelector("[data-todo-empty]");
  const footerEl = document.querySelector("[data-todo-footer]");
  const countEl = document.querySelector("[data-todo-count]");
  const clearEl = document.querySelector("[data-todo-clear]");

  let items = [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) items = JSON.parse(stored);
  } catch (e) {
    items = [];
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
  }

  function render() {
    listEl.innerHTML = "";

    if (items.length === 0) {
      emptyEl.style.display = "block";
      footerEl.style.display = "none";
      return;
    }

    emptyEl.style.display = "none";
    footerEl.style.display = "flex";

    const remaining = items.filter((i) => !i.done).length;
    countEl.textContent = remaining + " återstående";

    items.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "todo-section__item" + (item.done ? " todo-section__item--done" : "");

      li.innerHTML =
        '<div class="todo-section__checkbox" data-todo-toggle="' + index +
        '" role="checkbox" tabindex="0" aria-checked="' + item.done + '">' +
        '<svg class="todo-section__check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
        "</div>" +
        '<span class="todo-section__label" data-todo-toggle="' + index + '">' + escapeHtml(item.text) +
        "</span>" +
        '<button class="todo-section__remove" data-todo-remove="' + index +
        '" aria-label="Ta bort uppgift" title="Ta bort">✕</button>';

      listEl.appendChild(li);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function addItem(text) {
    text = text.trim();
    if (!text) return;
    items.push({
      text: text,
      done: false
    });
    save();
    render();
  }

  function toggleItem(index) {
    if (items[index]) {
      items[index].done = !items[index].done;
      save();
      render();
    }
  }

  function removeItem(index) {
    items.splice(index, 1);
    save();
    render();
  }

  function clearDone() {
    items = items.filter(function(i) {
      return !i.done;
    });
    save();
    render();
  }

  formEl.addEventListener("submit", function(e) {
    e.preventDefault();
    addItem(inputEl.value);
    inputEl.value = "";
  });

  listEl.addEventListener("click", function(e) {
    const toggleEl = e.target.closest("[data-todo-toggle]");
    const removeEl = e.target.closest("[data-todo-remove]");
    if (toggleEl) {
      toggleItem(parseInt(toggleEl.dataset.todoToggle, 10));
    } else if (removeEl) {
      removeItem(parseInt(removeEl.dataset.todoRemove, 10));
    }
  });

  listEl.addEventListener("keydown", function(e) {
    if (e.key === "Enter" || e.key === " ") {
      const toggleEl = e.target.closest("[data-todo-toggle]");
      if (toggleEl) {
        e.preventDefault();
        toggleItem(parseInt(toggleEl.dataset.todoToggle, 10));
      }
    }
  });

  clearEl.addEventListener("click", clearDone);

  render();
}
toDo();
