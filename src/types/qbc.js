// src/types/qbc.js (fixed version)
// Quantum Bytecode format specification and utilities

import { createLogger } from '../utils/logger.js';
import { QBCOpcode } from './quantum-types.js';

const logger = createLogger('QVM:QBC');

/**
 * QBC file format version
 * @type {number}
 */
export const QBC_VERSION = 1;

/**
 * QBC file magic number (for identification)
 * @type {string}
 */
export const QBC_MAGIC = 'QBC\0';

/**
 * QBC file header structure
 * @typedef {Object} QBCHeader
 * @property {string} magic - Magic number
 * @property {number} version - QBC version
 * @property {number} qubits - Maximum number of qubits
 * @property {number} instructionCount - Number of instructions
 * @property {number} dataSize - Size of data section in bytes
 * @property {number} metadataSize - Size of metadata section in bytes
 * @property {Object} metadata - Optional metadata
 */

/**
 * Create a QBC bytecode file
 * @param {Array<Object>} instructions - Array of instruction objects
 * @param {Object} options - Options for QBC creation
 * @returns {Buffer} - QBC bytecode
 */
export const createQBC = (instructions, options = {}) => {
  const {
    maxQubits = 8,
    metadata = {},
    optimize = true
  } = options;
  
  // Convert metadata to JSON string
  const metadataStr = JSON.stringify(metadata);
  const metadataBuffer = Buffer.from(metadataStr, 'utf8');
  
  // Calculate sizes
  const headerSize = 20; // Increased from 16 to 20 bytes to properly accommodate all header fields
  const instructionBuffers = instructions.map(encodeInstruction);
  const dataSize = instructionBuffers.reduce((sum, buf) => sum + buf.length, 0);
  const metadataSize = metadataBuffer.length;
  const totalSize = headerSize + dataSize + metadataSize;
  
  // Create buffer
  const buffer = Buffer.alloc(totalSize);
  
  // Write header
  buffer.write(QBC_MAGIC, 0, 4);
  buffer.writeUInt16LE(QBC_VERSION, 4);
  buffer.writeUInt16LE(maxQubits, 6);
  buffer.writeUInt32LE(instructions.length, 8);
  buffer.writeUInt32LE(dataSize, 12);
  buffer.writeUInt32LE(metadataSize, 16);
  
  // Write instructions
  let offset = headerSize;
  for (const instrBuffer of instructionBuffers) {
    instrBuffer.copy(buffer, offset);
    offset += instrBuffer.length;
  }
  
  // Write metadata
  metadataBuffer.copy(buffer, offset);
  
  logger.debug(`Created QBC bytecode with ${instructions.length} instructions, ${dataSize} bytes data, ${metadataSize} bytes metadata`);
  
  return buffer;
};

/**
 * Parse a QBC bytecode file
 * @param {Buffer} buffer - QBC bytecode buffer
 * @returns {Object} - Parsed QBC with header, instructions, and metadata
 */
export const parseQBC = (buffer) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Input must be a Buffer');
  }
  
  // Read header
  const magic = buffer.toString('utf8', 0, 4);
  if (magic !== QBC_MAGIC) {
    throw new Error(`Invalid QBC magic number: ${magic}`);
  }
  
  const version = buffer.readUInt16LE(4);
  if (version !== QBC_VERSION) {
    throw new Error(`Unsupported QBC version: ${version}`);
  }
  
  const qubits = buffer.readUInt16LE(6);
  const instructionCount = buffer.readUInt32LE(8);
  const dataSize = buffer.readUInt32LE(12);
  const metadataSize = buffer.readUInt32LE(16);
  
  // Read instructions
  const instructions = [];
  let offset = 20; // Updated from 16 to 20 to match header size
  
  for (let i = 0; i < instructionCount; i++) {
    const { instruction, bytesRead } = decodeInstruction(buffer, offset);
    instructions.push(instruction);
    offset += bytesRead;
  }
  
  // Read metadata
  let metadata = {};
  if (metadataSize > 0) {
    const metadataStr = buffer.toString('utf8', offset, offset + metadataSize);
    try {
      metadata = JSON.parse(metadataStr);
    } catch (error) {
      logger.error(`Failed to parse metadata: ${error.message}`);
    }
  }
  
  logger.debug(`Parsed QBC bytecode: ${instructionCount} instructions, qubits=${qubits}, version=${version}`);
  
  return {
    header: {
      magic,
      version,
      qubits,
      instructionCount,
      dataSize,
      metadataSize
    },
    instructions,
    metadata
  };
};

