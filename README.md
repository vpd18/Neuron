# Neuron — Modern Personal & Group Expense Tracker

Neuron is a modern, fast, and analytics-driven expense tracker built with Expo + React Native. Designed for individuals and groups, Neuron simplifies daily spending, smart splits, settlements, and financial insights with a clean UI and smooth performance.

------------------------------------------------------------
🚀 Overview
------------------------------------------------------------

Neuron helps users manage their finances effortlessly — from personal budgeting to handling complex group expenses. With intuitive inputs, automated splits, powerful analytics, and a structured dashboard, it offers a complete financial tracking experience.

------------------------------------------------------------
✨ Features
------------------------------------------------------------

🧍 Personal Expense Tracking
- Add, edit, and delete expenses
- Categorize spending (Food, Travel, Shopping, Bills, etc.)
- Weekly & monthly summaries
- Quick-entry interface
- Insightful patterns and recent history

👥 Group Expense Management
- Create and manage groups (Trips, Friends, Events)
- Split expenses:
  - Equal split
  - Custom amount split
  - Percentage split (coming soon)
- Track balances and contributions
- “Mark as Paid” with automatic balance adjustments
- Group-level summary
- Detailed settlement & split history

📊 Analytics & Insights
- Category-wise pie charts
- Monthly spending trends
- Personal vs Group breakdown
- Filters: Category, Date range, Expense Type
- Insights: Top category, Total monthly spend, Highlights

⚙️ Settings & Customization
- Profile settings & username
- Currency selector (default: INR)
- Analytics dashboard
- Light/Dark mode (planned)
- Export (CSV/PDF) coming soon
- Backup & cloud sync (future roadmap)

🧩 UX & Performance
- Built using Expo Router
- Optimized for Android and iOS
- Fast, clean, minimal UI
- Smooth transitions & loaders
- Efficient state management with Context + Hooks
- Persistent data with AsyncStorage

------------------------------------------------------------
🛠 Tech Stack
------------------------------------------------------------

- Expo (Managed Workflow)
- React Native
- Expo Router
- Context API + Custom Hooks
- Async Storage
- Victory Native / Recharts for charts
- ESLint + Prettier

------------------------------------------------------------
📁 Project Structure
------------------------------------------------------------

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

------------------------------------------------------------
📦 Installation & Running
------------------------------------------------------------

Clone the repository:
git clone https://github.com/vpd18/Neuron.git
cd Neuron/spendsense
npm install

Start the app:
npx expo start

Run using:
- Expo Go (Tunnel or LAN)
- Android Emulator
- Web Browser (limited)

------------------------------------------------------------
🗺 Roadmap
------------------------------------------------------------

In Progress:
- Enhanced categories
- Monthly spending analysis
- Custom percentage-based splitting
- Settlement receipts

Upcoming:
- Recurring expenses
- CSV/PDF export
- Improved pie chart analytics
- Theme customization

Future:
- Friend invites & real-time sync
- AI-powered insights
- Multi-currency with automatic conversion

------------------------------------------------------------
🤝 Contributing
------------------------------------------------------------

Contributions are welcome. For major changes, open an issue to discuss your ideas.

------------------------------------------------------------
📄 License
------------------------------------------------------------

This project is licensed under the MIT License.
