import { createStore } from './dataService';
import {
  seedLands, seedProjects, seedContractors, seedProperties,
  seedUnits, seedTenants, seedLeases, seedInvoices, seedReceipts,
  seedMaintenanceRequests,
  seedWarehouses, seedInventoryItems, seedStockTransactions, seedProjectBudgets,
  seedRFQs, seedVendorQuotations,
  seedEmployees, seedAttendance, seedPayroll, seedCostCenters, seedBankAccounts,
  seedEquipment, seedBuildings, seedRentSchedules, seedCheques,
} from './seedData';
import type {
  Land, Project, Contractor, Property, Unit,
  Tenant, LeaseContract, RentalInvoice, Receipt,
  MaintenanceRequest, WorkOrder,
  Warehouse, InventoryItem, StockTransaction, ProjectBudget,
  RFQ, VendorQuotation,
  Equipment, Building, RentSchedule, Cheque,
  Employee, Attendance, Payroll, CostCenter, BankAccount,
  Company, ProjectPhase, Role,
} from '@/types';

export const landStore = createStore<Land>({ key: 'erp_lands', seed: seedLands });
export const projectStore = createStore<Project>({ key: 'erp_projects', seed: seedProjects });
export const contractorStore = createStore<Contractor>({ key: 'erp_contractors', seed: seedContractors });
export const propertyStore = createStore<Property>({ key: 'erp_properties', seed: seedProperties });

// ── Company Store ──
const seedCompany: Company[] = [
  { id: 'comp-1', name_ar: 'شركة التطوير العقاري', name_en: 'Real Estate Development Co.', cr_number: '1010123456', tax_number: '300123456789003', address: 'الرياض - حي المروج - طريق الملك فهد', phone: '+966 11 234 5678', email: 'info@realestate.sa', logo_url: '', currency: 'QAR', fiscal_year_start_month: 1, created_at: '2026-01-01', updated_at: '2026-01-01' },
];
export const companyStore = createStore<Company>({ key: 'erp_company', seed: seedCompany });

// ── Role Store (with permissions) ──
export interface RoleWithPermissions {
  id: string;
  company_id: string;
  name: string;
  name_ar: string;
  description: string;
  is_system_role: boolean;
  permissions: string[];
  created_at: string;
}

const seedRoles: RoleWithPermissions[] = [
  { id: 'role-1', company_id: 'comp-1', name: 'مدير النظام', name_ar: 'Super Admin', description: 'صلاحيات كاملة على النظام', is_system_role: true, permissions: ['*'], created_at: '2026-01-01' },
  { id: 'role-2', company_id: 'comp-1', name: 'مدير المشاريع', name_ar: 'Project Manager', description: 'إدارة المشاريع والمراحل والمقاولين', is_system_role: false, permissions: ['projects.view', 'projects.edit', 'lands.view', 'lands.edit', 'contractors.view', 'contractors.edit', 'construction.view', 'construction.edit', 'daily.view', 'daily.edit', 'budgets.view', 'budgets.edit', 'procurement.view', 'inventory.view'], created_at: '2026-01-01' },
  { id: 'role-3', company_id: 'comp-1', name: 'مدير التأجير', name_ar: 'Leasing Manager', description: 'إدارة العقارات والوحدات والمستأجرين والعقود', is_system_role: false, permissions: ['properties.view', 'properties.edit', 'units.view', 'units.edit', 'tenants.view', 'tenants.edit', 'leases.view', 'leases.edit', 'invoices.view', 'invoices.edit', 'receipts.view', 'receipts.edit', 'schedules.view', 'reports.view'], created_at: '2026-01-01' },
  { id: 'role-4', company_id: 'comp-1', name: 'مدير الصيانة', name_ar: 'Maintenance Manager', description: 'إدارة طلبات الصيانة وأوامر العمل', is_system_role: false, permissions: ['maintenance.view', 'maintenance.edit', 'inspections.view', 'inspections.edit', 'workorders.view', 'workorders.edit', 'preventive.view', 'preventive.edit', 'inventory.view'], created_at: '2026-01-01' },
  { id: 'role-5', company_id: 'comp-1', name: 'مدير المشتريات', name_ar: 'Procurement Manager', description: 'إدارة المشتريات والمخزون والموردين', is_system_role: false, permissions: ['procurement.view', 'procurement.edit', 'inventory.view', 'inventory.edit', 'warehouses.view', 'warehouses.edit', 'equipment.view', 'equipment.edit', 'contractors.view'], created_at: '2026-01-01' },
  { id: 'role-6', company_id: 'comp-1', name: 'مدير الموارد البشرية', name_ar: 'HR Manager', description: 'إدارة الموظفين والرواتب والحضور', is_system_role: false, permissions: ['employees.view', 'employees.edit', 'attendance.view', 'attendance.edit', 'payroll.view', 'payroll.edit', 'leaves.view', 'leaves.edit', 'reports.view'], created_at: '2026-01-01' },
  { id: 'role-7', company_id: 'comp-1', name: 'مدير مالي', name_ar: 'Finance Manager', description: 'إدارة الحسابات والقيود المالية والتقارير', is_system_role: false, permissions: ['finance.view', 'finance.edit', 'accounts.view', 'accounts.edit', 'journal.view', 'journal.edit', 'costcenters.view', 'costcenters.edit', 'banks.view', 'banks.edit', 'cheques.view', 'cheques.edit', 'budgets.view', 'budgets.edit', 'reports.view', 'invoices.view', 'receipts.view', 'dashboard.view'], created_at: '2026-01-01' },
  { id: 'role-8', company_id: 'comp-1', name: 'مهندس مدني', name_ar: 'Civil Engineer', description: 'متابعة الأعمال الإنشائية والتقارير اليومية', is_system_role: false, permissions: ['projects.view', 'construction.view', 'daily.view', 'daily.edit', 'inspections.view', 'inspections.edit', 'inventory.view', 'contractors.view'], created_at: '2026-01-01' },
  { id: 'role-9', company_id: 'comp-1', name: 'محاسب', name_ar: 'Accountant', description: 'إدخال القيود والفواتير والسندات', is_system_role: false, permissions: ['invoices.view', 'invoices.edit', 'receipts.view', 'receipts.edit', 'finance.view', 'journal.view', 'journal.edit', 'accounts.view', 'reports.view', 'cheques.view', 'dashboard.view'], created_at: '2026-01-01' },
];
export const roleStore = createStore<RoleWithPermissions>({ key: 'erp_roles', seed: seedRoles });

// ── Permission Assignment Store (maps user/role → permission overrides) ──
export interface PermissionAssignment {
  id: string;
  user_id: string;
  role_id: string;
  permissions: string[];
}
const seedPermissionAssignments: PermissionAssignment[] = [
  { id: 'perm-1', user_id: 'user-1', role_id: 'role-1', permissions: ['*'] },
];
export const permissionStore = createStore<PermissionAssignment>({ key: 'erp_permission_assignments', seed: seedPermissionAssignments });

