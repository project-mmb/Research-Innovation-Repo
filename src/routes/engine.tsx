import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { fetchListings, fetchPricingQuote, fetchRecentPricingDecisions } from "@/lib/markham-api";
import type { Listing } from "@/lib/markham-data";
import type { PricingDecision, PricingQuote } from "@/lib/markham-api";
import { pageHead } from "@/lib/markham-data";

export const Route = createFileRoute("/engine")({
  head: () =>
    pageHead(
      "Pricing engine",
      "Inspect live pricing inputs, rate calculations and recent engine decisions.",
    ),
  component: EngineDashboard,
});

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return dateInputValue(value);
}

function amount(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return `P ${numeric.toLocaleString("en-BW", { maximumFractionDigits: 2 })}`;
}

function multiplier(value: number | string) {
  return `${Number(value).toFixed(3)}×`;
}

function EngineDashboard() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const initialCheckIn = dateInputValue(tomorrow);
  const [properties, setProperties] = useState<Listing[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(addDays(initialCheckIn, 4));
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [decisions, setDecisions] = useState<PricingDecision[]>([]);
  const [connection, setConnection] = useState<"loading" | "live" | "offline">("loading");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetchListings()
      .then((data) => {
        if (!active) return;
        const available = data.filter((property) => property.status === "Available");
        setProperties(available);
        setPropertyId((current) => current || String(available[0]?.id ?? ""));
        setConnection("live");
      })
      .catch(() => {
        if (active) {
          setConnection("offline");
          setError(
            "The pricing engine is unreachable. Start the engine service to inspect live decisions.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!propertyId || !checkIn || !checkOut || checkOut <= checkIn) return;
    let active = true;
    const refresh = async () => {
      setRefreshing(true);
      try {
        const nextQuote = await fetchPricingQuote(Number(propertyId), checkIn, checkOut);
        const nextDecisions = await fetchRecentPricingDecisions(25);
        if (!active) return;
        setQuote(nextQuote);
        setDecisions(nextDecisions);
        setConnection("live");
        setError("");
      } catch {
        if (active) {
          setConnection("offline");
          setError(
            "Pricing inputs could not be refreshed. The displayed trace may be out of date.",
          );
        }
      } finally {
        if (active) setRefreshing(false);
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [propertyId, checkIn, checkOut, refreshKey]);

  const selectedProperty = properties.find((property) => String(property.id) === propertyId);
  const firstDecision = quote?.rates[0]?.decision;
  const chartData =
    quote?.rates.map((rate) => ({
      date: rate.date.slice(5),
      finalRate: Number(rate.price),
      baseRate: Number(rate.decision.baseRate),
      unconstrainedRate: Number(rate.decision.unconstrainedRate),
    })) ?? [];

  const inspectDecision = (decision: PricingDecision) => {
    setPropertyId(String(decision.propertyId));
    setCheckIn(decision.effectiveDate);
    setCheckOut(addDays(decision.effectiveDate, 1));
  };

  return (
    <main className="page engine-page">
      <div className="engine-heading">
        <div>
          <p className="eyebrow">OPERATIONS / PRICING</p>
          <h1>
            Decision dashboard<span className="brand-dot">.</span>
          </h1>
          <p>Inspect the inputs and rate limits behind each nightly price.</p>
        </div>
        <div className={`engine-connection ${connection}`}>
          <span />
          {connection === "live"
            ? "Engine connected"
            : connection === "loading"
              ? "Connecting"
              : "Connection issue"}
        </div>
      </div>

      <div className="engine-controls">
        <label>
          Property
          <select
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
            disabled={!properties.length}
          >
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name} · {property.district}
              </option>
            ))}
          </select>
        </label>
        <label>
          Check-in
          <span>
            <CalendarDays size={16} />
            <input
              type="date"
              value={checkIn}
              onChange={(event) => setCheckIn(event.target.value)}
            />
          </span>
        </label>
        <label>
          Check-out
          <span>
            <CalendarDays size={16} />
            <input
              type="date"
              min={checkIn}
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
            />
          </span>
        </label>
        <Button
          variant="outline"
          disabled={refreshing || !propertyId || checkOut <= checkIn}
          onClick={() => {
            setConnection("loading");
            setRefreshKey((value) => value + 1);
          }}
        >
          <RefreshCw className={refreshing ? "engine-spin" : ""} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="engine-alert">
          <TriangleAlert size={18} />
          <span>{error}</span>
        </div>
      )}
      {checkOut <= checkIn && (
        <div className="engine-alert">
          <TriangleAlert size={18} />
          <span>Check-out must be after check-in.</span>
        </div>
      )}

      {quote && firstDecision && checkOut > checkIn ? (
        <>
          <section className="engine-metrics" aria-label="Selected quote summary">
            <article>
              <span>Base nightly rate</span>
              <strong>{amount(firstDecision.baseRate)}</strong>
              <small>{selectedProperty?.name}</small>
            </article>
            <article>
              <span>Average final rate</span>
              <strong>{amount(Number(quote.total) / quote.nights)}</strong>
              <small>
                {quote.nights} nights · {quote.currency}
              </small>
            </article>
            <article>
              <span>Quote total</span>
              <strong>{amount(quote.total)}</strong>
              <small>
                {checkIn} to {checkOut}
              </small>
            </article>
            <article className={firstDecision.rateLimitAction === "NONE" ? "" : "limit-metric"}>
              <span>Rate guard</span>
              <strong>
                {firstDecision.rateLimitAction === "NONE"
                  ? "Within limits"
                  : `${firstDecision.rateLimitAction} applied`}
              </strong>
              <small>
                {amount(firstDecision.minimumRate)} floor · {amount(firstDecision.maximumRate)} cap
              </small>
            </article>
          </section>

          <section className="engine-main-grid">
            <article className="engine-panel engine-chart-panel">
              <div className="engine-panel-heading">
                <div>
                  <p className="eyebrow">RATE MOVEMENT</p>
                  <h2>Nightly calculation</h2>
                </div>
                <span>
                  <Activity size={15} />
                  {refreshing ? "Updating" : "Auto-refresh · 30 sec"}
                </span>
              </div>
              <div className="engine-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    />
                    <YAxis
                      width={54}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      tickFormatter={(value: number) => `P${value}`}
                    />
                    <Tooltip
                      formatter={(value) => amount(Number(value))}
                      contentStyle={{ borderRadius: 6, borderColor: "var(--border)" }}
                    />
                    <ReferenceLine
                      y={Number(firstDecision.baseRate)}
                      stroke="var(--peach-ink)"
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="finalRate"
                      name="Final rate"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "var(--primary)" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="unconstrainedRate"
                      name="Before limits"
                      stroke="var(--mint-ink)"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="engine-legend">
                <span>
                  <i className="legend-final" />
                  Final nightly rate
                </span>
                <span>
                  <i className="legend-raw" />
                  Before limits
                </span>
                <span>
                  <i className="legend-base" />
                  Base rate
                </span>
              </div>
            </article>

            <article className="engine-panel engine-trace-panel">
              <div className="engine-panel-heading">
                <div>
                  <p className="eyebrow">DECISION TRACE</p>
                  <h2>{firstDecision.effectiveDate}</h2>
                </div>
                <span className={`decision-status ${firstDecision.rateLimitAction.toLowerCase()}`}>
                  {firstDecision.rateLimitAction === "NONE" ? (
                    <CheckCircle2 size={15} />
                  ) : firstDecision.rateLimitAction === "FLOOR" ? (
                    <ArrowUp size={15} />
                  ) : (
                    <ArrowDown size={15} />
                  )}
                  {firstDecision.rateLimitAction === "NONE"
                    ? "Within range"
                    : `${firstDecision.rateLimitAction} applied`}
                </span>
              </div>
              <div className="formula-line">
                <span>{amount(firstDecision.baseRate)}</span>
                <b>×</b>
                <span>{multiplier(firstDecision.seasonalMultiplier)} season</span>
                <b>×</b>
                <span>{multiplier(firstDecision.demandMultiplier)} demand</span>
                <b>×</b>
                <span>{multiplier(firstDecision.eventMultiplier)} events</span>
              </div>
              <div className="trace-steps">
                <div>
                  <span className="trace-index">1</span>
                  <span>Unconstrained rate</span>
                  <strong>{amount(firstDecision.unconstrainedRate)}</strong>
                </div>
                <div>
                  <span className="trace-index">2</span>
                  <span>Allowed range</span>
                  <strong>
                    {amount(firstDecision.minimumRate)} – {amount(firstDecision.maximumRate)}
                  </strong>
                </div>
                <div className="trace-final">
                  <span className="trace-index">3</span>
                  <span>Final nightly rate</span>
                  <strong>{amount(firstDecision.finalRate)}</strong>
                </div>
              </div>
              <div
                className="range-track"
                aria-label={`Price range ${amount(firstDecision.minimumRate)} to ${amount(firstDecision.maximumRate)}`}
              >
                <span
                  className="range-marker"
                  style={{
                    left: `${Math.min(100, Math.max(0, ((Number(firstDecision.finalRate) - Number(firstDecision.minimumRate)) / Math.max(1, Number(firstDecision.maximumRate) - Number(firstDecision.minimumRate))) * 100))}%`,
                  }}
                />
              </div>
              <div className="range-labels">
                <span>Floor {amount(firstDecision.minimumRate)}</span>
                <span>Cap {amount(firstDecision.maximumRate)}</span>
              </div>
              <div className="input-ledger">
                <div>
                  <span>Seasonal factor</span>
                  <strong>{multiplier(firstDecision.seasonalMultiplier)}</strong>
                </div>
                <div>
                  <span>Demand factor</span>
                  <strong>{multiplier(firstDecision.demandMultiplier)}</strong>
                </div>
                {firstDecision.activeEvents.length ? (
                  firstDecision.activeEvents.map((event) => (
                    <div key={event.id}>
                      <span>{event.name}</span>
                      <strong>{multiplier(event.multiplier)}</strong>
                    </div>
                  ))
                ) : (
                  <div>
                    <span>Local events</span>
                    <strong>No active events</strong>
                  </div>
                )}
              </div>
              <p className="trace-note">
                <Clock3 size={13} />
                Decision logged{" "}
                {firstDecision.recordedAt
                  ? new Date(firstDecision.recordedAt).toLocaleTimeString()
                  : "now"}
                . Cached for up to 5 minutes.
              </p>
            </article>
          </section>

          <section className="engine-panel engine-history-panel">
            <div className="engine-panel-heading">
              <div>
                <p className="eyebrow">AUDIT TRAIL</p>
                <h2>Recent pricing decisions</h2>
              </div>
              <span>{decisions.length} records</span>
            </div>
            {decisions.length ? (
              <div className="engine-table-wrap">
                <table className="engine-table">
                  <thead>
                    <tr>
                      <th>Logged</th>
                      <th>Property / night</th>
                      <th>Inputs</th>
                      <th>Before limits</th>
                      <th>Final rate</th>
                      <th>Guard</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {decisions.map((decision) => (
                      <tr key={decision.id}>
                        <td>
                          {decision.recordedAt
                            ? new Date(decision.recordedAt).toLocaleString()
                            : "-"}
                        </td>
                        <td>
                          <strong>{decision.propertyName}</strong>
                          <small>
                            {decision.effectiveDate} · {decision.district}
                          </small>
                        </td>
                        <td>
                          <span className="history-factor">
                            S {multiplier(decision.seasonalMultiplier)}
                          </span>
                          <span className="history-factor">
                            D {multiplier(decision.demandMultiplier)}
                          </span>
                          <span className="history-factor">
                            E {multiplier(decision.eventMultiplier)}
                          </span>
                        </td>
                        <td>{amount(decision.unconstrainedRate)}</td>
                        <td>
                          <strong>{amount(decision.finalRate)}</strong>
                        </td>
                        <td>
                          <span
                            className={`history-guard ${decision.rateLimitAction.toLowerCase()}`}
                          >
                            {decision.rateLimitAction}
                          </span>
                        </td>
                        <td>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => inspectDecision(decision)}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="engine-empty">
                No decisions logged yet. A quote will create the first trace.
              </p>
            )}
          </section>
          <p className="engine-footnote">
            Engine data is seeded for demonstration. Decision history records each calculated cache
            refresh; replace sample factors and events with approved market data before operational
            use.
          </p>
        </>
      ) : (
        <div className="engine-empty-state">
          <Gauge size={34} />
          <h2>{connection === "offline" ? "Engine unavailable" : "Waiting for a pricing quote"}</h2>
          <p>
            {connection === "offline"
              ? "Reconnect the engine to load live pricing inputs and recent decisions."
              : "Choose a property and valid dates to load the calculation trace."}
          </p>
        </div>
      )}
    </main>
  );
}
