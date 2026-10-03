import { TripRecord, CustomerMaster, VehicleMaster, DriverMaster, ValidationIssue } from '../types';
import { calculateConsignmentTotals } from './calculations';

export function runFullTripValidation(
  trip: Partial<TripRecord>,
  allTrips: TripRecord[],
  customer?: CustomerMaster,
  vehicle?: VehicleMaster,
  driver?: DriverMaster
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const totals = calculateConsignmentTotals(trip.invoices || []);

  // 1. Customer Validation
  if (!trip.customerId) {
    issues.push({
      severity: 'red',
      field: 'customerId',
      title: 'Customer Missing',
      message: 'A valid customer must be selected from the customer master.',
    });
  } else if (customer) {
    if (customer.status !== 'Active') {
      issues.push({
        severity: 'red',
        field: 'customerId',
        title: 'Customer Inactive / Suspended',
        message: `Customer "${customer.name}" is currently marked as Inactive. Commercial booking is blocked.`,
      });
    } else {
      issues.push({
        severity: 'green',
        field: 'customerId',
        title: 'Customer Verified',
        message: `Customer "${customer.name}" is active. GSTIN: ${customer.gstin}, Terms: ${customer.paymentTerms}.`,
      });
    }
  }

  // Customer Reference check (Warning if missing)
  if (!trip.customerReference || trip.customerReference.trim() === '') {
    issues.push({
      severity: 'yellow',
      field: 'customerReference',
      title: 'Customer Reference Missing',
      message: 'No Customer PO/DO/Reference specified. Recommended for accurate billing & POD tracking.',
    });
  }

  // 2. Route Validation
  if (!trip.routeId || !trip.origin || !trip.destination) {
    issues.push({
      severity: 'red',
      field: 'routeId',
      title: 'Route Incomplete',
      message: 'Origin, Destination and Route Lane must be selected.',
    });
  } else {
    if (trip.plannedKm && trip.approvedKm && Number(trip.plannedKm) !== Number(trip.approvedKm)) {
      issues.push({
        severity: 'yellow',
        field: 'plannedKm',
        title: 'Route KM Variance',
        message: `Planned KM (${trip.plannedKm} km) differs from Lane Approved KM (${trip.approvedKm} km). Reconciliation authorization required.`,
      });
    } else {
      issues.push({
        severity: 'green',
        field: 'routeId',
        title: 'Route & Lane Validated',
        message: `Lane ${trip.laneCode || 'N/A'} approved at ${trip.approvedKm} KM. Toll: ${trip.tollApplicable ? 'Applicable' : 'Exempt'}.`,
      });
    }
  }

  // 3. Vehicle Validation
  if (!trip.vehicleId) {
    issues.push({
      severity: 'yellow',
      field: 'vehicleId',
      title: 'Vehicle Not Assigned',
      message: 'Vehicle can remain unassigned in Draft, but is required for Vehicle Assigned / Dispatched status.',
    });
  } else if (vehicle) {
    // Check vehicle status
    if (vehicle.status === 'Under Maintenance') {
      issues.push({
        severity: 'red',
        field: 'vehicleId',
        title: 'Vehicle Under Maintenance',
        message: `Vehicle ${vehicle.vehicleNo} is currently in workshop / maintenance (${vehicle.currentLocation}). Cannot be booked.`,
      });
    } else if (vehicle.status === 'Inactive') {
      issues.push({
        severity: 'red',
        field: 'vehicleId',
        title: 'Vehicle Inactive / Document Expired',
        message: `Vehicle ${vehicle.vehicleNo} has expired compliance documents (Fitness Exp: ${vehicle.fitnessExpiry}). Cannot be dispatched.`,
      });
    } else if (vehicle.status === 'On Trip' && trip.status === 'Draft') {
      issues.push({
        severity: 'red',
        field: 'vehicleId',
        title: 'Vehicle Already On Trip',
        message: `Vehicle ${vehicle.vehicleNo} is currently executing another active transit. Check availability schedule.`,
      });
    } else {
      issues.push({
        severity: 'green',
        field: 'vehicleId',
        title: 'Vehicle Compliance Passed',
        message: `Vehicle ${vehicle.vehicleNo} is Available at ${vehicle.currentLocation}. GPS ${vehicle.gpsStatus} (${vehicle.gpsId}).`,
      });
    }

    // Vehicle Type vs Customer Approved Types
    if (customer && customer.approvedVehicleTypes && customer.approvedVehicleTypes.length > 0) {
      if (!customer.approvedVehicleTypes.includes(vehicle.vehicleType)) {
        issues.push({
          severity: 'yellow',
          field: 'vehicleTypeId',
          title: 'Vehicle Type Mismatch',
          message: `Vehicle type does not match ${customer.name}'s contracted approved vehicle list.`,
        });
      }
    }

    // Capacity Exceeded Check
    if (totals.totalWeightKg > vehicle.capacityKg) {
      issues.push({
        severity: 'red',
        field: 'capacityKg',
        title: 'Vehicle Capacity Exceeded!',
        message: `Consignment total weight (${totals.totalWeightKg.toLocaleString()} KG) exceeds vehicle payload capacity (${vehicle.capacityKg.toLocaleString()} KG / ${vehicle.capacityMt} MT). Overload is strictly prohibited!`,
      });
    } else if (totals.totalWeightKg > 0) {
      const utilPercent = Math.round((totals.totalWeightKg / vehicle.capacityKg) * 100);
      issues.push({
        severity: 'green',
        field: 'capacityKg',
        title: 'Weight Within Capacity Limit',
        message: `Payload weight is ${totals.totalWeightKg.toLocaleString()} KG of ${vehicle.capacityKg.toLocaleString()} KG (${utilPercent}% capacity utilization).`,
      });
    }
  }

  // 4. Driver Validation
  if (!trip.driverId) {
    issues.push({
      severity: 'yellow',
      field: 'driverId',
      title: 'Driver Not Assigned',
      message: 'Driver can be assigned during vehicle placement before dispatch.',
    });
  } else if (driver) {
    if (driver.status === 'Suspended') {
      issues.push({
        severity: 'red',
        field: 'driverId',
        title: 'Driver Suspended / Blacklisted',
        message: `Driver ${driver.name} is Suspended from BOW operations. Cannot be assigned.`,
      });
    } else if (driver.status === 'On Leave') {
      issues.push({
        severity: 'red',
        field: 'driverId',
        title: 'Driver On Leave',
        message: `Driver ${driver.name} is recorded as On Leave in the driver roster.`,
      });
    }

    // License expiry check
    const today = new Date().toISOString().split('T')[0];
    if (driver.licenseExpiry && driver.licenseExpiry < today) {
      issues.push({
        severity: 'red',
        field: 'driverId',
        title: 'Driver License Expired',
        message: `Driver ${driver.name}'s commercial driving license expired on ${driver.licenseExpiry}. Assignment blocked.`,
      });
    }

    // Driver mobile check
    const cleanedMobile = driver.mobile.replace(/\D/g, '');
    if (cleanedMobile.length < 10) {
      issues.push({
        severity: 'red',
        field: 'driverMobile',
        title: 'Invalid Driver Mobile',
        message: 'Driver mobile number must be a valid 10-digit contact for GPS tracking & driver app.',
      });
    } else {
      issues.push({
        severity: 'green',
        field: 'driverId',
        title: 'Driver Verified',
        message: `Driver ${driver.name} has active DL (${driver.licenseNo}) and valid contact (+91 ${driver.mobile}).`,
      });
    }
  }

  // 5. Consignment & Invoices Validation
  const invoices = trip.invoices || [];
  if (invoices.length === 0) {
    issues.push({
      severity: 'yellow',
      field: 'invoices',
      title: 'No Invoices Added',
      message: 'Trip has no invoices attached. Add at least one invoice and E-Way Bill before dispatch.',
    });
  } else {
    // Check duplicates within the trip
    const invNumbers = new Set<string>();
    const ewbNumbers = new Set<string>();
    const todayStr = new Date().toISOString().split('T')[0];

    invoices.forEach((inv, idx) => {
      const invNoUpper = (inv.invoiceNo || '').trim().toUpperCase();
      const ewbNoUpper = (inv.ewaybillNo || '').trim().toUpperCase();

      if (!invNoUpper) {
        issues.push({
          severity: 'red',
          field: `invoice_${idx}`,
          title: `Invoice #${idx + 1} Missing Number`,
          message: 'Invoice number cannot be blank.',
        });
      } else {
        if (invNumbers.has(invNoUpper)) {
          issues.push({
            severity: 'red',
            field: `invoice_${idx}`,
            title: 'Duplicate Invoice Detected',
            message: `Invoice "${inv.invoiceNo}" is entered more than once in this consignment.`,
          });
        }
        invNumbers.add(invNoUpper);
      }

      // Check duplicate E-Way bill inside trip
      if (ewbNoUpper) {
        if (ewbNumbers.has(ewbNoUpper)) {
          issues.push({
            severity: 'red',
            field: `ewb_${idx}`,
            title: 'Duplicate E-Way Bill in Booking',
            message: `E-Way Bill "${inv.ewaybillNo}" is repeated across multiple rows.`,
          });
        }
        ewbNumbers.add(ewbNoUpper);

        // Check E-Way Bill Expiry & Government Verification Status
        if (inv.ewaybillValidTill && inv.ewaybillValidTill < todayStr) {
          issues.push({
            severity: 'red',
            field: `ewb_${idx}`,
            title: '🔴 Red Alert: E-Way Bill Expired!',
            message: `E-Way Bill ${inv.ewaybillNo} expired on ${inv.ewaybillValidTill}. Cargo movement is strictly prohibited under GST Section 129.`,
          });
        }

        if (inv.ewbGovtVerification) {
          if (inv.ewbGovtVerification.status === 'EXPIRED') {
            issues.push({
              severity: 'red',
              field: `ewb_${idx}`,
              title: '🔴 Red Alert: E-Way Bill Expired on Govt Portal',
              message: `NIC Govt E-Way Bill portal confirmed that EWB ${inv.ewaybillNo} expired on ${inv.ewbGovtVerification.validUpto}. Booking confirmation blocked until active EWB is provided.`,
            });
          } else if (inv.ewbGovtVerification.status === 'INVALID') {
            issues.push({
              severity: 'red',
              field: `ewb_${idx}`,
              title: '🔴 Red Alert: Invalid E-Way Bill on Govt Portal',
              message: `E-Way Bill ${inv.ewaybillNo} was rejected by Government database verification. ${inv.ewbGovtVerification.validationErrors.join(', ')}`,
            });
          } else if (inv.ewbGovtVerification.status === 'CANCELLED') {
            issues.push({
              severity: 'red',
              field: `ewb_${idx}`,
              title: '🔴 Red Alert: E-Way Bill Cancelled by Consignor',
              message: `Government portal reports EWB ${inv.ewaybillNo} has been cancelled. Generate new EWB before booking.`,
            });
          } else if (inv.ewbGovtVerification.vehicleNoMatches === false) {
            issues.push({
              severity: 'red',
              field: `ewb_${idx}`,
              title: '🔴 Red Alert: EWB Vehicle Number Mismatch',
              message: `E-Way Bill is endorsed for vehicle [${inv.ewbGovtVerification.vehicleNo}] on portal, but trip vehicle is [${trip.vehicleId || 'Unassigned'}]. Update Part-B prior to confirmation.`,
            });
          } else if (inv.ewbGovtVerification.status === 'ACTIVE') {
            issues.push({
              severity: 'green',
              field: `ewb_${idx}`,
              title: 'Government E-Way Bill Active & Verified',
              message: `EWB ${inv.ewaybillNo} verified with Govt NIC Portal (Valid upto: ${inv.ewbGovtVerification.validUpto}, Distance: ${inv.ewbGovtVerification.approxDistanceKm} KM).`,
            });
          }
        }
      }

      // Check high value invoice alert
      if (inv.invoiceValue > 5000000) {
        issues.push({
          severity: 'yellow',
          field: `invoice_${idx}`,
          title: 'High Value Cargo (> ₹50 Lakh)',
          message: `Invoice ${inv.invoiceNo} has declared value of ₹${inv.invoiceValue.toLocaleString()}. Ensure special transit insurance is endorsed.`,
        });
      }
    });

    // Check duplicate invoices across other trips in WTMS
    allTrips.forEach((otherTrip) => {
      if (otherTrip.id !== trip.id && otherTrip.status !== 'Cancelled') {
        otherTrip.invoices?.forEach((otherInv) => {
          if (invNumbers.has(otherInv.invoiceNo.trim().toUpperCase())) {
            issues.push({
              severity: 'red',
              field: 'invoices',
              title: 'Duplicate Invoice in Another Trip',
              message: `Invoice "${otherInv.invoiceNo}" is already booked on active Trip ${otherTrip.id} (${otherTrip.status}).`,
            });
          }
        });
      }
    });
  }

  // 6. Commercial Validation
  if (trip.rateCardOverrides && trip.rateCardOverrides.length > 0) {
    trip.rateCardOverrides.forEach((ovr) => {
      issues.push({
        severity: 'yellow',
        field: ovr.field,
        title: `Customer Rate Card Override: ${ovr.field}`,
        message: `Standard contract rate of ₹${ovr.standardValue} was modified to ₹${ovr.overriddenValue}. Justification: "${ovr.justification}" (Authorized by ${ovr.authorizedBy}).`,
      });
    });
  } else if (trip.isFreightOverridden) {
    issues.push({
      severity: 'yellow',
      field: 'basicFreight',
      title: 'Freight Manually Overridden',
      message: `Standard formula freight was overridden to ₹${Number(trip.basicFreight).toLocaleString()}. Reason: ${trip.freightOverrideReason || 'Not stated'}.`,
    });
  }

  if (customer && trip.detentionRatePerDay && trip.detentionRatePerDay !== customer.defaultDetentionRate) {
    issues.push({
      severity: 'yellow',
      field: 'detentionRatePerDay',
      title: 'Detention Rate Differs from Customer Default',
      message: `Detention rate (₹${trip.detentionRatePerDay}/day) differs from customer contract rate (₹${customer.defaultDetentionRate}/day).`,
    });
  }

  // 7. GPS Telematics & Geofence Consistency Validation
  if (trip.gpsTelemetry?.discrepancies && trip.gpsTelemetry.discrepancies.length > 0) {
    trip.gpsTelemetry.discrepancies.forEach((disc) => {
      issues.push({
        severity: disc.severity,
        field: 'gpsTelemetry',
        title: `GPS Discrepancy: ${disc.milestone} (${disc.diffMinutes} mins)`,
        message: disc.alertMessage,
      });
    });
  }

  return issues;
}
