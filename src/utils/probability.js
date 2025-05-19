// src/utils/probability.js
// Probability utilities for quantum measurement

/**
 * Calculates probability distribution from quantum state amplitudes
 * @param {Array<ComplexNumber>} stateVector - Quantum state vector
 * @returns {Array<number>} - Array of probabilities for each basis state
 */
export const calculateProbabilities = (stateVector) => {
  return stateVector.map(amplitude => amplitude.magnitudeSquared());
};

/**
 * Sample from a probability distribution
 * @param {Array<number>} probabilities - Array of probabilities
 * @returns {number} - Sampled index
 */
export const sampleFromDistribution = (probabilities) => {
  const random = Math.random();
  let cumulativeProbability = 0;
  
  for (let i = 0; i < probabilities.length; i++) {
    cumulativeProbability += probabilities[i];
    if (random < cumulativeProbability) {
      return i;
    }
  }
  
  // Fallback for numerical precision issues
  return probabilities.length - 1;
};

/**
 * Convert basis state index to binary string
 * @param {number} index - Basis state index
 * @param {number} qubitCount - Number of qubits
 * @returns {string} - Binary representation
 */
export const indexToBinary = (index, qubitCount) => {
  return index.toString(2).padStart(qubitCount, '0');
};

/**
 * Convert binary string to basis state index
 * @param {string} binary - Binary representation
 * @returns {number} - Basis state index
 */
export const binaryToIndex = (binary) => {
  return parseInt(binary, 2);
};

/**
 * Get probability of measuring a specific bit value for a qubit
 * @param {Array<ComplexNumber>} stateVector - Quantum state vector
 * @param {number} qubitIndex - Index of the qubit
 * @param {number} value - Desired measurement value (0 or 1)
 * @returns {number} - Probability of measuring the specified value
 */
export const getProbabilityOfOutcome = (stateVector, qubitIndex, value) => {
  const stateSize = stateVector.length;
  const qubitCount = Math.log2(stateSize);
  
  if (qubitIndex >= qubitCount) {
    throw new Error(`Qubit index ${qubitIndex} out of bounds`);
  }
  
  let probability = 0;
  
  for (let i = 0; i < stateSize; i++) {
    // Check if the bit at qubitIndex is equal to value
    if (((i >> qubitIndex) & 1) === value) {
      probability += stateVector[i].magnitudeSquared();
    }
  }
  
  return probability;
};

/**
 * Get probability of measuring a specific basis state
 * @param {Array<ComplexNumber>} stateVector - Quantum state vector
 * @param {number} basisState - Basis state index
 * @returns {number} - Probability of measuring the basis state
 */
export const getProbabilityOfState = (stateVector, basisState) => {
  if (basisState >= stateVector.length) {
    throw new Error(`Basis state ${basisState} out of bounds`);
  }
  
  return stateVector[basisState].magnitudeSquared();
};

/**
 * Get probability of measuring a specific pattern of bits
 * @param {Array<ComplexNumber>} stateVector - Quantum state vector
 * @param {Object} pattern - Mapping of qubit indices to values
 * @returns {number} - Probability of measuring the pattern
 */
export const getProbabilityOfPattern = (stateVector, pattern) => {
  const stateSize = stateVector.length;
  const qubitCount = Math.log2(stateSize);
  
  let probability = 0;
  
  // Check each basis state
  for (let i = 0; i < stateSize; i++) {
    let matches = true;
    
    // Check if this basis state matches the pattern
    for (const [qubitIndex, value] of Object.entries(pattern)) {
      const qIndex = parseInt(qubitIndex);
      if (qIndex >= qubitCount) {
        throw new Error(`Qubit index ${qIndex} out of bounds`);
      }
      
      if (((i >> qIndex) & 1) !== value) {
        matches = false;
        break;
      }
    }
    
    if (matches) {
      probability += stateVector[i].magnitudeSquared();
    }
  }
  
  return probability;
};

/**
 * Generate histogram of basis state probabilities
 * @param {Array<ComplexNumber>} stateVector - Quantum state vector
 * @param {Object} options - Configuration options
 * @returns {Object} - Histogram data
 */
export const generateHistogram = (stateVector, options = {}) => {
  const {
    threshold = 1e-10,
    qubitCount = Math.log2(stateVector.length),
    format = 'binary'
  } = options;
  
  const histogram = {};
  const probabilities = calculateProbabilities(stateVector);
  
  // Generate histogram data
  for (let i = 0; i < probabilities.length; i++) {
    const prob = probabilities[i];
    
    // Skip states with negligible probability
    if (prob <= threshold) {
      continue;
    }
    
    // Generate label based on format
    let label;
    switch (format) {
      case 'binary':
        label = indexToBinary(i, qubitCount);
        break;
      case 'decimal':
        label = i.toString();
        break;
      case 'hex':
        label = '0x' + i.toString(16);
        break;
      default:
        label = indexToBinary(i, qubitCount);
    }
    
    histogram[label] = prob;
  }
  
  return histogram;
};

/**
 * Generate multiple samples from the quantum state
 * @param {Array<ComplexNumber>} stateVector - Quantum state vector
 * @param {number} shots - Number of samples to take
 * @returns {Object} - Counts of each sampled basis state
 */
export const generateSamples = (stateVector, shots) => {
  const probabilities = calculateProbabilities(stateVector);
  const qubitCount = Math.log2(stateVector.length);
  const counts = {};
  
  // Take multiple samples
  for (let i = 0; i < shots; i++) {
    const sample = sampleFromDistribution(probabilities);
    const binary = indexToBinary(sample, qubitCount);
    
    if (!counts[binary]) {
      counts[binary] = 0;
    }
    
    counts[binary]++;
  }
  
  return counts;
};

/**
 * Calculate the Shannon entropy of the quantum state
 * @param {Array<ComplexNumber>} stateVector - Quantum state vector
 * @returns {number} - Shannon entropy
 */
export const calculateEntropy = (stateVector) => {
  const probabilities = calculateProbabilities(stateVector);
  let entropy = 0;
  
  for (const prob of probabilities) {
    if (prob > 0) {
      entropy -= prob * Math.log2(prob);
    }
  }
  
  return entropy;
};

/**
 * Calculate the purity of the quantum state
 * @param {Array<ComplexNumber>} stateVector - Quantum state vector
 * @returns {number} - Purity
 */
export const calculatePurity = (stateVector) => {
  const probabilities = calculateProbabilities(stateVector);
  let purity = 0;
  
  for (const prob of probabilities) {
    purity += prob * prob;
  }
  
  return purity;
};

export default {
  calculateProbabilities,
  sampleFromDistribution,
  indexToBinary,
  binaryToIndex,
  getProbabilityOfOutcome,
  getProbabilityOfState,
  getProbabilityOfPattern,
  generateHistogram,
  generateSamples,
  calculateEntropy,
  calculatePurity
};