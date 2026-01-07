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

export function calculateDistance(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number
): number {
  const distanceKm = haversineDistance(userLat, userLng, targetLat, targetLng);
  return distanceKm * 1000; // return in meters
}

export interface LocationPoint {
  lat: number;
  lng: number;
  accuracy: number;
  capturedAt: Date;
}

export interface ExpenseCalculationResult {
  kmClaimed: number;
  amountClaimed: number;
  status: "SUBMITTED" | "NEEDS_APPROVAL";
  exceptionReason: string | null;
  businessStartAt: Date | null;
  businessEndAt: Date | null;
}

export function calculateExpenseFromPoints(
  points: LocationPoint[],
  ratePerKm: number,
  maxAccuracyM: number = 80,
  maxTimeGapMinutes: number = 10
): ExpenseCalculationResult {
  if (points.length < 2) {
    return {
      kmClaimed: 0,
      amountClaimed: 0,
      status: "NEEDS_APPROVAL",
      exceptionReason: "Insufficient GPS data points (less than 2 points)",
      businessStartAt: points[0]?.capturedAt || null,
      businessEndAt: points[points.length - 1]?.capturedAt || null,
    };
  }

  let totalKm = 0;
  let validPointCount = 0;
  let hasSparseGaps = false;
  const exceptions: string[] = [];

  for (let i = 1; i < points.length; i++) {
    const prevPoint = points[i - 1];
    const currPoint = points[i];

    // Skip if accuracy is too poor
    if (prevPoint.accuracy > maxAccuracyM || currPoint.accuracy > maxAccuracyM) {
      continue;
    }

    // Check time gap
    const timeGapMs = currPoint.capturedAt.getTime() - prevPoint.capturedAt.getTime();
    const timeGapMinutes = timeGapMs / (1000 * 60);

    if (timeGapMinutes > maxTimeGapMinutes) {
      hasSparseGaps = true;
      continue;
    }

    // Calculate distance
    const distance = haversineDistance(
      prevPoint.lat,
      prevPoint.lng,
      currPoint.lat,
      currPoint.lng
    );

    totalKm += distance;
    validPointCount++;
  }

  if (validPointCount < 10) {
    exceptions.push(`Only ${validPointCount} valid GPS segments (minimum 10 required)`);
  }

  if (hasSparseGaps) {
    exceptions.push("GPS data has gaps exceeding 10 minutes");
  }

  const status = exceptions.length > 0 ? "NEEDS_APPROVAL" : "SUBMITTED";
  const exceptionReason = exceptions.length > 0 ? exceptions.join("; ") : null;

  return {
    kmClaimed: Math.round(totalKm * 100) / 100,
    amountClaimed: Math.round(totalKm * ratePerKm * 100) / 100,
    status,
    exceptionReason,
    businessStartAt: points[0]?.capturedAt || null,
    businessEndAt: points[points.length - 1]?.capturedAt || null,
  };
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getStartOfDay(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDay(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
