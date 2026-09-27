<div align="center">

# 📈 ApexTrade — Trading Journal API
### *The Backend Engine for Disciplined Traders & Performance Analysts*

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-black?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-4EA94B?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![JWT Auth](https://img.shields.io/badge/JWT-Secure-orange?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

*A robust, lightning-fast, and secure RESTful backend crafted to track trading plans, organize daily journals, and analyze performance metrics.*

</div>

---

## ⚡ Core Architecture & Highlights

* **🛡️ Bulletproof Authentication:** Implements token-based security via **JWT**, stored securely in `httpOnly` cookies protected against XSS and CSRF.
* **📋 Dynamic Trading Plans:** Allows traders to establish, update, and validate custom rule sets and attach strategy screenshots (Base64).
* **📊 Day-by-Day Analysis & Journaling:** Structurally engineered to log day-to-day market conditions, emotional states, and execution metrics.
* **🔒 Route Guarding Middleware:** Strict authorization layers ensuring that sensitive actions (`POST`, `PUT`, `DELETE`) are limited to verified owners.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime** | `Node.js` | JavaScript runtime environment |
| **Framework** | `Express.js` | REST API routing and middleware management |
| **Database** | `MongoDB & Mongoose` | NoSQL document storage with strict data modeling |
| **Security** | `Bcrypt.js` & `JWT` | Cryptographic password hashing and session tokens |

---

## 📂 Project Directory Structure

```text
📦 trading-journal-backend
 ┣ 📂 controller
 ┃ ┣ 📜 authController.js     # User registration, login, logout controllers
 ┃ ┗ 📜 planController.js     # CRUD operations for trading plans
 ┣ 📂 middleware
 ┃ ┗ 📜 protect.js            # JWT verification & route security guard
 ┣ 📂 models
 ┃ ┣ 📜 User.js               # Mongoose schema for User profiles
 ┃ ┗ 📜 Plan.js               # Mongoose schema for Trading Plans & Rules
 ┣ 📂 routes
 ┃ ┣ 📜 authRoutes.js         # Endpoints for authentication
 ┃ ┗ 📜 planRoutes.js         # Endpoints for trading strategies
 ┣ 📜 .env                    # Environment variables (git-ignored)
 ┣ 📜 server.js               # Application entry point & database connection
 ┗ 📜 package.json            # Project dependencies & scripts