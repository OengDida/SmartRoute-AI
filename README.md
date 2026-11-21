# SmartRoute AI — Cambodia Trip Planner

**Plan smarter inter-provincial journeys across Cambodia.**

SmartRoute AI is a browser-based trip-planning application that combines road-route estimates, vehicle range calculations, fuel and EV charging station discovery, and trip-cost comparisons in Cambodian riel (KHR) and US dollars (USD).

- **Live Demo:** https://smartroute-dev.vercel.app
- **GitHub:** https://github.com/OengDida/SmartRoute-AI

> **Important:** The AI Co-Pilot currently uses rule-based recommendations. This application is a planning aid, not a live navigation service. Always verify routes, station details, and prices before traveling.

## ✨ Features

### 🗺️ Route Planning
- Select an origin and destination from supported Cambodian provinces and cities.
- Use your current browser location to set your starting point.
- Click directly on the map to place custom origin and destination pins.
- Calculate estimated driving distance and travel time using OSRM.
- Fall back to approximate distance calculations when routing services are unavailable.

### 🚗 Vehicle Profiles & Range Estimation
- Support five vehicle categories:
  - Electric Vehicles (EVs)
  - Hybrid Vehicles
  - Gasoline Vehicles
  - Diesel Vehicles
  - Motorcycles
- Choose from predefined vehicle profiles.
- Configure custom or modified vehicles.
- Set fuel or battery capacity and current energy level.
- Calculate estimated remaining driving range.
- Receive warnings when the destination exceeds the vehicle's estimated range.

### ⚡ Fuel & Charging Station Finder
- Discover EV charging stations and fuel stations.
- Filter stations by:
  - All Stations
  - EV Chargers
  - Gas Pumps
  - Hybrid Hubs
- View station information, brands, operating hours, roads, and connectors where available.
- Identify suggested stops along the selected route.
- Generate a basic pit-stop itinerary.

### 💰 Trip Cost Calculator
- Estimate fuel or electricity consumption.
- Calculate estimated total trip expenses.
- Compare EV charging costs with gasoline costs.
- Display costs in Cambodian riel (KHR) and US dollars (USD).
- Customize fuel prices, EV charging tariffs, and exchange rates.

### 🤖 SmartRoute AI Co-Pilot
- Provides vehicle-range recommendations.
- Identifies potential range-related risks.
- Suggests compatible stops along the route.
- Provides EV versus gasoline cost comparisons.
- Offers basic eco-driving tips.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React 18 | Frontend framework |
| Vite 6 | Development and build tool |
| Tailwind CSS 3 | Styling |
| Google Maps Platform | Interactive maps and Google Places search |
| OSRM | Road routing and travel-time estimates |
| Lucide React | Icons |
| JavaScript | Application logic |

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js (recommended: current LTS version)
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/OengDida/SmartRoute-AI.git
```

### 2. Navigate to the project directory

```bash
cd SmartRoute-AI
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal to access SmartRoute AI.

### Configure Google Maps

The map and origin/destination search use Google Maps Platform. In Google Cloud, enable Maps JavaScript API and Places API (New), set up billing, and create an API key restricted to HTTP referrers (`http://localhost:5173/*`) and only those two APIs. Add a `.env.local` file in the project root:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Restart `npm run dev` after adding or changing the key. Vite exposes the browser key in the page, so restrict it by referrer and API, and set a billing budget/alerts in Google Cloud. Google Maps Platform requires billing; current free usage caps and rates vary by service, so review [Google's pricing](https://developers.google.com/maps/billing-and-pricing/pricing). OSRM still supplies route lines and ETAs. Search results come from Google Places; station pins in the planner still include the app's bundled reference data and are not live availability information.

In Station finder, use **Find gas stations along this route** to search Google Places near sampled points along the selected route. Each search area returns a limited set of results, so verify station details and status in Google Maps.

### 5. Build for production

```bash
npm run build
```

### 6. Preview the production build

```bash
npm run preview
```

## 📂 Project Structure

```text
SmartRoute-AI/
│
├── public/
│   ├── favicon.svg
│   └── sitemap.xml
│
├── src/
│   ├── components/
│   │   └── MapView.jsx
│   │
│   ├── data/
│   │   ├── places.js
│   │   ├── rates.js
│   │   └── vehicles.js
│   │
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   └── utils.js
│
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 📊 Default Reference Rates

The application includes editable reference rates:

| Item | Default Rate |
|---|---:|
| Regular Gasoline | 4,350 KHR/L |
| Diesel | 5,300 KHR/L |
| EV DC Fast Charging | 1,350 KHR/kWh |
| USD to KHR | 4,050 KHR/USD |

These are reference values, not live price feeds. Users can edit them in the application.

## 🌐 Data Sources & APIs

SmartRoute AI uses the following external services and datasets:

- [Google Maps Platform](https://developers.google.com/maps/documentation/javascript) — Interactive maps and place search.
- [OSRM](https://project-osrm.org/) — Road routing and travel-time estimates.
- [EVizee Cambodia](https://evizee.co/maps/) — Public EV charging station references.
- [Open Development Cambodia](https://data.opendevelopmentcambodia.net/) — Public datasets.
- [Electricity Authority of Cambodia](https://www.eac.gov.kh/) — Electricity and EV charging tariff references.

## ⚠️ Limitations

Please note:

- Station locations and details may not reflect current operating conditions.
- Fuel and electricity prices are editable reference values, not live prices.
- Vehicle range calculations are estimates.
- Traffic conditions and road closures are not incorporated.
- OSRM availability and response times depend on the public service.
- The AI Co-Pilot is currently rule-based rather than powered by a generative AI model.
- The application does not provide turn-by-turn navigation.

Always verify station availability, fuel prices, charging compatibility, and road conditions before traveling.

## 🔮 Future Improvements

Potential future development directions:

- Integration with live traffic information.
- Real-time EV charging station availability.
- AI-powered route optimization.
- More accurate vehicle energy-consumption models.
- User accounts and saved journeys.
- Multi-stop route planning.
- Live fuel-price integration.
- Mobile application support.
- Offline map support.

## 🤝 Contributing

Contributions are welcome!

1. Fork this repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

3. Commit your changes:

   ```bash
   git commit -m "Add: your feature"
   ```

4. Push your branch:

   ```bash
   git push origin feature/your-feature
   ```

5. Open a Pull Request.

## 📄 License

No license is currently specified in this repository. All rights are reserved by default unless the project owner adds an explicit license.

---

**SmartRoute AI**

*Every kilometer. Smarter.*

Built to make Cambodia's journeys more efficient, affordable, and sustainable.
