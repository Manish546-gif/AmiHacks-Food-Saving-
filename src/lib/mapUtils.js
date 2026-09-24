const GOOGLE_MAPS_SCRIPT_TIMEOUT_MS = 12000;
const ROUTE_REQUEST_TIMEOUT_MS = 8000;
const OSRM_ROUTE_BASE = 'https://router.project-osrm.org/route/v1/driving/';

let googleMapsPromise = null;
const routeRequestCache = new Map();
const ROUTE_CACHE_TTL_MS = 5 * 60 * 1000;

export const DEFAULT_MAP_CENTER = Object.freeze({ lat: 25.2138, lng: 75.8648 });

export const MAP_MARKER_STYLES = Object.freeze({
  donor: { color: '#fc8019', label: 'D' },
  restaurant: { color: '#fc8019', label: 'D' },
  individual: { color: '#fc8019', label: 'D' },
  shelter: { color: '#006e16', label: 'S' },
  recipient: { color: '#006e16', label: 'S' },
  rider: { color: '#2563eb', label: 'R' },
  pickup: { color: '#fc8019', label: 'P' },
  dropoff: { color: '#006e16', label: 'G' },
});

export function getMarkerStyle(type) {
  const normalizedType = String(type || 'donor').toLowerCase();
  return MAP_MARKER_STYLES[normalizedType] || MAP_MARKER_STYLES.donor;
}

export function pointFromLatLng(lat, lng) {
  if (lat === null || lat === undefined || lat === '' || lng === null || lng === undefined || lng === '') {
    return null;
  }

  const numericLat = Number(lat);
  const numericLng = Number(lng);

  if (!Number.isFinite(numericLat) || !Number.isFinite(numericLng)) return null;
  if (numericLat < -90 || numericLat > 90 || numericLng < -180 || numericLng > 180) return null;

  return { lat: numericLat, lng: numericLng };
}

export function asPoint(value) {
  if (!value) return null;
  if (Array.isArray(value)) return pointFromLatLng(value[0], value[1]);

  const lat = typeof value.lat === 'function' ? value.lat() : value.lat;
  const lng = typeof value.lng === 'function' ? value.lng() : value.lng;
  return pointFromLatLng(lat, lng);
}

export function uniquePoints(points = []) {
  return points
    .map(asPoint)
    .filter(Boolean)
    .filter((point, index, list) => index === 0 || point.lat !== list[index - 1].lat || point.lng !== list[index - 1].lng);
}

export function pathKey(points = []) {
  return uniquePoints(points)
    .map(point => `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`)
    .join(';');
}

export function distanceKm(first, second) {
  if (!first || !second) return 0;
  const earthRadiusKm = 6371;
  const latitudeDelta = (second.lat - first.lat) * Math.PI / 180;
  const longitudeDelta = (second.lng - first.lng) * Math.PI / 180;
  const firstLatitude = first.lat * Math.PI / 180;
  const secondLatitude = second.lat * Math.PI / 180;
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.asin(Math.sqrt(haversine));
}

export function pathDistanceKm(points = []) {
  return points.reduce((total, point, index) => {
    if (index === 0) return total;
    return total + distanceKm(points[index - 1], point);
  }, 0);
}

export function clampProgress(progress) {
  const numericProgress = Number(progress);
  if (!Number.isFinite(numericProgress)) return 0;
  return Math.max(0, Math.min(1, numericProgress));
}

export function pointAlongPath(points = [], progress = 0) {
  const path = uniquePoints(points);
  if (path.length === 0) return null;
  if (path.length === 1) return path[0];

  const targetDistance = pathDistanceKm(path) * clampProgress(progress);
  let travelled = 0;

  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    const segmentDistance = distanceKm(start, end);
    const remaining = targetDistance - travelled;

    if (remaining <= segmentDistance || index === path.length - 1) {
      const ratio = segmentDistance === 0 ? 1 : Math.max(0, Math.min(1, remaining / segmentDistance));
      return pointFromLatLng(
        start.lat + (end.lat - start.lat) * ratio,
        start.lng + (end.lng - start.lng) * ratio,
      );
    }

    travelled += segmentDistance;
  }

  return path[path.length - 1];
}

export function splitPath(points = [], progress = 0) {
  const path = uniquePoints(points);
  if (path.length < 2) return path;
  if (clampProgress(progress) <= 0) return [path[0]];
  if (clampProgress(progress) >= 1) return path;

  const targetDistance = pathDistanceKm(path) * clampProgress(progress);
  const result = [path[0]];
  let travelled = 0;

  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    const segmentDistance = distanceKm(start, end);
    const remaining = targetDistance - travelled;

    if (remaining <= segmentDistance) {
      const ratio = segmentDistance === 0 ? 1 : Math.max(0, Math.min(1, remaining / segmentDistance));
      result.push(pointFromLatLng(
        start.lat + (end.lat - start.lat) * ratio,
        start.lng + (end.lng - start.lng) * ratio,
      ));
      return uniquePoints(result);
    }

    result.push(end);
    travelled += segmentDistance;
  }

  return result;
}

