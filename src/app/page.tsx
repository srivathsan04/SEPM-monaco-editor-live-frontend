"use client";
import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import styles from "./page.module.css";
import Image from "next/image";

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
  // New state for prompt interface
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptType, setPromptType] = useState("text"); // text or image
  const [promptText, setPromptText] = useState("");
  const [promptImage, setPromptImage] = useState(null);
  const [promptImagePreview, setPromptImagePreview] = useState("");
  
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

  // File input handling
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.substring(0, 5) === "image") {
      setPromptImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPromptImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle prompt submission (static for now)
  const handlePromptSubmit = () => {
    // This will eventually connect to an LLM
    console.log("Prompt submitted:", promptType === "text" ? promptText : "Image uploaded");
    // Close the modal after submission
    setShowPromptModal(false);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Code Studio Preview</h1>
        
        {/* Add AI Prompt button */}
        <button 
          className={styles.promptButton}
          onClick={() => setShowPromptModal(true)}
        >
          Generate with AI 🪄
        </button>
        
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

      {/* Prompt Modal */}
      {showPromptModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button 
              className={styles.closeButton} 
              onClick={() => setShowPromptModal(false)}
            >
              ×
            </button>
            
            <h2>Generate Website with AI</h2>
            
            <div className={styles.promptTabs}>
              <button 
                className={`${styles.tabButton} ${promptType === 'text' ? styles.activeTab : ''}`} 
                onClick={() => setPromptType('text')}
              >
                Text Prompt
              </button>
              <button 
                className={`${styles.tabButton} ${promptType === 'image' ? styles.activeTab : ''}`} 
                onClick={() => setPromptType('image')}
              >
                Upload Image
              </button>
            </div>
            
            <div className={styles.promptInputArea}>
              {promptType === 'text' ? (
                <div className={styles.textPromptContainer}>
                  <textarea 
                    className={styles.promptTextarea}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Describe the website you want to create... For example: 'Create a modern portfolio website with a dark theme, featuring a hero section, about me, skills, and contact form.'"
                    rows={6}
                  />
                </div>
              ) : (
                <div className={styles.imageUploadContainer}>
                  <label className={styles.imageUploadLabel}>
                    {promptImagePreview ? (
                      <div className={styles.imagePreviewWrapper}>
                        <img 
                          src={promptImagePreview} 
                          alt="Website reference" 
                          className={styles.imagePreview} 
                        />
                      </div>
                    ) : (
                      <div className={styles.uploadPlaceholder}>
                        <span className={styles.uploadIcon}>📁</span>
                        <span>Click to upload an image of the website you want to recreate</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className={styles.imageInput}
                      onChange={handleImageUpload} 
                    />
                  </label>
                </div>
              )}
            </div>
            
            <div className={styles.promptActions}>
              <button 
                className={styles.cancelButton} 
                onClick={() => setShowPromptModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.generateButton} 
                onClick={handlePromptSubmit}
                disabled={promptType === 'text' ? !promptText.trim() : !promptImage}
              >
                Generate Website
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
