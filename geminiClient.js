// geminiClient.js  (CommonJS backend client)
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1) Check API key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in .env");
}

// 2) Check model name from .env
const modelName = process.env.GEMINI_MODEL;
if (!modelName) {
  throw new Error(
    "GEMINI_MODEL is not set in .env. " +
      "Set it to the exact model ID from AI Studio, e.g. 'gemini-3-pro-preview'."
  );
}

console.log("🔧 Using Gemini model:", modelName);

// 3) Init client + model
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: modelName });

module.exports = { model };
