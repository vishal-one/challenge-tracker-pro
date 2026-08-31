import React, { useState, useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Play, Save, Terminal, Loader2, Sparkles } from 'lucide-react';

const LANGUAGE_OPTIONS = [
  { value: 'typescript', label: 'TypeScript', pistonLang: 'typescript', pistonVersion: '5.0.3' },
  { value: 'python', label: 'Python', pistonLang: 'python', pistonVersion: '3.10.0' },
  { value: 'java', label: 'Java', pistonLang: 'java', pistonVersion: '15.0.2' },
  { value: 'cpp', label: 'C++', pistonLang: 'c++', pistonVersion: '10.2.0' },
] as const;

type LanguageValue = (typeof LANGUAGE_OPTIONS)[number]['value'];

interface CodeWorkspaceProps {
  assignmentId: string;
  initialCode?: string;
  onSave?: () => void;
  onInteract?: () => void;
  onSubmit?: (code: string, language: string) => Promise<void> | void;
}

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({
  assignmentId,
  initialCode,
  onSave,
  onInteract,
  onSubmit,
}) => {
  const editorRef = useRef<any>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState<LanguageValue>('typescript');
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  // Dispose Monaco editor instance on unmount to prevent memory leaks (PERF-02)
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  const getCode = (): string => {
    return editorRef.current?.getValue() ?? '';
  };

  // ── Run Code via JDoodle API ────────────────────────────────────────────
  const handleRunCode = async () => {
    const code = getCode();
    if (!code.trim()) {
      setOutput('⚠ Editor is empty — write some code first.');
      return;
    }

    setIsRunning(true);
    setOutput('Running...');
    setError(null);
    onInteract?.();

    // Smooth-scroll output panel into view
    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);

    try {
      // Map Monaco language strings to JDoodle language identifiers
      const languageMap: Record<string, string> = {
        typescript: 'nodejs',
        python: 'python3',
        java: 'java',
        cpp: 'cpp',
      };

      const jdoodleLang = languageMap[language] || 'python3';

      // Call Supabase Edge Function — credentials stay server-side (SEC-02 fix)
      const { data, error: fnError } = await supabase.functions.invoke('execute-code', {
        body: {
          script: code,
          language: jdoodleLang,
          versionIndex: '0',
        },
      });

      if (fnError) {
        setOutput(`❌ Execution failed: ${fnError.message}`);
        return;
      }

      if (data?.output) {
        setOutput(data.output);
      } else if (data?.error) {
        setOutput(`❌ Error:\n${data.error}`);
      } else {
        setOutput('Executed successfully with no output.');
      }
    } catch (err) {
      setOutput('❌ Network error. Could not reach execution server.');
    } finally {
      setIsRunning(false);
    }
  };

  // ── Save & Submit Code ─────────────────────────────────────────────────
  const handleSaveCode = async () => {
    const code = getCode();
    if (!code.trim()) {
      setError('Cannot submit empty code.');
      return;
    }

    if (onSubmit) {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);

      try {
        await onSubmit(code, language);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        onSave?.();
      } catch (err: any) {
        setError(err.message || 'Failed to save submission.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Editor Card */}
      <Card className="space-y-3 !p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-surface-high border-b border-neutral-border">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-violet" />
            <span className="font-mono text-xs font-bold uppercase text-neutral-txt tracking-wider">
              Code Editor
            </span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageValue)}
              className="font-mono text-[10px] text-neutral-muted px-2 py-0.5 bg-surface-lowest rounded border border-neutral-border outline-none focus:border-violet cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRunCode}
              isLoading={isRunning}
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              Run Code
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveCode}
              isLoading={isSaving}
              leftIcon={isSaving ? <Sparkles className="w-3.5 h-3.5 text-black animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            >
              {isSaving ? 'AI is reviewing your code...' : 'Save & Submit Code'}
            </Button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="border-b border-neutral-border">
          <Editor
            height="340px"
            language={language}
            theme="vs-dark"
            defaultValue={initialCode || '// Write your solution here\n'}
            onMount={handleEditorMount}
            onChange={() => onInteract?.()}
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              minimap: { enabled: false },
              padding: { top: 12, bottom: 12 },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
              automaticLayout: true,
            }}
          />
        </div>
      </Card>

      {/* Output / Errors */}
      <div ref={outputRef}>
        {(output || error) && (
          <Card className="!p-0 overflow-hidden border border-neutral-border">
            <div className="flex items-center justify-between px-4 py-2 bg-surface-high border-b border-neutral-border">
              <div className="flex items-center gap-2">
                {isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 text-violet animate-spin" />
                ) : (
                  <Terminal className="w-3.5 h-3.5 text-violet" />
                )}
                <span className="font-mono text-xs font-bold uppercase text-neutral-muted tracking-wider">
                  Output
                </span>
              </div>
              {isRunning && (
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-gold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                  Running...
                </span>
              )}
            </div>
            <pre className="p-4 font-mono text-xs text-neutral-txt bg-surface-lowest whitespace-pre-wrap min-h-[120px] max-h-[220px] overflow-y-auto">
              {error ? (
                <span className="text-red-400">❌ {error}</span>
              ) : (
                output
              )}
            </pre>
          </Card>
        )}
      </div>

      {/* Success indicator */}
      {saveSuccess && (
        <div className="text-xs font-mono text-violet bg-violet/10 px-3 py-2 rounded border border-violet/30 animate-pulse">
          ✓ Code submitted successfully — marked as complete.
        </div>
      )}
    </div>
  );
};
