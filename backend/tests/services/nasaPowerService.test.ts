describe("Nasa Power Service", () => {
  let mockedAxios: any;

  const mockApiResponse = {
    data: {
      properties: {
        parameter: {
          T2M: {
            "20240101": 25,
            "20240102": -999,
          },
          T2M_MAX: {
            "20240101": 30,
            "20240102": 28,
          },
          T2M_MIN: {
            "20240101": 20,
            "20240102": -999,
          },
          PRECTOTCORR: {
            "20240101": 5,
            "20240102": -999,
          },
          ALLSKY_SFC_SW_DWN: {
            "20240101": 10,
            "20240102": -999,
          },
        },
      },
    },
  };

  beforeEach(() => {
    jest.resetModules();

    // ✅ FIXED MOCK
    jest.doMock("axios", () => ({
      __esModule: true,
      default: {
        get: jest.fn(),
      },
    }));

    mockedAxios = require("axios").default;
  });

  it("should fetch and transform nasa data", async () => {
    mockedAxios.get.mockResolvedValueOnce(mockApiResponse);

    const { getNasaPowerData } = require("../../src/services/nasaPowerService");

    const result = await getNasaPowerData(10, 20, "20240101", "20240102");

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
  });

  it("should return cached data if within TTL", async () => {
    mockedAxios.get.mockResolvedValue(mockApiResponse);

    const { getNasaPowerData } = require("../../src/services/nasaPowerService");

    await getNasaPowerData(10, 20, "20240101", "20240102");
    await getNasaPowerData(10, 20, "20240101", "20240102");

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("should throw error when properties missing", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} });

    const { getNasaPowerData } = require("../../src/services/nasaPowerService");

    await expect(
      getNasaPowerData(10, 20, "20240101", "20240102"),
    ).rejects.toThrow("Failed to fetch evapotranspiration data");
  });

  it("should throw error when axios fails", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

    const { getNasaPowerData } = require("../../src/services/nasaPowerService");

    await expect(
      getNasaPowerData(10, 20, "20240101", "20240102"),
    ).rejects.toThrow("Failed to fetch evapotranspiration data");
  });

  it("should handle tmax < tmin", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        properties: {
          parameter: {
            T2M: { "20240101": 20 },
            T2M_MAX: { "20240101": 10 },
            T2M_MIN: { "20240101": 15 },
            PRECTOTCORR: { "20240101": 0 },
            ALLSKY_SFC_SW_DWN: { "20240101": 5 },
          },
        },
      },
    });

    const { getNasaPowerData } = require("../../src/services/nasaPowerService");

    const result = await getNasaPowerData(10, 20, "20240101", "20240101");

    expect(result[0].et0).toBeGreaterThanOrEqual(0);
  });

  it("should refetch after cache expires", async () => {
    mockedAxios.get.mockResolvedValue(mockApiResponse);

    const nowSpy = jest.spyOn(Date, "now");

    nowSpy.mockReturnValueOnce(0);

    const { getNasaPowerData } = require("../../src/services/nasaPowerService");

    await getNasaPowerData(10, 20, "20240101", "20240102");

    nowSpy.mockReturnValueOnce(25 * 60 * 60 * 1000);

    await getNasaPowerData(10, 20, "20240101", "20240102");

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });
});
``;
