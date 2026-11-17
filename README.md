# Markham Home Dynamics

I need to create a frontend for a platfrom which is about a smart hosuing platform with a dynamic pricing engine. The system is basically a version of AirBNB which enforces a dynamic pricing model on users and landlords.

I just want you to develop the frontend placeholder and I'll add the rets of the features. The frontend must have the following.

-Home page
-Listings page
-Settings page
-Insights page

The home page includes:
- suggested listings
- suggested insights
- A random fact about accomodation

The listings page should include
- A search bar for filtering
- Available listings
- Upcoming Lisitings
- Lisiting by Botswana Districts which is: Central, Chobe, Francistown, Gaborone, Ghanzi, Jwaneng, Kgalagadi, Kgatleng, Kweneng, Lobatse, North-East, North-West, Orapa, Selebi-Phikwe, Sowa, South-East, and Southern.

Settings page should be a generic thing so you may do it

Insights page is basically a way for getting users to find their ideal listing so my asking questions the system should be able to give users their ideal setting. Have a placeholder for this too as I will add it when I add the dynamic engine. The page should also give data like areas with most traffic, safety, ammenities, etc

Use a visually stunning ui and google fonts

The name of the app is called MarKHaM

I have uploaded two logos for light mode and dark mode

## Dynamic engine

The Java 21 / Spring Boot API and MySQL schema live in [`engine/`](engine/README.md), alongside the frontend in this repository. Start the engine with Docker Compose from that directory, then set `VITE_ENGINE_API_URL` in the frontend environment (see [`.env.example`](.env.example)). The listings screen will use live property and current nightly-price data when the API is available, and clearly labelled illustrative listings when it is not.

The seed listings, pricing events, and area analytics are demonstration data only. Review the engine's API, security boundary, and ERD in [`engine/README.md`](engine/README.md) before deployment.

**Live app**: https://project-mmb.github.io/markham-home-dynamics/

## Deploy to GitHub Pages

Pushes to `main` build and publish the static frontend through GitHub Actions. In the repository settings, set **Pages > Build and deployment > Source** to **GitHub Actions**. The frontend is served from `/markham-home-dynamics/`; the dynamic engine must be hosted separately and configured with `VITE_ENGINE_API_URL`.

## Development

Prefer working locally? You need Bun and Node.js.

```sh
git clone <this-repository-url>
cd <repository-name>
bun install
bun run dev
```
