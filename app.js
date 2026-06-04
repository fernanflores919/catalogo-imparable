const STORAGE_KEY = "imparable-catalog-prices-v1";
const COLOR_MAP = {
  blanco: "#ffffff",
  negro: "#0a0a0a",
  rojo: "#e81818",
  rey: "#0066ff",
  "azul oscuro": "#071733",
};

const DESIGN_ORDER = [
  "Camiseta Ultra Fit Manga Corta",
  "Camiseta Ultra Fit Manga Larga",
  "Licra Larga",
  "Licra Corta",
  "Sweater",
  "Pantaloneta Corta Fit",
  "Pantaloneta Corte Basico",
  "Camiseta Basica Algodon",
  "Camiseta Basica Fit Sin Mangas",
  "Camiseta Imparable",
  "Camiseta Olimpica",
  "Camiseta Oversize Con Mangas",
  "Camiseta Oversize Sin Mangas",
  "Otros",
];

const state = {
  search: "",
  design: "Todos",
  color: "Todos",
  prices: loadPrices(),
};

const products = (window.IMPARABLE_FILES || []).map((file, index) => buildProduct(file, index));

const els = {
  catalog: document.querySelector("#catalog"),
  summaryBand: document.querySelector("#summaryBand"),
  designFilter: document.querySelector("#designFilter"),
  colorFilter: document.querySelector("#colorFilter"),
  searchInput: document.querySelector("#searchInput"),
  groupTemplate: document.querySelector("#groupTemplate"),
  cardTemplate: document.querySelector("#cardTemplate"),
  exportBtn: document.querySelector("#exportBtn"),
  printBtn: document.querySelector("#printBtn"),
};

init();

function init() {
  populateFilters();
  bindEvents();
  render();
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    render();
  });

  els.designFilter.addEventListener("change", (event) => {
    state.design = event.target.value;
    render();
  });

  els.colorFilter.addEventListener("change", (event) => {
    state.color = event.target.value;
    render();
  });

  els.exportBtn.addEventListener("click", exportPrices);
  els.printBtn.addEventListener("click", () => window.print());
}

function populateFilters() {
  const designs = ["Todos", ...DESIGN_ORDER.filter((design) => products.some((product) => product.design === design))];
  const colors = ["Todos", ...unique(products.map((product) => product.colorLabel))];

  els.designFilter.replaceChildren(...designs.map((value) => option(value)));
  els.colorFilter.replaceChildren(...colors.map((value) => option(value)));
}

function render() {
  const visible = products.filter(matchesFilters);
  const grouped = groupProducts(visible);

  renderSummary();
  els.catalog.replaceChildren();

  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No hay productos con esos filtros.";
    els.catalog.append(empty);
    return;
  }

  grouped.forEach(([design, items], index) => {
    const group = els.groupTemplate.content.cloneNode(true);
    group.querySelector(".section-kicker").textContent = String(index + 1).padStart(2, "0");
    group.querySelector("h2").textContent = design;
    group.querySelector(".group-count").textContent = `${items.length} producto${items.length === 1 ? "" : "s"}`;

    const grid = group.querySelector(".product-grid");
    items.forEach((product) => grid.append(renderCard(product)));
    els.catalog.append(group);
  });
}

function renderSummary() {
  const groups = groupProducts(products);
  els.summaryBand.replaceChildren();

  groups.forEach(([design, items]) => {
    const button = document.createElement("button");
    button.className = "summary-item";
    button.type = "button";
    button.innerHTML = `<strong>${items.length}</strong><span>${design}</span>`;
    button.addEventListener("click", () => {
      state.design = design;
      els.designFilter.value = design;
      render();
      document.querySelector(".catalog").scrollIntoView({ behavior: "smooth" });
    });
    els.summaryBand.append(button);
  });
}

function renderCard(product) {
  const card = els.cardTemplate.content.cloneNode(true);
  const img = card.querySelector("img");
  const title = card.querySelector("h3");
  const meta = card.querySelector(".product-meta");
  const dot = card.querySelector(".color-dot");
  const input = card.querySelector("input");

  img.src = `assets/products/${encodeURIComponent(product.file)}`;
  img.alt = product.name;
  title.textContent = product.name;
  meta.textContent = `${product.design} / ${product.colorLabel}`;
  dot.style.background = product.colorHex;
  input.value = state.prices[product.id] || "";
  input.dataset.productId = product.id;
  input.addEventListener("input", (event) => {
    state.prices[product.id] = event.target.value;
    savePrices();
  });

  return card;
}

