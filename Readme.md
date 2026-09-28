<div align="center">

# 📈 ApexTrade — Trading Journal API

### _The Backend Engine for Disciplined Traders & Performance Analysts_

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-black?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-4EA94B?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![JWT Auth](https://img.shields.io/badge/JWT-Secure-orange?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

_A robust, lightning-fast, and secure RESTful backend crafted to track trading plans, organize daily journals with multi-timeframe screenshots, link trades to strategies, and analyze filtered performance metrics._

</div>

---

## ⚡ Core Architecture & Highlights

- **🛡️ Bulletproof Authentication:** Implements token-based security via **JWT**, stored and verified securely against unauthorized access.
- **📋 Dynamic Trading Plans:** Allows traders to establish, update, and validate custom rule sets and attach strategy screenshots (Base64).
- **📊 Multi-Timeframe Chart Capture:** Seamlessly logs High, Medium, and Low timeframe chart images (`highTimeFrameImage`, `mediumTimeFrameImage`, `lowTimeFrameImage`) per trade execution.
- **📈 Smart Trade Journaling & Plan Linking:** Log execution metrics (PnL, entry/exit prices, lot sizes, emotional states) and reference specific trading plans to evaluate strategy performance.
- **📊 Dedicated Performance Analytics Engine:** Standalone analytics endpoint supporting flexible date, week, and month filtering (`startDate`, `endDate`, `month`, `year`) to compute Win Rates, Profit Factors, and PnL breakdowns on the fly.
- **🔒 Route Guarding Middleware:** Strict authorization layers ensuring that sensitive actions (`POST`, `PUT`, `DELETE`) are limited to verified owners.

---

## 🛠️ Tech Stack

| Layer         | Technology           | Purpose                                                                 |
| :------------ | :------------------- | :---------------------------------------------------------------------- |
| **Runtime**   | `Node.js`            | JavaScript runtime environment                                          |
| **Framework** | `Express.js`         | REST API routing and middleware management                              |
| **Database**  | `MongoDB & Mongoose` | NoSQL document storage with strict data modeling and population support |
| **Security**  | `Bcrypt.js` & `JWT`  | Cryptographic password hashing and session tokens                       |

---

## 📂 Project Directory Structure

```text
📦 trading-journal-backend
 ┣ 📂 controller
 ┃ ┣ 📜 authController.js       # User registration, login, logout controllers
 ┃ ┣ 📜 planController.js       # CRUD operations for trading plans
 ┃ ┣ 📜 jornalController.js     # CRUD operations for trading journals & PnL metrics
 ┃ ┗ 📜 analyticsController.js  # Advanced math metrics & filtered performance analytics
 ┣ 📂 middleware
 ┃ ┗ 📜 protect.js              # JWT verification & route security guard
 ┣ 📂 models
 ┃ ┣ 📜 User.js                 # Mongoose schema for User profiles
 ┃ ┣ 📜 Plan.js                 # Mongoose schema for Trading Plans & Rules
 ┃ ┗ 📜 jornalModel.js          # Mongoose schema for Trade entries with MTF images & plan referencing
 ┣ 📂 routes
 ┃ ┣ 📜 authRoutes.js           # Endpoints for authentication
 ┃ ┣ 📜 planRoutes.js           # Endpoints for trading strategies
 ┃ ┣ 📜 jornalRoute.js          # Endpoints for trading journal entries
 ┃ ┗ 📜 analyticsRoutes.js      # Endpoints for performance analytics & filters
 ┣ 📜 .env                      # Environment variables (git-ignored)
 ┣ 📜 server.js                 # Application entry point & database connection
 ┗ 📜 package.json              # Project dependencies & scripts
```
