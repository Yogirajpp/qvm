// src/types/gate-definitions.js
// Definitions and metadata for quantum gates

import { ComplexNumber } from '../utils/complex-math.js';
import { GateType } from './quantum-types.js';

/**
 * Gate metadata containing properties and visual representation
 * @typedef {Object} GateMetadata
 * @property {string} name - Gate name
 * @property {string} symbol - Symbol used in circuit diagrams
 * @property {string} description - Description of the gate's function
 * @property {GateType} type - Type of gate (single-qubit, two-qubit, etc.)
 * @property {boolean} isHermitian - Whether the gate is Hermitian
 * @property {boolean} isDiagonal - Whether the gate is diagonal
 * @property {string} group - Gate family/group
 * @property {string} color - Color for visual representation
 */

/**
 * Basic single-qubit gates metadata
 */
export const singleQubitGates = {
  I: {
    name: 'Identity',
    symbol: 'I',
    description: 'Does nothing to the qubit',
    type: GateType.SINGLE_QUBIT,
    isHermitian: true,
    isDiagonal: true,
    group: 'pauli',
    color: '#CCCCCC'
  },
  X: {
    name: 'Pauli-X',
    symbol: 'X',
    description: 'Bit flip gate (NOT)',
    type: GateType.SINGLE_QUBIT,
    isHermitian: true,
    isDiagonal: false,
    group: 'pauli',
    color: '#FF5555'
  },
  Y: {
    name: 'Pauli-Y',
    symbol: 'Y',
    description: 'Bit and phase flip gate',
    type: GateType.SINGLE_QUBIT,
    isHermitian: true,
    isDiagonal: false,
    group: 'pauli',
    color: '#55FF55'
  },
  Z: {
    name: 'Pauli-Z',
    symbol: 'Z',
    description: 'Phase flip gate',
    type: GateType.SINGLE_QUBIT,
    isHermitian: true,
    isDiagonal: true,
    group: 'pauli',
    color: '#5555FF'
  },
  H: {
    name: 'Hadamard',
    symbol: 'H',
    description: 'Creates superposition',
    type: GateType.SINGLE_QUBIT,
    isHermitian: true,
    isDiagonal: false,
    group: 'clifford',
    color: '#FFAA00'
  },
  S: {
    name: 'Phase',
    symbol: 'S',
    description: 'π/2 phase rotation',
    type: GateType.SINGLE_QUBIT,
    isHermitian: false,
    isDiagonal: true,
    group: 'clifford',
    color: '#00AAFF'
  },
  Sdg: {
    name: 'Phase Dagger',
    symbol: 'S†',
    description: '-π/2 phase rotation',
    type: GateType.SINGLE_QUBIT,
    isHermitian: false,
    isDiagonal: true,
    group: 'clifford',
    color: '#00AAFF'
  },
  T: {
    name: 'T Gate',
    symbol: 'T',
    description: 'π/4 phase rotation',
    type: GateType.SINGLE_QUBIT,
    isHermitian: false,
    isDiagonal: true,
    group: 'non-clifford',
    color: '#AA00FF'
  },
  Tdg: {
    name: 'T Dagger',
    symbol: 'T†',
    description: '-π/4 phase rotation',
    type: GateType.SINGLE_QUBIT,
    isHermitian: false,
    isDiagonal: true,
    group: 'non-clifford',
    color: '#AA00FF'
  }
};

/**
 * Rotation gate metadata
 */
export const rotationGates = {
  RX: {
    name: 'X-Rotation',
    symbol: 'RX',
    description: 'Rotation around X-axis',
    type: GateType.SINGLE_QUBIT,
    isHermitian: false,
    isDiagonal: false,
    group: 'rotation',
    color: '#FF9999'
  },
  RY: {
    name: 'Y-Rotation',
    symbol: 'RY',
    description: 'Rotation around Y-axis',
    type: GateType.SINGLE_QUBIT,
    isHermitian: false,
    isDiagonal: false,
    group: 'rotation',
    color: '#99FF99'
  },
  RZ: {
    name: 'Z-Rotation',
    symbol: 'RZ',
    description: 'Rotation around Z-axis',
    type: GateType.SINGLE_QUBIT,
    isHermitian: false,
    isDiagonal: true,
    group: 'rotation',
    color: '#9999FF'
  },
  P: {
    name: 'Phase Rotation',
    symbol: 'P',
    description: 'Arbitrary phase rotation',
    type: GateType.SINGLE_QUBIT,
    isHermitian: false,
    isDiagonal: true,
    group: 'rotation',
    color: '#AAFFFF'
  }
};

/**
 * Two-qubit gate metadata
 */
