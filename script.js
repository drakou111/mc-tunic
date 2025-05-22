const CELL_SIZE = 32;
const DEFAULT_BASE_COLOR = {r: 160, g: 101, b: 64}

const DYES  = {
  "0" : {name: "black", r: 0x1D, g: 0x1D, b: 0x21 },
  "1" : {name: "red", r: 0xB0, g: 0x2E, b: 0x26 },
  "2" : {name: "green", r: 0x5E, g: 0x7C, b: 0x16 },
  "3" : {name: "brown", r: 0x83, g: 0x54, b: 0x32 },
  "4" : {name: "blue", r: 0x3C, g: 0x4A, b: 0xAA },
  "5" : {name: "purple", r: 0x89, g: 0x32, b: 0xB8 },
  "6" : {name: "cyan", r: 0x16, g: 0x9C, b: 0x9C },
  "7" : {name: "light_gray", r: 0x9D, g: 0x9D, b: 0x97 },
  "8" : {name: "gray", r: 0x47, g: 0x4F, b: 0x52 },
  "9" : {name: "pink", r: 0xF3, g: 0x8B, b: 0xAA },
  "A" : {name: "lime", r: 0x80, g: 0xC7, b: 0x1F },
  "B" : {name: "yellow", r: 0xFE, g: 0xD8, b: 0x3D },
  "C" : {name: "light_blue", r: 0x3A, g: 0xB3, b: 0xDA },
  "D" : {name: "magenta", r: 0xC7, g: 0x4E, b: 0xBD },
  "E" : {name: "orange", r: 0xF9, g: 0x80, b: 0x1D },
  "F" : {name: "white", r: 0xF9, g: 0xFF, b: 0xFE }
};

const recipeFiles = [
  './recipes_0.json',
  './recipes_1.json',
  './recipes_2.json',
  './recipes_3.json',
  './recipes_4.json',
  './recipes_5.json',
  './recipes_6.json',
  './recipes_7.json',
  './recipes_8.json',
  './recipes_9.json',
  './recipes_10.json',
  './recipes_11.json',
  './recipes_12.json',
  './recipes_13.json',
  './recipes_14.json',
  './recipes_15.json',
];

let recipes = [];
const resultsEl = document.getElementById('results');
const numInput = document.getElementById('numResults');
const colorMode = document.getElementById('colorMode');
const colorInput = document.getElementById('colorInput');
const pickerInput = document.getElementById('colorPicker');
const loadingUI = document.getElementById('loadingOverlay');
const progressBar = document.getElementById('progressBar');

async function loadAllRecipes() {
  const promises = recipeFiles.map(file => fetch(file).then(r => r.json()));
  const arrays = await Promise.all(promises);
  const allRecipes = arrays.flat();
  return allRecipes;
}

window.addEventListener('DOMContentLoaded', async () => {
  loadingUI.style.display = 'flex';

  const rawRecipes = await loadAllRecipes()
  recipes = rawRecipes.map(({ o: output, s: steps }) => {
    const dyes = steps.flatMap(s => s.split('').map(c => DYES[c]));
    return { output, steps, rgb: blendColor(dyes, DEFAULT_BASE_COLOR) };
  });

  loadingUI.style.display = 'none';
});

function blendColor(dyes, prevCol) {
  let totR = 0, totG = 0, totB = 0, totMax = 0, cnt = dyes.length + (prevCol ? 1 : 0);

  if (prevCol) {
    totR += prevCol.r; totG += prevCol.g; totB += prevCol.b;
    totMax += Math.max(prevCol.r, prevCol.g, prevCol.b);
  }

  dyes.forEach(d => {
    totR += d.r; totG += d.g; totB += d.b;
    totMax += Math.max(d.r, d.g, d.b);
  });

  const avgR = totR / cnt, avgG = totG / cnt, avgB = totB / cnt;
  const alpha = (totMax / cnt) / Math.max(avgR, avgG, avgB);
  return { r: avgR, g: avgG, b: avgB, opacity: alpha };
}

