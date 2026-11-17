import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Coffee,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/markham/shell";
import { ListingCard } from "@/components/markham/listing-card";
import { fetchAreaAnalytics, type AreaAnalytics } from "@/lib/markham-api";
import { listings, villa, pageHead } from "@/lib/markham-data";

export const Route = createFileRoute("/insights")({
  head: () =>
    pageHead(
      "Find your fit",
      "Explore neighbourhood insights and discover your ideal Botswana stay with a personalised preference questionnaire.",
    ),
  component: InsightsPage,
});

const questions = [
  {
    title: "What brings you here?",
    subtitle: "Let’s start with the kind of chapter you’re planning.",
    options: ["A little getaway", "Work & business", "A longer stay", "A new beginning"],
  },
  {
    title: "What’s your kind of setting?",
    subtitle: "Picture the place you would love to wake up in.",
    options: ["City & convenience", "Nature & quiet", "A bit of both", "Surprise me"],
  },
  {
    title: "What’s your nightly budget?",
    subtitle: "A comfortable price is part of feeling at home.",
    options: ["Under P 700", "P 700–1,300", "P 1,300–2,000", "Flexible"],
  },
  {
    title: "What matters most?",
    subtitle: "Choose the one thing your stay shouldn’t be without.",
    options: ["Wi-Fi & workspace", "Peace & privacy", "Nearby amenities", "Space for everyone"],
  },
];

const metrics = {
  ACTIVITY: { label: "Activity", scoreLabel: "Area activity", icon: TrendingUp },
  SAFETY: { label: "Safety", scoreLabel: "Safety index", icon: ShieldCheck },
  AMENITIES: { label: "Amenities", scoreLabel: "Amenity access", icon: Coffee },
} satisfies Record<
  AreaAnalytics["metric"],
  { label: string; scoreLabel: string; icon: typeof TrendingUp }
>;

const areaPresentation: Record<string, { tag: string; text: string; image: string }> = {
  Gaborone: {
    tag: "City living",
    text: "Cafés, shopping and business connections",
    image: listings[1].image,
  },
  "North-West": {
    tag: "Nature escapes",
    text: "Open spaces and a slower pace",
    image: listings[2].image,
  },
  Central: {
    tag: "Everyday balance",
    text: "Room to settle into a local rhythm",
    image: listings[0].image,
  },
};

const sampleScores: Record<
  AreaAnalytics["metric"],
  Array<{ district: string; score: number; summary: string }>
> = {
  ACTIVITY: [
    { district: "Gaborone", score: 82, summary: "Illustrative visitor activity index" },
    { district: "North-West", score: 76, summary: "Illustrative visitor activity index" },
    { district: "Central", score: 79, summary: "Illustrative visitor activity index" },
  ],
  SAFETY: [
    {
      district: "Gaborone",
      score: 84,
      summary: "Illustrative neighbourhood index; not verified safety data",
    },
    {
      district: "North-West",
      score: 78,
      summary: "Illustrative neighbourhood index; not verified safety data",
    },
    {
      district: "Central",
      score: 80,
      summary: "Illustrative neighbourhood index; not verified safety data",
    },
  ],
  AMENITIES: [
    { district: "Gaborone", score: 94, summary: "Illustrative local amenities index" },
    { district: "North-West", score: 68, summary: "Illustrative local amenities index" },
    { district: "Central", score: 75, summary: "Illustrative local amenities index" },
  ],
};

