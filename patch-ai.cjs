const fs = require('fs');

let content = fs.readFileSync('src/services/ai.ts', 'utf8');

const importStatement = `import { auth, db } from '../firebase';\nimport { doc, getDoc } from 'firebase/firestore';\nimport Anthropic from '@anthropic-ai/sdk';\n`;
if (!content.includes('Anthropic from')) {
    content = importStatement + content;
}

const newRetryFunc = `
export async function generateContentWithRetry(client: any, options: any, maxRetries = 3): Promise<any> {
  const promptText = typeof options.contents === 'string' ? options.contents : JSON.stringify(options.contents);
  const isPitchTask = promptText.toLowerCase().includes('pitch') || promptText.toLowerCase().includes('sales');

  let anthropicKey = null;
  try {
      if (auth.currentUser?.uid) {
         const snap = await getDoc(doc(db, 'settings', auth.currentUser.uid));
         if (snap.exists() && snap.data().anthropicApiKey) {
            anthropicKey = snap.data().anthropicApiKey;
         }
      }
  } catch (e) {
      console.warn("Failed to check Anthropic key", e);
  }

  if (isPitchTask && anthropicKey) {
      console.log("Using Claude API for Pitch Generation!");
      try {
          const anthropic = new Anthropic({ apiKey: anthropicKey, dangerouslyAllowBrowser: true });
          const isJson = options.config?.responseMimeType === 'application/json';
          const systemMsg = isJson ? "You are a top-tier AI. Output MUST be strictly valid JSON without markdown wrapping." : "You are an elite sales strategist.";
          
          let modifiedPrompt = promptText;
          if (isJson) {
              modifiedPrompt = promptText + "\\n\\nOutput ONLY valid JSON matching the exact schema requested. No markdown blocks.";
          }

          const msg = await anthropic.messages.create({
              model: "claude-3-7-sonnet-latest",
              max_tokens: 4000,
              system: systemMsg,
              messages: [{ role: "user", content: modifiedPrompt }]
          });
          const text = msg.content[0].type === 'text' ? msg.content[0].text : "";
          // Return an object that mimics Gemini's response formatting
          return { text: text };
      } catch (err) {
          console.warn("Claude API Error, falling back to Gemini:", err);
      }
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.models.generateContent(options);
    } catch (error: any) {
      if (error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("429") || error?.message?.includes("exceeded")) {
        if (attempt === maxRetries) throw error;
        console.warn(\`Rate limit hit. Retrying in \${attempt * 4} seconds... (Attempt \${attempt}/\${maxRetries})\`);
        await delay(attempt * 4000);
      } else {
        throw error; // Let other errors pass through
      }
    }
  }
}
`;

content = content.replace(/export async function generateContentWithRetry[\s\S]*?\}\n/, newRetryFunc);
fs.writeFileSync('src/services/ai.ts', content);
