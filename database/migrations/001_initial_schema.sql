-- =============================================
-- ZANECO Appointment Scheduling System
-- Database: zaneco_appointments
-- PostgreSQL 15+
-- Migration: V1.0.0 - Initial Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUM Types
-- =============================================
CREATE TYPE appointment_status AS ENUM (
    'pending',
    'confirmed',
    'rescheduled',
    'cancelled',
    'completed',
    'no_show'
);

CREATE TYPE day_of_week AS ENUM (
    'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday'
);

CREATE TYPE admin_role AS ENUM (
    'super_admin',
    'office_manager',
    'staff'
);

CREATE TYPE notification_channel AS ENUM (
    'sms',
    'email'
);

CREATE TYPE notification_type AS ENUM (
    'confirmation',
    'reminder',
    'rescheduled',
    'cancelled'
);

CREATE TYPE notification_status AS ENUM (
    'pending',
    'sent',
    'failed',
    'retrying'
);

-- =============================================
-- Table: offices
-- =============================================
CREATE TABLE offices (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    opening_time TIME NOT NULL DEFAULT '08:00:00',
    closing_time TIME NOT NULL DEFAULT '17:00:00',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    slot_capacity INTEGER NOT NULL DEFAULT 2,
    appointment_duration_minutes INTEGER NOT NULL DEFAULT 30,
    max_advance_days INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================
-- Table: office_schedules
-- =============================================
CREATE TABLE office_schedules (
    id BIGSERIAL PRIMARY KEY,
    office_id BIGINT NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL,
    is_working_day BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(office_id, day_of_week)
);

-- =============================================
-- Table: time_slots
-- =============================================
CREATE TABLE time_slots (
    id BIGSERIAL PRIMARY KEY,
    office_id BIGINT NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_capacity INTEGER NOT NULL DEFAULT 2,
    booked_count INTEGER NOT NULL DEFAULT 0,
    is_available BOOLEAN GENERATED ALWAYS AS (booked_count < max_capacity) STORED,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(office_id, slot_date, start_time)
);

-- =============================================
-- Table: concern_types
-- =============================================
CREATE TABLE concern_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    estimated_duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================
-- Table: administrators
-- =============================================
CREATE TABLE administrators (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role admin_role NOT NULL DEFAULT 'staff',
    office_id BIGINT REFERENCES offices(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================
-- Table: appointments
-- =============================================
CREATE SEQUENCE appointment_seq START 1 INCREMENT 1;

CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    reference_number VARCHAR(20) NOT NULL UNIQUE,
    consumer_name VARCHAR(150) NOT NULL,
    account_name VARCHAR(150) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    concern_type_id BIGINT NOT NULL REFERENCES concern_types(id),
    office_id BIGINT NOT NULL REFERENCES offices(id),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status appointment_status NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    reschedule_count INTEGER NOT NULL DEFAULT 0,
    rescheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    processed_by BIGINT REFERENCES administrators(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================
-- Table: notifications
-- =============================================
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    type notification_type NOT NULL,
    recipient VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    status notification_status NOT NULL DEFAULT 'pending',
    retry_count INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================
-- Table: audit_logs
-- =============================================
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
    admin_id BIGINT REFERENCES administrators(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_appointments_reference_number ON appointments(reference_number);
CREATE INDEX idx_appointments_account_number ON appointments(account_number);
CREATE INDEX idx_appointments_consumer_name ON appointments(consumer_name);
CREATE INDEX idx_appointments_mobile_number ON appointments(mobile_number);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_office_date ON appointments(office_id, appointment_date);
CREATE INDEX idx_appointments_office_status_date ON appointments(office_id, status, appointment_date);
CREATE INDEX idx_time_slots_office_date ON time_slots(office_id, slot_date);
CREATE INDEX idx_notifications_appointment ON notifications(appointment_id);
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status IN ('pending', 'retrying');
CREATE INDEX idx_audit_logs_appointment ON audit_logs(appointment_id);
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_administrators_email ON administrators(email);

-- =============================================
-- Functions and Triggers
-- =============================================

-- Generate reference number
CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS TRIGGER AS $$
DECLARE
    prefix VARCHAR(4) := 'ZNC';
    year_part VARCHAR(2) := TO_CHAR(NOW(), 'YY');
    month_part VARCHAR(2) := TO_CHAR(NOW(), 'MM');
    seq_part VARCHAR(6);
BEGIN
    seq_part := LPAD(NEXTVAL('appointment_seq')::TEXT, 6, '0');
    NEW.reference_number := prefix || year_part || month_part || seq_part;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_reference_number
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION generate_reference_number();

-- Increment booked count on new appointment
CREATE OR REPLACE FUNCTION increment_slot_booked_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE time_slots
    SET booked_count = booked_count + 1,
        updated_at = NOW()
    WHERE office_id = NEW.office_id
      AND slot_date = NEW.appointment_date
      AND start_time = NEW.start_time;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_slot_count
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION increment_slot_booked_count();

-- Decrement booked count on cancellation/no-show
CREATE OR REPLACE FUNCTION decrement_slot_booked_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('cancelled', 'no_show') AND OLD.status NOT IN ('cancelled', 'no_show') THEN
        UPDATE time_slots
        SET booked_count = GREATEST(booked_count - 1, 0),
            updated_at = NOW()
        WHERE office_id = NEW.office_id
          AND slot_date = NEW.appointment_date
          AND start_time = NEW.start_time;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrement_slot_count
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION decrement_slot_booked_count();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_offices_updated_at
    BEFORE UPDATE ON offices FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_office_schedules_updated_at
    BEFORE UPDATE ON office_schedules FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_time_slots_updated_at
    BEFORE UPDATE ON time_slots FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_concern_types_updated_at
    BEFORE UPDATE ON concern_types FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_administrators_updated_at
    BEFORE UPDATE ON administrators FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_timestamp();
