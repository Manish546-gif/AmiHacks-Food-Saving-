import { useEffect, useMemo, useRef, useState } from 'react';
import { asPoint, getMarkerStyle, splitPath } from '../lib/mapUtils';

function markerOptions(maps, type, selected = false) {
  const style = getMarkerStyle(type);
  const scale = selected ? 9 : 7;
  return {
    position: { lat: 0, lng: 0 },
    title: type,
    zIndex: selected ? 1000 : 100,
    icon: {
      path: maps.SymbolPath.CIRCLE,
      fillColor: style.color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale,
    },
    label: {
      text: style.label,
      color: '#ffffff',
      fontSize: selected ? '11px' : '10px',
      fontWeight: '700',
    },
  };
}

function popupContent(pin) {
  const root = document.createElement('div');
  root.style.fontFamily = 'system-ui, sans-serif';
  root.style.minWidth = '140px';
  const title = document.createElement('div');
  title.style.fontWeight = '800';
  title.style.fontSize = '13px';
  title.textContent = String(pin.label || pin.name || pin.type || 'Map point').slice(0, 140);
  root.appendChild(title);

  if (pin.address || pin.vehicle) {
    const detail = document.createElement('div');
    detail.style.fontSize = '11px';
    detail.style.color = '#64748b';
    detail.style.marginTop = '2px';
    detail.textContent = String(pin.address || pin.vehicle).slice(0, 180);
    root.appendChild(detail);
  }

  return root;
}

function fitMapPoints(map, maps, points, maxZoom = 15) {
  const validPoints = points.map(asPoint).filter(Boolean);
  if (validPoints.length === 0) return;

  if (validPoints.length === 1) {
    map.setCenter(validPoints[0], maxZoom);
    return;
  }

  const bounds = new maps.LatLngBounds();
  validPoints.forEach((point) => bounds.extend(point));
  map.fitBounds(bounds, 48);
  if (map.getZoom() > maxZoom) map.setZoom(maxZoom);
}

