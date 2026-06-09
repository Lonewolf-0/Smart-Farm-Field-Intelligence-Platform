import { analyzeSoilTrends } from '../../src/services/soilService';

describe('Soil Service', () => {
  describe('analyzeSoilTrends', () => {
    it('should generate an alert for pH drop > 0.3', () => {
      const records = [
        { year: 2023, data: { layers: [{ ph: 5.0 }] } }, // newest
        { year: 2022, data: { layers: [{ ph: 5.5 }] } }  // oldest
      ];
      const alerts = analyzeSoilTrends(records);
      expect(alerts).toContainEqual(expect.objectContaining({ type: 'pH', severity: 'warning' }));
    });

    it('should generate an alert for Organic Carbon drop > 0.2%', () => {
      const records = [
        { year: 2023, data: { layers: [{ organicCarbon: 10 }] } }, // newest
        { year: 2022, data: { layers: [{ organicCarbon: 40 }] } }  // oldest
      ];
      const alerts = analyzeSoilTrends(records);
      expect(alerts).toContainEqual(expect.objectContaining({ type: 'Organic Carbon', severity: 'critical' }));
    });

    it('should generate an alert for Nitrogen drop > 5', () => {
      const records = [
        { year: 2023, data: { layers: [{ nitrogen: 10 }] } }, // newest
        { year: 2022, data: { layers: [{ nitrogen: 20 }] } }  // oldest
      ];
      const alerts = analyzeSoilTrends(records);
      expect(alerts).toContainEqual(expect.objectContaining({ type: 'Nitrogen', severity: 'warning' }));
    });

    it('should not generate alerts if trends are stable', () => {
      const records = [
        { year: 2023, data: { layers: [{ ph: 6.5, organicCarbon: 25, nitrogen: 20 }] } }, // newest
        { year: 2022, data: { layers: [{ ph: 6.6, organicCarbon: 26, nitrogen: 22 }] } }  // oldest
      ];
      const alerts = analyzeSoilTrends(records);
      expect(alerts.length).toBe(0);
    });
  });
});
