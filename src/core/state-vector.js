// src/core/state-vector.js
// Manages the quantum state vector representation and operations

import Complex from 'complex.js';
import * as math from 'mathjs';
import { createLogger } from '../utils/logger.js';
import { isUnitary } from '../utils/matrix-operations.js';
import { ComplexNumber } from '../utils/complex-math.js';

const logger = createLogger('QVM:StateVector');

export class StateVector {

  /**
   * Set the state vector directly
   * @param {Array<ComplexNumber>} newStateVector - New state vector
   */
  setStateVector(newStateVector) {
    if (!Array.isArray(newStateVector)) {
      throw new Error('State vector must be an array');
    }
    
    // Verify that the new state vector is valid (size matches qubit count)
    const expectedSize = Math.pow(2, this.qubitCount);
    if (newStateVector.length !== expectedSize) {
      throw new Error(`Invalid state vector size: ${newStateVector.length}, expected ${expectedSize}`);
    }
    
    // Copy the new state vector
    this.stateVector = [...newStateVector];
    
    // Normalize the state vector
    this.normalize();
    
    // Invalidate the probability cache
    this.invalidateProbabilityCache();
    
    // Update memory usage metrics
    this.updateMemoryUsage();
    
    logger.debug(`Set new state vector with ${newStateVector.length} amplitudes`);
  }

  /**
   * Creates a new StateVector instance
   * @param {number} initialQubitCount - Initial number of qubits
   * @param {Object} options - Configuration options
   */
  constructor(initialQubitCount = 0, options = {}) {
    this.qubitCount = initialQubitCount;
    this.options = {
      precision: options.precision || 1e-10,
      useOptimizedMemory: options.useOptimizedMemory || false,
      maxQubits: options.maxQubits || 32,
      ...options
    };
    
    // Initialize the state vector with |0...0⟩
    this.stateVector = this.initializeStateVector(initialQubitCount);
    
    // Cache for calculated probabilities to improve performance
    this.probabilityCache = new Map();
    
    // Performance metrics
    this.metrics = {
      gateOperations: 0,
      stateVectorSize: Math.pow(2, initialQubitCount),
      memoryUsage: 0
    };
    
    this.updateMemoryUsage();
    logger.debug(`StateVector initialized with ${initialQubitCount} qubits`);
  }

  /**
   * Initialize a state vector for the given number of qubits
   * @private
   * @param {number} qubitCount - Number of qubits
   * @returns {Array<ComplexNumber>} - Initial state vector
   */
  initializeStateVector(qubitCount) {
    const stateSize = Math.pow(2, qubitCount);
    
    if (stateSize > Math.pow(2, this.options.maxQubits)) {
      throw new Error(`Cannot initialize state vector with ${qubitCount} qubits. Maximum is ${this.options.maxQubits}.`);
    }
    
    // Create state vector with |0...0⟩ = 1, all others = 0
    const stateVector = new Array(stateSize);
    stateVector[0] = new ComplexNumber(1, 0);
    
    for (let i = 1; i < stateSize; i++) {
      stateVector[i] = new ComplexNumber(0, 0);
    }
    
    return stateVector;
  }

  /**
   * Expand the state vector when adding a new qubit
   */
  expandStateVector() {
    this.invalidateProbabilityCache();
    
    const oldSize = this.stateVector.length;
    const newSize = oldSize * 2;
    
    logger.debug(`Expanding state vector from ${oldSize} to ${newSize} amplitudes`);
    
    if (newSize > Math.pow(2, this.options.maxQubits)) {
      throw new Error(`Cannot expand state vector beyond ${this.options.maxQubits} qubits`);
    }
    
    // Create an expanded state vector with the new qubit in |0⟩ state
    const newStateVector = new Array(newSize);
    
    for (let i = 0; i < oldSize; i++) {
      // Copy existing amplitudes to the first half of the new vector
      newStateVector[i] = this.stateVector[i];
      // Set the second half to zero (representing |1⟩ state of the new qubit)
      newStateVector[i + oldSize] = new ComplexNumber(0, 0);
    }
    
    this.stateVector = newStateVector;
    this.qubitCount++;
    
    this.metrics.stateVectorSize = newSize;
    this.updateMemoryUsage();
  }

