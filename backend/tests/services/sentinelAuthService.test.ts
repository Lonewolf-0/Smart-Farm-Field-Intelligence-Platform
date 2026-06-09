describe("SentinelAuthService", () => {
  let mockedAxios: any;
  let originalEnv: any;

  beforeEach(() => {
    jest.resetModules();

    // mock axios
    jest.doMock("axios", () => ({
      __esModule: true,
      default: {
        post: jest.fn(),
      },
    }));

    // mock ENV
    originalEnv = {
      SENTINEL_HUB_CLIENT_ID: "test_client_id",
      SENTINEL_HUB_CLIENT_SECRET: "test_client_secret",
    };

    jest.doMock("../../src/config/env", () => ({
      ENV: originalEnv,
    }));

    mockedAxios = require("axios").default;
  });

  //  SUCCESS (fetch token)

  it("should fetch and return token successfully", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        access_token: "token123",
        expires_in: 3600,
        token_type: "Bearer",
      },
    });

    const {
      getSentinelAccessToken,
    } = require("../../src/services/sentinelAuthService");

    const token = await getSentinelAccessToken();

    expect(token).toBe("token123");
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  //  CACHE HIT

  it("should return cached token if not expired", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        access_token: "cached_token",
        expires_in: 3600,
        token_type: "Bearer",
      },
    });

    const {
      getSentinelAccessToken,
    } = require("../../src/services/sentinelAuthService");

    const first = await getSentinelAccessToken();
    const second = await getSentinelAccessToken();

    expect(first).toBe("cached_token");
    expect(second).toBe("cached_token");

    //  axios called ONLY once because of cache
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  //  CACHE EXPIRED

  it("should refetch token after expiry", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        access_token: "token1",
        expires_in: 1, // expire fast
        token_type: "Bearer",
      },
    });

    const nowSpy = jest.spyOn(Date, "now");

    nowSpy.mockReturnValueOnce(0); // first fetch

    const {
      getSentinelAccessToken,
    } = require("../../src/services/sentinelAuthService");

    await getSentinelAccessToken();

    // expire after
    nowSpy.mockReturnValueOnce(2000);

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: "token2",
        expires_in: 3600,
        token_type: "Bearer",
      },
    });

    const token2 = await getSentinelAccessToken();

    expect(token2).toBe("token2");
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  //  INVALID ENV WARNING

  it("should log warning for invalid env config", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    jest.doMock("../../src/config/env", () => ({
      ENV: {
        SENTINEL_HUB_CLIENT_ID: "your_client_id",
        SENTINEL_HUB_CLIENT_SECRET: "your_client_secret",
      },
    }));

    jest.resetModules();

    mockedAxios = require("axios").default;
    mockedAxios.post.mockResolvedValue({
      data: {
        access_token: "token",
        expires_in: 3600,
      },
    });

    const {
      getSentinelAccessToken,
    } = require("../../src/services/sentinelAuthService");

    await getSentinelAccessToken();

    expect(warnSpy).toHaveBeenCalled();
  });

  // API ERROR

  it("should throw error when axios fails", async () => {
    mockedAxios.post.mockRejectedValue(new Error("API Error"));

    const {
      getSentinelAccessToken,
    } = require("../../src/services/sentinelAuthService");

    await expect(getSentinelAccessToken()).rejects.toThrow(
      "SENTINEL_HUB_AUTH_ERROR",
    );
  });

  //  ERROR WITH RESPONSE DATA

  it("should handle axios error with response data", async () => {
    mockedAxios.post.mockRejectedValue({
      response: {
        data: { message: "Invalid credentials" },
      },
    });

    const {
      getSentinelAccessToken,
    } = require("../../src/services/sentinelAuthService");

    await expect(getSentinelAccessToken()).rejects.toThrow(
      "SENTINEL_HUB_AUTH_ERROR",
    );
  });
});
