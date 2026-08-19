'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

interface LocationPickerMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (loc: { lat: number; lng: number; address: string }) => void;
}

export default function LocationPickerMap({
  initialLat = 25.5941,
  initialLng = 85.1376,
  onLocationSelect,
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [address, setAddress] = useState<string>('Selected Map Point');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Custom Pin Icon using Leaflet DivIcon
  const createPinIcon = () => {
    return L.divIcon({
      className: 'custom-location-pin',
      html: `
        <div style="position: relative; width: 36px; height: 36px;">
          <div style="
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: #2563EB;
            border: 3px solid #FFFFFF;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background: #FFFFFF;
              border-radius: 50%;
            "></div>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });
  };

  // Reverse geocode lat/lng to human readable address
  const fetchAddress = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    const fallbackAddress = `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (response.ok) {
        const data = await response.json();
        const displayName = data.display_name || fallbackAddress;
        setAddress(displayName);
        onLocationSelect({ lat, lng, address: displayName });
      } else {
        setAddress(fallbackAddress);
        onLocationSelect({ lat, lng, address: fallbackAddress });
      }
    } catch {
      setAddress(fallbackAddress);
      onLocationSelect({ lat, lng, address: fallbackAddress });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Move marker to position and fetch address
  const updatePosition = (lat: number, lng: number, pan = true) => {
    setSelectedCoords({ lat, lng });
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (mapInstanceRef.current && pan) {
      mapInstanceRef.current.panTo([lat, lng]);
    }
    fetchAddress(lat, lng);
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const pinMarker = L.marker([initialLat, initialLng], {
      icon: createPinIcon(),
      draggable: true,
    }).addTo(map);

    pinMarker.on('dragend', (e) => {
      const newPos = e.target.getLatLng();
      updatePosition(newPos.lat, newPos.lng, false);
    });

    map.on('click', (e) => {
      updatePosition(e.latlng.lat, e.latlng.lng, true);
    });

    markerRef.current = pinMarker;
    mapInstanceRef.current = map;

    // Initial address fetch
    fetchAddress(initialLat, initialLng);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Search Place
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (response.ok) {
        const results = await response.json();
        if (results && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lng = parseFloat(results[0].lon);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15);
          }
          updatePosition(lat, lng, false);
        }
      }
    } catch (err) {
      console.warn('Location search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Center on current user GPS
  const handleLocateMe = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15);
          }
          updatePosition(lat, lng, false);
        },
        (err) => {
          console.warn('Geolocation error:', err);
        }
      );
    }
  };

  return (
    <div className="space-y-3">
      {/* Map Search & Controls Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            className="form-input text-xs pl-8 pr-3 py-2 border rounded-lg w-full"
            placeholder="Search place, landmark, or city (e.g. Boring Road, Patna)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          type="button"
          disabled={isSearching}
          onClick={handleSearch}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer"
        >
          {isSearching ? 'Searching...' : 'Find'}
        </button>
        <button
          type="button"
          onClick={handleLocateMe}
          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1 shadow-sm cursor-pointer"
          title="Center on my GPS location"
        >
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="hidden sm:inline">My GPS</span>
        </button>
      </div>

      {/* Map Element */}
      <div className="relative w-full h-[280px] rounded-xl overflow-hidden border border-slate-300 shadow-sm">
        <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

        {/* Tip Instruction Overlay */}
        <div className="absolute top-2 left-2 z-[1000] bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md shadow-sm border border-slate-200 text-[11px] font-medium text-slate-700 flex items-center gap-1.5 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          Click anywhere on the map or drag pin to select GPS location
        </div>
      </div>

      {/* Selected Location Summary Box */}
      <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 flex items-start gap-2.5">
        <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-blue-900 mb-0.5 flex items-center gap-2">
            <span>Selected GPS Point</span>
            <span className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
              {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
            </span>
          </p>
          <p className="text-xs text-slate-700 truncate font-medium">
            {isGeocoding ? 'Fetching address details...' : address}
          </p>
        </div>
      </div>
    </div>
  );
}
