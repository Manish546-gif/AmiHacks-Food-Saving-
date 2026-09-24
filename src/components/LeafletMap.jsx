import { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { asPoint, getMarkerStyle, splitPath } from '../lib/mapUtils';

function toLatLng(point) {
  return [point.lat, point.lng];
}

function safeText(value, fallback = '') {
  return String(value ?? fallback).trim().slice(0, 180);
}

function markerIcon(L, type, selected = false) {
  const style = getMarkerStyle(type);
  const size = selected ? 44 : 34;
  const pulse = type === 'rider'
    ? '<span class="janseva-map-marker__pulse"></span>'
    : '';
  return L.divIcon({
    className: 'janseva-map-marker',
    html: `<span class="janseva-map-marker__body" style="--marker-color:${style.color};--marker-size:${size}px">${pulse}<span class="janseva-map-marker__label">${style.label}</span></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function popupNode(title, detail = '') {
  const root = document.createElement('div');
  root.style.fontFamily = 'system-ui, sans-serif';
  root.style.minWidth = '140px';
  const heading = document.createElement('div');
  heading.style.fontWeight = '800';
  heading.style.fontSize = '13px';
  heading.textContent = safeText(title, 'Map point');
  root.appendChild(heading);
  if (detail) {
    const subheading = document.createElement('div');
    subheading.style.fontSize = '11px';
    subheading.style.color = '#64748b';
    subheading.style.marginTop = '2px';
    subheading.style.whiteSpace = 'normal';
    subheading.textContent = safeText(detail);
    root.appendChild(subheading);
  }
  return root;
}

function pinPopup(pin) {
  return popupNode(pin.label || pin.name || pin.type, pin.address || pin.vehicle || '');
}

function fitPoints(L, map, points, maxZoom) {
  const validPoints = points.map(asPoint).filter(Boolean);
  if (validPoints.length === 0) return;
  if (validPoints.length === 1) {
    map.setView(toLatLng(validPoints[0]), maxZoom);
    return;
  }
  map.fitBounds(validPoints.map(toLatLng), { padding: [48, 48], maxZoom });
}

export default function LeafletMap({
  mode = 'route',
  height = '320px',
  center,
  zoom = 14,
  routePath = [],
  routeProgress = 0,
  pickupPoint,
  dropPoint,
  showDropMarker = true,
  riderPoint,
  pins = [],
  selectedPinId = null,
  onPinClick,
  showRoute = true,
  className = '',
  style: styleProp = {},
  ariaLabel = 'Leaflet map view',
}) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef({});
  const pinDataRef = useRef(new Map());
  const baseRouteRef = useRef(null);
  const progressRouteRef = useRef(null);
  const onPinClickRef = useRef(onPinClick);
  const initialCenterRef = useRef(center);
  const initialZoomRef = useRef(zoom);
  const [mapReady, setMapReady] = useState(false);

  const validPins = useMemo(
    () => pins
      .map((pin, index) => ({ pin, point: asPoint(pin), id: String(pin.id ?? `${pin.type ?? 'pin'}-${index}`) }))
      .filter(({ point }) => Boolean(point)),
    [pins],
  );
  const pinsKey = validPins.map(({ pin, point }) => `${pin.id ?? ''}:${point.lat}:${point.lng}:${pin.type ?? ''}`).join('|');
  const routeKey = routePath.map(point => `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`).join(';');

  useEffect(() => {
    onPinClickRef.current = onPinClick;
  }, [onPinClick]);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      const module = await import('leaflet');
      const L = module.default || module;
      if (!active || !mapDivRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(mapDivRef.current, {
        center: initialCenterRef.current || [25.2138, 75.8648],
        zoom: initialZoomRef.current,
        zoomControl: true,
        scrollWheelZoom: true,
        worldCopyJump: true,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      setMapReady(true);
    };

    const markerStore = markersRef.current;
    const pinStore = pinDataRef.current;
    const baseRoute = baseRouteRef.current;
    const progressRoute = progressRouteRef.current;

    initialize().catch(() => {
      if (active) setMapReady(false);
    });

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      baseRoute?.remove();
      progressRoute?.remove();
      Object.values(markerStore || {}).forEach((marker) => marker?.remove?.());
      if (typeof markerStore?.clear === 'function') markerStore.clear();
      if (typeof pinStore?.clear === 'function') pinStore.clear();
      markersRef.current = {};
      pinDataRef.current = new Map();
      baseRouteRef.current = null;
      progressRouteRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!mapReady || !map || !L || !mapDivRef.current) return undefined;
    const invalidate = () => map.invalidateSize();
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(invalidate)
      : null;
    const delayedInvalidate = window.setTimeout(invalidate, 0);
    resizeObserver?.observe(mapDivRef.current);
    window.addEventListener('resize', invalidate);
    return () => {
      window.clearTimeout(delayedInvalidate);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', invalidate);
    };
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!mapReady || !map || !L) return;
    if (mode === 'radar') {
      fitPoints(L, map, validPins.map(({ point }) => point), 14);
    } else if (routePath.length > 1) {
      fitPoints(L, map, routePath, 15);
    } else if (pickupPoint || dropPoint) {
      fitPoints(L, map, [pickupPoint, dropPoint].filter(Boolean), 15);
    }
  }, [mapReady, mode, pinsKey, routeKey, routePath, pickupPoint, dropPoint, validPins]);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!mapReady || !map || !L) return;

    const activeIds = new Set();
    validPins.forEach(({ pin, point, id }) => {
      const key = `pin:${id}`;
      activeIds.add(key);
      pinDataRef.current.set(key, pin);
      const selected = selectedPinId !== null && String(selectedPinId) === id;
      const icon = markerIcon(L, pin.type, selected);
      const existing = markersRef.current[key];
      if (existing) {
        existing.setLatLng(toLatLng(point));
        existing.setIcon(icon);
        existing.setZIndexOffset(selected ? 1000 : 0);
        existing.setPopupContent(pinPopup(pin));
      } else {
        const marker = L.marker(toLatLng(point), { icon, zIndexOffset: selected ? 1000 : 0 });
        marker.bindPopup(pinPopup(pin), { offset: [0, -4] });
        marker.on('click', () => onPinClickRef.current?.(pinDataRef.current.get(key)));
        marker.addTo(map);
        markersRef.current[key] = marker;
      }
    });

    Object.entries(markersRef.current).forEach(([key, marker]) => {
      if (key.startsWith('pin:') && !activeIds.has(key)) {
        marker.remove();
        delete markersRef.current[key];
        pinDataRef.current.delete(key);
      }
    });
  }, [mapReady, validPins, selectedPinId]);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!mapReady || !map || !L) return;

    const upsertMarker = (key, point, type, title) => {
      const existing = markersRef.current[key];
      if (!point) {
        existing?.remove();
        if (existing) delete markersRef.current[key];
        return;
      }
      if (existing) {
        existing.setLatLng(toLatLng(point));
        existing.setIcon(markerIcon(L, type));
        existing.setPopupContent(popupNode(title));
      } else {
        const marker = L.marker(toLatLng(point), { icon: markerIcon(L, type), zIndexOffset: type === 'rider' ? 1200 : 500 });
        marker.bindPopup(popupNode(title));
        marker.addTo(map);
        markersRef.current[key] = marker;
      }
    };

    upsertMarker('pickup', pickupPoint, 'pickup', 'Pickup point');
    upsertMarker('drop', showDropMarker ? dropPoint : null, 'dropoff', 'Shelter drop-off');
    upsertMarker('rider', riderPoint, 'rider', 'Live rider position');
  }, [mapReady, pickupPoint, dropPoint, showDropMarker, riderPoint]);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!mapReady || !map || !L) return;
    baseRouteRef.current?.remove();
    progressRouteRef.current?.remove();
    baseRouteRef.current = null;
    progressRouteRef.current = null;
    if (!showRoute || routePath.length < 2) return;

    baseRouteRef.current = L.polyline(routePath.map(toLatLng), {
      color: '#94a3b8',
      weight: 5,
      opacity: 0.72,
      dashArray: '8 8',
    }).addTo(map);
    const progressPath = splitPath(routePath, routeProgress);
    if (progressPath.length > 1) {
      progressRouteRef.current = L.polyline(progressPath.map(toLatLng), {
        color: '#fc8019',
        weight: 5,
        opacity: 1,
        lineCap: 'round',
      }).addTo(map);
    }
  }, [mapReady, routePath, routeProgress, showRoute]);

  return (
    <div
      className={`map-view map-view--leaflet ${className}`}
      style={{ position: 'relative', height, borderRadius: 'inherit', overflow: 'hidden', background: '#e2e8f0', ...styleProp }}
      role="region"
      aria-label={ariaLabel}
    >
      <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
