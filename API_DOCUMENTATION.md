# ApexTrade API Documentation

This document describes the current backend implementation in this repository. It is based on the code currently in the project, with the legacy PDF used only as historical context and compared against the live implementation.

> Source of truth priority used for this document:
>
> 1. Current backend source code
> 2. Current route definitions
> 3. Current controllers
> 4. Current models
> 5. Current middleware
> 6. Current server configuration
> 7. Historical PDF

---

## API Base URL

The project configuration is explicit about a local development server:

- `PORT=5000` in `.env`
- `app.listen(PORT, ...)` in `index.js`
- Default Express server is therefore on `http://localhost:5000`

Current API base URL in this repository:

```text
http://localhost:5000/api
```

The source code does not include a production hostname or deployment domain. The historical PDF mentions a hosted URL, but that is not authoritative for the current implementation unless the production environment is configured elsewhere outside this repository.

---

## Endpoint Reference

| Method | Endpoint                 | Authentication | Description                                        |
| ------ | ------------------------ | -------------- | -------------------------------------------------- |
| GET    | `/`                      | No             | Public welcome/health endpoint                     |
| POST   | `/api/auth/register`     | No             | Register a new user                                |
| POST   | `/api/auth/login`        | No             | Authenticate and receive JWT                       |
| POST   | `/api/auth/logout`       | No             | Clear auth cookie                                  |
| GET    | `/api/plans/allplans`    | Yes            | Get all plans for the authenticated user           |
| GET    | `/api/plans/plan/:id`    | Yes            | Get a single plan by ID                            |
| POST   | `/api/plans/create`      | Yes            | Create a trading plan                              |
| PUT    | `/api/plans/update/:id`  | Yes            | Update a trading plan                              |
| DELETE | `/api/plans/delete/:id`  | Yes            | Delete a trading plan                              |
| POST   | `/api/jornal/create`     | Yes            | Create a journal trade entry with optional images  |
| GET    | `/api/jornal/all`        | Yes            | Get all journal entries for the authenticated user |
| GET    | `/api/jornal/jornal/:id` | Yes            | Get one journal entry by ID                        |
| DELETE | `/api/jornal/delete/:id` | Yes            | Delete a journal entry                             |
| POST   | `/api/jornal/delete`     | Yes            | Delete journal fallback route                      |
| PUT    | `/api/jornal/update/:id` | Yes            | Update a journal entry                             |
| POST   | `/api/jornal/update`     | Yes            | Update journal fallback route                      |
| GET    | `/api/analytics`         | Yes            | Get analytics metrics                              |
| PUT    | `/api/user/profile`      | Yes            | Update authenticated user profile and avatar       |
| GET    | `/upload/*`              | No             | Static file serving for uploaded images            |

---

## Authentication Model

Authentication is implemented with JWT and a cookie fallback.

### JWT creation

The auth controller creates a JWT with:

```js
jwt.sign({ id: userId, email }, process.env.JWT_SECRET, {
  expiresIn: "1d",
});
```

The token is signed using `process.env.JWT_SECRET` and expires in 1 day.

### Authorization header format

The server supports this header:

```http
Authorization: Bearer <JWT_TOKEN>
```

The middleware also checks `req.cookies.token` first, then falls back to the Authorization header.

### Protected route behavior

The `protect` middleware is used on all routes that require login. It performs the following:

1. Reads the cookie `token`.
2. If no cookie is present, checks `Authorization: Bearer ...`.
3. Calls `jwt.verify(token, process.env.JWT_SECRET)`.
4. Finds the user by `decoded.id` and attaches it to `req.user`.
5. Returns `401` if there is no token, the token fails verification, or the user no longer exists.

### Actual responses from `protect`

```json
{ "success": false, "message": "Not authorized, token missing" }
```

```json
{ "success": false, "message": "Not authorized, token failed" }
```

```json
{ "success": false, "message": "User no longer exists" }
```

### Authentication notes

- Login and registration both set the `token` cookie as `httpOnly`.
- The JSON response also includes `token` for convenience.
- Protected routes reject unauthenticated requests with HTTP 401.
- `logout` clears the cookie but does not invalidate the JWT server-side.

---

## Server and App Structure

The application entry is `index.js`.

It configures:

- `helmet()` security headers
- `cors()`
- JSON parser with `express.json({ limit: "10mb" })`
- static file hosting at `/upload`
- route mounting:
  - `/api/auth`
  - `/api/plans`
  - `/api/jornal`
  - `/api/analytics`
  - `/api/user`

Example welcome route:

```http
GET /
```

Response:

```json
{
  "success": true,
  "message": "Welcome to ApexTrade — Trading Journal API 🚀",
  "version": "1.0.0",
  "description": "The backend engine for tracking trading plans, multi-timeframe journals, and performance analytics.",
  "status": "Active & Secure"
}
```

---

## Data Models

### User model

File: `models/User.js`

| Field      | Type   | Required | Default | Notes                                    |
| ---------- | ------ | -------- | ------- | ---------------------------------------- |
| `name`     | String | Yes      | -       | Required; no trim in schema              |
| `email`    | String | Yes      | -       | Unique; email is not validated in schema |
| `password` | String | Yes      | -       | Stored as hashed text                    |
| `avatar`   | String | No       | `""`    | URL/path to avatar image                 |

