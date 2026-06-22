import winston from "winston";

describe("logger", () => {
  const originalEnv = process.env.NODE_ENV;
  let loggerInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // We must mock winston *inside* each test to properly isolate the import
    loggerInstance = {
      add: jest.fn(),
    };

    const mockCreateLogger = jest.fn(() => loggerInstance);
    const mockTransports = {
      File: jest.fn(),
      Console: jest.fn(),
    };
    const mockFormat = {
      combine: jest.fn(),
      timestamp: jest.fn(),
      json: jest.fn(),
      colorize: jest.fn(),
      simple: jest.fn(),
    };

    jest.doMock("winston", () => ({
      createLogger: mockCreateLogger,
      transports: mockTransports,
      format: mockFormat,
    }));
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("should create logger with file transports and NOT add console transport when NODE_ENV is test", async () => {
    process.env.NODE_ENV = "test";

    // Dynamically import to re-evaluate module code
    const logger = (await import("../../src/utils/logger")).default;
    const mockedWinston = await import("winston");

    expect(mockedWinston.createLogger).toHaveBeenCalledTimes(1);
    expect(mockedWinston.transports.File).toHaveBeenCalledTimes(2); // error.log and api.log

    // Assert that console transport was NOT added
    expect(logger.add).not.toHaveBeenCalled();
  });

  it("should NOT add console transport when NODE_ENV is production", async () => {
    process.env.NODE_ENV = "production";

    const logger = (await import("../../src/utils/logger")).default;
    const mockedWinston = await import("winston");

    expect(mockedWinston.createLogger).toHaveBeenCalledTimes(1);

    // Assert that console transport was NOT added
    expect(logger.add).not.toHaveBeenCalled();
  });

  it("should add console transport when NODE_ENV is development", async () => {
    process.env.NODE_ENV = "development";

    const logger = (await import("../../src/utils/logger")).default;
    const mockedWinston = await import("winston");

    expect(mockedWinston.createLogger).toHaveBeenCalledTimes(1);
    expect(mockedWinston.transports.Console).toHaveBeenCalledTimes(1);

    // Assert that console transport WAS added
    expect(logger.add).toHaveBeenCalledTimes(1);
  });
});
