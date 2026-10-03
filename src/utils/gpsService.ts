import { TripRecord, GpsTelemetry, GpsDiscrepancy } from '../types';

export interface RouteWaypoint {
  lat: number;
  lng: number;
  label: string;
  isToll?: boolean;
}

// Major corridor coordinates for realistic mapping
export const CORRIDOR_WAYPOINTS: Record<string, RouteWaypoint[]> = {
  // Pune DC - Delhi Okhla (PN-DL-001)
  'PN-DL-001': [
    { lat: 18.5204, lng: 73.8567, label: 'Pune Chakan DC (Origin)' },
    { lat: 19.9975, lng: 73.7898, label: 'Nashik Highway Toll', isToll: true },
    { lat: 21.1458, lng: 79.0882, label: 'Dhule Border Checkpost' },
    { lat: 22.7196, lng: 75.8577, label: 'Indore Bypass Toll', isToll: true },
    { lat: 26.2183, lng: 78.1828, label: 'Gwalior Ring Corridor' },
    { lat: 27.1767, lng: 78.0081, label: 'Agra-Lucknow Expressway Toll', isToll: true },
    { lat: 28.5355, lng: 77.2732, label: 'Delhi Okhla Hub (Destination)' },
  ],
  // NCR Tauru DC - Neemrana DC (ZON_624)
  'ZON_624': [
    { lat: 28.2146, lng: 76.9526, label: 'Tauru DC Hub (Origin)' },
    { lat: 28.2045, lng: 76.7328, label: 'Dharuhera Toll Plaza', isToll: true },
    { lat: 28.1833, lng: 76.6167, label: 'Rewari Bypass Junction' },
    { lat: 28.0667, lng: 76.4333, label: 'Bawal Industrial Corridor' },
    { lat: 27.9889, lng: 76.3889, label: 'Neemrana DC (Destination)' },
  ],
  // Pune Chakan - Bhiwandi Hub (PN-BHW-101)
  'PN-BHW-101': [
    { lat: 18.7500, lng: 73.8500, label: 'Chakan DC (Origin)' },
    { lat: 18.7300, lng: 73.6800, label: 'Talegaon Toll Plaza', isToll: true },
    { lat: 18.7550, lng: 73.3400, label: 'Khopoli Expressway Exit' },
    { lat: 19.0330, lng: 73.0297, label: 'Vashi Creek Toll', isToll: true },
    { lat: 19.2967, lng: 73.0631, label: 'Bhiwandi Hub (Destination)' },
  ],
  // Default corridor fallback
  'DEFAULT': [
    { lat: 28.6139, lng: 77.2090, label: 'Origin Hub' },
    { lat: 27.5000, lng: 76.8000, label: 'Corridor Toll Checkpoint', isToll: true },
    { lat: 26.9124, lng: 75.7873, label: 'Destination Hub' },
  ],
};

/**
 * Generates simulated real-time GPS telematics for a trip
 */
