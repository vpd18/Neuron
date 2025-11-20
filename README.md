# Neuron
Neuron – Smart Expense Tracker

Neuron (formerly Speedsense) is a modern personal and group expense tracker built with Expo and React Native. It focuses on fast recording, clean UI, powerful analytics, and simple settlement between friends or groups.

Features
Personal Expenses

Add, edit, and delete personal expenses

Categorize expenses (Food, Travel, Bills, Shopping, etc.)

Monthly and weekly summaries

Group Expenses

Create groups (Trips, Friends, Family, Projects, etc.)

Split expenses using:

Equal split

Custom amount split

Percentage split (upcoming)

Track balances and owed amounts

Mark as Paid / Settle Up

Group-level summary view

Analytics and Insights

Pie chart showing category-wise breakdown

Monthly spending trends

Total expenses and average daily spend

Personal vs Group analysis

Filters: Date range, Category, Personal only, Group only

Settings

Username and profile settings

Currency selection (default: INR)

Theme preferences

"Track Expenses" screen with charts and insights

Data export (upcoming)

UI and UX

Expo Router–based navigation

Responsive layout

Empty states and improved design polish

Optimized for Android devices

Tech Stack

Expo (Managed Workflow)

React Native

Expo Router

React Context and Hooks

Async Storage

Victory Native / Recharts for graphs

ESLint and Prettier (recommended)

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

Installation and Setup

Clone the repository:

git clone https://github.com/vpd18/Neuron.git
cd Neuron/spendsense


Install dependencies:

npm install


Start the project:

npx expo start


Select:

Tunnel for physical device

Android for emulator

Web for debugging

Roadmap
Upcoming Features

Recurring expenses

Cloud sync (Supabase or Firebase)

Export to CSV or PDF

Notifications for pending settlements

OCR bill scanning

Secure backups

Themes and deeper analytics

Future Plans

Friends sharing via links or invites

AI-based spending insights

Multi-currency smart conversion
