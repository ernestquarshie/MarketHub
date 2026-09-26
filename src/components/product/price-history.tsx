import { convert, formatMoney, type Currency, type Rates } from "@/lib/money";

/**
 * 12-month price history as a server-rendered SVG line chart (no client JS).
 * Accessible: summary in text, full data in a visually hidden table.
 */
export function PriceHistoryChart({
  points,
  from,
  to,
  rates,
}: {
  points: { price: number; recordedAt: Date }[];
  from: Currency;
  to: Currency;
  rates: Rates;
}) {
  if (points.length < 2) return <p className="text-sm text-muted">Not enough price history yet.</p>;
  const values = points.map((p) => convert(p.price, from, to, rates));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const now = values[values.length - 1]!;
  const W = 640;
  const H = 200;
  const padL = 88;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const span = Math.max(1, max - min);
  const lo = min - span * 0.15;
  const hi = max + span * 0.15;
  const t0 = points[0]!.recordedAt.getTime();
  const t1 = points[points.length - 1]!.recordedAt.getTime();
  const x = (t: number) => padL + ((t - t0) / Math.max(1, t1 - t0)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const path = points
    .map((p, i) => `${i ? "L" : "M"}${x(p.recordedAt.getTime()).toFixed(1)},${y(values[i]!).toFixed(1)}`)
    .join(" ");
  const area = `${path} L${x(t1).toFixed(1)},${H - padB} L${padL},${H - padB} Z`;
  const months = points.filter((_, i) => i % 3 === 0 || i === points.length - 1);
  const fmt = (v: number) => formatMoney(v, to);
  const lowIndex = values.indexOf(min);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <figure className="min-w-0 flex-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Price over the last 12 months, between ${fmt(min)} and ${fmt(max)}. Current price ${fmt(now)}.`}
        >
          {[0, 0.5, 1].map((f) => {
            const v = lo + (hi - lo) * f;
            return (
              <g key={f}>
                <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} />
                <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)">
                  {fmt(v)}
                </text>
              </g>
            );
          })}
          <path d={area} fill="var(--primary)" opacity={0.08} />
          <path d={path} fill="none" stroke="var(--primary)" strokeWidth={2.5} strokeLinejoin="round" />
          <circle cx={x(t1)} cy={y(now)} r={5} fill="var(--primary)" stroke="var(--bg)" strokeWidth={2} />
          <circle cx={x(points[lowIndex]!.recordedAt.getTime())} cy={y(min)} r={4} fill="var(--success)" />
          {months.map((p) => (
            <text
              key={p.recordedAt.toISOString()}
              x={x(p.recordedAt.getTime())}
              y={H - 8}
              textAnchor="middle"
              fontSize={11}
              fill="var(--text-muted)"
            >
              {p.recordedAt.toLocaleDateString("en-GB", { month: "short" })}
            </text>
          ))}
        </svg>
        <table className="sr-only">
          <caption>Price history</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Price</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={p.recordedAt.toISOString()}>
                <td>{p.recordedAt.toLocaleDateString("en-GB")}</td>
                <td>{fmt(values[i]!)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
      <dl className="grid grid-cols-3 gap-4 text-sm md:w-44 md:grid-cols-1">
        <div>
          <dt className="text-muted">Current</dt>
          <dd className="text-xl font-bold tabular">{fmt(now)}</dd>
        </div>
        <div>
          <dt className="text-muted">12-month low</dt>
          <dd className="text-lg font-bold text-success tabular">{fmt(min)}</dd>
        </div>
        <div>
          <dt className="text-muted">12-month high</dt>
          <dd className="text-lg font-bold tabular">{fmt(max)}</dd>
        </div>
      </dl>
    </div>
  );
}
