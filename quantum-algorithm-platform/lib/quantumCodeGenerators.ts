import type { CircuitIR, GateIR } from '@/types/quantum'

export function generateQiskitCode(circuit: CircuitIR): string {
  const numQ = circuit.num_qubits || 2
  const hasMeasure = circuit.gates.some((g) => g.name.toLowerCase() === 'measure')

  const lines: string[] = [
    'from qiskit import QuantumCircuit',
    'from qiskit.quantum_info import Statevector',
    '',
    `# Initialize ${numQ}-qubit quantum circuit`,
    hasMeasure ? `qc = QuantumCircuit(${numQ}, ${numQ})` : `qc = QuantumCircuit(${numQ})`,
    '',
  ]

  if (!circuit.gates || circuit.gates.length === 0) {
    lines.push('# Ground state |0...0> (no gates applied)')
    lines.push('print(qc.draw(output="text"))')
    return lines.join('\n')
  }

  for (const g of circuit.gates) {
    const name = g.name.toLowerCase()
    const qs = g.qubits || []
    const p = g.params || []

    if (name === 'h') {
      qs.forEach((q) => lines.push(`qc.h(${q})`))
    } else if (name === 'x') {
      qs.forEach((q) => lines.push(`qc.x(${q})`))
    } else if (name === 'y') {
      qs.forEach((q) => lines.push(`qc.y(${q})`))
    } else if (name === 'z') {
      qs.forEach((q) => lines.push(`qc.z(${q})`))
    } else if (name === 's') {
      qs.forEach((q) => lines.push(`qc.s(${q})`))
    } else if (name === 'sdg') {
      qs.forEach((q) => lines.push(`qc.sdg(${q})`))
    } else if (name === 't') {
      qs.forEach((q) => lines.push(`qc.t(${q})`))
    } else if (name === 'tdg') {
      qs.forEach((q) => lines.push(`qc.tdg(${q})`))
    } else if (name === 'sx') {
      qs.forEach((q) => lines.push(`qc.sx(${q})`))
    } else if (name === 'rx' && p.length > 0) {
      qs.forEach((q) => lines.push(`qc.rx(${p[0].toFixed(4)}, ${q})`))
    } else if (name === 'ry' && p.length > 0) {
      qs.forEach((q) => lines.push(`qc.ry(${p[0].toFixed(4)}, ${q})`))
    } else if (name === 'rz' && p.length > 0) {
      qs.forEach((q) => lines.push(`qc.rz(${p[0].toFixed(4)}, ${q})`))
    } else if (name === 'cx' && qs.length >= 2) {
      lines.push(`qc.cx(${qs[0]}, ${qs[1]})`)
    } else if (name === 'cz' && qs.length >= 2) {
      lines.push(`qc.cz(${qs[0]}, ${qs[1]})`)
    } else if (name === 'swap' && qs.length >= 2) {
      lines.push(`qc.swap(${qs[0]}, ${qs[1]})`)
    } else if (name === 'ccx' && qs.length >= 3) {
      lines.push(`qc.ccx(${qs[0]}, ${qs[1]}, ${qs[2]})`)
    } else if (name === 'cswap' && qs.length >= 3) {
      lines.push(`qc.cswap(${qs[0]}, ${qs[1]}, ${qs[2]})`)
    } else if (name === 'measure') {
      qs.forEach((q) => lines.push(`qc.measure(${q}, ${q})`))
    } else {
      // Fallback gate syntax
      lines.push(`qc.${name}(${qs.join(', ')})`)
    }
  }

  lines.push('')
  lines.push('# Compute statevector and print circuit diagram')
  lines.push('state = Statevector.from_instruction(qc)')
  lines.push('print(qc.draw(output="text"))')

  return lines.join('\n')
}

