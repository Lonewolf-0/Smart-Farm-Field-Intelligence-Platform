import {
  calculateDistance,
  getAllBranchesService,
  getBranchByIdService,
  getBranchPricesService,
  findNearestBranches
} from '../../src/services/branchService';
import {
  getAllBranchesFromDb,
  getBranchByIdFromDb,
  getBranchPricesFromDb,
  getNearestBranchesFromDb
} from '../../src/repositories/branchRepository';

// Mock the repository functions
jest.mock('../../src/repositories/branchRepository', () => ({
  getAllBranchesFromDb: jest.fn(),
  getBranchByIdFromDb: jest.fn(),
  getBranchPricesFromDb: jest.fn(),
  getNearestBranchesFromDb: jest.fn(),
}));

describe('Branch Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateDistance', () => {
    it('should return 0 for identical coordinates', () => {
      const lat = 51.5074;
      const lng = -0.1278; // London
      const distance = calculateDistance(lat, lng, lat, lng);
      expect(distance).toBe(0);
    });

    it('should calculate the distance between two different coordinates correctly', () => {
      // London to Paris
      const lat1 = 51.5074;
      const lng1 = -0.1278;
      const lat2 = 48.8566;
      const lng2 = 2.3522;

      const distance = calculateDistance(lat1, lng1, lat2, lng2);

      // Known distance is approx 344 km
      expect(distance).toBeCloseTo(343.5, 0); // Tolerance of 1 km
    });

    it('should calculate symmetric distance', () => {
      const lat1 = 51.5074;
      const lng1 = -0.1278;
      const lat2 = 48.8566;
      const lng2 = 2.3522;

      const distance1 = calculateDistance(lat1, lng1, lat2, lng2);
      const distance2 = calculateDistance(lat2, lng2, lat1, lng1);

      expect(distance1).toBe(distance2);
    });
  });

  describe('getAllBranchesService', () => {
    it('should call getAllBranchesFromDb and return the result', async () => {
      const mockBranches = [
        { id: '1', name: 'Branch 1' },
        { id: '2', name: 'Branch 2' },
      ];
      (getAllBranchesFromDb as jest.Mock).mockResolvedValue(mockBranches);

      const result = await getAllBranchesService();

      expect(getAllBranchesFromDb).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBranches);
    });
  });

  describe('getBranchByIdService', () => {
    it('should call getBranchByIdFromDb with the correct id and return the result', async () => {
      const branchId = '123';
      const mockBranch = { id: branchId, name: 'Test Branch' };
      (getBranchByIdFromDb as jest.Mock).mockResolvedValue(mockBranch);

      const result = await getBranchByIdService(branchId);

      expect(getBranchByIdFromDb).toHaveBeenCalledTimes(1);
      expect(getBranchByIdFromDb).toHaveBeenCalledWith(branchId);
      expect(result).toEqual(mockBranch);
    });

    it('should return null if branch is not found', async () => {
      const branchId = '999';
      (getBranchByIdFromDb as jest.Mock).mockResolvedValue(null);

      const result = await getBranchByIdService(branchId);

      expect(getBranchByIdFromDb).toHaveBeenCalledTimes(1);
      expect(getBranchByIdFromDb).toHaveBeenCalledWith(branchId);
      expect(result).toBeNull();
    });
  });

  describe('getBranchPricesService', () => {
    it('should call getBranchPricesFromDb with the correct id and return the result', async () => {
      const branchId = '123';
      const mockPrices = { "products": [{ "name": "Fertilizer A", "price": 50 }] };
      (getBranchPricesFromDb as jest.Mock).mockResolvedValue(mockPrices);

      const result = await getBranchPricesService(branchId);

      expect(getBranchPricesFromDb).toHaveBeenCalledTimes(1);
      expect(getBranchPricesFromDb).toHaveBeenCalledWith(branchId);
      expect(result).toEqual(mockPrices);
    });

    it('should return null if branch prices are not found', async () => {
      const branchId = '999';
      (getBranchPricesFromDb as jest.Mock).mockResolvedValue(null);

      const result = await getBranchPricesService(branchId);

      expect(getBranchPricesFromDb).toHaveBeenCalledTimes(1);
      expect(getBranchPricesFromDb).toHaveBeenCalledWith(branchId);
      expect(result).toBeNull();
    });
  });

  describe('findNearestBranches', () => {
    it('should call getNearestBranchesFromDb with the correct parameters and map the result', async () => {
      const lat = 51.5074;
      const lng = -0.1278;
      const limit = 3;

      const mockRows = [
        {
          id: '1',
          name: 'Branch 1',
          latitude: 51.5,
          longitude: -0.1,
          address: 'Address 1',
          phone: '111',
          services: ['Service 1'],
          products: ['Product 1'],
          distance: 2.5
        },
        {
          id: '2',
          name: 'Branch 2',
          latitude: 51.6,
          longitude: -0.2,
          address: 'Address 2',
          phone: '222',
          services: ['Service 2'],
          products: ['Product 2'],
          distance: 10.1
        }
      ];

      (getNearestBranchesFromDb as jest.Mock).mockResolvedValue(mockRows);

      const result = await findNearestBranches(lat, lng, limit);

      expect(getNearestBranchesFromDb).toHaveBeenCalledTimes(1);
      expect(getNearestBranchesFromDb).toHaveBeenCalledWith(lat, lng, limit);

      // Expected output mapping
      const expectedBranches = mockRows.map(row => ({
        id: row.id,
        name: row.name,
        latitude: row.latitude,
        longitude: row.longitude,
        address: row.address,
        phone: row.phone,
        services: row.services,
        products: row.products,
        distance: row.distance,
      }));

      expect(result).toEqual(expectedBranches);
    });

    it('should use default limit of 5 if not provided', async () => {
      const lat = 51.5074;
      const lng = -0.1278;

      (getNearestBranchesFromDb as jest.Mock).mockResolvedValue([]);

      const result = await findNearestBranches(lat, lng);

      expect(getNearestBranchesFromDb).toHaveBeenCalledTimes(1);
      expect(getNearestBranchesFromDb).toHaveBeenCalledWith(lat, lng, 5);
      expect(result).toEqual([]);
    });
  });
});
