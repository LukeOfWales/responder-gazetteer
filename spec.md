Below is a specification you could hand to an agentic coding assistant. I've aimed it specifically at a 4x4 Response Wales operational planning tool rather than a generic map application.

Responder Gazetteer
Overview

A web-based mapping and operational awareness tool for volunteer emergency responders in South East Wales.

The application will aggregate publicly available geographic information and present it on an interactive map, allowing responders to quickly locate critical infrastructure, emergency services, staging locations and operational support facilities.

Primary users:

4x4 Response Wales volunteers
Team coordinators
Incident controllers
Search and rescue support personnel

The application should be deployable as a static SPA hosted via GitHub Pages.

Goals

Provide a responder with answers to questions such as:

Where is the nearest hospital?
Which fire station covers this area?
What fuel stations are available overnight?
What are the nearest mountain rescue assets?
What facilities exist within 30 minutes of an incident location?
What route alternatives exist if a major road is blocked?
Architecture
Frontend

Technology:

React
TypeScript
Vite

Mapping:

Leaflet OR MapLibre GL
OpenStreetMap basemap

State:

Zustand

Styling:

TailwindCSS

Deployment:

GitHub Pages
GitHub Actions
Data Sources
OpenStreetMap

Primary source.

Use Overpass API to retrieve:

Hospitals

Tags:

amenity=hospital
Community Hospitals
amenity=hospital
healthcare=hospital
Fire Stations
amenity=fire_station
Police Stations
amenity=police
Fuel Stations
amenity=fuel
Ambulance Stations
emergency=ambulance_station
Rescue Stations
emergency=rescue_station
Mountain Rescue

Supplement OSM with manually maintained dataset:

[
  {
    "name": "Longtown MRT",
    "lat": "",
    "lon": "",
    "website": ""
  }
]

Reason:

Many MRT bases are poorly represented in OSM.

NHS Wales

Optional enrichment.

Store:

hospital name
emergency department
minor injuries unit
community hospital
Geographic Scope

Default coverage:

South East Wales

Bounding area:

Blaenau Gwent
Torfaen
Monmouthshire
Newport
Caerphilly
Merthyr Tydfil
Powys (southern)
Cardiff
Vale of Glamorgan

Allow extension later.

Core Features
Interactive Map

Display:

responder position
all selected assets
incident locations

Support:

clustering
filtering
route generation
Layer Controls

Toggle:

Hospitals
Community Hospitals
Fire Stations
Police Stations
Ambulance Stations
Mountain Rescue
Fuel Stations
Public Toilets
Defibrillators
Search & Rescue RV Points
Known Flood Risks
Known Snow Risks
Search

Search by:

postcode
village
town
coordinates
what3words
Distance Calculations

For any selected asset:

Show:

Straight-line distance
Estimated driving distance
Estimated driving time

Routing engine:

OSRM
GraphHopper
Operational View
Incident Mode

User drops pin.

System automatically calculates:

Nearest
Hospital
Fire Station
Police Station
Fuel Station
MRT Base
Within Radius

Configurable:

5 miles
10 miles
20 miles
50 miles
Resource Ring

Display operational circles:

15 minute drive
30 minute drive
60 minute drive

Isochrones generated through routing engine.

Responder Information Cards

Clicking a marker opens:

Name
Category
Address
Coordinates
Phone Number (if available)
Website
Opening Hours
Distance
Navigation Button
Offline Capability

Essential feature.

Use:

Service Workers
IndexedDB

Cache:

map tiles
gazetteer data

Support:

poor mobile signal
mountain areas
Data Refresh

Nightly GitHub Action.

Process:

Query Overpass API
Transform data
Generate static JSON
Commit to repository

Output:

data/hospitals.json
data/firestations.json
data/police.json
data/fuel.json

Frontend consumes static JSON only.

No live API dependency during incidents.

Advanced Features
Strategic Fuel Layer

Additional metadata:

{
  "open24hours": true,
  "hgv_access": true,
  "pay_at_pump": true
}

Manually curated.

Radio Communications Layer

Store:

amateur radio repeaters
PMR sites
APRS gateways

Display:

callsign
frequency
coverage notes

Useful if the user obtains a Foundation licence.

Search & Rescue Layer

Include:

Mountain Rescue RV points
Search sector access points
Forestry entrances
Helicopter landing sites
Weather Layer

Optional future enhancement.

Display:

Met Office rainfall radar
Flood alerts
Snow warnings
Data Model
interface Asset {
  id: string;
  name: string;
  category: AssetCategory;

  latitude: number;
  longitude: number;

  address?: string;
  postcode?: string;

  phone?: string;
  website?: string;

  openingHours?: string;

  source: string;

  tags: Record<string, string>;
}
Mobile Requirements

Optimised for:

iPhone
Android
rugged tablets

Requirements:

one-handed use
large touch targets
dark mode
low-light operation
Future Features
Team Tracking

Live responder locations.

APRS Integration

Display APRS stations on map.

SARSYS Integration

Incident import and display.

GPX Export

Export selected assets to:

Garmin
OS Maps
Gaia GPS
Printable Emergency Atlas

Generate PDF containing:

maps
asset lists
coordinates
contact information
Success Criteria

A responder attending a callout should be able to:

Open the application with limited connectivity.
Drop an incident marker.
Identify the nearest operationally relevant facilities within seconds.
Obtain navigation instructions.
Continue operating even if internet connectivity is lost.

That would give you something considerably more useful than a simple Google Maps clone: effectively a lightweight operational awareness platform tailored to how 4x4 Response Wales actually works.