  /**
   * Apply a single-qubit gate to the state vector
   * @param {number} qubitIndex - Index of the target qubit
   * @param {Array<Array<ComplexNumber>>} gateMatrix - 2x2 unitary gate matrix
   */
  applySingleQubitGate(qubitIndex, gateMatrix) {
    this.validateQubitIndex(qubitIndex);
    this.validateGateMatrix(gateMatrix, 2);
    this.invalidateProbabilityCache();
    
    const stateSize = this.stateVector.length;
    const newStateVector = new Array(stateSize);
    
    // Initialize the new state vector with zeros
    for (let i = 0; i < stateSize; i++) {
      newStateVector[i] = new ComplexNumber(0, 0);
    }
    
    // Iterate through all basis states and apply the gate
    for (let i = 0; i < stateSize; i++) {
      // Determine if the target qubit is 0 or 1 in this basis state
      const bitValue = (i >> qubitIndex) & 1;
      
      // Calculate the index with the target qubit flipped
      const flippedIndex = i ^ (1 << qubitIndex);
      
      // Apply the appropriate elements of the gate matrix
      if (bitValue === 0) {
        // |0⟩ -> gateMatrix[0][0]|0⟩ + gateMatrix[1][0]|1⟩
        newStateVector[i] = newStateVector[i].add(
          this.stateVector[i].multiply(gateMatrix[0][0])
        );
        newStateVector[flippedIndex] = newStateVector[flippedIndex].add(
          this.stateVector[i].multiply(gateMatrix[1][0])
        );
      } else {
        // |1⟩ -> gateMatrix[0][1]|0⟩ + gateMatrix[1][1]|1⟩
        newStateVector[flippedIndex] = newStateVector[flippedIndex].add(
          this.stateVector[i].multiply(gateMatrix[0][1])
        );
        newStateVector[i] = newStateVector[i].add(
          this.stateVector[i].multiply(gateMatrix[1][1])
        );
      }
    }
    
    this.stateVector = newStateVector;
    this.normalize();
    
    this.metrics.gateOperations++;
    this.updateMemoryUsage();
    
    logger.debug(`Applied single-qubit gate to qubit ${qubitIndex}`);
  }

  /**
   * Apply a two-qubit gate to the state vector
   * @param {number} controlQubitIndex - Index of the control qubit
   * @param {number} targetQubitIndex - Index of the target qubit
   * @param {Array<Array<ComplexNumber>>} gateMatrix - 4x4 unitary gate matrix
   */
  applyTwoQubitGate(controlQubitIndex, targetQubitIndex, gateMatrix) {
    this.validateQubitIndex(controlQubitIndex);
    this.validateQubitIndex(targetQubitIndex);
    this.validateGateMatrix(gateMatrix, 4);
    this.invalidateProbabilityCache();
    
    if (controlQubitIndex === targetQubitIndex) {
      throw new Error('Control and target qubits must be different');
    }
    
    const stateSize = this.stateVector.length;
    const newStateVector = new Array(stateSize);
    
    // Initialize the new state vector with zeros
    for (let i = 0; i < stateSize; i++) {
      newStateVector[i] = new ComplexNumber(0, 0);
    }
    
    // Apply the two-qubit gate
    for (let i = 0; i < stateSize; i++) {
      const controlBit = (i >> controlQubitIndex) & 1;
      const targetBit = (i >> targetQubitIndex) & 1;
      
      // Calculate basis state index for the two qubits (0-3)
      const basisIndex = (controlBit << 1) | targetBit;
      
      // For each possible output state
      for (let j = 0; j < 4; j++) {
        // Calculate the new control and target bit values
        const newControlBit = (j >> 1) & 1;
        const newTargetBit = j & 1;
        
        // Calculate the new basis state index
        let newIndex = i;
        // Clear the bits for control and target
        newIndex &= ~(1 << controlQubitIndex);
        newIndex &= ~(1 << targetQubitIndex);
        // Set the new bits
        newIndex |= (newControlBit << controlQubitIndex);
        newIndex |= (newTargetBit << targetQubitIndex);
        
        // Apply the gate matrix element
        newStateVector[newIndex] = newStateVector[newIndex].add(
          this.stateVector[i].multiply(gateMatrix[j][basisIndex])
        );
      }
    }
    
    this.stateVector = newStateVector;
    this.normalize();
    
    this.metrics.gateOperations++;
    this.updateMemoryUsage();
    
    logger.debug(`Applied two-qubit gate to qubits ${controlQubitIndex} and ${targetQubitIndex}`);
  }

