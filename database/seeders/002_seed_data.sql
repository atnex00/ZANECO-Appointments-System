-- =============================================
-- ZANECO Appointment Scheduling System
-- Seed Data
-- =============================================

-- Seed concern types
INSERT INTO concern_types (name, code, description, sort_order) VALUES
    ('Clarification of Electric Bill Charges', 'BILL_CLARIFICATION', 'Questions and clarifications regarding electric bill charges, meter readings, and billing calculations.', 1),
    ('Report Account Concern', 'ACCOUNT_CONCERN', 'Reporting issues related to customer accounts, service connections, and account discrepancies.', 2);

-- Seed offices
INSERT INTO offices (name, code, address, phone, email, slot_capacity) VALUES
    ('Main Office', 'MAIN', 'Poblacion, Dipolog City', '065-212-3456', 'main@zaneco.ph', 3),
    ('Sindangan Area Services', 'SAS', 'Sindangan, Zamboanga del Norte', '065-213-4567', 'aso1@zaneco.ph', 2),
    ('Liloy Area Services', 'LAS', 'Liloy, Zamboanga del Norte', '065-214-5678', 'aso2@zaneco.ph', 2),
    ('Piñan Area Services', 'PAS', 'Piñan, Zamboanga del Norte', '065-215-6789', 'aso3@zaneco.ph', 2),
    ('Dipolog Area Services', 'DAS', 'Minaog, Dipolog City, Zamboanga del Norte', '065-216-7890', 'aso4@zaneco.ph', 2);

-- Seed office schedules (Mon-Fri working days)
INSERT INTO office_schedules (office_id, day_of_week, opening_time, closing_time, is_working_day)
SELECT o.id, d.day, '08:00:00'::TIME, '17:00:00'::TIME, TRUE
FROM offices o
CROSS JOIN (
    VALUES ('monday'::day_of_week), ('tuesday'::day_of_week), ('wednesday'::day_of_week),
           ('thursday'::day_of_week), ('friday'::day_of_week)
) AS d(day);

-- Seed admin accounts
-- Password: Admin@123 (bcrypt hash - MUST update in production)
INSERT INTO administrators (email, password_hash, full_name, role) VALUES
    ('admin@zaneco.ph', '$2y$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5jqJ5kJ5q5jqJ5kJ5q5jqJ5q', 'System Administrator', 'super_admin'),
    ('manager.main@zaneco.ph', '$2y$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5jqJ5kJ5q5jqJ5kJ5q5jqJ5q', 'Main Office Manager', 'office_manager'),
    ('manager.aso1@zaneco.ph', '$2y$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5jqJ5kJ5q5jqJ5kJ5q5jqJ5q', 'SAS Manager', 'office_manager'),
    ('manager.aso2@zaneco.ph', '$2y$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5jqJ5kJ5q5jqJ5kJ5q5jqJ5q', 'LAS Manager', 'office_manager'),
    ('manager.aso3@zaneco.ph', '$2y$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5jqJ5kJ5q5jqJ5kJ5q5jqJ5q', 'PAS Manager', 'office_manager'),
    ('manager.aso4@zaneco.ph', '$2y$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5jqJ5kJ5q5jqJ5kJ5q5jqJ5q', 'DAS Manager', 'office_manager'),
    ('staff.main@zaneco.ph', '$2y$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5jqJ5kJ5q5jqJ5kJ5q5jqJ5q', 'Main Office Staff', 'staff');

-- Assign office managers to their respective offices
UPDATE administrators SET office_id = (SELECT id FROM offices WHERE code = 'MAIN') WHERE email = 'manager.main@zaneco.ph';
UPDATE administrators SET office_id = (SELECT id FROM offices WHERE code = 'SAS') WHERE email = 'manager.aso1@zaneco.ph';
UPDATE administrators SET office_id = (SELECT id FROM offices WHERE code = 'LAS') WHERE email = 'manager.aso2@zaneco.ph';
UPDATE administrators SET office_id = (SELECT id FROM offices WHERE code = 'PAS') WHERE email = 'manager.aso3@zaneco.ph';
UPDATE administrators SET office_id = (SELECT id FROM offices WHERE code = 'DAS') WHERE email = 'manager.aso4@zaneco.ph';
UPDATE administrators SET office_id = (SELECT id FROM offices WHERE code = 'MAIN') WHERE email = 'staff.main@zaneco.ph';

-- Generate time slots for the next 30 days for all offices
INSERT INTO time_slots (office_id, slot_date, start_time, end_time, max_capacity)
SELECT
    o.id AS office_id,
    d.slot_date,
    t.start_time,
    t.start_time + (o.appointment_duration_minutes || ' minutes')::INTERVAL AS end_time,
    o.slot_capacity AS max_capacity
FROM offices o
CROSS JOIN (
    SELECT CURRENT_DATE + generate_series(0, 29) AS slot_date
) d
CROSS JOIN (
    SELECT generate_series(
        '08:00:00'::TIME,
        '16:30:00'::TIME,
        '30 minutes'::INTERVAL
    ) AS start_time
) t
WHERE o.is_active = TRUE
  AND EXISTS (
      SELECT 1 FROM office_schedules os
      WHERE os.office_id = o.id
        AND os.day_of_week = LOWER(TO_CHAR(d.slot_date, 'Day'))::day_of_week
        AND os.is_working_day = TRUE
  )
  AND d.slot_date >= CURRENT_DATE
  AND d.slot_date <= CURRENT_DATE + INTERVAL '29 days'
ON CONFLICT (office_id, slot_date, start_time) DO NOTHING;
