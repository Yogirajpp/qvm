// src/core/gate-executor.js
// Handles execution of quantum gates on the state vector

import { createLogger } from '../utils/logger.js';
import { ComplexNumber } from '../utils/complex-math.js';
import { GATES } from '../utils/quantum-gates.js';

const logger = createLogger('QVM:GateExecutor');

export class GateExecutor {
  /**
   * Creates a new GateExecutor instance
   * @param {Object} stateVector - StateVector instance
   * @param {Object} qubitRegistry - QubitRegistry instance
   */
  constructor(stateVector, qubitRegistry) {
    this.stateVector = stateVector;
    this.qubitRegistry = qubitRegistry;
    
    // Metrics for gate execution
    this.metrics = {
      totalGatesExecuted: 0,
      gateTypeCount: new Map()
    };
    
    logger.debug('GateExecutor initialized');
  }

  /**
   * Apply a standard single-qubit gate
   * @param {string} qubitId - Qubit identifier
   * @param {string} gateName - Gate name ('X', 'Y', 'Z', 'H', etc.)
   */
  applySingleQubitGate(qubitId, gateName) {
    const qubitIndex = this.qubitRegistry.getQubitIndex(qubitId);
    
    if (!GATES[gateName]) {
      throw new Error(`Unknown gate: ${gateName}`);
    }
    
    const gateMatrix = GATES[gateName];
    this.stateVector.applySingleQubitGate(qubitIndex, gateMatrix);
    
    this.updateMetrics(gateName);
    logger.debug(`Applied ${gateName} gate to qubit ${qubitId}`);
  }

  /**
   * Apply a rotation gate around the X-axis
   * @param {string} qubitId - Qubit identifier
   * @param {number} theta - Rotation angle in radians
   */
  applyRX(qubitId, theta) {
    const qubitIndex = this.qubitRegistry.getQubitIndex(qubitId);
    
    const cos = Math.cos(theta / 2);
    const sin = Math.sin(theta / 2);
    
    const gateMatrix = [
      [new ComplexNumber(cos, 0), new ComplexNumber(0, -sin)],
      [new ComplexNumber(0, -sin), new ComplexNumber(cos, 0)]
    ];
    
    this.stateVector.applySingleQubitGate(qubitIndex, gateMatrix);
    
    this.updateMetrics('RX');
    logger.debug(`Applied RX(${theta.toFixed(4)}) gate to qubit ${qubitId}`);
  }

  /**
   * Apply a rotation gate around the Y-axis
   * @param {string} qubitId - Qubit identifier
   * @param {number} theta - Rotation angle in radians
   */
  applyRY(qubitId, theta) {
    const qubitIndex = this.qubitRegistry.getQubitIndex(qubitId);
    
    const cos = Math.cos(theta / 2);
    const sin = Math.sin(theta / 2);
    
    const gateMatrix = [
      [new ComplexNumber(cos, 0), new ComplexNumber(-sin, 0)],
      [new ComplexNumber(sin, 0), new ComplexNumber(cos, 0)]
    ];
    
    this.stateVector.applySingleQubitGate(qubitIndex, gateMatrix);
    
    this.updateMetrics('RY');
    logger.debug(`Applied RY(${theta.toFixed(4)}) gate to qubit ${qubitId}`);
  }

  /**
   * Apply a rotation gate around the Z-axis
   * @param {string} qubitId - Qubit identifier
   * @param {number} theta - Rotation angle in radians
   */
  applyRZ(qubitId, theta) {
    const qubitIndex = this.qubitRegistry.getQubitIndex(qubitId);
    
    const phase1 = new ComplexNumber(Math.cos(-theta/2), Math.sin(-theta/2));
    const phase2 = new ComplexNumber(Math.cos(theta/2), Math.sin(theta/2));
    
    const gateMatrix = [
      [phase1, new ComplexNumber(0, 0)],
      [new ComplexNumber(0, 0), phase2]
    ];
    
    this.stateVector.applySingleQubitGate(qubitIndex, gateMatrix);
    
    this.updateMetrics('RZ');
    logger.debug(`Applied RZ(${theta.toFixed(4)}) gate to qubit ${qubitId}`);
  }

