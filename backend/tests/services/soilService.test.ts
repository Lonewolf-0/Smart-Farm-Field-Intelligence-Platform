import {
  analyzeSoilTrends,
  findLatestSoilByFieldIdService,
  findLatestSoilByCreatedAtService,
  getHistoryByFieldIdService
} from '../../src/services/soilService';
import {
  findLatestSoilByFieldId,
  findLatestSoilByCreatedAt,
  getHistoryByFieldId
} from '../../src/repositories/soilRepository';

jest.mock('../../src/repositories/soilRepository', () => ({
  findLatestSoilByFieldId: jest.fn(),
  findLatestSoilByCreatedAt: jest.fn(),
  getHistoryByFieldId: jest.fn(),
  insertSoilData: jest.fn(),
}));

describe('Soil Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findLatestSoilByFieldIdService', () => {
    it('should call the repository function and return the result', async () => {
      const mockFieldId = 'field-123';
      const mockResult = { id: 1, field_id: mockFieldId, year: 2023, season: 'Spring', data: {} };
      (findLatestSoilByFieldId as jest.Mock).mockResolvedValue(mockResult);

      const result = await findLatestSoilByFieldIdService(mockFieldId);

      expect(findLatestSoilByFieldId).toHaveBeenCalledWith(mockFieldId);
      expect(result).toEqual(mockResult);
    });

    it('should return null if no soil data is found', async () => {
      const mockFieldId = 'field-123';
      (findLatestSoilByFieldId as jest.Mock).mockResolvedValue(null);

      const result = await findLatestSoilByFieldIdService(mockFieldId);

      expect(findLatestSoilByFieldId).toHaveBeenCalledWith(mockFieldId);
      expect(result).toBeNull();
    });
  });

  describe('findLatestSoilByCreatedAtService', () => {
    it('should call the repository function and return the result', async () => {
      const mockFieldId = 'field-123';
      const mockResult = { data: { layers: [] } };
      (findLatestSoilByCreatedAt as jest.Mock).mockResolvedValue(mockResult);

      const result = await findLatestSoilByCreatedAtService(mockFieldId);

      expect(findLatestSoilByCreatedAt).toHaveBeenCalledWith(mockFieldId);
      expect(result).toEqual(mockResult);
    });

    it('should return null if no soil data is found', async () => {
      const mockFieldId = 'field-123';
      (findLatestSoilByCreatedAt as jest.Mock).mockResolvedValue(null);

      const result = await findLatestSoilByCreatedAtService(mockFieldId);

      expect(findLatestSoilByCreatedAt).toHaveBeenCalledWith(mockFieldId);
      expect(result).toBeNull();
    });
  });

  describe('getHistoryByFieldIdService', () => {
    it('should call the repository function and return the result', async () => {
      const mockFieldId = 'field-123';
      const mockResult = {
        rows: [
          { id: 1, field_id: mockFieldId, year: 2023, season: 'Spring', data: {} },
          { id: 2, field_id: mockFieldId, year: 2022, season: 'Autumn', data: {} }
        ]
      };
      (getHistoryByFieldId as jest.Mock).mockResolvedValue(mockResult);

      const result = await getHistoryByFieldIdService(mockFieldId);

      expect(getHistoryByFieldId).toHaveBeenCalledWith(mockFieldId);
      expect(result).toEqual(mockResult);
    });
  });

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
