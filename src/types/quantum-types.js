// src/types/quantum-types.js
// Type definitions for quantum operations

/**
 * Opcodes for the Quantum Bytecode
 * @enum {number}
 */
export const QBCOpcode = {
  // Qubit management
  ALLOCATE_QUBIT: 0x01,
  DEALLOCATE_QUBIT: 0x02,
  
  // Single-qubit gates
  GATE_X: 0x10,
  GATE_Y: 0x11,
  GATE_Z: 0x12,
  GATE_H: 0x13,
  GATE_S: 0x14,
  GATE_T: 0x15,
  
  // Rotation gates
  GATE_RX: 0x20,
  GATE_RY: 0x21,
  GATE_RZ: 0x22,
  GATE_PHASE: 0x23,
  
  // Two-qubit gates
  GATE_CNOT: 0x30,
  GATE_CZ: 0x31,
  GATE_SWAP: 0x32,
  GATE_ISWAP: 0x33,
  
  // Three-qubit gates
  GATE_TOFFOLI: 0x40,
  GATE_FREDKIN: 0x41,
  
  // Measurement
  MEASURE_QUBIT: 0x50,
  MEASURE_ALL: 0x51,  // Make sure this is defined
  
  // Control flow
  CONDITIONAL_JUMP: 0x60,
  JUMP: 0x61,
  
  // Classical operations
  STORE_CLASSICAL: 0x70,
  LOAD_CLASSICAL: 0x71,
  ADD_CLASSICAL: 0x80,
  SUB_CLASSICAL: 0x81,
  MUL_CLASSICAL: 0x82,
  DIV_CLASSICAL: 0x83,
  AND_CLASSICAL: 0x90,
  OR_CLASSICAL: 0x91,
  XOR_CLASSICAL: 0x92,
  NOT_CLASSICAL: 0x93,
  
  // Comparison operations
  CMP_EQ_CLASSICAL: 0xA0,
  CMP_NEQ_CLASSICAL: 0xA1,
  CMP_LT_CLASSICAL: 0xA2,
  CMP_GT_CLASSICAL: 0xA3,
  
  // Termination
  END: 0xFF
};

/**
 * Quantum state representation types
 * @enum {string}
 */
export const StateRepresentation = {
  STATE_VECTOR: 'state_vector',
  DENSITY_MATRIX: 'density_matrix',
  STABILIZER: 'stabilizer',
  MPS: 'matrix_product_state'
};

/**
 * Execution modes for the QVM
 * @enum {string}
 */
export const ExecutionMode = {
  STANDARD: 'standard',
  DEBUG: 'debug',
  TRACE: 'trace',
  OPTIMIZED: 'optimized'
};

/**
 * Types of quantum gates
 * @enum {string}
 */
export const GateType = {
  SINGLE_QUBIT: 'single_qubit',
  TWO_QUBIT: 'two_qubit',
  THREE_QUBIT: 'three_qubit',
  MULTI_QUBIT: 'multi_qubit',
  CUSTOM: 'custom'
};

/**
 * Measurement types
 * @enum {string}
 */
export const MeasurementType = {
  PROJECTIVE: 'projective',
  POVM: 'povm',
  WEAK: 'weak'
};

export default {
  QBCOpcode,
  StateRepresentation,
  ExecutionMode,
  GateType,
  MeasurementType
};