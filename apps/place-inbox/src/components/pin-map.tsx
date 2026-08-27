import { useEffect, useRef } from "react";
import L from "leaflet";

import type { Place } from "@/lib/places";

/**
 * Optional OpenStreetMap pins. Coordinates are only ever typed by hand — the
 * app never geocodes a place, so nothing about a saved place leaves the device
 * except the map tiles themselves.
 */
export function PinMap({ places }: { places: Place[] }) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!holder.current || map.current) return;
    map.current = L.map(holder.current, { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    const group = layer.current;
    if (!instance || !group) return;
    group.clearLayers();

    const bounds: [number, number][] = [];
    for (const place of places) {
      if (place.lat == null || place.lng == null) continue;
      const marker = L.marker([place.lat, place.lng], {
        // A postmark-red pin, so the map matches the album it sits under.
        icon: L.divIcon({ className: "", html: '<i class="pi-pin"></i>', iconSize: [18, 18] }),
      });
      marker.bindPopup(`<strong>${place.name || "…"}</strong><br>${place.rank}/5`);
      group.addLayer(marker);
      bounds.push([place.lat, place.lng]);
    }

    instance.invalidateSize();
    if (bounds.length === 1) instance.setView(bounds[0], 12);
    else if (bounds.length > 1) instance.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 });
  }, [places]);

  return <div id="map" className="pi-map" ref={holder} />;
}
