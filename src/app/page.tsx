"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Editor, { Monaco, OnMount } from "@monaco-editor/react"; // Updated import with types
import styles from "./page.module.css";
import {
  FaDesktop,
  FaTabletAlt,
  FaMobileAlt,
  FaCode,
  FaPlay,
  FaMagic,
} from "react-icons/fa";
// Add types for Monaco editor
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
  const [activeLanguage, setActiveLanguage] = useState("html");
  const [editorTheme] = useState("vs-dark");
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [viewMode, setViewMode] = useState("split");
  const [editorWidth, setEditorWidth] = useState("50%");
  const [previewDevice, setPreviewDevice] = useState("desktop");

  // Console output
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [showConsole, setShowConsole] = useState(false);

  // Code content state - keeping HTML, CSS, JS only
  const [htmlCode, setHtmlCode] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
</head>
<body>
  <div class="container">
    <h1>Interactive Code Preview</h1>
    <p>Edit the HTML, CSS and JavaScript to build your website.</p>
    <div class="card">
      <h2>Features</h2>
      <ul>
        <li>Split view with resizable panels</li>
        <li>Multiple device previews</li>
        <li>Console output</li>
        <li>Live updates as you type</li>
      </ul>
      <button id="colorButton">Change Theme Color</button>
    </div>
  </div>
</body>
</html>`);

  const [cssCode, setCssCode] = useState(`body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 0;
  background-color: #f7f9fc;
  color: #333;
  transition: background-color 0.3s ease;
}

.container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
}

h1 {
  color: #2c3e50;
  margin-bottom: 20px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

.card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 15px;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #2980b9;
}

ul {
  padding-left: 20px;
}

li {
  margin-bottom: 8px;
}`);

  const [jsCode, setJsCode] = useState(`// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Document loaded and ready!');
  
  // Color button functionality
  const colorButton = document.getElementById('colorButton');
  const themeColors = [
    '#3498db', '#2ecc71', '#e74c3c', '#9b59b6', 
    '#f39c12', '#1abc9c', '#d35400', '#34495e'
  ];
  let colorIndex = 0;
  
  if (colorButton) {
    colorButton.addEventListener('click', () => {
      const newColor = themeColors[colorIndex];
      
      // Update button color
      colorButton.style.backgroundColor = newColor;
      
      // Update heading border color
      document.querySelector('h1').style.borderBottomColor = newColor;
      
      // Log the change
      console.log('🎨 Theme color changed to:', newColor);
      
      // Move to next color or loop back to start
      colorIndex = (colorIndex + 1) % themeColors.length;
    });
    
    console.log('👆 Click the button to change the theme color!');
  }
});`);

  // Add missing state for prompt modal
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  // Handle editor mounting
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Initially update preview
    updatePreview();
  };

  // Get current code based on active tab
  const getCurrentCode = () => {
    switch (activeLanguage) {
      case "html":
        return htmlCode;
      case "css":
        return cssCode;
      case "js":
        return jsCode;
      default:
        return htmlCode;
    }
  };

  // Handle code changes
  const handleCodeChange = (value) => {
    switch (activeLanguage) {
      case "html":
        setHtmlCode(value);
        break;
      case "css":
        setCssCode(value);
        break;
      case "js":
        setJsCode(value);
        break;
    }

    if (isAutoRefresh) {
      // Debounce to prevent too frequent updates
      clearTimeout(window.updateTimeout);
      window.updateTimeout = setTimeout(updatePreview, 500);
    }
  };

  // Combine code and update preview
  const updatePreview = useCallback(() => {
    if (!iframeRef.current) return;

    // Clear console on each refresh
    setConsoleLogs([]);

    // Combine HTML, CSS, and JS into a full document
    const combinedCode = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <style>${cssCode}</style>
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
        </script>
      </head>
      <body>
        ${htmlCode.replace(
          /<(!DOCTYPE|html|head|body).*?>|<\/(html|head|body)>/gi,
          ""
        )}
        
        <!-- JavaScript code -->
        <script type="text/javascript">${jsCode}</script>
      </body>
      </html>
    `;

    iframeRef.current.srcdoc = combinedCode;
  }, [htmlCode, cssCode, jsCode]);

  // Initialize console message listener
  useEffect(() => {
    const handleMessage = (event) => {
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
  const updatePreviewSize = (device) => {
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

  // Add a function to handle AI code generation
  const generateCodeWithAI = () => {
    // This would connect to an AI service in a real implementation
    console.log("Generating code with prompt:", aiPrompt);

    // Simulate AI response for demo purposes
    setTimeout(() => {
      if (activeLanguage === "html") {
        setHtmlCode(
          `<!-- AI generated HTML based on: ${aiPrompt} -->\n` + htmlCode
        );
      } else if (activeLanguage === "css") {
        setCssCode(`/* AI generated CSS based on: ${aiPrompt} */\n` + cssCode);
      } else if (activeLanguage === "js") {
        setJsCode(`// AI generated JS based on: ${aiPrompt}\n` + jsCode);
      }

      setShowPromptModal(false);
      setAiPrompt("");
    }, 1000);
  };

  useEffect(() => {
    const handleMouseDown = () => {
      setIsResizing(true);
    };

    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const containerWidth = document.querySelector(
        `.${styles.mainContent}`
      ).clientWidth;
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

      <div className={styles.toolbar}>
        <div className={styles.languageTabs}>
          <button
            className={`${styles.tabButton} ${
              activeLanguage === "html" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveLanguage("html")}
          >
            HTML
          </button>
          <button
            className={`${styles.tabButton} ${
              activeLanguage === "css" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveLanguage("css")}
          >
            CSS
          </button>
          <button
            className={`${styles.tabButton} ${
              activeLanguage === "js" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveLanguage("js")}
          >
            JavaScript
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
            language={activeLanguage === "js" ? "javascript" : activeLanguage}
            value={getCurrentCode()}
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
            <iframe
              ref={iframeRef}
              className={styles.preview}
              title="Code Preview"
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

      {showPromptModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-gray-800 w-full max-w-lg rounded-lg overflow-hidden shadow-2xl transform transition-all duration-300 scale-100 animate-fadeIn mx-4">
            {/* Modal header */}
            <div className="border-b border-gray-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaMagic className="text-blue-400" /> Generate Code with AI
              </h2>
            </div>

            {/* Modal body */}
            <div className="px-6 py-4">
              <p className="text-gray-300 mb-3">
                Describe what you want to create:
              </p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="E.g., Create a responsive navbar with a logo and dropdown menu..."
                rows={5}
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />

              {/* Language indicator */}
              <div className="mt-3 inline-flex items-center gap-2 text-sm bg-gray-700 px-3 py-1.5 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                <span className="text-gray-300">
                  Generating for:{" "}
                  <span className="text-blue-400 font-medium">
                    {activeLanguage.toUpperCase()}
                  </span>
                </span>
              </div>
            </div>

            {/* Modal footer */}
            <div className="bg-gray-900 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-2 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateCodeWithAI}
                disabled={!aiPrompt.trim()}
                className="px-4 py-2 rounded-md bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-colors"
              >
                <FaMagic /> Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
