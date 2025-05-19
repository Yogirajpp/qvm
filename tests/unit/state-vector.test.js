// tests/unit/state-vector.test.js
// Unit tests for StateVector

import { jest } from '@jest/globals';
import { StateVector } from '../../src/core/state-vector.js';
import { ComplexNumber } from '../../src/utils/complex-math.js';

// Helper function to create a complex number
const complex = (real, imag = 0) => new ComplexNumber(real, imag);

describe('StateVector', () => {
  let stateVector;
  
  beforeEach(() => {
    stateVector = new StateVector(0); // Start with 0 qubits
  });
  
  test('should initialize with |0⟩ state for 0 qubits', () => {
    expect(stateVector.qubitCount).toBe(0);
    expect(stateVector.stateVector.length).toBe(1);
    expect(stateVector.stateVector[0].real).toBe(1);
    expect(stateVector.stateVector[0].imag).toBe(0);
  });
  
  test('should initialize with |0⟩ state for 1 qubit', () => {
    stateVector = new StateVector(1);
    
    expect(stateVector.qubitCount).toBe(1);
    expect(stateVector.stateVector.length).toBe(2);
    
    // |0⟩ state: [1, 0]
    expect(stateVector.stateVector[0].real).toBe(1);
    expect(stateVector.stateVector[0].imag).toBe(0);
    expect(stateVector.stateVector[1].real).toBe(0);
    expect(stateVector.stateVector[1].imag).toBe(0);
  });
  
  test('should initialize with |0⟩ state for 2 qubits', () => {
    stateVector = new StateVector(2);
    
    expect(stateVector.qubitCount).toBe(2);
    expect(stateVector.stateVector.length).toBe(4);
    
    // |00⟩ state: [1, 0, 0, 0]
    expect(stateVector.stateVector[0].real).toBe(1);
    expect(stateVector.stateVector[0].imag).toBe(0);
    
    for (let i = 1; i < 4; i++) {
      expect(stateVector.stateVector[i].real).toBe(0);
      expect(stateVector.stateVector[i].imag).toBe(0);
    }
  });
  
  test('should expand state vector when adding a qubit', () => {
    stateVector = new StateVector(1); // Start with 1 qubit
    
    // Set initial state to |1⟩
    stateVector.stateVector[0] = complex(0);
    stateVector.stateVector[1] = complex(1);
    
    // Expand state vector (adding a qubit)
    stateVector.expandStateVector();
    
    expect(stateVector.qubitCount).toBe(2);
    expect(stateVector.stateVector.length).toBe(4);
    
    // Initial state |1⟩ expands to |10⟩ = [0, 0, 1, 0]
    expect(stateVector.stateVector[0].real).toBe(0);
    expect(stateVector.stateVector[1].real).toBe(0);
    expect(stateVector.stateVector[2].real).toBe(1);
    expect(stateVector.stateVector[3].real).toBe(0);
  });
  
  test('should enforce maximum qubit limit', () => {
    // Set max qubits to a small number for testing
    stateVector.options.maxQubits = 2;
    
    // Initialize with 2 qubits (at the limit)
    stateVector = new StateVector(2, { maxQubits: 2 });
    
    // Trying to expand beyond the limit should throw
    expect(() => stateVector.expandStateVector()).toThrow();
  });
  
  test('should apply X gate correctly', () => {
    stateVector = new StateVector(1);
    
    // Apply X gate to qubit 0
    stateVector.applySingleQubitGate(0, [
      [complex(0), complex(1)],
      [complex(1), complex(0)]
    ]);
    
    // |0⟩ should become |1⟩
    expect(stateVector.stateVector[0].real).toBeCloseTo(0);
    expect(stateVector.stateVector[1].real).toBeCloseTo(1);
  });
  
  test('should apply H gate correctly', () => {
    stateVector = new StateVector(1);
    
    // Apply H gate to qubit 0
    stateVector.applySingleQubitGate(0, [
      [complex(1/Math.sqrt(2)), complex(1/Math.sqrt(2))],
      [complex(1/Math.sqrt(2)), complex(-1/Math.sqrt(2))]
    ]);
    
    // |0⟩ should become (|0⟩ + |1⟩)/√2
    expect(stateVector.stateVector[0].real).toBeCloseTo(1/Math.sqrt(2));
    expect(stateVector.stateVector[1].real).toBeCloseTo(1/Math.sqrt(2));
  });
  
  test('should apply Z gate correctly', () => {
    stateVector = new StateVector(1);
    
    // Prepare |1⟩ state
    stateVector.stateVector[0] = complex(0);
    stateVector.stateVector[1] = complex(1);
    
    // Apply Z gate to qubit 0
    stateVector.applySingleQubitGate(0, [
      [complex(1), complex(0)],
      [complex(0), complex(-1)]
    ]);
    
    // |1⟩ should become -|1⟩
    expect(stateVector.stateVector[0].real).toBeCloseTo(0);
    expect(stateVector.stateVector[1].real).toBeCloseTo(-1);
  });
  
  test('should apply CNOT gate correctly', () => {
    stateVector = new StateVector(2);
    
    // Prepare |10⟩ state
    stateVector.stateVector[0] = complex(0);
    stateVector.stateVector[1] = complex(0);
    stateVector.stateVector[2] = complex(1);
    stateVector.stateVector[3] = complex(0);
    
    // Apply CNOT with control=0, target=1
    stateVector.applyCNOT(0, 1);
    
    // |10⟩ should become |11⟩
    expect(stateVector.stateVector[0].real).toBeCloseTo(0);
    expect(stateVector.stateVector[1].real).toBeCloseTo(0);
    expect(stateVector.stateVector[2].real).toBeCloseTo(0);
    expect(stateVector.stateVector[3].real).toBeCloseTo(1);
  });
  
  test('should apply SWAP gate correctly', () => {
    stateVector = new StateVector(2);
    
    // Prepare |10⟩ state
    stateVector.stateVector[0] = complex(0);
    stateVector.stateVector[1] = complex(0);
    stateVector.stateVector[2] = complex(1);
    stateVector.stateVector[3] = complex(0);
    
    // Apply SWAP between qubits 0 and 1
    stateVector.applySWAP(0, 1);
    
    // |10⟩ should become |01⟩
    expect(stateVector.stateVector[0].real).toBeCloseTo(0);
    expect(stateVector.stateVector[1].real).toBeCloseTo(1);
    expect(stateVector.stateVector[2].real).toBeCloseTo(0);
    expect(stateVector.stateVector[3].real).toBeCloseTo(0);
  });
  
  test('should apply two-qubit gate correctly', () => {
    stateVector = new StateVector(2);
    
    // Create a simple two-qubit gate (CNOT-like)
    const gateMatrix = [
      [complex(1), complex(0), complex(0), complex(0)],
      [complex(0), complex(1), complex(0), complex(0)],
      [complex(0), complex(0), complex(0), complex(1)],
      [complex(0), complex(0), complex(1), complex(0)]
    ];
    
    // Prepare |10⟩ state
    stateVector.stateVector[0] = complex(0);
    stateVector.stateVector[1] = complex(0);
    stateVector.stateVector[2] = complex(1);
    stateVector.stateVector[3] = complex(0);
    
    // Apply the gate
    stateVector.applyTwoQubitGate(0, 1, gateMatrix);
    
    // |10⟩ should become |11⟩
    expect(stateVector.stateVector[0].real).toBeCloseTo(0);
    expect(stateVector.stateVector[1].real).toBeCloseTo(0);
    expect(stateVector.stateVector[2].real).toBeCloseTo(0);
    expect(stateVector.stateVector[3].real).toBeCloseTo(1);
  });
  
  test('should throw error when applying gates to invalid qubits', () => {
    stateVector = new StateVector(1);
    
    const xGate = [
      [complex(0), complex(1)],
      [complex(1), complex(0)]
    ];
    
    // Invalid qubit index
    expect(() => stateVector.applySingleQubitGate(1, xGate)).toThrow();
    expect(() => stateVector.applySingleQubitGate(-1, xGate)).toThrow();
    
    // Invalid gate matrix
    expect(() => stateVector.applySingleQubitGate(0, null)).toThrow();
    expect(() => stateVector.applySingleQubitGate(0, [])).toThrow();
  });
  
  test('should measure a qubit and collapse the state', () => {
    // Mock Math.random to make the test deterministic
    const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.3);
    
    stateVector = new StateVector(1);
    
    // Apply H gate to create superposition
    stateVector.applySingleQubitGate(0, [
      [complex(1/Math.sqrt(2)), complex(1/Math.sqrt(2))],
      [complex(1/Math.sqrt(2)), complex(-1/Math.sqrt(2))]
    ]);
    
    // With Math.random() = 0.3 and equal superposition, should measure 0
    const result = stateVector.measureQubit(0);
    expect(result).toBe(0);
    
    // State should collapse to |0⟩
    expect(stateVector.stateVector[0].real).toBeCloseTo(1);
    expect(stateVector.stateVector[1].real).toBeCloseTo(0);
    
    mockRandom.mockRestore();
  });
  
  test('should calculate probability correctly', () => {
    stateVector = new StateVector(1);
    
    // Apply H gate to create superposition
    stateVector.applySingleQubitGate(0, [
      [complex(1/Math.sqrt(2)), complex(1/Math.sqrt(2))],
      [complex(1/Math.sqrt(2)), complex(-1/Math.sqrt(2))]
    ]);
    
    // Probability of measuring |0⟩ or |1⟩ should be 0.5
    expect(stateVector.getProbability(0)).toBeCloseTo(0.5);
    expect(stateVector.getProbability(1)).toBeCloseTo(0.5);
  });
  
  test('should normalize state vector', () => {
    stateVector = new StateVector(1);
    
    // Set to a non-normalized state
    stateVector.stateVector[0] = complex(2);
    stateVector.stateVector[1] = complex(1);
    
    // Normalize
    stateVector.normalize();
    
    // Calculate the expected values
    const norm = Math.sqrt(5);
    const expected0 = 2 / norm;
    const expected1 = 1 / norm;
    
    // State should be normalized
    expect(stateVector.stateVector[0].real).toBeCloseTo(expected0);
    expect(stateVector.stateVector[1].real).toBeCloseTo(expected1);
    
    // Total probability should be 1
    const totalProb = stateVector.stateVector.reduce(
      (sum, amplitude) => sum + amplitude.magnitudeSquared(),
      0
    );
    expect(totalProb).toBeCloseTo(1);
  });
  
  test('should retrieve amplitude of basis state', () => {
    stateVector = new StateVector(2);
    
    // Set up a known state
    stateVector.stateVector[0] = complex(0.5);
    stateVector.stateVector[1] = complex(0.5);
    stateVector.stateVector[2] = complex(0.5);
    stateVector.stateVector[3] = complex(0.5);
    
    // Get amplitudes
    expect(stateVector.getAmplitude(0).real).toBeCloseTo(0.5);
    expect(stateVector.getAmplitude(1).real).toBeCloseTo(0.5);
    expect(stateVector.getAmplitude(2).real).toBeCloseTo(0.5);
    expect(stateVector.getAmplitude(3).real).toBeCloseTo(0.5);
  });
  
  test('should throw error when accessing invalid basis state', () => {
    stateVector = new StateVector(1); // 2 basis states: |0⟩ and |1⟩
    
    // Invalid basis state index
    expect(() => stateVector.getAmplitude(2)).toThrow();
  });
  
  test('should reset the state vector', () => {
    stateVector = new StateVector(2);
    
    // Set to a non-|0⟩ state
    stateVector.stateVector[0] = complex(0);
    stateVector.stateVector[1] = complex(0);
    stateVector.stateVector[2] = complex(0);
    stateVector.stateVector[3] = complex(1);
    
    // Reset
    stateVector.reset();
    
    // Should be back to |00⟩ state
    expect(stateVector.stateVector[0].real).toBeCloseTo(1);
    expect(stateVector.stateVector[1].real).toBeCloseTo(0);
    expect(stateVector.stateVector[2].real).toBeCloseTo(0);
    expect(stateVector.stateVector[3].real).toBeCloseTo(0);
  });
  
  test('should handle complex amplitudes correctly', () => {
    stateVector = new StateVector(1);
    
    // Set to a state with complex amplitudes
    stateVector.stateVector[0] = complex(1/Math.sqrt(2), 0);
    stateVector.stateVector[1] = complex(0, 1/Math.sqrt(2));
    
    // Apply Z gate to qubit 0
    stateVector.applySingleQubitGate(0, [
      [complex(1), complex(0)],
      [complex(0), complex(-1)]
    ]);
    
    // |0⟩ component should be unchanged, |1⟩ component should get a negative phase
    expect(stateVector.stateVector[0].real).toBeCloseTo(1/Math.sqrt(2));
    expect(stateVector.stateVector[0].imag).toBeCloseTo(0);
    expect(stateVector.stateVector[1].real).toBeCloseTo(0);
    expect(stateVector.stateVector[1].imag).toBeCloseTo(-1/Math.sqrt(2));
  });
  
  test('should cache probability calculations', () => {
    stateVector = new StateVector(2);
    
    // Set up a known state
    stateVector.stateVector[0] = complex(0.5);
    stateVector.stateVector[1] = complex(0.5);
    stateVector.stateVector[2] = complex(0.5);
    stateVector.stateVector[3] = complex(0.5);
    
    // Clear the cache
    stateVector.invalidateProbabilityCache();
    
    // Get probability of |00⟩
    const prob1 = stateVector.getProbability(0);
    
    // Should be cached now
    expect(stateVector.probabilityCache.has(0)).toBe(true);
    
    // Get it again
    const prob2 = stateVector.getProbability(0);
    
    // Should be the same value
    expect(prob1).toBe(prob2);
    
    // Modify the state vector
    stateVector.stateVector[0] = complex(1);
    stateVector.stateVector[1] = complex(0);
    stateVector.stateVector[2] = complex(0);
    stateVector.stateVector[3] = complex(0);
    
    // Cache should be invalidated on state change
    stateVector.invalidateProbabilityCache();
    
    // Should not be cached now
    expect(stateVector.probabilityCache.has(0)).toBe(false);
    
    // Get probability again
    const prob3 = stateVector.getProbability(0);
    
    // Should be different from before
    expect(prob3).not.toBe(prob1);
  });
  
  test('should update memory usage metrics', () => {
    stateVector = new StateVector(1);
    
    // Check initial metrics
    expect(stateVector.metrics.stateVectorSize).toBe(2);
    expect(stateVector.metrics.memoryUsage).toBeGreaterThan(0);
    
    // Expand state vector
    stateVector.expandStateVector();
    
    // Metrics should be updated
    expect(stateVector.metrics.stateVectorSize).toBe(4);
    expect(stateVector.metrics.memoryUsage).toBeGreaterThan(0);
  });
});