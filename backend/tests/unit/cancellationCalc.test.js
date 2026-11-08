const { calculateCancellationRefund } = require('../../src/utils/cancellationCalc');

describe('Unit Tests: Cancellation and Refund Rules Engine', () => {
  const policies = [
    { id: 1, hours_before_departure_min: 24, hours_before_departure_max: null, refund_percentage: 90.00, deduction_percentage: 10.00, description: '> 24h: 90% refund' },
    { id: 2, hours_before_departure_min: 12, hours_before_departure_max: 24, refund_percentage: 50.00, deduction_percentage: 50.00, description: '12h to 24h: 50% refund' },
    { id: 3, hours_before_departure_min: 2, hours_before_departure_max: 12, refund_percentage: 25.00, deduction_percentage: 75.00, description: '2h to 12h: 25% refund' },
    { id: 4, hours_before_departure_min: 0, hours_before_departure_max: 2, refund_percentage: 0.00, deduction_percentage: 100.00, description: '< 2h: Non-refundable' },
  ];

  test('Policy Tier 1: > 24 hours prior grants 90% refund and 10% fee', () => {
    // 30 hours in future
    const departure = new Date(Date.now() + 30 * 3600 * 1000).toISOString();
    const result = calculateCancellationRefund(departure, 1000, policies);

    expect(result.canCancel).toBe(true);
    expect(result.refundPercentage).toBe(90);
    expect(result.refundAmount).toBe(900);
    expect(result.cancellationFee).toBe(100);
  });

  test('Policy Tier 2: 12 to 24 hours prior grants 50% refund and 50% fee', () => {
    // 16 hours in future
    const departure = new Date(Date.now() + 16 * 3600 * 1000).toISOString();
    const result = calculateCancellationRefund(departure, 1200, policies);

    expect(result.canCancel).toBe(true);
    expect(result.refundPercentage).toBe(50);
    expect(result.refundAmount).toBe(600);
    expect(result.cancellationFee).toBe(600);
  });

  test('Policy Tier 3: 2 to 12 hours prior grants 25% refund and 75% fee', () => {
    // 5 hours in future
    const departure = new Date(Date.now() + 5 * 3600 * 1000).toISOString();
    const result = calculateCancellationRefund(departure, 2000, policies);

    expect(result.canCancel).toBe(true);
    expect(result.refundPercentage).toBe(25);
    expect(result.refundAmount).toBe(500);
    expect(result.cancellationFee).toBe(1500);
  });

  test('Policy Tier 4: < 2 hours prior grants 0% refund and 100% fee', () => {
    // 1 hour in future
    const departure = new Date(Date.now() + 1 * 3600 * 1000).toISOString();
    const result = calculateCancellationRefund(departure, 800, policies);

    expect(result.canCancel).toBe(true);
    expect(result.refundPercentage).toBe(0);
    expect(result.refundAmount).toBe(0);
    expect(result.cancellationFee).toBe(800);
  });

  test('Negative Case: Past departure cannot be cancelled', () => {
    // 2 hours in the past
    const departure = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    const result = calculateCancellationRefund(departure, 1000, policies);

    expect(result.canCancel).toBe(false);
    expect(result.refundAmount).toBe(0);
    expect(result.cancellationFee).toBe(1000);
  });
});

