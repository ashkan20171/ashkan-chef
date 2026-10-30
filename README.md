# 🍳 Ashkan Chef

### A Modern Cross-Platform Cooking & Recipe Management Application

<p align="center">
  **Discover recipes. Organize your kitchen. Enjoy cooking.**
</p>

Ashkan Chef is a modern cooking and recipe management application designed to make discovering, organizing, and managing recipes easier and more enjoyable.

Built with **React Native, Expo, ASP.NET Core 8, and SQL Server**, the project demonstrates a full-stack development approach, combining a cross-platform mobile experience with a structured backend architecture.

The application is designed with international users in mind, featuring Persian and English language support, right-to-left and left-to-right layouts, and an offline-ready synchronization architecture.

---

## ✨ Key Features

- **Cross-Platform Mobile Experience** — Built with React Native and Expo.
- **Bilingual Interface** — Persian and English language support.
- **RTL / LTR Layout Support** — Adaptive layouts based on the selected language.
- **Recipe Management** — Organize and manage cooking recipes.
- **Recipe Categories** — Structure recipes for easier discovery.
- **Offline-Ready Architecture** — Designed to support local operations and synchronization.
- **Synchronization Workflow** — Queue-based synchronization with retry and conflict-handling concepts.
- **RESTful Backend API** — ASP.NET Core 8 backend architecture.
- **Database Integration** — SQL Server with Entity Framework Core.
- **Maintainable Architecture** — Organized codebase with reusable services and components.

## 🛠️ Technology Stack

| Area | Technologies |
|---|---|
| Mobile Development | React Native |
| Development Platform | Expo |
| Programming Language | JavaScript |
| Backend | ASP.NET Core 8 |
| API Architecture | RESTful APIs |
| ORM | Entity Framework Core |
| Database | Microsoft SQL Server |
| Offline Workflow | Local Queue & Synchronization |
| Testing | Node.js Test Runner |
| Version Control | Git & GitHub |

## 🏗️ Architecture

Ashkan Chef follows a client-server architecture:

```text
                 ┌──────────────────────┐
                 │     Ashkan Chef      │
                 │    Mobile Client     │
                 │  React Native/Expo   │
                 └──────────┬───────────┘
                            │
                       REST API
                            │
                 ┌──────────▼───────────┐
                 │   ASP.NET Core 8     │
                 │    Backend API      │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │  Entity Framework   │
                 │        Core         │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │   SQL Server         │
                 └──────────────────────┘
```

The mobile and backend layers are designed to remain independently maintainable, making the application easier to extend and evolve.

## 🌍 Internationalization

Internationalization is an important part of the application.

- Persian as the default language.
- English language support.
- Right-to-left (RTL) layout for Persian.
- Left-to-right (LTR) layout for English.
- Language-aware interface components.

## 📱 Mobile Application

The mobile client is developed with React Native and Expo to provide a consistent experience across supported mobile platforms.

To start the mobile application:

```bash
cd mobile
npm install
npx expo start
```

Make sure Node.js and the required Expo dependencies are installed.

## ⚙️ Backend

The backend is based on ASP.NET Core 8 and Entity Framework Core.

Required tools:

- .NET 8 SDK
- Microsoft SQL Server
- A compatible development environment such as Visual Studio 2022

Configure the database connection string and application settings before running the backend.

## 🧪 Testing

The mobile project includes automated tests for important application utilities and synchronization-related logic.

Run the available mobile tests:

```bash
cd mobile
npm test
```

## 🚀 Project Vision

Ashkan Chef is an evolving software project focused on building a reliable, maintainable, and user-friendly cooking application.

Future development areas include:

- Advanced recipe discovery and filtering.
- Recipe image management.
- Camera and gallery integration.
- Improved offline capabilities.
- Enhanced synchronization and conflict resolution.
- Additional cooking and meal-planning features.

## 👨‍💻 Author

**Ashkan**

Software Developer | Mobile & Backend Development

GitHub: [@ashkan20171](https://github.com/ashkan20171)

---

## 📄 License

This project is currently under development. Licensing and distribution terms will be specified in the repository.

---

<p align="center">
  **Built with passion for cooking and software engineering.**
</p>