  /**
   * Apply a controlled-NOT (CNOT) gate - optimized implementation
   * @param {number} controlQubitIndex - Index of the control qubit
   * @param {number} targetQubitIndex - Index of the target qubit
   */
  applyCNOT(controlQubitIndex, targetQubitIndex) {
    this.validateQubitIndex(controlQubitIndex);
    this.validateQubitIndex(targetQubitIndex);
    this.invalidateProbabilityCache();
    
    if (controlQubitIndex === targetQubitIndex) {
      throw new Error('Control and target qubits must be different');
    }
    
    const stateSize = this.stateVector.length;
    const newStateVector = new Array(stateSize);
    
    // Initialize the new state vector with zeros
    for (let i = 0; i < stateSize; i++) {
      newStateVector[i] = new ComplexNumber(0, 0);
    }
    
    // Apply the CNOT gate
    for (let i = 0; i < stateSize; i++) {
      // Check if control bit is 1
      if ((i >> controlQubitIndex) & 1) {
        // Flip target bit
        const flippedIndex = i ^ (1 << targetQubitIndex);
        // Copy amplitude to flipped position
        newStateVector[flippedIndex] = this.stateVector[i];
      } else {
        // Control bit is 0, keep the state
        newStateVector[i] = this.stateVector[i];
      }
    }
    
    this.stateVector = newStateVector;
    
    this.metrics.gateOperations++;
    this.updateMemoryUsage();
    
    logger.debug(`Applied CNOT gate from control ${controlQubitIndex} to target ${targetQubitIndex}`);
  }

  /**
   * Measure a qubit and collapse the state
   * @param {number} qubitIndex - Index of the qubit to measure
   * @returns {number} - Measurement result (0 or 1)
   */
  measureQubit(qubitIndex) {
    this.validateQubitIndex(qubitIndex);
    this.invalidateProbabilityCache();
    
    // Calculate probabilities for |0⟩ and |1⟩
    let prob0 = 0;
    let prob1 = 0;
    
    for (let i = 0; i < this.stateVector.length; i++) {
      const bitValue = (i >> qubitIndex) & 1;
      const prob = this.stateVector[i].magnitudeSquared();
      
      if (bitValue === 0) {
        prob0 += prob;
      } else {
        prob1 += prob;
      }
    }
    
    // Determine the measurement outcome
    const random = Math.random();
    const outcome = random < prob0 ? 0 : 1;
    
    logger.debug(`Measuring qubit ${qubitIndex}: probabilities [0: ${prob0.toFixed(4)}, 1: ${prob1.toFixed(4)}], outcome: ${outcome}`);
    
    // Collapse the state vector based on the measurement
    const newStateVector = new Array(this.stateVector.length);
    for (let i = 0; i < newStateVector.length; i++) {
      newStateVector[i] = new ComplexNumber(0, 0);
    }
    
    let normFactor = 0;
    
    for (let i = 0; i < this.stateVector.length; i++) {
      const bitValue = (i >> qubitIndex) & 1;
      
      if (bitValue === outcome) {
        newStateVector[i] = this.stateVector[i];
        normFactor += this.stateVector[i].magnitudeSquared();
      }
    }
    
    // Normalize the new state vector
    normFactor = Math.sqrt(normFactor);
    for (let i = 0; i < newStateVector.length; i++) {
      if (!newStateVector[i].isZero()) {
        newStateVector[i] = newStateVector[i].divide(normFactor);
      }
    }
    
    this.stateVector = newStateVector;
    this.updateMemoryUsage();
    
    return outcome;
  }