// ── Project Phase Store ──
const seedProjectPhases: ProjectPhase[] = [
  // prj-1: مجمع النخيل السكني (3 phases)
  { id: 'phase-1', company_id: 'comp-1', project_id: 'prj-1', phase_name: 'دراسة الجدوى والتصميم', sequence_number: 1, planned_start: '2024-03-01', planned_end: '2024-08-30', actual_start: '2024-03-01', actual_end: '2024-08-15', responsible_user_id: '', contractor_id: '', budget_amount: 650000, actual_cost: 625000, progress_percentage: 100, status: 'completed', notes: 'اكتملت الدراسة والتصميم قبل الموعد المخطط' },
  { id: 'phase-2', company_id: 'comp-1', project_id: 'prj-1', phase_name: 'الأعمال الإنشائية', sequence_number: 2, planned_start: '2024-09-01', planned_end: '2026-06-30', actual_start: '2024-09-01', actual_end: '', responsible_user_id: '', contractor_id: 'cont-1', budget_amount: 8000000, actual_cost: 7200000, progress_percentage: 85, status: 'in_progress', notes: 'تأخر شهر بسبب تأخر مواد الحديد' },
  { id: 'phase-3', company_id: 'comp-1', project_id: 'prj-1', phase_name: 'التشطيبات الداخلية', sequence_number: 3, planned_start: '2026-03-01', planned_end: '2026-10-31', actual_start: '', actual_end: '', responsible_user_id: '', contractor_id: 'cont-4', budget_amount: 3500000, actual_cost: 0, progress_percentage: 30, status: 'not_started', notes: 'بانتظار انتهاء المرحلة الإنشائية' },
  // prj-2: أبراج السلام (3 phases)
  { id: 'phase-4', company_id: 'comp-1', project_id: 'prj-2', phase_name: 'التصميم الهندسي', sequence_number: 1, planned_start: '2024-06-01', planned_end: '2025-01-31', actual_start: '2024-06-01', actual_end: '2025-01-15', responsible_user_id: '', contractor_id: '', budget_amount: 1200000, actual_cost: 1150000, progress_percentage: 100, status: 'completed', notes: '' },
  { id: 'phase-5', company_id: 'comp-1', project_id: 'prj-2', phase_name: 'الهيكل الإنشائي', sequence_number: 2, planned_start: '2025-02-01', planned_end: '2026-12-31', actual_start: '2025-02-01', actual_end: '', responsible_user_id: '', contractor_id: 'cont-1', budget_amount: 12000000, actual_cost: 10500000, progress_percentage: 65, status: 'in_progress', notes: 'تم الانتهاء من الهيكل للبرج A' },
  { id: 'phase-6', company_id: 'comp-1', project_id: 'prj-2', phase_name: 'التشطيبات والواجهات', sequence_number: 3, planned_start: '2026-06-01', planned_end: '2027-06-30', actual_start: '', actual_end: '', responsible_user_id: '', contractor_id: 'cont-4', budget_amount: 5000000, actual_cost: 3150000, progress_percentage: 15, status: 'not_started', notes: 'تبدأ بعد اكتمال الهيكل الإنشائي' },
  // prj-3: فلل الياسمين (3 phases)
  { id: 'phase-7', company_id: 'comp-1', project_id: 'prj-3', phase_name: 'التخطيط والتصميم', sequence_number: 1, planned_start: '2025-01-15', planned_end: '2025-07-15', actual_start: '2025-01-15', actual_end: '2025-06-30', responsible_user_id: '', contractor_id: '', budget_amount: 800000, actual_cost: 750000, progress_percentage: 100, status: 'completed', notes: '' },
  { id: 'phase-8', company_id: 'comp-1', project_id: 'prj-3', phase_name: 'الأعمال الإنشائية', sequence_number: 2, planned_start: '2025-08-01', planned_end: '2027-01-15', actual_start: '2025-08-01', actual_end: '', responsible_user_id: '', contractor_id: 'cont-1', budget_amount: 5000000, actual_cost: 4600000, progress_percentage: 45, status: 'in_progress', notes: 'تم الانتهاء من 4 فلل من أصل 8' },
  { id: 'phase-9', company_id: 'comp-1', project_id: 'prj-3', phase_name: 'التشطيب والتسليم', sequence_number: 3, planned_start: '2027-01-16', planned_end: '2027-03-15', actual_start: '', actual_end: '', responsible_user_id: '', contractor_id: 'cont-4', budget_amount: 2200000, actual_cost: 1850000, progress_percentage: 5, status: 'not_started', notes: '' },
  // prj-4: المركز التجاري (3 phases)
  { id: 'phase-10', company_id: 'comp-1', project_id: 'prj-4', phase_name: 'تجهيز الموقع والأساسات', sequence_number: 1, planned_start: '2024-09-01', planned_end: '2025-03-31', actual_start: '2024-09-01', actual_end: '2025-03-15', responsible_user_id: '', contractor_id: 'cont-1', budget_amount: 5000000, actual_cost: 4800000, progress_percentage: 100, status: 'completed', notes: '' },
  { id: 'phase-11', company_id: 'comp-1', project_id: 'prj-4', phase_name: 'الإنشاءات', sequence_number: 2, planned_start: '2025-04-01', planned_end: '2026-06-30', actual_start: '2025-04-01', actual_end: '', responsible_user_id: '', contractor_id: 'cont-1', budget_amount: 12000000, actual_cost: 13000000, progress_percentage: 95, status: 'delayed', notes: 'تجاوز الميزانية بسبب ارتفاع أسعار المواد' },
  { id: 'phase-12', company_id: 'comp-1', project_id: 'prj-4', phase_name: 'التشطيبات والاختبارات', sequence_number: 3, planned_start: '2026-07-01', planned_end: '2026-09-30', actual_start: '', actual_end: '', responsible_user_id: '', contractor_id: 'cont-4', budget_amount: 4500000, actual_cost: 5700000, progress_percentage: 40, status: 'in_progress', notes: 'جاري الاختبارات النهائية - تأخير في استلام المصاعد' },
];
export const projectPhaseStore = createStore<ProjectPhase>({ key: 'erp_project_phases', seed: seedProjectPhases });
export const unitStore = createStore<Unit>({ key: 'erp_units', seed: seedUnits });
export const tenantStore = createStore<Tenant>({ key: 'erp_tenants', seed: seedTenants });
export const leaseStore = createStore<LeaseContract>({ key: 'erp_leases', seed: seedLeases });
export const invoiceStore = createStore<RentalInvoice>({ key: 'erp_invoices', seed: seedInvoices });
export const receiptStore = createStore<Receipt>({ key: 'erp_receipts', seed: seedReceipts });
export const maintenanceStore = createStore<MaintenanceRequest>({ key: 'erp_maintenance', seed: seedMaintenanceRequests });