async function makeTunicCanvas(r, g, b, opacity) {
  const [slotImg, baseImg] = await Promise.all([
    loadImg('images/cell.png'),
    loadImg('images/leather_chestplate.png')
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = CELL_SIZE;
  const ctx = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(slotImg, 0, 0, CELL_SIZE, CELL_SIZE);
  ctx.drawImage(baseImg, 0, 0, CELL_SIZE, CELL_SIZE);

  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${opacity})`;
  ctx.fillRect(0, 0, CELL_SIZE, CELL_SIZE);

  ctx.globalCompositeOperation = 'destination-atop';
  ctx.drawImage(baseImg, 0, 0, CELL_SIZE, CELL_SIZE);

  ctx.globalCompositeOperation = 'source-over';

  canvas.style.imageRendering = 'pixelated';

  return canvas;
}

function loadImg(src) {
  return new Promise(res => {
    const i = new Image();
    i.src = src;
    i.onload = () => res(i);
  });
}

function wrapCell(node) {
  const cell = document.createElement('div');
  cell.className = 'cell';

  const slot = new Image();
  slot.src = 'images/cell.png';
  slot.width = slot.height = CELL_SIZE;
  slot.style.imageRendering = 'pixelated';

  cell.append(slot, node);
  return cell;
}

function imgCell(src) {
  const img = new Image();
  img.src = `images/${src}`;
  img.width = img.height = CELL_SIZE;
  img.style.imageRendering = 'pixelated';
  img.alt = src
  return wrapCell(img);
}

function makeBadge(accuracy) {
  const d = document.createElement('div');
  d.textContent = `Accuracy: ${accuracy.toFixed(2)}%`;
  d.className = 'accuracy-badge';

  if (accuracy === 100) {
    d.style.backgroundColor = 'green';
    d.style.color = 'white';
    d.style.padding = '0.25rem 0.5rem';
    d.style.borderRadius = '0.5rem';
    d.style.fontWeight = 'bold';
  } else {
    d.style.color = accuracyColor(accuracy);
  }

  return d;
}

async function findClosestColors() {
  loadingUI.style.display = 'flex';
  
  await new Promise(resolve => setTimeout(resolve, 0));

  const raw = pickerInput.value;
  const target = hexToRgb(raw);
  const count = numInput.value;

  const nearest = findTopNClosest(recipes, target, count);

  resultsEl.innerHTML = '';

  for (const { rgb, steps, d } of nearest) {
    const accuracyPct = 100 - Math.min((d / maxDist) * 100, 100);
    const badge = makeBadge(accuracyPct);

    const stepsEl = document.createElement('div');
    stepsEl.textContent = `Steps: ${steps.length}`;
    stepsEl.className = 'text-sm text-gray-300';

    const dyesEl = document.createElement('div');
    dyesEl.textContent = `Dyes: ${steps.reduce((s, s0) => s + s0.length, 0)}`;
    dyesEl.className = 'text-sm text-gray-300';

    const previewCanvas = await makeTunicCanvas(rgb.r, rgb.g, rgb.b, 1);
    const previewCell = wrapCell(previewCanvas);

    const meta = document.createElement('div');
    meta.className = 'result-meta';
    meta.append(badge, stepsEl, dyesEl, previewCell);

    const stepRow = document.createElement('div');
    stepRow.className = 'steps';

    let prevColor = DEFAULT_BASE_COLOR;

    for (let i = 0; i < steps.length; i++) {
      const dyes = steps[i].split('').map(c => DYES[c]);
      const { r, g, b, opacity } = blendColor(dyes, prevColor);

      const grid = document.createElement('div');
      grid.className = 'grid';

      const cells = [];

      const canvas = await makeTunicCanvas(prevColor.r, prevColor.g, prevColor.b, opacity);
      cells.push(wrapCell(canvas));

      dyes.forEach(dye => {
        const img = new Image();
        img.src = `images/${dye.name}_dye.png`;
        img.width = img.height = CELL_SIZE;
        img.style.imageRendering = 'pixelated';
        cells.push(wrapCell(img));
      });

      while (cells.length < 9) {
        const empty = new Image();
        empty.src = 'images/cell.png';
        empty.width = empty.height = CELL_SIZE;
        empty.style.imageRendering = 'pixelated';
        cells.push(wrapCell(empty));
      }

      cells.forEach(c => grid.appendChild(c));

      stepRow.appendChild(grid);
      prevColor = { r, g, b };
    }

    const card = document.createElement('div');
    card.className = 'result p-4 bg-gray-800 rounded shadow';
    card.append(meta, stepRow);
    resultsEl.append(card);
  }

  loadingUI.style.display = 'none';
}

const intToRgb = i => ({ r: (i >> 16) & 255, g: (i >> 8) & 255, b: i & 255 });

const hexToRgb = h => {
  let hex = h.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return intToRgb(parseInt(hex, 16));
};

const dist = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
const maxDist = Math.sqrt(3 * 255 ** 2);

const accuracyColor = pct => {
  const clamped = Math.max(0, Math.min(100, pct));
  const skewed = Math.pow(clamped / 100, 4) * 100;
  const r = skewed < 50 ? 255 : 255 - (skewed - 50) * 5.1;
  const g = skewed < 50 ? skewed * 5.1 : 255;
  return `rgb(${r | 0},${g | 0},0)`;
};

function findTopNClosest(recipes, target, count) {
    const heap = [];
    for (const r of recipes) {
        const d = dist(intToRgb(r.output), target);
        if (heap.length < count) {
            heap.push({ ...r, d });
            heap.sort((a, b) => a.d - b.d); // min-heap
        } else if (d < heap[count-1].d) {
            heap[count-1] = { ...r, d };
            heap.sort((a, b) => a.d - b.d);
        }
    }
    return heap;
}