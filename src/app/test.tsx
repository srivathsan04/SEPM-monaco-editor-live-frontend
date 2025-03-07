"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import styles from "./page.module.css";
import {
  FaDesktop,
  FaTabletAlt,
  FaMobileAlt,
  FaCode,
  FaPlay,
  FaMagic,
  FaUndo,
  FaRedo,
  FaCog,
} from "react-icons/fa";

export default function Home() {
  // Refs
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const iframeRef = useRef(null);
  const resizeDividerRef = useRef(null);

  // Editor state
  const [activeLanguage, setActiveLanguage] = useState("html");
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [viewMode, setViewMode] = useState("split");
  const [editorWidth, setEditorWidth] = useState("50%");
  const [previewDevice, setPreviewDevice] = useState("desktop");

  // Console output
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [showConsole, setShowConsole] = useState(false);

  // Code content state
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

  // Add React code state
  const [reactCode, setReactCode] =
    useState(`import React, { useState } from 'react';
import ReactDOM from 'react-dom';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{
      padding: '20px',
      margin: '20px 0',
      borderRadius: '8px',
      backgroundColor: '#f0f8ff',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{color: '#0066cc'}}>React Component</h1>
      <p>This is a live React component running in the preview!</p>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        margin: '20px 0'
      }}>
        <button 
          onClick={() => setCount(count - 1)}
          style={{
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          Decrease
        </button>
        
        <span style={{
          fontSize: '24px',
          fontWeight: 'bold',
          padding: '0 15px'
        }}>
          {count}
        </span>
        
        <button 
          onClick={() => setCount(count + 1)}
          style={{
            backgroundColor: '#4ecdc4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          Increase
        </button>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`);

  // Add a new state for React-only view
  const [showReactOnly, setShowReactOnly] = useState(false);

  // Handle editor mounting
  const handleEditorDidMount = (editor, monaco) => {
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
      case "react":
        return reactCode;
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
      case "react":
        setReactCode(value);
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

    // Combine HTML, CSS, JS, and React into a full document
    const combinedCode = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <style>${cssCode}</style>
        <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
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
        <style>
          /* Added styles to help with React component display */
          #root {
            padding: 15px;
            margin-top: 30px;
            border-top: 3px solid #3498db;
            position: relative;
          }
          
          #root::before {
            content: "React Component";
            position: absolute;
            top: -25px;
            left: 0;
            background: #3498db;
            color: white;
            padding: 2px 10px;
            font-size: 14px;
            border-radius: 4px 4px 0 0;
          }
          
          /* Add clear separation between HTML and React content */
          .html-content-end {
            margin-bottom: 40px;
            border-bottom: 1px dashed #ccc;
            padding-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="html-content">
          ${htmlCode.replace(
            /<(!DOCTYPE|html|head|body).*?>|<\/(html|head|body)>/gi,
            ""
          )}
        </div>
        <div class="html-content-end"></div>
        
        <!-- React root container -->
        <div id="root"></div>
        
        <!-- JavaScript code -->
        <script type="text/javascript">${jsCode}</script>
        
        <!-- React code with error handling -->
        <script type="text/babel">
          try {
            ${reactCode}
            console.log("✅ React component rendered successfully");
          } catch (error) {
            console.error("❌ React error:", error.message);
            document.getElementById('root').innerHTML = '<div style="color: red; padding: 20px; border: 1px solid red; background: #ffeeee;">React Error: ' + error.message + '</div>';
          }
        </script>
      </body>
      </html>
    `;

    iframeRef.current.srcdoc = combinedCode;
  }, [htmlCode, cssCode, jsCode, reactCode]);

  // Add this function to generate React-only preview
  const showReactPreview = useCallback(() => {
    if (!iframeRef.current) return;

    const reactOnlyCode = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>React Preview</title>
        <style>${cssCode}</style>
        <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script>
          // Console log capture code here
        </script>
      </head>
      <body>
        <div id="root" style="padding: 20px;"></div>
        <script type="text/babel">
          try {
            ${reactCode}
            console.log("✅ React-only view rendered");
          } catch (error) {
            console.error("❌ React error:", error.message);
          }
        </script>
      </body>
      </html>
    `;

    iframeRef.current.srcdoc = reactOnlyCode;
  }, [reactCode, cssCode]);

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
    const container = iframe.parentElement;

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
      if (activeLanguage === "react") {
        setReactCode(
          `// AI generated React code based on: ${aiPrompt}\n` + reactCode
        );
      } else if (activeLanguage === "html") {
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

  // Drag handler for resizing panels
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
          <h1 className={styles.title}>Code Studio</h1>
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

      {/* Toolbar */}
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
          <button
            className={`${styles.tabButton} ${
              activeLanguage === "react" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveLanguage("react")}
          >
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

            {/* Add React-only view button when React tab is active */}
            {activeLanguage === "react" && (
              <button
                className={`${styles.viewButton} ${
                  showReactOnly ? styles.active : ""
                }`}
                onClick={() => {
                  setShowReactOnly(!showReactOnly);
                  if (!showReactOnly) {
                    showReactPreview();
                  } else {
                    updatePreview();
                  }
                }}
                title="React Only Preview"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="currentColor"
                >
                  <path d="M12 9.861a2.139 2.139 0 100 4.278 2.139 2.139 0 100-4.278zm-5.992 6.394l-.472-.12C2.018 15.246 0 13.737 0 11.996s2.018-3.25 5.536-4.139l.472-.119.133.468a23.53 23.53 0 001.363 3.578l.101.213-.101.213a23.307 23.307 0 00-1.363 3.578l-.133.467zM5.317 8.95c-2.674.751-4.315 1.9-4.315 3.046 0 1.145 1.641 2.294 4.315 3.046.32-1.02.772-2.082 1.35-3.046a23.32 23.32 0 01-1.35-3.046zm12.675 6.484l-.482.12-.133-.468a23.768 23.768 0 00-1.364-3.577l-.101-.213.101-.213a23.77 23.77 0 001.364-3.578l.133-.468.482.12c3.518.889 5.536 2.398 5.536 4.14s-2.018 3.25-5.536 4.139zm-.448-8.083c-.32 1.02-.772 2.082-1.35 3.046a23.542 23.542 0 001.35 3.046c2.675-.752 4.315-1.901 4.315-3.046 0-1.146-1.641-2.294-4.315-3.046z" />
                  <path d="M12 18c-3.3 0-6.495-.505-8.934-1.43-1.62-.615-2.847-1.399-3.643-2.326A3.019 3.019 0 010 11.996v-8h1v8c0 .725.24 1.271.672 1.837.63.82 1.643 1.504 3.112 2.056 2.157.844 5.03 1.319 8.075 1.319 5.65 0 9.857-1.685 10.978-3.827a2.99 2.99 0 00.163-.556c.049-.22.078-.43.086-.604C24.035 8.15 23.999 4 23.999 4V3h1v1s.123 6.297-.086 7.22c-.061.274-.16.537-.284.774-.274.524-.63.972-1.079 1.362-1.333 1.157-3.943 2.248-7.501 2.744-.325.045-.656.082-.989.112-.263.024-.534.044-.806.058-.271.014-.534.024-.754.03-.221.006-.504.006-.504.006v1.666z" />
                </svg>
              </button>
            )}
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

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        <div className={styles.editorContainer} style={{ width: editorWidth }}>
          <Editor
            height="100%"
            language={
              activeLanguage === "react"
                ? "javascript"
                : activeLanguage === "js"
                ? "javascript"
                : activeLanguage
            }
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

          {/* Console Panel */}
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
                    No console output yet
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

      {/* Add the AI Prompt Modal */}
      {showPromptModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Generate Code with AI</h2>
            <p>Describe what you want to create:</p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="E.g., Create a responsive navbar with a logo and dropdown menu..."
              rows={5}
              className={styles.promptTextarea}
            />
            <div className={styles.modalButtons}>
              <button onClick={() => setShowPromptModal(false)}>Cancel</button>
              <button
                onClick={generateCodeWithAI}
                disabled={!aiPrompt.trim()}
                className={styles.generateButton}
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
