// src/utils/matrix-operations.js
// Matrix operations for quantum computation

import { ComplexNumber } from './complex-math.js';

/**
 * Check if a matrix is unitary
 * @param {Array<Array<ComplexNumber>>} matrix - Matrix to check
 * @param {number} epsilon - Tolerance for floating-point comparison
 * @returns {boolean} - Whether the matrix is unitary
 */
export const isUnitary = (matrix, epsilon = 1e-10) => {
  const n = matrix.length;
  
  // Calculate the conjugate transpose
  const conjugateTranspose = new Array(n);
  for (let i = 0; i < n; i++) {
    conjugateTranspose[i] = new Array(n);
    for (let j = 0; j < n; j++) {
      conjugateTranspose[i][j] = matrix[j][i].conjugate();
    }
  }
  
  // Multiply the matrix by its conjugate transpose
  const product = multiplyMatrices(matrix, conjugateTranspose);
  
  // Check if the product is the identity matrix
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const expectedValue = i === j ? new ComplexNumber(1, 0) : new ComplexNumber(0, 0);
      if (!product[i][j].equals(expectedValue, epsilon)) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Multiply two matrices
 * @param {Array<Array<ComplexNumber>>} a - First matrix
 * @param {Array<Array<ComplexNumber>>} b - Second matrix
 * @returns {Array<Array<ComplexNumber>>} - Product matrix
 */
export const multiplyMatrices = (a, b) => {
  const aRows = a.length;
  const aCols = a[0].length;
  const bRows = b.length;
  const bCols = b[0].length;
  
  if (aCols !== bRows) {
    throw new Error(`Matrix dimensions don't match: ${aCols} != ${bRows}`);
  }
  
  const result = new Array(aRows);
  for (let i = 0; i < aRows; i++) {
    result[i] = new Array(bCols);
    for (let j = 0; j < bCols; j++) {
      result[i][j] = new ComplexNumber(0, 0);
      for (let k = 0; k < aCols; k++) {
        result[i][j] = result[i][j].add(a[i][k].multiply(b[k][j]));
      }
    }
  }
  
  return result;
};

/**
 * Calculate the tensor product of two matrices
 * @param {Array<Array<ComplexNumber>>} a - First matrix
 * @param {Array<Array<ComplexNumber>>} b - Second matrix
 * @returns {Array<Array<ComplexNumber>>} - Tensor product
 */
export const tensorProduct = (a, b) => {
  const aRows = a.length;
  const aCols = a[0].length;
  const bRows = b.length;
  const bCols = b[0].length;
  
  const result = new Array(aRows * bRows);
  
  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < bRows; j++) {
      for (let k = 0; k < aCols; k++) {
        for (let l = 0; l < bCols; l++) {
          const rowIdx = i * bRows + j;
          const colIdx = k * bCols + l;
          
          if (!result[rowIdx]) {
            result[rowIdx] = new Array(aCols * bCols);
          }
          
          result[rowIdx][colIdx] = a[i][k].multiply(b[j][l]);
        }
      }
    }
  }
  
  return result;
};

/**
 * Generate the identity matrix of a given size
 * @param {number} size - Size of the matrix
 * @returns {Array<Array<ComplexNumber>>} - Identity matrix
 */
export const identityMatrix = (size) => {
  const result = new Array(size);
  
  for (let i = 0; i < size; i++) {
    result[i] = new Array(size);
    for (let j = 0; j < size; j++) {
      result[i][j] = i === j
        ? new ComplexNumber(1, 0)
        : new ComplexNumber(0, 0);
    }
  }
  
  return result;
};

/**
 * Calculate the Hermitian conjugate (conjugate transpose) of a matrix
 * @param {Array<Array<ComplexNumber>>} matrix - Input matrix
 * @returns {Array<Array<ComplexNumber>>} - Hermitian conjugate
 */
export const hermitianConjugate = (matrix) => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  const result = new Array(cols);
  
  for (let i = 0; i < cols; i++) {
    result[i] = new Array(rows);
    for (let j = 0; j < rows; j++) {
      result[i][j] = matrix[j][i].conjugate();
    }
  }
  
  return result;
};

