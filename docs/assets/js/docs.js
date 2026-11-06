/* =========================================================
   ESP32 Mensaje Web — motor de la documentación
   Cada página solo contiene <article class="doc">…</article>.
   Este script construye header, panel lateral, TOC, pager,
   resaltado de código, diagramas Mermaid, pestañas y tema.
   ========================================================= */
(function () {
  "use strict";

  // ---------- Árbol de navegación (fuente única) ----------
  const NAV = [
    { title: "Introducción", items: [
      { t: "Bienvenida", p: "index.html", k: "inicio resumen home" },
    ]},
    { title: "Primeros pasos", items: [
      { t: "1. Requisitos", p: "inicio/requisitos.html", k: "hardware software materiales" },
      { t: "2. Workspace en Windows", p: "inicio/workspace-windows.html", k: "winget git docker wsl vscode" },
      { t: "3. Workspace en Linux", p: "inicio/workspace-linux.html", k: "ubuntu apt docker dialout" },
      { t: "4. Clonar y levantar servicios", p: "inicio/clonar-y-levantar.html", k: "git clone docker compose up" },
      { t: "5. Arduino IDE y placa ESP32", p: "inicio/arduino-ide.html", k: "drivers ch340 cp2102 espressif boards manager url" },
      { t: "6. Configurar red y config.h", p: "inicio/configurar-red.html", k: "wifi hotspot ip firewall config.h ssid" },
      { t: "7. Programar la ESP32", p: "inicio/programar-esp32.html", k: "upload boot monitor serie" },
      { t: "8. Prueba de extremo a extremo", p: "inicio/primera-prueba.html", k: "verificar test end to end" },
    ]},
    { title: "Arquitectura", items: [
      { t: "Visión general", p: "arquitectura/vision-general.html", k: "componentes diagrama" },
      { t: "Vista física vs. lógica", p: "arquitectura/fisico-logico.html", k: "capas red osi" },
      { t: "Flujo de datos y tiempos", p: "arquitectura/flujo.html", k: "secuencia polling latencia" },
    ]},
    { title: "Backend", items: [
      { t: "Código FastAPI (main.py)", p: "backend/fastapi.html", k: "python pydantic cors uvicorn" },
      { t: "Referencia de la API", p: "backend/api.html", k: "endpoints get put curl rest" },
      { t: "Docker y docker compose", p: "backend/docker.html", k: "dockerfile contenedor imagen puertos" },
    ]},
    { title: "Frontend", items: [
      { t: "Estructura HTML y CSS", p: "frontend/html-css.html", k: "index.html styles.css nginx" },
      { t: "Lógica en app.js", p: "frontend/app-js.html", k: "fetch javascript dom" },
    ]},
    { title: "Hardware y firmware", items: [
      { t: "La placa ESP32", p: "hardware/esp32.html", k: "devkit pines usb serial alimentacion" },
      { t: "Firmware (esp32_mensaje.ino)", p: "hardware/firmware.html", k: "arduino httpclient wifi sketch" },
    ]},
    { title: "Guías", items: [
      { t: "Extender el proyecto", p: "guias/extender.html", k: "led lcd persistencia mqtt ejercicios" },
      { t: "Publicar esta documentación", p: "guias/gh-pages.html", k: "github pages deploy" },
    ]},
    { title: "Referencia", items: [
      { t: "Todo lo configurable", p: "referencia/configuracion.html", k: "cambiar puertos ip intervalos" },
      { t: "Solución de problemas", p: "referencia/problemas.html", k: "errores troubleshooting faq" },
      { t: "Glosario", p: "referencia/glosario.html", k: "terminos definiciones" },
    ]},
  ];

  const REPO = "https://github.com/RonyTrespalacios/esp32-mensaje-web";
  const body = document.body;
  const ROOT = body.dataset.root || "";
  const PAGE = body.dataset.page || "index.html";
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  // ---------- Tema ----------
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  let theme = LS.get("docs-theme", prefersDark ? "dark" : "light");
  document.documentElement.dataset.theme = theme;

  // ---------- Utilidades ----------
  const el = (tag, attrs = {}, html = "") => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v);
    }
    if (html) n.innerHTML = html;
    return n;
  };
  const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
  const CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 6 6 6-6 6"/></svg>';
  const flat = NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));
  const curIdx = flat.findIndex((i) => i.p === PAGE);
  const cur = flat[curIdx];

  // ---------- Preparar el artículo ----------
  const article = document.querySelector("article.doc");
  if (!article) return;

  // ids y anclas en h2/h3
  const used = new Set();
  const docHeadings = (sel) => [...article.querySelectorAll(sel)].filter((h) => !h.closest(".card, .hero, .tab"));
  docHeadings("h2, h3").forEach((h) => {
    h.dataset.text = h.textContent.trim();
    if (!h.id) {
      let id = slug(h.textContent) || "seccion", n = 2;
      while (used.has(id)) id = slug(h.textContent) + "-" + n++;
      h.id = id;
    }
    used.add(h.id);
    h.appendChild(el("a", { class: "anchor", href: "#" + h.id, "aria-label": "Enlace a esta sección" }, "#"));
  });

  // tablas con scroll horizontal
  article.querySelectorAll("table").forEach((t) => {
    const w = el("div", { class: "table-wrap" });
    t.parentNode.insertBefore(w, t); w.appendChild(t);
  });

  // títulos de bloque de código + botón copiar
  article.querySelectorAll("pre > code").forEach((code) => {
    const pre = code.parentElement;
    if (pre.dataset.title) pre.parentNode.insertBefore(el("div", { class: "code-title" }, pre.dataset.title), pre);
    const b = el("button", { class: "copy-btn", type: "button" }, "Copiar");
    b.addEventListener("click", () => {
      navigator.clipboard.writeText(code.innerText.replace(/\n$/, "")).then(() => {
        b.textContent = "¡Copiado!"; setTimeout(() => (b.textContent = "Copiar"), 1400);
      });
    });
    pre.appendChild(b);
  });

  // pestañas (Windows / Linux sincronizadas)
  const tabGroups = [];
  article.querySelectorAll(".tabs").forEach((tabs) => {
    const panes = [...tabs.querySelectorAll(":scope > .tab")];
    const bar = el("div", { class: "tab-bar", role: "tablist" });
    const buttons = panes.map((p) => {
      const b = el("button", { type: "button", role: "tab" }, p.dataset.label);
      b.addEventListener("click", () => { selectAll(p.dataset.label); LS.set("docs-tab", p.dataset.label); });
      bar.appendChild(b); return b;
    });
    tabs.insertBefore(bar, tabs.firstChild);
    const select = (label) => {
      let idx = panes.findIndex((p) => p.dataset.label === label);
      if (idx < 0) return false;
      panes.forEach((p, i) => { p.classList.toggle("active", i === idx); buttons[i].classList.toggle("active", i === idx); });
      return true;
    };
    tabGroups.push(select);
    if (!select(LS.get("docs-tab", panes[0].dataset.label))) select(panes[0].dataset.label);
  });
  function selectAll(label) { tabGroups.forEach((s) => s(label)); }

  // envoltorio para diagramas
  article.querySelectorAll("pre.mermaid").forEach((m) => {
    m.dataset.src = m.textContent;
    const w = el("div", { class: "mermaid-wrap" });
    m.parentNode.insertBefore(w, m); w.appendChild(m);
  });

  // ---------- Header ----------
  const header = el("header", { class: "site-header" }, `
    <button class="header-btn menu-btn" type="button" aria-label="Abrir menú">☰</button>
    <a class="brand" href="${ROOT}index.html">
      <span class="brand-logo">E32</span>
      <span>ESP32 Mensaje Web<small>Máquinas Digitales · Unillanos</small></span>
    </a>
    <span class="header-spacer"></span>
    <button class="header-btn theme-btn" type="button" aria-label="Cambiar tema"><span class="ico"></span><span class="label">Tema</span></button>
    <a class="header-btn" href="${REPO}" target="_blank" rel="noopener" aria-label="Repositorio en GitHub">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
      <span class="label">GitHub</span>
    </a>`);
  const themeBtn = header.querySelector(".theme-btn");
  const paintThemeBtn = () => (themeBtn.querySelector(".ico").textContent = theme === "dark" ? "☀" : "☾");
  paintThemeBtn();
  themeBtn.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme; LS.set("docs-theme", theme); paintThemeBtn(); renderMermaid();
  });
  header.querySelector(".menu-btn").addEventListener("click", () => body.classList.toggle("nav-open"));

  // ---------- Sidebar ----------
  const sidebar = el("aside", { class: "sidebar", "aria-label": "Navegación de la documentación" });
  const tools = el("div", { class: "sidebar-tools" }, `
    <input class="search" type="search" placeholder="Buscar en el índice  ( / )" aria-label="Buscar">
    <div class="tree-actions">
      <button type="button" data-act="expand">Expandir todo</button>
      <button type="button" data-act="collapse">Colapsar todo</button>
    </div>`);
  const nav = el("nav", { class: "nav" });
  sidebar.append(tools, nav);

  const openGroups = new Set(LS.get("docs-open-groups", NAV.map((g) => g.title)));
  if (cur) openGroups.add(cur.group);
  const saveGroups = () => LS.set("docs-open-groups", [...openGroups]);

  const navRoot = el("ul");
  const headings = docHeadings("h2");
  NAV.forEach((g) => {
    const li = el("li", { class: "nav-group" + (openGroups.has(g.title) ? " open" : "") });
    li.dataset.group = g.title;
    const btn = el("button", { class: "nav-group-btn", type: "button", "aria-expanded": openGroups.has(g.title) }, CHEV + `<span>${g.title}</span>`);
    btn.addEventListener("click", () => {
      const open = li.classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
      open ? openGroups.add(g.title) : openGroups.delete(g.title); saveGroups();
    });
    const ul = el("ul");
    g.items.forEach((it) => {
      const item = el("li", { class: "nav-item" });
      item.dataset.search = (it.t + " " + (it.k || "") + " " + g.title).toLowerCase();
      const row = el("div", { class: "nav-row" });
      const isCur = it.p === PAGE;
      const a = el("a", { href: ROOT + it.p }, it.t);
      a.dataset.label = it.t;
      if (isCur) { a.classList.add("active"); a.setAttribute("aria-current", "page"); }
      if (isCur && headings.length) {
        const tg = el("button", { class: "sub-toggle", type: "button", "aria-label": "Mostrar secciones" }, CHEV);
        tg.addEventListener("click", () => item.classList.toggle("open"));
        row.append(tg, a);
        const sub = el("ul", { class: "sub" });
        headings.forEach((h) => {
          const sa = el("a", { href: "#" + h.id }, h.dataset.text);
          sa.addEventListener("click", () => body.classList.remove("nav-open"));
          sub.appendChild(el("li")).appendChild(sa);
        });
        item.append(row, sub);
        item.classList.add("open");
      } else {
        row.append(el("span", { class: "sub-spacer" }), a);
        item.append(row);
      }
      ul.appendChild(item);
    });
    li.append(btn, ul);
    navRoot.appendChild(li);
  });
  nav.appendChild(navRoot);
  const emptyMsg = el("div", { class: "nav-empty hidden" }, "Sin resultados.");
  nav.appendChild(emptyMsg);

  tools.querySelector('[data-act="expand"]').addEventListener("click", () => {
    navRoot.querySelectorAll(".nav-group").forEach((g) => { g.classList.add("open"); openGroups.add(g.dataset.group); });
    navRoot.querySelectorAll(".nav-item").forEach((i) => i.querySelector(".sub") && i.classList.add("open"));
    saveGroups();
  });
  tools.querySelector('[data-act="collapse"]').addEventListener("click", () => {
    navRoot.querySelectorAll(".nav-group").forEach((g) => g.classList.remove("open"));
    navRoot.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("open"));
    openGroups.clear(); saveGroups();
  });

  // búsqueda en el índice
  const search = tools.querySelector(".search");
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    let any = false;
    navRoot.querySelectorAll(".nav-group").forEach((g) => {
      let groupHit = false;
      g.querySelectorAll(".nav-item").forEach((i) => {
        const a = i.querySelector(".nav-row a");
        const hit = !q || i.dataset.search.includes(q);
        i.classList.toggle("hidden", !hit);
        a.innerHTML = a.dataset.label;
        if (q && hit) {
          const idx = a.dataset.label.toLowerCase().indexOf(q);
          if (idx >= 0) a.innerHTML = a.dataset.label.slice(0, idx) + "<mark>" + a.dataset.label.slice(idx, idx + q.length) + "</mark>" + a.dataset.label.slice(idx + q.length);
        }
        groupHit = groupHit || hit;
      });
      g.classList.toggle("hidden", !groupHit);
      if (q) g.classList.toggle("open", groupHit);
      else g.classList.toggle("open", openGroups.has(g.dataset.group));
      any = any || groupHit;
    });
    emptyMsg.classList.toggle("hidden", any);
  });
  search.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const first = navRoot.querySelector(".nav-item:not(.hidden) .nav-row a"); if (first) location.href = first.href; }
    if (e.key === "Escape") { search.value = ""; search.dispatchEvent(new Event("input")); search.blur(); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); search.focus(); }
  });

  // ---------- Contenido + TOC ----------
  const main = el("div", { class: "main" });
  const content = el("main", { class: "content" });
  if (cur) {
    content.appendChild(el("div", { class: "breadcrumb" },
      `<a href="${ROOT}index.html">Inicio</a><span class="sep">›</span><span>${cur.group}</span><span class="sep">›</span><span>${cur.t}</span>`));
  }
  article.parentNode.insertBefore(main, article);
  content.appendChild(article);

  // pager
  const prev = flat[curIdx - 1], next = flat[curIdx + 1];
  const pager = el("nav", { class: "pager", "aria-label": "Páginas" });
  if (prev) pager.appendChild(el("a", { class: "prev", href: ROOT + prev.p }, `<small>← Anterior</small>${prev.t}`));
  if (next) pager.appendChild(el("a", { class: "next", href: ROOT + next.p }, `<small>Siguiente →</small>${next.t}`));
  content.appendChild(pager);
  content.appendChild(el("div", { class: "page-footer" },
    `¿Encontraste un error? <a href="${REPO}/edit/main/docs/${PAGE}" target="_blank" rel="noopener">Edita esta página en GitHub</a>.`));

  main.appendChild(content);

  const tocItems = docHeadings("h2, h3");
  let tocLinks = [];
  if (tocItems.length > 1) {
    const toc = el("aside", { class: "toc", "aria-label": "En esta página" }, "<h4>En esta página</h4>");
    const ul = el("ul");
    tocItems.forEach((h) => {
      const li = el("li", { class: h.tagName === "H3" ? "l3" : "l2" });
      const a = el("a", { href: "#" + h.id }, h.dataset.text);
      li.appendChild(a); ul.appendChild(li); tocLinks.push([h, a]);
    });
    toc.appendChild(ul);
    main.appendChild(toc);
  }

  const layout = el("div", { class: "layout" });
  const scrim = el("div", { class: "scrim" });
  scrim.addEventListener("click", () => body.classList.remove("nav-open"));
  body.insertBefore(header, body.firstChild);
  main.parentNode.insertBefore(layout, main);
  layout.append(sidebar, scrim, main);

  // scrollspy (TOC + subsecciones del panel izquierdo)
  const sideSubs = [...nav.querySelectorAll(".sub a")];
  function spy() {
    let active = null;
    for (const [h] of tocLinks.length ? tocLinks : headings.map((h) => [h])) {
      if (h.getBoundingClientRect().top < 120) active = h; else break;
    }
    tocLinks.forEach(([h, a]) => a.classList.toggle("active", h === active));
    let h2 = active;
    if (h2 && h2.tagName === "H3") { let i = tocItems.indexOf(h2); while (i >= 0 && tocItems[i].tagName !== "H2") i--; h2 = tocItems[i]; }
    sideSubs.forEach((a) => a.classList.toggle("current", h2 && a.getAttribute("href") === "#" + h2.id));
  }
  window.addEventListener("scroll", spy, { passive: true });
  spy();

  // llevar el ítem activo a la vista dentro del panel
  const act = nav.querySelector("a.active");
  if (act) act.scrollIntoView({ block: "center" });

  // ---------- Carga de librerías externas ----------
  function loadScript(src) {
    return new Promise((res, rej) => { const s = el("script", { src }); s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }

  // highlight.js (bundle común + powershell + dockerfile)
  const HL = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/";
  if (article.querySelector("pre code")) {
    loadScript(HL + "highlight.min.js")
      .then(() => Promise.all(["powershell", "dockerfile", "http"].map((l) => loadScript(HL + "languages/" + l + ".min.js"))))
      .then(() => article.querySelectorAll("pre code").forEach((c) => window.hljs.highlightElement(c)))
      .catch(() => {});
  }

  // Mermaid (re-render al cambiar tema)
  let mermaidMod = null;
  async function renderMermaid() {
    const nodes = [...article.querySelectorAll("pre.mermaid")];
    if (!nodes.length) return;
    try {
      if (!mermaidMod) mermaidMod = (await import("https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs")).default;
      mermaidMod.initialize({ startOnLoad: false, theme: theme === "dark" ? "dark" : "default", securityLevel: "loose", fontFamily: "Segoe UI, system-ui, sans-serif" });
      nodes.forEach((n) => { n.removeAttribute("data-processed"); n.textContent = n.dataset.src; });
      await mermaidMod.run({ nodes });
    } catch (e) {
      nodes.forEach((n) => { n.style.color = "inherit"; });
    }
  }
  renderMermaid();
})();
