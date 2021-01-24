import { rollup, quadtree as d3Quadtree, max } from "d3";

function centroid(nodes) {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const d of nodes) {
    let k = d.r ** 2;
    x += d.x * k;
    y += d.y * k;
    z += k;
  }
  return { x: x / z, y: y / z };
}
export const forceCluster = () => {
  const strength = 0.2;
  let nodes;

  function force(alpha) {
    const centroids = rollup(nodes, centroid, (d) => d.data.group);
    const l = alpha * strength;
    for (const d of nodes) {
      const { x: cx, y: cy } = centroids.get(d.data.group);
      d.vx -= (d.x - cx) * l;
      d.vy -= (d.y - cy) * l;
    }
  }

  force.initialize = (_) => (nodes = _);

  return force;
};

export const forceCollide = () => {
  const alpha = 0.4; // fixed for greater rigidity!
  const padding1 = 2; // separation between same-color nodes
  const padding2 = 6; // separation between different-color nodes
  let nodes;
  let maxRadius;

  function force() {
    const quadtree = d3Quadtree(
      nodes,
      (d) => d.x,
      (d) => d.y
    );
    for (const d of nodes) {
      const r = d.r + maxRadius;
      const nx1 = d.x - r,
        ny1 = d.y - r;
      const nx2 = d.x + r,
        ny2 = d.y + r;
      quadtree.visit((q, x1, y1, x2, y2) => {
        if (!q.length)
          do {
            if (q.data !== d) {
              const r =
                d.r +
                q.data.r +
                (d.data.group === q.data.data.group ? padding1 : padding2);
              let x = d.x - q.data.x,
                y = d.y - q.data.y,
                l = Math.hypot(x, y);
              if (l < r) {
                l = ((l - r) / l) * alpha;
                d.x -= x *= l;
                d.y -= y *= l;
                q.data.x += x;
                q.data.y += y;
              }
            }
          } while ((q = q.next));
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    }
  }

  force.initialize = (_) =>
    (maxRadius = max((nodes = _), (d) => d.r) + Math.max(padding1, padding2));

  return force;
};
