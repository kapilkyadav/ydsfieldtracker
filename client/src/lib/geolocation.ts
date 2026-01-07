export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export async function getCurrentPosition(highAccuracy = true): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let message = "Unknown geolocation error";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out. Please try again.";
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

export function getAccuracyStatus(accuracy: number): "good" | "moderate" | "poor" {
  if (accuracy <= 30) return "good";
  if (accuracy <= 80) return "moderate";
  return "poor";
}

export function getAccuracyColor(accuracy: number): string {
  const status = getAccuracyStatus(accuracy);
  switch (status) {
    case "good":
      return "text-green-600 dark:text-green-400";
    case "moderate":
      return "text-yellow-600 dark:text-yellow-400";
    case "poor":
      return "text-red-600 dark:text-red-400";
  }
}

export function getAccuracyBgColor(accuracy: number): string {
  const status = getAccuracyStatus(accuracy);
  switch (status) {
    case "good":
      return "bg-green-100 dark:bg-green-900/30";
    case "moderate":
      return "bg-yellow-100 dark:bg-yellow-900/30";
    case "poor":
      return "bg-red-100 dark:bg-red-900/30";
  }
}

export function formatAccuracy(accuracy: number): string {
  return `${Math.round(accuracy)}m`;
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function isWithinGeofence(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  radiusMeters: number
): boolean {
  const distanceKm = haversineDistance(userLat, userLng, targetLat, targetLng);
  const distanceMeters = distanceKm * 1000;
  return distanceMeters <= radiusMeters;
}