function matchesFilters(product) {
  const query = `${product.name} ${product.design} ${product.colorLabel}`.toLowerCase();
  return (
    (!state.search || query.includes(state.search)) &&
    (state.design === "Todos" || product.design === state.design) &&
    (state.color === "Todos" || product.colorLabel === state.color)
  );
}

function buildProduct(file, index) {
  const normalized = normalize(file);
  const color = detectColor(normalized);
  const design = detectDesign(normalized);
  return {
    id: `IMP-${String(index + 1).padStart(3, "0")}`,
    file,
    name: titleCase(file.replace(/\.png$/i, "").replace(/\s+/g, " ").trim()),
    design,
    colorLabel: color,
    colorHex: COLOR_MAP[color] || "#8b95a5",
  };
}

function detectDesign(text) {
  if (text.includes("ultra fit") && text.includes("manga corta")) return "Camiseta Ultra Fit Manga Corta";
  if (text.includes("ultra fit") && text.includes("manga larga")) return "Camiseta Ultra Fit Manga Larga";
  if (text.includes("licra larga")) return "Licra Larga";
  if (text.includes("licra corta")) return "Licra Corta";
  if (text.includes("sweter") || text.includes("sweater")) return "Sweater";
  if (text.includes("pantaloneta corta fit") || text.includes("pnataloneta corta fit") || text.includes("panataloneta corta fit")) return "Pantaloneta Corta Fit";
  if (text.includes("pantaloneta corte basico") || text.includes("panatloneta corte basico") || text.includes("pantaloneta basica")) return "Pantaloneta Corte Basico";
  if (text.includes("basica algodon") || text.includes("basica lagodon")) return "Camiseta Basica Algodon";
  if (text.includes("basica fit sin mangas")) return "Camiseta Basica Fit Sin Mangas";
  if (text.includes("camiseta imparable")) return "Camiseta Imparable";
  if (text.includes("olimpica")) return "Camiseta Olimpica";
  if (text.includes("oversize") && (text.includes("con manga") || text.includes("con mangas"))) return "Camiseta Oversize Con Mangas";
  if (text.includes("oversize") && text.includes("sin mangas")) return "Camiseta Oversize Sin Mangas";
  return "Otros";
}

function detectColor(text) {
  if (text.includes("azul oscuro")) return "azul oscuro";
  if (text.includes("azul rey") || text.includes("color rey") || text.includes(" rey ")) return "rey";
  if (text.includes("blanco") || text.includes("blanca")) return "blanco";
  if (text.includes("negro") || text.includes("nego")) return "negro";
  if (text.includes("rojo")) return "rojo";
  return "sin color";
}

function groupProducts(items) {
  const map = new Map();
  items.forEach((product) => {
    if (!map.has(product.design)) map.set(product.design, []);
    map.get(product.design).push(product);
  });

  return [...map.entries()].sort((a, b) => DESIGN_ORDER.indexOf(a[0]) - DESIGN_ORDER.indexOf(b[0]));
}

function option(value) {
  const optionElement = document.createElement("option");
  optionElement.value = value;
  optionElement.textContent = value;
  return optionElement;
}

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"));
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.png$/i, "");
}

function titleCase(value) {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ")
    .replace(/\bAzul Rey\b/g, "Azul Rey")
    .replace(/\bAzul Oscuro\b/g, "Azul Oscuro");
}

function loadPrices() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function savePrices() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.prices));
}

function exportPrices() {
  const rows = products.map((product) => ({
    codigo: product.id,
    diseno: product.design,
    producto: product.name,
    color: product.colorLabel,
    precio: state.prices[product.id] || "",
  }));

  const csv = [
    "codigo,diseno,producto,color,precio",
    ...rows.map((row) => Object.values(row).map(csvCell).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "catalogo-imparable-precios.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}
