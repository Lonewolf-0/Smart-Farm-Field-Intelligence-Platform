describe("NDVI Service", () => {
  let mockedAxios: any;

  const polygon: any = {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [1, 1],
        [1, 0],
        [0, 0],
      ],
    ],
  };

  beforeEach(() => {
    jest.resetModules();

    //  mock axios (ESM safe)
    jest.doMock("axios", () => ({
      __esModule: true,
      default: {
        post: jest.fn(),
      },
    }));

    //  mock token service
    jest.doMock("../../src/services/sentinelAuthService", () => ({
      getSentinelAccessToken: jest.fn().mockResolvedValue("fake-token"),
    }));

    mockedAxios = require("axios").default;
  });

  //  SUCCESS

  it("should process NDVI data successfully", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        data: [
          {
            interval: { to: "2024-01-01" },
            outputs: {
              default: {
                bands: {
                  B0: {
                    stats: {
                      mean: 200,
                      sampleCount: 100,
                      noDataCount: 0,
                    },
                    histogram: {
                      bins: [
                        { lowEdge: 100, count: 30 },
                        { lowEdge: 210, count: 70 },
                      ],
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });

    const { getNDVIData } = require("../../src/services/ndviService");

    const result = await getNDVIData(polygon, 30);

    expect(result).toHaveProperty("averageNDVI");
    expect(result).toHaveProperty("healthScore");
    expect(result).toHaveProperty("stressZones");
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  // FALLBACK (no data → recurse)

  it("should fallback to 90 days when no data", async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              interval: { to: "2024-01-01" },
              outputs: {
                default: {
                  bands: {
                    B0: {
                      stats: {
                        mean: 180,
                        sampleCount: 100,
                        noDataCount: 0,
                      },
                      histogram: {
                        bins: [{ lowEdge: 200, count: 100 }],
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      });

    const { getNDVIData } = require("../../src/services/ndviService");

    const result = await getNDVIData(polygon, 30);

    expect(result).toBeDefined();
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  //  FALLBACK (no validDays)

  it("should fallback when no validDays", async () => {
    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              outputs: {
                default: {
                  bands: {
                    B0: {
                      stats: {
                        sampleCount: 10,
                        noDataCount: 10, // invalid
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              interval: { to: "2024-01-01" },
              outputs: {
                default: {
                  bands: {
                    B0: {
                      stats: {
                        mean: 150,
                        sampleCount: 100,
                        noDataCount: 0,
                      },
                      histogram: {
                        bins: [{ lowEdge: 100, count: 100 }],
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      });

    const { getNDVIData } = require("../../src/services/ndviService");

    const result = await getNDVIData(polygon, 30);

    expect(result).toBeDefined();
  });

  //  ERROR AFTER 90 DAYS

  it("should throw error when no imagery after 90 days", async () => {
    mockedAxios.post.mockResolvedValue({
      data: { data: [] },
    });

    const { getNDVIData } = require("../../src/services/ndviService");

    await expect(getNDVIData(polygon, 90)).rejects.toThrow(
      "Failed to process satellite imagery.",
    );
  });

  //  HEALTH SCORE BRANCH

  it("should calculate healthScore correctly", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        data: [
          {
            interval: { to: "2024-01-01" },
            outputs: {
              default: {
                bands: {
                  B0: {
                    stats: {
                      mean: 255,
                      sampleCount: 100,
                      noDataCount: 0,
                    },
                    histogram: {
                      bins: [{ lowEdge: 210, count: 100 }],
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });

    const { getNDVIData } = require("../../src/services/ndviService");

    const result = await getNDVIData(polygon, 30);

    expect(result.healthScore).toBe(100);
  });

  //  AXIOS ERROR

  it("should throw error when axios fails", async () => {
    mockedAxios.post.mockRejectedValue(new Error("API Error"));

    const { getNDVIData } = require("../../src/services/ndviService");

    await expect(getNDVIData(polygon, 30)).rejects.toThrow(
      "Failed to process satellite imagery.",
    );
  });

  //  ZERO PIXELS SAFE CASE

  it("should handle zero total pixels safely", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        data: [
          {
            interval: { to: "2024-01-01" },
            outputs: {
              default: {
                bands: {
                  B0: {
                    stats: {
                      mean: 150,
                      sampleCount: 10, //  valid day
                      noDataCount: 0,
                    },
                    histogram: {
                      bins: [], //  empty histogram
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });

    const { getNDVIData } = require("../../src/services/ndviService");

    const result = await getNDVIData(polygon, 30);

    expect(result.stressZones).toEqual([0, 0]);
  });
});
