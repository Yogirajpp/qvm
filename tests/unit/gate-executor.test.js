// tests/unit/gate-executor.test.js
// Unit tests for GateExecutor

import { jest } from '@jest/globals';
import { GateExecutor } from '../../src/core/gate-executor.js';
import { StateVector } from '../../src/core/state-vector.js';
import { QubitRegistry } from '../../src/core/qubit-registry.js';
import { ComplexNumber } from '../../src/utils/complex-math.js';

// Mock dependencies
jest.mock('../../src/core/state-vector.js');
jest.mock('../../src/core/qubit-registry.js');

// Helper function to create a complex number
const complex = (real, imag = 0) => new ComplexNumber(real, imag);

describe('GateExecutor', () => {
  let gateExecutor;
  let mockStateVector;
  let mockQubitRegistry;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mocks
    mockStateVector = {
      applySingleQubitGate: jest.fn(),
      applyTwoQubitGate: jest.fn(),
      applyCNOT: jest.fn(),
      applySWAP: jest.fn(),
      setStateVector: jest.fn(),
      normalize: jest.fn(),
      getQubitCount: jest.fn().mockReturnValue(3),
      getStateVector: jest.fn().mockReturnValue([
        complex(1), complex(0), complex(0), complex(0),
        complex(0), complex(0), complex(0), complex(0)
      ])
    };
    
    mockQubitRegistry = {
      getQubitIndex: jest.fn().mockImplementation(qubitId => {
        if (qubitId === 'qubit0') return 0;
        if (qubitId === 'qubit1') return 1;
        if (qubitId === 'qubit2') return 2;
        throw new Error(`Unknown qubit: ${qubitId}`);
      }),
      recordEntanglement: jest.fn()
    };
    
    gateExecutor = new GateExecutor(mockStateVector, mockQubitRegistry);
  });
  
  test('should initialize correctly', () => {
    expect(gateExecutor.stateVector).toBe(mockStateVector);
    expect(gateExecutor.qubitRegistry).toBe(mockQubitRegistry);
    expect(gateExecutor.metrics.totalGatesExecuted).toBe(0);
    expect(gateExecutor.metrics.gateTypeCount.size).toBe(0);
  });
  
  test('should apply single-qubit gate', () => {
    gateExecutor.applySingleQubitGate('qubit0', 'X');
    
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit0');
    expect(mockStateVector.applySingleQubitGate).toHaveBeenCalledWith(0, expect.any(Array));
    expect(gateExecutor.metrics.totalGatesExecuted).toBe(1);
    expect(gateExecutor.metrics.gateTypeCount.get('X')).toBe(1);
  });
  
  test('should apply RX gate', () => {
    gateExecutor.applyRX('qubit0', Math.PI);
    
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit0');
    expect(mockStateVector.applySingleQubitGate).toHaveBeenCalledWith(0, expect.any(Array));
    expect(gateExecutor.metrics.totalGatesExecuted).toBe(1);
    expect(gateExecutor.metrics.gateTypeCount.get('RX')).toBe(1);
  });
  
  test('should apply RY gate', () => {
    gateExecutor.applyRY('qubit0', Math.PI);
    
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit0');
    expect(mockStateVector.applySingleQubitGate).toHaveBeenCalledWith(0, expect.any(Array));
    expect(gateExecutor.metrics.totalGatesExecuted).toBe(1);
    expect(gateExecutor.metrics.gateTypeCount.get('RY')).toBe(1);
  });
  
  test('should apply RZ gate', () => {
    gateExecutor.applyRZ('qubit0', Math.PI);
    
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit0');
    expect(mockStateVector.applySingleQubitGate).toHaveBeenCalledWith(0, expect.any(Array));
    expect(gateExecutor.metrics.totalGatesExecuted).toBe(1);
    expect(gateExecutor.metrics.gateTypeCount.get('RZ')).toBe(1);
  });
  
  test('should apply CNOT gate', () => {
    gateExecutor.applyCNOT('qubit0', 'qubit1');
    
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit0');
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit1');
    expect(mockQubitRegistry.recordEntanglement).toHaveBeenCalledWith('qubit0', 'qubit1');
    expect(mockStateVector.applyCNOT).toHaveBeenCalledWith(0, 1);
    expect(gateExecutor.metrics.totalGatesExecuted).toBe(1);
    expect(gateExecutor.metrics.gateTypeCount.get('CNOT')).toBe(1);
  });
  
  test('should apply CZ gate', () => {
    gateExecutor.applyCZ('qubit0', 'qubit1');
    
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit0');
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit1');
    expect(mockQubitRegistry.recordEntanglement).toHaveBeenCalledWith('qubit0', 'qubit1');
    expect(mockStateVector.applyTwoQubitGate).toHaveBeenCalledWith(0, 1, expect.any(Array));
    expect(gateExecutor.metrics.totalGatesExecuted).toBe(1);
    expect(gateExecutor.metrics.gateTypeCount.get('CZ')).toBe(1);
  });
  
  test('should apply SWAP gate', () => {
    gateExecutor.applySWAP('qubit0', 'qubit1');
    
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit0');
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit1');
    expect(mockStateVector.applySWAP).toHaveBeenCalledWith(0, 1);
    expect(gateExecutor.metrics.totalGatesExecuted).toBe(1);
    expect(gateExecutor.metrics.gateTypeCount.get('SWAP')).toBe(1);
  });
  
  test('should apply Toffoli gate', () => {
    gateExecutor.applyToffoli('qubit0', 'qubit1', 'qubit2');
    
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit0');
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit1');
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit2');
    expect(mockQubitRegistry.recordEntanglement).toHaveBeenCalledWith('qubit0', 'qubit2');
    expect(mockQubitRegistry.recordEntanglement).toHaveBeenCalledWith('qubit1', 'qubit2');
    expect(mockStateVector.getStateVector).toHaveBeenCalled();
    expect(mockStateVector.setStateVector).toHaveBeenCalled();
    expect(gateExecutor.metrics.totalGatesExecuted).toBe(1);
    expect(gateExecutor.metrics.gateTypeCount.get('Toffoli')).toBe(1);
  });
  
  test('should apply custom gate', () => {
    const customMatrix = [
      [complex(1), complex(0)],
      [complex(0), complex(1)]
    ];
    
    gateExecutor.applyCustomGate('qubit0', customMatrix);
    
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit0');
    expect(mockStateVector.applySingleQubitGate).toHaveBeenCalledWith(0, customMatrix);
    expect(gateExecutor.metrics.totalGatesExecuted).toBe(1);
    expect(gateExecutor.metrics.gateTypeCount.get('Custom')).toBe(1);
  });
  
  test('should apply controlled custom gate', () => {
    const targetMatrix = [
      [complex(0), complex(1)],
      [complex(1), complex(0)]
    ];
    
    gateExecutor.applyControlledGate('qubit0', 'qubit1', targetMatrix);
    
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit0');
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit1');
    expect(mockQubitRegistry.recordEntanglement).toHaveBeenCalledWith('qubit0', 'qubit1');
    expect(mockStateVector.getStateVector).toHaveBeenCalled();
    expect(mockStateVector.setStateVector).toHaveBeenCalled();
    expect(mockStateVector.normalize).toHaveBeenCalled();
    expect(gateExecutor.metrics.totalGatesExecuted).toBe(1);
    expect(gateExecutor.metrics.gateTypeCount.get('ControlledCustom')).toBe(1);
  });
  
  test('should apply phase shift gate', () => {
    gateExecutor.applyPhaseShift('qubit0', Math.PI/4);
    
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit0');
    expect(mockStateVector.applySingleQubitGate).toHaveBeenCalledWith(0, expect.any(Array));
    expect(gateExecutor.metrics.totalGatesExecuted).toBe(1);
    expect(gateExecutor.metrics.gateTypeCount.get('Phase')).toBe(1);
  });
  
  test('should reset qubit', () => {
    // Mock measurement result
    mockStateVector.measureQubit = jest.fn().mockReturnValue(1);
    
    gateExecutor.resetQubit('qubit0');
    
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit0');
    expect(mockStateVector.measureQubit).toHaveBeenCalledWith(0);
    expect(mockStateVector.applySingleQubitGate).toHaveBeenCalledWith(0, expect.any(Array));
    expect(gateExecutor.metrics.totalGatesExecuted).toBe(1);
    expect(gateExecutor.metrics.gateTypeCount.get('Reset')).toBe(1);
  });
  
  test('should not flip qubit when resetting if already |0⟩', () => {
    // Mock measurement result
    mockStateVector.measureQubit = jest.fn().mockReturnValue(0);
    
    gateExecutor.resetQubit('qubit0');
    
    expect(mockQubitRegistry.getQubitIndex).toHaveBeenCalledWith('qubit0');
    expect(mockStateVector.measureQubit).toHaveBeenCalledWith(0);
    // Should not apply X gate since already in |0⟩ state
    expect(mockStateVector.applySingleQubitGate).not.toHaveBeenCalled();
    expect(gateExecutor.metrics.totalGatesExecuted).toBe(1);
    expect(gateExecutor.metrics.gateTypeCount.get('Reset')).toBe(1);
  });
  
  test('should get execution metrics', () => {
    // Apply some gates to generate metrics
    gateExecutor.applySingleQubitGate('qubit0', 'X');
    gateExecutor.applySingleQubitGate('qubit0', 'X');
    gateExecutor.applySingleQubitGate('qubit1', 'H');
    
    const metrics = gateExecutor.getMetrics();
    
    expect(metrics.totalGatesExecuted).toBe(3);
    expect(metrics.gateTypeCount.X).toBe(2);
    expect(metrics.gateTypeCount.H).toBe(1);
  });
  
  test('should reset execution metrics', () => {
    // Apply some gates to generate metrics
    gateExecutor.applySingleQubitGate('qubit0', 'X');
    gateExecutor.applySingleQubitGate('qubit1', 'H');
    
    // Reset metrics
    gateExecutor.resetMetrics();
    
    expect(gateExecutor.metrics.totalGatesExecuted).toBe(0);
    expect(gateExecutor.metrics.gateTypeCount.size).toBe(0);
  });
  
  test('should throw error when applying gates to invalid qubits', () => {
    expect(() => gateExecutor.applySingleQubitGate('invalid-qubit', 'X')).toThrow();
    expect(() => gateExecutor.applyCNOT('qubit0', 'invalid-qubit')).toThrow();
    expect(() => gateExecutor.applyCNOT('invalid-qubit', 'qubit0')).toThrow();
  });
  
  test('should throw error when applying unknown gate', () => {
    expect(() => gateExecutor.applySingleQubitGate('qubit0', 'UNKNOWN_GATE')).toThrow();
  });
});