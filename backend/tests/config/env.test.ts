describe("ENV Config", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  // SUCCESS CASE (all env present)
  it("should load all required environment variables", () => {
    process.env.DB_HOST = "localhost";
    process.env.DB_PORT = "5432";
    process.env.DB_NAME = "test_db";
    process.env.DB_USER = "user";
    process.env.DB_PASSWORD = "pass";
    process.env.JWT_SECRET = "secret";
    process.env.OPENWEATHER_API_KEY = "key";
    process.env.OPENWEATHER_BASE_URL = "url";

    const { ENV } = require("../../src/config/env");

    expect(ENV.DB_HOST).toBe("localhost");
    expect(ENV.DB_PORT).toBe("5432");
    expect(ENV.DB_NAME).toBe("test_db");
    expect(ENV.DB_USER).toBe("user");
    expect(ENV.DB_PASSWORD).toBe("pass");
    expect(ENV.JWT_SECRET).toBe("secret");
    expect(ENV.OPENWEATHER_API_KEY).toBe("key");
    expect(ENV.OPENWEATHER_BASE_URL).toBe("url");
  });

  //Default port
  it("should use default port if PORT not set", () => {
    process.env.DB_HOST = "h";
    process.env.DB_PORT = "p";
    process.env.DB_NAME = "n";
    process.env.DB_USER = "u";
    process.env.DB_PASSWORD = "pw";
    process.env.JWT_SECRET = "s";
    process.env.OPENWEATHER_API_KEY = "k";
    process.env.OPENWEATHER_BASE_URL = "url";

    delete process.env.PORT;

    const { ENV } = require("../../src/config/env");

    expect(ENV.PORT).toBe("5000");
  });

  it("should use provided sentinel values", () => {
    process.env.DB_HOST = "h";
    process.env.DB_PORT = "p";
    process.env.DB_NAME = "n";
    process.env.DB_USER = "u";
    process.env.DB_PASSWORD = "pw";
    process.env.JWT_SECRET = "s";
    process.env.OPENWEATHER_API_KEY = "k";
    process.env.OPENWEATHER_BASE_URL = "url";

    process.env.SENTINEL_HUB_CLIENT_ID = "custom_id";
    process.env.SENTINEL_HUB_CLIENT_SECRET = "custom_secret";

    const { ENV } = require("../../src/config/env");

    expect(ENV.SENTINEL_HUB_CLIENT_ID).toBe("custom_id");
    expect(ENV.SENTINEL_HUB_CLIENT_SECRET).toBe("custom_secret");
  });

  it("should throw error if required env is missing", () => {
    process.env.DB_HOST = "";

    expect(() => {
      require("../../src/config/env");
    }).toThrow("Missing environment variable: DB_HOST");
  });

  it("should throw error for another missing env key", () => {
    process.env.DB_HOST = "h";
    process.env.DB_PORT = "p";
    process.env.DB_NAME = "n";
    process.env.DB_USER = "";

    expect(() => {
      require("../../src/config/env");
    }).toThrow("Missing environment variable: DB_USER");
  });
  it("should fallback to default sentinel values when env is missing", () => {
    jest.resetModules();

    // ✅ disable dotenv
    jest.doMock("dotenv", () => ({
      config: jest.fn(),
    }));

    //  clean env completely
    process.env = {
      DB_HOST: "h",
      DB_PORT: "p",
      DB_NAME: "n",
      DB_USER: "u",
      DB_PASSWORD: "pw",
      JWT_SECRET: "s",
      OPENWEATHER_API_KEY: "k",
      OPENWEATHER_BASE_URL: "url",
    };

    const { ENV } = require("../../src/config/env");

    expect(ENV.SENTINEL_HUB_CLIENT_ID).toBe("your_client_id");
    expect(ENV.SENTINEL_HUB_CLIENT_SECRET).toBe("your_client_secret");
  });
});
