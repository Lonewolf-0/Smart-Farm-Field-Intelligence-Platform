import winston from "winston";

// Define the custom settings for each transport (file, console)
const options = {
  fileError: {
    level: "error",
    filename: "logs/error.log",
    handleExceptions: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.json()
    ),
  },
  fileApi: {
    level: "info",
    filename: "logs/api.log",
    handleExceptions: false,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.json()
    ),
  },
  console: {
    level: "debug",
    handleExceptions: true,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  },
};

// Instantiate a new Winston Logger with the settings defined above
const logger = winston.createLogger({
  transports: [
    new winston.transports.File(options.fileError),
    new winston.transports.File(options.fileApi),
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// If we're not in production then log to the console
if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
  logger.add(new winston.transports.Console(options.console));
}

export default logger;
