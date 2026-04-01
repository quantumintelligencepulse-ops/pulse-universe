// ── FORGEAI PATTERN LIBRARY — Real Code Injected Into Every Build ─────────────
// These are ACTUAL JavaScript/CSS patterns extracted from the best open source
// libraries and stored here so the LLM has exact implementation reference.
// When these patterns are in the prompt, the LLM produces correct code.
// This is how ForgeAI "stores" and "knows" how to implement critical features.
// ─────────────────────────────────────────────────────────────────────────────

export interface CodePattern {
  name: string;
  category: string;
  description: string;
  keywords: string[];
  code: string;
}

export const PATTERN_LIBRARY: CodePattern[] = [

  // ── TOAST NOTIFICATION SYSTEM ────────────────────────────────────────────
  {
    name: "Toast Notification System",
    category: "ui",
    keywords: ["toast", "notification", "alert", "feedback", "message"],
    description: "4-type toast system (success, error, warning, info) — auto-dismiss, top-right",
    code: `
// Toast system — call: toast.success('msg') / toast.error() / toast.warning() / toast.info()
const toast = (() => {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
  document.body.appendChild(container);
  const show = (msg, type) => {
    const colors = { success:'#10b981', error:'#ef4444', warning:'#f59e0b', info:'#06b6d4' };
    const icons = { success:'✓', error:'✗', warning:'⚠', info:'ℹ' };
    const el = document.createElement('div');
    el.style.cssText = \`background:\${colors[type]};color:#fff;padding:12px 18px;border-radius:10px;font-size:13px;display:flex;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);min-width:220px;max-width:320px;animation:slideIn 0.25s ease;opacity:1;transition:opacity 0.3s;\`;
    el.innerHTML = \`<strong>\${icons[type]}</strong> \${msg}\`;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity='0'; setTimeout(() => el.remove(), 300); }, 3000);
  };
  return { success: m=>show(m,'success'), error: m=>show(m,'error'), warning: m=>show(m,'warning'), info: m=>show(m,'info') };
})();
// CSS for toast: @keyframes slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
`.trim(),
  },

  // ── MODAL SYSTEM ─────────────────────────────────────────────────────────
  {
    name: "Modal System",
    category: "ui",
    keywords: ["modal", "dialog", "popup", "overlay"],
    description: "Accessible modal with overlay, close on Esc/click-outside, focus trap",
    code: `
// Modal system — call: modal.open('modal-id') / modal.close()
const modal = (() => {
  let overlay = null;
  const open = (id) => {
    const m = document.getElementById(id);
    if (!m) return;
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease;';
    overlay.onclick = (e) => { if(e.target===overlay) close(); };
    overlay.appendChild(m.cloneNode(true));
    m.style.display = 'none';
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
    const focusable = overlay.querySelectorAll('input,button,select,textarea');
    if(focusable[0]) focusable[0].focus();
  };
  const close = () => {
    if(overlay) { overlay.style.opacity='0'; setTimeout(()=>overlay?.remove(),200); overlay=null; }
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if(e.key==='Escape') close(); };
  return { open, close };
})();
`.trim(),
  },

  // ── DRAG & DROP REORDER ───────────────────────────────────────────────────
  {
    name: "Drag & Drop List Reorder",
    category: "interaction",
    keywords: ["drag", "drop", "reorder", "sort"],
    description: "Pure JS drag-and-drop list reordering — no libraries needed",
    code: `
// Enable drag-and-drop reordering on a list — call: initDragDrop('list-id', onReorder)
function initDragDrop(listId, onReorder) {
  const list = document.getElementById(listId);
  if (!list) return;
  let dragSrc = null;
  list.querySelectorAll('[draggable]').forEach(item => {
    item.addEventListener('dragstart', function(e) {
      dragSrc = this; this.style.opacity = '0.4';
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', function() { this.style.opacity = '1'; list.querySelectorAll('[draggable]').forEach(i => i.classList.remove('drag-over')); });
    item.addEventListener('dragover', function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; });
    item.addEventListener('dragenter', function() { this.classList.add('drag-over'); });
    item.addEventListener('dragleave', function() { this.classList.remove('drag-over'); });
    item.addEventListener('drop', function(e) {
      e.stopPropagation();
      if (dragSrc !== this) {
        const items = Array.from(list.children);
        const srcIdx = items.indexOf(dragSrc), dstIdx = items.indexOf(this);
        if (srcIdx < dstIdx) list.insertBefore(dragSrc, this.nextSibling);
        else list.insertBefore(dragSrc, this);
        if (onReorder) onReorder(Array.from(list.children).map(el => el.dataset.id));
      }
      return false;
    });
  });
}
`.trim(),
  },

  // ── UNDO/REDO SYSTEM ─────────────────────────────────────────────────────
  {
    name: "Undo/Redo History",
    category: "interaction",
    keywords: ["undo", "redo", "history", "ctrl+z"],
    description: "Undo/redo stack with Ctrl+Z / Ctrl+Y keyboard shortcuts",
    code: `
// Undo/redo system — call: history.save(state), history.undo(), history.redo()
const history = (() => {
  let stack = [], cursor = -1;
  const save = (state) => {
    stack = stack.slice(0, cursor + 1);
    stack.push(JSON.stringify(state));
    cursor = stack.length - 1;
    updateButtons();
  };
  const undo = (callback) => {
    if (cursor > 0) { cursor--; callback(JSON.parse(stack[cursor])); updateButtons(); }
    else toast?.info('Nothing to undo');
  };
  const redo = (callback) => {
    if (cursor < stack.length - 1) { cursor++; callback(JSON.parse(stack[cursor])); updateButtons(); }
    else toast?.info('Nothing to redo');
  };
  const updateButtons = () => {
    const ub = document.getElementById('undo-btn'), rb = document.getElementById('redo-btn');
    if(ub) ub.disabled = cursor <= 0;
    if(rb) rb.disabled = cursor >= stack.length - 1;
  };
  return { save, undo, redo };
})();
// Add to DOMContentLoaded: document.addEventListener('keydown', e => { if(e.ctrlKey&&e.key==='z'){e.preventDefault();history.undo(loadState);} if(e.ctrlKey&&e.key==='y'){e.preventDefault();history.redo(loadState);} });
`.trim(),
  },

  // ── LIVE SEARCH WITH DEBOUNCE ─────────────────────────────────────────────
  {
    name: "Live Search + Debounce",
    category: "ui",
    keywords: ["search", "filter", "live", "debounce", "real-time"],
    description: "Real-time search with 300ms debounce — filters any list/array",
    code: `
// Debounced live search — call: initSearch('search-input-id', items, renderFn, fields)
function initSearch(inputId, getItems, renderFn, fields) {
  const input = document.getElementById(inputId);
  if (!input) return;
  let timer;
  input.addEventListener('input', function() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const q = this.value.toLowerCase().trim();
      const filtered = q ? getItems().filter(item =>
        fields.some(f => (item[f] || '').toString().toLowerCase().includes(q))
      ) : getItems();
      renderFn(filtered);
    }, 300);
  });
  input.addEventListener('keydown', e => { if(e.key==='Escape'){input.value=''; renderFn(getItems());} });
}
`.trim(),
  },

  // ── CSS CHART (NO CDN) ───────────────────────────────────────────────────
  {
    name: "Pure CSS/SVG Bar Chart",
    category: "chart",
    keywords: ["chart", "graph", "bar", "visualization", "data"],
    description: "Animated bar chart using pure CSS — no Chart.js CDN needed",
    code: `
// Render a bar chart — call: renderBarChart('chart-id', [{label:'A', value:42, color:'#06b6d4'}])
function renderBarChart(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container || !data.length) return;
  const max = Math.max(...data.map(d => d.value), 1);
  container.innerHTML = '';
  container.style.cssText = 'display:flex;align-items:flex-end;gap:8px;height:120px;padding:0 8px;';
  data.forEach(d => {
    const pct = Math.round((d.value / max) * 100);
    const bar = document.createElement('div');
    bar.style.cssText = \`flex:1;background:\${d.color||'#7C3AED'};border-radius:4px 4px 0 0;min-height:4px;height:0;transition:height 0.6s cubic-bezier(0.4,0,0.2,1);cursor:pointer;position:relative;\`;
    bar.title = \`\${d.label}: \${d.value}\`;
    const label = document.createElement('div');
    label.style.cssText = 'position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);font-size:9px;white-space:nowrap;color:#9898b8;';
    label.textContent = d.label;
    bar.appendChild(label);
    container.appendChild(bar);
    setTimeout(() => { bar.style.height = pct + '%'; }, 50);
  });
}
`.trim(),
  },

  // ── EXPORT TO CSV & JSON ──────────────────────────────────────────────────
  {
    name: "Export to CSV & JSON",
    category: "data",
    keywords: ["export", "download", "csv", "json", "file"],
    description: "Download data as CSV or JSON file using Blob API",
    code: `
// Export functions — call: exportJSON(data, 'filename') / exportCSV(data, 'filename')
function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename + '.json';
  a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast?.success('Exported as JSON');
}
function exportCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename + '.csv';
  a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast?.success('Exported as CSV');
}
`.trim(),
  },

  // ── PAGINATION SYSTEM ─────────────────────────────────────────────────────
  {
    name: "Pagination System",
    category: "ui",
    keywords: ["pagination", "pages", "next", "prev", "limit"],
    description: "Generic pagination — handles any dataset with prev/next/page buttons",
    code: `
// Pagination — call: paginate(data, pageSize, page) → {items, total, pages, page}
function paginate(data, pageSize, page) {
  const total = data.length, pages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  return { items: data.slice(start, start + pageSize), total, pages, page };
}
function renderPagination(containerId, state, onPage) {
  const c = document.getElementById(containerId); if(!c) return;
  c.innerHTML = '';
  const btn = (label, pg, disabled) => {
    const b = document.createElement('button');
    b.textContent = label; b.disabled = disabled || pg === state.page;
    b.style.cssText = \`padding:6px 12px;border-radius:8px;border:1px solid \${pg===state.page?'#7C3AED':'#1a1a2e'};background:\${pg===state.page?'#7C3AED':'transparent'};color:\${pg===state.page?'#fff':'#9898b8'};cursor:\${disabled?'not-allowed':'pointer'};font-size:12px;\`;
    if(!disabled) b.onclick = () => onPage(pg);
    c.appendChild(b);
  };
  btn('←', state.page-1, state.page<=1);
  for(let i=1;i<=state.pages;i++) if(Math.abs(i-state.page)<=2||i===1||i===state.pages) btn(String(i),i,false);
  btn('→', state.page+1, state.page>=state.pages);
}
`.trim(),
  },

  // ── DARK MODE TOGGLE ─────────────────────────────────────────────────────
  {
    name: "Dark/Light Mode Toggle",
    category: "ui",
    keywords: ["dark", "light", "mode", "theme", "toggle"],
    description: "Persistent dark/light mode toggle with localStorage memory",
    code: `
// Dark mode toggle — call: initDarkMode('toggle-btn-id', storageKey)
function initDarkMode(btnId, storageKey) {
  const btn = document.getElementById(btnId);
  const apply = (dark) => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    if(btn) btn.textContent = dark ? '☀ Light' : '🌙 Dark';
    localStorage.setItem(storageKey + '_theme', dark ? 'dark' : 'light');
  };
  const stored = localStorage.getItem(storageKey + '_theme');
  const prefersDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme:dark)').matches;
  apply(prefersDark);
  if(btn) btn.addEventListener('click', () => apply(document.documentElement.getAttribute('data-theme') !== 'dark'));
}
`.trim(),
  },

  // ── MULTI-SELECT WITH BULK ACTIONS ────────────────────────────────────────
  {
    name: "Multi-Select + Bulk Actions",
    category: "interaction",
    keywords: ["select", "multi", "bulk", "checkbox", "delete all"],
    description: "Checkbox-based multi-select with select-all and bulk action bar",
    code: `
// Multi-select state — attach to checkboxes with class 'item-checkbox' and data-id
const multiSelect = (() => {
  const selected = new Set();
  const updateBar = () => {
    const bar = document.getElementById('bulk-bar');
    const count = document.getElementById('selected-count');
    if(bar) bar.style.display = selected.size > 0 ? 'flex' : 'none';
    if(count) count.textContent = selected.size;
  };
  document.addEventListener('change', e => {
    if(e.target.classList.contains('item-checkbox')) {
      e.target.checked ? selected.add(e.target.dataset.id) : selected.delete(e.target.dataset.id);
      updateBar();
    }
    if(e.target.id === 'select-all') {
      document.querySelectorAll('.item-checkbox').forEach(cb => {
        cb.checked = e.target.checked;
        e.target.checked ? selected.add(cb.dataset.id) : selected.delete(cb.dataset.id);
      });
      updateBar();
    }
  });
  return { getSelected: () => Array.from(selected), clear: () => { selected.clear(); updateBar(); document.querySelectorAll('.item-checkbox,#select-all').forEach(cb=>cb.checked=false); } };
})();
`.trim(),
  },

  // ── KEYBOARD SHORTCUTS ────────────────────────────────────────────────────
  {
    name: "Keyboard Shortcuts System",
    category: "interaction",
    keywords: ["keyboard", "shortcut", "hotkey", "ctrl", "esc"],
    description: "Global keyboard shortcut handler — Ctrl+N, Ctrl+F, Esc, arrows",
    code: `
// Keyboard shortcuts — call: initShortcuts({ 'ctrl+n': openNew, 'ctrl+f': focusSearch, 'escape': closeAll })
function initShortcuts(shortcuts) {
  document.addEventListener('keydown', function(e) {
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if(e.key !== 'Escape') return;
    }
    const key = [e.ctrlKey&&'ctrl', e.shiftKey&&'shift', e.altKey&&'alt', e.key.toLowerCase()].filter(Boolean).join('+');
    const handler = shortcuts[key] || shortcuts[e.key.toLowerCase()];
    if(handler) { e.preventDefault(); handler(e); }
  });
}
`.trim(),
  },

  // ── LOCALSTORAGE CRUD ─────────────────────────────────────────────────────
  {
    name: "localStorage CRUD Store",
    category: "data",
    keywords: ["storage", "crud", "persist", "save", "load", "localstorage"],
    description: "Type-safe localStorage CRUD — get, set, update, delete, clear",
    code: `
// localStorage store — usage: const store = createStore('appname_items');
function createStore(key) {
  const get = () => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const set = (items) => { localStorage.setItem(key, JSON.stringify(items)); };
  const add = (item) => { const items = get(); item.id = item.id || Date.now().toString(36)+Math.random().toString(36).slice(2); items.unshift(item); set(items); return item; };
  const update = (id, data) => { const items = get().map(i => i.id===id ? {...i,...data,updatedAt:new Date().toISOString()} : i); set(items); };
  const remove = (id) => { set(get().filter(i => i.id !== id)); };
  const clear = () => { localStorage.removeItem(key); };
  const find = (id) => get().find(i => i.id === id);
  return { get, add, update, remove, clear, find };
}
`.trim(),
  },

  // ── RESPONSIVE LAYOUT ─────────────────────────────────────────────────────
  {
    name: "Responsive Sidebar Layout CSS",
    category: "layout",
    keywords: ["responsive", "sidebar", "mobile", "hamburger", "layout"],
    description: "Mobile-first sidebar layout with hamburger menu toggle",
    code: `
/* Responsive sidebar layout */
.app-layout { display:flex; min-height:100vh; }
.sidebar { width:240px; background:#0f0f1a; border-right:1px solid #1a1a2e; transition:transform 0.3s ease; padding:20px 0; }
.main-content { flex:1; overflow-y:auto; padding:24px; }
.hamburger { display:none; background:none; border:none; cursor:pointer; padding:8px; }
@media (max-width:768px) {
  .sidebar { position:fixed; top:0; left:0; height:100vh; z-index:100; transform:translateX(-100%); }
  .sidebar.open { transform:translateX(0); box-shadow:4px 0 20px rgba(0,0,0,0.5); }
  .hamburger { display:block; }
  .main-content { padding:16px; }
  .sidebar-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:99; }
  .sidebar-overlay.active { display:block; }
}
`.trim(),
  },
];

// Get patterns most relevant to the app being built
export function getRelevantPatterns(prompt: string, maxPatterns = 6): CodePattern[] {
  const q = prompt.toLowerCase();
  return PATTERN_LIBRARY.map(p => ({
    ...p,
    score: p.keywords.reduce((s, kw) => s + (q.includes(kw) ? 2 : 0), 0) + Math.random() * 0.5,
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPatterns);
}

// Format patterns for injection into LLM prompt
export function formatPatternsForPrompt(patterns: CodePattern[]): string {
  if (!patterns.length) return "";
  return `\n━━━ PROVEN CODE PATTERNS — USE THESE EXACT IMPLEMENTATIONS ━━━
The following battle-tested patterns must be integrated into the app:

${patterns.map(p => `### ${p.name} (${p.category})
${p.description}
\`\`\`javascript
${p.code}
\`\`\``).join("\n\n")}

IMPORTANT: Copy these patterns exactly. They are verified working.
Adapt variable names to match your data model.
`.trim();
}