function InsightsPage() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [metric, setMetric] = useState<AreaAnalytics["metric"]>("ACTIVITY");
  const [analytics, setAnalytics] = useState<AreaAnalytics | null>(null);
  const [analyticsState, setAnalyticsState] = useState<"loading" | "live" | "offline">("loading");
  const answer = answers[step];
  const result =
    answers[1] === "Nature & quiet"
      ? listings[2]
      : answers[2] === "Under P 700"
        ? listings[1]
        : listings[0];
  const metricDetails = metrics[metric];

  useEffect(() => {
    let active = true;
    setAnalyticsState("loading");
    fetchAreaAnalytics(metric)
      .then((data) => {
        if (!active) return;
        setAnalytics(data);
        setAnalyticsState("live");
      })
      .catch(() => {
        if (!active) return;
        setAnalytics(null);
        setAnalyticsState("offline");
      });
    return () => {
      active = false;
    };
  }, [metric]);

  const areaScores = (analytics?.areas ?? sampleScores[metric]).map((area) => ({
    ...area,
    score: Math.round(Number(area.score)),
    ...areaPresentation[area.district],
  }));

  return (
    <main className="page">
      <div className="page-intro">
        <p className="eyebrow">A LITTLE CLARITY. A BETTER STAY.</p>
        <h1>
          More than a place. Your place<span className="brand-dot">.</span>
        </h1>
        <p>Get a feel for the neighbourhood, and find what feels right for you.</p>
      </div>
      <section className="match-section">
        <div className="match-photo">
          <img
            src={villa}
            width={1536}
            height={1024}
            alt="Quiet poolside home surrounded by trees"
          />
          <div>
            <Sparkles size={24} />
            <h2>
              A place that
              <br />
              gets you.
            </h2>
          </div>
        </div>
        <div className="match-content">
          {!started ? (
            <>
              <p className="eyebrow">
                <Sparkles size={15} />
                THE PERSONAL TOUCH
              </p>
              <h2>Let’s find your fit.</h2>
              <p>Not everyone is looking for the same thing. Tell us a little about yours.</p>
              <div className="match-highlights">
                <span>
                  <Check size={16} />
                  Your pace
                </span>
                <span>
                  <Check size={16} />
                  Your budget
                </span>
                <span>
                  <Check size={16} />
                  Your priorities
                </span>
              </div>
              <Button size="lg" onClick={() => setStarted(true)}>
                Find my fit
                <ArrowRight />
              </Button>
              <span className="demo-note">4 quick questions · Recommendation preview</span>
            </>
          ) : done ? (
            <>
              <p className="eyebrow">YOUR STAY PROFILE</p>
              <h2>
                {answers[1] === "Nature & quiet"
                  ? "The quiet explorer."
                  : "The thoughtful traveller."}
              </h2>
              <p>{answers.join(" · ")}</p>
              <p className="recommendation-text">
                A little inspiration for your next chapter: <strong>{result.name}</strong>.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setDone(false);
                  setStep(0);
                  setAnswers([]);
                }}
              >
                <RotateCcw />
                Start again
              </Button>
              <span className="demo-note">
                Illustrative match only. Personalised recommendations are not connected.
              </span>
            </>
          ) : (
            <>
              <div className="question-progress">
                <span>YOUR IDEAL STAY</span>
                <span>{step + 1} / 4</span>
              </div>
              <div className="progress-track">
                <div className={`progress-fill progress-${step + 1}`} />
              </div>
              <h2>{questions[step].title}</h2>
              <p>{questions[step].subtitle}</p>
              <div className="question-options">
                {questions[step].options.map((option) => (
                  <Button
                    key={option}
                    variant={answer === option ? "secondary" : "outline"}
                    aria-pressed={answer === option}
                    onClick={() =>
                      setAnswers((previous) => {
                        const next = [...previous];
                        next[step] = option;
                        return next;
                      })
                    }
                  >
                    {option}
                    {answer === option && <Check size={15} />}
                  </Button>
                ))}
              </div>
              <div className="question-actions">
                <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
                  <ArrowLeft />
                  Back
                </Button>
                <Button
                  disabled={!answer}
                  onClick={() => (step === 3 ? setDone(true) : setStep(step + 1))}
                >
                  {step === 3 ? "See my fit" : "Continue"}
                  <ArrowRight />
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
      {done && (
        <section className="content-section">
          <SectionHeading
            title="A stay to start with"
            description="An example based on your preferences."
          />
          <div className="match-result">
            <ListingCard listing={result} />
          </div>
        </section>
      )}
      <section className="content-section">
        <SectionHeading
          title="Get to know the neighbourhood"
          description="A closer look at the things that shape everyday life."
        />
        <div className="insight-controls">
          <div className="metric-tabs">
            {(
              Object.entries(metrics) as Array<
                [AreaAnalytics["metric"], (typeof metrics)[AreaAnalytics["metric"]]]
              >
            ).map(([key, details]) => {
              const MetricIcon = details.icon;
              return (
                <Button
                  key={key}
                  variant={metric === key ? "secondary" : "ghost"}
                  onClick={() => setMetric(key)}
                >
                  <MetricIcon />
                  {details.label}
                </Button>
              );
            })}
          </div>
          <span className="data-badge">
            {analyticsState === "loading"
              ? "Loading area data"
              : analyticsState === "live" && !analytics?.illustrative
                ? "Live data"
                : "Illustrative data · Not verified"}
          </span>
        </div>
        <div className="area-grid">
          {areaScores.map((area) => {
            const presentation = areaPresentation[area.district] ?? {
              tag: "Botswana",
              text: area.summary,
              image: listings[0].image,
            };
            return (
              <article className="area-card" key={area.district}>
                <div className="area-photo">
                  <img
                    src={presentation.image}
                    alt={`${area.district} stay inspiration`}
                    loading="lazy"
                    width={1024}
                    height={768}
                  />
                  <span className="photo-tag">{presentation.tag}</span>
                </div>
                <div className="area-content">
                  <h3>
                    <MapPin size={16} />
                    {area.district}
                  </h3>
                  <p>{presentation.text}</p>
                  <div className="area-score">
                    <span>{metricDetails.scoreLabel}</span>
                    <strong>{area.score}/100</strong>
                  </div>
                  <div className="area-meter">
                    <span style={{ width: `${area.score}%` }} />
                  </div>
                  <Button variant="link" asChild>
                    <Link to="/listings" search={{ district: area.district }}>
                      Explore stays
                      <ArrowUpRight />
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
        <p className="sample-caption">
          {analyticsState === "live" && !analytics?.illustrative
            ? "Area indicators are supplied by the connected engine."
            : "Area indicators are illustrative examples, not verified market, safety, or amenity assessments."}
        </p>
      </section>
    </main>
  );
}