/**
 * Convert instructions and parameters to bytecode
 * @param {Object} instruction - Instruction object
 * @returns {Buffer} - Encoded instruction buffer
 */
export const encodeInstruction = (instruction) => {
  const { op, params = [] } = instruction;
  
  // Fix: Check for opcode validity against our QBCOpcode enum values
  if (typeof op !== 'number') {
    throw new Error(`Invalid opcode type: ${typeof op}, expected number`);
  }
  
  // Check if op matches any value in QBCOpcode
  const validOp = Object.values(QBCOpcode).includes(op);
  if (!validOp) {
    throw new Error(`Invalid opcode: ${op}`);
  }
  
  // Determine buffer size based on opcode and parameters
  const paramSize = getParameterSize(op, params);
  const buffer = Buffer.alloc(1 + paramSize); // 1 byte for opcode
  
  // Write opcode
  buffer[0] = op;
  
  // Write parameters
  let offset = 1;
  
  switch (op) {
    // Qubit management
    case QBCOpcode.ALLOCATE_QUBIT:
    case QBCOpcode.DEALLOCATE_QUBIT:
      buffer[offset] = params[0]; // qubit reference
      break;
      
    // Single-qubit gates
    case QBCOpcode.GATE_X:
    case QBCOpcode.GATE_Y:
    case QBCOpcode.GATE_Z:
    case QBCOpcode.GATE_H:
    case QBCOpcode.GATE_S:
    case QBCOpcode.GATE_T:
      buffer[offset] = params[0]; // qubit reference
      break;
      
    // Rotation gates
    case QBCOpcode.GATE_RX:
    case QBCOpcode.GATE_RY:
    case QBCOpcode.GATE_RZ:
    case QBCOpcode.GATE_PHASE:
      buffer[offset] = params[0]; // qubit reference
      buffer.writeFloatLE(params[1], offset + 1); // angle (float)
      break;
      
    // Two-qubit gates
    case QBCOpcode.GATE_CNOT:
    case QBCOpcode.GATE_CZ:
    case QBCOpcode.GATE_SWAP:
    case QBCOpcode.GATE_ISWAP:
      buffer[offset] = params[0]; // first qubit reference
      buffer[offset + 1] = params[1]; // second qubit reference
      break;
      
    // Three-qubit gates
    case QBCOpcode.GATE_TOFFOLI:
    case QBCOpcode.GATE_FREDKIN:
      buffer[offset] = params[0]; // first qubit reference
      buffer[offset + 1] = params[1]; // second qubit reference
      buffer[offset + 2] = params[2]; // third qubit reference
      break;
      
    // Measurement
    case QBCOpcode.MEASURE_QUBIT:
      buffer[offset] = params[0]; // qubit reference
      buffer[offset + 1] = params[1]; // result address
      break;
      
    // Control flow
    case QBCOpcode.CONDITIONAL_JUMP:
      buffer[offset] = params[0]; // condition address
      buffer.writeUInt32LE(params[1], offset + 1); // target address
      break;
      
    case QBCOpcode.JUMP:
      buffer.writeUInt32LE(params[0], offset); // target address
      break;
      
    // Classical operations
    case QBCOpcode.STORE_CLASSICAL:
      buffer[offset] = params[0]; // address
      buffer.writeInt32LE(params[1], offset + 1); // value
      break;
      
    case QBCOpcode.LOAD_CLASSICAL:
      buffer[offset] = params[0]; // source address
      buffer[offset + 1] = params[1]; // destination address
      break;
      
    // Binary operations
    case QBCOpcode.ADD_CLASSICAL:
    case QBCOpcode.SUB_CLASSICAL:
    case QBCOpcode.MUL_CLASSICAL:
    case QBCOpcode.DIV_CLASSICAL:
    case QBCOpcode.AND_CLASSICAL:
    case QBCOpcode.OR_CLASSICAL:
    case QBCOpcode.XOR_CLASSICAL:
    case QBCOpcode.CMP_EQ_CLASSICAL:
    case QBCOpcode.CMP_NEQ_CLASSICAL:
    case QBCOpcode.CMP_LT_CLASSICAL:
    case QBCOpcode.CMP_GT_CLASSICAL:
      buffer[offset] = params[0]; // first operand address
      buffer[offset + 1] = params[1]; // second operand address
      buffer[offset + 2] = params[2]; // result address
      break;
      
    // Unary operations
    case QBCOpcode.NOT_CLASSICAL:
      buffer[offset] = params[0]; // operand address
      buffer[offset + 1] = params[1]; // result address
      break;
      
    // No parameters
    case QBCOpcode.END:
    case QBCOpcode.MEASURE_ALL:
      break;
      
    default:
      throw new Error(`Unknown opcode: ${op}`);
  }
  
  return buffer;
};

