Neuron — Modern Personal & Group Expense Tracker

Neuron is a clean, fast, and analytics-driven expense tracker built with Expo + React Native. It simplifies personal budgeting and group expense management with smart splits, visual insights, and streamlined settlements.

Overview

Neuron helps users track daily spending, manage shared expenses, and gain insights through interactive charts. It supports equal/custom splits, settlements, category analytics, and a refined settings dashboard.

Features
Personal Expenses

Add, edit, and delete expenses

Categorized spending (Food, Travel, Bills, etc.)

Weekly & monthly summaries

Quick-entry interface for faster logging

Group Expenses

Create and manage groups (Trips, Friends, Events, etc.)

Split expenses equally or with custom amounts

Track balances and settle dues instantly

Automatic adjustments after “Mark as Paid”

Group summaries and settlement history

Analytics & Insights

Category-wise pie charts

Monthly spending trends

Comparison of Personal vs Group expenses

Filters by date range, category, and type

Overall spending breakdown + top categories

Settings

Username & profile management

Currency selection (Default: INR)

Analytics dashboard with charts

Dark/Light mode (planned)

Upcoming: CSV/PDF export

Upcoming: Backup & cloud sync

UX & Performance

Expo Router navigation

Smooth animations & transitions

Optimized layouts for Android

Clean empty states for better clarity

Tech Stack

Expo (Managed Workflow)

React Native

Expo Router

Context API + Custom Hooks

Async Storage

Victory Native / Recharts (Charts)

ESLint + Prettier

Project Structure
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

Installation
git clone https://github.com/vpd18/Neuron.git
cd Neuron/spendsense
npm install
npx expo start


Run using:

Physical device (Tunnel/QR)

Android emulator

Web browser

Roadmap
In Progress

Category improvements

Monthly spending trends

Custom percentage splits

Settlement receipts

Upcoming

Recurring expenses

CSV/PDF export

Cloud backup

Enhanced chart analytics

Theme customization

Future

Friend invites & sharing

AI-powered spending insights

Multi-currency support

Contributing

Contributions are welcome. For major changes, please open an issue to discuss proposed updates before submitting a pull request.

License

MIT License