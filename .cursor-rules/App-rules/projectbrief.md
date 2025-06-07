---
# BCRP Macroeconomic Analysis App — Project Brief

## Project Title
**BCRP Macroeconomic Analysis Web App**

## Goal
Develop a high-performance, AI-enhanced SaaS web app that enables exploration, analysis, and reporting of Peruvian macroeconomic indicators. The app connects directly to BCRP’s public API and leverages LLM technologies to provide users with deep, real-time economic insights, eliminating any reliance on mock or fallback data.

## Key Features
- **Real-Time Data Fetching**: Direct integration with BCRP API using official endpoints and validated series codes.
- **Explore & Analyze Dashboard**: Interactive UI for selecting indicators and generating AI-powered summaries, visualizations, and reports.
- **AI Chatbot (Gemini)**: Conversational querying of macroeconomic trends using document-augmented responses powered by Gemini 2.5 Pro + OpenAI embeddings.
- **Playground Mode**: Configurable indicator analysis with LLM-driven outputs (trend, correlation, summaries).
- **Export Capabilities**: PDF and CSV exports of AI insights, data tables, and charts.
- **Caching Layer**: Supabase-based cache for previously fetched BCRP data to reduce API load without ever mocking values.

## Target Audience
- Peruvian economists, analysts, journalists, students, and public-sector researchers interested in national macroeconomic data.

## Measurable Success Metrics
- API latency under 2 seconds
- 100% of data pulled from live or Supabase-cached real responses
- > 90% user satisfaction on AI responses
- Onboard 1000+ users in the first quarter

## Purpose
To simplify access and understanding of official BCRP macroeconomic data through intuitive UI/UX and natural language-based analytical tools powered by state-of-the-art LLM technology, ensuring a high-trust environment based solely on real-world data.

## Expected Outcomes
- Deliver an MVP that allows users to visualize, analyze, and download real macroeconomic data
- Streamlined access to daily, monthly, and yearly indicators including inflation, interest rates, reserves, exports, and PBI
- Integrated AI assistant capable of generating and contextualizing economic insights using Gemini LLM and verified embeddings
