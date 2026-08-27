export interface Coordinate {
    lat: number;
    lng: number;
  }
  
  /**
   * Calculates dynamic travel time matrix between ambulances and patients via OSRM Distance API.
   */
  export async function getTravelTimeMatrix(
    sources: Coordinate[],
    targets: Coordinate[]
  ): Promise<number[][]> {
    const allCoords = [...sources, ...targets]
      .map((c) => `${c.lng},${c.lat}`)
      .join(';');
  
    const sourceIndices = sources.map((_, i) => i).join(';');
    const targetIndices = targets.map((_, i) => sources.length + i).join(';');
  
    const url = `https://router.project-osrm.org/table/v1/driving/${allCoords}?sources=${sourceIndices}&destinations=${targetIndices}`;
  
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.durations) {
        return data.durations; // Returns NxM array of travel times in seconds
      }
    } catch (error) {
      console.error('OSRM Matrix API unavailable, falling back to math calculation:', error);
    }
  
    // Fallback distance calculation if network fails
    return sources.map((s) =>
      targets.map((t) => Math.round(Math.hypot(s.lat - t.lat, s.lng - t.lng) * 10000))
    );
  }