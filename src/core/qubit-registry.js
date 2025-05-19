// src/core/qubit-registry.js
// Manages the allocation, tracking, and deallocation of qubits

import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('QVM:QubitRegistry');

export class QubitRegistry {
  /**
   * Creates a new QubitRegistry instance
   * @param {Object} stateVector - The state vector instance to use
   */
  constructor(stateVector) {
    this.qubits = new Map();
    this.entanglementGroups = new Map();
    this.nextQubitIndex = 0;
    this.stateVector = stateVector;
    this.maxQubits = Number(process.env.QVM_MAX_QUBITS) || 32;
    
    logger.debug('QubitRegistry initialized');
  }

  /**
   * Allocate a new qubit and return its identifier
   * @returns {string} - Unique qubit identifier
   */
  allocateQubit() {
    if (this.qubits.size >= this.maxQubits) {
      const error = new Error(`Cannot allocate more than ${this.maxQubits} qubits`);
      logger.error(error.message);
      throw error;
    }
    
    const qubitId = uuidv4();
    const qubitIndex = this.nextQubitIndex++;
    
    this.qubits.set(qubitId, qubitIndex);
    this.stateVector.expandStateVector();
    
    // Initialize a new entanglement group for this qubit
    this.entanglementGroups.set(qubitId, new Set([qubitId]));
    
    logger.debug(`Allocated qubit ${qubitId} at index ${qubitIndex}`);
    return qubitId;
  }

  /**
   * Allocate multiple qubits at once
   * @param {number} count - Number of qubits to allocate
   * @returns {string[]} - Array of qubit identifiers
   */
  allocateQubits(count) {
    if (count <= 0) {
      throw new Error('Must allocate a positive number of qubits');
    }
    
    const qubitIds = [];
    for (let i = 0; i < count; i++) {
      qubitIds.push(this.allocateQubit());
    }
    
    return qubitIds;
  }

  /**
   * Deallocate a qubit
   * @param {string} qubitId - The qubit identifier
   * @returns {boolean} - Success status
   */
  deallocateQubit(qubitId) {
    if (!this.qubits.has(qubitId)) {
      logger.warn(`Attempted to deallocate non-existent qubit: ${qubitId}`);
      return false;
    }

    // Check if the qubit is entangled
    const entanglementGroup = this.entanglementGroups.get(qubitId);
    if (entanglementGroup.size > 1) {
      logger.warn(`Deallocating entangled qubit ${qubitId} may cause quantum state issues`);
    }
    
    // Remove from entanglement groups
    for (const [id, group] of this.entanglementGroups.entries()) {
      if (group.has(qubitId)) {
        group.delete(qubitId);
      }
    }
    
    this.entanglementGroups.delete(qubitId);
    this.qubits.delete(qubitId);
    
    logger.debug(`Deallocated qubit ${qubitId}`);
    return true;
  }

  /**
   * Get the index of a qubit by its ID
   * @param {string} qubitId - The qubit identifier
   * @returns {number} - The qubit's index
   */
  getQubitIndex(qubitId) {
    const index = this.qubits.get(qubitId);
    if (index === undefined) {
      const error = new Error(`Qubit ${qubitId} not found`);
      logger.error(error.message);
      throw error;
    }
    return index;
  }

  /**
   * Record entanglement between qubits
   * @param {string} qubitId1 - First qubit identifier
   * @param {string} qubitId2 - Second qubit identifier
   */
  recordEntanglement(qubitId1, qubitId2) {
    const group1 = this.entanglementGroups.get(qubitId1);
    const group2 = this.entanglementGroups.get(qubitId2);
    
    if (!group1 || !group2) {
      throw new Error('One or both qubits not found');
    }
    
    // Merge the entanglement groups
    const mergedGroup = new Set([...group1, ...group2]);
    
    // Update all qubits to point to the merged group
    for (const qubitId of mergedGroup) {
      this.entanglementGroups.set(qubitId, mergedGroup);
    }
    
    logger.debug(`Recorded entanglement between qubits ${qubitId1} and ${qubitId2}`);
  }

  /**
   * Check if two qubits are entangled
   * @param {string} qubitId1 - First qubit identifier
   * @param {string} qubitId2 - Second qubit identifier
   * @returns {boolean} - Whether the qubits are entangled
   */
  areEntangled(qubitId1, qubitId2) {
    const group1 = this.entanglementGroups.get(qubitId1);
    if (!group1) return false;
    
    return group1.has(qubitId2);
  }

  /**
   * Get all qubits in the same entanglement group
   * @param {string} qubitId - Qubit identifier
   * @returns {string[]} - Array of entangled qubit identifiers
   */
  getEntangledQubits(qubitId) {
    const group = this.entanglementGroups.get(qubitId);
    if (!group) {
      throw new Error(`Qubit ${qubitId} not found`);
    }
    
    return Array.from(group).filter(id => id !== qubitId);
  }

  /**
   * Get all currently allocated qubits
   * @returns {string[]} - Array of qubit identifiers
   */
  getAllQubits() {
    return Array.from(this.qubits.keys());
  }

  /**
   * Get the total number of qubits in the system
   * @returns {number} - Number of qubits
   */
  getQubitCount() {
    return this.qubits.size;
  }

  /**
   * Reset the qubit registry
   */
  reset() {
    this.qubits.clear();
    this.entanglementGroups.clear();
    this.nextQubitIndex = 0;
    logger.debug('QubitRegistry reset');
  }
}

export default QubitRegistry;