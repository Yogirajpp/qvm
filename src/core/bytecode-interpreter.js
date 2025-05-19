// src/core/bytecode-interpreter.js
// Interprets and executes quantum bytecode instructions

import { createLogger } from '../utils/logger.js';
import { QBCOpcode } from '../types/quantum-types.js';

const logger = createLogger('QVM:BytecodeInterpreter');

export class BytecodeInterpreter {
  /**
   * Creates a new BytecodeInterpreter instance
   * @param {Object} qubitRegistry - QubitRegistry instance
   * @param {Object} gateExecutor - GateExecutor instance
   * @param {Object} measurementEngine - MeasurementEngine instance
   */
  constructor(qubitRegistry, gateExecutor, measurementEngine) {
    this.qubitRegistry = qubitRegistry;
    this.gateExecutor = gateExecutor;
    this.measurementEngine = measurementEngine;
    
    // Program counter and bytecode
    this.pc = 0;
    this.bytecode = Buffer.alloc(0);
    
    // Execution state
    this.running = false;
    this.error = null;
    
    // Classical memory for hybrid computation
    this.classicalMemory = new Map();
    
    // Qubit ID mapping for bytecode references
    this.qubitIdMap = new Map();
    
    // Jump targets for optimization
    this.jumpTargets = new Map();
    
    // Execution metrics
    this.metrics = {
      instructionsExecuted: 0,
      classicalOps: 0,
      quantumOps: 0,
      jumpOps: 0,
      executionTime: 0
    };
    
    // Execution hooks for debugging and monitoring
    this.hooks = {
      beforeInstruction: null,
      afterInstruction: null,
      onError: null
    };
    
    logger.debug('BytecodeInterpreter initialized');
  }

  /**
   * Load bytecode into the interpreter
   * @param {Buffer} bytecode - Quantum bytecode buffer
   */
  loadBytecode(bytecode) {
    if (!Buffer.isBuffer(bytecode)) {
      throw new Error('Bytecode must be a Buffer');
    }
    
    this.bytecode = bytecode;
    this.pc = 0;
    this.error = null;
    this.classicalMemory.clear();
    this.qubitIdMap.clear();
    this.jumpTargets.clear();
    
    // Pre-scan for jump targets for optimization
    this.scanJumpTargets();
    
    logger.debug(`Loaded ${bytecode.length} bytes of quantum bytecode`);
  }

  /**
   * Scan bytecode for jump targets
   * @private
   */
  scanJumpTargets() {
    let pc = 0;
    
    while (pc < this.bytecode.length) {
      const opcode = this.bytecode[pc++];
      
      switch (opcode) {
        case QBCOpcode.JUMP:
        case QBCOpcode.CONDITIONAL_JUMP:
          // Read jump target
          const targetAddr = this.bytecode.readUInt32LE(pc);
          this.jumpTargets.set(targetAddr, true);
          pc += 4; // Skip 4 bytes for the target address
          break;
          
        default:
          // Skip operands based on opcode
          pc += this.getOpcodeOperandSize(opcode);
          break;
      }
    }
  }

  /**
   * Execute the loaded bytecode
   * @param {Object} options - Execution options
   * @returns {Object} - Execution results
   */
  execute(options = {}) {
    if (this.bytecode.length === 0) {
      throw new Error('No bytecode loaded');
    }
    
    const startTime = performance.now();
    this.running = true;
    this.pc = 0;
    this.error = null;
    
    // Reset metrics
    this.metrics.instructionsExecuted = 0;
    this.metrics.classicalOps = 0;
    this.metrics.quantumOps = 0;
    this.metrics.jumpOps = 0;
    
    // Set up options
    const maxInstructions = options.maxInstructions || Number.MAX_SAFE_INTEGER;
    const timeout = options.timeout || 0; // 0 means no timeout
    const endTime = timeout ? startTime + timeout : Number.MAX_SAFE_INTEGER;
    
    try {
      while (this.running && this.pc < this.bytecode.length && this.metrics.instructionsExecuted < maxInstructions) {
        // Check for timeout
        if (performance.now() > endTime) {
          throw new Error(`Execution timeout after ${timeout}ms`);
        }
        
        // Execute next instruction
        this.executeNextInstruction();
      }
    } catch (error) {
      this.error = error;
      this.running = false;
      
      if (this.hooks.onError) {
        this.hooks.onError(error, this.pc);
      }
      
      logger.error(`Execution error at PC=${this.pc}: ${error.message}`);
    }
    
    const endRunTime = performance.now();
    this.metrics.executionTime = endRunTime - startTime;
    
    logger.debug(`Bytecode execution completed in ${this.metrics.executionTime.toFixed(2)}ms, ${this.metrics.instructionsExecuted} instructions executed`);
    
    return {
      success: !this.error,
      error: this.error ? this.error.message : null,
      measurements: this.measurementEngine.getAllMeasurements(),
      classicalMemory: Object.fromEntries(this.classicalMemory),
      metrics: { ...this.metrics }
    };
  }

