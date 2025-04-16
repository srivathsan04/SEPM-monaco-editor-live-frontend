"use client";
import React, { useState } from "react";

export default function UploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [response, setResponse] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/imageToCode", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(`Error: ${error}`);
    }
  };

  async function copyResponse() {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(response);
      alert("Response copied to clipboard!");
    } catch (err) {
      alert("Failed to copy response.");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">
          Upload an Image to Convert
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="border border-gray-300 rounded p-2"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Upload
          </button>
        </form>

        {response && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <strong>API Response:</strong>
              <button
                onClick={copyResponse}
                className="bg-gray-200 text-sm px-2 py-1 rounded hover:bg-gray-300"
              >
                Copy
              </button>
            </div>
            <pre
              className="
    bg-gray-100 
    p-4 
    rounded 
    max-h-[80vh] 
    overflow-auto 
    text-base 
    leading-relaxed 
    whitespace-pre-wrap 
    break-words
  "
            >
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
