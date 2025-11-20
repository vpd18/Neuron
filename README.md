# Neuron — Modern Personal & Group Expense Tracker
Neuron is a clean, fast, and analytics-driven expense tracker built with Expo + React Native. It helps users manage personal and group spending through smart splits, visual insights, and simple settlements.

## Overview
Neuron enables daily expense tracking, group expense management, and financial summaries through charts. It supports equal/custom splits, settlements, category analytics, and a refined settings dashboard.

## Features

### Personal Expenses
- Add, edit, and delete personal expenses
- Category-based organization (Food, Travel, Bills, etc.)
- Monthly/weekly summaries
- Fast-entry interface

### Group Expenses
- Create and manage groups (Trips, Friends, Events)
- Split using equal or custom amounts (percentage split planned)
- Track balances and settlements
- "Mark as Paid" with automatic adjustments
- Group-level summary and settlement history

### Analytics & Insights
- Category-wise pie chart
- Monthly spending trends
- Personal vs Group breakdown
- Filters by date range, category, and type
- Top category and total spend overview

### Settings
- User profile and username management
- Currency selection (default: INR)
- Expense tracking dashboard with charts
- Dark/Light mode (planned)
- Data export (CSV/PDF) coming soon
- Backup & cloud sync (future)

### UX & Performance
- Expo Router navigation
- Optimized layouts for Android
- Smooth transitions and loaders
- Clean empty states

## Tech Stack
- Expo (Managed Workflow)
- React Native
- Expo Router
- Context API + Custom Hooks
- Async Storage
- Victory Native / Recharts (Charts)
- ESLint + Prettier

## Project Structure
spendsense/
  app/
    (tabs)/
    groups/
    settings/
  src/
    components/
    context/
    hooks/
    utils/
  assets/
  package.json
  app.json

## Installation
git clone https://github.com/vpd18/Neuron.git
cd Neuron/spendsense
npm install
npx expo start

Run via:
- Tunnel (physical device)
- Android emulator
- Web browser

## Roadmap
In Progress:
- Category improvements
- Monthly trends
- Custom percentage splits
- Settlement receipts

Upcoming:
- Recurring expenses
- CSV/PDF export
- Cloud backup
- Pie Chart Analysis
- Theme customization

Future:
- Friend invites & sharing
- AI-powered insights
- Multi-currency support

## Contributing

Contributions are welcome. For major changes, open an issue to discuss proposed updates.

## License
MIT License.