  /**
   * Execute the next instruction at the current program counter
   * @private
   */
  executeNextInstruction() {
    if (this.pc >= this.bytecode.length) {
      this.running = false;
      return;
    }
    
    const opcode = this.bytecode[this.pc++];
    
    // Call hook before execution
    if (this.hooks.beforeInstruction) {
      this.hooks.beforeInstruction(opcode, this.pc - 1);
    }
    
    // Execute the instruction
    switch (opcode) {
      case QBCOpcode.ALLOCATE_QUBIT:
        this.executeAllocateQubit();
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.DEALLOCATE_QUBIT:
        this.executeDeallocateQubit();
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.GATE_X:
        this.executeSingleQubitGate('X');
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.GATE_Y:
        this.executeSingleQubitGate('Y');
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.GATE_Z:
        this.executeSingleQubitGate('Z');
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.GATE_H:
        this.executeSingleQubitGate('H');
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.GATE_S:
        this.executeSingleQubitGate('S');
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.GATE_T:
        this.executeSingleQubitGate('T');
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.GATE_RX:
        this.executeRotationGate('RX');
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.GATE_RY:
        this.executeRotationGate('RY');
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.GATE_RZ:
        this.executeRotationGate('RZ');
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.GATE_CNOT:
        this.executeTwoQubitGate('CNOT');
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.GATE_CZ:
        this.executeTwoQubitGate('CZ');
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.GATE_SWAP:
        this.executeTwoQubitGate('SWAP');
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.GATE_TOFFOLI:
        this.executeThreeQubitGate('Toffoli');
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.MEASURE_QUBIT:
        this.executeMeasureQubit();
        this.metrics.quantumOps++;
        break;
        
      case QBCOpcode.CONDITIONAL_JUMP:
        this.executeConditionalJump();
        this.metrics.jumpOps++;
        break;
        
      case QBCOpcode.JUMP:
        this.executeJump();
        this.metrics.jumpOps++;
        break;
        
      case QBCOpcode.STORE_CLASSICAL:
        this.executeStoreClassical();
        this.metrics.classicalOps++;
        break;
        
      case QBCOpcode.LOAD_CLASSICAL:
        this.executeLoadClassical();
        this.metrics.classicalOps++;
        break;
        
      case QBCOpcode.ADD_CLASSICAL:
        this.executeClassicalOperation('ADD');
        this.metrics.classicalOps++;
        break;
        
      case QBCOpcode.SUB_CLASSICAL:
        this.executeClassicalOperation('SUB');
        this.metrics.classicalOps++;
        break;
        
      case QBCOpcode.MUL_CLASSICAL:
        this.executeClassicalOperation('MUL');
        this.metrics.classicalOps++;
        break;
        
      case QBCOpcode.DIV_CLASSICAL:
        this.executeClassicalOperation('DIV');
        this.metrics.classicalOps++;
        break;
        
      case QBCOpcode.AND_CLASSICAL:
        this.executeClassicalOperation('AND');
        this.metrics.classicalOps++;
        break;
        
      case QBCOpcode.OR_CLASSICAL:
        this.executeClassicalOperation('OR');
        this.metrics.classicalOps++;
        break;
        
      case QBCOpcode.XOR_CLASSICAL:
        this.executeClassicalOperation('XOR');
        this.metrics.classicalOps++;
        break;
        
      case QBCOpcode.NOT_CLASSICAL:
        this.executeClassicalOperation('NOT');
        this.metrics.classicalOps++;
        break;
        
      case QBCOpcode.CMP_EQ_CLASSICAL:
        this.executeClassicalComparison('EQ');
        this.metrics.classicalOps++;
        break;
        
      case QBCOpcode.CMP_NEQ_CLASSICAL:
        this.executeClassicalComparison('NEQ');
        this.metrics.classicalOps++;
        break;
        
      case QBCOpcode.CMP_LT_CLASSICAL:
        this.executeClassicalComparison('LT');
        this.metrics.classicalOps++;
        break;
        
      case QBCOpcode.CMP_GT_CLASSICAL:
        this.executeClassicalComparison('GT');
        this.metrics.classicalOps++;
        break;
        
      case QBCOpcode.END:
        this.running = false;
        break;
        
      default:
        throw new Error(`Unknown opcode: 0x${opcode.toString(16)}`);
    }
    
    this.metrics.instructionsExecuted++;
    
    // Call hook after execution
    if (this.hooks.afterInstruction) {
      this.hooks.afterInstruction(opcode, this.pc);
    }
  }

