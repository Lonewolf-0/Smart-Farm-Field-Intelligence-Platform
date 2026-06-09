import { calculateIrrigation, getAWCFromTexture } from '../../src/services/irrigationService';
import { WeatherData } from '../../src/types';

describe('Irrigation Service', () => {
  describe('getAWCFromTexture', () => {
    it('returns correct AWC for soil types', () => {
      expect(getAWCFromTexture('clay')).toBe(175);
      expect(getAWCFromTexture('loam')).toBe(125);
      expect(getAWCFromTexture('sandy loam')).toBe(87.5);
      expect(getAWCFromTexture('sand')).toBe(62.5);
      expect(getAWCFromTexture('unknown')).toBe(125);
    });
  });

  describe('calculateIrrigation (Forward projection water balance logic)', () => {
    const mockWeather: WeatherData = {
      temperature: 25,
      humidity: 50,
      windSpeed: 5,
      rainfall: 0,
      forecast: [
        { date: 'd1', tempMax: 25, tempMin: 15, precipitation: 0, condition: 'Clear' },
        { date: 'd2', tempMax: 25, tempMin: 15, precipitation: 10, condition: 'Rain' },
      ],
    };

    it('calculates irrigation correctly with no rain', () => {
      const plan = calculateIrrigation(
        { texture: 'loam' }, // AWC 125, MAD 62.5
        { ...mockWeather, forecast: [] },
        [{ et0: 5, precipitation: 0 }] 
      );
      // latest ET0 = 5
      // projecting forward: 120 -> 115 -> 110...
      // Needs to drop by 120 - 62.5 = 57.5. At 5/day, it takes 12 days.
      expect(plan.nextIrrigationDays).toBe(12);
      expect(plan.dailyET).toBe(5);
    });
    
    it('uses fallback ET0 when nasaData is empty', () => {
      const plan = calculateIrrigation({ texture: 'loam' }, mockWeather, []);
      expect(plan.dailyET).toBe(3.0);
    });
  });
});
