// src/utils/complex-math.js
// Utility class for complex number operations

import Complex from 'complex.js';

/**
 * A class for complex number operations optimized for quantum computing
 */
export class ComplexNumber {
  /**
   * Create a new ComplexNumber
   * @param {number} real - Real part
   * @param {number} imag - Imaginary part
   */
  constructor(real, imag) {
    this.real = real;
    this.imag = imag;
  }

  /**
   * Add another complex number
   * @param {ComplexNumber} other - Complex number to add
   * @returns {ComplexNumber} - Result of addition
   */
  add(other) {
    return new ComplexNumber(
      this.real + other.real,
      this.imag + other.imag
    );
  }

  /**
   * Subtract another complex number
   * @param {ComplexNumber} other - Complex number to subtract
   * @returns {ComplexNumber} - Result of subtraction
   */
  subtract(other) {
    return new ComplexNumber(
      this.real - other.real,
      this.imag - other.imag
    );
  }

  /**
   * Multiply by another complex number
   * @param {ComplexNumber} other - Complex number to multiply by
   * @returns {ComplexNumber} - Result of multiplication
   */
  multiply(other) {
    return new ComplexNumber(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  /**
   * Divide by another complex number
   * @param {ComplexNumber} other - Complex number to divide by
   * @returns {ComplexNumber} - Result of division
   */
  divide(other) {
    const denominator = other.real * other.real + other.imag * other.imag;
    
    if (denominator === 0) {
      throw new Error('Division by zero');
    }
    
    return new ComplexNumber(
      (this.real * other.real + this.imag * other.imag) / denominator,
      (this.imag * other.real - this.real * other.imag) / denominator
    );
  }

  /**
   * Calculate the complex conjugate
   * @returns {ComplexNumber} - Complex conjugate
   */
  conjugate() {
    return new ComplexNumber(this.real, -this.imag);
  }

  /**
   * Calculate the magnitude (absolute value)
   * @returns {number} - Magnitude
   */
  magnitude() {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }

  /**
   * Calculate the squared magnitude (avoids square root)
   * @returns {number} - Squared magnitude
   */
  magnitudeSquared() {
    return this.real * this.real + this.imag * this.imag;
  }

  /**
   * Calculate the phase (argument)
   * @returns {number} - Phase in radians
   */
  phase() {
    return Math.atan2(this.imag, this.real);
  }

  /**
   * Raise to a power
   * @param {number} exponent - Power to raise to
   * @returns {ComplexNumber} - Result
   */
  pow(exponent) {
    if (exponent === 0) {
      return new ComplexNumber(1, 0);
    }
    
    if (Number.isInteger(exponent) && exponent > 0) {
      let result = this;
      for (let i = 1; i < exponent; i++) {
        result = result.multiply(this);
      }
      return result;
    }
    
    // For non-integer exponents, use the exponential form
    const r = this.magnitude();
    const theta = this.phase();
    
    const newR = Math.pow(r, exponent);
    const newTheta = theta * exponent;
    
    return new ComplexNumber(
      newR * Math.cos(newTheta),
      newR * Math.sin(newTheta)
    );
  }

  /**
   * Calculate the exponential (e^z)
   * @returns {ComplexNumber} - Result
   */
  exp() {
    const expReal = Math.exp(this.real);
    return new ComplexNumber(
      expReal * Math.cos(this.imag),
      expReal * Math.sin(this.imag)
    );
  }

  /**
   * Check if equal to another complex number
   * @param {ComplexNumber} other - Complex number to compare with
   * @param {number} epsilon - Tolerance for floating-point comparison
   * @returns {boolean} - Whether they are equal
   */
  equals(other, epsilon = 1e-10) {
    return (
      Math.abs(this.real - other.real) < epsilon &&
      Math.abs(this.imag - other.imag) < epsilon
    );
  }

  /**
   * Check if this is the zero complex number
   * @param {number} epsilon - Tolerance for floating-point comparison
   * @returns {boolean} - Whether this is zero
   */
  isZero(epsilon = 1e-10) {
    return (
      Math.abs(this.real) < epsilon &&
      Math.abs(this.imag) < epsilon
    );
  }

  /**
   * Create a complex number from polar coordinates
   * @param {number} r - Magnitude
   * @param {number} theta - Phase in radians
   * @returns {ComplexNumber} - Resulting complex number
   */
  static fromPolar(r, theta) {
    return new ComplexNumber(
      r * Math.cos(theta),
      r * Math.sin(theta)
    );
  }

  /**
   * Convert to string representation
   * @returns {string} - String representation
   */
  toString() {
    if (this.imag === 0) {
      return `${this.real}`;
    }
    
    if (this.real === 0) {
      return `${this.imag}i`;
    }
    
    const sign = this.imag < 0 ? '-' : '+';
    const absImag = Math.abs(this.imag);
    
    return `${this.real} ${sign} ${absImag}i`;
  }

  /**
   * Convert to the native Complex.js format if needed
   * @returns {Complex} - Complex.js representation
   */
  toComplexJS() {
    return new Complex(this.real, this.imag);
  }

  /**
   * Create a ComplexNumber from a Complex.js complex number
   * @param {Complex} complex - Complex.js complex number
   * @returns {ComplexNumber} - New ComplexNumber instance
   */
  static fromComplexJS(complex) {
    return new ComplexNumber(complex.re, complex.im);
  }
}

export default ComplexNumber;