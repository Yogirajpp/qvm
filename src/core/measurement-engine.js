// src/core/measurement-engine.js
// Handles quantum state measurements and result tracking

import { createLogger } from '../utils/logger.js';

const logger = createLogger('QVM:MeasurementEngine');

export class MeasurementEngine {
  /**
   * Creates a new MeasurementEngine instance
   * @param {Object} stateVector - StateVector instance
   * @param {Object} qubitRegistry - QubitRegistry instance
   */
  constructor(stateVector, qubitRegistry) {
    this.stateVector = stateVector;
    this.qubitRegistry = qubitRegistry;
    
    // Store measurement results for later retrieval
    this.measurementResults = new Map();
    
    // Measurement history for reproducibility and auditing
    this.measurementHistory = [];
    
    // Metrics for measurement operations
    this.metrics = {
      totalMeasurements: 0,
      outcomeCounts: { 0: 0, 1: 0 }
    };
    
    logger.debug('MeasurementEngine initialized');
  }

  /**
   * Measure a single qubit and return the result (0 or 1)
   * @param {string} qubitId - Qubit identifier
   * @param {boolean} nonCollapsing - If true, perform a non-collapsing measurement
   * @returns {number} - Measurement result (0 or 1)
   */
  measureQubit(qubitId, nonCollapsing = false) {
    const qubitIndex = this.qubitRegistry.getQubitIndex(qubitId);
    
    // Calculate probabilities without collapsing if requested
    if (nonCollapsing) {
      const prob0 = this.getProbability(qubitId, 0);
      const prob1 = this.getProbability(qubitId, 1);
      
      // Simulate a measurement without collapsing
      const result = Math.random() < prob0 ? 0 : 1;
      
      logger.debug(`Non-collapsing measurement of qubit ${qubitId}: ${result} (p0=${prob0.toFixed(4)}, p1=${prob1.toFixed(4)})`);
      
      return result;
    }
    
    // Perform a real measurement that collapses the state
    const result = this.stateVector.measureQubit(qubitIndex);
    
    // Store the measurement result
    this.measurementResults.set(qubitId, result);
    
    // Record in history
    this.measurementHistory.push({
      qubitId,
      result,
      timestamp: Date.now()
    });
    
    // Update metrics
    this.metrics.totalMeasurements++;
    this.metrics.outcomeCounts[result]++;
    
    logger.debug(`Measured qubit ${qubitId}: ${result}`);
    
    return result;
  }

  /**
   * Measure multiple qubits and return the results
   * @param {string[]} qubitIds - Array of qubit identifiers
   * @param {boolean} nonCollapsing - If true, perform non-collapsing measurements
   * @returns {Map<string, number>} - Map of qubit IDs to results
   */
  measureQubits(qubitIds, nonCollapsing = false) {
    const results = new Map();
    
    // Measure each qubit and store the result
    for (const qubitId of qubitIds) {
      const result = this.measureQubit(qubitId, nonCollapsing);
      results.set(qubitId, result);
    }
    
    return results;
  }

  /**
   * Get the probability of a specific measurement outcome for a qubit
   * @param {string} qubitId - Qubit identifier
   * @param {number} outcome - Desired outcome (0 or 1)
   * @returns {number} - Probability
   */
  getProbability(qubitId, outcome) {
    if (outcome !== 0 && outcome !== 1) {
      throw new Error('Outcome must be 0 or 1');
    }
    
    const qubitIndex = this.qubitRegistry.getQubitIndex(qubitId);
    let probability = 0;
    
    // Calculate the probability by summing over all basis states
    for (let i = 0; i < Math.pow(2, this.stateVector.getQubitCount()); i++) {
      const bitValue = (i >> qubitIndex) & 1;
      
      if (bitValue === outcome) {
        const amplitude = this.stateVector.getAmplitude(i);
        probability += amplitude.magnitudeSquared();
      }
    }
    
    return probability;
  }

  /**
   * Get the joint probability of a specific combination of outcomes
   * @param {Map<string, number>} outcomeMap - Map of qubit IDs to desired outcomes
   * @returns {number} - Joint probability
   */
  getJointProbability(outcomeMap) {
    let probability = 0;
    const stateSize = Math.pow(2, this.stateVector.getQubitCount());
    
    // Convert outcomeMap to index and value pairs
    const indexOutcomePairs = [];
    for (const [qubitId, outcome] of outcomeMap.entries()) {
      if (outcome !== 0 && outcome !== 1) {
        throw new Error('Outcomes must be 0 or 1');
      }
      
      const qubitIndex = this.qubitRegistry.getQubitIndex(qubitId);
      indexOutcomePairs.push([qubitIndex, outcome]);
    }
    
    // Calculate the joint probability by summing over all matching basis states
    for (let i = 0; i < stateSize; i++) {
      // Check if this basis state matches all the specified outcomes
      const matches = indexOutcomePairs.every(([qubitIndex, outcome]) => {
        const bitValue = (i >> qubitIndex) & 1;
        return bitValue === outcome;
      });
      
      if (matches) {
        const amplitude = this.stateVector.getAmplitude(i);
        probability += amplitude.magnitudeSquared();
      }
    }
    
    return probability;
  }

