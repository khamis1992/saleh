-- ============================================================
-- Phase 3 Seed Data
-- ============================================================

-- ============================================================
-- 1. BUILDINGS & FLOORS
-- ============================================================
INSERT INTO buildings (company_id, property_id, building_code, building_name, number_of_floors, number_of_units, parking_spaces, elevator_count, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'BLD-001', 'المبنى A', 5, 10, 20, 2, 'active'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000002', 'BLD-002', 'البرج التجاري', 12, 20, 50, 4, 'active'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000003', 'BLD-003', 'مجمع الفلل', 2, 10, 10, 0, 'active');

INSERT INTO floors (company_id, building_id, floor_number, description, number_of_units) VALUES
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM buildings WHERE building_code='BLD-001'), '1', 'الطابق الأرضي - محلات', 2),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM buildings WHERE building_code='BLD-001'), '2', 'الطابق الأول - شقق', 4),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM buildings WHERE building_code='BLD-001'), '3', 'الطابق الثاني - شقق', 4);

-- ============================================================
-- 2. EQUIPMENT (6 items)
-- ============================================================
INSERT INTO equipment (company_id, equipment_code, equipment_name, category, serial_number, purchase_date, purchase_cost, current_value, current_location, condition, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'EQP-001', 'حفار كاتربيلر 320', 'excavator', 'CAT320-2023-001', '2023-06-15', 850000, 650000, 'موقع عمارة النخيل', 'جيدة', 'assigned'),
('c0000000-0000-0000-0000-000000000001', 'EQP-002', 'مولد كهرباء 500KVA', 'generator', 'GEN500-2024-001', '2024-01-20', 350000, 300000, 'موقع أبراج السلام', 'ممتازة', 'assigned'),
('c0000000-0000-0000-0000-000000000001', 'EQP-003', 'رافعة برجية 10 طن', 'crane', 'CRN10-2024-001', '2024-03-10', 1200000, 1100000, 'موقع أبراج السلام', 'ممتازة', 'assigned'),
('c0000000-0000-0000-0000-000000000001', 'EQP-004', 'شاحنة نقل 10 طن', 'vehicle', 'TRK10-2022-001', '2022-09-01', 180000, 120000, 'المستودع الرئيسي', 'تحتاج صيانة', 'under_maintenance'),
('c0000000-0000-0000-0000-000000000001', 'EQP-005', 'ضاغط هواء صناعي', 'compressor', 'CMP-2023-001', '2023-11-15', 45000, 35000, 'المستودع الرئيسي', 'جيدة', 'available'),
('c0000000-0000-0000-0000-000000000001', 'EQP-006', 'معدات سلامة - مجموعة كاملة', 'safety_equipment', 'SAF-2024-001', '2024-02-01', 25000, 20000, 'موقع فلل الياسمين', 'جيدة', 'assigned');

-- ============================================================
-- 3. WORK ORDERS (6)
-- ============================================================
INSERT INTO work_orders (company_id, work_order_number, maintenance_request_id, scheduled_date, labor_cost, material_cost, total_cost, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'WO-001', (SELECT id FROM maintenance_requests WHERE request_number='MNT-001'), '2025-06-01', 500, 1200, 1700, 'in_progress'),
('c0000000-0000-0000-0000-000000000001', 'WO-002', (SELECT id FROM maintenance_requests WHERE request_number='MNT-004'), '2025-06-02', 300, 800, 1100, 'in_progress'),
('c0000000-0000-0000-0000-000000000001', 'WO-003', (SELECT id FROM maintenance_requests WHERE request_number='MNT-005'), '2025-05-28', 200, 150, 350, 'completed'),
('c0000000-0000-0000-0000-000000000001', 'WO-004', (SELECT id FROM maintenance_requests WHERE request_number='MNT-006'), '2025-06-03', 1000, 2500, 3500, 'assigned'),
('c0000000-0000-0000-0000-000000000001', 'WO-005', (SELECT id FROM maintenance_requests WHERE request_number='MNT-007'), '2025-06-01', 1500, 3000, 4500, 'waiting_parts'),
('c0000000-0000-0000-0000-000000000001', 'WO-006', (SELECT id FROM maintenance_requests WHERE request_number='MNT-008'), '2025-05-20', 100, 50, 150, 'closed');

