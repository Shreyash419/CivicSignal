export interface GeocodedLocation {
  lat: number;
  lng: number;
  displayName: string;
  country: 'India' | 'Brazil' | 'Russia' | 'China' | 'South Africa';
}

// Fast offline dictionary for common Indian and BRICS cities / institutions
const offlineCityCoords: Record<string, { lat: number; lng: number; displayName: string; country: any }> = {
  gorakhpur: { lat: 26.7606, lng: 83.3732, displayName: 'Gorakhpur', country: 'India' },
  mmmut: { lat: 26.7314, lng: 83.4331, displayName: 'MMMUT Gorakhpur', country: 'India' },
  patna: { lat: 25.5941, lng: 85.1376, displayName: 'Patna', country: 'India' },
  lucknow: { lat: 26.8467, lng: 80.9462, displayName: 'Lucknow', country: 'India' },
  kanpur: { lat: 26.4499, lng: 80.3319, displayName: 'Kanpur', country: 'India' },
  varanasi: { lat: 25.3176, lng: 82.9739, displayName: 'Varanasi', country: 'India' },
  delhi: { lat: 28.6139, lng: 77.2090, displayName: 'Delhi', country: 'India' },
  mumbai: { lat: 19.0760, lng: 72.8777, displayName: 'Mumbai', country: 'India' },
  bengaluru: { lat: 12.9716, lng: 77.5946, displayName: 'Bengaluru', country: 'India' },
  bangalore: { lat: 12.9716, lng: 77.5946, displayName: 'Bengaluru', country: 'India' },
  kolkata: { lat: 22.5726, lng: 88.3639, displayName: 'Kolkata', country: 'India' },
  chennai: { lat: 13.0827, lng: 80.2707, displayName: 'Chennai', country: 'India' },
  hyderabad: { lat: 17.3850, lng: 78.4867, displayName: 'Hyderabad', country: 'India' },
  pune: { lat: 18.5204, lng: 73.8567, displayName: 'Pune', country: 'India' },
  jaipur: { lat: 26.9124, lng: 75.7873, displayName: 'Jaipur', country: 'India' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, displayName: 'Ahmedabad', country: 'India' },
  noida: { lat: 28.5355, lng: 77.3910, displayName: 'Noida', country: 'India' },
  prayagraj: { lat: 25.4358, lng: 81.8463, displayName: 'Prayagraj', country: 'India' },
  allahabad: { lat: 25.4358, lng: 81.8463, displayName: 'Prayagraj', country: 'India' },
};

export async function geocodeLocation(query: string, defaultCountry: any = 'India'): Promise<GeocodedLocation> {
  const clean = (query || '').toLowerCase().trim();
  
  // 1. Check offline dictionary first (instant & zero latency)
  for (const [key, value] of Object.entries(offlineCityCoords)) {
    if (clean.includes(key)) {
      return {
        lat: value.lat,
        lng: value.lng,
        displayName: value.displayName,
        country: value.country,
      };
    }
  }

  // 2. Try online OpenStreetMap Nominatim geocoder with 2s timeout
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CivicSignal-Governance-App/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        let name = item.name || query.split(',')[0].trim();
        name = name.charAt(0).toUpperCase() + name.slice(1);
        return {
          lat,
          lng,
          displayName: name,
          country: defaultCountry,
        };
      }
    }
  } catch (e) {
    // Fallback if offline
  }

  // 3. Fallback: generate deterministic slight offset if unknown so it creates a distinct marker
  const firstWord = clean.split(/[ ,]+/)[0] || 'Unknown';
  const cleanName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
  
  // Base on India center with hash offset
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
  }
  const latOffset = ((hash % 100) / 100) * 2;
  const lngOffset = (((hash >> 2) % 100) / 100) * 2;

  return {
    lat: 26.8 + latOffset,
    lng: 80.9 + lngOffset,
    displayName: cleanName,
    country: defaultCountry,
  };
}
