// src/index.js
// Main entry point for the Quantum Virtual Machine

import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

import { StateVector } from './core/state-vector.js';
import { QubitRegistry } from './core/qubit-registry.js';
import { GateExecutor } from './core/gate-executor.js';
import { MeasurementEngine } from './core/measurement-engine.js';
import { BytecodeInterpreter } from './core/bytecode-interpreter.js';
import { createQBC, parseQBC } from './types/qbc.js';
import { QBCOpcode } from './types/quantum-types.js';
import { GATES, createGates } from './utils/quantum-gates.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

// QVM configuration
const DEFAULT_CONFIG = {
  maxQubits: Number(process.env.QVM_MAX_QUBITS) || 32,
  precision: Number(process.env.QVM_PRECISION) || 1e-10,
  optimizationLevel: Number(process.env.QVM_OPTIMIZATION_LEVEL) || 1,
  debugMode: process.env.QVM_DEBUG_MODE === 'true',
  useOptimizedMemory: process.env.QVM_OPTIMIZED_MEMORY === 'true'
};

/**
 * Quantum Virtual Machine class
 * Central manager for quantum computation
 */
class QuantumVirtualMachine {
  /**
   * Create a new QVM instance
   */
  constructor() {
    this.initialized = false;
    this.config = { ...DEFAULT_CONFIG };
    
    // Core components
    this.stateVector = null;
    this.qubitRegistry = null;
    this.gateExecutor = null;
    this.measurementEngine = null;
    this.bytecodeInterpreter = null;
    
    // For circuit building
    this.activeCircuits = new Map();
    
    logger.info('QVM instance created');
  }