  /**
   * Measure all qubits and collapse to a single basis state
   * @returns {string} - Resulting bit string (e.g., "01101")
   */
  measureAllQubits() {
    const qubitIds = this.qubitRegistry.getAllQubits();
    const measurements = this.measureQubits(qubitIds);
    
    // Convert to a bit string, sorted by qubit index
    let bitString = '';
    const sortedPairs = [...qubitIds.entries()]
      .sort((a, b) => this.qubitRegistry.getQubitIndex(a[0]) - this.qubitRegistry.getQubitIndex(b[0]));
    
    for (const [qubitId] of sortedPairs) {
      bitString += measurements.get(qubitId).toString();
    }
    
    logger.debug(`Measured all qubits: ${bitString}`);
    
    return bitString;
  }

  /**
   * Get all stored measurement results
   * @returns {Map<string, number>} - Map of qubit IDs to results
   */
  getAllMeasurements() {
    return new Map(this.measurementResults);
  }

  /**
   * Get measurement history
   * @param {number} limit - Maximum number of history items to return
   * @returns {Array} - Measurement history
   */
  getMeasurementHistory(limit = Infinity) {
    return this.measurementHistory.slice(-limit);
  }

  /**
   * Convert measurement results to an integer
   * @param {string[]} qubitIds - Array of qubit IDs in order of significance (LSB first)
   * @returns {number} - Integer representation of measurements
   */
  measurementsToInteger(qubitIds) {
    let result = 0;
    
    for (let i = 0; i < qubitIds.length; i++) {
      const qubitId = qubitIds[i];
      const measurement = this.measurementResults.get(qubitId);
      
      if (measurement === undefined) {
        throw new Error(`Qubit ${qubitId} has not been measured`);
      }
      
      result |= (measurement << i);
    }
    
    return result;
  }

    /**
     * Sample the quantum state multiple times
     * @param {number} shots - Number of samples to take
     * @param {string[]} qubitIds - Qubits to measure (all if not specified)
     * @returns {Object} - Counts of each observed bit string
     */
    sample(shots, qubitIds = null) {
    if (shots <= 0) {
        throw new Error('Number of shots must be positive');
    }

    // If no qubits specified, use all
    const qubitsToMeasure = qubitIds || this.qubitRegistry.getAllQubits();
    const qubitCount = qubitsToMeasure.length;
    
    // Convert qubit IDs to their indices
    const qubitIndices = qubitsToMeasure.map(id => this.qubitRegistry.getQubitIndex(id));
    
    // Get the full state vector
    const stateVector = this.stateVector.getStateVector();
    const stateVectorSize = stateVector.length;
    
    // Calculate the probability of each possible measurement outcome
    const outcomes = {};
    
    for (let i = 0; i < stateVectorSize; i++) {
        const amplitude = stateVector[i];
        const probability = amplitude.magnitudeSquared();
        
        if (probability > 0.000001) { // Only consider non-zero probabilities
        // Extract the bits corresponding to our qubits of interest
        let bitString = '';
        for (const idx of qubitIndices) {
            bitString += ((i >> idx) & 1).toString();
        }
        
        // Add to our outcomes (or create if it doesn't exist)
        outcomes[bitString] = (outcomes[bitString] || 0) + probability;
        }
    }
    
    // Perform shots based on calculated probabilities
    const counts = {};
    
    for (let shot = 0; shot < shots; shot++) {
        const rand = Math.random();
        let cumulativeProbability = 0;
        
        for (const [outcome, probability] of Object.entries(outcomes)) {
        cumulativeProbability += probability;
        
        if (rand < cumulativeProbability) {
            counts[outcome] = (counts[outcome] || 0) + 1;
            break;
        }
        }
    }
    
    logger.debug(`Sampled quantum state ${shots} times with qubits ${qubitsToMeasure.join(', ')}`);
    
    return counts;
    }

  /**
   * Clear all stored measurement results
   */
  clearMeasurements() {
    this.measurementResults.clear();
    logger.debug('Cleared all measurement results');
  }

  /**
   * Clear measurement history
   */
  clearHistory() {
    this.measurementHistory = [];
    logger.debug('Cleared measurement history');
  }

  /**
   * Get measurement metrics
   * @returns {Object} - Measurement metrics
   */
  getMetrics() {
    const zeroProb = this.metrics.outcomeCounts[0] / this.metrics.totalMeasurements || 0;
    const oneProb = this.metrics.outcomeCounts[1] / this.metrics.totalMeasurements || 0;
    
    return {
      ...this.metrics,
      zeroProbability: zeroProb,
      oneProbability: oneProb
    };
  }

  /**
   * Reset measurement metrics
   */
  resetMetrics() {
    this.metrics.totalMeasurements = 0;
    this.metrics.outcomeCounts = { 0: 0, 1: 0 };
  }

  /**
   * Reset everything
   */
  reset() {
    this.clearMeasurements();
    this.clearHistory();
    this.resetMetrics();
    logger.debug('MeasurementEngine reset');
  }
}

export default MeasurementEngine;