  /**
   * Execute the ALLOCATE_QUBIT opcode
   * @private
   */
  executeAllocateQubit() {
    const qubitRef = this.bytecode[this.pc++];
    const qubitId = this.qubitRegistry.allocateQubit();
    this.qubitIdMap.set(qubitRef, qubitId);
    
    logger.debug(`Allocated qubit with reference ${qubitRef}, ID: ${qubitId}`);
  }

  /**
   * Execute the DEALLOCATE_QUBIT opcode
   * @private
   */
  executeDeallocateQubit() {
    const qubitRef = this.bytecode[this.pc++];
    const qubitId = this.qubitIdMap.get(qubitRef);
    
    if (!qubitId) {
      throw new Error(`Invalid qubit reference: ${qubitRef}`);
    }
    
    const success = this.qubitRegistry.deallocateQubit(qubitId);
    
    if (success) {
      this.qubitIdMap.delete(qubitRef);
      logger.debug(`Deallocated qubit with reference ${qubitRef}`);
    } else {
      logger.warn(`Failed to deallocate qubit with reference ${qubitRef}`);
    }
  }

  /**
   * Execute a single-qubit gate opcode
   * @private
   * @param {string} gateName - Gate name
   */
  executeSingleQubitGate(gateName) {
    const qubitRef = this.bytecode[this.pc++];
    const qubitId = this.qubitIdMap.get(qubitRef);
    
    if (!qubitId) {
      throw new Error(`Invalid qubit reference: ${qubitRef}`);
    }
    
    this.gateExecutor.applySingleQubitGate(qubitId, gateName);
    logger.debug(`Applied ${gateName} gate to qubit ${qubitRef}`);
  }

  /**
   * Execute a rotation gate opcode
   * @private
   * @param {string} gateName - Gate name (RX, RY, RZ)
   */
  executeRotationGate(gateName) {
    const qubitRef = this.bytecode[this.pc++];
    const qubitId = this.qubitIdMap.get(qubitRef);
    
    if (!qubitId) {
      throw new Error(`Invalid qubit reference: ${qubitRef}`);
    }
    
    // Read the rotation angle (float)
    const theta = this.bytecode.readFloatLE(this.pc);
    this.pc += 4;
    
    switch (gateName) {
      case 'RX':
        this.gateExecutor.applyRX(qubitId, theta);
        break;
      case 'RY':
        this.gateExecutor.applyRY(qubitId, theta);
        break;
      case 'RZ':
        this.gateExecutor.applyRZ(qubitId, theta);
        break;
    }
    
    logger.debug(`Applied ${gateName}(${theta.toFixed(4)}) gate to qubit ${qubitRef}`);
  }

  /**
   * Execute a two-qubit gate opcode
   * @private
   * @param {string} gateName - Gate name (CNOT, CZ, SWAP)
   */
  executeTwoQubitGate(gateName) {
    const qubit1Ref = this.bytecode[this.pc++];
    const qubit2Ref = this.bytecode[this.pc++];
    
    const qubit1Id = this.qubitIdMap.get(qubit1Ref);
    const qubit2Id = this.qubitIdMap.get(qubit2Ref);
    
    if (!qubit1Id || !qubit2Id) {
      throw new Error(`Invalid qubit reference: ${!qubit1Id ? qubit1Ref : qubit2Ref}`);
    }
    
    switch (gateName) {
      case 'CNOT':
        this.gateExecutor.applyCNOT(qubit1Id, qubit2Id);
        break;
      case 'CZ':
        this.gateExecutor.applyCZ(qubit1Id, qubit2Id);
        break;
      case 'SWAP':
        this.gateExecutor.applySWAP(qubit1Id, qubit2Id);
        break;
    }
    
    logger.debug(`Applied ${gateName} gate to qubits ${qubit1Ref} and ${qubit2Ref}`);
  }