// Work Orders store (shared with WorkOrdersPage)
const seedWorkOrders: WorkOrder[] = [
  { id: 'wo-1', company_id: '', work_order_number: 'WO-2026-001', maintenance_request_id: 'mnt-1', technician_id: 'فني أحمد', scheduled_date: '2026-03-10', start_time: '09:00', end_time: '12:00', labor_cost: 500, material_cost: 1200, vendor_cost: 0, total_cost: 1700, diagnosis: 'تلف في صمام المياه الرئيسي', work_done: 'تم استبدال الصمام وإصلاح التسرب', materials_used: 'صمام مياه 2 بوصة، شريط تفلون، وصلات نحاس', status: 'completed', technician_notes: '', tenant_signature_url: '', notes: '' },
  { id: 'wo-2', company_id: '', work_order_number: 'WO-2026-002', maintenance_request_id: 'mnt-2', technician_id: 'فني خالد', scheduled_date: '2026-04-05', start_time: '14:00', end_time: '16:00', labor_cost: 350, material_cost: 0, vendor_cost: 850, total_cost: 1200, diagnosis: 'نقص غاز الفريون في وحدة التكييف', work_done: 'تم تعبئة غاز الفريون وصيانة الوحدة الخارجية', materials_used: 'غاز فريون R410، فلتر هواء', status: 'completed', technician_notes: '', tenant_signature_url: '', notes: '' },
  { id: 'wo-3', company_id: '', work_order_number: 'WO-2026-003', maintenance_request_id: 'mnt-3', technician_id: 'فني سعيد', scheduled_date: '2026-05-20', start_time: '08:00', end_time: '', labor_cost: 800, material_cost: 2500, vendor_cost: 0, total_cost: 3300, diagnosis: 'تماس كهربائي في اللوحة الرئيسية', work_done: 'جاري العمل على إصلاح اللوحة الكهربائية', materials_used: 'قاطع كهرباء 60 أمبير، أسلاك 10مم', status: 'in_progress', technician_notes: '', tenant_signature_url: '', notes: 'بانتظار توصيل القاطع الكهربائي' },
  { id: 'wo-4', company_id: '', work_order_number: 'WO-2026-004', maintenance_request_id: 'mnt-4', technician_id: 'فني محمد', scheduled_date: '2026-02-15', start_time: '09:00', end_time: '11:00', labor_cost: 300, material_cost: 200, vendor_cost: 0, total_cost: 500, diagnosis: 'صيانة دورية روتينية', work_done: 'تم فحص جميع المرافق وإصلاح حنفية المطبخ', materials_used: 'حشية حنفية، شريط تفلون', status: 'tenant_confirmed', technician_notes: '', tenant_signature_url: '', notes: 'تم تأكيد الاستلام من المستأجر' },
  { id: 'wo-5', company_id: '', work_order_number: 'WO-2026-005', maintenance_request_id: 'mnt-1', technician_id: 'فني عبدالله', scheduled_date: '2026-06-01', start_time: '', end_time: '', labor_cost: 400, material_cost: 0, vendor_cost: 0, total_cost: 400, diagnosis: '', work_done: '', materials_used: '', status: 'assigned', technician_notes: '', tenant_signature_url: '', notes: 'طلب متابعة تسرب آخر' },
];
export const workOrderStore = createStore<WorkOrder>({ key: 'erp_work_orders', seed: seedWorkOrders });

// Documents store
export interface StoredDocument {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  uploaded_by: string;
  uploaded_at: string;
  notes: string;
}
const seedDocs: StoredDocument[] = [
  { id: 'doc-1', entity_type: 'land', entity_id: 'land-1', file_name: 'صك ملكية أرض الخالدية', file_type: 'land_deed', file_url: '', uploaded_by: 'محمد العتيبي', uploaded_at: '2024-03-20', notes: '' },
  { id: 'doc-2', entity_type: 'contract', entity_id: 'lse-1', file_name: 'عقد إيجار أحمد العمري', file_type: 'contract', file_url: '', uploaded_by: 'نورة الدوسري', uploaded_at: '2025-01-05', notes: '' },
  { id: 'doc-3', entity_type: 'project', entity_id: 'prj-1', file_name: 'مخطط عمارة النخيل', file_type: 'drawing', file_url: '', uploaded_by: 'خالد العمري', uploaded_at: '2024-05-15', notes: '' },
  { id: 'doc-4', entity_type: 'contractor', entity_id: 'cont-1', file_name: 'عقد مقاول - شركة البناء', file_type: 'contract', file_url: '', uploaded_by: 'سارة القحطاني', uploaded_at: '2024-06-01', notes: '' },
  { id: 'doc-5', entity_type: 'project', entity_id: 'prj-1', file_name: 'تقرير تقدم المشروع - مايو 2026', file_type: 'report', file_url: '', uploaded_by: 'خالد العمري', uploaded_at: '2026-05-30', notes: '' },
];
export const documentStore = createStore<StoredDocument>({ key: 'erp_documents', seed: seedDocs });

// Phase 2 stores
export const warehouseStore = createStore<Warehouse>({ key: 'erp_warehouses', seed: seedWarehouses });
export const inventoryStore = createStore<InventoryItem>({ key: 'erp_inventory', seed: seedInventoryItems });
export const stockTransactionStore = createStore<StockTransaction>({ key: 'erp_stock_transactions', seed: seedStockTransactions });
export const projectBudgetStore = createStore<ProjectBudget>({ key: 'erp_project_budgets', seed: seedProjectBudgets });
export const rfqStore = createStore<RFQ>({ key: 'erp_rfqs', seed: seedRFQs });
export const vendorQuotationStore = createStore<VendorQuotation>({ key: 'erp_quotations', seed: seedVendorQuotations });

// Phase 3 stores
export const employeeStore = createStore<Employee>({ key: 'erp_employees', seed: seedEmployees });
export const attendanceStore = createStore<Attendance>({ key: 'erp_attendance', seed: seedAttendance });
export const payrollStore = createStore<Payroll>({ key: 'erp_payroll', seed: seedPayroll });
export const costCenterStore = createStore<CostCenter>({ key: 'erp_cost_centers', seed: seedCostCenters });
export const bankAccountStore = createStore<BankAccount>({ key: 'erp_bank_accounts', seed: seedBankAccounts });
export const equipmentStore = createStore<Equipment>({ key: 'erp_equipment', seed: seedEquipment });
export const buildingStore = createStore<Building>({ key: 'erp_buildings', seed: seedBuildings });
export const rentScheduleStore = createStore<RentSchedule>({ key: 'erp_rent_schedules', seed: seedRentSchedules });
export const chequeStore = createStore<Cheque>({ key: 'erp_cheques', seed: seedCheques });

