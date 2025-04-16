import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(request: Request) {
  try {
    // 1. Parse incoming FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 2. Convert the image file to Base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";
    const base64Url = `data:${mimeType};base64,${base64Image}`;

    // 3. Make request to the Groq Vision Model
    //    Prompt: instruct the model to generate code from the uploaded image
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.2-90b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
                You are a code generator. You will receive an image and produce a single code snippet. 
                The response must be plain HTML, optionally with a <style> block for CSS and a <script> block for JS. 
                - No markdown. 
                - No JSON. 
                - No extra text or commentary. 
                - Output only the raw code, nothing else.

                Please create a minimal webpage layout based on the image content. 
                `,
              },
              {
                type: "image_url",
                image_url: { url: base64Url },
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Groq request failed");
    }

    // 4. Parse the model's response for the generated code
    const groqData = await response.json();
    const modelContent = groqData?.choices?.[0]?.message?.content ?? "";

    // Return the model's output (you can further parse if needed)
    return NextResponse.json({ success: true, code: modelContent });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to process image: ${error.message}` },
      { status: 500 }
    );
  }
}
