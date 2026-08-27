export interface LatLngPoint {
    lat: number;
    lng: number;
  }
  
  /**
   * Fetches turn-by-turn road polyline points from OSRM Routing Engine.
   */
  export async function getRoadPolyline(
    origin: LatLngPoint,
    destination: LatLngPoint
  ): Promise<[number, number][]> {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
  
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        return data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]] as [number, number]
        );
      }
    } catch (err) {
      console.error('Failed to fetch OSRM Polyline:', err);
    }
  
    // Fallback straight vector line
    return [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ];
  }