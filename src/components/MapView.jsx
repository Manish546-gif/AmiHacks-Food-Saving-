import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GoogleMap from './GoogleMap';
import LeafletMap from './LeafletMap';
import {
  DEFAULT_MAP_CENTER,
  asPoint,
  loadGoogleMaps,
  pathDistanceKm,
  pathKey,
  pointAlongPath,
  pointFromLatLng,
  progressForPoint,
  resolveRoute,
  uniquePoints,
} from '../lib/mapUtils';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function createFallbackRoute(points) {
  const path = uniquePoints(points);
  return {
    path,
    distanceMeters: pathDistanceKm(path) * 1000,
    durationSeconds: null,
    source: 'straight',
  };
}

function useResolvedRoute(points, provider, enabled, onRouteChange) {
  const [resolved, setResolved] = useState(() => ({ key: '', route: createFallbackRoute(points) }));
  const pointsRef = useRef(points);
  const callbackRef = useRef(onRouteChange);
  const routeKey = pathKey(points);
  const requestKey = `${provider}:${routeKey}`;

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    callbackRef.current = onRouteChange;
  }, [onRouteChange]);

  useEffect(() => {
    const requestPoints = uniquePoints(pointsRef.current);
    if (!enabled || requestPoints.length < 2) return undefined;

    const controller = new AbortController();
    let active = true;
    const routingProvider = provider === 'google' ? 'google' : 'leaflet';

    resolveRoute(requestPoints, routingProvider, controller.signal)
      .then((resolvedRoute) => {
        if (!active) return;
        setResolved({ key: requestKey, route: resolvedRoute });
        callbackRef.current?.(resolvedRoute);
      })
      .catch((error) => {
        if (!active || controller.signal.aborted || error?.name === 'AbortError') return;
        const fallback = createFallbackRoute(requestPoints);
        setResolved({ key: requestKey, route: fallback });
        callbackRef.current?.(fallback);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, provider, requestKey]);

  const fallback = createFallbackRoute(points);
  return enabled && resolved.key === requestKey ? resolved.route : fallback;
}

function MapLoadingState({ height, className, style, ariaLabel }) {
  return (
    <div
      className={`map-view map-view--loading ${className}`}
      style={{ position: 'relative', height, borderRadius: 'inherit', overflow: 'hidden', background: '#e2e8f0', ...style }}
      role="region"
      aria-label={ariaLabel}
      aria-busy="true"
    >
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        color: '#475569',
        fontSize: 12,
        fontWeight: 700,
        background: 'linear-gradient(135deg, #e2e8f0, #f8fafc)',
      }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span>
        <span>Loading live map…</span>
      </div>
    </div>
  );
}

export default function MapView({
  mode = 'route',
  height = '320px',
  pickup,
  dropoff,
  pickupLat,
  pickupLng,
  dropLat,
  dropLng,
  origin,
  destination,
  originLat,
  originLng,
  destinationLat,
  destinationLng,
  rider,
  riderLat,
  riderLng,
  progress = 0,
  pins = [],
  selectedPinId = null,
  onPinClick,
  showRoute = true,
  routePhase = 'delivery',
  waypoints = [],
  className = '',
  style: styleProp = {},
  center = DEFAULT_MAP_CENTER,
  zoom,
  ariaLabel = 'Live operations map',
  onRouteChange,
  onProviderChange,
}) {
  const [provider, setProvider] = useState(() => GOOGLE_MAPS_API_KEY ? 'loading' : 'leaflet');
  const providerCallbackRef = useRef(onProviderChange);
  const googleErrorRef = useRef(false);

  const pickupPoint = asPoint(pickup) || pointFromLatLng(pickupLat, pickupLng);
  const dropPoint = asPoint(dropoff) || pointFromLatLng(dropLat, dropLng);
  const riderPoint = asPoint(rider) || pointFromLatLng(riderLat, riderLng);
  const explicitOrigin = asPoint(origin) || pointFromLatLng(originLat, originLng);
  const explicitDestination = asPoint(destination) || pointFromLatLng(destinationLat, destinationLng);
  const isPickupRoute = mode === 'pickup' || routePhase === 'pickup';
  const routeOrigin = explicitOrigin || (isPickupRoute ? riderPoint : pickupPoint);
  const routeDestination = explicitDestination || (isPickupRoute ? pickupPoint : dropPoint);
  const normalizedWaypoints = useMemo(() => uniquePoints(waypoints), [waypoints]);
  const routePoints = useMemo(
    () => uniquePoints([routeOrigin, ...normalizedWaypoints, routeDestination]),
    [routeDestination, routeOrigin, normalizedWaypoints],
  );
  const routeEnabled = showRoute && routePoints.length > 1;
  const routingProvider = provider === 'google' ? 'google' : 'leaflet';
  const route = useResolvedRoute(routePoints, routingProvider, routeEnabled, onRouteChange);
  const activeRiderPoint = riderPoint || pointAlongPath(route.path, progress);
  const routeProgress = riderPoint
    ? progressForPoint(route.path, riderPoint)
    : Number.isFinite(Number(progress)) ? Math.max(0, Math.min(1, Number(progress))) : 0;
  const firstPinPoint = pins.map(asPoint).find(Boolean);
  const mapCenter = asPoint(center) || routePoints[0] || firstPinPoint || DEFAULT_MAP_CENTER;
  const mapZoom = zoom ?? (mode === 'radar' ? 13 : 14);
  const showDropMarker = !isPickupRoute && Boolean(dropPoint);
  const wrapperClass = className;

  useEffect(() => {
    providerCallbackRef.current = onProviderChange;
  }, [onProviderChange]);

  useEffect(() => {
    providerCallbackRef.current?.(provider);
  }, [provider]);

  useEffect(() => {
    let active = true;
    if (!GOOGLE_MAPS_API_KEY) return undefined;

    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => {
        if (active) setProvider('google');
      })
      .catch(() => {
        if (active) setProvider('leaflet');
      });

    return () => {
      active = false;
    };
  }, []);

  const handleGoogleError = useCallback(() => {
    if (googleErrorRef.current) return;
    googleErrorRef.current = true;
    setProvider('leaflet');
    providerCallbackRef.current?.('leaflet');
  }, []);

  if (provider === 'loading') {
    return <MapLoadingState height={height} className={className} style={styleProp} ariaLabel={ariaLabel} />;
  }

  const commonProps = {
    mode,
    height,
    center: mapCenter,
    zoom: mapZoom,
    routePath: route.path,
    routeProgress,
    pickupPoint,
    dropPoint,
    showDropMarker,
    riderPoint: activeRiderPoint,
    pins,
    selectedPinId,
    onPinClick,
    showRoute: routeEnabled,
    className: wrapperClass,
    style: styleProp,
    ariaLabel,
  };

  return provider === 'google'
    ? <GoogleMap {...commonProps} onError={handleGoogleError} />
    : <LeafletMap {...commonProps} />;
}
