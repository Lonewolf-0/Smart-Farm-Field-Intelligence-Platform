describe("Soil Service - 100% Coverage", () => {
  let mockedAxios: any;

  beforeEach(() => {
    jest.resetModules();

    jest.doMock("axios", () => ({
      __esModule: true,
      default: {
        get: jest.fn(),
      },
    }));

    mockedAxios = require("axios").default;
  });

  //success
  it("should transform and merge same depth layers (covers depthMap.has true/false)", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        properties: {
          layers: [
            {
              name: "phh2o",
              unit_measure: { d_factor: 10 },
              depths: [{ label: "0-5cm", values: { mean: 65 } }],
            },
            {
              name: "clay",
              unit_measure: { d_factor: 1 },
              depths: [{ label: "0-5cm", values: { mean: 30 } }],
            },
            {
              name: "sand",
              unit_measure: { d_factor: 1 },
              depths: [{ label: "0-5cm", values: { mean: 60 } }],
            },
            {
              name: "soc", // 🔥 forces reuse → depthMap.has === true
              unit_measure: { d_factor: 1 },
              depths: [{ label: "0-5cm", values: { mean: 10 } }],
            },
            {
              name: "nitrogen",
              unit_measure: { d_factor: 100 },
              depths: [{ label: "0-5cm", values: { mean: 15 } }],
            },
          ],
        },
      },
    });

    const { getSoilProperties } = require("../../src/services/soilService");

    const result = await getSoilProperties(10, 20);

    expect(result.layers).toHaveLength(1);
    expect(result.layers[0]).toMatchObject({
      depthLabel: "0-5cm",
      ph: 6.5,
      clay: 30,
      sand: 60,
      nitrogen: 15,
    });
  });

  // meanVal undefined
  it("should skip undefined mean values", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        properties: {
          layers: [
            {
              name: "clay",
              unit_measure: { d_factor: 1 },
              depths: [
                { label: "0-5cm", values: {} }, // 🔥 mean undefined
              ],
            },
            {
              name: "sand",
              unit_measure: { d_factor: 1 },
              depths: [{ label: "0-5cm", values: { mean: 40 } }],
            },
          ],
        },
      },
    });

    const { getSoilProperties } = require("../../src/services/soilService");

    const result = await getSoilProperties(10, 20);

    expect(result.layers[0].clay).toBeNull();
    expect(result.layers[0].sand).toBe(40);
  });

  //  EMPTY LAYERS CASE
  it("should return empty layers if API returns no layers", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { properties: {} },
    });

    const { getSoilProperties } = require("../../src/services/soilService");

    const result = await getSoilProperties(10, 20);

    expect(result.layers).toEqual([]);
  });

  //  TEXTURE BRANCHES

  it("should assign all texture types", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        properties: {
          layers: [
            {
              name: "clay",
              unit_measure: { d_factor: 1 },
              depths: [
                { label: "0-5cm", values: { mean: 50 } }, // Clay
                { label: "5-15cm", values: { mean: 10 } }, // Sandy
                { label: "15-30cm", values: { mean: 20 } }, // Sandy loam
                { label: "30-45cm", values: { mean: 30 } }, // Loam (clay >= 25 & clay <= 40 & sand >= 20 & sand <= 45)
                { label: "45-60cm", values: { mean: 30 } }, // Loam (sand < 20)
                { label: "60-75cm", values: { mean: 30 } }, // Loam (sand > 45)
                { label: "75-90cm", values: { mean: 20 } }, // Loam (clay < 25)
              ],
            },
            {
              name: "sand",
              unit_measure: { d_factor: 1 },
              depths: [
                { label: "0-5cm", values: { mean: 20 } },
                { label: "5-15cm", values: { mean: 70 } },
                { label: "15-30cm", values: { mean: 60 } },
                { label: "30-45cm", values: { mean: 30 } },
                { label: "45-60cm", values: { mean: 10 } },
                { label: "60-75cm", values: { mean: 50 } },
                { label: "75-90cm", values: { mean: 30 } },
              ],
            },
          ],
        },
      },
    });

    const { getSoilProperties } = require("../../src/services/soilService");

    const result = await getSoilProperties(10, 20);

    expect(result.layers.length).toBe(7);
    expect(result.layers[0].texture).toBe("Clay");
    expect(result.layers[1].texture).toBe("Sandy");
    expect(result.layers[2].texture).toBe("Sandy Loam");
    expect(result.layers[3].texture).toBe("Loam");
    expect(result.layers[4].texture).toBe("Loam");
    expect(result.layers[5].texture).toBe("Loam");
    expect(result.layers[6].texture).toBe("Loam");
  });

  //  UNKNOWN TEXTURE (line 25)

  it("should return Unknown texture when clay and sand missing", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        properties: {
          layers: [
            {
              name: "soc",
              unit_measure: { d_factor: 1 },
              depths: [{ label: "0-5cm", values: { mean: 10 } }],
            },
          ],
        },
      },
    });

    const { getSoilProperties } = require("../../src/services/soilService");

    const result = await getSoilProperties(10, 20);

    expect(result.layers[0].texture).toBe("Unknown");
  });

  // DEFAULT FALLBACKS CASE (line 62, 95)
  it("should use default d_factor of 1 and Unknown label when missing in response", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        properties: {
          layers: [
            {
              name: "clay",
              // unit_measure is missing (defaults to d_factor 1)
              depths: [
                {
                  // label is missing (defaults to Unknown)
                  values: { mean: 35 }
                }
              ]
            }
          ]
        }
      }
    });

    const { getSoilProperties } = require("../../src/services/soilService");

    const result = await getSoilProperties(10, 20);

    expect(result.layers).toHaveLength(1);
    expect(result.layers[0]).toMatchObject({
      depthLabel: "Unknown",
      clay: 35,
      texture: "Unknown" // sand is missing, so texture is Unknown
    });
  });

  // RETRY SUCCESS

  it("should retry and execute delay", async () => {
    jest.useFakeTimers();

    mockedAxios.get
      .mockRejectedValueOnce(new Error("fail")) // triggers retry
      .mockResolvedValueOnce({
        data: { properties: { layers: [] } },
      });

    const { getSoilProperties } = require("../../src/services/soilService");

    const promise = getSoilProperties(10, 20, 2);

    await jest.advanceTimersByTimeAsync(2000);

    const result = await promise;

    expect(result.layers).toEqual([]);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  //  FINAL THROW AFTER RETRIES
  it("should throw error after all retries fail", async () => {
    mockedAxios.get.mockRejectedValue(new Error("API fail"));

    const { getSoilProperties } = require("../../src/services/soilService");

    await expect(getSoilProperties(10, 20, 2)).rejects.toThrow(
      "Failed to fetch soil data",
    );
  });

  it("should throw default error when retries is set to 0", async () => {
    const { getSoilProperties } = require("../../src/services/soilService");

    await expect(getSoilProperties(10, 20, 0)).rejects.toThrow(
      "Failed to fetch soil data",
    );
  });
});