Example object:

```json
{
  "_id": "64...",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashedPassword",
  "avatar": "/upload/avatars/avatar-1720000000000.png"
}
```

### Plan model

File: `models/Plan.js`

| Field            | Type     | Required | Default | Notes                                                     |
| ---------------- | -------- | -------- | ------- | --------------------------------------------------------- |
| `name`           | String   | Yes      | -       | min 2, max 100, trimmed                                   |
| `description`    | String   | No       | `""`    | max 1000 chars                                            |
| `rules`          | String[] | Yes      | `[]`    | every item must be a non-empty string; max 500 chars each |
| `image.data`     | String   | No       | `null`  | Base64-like payload or string value                       |
| `image.mimeType` | String   | No       | `null`  | Example: `image/jpeg`                                     |
| `createdAt`      | Date     | Auto     | -       | Added by timestamps                                       |
| `updatedAt`      | Date     | Auto     | -       | Added by timestamps                                       |

### Journal model

File: `models/jornalModel.js`

| Field                  | Type     | Required | Default        | Notes                                        |
| ---------------------- | -------- | -------- | -------------- | -------------------------------------------- |
| `user`                 | ObjectId | Yes      | -              | Ref to `User`                                |
| `plan`                 | ObjectId | No       | `null`         | Ref to `Plan`                                |
| `asset`                | String   | Yes      | -              | trimmed and uppercased                       |
| `type`                 | String   | Yes      | -              | enum includes `LONG`, `SHORT`, `BUY`, `SELL` |
| `entryPrice`           | Number   | Yes      | -              | min 0                                        |
| `stopLoss`             | Number   | No       | `0`            | min 0                                        |
| `takeProfit`           | Number   | No       | `0`            | min 0                                        |
| `exitPrice`            | Number   | Yes      | -              | min 0                                        |
| `lotSize`              | Number   | Yes      | -              | min 0                                        |
| `risk`                 | Number   | No       | `0`            | min 0                                        |
| `pnl`                  | Number   | Yes      | -              | required contribution to P&L                 |
| `result`               | String   | No       | `"Break Even"` | enum `Win`, `Loss`, `Break Even`             |
| `setup`                | String   | No       | `""`           | trimmed                                      |
| `emotion`              | String   | No       | `"CALM"`       | enum of emotion values                       |
| `afterEmotion`         | String   | No       | `""`           | enum includes empty string                   |
| `notes`                | String   | No       | `""`           | trimmed                                      |
| `highTimeFrameImage`   | String   | No       | `null`         | public path                                  |
| `mediumTimeFrameImage` | String   | No       | `null`         | public path                                  |
| `lowTimeFrameImage`    | String   | No       | `null`         | public path                                  |
| `date`                 | Date     | No       | `Date.now`     | trade date                                   |
| `createdAt`            | Date     | Auto     | -              | timestamp                                    |
| `updatedAt`            | Date     | Auto     | -              | timestamp                                    |

### Important mismatch in the model vs controller

The schema allows:

```js
enum: ["LONG", "SHORT", "BUY", "SELL"];
```

But the controller validation for journal creation only accepts:

```js
["LONG", "SHORT"];
```

So the current API behavior is stricter than the schema definition.

---

## Public Static File Hosting

The server exposes uploaded files under `/upload`:

```js
app.use("/upload", express.static("upload"));
```

This means uploaded files are available via a URL like:

```text
http://localhost:5000/upload/avatars/<filename>
http://localhost:5000/upload/journals/<filename>
```

### Avatar upload paths

The profile upload code stores avatars as:

```js
`/upload/avatars/${req.file.filename}`;
```

### Journal upload paths

The journal upload code stores images as:

```js
`/upload/journals/${req.files.<field>[0].filename}`
```

The file names are generated by the Multer storage logic.

---

## Auth Endpoints

### POST /api/auth/register

#### Purpose

Creates a user account and returns a JWT token and user payload.

#### Authentication

Not required.

#### Headers

| Header         | Required | Value              |
| -------------- | -------- | ------------------ |
| `Content-Type` | Yes      | `application/json` |

#### Request body

| Field      | Type   | Required | Description                  |
| ---------- | ------ | -------- | ---------------------------- |
| `name`     | string | Yes      | Visible user name            |
| `email`    | string | Yes      | Must be a valid email format |
| `password` | string | Yes      | Min 6 characters             |

#### Validation rules

- `name`, `email`, and `password` must all be present
- `email` must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- `password.length >= 6`
- duplicate email will return 400

#### Success response

HTTP 201

