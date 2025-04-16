"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Editor, { Monaco, OnMount } from "@monaco-editor/react";
import styles from "./page.module.css";
import {
  FaDesktop,
  FaTabletAlt,
  FaMobileAlt,
  FaCode,
  FaPlay,
  FaMagic,
  FaImage,
  FaTimes,
} from "react-icons/fa";
import type * as MonacoEditor from "monaco-editor";

export default function Home() {
  // Refs with proper types
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(
    null
  );
  const monacoRef = useRef<Monaco | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const resizeDividerRef = useRef<HTMLDivElement | null>(null);

  // Editor state
  const [editorTheme] = useState("vs-dark");
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [viewMode, setViewMode] = useState("split");
  const [editorWidth, setEditorWidth] = useState("50%");
  const [previewDevice, setPreviewDevice] = useState("desktop");

  // Console output
  const [consoleLogs, setConsoleLogs] = useState<Array<{type: string; content: string; timestamp: string}>>([]);
  const [showConsole, setShowConsole] = useState(false);

  // React code state
  const [reactCode, setReactCode] = useState(`// React is available as a global variable
// No imports or exports needed

function App() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    console.log('Button clicked! Count:', count + 1);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4 text-gray-800 border-b-2 border-blue-500 pb-2">
        Interactive React Preview
      </h1>
      <p className="mb-6">
        Edit the React code to build your website with Tailwind CSS.
      </p>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li>Split view with resizable panels</li>
          <li>Multiple device previews</li>
          <li>Console output</li>
          <li>Live updates as you type</li>
        </ul>
        <p className="mb-4">
          Button clicked: <span className="font-bold">{count}</span> times
        </p>
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
          onClick={handleClick}
        >
          Click me
        </button>
      </div>
    </div>
  );
}`);

  // Code generation state
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [generationMethod, setGenerationMethod] = useState<"prompt" | "image">("prompt");
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Handle code changes with proper debounce
  const handleCodeChange = (value: string | undefined) => {
    if (value === undefined) return;
    
    // Update the editor content
    setReactCode(value);
    
    // Don't use timeout refs or complex debounce for now
    // Just update immediately to solve the delay issue
    if (isAutoRefresh) {
      // Call update directly, simplifying the flow
      setTimeout(() => {
        if (iframeRef.current) {
          renderPreview(value);
        }
      }, 0);
    }
  };
  
  // Separate function to render the preview that doesn't rely on reactCode state
  const renderPreview = (code: string) => {
    if (!iframeRef.current) return;
    
    setPreviewError(null);
    
    // Process code
    let processedCode = code;
    
    // Remove React imports
    processedCode = processedCode.replace(/import\s+React(\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"];?/g, '');
    processedCode = processedCode.replace(/import\s+\{\s*([^}]*)\s*\}\s+from\s+['"]react['"];?/g, '');
    
    // Remove export statements
    processedCode = processedCode.replace(/export\s+default\s+function\s+App/, 'function App');
    processedCode = processedCode.replace(/export\s+default\s+class\s+App/, 'class App');
    processedCode = processedCode.replace(/export\s+default\s+App/, '');
    
    // Create the preview HTML
    const previewHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>React Preview</title>
        <!-- Tailwind CSS -->
        <script src="https://cdn.tailwindcss.com"></script>
        <!-- React, ReactDOM, and Babel -->
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <style>
          #root {
            padding: 0;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .preview-error {
            background-color: #fee2e2;
            border: 1px solid #f87171;
            color: #b91c1c;
            padding: 1rem;
            margin: 1rem;
            border-radius: 0.375rem;
            font-family: monospace;
            white-space: pre-wrap;
          }
        </style>
        <script>
          // Console log capture
          const originalConsole = console;
          console = {
            log: function() {
              originalConsole.log.apply(originalConsole, arguments);
              window.parent.postMessage({
                type: 'console',
                method: 'log',
                args: Array.from(arguments).map(arg => String(arg))
              }, '*');
            },
            error: function() {
              originalConsole.error.apply(originalConsole, arguments);
              window.parent.postMessage({
                type: 'console',
                method: 'error',
                args: Array.from(arguments).map(arg => String(arg))
              }, '*');
            },
            warn: function() {
              originalConsole.warn.apply(originalConsole, arguments);
              window.parent.postMessage({
                type: 'console',
                method: 'warn',
                args: Array.from(arguments).map(arg => String(arg))
              }, '*');
            }
          };

          // Error handling
          window.addEventListener('error', function(e) {
            window.parent.postMessage({
              type: 'error',
              message: e.message,
              source: e.filename,
              lineno: e.lineno,
              colno: e.colno
            }, '*');
            return false;
          });
          
          // Make React hooks available globally
          const { useState, useEffect, useRef, useCallback, useMemo, useContext } = React;
        </script>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">
          try {
            ${processedCode}
            
            // Render the App component
            ReactDOM.createRoot(document.getElementById('root')).render(<App />);
          } catch (error) {
            console.error(error);
            document.getElementById('root').innerHTML = '<div class="preview-error"><strong>Error:</strong> ' + error.message + '</div>';
          }
        </script>
      </body>
      </html>
    `;
    
    // Update the iframe directly
    iframeRef.current.srcdoc = previewHTML;
  };

  // Manually update preview (for Run button)
  const updatePreview = useCallback(() => {
    if (iframeRef.current) {
      renderPreview(reactCode);
    }
  }, [reactCode]);

  // Handle editor mounting
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Set up React language support
    if (monaco) {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: monaco.languages.typescript.JsxEmit.React,
        jsxFactory: 'React.createElement',
        reactNamespace: 'React',
        allowNonTsExtensions: true,
        allowJs: true,
        target: monaco.languages.typescript.ScriptTarget.Latest,
      });
    }

    // Initial preview
    updatePreview();
  };

  // Initialize console message listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "console") {
        const { method, args } = event.data;
        setConsoleLogs((prev) => [
          ...prev,
          {
            type: method,
            content: args.join(" "),
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } else if (event.data?.type === "error") {
        setPreviewError(`${event.data.message} (Line: ${event.data.lineno}, Col: ${event.data.colno})`);
        setConsoleLogs((prev) => [
          ...prev,
          {
            type: "error",
            content: `${event.data.message} (Line: ${event.data.lineno}, Col: ${event.data.colno})`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Update preview when view mode changes
  useEffect(() => {
    if (viewMode === "editor") {
      setEditorWidth("100%");
    } else if (viewMode === "preview") {
      setEditorWidth("0%");
    } else {
      setEditorWidth("50%");
    }
  }, [viewMode]);

  // Initial preview size setup
  useEffect(() => {
    updatePreviewSize(previewDevice);
  }, [previewDevice]);

  // Update preview dimensions based on device selection
  const updatePreviewSize = (device: string) => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;

    switch (device) {
      case "mobile":
        iframe.style.width = "375px";
        iframe.style.height = "667px";
        break;
      case "tablet":
        iframe.style.width = "768px";
        iframe.style.height = "1024px";
        break;
      case "desktop":
      default:
        iframe.style.width = "100%";
        iframe.style.height = "100%";
    }

    // Center the iframe in its container
    if (device !== "desktop") {
      iframe.style.margin = "0 auto";
    }
  };

  // Format the code using prettier
  const formatCode = () => {
    // In a real implementation, you would integrate with prettier
    // This is a simplified version
    alert("Code formatting would happen here with Prettier integration");
  };

  // Handle file uploads with proper UI guidance
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set the file for upload
    setUploadedImage(file);
    
    // Display the prompt to generate code from the image
    setGenerationMethod("image");
    setShowPromptModal(true);
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
  };

  // Update the generateCodeWithAI function
  const generateCodeWithAI = async () => {
    if (!generationPrompt && !uploadedImage) {
      alert("Please enter a prompt or upload an image first.");
      return;
    }

    setIsGeneratingCode(true);
    try {
      let response;
      if (generationMethod === "image" && uploadedImage) {
        const formData = new FormData();
        formData.append("file", uploadedImage);
        response = await fetch("/api/imageToCode", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/promptToCode", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: generationPrompt }),
        });
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Update the React code with the generated code
      setReactCode(data.code);
      
      // Force an immediate preview update
      setTimeout(() => {
        if (iframeRef.current) {
          renderPreview(data.code);
        }
      }, 0);
    } catch (error) {
      console.error("Error generating code:", error);
      alert("Failed to generate code. Please try again.");
    } finally {
      setIsGeneratingCode(false);
      setShowPromptModal(false);
      // Clear the input after generation
      setGenerationPrompt("");
      clearUploadedImage();
    }
  };

  useEffect(() => {
    const handleMouseDown = () => {
      setIsResizing(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const container = document.querySelector(
        `.${styles.mainContent}`
      );
      
      if (!container) return;
      
      const containerWidth = container.clientWidth;
      const newWidth = (e.clientX / containerWidth) * 100;

      // Limit minimum and maximum width
      if (newWidth >= 20 && newWidth <= 80) {
        setEditorWidth(`${newWidth}%`);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    const divider = resizeDividerRef.current;
    if (divider) {
      divider.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      if (divider) {
        divider.removeEventListener("mousedown", handleMouseDown);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <h1 className={styles.title}>AI Code Sandbox</h1>
        </div>

        <div className={styles.actionButtons}>
          <button
            className={styles.formatButton}
            onClick={formatCode}
            title="Format Code"
          >
            <FaCode /> Format
          </button>

          <button
            className={styles.promptButton}
            onClick={() => setShowPromptModal(true)}
          >
            <FaMagic /> Generate with AI
          </button>
        </div>
      </header>

      {/* Simplified toolbar without language tabs */}
      <div className={styles.toolbar}>
        <div className={styles.languageTabs}>
          <button className={`${styles.tabButton} ${styles.activeTab}`}>
            React
          </button>
        </div>

        <div className={styles.controlPanel}>
          <div className={styles.viewControls}>
            <button
              className={`${styles.viewButton} ${
                viewMode === "editor" ? styles.active : ""
              }`}
              onClick={() => setViewMode("editor")}
              title="Editor Only"
            >
              <FaCode />
            </button>
            <button
              className={`${styles.viewButton} ${
                viewMode === "split" ? styles.active : ""
              }`}
              onClick={() => setViewMode("split")}
              title="Split View"
            >
              <span className={styles.splitIcon}></span>
            </button>
            <button
              className={`${styles.viewButton} ${
                viewMode === "preview" ? styles.active : ""
              }`}
              onClick={() => setViewMode("preview")}
              title="Preview Only"
            >
              <FaPlay />
            </button>
          </div>

          <div className={styles.deviceControls}>
            <button
              className={`${styles.deviceButton} ${
                previewDevice === "mobile" ? styles.active : ""
              }`}
              onClick={() => setPreviewDevice("mobile")}
              title="Mobile View"
            >
              <FaMobileAlt />
            </button>
            <button
              className={`${styles.deviceButton} ${
                previewDevice === "tablet" ? styles.active : ""
              }`}
              onClick={() => setPreviewDevice("tablet")}
              title="Tablet View"
            >
              <FaTabletAlt />
            </button>
            <button
              className={`${styles.deviceButton} ${
                previewDevice === "desktop" ? styles.active : ""
              }`}
              onClick={() => setPreviewDevice("desktop")}
              title="Desktop View"
            >
              <FaDesktop />
            </button>
          </div>

          <div className={styles.refreshControls}>
            <label className={styles.autoRefreshLabel}>
              <input
                type="checkbox"
                checked={isAutoRefresh}
                onChange={() => setIsAutoRefresh(!isAutoRefresh)}
              />
              Auto-refresh
            </label>

            <button
              className={styles.refreshButton}
              onClick={updatePreview}
              disabled={isAutoRefresh}
            >
              <FaPlay /> Run
            </button>
          </div>

          <button
            className={`${styles.consoleButton} ${
              showConsole ? styles.active : ""
            }`}
            onClick={() => setShowConsole(!showConsole)}
          >
            Console{" "}
            {consoleLogs.length > 0 && (
              <span className={styles.consoleBadge}>{consoleLogs.length}</span>
            )}
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.editorContainer} style={{ width: editorWidth }}>
          <Editor
            height="100%"
            language="typescript"
            value={reactCode}
            theme={editorTheme}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 14,
              minimap: { enabled: true },
              wordWrap: "on",
              lineNumbers: "on",
              folding: true,
              autoIndent: "full",
              formatOnType: true,
              tabSize: 2,
            }}
          />
        </div>

        {/* Resizing handle */}
        {viewMode === "split" && (
          <div
            ref={resizeDividerRef}
            className={styles.resizeDivider}
            title="Drag to resize panels"
          />
        )}

        <div
          className={styles.previewContainer}
          style={{
            width:
              viewMode === "editor"
                ? "0%"
                : viewMode === "preview"
                ? "100%"
                : `calc(100% - ${editorWidth})`,
          }}
        >
          <div className={styles.previewWrapper}>
            {previewError && (
              <div className={styles.previewError}>
                <strong>Error:</strong> {previewError}
              </div>
            )}
            <div className={styles.reactIndicator}>React + Tailwind Preview</div>
            <iframe
              ref={iframeRef}
              className={styles.preview}
              title="React Preview"
              sandbox="allow-scripts allow-modals"
            ></iframe>
          </div>

          {showConsole && (
            <div className={styles.consolePanel}>
              <div className={styles.consolePanelHeader}>
                <h3>Console Output</h3>
                <button
                  onClick={() => setConsoleLogs([])}
                  className={styles.clearConsole}
                >
                  Clear
                </button>
              </div>
              <div className={styles.consolePanelContent}>
                {consoleLogs.length === 0 ? (
                  <div className={styles.emptyConsole}>
                    No console output yet.
                  </div>
                ) : (
                  consoleLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`${styles.logEntry} ${styles[log.type]}`}
                    >
                      <span className={styles.logTime}>{log.timestamp}</span>
                      <span className={styles.logContent}>{log.content}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI generation modal */}
      {showPromptModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Generate Code with AI</h2>
              <button 
                onClick={() => setShowPromptModal(false)} 
                className={styles.closeButton}
                title="Close"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className={styles.generationTabs}>
              <button
                className={`${styles.tabButton} ${generationMethod === "prompt" ? styles.active : ""}`}
                onClick={() => setGenerationMethod("prompt")}
              >
                <FaMagic /> Text Prompt
              </button>
              <button
                className={`${styles.tabButton} ${generationMethod === "image" ? styles.active : ""}`}
                onClick={() => setGenerationMethod("image")}
              >
                <FaImage /> Image
              </button>
            </div>
            
            <div className={styles.generationInputs}>
              {generationMethod === "prompt" && (
                <div className={styles.promptInputContainer}>
                  <label htmlFor="promptInput" className={styles.inputLabel}>
                    Enter a description of the UI you want to create:
                  </label>
                  <textarea
                    id="promptInput"
                    value={generationPrompt}
                    onChange={(e) => setGenerationPrompt(e.target.value)}
                    placeholder="Example: Create a responsive navbar with logo, navigation links, and a dark mode toggle"
                    className={styles.promptTextarea}
                    rows={5}
                  />
                </div>
              )}
              
              {generationMethod === "image" && (
                <div className={styles.imageUploadContainer}>
                  <label htmlFor="imageUpload" className={styles.uploadLabel}>
                    Upload an image of a UI design:
                  </label>
                  <div className={styles.uploadBox}>
                    {!uploadedImage ? (
                      <>
                        <FaImage className={styles.uploadIcon} />
                        <p className={styles.uploadText}>
                          Drag and drop an image or <span className={styles.browseText}>browse</span>
                        </p>
                        <p className={styles.uploadHint}>
                          Supports PNG, JPG, GIF (max 10MB)
                        </p>
                      </>
                    ) : (
                      <div className={styles.uploadedFileInfo}>
                        <FaImage className={styles.fileIcon} />
                        <span className={styles.fileName}>{uploadedImage.name}</span>
                        <button 
                          onClick={clearUploadedImage}
                          className={styles.removeFileButton}
                          title="Remove file"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className={styles.fileInput}
                      title="Upload an image to generate code"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <button
                className={styles.generateButton}
                onClick={generateCodeWithAI}
                disabled={isGeneratingCode || (generationMethod === "prompt" && !generationPrompt) || (generationMethod === "image" && !uploadedImage)}
              >
                {isGeneratingCode ? (
                  <>
                    <span className={styles.loadingSpinner}></span>
                    Generating...
                  </>
                ) : (
                  <>Generate Code</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}