  /**
   * Apply a controlled-NOT (CNOT) gate
   * @param {string} controlQubitId - Control qubit identifier
   * @param {string} targetQubitId - Target qubit identifier
   */
  applyCNOT(controlQubitId, targetQubitId) {
    const controlIndex = this.qubitRegistry.getQubitIndex(controlQubitId);
    const targetIndex = this.qubitRegistry.getQubitIndex(targetQubitId);
    
    // Record entanglement
    this.qubitRegistry.recordEntanglement(controlQubitId, targetQubitId);
    
    // Use the optimized CNOT implementation
    this.stateVector.applyCNOT(controlIndex, targetIndex);
    
    this.updateMetrics('CNOT');
    logger.debug(`Applied CNOT gate from control ${controlQubitId} to target ${targetQubitId}`);
  }

  /**
   * Apply a controlled-Z (CZ) gate
   * @param {string} controlQubitId - Control qubit identifier
   * @param {string} targetQubitId - Target qubit identifier
   */
  applyCZ(controlQubitId, targetQubitId) {
    const controlIndex = this.qubitRegistry.getQubitIndex(controlQubitId);
    const targetIndex = this.qubitRegistry.getQubitIndex(targetQubitId);
    
    // Record entanglement
    this.qubitRegistry.recordEntanglement(controlQubitId, targetQubitId);
    
    // CZ gate matrix (4x4)
    const gateMatrix = [
      [new ComplexNumber(1, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0)],
      [new ComplexNumber(0, 0), new ComplexNumber(1, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0)],
      [new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
      [new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(-1, 0)]
    ];
    
    this.stateVector.applyTwoQubitGate(controlIndex, targetIndex, gateMatrix);
    
    this.updateMetrics('CZ');
    logger.debug(`Applied CZ gate from control ${controlQubitId} to target ${targetQubitId}`);
  }

  /**
   * Apply a SWAP gate
   * @param {string} qubitId1 - First qubit identifier
   * @param {string} qubitId2 - Second qubit identifier
   */
  applySWAP(qubitId1, qubitId2) {
    const index1 = this.qubitRegistry.getQubitIndex(qubitId1);
    const index2 = this.qubitRegistry.getQubitIndex(qubitId2);
    
    // Apply the optimized SWAP implementation
    this.stateVector.applySWAP(index1, index2);
    
    this.updateMetrics('SWAP');
    logger.debug(`Applied SWAP gate between qubits ${qubitId1} and ${qubitId2}`);
  }

  /**
   * Apply a Toffoli (CCNOT) gate
   * @param {string} control1QubitId - First control qubit identifier
   * @param {string} control2QubitId - Second control qubit identifier
   * @param {string} targetQubitId - Target qubit identifier
   */
  applyToffoli(control1QubitId, control2QubitId, targetQubitId) {
    const control1Index = this.qubitRegistry.getQubitIndex(control1QubitId);
    const control2Index = this.qubitRegistry.getQubitIndex(control2QubitId);
    const targetIndex = this.qubitRegistry.getQubitIndex(targetQubitId);
    
    // Record entanglements
    this.qubitRegistry.recordEntanglement(control1QubitId, targetQubitId);
    this.qubitRegistry.recordEntanglement(control2QubitId, targetQubitId);
    
    // Apply the Toffoli gate
    const stateSize = Math.pow(2, this.stateVector.getQubitCount());
    const newStateVector = Array.from(this.stateVector.getStateVector());
    
    for (let i = 0; i < stateSize; i++) {
      // Check if both control bits are 1
      if ((i & (1 << control1Index)) && (i & (1 << control2Index))) {
        // Flip the target bit
        const flippedIndex = i ^ (1 << targetIndex);
        
        // Swap amplitudes
        [newStateVector[i], newStateVector[flippedIndex]] = 
          [newStateVector[flippedIndex], newStateVector[i]];
      }
    }
    
    // Update the state vector
    this.stateVector.setStateVector(newStateVector);
    
    this.updateMetrics('Toffoli');
    logger.debug(`Applied Toffoli gate with controls ${control1QubitId}, ${control2QubitId} and target ${targetQubitId}`);
  }

  /**
   * Apply a custom unitary gate defined by a matrix
   * @param {string} qubitId - Qubit identifier
   * @param {Array<Array<ComplexNumber>>} gateMatrix - 2x2 unitary gate matrix
   */
  applyCustomGate(qubitId, gateMatrix) {
    const qubitIndex = this.qubitRegistry.getQubitIndex(qubitId);
    this.stateVector.applySingleQubitGate(qubitIndex, gateMatrix);
    
    this.updateMetrics('Custom');
    logger.debug(`Applied custom gate to qubit ${qubitId}`);
  }

  /**
   * Apply a custom controlled gate
   * @param {string} controlQubitId - Control qubit identifier
   * @param {string} targetQubitId - Target qubit identifier
   * @param {Array<Array<ComplexNumber>>} gateMatrix - 2x2 unitary gate matrix for target
   */
  applyControlledGate(controlQubitId, targetQubitId, gateMatrix) {
    const controlIndex = this.qubitRegistry.getQubitIndex(controlQubitId);
    const targetIndex = this.qubitRegistry.getQubitIndex(targetQubitId);
    
    // Record entanglement
    this.qubitRegistry.recordEntanglement(controlQubitId, targetQubitId);
    
    // Create the full controlled gate matrix
    const identity = [
      [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
      [new ComplexNumber(0, 0), new ComplexNumber(1, 0)]
    ];
    
    // Apply the controlled operation
    const stateSize = Math.pow(2, this.stateVector.getQubitCount());
    const newStateVector = Array.from(this.stateVector.getStateVector());
    
    for (let i = 0; i < stateSize; i++) {
      // Only apply if control qubit is 1
      if (i & (1 << controlIndex)) {
        const targetBit = (i >> targetIndex) & 1;
        
        // Apply the gate matrix to the target qubit
        if (targetBit === 0) {
          // Target is |0⟩, apply gateMatrix[0][0] and gateMatrix[1][0]
          const flippedIndex = i ^ (1 << targetIndex);
          
          // Save original amplitude
          const originalAmp = newStateVector[i];
          
          // Apply gate
          newStateVector[i] = originalAmp.multiply(gateMatrix[0][0]);
          newStateVector[flippedIndex] = originalAmp.multiply(gateMatrix[1][0]);
        } else {
          // Target is |1⟩, apply gateMatrix[0][1] and gateMatrix[1][1]
          const flippedIndex = i ^ (1 << targetIndex);
          
          // Save original amplitude
          const originalAmp = newStateVector[i];
          
          // Apply gate
          newStateVector[flippedIndex] = originalAmp.multiply(gateMatrix[0][1]);
          newStateVector[i] = originalAmp.multiply(gateMatrix[1][1]);
        }
      }
    }
    
    // Update the state vector
    this.stateVector.setStateVector(newStateVector);
    this.stateVector.normalize();
    
    this.updateMetrics('ControlledCustom');
    logger.debug(`Applied controlled custom gate from control ${controlQubitId} to target ${targetQubitId}`);
  }

  /**
   * Apply a phase shift gate
   * @param {string} qubitId - Qubit identifier
   * @param {number} phi - Phase angle in radians
   */
  applyPhaseShift(qubitId, phi) {
    const qubitIndex = this.qubitRegistry.getQubitIndex(qubitId);
    
    const gateMatrix = [
      [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
      [new ComplexNumber(0, 0), new ComplexNumber(Math.cos(phi), Math.sin(phi))]
    ];
    
    this.stateVector.applySingleQubitGate(qubitIndex, gateMatrix);
    
    this.updateMetrics('Phase');
    logger.debug(`Applied phase shift of ${phi.toFixed(4)} to qubit ${qubitId}`);
  }

  /**
   * Reset a qubit to |0⟩ state
   * @param {string} qubitId - Qubit identifier
   */
  resetQubit(qubitId) {
    const qubitIndex = this.qubitRegistry.getQubitIndex(qubitId);
    
    // Measure the qubit first
    const outcome = this.stateVector.measureQubit(qubitIndex);
    
    // If outcome is 1, apply X gate to flip it to 0
    if (outcome === 1) {
      this.applySingleQubitGate(qubitId, 'X');
    }
    
    this.updateMetrics('Reset');
    logger.debug(`Reset qubit ${qubitId} to |0⟩ state`);
  }

  /**
   * Update execution metrics
   * @private
   * @param {string} gateName - Name of the gate applied
   */
  updateMetrics(gateName) {
    this.metrics.totalGatesExecuted++;
    
    const currentCount = this.metrics.gateTypeCount.get(gateName) || 0;
    this.metrics.gateTypeCount.set(gateName, currentCount + 1);
  }

  /**
   * Get execution metrics
   * @returns {Object} - Gate execution metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      gateTypeCount: Object.fromEntries(this.metrics.gateTypeCount)
    };
  }

  /**
   * Reset execution metrics
   */
  resetMetrics() {
    this.metrics.totalGatesExecuted = 0;
    this.metrics.gateTypeCount.clear();
  }
}

export default GateExecutor;