```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJ...",
  "user": {
    "id": "64...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

The response also sets an `httpOnly` cookie named `token`.

#### Error responses

- 400: missing fields
- 400: invalid email
- 400: password too short
- 400: user already exists
- 500: server failure

Example error:

```json
{
  "success": false,
  "error": "User already exists with this email."
}
```

#### Example request

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

---

### POST /api/auth/login

#### Purpose

Authenticates an existing user and returns a JWT.

#### Authentication

Not required.

#### Headers

| Header         | Required | Value              |
| -------------- | -------- | ------------------ |
| `Content-Type` | Yes      | `application/json` |

#### Request body

| Field      | Type   | Required | Description      |
| ---------- | ------ | -------- | ---------------- |
| `email`    | string | Yes      | Registered email |
| `password` | string | Yes      | User password    |

#### Validation rules

- both fields must be present
- email is trimmed and lowercased
- password must match stored hash

#### Success response

HTTP 200

```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "eyJ...",
  "user": {
    "id": "64...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

The response also sets the `token` cookie.

#### Error responses

- 400: missing email or password
- 400: invalid credentials
- 500: server failure

#### Example request

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

---

### POST /api/auth/logout

#### Purpose

Clears the `token` cookie.

#### Authentication

Not required by the route itself.

#### Headers

No required headers.

#### Request body

No body.

#### Success response

HTTP 200

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Error responses

- 500: server failure

#### Example request

```bash
curl -X POST http://localhost:5000/api/auth/logout
```

---

## Plans API

### GET /api/plans/allplans

#### Purpose

Returns all plans in descending creation order.

#### Authentication

Required.

#### Headers

| Header          | Required | Value                |
| --------------- | -------- | -------------------- |
| `Authorization` | Yes      | `Bearer <JWT_TOKEN>` |

#### Request body

No body.

#### Success response

HTTP 200

```json
{
  "success": true,
  "count": 1,
  "plans": [
    {
      "_id": "64...",
      "name": "Breakout Strategy",
      "description": "Daily morning session breakout strategy.",
      "rules": [
        "Wait for 15-minute candle close",
        "Ensure high relative volume"
      ],
      "image": {
        "data": null,
        "mimeType": null
      },
      "createdAt": "2026-06-06T12:00:00.000Z",
      "updatedAt": "2026-06-06T12:00:00.000Z"
    }
  ]
}
```

#### Error responses

- 401: missing or invalid token
- 500: server error

---

### GET /api/plans/plan/:id

#### Purpose

Fetches one trading plan by MongoDB ObjectId.

#### Authentication

Required.

#### Headers

| Header          | Required | Value                |
| --------------- | -------- | -------------------- |
| `Authorization` | Yes      | `Bearer <JWT_TOKEN>` |

#### URL parameters

| Parameter | Type   | Required | Description                  |
| --------- | ------ | -------- | ---------------------------- |
| `id`      | string | Yes      | MongoDB ObjectId of the plan |

#### Validation rules

- Must be a valid MongoDB ObjectId.
- Returns 400 if `id` is not valid.

#### Success response

HTTP 200

```json
{
  "success": true,
  "plan": {
    "_id": "64...",
    "name": "Breakout Strategy",
    "description": "Daily morning session breakout strategy.",
    "rules": ["Wait for 15-minute candle close", "Ensure high relative volume"],
    "image": {
      "data": null,
      "mimeType": null
    },
    "createdAt": "2026-06-06T12:00:00.000Z",
    "updatedAt": "2026-06-06T12:00:00.000Z"
  }
}
```

#### Error responses

- 400: invalid plan ID format
- 401: missing/invalid token
- 404: plan not found
- 500: server error

---

### POST /api/plans/create

#### Purpose

Creates a trading plan.

#### Authentication

Required.

#### Headers

| Header          | Required | Value                |
| --------------- | -------- | -------------------- |
| `Authorization` | Yes      | `Bearer <JWT_TOKEN>` |
| `Content-Type`  | Yes      | `application/json`   |

#### Request body

| Field            | Type     | Required    | Description                                        |
| ---------------- | -------- | ----------- | -------------------------------------------------- |
| `name`           | string   | Yes         | Plan name; must be non-empty after trim            |
| `description`    | string   | No          | Description text                                   |
| `rules`          | string[] | Yes         | Must be an array                                   |
| `image`          | object   | No          | Optional plan image object                         |
| `image.data`     | string   | Conditional | Must be provided with `mimeType` when image exists |
| `image.mimeType` | string   | Conditional | Must be provided with `data`                       |

#### Validation rules

- `name` is required and trimmed
- `rules` must be an array
- empty strings in `rules` are removed
- if `image` is provided, both `image.data` and `image.mimeType` must exist

#### Success response

HTTP 201

```json
{
  "success": true,
  "message": "Trading plan created successfully",
  "plan": {
    "_id": "64...",
    "name": "Trend Following",
    "description": "Trading with the 200 EMA trend on 1H chart.",
    "rules": ["Price must be above 200 EMA", "Wait for pullback to support"],
    "image": {
      "data": "base64_string_here...",
      "mimeType": "image/jpeg"
    },
    "createdAt": "2026-06-06T12:15:00.000Z",
    "updatedAt": "2026-06-06T12:15:00.000Z"
  }
}
```

#### Error responses

- 400: missing name
- 400: rules must be an array
- 400: image missing required fields
- 401: missing/invalid token
- 500: server error

#### Example request

```bash
curl -X POST http://localhost:5000/api/plans/create \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Trend Following",
    "description": "Trading with the 200 EMA trend on 1H chart.",
    "rules": [
      "Price must be above 200 EMA",
      "Wait for pullback to support"
    ],
    "image": {
      "data": "base64_string_here...",
      "mimeType": "image/jpeg"
    }
  }'
```

---

### PUT /api/plans/update/:id

#### Purpose

Updates an existing plan. All fields are optional in the request body.

#### Authentication

Required.

#### Headers

| Header          | Required | Value                |
| --------------- | -------- | -------------------- |
| `Authorization` | Yes      | `Bearer <JWT_TOKEN>` |
| `Content-Type`  | Yes      | `application/json`   |

#### URL parameters

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| `id`      | string | Yes      | MongoDB ObjectId |

#### Request body

| Field         | Type     | Required | Description                                        |
| ------------- | -------- | -------- | -------------------------------------------------- |
| `name`        | string   | No       | New plan name                                      |
| `description` | string   | No       | New description                                    |
| `rules`       | string[] | No       | Replacement rule list                              |
| `image`       | object   | No       | Set to `null` to clear image or provide new object |

#### Validation rules

- `id` must be valid MongoDB ObjectId
- if `name` is present, it cannot be empty after trim
- if `rules` is present, it must be an array
- if `image` is present and not `null`, both `data` and `mimeType` are required

#### Success response

HTTP 200

```json
{
  "success": true,
  "message": "Trading plan updated successfully",
  "plan": {
    "_id": "64...",
    "name": "Updated Trend Following Plan",
    "description": "Updated description",
    "rules": ["New rule added"],
    "image": {
      "data": "base64_string_here...",
      "mimeType": "image/jpeg"
    }
  }
}
```

#### Error responses

- 400: invalid plan ID format
- 400: empty plan name
- 400: rules not array
- 400: invalid image object
- 401: missing/invalid token
- 404: plan not found
- 500: server error

---

### DELETE /api/plans/delete/:id

#### Purpose

Permanently deletes a trading plan.

#### Authentication

Required.

#### Headers

| Header          | Required | Value                |
| --------------- | -------- | -------------------- |
| `Authorization` | Yes      | `Bearer <JWT_TOKEN>` |

#### URL parameters

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| `id`      | string | Yes      | MongoDB ObjectId |

#### Success response

HTTP 200

```json
{
  "success": true,
  "message": "Trading plan deleted successfully"
}
```

#### Error responses

- 400: invalid plan ID format
- 401: missing/invalid token
- 404: plan not found
- 500: server error

---

## Journal API

### POST /api/jornal/create

#### Purpose

Creates a journal record for a trading setup. It supports an optional set of uploaded charts for each timeframe.

#### Authentication

Required.

#### Headers

| Header          | Required                  | Value                 |
| --------------- | ------------------------- | --------------------- |
| `Authorization` | Yes                       | `Bearer <JWT_TOKEN>`  |
| `Content-Type`  | Yes for JSON request      | `application/json`    |
| `Content-Type`  | Yes for multipart request | `multipart/form-data` |

#### Request body / form fields

This endpoint accepts either JSON or multipart form data.

##### JSON request fields

| Field          | Type            | Required | Description                                        |
| -------------- | --------------- | -------- | -------------------------------------------------- |
| `asset`        | string          | Yes      | Market symbol or asset code                        |
| `type`         | string          | Yes      | Must be `LONG` or `SHORT` in controller validation |
| `pnl`          | number          | Yes      | Profit/loss amount                                 |
| `entryPrice`   | number          | Yes      | Entry price                                        |
| `stopLoss`     | number          | No       | Default `0` if empty                               |
| `takeProfit`   | number          | No       | Default `0` if empty                               |
| `exitPrice`    | number          | Yes      | Exit price                                         |
| `lotSize`      | number          | Yes      | Trade size or lots                                 |
| `risk`         | number          | No       | Default `0` if empty                               |
| `result`       | string          | No       | Must be `Win`, `Loss`, or `Break Even`             |
| `setup`        | string          | No       | Setup description                                  |
| `emotion`      | string          | No       | Allowed enum values listed below                   |
| `afterEmotion` | string          | No       | Optional follow-up emotion                         |
| `notes`        | string          | No       | Additional notes                                   |
| `date`         | date/string     | No       | Date value; defaults to `Date.now()`               |
| `plan`         | string/ObjectId | No       | Optional associated plan reference                 |

##### Multipart form fields

| Field                  | Type   | Required | Description                           |
| ---------------------- | ------ | -------- | ------------------------------------- |
| `asset`                | string | Yes      | Asset code                            |
| `type`                 | string | Yes      | `LONG` or `SHORT`                     |
| `pnl`                  | number | Yes      | Profit/loss value                     |
| `entryPrice`           | number | Yes      | Entry price                           |
| `stopLoss`             | number | No       | Optional                              |
| `takeProfit`           | number | No       | Optional                              |
| `exitPrice`            | number | Yes      | Exit price                            |
| `lotSize`              | number | Yes      | Lot size                              |
| `risk`                 | number | No       | Optional                              |
| `result`               | string | No       | `Win`, `Loss`, `Break Even`           |
| `setup`                | string | No       | Optional text                         |
| `emotion`              | string | No       | One of the allowed emotion values     |
| `afterEmotion`         | string | No       | Optional                              |
| `notes`                | string | No       | Optional text                         |
| `date`                 | string | No       | Optional date                         |
| `plan`                 | string | No       | Optional plan id                      |
| `highTimeFrameImage`   | file   | No       | Up to 1 image, JPEG/PNG/WEBP, max 5MB |
| `mediumTimeFrameImage` | file   | No       | Up to 1 image, JPEG/PNG/WEBP, max 5MB |
| `lowTimeFrameImage`    | file   | No       | Up to 1 image, JPEG/PNG/WEBP, max 5MB |

#### Validation rules

The controller performs these checks:

- `asset` and `type` are required
- `type` must be `LONG` or `SHORT`
- `pnl` is required
- `entryPrice` is required
- `exitPrice` is required
- `lotSize` is required
- numeric conversion is required for `pnl`, `entryPrice`, `exitPrice`, `lotSize`, `stopLoss`, `takeProfit`, `risk`
- if `result` is present, it must be one of: `Win`, `Loss`, `Break Even`
- `emotion` is defaulted to `CALM` if invalid or undefined
- uploaded files are deleted on validation failure

#### Allowed emotion values

The controller accepts these values when provided:

```text
FOCUSED
CONFIDENT
DISCIPLINED
CALM
ANXIOUS
UNCERTAIN
FEARFUL
GREEDY
FRUSTRATED
IMPULSIVE
FOMO
REVENGE
```

The schema also allows those exact values, and the default is `CALM`.

#### Success response

HTTP 201

```json
{
  "success": true,
  "message": "Journal entry created successfully.",
  "data": {
    "_id": "64...",
    "user": "64...",
    "plan": null,
    "asset": "EURUSD",
    "type": "LONG",
    "pnl": 50,
    "entryPrice": 1.05,
    "stopLoss": 1.045,
    "takeProfit": 1.06,
    "exitPrice": 1.055,
    "lotSize": 1,
    "risk": 0.5,
    "result": "Win",
    "setup": "Breakout",
    "emotion": "CONFIDENT",
    "afterEmotion": "",
    "notes": "Good trade",
    "highTimeFrameImage": "/upload/journals/high-<userid>-<timestamp>.png",
    "mediumTimeFrameImage": null,
    "lowTimeFrameImage": null,
    "date": "2026-06-06T12:00:00.000Z"
  }
}
```

#### Error responses

- 400: missing asset or type
- 400: trade type not LONG/SHORT
- 400: missing P&L
- 400: missing entry price
- 400: missing exit price
- 400: missing lot size
- 400: invalid numeric values
- 400: invalid `result`
- 401: missing/invalid token
- 500: server failure

#### Example JSON request

```bash
curl -X POST http://localhost:5000/api/jornal/create \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "asset": "EURUSD",
    "type": "LONG",
    "entryPrice": 1.05,
    "exitPrice": 1.055,
    "stopLoss": 1.045,
    "takeProfit": 1.06,
    "lotSize": 1,
    "pnl": 50,
    "risk": 0.5,
    "result": "Win",
    "setup": "Breakout",
    "emotion": "CONFIDENT",
    "notes": "Good trade"
  }'
```

#### Example multipart request

```bash
curl -X POST http://localhost:5000/api/jornal/create \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "asset=GBPUSD" \
  -F "type=SHORT" \
  -F "entryPrice=1.2700" \
  -F "exitPrice=1.2650" \
  -F "stopLoss=1.2750" \
  -F "takeProfit=1.2600" \
  -F "lotSize=2.0" \
  -F "pnl=100" \
  -F "risk=1.0" \
  -F "result=Win" \
  -F "setup=Support Bounce" \
  -F "emotion=FOCUSED" \
  -F "notes=Perfect risk reward" \
  -F "highTimeFrameImage=@/tmp/high.png" \
  -F "mediumTimeFrameImage=@/tmp/medium.png" \
  -F "lowTimeFrameImage=@/tmp/low.png"
```

---

### GET /api/jornal/all

#### Purpose

Fetches all journal entries for the authenticated user, sorted by newest first.

#### Authentication

Required.

#### Headers

| Header          | Required | Value                |
| --------------- | -------- | -------------------- |
| `Authorization` | Yes      | `Bearer <JWT_TOKEN>` |

#### Success response

HTTP 200

```json
{
  "success": true,
  "count": 2,
  "stats": {
    "totalPnl": 150,
    "winRate": "50.00%",
    "winningTrades": 1,
    "losingTrades": 1,
    "breakEvenTrades": 0
  },
  "data": [
    {
      "_id": "64...",
      "user": "64...",
      "plan": null,
      "asset": "EURUSD",
      "type": "LONG",
      "pnl": 50,
      "entryPrice": 1.05,
      "exitPrice": 1.055,
      "lotSize": 1,
      "risk": 0.5,
      "result": "Win",
      "setup": "Breakout",
      "emotion": "CONFIDENT",
      "notes": "Good trade",
      "date": "2026-06-06T12:00:00.000Z"
    }
  ]
}
```

#### Statistics calculation

The controller computes:

- `totalPnl`: sum of all `pnl`
- `winningTrades`: `pnl > 0`
- `losingTrades`: `pnl < 0`
- `breakEvenTrades`: `pnl === 0`
- `winRate`: `(winningTrades / totalTrades) * 100` with two decimal places and a `%` symbol

#### Error responses

- 401: missing/invalid token
- 500: server error

---

### GET /api/jornal/jornal/:id

#### Purpose

Fetches one journal entry by ID for the authenticated user.

#### Authentication

Required.

#### Headers

| Header          | Required | Value                |
| --------------- | -------- | -------------------- |
| `Authorization` | Yes      | `Bearer <JWT_TOKEN>` |

#### URL parameters

| Parameter | Type   | Required | Description                            |
| --------- | ------ | -------- | -------------------------------------- |
| `id`      | string | Yes      | MongoDB ObjectId of the journal record |

#### Success response

HTTP 200

```json
{
  "success": true,
  "data": {
    "_id": "64...",
    "user": "64...",
    "plan": {
      "_id": "64...",
      "name": "Trend Following",
      "description": "..."
    },
    "asset": "EURUSD",
    "type": "LONG",
    "pnl": 50,
    "entryPrice": 1.05,
    "stopLoss": 1.045,
    "takeProfit": 1.06,
    "exitPrice": 1.055,
    "lotSize": 1,
    "risk": 0.5,
    "result": "Win",
    "setup": "Breakout",
    "emotion": "CONFIDENT",
    "afterEmotion": "",
    "notes": "Good trade",
    "highTimeFrameImage": "/upload/journals/high-xxx.png",
    "mediumTimeFrameImage": null,
    "lowTimeFrameImage": null,
    "date": "2026-06-06T12:00:00.000Z"
  }
}
```

#### Error responses

- 401: missing/invalid token
- 404: journal not found
- 500: server error

---

### DELETE /api/jornal/delete/:id

#### Purpose

Deletes a specific journal entry for the authenticated user.

#### Authentication

Required.

#### Headers

| Header          | Required | Value                |
| --------------- | -------- | -------------------- |
| `Authorization` | Yes      | `Bearer <JWT_TOKEN>` |

#### URL parameters

| Parameter | Type   | Required | Description       |
| --------- | ------ | -------- | ----------------- |
| `id`      | string | Yes      | Journal record id |

#### Success response

HTTP 200

```json
{
  "success": true,
  "message": "Journal entry deleted successfully."
}
```

#### Error responses

- 401: missing/invalid token
- 404: journal not found or unauthorized
- 500: server error

#### Note

The route also keeps a fallback POST route at `/api/jornal/delete` that calls the same controller.

---

### POST /api/jornal/delete

#### Purpose

Fallback delete route, same functionality as `DELETE /api/jornal/delete/:id`.

#### Authentication

Required.

#### Headers

| Header          | Required | Value                |
| --------------- | -------- | -------------------- |
| `Authorization` | Yes      | `Bearer <JWT_TOKEN>` |

#### Request body

| Field | Type   | Required | Description       |
| ----- | ------ | -------- | ----------------- |
| `id`  | string | Yes      | Journal record id |

#### Success response

Same as `DELETE /api/jornal/delete/:id`.

#### Error responses

- 401: missing/invalid token
- 404: journal not found or unauthorized
- 500: server error

---

### PUT /api/jornal/update/:id

#### Purpose

Updates a journal record for the authenticated user.

#### Authentication

Required.

#### Headers

| Header          | Required | Value                |
| --------------- | -------- | -------------------- |
| `Authorization` | Yes      | `Bearer <JWT_TOKEN>` |
| `Content-Type`  | Yes      | `application/json`   |

#### URL parameters

| Parameter | Type   | Required | Description       |
| --------- | ------ | -------- | ----------------- |
| `id`      | string | Yes      | Journal record id |

#### Request body

The controller copies the entire request body to an `updates` object and applies no explicit whitelist. It removes the following keys before saving:

- `user`
- `_id`
- `__v`

Any remaining fields are updated through MongoDB with `runValidators: true`.

This means the request can contain many journaling fields, but the code does not add explicit validation for each field before update. The route does not process files; file updates are not handled here.

#### Success response

HTTP 200

```json
{
  "success": true,
  "message": "Journal entry updated successfully.",
  "data": {
    "_id": "64...",
    "asset": "EURUSD",
    "pnl": 75,
    "type": "LONG"
  }
}
```

#### Error responses

- 401: missing/invalid token
- 404: journal not found or unauthorized
- 500: server error

#### Note

The route also keeps a fallback POST route at `/api/jornal/update` that calls the same controller.

---

### POST /api/jornal/update

#### Purpose

Fallback update route, same functionality as `PUT /api/jornal/update/:id`.

#### Authentication

Required.

#### Headers

| Header          | Required | Value                |
| --------------- | -------- | -------------------- |
| `Authorization` | Yes      | `Bearer <JWT_TOKEN>` |
| `Content-Type`  | Yes      | `application/json`   |

#### Request body

| Field | Type   | Required | Description                                                     |
| ----- | ------ | -------- | --------------------------------------------------------------- |
| `id`  | string | Yes      | Journal record id                                               |
| ...   | any    | No       | Any other journal field accepted by the underlying update logic |

#### Success response

Same as `PUT /api/jornal/update/:id`.

#### Error responses

- 401: missing/invalid token
- 404: journal not found or unauthorized
- 500: server error

---

## Journal Image Uploads

The current implementation uses `multer` with filesystem storage and multipart form uploads.

### Route registration

`routes/jornalRoute.js` attaches:

```js
journalUpload.fields([
  { name: "highTimeFrameImage", maxCount: 1 },
  { name: "mediumTimeFrameImage", maxCount: 1 },
  { name: "lowTimeFrameImage", maxCount: 1 },
]);
```

### Upload storage location

The upload directory is:

```text
<project-root>/upload/journals
```

The filename is generated as:

```text
<fieldname without Image>-<userId>-<timestamp><ext>
```

Example:

```text
high-64a7f2...-1710000000000.png
```

### Allowed file types

Only these MIME types are allowed:

- `image/jpeg`
- `image/png`
- `image/webp`

### File size limit

Each uploaded file must be 5 MB or less.

```js
fileSize: 5 * 1024 * 1024;
```

### File validation behavior

If a file is rejected, Multer returns an error such as:

```json
{
  "success": false,
  "error": "Only JPEG, PNG, and WEBP image files are allowed."
}
```

or

```json
{ "success": false, "error": "Avatar file must be 5MB or less." }
```

for profile uploads.

### Image path stored in DB

The controller saves the image URL as:

```js
`/upload/journals/${req.files.highTimeFrameImage[0].filename}`;
```

The exact published URL is built as:

```text
http://localhost:5000/upload/journals/<filename>
```

### Important implementation note

This is not a Base64 API. The upload is real multipart file upload to the filesystem, and the database stores the URL path.

---

## User Profile API

### PUT /api/user/profile

#### Purpose

Updates a logged-in user profile. It supports name, email, and avatar updates.

#### Authentication

Required.

#### Headers

| Header          | Required | Value                 |
| --------------- | -------- | --------------------- |
| `Authorization` | Yes      | `Bearer <JWT_TOKEN>`  |
| `Content-Type`  | Yes      | `multipart/form-data` |

#### Request parameters

No URL params.

#### Multipart form fields

| Field    | Type   | Required | Description         |
| -------- | ------ | -------- | ------------------- |
| `name`   | string | No       | New user name       |
| `email`  | string | No       | New email address   |
| `avatar` | file   | No       | Avatar image upload |

#### Validation rules

- At least one of `name`, `email`, or `avatar` must be present
- if `name` is provided, it cannot be empty after trim
- if `email` is provided, it cannot be empty and must match the same email regex
- if the new email is already used by another user, return 400
- avatar upload is limited to 5 MB
- allowed avatar MIME types: `image/jpeg`, `image/png`, `image/webp`

#### Avatar upload behavior

The route uses:

```js
upload.single("avatar");
```

The route is implemented in `routes/userRoutes.js` with a custom Multer error wrapper.

The storage directory is:

```text
<project-root>/upload/avatars
```

The avatar path saved to the user document is:

```js
`/upload/avatars/${req.file.filename}`;
```

#### Success response

HTTP 200

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "64...",
    "name": "New Name",
    "email": "new@example.com",
    "avatar": "/upload/avatars/avatar-1710000000000.png"
  }
}
```

#### Error responses

- 400: no name/email/avatar provided
- 400: name empty
- 400: email empty
- 400: invalid email format
- 400: duplicate email for another user
- 400: avatar exceeds 5MB
- 400: invalid avatar MIME type
- 401: missing/invalid token
- 404: user not found
- 500: server error

#### Example request

```bash
curl -X PUT http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "name=Jane Doe" \
  -F "email=jane@example.com" \
  -F "avatar=@/tmp/avatar.png"
