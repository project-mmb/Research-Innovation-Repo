import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Lightbulb,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/markham/listing-card";
import { SectionHeading } from "@/components/markham/shell";
import { fetchListings } from "@/lib/markham-api";
import {
  apartment,
  districts,
  listings,
  lodge,
  pageHead,
  type Listing,
  villa,
} from "@/lib/markham-data";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Find a place that feels like you",
      "Discover thoughtfully selected stays across Botswana, local insights and smarter housing with MarKHaM.",
    ),
  component: HomePage,
});

const facts = [
  "Traditional Botswana homesteads are often arranged around a shared courtyard called a lolwapa.",
  "The Okavango Delta is an inland delta: its waters spread into the Kalahari rather than reaching the sea.",
  "Thatched roofs can help keep a home cool by providing natural insulation.",
];

function HomePage() {
  const [district, setDistrict] = useState("");
  const [fact, setFact] = useState(0);
  const [engineListings, setEngineListings] = useState<Listing[] | null>(null);
  const [engineConnected, setEngineConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    fetchListings()
      .then((data) => {
        if (active) {
          setEngineListings(data);
          setEngineConnected(true);
        }
      })
      .catch(() => {
        if (active) {
          setEngineListings(null);
          setEngineConnected(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const availableListings = (engineListings ?? listings)
    .filter((listing) => listing.status === "Available")
    .slice(0, 3);

  return (
    <main className="page home-page">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">A PLACE FOR EVERY CHAPTER</p>
          <h1>
            Somewhere you’ll feel at home<span className="brand-dot">.</span>
          </h1>
        </div>
        <span className="welcome-note">
          <Sparkles size={15} />A smarter way to stay
        </span>
      </div>
      <section className="home-hero">
        <img
          src={villa}
          alt="Sunlit villa with a swimming pool and an open-air terrace"
          width={1536}
          height={1024}
          fetchPriority="high"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="hero-eyebrow">
            <span />
            LOCALLY ROOTED. MADE FOR YOU.
          </span>
          <h2>
            New places.
            <br />
            Your kind of space.
          </h2>
          <p>
            From city living to quiet escapes.
            <br />
            Find your next stay, at a smarter price.
          </p>
          <Button variant="hero" asChild>
            <Link to="/listings">
              Find your place <ArrowUpRight size={18} />
            </Link>
          </Button>
        </div>
        <div className="hero-caption">
          <MapPin size={15} />
          <div>
            <strong>The Acacia Residence</strong>
            <span>Phakalane, Gaborone</span>
          </div>
          <span className="hero-caption-price">
            Featured stay <small>in Botswana</small>
          </span>
        </div>
      </section>
      <form
        className="home-search"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ to: "/listings", search: { district } });
        }}
      >
        <div className="search-destination">
          <MapPin size={22} />
          <label>
            <span>Where feels like home?</span>
            <select
              aria-label="Destination district"
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
            >
              <option value="">Explore all of Botswana</option>
              {districts.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="search-prompt">
          <Sparkles size={19} />
          <div>
            <strong>A stay that fits you</strong>
            <span>City stays, nature escapes & everything between</span>
          </div>
        </div>
        <Button type="submit" size="lg">
          <Search size={18} />
          Explore stays
        </Button>
      </form>
      <section className="content-section">
        <SectionHeading
          title="A few places you’ll love"
          description="Good spaces. Great locations. Selected for your next stay."
          to="/listings"
          link="All listings"
        />
        <div className="listing-grid">
          {availableListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
        <p className="sample-caption">
          {engineConnected
            ? "Live listings and current per-night engine estimates."
            : "Illustrative sample stays while the engine is unavailable."}
        </p>
      </section>
      <section className="content-section discovery-section">
        <SectionHeading
          eyebrow="FIND YOUR KIND OF BOTSWANA"
          title="A different pace. A new place."
          to="/listings"
          link="Explore districts"
        />
        <div className="destination-grid">
          {[
            {
              name: "The city is calling",
              sub: "Gaborone",
              district: "Gaborone",
              image: apartment,
            },
            { name: "Closer to the wild", sub: "North-West", district: "North-West", image: lodge },
            { name: "Space to slow down", sub: "Central", district: "Central", image: villa },
          ].map((destination) => (
            <Link
              key={destination.district}
              to="/listings"
              search={{ district: destination.district }}
              className="destination-tile"
            >
              <img
                src={destination.image}
                alt={destination.name}
                loading="lazy"
                width={1024}
                height={768}
              />
              <div className="destination-shade" />
              <div>
                <span>{destination.sub}</span>
                <h3>{destination.name}</h3>
              </div>
              <ArrowUpRight size={22} />
            </Link>
          ))}
        </div>
      </section>
      <section className="content-section">
        <SectionHeading
          title="A little insight goes a long way"
          description="Get to know a place before you call it home."
          to="/insights"
          link="All insights"
        />
        <div className="insight-preview-grid">
          <Link to="/insights" className="insight-preview">
            <span className="insight-icon mint">
              <TrendingUp size={24} />
            </span>
            <p className="eyebrow">NEIGHBOURHOOD PULSE</p>
            <h3>Where life is happening</h3>
            <p>Explore activity, connections and the places people gravitate to.</p>
            <span className="insight-link">
              Explore local trends <ArrowRight size={16} />
            </span>
          </Link>
          <Link to="/insights" className="insight-preview">
            <span className="insight-icon peach">
              <ShieldCheck size={24} />
            </span>
            <p className="eyebrow">FEEL AT HOME</p>
            <h3>The details that matter</h3>
            <p>Look beyond the address. Compare amenities and everyday convenience.</p>
            <span className="insight-link">
              Know your neighbourhood <ArrowRight size={16} />
            </span>
          </Link>
          <Link to="/insights" className="insight-preview personalised">
            <span className="insight-icon">
              <Sparkles size={24} />
            </span>
            <p className="eyebrow">PERSONAL TO YOU</p>
            <h3>Your place is out there</h3>
            <p>A few questions. A clearer picture of what your ideal stay looks like.</p>
            <span className="insight-link">
              Find my fit <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </section>
      <section className="fact-band">
        <span className="fact-icon">
          <Lightbulb size={26} />
        </span>
        <div>
          <p className="eyebrow">A LITTLE SOMETHING TO KNOW</p>
          <p>{facts[fact]}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setFact((fact + 1) % facts.length)}
          aria-label="Another accommodation fact"
        >
          <ArrowRight />
        </Button>
      </section>
    </main>
  );
}