/**
 * Calculate the trace of a matrix
 * @param {Array<Array<ComplexNumber>>} matrix - Square matrix
 * @returns {ComplexNumber} - Trace of the matrix
 */
export const trace = (matrix) => {
  const n = matrix.length;
  
  if (n !== matrix[0].length) {
    throw new Error('Matrix must be square');
  }
  
  let result = new ComplexNumber(0, 0);
  
  for (let i = 0; i < n; i++) {
    result = result.add(matrix[i][i]);
  }
  
  return result;
};

/**
 * Check if a matrix is Hermitian (self-adjoint)
 * @param {Array<Array<ComplexNumber>>} matrix - Matrix to check
 * @param {number} epsilon - Tolerance for floating-point comparison
 * @returns {boolean} - Whether the matrix is Hermitian
 */
export const isHermitian = (matrix, epsilon = 1e-10) => {
  const n = matrix.length;
  
  if (n !== matrix[0].length) {
    return false; // Not square
  }
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!matrix[i][j].equals(matrix[j][i].conjugate(), epsilon)) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Apply a matrix to a state vector
 * @param {Array<Array<ComplexNumber>>} matrix - Matrix to apply
 * @param {Array<ComplexNumber>} vector - State vector
 * @returns {Array<ComplexNumber>} - Resulting vector
 */
export const applyMatrix = (matrix, vector) => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  if (cols !== vector.length) {
    throw new Error(`Matrix and vector dimensions don't match: ${cols} != ${vector.length}`);
  }
  
  const result = new Array(rows);
  
  for (let i = 0; i < rows; i++) {
    result[i] = new ComplexNumber(0, 0);
    for (let j = 0; j < cols; j++) {
      result[i] = result[i].add(matrix[i][j].multiply(vector[j]));
    }
  }
  
  return result;
};

/**
 * Calculate the outer product of two vectors
 * @param {Array<ComplexNumber>} v1 - First vector
 * @param {Array<ComplexNumber>} v2 - Second vector
 * @returns {Array<Array<ComplexNumber>>} - Outer product matrix
 */
export const outerProduct = (v1, v2) => {
  const rows = v1.length;
  const cols = v2.length;
  
  const result = new Array(rows);
  
  for (let i = 0; i < rows; i++) {
    result[i] = new Array(cols);
    for (let j = 0; j < cols; j++) {
      result[i][j] = v1[i].multiply(v2[j].conjugate());
    }
  }
  
  return result;
};

/**
 * Calculate the tensor product of two vectors
 * @param {Array<ComplexNumber>} v1 - First vector
 * @param {Array<ComplexNumber>} v2 - Second vector
 * @returns {Array<ComplexNumber>} - Tensor product vector
 */
export const tensorProductVectors = (v1, v2) => {
  const len1 = v1.length;
  const len2 = v2.length;
  
  const result = new Array(len1 * len2);
  
  for (let i = 0; i < len1; i++) {
    for (let j = 0; j < len2; j++) {
      result[i * len2 + j] = v1[i].multiply(v2[j]);
    }
  }
  
  return result;
};

/**
 * Calculate the inner product of two vectors
 * @param {Array<ComplexNumber>} v1 - First vector
 * @param {Array<ComplexNumber>} v2 - Second vector
 * @returns {ComplexNumber} - Inner product
 */
export const innerProduct = (v1, v2) => {
  if (v1.length !== v2.length) {
    throw new Error(`Vector dimensions don't match: ${v1.length} != ${v2.length}`);
  }
  
  let result = new ComplexNumber(0, 0);
  
  for (let i = 0; i < v1.length; i++) {
    result = result.add(v1[i].conjugate().multiply(v2[i]));
  }
  
  return result;
};

export default {
  isUnitary,
  multiplyMatrices,
  tensorProduct,
  identityMatrix,
  hermitianConjugate,
  trace,
  isHermitian,
  applyMatrix,
  outerProduct,
  tensorProductVectors,
  innerProduct
};