  /**
   * Initialize the QVM
   * @param {Object} config - Configuration options
   * @returns {Promise<boolean>} - Success status
   */
  async initialize(config = {}) {
    if (this.initialized) {
      logger.warn('QVM already initialized');
      return true;
    }
    
    try {
      // Merge config
      this.config = {
        ...this.config,
        ...config
      };
      
      logger.info(`Initializing QVM with max ${this.config.maxQubits} qubits`);
      
      // Initialize core components
      this.stateVector = new StateVector(0, {
        precision: this.config.precision,
        maxQubits: this.config.maxQubits,
        useOptimizedMemory: this.config.useOptimizedMemory
      });
      
      this.qubitRegistry = new QubitRegistry(this.stateVector);
      this.gateExecutor = new GateExecutor(this.stateVector, this.qubitRegistry);
      this.measurementEngine = new MeasurementEngine(this.stateVector, this.qubitRegistry);
      this.bytecodeInterpreter = new BytecodeInterpreter(
        this.qubitRegistry,
        this.gateExecutor,
        this.measurementEngine
      );
      
      // Set up debug hooks
      if (this.config.debugMode) {
        this.setupDebugHooks();
      }
      
      this.initialized = true;
      logger.info('QVM initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize QVM: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute quantum bytecode
   * @param {Buffer|Uint8Array} bytecode - Quantum bytecode
   * @param {Object} options - Execution options
   * @returns {Object} - Execution results
   */
  async executeQBC(bytecode, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const buffer = Buffer.isBuffer(bytecode) ? bytecode : Buffer.from(bytecode);
      
      // Parse and validate bytecode
      const { header, instructions } = parseQBC(buffer);
      
      logger.debug(`Executing QBC with ${instructions.length} instructions`);
      
      // Load bytecode into interpreter
      this.bytecodeInterpreter.loadBytecode(buffer);
      
      // Execute bytecode
      const executionResult = this.bytecodeInterpreter.execute(options);
      
      // Get current state and measurements
      const finalState = {
        stateVector: this.stateVector.getStateVector(),
        measurements: this.measurementEngine.getAllMeasurements(),
        classicalMemory: executionResult.classicalMemory,
        metrics: {
          ...executionResult.metrics,
          stateVectorSize: this.stateVector.metrics.stateVectorSize,
          gateOperations: this.stateVector.metrics.gateOperations,
          gateTypeCount: this.gateExecutor.getMetrics().gateTypeCount
        }
      };
      
      logger.info(`QBC execution completed with ${executionResult.metrics.instructionsExecuted} instructions executed`);
      
      return {
        success: executionResult.success,
        error: executionResult.error,
        ...finalState
      };
    } catch (error) {
      logger.error(`QBC execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Compile QASM to quantum bytecode
   * @param {string} qasm - Quantum assembly code
   * @returns {Buffer} - Compiled quantum bytecode
   */
  compileQASM(qasm) {
    // This would be implemented in a real QVM
    // For now, we'll throw an error
    throw new Error('QASM compilation not implemented yet');
  }

  /**
   * Create a new quantum circuit builder
   * @returns {QuantumCircuit} - Quantum circuit builder
   */
  createCircuit() {
    if (!this.initialized) {
      this.initialize();
    }
    
    const circuitId = uuidv4();
    const circuit = new QuantumCircuit(this, circuitId);
    
    this.activeCircuits.set(circuitId, circuit);
    
    return circuit;
  }

  /**
   * Get the current quantum state vector
   * @returns {Array} - Current state vector
   */
  getStateVector() {
    if (!this.initialized) {
      throw new Error('QVM not initialized');
    }
    
    return this.stateVector.getStateVector();
  }

  /**
   * Reset the QVM state
   */
  reset() {
    if (!this.initialized) {
      logger.warn('Resetting uninitialized QVM');
      return;
    }
    
    this.stateVector.reset();
    this.qubitRegistry.reset();
    this.measurementEngine.reset();
    this.bytecodeInterpreter.reset();
    this.activeCircuits.clear();
    
    logger.info('QVM reset');
  }

  /**
   * Set up debug hooks for the bytecode interpreter
   * @private
   */
  setupDebugHooks() {
    // Set up debug hooks
    this.bytecodeInterpreter.setHook('beforeInstruction', (opcode, pc) => {
      logger.debug(`Executing opcode 0x${opcode.toString(16)} at PC=${pc}`);
    });
    
    this.bytecodeInterpreter.setHook('onError', (error, pc) => {
      logger.error(`Execution error at PC=${pc}: ${error.message}`);
    });
  }
}

/**
 * Quantum Circuit Builder
 * A high-level API for building quantum circuits
 */
class QuantumCircuit {
  /**
   * Create a new quantum circuit
   * @param {QuantumVirtualMachine} qvm - QVM instance
   * @param {string} id - Circuit ID
   */
  constructor(qvm, id) {
    this.qvm = qvm;
    this.id = id;
    this.qubits = [];
    this.operations = [];
    this.measurements = new Map();
    this.classicalRegisters = new Map();
    
    logger.debug(`Created new quantum circuit: ${id}`);
  }

  /**
   * Allocate a new qubit
   * @returns {string} - Qubit ID
   */
  allocateQubit() {
    const qubitId = this.qvm.qubitRegistry.allocateQubit();
    this.qubits.push(qubitId);
    this.operations.push({ type: 'allocate', qubitId });
    
    logger.debug(`Allocated qubit ${qubitId}`);
    return qubitId;
  }

  /**
   * Deallocate a qubit
   * @param {string} qubitId - Qubit ID
   * @returns {boolean} - Success status
   */
  deallocateQubit(qubitId) {
    const success = this.qvm.qubitRegistry.deallocateQubit(qubitId);
    
    if (success) {
      this.qubits = this.qubits.filter(id => id !== qubitId);
      this.operations.push({ type: 'deallocate', qubitId });
      logger.debug(`Deallocated qubit ${qubitId}`);
    } else {
      logger.warn(`Failed to deallocate qubit ${qubitId}`);
    }
    
    return success;
  }

  /**
   * Apply X gate (NOT gate)
   * @param {string} qubitId - Target qubit
   * @returns {QuantumCircuit} - this (for chaining)
   */
  x(qubitId) {
    this.qvm.gateExecutor.applySingleQubitGate(qubitId, 'X');
    this.operations.push({ type: 'gate', gate: 'X', qubits: [qubitId] });
    return this;
  }

  /**
   * Apply Y gate
   * @param {string} qubitId - Target qubit
   * @returns {QuantumCircuit} - this (for chaining)
   */
  y(qubitId) {
    this.qvm.gateExecutor.applySingleQubitGate(qubitId, 'Y');
    this.operations.push({ type: 'gate', gate: 'Y', qubits: [qubitId] });
    return this;
  }

  /**
   * Apply Z gate
   * @param {string} qubitId - Target qubit
   * @returns {QuantumCircuit} - this (for chaining)
   */
  z(qubitId) {
    this.qvm.gateExecutor.applySingleQubitGate(qubitId, 'Z');
    this.operations.push({ type: 'gate', gate: 'Z', qubits: [qubitId] });
    return this;
  }

  /**
   * Apply Hadamard gate
   * @param {string} qubitId - Target qubit
   * @returns {QuantumCircuit} - this (for chaining)
   */
  h(qubitId) {
    this.qvm.gateExecutor.applySingleQubitGate(qubitId, 'H');
    this.operations.push({ type: 'gate', gate: 'H', qubits: [qubitId] });
    return this;
  }

  /**
   * Apply S gate (phase gate)
   * @param {string} qubitId - Target qubit
   * @returns {QuantumCircuit} - this (for chaining)
   */
  s(qubitId) {
    this.qvm.gateExecutor.applySingleQubitGate(qubitId, 'S');
    this.operations.push({ type: 'gate', gate: 'S', qubits: [qubitId] });
    return this;
  }

  /**
   * Apply T gate
   * @param {string} qubitId - Target qubit
   * @returns {QuantumCircuit} - this (for chaining)
   */
  t(qubitId) {
    this.qvm.gateExecutor.applySingleQubitGate(qubitId, 'T');
    this.operations.push({ type: 'gate', gate: 'T', qubits: [qubitId] });
    return this;
  }

  /**
   * Apply rotation around X-axis
   * @param {string} qubitId - Target qubit
   * @param {number} theta - Rotation angle in radians
   * @returns {QuantumCircuit} - this (for chaining)
   */
  rx(qubitId, theta) {
    this.qvm.gateExecutor.applyRX(qubitId, theta);
    this.operations.push({ type: 'gate', gate: 'RX', qubits: [qubitId], params: [theta] });
    return this;
  }

  /**
   * Apply rotation around Y-axis
   * @param {string} qubitId - Target qubit
   * @param {number} theta - Rotation angle in radians
   * @returns {QuantumCircuit} - this (for chaining)
   */
  ry(qubitId, theta) {
    this.qvm.gateExecutor.applyRY(qubitId, theta);
    this.operations.push({ type: 'gate', gate: 'RY', qubits: [qubitId], params: [theta] });
    return this;
  }

  /**
   * Apply rotation around Z-axis
   * @param {string} qubitId - Target qubit
   * @param {number} theta - Rotation angle in radians
   * @returns {QuantumCircuit} - this (for chaining)
   */
  rz(qubitId, theta) {
    this.qvm.gateExecutor.applyRZ(qubitId, theta);
    this.operations.push({ type: 'gate', gate: 'RZ', qubits: [qubitId], params: [theta] });
    return this;
  }

  /**
   * Apply controlled-NOT gate
   * @param {string} controlQubitId - Control qubit
   * @param {string} targetQubitId - Target qubit
   * @returns {QuantumCircuit} - this (for chaining)
   */
  cnot(controlQubitId, targetQubitId) {
    this.qvm.gateExecutor.applyCNOT(controlQubitId, targetQubitId);
    this.operations.push({ type: 'gate', gate: 'CNOT', qubits: [controlQubitId, targetQubitId] });
    return this;
  }

  /**
   * Apply controlled-Z gate
   * @param {string} controlQubitId - Control qubit
   * @param {string} targetQubitId - Target qubit
   * @returns {QuantumCircuit} - this (for chaining)
   */
  cz(controlQubitId, targetQubitId) {
    this.qvm.gateExecutor.applyCZ(controlQubitId, targetQubitId);
    this.operations.push({ type: 'gate', gate: 'CZ', qubits: [controlQubitId, targetQubitId] });
    return this;
  }

  /**
   * Apply SWAP gate
   * @param {string} qubit1Id - First qubit
   * @param {string} qubit2Id - Second qubit
   * @returns {QuantumCircuit} - this (for chaining)
   */
  swap(qubit1Id, qubit2Id) {
    this.qvm.gateExecutor.applySWAP(qubit1Id, qubit2Id);
    this.operations.push({ type: 'gate', gate: 'SWAP', qubits: [qubit1Id, qubit2Id] });
    return this;
  }

  /**
   * Apply Toffoli (CCNOT) gate
   * @param {string} control1Id - First control qubit
   * @param {string} control2Id - Second control qubit
   * @param {string} targetId - Target qubit
   * @returns {QuantumCircuit} - this (for chaining)
   */
  toffoli(control1Id, control2Id, targetId) {
    this.qvm.gateExecutor.applyToffoli(control1Id, control2Id, targetId);
    this.operations.push({ type: 'gate', gate: 'Toffoli', qubits: [control1Id, control2Id, targetId] });
    return this;
  }

  /**
   * Prepare a custom quantum state (for testing and examples)
   * @param {string} qubitId - Target qubit
   * @param {number} alpha - Amplitude for |0⟩
   * @param {number} beta - Amplitude for |1⟩
   * @returns {QuantumCircuit} - this (for chaining)
   */
  prepareCustomState(qubitId, alpha, beta) {
    // First reset to |0⟩
    this.qvm.gateExecutor.resetQubit(qubitId);
    
    // Calculate required rotation parameters
    const r = Math.sqrt(alpha * alpha + beta * beta);
    const normAlpha = alpha / r;
    const normBeta = beta / r;
    
    // Calculate theta for RY rotation (|0⟩ -> cos(θ/2)|0⟩ + sin(θ/2)|1⟩)
    const theta = 2 * Math.acos(normAlpha);
    
    // Calculate phase for RZ (to get the complex phase right)
    const phase = Math.atan2(normBeta.imag, normBeta.real);
    
    // Apply gates
    this.ry(qubitId, theta);
    if (phase !== 0) {
      this.rz(qubitId, phase);
    }
    
    this.operations.push({ 
      type: 'custom', 
      name: 'prepareCustomState',
      qubitId,
      params: [alpha, beta]
    });
    
    return this;
  }

  /**
   * Measure a qubit
   * @param {string} qubitId - Qubit to measure
   * @param {boolean} nonCollapsing - If true, perform a non-collapsing measurement
   * @returns {number} - Measurement result (0 or 1)
   */
  measure(qubitId, nonCollapsing = false) {
    const result = this.qvm.measurementEngine.measureQubit(qubitId, nonCollapsing);
    
    this.measurements.set(qubitId, result);
    this.operations.push({ 
      type: 'measure', 
      qubitId, 
      nonCollapsing,
      result
    });
    
    return result;
  }

  /**
   * Measure multiple qubits at once
   * @param {string[]} qubitIds - Qubits to measure
   * @param {boolean} nonCollapsing - If true, perform non-collapsing measurements
   * @returns {Map<string, number>} - Measurement results
   */
  measureQubits(qubitIds, nonCollapsing = false) {
    const results = this.qvm.measurementEngine.measureQubits(qubitIds, nonCollapsing);
    
    // Update circuit state
    for (const [qubitId, result] of results.entries()) {
      this.measurements.set(qubitId, result);
    }
    
    this.operations.push({ 
      type: 'measureMultiple', 
      qubitIds, 
      nonCollapsing,
      results: Object.fromEntries(results)
    });
    
    return results;
  }

  /**
   * Measure all qubits and return the resulting bit string
   * @returns {string} - Measurement bit string
   */
  measureAll() {
    const bitString = this.qvm.measurementEngine.measureAllQubits();
    
    // Update circuit state with all measurements
    const allMeasurements = this.qvm.measurementEngine.getAllMeasurements();
    for (const [qubitId, result] of allMeasurements.entries()) {
      this.measurements.set(qubitId, result);
    }
    
    this.operations.push({ 
      type: 'measureAll', 
      result: bitString
    });
    
    return bitString;
  }

  /**
   * Sample the quantum state multiple times
   * @param {number} shots - Number of samples to take
   * @returns {Object} - Counts of each observed bit string
   */
  simulate(shots) {
    // Clone the current state
    const currentState = this.qvm.stateVector.getStateVector();
    
    // Perform the sampling
    const counts = this.qvm.measurementEngine.sample(shots);
    
    this.operations.push({ 
      type: 'simulate', 
      shots,
      counts
    });
    
    return counts;
  }

  /**
   * Reset a qubit to |0⟩ state
   * @param {string} qubitId - Qubit to reset
   * @returns {QuantumCircuit} - this (for chaining)
   */
  reset(qubitId) {
    this.qvm.gateExecutor.resetQubit(qubitId);
    this.operations.push({ type: 'reset', qubitId });
    return this;
  }

  /**
   * Compile the circuit to quantum bytecode
   * @returns {Buffer} - Compiled quantum bytecode
   */
  compile() {
    logger.debug(`Compiling circuit ${this.id} with ${this.operations.length} operations`);
    
    // Convert circuit operations to bytecode instructions
    const instructions = [];
    const qubitMap = new Map(); // Map qubit IDs to bytecode references
    let classicalIndex = 0;
    
    for (const operation of this.operations) {
      switch (operation.type) {
        case 'allocate':
          // Find next available qubit reference
          const qubitRef = qubitMap.size;
          qubitMap.set(operation.qubitId, qubitRef);
          
          // Add instruction
          instructions.push({
            op: QBCOpcode.ALLOCATE_QUBIT, // Use the enum value instead of hardcoded 0x01
            params: [qubitRef]
          });
          break;
          
        case 'deallocate':
          instructions.push({
            op: QBCOpcode.DEALLOCATE_QUBIT, // Use the enum value instead of hardcoded 0x02
            params: [qubitMap.get(operation.qubitId)]
          });
          break;
          
        case 'gate':
          // Map gate names to opcodes
          const gateOpcodes = {
            'X': QBCOpcode.GATE_X,
            'Y': QBCOpcode.GATE_Y,
            'Z': QBCOpcode.GATE_Z,
            'H': QBCOpcode.GATE_H,
            'S': QBCOpcode.GATE_S,
            'T': QBCOpcode.GATE_T,
            'RX': QBCOpcode.GATE_RX,
            'RY': QBCOpcode.GATE_RY,
            'RZ': QBCOpcode.GATE_RZ,
            'CNOT': QBCOpcode.GATE_CNOT,
            'CZ': QBCOpcode.GATE_CZ,
            'SWAP': QBCOpcode.GATE_SWAP,
            'Toffoli': QBCOpcode.GATE_TOFFOLI
          };
          
          // Get qubit references
          const qubitRefs = operation.qubits.map(id => qubitMap.get(id));
          
          // Add gate instruction
          const opcode = gateOpcodes[operation.gate];
          const params = [...qubitRefs];
          
          // Add parameters for rotation gates
          if (['RX', 'RY', 'RZ'].includes(operation.gate)) {
            params.push(operation.params[0]); // Angle
          }
          
          instructions.push({
            op: opcode,
            params
          });
          break;
          
        case 'measure':
          // Allocate a classical bit
          const resultAddr = classicalIndex++;
          
          instructions.push({
            op: QBCOpcode.MEASURE_QUBIT, // Use the enum value instead of hardcoded 0x50
            params: [qubitMap.get(operation.qubitId), resultAddr]
          });
          break;
          
        case 'reset':
          // Reset is implemented as measure + conditional-X
          const resetResultAddr = classicalIndex++;
          
          // Measure
          instructions.push({
            op: QBCOpcode.MEASURE_QUBIT, // Use the enum value
            params: [qubitMap.get(operation.qubitId), resetResultAddr]
          });
          
          // Apply X gate if result is 1
          instructions.push({
            op: QBCOpcode.CONDITIONAL_JUMP, // Use the enum value
            params: [resetResultAddr, instructions.length + 3] // Skip the X gate if result is 0
          });
          
          instructions.push({
            op: QBCOpcode.GATE_X, // Use the enum value
            params: [qubitMap.get(operation.qubitId)]
          });
          break;
          
        // Add other operations as needed
      }
    }
    
    // Add END opcode
    instructions.push({
      op: QBCOpcode.END, // Use the enum value instead of hardcoded 0xFF
      params: []
    });
    
    // Create bytecode
    const metadata = {
      circuitId: this.id,
      qubitCount: this.qubits.length,
      operationCount: this.operations.length
    };
    
    return createQBC(instructions, {
      maxQubits: this.qubits.length,
      metadata
    });
  }

  /**
   * Clone the circuit for simulation
   * @returns {QuantumCircuit} - Clone of this circuit
   */
  clone() {
    const clone = this.qvm.createCircuit();
    
    // Allocate the same number of qubits
    for (let i = 0; i < this.qubits.length; i++) {
      clone.allocateQubit();
    }
    
    // Clone doesn't reproduce the operations, just the same number of qubits
    
    return clone;
  }

  /**
   * Get the quantum state vector
   * @returns {Array} - Current state vector
   */
  getStateVector() {
    return this.qvm.stateVector.getStateVector();
  }

  /**
   * Get circuit statistics
   * @returns {Object} - Circuit statistics
   */
  getStats() {
    return {
      qubitCount: this.qubits.length,
      operationCount: this.operations.length,
      measurementCount: this.measurements.size,
      depth: this.calculateCircuitDepth()
    };
  }

  /**
   * Calculate the circuit depth
   * @private
   * @returns {number} - Circuit depth
   */
  calculateCircuitDepth() {
    // Simple implementation - just count operations
    // A real implementation would analyze parallelism
    return this.operations.length;
  }
}

// Singleton QVM instance
const qvm = new QuantumVirtualMachine();

/**
 * Initialize the QVM library
 * Sets up necessary configurations and optimizes memory allocation
 * @param {Object} config - Configuration options
 * @returns {Promise<boolean>} - Success status
 */
export const initialize = async (config = {}) => {
  return qvm.initialize(config);
};

/**
 * Load and execute quantum bytecode
 * @param {Buffer} bytecode - The quantum bytecode to execute
 * @param {Object} options - Execution options
 * @returns {Object} - Execution results
 */
export const executeQBC = async (bytecode, options = {}) => {
  return qvm.executeQBC(bytecode, options);
};

/**
 * Get the current quantum state as a vector
 * Warning: This can be memory-intensive for many qubits
 * @returns {Array} - State vector
 */
export const getStateVector = () => {
  return qvm.getStateVector();
};

/**
 * Compile quantum assembly language to quantum bytecode
 * @param {string} qasm - Quantum assembly code
 * @returns {Buffer} - Compiled quantum bytecode
 */
export const compileQASM = (qasm) => {
  return qvm.compileQASM(qasm);
};

/**
 * Create a new quantum circuit builder instance
 * @returns {QuantumCircuit} - A quantum circuit builder
 */
export const createCircuit = () => {
  return qvm.createCircuit();
};

/**
 * Reset the QVM state
 */
export const reset = () => {
  qvm.reset();
};

// Default export for the entire library
export default {
  initialize,
  executeQBC,
  getStateVector,
  compileQASM,
  createCircuit,
  reset
};