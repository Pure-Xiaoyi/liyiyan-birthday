(function exposeBirthdayGeometry(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BirthdayGeometry = api;
}(typeof window !== "undefined" ? window : globalThis, () => {
  function shuffled(items, random) {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function createBlessingScatter({
    count,
    width,
    height,
    safeTop = -210,
    safeBottom = 80,
    random = Math.random,
  }) {
    const scaleX = Math.min(width / 390, 1.1);
    const scaleY = Math.min(height / 844, 1.08);
    const columns = [-130, -65, 0, 65, 130];
    const rowStep = (safeBottom - safeTop) / 4;
    const rows = Array.from({ length: 5 }, (_, index) => safeTop + rowStep * index);
    const cells = [];

    rows.forEach((y, row) => {
      columns.forEach((x, column) => {
        if (row === 4 && column === 2) return;
        cells.push({ x, y });
      });
    });

    const fallback = shuffled(cells, random);
    const points = [];
    const minimumDistance = 48 * Math.min(scaleX, scaleY);

    for (let index = 0; index < count; index += 1) {
      let point = null;
      for (let attempt = 0; attempt < 70; attempt += 1) {
        const candidate = {
          x: Math.round((-138 + random() * 276) * scaleX),
          y: Math.round((safeTop + random() * (safeBottom - safeTop)) * scaleY),
        };
        if (points.every((existing) => Math.hypot(existing.x - candidate.x, existing.y - candidate.y) >= minimumDistance)) {
          point = candidate;
          break;
        }
      }

      if (!point) {
        const cell = fallback.find((candidate) => points.every((existing) => (
          Math.hypot(existing.x - candidate.x * scaleX, existing.y - candidate.y * scaleY) >= minimumDistance
        ))) || fallback[index % fallback.length];
        point = { x: Math.round(cell.x * scaleX), y: Math.round(cell.y * scaleY) };
      }

      points.push({
        ...point,
        delay: Math.round(index * 24 + random() * 70),
        curve: Math.round((point.x < 0 ? -1 : 1) * (18 + random() * 28)),
      });
    }

    return points;
  }

  function createHeartLayout({ count, width, height }) {
    const scale = Math.min(width / 390, height / 844, 1.08);
    const rows = [
      { y: -100, xs: [-96, -56, 56, 96] },
      { y: -60, xs: [-120, -72, -24, 24, 72, 120] },
      { y: -20, xs: [-96, -48, 0, 48, 96] },
      { y: 22, xs: [-72, -24, 24, 72] },
      { y: 62, xs: [-42, 0, 42] },
      { y: 104, xs: [0] },
    ];
    const points = rows.flatMap(({ y, xs }) => xs.map((x) => ({
      x: Math.round(x * scale),
      y: Math.round(y * scale),
    })));
    return points.slice(0, count);
  }

  return { createBlessingScatter, createHeartLayout };
}));
