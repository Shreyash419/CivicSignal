'use client';

import { useEffect, useRef } from 'react';
import type { Hotspot, Priority } from '@/types';
import { getCountryFlag } from '@/lib/utils';
import L from 'leaflet';

const priorityColorMap: Record<Priority, string> = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#CA8A04',
  low: '#16A34A',
};

interface RealWorldMapProps {
  hotspots: Hotspot[];
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot | null) => void;
}

export default function RealWorldMap({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
}: RealWorldMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20, 25],
        zoom: 2,
        minZoom: 2,
        maxZoom: 14,
        zoomControl: false,
        worldCopyJump: true,
      });

      // Add Zoom Control at bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add CartoDB Voyager tiles (crisp, professional global mapping)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when hotspots or selection change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    hotspots.forEach((hotspot) => {
      const { lat, lng } = hotspot.coordinates;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      const isSelected = selectedHotspot?.id === hotspot.id;
      const color = priorityColorMap[hotspot.priority] || '#3B82F6';
      const radius = hotspot.priority === 'critical' ? 22 : hotspot.priority === 'high' ? 16 : 12;

      // Outer ripple circle for critical / high
      if (hotspot.priority === 'critical' || hotspot.priority === 'high') {
        const outerCircle = L.circleMarker([lat, lng], {
          radius: radius * 1.8,
          fillColor: color,
          fillOpacity: 0.15,
          color: color,
          weight: 1,
          opacity: 0.4,
          interactive: false,
        });
        markersLayer.addLayer(outerCircle);
      }

      // Core Hotspot Marker
      const marker = L.circleMarker([lat, lng], {
        radius: isSelected ? radius * 1.25 : radius,
        fillColor: color,
        fillOpacity: isSelected ? 0.95 : 0.8,
        color: '#FFFFFF',
        weight: isSelected ? 3 : 2,
        className: hotspot.priority === 'critical' ? 'leaflet-hotspot-pulse' : hotspot.priority === 'high' ? 'leaflet-hotspot-high' : '',
      });

      // Interactive Popup
      const popupHtml = `
        <div style="font-family: inherit; min-width: 180px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 11px; font-weight: 600; color: #64748B;">${getCountryFlag(hotspot.country)} ${hotspot.country}</span>
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: ${color}20; color: ${color};">
              ${hotspot.priority}
            </span>
          </div>
          <h4 style="font-size: 14px; font-weight: 700; color: #0F1C2E; margin: 0 0 4px 0;">${hotspot.regionName}</h4>
          <p style="font-size: 12px; color: #475569; margin: 0 0 6px 0;">
            <strong>Top Issue:</strong> ${hotspot.topIssue}<br/>
            <strong>Complaints:</strong> ${hotspot.complaintCount.toLocaleString()}<br/>
            <strong>Priority Score:</strong> <span style="color: ${color}; font-weight: 700;">${hotspot.priorityScore.toFixed(1)}/100</span>
          </p>
          <div style="text-align: right;">
            <span style="font-size: 11px; color: #2563EB; font-weight: 600; cursor: pointer;">Click to Inspect &rarr;</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: false });

      // Click to select
      marker.on('click', () => {
        onSelectHotspot(hotspot);
      });

      markersLayer.addLayer(marker);
    });

    // If a hotspot is selected, gently pan to it
    if (selectedHotspot) {
      const { lat, lng } = selectedHotspot.coordinates;
      if (typeof lat === 'number' && typeof lng === 'number') {
        map.flyTo([lat, lng], Math.max(map.getZoom(), 5), {
          duration: 1.2,
        });
      }
    }
  }, [hotspots, selectedHotspot, onSelectHotspot]);

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden shadow-inner border border-slate-200">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Status Badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-lg shadow-sm border border-slate-200/80 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <p className="text-xs font-bold text-slate-800">
            Real-Time Live World Hotspots ({hotspots.length})
          </p>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Real geographic coordinates & live complaint clustering
        </p>
      </div>

      {/* Live Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-md px-3 py-2 rounded-lg shadow-sm border border-slate-200/80 flex items-center gap-3 flex-wrap">
        {[
          { label: 'Critical', color: '#DC2626' },
          { label: 'High', color: '#EA580C' },
          { label: 'Medium', color: '#CA8A04' },
          { label: 'Low', color: '#16A34A' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ background: item.color }}
            />
            <span className="text-[11px] font-semibold text-slate-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
