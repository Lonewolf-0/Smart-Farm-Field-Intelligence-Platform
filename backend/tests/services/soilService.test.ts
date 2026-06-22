import {
  analyzeSoilTrends,
  getSoilProperties,
  findLatestSoilByFieldIdService,
  findLatestSoilByCreatedAtService,
  getHistoryByFieldIdService,
  insertSoilDataService
} from '../../src/services/soilService';
import axios from 'axios';
import {
  findLatestSoilByFieldId,
  findLatestSoilByCreatedAt,
  getHistoryByFieldId,
  insertSoilData
} from '../../src/repositories/soilRepository';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

  describe('getSoilProperties', () => {
    const lat = 40.7128;
    const lon = -74.0060;

    it('should successfully fetch and map soil properties', async () => {
      const apiResponse = {
        data: {
          properties: {
            layers: [
              {
                name: 'phh2o',
                unit_measure: { d_factor: 10 },
                depths: [
                  { label: '0-5cm', values: { mean: 65 } }
                ]
              },
              {
                name: 'soc',
                unit_measure: { d_factor: 10 },
                depths: [
                  { label: '0-5cm', values: { mean: 250 } } // 25
                ]
              },
              {
                name: 'clay',
                unit_measure: { d_factor: 10 },
                depths: [
                  { label: '0-5cm', values: { mean: 450 } } // 45
                ]
              },
              {
                name: 'sand',
                unit_measure: { d_factor: 10 },
                depths: [
                  { label: '0-5cm', values: { mean: 300 } } // 30
                ]
              },
              {
                name: 'nitrogen',
                unit_measure: { d_factor: 100 },
                depths: [
                  { label: '0-5cm', values: { mean: 15 } } // 15
                ]
              }
            ]
          }
        }
      };

      mockedAxios.get.mockResolvedValueOnce(apiResponse);

      const result = await getSoilProperties(lat, lon);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(result.layers).toHaveLength(1);
      expect(result.layers[0]).toEqual({
        depthLabel: '0-5cm',
        ph: 6.5,
        organicCarbon: 25,
        clay: 45,
        sand: 30,
        nitrogen: 15,
        texture: 'Clay' // clay > 40
      });
    });

    it('should return empty layers if API returns empty or no layers', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { properties: {} } });
      const result = await getSoilProperties(lat, lon);
      expect(result.layers).toEqual([]);
    });

    it('should retry on failure and eventually succeed', async () => {
      const apiResponse = {
        data: {
          properties: {
            layers: [
              {
                name: 'phh2o',
                unit_measure: { d_factor: 10 },
                depths: [
                  { label: '0-5cm', values: { mean: 65 } }
                ]
              }
            ]
          }
        }
      };

      mockedAxios.get
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce(apiResponse);

      const result = await getSoilProperties(lat, lon);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(result.layers).toHaveLength(1);
      expect(result.layers[0].ph).toBe(6.5);
    });

    it('should fail after maximum retries', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(getSoilProperties(lat, lon, 2)).rejects.toThrow('Failed to fetch soil data: Network Error');
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith('SoilGrids API failed after 2 attempts:', 'Network Error');

      consoleSpy.mockRestore();
    });
  });

  describe('Repository Wrapper Services', () => {
    it('findLatestSoilByFieldIdService calls findLatestSoilByFieldId repository method', async () => {
      (findLatestSoilByFieldId as jest.Mock).mockResolvedValueOnce({ _id: '1', fieldId: 'test-field' });
      const result = await findLatestSoilByFieldIdService('test-field');
      expect(findLatestSoilByFieldId).toHaveBeenCalledWith('test-field');
      expect(result).toEqual({ _id: '1', fieldId: 'test-field' });
    });

    it('findLatestSoilByCreatedAtService calls findLatestSoilByCreatedAt repository method', async () => {
      (findLatestSoilByCreatedAt as jest.Mock).mockResolvedValueOnce({ _id: '1', fieldId: 'test-field' });
      const result = await findLatestSoilByCreatedAtService('test-field');
      expect(findLatestSoilByCreatedAt).toHaveBeenCalledWith('test-field');
      expect(result).toEqual({ _id: '1', fieldId: 'test-field' });
    });

    it('getHistoryByFieldIdService calls getHistoryByFieldId repository method', async () => {
      (getHistoryByFieldId as jest.Mock).mockResolvedValueOnce([{ _id: '1', fieldId: 'test-field' }]);
      const result = await getHistoryByFieldIdService('test-field');
      expect(getHistoryByFieldId).toHaveBeenCalledWith('test-field');
      expect(result).toEqual([{ _id: '1', fieldId: 'test-field' }]);
    });

    it('insertSoilDataService calls insertSoilData repository method', async () => {
      (insertSoilData as jest.Mock).mockResolvedValueOnce({ _id: '1' });
      const result = await insertSoilDataService('test-field', 2023, 'Spring', { test: 'data' });
      expect(insertSoilData).toHaveBeenCalledWith('test-field', 2023, 'Spring', { test: 'data' });
      expect(result).toEqual({ _id: '1' });
    });
  });
});
