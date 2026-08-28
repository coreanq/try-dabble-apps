import { useEffect, useRef } from "react";
import L from "leaflet";

import type { MapView, Pin } from "@/lib/pins";

/** Free OSM raster tiles. No Mapbox/Google key, no token, nothing to sign up
 *  for — the map has to work the moment the page opens. */
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a>';

/** Hand-drawn pin as a divIcon, so no marker image is ever fetched. */
function pinIcon(selected: boolean): L.DivIcon {
  const fill = selected ? "#8f3520" : "#b4472e";
  return L.divIcon({
    className: `mm-pin${selected ? " mm-pin-selected" : ""}`,
    html:
      `<span class="mm-pin-body"><svg viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">` +
      `<path d="M13 1.6 C19.3 1.6 24.4 6.6 24.4 12.9 C24.4 21.4 13 32.4 13 32.4 S1.6 21.4 1.6 12.9 C1.6 6.6 6.7 1.6 13 1.6 Z" fill="${fill}" stroke="#33291d" stroke-width="2" stroke-linejoin="round"/>` +
      `<circle cx="13" cy="12.7" r="4.2" fill="#f6ecd8" stroke="#33291d" stroke-width="1.4"/>` +
      `</svg></span>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
  });
}

export interface MapApi {
  /** Where the map is pointed right now — used by "pin the centre". */
  center(): { lat: number; lng: number } | null;
  focus(lat: number, lng: number): void;
}

export function PinMap({
  pins,
  selectedId,
  initialView,
  ariaLabel,
  apiRef,
  onDrop,
  onOpen,
  onViewChange,
}: {
  pins: Pin[];
  selectedId: string | null;
  initialView: MapView;
  ariaLabel: string;
  apiRef: React.RefObject<MapApi | null>;
  onDrop: (lat: number, lng: number) => void;
  onOpen: (id: string) => void;
  onViewChange: (view: MapView) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());

  // Latest callbacks, so the map is built exactly once and its handlers never
  // go stale against a re-render.
  const onDropRef = useRef(onDrop);
  const onOpenRef = useRef(onOpen);
  const onViewRef = useRef(onViewChange);
  onDropRef.current = onDrop;
  onOpenRef.current = onOpen;
  onViewRef.current = onViewChange;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const map = L.map(host, {
      center: [initialView.lat, initialView.lng],
      zoom: initialView.zoom,
      // A double click would otherwise fire two clicks and drop two pins.
      doubleClickZoom: false,
      zoomControl: true,
      attributionControl: true,
      worldCopyJump: true,
    });
    mapRef.current = map;

    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTR }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onDropRef.current(e.latlng.lat, e.latlng.lng);
    });
    map.on("moveend zoomend", () => {
      const c = map.getCenter();
      onViewRef.current({ lat: c.lat, lng: c.lng, zoom: map.getZoom() });
    });

    // The card is laid out by flexbox, so the tiles need one more frame before
    // leaflet knows how big it is.
    const raf = requestAnimationFrame(() => map.invalidateSize());
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // initialView is only the starting camera; later changes are the user's own
    // panning and must not rebuild the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Markers follow the pin list. Existing markers are moved rather than
  // recreated so tapping one does not make it blink.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const live = markersRef.current;
    const seen = new Set<string>();

    for (const pin of pins) {
      seen.add(pin.id);
      const existing = live.get(pin.id);
      if (existing) {
        existing.setLatLng([pin.lat, pin.lng]);
        existing.setIcon(pinIcon(pin.id === selectedId));
        existing.setZIndexOffset(pin.id === selectedId ? 1000 : 0);
      } else {
        const marker = L.marker([pin.lat, pin.lng], {
          icon: pinIcon(pin.id === selectedId),
          keyboard: true,
          zIndexOffset: pin.id === selectedId ? 1000 : 0,
        }).addTo(map);
        marker.on("click", () => onOpenRef.current(pin.id));
        live.set(pin.id, marker);
      }
    }

    for (const [id, marker] of live) {
      if (!seen.has(id)) {
        marker.remove();
        live.delete(id);
      }
    }
  }, [pins, selectedId]);

  useEffect(() => {
    apiRef.current = {
      center() {
        const map = mapRef.current;
        if (!map) return null;
        const c = map.getCenter();
        return { lat: c.lat, lng: c.lng };
      },
      focus(lat, lng) {
        const map = mapRef.current;
        if (!map) return;
        map.setView([lat, lng], Math.max(map.getZoom(), 13), { animate: true });
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef]);

  return <div ref={hostRef} id="map" className="mm-map" role="application" aria-label={ariaLabel} />;
}
