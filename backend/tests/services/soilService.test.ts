import axios from 'axios';
import { analyzeSoilTrends, getSoilProperties } from '../../src/services/soilService';

jest.mock('axios', () => {
  const mockAxios = {
    get: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockAxios,
    ...mockAxios,
  };
});

describe('Soil Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSoilProperties', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should aggregate depths and map values correctly for a happy path', async () => {
      const mockApiData = {
        properties: {
          layers: [
            {
              name: 'phh2o',
              unit_measure: { d_factor: 10 },
              depths: [
                { label: '0-5cm', values: { mean: 65 } },
                { label: '5-15cm', values: { mean: 68 } }
              ]
            },
            {
              name: 'soc',
              unit_measure: { d_factor: 10 },
              depths: [
                { label: '0-5cm', values: { mean: 150 } },
              ]
            },
            {
              name: 'clay',
              unit_measure: { d_factor: 10 },
              depths: [
                { label: '0-5cm', values: { mean: 300 } }, // 30%
              ]
            },
            {
              name: 'sand',
              unit_measure: { d_factor: 10 },
              depths: [
                { label: '0-5cm', values: { mean: 300 } }, // 30%
              ]
            },
            {
              name: 'nitrogen',
              unit_measure: { d_factor: 100 }, // usually d_factor isn't used since we bypass it
              depths: [
                { label: '0-5cm', values: { mean: 250 } },
              ]
            }
          ]
        }
      };

      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockApiData });

      const result = await getSoilProperties(45.0, 10.0);

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(result.layers).toHaveLength(2); // '0-5cm' and '5-15cm'

      const layer0 = result.layers.find(l => l.depthLabel === '0-5cm');
      expect(layer0).toBeDefined();
      expect(layer0?.ph).toBe(6.5); // 65 / 10
      expect(layer0?.organicCarbon).toBe(15); // 150 / 10
      expect(layer0?.clay).toBe(30); // 300 / 10
      expect(layer0?.sand).toBe(30); // 300 / 10
      expect(layer0?.nitrogen).toBe(250); // 250
      expect(layer0?.texture).toBe('Loam'); // 30% clay, 30% sand -> Loam

      const layer1 = result.layers.find(l => l.depthLabel === '5-15cm');
      expect(layer1).toBeDefined();
      expect(layer1?.ph).toBe(6.8); // 68 / 10
      expect(layer1?.organicCarbon).toBeNull(); // missing
      expect(layer1?.texture).toBe('Unknown'); // missing clay/sand -> Unknown
    });

    it('should return empty layers if properties.layers is empty or undefined', async () => {
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: { properties: {} } });

      const result = await getSoilProperties(45.0, 10.0);

      expect(result).toEqual({ layers: [] });
    });

    it('should retry when API fails and succeed on second attempt', async () => {
      jest.useFakeTimers();

      (axios.get as jest.Mock)
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({ data: { properties: { layers: [] } } });

      const promise = getSoilProperties(45.0, 10.0);

      // Fast-forward past the 1 second delay
      await Promise.resolve(); // Allow the rejection to be caught
      jest.advanceTimersByTime(1000);

      const result = await promise;

      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ layers: [] });

      jest.useRealTimers();
    });

    it('should throw an error if all retries fail', async () => {
      jest.useFakeTimers();

      (axios.get as jest.Mock).mockRejectedValue(new Error('Persistent Network Error'));

      const promise = getSoilProperties(45.0, 10.0, 3);

      // Fast-forward past all retry delays
      for (let i = 0; i < 3; i++) {
        await Promise.resolve(); // Let the rejection be caught
        jest.advanceTimersByTime(3000); // Wait up to 3 seconds for safety
      }

      await expect(promise).rejects.toThrow('Failed to fetch soil data: Persistent Network Error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'SoilGrids API failed after 3 attempts:',
        'Persistent Network Error'
      );
      expect(axios.get).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
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