export function progressForPoint(points = [], target) {
  const path = uniquePoints(points);
  const targetPoint = asPoint(target);
  if (path.length < 2 || !targetPoint) return 0;

  const totalDistance = pathDistanceKm(path);
  if (totalDistance === 0) return 0;

  const latitudeScale = 111.32;
  const longitudeScale = 111.32 * Math.cos(targetPoint.lat * Math.PI / 180);
  let travelled = 0;
  let nearestDistance = Infinity;
  let nearestProgress = 0;

  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    const startX = (start.lng - path[0].lng) * longitudeScale;
    const startY = (start.lat - path[0].lat) * latitudeScale;
    const endX = (end.lng - path[0].lng) * longitudeScale;
    const endY = (end.lat - path[0].lat) * latitudeScale;
    const targetX = (targetPoint.lng - path[0].lng) * longitudeScale;
    const targetY = (targetPoint.lat - path[0].lat) * latitudeScale;
    const segmentX = endX - startX;
    const segmentY = endY - startY;
    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
    const ratio = segmentLengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((targetX - startX) * segmentX + (targetY - startY) * segmentY) / segmentLengthSquared));
    const candidate = {
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio,
    };
    const candidateDistance = distanceKm(candidate, targetPoint);

    if (candidateDistance < nearestDistance) {
      nearestDistance = candidateDistance;
      nearestProgress = clampProgress((travelled + distanceKm(start, candidate)) / totalDistance);
    }

    travelled += distanceKm(start, end);
  }

  return nearestProgress;
}