// Phase 4: New modules
import { seedLeaveRequests } from '@/pages/hr/LeaveManagementPage';
import type { LeaveRequest } from '@/pages/hr/LeaveManagementPage';
import { seedProjectTasks } from '@/pages/projects/ProjectTasksPage';
import type { ProjectTask } from '@/pages/projects/ProjectTasksPage';
import { seedInspections } from '@/pages/maintenance/InspectionsPage';
import type { Inspection } from '@/pages/maintenance/InspectionsPage';
import { seedChangeOrders } from '@/pages/construction/ChangeOrdersPage';
import type { ChangeOrder } from '@/pages/construction/ChangeOrdersPage';

export const leaveRequestStore = createStore<LeaveRequest>({ key: 'erp_leave_requests', seed: seedLeaveRequests });
export const projectTaskStore = createStore<ProjectTask>({ key: 'erp_project_tasks', seed: seedProjectTasks });
export const inspectionStore = createStore<Inspection>({ key: 'erp_inspections', seed: seedInspections });
export const changeOrderStore = createStore<ChangeOrder>({ key: 'erp_change_orders', seed: seedChangeOrders });

// --- Shared Daily Report Store (single source of truth) ---
import type { ProjectDailyReport } from '@/types';
const seedDailyReports: ProjectDailyReport[] = [
  { id: 'dr-1', company_id: '', report_number: 'DR-2025-001', project_id: 'prj-1', report_date: '2025-01-15', weather_condition: 'مشمس', manpower_count: 45, equipment_on_site: 'حفارين، رافعة، خلاطة خرسانة', work_completed_today: 'صب الخرسانة للطابق الأرضي - تركيب حديد التسليح للطابق الأول', planned_work_tomorrow: 'استكمال صب الطابق الأول - بدء أعمال الطوب', issues_encountered: 'تأخر توريد حديد التسليح ساعتين', safety_incidents: 'لا يوجد', materials_received: 'حديد تسليح 20 طن - أسمنت 500 كيس', delay_reason: '', submitted_by: '', approval_status: 'approved', approved_by: '', approved_at: '2025-01-16', notes: 'سير العمل جيد', created_at: '2025-01-15', updated_at: '2025-01-16', is_active: true },
  { id: 'dr-2', company_id: '', report_number: 'DR-2025-002', project_id: 'prj-1', report_date: '2025-01-16', weather_condition: 'غائم جزئياً', manpower_count: 42, equipment_on_site: 'حفارين - خلاطة - رافعة - مضخة خرسانة', work_completed_today: 'صب الطابق الأول - بدء تركيب الطوب في الطابق الأرضي', planned_work_tomorrow: 'استكمال تركيب الطوب - تجهيز أعمال الكهرباء', issues_encountered: '', safety_incidents: 'لا يوجد', materials_received: 'طوب أحمر 5000 حبة', delay_reason: '', submitted_by: '', approval_status: 'approved', approved_by: '', approved_at: '2025-01-17', notes: '', created_at: '2025-01-16', updated_at: '2025-01-17', is_active: true },
  { id: 'dr-3', company_id: '', report_number: 'DR-2025-003', project_id: 'prj-2', report_date: '2025-05-20', weather_condition: 'مشمس', manpower_count: 60, equipment_on_site: 'رافعتين برجيتين - خلاطة - مضخة - مولد كهرباء', work_completed_today: 'صب الطابق الخامس - تركيب قوالب الطابق السادس', planned_work_tomorrow: 'صب الطابق السادس - بدء تمديدات الكهرباء في الطابق الرابع', issues_encountered: 'عطل بسيط في المضخة - تم الإصلاح خلال ساعة', safety_incidents: 'لا يوجد', materials_received: 'خرسانة جاهزة 200 م³ - حديد تسليح 30 طن', delay_reason: '', submitted_by: '', approval_status: 'submitted', approved_by: '', approved_at: '', notes: 'بانتظار موافقة المهندس', created_at: '2025-05-20', updated_at: '2025-05-20', is_active: true },
  { id: 'dr-4', company_id: '', report_number: 'DR-2025-004', project_id: 'prj-3', report_date: '2025-06-10', weather_condition: 'ممطر - تم إيقاف العمل جزئياً', manpower_count: 25, equipment_on_site: 'حفار - خلاطة صغيرة', work_completed_today: 'أعمال حفر الأساسات - تم إنجاز 60% من الحفر', planned_work_tomorrow: 'استكمال الحفر - تجهيز حديد الأساسات', issues_encountered: 'تأخر العمل بسبب الأمطار - توقف 3 ساعات', safety_incidents: 'لا يوجد', materials_received: '', delay_reason: 'سوء الأحوال الجوية', submitted_by: '', approval_status: 'draft', approved_by: '', approved_at: '', notes: 'مسودة - سيتم إكمالها', created_at: '2025-06-10', updated_at: '2025-06-10', is_active: true },
  { id: 'dr-5', company_id: '', report_number: 'DR-2025-005', project_id: 'prj-1', report_date: '2025-06-15', weather_condition: 'مشمس', manpower_count: 45, equipment_on_site: 'حفارين، رافعة، خلاطة خرسانة', work_completed_today: 'صب أعمدة الطابق الثالث', planned_work_tomorrow: 'فك الشدات واستكمال أعمال الحدادة', issues_encountered: '', safety_incidents: '', materials_received: 'حديد تسليح 16مم - 10 طن', delay_reason: '', submitted_by: '', approval_status: 'approved', approved_by: '', approved_at: '2025-06-15', notes: '', created_at: '2025-06-15', updated_at: '2025-06-15', is_active: true },
  { id: 'dr-6', company_id: '', report_number: 'DR-2025-006', project_id: 'prj-2', report_date: '2025-07-01', weather_condition: 'مشمس', manpower_count: 55, equipment_on_site: 'رافعتين برجيتين، خلاطة، مضخة خرسانة', work_completed_today: 'صب أساسات البرج B', planned_work_tomorrow: 'استكمال أعمال العزل', issues_encountered: '', safety_incidents: 'إصابة طفيفة لعامل - تم إسعافه', materials_received: 'أسمنت - 500 كيس', delay_reason: '', submitted_by: '', approval_status: 'approved', approved_by: '', approved_at: '2025-07-01', notes: '', created_at: '2025-07-01', updated_at: '2025-07-01', is_active: true },
];
export const dailyReportStore = createStore<ProjectDailyReport>({ key: 'erp_daily_reports', seed: seedDailyReports });

// -------------------------------------------
// Finance: Chart of Accounts + Journal Entries
// -------------------------------------------
import type { Account, JournalEntry, JournalEntryLine } from '@/types';

