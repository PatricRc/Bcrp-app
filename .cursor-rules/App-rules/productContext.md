---
# productContext.md

## Problem Statement
Accessing and interpreting macroeconomic data from Peru's central bank (BCRP) can be cumbersome for both technical and non-technical users. The raw data is available, but lacks a seamless interface for dynamic analysis, contextual interpretation, and natural language interaction. Existing solutions often depend on manual downloads, external tools like Excel, or static visualizations, and some rely on simulated or mock data, which hinders decision-making and trust.

## Proposed Solution
The BCRP Macroeconomic Analysis App solves these issues by:

- **Direct Integration with the BCRP API**: No mock data is used — all data is pulled directly from official endpoints or from a secure Supabase cache of previous API responses.
- **Daily, Monthly, and Yearly Indicator Support**: Includes official series like inflation, interest rates, exports, government spending, and GDP (PBI).
- **LLM-powered AI Features**: Uses Gemini 2.5 Pro for summarizing indicator trends, generating contextual insights, and responding to user queries.
- **Interactive Visual Interface**: A clean, modern UI allows users to select indicators, view AI summaries, explore time-series data, and export reports.

## User Experience Goals
- **Accuracy**: Trustworthy data from the official BCRP API, never simulated.
- **Clarity**: AI-generated insights, charts, and summaries for easy comprehension.
- **Speed**: All queries respond within seconds with fresh or cached real data.
- **Control**: Custom analysis tools in a playground environment for professional users.

## Practical Use Cases
- **Economic Analysts** generating quarterly reports on GDP or monetary policy trends.
- **Journalists** investigating CPI variation, reserves, or commodity price trends.
- **Students** learning about fiscal policy or analyzing time-series data in Spanish.
- **Policy Makers** reviewing real-time visual insights during planning or briefings.