/**
 * Decode bytecode to instructions and parameters
 * @param {Buffer} buffer - Bytecode buffer
 * @param {number} offset - Offset in buffer
 * @returns {Object} - Decoded instruction and bytes read
 */
export const decodeInstruction = (buffer, offset) => {
  const op = buffer[offset];
  let bytesRead = 1;
  const params = [];
  
  switch (op) {
    // Qubit management
    case QBCOpcode.ALLOCATE_QUBIT:
    case QBCOpcode.DEALLOCATE_QUBIT:
      params.push(buffer[offset + 1]); // qubit reference
      bytesRead += 1;
      break;
      
    // Single-qubit gates
    case QBCOpcode.GATE_X:
    case QBCOpcode.GATE_Y:
    case QBCOpcode.GATE_Z:
    case QBCOpcode.GATE_H:
    case QBCOpcode.GATE_S:
    case QBCOpcode.GATE_T:
      params.push(buffer[offset + 1]); // qubit reference
      bytesRead += 1;
      break;
      
    // Rotation gates
    case QBCOpcode.GATE_RX:
    case QBCOpcode.GATE_RY:
    case QBCOpcode.GATE_RZ:
    case QBCOpcode.GATE_PHASE:
      params.push(buffer[offset + 1]); // qubit reference
      params.push(buffer.readFloatLE(offset + 2)); // angle (float)
      bytesRead += 5;
      break;
      
    // Two-qubit gates
    case QBCOpcode.GATE_CNOT:
    case QBCOpcode.GATE_CZ:
    case QBCOpcode.GATE_SWAP:
    case QBCOpcode.GATE_ISWAP:
      params.push(buffer[offset + 1]); // first qubit reference
      params.push(buffer[offset + 2]); // second qubit reference
      bytesRead += 2;
      break;
      
    // Three-qubit gates
    case QBCOpcode.GATE_TOFFOLI:
    case QBCOpcode.GATE_FREDKIN:
      params.push(buffer[offset + 1]); // first qubit reference
      params.push(buffer[offset + 2]); // second qubit reference
      params.push(buffer[offset + 3]); // third qubit reference
      bytesRead += 3;
      break;
      
    // Measurement
    case QBCOpcode.MEASURE_QUBIT:
      params.push(buffer[offset + 1]); // qubit reference
      params.push(buffer[offset + 2]); // result address
      bytesRead += 2;
      break;
      
    // Control flow
    case QBCOpcode.CONDITIONAL_JUMP:
      params.push(buffer[offset + 1]); // condition address
      params.push(buffer.readUInt32LE(offset + 2)); // target address
      bytesRead += 5;
      break;
      
    case QBCOpcode.JUMP:
      params.push(buffer.readUInt32LE(offset + 1)); // target address
      bytesRead += 4;
      break;
      
    // Classical operations
    case QBCOpcode.STORE_CLASSICAL:
      params.push(buffer[offset + 1]); // address
      params.push(buffer.readInt32LE(offset + 2)); // value
      bytesRead += 5;
      break;
      
    case QBCOpcode.LOAD_CLASSICAL:
      params.push(buffer[offset + 1]); // source address
      params.push(buffer[offset + 2]); // destination address
      bytesRead += 2;
      break;
      
    // Binary operations
    case QBCOpcode.ADD_CLASSICAL:
    case QBCOpcode.SUB_CLASSICAL:
    case QBCOpcode.MUL_CLASSICAL:
    case QBCOpcode.DIV_CLASSICAL:
    case QBCOpcode.AND_CLASSICAL:
    case QBCOpcode.OR_CLASSICAL:
    case QBCOpcode.XOR_CLASSICAL:
    case QBCOpcode.CMP_EQ_CLASSICAL:
    case QBCOpcode.CMP_NEQ_CLASSICAL:
    case QBCOpcode.CMP_LT_CLASSICAL:
    case QBCOpcode.CMP_GT_CLASSICAL:
      params.push(buffer[offset + 1]); // first operand address
      params.push(buffer[offset + 2]); // second operand address
      params.push(buffer[offset + 3]); // result address
      bytesRead += 3;
      break;
      
    // Unary operations
    case QBCOpcode.NOT_CLASSICAL:
      params.push(buffer[offset + 1]); // operand address
      params.push(buffer[offset + 2]); // result address
      bytesRead += 2;
      break;
      
    // No parameters
    case QBCOpcode.END:
    case QBCOpcode.MEASURE_ALL:
      break;
      
    default:
      throw new Error(`Unknown opcode: ${op}`);
  }
  
  return {
    instruction: { op, params },
    bytesRead
  };
};

