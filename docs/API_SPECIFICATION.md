# REST API Specification - ZANECO Appointment Scheduling System

**Base URL (Production):** `https://appointments.zaneco.ph/api/v1`

**Base URL (Development):** `http://localhost:8000/api/v1`

**Content Type:** `application/json`

---

## Authentication

Endpoints marked with 🔒 require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 1. Consumer Endpoints (No Auth Required)

### 1.1 Create Appointment

Creates a new appointment. No authentication required.

```
POST /appointments
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `consumer_name` | string | Yes | Full name of requestor |
| `account_name` | string | Yes | Name on electric account |
| `account_number` | string | Yes | ZANECO account number |
| `mobile_number` | string | Yes | Philippine mobile number (e.g., 09171234567) |
| `email` | string | No | Email for optional notifications |
| `concern_type_id` | integer | Yes | ID of concern type |
| `office_id` | integer | Yes | ID of preferred office |
| `appointment_date` | string | Yes | Date in YYYY-MM-DD format |
| `start_time` | string | Yes | Time in HH:MM:SS format (e.g., 09:00:00) |

**Response `201 Created`:**
```json
{
    "success": true,
    "data": {
        "reference_number": "ZNC2607000214",
        "consumer_name": "Juan Dela Cruz",
        "account_name": "Juan Dela Cruz",
        "account_number": "12345678",
        "mobile_number": "09171234567",
        "email": "juan@example.com",
        "concern_type": "Clarification of Electric Bill Charges",
        "office": "Main Office",
        "appointment_date": "2026-07-21",
        "start_time": "09:00:00",
        "end_time": "09:30:00",
        "status": "pending",
        "created_at": "2026-06-20T10:30:00+08:00"
    }
}
```

**Response `409 Conflict` (double booking):**
```json
{
    "success": false,
    "error": {
        "code": "SLOT_FULL",
        "message": "This time slot is no longer available. Please select a different time."
    }
}
```

**Response `422 Unprocessable Entity`:**
```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "The given data was invalid.",
        "details": {
            "mobile_number": ["The mobile number format is invalid."],
            "account_number": ["The account number field is required."]
        }
    }
}
```

### 1.2 Get Office List

Returns all active offices.

```
GET /offices
```

**Response `200 OK`:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Main Office",
            "code": "MAIN",
            "address": "Poblacion, Dipolog City",
            "opening_time": "08:00:00",
            "closing_time": "17:00:00"
        },
        {
            "id": 2,
            "name": "Sindangan Area Services",
            "code": "SAS",
            "address": "Sindangan, Zamboanga del Norte",
            "opening_time": "08:00:00",
            "closing_time": "17:00:00"
        }
    ]
}
```

### 1.3 Get Concern Types

Returns all active concern types.

```
GET /concern-types
```

**Response `200 OK`:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Clarification of Electric Bill Charges",
            "code": "BILL_CLARIFICATION",
            "description": "Questions regarding electric bill charges...",
            "estimated_duration_minutes": 30
        },
        {
            "id": 2,
            "name": "Report Account Concern",
            "code": "ACCOUNT_CONCERN",
            "description": "Reporting account-related issues...",
            "estimated_duration_minutes": 30
        }
    ]
}
```

### 1.4 Get Available Time Slots

Returns available time slots for a specific office and date. Slots are generated for the next 30 days.

```
GET /offices/{office_id}/slots?date=2026-07-21
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | Yes | Date in YYYY-MM-DD format |

**Response `200 OK`:**
```json
{
    "success": true,
    "data": {
        "date": "2026-07-21",
        "office_id": 1,
        "office_name": "Main Office",
        "is_working_day": true,
        "slots": [
            {
                "start_time": "08:00:00",
                "end_time": "08:30:00",
                "available": true
            },
            {
                "start_time": "08:30:00",
                "end_time": "09:00:00",
                "available": false
            },
            {
                "start_time": "09:00:00",
                "end_time": "09:30:00",
                "available": true
            }
        ]
    }
}
```

### 1.5 View Appointment

Looks up an appointment by reference number.

```
GET /appointments/{reference_number}
```

**Response `200 OK`:**
```json
{
    "success": true,
    "data": {
        "reference_number": "ZNC2607000214",
        "consumer_name": "Juan Dela Cruz",
        "account_name": "Juan Dela Cruz",
        "account_number": "12345678",
        "mobile_number": "09171234567",
        "email": "juan@example.com",
        "concern_type": "Clarification of Electric Bill Charges",
        "office": "Main Office",
        "office_address": "Poblacion, Dipolog City",
        "appointment_date": "2026-07-21",
        "start_time": "09:00:00",
        "end_time": "09:30:00",
        "status": "confirmed",
        "created_at": "2026-06-20T10:30:00+08:00"
    }
}
```