export function loadGoogleMaps(apiKey) {
  if (typeof window === 'undefined' || !apiKey) {
    return Promise.reject(new Error('Google Maps is not configured'));
  }

  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    let settled = false;
    let pollTimer = null;
    let timeoutTimer = null;
    const script = document.createElement('script');

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      if (pollTimer) window.clearTimeout(pollTimer);
      if (timeoutTimer) window.clearTimeout(timeoutTimer);
      callback(value);
    };

    const checkLoaded = () => {
      if (window.google?.maps?.Map) {
        finish(resolve, window.google.maps);
        return;
      }
      if (!settled) pollTimer = window.setTimeout(checkLoaded, 80);
    };

    const fail = () => finish(reject, new Error('Google Maps failed to load'));

    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry&v=weekly&loading=async`;
    script.onload = checkLoaded;
    script.onerror = fail;
    timeoutTimer = window.setTimeout(fail, GOOGLE_MAPS_SCRIPT_TIMEOUT_MS);
    document.head.appendChild(script);
    checkLoaded();
  });

  googleMapsPromise.catch(() => {
    googleMapsPromise = null;
  });

  return googleMapsPromise;
}

function extractGooglePath(route) {
  const overviewPath = route?.overview_path;
  if (Array.isArray(overviewPath) && overviewPath.length > 0) {
    return overviewPath.map(asPoint).filter(Boolean);
  }

  const path = [];
  route?.legs?.forEach((leg) => {
    leg.steps?.forEach((step) => {
      step.path?.forEach((point) => {
        const normalized = asPoint(point);
        if (normalized) path.push(normalized);
      });
    });
  });
  return uniquePoints(path);
}

function requestGoogleRoute(points, signal) {
  return new Promise((resolve, reject) => {
    const maps = window.google?.maps;
    if (!maps?.DirectionsService) {
      reject(new Error('Google Directions is unavailable'));
      return;
    }

    let settled = false;
    const service = new maps.DirectionsService();
    const timeoutTimer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Google route request timed out'));
      }
    }, ROUTE_REQUEST_TIMEOUT_MS);

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutTimer);
      callback(value);
    };

    const request = {
      origin: points[0],
      destination: points[points.length - 1],
      travelMode: maps.TravelMode?.DRIVING || 'DRIVING',
      waypoints: points.slice(1, -1).map((location) => ({ location, stopover: false })),
    };

    try {
      service.route(request, (result, status) => {
        if (signal?.aborted) {
          finish(reject, new Error('Route request cancelled'));
          return;
        }
        if (status !== 'OK' || !result?.routes?.[0]) {
          finish(reject, new Error('Google route unavailable'));
          return;
        }

        const path = extractGooglePath(result.routes[0]);
        if (path.length < 2) {
          finish(reject, new Error('Google route path unavailable'));
          return;
        }

        const distanceMeters = result.routes[0].legs?.reduce(
          (total, leg) => total + (leg.distance?.value || 0),
          0,
        );
        const durationSeconds = result.routes[0].legs?.reduce(
          (total, leg) => total + (leg.duration?.value || 0),
          0,
        );

        finish(resolve, {
          path,
          distanceMeters,
          durationSeconds,
          source: 'google',
        });
      });
    } catch (error) {
      finish(reject, error);
    }
  });
}

async function requestOsrmRoute(points, signal) {
  if (typeof fetch !== 'function') throw new Error('Route service is unavailable');
  const coordinates = points.map((point) => `${point.lng},${point.lat}`).join(';');
  const url = `${OSRM_ROUTE_BASE}${coordinates}?overview=full&geometries=geojson&steps=false`;
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error('Route service request failed');
  const payload = await response.json();
  const route = payload.routes?.[0];
  const coordinatesPath = route?.geometry?.coordinates;
  if (!Array.isArray(coordinatesPath) || coordinatesPath.length < 2) {
    throw new Error('Route service path unavailable');
  }

  const path = coordinatesPath.map(([lng, lat]) => pointFromLatLng(lat, lng)).filter(Boolean);
  return {
    path,
    distanceMeters: Number.isFinite(Number(route.distance)) ? Number(route.distance) : null,
    durationSeconds: Number.isFinite(Number(route.duration)) ? Number(route.duration) : null,
    source: 'osrm',
  };
}

function normalizeRouteResult(result) {
  const path = uniquePoints(result?.path || []);
  if (path.length < 2) return null;
  return {
    ...result,
    path,
    distanceMeters: Number.isFinite(Number(result.distanceMeters))
      ? Number(result.distanceMeters)
      : pathDistanceKm(path) * 1000,
  };
}

function requestRouteWithoutCancellation(points, provider) {
  return (async () => {
    if (provider === 'google') {
      try {
        const googleResult = await requestGoogleRoute(points);
        const normalizedGoogleResult = normalizeRouteResult(googleResult);
        if (normalizedGoogleResult) return normalizedGoogleResult;
      } catch {
        try {
          const osrmResult = await requestOsrmRoute(points);
          const normalizedOsrmResult = normalizeRouteResult(osrmResult);
          if (normalizedOsrmResult) return normalizedOsrmResult;
        } catch {
          return { path: points, source: 'straight' };
        }
      }
    }

    try {
      const result = await requestOsrmRoute(points);
      return normalizeRouteResult(result) || { path: points, source: 'straight' };
    } catch {
      return { path: points, source: 'straight' };
    }
  })();
}

export async function resolveRoute(points = [], provider = 'leaflet', signal) {
  const normalizedPoints = uniquePoints(points);
  const fallback = {
    path: normalizedPoints,
    distanceMeters: pathDistanceKm(normalizedPoints) * 1000,
    durationSeconds: null,
    source: 'straight',
  };

  if (normalizedPoints.length < 2 || provider === 'straight') return fallback;

  const cacheKey = `${provider}:${pathKey(normalizedPoints)}`;
  const cachedRequest = routeRequestCache.get(cacheKey);
  if (cachedRequest) {
    const cachedResult = await cachedRequest;
    if (signal?.aborted) throw new Error('Route request cancelled');
    return {
      ...cachedResult,
      distanceMeters: Number.isFinite(Number(cachedResult.distanceMeters))
        ? Number(cachedResult.distanceMeters)
        : pathDistanceKm(cachedResult.path) * 1000,
    };
  }

  const request = requestRouteWithoutCancellation(normalizedPoints, provider);
  routeRequestCache.set(cacheKey, request);

  try {
    const result = await request;
    if (signal?.aborted) throw new Error('Route request cancelled');
    if (result.source === 'straight') {
      if (routeRequestCache.get(cacheKey) === request) routeRequestCache.delete(cacheKey);
    } else {
      const evictionTimer = globalThis.setTimeout(() => {
        if (routeRequestCache.get(cacheKey) === request) routeRequestCache.delete(cacheKey);
      }, ROUTE_CACHE_TTL_MS);
      evictionTimer?.unref?.();
    }
    return {
      ...result,
      path: uniquePoints(result.path),
      distanceMeters: Number.isFinite(Number(result.distanceMeters))
        ? Number(result.distanceMeters)
        : pathDistanceKm(result.path) * 1000,
    };
  } catch (error) {
    if (routeRequestCache.get(cacheKey) === request) routeRequestCache.delete(cacheKey);
    if (signal?.aborted || error?.name === 'AbortError') throw error;
    return fallback;
  }
}
