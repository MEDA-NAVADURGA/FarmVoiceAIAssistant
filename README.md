Farm Pal AI 🚜🌾
A Vite + React + TypeScript web app that provides a farmer-focused chat assistant with voice input, text-to-speech, and Supabase-backed data. Includes serverless functions for ElevenLabs TTS and scribing audio.

Key Features ✨
Conversational UI tailored for farmers
Voice input and speech-to-text support
Text-to-speech via ElevenLabs
Persistent data and auth using Supabase
Modern UI built with TailwindCSS + shadcn components
Serverless functions for TTS and scribing

Tech Stack 🔧
Vite + React + TypeScript
Tailwind CSS, shadcn UI components
Supabase (client + serverless functions)
ElevenLabs TTS / voice integrations
Vitest for testing
ESLint for linting


Quick Start ⚡
Prerequisites:

Node.js 18+ (or compatible)
npm or pnpm
(Optional) Supabase CLI for local functions

npm install
npm run dev
# build
npm run build
# preview build
npm run preview
# tests
npm run test
# lint
npm run lint

Environment Variables 🔐
Create a .env or .env.local with these (example names used by the project):

Note: Never commit secrets to source control.

VITE_SUPABASE_URL — your Supabase project URL
VITE_SUPABASE_ANON_KEY — your Supabase anon/public key
ELEVENLABS_API_KEY — ElevenLabs API key
ELEVENLABS_VOICE_ID — default voice ID for TTS (if needed)
Also check any supabase/functions/* for function-specific secrets.

Supabase Functions 📡
Functions are in functions. Deploying (using the Supabase CLI):
