'use client'

import React, { useState, useEffect, useRef } from 'react';
import type { CircuitIR, CodeExecutionResult } from '@/types/quantum';
import {
  Copy,
  Check,
  ChevronDown,
  Edit3,
  Play,
  RotateCcw,
  Terminal,
  XCircle,
  CheckCircle2,
  Clock,
  Cpu,
  Trash2,
  Maximize2,
  Minimize2,
  PanelRightClose,
  Columns,
} from 'lucide-react';
import { BACKEND_URL } from '@/config';

interface CodePanelProps {
  circuitIR: CircuitIR;
  onApplyIR: (ir: CircuitIR) => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onToggleCollapse?: () => void;
  onSetWidthPreset?: (preset: 'compact' | 'standard' | 'wide') => void;
}

type CodeMode = 'qasm' | 'qiskit' | 'cirq' | 'pennylane' | 'ir' | 'custom';

export const CodePanel: React.FC<CodePanelProps> = ({
  circuitIR,
  onApplyIR,
  isMaximized = false,
  onToggleMaximize,
  onToggleCollapse,
  onSetWidthPreset,
}) => {
  const [viewMode, setViewMode] = useState<CodeMode>('qiskit');
  const [copied, setCopied] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Generated code cache from backend
  const [generatedCode, setGeneratedCode] = useState<Record<CodeMode, string>>({
    qiskit: '',
    cirq: '',
    pennylane: '',
    qasm: '',
    ir: '',
    custom: 'import numpy as np\nprint("Executing custom quantum code...")\n',
  });

  // User edited live code per mode
  const [liveCode, setLiveCode] = useState<Record<CodeMode, string>>({
    qiskit: '',
    cirq: '',
    pennylane: '',
    qasm: '',
    ir: '',
    custom: 'import numpy as np\nprint("Executing custom quantum code...")\n',
  });

  // Track if user has customized the code for that mode
  const [isCustomized, setIsCustomized] = useState<Record<CodeMode, boolean>>({
    qiskit: false,
    cirq: false,
    pennylane: false,
    qasm: false,
    ir: false,
    custom: true,
  });

  // Code Execution State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [outputCopied, setOutputCopied] = useState<boolean>(false);

  // Fetch / Generate snippets when circuitIR changes
  useEffect(() => {
    const fetchCodeSnippets = async () => {
      // 1. QASM
      try {
        const res = await fetch(`${BACKEND_URL}/export/qasm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(circuitIR),
        });
        if (res.ok) {
          const data = await res.json();
          setGeneratedCode((prev) => ({ ...prev, qasm: data.qasm }));
          setLiveCode((prev) => (isCustomized.qasm ? prev : { ...prev, qasm: data.qasm }));
        }
      } catch {}

      // 2. Qiskit
      try {
        const res = await fetch(`${BACKEND_URL}/export/qiskit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(circuitIR),
        });
        if (res.ok) {
          const data = await res.json();
          setGeneratedCode((prev) => ({ ...prev, qiskit: data.code }));
          setLiveCode((prev) => (isCustomized.qiskit ? prev : { ...prev, qiskit: data.code }));
        }
      } catch {}

      // 3. Cirq
      try {
        const res = await fetch(`${BACKEND_URL}/export/cirq`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(circuitIR),
        });
        if (res.ok) {
          const data = await res.json();
          setGeneratedCode((prev) => ({ ...prev, cirq: data.code }));
          setLiveCode((prev) => (isCustomized.cirq ? prev : { ...prev, cirq: data.code }));
        }
      } catch {}

      // 4. PennyLane
      try {
        const res = await fetch(`${BACKEND_URL}/export/pennylane`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(circuitIR),
        });
        if (res.ok) {
          const data = await res.json();
          setGeneratedCode((prev) => ({ ...prev, pennylane: data.code }));
          setLiveCode((prev) => (isCustomized.pennylane ? prev : { ...prev, pennylane: data.code }));
        }
      } catch {}

      // 5. Circuit IR
      const irStr = JSON.stringify(circuitIR, null, 2);
      setGeneratedCode((prev) => ({ ...prev, ir: irStr }));
      setLiveCode((prev) => (isCustomized.ir ? prev : { ...prev, ir: irStr }));
    };

    fetchCodeSnippets();
  }, [circuitIR, isCustomized]);

  // Current active live code content
  const activeContent = liveCode[viewMode] || '';

  // Handle live typing in editor
  const handleCodeChange = (newCode: string) => {
    setLiveCode((prev) => ({ ...prev, [viewMode]: newCode }));
    setIsCustomized((prev) => ({ ...prev, [viewMode]: true }));
    setParseError(null);
  };

  // Reset current mode back to canvas-generated code
  const handleResetToCircuit = () => {
    const original = generatedCode[viewMode];
    setLiveCode((prev) => ({ ...prev, [viewMode]: original }));
    setIsCustomized((prev) => ({ ...prev, [viewMode]: false }));
    setParseError(null);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCopyOutput = async () => {
    if (!executionResult) return;
    const text = [executionResult.stdout, executionResult.stderr].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setOutputCopied(true);
      setTimeout(() => setOutputCopied(false), 2000);
    } catch {}
  };

  const handleApplyIR = () => {
    try {
      if (viewMode === 'ir') {
        const parsed = JSON.parse(activeContent);
        if (!parsed.num_qubits || !Array.isArray(parsed.gates)) {
          throw new Error("Missing 'num_qubits' or 'gates' in CircuitIR JSON.");
        }
        onApplyIR(parsed);
        setIsCustomized((prev) => ({ ...prev, ir: false }));
      }
      setParseError(null);
    } catch (err: any) {
      setParseError(err.message || 'JSON Parse Error in Circuit IR.');
    }
  };

  // Run code directly in Python quantum sandbox
  const handleRunCode = async () => {
    const codeToRun = activeContent;
    if (!codeToRun.trim()) return;

    setIsExecuting(true);
    setShowConsole(true);
    setExecutionResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/execute/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: codeToRun,
          language: 'python',
          timeout: 8.0,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Code execution request failed.');
      }

      const result: CodeExecutionResult = await res.json();
      setExecutionResult(result);
    } catch (err: any) {
      setExecutionResult({
        stdout: null,
        stderr: err.message || 'Execution error.',
        status: { id: 13, description: 'Execution Failed' },
        time: '0.000',
        source: 'client_error',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const isExecutable = ['qiskit', 'cirq', 'pennylane', 'custom'].includes(viewMode);

  // Line numbers count
  const lines = activeContent.split('\n');
  const lineCount = Math.max(lines.length, 1);

  // Synchronize line gutter scroll with textarea scroll
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lineGutterRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = () => {
    if (textareaRef.current && lineGutterRef.current) {
      lineGutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Cursor position tracking
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });

  const updateCursorPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const selStart = textarea.selectionStart ?? 0;
    const textBeforeCursor = textarea.value.substring(0, selStart);
    const linesArr = textBeforeCursor.split('\n');
    const lineNum = linesArr.length;
    const colNum = (linesArr[linesArr.length - 1] || '').length + 1;
    setCursorPos({ line: lineNum, col: colNum });
  };

  // Handle Tab key and Cmd+Enter shortcut
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+Enter or Ctrl+Enter: Run Code
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (isExecutable) {
        handleRunCode();
      }
      return;
    }

    // Tab key: insert 4 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = activeContent;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      handleCodeChange(newValue);

      // Reset cursor position after insert
      setTimeout(() => {
        if (textarea) {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
          updateCursorPosition();
        }
      }, 0);
      return;
    }

    // Update cursor pos on navigation keys
    setTimeout(updateCursorPosition, 0);
  };

  return (
    <div className="bg-[#fffdf9] border border-[#ded7cb] rounded-lg flex flex-col h-full shadow-sm overflow-hidden min-w-0 select-none">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-[#ded7cb] bg-[#f0ece4] gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <select
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value as CodeMode);
              setParseError(null);
            }}
            className="appearance-none bg-[#fffdf9] border border-[#ded7cb] text-[#211f1b] text-xs px-2.5 py-1 pr-6 rounded focus:outline-none focus:border-[#c96b2c] cursor-pointer font-medium"
          >
            <option value="qiskit">Qiskit</option>
            <option value="cirq">Google Cirq</option>
            <option value="pennylane">PennyLane</option>
            <option value="qasm">OpenQASM 3</option>
            <option value="ir">Circuit IR</option>
            <option value="custom">Custom Script</option>
          </select>
          <ChevronDown className="w-3 h-3 text-[#746e64] -ml-5 pointer-events-none" />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Run Python Code Button */}
          {isExecutable && (
            <button
              onClick={handleRunCode}
              disabled={isExecuting}
              className="px-2.5 py-1 rounded bg-[#c96b2c] hover:bg-[#b55e24] text-white flex items-center gap-1.5 text-[11px] font-sans font-semibold cursor-pointer disabled:opacity-50 shadow-sm transition-all active:scale-95"
              title="Run Python script in quantum sandbox (⌘+Enter / Ctrl+Enter)"
            >
              <Play className={`w-3 h-3 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
              <span>{isExecuting ? 'Running...' : 'Run'}</span>
            </button>
          )}

          {/* Apply IR Button */}
          {viewMode === 'ir' && (
            <button
              onClick={handleApplyIR}
              className="px-2.5 py-1 rounded bg-[#c96b2c] hover:bg-[#b55e24] text-white flex items-center gap-1.5 text-[11px] font-sans font-semibold cursor-pointer shadow-sm transition-all active:scale-95"
              title="Apply JSON IR back to Circuit Canvas"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Apply</span>
            </button>
          )}

          <button
            onClick={handleResetToCircuit}
            className="p-1.5 rounded bg-[#fffdf9] hover:bg-[#eee9df] border border-[#ded7cb] text-[#746e64] hover:text-[#211f1b] flex items-center gap-1 text-[11px] font-sans font-medium transition-colors cursor-pointer"
            title="Reset code back to canvas circuit"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded bg-[#fffdf9] hover:bg-[#eee9df] border border-[#ded7cb] text-[#746e64] hover:text-[#211f1b] flex items-center gap-1 text-[11px] font-sans font-medium transition-colors cursor-pointer"
            title="Copy code to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#137333]" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <div className="h-3.5 w-[1px] bg-[#ded7cb] mx-0.5" />

          {/* Maximize / Restore Toggle */}
          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className="p-1.5 rounded bg-[#fffdf9] hover:bg-[#eee9df] border border-[#ded7cb] text-[#746e64] hover:text-[#211f1b] transition-colors cursor-pointer hidden md:flex items-center justify-center"
              title={isMaximized ? 'Restore View (Split Layout)' : 'Maximize Code Editor'}
            >
              {isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5 text-[#c96b2c]" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Collapse Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded bg-[#fffdf9] hover:bg-[#eee9df] border border-[#ded7cb] text-[#746e64] hover:text-[#211f1b] transition-colors cursor-pointer hidden md:flex items-center justify-center"
              title="Collapse Editor"
            >
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {parseError && (
        <div className="p-2 bg-[#fce8e6] border-b border-[#ea4335] text-[#c5221f] text-xs font-mono">
          {parseError}
        </div>
      )}

      {/* Editor Body with Synchronized Line Numbers */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden relative bg-[#fffdf9]">
          {/* Synchronized Line Numbers Gutter */}
          <div
            ref={lineGutterRef}
            className="w-10 sm:w-11 bg-[#f7f4ee] border-r border-[#ded7cb] text-[#a8a196] select-none text-right pr-2.5 font-mono overflow-hidden shrink-0"
            style={{
              paddingTop: '12px',
              paddingBottom: '12px',
              fontSize: '12.5px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            }}
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div
                key={i + 1}
                style={{ height: '22px', lineHeight: '22px' }}
                className={cursorPos.line === i + 1 ? 'text-[#211f1b] font-bold' : ''}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Live Editable Textarea */}
          <textarea
            ref={textareaRef}
            value={activeContent}
            onChange={(e) => {
              handleCodeChange(e.target.value);
              updateCursorPosition();
            }}
            onScroll={handleScroll}
            onKeyUp={updateCursorPosition}
            onKeyDown={handleKeyDown}
            onClick={updateCursorPosition}
            onSelect={updateCursorPosition}
            onFocus={updateCursorPosition}
            onMouseUp={updateCursorPosition}
            className="flex-1 h-full w-full bg-transparent px-3 text-[#211f1b] focus:outline-none resize-none tab-[4] whitespace-pre overflow-auto select-text font-medium"
            style={{
              paddingTop: '12px',
              paddingBottom: '12px',
              fontSize: '12.5px',
              lineHeight: '22px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            }}
            placeholder="Type or paste your quantum code here anytime..."
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
          />
        </div>

        {/* Editor Bottom Status Bar */}
        <div className="px-3 py-1.5 bg-[#f0ece4] border-t border-[#ded7cb] flex items-center justify-between text-[11px] text-[#746e64] font-mono select-none shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[#211f1b] font-semibold">
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
            <span className="hidden sm:inline">Spaces: 4</span>
            <span className="hidden md:inline text-[10px] text-[#a8a196]">
              Press ⌘+Enter to Run
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-[#fffdf9] border border-[#ded7cb] text-[10px] font-medium text-[#211f1b]">
              {viewMode === 'qasm'
                ? 'OpenQASM 3.0'
                : viewMode === 'ir'
                ? 'JSON Circuit IR'
                : 'Python 3.11'}
            </span>
            <span className="text-[#137333] font-semibold text-[10px]">● Live</span>
          </div>
        </div>
      </div>

      {/* Terminal Output Console Drawer */}
      {showConsole && (
        <div className="border-t border-[#ded7cb] bg-[#1e1d1b] text-[#f7f4ee] flex flex-col max-h-[220px]">
          {/* Console Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#171614] border-b border-[#2e2c29] text-[11px]">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#c96b2c]" />
              <span className="font-semibold text-white font-sans">Terminal Output</span>

              {executionResult && (() => {
                const statusObj = typeof executionResult.status === 'object' && executionResult.status !== null ? executionResult.status : null;
                const isSuccess = statusObj ? statusObj.id === 3 : (executionResult.status === 'Completed' || executionResult.status === 'Success');
                const statusDesc = statusObj ? statusObj.description : (typeof executionResult.status === 'string' ? executionResult.status : 'Executed');

                return (
                  <div className="flex items-center gap-1.5 ml-2">
                    <span
                      className={`flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium ${
                        isSuccess
                          ? 'bg-[#1e3a2b] text-[#5cdb95] border border-[#2d5740]'
                          : 'bg-[#3d1e1e] text-[#f87171] border border-[#5c2d2d]'
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      ) : (
                        <XCircle className="w-2.5 h-2.5" />
                      )}
                      <span>{statusDesc}</span>
                    </span>

                    {executionResult.time && (
                      <span className="flex items-center gap-1 text-[10px] text-[#a8a196]">
                        <Clock className="w-2.5 h-2.5" />
                        {executionResult.time}s
                      </span>
                    )}

                    <span className="px-1.5 py-0.2 rounded bg-[#2e2c29] text-[#ded7cb] text-[9px]">
                      Python Quantum Engine
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyOutput}
                className="text-[#a8a196] hover:text-white p-1 rounded hover:bg-[#2e2c29] cursor-pointer"
                title="Copy output"
              >
                {outputCopied ? <Check className="w-3 h-3 text-[#5cdb95]" /> : <Copy className="w-3 h-3" />}
              </button>
              <button
                onClick={() => setShowConsole(false)}
                className="text-[#a8a196] hover:text-white p-1 rounded hover:bg-[#2e2c29] cursor-pointer"
                title="Close console"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Console Content */}
          <div className="p-3 overflow-auto flex-1 font-mono text-[11px] leading-relaxed select-text space-y-2">
            {isExecuting ? (
              <div className="flex items-center gap-2 text-[#a8a196]">
                <Cpu className="w-3.5 h-3.5 animate-spin text-[#c96b2c]" />
                <span>Executing code in Python quantum sandbox...</span>
              </div>
            ) : executionResult ? (
              <>
                {executionResult.stdout && (
                  <div className="text-[#a7f3d0] whitespace-pre-wrap">
                    {executionResult.stdout}
                  </div>
                )}
                {executionResult.stderr && (
                  <div className="text-[#fca5a5] whitespace-pre-wrap font-medium">
                    {executionResult.stderr}
                  </div>
                )}
                {!executionResult.stdout && !executionResult.stderr && (
                  <div className="text-[#746e64] italic">Program produced no standard output.</div>
                )}
              </>
            ) : (
              <div className="text-[#746e64] italic">Click "Run Code" to execute your quantum script.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
