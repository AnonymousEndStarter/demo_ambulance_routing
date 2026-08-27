// components/LeafletMap.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import L from 'leaflet';

export interface LocationNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'HOSPITAL' | 'AMBULANCE' | 'PATIENT';
  isCritical?: boolean;
}

export interface TrafficZone {
  id: string;
  name: string;
  center: [number, number];
  radius: number;
  severity: 'Low' | 'Moderate' | 'High' | 'Blockade';
}

export interface TrafficSignalNode {
  id: string;
  lat: number;
  lng: number;
  isGreenWave: boolean;
}

export interface RouteData {
  id: string;
  ambId: string;
  pickupCoords: [number, number][];
  hospitalCoords: [number, number][];
  color: string;
}

interface LeafletMapProps {
  center?: [number, number];
  hospitals?: LocationNode[];
  ambulances?: LocationNode[];
  patients?: LocationNode[];
  trafficZones?: TrafficZone[];
  trafficSignals?: TrafficSignalNode[];
  routes?: RouteData[];
  tspDronePath?: [number, number][];
  isSimulating?: boolean;
}

// Leaflet does not detect container size changes caused by CSS/layout
// (responsive breakpoints, the map-size toggle, orientation changes) on its
// own — it only knows the size it was born with. Without this, the map
// renders half-grey or mis-clicks after any resize, which is the #1 cause
// of "map broken on mobile."
function MapResizeController({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    map.setView(center, 13);
  }, [center, map]);

  useEffect(() => {
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    const container = map.getContainer();
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(container);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      observer?.disconnect();
    };
  }, [map]);

  return null;
}

