import { TripRecord, TripInvoice, TripDetention } from '../types';

export function calculateCommercials(trip: Partial<TripRecord>, totalWeightKg: number = 0, totalPackages: number = 0) {
  const calculationMode = trip.freightCalculationMode || 'Per KM';
  const approvedKm = Number(trip.approvedKm) || 0;
  const ratePerKm = Number(trip.ratePerKm) || 0;
  
  let basicFreight = Number(trip.basicFreight) || 0;

  if (calculationMode === 'Per KM') {
    // Only recalculate if not explicitly overridden or if basicFreight is 0
    if (!trip.isFreightOverridden) {
      basicFreight = Math.round(approvedKm * ratePerKm);
    }
  } else if (calculationMode === 'Per MT') {
    if (!trip.isFreightOverridden) {
      const weightMt = totalWeightKg / 1000;
      basicFreight = Math.round(weightMt * ratePerKm);
    }
  } else if (calculationMode === 'Per Package') {
    if (!trip.isFreightOverridden) {
      basicFreight = Math.round(totalPackages * ratePerKm);
    }
  }

  const loadingCharges = Number(trip.loadingCharges) || 0;
  const unloadingCharges = Number(trip.unloadingCharges) || 0;
  const tollCharges = Number(trip.tollCharges) || 0;
  const otherCharges = Number(trip.otherCharges) || 0;
  const discount = Number(trip.discount) || 0;

  const taxableAmount = Math.max(0, basicFreight + loadingCharges + unloadingCharges + tollCharges + otherCharges - discount);
  const gstRate = Number(trip.gstRate ?? 18);
  const gstAmount = Math.round(taxableAmount * (gstRate / 100) * 100) / 100;
  const totalAmount = Math.round((taxableAmount + gstAmount) * 100) / 100;

  return {
    basicFreight,
    taxableAmount,
    gstAmount,
    totalAmount,
  };
}

export function calculateConsignmentTotals(invoices: TripInvoice[]) {
  return invoices.reduce(
    (acc, inv) => {
      acc.totalValue += Number(inv.invoiceValue) || 0;
      acc.totalPackages += Number(inv.packageCount) || 0;
      acc.totalWeightKg += Number(inv.weightKg) || 0;
      return acc;
    },
    { totalValue: 0, totalPackages: 0, totalWeightKg: 0 }
  );
}

export function calculateDetention(
  arrivalDatetime: string,
  completionDatetime: string,
  freeHours: number = 5,
  detentionRatePerDay: number = 3500
): {
  totalHours: number;
  freeHours: number;
  chargeableHours: number;
  chargeableDays: number;
  detentionAmount: number;
} {
  if (!arrivalDatetime || !completionDatetime) {
    return {
      totalHours: 0,
      freeHours,
      chargeableHours: 0,
      chargeableDays: 0,
      detentionAmount: 0,
    };
  }

  const arrival = new Date(arrivalDatetime).getTime();
  const completion = new Date(completionDatetime).getTime();

  if (isNaN(arrival) || isNaN(completion) || completion <= arrival) {
    return {
      totalHours: 0,
      freeHours,
      chargeableHours: 0,
      chargeableDays: 0,
      detentionAmount: 0,
    };
  }

  const totalHours = Math.round(((completion - arrival) / (1000 * 60 * 60)) * 10) / 10;
  const chargeableHours = Math.max(0, Math.round((totalHours - freeHours) * 10) / 10);
  
  // Transport industry standard: 1 day slab per 24 hours of chargeable delay or fraction
  const chargeableDays = chargeableHours > 0 ? Math.ceil(chargeableHours / 24) : 0;
  const detentionAmount = chargeableDays * detentionRatePerDay;

  return {
    totalHours,
    freeHours,
    chargeableHours,
    chargeableDays,
    detentionAmount,
  };
}
