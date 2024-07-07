import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import cors from "cors";
import fs from 'fs';

dotenv.config();
const app = express();
app.use(cors());
const port = process.env.PORT || 3001;

// Multer setup for multiple file uploads
const upload = multer({ dest: 'uploads/' }); // Specify the destination folder for uploaded files

// Initialize GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Converts local file information to a GoogleGenerativeAI.Part object
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

// Async function to generate response from prompt and multiple files
async function getResponse(prompt, files) {
  try {
    // The Gemini 1.5 models are versatile and work with both text-only and multimodal prompts
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare GoogleGenerativeAI.Part objects for each file
    const fileParts = files.map(file => fileToGenerativePart(file.path, file.mimetype));

    // Clean up uploaded files after conversion
    files.forEach(file => fs.unlinkSync(file.path));

    // Generate response using Gemini API
    const result = await model.generateContent([prompt, ...fileParts]);
    const response = await result.response.text();
    return response;
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
}

// POST endpoint to handle incoming requests with prompt and multiple files
app.post('/', upload.array('files', 5), async (req, res) => {
  const { prompt } = req.body; // Assuming the request body has a 'prompt' field
  console.log("Prompt:", prompt);

  try {
    const result = await getResponse(prompt, req.files); // Pass req.files for file contents if available
    res.json({ response: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Server startup
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
