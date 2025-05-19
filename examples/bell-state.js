// examples/bell-state.js
// Example of creating a Bell state (maximally entangled two-qubit state)

import { 
  initialize,
  createCircuit,
  reset
} from '../src/index.js';

/**
 * This example demonstrates how to create a Bell state (|00⟩ + |11⟩)/√2,
 * which is a maximally entangled state of two qubits.
 */
const runBellStateExample = async () => {
    console.log('=== Bell State Example ===');
    
    // Initialize the QVM
    await initialize();
    
    // Create a quantum circuit
    const circuit = createCircuit();
    
    // Allocate two qubits
    const qubit0 = circuit.allocateQubit();
    const qubit1 = circuit.allocateQubit();
    
    console.log(`Allocated qubits: ${qubit0}, ${qubit1}`);
    
    // Apply Hadamard gate to the first qubit
    circuit.h(qubit0);
    
    // Apply CNOT gate with first qubit as control and second as target
    circuit.cnot(qubit0, qubit1);
    
    // Skip bytecode execution for now
    // const qbc = circuit.compile();
    // const result = await executeQBC(qbc);

    console.log('\nCircuit state directly:');
    const stateVector = circuit.getStateVector();
    
    console.log('State vector:');
    
    // Format and display state vector
    stateVector.forEach((amplitude, index) => {
        const binary = index.toString(2).padStart(2, '0');
        const probability = amplitude.magnitudeSquared();
        if (probability > 0.001) { // Only show non-negligible amplitudes
            console.log(`|${binary}⟩: ${amplitude.toString()} (probability: ${probability.toFixed(4)})`);
        }
    });
    
    // Visualize the state with an "ASCII art" histogram
    console.log('\nProbability distribution:');
    const histogram = {};
    stateVector.forEach((amplitude, index) => {
        const binary = index.toString(2).padStart(2, '0');
        const probability = amplitude.magnitudeSquared();
        histogram[binary] = probability;
    });
    
    Object.entries(histogram).forEach(([state, prob]) => {
        const bar = '#'.repeat(Math.round(prob * 40));
        console.log(`|${state}⟩: ${bar} ${(prob * 100).toFixed(1)}%`);
    });
    
    // Demonstrate measurements
    console.log('\nTaking 1000 measurements:');
    const measurements = circuit.simulate(1000);
    console.log('Measurement results:');
    Object.entries(measurements).forEach(([state, count]) => {
        // Reverse the bit order to match the qubit allocation order
        const formattedState = state.split('').reverse().join('');
        const percentage = (count / 1000 * 100).toFixed(1);
        console.log(`|${formattedState}⟩: ${count} (${percentage}%)`);
    });
    
    // Demonstrate entanglement
    console.log('\nDemonstrating entanglement:');
    console.log('Joint measurement results of both qubits:');

    // Collect joint measurement statistics
    const results = { '00': 0, '01': 0, '10': 0, '11': 0 };

    for (let i = 0; i < 1000; i++) {
        // Reset QVM state
        reset();
        
        // Create a new Bell state each time
        const testCircuit = createCircuit();
        const q0 = testCircuit.allocateQubit();
        const q1 = testCircuit.allocateQubit();
        
        // Prepare Bell state
        testCircuit.h(q0);
        testCircuit.cnot(q0, q1);
        
        // Measure both qubits
        const result0 = testCircuit.measure(q0);
        const result1 = testCircuit.measure(q1);
        
        // Record the joint measurement
        const resultString = `${result0}${result1}`;
        results[resultString] = (results[resultString] || 0) + 1;
    }

    console.log('Joint measurement results:');
    Object.entries(results).sort().forEach(([state, count]) => {
        const percentage = (count / 1000 * 100).toFixed(1);
        console.log(`|${state}⟩: ${count} (${percentage}%)`);
    });

    console.log('\nIn a Bell state, we should only see 00 and 11 results.');
    console.log('This perfect correlation demonstrates quantum entanglement.');
    
    // Test entanglement more explicitly
    console.log('\nTesting the conditional probabilities:');
    
    // Collect data to verify conditional probabilities
    const conditionalResults = {
        'measured_0_then_0': 0,
        'measured_0_then_1': 0,
        'measured_1_then_0': 0,
        'measured_1_then_1': 0,
        'total_0': 0,
        'total_1': 0
    };
    
    for (let i = 0; i < 1000; i++) {
        reset();
        
        const testCircuit = createCircuit();
        const q0 = testCircuit.allocateQubit();
        const q1 = testCircuit.allocateQubit();
        
        testCircuit.h(q0);
        testCircuit.cnot(q0, q1);
        
        // Measure first qubit
        const firstResult = testCircuit.measure(q0);
        
        // Track how many times we get 0 or 1 on the first qubit
        if (firstResult === 0) {
            conditionalResults.total_0++;
        } else {
            conditionalResults.total_1++;
        }
        
        // Measure second qubit
        const secondResult = testCircuit.measure(q1);
        
        // Record conditional results
        if (firstResult === 0 && secondResult === 0) {
            conditionalResults.measured_0_then_0++;
        } else if (firstResult === 0 && secondResult === 1) {
            conditionalResults.measured_0_then_1++;
        } else if (firstResult === 1 && secondResult === 0) {
            conditionalResults.measured_1_then_0++;
        } else if (firstResult === 1 && secondResult === 1) {
            conditionalResults.measured_1_then_1++;
        }
    }
    
    // Calculate conditional probabilities
    const prob_0_given_0 = conditionalResults.measured_0_then_0 / conditionalResults.total_0;
    const prob_1_given_0 = conditionalResults.measured_0_then_1 / conditionalResults.total_0;
    const prob_0_given_1 = conditionalResults.measured_1_then_0 / conditionalResults.total_1;
    const prob_1_given_1 = conditionalResults.measured_1_then_1 / conditionalResults.total_1;
    
    console.log(`First qubit measured as 0: ${conditionalResults.total_0} times`);
    console.log(`First qubit measured as 1: ${conditionalResults.total_1} times`);
    console.log(`\nConditional probabilities:`);
    console.log(`P(second=0|first=0) = ${(prob_0_given_0 * 100).toFixed(1)}%`);
    console.log(`P(second=1|first=0) = ${(prob_1_given_0 * 100).toFixed(1)}%`);
    console.log(`P(second=0|first=1) = ${(prob_0_given_1 * 100).toFixed(1)}%`);
    console.log(`P(second=1|first=1) = ${(prob_1_given_1 * 100).toFixed(1)}%`);
    
    console.log('\nIn a perfect Bell state, P(second=0|first=0) and P(second=1|first=1) should be 100%');
    console.log('while P(second=1|first=0) and P(second=0|first=1) should be 0%');
    
    console.log('\nBell state example completed!');
};

// Run the example
runBellStateExample().catch(err => {
    console.error('Error in Bell state example:', err);
});

// Export the example function for use in other examples
export default runBellStateExample;