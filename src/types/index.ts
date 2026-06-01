// Core entity types for the ERP system

// Company
export interface Company {
  id: string;
  name_ar: string;
  name_en: string;
  cr_number: string;
  tax_number: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string;
  currency: string;
  fiscal_year_start_month: number;
  created_at: string;
  updated_at: string;
}

// User Profile
export interface Profile {
  id: string;
  user_id: string;
  company_id: string;
  full_name: string;
  phone: string;
  role_id: string;
  department_id: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// Roles
export interface Role {
  id: string;
  company_id: string;
  name: string;
  name_ar: string;
  description: string;
  is_system_role: boolean;
  created_at: string;
}

// Permissions
export interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string;
}

// Land
export type LandStatus = 'available' | 'under_study' | 'under_design' | 'under_approvals' | 'under_construction' | 'developed' | 'sold' | 'archived';

export interface Land {
  id: string;
  company_id: string;
  land_code: string;
  land_name: string;
  plot_number: string;
  zone: string;
  municipality: string;
  area_sqm: number;
  gps_lat: number;
  gps_lng: number;
  acquisition_date: string;
  acquisition_price: number;
  broker_commission: number;
  registration_fees: number;
  legal_fees: number;
  other_costs: number;
  total_acquisition_cost: number;
  current_estimated_value: number;
  title_deed_number: string;
  seller_name: string;
  status: LandStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Project
export type ProjectType = 'single_villa' | 'villa_compound' | 'residential_building' | 'commercial_building' | 'mixed_use' | 'staff_accommodation' | 'warehouse' | 'office_building' | 'retail_complex';
export type ProjectStatus = 'idea' | 'feasibility' | 'design' | 'approvals' | 'tendering' | 'construction' | 'testing' | 'handover' | 'completed' | 'converted' | 'on_hold' | 'cancelled';

export interface Project {
  id: string;
  company_id: string;
  project_code: string;
  project_name: string;
  land_id: string;
  project_type: ProjectType;
  description: string;
  project_manager_id: string;
  engineer_id: string;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date: string;
  actual_end_date: string;
  estimated_budget: number;
  approved_budget: number;
  actual_cost: number;
  completion_percentage: number;
  status: ProjectStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectPhase {
  id: string;
  company_id: string;
  project_id: string;
  phase_name: string;
  sequence_number: number;
  planned_start: string;
  planned_end: string;
  actual_start: string;
  actual_end: string;
  responsible_user_id: string;
  contractor_id: string;
  budget_amount: number;
  actual_cost: number;
  progress_percentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  notes: string;
}

// Contractor
export type ContractorSpecialty = 'civil' | 'mep' | 'hvac' | 'plumbing' | 'electrical' | 'finishing' | 'landscaping' | 'elevators' | 'fire_systems' | 'security_systems' | 'general';
export type ContractorStatus = 'active' | 'inactive' | 'blacklisted';

export interface Contractor {
  id: string;
  company_id: string;
  contractor_code: string;
  name: string;
  cr_number: string;
  tax_number: string;
  specialty: ContractorSpecialty;
  classification: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  bank_name: string;
  iban: string;
  account_number: string;
  rating: number;
  status: ContractorStatus;
}

export interface ContractorContract {
  id: string;
  company_id: string;
  contractor_id: string;
  project_id: string;
  contract_number: string;
  contract_title: string;
  scope_of_work: string;
  contract_amount: number;
  retention_percentage: number;
  advance_payment: number;
  start_date: string;
  end_date: string;
  payment_terms: string;
  penalty_terms: string;
  warranty_period_months: number;
  status: 'draft' | 'pending_approval' | 'active' | 'suspended' | 'completed' | 'terminated' | 'closed';
  notes: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

// Property
export type PropertyType = 'villa' | 'villa_compound' | 'residential_building' | 'commercial_building' | 'mixed_use' | 'warehouse' | 'office_building' | 'retail_complex';
export type PropertyStatus = 'under_construction' | 'ready_for_leasing' | 'partially_leased' | 'fully_leased' | 'under_renovation' | 'under_maintenance' | 'sold' | 'archived';

export interface Property {
  id: string;
  company_id: string;
  property_code: string;
  property_name: string;
  project_id: string;
  land_id: string;
  property_type: PropertyType;
  address: string;
  completion_date: string;
  handover_date: string;
  land_cost: number;
  construction_cost: number;
  other_capitalized_cost: number;
  total_asset_value: number;
  useful_life_years: number;
  depreciation_method: string;
  annual_depreciation: number;
  property_manager_id: string;
  status: PropertyStatus;
}

// Unit
export type UnitType = 'villa' | 'apartment' | 'studio' | 'office' | 'shop' | 'warehouse' | 'room';
export type UnitStatus = 'available' | 'reserved' | 'leased' | 'under_maintenance' | 'blocked' | 'sold';

export interface Unit {
  id: string;
  company_id: string;
  property_id: string;
  building_id: string;
  floor_id: string;
  unit_code: string;
  unit_number: string;
  unit_type: UnitType;
  area_sqm: number;
  bedrooms: number;
  bathrooms: number;
  parking_number: string;
  electricity_meter: string;
  water_meter: string;
  furnished_status: string;
  expected_monthly_rent: number;
  market_monthly_rent: number;
  actual_rent: number;
  security_deposit_required: number;
  condition: string;
  status: UnitStatus;
}

// Tenant
export type TenantType = 'individual' | 'company' | 'government';

export interface Tenant {
  id: string;
  company_id: string;
  tenant_code: string;
  tenant_type: TenantType;
  full_name: string;
  company_name: string;
  national_id: string;
  passport_number: string;
  cr_number: string;
  nationality: string;
  phone: string;
  email: string;
  employer: string;
  authorized_person: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  address: string;
  status: 'active' | 'inactive' | 'blacklisted';
}

// Lease Contract
export type PaymentFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom';
export type ContractStatus = 'draft' | 'pending_approval' | 'approved' | 'pending_signature' | 'active' | 'expiring_soon' | 'renewed' | 'terminated' | 'cancelled' | 'legal';

export interface LeaseContract {
  id: string;
  company_id: string;
  contract_number: string;
  tenant_id: string;
  property_id: string;
  unit_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  payment_frequency: PaymentFrequency;
  security_deposit: number;
  admin_fees: number;
  commission: number;
  grace_period_days: number;
  late_fee_type: string;
  late_fee_amount: number;
  auto_renewal_allowed: boolean;
  renewal_notice_days: number;
  termination_notice_days: number;
  status: ContractStatus;
}

// Rent Schedule
export type ScheduleStatus = 'upcoming' | 'due' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface RentSchedule {
  id: string;
  company_id: string;
  contract_id: string;
  due_date: string;
  period_start: string;
  period_end: string;
  rent_amount: number;
  service_charges: number;
  other_charges: number;
  late_fee: number;
  total_due: number;
  paid_amount: number;
  balance: number;
  status: ScheduleStatus;
}

// Invoice
export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | 'written_off';

export interface RentalInvoice {
  id: string;
  company_id: string;
  invoice_number: string;
  tenant_id: string;
  contract_id: string;
  unit_id: string;
  invoice_date: string;
  due_date: string;
  rent_amount: number;
  service_charges: number;
  maintenance_charges: number;
  penalties: number;
  discounts: number;
  tax: number;
  total: number;
  paid_amount: number;
  balance: number;
  status: InvoiceStatus;
}

// Receipt
export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'online';

export interface Receipt {
  id: string;
  company_id: string;
  receipt_number: string;
  tenant_id: string;
  invoice_id: string;
  contract_id: string;
  payment_date: string;
  payment_method: PaymentMethod;
  amount: number;
  bank_account_id: string;
  reference_number: string;
  notes: string;
  attachment_url: string;
}

// Maintenance
export type MaintenanceCategory = 'ac' | 'electrical' | 'plumbing' | 'water_leakage' | 'door_window' | 'painting' | 'elevator' | 'fire_alarm' | 'pest_control' | 'cleaning' | 'landscaping' | 'general';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'emergency';
export type MaintenanceStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'assigned' | 'in_progress' | 'waiting_parts' | 'completed' | 'tenant_confirmed' | 'closed' | 'cancelled';

export interface MaintenanceRequest {
  id: string;
  company_id: string;
  request_number: string;
  property_id: string;
  unit_id: string;
  tenant_id: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  description: string;
  preferred_visit_time: string;
  status: MaintenanceStatus;
  assigned_team_id: string;
  created_by: string;
}

export interface WorkOrder {
  id: string;
  company_id: string;
  work_order_number: string;
  maintenance_request_id: string;
  technician_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  labor_cost: number;
  material_cost: number;
  vendor_cost: number;
  total_cost: number;
  technician_notes: string;
  tenant_signature_url: string;
  status: string;
}

// Finance
export interface Account {
  id: string;
  company_id: string;
  account_code: string;
  account_name_ar: string;
  account_name_en: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_account_id: string;
  level: number;
  is_postable: boolean;
  status: 'active' | 'inactive';
}

export interface JournalEntry {
  id: string;
  company_id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  source_module: string;
  source_record_id: string;
  status: 'draft' | 'posted' | 'reversed';
  total_debit: number;
  total_credit: number;
  created_by: string;
  posted_by: string;
  posted_at: string;
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  cost_center_id: string;
  debit: number;
  credit: number;
  description: string;
}

// Dashboard
export interface DashboardStats {
  total_lands: number;
  active_projects: number;
  total_properties: number;
  total_units: number;
  available_units: number;
  leased_units: number;
  occupancy_rate: number;
  monthly_rent_income: number;
  overdue_rent: number;
  open_maintenance_requests: number;
  total_receivables: number;
  cash_collected_this_month: number;
  // Phase 2
  active_construction_projects: number;
  avg_project_completion: number;
  delayed_projects: number;
  total_construction_budget: number;
  total_actual_construction_cost: number;
  budget_variance: number;
  active_contractor_contracts: number;
  pending_contractor_claims: number;
  approved_unpaid_claims: number;
  total_contractor_payable: number;
  pending_purchase_requests: number;
  open_rfqs: number;
  approved_purchase_orders: number;
  pending_deliveries: number;
  total_inventory_value: number;
  low_stock_items: number;
  materials_issued_this_month: number;
  warehouse_count: number;
}

// ============================================================

// Contractor Claim
export interface ContractorClaim {
  id: string;
  company_id: string;
  contractor_contract_id: string;
  contractor_id: string;
  project_id: string;
  claim_number: string;
  claim_date: string;
  claimed_amount: number;
  work_completed_percentage: number;
  previous_claims_amount: number;
  retention_amount: number;
  advance_deduction: number;
  penalty_amount: number;
  net_payable: number;
  engineer_verification_status: 'pending' | 'verified' | 'rejected';
  engineer_notes: string;
  project_manager_approval_status: 'pending' | 'approved' | 'rejected';
  finance_approval_status: 'pending' | 'approved' | 'rejected';
  payment_status: 'unpaid' | 'partially_paid' | 'paid';
  status: 'draft' | 'submitted' | 'verified' | 'approved' | 'rejected' | 'partially_paid' | 'paid' | 'cancelled';
  document_owner?: string;
  approval_status?: string;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

// Daily Report
export interface ProjectDailyReport {
  id: string;
  company_id: string;
  report_number: string;
  project_id: string;
  report_date: string;
  weather_condition: string;
  manpower_count: number;
  equipment_on_site: string;
  work_completed_today: string;
  planned_work_tomorrow: string;
  issues_encountered: string;
  safety_incidents: string;
  materials_received: string;
  delay_reason: string;
  submitted_by: string;
  approval_status: string;
  approved_by: string;
  approved_at: string;
  notes: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Progress Update
export interface ProjectProgressUpdate {
  id: string;
  company_id: string;
  project_id: string;
  phase_id: string;
  update_date: string;
  previous_progress: number;
  new_progress: number;
  progress_change: number;
  description: string;
  issues: string;
  photos_count: number;
  submitted_by: string;
  approval_status: string;
  approved_by: string;
  approved_at: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}


// Warehouse
export interface Warehouse {
  id: string;
  company_id: string;
  warehouse_code: string;
  warehouse_name: string;
  location: string;
  manager_id: string;
  type: 'main' | 'project' | 'site' | 'maintenance';
  status: string;
  created_at: string;
  updated_at: string;
}

// Inventory Item
export interface InventoryItem {
  id: string;
  company_id: string;
  item_code: string;
  name_ar: string;
  name_en: string;
  category: string;
  unit_of_measure: string;
  minimum_stock: number;
  maximum_stock: number;
  reorder_level: number;
  average_cost: number;
  default_supplier_id: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Stock Transaction
export interface StockTransaction {
  id: string;
  company_id: string;
  transaction_number: string;
  transaction_type: string;
  warehouse_id: string;
  project_id: string;
  property_id: string;
  work_order_id: string;
  inventory_item_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  transaction_date: string;
  reference_type: string;
  reference_id: string;
  created_at: string;
  updated_at: string;
}

// Project Budget
export interface ProjectBudget {
  id: string;
  company_id: string;
  project_id: string;
  budget_code: string;
  budget_name: string;
  budget_category: string;
  approved_amount: number;
  committed_amount: number;
  actual_amount: number;
  remaining_amount: number;
  variance_amount: number;
  variance_percentage: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// RFQ
export interface RFQ {
  id: string;
  company_id: string;
  rfq_number: string;
  purchase_request_id: string;
  project_id: string;
  title: string;
  description: string;
  submission_deadline: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Vendor
export interface Vendor {
  id: string;
  company_id: string;
  vendor_code: string;
  vendor_name: string;
  vendor_type: string;
  cr_number: string;
  tax_number: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  bank_name: string;
  iban: string;
  payment_terms: string;
  rating: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Vendor Quotation
export interface VendorQuotation {
  id: string;
  company_id: string;
  quotation_number: string;
  rfq_id: string;
  vendor_id: string;
  quotation_date: string;
  valid_until: string;
  delivery_time_days: number;
  payment_terms: string;
  warranty_terms: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  evaluation_score: number;
  is_recommended: boolean;
  status: string;
  attachment_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Vendor Quotation Item
export interface VendorQuotationItem {
  id: string;
  company_id: string;
  vendor_quotation_id: string;
  item_name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

// ============================================================
// PHASE 3 TYPES
// ============================================================

// Building
export interface Building {
  id: string;
  company_id: string;
  property_id: string;
  building_code: string;
  building_name: string;
  number_of_floors: number;
  number_of_units: number;
  parking_spaces: number;
  elevator_count: number;
  completion_date: string;
  status: string;
}

// Floor
export interface Floor {
  id: string;
  company_id: string;
  building_id: string;
  floor_number: string;
  description: string;
  number_of_units: number;
}

// Equipment
export interface Equipment {
  id: string;
  company_id: string;
  equipment_code: string;
  equipment_name: string;
  category: string;
  serial_number: string;
  purchase_date: string;
  purchase_cost: number;
  current_value: number;
  assigned_project_id: string;
  current_location: string;
  responsible_person_id: string;
  condition: string;
  status: string;
  notes: string;
}

// Work Order
export interface WorkOrder {
  id: string;
  company_id: string;
  work_order_number: string;
  maintenance_request_id: string;
  technician_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  labor_cost: number;
  material_cost: number;
  vendor_cost: number;
  total_cost: number;
  diagnosis: string;
  work_done: string;
  materials_used: string;
  status: string;
  notes: string;
}

// Preventive Maintenance Schedule
export interface PreventiveMaintenanceSchedule {
  id: string;
  company_id: string;
  property_id: string;
  unit_id: string;
  asset_name: string;
  category: string;
  frequency: string;
  next_due_date: string;
  assigned_to: string;
  status: string;
}

// Cost Center
export interface CostCenter {
  id: string;
  company_id: string;
  cost_center_code: string;
  cost_center_name: string;
  type: string;
  linked_project_id: string;
  linked_property_id: string;
  linked_department_id: string;
  status: string;
}

// Bank Account
export interface BankAccount {
  id: string;
  company_id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  iban: string;
  currency: string;
  opening_balance: number;
  current_balance: number;
  status: string;
}

// Cheque
export interface Cheque {
  id: string;
  company_id: string;
  cheque_number: string;
  bank_name: string;
  cheque_date: string;
  amount: number;
  tenant_id: string;
  contract_id: string;
  status: string;
  notes: string;
}

// Legal Notice
export interface LegalNotice {
  id: string;
  company_id: string;
  notice_number: string;
  tenant_id: string;
  contract_id: string;
  unit_id: string;
  notice_type: string;
  due_amount: number;
  notice_date: string;
  status: string;
  generated_content: string;
  approved_by: string;
  sent_at: string;
  notes: string;
}

// Legal Case
export interface LegalCase {
  id: string;
  company_id: string;
  case_number: string;
  tenant_id: string;
  contract_id: string;
  unit_id: string;
  case_type: string;
  claim_amount: number;
  lawyer_name: string;
  court_name: string;
  filing_date: string;
  hearing_date: string;
  judgment_date: string;
  status: string;
  notes: string;
}


// Audit Log Entry
export interface AuditLogEntry {
  id: string;
  company_id: string;
  user_id: string;
  action: string;
  module: string;
  record_id: string;
  old_value: string;
  new_value: string;
  ip_address: string;
  created_at: string;
}

// Employee
export interface Employee {
  id: string;
  company_id: string;
  employee_code: string;
  full_name: string;
  nationality: string;
  phone: string;
  email: string;
  job_title: string;
  department_id: string;
  manager_id: string;
  hire_date: string;
  salary: number;
  allowances: number;
  status: string;
  notes: string;
}

// Attendance
export interface Attendance {
  id: string;
  company_id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string;
  check_out: string;
  hours_worked: number;
  late_minutes: number;
  overtime_hours: number;
  status: string;
  notes: string;
}

// Payroll
export interface Payroll {
  id: string;
  company_id: string;
  payroll_month: string;
  employee_id: string;
  basic_salary: number;
  allowances: number;
  overtime_pay: number;
  deductions: number;
  net_salary: number;
  status: string;
  notes: string;
}