```

---

## Analytics API

### GET /api/analytics

#### Purpose

Computes aggregated trading metrics for the authenticated user from journal records.

#### Authentication

Required.

#### Headers

| Header          | Required | Value                |
| --------------- | -------- | -------------------- |
| `Authorization` | Yes      | `Bearer <JWT_TOKEN>` |

#### Query parameters

| Parameter   | Type   | Required | Description                     |
| ----------- | ------ | -------- | ------------------------------- |
| `startDate` | string | No       | ISO date used as lower bound    |
| `endDate`   | string | No       | ISO date used as upper bound    |
| `month`     | number | No       | Month number for monthly filter |
| `year`      | number | No       | Year for monthly filter         |

#### Filtering logic

- If both `startDate` and `endDate` are provided, the query uses a date range.
- Else if both `month` and `year` are provided, the query uses a month window.
- Otherwise, it uses the authenticated user and no date filter.

#### Success response

HTTP 200

```json
{
  "success": true,
  "metrics": {
    "winRate": "50.0%",
    "profitFactor": "2.50",
    "avgPnl": "$25.50",
    "totalTrades": 10,
    "winningTrades": 5,
    "losingTrades": 5,
    "bestTrade": "$100.00"
  }
}
```

#### Notes on calculations

The controller calculates:

- `winningTrades`: number of records with `pnl > 0`
- `losingTrades`: number of records with `pnl < 0`
- `grossProfit`: sum of positive `pnl`
- `grossLoss`: sum of absolute values of negative `pnl`
- `winRate`: `(winningTrades / totalTrades) * 100` formatted with one decimal place and `%`
- `profitFactor`: `grossProfit / grossLoss`, or `"Infinite"` if `grossLoss === 0` and `grossProfit > 0`, else `"0.00"`
- `totalPnl`: sum of all `pnl`
- `avgPnl`: `(totalPnl / totalTrades).toFixed(2)` prefixed with `$`
- `bestTrade`: maximum `pnl` value prefixed with `$`

#### Empty result behavior

If no trades match the filters, the endpoint returns:

```json
{
  "success": true,
  "metrics": {
    "winRate": "0%",
    "profitFactor": "0.00",
    "avgPnl": "$0.00",
    "totalTrades": 0,
    "winningTrades": 0,
    "losingTrades": 0,
    "bestTrade": 0
  }
}
```

#### Error responses

- 401: missing/invalid token
- 500: server error

#### Example request

```bash
curl -X GET "http://localhost:5000/api/analytics?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## Route and Controller Inventory

