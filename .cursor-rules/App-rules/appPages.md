---
# appPages.md

## 1. **Dashboard**
### Purpose
Overview of key macroeconomic indicators from live BCRP daily data

### Elements
- KPI Cards: Real-time values from series like `PD04650MD`, `PD12301MD`
- Main Line Chart: Time-based visualization of selected daily indicators
- Auto-loads data from BCRP API or Supabase cache

---

## 2. **Explore & Analyze**
### Purpose
Core tool to query macroeconomic indicators, visualize data, and generate AI summaries

### Elements
- **Left Panel**:
  - Category Filters: Daily, Monthly, Yearly
  - Indicator List: All available official codes
  - “Analyze Selected” button (active only with valid selection)
- **Right Panel**:
  - Gemini-generated AI Summary
  - Time-Series Chart (live data only)
  - Data Table (with CSV export)
  - PDF Download (real analysis only)

### BCRP Series Used
- **Daily**: e.g., `PD04650MD`, `PD04704XD`
- **Monthly**: e.g., `PN01496BM`, `PN01271PM`
- **Yearly**: e.g., `PM04908AA`, `PM05373BA`

---

## 3. **AI Chatbot**
### Purpose
Query BCRP macroeconomic trends using natural language with LLM + RAG

### Elements
- Chat history (threaded)
- Text input field
- Gemini 2.5 Pro responses augmented by real embedded BCRP context
- No simulation or mock answers

---

## 4. **Playground**
### Purpose
Custom LLM-powered analysis based on real indicator selections

### Elements
- **Left Panel**:
  - Indicator 1 and 2 selector (daily/monthly/yearly)
  - Analysis type selector: Trend, Correlation, Summary
  - Run Analysis button
- **Right Panel**:
  - AI-generated Result Summary
  - Chart (line, bar, area based on frequency)
  - PDF Export button

### Behavior
- Only allows execution with supported series codes
- Will error or warn if codes are unknown or mismatched in frequency

---

## 5. **Navigation Sidebar**
### Purpose
Main layout anchor and access point to all core pages

### Elements
- App title + icon
- Navigation links to: Dashboard, Explore, Chatbot, Playground
- Responsive collapse on mobile

---

## 6. **404 / Error Page**
### Purpose
Fallback UI for broken routes or API errors

### Elements
- Clear error message
- Link to return to Dashboard
- Logs client-side error for monitoring

---

## Navigation Flow Summary
- Sidebar → Dynamic Nxt.js routing (App Router)
- Section-level animation with Framer Motion
- All content sourced from validated BCRP API or Supabase cache