export function generateQasmCode(circuit: CircuitIR): string {
  const numQ = circuit.num_qubits || 2
  const hasMeasure = circuit.gates.some((g) => g.name.toLowerCase() === 'measure')

  const lines: string[] = [
    'OPENQASM 3.0;',
    'include "stdgates.inc";',
    '',
    `qubit[${numQ}] q;`,
  ]

  if (hasMeasure) {
    lines.push(`bit[${numQ}] c;`)
  }
  lines.push('')

  for (const g of circuit.gates) {
    const name = g.name.toLowerCase()
    const qs = g.qubits || []
    const p = g.params || []

    if (name === 'cx' && qs.length >= 2) {
      lines.push(`cx q[${qs[0]}], q[${qs[1]}];`)
    } else if (name === 'cz' && qs.length >= 2) {
      lines.push(`cz q[${qs[0]}], q[${qs[1]}];`)
    } else if (name === 'swap' && qs.length >= 2) {
      lines.push(`swap q[${qs[0]}], q[${qs[1]}];`)
    } else if (name === 'ccx' && qs.length >= 3) {
      lines.push(`ccx q[${qs[0]}], q[${qs[1]}], q[${qs[2]}];`)
    } else if (name === 'cswap' && qs.length >= 3) {
      lines.push(`cswap q[${qs[0]}], q[${qs[1]}], q[${qs[2]}];`)
    } else if ((name === 'rx' || name === 'ry' || name === 'rz') && p.length > 0) {
      qs.forEach((q) => lines.push(`${name}(${p[0].toFixed(4)}) q[${q}];`))
    } else if (name === 'measure') {
      qs.forEach((q) => lines.push(`c[${q}] = measure q[${q}];`))
    } else {
      qs.forEach((q) => lines.push(`${name} q[${q}];`))
    }
  }

  return lines.join('\n')
}

export function generateCirqCode(circuit: CircuitIR): string {
  const numQ = circuit.num_qubits || 2
  const lines: string[] = [
    'import cirq',
    '',
    `qubits = cirq.LineQubit.range(${numQ})`,
    'circuit = cirq.Circuit()',
    '',
  ]

  for (const g of circuit.gates) {
    const name = g.name.toLowerCase()
    const qs = g.qubits || []
    const p = g.params || []

    if (name === 'h') {
      qs.forEach((q) => lines.push(`circuit.append(cirq.H(qubits[${q}]))`))
    } else if (name === 'x') {
      qs.forEach((q) => lines.push(`circuit.append(cirq.X(qubits[${q}]))`))
    } else if (name === 'y') {
      qs.forEach((q) => lines.push(`circuit.append(cirq.Y(qubits[${q}]))`))
    } else if (name === 'z') {
      qs.forEach((q) => lines.push(`circuit.append(cirq.Z(qubits[${q}]))`))
    } else if (name === 's') {
      qs.forEach((q) => lines.push(`circuit.append(cirq.S(qubits[${q}]))`))
    } else if (name === 'sdg') {
      qs.forEach((q) => lines.push(`circuit.append(cirq.ZPowGate(exponent=-0.5)(qubits[${q}]))`))
    } else if (name === 't') {
      qs.forEach((q) => lines.push(`circuit.append(cirq.T(qubits[${q}]))`))
    } else if (name === 'tdg') {
      qs.forEach((q) => lines.push(`circuit.append(cirq.ZPowGate(exponent=-0.25)(qubits[${q}]))`))
    } else if (name === 'sx') {
      qs.forEach((q) => lines.push(`circuit.append(cirq.XPowGate(exponent=0.5)(qubits[${q}]))`))
    } else if (name === 'rx' && p.length > 0) {
      qs.forEach((q) => lines.push(`circuit.append(cirq.rx(${p[0].toFixed(4)})(qubits[${q}]))`))
    } else if (name === 'ry' && p.length > 0) {
      qs.forEach((q) => lines.push(`circuit.append(cirq.ry(${p[0].toFixed(4)})(qubits[${q}]))`))
    } else if (name === 'rz' && p.length > 0) {
      qs.forEach((q) => lines.push(`circuit.append(cirq.rz(${p[0].toFixed(4)})(qubits[${q}]))`))
    } else if (name === 'cx' && qs.length >= 2) {
      lines.push(`circuit.append(cirq.CNOT(qubits[${qs[0]}], qubits[${qs[1]}]))`)
    } else if (name === 'cz' && qs.length >= 2) {
      lines.push(`circuit.append(cirq.CZ(qubits[${qs[0]}], qubits[${qs[1]}]))`)
    } else if (name === 'swap' && qs.length >= 2) {
      lines.push(`circuit.append(cirq.SWAP(qubits[${qs[0]}], qubits[${qs[1]}]))`)
    } else if (name === 'ccx' && qs.length >= 3) {
      lines.push(`circuit.append(cirq.CCX(qubits[${qs[0]}], qubits[${qs[1]}], qubits[${qs[2]}]))`)
    } else if (name === 'measure') {
      qs.forEach((q) => lines.push(`circuit.append(cirq.measure(qubits[${q}]))`))
    }
  }

  lines.push('')
  lines.push('print(circuit)')
  return lines.join('\n')
}

