interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function faceNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  return normalize(cross(subtract(b, a), subtract(c, a)));
}

export function buildCoinSTL(
  radius = 10,
  height = 1.5,
  segments = 64
): string {
  const tris: { a: Vec3; b: Vec3; c: Vec3 }[] = [];
  const half = height / 2;

  const topRing: Vec3[] = [];
  const bottomRing: Vec3[] = [];

  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    topRing.push({ x, y: half, z });
    bottomRing.push({ x, y: -half, z });
  }

  const topCenter: Vec3 = { x: 0, y: half, z: 0 };
  const bottomCenter: Vec3 = { x: 0, y: -half, z: 0 };

  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    tris.push({ a: bottomRing[i], b: bottomRing[next], c: bottomCenter });
  }

  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    const a = bottomRing[i];
    const b = bottomRing[next];
    const c = topRing[i];
    const d = topRing[next];

    tris.push({ a, b: c, c: b });
    tris.push({ a: c, b: d, c: b });
  }

  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    tris.push({ a: topRing[next], b: topRing[i], c: topCenter });
  }

  const lines: string[] = [];
  lines.push("solid egomonk_instinct_coin");

  for (const t of tris) {
    const n = faceNormal(t.a, t.b, t.c);
    lines.push(`  facet normal ${n.x.toFixed(6)} ${n.y.toFixed(6)} ${n.z.toFixed(6)}`);
    lines.push("    outer loop");
    lines.push(`      vertex ${t.a.x.toFixed(6)} ${t.a.y.toFixed(6)} ${t.a.z.toFixed(6)}`);
    lines.push(`      vertex ${t.b.x.toFixed(6)} ${t.b.y.toFixed(6)} ${t.b.z.toFixed(6)}`);
    lines.push(`      vertex ${t.c.x.toFixed(6)} ${t.c.y.toFixed(6)} ${t.c.z.toFixed(6)}`);
    lines.push("    endloop");
    lines.push("  endfacet");
  }

  lines.push("endsolid egomonk_instinct_coin");
  return lines.join("\n");
}

export function downloadSTL(contents: string, filename: string) {
  const blob = new Blob([contents], { type: "model/stl" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}