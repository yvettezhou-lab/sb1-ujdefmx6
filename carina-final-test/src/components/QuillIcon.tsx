type QuillIconProps = {
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
    P(18, 48),
    P(18, 41),
    P(37, 23),
    P(53, 12),
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

function leftFiber(t: number) {
  const start = shaft(t);
  const angle = ((235 + 42 * t) * Math.PI) / 180;
  const phase = Math.max(0, Math.min(1, (t - 0.12) / 0.88));
  const length = 8.6 * Math.pow(Math.sin(Math.PI * phase), 0.75);
  const end = P(
    start.x + Math.cos(angle) * length,
    start.y + Math.sin(angle) * length,
  );
  const tangent = shaftTangent(t);
  const c1 = P(
    start.x + (end.x - start.x) * 0.28 - tangent.x * 0.9,
    start.y + (end.y - start.y) * 0.28 - tangent.y * 0.9,
  );
  const c2 = P(
    start.x + (end.x - start.x) * 0.78 + tangent.x * 0.45,
    start.y + (end.y - start.y) * 0.78 + tangent.y * 0.45,
  );
  return { start, c1, c2, end };
}

function rightFiber(t: number) {
  const start = shaft(t);
  const angle = ((2 + 28 * t) * Math.PI) / 180;
  const phase = Math.max(0, Math.min(1, (t - 0.10) / 0.90));
  const length = 11.8 * Math.pow(Math.sin(Math.PI * phase), 0.82);
  const end = P(
    start.x + Math.cos(angle) * length,
    start.y + Math.sin(angle) * length,
  );
  const tangent = shaftTangent(t);
  const c1 = P(
    start.x + (end.x - start.x) * 0.30 + tangent.x * 0.35,
    start.y + (end.y - start.y) * 0.30 + tangent.y * 0.35,
  );
  const c2 = P(
    start.x + (end.x - start.x) * 0.78 - tangent.x * 0.25,
    start.y + (end.y - start.y) * 0.78 - tangent.y * 0.25,
  );
  return { start, c1, c2, end };
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

function buildBoundary(points: Point[], scallop = 0): string {
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
  const leftTs = [0.16, 0.25, 0.34, 0.43, 0.52, 0.61, 0.70, 0.78];
  const rightTs = [0.20, 0.31, 0.42, 0.53, 0.64, 0.74, 0.84];
  const leftFibers = leftTs.map(leftFiber);
  const rightFibers = rightTs.map(rightFiber);
  const leftBoundary = leftFibers.map((fiber) => fiber.end);
  const rightBoundary = rightFibers.map((fiber) => fiber.end);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M 18 48 C 18 41 37 23 53 12"
        stroke="currentColor"
        strokeWidth={1 * scale}
        strokeLinecap="round"
      />
      {leftFibers.map((fiber, index) => (
        <path
          key={`left-${index}`}
          d={pathFromCubic(fiber.start, fiber.c1, fiber.c2, fiber.end)}
          stroke="currentColor"
          strokeWidth={0.52 * scale}
          strokeLinecap="round"
          opacity="0.94"
        />
      ))}
      {rightFibers.map((fiber, index) => (
        <path
          key={`right-${index}`}
          d={pathFromCubic(fiber.start, fiber.c1, fiber.c2, fiber.end)}
          stroke="currentColor"
          strokeWidth={0.52 * scale}
          strokeLinecap="round"
          opacity="0.94"
        />
      ))}
      <path
        d={buildBoundary(leftBoundary, 0.18)}
        stroke="currentColor"
        strokeWidth={0.40 * scale}
        strokeLinecap="round"
        opacity="0.68"
      />
      <path
        d={buildBoundary(rightBoundary, 0.42)}
        stroke="currentColor"
        strokeWidth={0.46 * scale}
        strokeLinecap="round"
        opacity="0.78"
      />
      <path
        d="M 18 48 C 16 50 14 52.5 13.2 55"
        stroke="currentColor"
        strokeWidth={0.95 * scale}
        strokeLinecap="round"
      />
      <circle cx="11.4" cy="57" r="0.8" fill="currentColor" />
      <circle cx="15" cy="55" r="0.38" fill="currentColor" />
    </svg>
  );
}

export default QuillIcon;