**Response `404 Not Found`:**
```json
{
    "success": false,
    "error": {
        "code": "NOT_FOUND",
        "message": "Appointment not found. Please check your reference number."
    }
}
```

### 1.6 Reschedule Appointment

Allows a consumer to reschedule their appointment. Identity verified via mobile number.

```
PUT /appointments/{reference_number}/reschedule
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mobile_number` | string | Yes | Registered mobile number (for verification) |
| `new_date` | string | Yes | New date in YYYY-MM-DD |
| `new_start_time` | string | Yes | New time in HH:MM:SS |

**Response `200 OK`:**
```json
{
    "success": true,
    "data": {
        "reference_number": "ZNC2607000214",
        "previous_date": "2026-07-21",
        "previous_time": "09:00:00",
        "new_date": "2026-07-25",
        "new_time": "10:00:00",
        "status": "rescheduled",
        "message": "Appointment rescheduled successfully."
    }
}
```

### 1.7 Cancel Appointment

Allows a consumer to cancel their appointment. Identity verified via mobile number.

```
PUT /appointments/{reference_number}/cancel
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mobile_number` | string | Yes | Registered mobile number (for verification) |

**Response `200 OK`:**
```json
{
    "success": true,
    "data": {
        "reference_number": "ZNC2607000214",
        "status": "cancelled",
        "cancelled_at": "2026-06-25T14:30:00+08:00",
        "message": "Appointment cancelled successfully."
    }
}
```

---

## 2. Authentication Endpoints (Admin)

### 2.1 Login

```
POST /auth/login
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Admin email |
| `password` | string | Yes | Admin password |

**Response `200 OK`:**
```json
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIs...",
        "refresh_token": "zaneco_rf_a1b2c3d4...",
        "expires_in": 3600,
        "user": {
            "id": 1,
            "email": "admin@zaneco.ph",
            "full_name": "System Administrator",
            "role": "super_admin",
            "office_id": null
        }
    }
}
```

### 2.2 Refresh Token

```
POST /auth/refresh
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refresh_token` | string | Yes | Refresh token from login |

### 2.3 Logout

```
POST /auth/logout
```

**Headers:** `Authorization: Bearer <token>`

---

## 3. Admin Endpoints (🔒 Auth Required)

### 3.1 List Appointments

```
GET /admin/appointments
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (pending, confirmed, rescheduled, cancelled, completed, no_show) |
| `office_id` | integer | Filter by office |
| `concern_type_id` | integer | Filter by concern type |
| `date_from` | string | Start date (YYYY-MM-DD) |
| `date_to` | string | End date (YYYY-MM-DD) |
| `search` | string | Search across reference number, account number, consumer name, mobile number |
| `page` | integer | Page number (default: 1) |
| `per_page` | integer | Items per page (default: 20, max: 100) |
| `sort_by` | string | Sort field (default: created_at) |
| `sort_order` | string | Sort direction: asc or desc (default: desc) |

**Response `200 OK`:**
```json
{
    "success": true,
    "data": {
        "appointments": [
            {
                "id": 1,
                "reference_number": "ZNC2607000214",
                "consumer_name": "Juan Dela Cruz",
                "account_number": "12345678",
                "concern_type": "Clarification of Electric Bill Charges",
                "office": "Main Office",
                "appointment_date": "2026-07-21",
                "start_time": "09:00:00",
                "end_time": "09:30:00",
                "status": "confirmed",
                "created_at": "2026-06-20T10:30:00+08:00"
            }
        ],
        "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total": 150,
            "last_page": 8
        }
    }
}
```

### 3.2 Get Appointment Detail

```
GET /admin/appointments/{id}
```

**Response `200 OK`:** Includes full details, admin notes, audit trail, and notification history.

### 3.3 Update Appointment Status

```
PUT /admin/appointments/{id}/status
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | New status: confirmed, completed, cancelled, no_show |
| `notes` | string | No | Admin notes for this change |

### 3.4 Admin Reschedule Appointment

```
PUT /admin/appointments/{id}/reschedule
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `new_appointment_date` | string | Yes | New date (YYYY-MM-DD) |
| `new_start_time` | string | Yes | New time (HH:MM:SS) |
| `notes` | string | No | Reason for reschedule |