  /**
   * Execute a three-qubit gate opcode (e.g., Toffoli/CCNOT)
   * @private
   * @param {string} gateName - Gate name
   */
  executeThreeQubitGate(gateName) {
    const qubit1Ref = this.bytecode[this.pc++];
    const qubit2Ref = this.bytecode[this.pc++];
    const qubit3Ref = this.bytecode[this.pc++];
    
    const qubit1Id = this.qubitIdMap.get(qubit1Ref);
    const qubit2Id = this.qubitIdMap.get(qubit2Ref);
    const qubit3Id = this.qubitIdMap.get(qubit3Ref);
    
    if (!qubit1Id || !qubit2Id || !qubit3Id) {
      throw new Error(`Invalid qubit reference in three-qubit gate`);
    }
    
    if (gateName === 'Toffoli') {
      this.gateExecutor.applyToffoli(qubit1Id, qubit2Id, qubit3Id);
    }
    
    logger.debug(`Applied ${gateName} gate to qubits ${qubit1Ref}, ${qubit2Ref}, and ${qubit3Ref}`);
  }

  /**
   * Execute the MEASURE_QUBIT opcode
   * @private
   */
  executeMeasureQubit() {
    const qubitRef = this.bytecode[this.pc++];
    const resultAddr = this.bytecode[this.pc++];
    
    const qubitId = this.qubitIdMap.get(qubitRef);
    
    if (!qubitId) {
      throw new Error(`Invalid qubit reference: ${qubitRef}`);
    }
    
    const result = this.measurementEngine.measureQubit(qubitId);
    
    // Store the result in classical memory
    this.classicalMemory.set(resultAddr, result);
    
    logger.debug(`Measured qubit ${qubitRef}, result: ${result}, stored at ${resultAddr}`);
  }

  /**
   * Execute the CONDITIONAL_JUMP opcode
   * @private
   */
  executeConditionalJump() {
    const conditionAddr = this.bytecode[this.pc++];
    const targetAddr = this.bytecode.readUInt32LE(this.pc);
    this.pc += 4;
    
    const condition = this.classicalMemory.get(conditionAddr);
    
    if (condition === undefined) {
      throw new Error(`Condition at address ${conditionAddr} not set`);
    }
    
    if (condition) {
      logger.debug(`Conditional jump from ${this.pc} to ${targetAddr}, condition true`);
      this.pc = targetAddr;
    } else {
      logger.debug(`Conditional jump not taken, condition false`);
    }
  }

  /**
   * Execute the JUMP opcode
   * @private
   */
  executeJump() {
    const targetAddr = this.bytecode.readUInt32LE(this.pc);
    this.pc += 4;
    
    logger.debug(`Jump from ${this.pc} to ${targetAddr}`);
    this.pc = targetAddr;
  }

  /**
   * Execute the STORE_CLASSICAL opcode
   * @private
   */
  executeStoreClassical() {
    const addr = this.bytecode[this.pc++];
    const value = this.bytecode.readInt32LE(this.pc);
    this.pc += 4;
    
    this.classicalMemory.set(addr, value);
    
    logger.debug(`Stored value ${value} at classical memory address ${addr}`);
  }

  /**
   * Execute the LOAD_CLASSICAL opcode
   * @private
   */
  executeLoadClassical() {
    const sourceAddr = this.bytecode[this.pc++];
    const destAddr = this.bytecode[this.pc++];
    
    const value = this.classicalMemory.get(sourceAddr);
    
    if (value === undefined) {
      throw new Error(`No value at classical memory address ${sourceAddr}`);
    }
    
    this.classicalMemory.set(destAddr, value);
    
    logger.debug(`Loaded value ${value} from address ${sourceAddr} to address ${destAddr}`);
  }

  /**
   * Execute a classical binary operation opcode
   * @private
   * @param {string} operation - Operation name (ADD, SUB, MUL, DIV, etc.)
   */
  executeClassicalOperation(operation) {
    const aAddr = this.bytecode[this.pc++];
    const bAddr = this.bytecode[this.pc++];
    const resultAddr = this.bytecode[this.pc++];
    
    const a = this.classicalMemory.get(aAddr);
    const b = this.classicalMemory.get(bAddr);
    
    if (a === undefined || b === undefined) {
      throw new Error(`Operand values not set for ${operation} operation`);
    }
    
    let result;
    
    switch (operation) {
      case 'ADD':
        result = a + b;
        break;
      case 'SUB':
        result = a - b;
        break;
      case 'MUL':
        result = a * b;
        break;
      case 'DIV':
        if (b === 0) {
          throw new Error('Division by zero');
        }
        result = Math.floor(a / b); // Integer division
        break;
      case 'AND':
        result = a & b;
        break;
      case 'OR':
        result = a | b;
        break;
      case 'XOR':
        result = a ^ b;
        break;
      case 'NOT':
        // NOT is unary, so we ignore b
        result = ~a;
        break;
    }
    
    this.classicalMemory.set(resultAddr, result);
    
    logger.debug(`Executed ${operation} operation: ${a} ${operation} ${b} = ${result}, stored at ${resultAddr}`);
  }

