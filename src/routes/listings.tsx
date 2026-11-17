import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarClock, LayoutGrid, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/markham/listing-card";
import { fetchListings } from "@/lib/markham-api";
import { districts, listings, pageHead, type Listing } from "@/lib/markham-data";

export const Route = createFileRoute("/listings")({
  validateSearch: (search: Record<string, unknown>) => ({
    district: typeof search.district === "string" ? search.district : "",
  }),
  head: () =>
    pageHead(
      "Explore stays",
      "Browse available and upcoming homes, apartments and lodges across all Botswana districts.",
    ),
  component: ListingsPage,
});

function ListingsPage() {
  const search = Route.useSearch();
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState(search.district);
  const [tab, setTab] = useState<Listing["status"]>("Available");
  const [sort, setSort] = useState("recommended");
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");
  const [engineListings, setEngineListings] = useState<Listing[] | null>(null);
  const [engineState, setEngineState] = useState<"loading" | "live" | "offline">("loading");

  useEffect(() => {
    let active = true;
    setEngineState("loading");
    fetchListings(district)
      .then((data) => {
        if (!active) return;
        setEngineListings(data);
        setEngineState("live");
      })
      .catch(() => {
        if (!active) return;
        setEngineListings(null);
        setEngineState("offline");
      });
    return () => {
      active = false;
    };
  }, [district]);

  const sourceListings = engineListings ?? listings;
  let filtered = sourceListings.filter(
    (listing) =>
      listing.status === tab &&
      (!district || listing.district === district) &&
      `${listing.name} ${listing.area} ${listing.type}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!maxPrice || listing.price <= Number(maxPrice)),
  );
  if (sort === "low") filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === "high") filtered = [...filtered].sort((a, b) => b.price - a.price);

  const sourceLabel = engineState === "live" ? "Live engine data" : "Illustrative sample data";

  return (
    <main className="page">
      <div className="page-intro">
        <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
        <h1>
          Find your kind of place<span className="brand-dot">.</span>
        </h1>
        <p>City comforts, peaceful hideaways, and everything in between.</p>
      </div>
      <div className="filter-bar">
        <div className="search-input">
          <Search size={19} />
          <input
            aria-label="Search listings"
            placeholder="Search stays, locations or a little inspiration…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select
          aria-label="Filter by district"
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
        >
          <option value="">All districts</option>
          {districts.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <Button
          variant={showFilters ? "secondary" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal />
          Filters
        </Button>
      </div>
      {showFilters && (
        <div className="extra-filters">
          <label>
            Maximum price per night (P)
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="Any price"
            />
          </label>
          <Button variant="ghost" onClick={() => setMaxPrice("")}>
            Clear price filter
            <X />
          </Button>
        </div>
      )}
      <section className="district-section">
        <p className="eyebrow">EXPLORE BY DISTRICT</p>
        <div className="district-chips">
          <Button
            size="sm"
            variant={!district ? "default" : "outline"}
            onClick={() => setDistrict("")}
          >
            All Botswana
          </Button>
          {districts.map((name) => (
            <Button
              key={name}
              size="sm"
              variant={district === name ? "default" : "outline"}
              onClick={() => setDistrict(name)}
            >
              {name}
            </Button>
          ))}
        </div>
      </section>
      <div className="results-header">
        <div className="tabs">
          {(["Available", "Upcoming"] as const).map((status) => (
            <Button
              key={status}
              variant="ghost"
              className={tab === status ? "tab-active" : ""}
              onClick={() => setTab(status)}
            >
              {status === "Available" ? <LayoutGrid /> : <CalendarClock />}
              {status} listings
              <span>{sourceListings.filter((listing) => listing.status === status).length}</span>
            </Button>
          ))}
        </div>
        <select
          aria-label="Sort listings"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
        >
          <option value="recommended">Recommended</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
      </div>
      <p className="result-count" aria-live="polite">
        {filtered.length} {tab.toLowerCase()} {filtered.length === 1 ? "stay" : "stays"}
        {district ? ` in ${district}` : " across Botswana"}
        <span>{engineState === "loading" ? "Connecting to engine" : sourceLabel}</span>
      </p>
      {filtered.length ? (
        <div className="listing-grid">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <MapPin size={36} />
          <h2>No stays here just yet</h2>
          <p>Try another district or broaden your search.</p>
          <Button
            onClick={() => {
              setDistrict("");
              setQuery("");
              setMaxPrice("");
            }}
          >
            Explore all districts
          </Button>
        </div>
      )}
      <p className="sample-caption">
        {engineState === "live"
          ? "Live engine prices are per-night estimates for today. Request a date-specific quote before booking."
          : "Illustrative listings and prices are shown while the engine is unavailable."}
      </p>
    </main>
  );
}
