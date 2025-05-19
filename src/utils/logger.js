// src/utils/logger.js
// Centralized logging system for the QVM

import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const LOG_LEVEL = process.env.QVM_LOG_LEVEL || 'info';
const LOG_FILE = process.env.QVM_LOG_FILE || 'qvm.log';
const ENABLE_CONSOLE_LOGS = process.env.QVM_ENABLE_CONSOLE_LOGS !== 'false';

/**
 * Create a logger instance for a specific module
 * @param {string} moduleName - Name of the module
 * @returns {Object} - Winston logger instance
 */
export const createLogger = (moduleName) => {
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}] [${moduleName}] ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta) : ''
      }`;
    })
  );

  const transports = [];
  
  // Add file transport if LOG_FILE is set
  if (LOG_FILE) {
    transports.push(
      new winston.transports.File({
        filename: LOG_FILE,
        level: LOG_LEVEL
      })
    );
  }
  
  // Add console transport if enabled
  if (ENABLE_CONSOLE_LOGS) {
    transports.push(
      new winston.transports.Console({
        level: LOG_LEVEL,
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        )
      })
    );
  }

  return winston.createLogger({
    level: LOG_LEVEL,
    format: logFormat,
    defaultMeta: { service: 'quantum-virtual-machine' },
    transports
  });
};

/**
 * Main logger instance for the QVM
 */
export const logger = createLogger('QVM');

export default {
  createLogger,
  logger
};