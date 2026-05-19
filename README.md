# DesaConnect

A prototype GIS (Geographic Information System) platform for tourism villages (desa wisata) in Sleman Regency (Kabupaten Sleman), Yogyakarta, Indonesia. Built as a front-end demo for Assignment 3 of the ICT for the Global South course at Vrije Universiteit Amsterdam.

## What it does

DesaConnect is designed as a progressive web app that puts interactive maps at the center of rural tourism management. The prototype has four role-based views, each showing how a different stakeholder would interact with the system:

**Visitor (Pengunjung)**  
Browse a map of 30 tourism villages, filter by season status (musim panen), available activities, wheelchair access, or visible farmer plots, and tap a village marker to see photos, activities with prices, reviews, and a direct WhatsApp contact link. Public farm plots can also be toggled on the map and opened for harvest details.

**Pokdarwis (Tourism Awareness Group / Kelompok Sadar Wisata)**  
Pokdarwis are the community members who run daily tourism operations in each village. This view lets them select their village on a map or from a dropdown, edit the village name and GPS location (drag the marker or pick another village on the map), toggle harvest season and wheelchair access, add or remove activity listings with bilingual names and prices, and manage photo uploads. An offline toggle simulates what happens when Pokdarwis members on the upper slopes of Mount Merapi have no signal: changes are queued locally and synced when connectivity returns.

**Farmer (Petani)**  
Smallholder farmers can register their field boundaries on the map by clicking to add polygon points and dragging to adjust them with a live polygon preview. They select a crop or commodity (komoditas) such as salak (snakefruit), cabai (chili), padi (rice), or jagung (corn), set the harvest window by month, and choose whether the plot is visible to visitors at reduced resolution (privacy by design) or kept fully private. Saved public plots appear immediately in the Visitor map view.

**Officer (Dinas / BAPPEDA)**  
The governance dashboard shows aggregated statistics, a bar chart of visitor clicks per village, review summary metrics, CSV export actions, and a full audit log (log audit) of all actions across the platform. This view represents what officers at the Regional Tourism Office (Dinas Pariwisata), Regional Agriculture Office (Dinas Pertanian), and Regional Planning Agency (BAPPEDA) would see.

## Language support

The entire interface toggles between Bahasa Indonesia and English. In English mode, Indonesian terms are shown in parentheses on first use (for example "Tourism Awareness Group (Kelompok Sadar Wisata)") so that non-Indonesian readers can follow along.

## Tech stack

- Vite + React 19 + TypeScript
- Leaflet via react-leaflet for all interactive maps
- OpenStreetMap tiles (no API key needed)
- Plain CSS with CSS custom properties (no framework)
- PWA manifest for standalone mobile install
- All data is mock/hardcoded, no backend

## Project structure

```
src/
  App.tsx                          App shell with header, role switcher, language toggle
  main.tsx                         Entry point
  index.css                        All styles
  components/
    LangProvider.tsx               React context for i18n language state
    ResponsiveImage.tsx            Image loader with SVG fallback
    VillagesProvider.tsx           Shared in-session village + audit state
    PlotsProvider.tsx              Shared in-session farmer plot state
  data/
    i18n.ts                        Translation keys (Bahasa Indonesia + English)
    mockData.ts                    30 villages, reviews, farmer plots, audit log
  views/
    VisitorMapView.tsx             Visitor map with markers, farm plots, reviews
    PokdarwisEditor.tsx            Village editor and new-village registration
    FarmerPlotRegistration.tsx     Farmer polygon drawing and shared plot save flow
    GovernanceDashboard.tsx        Stats, bar chart, audit table, CSV export
public/
  logo.jpg                         App logo
  favicon.svg                      Browser tab icon
  manifest.webmanifest             PWA manifest
```

## Getting started

Requires Node.js 18 or later.

```bash
npm install
npm run dev
```

Open http://localhost:5173 in a browser.

To build for production:

```bash
npm run build
npm run preview
```

## Design choices

**Colors:** Green (#4A7C2E) for the brand and nature theme, gold (#C68C28) for the header bar and accent elements, cream (#F8F3E8) for the background.

**Mobile first:** The layout is designed for phone screens first. The visitor detail panel slides up from the bottom on mobile and appears as a side panel on wider screens.

**Offline simulation:** Both the Pokdarwis and Farmer views include an offline toggle. This simulates the real condition in mountainous areas around Merapi where cellular signal is unreliable. In a production version, this would use a Service Worker with IndexedDB for actual offline persistence.

**Privacy:** Farmer field boundaries are shown to visitors at reduced resolution only if the farmer opts in. Precise boundaries stay private. This addresses the NFR (non-functional requirement) for data privacy in the assignment.

## Group

Group 18, ICT for the Global South, Vrije Universiteit Amsterdam.