  /**
   * Normalize the state vector
   */
  normalize() {
    // Calculate the norm of the state vector
    let normSquared = 0;
    for (const amplitude of this.stateVector) {
      normSquared += amplitude.magnitudeSquared();
    }
    
    const norm = Math.sqrt(normSquared);
    
    // Only normalize if needed
    if (Math.abs(norm - 1) > this.options.precision) {
      // Normalize each amplitude
      for (let i = 0; i < this.stateVector.length; i++) {
        this.stateVector[i] = this.stateVector[i].divide(norm);
      }
      
      logger.debug(`Normalized state vector (previous norm: ${norm.toFixed(6)})`);
    }
  }
  
  /**
   * Get the probability amplitude for a specific basis state
   * @param {number} basisState - Basis state index
   * @returns {ComplexNumber} - Probability amplitude
   */
  getAmplitude(basisState) {
    if (basisState >= this.stateVector.length) {
      throw new Error(`Basis state index ${basisState} out of bounds`);
    }
    
    return this.stateVector[basisState];
  }
  
  /**
   * Get the probability of measuring a specific basis state
   * @param {number} basisState - Basis state index
   * @returns {number} - Probability
   */
  getProbability(basisState) {
    // Check cache first
    if (this.probabilityCache.has(basisState)) {
      return this.probabilityCache.get(basisState);
    }
    
    const amplitude = this.getAmplitude(basisState);
    const probability = amplitude.magnitudeSquared();
    
    // Cache the result
    this.probabilityCache.set(basisState, probability);
    
    return probability;
  }
  
  /**
   * Invalidate the probability cache after state changes
   * @private
   */
  invalidateProbabilityCache() {
    this.probabilityCache.clear();
  }
  
  /**
   * Get the complete state vector
   * @returns {Array<ComplexNumber>} - Current state vector
   */
  getStateVector() {
    return [...this.stateVector];
  }
  
  /**
   * Get the number of qubits
   * @returns {number} - Number of qubits
   */
  getQubitCount() {
    return this.qubitCount;
  }
  
  /**
   * Reset the state vector to |0...0⟩
   */
  reset() {
    this.stateVector = this.initializeStateVector(this.qubitCount);
    this.invalidateProbabilityCache();
    this.metrics.gateOperations = 0;
    this.updateMemoryUsage();
    
    logger.debug('State vector reset to |0...0⟩');
  }
  
  /**
   * Update memory usage metrics
   * @private
   */
  updateMemoryUsage() {
    // Each complex number uses approximately 16 bytes (8 bytes per double)
    this.metrics.memoryUsage = this.stateVector.length * 16;
  }
  
  /**
   * Validate qubit index is within bounds
   * @private
   * @param {number} qubitIndex - Qubit index to validate
   */
  validateQubitIndex(qubitIndex) {
    if (qubitIndex < 0 || qubitIndex >= this.qubitCount) {
      throw new Error(`Qubit index ${qubitIndex} out of bounds (0-${this.qubitCount - 1})`);
    }
  }
  
  /**
   * Validate gate matrix is unitary and correct size
   * @private
   * @param {Array<Array<ComplexNumber>>} gateMatrix - Gate matrix to validate
   * @param {number} size - Expected matrix size
   */
  validateGateMatrix(gateMatrix, size) {
    if (!gateMatrix || !Array.isArray(gateMatrix) || gateMatrix.length !== size) {
      throw new Error(`Gate matrix must be a ${size}x${size} array`);
    }
    
    for (const row of gateMatrix) {
      if (!Array.isArray(row) || row.length !== size) {
        throw new Error(`Gate matrix must be a ${size}x${size} array`);
      }
    }
    
    // Check if the matrix is unitary (only in development mode for performance)
    if (process.env.NODE_ENV === 'development') {
      if (!isUnitary(gateMatrix)) {
        logger.warn('Gate matrix is not unitary! This may lead to invalid quantum states.');
      }
    }
  }
}

export default StateVector;