export default function GoogleMap({
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
  ariaLabel = 'Google Maps view',
  onError,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markersRef = useRef(new Map());
  const pinDataRef = useRef(new Map());
  const polylinesRef = useRef([]);
  const onPinClickRef = useRef(onPinClick);
  const onErrorRef = useRef(onError);
  const initialCenterRef = useRef(center);
  const initialZoomRef = useRef(zoom);
  const fittedKeyRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const pinsKey = useMemo(
    () => pins.map((pin, index) => `${pin.id ?? index}:${pin.lat ?? ''}:${pin.lng ?? ''}`).join('|'),
    [pins],
  );
  const routeKey = useMemo(
    () => routePath.map(point => `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`).join(';'),
    [routePath],
  );

  useEffect(() => {
    onPinClickRef.current = onPinClick;
  }, [onPinClick]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const maps = typeof window !== 'undefined' ? window.google?.maps : null;
    const container = containerRef.current;
    if (!maps || !container) {
      onErrorRef.current?.();
      return undefined;
    }

    let map;
    try {
      map = new maps.Map(container, {
        center: initialCenterRef.current,
        zoom: initialZoomRef.current,
        disableDefaultUI: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        clickableIcons: false,
      });
    } catch {
      onErrorRef.current?.();
      return undefined;
    }

    mapRef.current = map;
    infoWindowRef.current = new maps.InfoWindow();
    const markers = markersRef.current;
    const pinData = pinDataRef.current;
    const polylines = polylinesRef.current;
    const readyTimer = window.setTimeout(() => setMapReady(true), 0);

    return () => {
      window.clearTimeout(readyTimer);
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      polylines.forEach((polyline) => polyline.setMap(null));
      polylines.length = 0;
      markers.forEach((marker) => marker.setMap(null));
      markers.clear();
      pinData.clear();
      maps.event.clearInstanceListeners(map);
      mapRef.current = null;
      if (container) container.innerHTML = '';
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !containerRef.current) return undefined;
    const map = mapRef.current;
    const maps = window.google.maps;
    const invalidate = () => maps.event.trigger(map, 'resize');
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(invalidate)
      : null;
    const delayedInvalidate = window.setTimeout(invalidate, 0);

    resizeObserver?.observe(containerRef.current);
    window.addEventListener('resize', invalidate);

    return () => {
      window.clearTimeout(delayedInvalidate);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', invalidate);
    };
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.google?.maps;
    if (!mapReady || !map || !maps) return;

    const nextFitKey = `${mode}:${pinsKey}:${routeKey}`;
    if (fittedKeyRef.current === nextFitKey) return;
    fittedKeyRef.current = nextFitKey;

    if (mode === 'radar') {
      fitMapPoints(map, maps, pins.map(asPoint), 14);
    } else if (routePath.length > 1) {
      fitMapPoints(map, maps, routePath, 15);
    } else if (pickupPoint || dropPoint) {
      fitMapPoints(map, maps, [pickupPoint, dropPoint].filter(Boolean), 15);
    }
  }, [mapReady, mode, pins, pinsKey, routeKey, routePath, pickupPoint, dropPoint]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.google?.maps;
    if (!mapReady || !map || !maps) return;

    const activeIds = new Set();
    const currentPins = pins
      .map((pin, index) => ({ pin, point: asPoint(pin), id: String(pin.id ?? `${pin.type ?? 'pin'}-${index}`) }))
      .filter(({ point }) => Boolean(point));

    currentPins.forEach(({ pin, point, id }) => {
      const key = `pin:${id}`;
      activeIds.add(key);
      pinDataRef.current.set(key, pin);
      const isSelected = selectedPinId !== null && String(selectedPinId) === id;
      const options = markerOptions(maps, pin.type, isSelected);
      const existingMarker = markersRef.current.get(key);

      if (existingMarker) {
        existingMarker.setOptions({ ...options, position: point });
        existingMarker.setZIndex(isSelected ? 1000 : 100);
      } else {
        const marker = new maps.Marker({ ...options, map, position: point });
        maps.event.addListener(marker, 'click', () => {
          const currentPin = pinDataRef.current.get(key);
          if (!currentPin) return;
          infoWindowRef.current?.setContent(popupContent(currentPin));
          infoWindowRef.current?.open({ map, anchor: marker });
          onPinClickRef.current?.(currentPin);
        });
        markersRef.current.set(key, marker);
      }
    });

    markersRef.current.forEach((marker, key) => {
      if (key.startsWith('pin:') && !activeIds.has(key)) {
        marker.setMap(null);
        markersRef.current.delete(key);
        pinDataRef.current.delete(key);
      }
    });
  }, [mapReady, pins, selectedPinId]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.google?.maps;
    if (!mapReady || !map || !maps) return;

    const upsertFixedMarker = (key, point, type, title) => {
      if (!point) {
        markersRef.current.get(key)?.setMap(null);
        markersRef.current.delete(key);
        return;
      }
      const existingMarker = markersRef.current.get(key);
      const options = { ...markerOptions(maps, type), position: point, title };
      if (existingMarker) {
        existingMarker.setOptions(options);
      } else {
        markersRef.current.set(key, new maps.Marker({ ...options, map }));
      }
    };

    upsertFixedMarker('pickup', pickupPoint, 'pickup', 'Pickup point');
    upsertFixedMarker('drop', showDropMarker ? dropPoint : null, 'dropoff', 'Shelter drop-off');
    upsertFixedMarker('rider', riderPoint, 'rider', 'Live rider position');
  }, [mapReady, pickupPoint, dropPoint, showDropMarker, riderPoint]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.google?.maps;
    if (!mapReady || !map || !maps) return;

    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];
    if (!showRoute || routePath.length < 2) return;

    const baseLine = new maps.Polyline({
      map,
      path: routePath,
      geodesic: true,
      strokeColor: '#94a3b8',
      strokeOpacity: 0.72,
      strokeWeight: 5,
    });
    polylinesRef.current.push(baseLine);

    const progressPath = splitPath(routePath, routeProgress);
    if (progressPath.length > 1) {
      polylinesRef.current.push(new maps.Polyline({
        map,
        path: progressPath,
        geodesic: true,
        strokeColor: '#fc8019',
        strokeOpacity: 1,
        strokeWeight: 5,
      }));
    }
  }, [mapReady, routePath, routeProgress, showRoute]);

  return (
    <div
      className={`map-view map-view--google ${className}`}
      style={{ position: 'relative', height, borderRadius: 'inherit', overflow: 'hidden', background: '#e2e8f0', ...styleProp }}
      role="region"
      aria-label={ariaLabel}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
