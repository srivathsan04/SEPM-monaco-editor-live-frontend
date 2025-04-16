"use client";
import React, { useState } from "react";

interface CodeGenResponse {
  code: string;
  error?: string;
}

export default function CodeGenerator() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [response, setResponse] = useState<CodeGenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMethod, setInputMethod] = useState<"image" | "prompt">("prompt");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let res;
      if (inputMethod === "image") {
        if (!selectedFile) {
          throw new Error("Please select an image file.");
        }
        const formData = new FormData();
        formData.append("file", selectedFile);
        res = await fetch("/api/imageToCode", {
          method: "POST",
          body: formData,
        });
      } else {
        if (!prompt.trim()) {
          throw new Error("Please enter a prompt.");
        }
        res = await fetch("/api/promptToCode", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        });
      }

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ code: "", error: error instanceof Error ? error.message : "An error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  async function copyResponse() {
    if (!response?.code) return;
    try {
      await navigator.clipboard.writeText(response.code);
      alert("Code copied to clipboard!");
    } catch (err) {
      alert("Failed to copy code.");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">
          Generate Website Code
        </h1>
        
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setInputMethod("prompt")}
            className={`px-4 py-2 rounded ${
              inputMethod === "prompt"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Use Prompt
          </button>
          <button
            onClick={() => setInputMethod("image")}
            className={`px-4 py-2 rounded ${
              inputMethod === "image"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Use Image
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          {inputMethod === "prompt" ? (
            <div className="flex flex-col space-y-2">
              <label htmlFor="prompt" className="text-sm font-medium">
                Enter your website description:
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="border border-gray-300 rounded p-2 min-h-[100px]"
                placeholder="Describe the website you want to generate..."
              />
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <label htmlFor="image-upload" className="text-sm font-medium">
                Upload a reference image:
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="border border-gray-300 rounded p-2"
              />
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className={`${
              isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            } text-white px-4 py-2 rounded flex items-center justify-center`}
          >
            {isLoading ? "Generating..." : "Generate Code"}
          </button>
        </form>

        {response && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <strong>Generated Code:</strong>
              <button
                onClick={copyResponse}
                className="bg-gray-200 text-sm px-2 py-1 rounded hover:bg-gray-300"
              >
                Copy
              </button>
            </div>
            {response.error ? (
              <div className="text-red-500">{response.error}</div>
            ) : (
              <pre className="bg-gray-100 p-4 rounded max-h-[80vh] overflow-auto text-sm leading-relaxed whitespace-pre-wrap break-words">
                {response.code}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
