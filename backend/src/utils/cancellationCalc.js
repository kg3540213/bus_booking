/**
 * Calculate refund and cancellation fees based on departure time and policy tiers
 * 
 * Policy Tiers:
 * > 24 hours prior: 90% refund (10% fee)
 * 12 to 24 hours prior: 50% refund (50% fee)
 * 2 to 12 hours prior: 25% refund (75% fee)
 * < 2 hours prior: 0% refund (100% fee)
 */
function calculateCancellationRefund(departureTime, totalFare, policies = []) {
  const depTime = new Date(departureTime).getTime();
  const now = Date.now();
  const diffHours = (depTime - now) / (1000 * 60 * 60);

  if (diffHours < 0) {
    return {
      canCancel: false,
      reason: 'Cannot cancel a trip that has already departed',
      hoursBeforeDeparture: 0,
      refundPercentage: 0,
      cancellationFee: Number(totalFare),
      refundAmount: 0,
      policyId: null,
      policyDescription: 'Trip already departed'
    };
  }

  let matchedPolicy = null;

  if (policies && policies.length > 0) {
    for (const p of policies) {
      const min = p.hours_before_departure_min;
      const max = p.hours_before_departure_max;
      if (max === null || max === undefined) {
        if (diffHours >= min) {
          matchedPolicy = p;
          break;
        }
      } else {
        if (diffHours >= min && diffHours < max) {
          matchedPolicy = p;
          break;
        }
      }
    }
  }

  // Fallback defaults if no policies passed
  if (!matchedPolicy) {
    if (diffHours >= 24) {
      matchedPolicy = { id: 1, refund_percentage: 90.0, deduction_percentage: 10.0, description: 'More than 24h prior: 90% refund' };
    } else if (diffHours >= 12) {
      matchedPolicy = { id: 2, refund_percentage: 50.0, deduction_percentage: 50.0, description: '12h to 24h prior: 50% refund' };
    } else if (diffHours >= 2) {
      matchedPolicy = { id: 3, refund_percentage: 25.0, deduction_percentage: 75.0, description: '2h to 12h prior: 25% refund' };
    } else {
      matchedPolicy = { id: 4, refund_percentage: 0.0, deduction_percentage: 100.0, description: 'Less than 2h prior: Non-refundable' };
    }
  }

  const refundPct = Number(matchedPolicy.refund_percentage);
  const fare = Number(totalFare);
  const refundAmount = Math.round((fare * (refundPct / 100)) * 100) / 100;
  const cancellationFee = Math.round((fare - refundAmount) * 100) / 100;

  return {
    canCancel: true,
    hoursBeforeDeparture: Math.round(diffHours * 100) / 100,
    refundPercentage: refundPct,
    deductionPercentage: Number(matchedPolicy.deduction_percentage),
    refundAmount,
    cancellationFee,
    policyId: matchedPolicy.id || null,
    policyDescription: matchedPolicy.description
  };
}

module.exports = { calculateCancellationRefund };