const createGlossyPin = (
  colorHex: string,
  badgeText: string,
  iconSvg: string,
  pulse = false
) => {
  const gradId = `grad-${colorHex.replace('#', '')}`;
  return L.divIcon({
    className: 'custom-glossy-pin',
    html: `
      <div class="relative flex flex-col items-center justify-center ${pulse ? 'animate-bounce' : ''}">
        <svg width="40" height="52" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg" class="filter drop-shadow-lg">
          <defs>
            <radialGradient id="${gradId}" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8"/>
              <stop offset="40%" stop-color="${colorHex}"/>
              <stop offset="100%" stop-color="${colorHex}" stop-opacity="0.95"/>
            </radialGradient>
          </defs>
          <path d="M12 0C5.37 0 0 5.37 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.37 18.63 0 12 0z" fill="url(#${gradId})" />
          <circle cx="12" cy="11.5" r="7" fill="#090d16" />
          <g transform="translate(7.5, 7)">
            ${iconSvg}
          </g>
        </svg>
        ${badgeText ? `<span class="absolute -bottom-1 bg-slate-950 border border-slate-700 text-slate-200 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold tracking-tighter">${badgeText}</span>` : ''}
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 52],
  });
};

const patientTextSvg = (id: string, color: string) => `
  <text x="4.5" y="6.5" font-size="6" font-family="monospace" font-weight="900" text-anchor="middle" fill="${color}">${id}</text>
`;
const hospitalSvg = `<path d="M2 4h5v2h-5z M4 2h1v7h-1z" fill="#10b981" />`;
const ambulanceSvg = `<path d="M1 3h5v3h-5z M6 4.5h2v1.5h-2z" fill="#3b82f6" /><circle cx="2.5" cy="6.5" r="1" fill="#ffffff" /><circle cx="6.5" cy="6.5" r="1" fill="#ffffff" />`;
const droneSvg = `<path d="M1 1h2v2h-2z M6 1h2v2h-2z M1 6h2v2h-2z M6 6h2v2h-2z" fill="#06b6d4" /><path d="M2 2l5 5 M2 7l5-5" stroke="#06b6d4" stroke-width="0.8" /><circle cx="4.5" cy="4.5" r="1.5" fill="#ef4444" />`;

function AnimatedVehicle({
  startPos,
  path,
  isSimulating,
  label,
  icon,
  speedMs,
}: {
  startPos: [number, number];
  path?: [number, number][];
  isSimulating: boolean;
  label: string;
  icon: L.DivIcon;
  speedMs: number;
}) {
  const [currentPos, setCurrentPos] = useState<[number, number]>(startPos);

  useEffect(() => {
    if (!isSimulating || !path || path.length < 2) {
      setCurrentPos(startPos);
      return;
    }

    let frame = 0;
    const interval = setInterval(() => {
      if (frame < path.length) {
        setCurrentPos(path[frame]);
        frame++;
      } else {
        clearInterval(interval);
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [isSimulating, path, startPos, speedMs]);

  return (
    <Marker position={currentPos} icon={icon}>
      <Popup className="custom-popup">
        <span className="font-mono text-xs font-bold">{label}</span>
      </Popup>
    </Marker>
  );
}

export default function LeafletMap({
  center = [28.6139, 77.2090],
  hospitals = [],
  ambulances = [],
  patients = [],
  trafficZones = [],
  trafficSignals = [],
  routes = [],
  tspDronePath = [],
  isSimulating = false,
}: LeafletMapProps) {
  return (
    <div className="w-full h-full min-h-0 bg-slate-950 relative overflow-hidden">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}
        attributionControl={false}
      >
        <MapResizeController center={center} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {(trafficZones || []).map((zone) => {
          const isBlockade = zone.severity === 'Blockade';
          return (
            <Circle
              key={zone.id}
              center={zone.center}
              radius={zone.radius}
              pathOptions={{
                color: isBlockade ? '#ef4444' : '#f59e0b',
                fillColor: isBlockade ? '#dc2626' : '#d97706',
                fillOpacity: isBlockade ? 0.45 : 0.2,
                dashArray: isBlockade ? '6, 6' : '3, 3',
              }}
            >
              <Popup>
                <div className="font-mono text-xs">
                  <div className="font-bold">{zone.name}</div>
                  <div className="text-red-500 font-semibold">Severity: {zone.severity}</div>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {(trafficSignals || []).map((sig) => (
          <Marker
            key={sig.id}
            position={[sig.lat, sig.lng]}
            icon={L.divIcon({
              className: 'custom-signal-node',
              html: `
                <div class="flex items-center gap-1.5 bg-slate-900 border ${sig.isGreenWave ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'border-red-500'} px-2 py-0.5 rounded-full shadow-lg">
                  <div class="w-2.5 h-2.5 rounded-full ${sig.isGreenWave ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}"></div>
                  <span class="text-[8px] font-mono font-bold tracking-widest text-slate-100">${sig.isGreenWave ? 'GREEN WAVE' : 'STOP'}</span>
                </div>
              `,
              iconSize: [95, 20],
              iconAnchor: [47, 10],
            })}
          />
        ))}

        {(hospitals || []).map((h) => (
          <Marker key={h.id} position={[h.lat, h.lng]} icon={createGlossyPin('#10b981', 'HOSPITAL', hospitalSvg)} />
        ))}

        {(patients || []).map((p) => {
          const color = p.isCritical ? '#ef4444' : '#f59e0b';
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={createGlossyPin(color, p.isCritical ? 'CRITICAL' : 'STANDARD', patientTextSvg(p.id, color), p.isCritical)}
            >
              <Popup>
                <div className="font-mono text-xs">
                  <strong className="block border-b border-slate-700 pb-1">{p.name}</strong>
                  <span>Triage: {p.isCritical ? 'High Priority' : 'Standard Priority'}</span>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {(ambulances || []).map((a) => {
          const route = routes.find((r) => r.ambId === a.id);
          const fullPath = route ? [...route.pickupCoords, ...route.hospitalCoords] : undefined;
          return (
            <AnimatedVehicle
              key={a.id}
              startPos={[a.lat, a.lng]}
              path={fullPath}
              isSimulating={isSimulating}
              speedMs={110}
              label={a.name}
              icon={createGlossyPin('#3b82f6', a.id, ambulanceSvg)}
            />
          );
        })}

        {tspDronePath && tspDronePath.length > 0 && (
          <AnimatedVehicle
            startPos={tspDronePath[0]}
            path={tspDronePath}
            isSimulating={isSimulating}
            speedMs={140}
            label="Single TSP Emergency Drone"
            icon={createGlossyPin('#06b6d4', 'DRONE', droneSvg)}
          />
        )}

        {(routes || []).map((r) => (
          <React.Fragment key={r.id}>
            <Polyline positions={r.pickupCoords} color={r.color} weight={4} opacity={0.85} />
            <Polyline positions={r.hospitalCoords} color="#10b981" weight={4} dashArray="6, 6" opacity={0.9} />
          </React.Fragment>
        ))}

        {tspDronePath && tspDronePath.length > 0 && (
          <Polyline positions={tspDronePath} color="#06b6d4" weight={3} dashArray="5, 5" opacity={0.95} />
        )}
      </MapContainer>
    </div>
  );
}