### 3.5 List Offices

```
GET /admin/offices
```

### 3.6 Create Office

```
POST /admin/offices
```

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | - | Office display name |
| `code` | string | Yes | - | Unique office code (e.g., MAIN) |
| `address` | string | No | null | Physical address |
| `phone` | string | No | null | Contact number |
| `email` | string | No | null | Office email |
| `opening_time` | string | No | 08:00:00 | Opening time |
| `closing_time` | string | No | 17:00:00 | Closing time |
| `slot_capacity` | integer | No | 2 | Max appointments per time slot |
| `appointment_duration_minutes` | integer | No | 30 | Duration in minutes |
| `max_advance_days` | integer | No | 30 | Max booking window |
| `is_active` | boolean | No | true | Whether office is accepting bookings |

### 3.7 Update Office

```
PUT /admin/offices/{id}
```

### 3.8 Update Office Schedule

```
PUT /admin/offices/{id}/schedule
```

**Request Body:**
```json
{
    "schedules": [
        {
            "day_of_week": "monday",
            "opening_time": "08:00:00",
            "closing_time": "17:00:00",
            "is_working_day": true
        }
    ]
}
```

### 3.9 Generate Time Slots

```
POST /admin/offices/{id}/generate-slots
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date_from` | string | Yes | Start date |
| `date_to` | string | Yes | End date |

### 3.10 Concern Type Management

```
GET    /admin/concern-types      # List all concern types
POST   /admin/concern-types      # Create new concern type
PUT    /admin/concern-types/{id}  # Update concern type
DELETE /admin/concern-types/{id}  # Soft delete (deactivate)
```

### 3.11 Dashboard Summary

```
GET /admin/dashboard/summary
```

**Response:**
```json
{
    "success": true,
    "data": {
        "total_today": 25,
        "total_week": 145,
        "total_month": 520,
        "pending": 12,
        "confirmed": 180,
        "completed": 280,
        "cancelled": 35,
        "no_show": 13,
        "busiest_hour": "09:00-10:00",
        "busiest_office": "Main Office",
        "weekly_trend": [
            {"date": "2026-07-14", "count": 22},
            {"date": "2026-07-15", "count": 28}
        ]
    }
}
```

### 3.12 Reports

```
GET /admin/reports/appointments-by-office?date_from=2026-07-01&date_to=2026-07-31
GET /admin/reports/appointments-by-concern?date_from=2026-07-01&date_to=2026-07-31
GET /admin/reports/daily?date_from=2026-07-01&date_to=2026-07-31
GET /admin/reports/weekly?date_from=2026-07-01&date_to=2026-07-31
GET /admin/reports/monthly?date_from=2026-01-01&date_to=2026-12-31
GET /admin/reports/summary?date_from=2026-07-01&date_to=2026-07-31
```

### 3.13 Export Reports

```
GET /admin/reports/export?type=by-office&format=pdf&date_from=2026-07-01&date_to=2026-07-31
GET /admin/reports/export?type=by-office&format=excel&date_from=2026-07-01&date_to=2026-07-31
```

### 3.14 Notifications

```
GET  /admin/notifications                    # List notifications
POST /admin/notifications/resend/{id}        # Resend failed notification
```

### 3.15 Audit Logs

```
GET /admin/audit-logs?appointment_id=1&admin_id=1&action=STATUS_CHANGED
```

---

## 4. Error Codes

| HTTP Code | Error Code | Description |
|-----------|------------|-------------|
| 400 | BAD_REQUEST | Malformed request |
| 401 | UNAUTHORIZED | Missing/invalid token |
| 401 | TOKEN_EXPIRED | Token has expired |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate or slot full |
| 422 | VALIDATION_ERROR | Invalid input |
| 429 | RATE_LIMITED | Too many requests |
| 500 | SERVER_ERROR | Internal error |

---

## 5. Standard Response Envelope

**Success:**
```json
{
    "success": true,
    "data": { ... },
    "message": "Optional message"
}
```

**Error:**
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Human-readable message",
        "details": {}
    }
}
```

## 6. Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Public endpoints (per IP) | 100 requests | 1 minute |
| Authenticated endpoints (per user) | 500 requests | 1 minute |
| Appointment creation (per IP) | 10 requests | 1 minute |
| Login attempts (per IP) | 5 attempts | 1 minute |

Rate limit headers included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1624200000
```
