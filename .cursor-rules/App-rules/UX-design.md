---
# UX-Design.md

## Design Philosophy
- **Clarity over Complexity**: Clear visual hierarchy and labeling
- **Data-First**: Emphasize live, trustworthy indicators from BCRP
- **Assistive Intelligence**: Use AI as a support mechanism, not a replacement
- **Minimalist Layouts**: Reduce friction through familiar patterns and clean presentation

## User Personas
1. **Economist Analyst**: Requires advanced data exports, AI summaries, trend insights
2. **Journalist**: Seeks concise summaries and visualizations for quick reporting
3. **Student/Researcher**: Exploratory use cases with AI-assisted learning
4. **Government/Policy Advisor**: Needs macro-level data, PBI, and export tools

## Core UX Patterns
- **Sidebar Navigation**: Persistent layout for module switching
- **Tabs for Frequencies**: Daily, Monthly, Yearly toggles in Explore
- **Analysis Flow**:
  - Select category → select indicators → click "Analyze" → get real AI-enhanced insights
- **Loading/Feedback**:
  - Spinner for API calls and AI summary
  - Disabled buttons until valid input is ready

## Accessibility Considerations
- **Color contrast compliant** (AA level)
- **Keyboard accessible** UI components
- **Responsive breakpoints** for tablet and mobile
- **Semantic HTML** for screen readers

## Visual Language
- **Typography**: Inter font, clear hierarchy (`text-2xl`, `text-base`, `uppercase` for labels)
- **Cards & Containers**: Rounded (`rounded-2xl`), padded, shadowed
- **Icons**: Lucide, always paired with text

## UX Highlights
- **AI-Generated Text** presented in bordered cards with timestamp
- **PDF & CSV buttons** grouped top-right with tooltips
- **Empty states** gently prompt user action (e.g., “Select an indicator to begin”)
- **Error states** include retry actions and contextual help

## Gamification & Guidance (Future)
- **Usage tracking** to recommend commonly viewed indicators
- **Progress badges** for first analysis, first export, etc.

## UX KPIs
- < 3 clicks to begin an analysis
- > 90% task completion for indicator selection & analysis
- > 80% of users rate interface clarity as “easy” or “very easy”

