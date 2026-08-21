type QuillIconProps = {
import feather from "../assets/feather.png";
  size?: number;
  strokeWidth?: number;
  className?: string;
};

type Point = {
  x: number;
  y: number;
};

const P = (x: number, y: number): Point => ({ x, y });

function cubicPoint(
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
): Point {
  const u = 1 - t;
  return P(
    u * u * u * p0.x +
      3 * u * u * t * p1.x +
      3 * u * t * t * p2.x +
      t * t * t * p3.x,
    u * u * u * p0.y +
      3 * u * u * t * p1.y +
      3 * u * t * t * p2.y +
      t * t * t * p3.y,
  );
}

function shaft(t: number): Point {
  return cubicPoint(
    t,
    P(11, 53),
    P(15, 44),
    P(30, 37),
    P(53, 14),
  );
}

function shaftTangent(t: number): Point {
  const e = 0.002;
  const a = shaft(Math.max(0, t - e));
  const b = shaft(Math.min(1, t + e));
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  return P(dx / length, dy / length);
}

function lerp(a: Point, b: Point, amount: number): Point {
  return P(
    a.x + (b.x - a.x) * amount,
    a.y + (b.y - a.y) * amount,
  );
}

function makeFiber(
  t: number,
  side: 1 | -1,
  baseLength: number,
  phase: number,
) {
  const start = shaft(t);
  const tangent = shaftTangent(t);
  const normal = P(-tangent.y, tangent.x);

  const envelope = Math.pow(
    Math.sin(Math.PI * t),
    side === 1 ? 0.58 : 0.68,
  );

  const variation =
    0.92 +
    0.10 * Math.sin(t * Math.PI * 7 + phase) +
    0.05 * Math.sin(t * Math.PI * 13 + phase * 0.7);

  const length = baseLength * envelope * variation;

  const sweep =
    0.20 +
    0.14 * t +
    0.045 * Math.sin(t * Math.PI * 5 + phase);

  const curl =
    0.34 * Math.sin(t * Math.PI * 3.5 + phase) +
    0.10 * Math.sin(t * Math.PI * 7 + phase * 0.6);

  const end = P(
    start.x + normal.x * side * length - tangent.x * length * sweep,
    start.y + normal.y * side * length - tangent.y * length * sweep,
  );

  const c1 = P(
    start.x +
      normal.x * side * length * 0.34 -
      tangent.x * length * (sweep * 0.35) +
      normal.x * side * curl,
    start.y +
      normal.y * side * length * 0.34 -
      tangent.y * length * (sweep * 0.35) +
      normal.y * side * curl,
  );

  const c2 = P(
    start.x +
      (end.x - start.x) * 0.72 -
      tangent.x * length * 0.02 -
      normal.x * side * curl,
    start.y +
      (end.y - start.y) * 0.72 -
      tangent.y * length * 0.02 -
      normal.y * side * curl,
  );

  return { start, c1, c2, end };
}

function leftFiber(t: number) {
  return makeFiber(t, -1, 18.5, 0.4);
}

function rightFiber(t: number) {
  return makeFiber(t, 1, 20.5, 1.7);
}

function pathFromCubic(
  start: Point,
  c1: Point,
  c2: Point,
  end: Point,
): string {
  return [
    `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)}`,
    `${c2.x.toFixed(2)} ${c2.y.toFixed(2)}`,
    `${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
  ].join(" ");
}

function buildBoundary(
  points: Point[],
  scallop = 0,
): string {
  if (points.length < 2) return "";

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const mid = lerp(a, b, 0.5);

    const control = P(
      mid.x,
      mid.y + scallop * (i % 2 === 0 ? 1 : -1),
    );

    d +=
      ` Q ${control.x.toFixed(2)} ${control.y.toFixed(2)}` +
      ` ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  }

  return d;
}

export function QuillIcon({
  size = 52,
  strokeWidth = 1.65,
  className = "",
}: QuillIconProps) {
  const scale = strokeWidth / 1.65;

  const leftTs = [
    0.11, 0.19, 0.27, 0.35, 0.43, 0.51,
    0.59, 0.67, 0.74, 0.81, 0.88, 0.93,
  ];

  const rightTs = [
    0.12, 0.20, 0.28, 0.36, 0.44, 0.52,
    0.60, 0.68, 0.75, 0.82, 0.89, 0.94,
  ];

  const leftFibers = leftTs.map(leftFiber);
  const rightFibers = rightTs.map(rightFiber);

  const leftBoundary = leftFibers.map(
    (fiber) => fiber.end,
  );

  const rightBoundary = rightFibers.map(
    (fiber) => fiber.end,
  );

  return (
    <img
      src={feather}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      alt=""
    />
  );
}

export default QuillIcon;