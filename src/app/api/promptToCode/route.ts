import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert React developer who converts text descriptions into clean, modern, and responsive website code using React and Tailwind CSS.
          Generate ONLY the React component code without any explanations or markdown formatting.
          The code should be a single React functional component named 'App' WITHOUT any export statements.
          DO NOT include any import statements or export statements - React and its hooks are already available globally.
          All React hooks (useState, useEffect, etc.) should be used directly without importing.
          Make the UI beautiful and professional.
          The code must be valid React JSX syntax with proper Tailwind CSS classes.
          
          Example format:
          \`\`\`
          function App() {
            const [state, setState] = useState(initialValue);
            
            function handleClick() {
              setState(newValue);
            }
            
            return (
              <div className="container mx-auto px-4 py-8">
                {/* Components based on the description */}
              </div>
            );
          }
          \`\`\``,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 4000,
    });

    let generatedCode = completion.choices[0]?.message?.content || "";
    
    // Strip any markdown code blocks if present
    generatedCode = generatedCode.replace(/```(jsx?|tsx?|react)?|```/g, '').trim();
    
    // Remove any React imports
    generatedCode = generatedCode.replace(/import\s+React(\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"];?/g, '');
    generatedCode = generatedCode.replace(/import\s+\{\s*([^}]*)\s*\}\s+from\s+['"]react['"];?/g, '');
    
    // Remove export statements
    generatedCode = generatedCode.replace(/export\s+default\s+function\s+App/, 'function App');
    generatedCode = generatedCode.replace(/export\s+default\s+class\s+App/, 'class App');
    generatedCode = generatedCode.replace(/export\s+default\s+App/, '');
    
    // Validate if the code contains a basic React structure
    if (!generatedCode.includes('function App(') && !generatedCode.includes('class App ')) {
      // Add basic structure if missing
      generatedCode = `function App() {\n  return (\n    <div>\n      ${generatedCode}\n    </div>\n  );\n}`;
    }

    return NextResponse.json({ code: generatedCode });
  } catch (error) {
    console.error("Error generating code:", error);
    return NextResponse.json(
      { error: "Failed to generate code from prompt" },
      { status: 500 }
    );
  }
} 