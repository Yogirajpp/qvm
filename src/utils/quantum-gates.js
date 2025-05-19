// src/utils/quantum-gates.js
// Definitions of standard quantum gates

import { ComplexNumber } from './complex-math.js';

// Pauli matrices
const X = [
  [new ComplexNumber(0, 0), new ComplexNumber(1, 0)],
  [new ComplexNumber(1, 0), new ComplexNumber(0, 0)]
];

const Y = [
  [new ComplexNumber(0, 0), new ComplexNumber(0, -1)],
  [new ComplexNumber(0, 1), new ComplexNumber(0, 0)]
];

const Z = [
  [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(-1, 0)]
];

// Hadamard gate
const H = [
  [new ComplexNumber(1/Math.sqrt(2), 0), new ComplexNumber(1/Math.sqrt(2), 0)],
  [new ComplexNumber(1/Math.sqrt(2), 0), new ComplexNumber(-1/Math.sqrt(2), 0)]
];

// Phase gates
const S = [
  [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(0, 1)]
];

const Sdg = [
  [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(0, -1)]
];

const T = [
  [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(Math.cos(Math.PI/4), Math.sin(Math.PI/4))]
];

const Tdg = [
  [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(Math.cos(Math.PI/4), -Math.sin(Math.PI/4))]
];

// Other common single-qubit gates
const I = [
  [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(1, 0)]
];

// Rotation gates generator functions
const createRX = (theta) => [
  [
    new ComplexNumber(Math.cos(theta/2), 0),
    new ComplexNumber(0, -Math.sin(theta/2))
  ],
  [
    new ComplexNumber(0, -Math.sin(theta/2)),
    new ComplexNumber(Math.cos(theta/2), 0)
  ]
];

const createRY = (theta) => [
  [
    new ComplexNumber(Math.cos(theta/2), 0),
    new ComplexNumber(-Math.sin(theta/2), 0)
  ],
  [
    new ComplexNumber(Math.sin(theta/2), 0),
    new ComplexNumber(Math.cos(theta/2), 0)
  ]
];

const createRZ = (theta) => [
  [
    new ComplexNumber(Math.cos(theta/2), -Math.sin(theta/2)),
    new ComplexNumber(0, 0)
  ],
  [
    new ComplexNumber(0, 0),
    new ComplexNumber(Math.cos(theta/2), Math.sin(theta/2))
  ]
];

const createPhase = (phi) => [
  [new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(Math.cos(phi), Math.sin(phi))]
];

// Two-qubit gates
const CNOT = [
  [new ComplexNumber(1, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(1, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(1, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(1, 0), new ComplexNumber(0, 0)]
];

const CZ = [
  [new ComplexNumber(1, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(1, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(-1, 0)]
];

const SWAP = [
  [new ComplexNumber(1, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(1, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(1, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(1, 0)]
];

const iSWAP = [
  [new ComplexNumber(1, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 1), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(0, 1), new ComplexNumber(0, 0), new ComplexNumber(0, 0)],
  [new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(1, 0)]
];

// Export all gates
export const GATES = {
  I,
  X,
  Y,
  Z,
  H,
  S,
  Sdg,
  T,
  Tdg,
  CNOT,
  CZ,
  SWAP,
  iSWAP
};

// Export gate creator functions
export const createGates = {
  RX: createRX,
  RY: createRY,
  RZ: createRZ,
  Phase: createPhase
};

/**
 * Create a controlled version of any single-qubit gate
 * @param {Array<Array<ComplexNumber>>} gate - Single-qubit gate matrix
 * @returns {Array<Array<ComplexNumber>>} - Controlled gate matrix
 */
export const createControlledGate = (gate) => {
  return [
    [new ComplexNumber(1, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0)],
    [new ComplexNumber(0, 0), new ComplexNumber(1, 0), new ComplexNumber(0, 0), new ComplexNumber(0, 0)],
    [new ComplexNumber(0, 0), new ComplexNumber(0, 0), gate[0][0], gate[0][1]],
    [new ComplexNumber(0, 0), new ComplexNumber(0, 0), gate[1][0], gate[1][1]]
  ];
};

export default {
  GATES,
  createGates,
  createControlledGate
};