-- ============================================================
-- 4. PREVENTIVE MAINTENANCE SCHEDULES (6)
-- ============================================================
INSERT INTO preventive_maintenance_schedules (company_id, property_id, asset_name, category, frequency, next_due_date, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'مصعد المبنى A', 'elevator', 'monthly', '2025-06-15', 'active'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'نظام إنذار الحريق', 'fire_alarm', 'quarterly', '2025-07-01', 'active'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000002', 'أنظمة التكييف المركزية', 'ac', 'monthly', '2025-06-10', 'active'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000002', 'مضخات المياه', 'water_pumps', 'quarterly', '2025-08-01', 'active'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000003', 'كاميرات المراقبة', 'cctv', 'monthly', '2025-06-20', 'active'),
('c0000000-0000-0000-0000-000000000001', 'r0000000-0000-0000-0000-000000000001', 'مكافحة الحشرات', 'pest_control', 'quarterly', '2025-09-01', 'active');

-- ============================================================
-- 5. COST CENTERS (8)
-- ============================================================
INSERT INTO cost_centers (company_id, cost_center_code, cost_center_name, type, linked_project_id, linked_property_id, linked_department_id, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'CC-001', 'مشروع عمارة النخيل', 'project', 'p0000000-0000-0000-0000-000000000001', NULL, NULL, 'active'),
('c0000000-0000-0000-0000-000000000001', 'CC-002', 'مشروع أبراج السلام', 'project', 'p0000000-0000-0000-0000-000000000002', NULL, NULL, 'active'),
('c0000000-0000-0000-0000-000000000001', 'CC-003', 'مشروع فلل الياسمين', 'project', 'p0000000-0000-0000-0000-000000000003', NULL, NULL, 'active'),
('c0000000-0000-0000-0000-000000000001', 'CC-004', 'عقار عمارة النخيل', 'property', NULL, 'r0000000-0000-0000-0000-000000000001', NULL, 'active'),
('c0000000-0000-0000-0000-000000000001', 'CC-005', 'عقار أبراج السلام', 'property', NULL, 'r0000000-0000-0000-0000-000000000002', NULL, 'active'),
('c0000000-0000-0000-0000-000000000001', 'CC-006', 'قسم المشاريع', 'department', NULL, NULL, 'd0000000-0000-0000-0000-000000000002', 'active'),
('c0000000-0000-0000-0000-000000000001', 'CC-007', 'قسم المالية', 'department', NULL, NULL, 'd0000000-0000-0000-0000-000000000004', 'active'),
('c0000000-0000-0000-0000-000000000001', 'CC-008', 'الإدارة العامة', 'department', NULL, NULL, 'd0000000-0000-0000-0000-000000000001', 'active');

-- ============================================================
-- 6. BANK ACCOUNTS (3)
-- ============================================================
INSERT INTO bank_accounts (company_id, bank_name, account_name, account_number, iban, currency, opening_balance, current_balance, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'مصرف الراجحي', 'الحساب الجاري الرئيسي', '608010167519', 'SA0380000000608010167519', 'SAR', 5000000, 3200000, 'active'),
('c0000000-0000-0000-0000-000000000001', 'البنك الأهلي السعودي', 'حساب المشاريع', '123456789001', 'SA0310000000123456789001', 'SAR', 3000000, 1800000, 'active'),
('c0000000-0000-0000-0000-000000000001', 'بنك الرياض', 'حساب الاستثمار', '555666777001', 'SA0330000000555666777001', 'SAR', 2000000, 2500000, 'active');

-- ============================================================
-- 7. CHEQUES (5)
-- ============================================================
INSERT INTO cheques (company_id, cheque_number, bank_name, cheque_date, amount, tenant_id, contract_id, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'CHQ-500123', 'الراجحي', '2025-04-01', 15500, (SELECT id FROM tenants WHERE tenant_code='TNT-006'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-006'), 'cleared'),
('c0000000-0000-0000-0000-000000000001', 'CHQ-500124', 'الأهلي', '2025-05-15', 5000, (SELECT id FROM tenants WHERE tenant_code='TNT-001'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), 'deposited'),
('c0000000-0000-0000-0000-000000000001', 'CHQ-500125', 'الرياض', '2025-06-01', 5200, (SELECT id FROM tenants WHERE tenant_code='TNT-002'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-002'), 'received'),
('c0000000-0000-0000-0000-000000000001', 'CHQ-500126', 'الراجحي', '2025-05-01', 4800, (SELECT id FROM tenants WHERE tenant_code='TNT-002'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-002'), 'bounced'),
('c0000000-0000-0000-0000-000000000001', 'CHQ-500127', 'الأهلي', '2025-06-15', 10000, (SELECT id FROM tenants WHERE tenant_code='TNT-005'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-004'), 'received');

-- ============================================================
-- 8. LEGAL NOTICES (4)
-- ============================================================
INSERT INTO legal_notices (company_id, notice_number, tenant_id, contract_id, unit_id, notice_type, due_amount, notice_date, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'LGL-001', (SELECT id FROM tenants WHERE tenant_code='TNT-002'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-002'), (SELECT id FROM units WHERE unit_code='UNIT-002'), 'first_warning', 5000, '2025-05-01', 'sent'),
('c0000000-0000-0000-0000-000000000001', 'LGL-002', (SELECT id FROM tenants WHERE tenant_code='TNT-003'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-003'), (SELECT id FROM units WHERE unit_code='UNIT-005'), 'final_warning', 3100, '2025-06-01', 'generated'),
('c0000000-0000-0000-0000-000000000001', 'LGL-003', (SELECT id FROM tenants WHERE tenant_code='TNT-002'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-002'), (SELECT id FROM units WHERE unit_code='UNIT-002'), 'bounced_cheque', 4800, '2025-05-20', 'sent'),
('c0000000-0000-0000-0000-000000000001', 'LGL-004', (SELECT id FROM tenants WHERE tenant_code='TNT-001'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), (SELECT id FROM units WHERE unit_code='UNIT-001'), 'friendly_reminder', 3200, '2025-05-15', 'draft');

-- ============================================================
-- 9. LEGAL CASES (2)
-- ============================================================
INSERT INTO legal_cases (company_id, case_number, tenant_id, contract_id, unit_id, case_type, claim_amount, lawyer_name, court_name, filing_date, hearing_date, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'CASE-001', (SELECT id FROM tenants WHERE tenant_code='TNT-002'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-002'), (SELECT id FROM units WHERE unit_code='UNIT-002'), 'unpaid_rent', 15000, 'مكتب المحامي سعد القحطاني', 'المحكمة العامة بالرياض', '2025-06-15', '2025-07-20', 'filed'),
('c0000000-0000-0000-0000-000000000001', 'CASE-002', (SELECT id FROM tenants WHERE tenant_code='TNT-002'), (SELECT id FROM lease_contracts WHERE contract_number='LSE-002'), (SELECT id FROM units WHERE unit_code='UNIT-002'), 'bounced_cheque', 4800, 'مكتب المحامي سعد القحطاني', 'المحكمة الجزائية', NULL, NULL, 'under_review');

-- ============================================================
-- 10. RENT SCHEDULES (8)
-- ============================================================
INSERT INTO rent_schedules (company_id, contract_id, due_date, period_start, period_end, rent_amount, service_charges, total_due, status) VALUES
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), '2025-01-15', '2025-01-01', '2025-01-31', 5000, 200, 5200, 'paid'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), '2025-02-15', '2025-02-01', '2025-02-28', 5000, 200, 5200, 'paid'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), '2025-03-15', '2025-03-01', '2025-03-31', 5000, 200, 5200, 'paid'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), '2025-04-15', '2025-04-01', '2025-04-30', 5000, 200, 5200, 'paid'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), '2025-05-15', '2025-05-01', '2025-05-31', 5000, 200, 5200, 'partially_paid'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM lease_contracts WHERE contract_number='LSE-001'), '2025-06-15', '2025-06-01', '2025-06-30', 5000, 200, 5200, 'upcoming'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM lease_contracts WHERE contract_number='LSE-002'), '2025-04-15', '2025-04-01', '2025-04-30', 4800, 200, 5000, 'overdue'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM lease_contracts WHERE contract_number='LSE-002'), '2025-05-15', '2025-05-01', '2025-05-31', 4800, 200, 5000, 'due');

-- ============================================================
-- 11. EMPLOYEES (8)
-- ============================================================
INSERT INTO employees (company_id, employee_code, full_name, nationality, phone, email, job_title, department_id, hire_date, salary, allowances, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'EMP-001', 'أحمد محمد العتيبي', 'سعودي', '0501111222', 'ahmed.a@company.com', 'مدير المشاريع', 'd0000000-0000-0000-0000-000000000002', '2023-01-15', 25000, 5000, 'active'),
('c0000000-0000-0000-0000-000000000001', 'EMP-002', 'فهد عبدالله الشمري', 'سعودي', '0502222333', 'fahad@company.com', 'مهندس موقع', 'd0000000-0000-0000-0000-000000000002', '2023-06-01', 18000, 3000, 'active'),
('c0000000-0000-0000-0000-000000000001', 'EMP-003', 'نورة سعد القحطاني', 'سعودية', '0503333444', 'noura@company.com', 'مديرة عقارات', 'd0000000-0000-0000-0000-000000000003', '2023-03-01', 22000, 4000, 'active'),
('c0000000-0000-0000-0000-000000000001', 'EMP-004', 'سلمان عبدالعزيز', 'سعودي', '0504444555', 'salman@company.com', 'محاسب', 'd0000000-0000-0000-0000-000000000004', '2024-01-10', 15000, 2500, 'active'),
('c0000000-0000-0000-0000-000000000001', 'EMP-005', 'بندر تركي المطيري', 'سعودي', '0505555666', 'bandar@company.com', 'مدير صيانة', 'd0000000-0000-0000-0000-000000000005', '2023-09-15', 17000, 3000, 'active'),
('c0000000-0000-0000-0000-000000000001', 'EMP-006', 'هند خالد الرشيد', 'سعودية', '0506666777', 'hind@company.com', 'مسؤولة مشتريات', 'd0000000-0000-0000-0000-000000000006', '2024-04-01', 14000, 2000, 'active'),
('c0000000-0000-0000-0000-000000000001', 'EMP-007', 'راكان فهد الدوسري', 'سعودي', '0507777888', 'rakan@company.com', 'فني صيانة', 'd0000000-0000-0000-0000-000000000005', '2024-02-01', 8000, 1500, 'active'),
('c0000000-0000-0000-0000-000000000001', 'EMP-008', 'منال عبدالرحمن', 'سعودية', '0508888999', 'manal@company.com', 'موظفة موارد بشرية', 'd0000000-0000-0000-0000-000000000001', '2024-06-01', 10000, 1500, 'active');

-- ============================================================
-- 12. ATTENDANCE (8 records)
-- ============================================================
INSERT INTO attendance (company_id, employee_id, attendance_date, check_in, check_out, hours_worked, late_minutes, status) VALUES
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM employees WHERE employee_code='EMP-001'), '2025-06-01', '08:00', '17:00', 9, 0, 'present'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM employees WHERE employee_code='EMP-001'), '2025-06-02', '08:15', '17:00', 8.75, 15, 'late'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM employees WHERE employee_code='EMP-002'), '2025-06-01', '07:45', '17:00', 9.25, 0, 'present'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM employees WHERE employee_code='EMP-003'), '2025-06-01', '08:00', '16:30', 8.5, 0, 'present'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM employees WHERE employee_code='EMP-004'), '2025-06-01', '08:00', '17:00', 9, 0, 'present'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM employees WHERE employee_code='EMP-005'), '2025-06-01', '08:30', '17:00', 8.5, 30, 'late'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM employees WHERE employee_code='EMP-006'), '2025-06-03', NULL, NULL, 0, 0, 'absent'),
('c0000000-0000-0000-0000-000000000001', (SELECT id FROM employees WHERE employee_code='EMP-007'), '2025-06-01', '07:00', '15:00', 8, 0, 'present');

-- ============================================================
-- 13. PAYROLL (4 records)
-- ============================================================
INSERT INTO payroll (company_id, payroll_month, employee_id, basic_salary, allowances, overtime_pay, deductions, net_salary, status) VALUES
('c0000000-0000-0000-0000-000000000001', '2025-05', (SELECT id FROM employees WHERE employee_code='EMP-001'), 25000, 5000, 0, 0, 30000, 'paid'),
('c0000000-0000-0000-0000-000000000001', '2025-05', (SELECT id FROM employees WHERE employee_code='EMP-002'), 18000, 3000, 500, 0, 21500, 'paid'),
('c0000000-0000-0000-0000-000000000001', '2025-06', (SELECT id FROM employees WHERE employee_code='EMP-001'), 25000, 5000, 0, 0, 30000, 'approved'),
('c0000000-0000-0000-0000-000000000001', '2025-06', (SELECT id FROM employees WHERE employee_code='EMP-003'), 22000, 4000, 0, 0, 26000, 'draft');
