// app/page.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Activity,
  Truck,
  AlertTriangle,
  Play,
  Sliders,
  Cpu,
  Radio,
  ShieldCheck,
  Navigation,
  CheckCircle2,
  Clock,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Layers,
  Flame,
} from 'lucide-react';
import { TrafficZone, TrafficSignalNode } from '@/components/LeafletMap';

const CITY_CENTER: [number, number] = [28.6139, 77.2090];
const ROUTE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ProfessionalEmergencyDashboard() {
  const Map = useMemo(
    () =>
      dynamic(() => import('@/components/LeafletMap'), {
        ssr: false,
        loading: () => (
          <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-3">
            <Radio className="w-6 h-6 text-blue-500 animate-spin" />
            <span>Initializing Spatial Telemetry Engine...</span>
          </div>
        ),
      }),
    []
  );

  const [numAmbulances, setNumAmbulances] = useState(4);
  const [numPatients, setNumPatients] = useState(5);
  const [criticalPatientIds, setCriticalPatientIds] = useState<string[]>(['P1', 'P3']);
  const [trafficSeverity, setTrafficSeverity] = useState<'Low' | 'Moderate' | 'High' | 'Blockade'>('High');
  const [isPreemptionEnabled, setIsPreemptionEnabled] = useState(true);

  const [mapScale, setMapScale] = useState<'compact' | 'standard' | 'expanded'>('standard');
  const [isSimulating, setIsSimulating] = useState(false);
  const [status, setStatus] = useState('System Standby — Select Parameters & Dispatch');
  const [routes, setRoutes] = useState<any[]>([]);
  const [tspDronePath, setTspDronePath] = useState<[number, number][]>([]);

  const trafficMultiplier = useMemo(() => {
    switch (trafficSeverity) {
      case 'Low': return 1.0;
      case 'Moderate': return 1.4;
      case 'High': return 2.2;
      case 'Blockade': return 3.8;
    }
  }, [trafficSeverity]);

  const trafficZones: TrafficZone[] = useMemo(() => [
    { id: 'Z1', name: 'Central Arterial Corridor', center: [28.625, 77.215], radius: 750, severity: trafficSeverity },
    { id: 'Z2', name: 'Ring Road Bottleneck', center: [28.585, 77.230], radius: 600, severity: trafficSeverity },
  ], [trafficSeverity]);

  const trafficSignals: TrafficSignalNode[] = useMemo(() => [
    { id: 'SIG-101', lat: 28.618, lng: 77.212, isGreenWave: isSimulating && isPreemptionEnabled },
    { id: 'SIG-102', lat: 28.595, lng: 77.225, isGreenWave: isSimulating && isPreemptionEnabled },
    { id: 'SIG-103', lat: 28.575, lng: 77.218, isGreenWave: isSimulating && isPreemptionEnabled },
  ], [isSimulating, isPreemptionEnabled]);

  const scenarioData = useMemo(() => {
    const ambulances = Array.from({ length: numAmbulances }, (_, i) => ({
      id: `A${i + 1}`,
      name: `Ambulance Unit A${i + 1}`,
      lat: CITY_CENTER[0] + Math.sin(i * 1.5) * 0.035,
      lng: CITY_CENTER[1] + Math.cos(i * 1.5) * 0.035,
      type: 'AMBULANCE' as const,
    }));

    const patients = Array.from({ length: numPatients }, (_, j) => {
      const pid = `P${j + 1}`;
      return {
        id: pid,
        name: `Emergency Call #${101 + j}`,
        lat: CITY_CENTER[0] + Math.cos(j * 1.4) * 0.03,
        lng: CITY_CENTER[1] + Math.sin(j * 1.4) * 0.03,
        type: 'PATIENT' as const,
        isCritical: criticalPatientIds.includes(pid),
      };
    });

    const hospitals = [{ id: 'H1', name: 'AIIMS Central Trauma Center', lat: 28.5672, lng: 77.2100, type: 'HOSPITAL' as const }];

    return { ambulances, patients, hospitals };
  }, [numAmbulances, numPatients, criticalPatientIds]);

  const toggleCritical = (id: string) => {
    setCriticalPatientIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    setIsSimulating(false);
  };

  const mathematicalAnalytics = useMemo(() => {
    const criticalPatients = scenarioData.patients.filter((p) => p.isCritical);
    const baseHosp = scenarioData.hospitals[0];

    let droneTourDistanceKm = 0;
    if (criticalPatients.length > 0) {
      let currentLoc = { lat: baseHosp.lat, lng: baseHosp.lng };
      criticalPatients.forEach((p) => {
        const d = Math.hypot(p.lat - currentLoc.lat, p.lng - currentLoc.lng) * 111;
        droneTourDistanceKm += d;
        currentLoc = { lat: p.lat, lng: p.lng };
      });
      droneTourDistanceKm += Math.hypot(baseHosp.lat - currentLoc.lat, baseHosp.lng - currentLoc.lng) * 111;
    }
    const droneSpeedKmH = 65;
    const droneFlightTimeMin = Math.round((droneTourDistanceKm / droneSpeedKmH) * 60);

    const ambulanceAssignments = scenarioData.ambulances.slice(0, scenarioData.patients.length).map((amb, idx) => {
      const pat = scenarioData.patients[idx];
      const directDistKm = Math.hypot(pat.lat - amb.lat, pat.lng - amb.lng) * 111;
      const baseDriveTimeMin = (directDistKm / 40) * 60;

      const trafficDelayMin = baseDriveTimeMin * (trafficMultiplier - 1);
      const signalPreemptionSavingMin = isPreemptionEnabled ? 3.5 : 0;

      const finalEtaMin = Math.max(2, Math.round(baseDriveTimeMin + trafficDelayMin - signalPreemptionSavingMin));

      return {
        ambId: amb.id,
        patId: pat.id,
        isCritical: pat.isCritical,
        distanceKm: directDistKm.toFixed(2),
        baseTimeMin: baseDriveTimeMin.toFixed(1),
        trafficDelayMin: trafficDelayMin.toFixed(1),
        preemptionSavedMin: signalPreemptionSavingMin.toFixed(1),
        finalEtaMin,
      };
    });

    return {
      droneTourDistanceKm: droneTourDistanceKm.toFixed(2),
      droneFlightTimeMin,
      ambulanceAssignments,
      totalSignalSavingsMin: (ambulanceAssignments.length * (isPreemptionEnabled ? 3.5 : 0)).toFixed(1),
    };
  }, [scenarioData, trafficMultiplier, isPreemptionEnabled]);

  const runSimulation = useCallback(async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setRoutes([]);
    setTspDronePath([]);
    setStatus('Computing Allocation & Solving Drone TSP Path...');

    const baseHospital = scenarioData.hospitals[0];
    const criticalPatients = scenarioData.patients.filter((p) => p.isCritical);

    if (criticalPatients.length > 0) {
      const visited: typeof criticalPatients = [];
      let currentLoc = { lat: baseHospital.lat, lng: baseHospital.lng };
      const unvisited = [...criticalPatients];

      while (unvisited.length > 0) {
        unvisited.sort((a, b) => Math.hypot(a.lat - currentLoc.lat, a.lng - currentLoc.lng) - Math.hypot(b.lat - currentLoc.lat, b.lng - currentLoc.lng));
        const next = unvisited.shift()!;
        visited.push(next);
        currentLoc = { lat: next.lat, lng: next.lng };
      }

      const stops = [
        [baseHospital.lat, baseHospital.lng] as [number, number],
        ...visited.map((p) => [p.lat, p.lng] as [number, number]),
        [baseHospital.lat, baseHospital.lng] as [number, number],
      ];

      const droneTrajectory: [number, number][] = [];
      for (let i = 0; i < stops.length - 1; i++) {
        const from = stops[i], to = stops[i + 1], steps = 30;
        for (let s = 0; s < steps; s++) {
          droneTrajectory.push([from[0] + (to[0] - from[0]) * (s / steps), from[1] + (to[1] - from[1]) * (s / steps)]);
        }
      }
      setTspDronePath(droneTrajectory);
    }

    setTimeout(async () => {
      setStatus('Activating Green Wave Signals & Processing Polylines...');
      const activePairs = scenarioData.patients.slice(0, scenarioData.ambulances.length).map((pat, idx) => ({
        amb: scenarioData.ambulances[idx],
        pat,
        hosp: baseHospital,
      }));

      try {
        const calculatedRoutes = await Promise.all(
          activePairs.map(async (pair, idx) => {
            const res1 = await fetch(`https://router.project-osrm.org/route/v1/driving/${pair.amb.lng},${pair.amb.lat};${pair.pat.lng},${pair.pat.lat}?overview=full&geometries=geojson`);
            const data1 = await res1.json();
            const res2 = await fetch(`https://router.project-osrm.org/route/v1/driving/${pair.pat.lng},${pair.pat.lat};${pair.hosp.lng},${pair.hosp.lat}?overview=full&geometries=geojson`);
            const data2 = await res2.json();

            return {
              id: pair.amb.id,
              ambId: pair.amb.id,
              color: ROUTE_COLORS[idx % ROUTE_COLORS.length],
              pickupCoords: data1.routes?.[0]?.geometry.coordinates.map((c: any) => [c[1], c[0]]) || [],
              hospitalCoords: data2.routes?.[0]?.geometry.coordinates.map((c: any) => [c[1], c[0]]) || [],
            };
          })
        );
        setRoutes(calculatedRoutes);
        setStatus('DISPATCH ACTIVE — Fleet Sirens & Airborne TSP Drone Operating');
      } catch {
        setStatus('Error calculating polyline vectors');
      }
    }, 500);
  }, [isSimulating, scenarioData]);

  const mapContainerHeightClass = useMemo(() => {
    switch (mapScale) {
      case 'compact': return 'h-48 sm:h-56 lg:h-1/4 lg:min-h-[220px]';
      case 'standard': return 'h-64 sm:h-72 lg:h-[58%] lg:min-h-[360px]';
      case 'expanded': return 'h-80 sm:h-96 lg:h-[85%] lg:min-h-[500px]';
    }
  }, [mapScale]);

  return (
    <div className="flex flex-col lg:flex-row min-h-dvh lg:h-screen w-full lg:w-screen bg-[#0A0E17] text-slate-100 font-sans lg:overflow-hidden selection:bg-cyan-500/30">

      {/* Sidebar Controls */}
      <div className="w-full lg:w-[368px] lg:min-w-[368px] bg-[#0D1220] border-b lg:border-b-0 lg:border-r border-white/[0.06] p-4 lg:p-5 flex flex-col gap-4 lg:justify-between lg:overflow-y-auto z-20 shrink-0">

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
            <div className="relative p-2.5 bg-gradient-to-br from-blue-600/20 to-cyan-500/10 border border-blue-500/30 rounded-xl">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#0D1220] animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-[13px] tracking-wide text-white uppercase font-mono">Dispatch Control Console</h1>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Routing &amp; Signal Preemption Engine</p>
            </div>
          </div>

          {/* Sliders */}
          <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-blue-300 font-mono uppercase tracking-wide text-[11px]"><Truck className="w-3.5 h-3.5" /> Fleet Capacity</span>
                <span className="font-mono text-blue-300 font-bold bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded text-[11px] tabular-nums">{numAmbulances} Units</span>
              </div>
              <input
                type="range" min="2" max="6" value={numAmbulances}
                onChange={(e) => { setNumAmbulances(Number(e.target.value)); setIsSimulating(false); }}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none touch-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-amber-300 font-mono uppercase tracking-wide text-[11px]"><AlertTriangle className="w-3.5 h-3.5" /> Emergency Incidents</span>
                <span className="font-mono text-amber-300 font-bold bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded text-[11px] tabular-nums">{numPatients} Calls</span>
              </div>
              <input
                type="range" min="2" max="8" value={numPatients}
                onChange={(e) => { setNumPatients(Number(e.target.value)); setIsSimulating(false); }}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none touch-none"
              />
            </div>
          </div>

          {/* Traffic Congestion Selector */}
          <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl space-y-3">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-amber-400" /> Traffic Congestion State</span>
              <span className="text-amber-400 font-bold text-[10px] tabular-nums">μ {trafficMultiplier}x</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Low', 'Moderate', 'High', 'Blockade'] as const).map((lvl) => {
                const isActive = trafficSeverity === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => { setTrafficSeverity(lvl); setIsSimulating(false); }}
                    className={`py-2.5 lg:py-2 px-3 rounded-lg text-xs font-mono font-bold border transition-all duration-200 active:scale-95 ${
                      isActive
                        ? lvl === 'Blockade'
                          ? 'bg-red-500/15 border-red-500/60 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                          : 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.18)]'
                        : 'bg-white/[0.02] border-white/[0.08] text-slate-500 hover:border-white/20 hover:text-slate-300'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* IoT Preemption Switch */}
          <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className={`w-4 h-4 transition-colors ${isPreemptionEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div>
                <div className="text-xs font-bold text-slate-200 font-mono">IoT Signal Preemption</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Green wave corridor override</div>
              </div>
            </div>
            <button
              onClick={() => setIsPreemptionEnabled(!isPreemptionEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1220] ${
                isPreemptionEnabled ? 'bg-emerald-500' : 'bg-white/10 border border-white/10'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                isPreemptionEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Critical Patients Selection */}
          <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl space-y-2.5">
            <label className="text-[11px] font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Flame className="w-3.5 h-3.5 text-red-500" /> Critical Patients (Drone TSP)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {scenarioData.patients.map((p) => {
                const isCrit = criticalPatientIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleCritical(p.id)}
                    className={`py-2 lg:py-1.5 text-xs font-mono font-bold rounded-lg border transition-all duration-200 active:scale-95 ${
                      isCrit
                        ? 'bg-red-500/20 border-red-500/60 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                        : 'bg-white/[0.02] border-white/[0.08] text-slate-500 hover:border-white/20 hover:text-slate-300'
                    }`}
                  >
                    {p.id}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button & Telemetry */}
        <div className="space-y-3 pt-2">
          <button
            onClick={runSimulation}
            className="relative group w-full py-3.5 px-4 rounded-xl font-bold text-xs tracking-wider uppercase bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 text-white shadow-[0_0_25px_rgba(37,99,235,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1220]"
          >
            <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
            <Play className="w-4 h-4 fill-white transition-transform group-hover:scale-110" />
            <span>Dispatch Fleet &amp; Preemption</span>
          </button>

          <div className="text-[10px] bg-black/30 border border-white/[0.06] p-2.5 rounded-lg text-blue-300 font-mono flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 text-blue-400 shrink-0 ${isSimulating ? 'animate-spin' : ''}`} />
            <span className="truncate">{status}</span>
          </div>
        </div>

      </div>

      {/* Main Panel Viewport */}
      <div className="flex-1 flex flex-col lg:h-full bg-[#0A0E17] p-3 sm:p-4 gap-4 lg:overflow-hidden">

        {/* Map Container */}
        <div className={`w-full rounded-2xl overflow-hidden border border-white/[0.06] relative transition-all duration-300 shrink-0 ${mapContainerHeightClass}`}>

          <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center gap-1 sm:gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 p-1.5 rounded-xl overflow-x-auto">
            <span className="hidden sm:flex text-[10px] font-mono font-bold text-slate-400 px-2 items-center gap-1 shrink-0">
              <Layers className="w-3 h-3 text-blue-400" /> Map Size
            </span>
            <button
              onClick={() => setMapScale('compact')}
              className={`shrink-0 px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                mapScale === 'compact' ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/10'
              }`}
            >
              <Minimize2 className="w-3 h-3 inline mr-1" /> 25%
            </button>
            <button
              onClick={() => setMapScale('standard')}
              className={`shrink-0 px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                mapScale === 'standard' ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/10'
              }`}
            >
              <LayoutGrid className="w-3 h-3 inline mr-1" /> 58%
            </button>
            <button
              onClick={() => setMapScale('expanded')}
              className={`shrink-0 px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                mapScale === 'expanded' ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/10'
              }`}
            >
              <Maximize2 className="w-3 h-3 inline mr-1" /> 85%
            </button>
          </div>

          <Map
            center={CITY_CENTER}
            hospitals={scenarioData.hospitals}
            ambulances={scenarioData.ambulances}
            patients={scenarioData.patients}
            trafficZones={trafficZones}
            trafficSignals={trafficSignals}
            routes={routes}
            tspDronePath={tspDronePath}
            isSimulating={isSimulating}
          />
        </div>

        {/* Analytics Drawer */}
        <div className="lg:flex-1 min-h-[260px] lg:min-h-0 bg-[#0D1220] border border-white/[0.06] rounded-2xl p-4 flex gap-4 overflow-x-auto shrink-0">

          <div className="flex-1 min-w-[300px] sm:min-w-[340px] bg-black/20 border border-white/[0.06] rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2">
                <span className="text-xs font-bold text-blue-300 font-mono flex items-center gap-1.5 uppercase tracking-wider">
                  <Cpu className="w-4 h-4" /> Cost Matrix &amp; ETA Calculations
                </span>
                <span className="text-[10px] font-mono bg-blue-600/15 text-blue-300 border border-blue-500/25 px-2 py-0.5 rounded">Hungarian Optimization</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mb-2 bg-black/30 p-2 rounded border border-white/[0.06]">
                T_eta = (d / v_base) × μ_traffic − Δt_preemption
              </div>
              <div className="space-y-1.5 overflow-y-auto max-h-32">
                {mathematicalAnalytics.ambulanceAssignments.map((row, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] font-mono bg-black/30 p-2 rounded border border-white/[0.06] gap-2">
                    <span className="text-slate-200 font-bold shrink-0">{row.ambId} → {row.patId}</span>
                    <span className="text-slate-500">{row.distanceKm} km</span>
                    <span className="text-amber-400">+{row.trafficDelayMin}m</span>
                    <span className="text-emerald-400">−{row.preemptionSavedMin}m</span>
                    <span className="text-white font-bold bg-blue-600/25 border border-blue-500/30 px-2 py-0.5 rounded shrink-0">{row.finalEtaMin} min ETA</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-72 sm:w-80 shrink-0 bg-black/20 border border-cyan-500/20 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2">
                <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5 uppercase tracking-wider">
                  <Navigation className="w-4 h-4" /> TSP Drone Telemetry
                </span>
                <span className="text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 px-2 py-0.5 rounded">65 km/h</span>
              </div>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Critical Targets</span>
                  <span className="text-red-400 font-bold">{criticalPatientIds.length} Stops</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total TSP Distance</span>
                  <span className="text-cyan-300 font-bold">{mathematicalAnalytics.droneTourDistanceKm} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Est. Flight Duration</span>
                  <span className="text-emerald-400 font-bold">{mathematicalAnalytics.droneFlightTimeMin} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Congestion Bypass</span>
                  <span className="text-emerald-400 font-bold">100% Airborne</span>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono bg-black/30 p-2 rounded border border-white/[0.06] truncate mt-2">
              Sequence: <span className="text-cyan-300 font-bold">H1 → {criticalPatientIds.join(' → ')} → H1</span>
            </div>
          </div>

          <div className="w-64 sm:w-72 shrink-0 bg-black/20 border border-emerald-500/20 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2">
                <span className="text-xs font-bold text-emerald-300 font-mono flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="w-4 h-4" /> Intersection Preemption
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Active IoT Signals</span>
                  <span className="text-white font-bold">{trafficSignals.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Saved per Unit</span>
                  <span className="text-emerald-400 font-bold">{isPreemptionEnabled ? '3.5 min' : '0 min'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Fleet Savings</span>
                  <span className="text-emerald-400 font-bold">{mathematicalAnalytics.totalSignalSavingsMin} min</span>
                </div>
              </div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded text-[10px] text-emerald-300 font-mono mt-2">
              Preemption overrides intersection red lights to eliminate queue delays.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}