import type { CircuitIR, GateIR } from '@/types/quantum';

export function ir_to_qasm(ir: CircuitIR): string {
  const lines: string[] = [
    'OPENQASM 3.0;',
    'include "stdgates.inc";',
    '',
    `qubit[${ir.num_qubits}] q;`,
    `bit[${ir.num_qubits}] c;`,
    '',
  ];

  for (const g of ir.gates) {
    const name = g.name.toLowerCase();
    const qTargets = g.qubits.map((q) => `q[${q}]`).join(', ');

    if (name === 'measure') {
      const q = g.qubits[0];
      lines.push(`c[${q}] = measure q[${q}];`);
    } else if (name === 'cx' || name === 'cnot') {
      lines.push(`cx ${qTargets};`);
    } else if (name === 'cz') {
      lines.push(`cz ${qTargets};`);
    } else if (name === 'swap') {
      lines.push(`swap ${qTargets};`);
    } else if (g.params && g.params.length > 0) {
      const pStr = g.params.map((p) => Number(p).toFixed(4)).join(', ');
      lines.push(`${name}(${pStr}) ${qTargets};`);
    } else {
      lines.push(`${name} ${qTargets};`);
    }
  }

  return lines.join('\n');
}

export function qasm_to_ir(qasm: string): CircuitIR {
  let num_qubits = 1;
  const gates: GateIR[] = [];

  const lines = qasm.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//') || line.startsWith('OPENQASM') || line.startsWith('include')) {
      continue;
    }

    // Check qubit declaration: qubit[N] q;
    const qMatch = line.match(/qubit\[(\d+)\]/i);
    if (qMatch) {
      num_qubits = Math.max(1, parseInt(qMatch[1], 10));
      continue;
    }

    // Check measurement: c[0] = measure q[0]; or measure q[0] -> c[0];
    const measureMatch = line.match(/measure\s+q\[(\d+)\]/i);
    if (measureMatch) {
      const q = parseInt(measureMatch[1], 10);
      gates.push({ name: 'measure', qubits: [q] });
      num_qubits = Math.max(num_qubits, q + 1);
      continue;
    }

    // Check 2-qubit gates: cx q[0], q[1]; or cnot q[0], q[1]; or cz q[0], q[1]; or swap q[0], q[1];
    const twoQMatch = line.match(/^(cx|cnot|cz|swap)\s+q\[(\d+)\]\s*,\s*q\[(\d+)\]\s*;/i);
    if (twoQMatch) {
      const gName = twoQMatch[1].toLowerCase() === 'cnot' ? 'cx' : twoQMatch[1].toLowerCase();
      const q0 = parseInt(twoQMatch[2], 10);
      const q1 = parseInt(twoQMatch[3], 10);
      gates.push({ name: gName, qubits: [q0, q1] });
      num_qubits = Math.max(num_qubits, q0 + 1, q1 + 1);
      continue;
    }

    // Check parameterized single qubit gates: rx(1.57) q[0];
    const paramMatch = line.match(/^([a-z]+)\(([^)]+)\)\s+q\[(\d+)\]\s*;/i);
    if (paramMatch) {
      const gName = paramMatch[1].toLowerCase();
      const params = paramMatch[2].split(',').map((p) => parseFloat(p.trim())).filter((n) => !isNaN(n));
      const q = parseInt(paramMatch[3], 10);
      gates.push({ name: gName, qubits: [q], params });
      num_qubits = Math.max(num_qubits, q + 1);
      continue;
    }

    // Check single qubit gates: h q[0]; or x q[0];
    const singleQMatch = line.match(/^([a-z]+)\s+q\[(\d+)\]\s*;/i);
    if (singleQMatch) {
      const gName = singleQMatch[1].toLowerCase();
      const q = parseInt(singleQMatch[2], 10);
      gates.push({ name: gName, qubits: [q] });
      num_qubits = Math.max(num_qubits, q + 1);
      continue;
    }
  }

  return {
    num_qubits,
    gates,
  };
}
