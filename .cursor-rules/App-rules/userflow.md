---
# userflow.md

## Main User Flows

### 1. **Landing & Authentication**
- User visits the app
- Redirects to Supabase Auth (login or register)
- Upon successful login, user lands on the Dashboard with real BCRP data preloaded

---

### 2. **Dashboard Overview**
- Displays key daily macro indicators (e.g., `PD12301MD`, `PD04650MD`)
- User views summary cards and main chart
- No input required; data auto-loaded from BCRP API or Supabase cache

---

### 3. **Explore & Analyze**
- User selects a frequency tab: Daily, Monthly, Yearly
- Chooses from a real-time list of available BCRP series
- Clicks **Analyze Selected**
- System sends API call or fetches from Supabase cache
- After loading:
  - Gemini 2.5 Pro generates a summary
  - Line or bar chart rendered
  - Full data table appears
  - Export options activated: CSV (table), PDF (summary + chart)

---

### 4. **Chatbot Flow**
- User asks a natural language question (e.g., “How did inflation change in 2023?”)
- App performs semantic document search on embedded economic sources
- Gemini uses the retrieved context to generate a real answer
- Conversation continues with follow-ups (threaded)

---

### 5. **Playground Flow**
- User selects two indicators (e.g., `PN01271PM` vs `PM04908AA`)
- Chooses analysis type (Trend, Correlation, Summary)
- Clicks **Run Analysis**
- System pulls real BCRP data → sends structured prompt to Gemini
- Text summary and chart appear
- Option to export as PDF

---

## System Interactivity

- **Loading Spinners**: Show during BCRP API requests or LLM generation
- **Empty State Prompts**: Guide user to select indicators before analysis
- **Disabled Buttons**: Actions like Analyze or Export only enabled on valid input
- **Error Feedback**: Friendly messages for unknown codes, API issues, or unsupported frequencies

---

## AI Integration

- **Explore & Analyze**: Gemini produces live-text summaries using real data
- **Chatbot**: Gemini generates natural responses based on embedded documents and live facts
- **Playground**: Gemini explains relationships and patterns between selected indicators

---

## End-to-End Flow Summary

1. Authenticated Entry → Dashboard
2. Navigate to module (Explore, Chatbot, Playground)
3. Interact with real indicators or query
4. View AI output + charts
5. Export if needed
6. Repeat or switch module

⚠️ At no point does the app generate or simulate mock data. All flows depend on live or cached BCRP data only.