export function generatePennyLaneCode(circuit: CircuitIR): string {
  const numQ = circuit.num_qubits || 2
  const lines: string[] = [
    'import pennylane as qml',
    '',
    `dev = qml.device('default.qubit', wires=${numQ})`,
    '',
    '@qml.qnode(dev)',
    'def circuit():',
  ]

  if (!circuit.gates || circuit.gates.length === 0) {
    lines.push('    # Identity ground state')
    lines.push('    return qml.state()')
    return lines.join('\n')
  }

  for (const g of circuit.gates) {
    const name = g.name.toLowerCase()
    const qs = g.qubits || []
    const p = g.params || []

    if (name === 'h') {
      qs.forEach((q) => lines.push(`    qml.Hadamard(wires=${q})`))
    } else if (name === 'x') {
      qs.forEach((q) => lines.push(`    qml.PauliX(wires=${q})`))
    } else if (name === 'y') {
      qs.forEach((q) => lines.push(`    qml.PauliY(wires=${q})`))
    } else if (name === 'z') {
      qs.forEach((q) => lines.push(`    qml.PauliZ(wires=${q})`))
    } else if (name === 's') {
      qs.forEach((q) => lines.push(`    qml.S(wires=${q})`))
    } else if (name === 'sdg') {
      qs.forEach((q) => lines.push(`    qml.adjoint(qml.S(wires=${q}))`))
    } else if (name === 't') {
      qs.forEach((q) => lines.push(`    qml.T(wires=${q})`))
    } else if (name === 'tdg') {
      qs.forEach((q) => lines.push(`    qml.adjoint(qml.T(wires=${q}))`))
    } else if (name === 'sx') {
      qs.forEach((q) => lines.push(`    qml.SX(wires=${q})`))
    } else if (name === 'rx' && p.length > 0) {
      qs.forEach((q) => lines.push(`    qml.RX(${p[0].toFixed(4)}, wires=${q})`))
    } else if (name === 'ry' && p.length > 0) {
      qs.forEach((q) => lines.push(`    qml.RY(${p[0].toFixed(4)}, wires=${q})`))
    } else if (name === 'rz' && p.length > 0) {
      qs.forEach((q) => lines.push(`    qml.RZ(${p[0].toFixed(4)}, wires=${q})`))
    } else if (name === 'cx' && qs.length >= 2) {
      lines.push(`    qml.CNOT(wires=[${qs[0]}, ${qs[1]}])`)
    } else if (name === 'cz' && qs.length >= 2) {
      lines.push(`    qml.CZ(wires=[${qs[0]}, ${qs[1]}])`)
    } else if (name === 'swap' && qs.length >= 2) {
      lines.push(`    qml.SWAP(wires=[${qs[0]}, ${qs[1]}])`)
    } else if (name === 'ccx' && qs.length >= 3) {
      lines.push(`    qml.Toffoli(wires=[${qs[0]}, ${qs[1]}, ${qs[2]}])`)
    }
  }

  lines.push('    return qml.state()')
  return lines.join('\n')
}

export function generateAllQuantumSnippets(circuit: CircuitIR) {
  return {
    qiskit: generateQiskitCode(circuit),
    qasm: generateQasmCode(circuit),
    cirq: generateCirqCode(circuit),
    pennylane: generatePennyLaneCode(circuit),
    ir: JSON.stringify(circuit, null, 2),
    custom: 'import numpy as np\nprint("Executing custom quantum code...")\n',
  }
}