const seedAccounts: Account[] = [
  { id: 'acc-1', company_id: '', account_code: '1000', account_name_ar: 'النقدية', account_name_en: 'Cash', account_type: 'asset', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-2', company_id: '', account_code: '1100', account_name_ar: 'البنوك', account_name_en: 'Banks', account_type: 'asset', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-3', company_id: '', account_code: '1200', account_name_ar: 'ذمم المستأجرين', account_name_en: 'Tenant Receivables', account_type: 'asset', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-4', company_id: '', account_code: '1300', account_name_ar: 'الأراضي', account_name_en: 'Land', account_type: 'asset', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-5', company_id: '', account_code: '1400', account_name_ar: 'مشاريع تحت التنفيذ', account_name_en: 'Projects Under Construction', account_type: 'asset', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-6', company_id: '', account_code: '1500', account_name_ar: 'المباني', account_name_en: 'Buildings', account_type: 'asset', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-7', company_id: '', account_code: '1600', account_name_ar: 'المخزون', account_name_en: 'Inventory', account_type: 'asset', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-8', company_id: '', account_code: '2000', account_name_ar: 'ذمم الموردين', account_name_en: 'Supplier Payables', account_type: 'liability', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-9', company_id: '', account_code: '2100', account_name_ar: 'ذمم المقاولين', account_name_en: 'Contractor Payables', account_type: 'liability', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-10', company_id: '', account_code: '2200', account_name_ar: 'تأمينات المستأجرين', account_name_en: 'Tenant Deposits', account_type: 'liability', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-11', company_id: '', account_code: '3000', account_name_ar: 'رأس المال', account_name_en: 'Capital', account_type: 'equity', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-12', company_id: '', account_code: '3100', account_name_ar: 'الأرباح المحتجزة', account_name_en: 'Retained Earnings', account_type: 'equity', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-13', company_id: '', account_code: '4000', account_name_ar: 'إيرادات الإيجار', account_name_en: 'Rental Revenue', account_type: 'revenue', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-14', company_id: '', account_code: '4100', account_name_ar: 'إيرادات الخدمات', account_name_en: 'Service Revenue', account_type: 'revenue', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-15', company_id: '', account_code: '5000', account_name_ar: 'مصروفات الصيانة', account_name_en: 'Maintenance Expenses', account_type: 'expense', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-16', company_id: '', account_code: '5100', account_name_ar: 'الرواتب والأجور', account_name_en: 'Salaries & Wages', account_type: 'expense', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
  { id: 'acc-17', company_id: '', account_code: '5200', account_name_ar: 'مصروفات إدارية', account_name_en: 'Administrative Expenses', account_type: 'expense', parent_account_id: '', level: 1, is_postable: true, status: 'active' },
];

const seedJournalEntryLines: JournalEntryLine[] = [
  { id: 'jel-1', journal_entry_id: 'je-1', account_id: 'acc-1', cost_center_id: '', debit: 0, credit: 60000, description: 'استلام دفعة إيجار' },
  { id: 'jel-2', journal_entry_id: 'je-1', account_id: 'acc-13', cost_center_id: '', debit: 60000, credit: 0, description: 'إيرادات الإيجار' },
  { id: 'jel-3', journal_entry_id: 'je-2', account_id: 'acc-5', cost_center_id: '', debit: 850000, credit: 0, description: 'مستخلص مقاول' },
  { id: 'jel-4', journal_entry_id: 'je-2', account_id: 'acc-2', cost_center_id: '', debit: 0, credit: 850000, description: 'دفع البنك' },
  { id: 'jel-5', journal_entry_id: 'je-3', account_id: 'acc-7', cost_center_id: '', debit: 120000, credit: 0, description: 'شراء مواد بناء' },
  { id: 'jel-6', journal_entry_id: 'je-3', account_id: 'acc-2', cost_center_id: '', debit: 0, credit: 120000, description: 'دفع البنك' },
  { id: 'jel-7', journal_entry_id: 'je-4', account_id: 'acc-3', cost_center_id: '', debit: 165600, credit: 0, description: 'إصدار فواتير إيجار' },
  { id: 'jel-8', journal_entry_id: 'je-4', account_id: 'acc-13', cost_center_id: '', debit: 0, credit: 165600, description: 'إيرادات الإيجار' },
  { id: 'jel-9', journal_entry_id: 'je-5', account_id: 'acc-15', cost_center_id: '', debit: 2500, credit: 0, description: 'صيانة سباكة' },
  { id: 'jel-10', journal_entry_id: 'je-5', account_id: 'acc-1', cost_center_id: '', debit: 0, credit: 2500, description: 'دفع نقدي' },
  { id: 'jel-11', journal_entry_id: 'je-6', account_id: 'acc-16', cost_center_id: '', debit: 45000, credit: 0, description: 'رواتب يناير' },
  { id: 'jel-12', journal_entry_id: 'je-6', account_id: 'acc-2', cost_center_id: '', debit: 0, credit: 45000, description: 'تحويل بنكي' },
  { id: 'jel-13', journal_entry_id: 'je-7', account_id: 'acc-17', cost_center_id: '', debit: 15000, credit: 0, description: 'مصروفات مكتبية' },
  { id: 'jel-14', journal_entry_id: 'je-7', account_id: 'acc-1', cost_center_id: '', debit: 0, credit: 15000, description: 'دفع نقدي' },
  { id: 'jel-15', journal_entry_id: 'je-8', account_id: 'acc-1', cost_center_id: '', debit: 0, credit: 120000, description: 'استلام إيجارات' },
  { id: 'jel-16', journal_entry_id: 'je-8', account_id: 'acc-3', cost_center_id: '', debit: 120000, credit: 0, description: 'تحصيل ذمم' },
];

const seedJournalEntries: JournalEntry[] = [
  { id: 'je-1', company_id: '', entry_number: 'JRN-2026-001', entry_date: '2026-01-10', description: 'استلام دفعة إيجار - أحمد العمري', source_module: 'إيجارات', source_record_id: '', status: 'posted', total_debit: 60000, total_credit: 60000, created_by: '', posted_by: '', posted_at: '2026-01-10' },
  { id: 'je-2', company_id: '', entry_number: 'JRN-2026-002', entry_date: '2026-01-15', description: 'دفع مستخلص مقاول - شركة البناء المتقدمة', source_module: 'مقاولين', source_record_id: '', status: 'posted', total_debit: 850000, total_credit: 850000, created_by: '', posted_by: '', posted_at: '2026-01-15' },
  { id: 'je-3', company_id: '', entry_number: 'JRN-2026-003', entry_date: '2026-02-01', description: 'شراء مواد بناء - حديد وأسمنت', source_module: 'مشتريات', source_record_id: '', status: 'posted', total_debit: 120000, total_credit: 120000, created_by: '', posted_by: '', posted_at: '2026-02-01' },
  { id: 'je-4', company_id: '', entry_number: 'JRN-2026-004', entry_date: '2026-03-01', description: 'إصدار فواتير إيجار شهر مارس', source_module: 'إيجارات', source_record_id: '', status: 'draft', total_debit: 165600, total_credit: 165600, created_by: '', posted_by: '', posted_at: '' },
  { id: 'je-5', company_id: '', entry_number: 'JRN-2026-005', entry_date: '2026-03-15', description: 'صيانة وحدة A-101 - سباكة', source_module: 'صيانة', source_record_id: '', status: 'posted', total_debit: 2500, total_credit: 2500, created_by: '', posted_by: '', posted_at: '2026-03-15' },
  { id: 'je-6', company_id: '', entry_number: 'JRN-2026-006', entry_date: '2026-01-31', description: 'رواتب شهر يناير', source_module: 'الموارد البشرية', source_record_id: '', status: 'posted', total_debit: 45000, total_credit: 45000, created_by: '', posted_by: '', posted_at: '2026-01-31' },
  { id: 'je-7', company_id: '', entry_number: 'JRN-2026-007', entry_date: '2026-02-15', description: 'مصروفات إدارية', source_module: 'الإدارة', source_record_id: '', status: 'posted', total_debit: 15000, total_credit: 15000, created_by: '', posted_by: '', posted_at: '2026-02-15' },
  { id: 'je-8', company_id: '', entry_number: 'JRN-2026-008', entry_date: '2026-03-10', description: 'تحصيل إيجارات متأخرة', source_module: 'إيجارات', source_record_id: '', status: 'posted', total_debit: 120000, total_credit: 120000, created_by: '', posted_by: '', posted_at: '2026-03-10' },
];

export const chartOfAccountsStore = createStore<Account>({ key: 'erp_chart_of_accounts', seed: seedAccounts });
export const journalEntryStore = createStore<JournalEntry>({ key: 'erp_journal_entries', seed: seedJournalEntries });
export const journalEntryLineStore = createStore<JournalEntryLine>({ key: 'erp_journal_entry_lines', seed: seedJournalEntryLines });

// -------------------------------------------
// Phase 2 stores: Contractor Claims, Purchase Orders, Purchase Requests
// -------------------------------------------
export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor: string;
  project: string;
  order_date: string;
  expected_delivery: string;
  delivery_location: string;
  total_amount: number;
  receipt_status: string;
  payment_status: string;
  status: string;
  notes: string;
  items?: any[];
  pr_id?: string;
  pr_number?: string;
}
export interface PRLineItem {
  item_name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

export interface PurchaseRequest {
  id: string;
  pr_number: string;
  project: string;
  department: string;
  required_date: string;
  priority: string;
  justification: string;
  estimated_total: number;
  items: PRLineItem[];
  status: string;
  linked_po_id?: string;
  linked_po_number?: string;
}

import { seedContractorClaims } from '@/pages/construction/ContractorClaimsPage';
export const contractorClaimStore = createStore<import('@/types').ContractorClaim>({ key: 'erp_contractor_claims', seed: seedContractorClaims });

const seedPOs: PurchaseOrder[] = [
  { id: 'po1', po_number: 'PO-2024-001', vendor: 'شركة مواد البناء المتحدة', project: 'مشروع أبراج النخيل', order_date: '2024-05-01', expected_delivery: '2024-06-15', delivery_location: 'موقع المشروع - الرياض', total_amount: 850000, receipt_status: 'partial', payment_status: 'partially_paid', status: 'in_progress', notes: 'تم استلام الشحنة الأولى جزئياً', items: [{ itemName: 'حديد تسليح', description: 'حديد تسليح 16 ملم', quantity: 500, unit: 'طن', unitPrice: 1200, total: 600000 }, { itemName: 'أسمنت', description: 'أسمنت بورتلاندي', quantity: 1000, unit: 'كيس', unitPrice: 15, total: 15000 }, { itemName: 'طابوق', description: 'طابوق أحمر', quantity: 50000, unit: 'حبة', unitPrice: 4.7, total: 235000 }] },
  { id: 'po2', po_number: 'PO-2024-002', vendor: 'شركة الكهرباء السعودية', project: 'مشروع فلل الياسمين', order_date: '2024-04-15', expected_delivery: '2024-05-20', delivery_location: 'موقع المشروع - جدة', total_amount: 350000, receipt_status: 'full', payment_status: 'paid', status: 'completed', notes: 'تم التسليم بالكامل', items: [{ itemName: 'كابلات', description: 'كابل نحاس 4×16 ملم', quantity: 2000, unit: 'متر', unitPrice: 120, total: 240000 }, { itemName: 'لوحات توزيع', description: 'لوحة توزيع رئيسية', quantity: 5, unit: 'وحدة', unitPrice: 22000, total: 110000 }] },
  { id: 'po3', po_number: 'PO-2024-003', vendor: 'مصنع الرياض للحديد', project: 'مشروع مركز الرياض التجاري', order_date: '2024-05-10', expected_delivery: '2024-07-01', delivery_location: 'مستودع الشركة الرئيسي', total_amount: 620000, receipt_status: 'none', payment_status: 'unpaid', status: 'approved', notes: 'قيد التجهيز', items: [{ itemName: 'حديد تسليح', description: 'حديد تسليح 20 ملم', quantity: 300, unit: 'طن', unitPrice: 1300, total: 390000 }, { itemName: 'ألواح صاج', description: 'صاج حديد 2 ملم', quantity: 200, unit: 'لوح', unitPrice: 1150, total: 230000 }] },
  { id: 'po4', po_number: 'PO-2024-004', vendor: 'مؤسسة الخليج للمقاولات', project: 'مشروع أبراج النخيل', order_date: '2024-06-01', expected_delivery: '2024-08-15', delivery_location: 'موقع المشروع - الرياض', total_amount: 1200000, receipt_status: 'none', payment_status: 'unpaid', status: 'draft', notes: '', items: [{ itemName: 'وحدات تكييف', description: 'وحدات تكييف مركزية 30 طن', quantity: 8, unit: 'وحدة', unitPrice: 150000, total: 1200000 }] },
];
export const purchaseOrderStore = createStore<PurchaseOrder>({ key: 'erp_purchase_orders', seed: seedPOs });

const seedPRs: PurchaseRequest[] = [
  { id: 'pr1', pr_number: 'PR-2024-001', project: 'prj-1', department: 'قسم المشتريات', required_date: '2024-07-15', priority: 'high', justification: 'توريد مواد بناء للمرحلة الأولى من المشروع', estimated_total: 850000, items: [{ item_name: 'حديد تسليح', description: 'حديد تسليح 16 ملم', quantity: 500, unit: 'طن', unit_price: 1200, total_price: 600000 }, { item_name: 'أسمنت', description: 'أسمنت بورتلاندي', quantity: 1000, unit: 'كيس', unit_price: 15, total_price: 15000 }, { item_name: 'طابوق', description: 'طابوق أحمر', quantity: 50000, unit: 'حبة', unit_price: 4.7, total_price: 235000 }], status: 'approved' },
  { id: 'pr2', pr_number: 'PR-2024-002', project: 'prj-3', department: 'قسم الإنشاءات', required_date: '2024-08-01', priority: 'medium', justification: 'مواد تشطيب للفلل السكنية', estimated_total: 420000, items: [{ item_name: 'سيراميك', description: 'سيراميك أرضيات 60×60', quantity: 3000, unit: 'متر مربع', unit_price: 85, total_price: 255000 }, { item_name: 'دهانات', description: 'دهان داخلي جوتن', quantity: 500, unit: 'جالون', unit_price: 330, total_price: 165000 }], status: 'pending' },
  { id: 'pr3', pr_number: 'PR-2024-003', project: 'prj-4', department: 'قسم المشتريات', required_date: '2024-06-20', priority: 'urgent', justification: 'أنظمة تكييف مركزية عاجلة', estimated_total: 1200000, items: [{ item_name: 'وحدات تكييف', description: 'وحدات تكييف مركزية 30 طن', quantity: 8, unit: 'وحدة', unit_price: 150000, total_price: 1200000 }], status: 'draft' },
  { id: 'pr4', pr_number: 'PR-2024-004', project: 'prj-1', department: 'قسم الصيانة', required_date: '2024-09-10', priority: 'low', justification: 'مواد سباكة للصيانة الدورية', estimated_total: 85000, items: [{ item_name: 'مواسير PVC', description: 'مواسير صرف 4 بوصة', quantity: 200, unit: 'متر', unit_price: 45, total_price: 9000 }, { item_name: 'محابس', description: 'محبس زاوية 1/2 بوصة', quantity: 100, unit: 'حبة', unit_price: 160, total_price: 16000 }, { item_name: 'خلاطات', description: 'خلاط حوض ايطالي', quantity: 40, unit: 'حبة', unit_price: 1500, total_price: 60000 }], status: 'approved' },
  { id: 'pr5', pr_number: 'PR-2024-005', project: 'prj-1', department: 'قسم المشتريات', required_date: '2024-10-01', priority: 'medium', justification: 'توريد كابلات كهربائية للمرحلة الثانية', estimated_total: 350000, items: [{ item_name: 'كابلات', description: 'كابل نحاس 4×16 ملم', quantity: 2000, unit: 'متر', unit_price: 120, total_price: 240000 }, { item_name: 'لوحات توزيع', description: 'لوحة توزيع رئيسية', quantity: 5, unit: 'وحدة', unit_price: 22000, total_price: 110000 }], status: 'rejected' },
];
export const purchaseRequestStore = createStore<PurchaseRequest>({ key: 'erp_purchase_requests', seed: seedPRs });

// Helper: get lookup name
export function getLandName(id: string): string {
  return landStore.getById(id)?.land_name || '';
}
export function getProjectName(id: string): string {
  return projectStore.getById(id)?.project_name || '';
}
export function getPropertyName(id: string): string {
  return propertyStore.getById(id)?.property_name || '';
}
export function getUnitNumber(id: string): string {
  return unitStore.getById(id)?.unit_number || '';
}
export function getTenantName(id: string): string {
  const t = tenantStore.getById(id);
  return t?.full_name || t?.company_name || '';
}

export function getWarehouseName(id: string): string {
  return warehouseStore.getById(id)?.warehouse_name || '';
}
export function getInventoryItemName(id: string): string {
  return inventoryStore.getById(id)?.name_ar || '';
}
export function getBuildingName(id: string): string {
  return buildingStore.getById(id)?.building_name || '';
}
export function getEquipmentName(id: string): string {
  return equipmentStore.getById(id)?.equipment_name || '';
}
export function getContractNumber(id: string): string {
  return leaseStore.getById(id)?.contract_number || '';
}

export function getEmployeeName(id: string): string {
  return employeeStore.getById(id)?.full_name || '';
}

// Dashboard stats helper
export function getDashboardStats() {
  const lands = landStore.getAll();
  const projects = projectStore.getAll();
  const properties = propertyStore.getAll();
  const units = unitStore.getAll();
  const invoices = invoiceStore.getAll();
  const maintenance = maintenanceStore.getAll();
  const receipts = receiptStore.getAll();
  const claims = contractorClaimStore.getAll();
  const purchaseOrders = purchaseOrderStore.getAll();
  const inventoryItems = inventoryStore.getAll();
  const stockTxns = stockTransactionStore.getAll();

  const activeProjects = projects.filter(p => p.status === 'construction' || p.status === 'testing');
  const availableUnits = units.filter(u => u.status === 'available');
  const leasedUnits = units.filter(u => u.status === 'leased');
  const totalUnits = units.length;
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');

  // Land status breakdown
  const land_status: Record<string, number> = {};
  for (const l of lands) {
    land_status[l.status] = (land_status[l.status] || 0) + 1;
  }

  // Compute monthly rent income from paid invoices (status=paid)
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const monthly_rent_income = paidInvoices.reduce((s, i) => s + i.total, 0);

  // Compute cash collected this month from receipts
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const thisMonthReceipts = receipts.filter(r => r.payment_date >= monthStart && r.payment_date <= monthEnd);
  const cash_collected_this_month = thisMonthReceipts.reduce((s, r) => s + r.amount, 0);

  // Phase 2 computations
  const activeConstructionProjects = projects.filter(p => p.status === 'construction').length;
  const constructionProjects = projects.filter(p => p.status === 'construction' || p.status === 'testing');
  const avg_project_completion = constructionProjects.length > 0
    ? Math.round(constructionProjects.reduce((s, p) => s + p.completion_percentage, 0) / constructionProjects.length * 10) / 10
    : 0;
  const delayed_projects = projects.filter(p => p.status === 'construction' && p.planned_end_date < new Date().toISOString().split('T')[0]).length;

  const pending_contractor_claims = claims.filter(c => c.status === 'submitted' || c.status === 'verified' || c.status === 'approved').length;
  const approved_purchase_orders = purchaseOrders.filter(po => po.status === 'approved' || po.status === 'in_progress').length;

  // Total inventory value: sum of (qty_on_hand * avg_cost) from stock transactions
  // Use inventoryStore items and their quantities from the latest stock transactions
  const itemQtys = new Map<string, number>();
  for (const txn of stockTxns) {
    const prev = itemQtys.get(txn.inventory_item_id) || 0;
    if (txn.transaction_type === 'in' || txn.transaction_type === 'receipt' || txn.transaction_type === 'opening') {
      itemQtys.set(txn.inventory_item_id, prev + txn.quantity);
    } else {
      itemQtys.set(txn.inventory_item_id, prev - txn.quantity);
    }
  }
  const total_inventory_value = inventoryItems.reduce((s, item) => {
    const qty = itemQtys.get(item.id) || 0;
    return s + (qty * item.average_cost);
  }, 0);

  const low_stock_items = inventoryItems.filter(i => {
    const qty = itemQtys.get(i.id) || 0;
    return qty <= i.reorder_level;
  }).length;

  const total_construction_budget = constructionProjects.reduce((s, p) => s + p.approved_budget, 0);
  const total_actual_construction_cost = constructionProjects.reduce((s, p) => s + p.actual_cost, 0);
  const budget_variance = total_construction_budget - total_actual_construction_cost;

  return {
    total_lands: lands.length,
    land_status,
    active_projects: activeProjects.length,
    total_properties: properties.length,
    total_units: totalUnits,
    available_units: availableUnits.length,
    leased_units: leasedUnits.length,
    occupancy_rate: totalUnits > 0 ? Math.round((leasedUnits.length / totalUnits) * 100 * 10) / 10 : 0,
    monthly_rent_income,
    overdue_rent: overdueInvoices.reduce((s, i) => s + i.balance, 0),
    open_maintenance_requests: maintenance.filter(m => !['completed', 'closed', 'cancelled'].includes(m.status)).length,
    total_receivables: invoices.filter(i => i.balance > 0).reduce((s, i) => s + i.balance, 0),
    cash_collected_this_month,
    // Phase 2
    active_construction_projects: activeConstructionProjects,
    avg_project_completion,
    delayed_projects,
    total_construction_budget,
    total_actual_construction_cost,
    budget_variance,
    active_contractor_contracts: 0,
    pending_contractor_claims,
    approved_unpaid_claims: 0,
    total_contractor_payable: 0,
    pending_purchase_requests: purchaseRequestStore.getAll().filter(pr => pr.status === 'pending' || pr.status === 'draft').length,
    open_rfqs: rfqStore.getAll().filter(r => r.status === 'open' || r.status === 'pending').length,
    approved_purchase_orders,
    pending_deliveries: purchaseOrders.filter(po => po.status === 'in_progress').length,
    total_inventory_value,
    low_stock_items,
    materials_issued_this_month: 0,
    warehouse_count: warehouseStore.getAll().length,
  };
}

// Reset all stores to seed data
export function resetAllStores() {
  landStore.reset();
  projectStore.reset();
  contractorStore.reset();
  propertyStore.reset();
  companyStore.reset();
  roleStore.reset();
  permissionStore.reset();
  projectPhaseStore.reset();
  unitStore.reset();
  tenantStore.reset();
  leaseStore.reset();
  invoiceStore.reset();
  receiptStore.reset();
  maintenanceStore.reset();
  warehouseStore.reset();
  inventoryStore.reset();
  stockTransactionStore.reset();
  projectBudgetStore.reset();
  rfqStore.reset();
  vendorQuotationStore.reset();
  employeeStore.reset();
  attendanceStore.reset();
  payrollStore.reset();
  costCenterStore.reset();
  bankAccountStore.reset();
  equipmentStore.reset();
  buildingStore.reset();
  rentScheduleStore.reset();
  chequeStore.reset();
  chartOfAccountsStore.reset();
  journalEntryStore.reset();
  journalEntryLineStore.reset();
  leaveRequestStore.reset();
  projectTaskStore.reset();
  inspectionStore.reset();
  changeOrderStore.reset();
  dailyReportStore.reset();
}

// ── Status Transition Utility ──
// Returns array of valid next statuses for any entity type
type EntityType = 'project' | 'phase' | 'maintenance' | 'contractor_claim' | 'purchase_order' | 'lease' | 'invoice' | 'land';

const STATUS_TRANSITIONS: Record<EntityType, Record<string, string[]>> = {
  project: {
    'idea': ['feasibility'],
    'feasibility': ['design', 'cancelled'],
    'design': ['approvals', 'cancelled'],
    'approvals': ['tendering', 'cancelled'],
    'tendering': ['construction', 'cancelled'],
    'construction': ['testing', 'on_hold'],
    'testing': ['handover', 'construction'],
    'handover': ['completed'],
    'completed': ['converted'],
    'converted': [],
    'on_hold': ['construction', 'cancelled'],
    'cancelled': ['idea'],
  },
  phase: {
    'not_started': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'delayed'],
    'delayed': ['in_progress', 'completed', 'cancelled'],
    'completed': [],
    'cancelled': ['not_started'],
  },
  maintenance: {
    'submitted': ['under_review', 'cancelled'],
    'under_review': ['approved', 'rejected'],
    'approved': ['assigned', 'cancelled'],
    'rejected': ['submitted'],
    'assigned': ['in_progress', 'cancelled'],
    'in_progress': ['waiting_parts', 'completed'],
    'waiting_parts': ['in_progress', 'cancelled'],
    'completed': ['tenant_confirmed'],
    'tenant_confirmed': ['closed'],
    'closed': [],
    'cancelled': ['submitted'],
  },
  contractor_claim: {
    'draft': ['submitted'],
    'submitted': ['verified', 'rejected', 'cancelled'],
    'verified': ['approved', 'rejected'],
    'approved': ['partially_paid', 'paid'],
    'rejected': ['draft'],
    'partially_paid': ['paid'],
    'paid': [],
    'cancelled': [],
  },
  purchase_order: {
    'draft': ['approved'],
    'approved': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': ['draft'],
  },
  lease: {
    'draft': ['pending_approval'],
    'pending_approval': ['approved', 'cancelled'],
    'approved': ['pending_signature', 'cancelled'],
    'pending_signature': ['active', 'cancelled'],
    'active': ['expiring_soon', 'terminated'],
    'expiring_soon': ['renewed', 'terminated'],
    'renewed': ['active'],
    'terminated': [],
    'cancelled': [],
    'legal': [],
  },
  invoice: {
    'draft': ['issued'],
    'issued': ['partially_paid', 'overdue', 'cancelled'],
    'partially_paid': ['paid', 'overdue'],
    'paid': [],
    'overdue': ['partially_paid', 'paid', 'written_off'],
    'cancelled': [],
    'written_off': [],
  },
  land: {
    'available': ['under_study'],
    'under_study': ['under_design', 'available'],
    'under_design': ['under_approvals', 'under_study'],
    'under_approvals': ['under_construction', 'under_design'],
    'under_construction': ['developed', 'under_approvals'],
    'developed': ['sold', 'under_construction'],
    'sold': [],
  },
};

export function getAllowedStatusTransitions(entityType: EntityType, currentStatus: string): string[] {
  const transitions = STATUS_TRANSITIONS[entityType];
  if (!transitions) return [];
  return transitions[currentStatus] || [];
}

export function canTransitionTo(entityType: EntityType, currentStatus: string, targetStatus: string): boolean {
  return getAllowedStatusTransitions(entityType, currentStatus).includes(targetStatus);
}

// ── Helper: Get user permissions from role + assignments ──
export function getUserPermissions(userId: string): string[] {
  const assignment = permissionStore.getAll().find(a => a.user_id === userId);
  if (!assignment) return [];
  const role = roleStore.getById(assignment.role_id);
  if (!role) return [];
  // Merge role permissions with any user-specific overrides
  const merged = new Set([...role.permissions, ...assignment.permissions]);
  if (merged.has('*')) return ['*'];
  return Array.from(merged);
}
