"use client";
import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import styles from "./page.module.css";

export default function Home() {
  const editorRef = useRef(null);
  const iframeRef = useRef(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [viewMode, setViewMode] = useState("split"); // split, editor, preview
  const [editorLayout, setEditorLayout] = useState({
    width: "50%",
    height: "100%",
  });
  const [previewLayout, setPreviewLayout] = useState({
    width: "50%",
    height: "100%",
  });
  const [editorValue, setEditorValue] = useState(
    [
      "<!DOCTYPE html>",
      "<html>",
      "<head>",
      "<style>",
      "body {",
      "  font-family: Arial, sans-serif;",
      "  margin: 0;",
      "  padding: 20px;",
      "  background-color: #f5f5f5;",
      "}",
      "",
      ".container {",
      "  background-color: white;",
      "  padding: 20px;",
      "  border-radius: 8px;",
      "  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);",
      "}",
      "",
      "h1 {",
      "  color: #333;",
      "}",
      "</style>",
      "</head>",
      "<body>",
      '  <div class="container">',
      "    <h1>Live Preview Demo</h1>",
      "    <p>Edit the code on the left to see changes here!</p>",
      "    <button onclick=\"document.body.style.backgroundColor = '#' + Math.floor(Math.random()*16777215).toString(16);\">",
      "      Change Background Color",
      "    </button>",
      "  </div>",
      "",
      "  <script>",
      "    console.log('Preview loaded successfully!');",
      "    // Add more JavaScript here",
      "  </script>",
      "</body>",
      "</html>",
    ].join("\n")
  );

  // Handle editor mounting
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    if (isAutoRefresh) {
      editor.onDidChangeModelContent(() => {
        updatePreview();
      });
    }
  };

  useEffect(() => {
    if (viewMode === "editor") {
      setEditorLayout({ width: "100%", height: "100%" });
      setPreviewLayout({ width: "0", height: "100%" });
    } else if (viewMode === "preview") {
      setEditorLayout({ width: "0", height: "100%" });
      setPreviewLayout({ width: "100%", height: "100%" });
    } else {
      setEditorLayout({ width: "50%", height: "100%" });
      setPreviewLayout({ width: "50%", height: "100%" });
    }
  }, [viewMode]);

  // Initial preview
  useEffect(() => {
    updatePreview();
  }, []);

  const updatePreview = () => {
    if (editorRef.current && iframeRef.current) {
      const htmlContent = editorRef.current.getValue();
      iframeRef.current.srcdoc = htmlContent;
    }
  };

  const handleThemeChange = (theme) => {
    setEditorTheme(theme);
  };

  const handleRefresh = () => {
    updatePreview();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Code Studio Preview</h1>
        <div className={styles.controls}>
          <div className={styles.viewButtons}>
            <button
              className={viewMode === "editor" ? styles.active : ""}
              onClick={() => setViewMode("editor")}
            >
              Editor Only
            </button>
            <button
              className={viewMode === "split" ? styles.active : ""}
              onClick={() => setViewMode("split")}
            >
              Split View
            </button>
            <button
              className={viewMode === "preview" ? styles.active : ""}
              onClick={() => setViewMode("preview")}
            >
              Preview Only
            </button>
          </div>

          <div className={styles.themeSelector}>
            <select
              value={editorTheme}
              onChange={(e) => handleThemeChange(e.target.value)}
            >
              <option value="vs">Light</option>
              <option value="vs-dark">Dark</option>
              <option value="hc-black">High Contrast</option>
            </select>
          </div>

          <div className={styles.refreshControls}>
            <label>
              <input
                type="checkbox"
                checked={isAutoRefresh}
                onChange={() => setIsAutoRefresh(!isAutoRefresh)}
              />
              Auto-refresh
            </label>
            <button className={styles.refreshButton} onClick={handleRefresh}>
              Refresh Preview
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <div className={styles.editorContainer} style={editorLayout}>
          <Editor
            height="100%"
            defaultLanguage="html"
            defaultValue={editorValue}
            theme={editorTheme}
            onMount={handleEditorDidMount}
            options={{
              automaticLayout: true,
              fontSize: 14,
              lineNumbers: "on",
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              roundedSelection: false,
              wordWrap: "on",
            }}
          />
        </div>
        <div className={styles.previewContainer} style={previewLayout}>
          <iframe
            ref={iframeRef}
            className={styles.preview}
            title="Code Preview"
            sandbox="allow-scripts"
          ></iframe>
        </div>
      </main>
    </div>
  );
}