/**
 * Get size of parameters for an opcode
 * @param {number} op - Opcode
 * @param {Array} params - Parameters
 * @returns {number} - Size of parameters in bytes
 */
export const getParameterSize = (op, params) => {
  switch (op) {
    // Qubit management
    case QBCOpcode.ALLOCATE_QUBIT:
    case QBCOpcode.DEALLOCATE_QUBIT:
      return 1; // 1 byte for qubit reference
      
    // Single-qubit gates
    case QBCOpcode.GATE_X:
    case QBCOpcode.GATE_Y:
    case QBCOpcode.GATE_Z:
    case QBCOpcode.GATE_H:
    case QBCOpcode.GATE_S:
    case QBCOpcode.GATE_T:
      return 1; // 1 byte for qubit reference
      
    // Rotation gates
    case QBCOpcode.GATE_RX:
    case QBCOpcode.GATE_RY:
    case QBCOpcode.GATE_RZ:
    case QBCOpcode.GATE_PHASE:
      return 5; // 1 byte for qubit reference + 4 bytes for angle (float)
      
    // Two-qubit gates
    case QBCOpcode.GATE_CNOT:
    case QBCOpcode.GATE_CZ:
    case QBCOpcode.GATE_SWAP:
    case QBCOpcode.GATE_ISWAP:
      return 2; // 2 bytes for qubit references
      
    // Three-qubit gates
    case QBCOpcode.GATE_TOFFOLI:
    case QBCOpcode.GATE_FREDKIN:
      return 3; // 3 bytes for qubit references
      
    // Measurement
    case QBCOpcode.MEASURE_QUBIT:
      return 2; // 1 byte for qubit reference + 1 byte for result address
      
    // Control flow
    case QBCOpcode.CONDITIONAL_JUMP:
      return 5; // 1 byte for condition address + 4 bytes for target address
      
    case QBCOpcode.JUMP:
      return 4; // 4 bytes for target address
      
    // Classical operations
    case QBCOpcode.STORE_CLASSICAL:
      return 5; // 1 byte for address + 4 bytes for value
      
    case QBCOpcode.LOAD_CLASSICAL:
      return 2; // 1 byte for source address + 1 byte for destination address
      
    // Binary operations
    case QBCOpcode.ADD_CLASSICAL:
    case QBCOpcode.SUB_CLASSICAL:
    case QBCOpcode.MUL_CLASSICAL:
    case QBCOpcode.DIV_CLASSICAL:
    case QBCOpcode.AND_CLASSICAL:
    case QBCOpcode.OR_CLASSICAL:
    case QBCOpcode.XOR_CLASSICAL:
    case QBCOpcode.CMP_EQ_CLASSICAL:
    case QBCOpcode.CMP_NEQ_CLASSICAL:
    case QBCOpcode.CMP_LT_CLASSICAL:
    case QBCOpcode.CMP_GT_CLASSICAL:
      return 3; // 3 bytes for addresses (2 operands + result)
      
    // Unary operations
    case QBCOpcode.NOT_CLASSICAL:
      return 2; // 2 bytes for addresses (1 operand + result)
      
    // No parameters
    case QBCOpcode.END:
    case QBCOpcode.MEASURE_ALL:
      return 0;
      
    default:
      throw new Error(`Unknown opcode: ${op}`);
  }
};

export default {
  QBC_VERSION,
  QBC_MAGIC,
  createQBC,
  parseQBC,
  encodeInstruction,
  decodeInstruction,
  getParameterSize
};