# Smart Farm Field Intelligence Platform - Full API Documentation

## Base Information

- **Base URL (Local)**: `http://localhost:5000/api`
- **Content-Type**: `application/json`

## Authentication

Endpoints that require authentication expect a Bearer token in the `Authorization` header.
```http
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication Endpoints

### Register a User
- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "name": "John Doe"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "token": "eyJhbG...",
      "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe" }
    }
  }
  ```

### Login
- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbG...",
      "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe" }
    }
  }
  ```
- **Error Response (401)**: `"Invalid credentials"`

### Get Current User
- **Method**: `GET`
- **URL**: `/api/auth/me`
- **Auth Required**: Yes
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": { "id": "uuid", "email": "user@example.com", "name": "John Doe" }
  }
  ```

---

## 2. Field Endpoints

### Get User Fields
- **Method**: `GET`
- **URL**: `/api/fields`
- **Auth Required**: Yes
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "name": "North Field",
        "area": 15.5,
        "polygon": { "type": "Polygon", "coordinates": [[[...]]] },
        "centroid": { "lat": 55.123, "lng": -116.123 },
        "createdAt": "2026-06-09T00:00:00.000Z"
      }
    ]
  }
  ```

### Save Field
- **Method**: `POST`
- **URL**: `/api/fields`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "North Field",
    "polygon": {
      "type": "Polygon",
      "coordinates": [[[-116.1, 55.1], [-116.2, 55.1], [-116.2, 55.2], [-116.1, 55.1]]]
    }
  }
  ```
- **Success Response (201 Created)**: Returns the newly created field object.

### Update Field Name
- **Method**: `PUT`
- **URL**: `/api/fields/:id`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "name": "Updated North Field" }
  ```
- **Success Response (200 OK)**: Returns the updated field object.

### Delete Field
- **Method**: `DELETE`
- **URL**: `/api/fields/:id`
- **Auth Required**: Yes
- **Success Response (200 OK)**: `"Field deleted successfully"`

---

## 3. Analysis Endpoints
*All analysis endpoints require Authentication and the `fieldId` parameter.*

### Get Field Weather
- **Method**: `POST`
- **URL**: `/api/analysis/:fieldId/weather`
- **Auth Required**: Yes
- **Request Body**: None
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "temperature": 25.4,
      "humidity": 60,
      "windSpeed": 5.2,
      "rainfall": 0,
      "forecast": [
        { "date": "2026-06-10", "tempMax": 27, "tempMin": 18, "precipitation": 2, "condition": "Rain" }
      ]
    }
  }
  ```

### Analyze Current Soil
- **Method**: `POST`
- **URL**: `/api/analysis/:fieldId/soil`
- **Auth Required**: Yes
- **Request Body**: None
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "year": 2026,
      "season": "Kharif",
      "data": {
        "layers": [{ "depth": "0-15cm", "ph": 6.5, "organicCarbon": 15, "texture": "loam" }]
      },
      "created_at": "2026-06-09T00:00:00.000Z"
    }
  }
  ```

### Get Soil History & Trends
- **Method**: `GET`
- **URL**: `/api/analysis/:fieldId/soil/history`
- **Auth Required**: Yes
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "records": [...], 
      "alerts": [
        { "type": "pH", "severity": "warning", "message": "pH dropped by 0.5" }
      ]
    }
  }
  ```

### Get Crop Suitability
- **Method**: `POST`
- **URL**: `/api/analysis/:fieldId/crop`
- **Auth Required**: Yes
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "name": "Wheat",
        "score": 92,
        "matchReasons": ["Optimal pH", "Good rainfall forecast"],
        "riskFactors": []
      }
    ]
  }
  ```

### Get Irrigation Plan
- **Method**: `POST`
- **URL**: `/api/analysis/:fieldId/irrigation`
- **Auth Required**: Yes
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "nextIrrigationDays": 4,
      "waterRequired": 35.5,
      "currentSoilMoisture": 68.2,
      "dailyET": 3.4,
      "rainfallNext7Days": 12.0
    }
  }
  ```

### Get Field NDVI (Satellite Health)
- **Method**: `POST`
- **URL**: `/api/analysis/:fieldId/ndvi`
- **Auth Required**: Yes
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "averageNDVI": 0.65,
      "healthScore": "Good",
      "healthPercentage": 80,
      "stressAreas": 15.5,
      "lastImageDate": "2026-06-09T00:00:00.000Z"
    }
  }
  ```

### Get Fertilizer Plan
- **Method**: `POST`
- **URL**: `/api/analysis/:fieldId/fertilizer`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "targetCrop": "Wheat" }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "required": { "N": 120, "P": 60, "K": 40 },
      "recommendations": ["Apply Urea", "DAP needed"],
      "liveAlerts": []
    }
  }
  ```

### Get Risk Alerts
- **Method**: `POST`
- **URL**: `/api/analysis/:fieldId/risks`
- **Auth Required**: Yes
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      { "riskType": "Weather", "severity": "High", "message": "Heavy rainfall expected" }
    ]
  }
  ```

### Get Pesticide Recommendation
- **Method**: `POST`
- **URL**: `/api/analysis/:fieldId/pesticide`
- **Auth Required**: Yes
- **Request Body** *(Optional)*:
  ```json
  {
    "crop": "Wheat",
    "growthStage": "Vegetative"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "crop": "Wheat",
      "growthStage": "Vegetative",
      "season": "Monsoon",
      "assessments": [
        {
          "pestName": "Stem Rust",
          "riskLevel": "High",
          "riskScore": 85,
          "recommendation": "Spray recommended",
          "treatment": { "chemical": "Fungicide X", "dosage": "2ml/L" }
        }
      ]
    }
  }
  ```

---

## 4. Branch Endpoints

### Get All Branches
- **Method**: `GET`
- **URL**: `/api/branches`
- **Auth Required**: No
- **Success Response (200 OK)**: Array of branch objects.

### Get Nearest Branches
- **Method**: `GET`
- **URL**: `/api/branches/nearest?lat={lat}&lng={lng}&limit={limit}`
- **Auth Required**: No
- **Parameters**: `lat` (required), `lng` (required), `limit` (optional, default 5)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "name": "Eaglesham",
        "latitude": 58.494,
        "longitude": -117.152,
        "distance": 15.2
      }
    ]
  }
  ```

### Compare Branch Prices
- **Method**: `GET`
- **URL**: `/api/branches/compare?product={name}&lat={lat}&lng={lng}`
- **Auth Required**: No
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "branchId": "uuid",
        "branchName": "Falher",
        "distance": 12.5,
        "product": "Urea",
        "price": 45.0,
        "unit": "kg"
      }
    ]
  }
  ```

### Get Branch Details
- **Method**: `GET`
- **URL**: `/api/branches/:id`
- **Auth Required**: No
- **Success Response (200 OK)**: Returns the branch object.

### Get Branch Prices
- **Method**: `GET`
- **URL**: `/api/branches/:id/prices`
- **Auth Required**: No
- **Success Response (200 OK)**: Returns array of products for the branch.

---

## 5. Generic Weather Endpoint

### Get Weather by Coordinates
- **Method**: `GET`
- **URL**: `/api/weather?lat={lat}&lng={lng}`
- **Auth Required**: No
- **Success Response (200 OK)**: Returns current weather and a 7-day forecast.