export function getSimulatedGpsTelemetry(trip: TripRecord): GpsTelemetry {
  const lane = trip.laneCode || 'ZON_624';
  const waypoints = CORRIDOR_WAYPOINTS[lane] || CORRIDOR_WAYPOINTS['DEFAULT'];

  // Calculate simulated progress based on trip status
  let progressPercent = 0;
  let geofenceStatus: GpsTelemetry['geofenceStatus'] = 'Idle at Hub';
  let speedKmH = 0;
  let ignition: 'ON' | 'OFF' = 'OFF';

  if (trip.status === 'Dispatched') {
    progressPercent = 10;
    geofenceStatus = 'Inside Origin';
    speedKmH = 12;
    ignition = 'ON';
  } else if (trip.status === 'In Transit') {
    progressPercent = 65;
    geofenceStatus = 'On Route';
    speedKmH = 58;
    ignition = 'ON';
  } else if (trip.status === 'Arrived') {
    progressPercent = 98;
    geofenceStatus = 'Inside Destination';
    speedKmH = 0;
    ignition = 'OFF';
  } else if (trip.status === 'Delivered' || trip.status === 'POD Received' || trip.status === 'Closed') {
    progressPercent = 100;
    geofenceStatus = 'Inside Destination';
    speedKmH = 0;
    ignition = 'OFF';
  }

  // Interpolate coordinates along waypoints
  const totalSegments = waypoints.length - 1;
  const floatIndex = (progressPercent / 100) * totalSegments;
  const lowerIndex = Math.min(Math.floor(floatIndex), totalSegments - 1);
  const upperIndex = Math.min(lowerIndex + 1, totalSegments);
  const segmentFraction = floatIndex - lowerIndex;

  const lat = waypoints[lowerIndex].lat + (waypoints[upperIndex].lat - waypoints[lowerIndex].lat) * segmentFraction;
  const lng = waypoints[lowerIndex].lng + (waypoints[upperIndex].lng - waypoints[lowerIndex].lng) * segmentFraction;

  // Auto-captured GPS geofence timestamps
  const bookingTime = new Date(trip.bookingDatetime || Date.now());
  const originArrivalTime = new Date(bookingTime.getTime() + 45 * 60000).toISOString().slice(0, 16);
  const originDepartureTime = new Date(bookingTime.getTime() + 180 * 60000).toISOString().slice(0, 16);
  const destArrivalTime = new Date(bookingTime.getTime() + 620 * 60000).toISOString().slice(0, 16);
  const destDepartureTime = new Date(bookingTime.getTime() + 850 * 60000).toISOString().slice(0, 16);

  const autoCapturedTimestamps = {
    originArrival: originArrivalTime,
    originDeparture: originDepartureTime,
    destinationArrival: trip.status === 'Arrived' || trip.status === 'Delivered' || trip.status === 'POD Received' ? destArrivalTime : undefined,
    destinationDeparture: trip.status === 'Delivered' || trip.status === 'POD Received' ? destDepartureTime : undefined,
  };

  // Compare manual entries in trip / detention against GPS timestamps
  const discrepancies: GpsDiscrepancy[] = [];

  // Check manual loading datetime vs GPS origin arrival
  if (trip.loadingDatetime && autoCapturedTimestamps.originArrival) {
    const manualMs = new Date(trip.loadingDatetime).getTime();
    const gpsMs = new Date(autoCapturedTimestamps.originArrival).getTime();
    const diffMins = Math.round(Math.abs(manualMs - gpsMs) / 60000);

    if (diffMins > 45) {
      discrepancies.push({
        milestone: 'Origin Arrival',
        manualTime: trip.loadingDatetime,
        gpsTime: autoCapturedTimestamps.originArrival,
        diffMinutes: diffMins,
        severity: diffMins > 90 ? 'red' : 'yellow',
        alertMessage: `GPS Telematics recorded Origin Gate Arrival at ${autoCapturedTimestamps.originArrival.replace('T', ' ')}, but manually entered loading schedule is ${trip.loadingDatetime.replace('T', ' ')} (${diffMins} minutes variance).`,
      });
    }
  }

  // Check existing detention records against GPS
  if (trip.detentionRecords && trip.detentionRecords.length > 0) {
    trip.detentionRecords.forEach((det) => {
      if (det.locationType === 'Origin' && det.arrivalDatetime && autoCapturedTimestamps.originArrival) {
        const manualMs = new Date(det.arrivalDatetime).getTime();
        const gpsMs = new Date(autoCapturedTimestamps.originArrival).getTime();
        const diffMins = Math.round(Math.abs(manualMs - gpsMs) / 60000);

        if (diffMins > 30) {
          discrepancies.push({
            milestone: 'Origin Arrival',
            manualTime: det.arrivalDatetime,
            gpsTime: autoCapturedTimestamps.originArrival,
            diffMinutes: diffMins,
            severity: diffMins > 60 ? 'red' : 'yellow',
            alertMessage: `Detention Arrival discrepancy: Manual gate entry log (${det.arrivalDatetime.replace('T', ' ')}) differs from GPS geofence timestamp (${autoCapturedTimestamps.originArrival.replace('T', ' ')}) by ${diffMins} minutes.`,
          });
        }
      }
    });
  }

  return {
    vehicleId: trip.vehicleId || 'VEH-001',
    vehicleNo: trip.vehicleId || 'MH12AB1234',
    latitude: Math.round(lat * 10000) / 10000,
    longitude: Math.round(lng * 10000) / 10000,
    currentAddress:
      geofenceStatus === 'Inside Origin'
        ? `${trip.origin} - Gate 2 Inward Bay`
        : geofenceStatus === 'Inside Destination'
        ? `${trip.destination} - Consignee Dock 4`
        : `NH-48 National Highway Corridor (${waypoints[lowerIndex].label} to ${waypoints[upperIndex].label})`,
    speedKmH,
    headingDeg: 42,
    ignition,
    odometerKm: Math.round((trip.approvedKm || 280) * (progressPercent / 100)),
    batteryPercent: 96,
    gsmSignalPercent: 92,
    lastPingDatetime: new Date().toISOString(),
    geofenceStatus,
    autoCapturedTimestamps,
    corridorProgressPercent: progressPercent,
    discrepancies,
  };
}
