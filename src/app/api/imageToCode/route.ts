import { Groq } from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

// Initialize the Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const imageUrl = `data:image/${file.type};base64,${base64Image}`;

    // Using the Groq vision model
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content: "You are an expert React developer. Analyze the uploaded image and generate clean, functional React code that closely matches the design shown in the image. Use Tailwind CSS for styling."
        },
        {
          role: "user",
          content: "Generate React code based on this image. Use React hooks and Tailwind CSS for styling. Make the code clean, functional, and responsive."
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      temperature: 0.5,
      max_tokens: 4000
    });

    // Extract the generated code from the response
    const generatedText = completion.choices[0].message.content || "";
    
    // Try to extract code blocks from the response
    const codeMatch = generatedText.match(/```(?:jsx?|tsx?|react)?\s*([\s\S]*?)```/);
    const extractedCode = codeMatch ? codeMatch[1] : generatedText;

    // Remove any React imports if present
    let cleanedCode = extractedCode.replace(/import\s+React(\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"];?/g, '');
    cleanedCode = cleanedCode.replace(/import\s+\{\s*([^}]*)\s*\}\s+from\s+['"]react['"];?/g, '');
    
    // Remove export statements if present
    cleanedCode = cleanedCode.replace(/export\s+default\s+function\s+App/, 'function App');
    cleanedCode = cleanedCode.replace(/export\s+default\s+class\s+App/, 'class App');
    cleanedCode = cleanedCode.replace(/export\s+default\s+App/, '');

    return NextResponse.json({ code: cleanedCode });
  } catch (error) {
    console.error("Error generating code:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