The source files define these routes exactly:

### `index.js`

- `GET /`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/plans/allplans`
- `GET /api/plans/plan/:id`
- `POST /api/plans/create`
- `PUT /api/plans/update/:id`
- `DELETE /api/plans/delete/:id`
- `POST /api/jornal/create`
- `GET /api/jornal/all`
- `GET /api/jornal/jornal/:id`
- `DELETE /api/jornal/delete/:id`
- `POST /api/jornal/delete`
- `PUT /api/jornal/update/:id`
- `POST /api/jornal/update`
- `GET /api/analytics`
- `PUT /api/user/profile`

### Static file handling

- `GET /upload/*` from `express.static("upload")`

---

## Important Differences From the Legacy PDF

### 1. Local base URL vs hosted production URL

- Old documentation: `http://localhost:5000/api`
- Current implementation: the code sets `PORT=5000` and starts the Express app on that port, so the current project base URL is also `http://localhost:5000/api`
- Impact: The PDF is historically useful but the current repository authoritatively defines the local default URL, not a remote deployment domain.

### 2. Journal route structure differs from some legacy assumptions

- Old PDF often describes a more standard pattern like `GET /api/jornal/:id` or route names that may not match the implementation exactly.
- Current implementation uses:
  - `GET /api/jornal/jornal/:id`
  - `DELETE /api/jornal/delete/:id`
  - `POST /api/jornal/delete`
  - `PUT /api/jornal/update/:id`
  - `POST /api/jornal/update`
- Impact: The live code includes fallback POST routes and the specific route namespace `/jornal/jornal/:id` is the current implementation.

### 3. Journal trade direction validation is stricter than the schema

- Model: `type` includes `LONG`, `SHORT`, `BUY`, `SELL`
- Controller: only accepts `LONG` or `SHORT`
- Impact: The current API rejects `BUY` and `SELL` even though the schema allows them. The code’s runtime validation is the authoritative behavior.

### 4. Journal uploads are current filesystem multipart uploads

- The PDF is historical and may describe older conventions or assumptions.
- Current code uses `multer.diskStorage` and stores files under `upload/journals` and `upload/avatars`.
- Impact: The current API is a real multipart upload system, not a purely JSON or Base64-only interface.

### 5. User profile endpoint uses multipart upload for avatars

- The code uses `upload.single("avatar")` with `multipart/form-data`.
- Impact: The API requires `avatar` in the multipart form, not a JSON `avatar` string payload.

---

## Security and Operational Notes

### Cookie behavior

The app sets cookies with:

```js
res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  maxAge: 24 * 60 * 60 * 1000,
});
```

This is relevant for browser clients, but the API also supports the Authorization header directly.

### Error handling pattern

Most controllers return a JSON object like:

```json
{ "success": false, "message": "..." }
```

or

```json
{ "success": false, "error": "..." }
```

The exact property names depend on the controller. Do not assume one pattern across all endpoints.

### Important caveat

The repository does not include a centralized validation middleware or global error handler. Validation and error responses are implemented explicitly in each controller.

---

## Summary

- Endpoints documented: 18 routes plus static upload path
- Models documented: 3
- Authentication mechanism: JWT via `jsonwebtoken`, checked in `protect.js`, with cookie fallback and `Authorization: Bearer ...` support
- Upload mechanism: Multer filesystem uploads for avatars and journal images
- API base URL: `http://localhost:5000/api`
- Major differences from the old PDF: route namespace details, upload approach, strict controller validation for journal `type`, profile avatar field handling, and the fact that the current code should be treated as the source of truth
- Anything not fully verifiable from source code: no production deployment hostname beyond the local default `PORT=5000`; no external real-world API domain was configured in this repo
