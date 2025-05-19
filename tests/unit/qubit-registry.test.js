// tests/unit/qubit-registry.test.js
// Unit tests for QubitRegistry

import { jest } from '@jest/globals';
import { QubitRegistry } from '../../src/core/qubit-registry.js';
import { StateVector } from '../../src/core/state-vector.js';

// Mock the StateVector dependency
jest.mock('../../src/core/state-vector.js', () => {
  return {
    StateVector: jest.fn().mockImplementation(() => {
      return {
        expandStateVector: jest.fn(),
        getQubitCount: jest.fn().mockReturnValue(0)
      };
    })
  };
});

describe('QubitRegistry', () => {
  let qubitRegistry;
  let mockStateVector;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockStateVector = new StateVector();
    qubitRegistry = new QubitRegistry(mockStateVector);
  });
  
  test('should initialize with empty qubits map', () => {
    expect(qubitRegistry.qubits.size).toBe(0);
    expect(qubitRegistry.entanglementGroups.size).toBe(0);
    expect(qubitRegistry.nextQubitIndex).toBe(0);
  });
  
  test('should allocate a qubit and return a unique ID', () => {
    const qubitId = qubitRegistry.allocateQubit();
    
    expect(qubitId).toBeDefined();
    expect(typeof qubitId).toBe('string');
    expect(qubitRegistry.qubits.size).toBe(1);
    expect(qubitRegistry.qubits.has(qubitId)).toBe(true);
    expect(qubitRegistry.entanglementGroups.has(qubitId)).toBe(true);
    expect(mockStateVector.expandStateVector).toHaveBeenCalledTimes(1);
  });
  
  test('should allocate multiple qubits', () => {
    const count = 3;
    const qubitIds = qubitRegistry.allocateQubits(count);
    
    expect(Array.isArray(qubitIds)).toBe(true);
    expect(qubitIds.length).toBe(count);
    expect(qubitRegistry.qubits.size).toBe(count);
    expect(mockStateVector.expandStateVector).toHaveBeenCalledTimes(count);
  });
  
  test('should throw error when allocating invalid number of qubits', () => {
    expect(() => qubitRegistry.allocateQubits(0)).toThrow();
    expect(() => qubitRegistry.allocateQubits(-1)).toThrow();
  });
  
  test('should enforce maximum qubit limit', () => {
    // Set max qubits to a small number for testing
    qubitRegistry.maxQubits = 2;
    
    // Allocate up to the limit
    qubitRegistry.allocateQubit();
    qubitRegistry.allocateQubit();
    
    // Trying to allocate one more should throw
    expect(() => qubitRegistry.allocateQubit()).toThrow();
  });
  
  test('should deallocate a qubit', () => {
    const qubitId = qubitRegistry.allocateQubit();
    const success = qubitRegistry.deallocateQubit(qubitId);
    
    expect(success).toBe(true);
    expect(qubitRegistry.qubits.size).toBe(0);
    expect(qubitRegistry.qubits.has(qubitId)).toBe(false);
    expect(qubitRegistry.entanglementGroups.has(qubitId)).toBe(false);
  });
  
  test('should return false when deallocating non-existent qubit', () => {
    const success = qubitRegistry.deallocateQubit('non-existent-id');
    
    expect(success).toBe(false);
    expect(qubitRegistry.qubits.size).toBe(0);
  });
  
  test('should get qubit index by ID', () => {
    const qubitId = qubitRegistry.allocateQubit();
    const index = qubitRegistry.getQubitIndex(qubitId);
    
    expect(index).toBe(0); // First qubit should have index 0
  });
  
  test('should throw error when getting index of non-existent qubit', () => {
    expect(() => qubitRegistry.getQubitIndex('non-existent-id')).toThrow();
  });
  
  test('should record entanglement between qubits', () => {
    const qubit1 = qubitRegistry.allocateQubit();
    const qubit2 = qubitRegistry.allocateQubit();
    
    qubitRegistry.recordEntanglement(qubit1, qubit2);
    
    expect(qubitRegistry.areEntangled(qubit1, qubit2)).toBe(true);
    
    // Both qubits should refer to the same entanglement group
    const group1 = qubitRegistry.entanglementGroups.get(qubit1);
    const group2 = qubitRegistry.entanglementGroups.get(qubit2);
    expect(group1).toBe(group2);
    expect(group1.size).toBe(2);
    expect(group1.has(qubit1)).toBe(true);
    expect(group1.has(qubit2)).toBe(true);
  });
  
  test('should throw error when recording entanglement with non-existent qubit', () => {
    const qubit1 = qubitRegistry.allocateQubit();
    
    expect(() => qubitRegistry.recordEntanglement(qubit1, 'non-existent-id')).toThrow();
    expect(() => qubitRegistry.recordEntanglement('non-existent-id', qubit1)).toThrow();
  });
  
  test('should check if qubits are entangled', () => {
    const qubit1 = qubitRegistry.allocateQubit();
    const qubit2 = qubitRegistry.allocateQubit();
    const qubit3 = qubitRegistry.allocateQubit();
    
    // Initially, no qubits are entangled
    expect(qubitRegistry.areEntangled(qubit1, qubit2)).toBe(false);
    
    // Record entanglement between qubit1 and qubit2
    qubitRegistry.recordEntanglement(qubit1, qubit2);
    
    // qubit1 and qubit2 should now be entangled
    expect(qubitRegistry.areEntangled(qubit1, qubit2)).toBe(true);
    expect(qubitRegistry.areEntangled(qubit2, qubit1)).toBe(true);
    
    // qubit3 should not be entangled with the others
    expect(qubitRegistry.areEntangled(qubit1, qubit3)).toBe(false);
    expect(qubitRegistry.areEntangled(qubit2, qubit3)).toBe(false);
  });
  
  test('should get all entangled qubits', () => {
    const qubit1 = qubitRegistry.allocateQubit();
    const qubit2 = qubitRegistry.allocateQubit();
    const qubit3 = qubitRegistry.allocateQubit();
    
    qubitRegistry.recordEntanglement(qubit1, qubit2);
    qubitRegistry.recordEntanglement(qubit2, qubit3);
    
    const entangledWithQubit1 = qubitRegistry.getEntangledQubits(qubit1);
    
    expect(entangledWithQubit1.length).toBe(2);
    expect(entangledWithQubit1).toContain(qubit2);
    expect(entangledWithQubit1).toContain(qubit3);
  });
  
  test('should throw error when getting entangled qubits for non-existent qubit', () => {
    expect(() => qubitRegistry.getEntangledQubits('non-existent-id')).toThrow();
  });
  
  test('should get all allocated qubits', () => {
    const qubit1 = qubitRegistry.allocateQubit();
    const qubit2 = qubitRegistry.allocateQubit();
    
    const allQubits = qubitRegistry.getAllQubits();
    
    expect(allQubits.length).toBe(2);
    expect(allQubits).toContain(qubit1);
    expect(allQubits).toContain(qubit2);
  });
  
  test('should get qubit count', () => {
    expect(qubitRegistry.getQubitCount()).toBe(0);
    
    qubitRegistry.allocateQubit();
    expect(qubitRegistry.getQubitCount()).toBe(1);
    
    qubitRegistry.allocateQubit();
    expect(qubitRegistry.getQubitCount()).toBe(2);
    
    const qubit3 = qubitRegistry.allocateQubit();
    expect(qubitRegistry.getQubitCount()).toBe(3);
    
    qubitRegistry.deallocateQubit(qubit3);
    expect(qubitRegistry.getQubitCount()).toBe(2);
  });
  
  test('should reset the registry', () => {
    qubitRegistry.allocateQubit();
    qubitRegistry.allocateQubit();
    
    qubitRegistry.reset();
    
    expect(qubitRegistry.qubits.size).toBe(0);
    expect(qubitRegistry.entanglementGroups.size).toBe(0);
    expect(qubitRegistry.nextQubitIndex).toBe(0);
  });
  
  test('should handle transitive entanglement', () => {
    const qubit1 = qubitRegistry.allocateQubit();
    const qubit2 = qubitRegistry.allocateQubit();
    const qubit3 = qubitRegistry.allocateQubit();
    
    // Entangle qubit1 with qubit2, and qubit2 with qubit3
    qubitRegistry.recordEntanglement(qubit1, qubit2);
    qubitRegistry.recordEntanglement(qubit2, qubit3);
    
    // All three qubits should be in the same entanglement group
    expect(qubitRegistry.areEntangled(qubit1, qubit3)).toBe(true);
    
    const group = qubitRegistry.entanglementGroups.get(qubit1);
    expect(group.size).toBe(3);
    expect(group.has(qubit1)).toBe(true);
    expect(group.has(qubit2)).toBe(true);
    expect(group.has(qubit3)).toBe(true);
  });
});