// examples/bell-state.js
import {
  initialize,
  createCircuit
} from '../src/index.js';

const runBellStateExample = async () => {
    console.log('=== Bell State Example ===');

    await initialize();

    // ---- BELL STATE SETUP + SIMULATION ----
    const circuit = createCircuit();
    const qubit0 = circuit.allocateQubit();
    const qubit1 = circuit.allocateQubit();

    console.log(`Allocated qubits: ${qubit0}, ${qubit1}`);

    circuit.h(qubit0);
    circuit.cnot(qubit0, qubit1);

    console.log('\nCircuit state directly:');
    const stateVector = circuit.getStateVector();

    console.log('State vector:');
    stateVector.forEach((amplitude, index) => {
        const binary = index.toString(2).padStart(2, '0');
        const probability = amplitude.magnitudeSquared();
        if (probability > 0.001) {
        console.log(`|${binary}⟩: ${amplitude.toString()} (probability: ${probability.toFixed(4)})`);
        }
    });

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

    console.log('\nTaking 10 measurements:');
    const measurements = circuit.simulate(10);
    console.log('Measurement results:');
    Object.entries(measurements).forEach(([state, count]) => {
        const formattedState = state.split('').reverse().join('');
        const percentage = (count / 10 * 100).toFixed(1);
        console.log(`|${formattedState}⟩: ${count} (${percentage}%)`);
    });

    // ---- ENTANGLEMENT: JOINT MEASUREMENTS ----
    console.log('\nDemonstrating entanglement:');
    console.log('Joint measurement results of both qubits:');

    const results = { '00': 0, '01': 0, '10': 0, '11': 0 };

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < 10; i++) {
        if (i % 5 === 0) {
            console.log(`Progress: ${i}/10`);
            await sleep(0);
        }

        const circuitLocal = createCircuit(); // renamed to avoid collision
        const q0 = circuitLocal.allocateQubit();
        const q1 = circuitLocal.allocateQubit();

        circuitLocal.h(q0);
        circuitLocal.cnot(q0, q1);

        const r0 = circuitLocal.measure(q0);
        const r1 = circuitLocal.measure(q1);

        const resultStr = `${r0}${r1}`;
        results[resultStr] = (results[resultStr] || 0) + 1;
    }

    console.log('\nJoint measurement results:');
    Object.entries(results).sort().forEach(([state, count]) => {
        const percentage = (count / 10 * 100).toFixed(1); // you could make 10 a variable
        console.log(`|${state}⟩: ${count} (${percentage}%)`);
    });


    // ---- CONDITIONAL PROBABILITIES ----
    console.log('\nTesting the conditional probabilities:');

    const conditionalResults = {
    measured_0_then_0: 0,
    measured_0_then_1: 0,
    measured_1_then_0: 0,
    measured_1_then_1: 0,
    total_0: 0,
    total_1: 0
    };

    const SHOTS = 10;

    for (let i = 0; i < SHOTS; i++) {
    if (i % 5 === 0) {
        console.log(`Progress: ${i}/${SHOTS}`);
        await sleep(0);
    }

    {
        const circuit = createCircuit();
        const q0 = circuit.allocateQubit();
        const q1 = circuit.allocateQubit();

        circuit.h(q0);
        circuit.cnot(q0, q1);

        const r0 = circuit.measure(q0);
        const r1 = circuit.measure(q1);

        if (r0 === 0) {
        conditionalResults.total_0++;
        r1 === 0 ? conditionalResults.measured_0_then_0++ : conditionalResults.measured_0_then_1++;
        } else {
        conditionalResults.total_1++;
        r1 === 0 ? conditionalResults.measured_1_then_0++ : conditionalResults.measured_1_then_1++;
        }

        // Optional cleanup
        circuit.destroy?.();
    }
    }

    // Compute and print final stats
    const p00 = conditionalResults.measured_0_then_0 / conditionalResults.total_0 || 0;
    const p01 = conditionalResults.measured_0_then_1 / conditionalResults.total_0 || 0;
    const p10 = conditionalResults.measured_1_then_0 / conditionalResults.total_1 || 0;
    const p11 = conditionalResults.measured_1_then_1 / conditionalResults.total_1 || 0;

    console.log(`First qubit measured as 0: ${conditionalResults.total_0} times`);
    console.log(`First qubit measured as 1: ${conditionalResults.total_1} times`);
    console.log(`\nConditional probabilities:`);
    console.log(`P(second=0|first=0) = ${(p00 * 100).toFixed(1)}%`);
    console.log(`P(second=1|first=0) = ${(p01 * 100).toFixed(1)}%`);
    console.log(`P(second=0|first=1) = ${(p10 * 100).toFixed(1)}%`);
    console.log(`P(second=1|first=1) = ${(p11 * 100).toFixed(1)}%`);


    console.log('\nBell state example completed!');
};

runBellStateExample().catch(err => {
    console.error('Error in Bell state example:', err);
});

export default runBellStateExample;
