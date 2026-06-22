# Entity Relationship Diagram (ERD)

## ZANECO Consumer Appointment Scheduling System

```mermaid
erDiagram
    offices ||--o{ appointments : "has"
    offices ||--o{ office_schedules : "configures"
    offices ||--o{ time_slots : "defines"
    offices ||--o{ administrators : "assigned to"
    concern_types ||--o{ appointments : "categorized by"
    administrators ||--o{ appointments : "manages"
    administrators ||--o{ audit_logs : "creates"
    appointments ||--o{ notifications : "triggers"
    appointments ||--o{ audit_logs : "trails"

    offices {
        bigint id PK
        varchar name UK
        varchar code UK
        varchar address
        varchar phone
        varchar email
        varchar opening_time
        varchar closing_time
        boolean is_active
        integer slot_capacity
        integer appointment_duration_minutes
        integer max_advance_days
        timestamp created_at
        timestamp updated_at
    }

    office_schedules {
        bigint id PK
        bigint office_id FK
        varchar day_of_week
        varchar opening_time
        varchar closing_time
        boolean is_working_day
        timestamp created_at
        timestamp updated_at
    }

    time_slots {
        bigint id PK
        bigint office_id FK
        varchar slot_date
        varchar start_time
        varchar end_time
        integer max_capacity
        integer booked_count
        boolean is_available
        timestamp created_at
        timestamp updated_at
    }

    concern_types {
        bigint id PK
        varchar name
        varchar code UK
        text description
        integer estimated_duration_minutes
        boolean is_active
        integer sort_order
        timestamp created_at
        timestamp updated_at
    }

    appointments {
        bigint id PK
        varchar reference_number UK
        varchar consumer_name
        varchar account_name
        varchar account_number
        varchar mobile_number
        varchar email
        bigint concern_type_id FK
        bigint office_id FK
        varchar appointment_date
        varchar start_time
        varchar end_time
        varchar status
        text admin_notes
        integer reschedule_count
        timestamp rescheduled_at
        timestamp completed_at
        bigint processed_by FK
        timestamp created_at
        timestamp updated_at
    }

    administrators {
        bigint id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar role
        bigint office_id FK
        boolean is_active
        timestamp last_login_at
        integer failed_login_attempts
        timestamp locked_until
        text refresh_token
        timestamp created_at
        timestamp updated_at
    }

    notifications {
        bigint id PK
        bigint appointment_id FK
        varchar channel
        varchar type
        varchar recipient
        text message
        varchar status
        integer retry_count
        timestamp sent_at
        timestamp created_at
    }

    audit_logs {
        bigint id PK
        bigint appointment_id FK
        bigint admin_id FK
        varchar action
        varchar entity_type
        bigint entity_id
        varchar old_values
        varchar new_values
        varchar ip_address
        text user_agent
        timestamp created_at
    }
```

## Table Relationships Summary

| Parent | Child | Type | Foreign Key |
|--------|-------|------|-------------|
| `offices` | `office_schedules` | 1:N | `office_schedules.office_id` |
| `offices` | `time_slots` | 1:N | `time_slots.office_id` |
| `offices` | `appointments` | 1:N | `appointments.office_id` |
| `offices` | `administrators` | 1:N | `administrators.office_id` |
| `concern_types` | `appointments` | 1:N | `appointments.concern_type_id` |
| `administrators` | `appointments` | 1:N | `appointments.processed_by` |
| `administrators` | `audit_logs` | 1:N | `audit_logs.admin_id` |
| `appointments` | `notifications` | 1:N | `notifications.appointment_id` |
| `appointments` | `audit_logs` | 1:N | `audit_logs.appointment_id` |

## Index Strategy

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| appointments | reference_number | UNIQUE B-tree | Lookup by ref number |
| appointments | account_number | B-tree | Search by account |
| appointments | consumer_name | B-tree (gin_trgm) | Fuzzy name search |
| appointments | mobile_number | B-tree | Search by mobile |
| appointments | status | B-tree | Filter by status |
| appointments | appointment_date | B-tree | Date range queries |
| appointments | (office_id, appointment_date) | Composite B-tree | Office daily view |
| appointments | (office_id, status, appointment_date) | Composite B-tree | Office + status + date |
| time_slots | (office_id, slot_date) | Composite B-tree | Daily slot lookup |
| time_slots | (office_id, slot_date) WHERE is_available | Partial index | Available slots |
| notifications | status WHERE pending/retrying | Partial index | Queue processing |

## Key Design Decisions

1. **Generated Column for Availability**: `time_slots.is_available` uses a PostgreSQL generated column to automatically reflect availability based on `booked_count < max_capacity`, eliminating stale data.

2. **Triggers for Slot Count**: Database triggers automatically increment/decrement `time_slots.booked_count` when appointments are created, cancelled, or marked no-show, ensuring consistency.

3. **Reference Number Sequence**: A dedicated sequence (`appointment_seq`) generates sequential numbers, combined with a prefix and date for human-readable reference numbers.

4. **JSONB for Audit Logs**: Using JSONB for old/new values allows flexible storage of entity state changes without schema changes for each entity type.

5. **Partial Indexes**: The notification queue uses a partial index to efficiently query only pending/retrying notifications, reducing index size and improving queue performance.