export const twoQubitGates = {
  CNOT: {
    name: 'Controlled-NOT',
    symbol: 'CNOT',
    description: 'Flips target if control is |1⟩',
    type: GateType.TWO_QUBIT,
    isHermitian: true,
    isDiagonal: false,
    group: 'clifford',
    color: '#FF5555'
  },
  CZ: {
    name: 'Controlled-Z',
    symbol: 'CZ',
    description: 'Phase flip on target if control is |1⟩',
    type: GateType.TWO_QUBIT,
    isHermitian: true,
    isDiagonal: true,
    group: 'clifford',
    color: '#5555FF'
  },
  SWAP: {
    name: 'SWAP',
    symbol: 'SWAP',
    description: 'Swaps two qubits',
    type: GateType.TWO_QUBIT,
    isHermitian: true,
    isDiagonal: false,
    group: 'clifford',
    color: '#FFAA55'
  },
  iSWAP: {
    name: 'iSWAP',
    symbol: 'iSWAP',
    description: 'Swaps two qubits with phase',
    type: GateType.TWO_QUBIT,
    isHermitian: false,
    isDiagonal: false,
    group: 'non-clifford',
    color: '#55AAFF'
  },
  CR: {
    name: 'Controlled-R',
    symbol: 'CR',
    description: 'Controlled arbitrary rotation',
    type: GateType.TWO_QUBIT,
    isHermitian: false,
    isDiagonal: true,
    group: 'rotation',
    color: '#AAFFAA'
  }
};

/**
 * Three-qubit gate metadata
 */
export const threeQubitGates = {
  Toffoli: {
    name: 'Toffoli',
    symbol: 'CCX',
    description: 'Controlled-controlled-NOT gate',
    type: GateType.THREE_QUBIT,
    isHermitian: true,
    isDiagonal: false,
    group: 'clifford',
    color: '#FF5555'
  },
  Fredkin: {
    name: 'Fredkin',
    symbol: 'CSWAP',
    description: 'Controlled-SWAP gate',
    type: GateType.THREE_QUBIT,
    isHermitian: true,
    isDiagonal: false,
    group: 'clifford',
    color: '#FFAA55'
  }
};

/**
 * Get the matrix representation of a gate
 * @param {string} gateName - Name of the gate
 * @param {Array<number>} params - Optional parameters (e.g., rotation angles)
 * @returns {Array<Array<ComplexNumber>>} - Gate matrix
 */
export const getGateMatrix = (gateName, params = []) => {
  // Standard gates don't need parameters
  switch (gateName) {
    case 'I':
      return [
        [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
        [new ComplexNumber(0, 0), new ComplexNumber(1, 0)]
      ];
    case 'X':
      return [
        [new ComplexNumber(0, 0), new ComplexNumber(1, 0)],
        [new ComplexNumber(1, 0), new ComplexNumber(0, 0)]
      ];
    case 'Y':
      return [
        [new ComplexNumber(0, 0), new ComplexNumber(0, -1)],
        [new ComplexNumber(0, 1), new ComplexNumber(0, 0)]
      ];
    case 'Z':
      return [
        [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
        [new ComplexNumber(0, 0), new ComplexNumber(-1, 0)]
      ];
    case 'H':
      return [
        [new ComplexNumber(1/Math.sqrt(2), 0), new ComplexNumber(1/Math.sqrt(2), 0)],
        [new ComplexNumber(1/Math.sqrt(2), 0), new ComplexNumber(-1/Math.sqrt(2), 0)]
      ];
    case 'S':
      return [
        [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
        [new ComplexNumber(0, 0), new ComplexNumber(0, 1)]
      ];
    case 'Sdg':
      return [
        [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
        [new ComplexNumber(0, 0), new ComplexNumber(0, -1)]
      ];
    case 'T':
      return [
        [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
        [new ComplexNumber(0, 0), new ComplexNumber(Math.cos(Math.PI/4), Math.sin(Math.PI/4))]
      ];
    case 'Tdg':
      return [
        [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
        [new ComplexNumber(0, 0), new ComplexNumber(Math.cos(Math.PI/4), -Math.sin(Math.PI/4))]
      ];
    // Gates with parameters
    case 'RX':
      if (params.length < 1) throw new Error('RX gate requires angle parameter');
      const theta = params[0];
      return [
        [new ComplexNumber(Math.cos(theta/2), 0), new ComplexNumber(0, -Math.sin(theta/2))],
        [new ComplexNumber(0, -Math.sin(theta/2)), new ComplexNumber(Math.cos(theta/2), 0)]
      ];
    case 'RY':
      if (params.length < 1) throw new Error('RY gate requires angle parameter');
      const phi = params[0];
      return [
        [new ComplexNumber(Math.cos(phi/2), 0), new ComplexNumber(-Math.sin(phi/2), 0)],
        [new ComplexNumber(Math.sin(phi/2), 0), new ComplexNumber(Math.cos(phi/2), 0)]
      ];
    case 'RZ':
      if (params.length < 1) throw new Error('RZ gate requires angle parameter');
      const lambda = params[0];
      return [
        [new ComplexNumber(Math.cos(lambda/2), -Math.sin(lambda/2)), new ComplexNumber(0, 0)],
        [new ComplexNumber(0, 0), new ComplexNumber(Math.cos(lambda/2), Math.sin(lambda/2))]
      ];
    case 'P':
      if (params.length < 1) throw new Error('P gate requires angle parameter');
      const angle = params[0];
      return [
        [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
        [new ComplexNumber(0, 0), new ComplexNumber(Math.cos(angle), Math.sin(angle))]
      ];
    default:
      throw new Error(`Unknown gate: ${gateName}`);
  }
};

/**
 * Get all available gates
 * @returns {Object} - Object with all gates metadata
 */
export const getAllGates = () => {
  return {
    ...singleQubitGates,
    ...rotationGates,
    ...twoQubitGates,
    ...threeQubitGates
  };
};

export default {
  singleQubitGates,
  rotationGates,
  twoQubitGates,
  threeQubitGates,
  getGateMatrix,
  getAllGates
};