  /**
   * Execute a classical comparison opcode
   * @private
   * @param {string} comparison - Comparison type (EQ, NEQ, LT, GT)
   */
  executeClassicalComparison(comparison) {
    const aAddr = this.bytecode[this.pc++];
    const bAddr = this.bytecode[this.pc++];
    const resultAddr = this.bytecode[this.pc++];
    
    const a = this.classicalMemory.get(aAddr);
    const b = this.classicalMemory.get(bAddr);
    
    if (a === undefined || b === undefined) {
      throw new Error(`Operand values not set for ${comparison} comparison`);
    }
    
    let result;
    
    switch (comparison) {
      case 'EQ':
        result = a === b ? 1 : 0;
        break;
      case 'NEQ':
        result = a !== b ? 1 : 0;
        break;
      case 'LT':
        result = a < b ? 1 : 0;
        break;
      case 'GT':
        result = a > b ? 1 : 0;
        break;
    }
    
    this.classicalMemory.set(resultAddr, result);
    
    logger.debug(`Executed ${comparison} comparison: ${a} ${comparison} ${b} = ${result}, stored at ${resultAddr}`);
  }

  /**
   * Get the size of operands for an opcode
   * @private
   * @param {number} opcode - Opcode
   * @returns {number} - Size of operands in bytes
   */
  getOpcodeOperandSize(opcode) {
    switch (opcode) {
      case QBCOpcode.ALLOCATE_QUBIT:
      case QBCOpcode.DEALLOCATE_QUBIT:
        return 1; // 1 byte for qubit reference
        
      case QBCOpcode.GATE_X:
      case QBCOpcode.GATE_Y:
      case QBCOpcode.GATE_Z:
      case QBCOpcode.GATE_H:
      case QBCOpcode.GATE_S:
      case QBCOpcode.GATE_T:
        return 1; // 1 byte for qubit reference
        
      case QBCOpcode.GATE_RX:
      case QBCOpcode.GATE_RY:
      case QBCOpcode.GATE_RZ:
        return 5; // 1 byte for qubit reference + 4 bytes for angle (float)
        
      case QBCOpcode.GATE_CNOT:
      case QBCOpcode.GATE_CZ:
      case QBCOpcode.GATE_SWAP:
        return 2; // 2 bytes for qubit references
        
      case QBCOpcode.GATE_TOFFOLI:
        return 3; // 3 bytes for qubit references
        
      case QBCOpcode.MEASURE_QUBIT:
        return 2; // 1 byte for qubit reference + 1 byte for result address
        
      case QBCOpcode.CONDITIONAL_JUMP:
        return 5; // 1 byte for condition address + 4 bytes for target address
        
      case QBCOpcode.JUMP:
        return 4; // 4 bytes for target address
        
      case QBCOpcode.STORE_CLASSICAL:
        return 5; // 1 byte for address + 4 bytes for value
        
      case QBCOpcode.LOAD_CLASSICAL:
        return 2; // 1 byte for source address + 1 byte for destination address
        
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
        
      case QBCOpcode.NOT_CLASSICAL:
        return 2; // 2 bytes for addresses (1 operand + result)
        
      case QBCOpcode.END:
        return 0;
        
      default:
        return 0;
    }
  }

  /**
   * Set a hook function
   * @param {string} hookName - Hook name
   * @param {Function} callback - Callback function
   */
  setHook(hookName, callback) {
    if (!this.hooks.hasOwnProperty(hookName)) {
      throw new Error(`Unknown hook: ${hookName}`);
    }
    
    this.hooks[hookName] = callback;
  }

  /**
   * Get the current execution metrics
   * @returns {Object} - Execution metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Reset the interpreter state
   */
  reset() {
    this.pc = 0;
    this.running = false;
    this.error = null;
    this.classicalMemory.clear();
    this.qubitIdMap.clear();
    this.jumpTargets.clear();
    
    // Reset metrics
    this.metrics.instructionsExecuted = 0;
    this.metrics.classicalOps = 0;
    this.metrics.quantumOps = 0;
    this.metrics.jumpOps = 0;
    this.metrics.executionTime = 0;
    
    logger.debug('BytecodeInterpreter reset');
  }
}

export default BytecodeInterpreter;