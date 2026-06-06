// Phase 8 — BIM / Biometrics / Future — seed data
import type { BimModel, BimClash, BiometricDevice, BiometricTemplate, BiometricAttendanceRecord, MapLayer, MapLocation, OcrProcessing, OcrTemplate, ErpIntegrationStudy, ResearchDataset, MarketIndicator, PropertyToken, BlockchainTransaction, Web3Wallet } from '@/types/phase8';

const today = '2026-06-02';

// 8.1 BIM
export const seedBimModels: BimModel[] = [
  { id:'bim-1',company_id:'comp-1',project_id:'prj-1',model_name:'مجمع النخيل - النموذج المعماري',discipline:'architectural',file_format:'ifc',file_size_mb:48.5,file_url:'/bim/nakheel-arch.ifc',version:'3.1',author:'شركة التصميم المتقدم',status:'ready',element_count:12450,floor_count:5,lod:'LOD300',uploaded_by:'خالد العمري',uploaded_at:'2025-06-15',processed_at:'2025-06-15',last_viewed_at:today,notes:'النموذج المعماري الكامل' },
  { id:'bim-2',company_id:'comp-1',project_id:'prj-1',model_name:'مجمع النخيل - الهيكل الإنشائي',discipline:'structural',file_format:'ifc',file_size_mb:32.1,file_url:'/bim/nakheel-struct.ifc',version:'2.4',author:'مكتب المهندس الإنشائي',status:'ready',element_count:8950,floor_count:5,lod:'LOD350',uploaded_by:'خالد العمري',uploaded_at:'2025-08-20',processed_at:'2025-08-21',last_viewed_at:'2026-05-10',notes:'يشمل الأساسات والأعمدة والجسور' },
  { id:'bim-3',company_id:'comp-1',project_id:'prj-1',model_name:'مجمع النخيل - MEP',discipline:'mep',file_format:'rvt',file_size_mb:55.2,file_url:'/bim/nakheel-mep.rvt',version:'1.8',author:'شركة الهندسة الكهربائية',status:'processing',element_count:0,floor_count:0,lod:'LOD200',uploaded_by:'خالد العمري',uploaded_at:today,processed_at:'',last_viewed_at:'',notes:'جاري المعالجة - Revit 2025' },
  { id:'bim-4',company_id:'comp-1',project_id:'prj-2',model_name:'أبراج السلام - النموذج التنسيقي',discipline:'coordination',file_format:'nwd',file_size_mb:180,file_url:'/bim/salam-towers.nwd',version:'5.0',author:'شركة البناء المتقدمة',status:'ready',element_count:28700,floor_count:24,lod:'LOD400',uploaded_by:'أحمد الشمري',uploaded_at:'2026-01-10',processed_at:'2026-01-15',last_viewed_at:'2026-05-20',notes:'نموذج Navisworks التنسيقي الكامل' },
];

export const seedBimClashes: BimClash[] = [
  { id:'bc-1',model_id:'bim-1',element_a_id:'IFC_WALL_01',element_b_id:'IFC_PIPE_22',clash_type:'hard',status:'resolved',distance_mm:0,point_x:45.2,point_y:12.8,point_z:3.5,description:'جدار خرساني يتعارض مع أنبوب صرف',assigned_to:'فني أحمد',assigned_at:'2025-09-01',resolved_at:'2025-09-10' },
  { id:'bc-2',model_id:'bim-1',element_a_id:'IFC_BEAM_A1',element_b_id:'IFC_DUCT_V3',clash_type:'clearance',status:'active',distance_mm:25,point_x:18.5,point_y:7.3,point_z:6.0,description:'مجري تكييف قريب جداً من عارضة السقف',assigned_to:'فني خالد',assigned_at:'2025-09-05',resolved_at:'' },
  { id:'bc-3',model_id:'bim-4',element_a_id:'NWD_BEAM_B12',element_b_id:'NWD_SPRINKLER_K8',clash_type:'hard',status:'reviewed',distance_mm:0,point_x:32.1,point_y:15.6,point_z:42.0,description:'عارضة رئيسية ومرشة حريق - الطابق 12',assigned_to:'مهندس سعيد',assigned_at:'2026-02-20',resolved_at:'' },
];

// 8.2 Biometric
export const seedBiometricDevices: BiometricDevice[] = [
  { id:'bio-dev-1',company_id:'comp-1',device_name:'ZK البوابة الرئيسية',device_type:'zk_fingerprint',serial_number:'ZK-TECO-2025-A001',ip_address:'192.168.1.100',port:4370,location:'المدخل الرئيسي - الرياض',model:'ZKTeco SpeedFace-V5L',firmware_version:'3.2.1',status:'online',last_sync_at:today,storage_capacity:10000,stored_templates:42,created_at:'2025-01-10',updated_at:today },
  { id:'bio-dev-2',company_id:'comp-1',device_name:'ZK الموقع - مشروع النخيل',device_type:'zk_fingerprint',serial_number:'ZK-TECO-2025-A002',ip_address:'192.168.2.50',port:4370,location:'موقع مشروع النخيل - الرياض',model:'ZKTeco G4 Pro',firmware_version:'3.1.8',status:'online',last_sync_at:'2026-05-28',storage_capacity:5000,stored_templates:25,created_at:'2025-03-15',updated_at:'2026-05-28' },
  { id:'bio-dev-3',company_id:'comp-1',device_name:'Hikvision المخازن المركزية',device_type:'hikvision',serial_number:'HKV-2025-B003',ip_address:'192.168.3.10',port:8000,location:'المستودع الرئيسي',model:'Hikvision DS-K1T680MFW',firmware_version:'4.0.2',status:'offline',last_sync_at:'2026-04-30',storage_capacity:6000,stored_templates:18,created_at:'2025-06-20',updated_at:'2026-04-30' },
];

export const seedBiometricTemplates: BiometricTemplate[] = [
  { id:'bt-1',employee_id:'emp-1',device_id:'bio-dev-1',finger_index:1,template_data_hash:'tmpl_7a8b9c...',quality_score:92,registered_at:'2025-01-15',enrolled_by:'مدير النظام',status:'active' },
  { id:'bt-2',employee_id:'emp-2',device_id:'bio-dev-1',finger_index:1,template_data_hash:'tmpl_3d4e5f...',quality_score:88,registered_at:'2025-01-15',enrolled_by:'مدير النظام',status:'active' },
  { id:'bt-3',employee_id:'emp-3',device_id:'bio-dev-2',finger_index:1,template_data_hash:'tmpl_9a1b2c...',quality_score:95,registered_at:'2025-04-01',enrolled_by:'مهندس الموقع',status:'active' },
];

export const seedBiometricAttendance: BiometricAttendanceRecord[] = [
  { id:'ba-1',company_id:'comp-1',employee_id:'emp-1',device_id:'bio-dev-1',template_id:'bt-1',punch_time:'2026-06-02T07:55:00Z',punch_type:'clock_in',verification_method:'fingerprint',verification_score:94,is_verified:true,is_duress:false,temperature_celsius:36.4,mask_detected:false,photo_url:'',synced_at:today,notes:'' },
  { id:'ba-2',company_id:'comp-1',employee_id:'emp-2',device_id:'bio-dev-1',template_id:'bt-2',punch_time:'2026-06-02T08:12:00Z',punch_type:'clock_in',verification_method:'face',verification_score:89,is_verified:true,is_duress:false,temperature_celsius:36.8,mask_detected:false,photo_url:'',synced_at:today,notes:'تأخر 12 دقيقة' },
  { id:'ba-3',company_id:'comp-1',employee_id:'emp-3',device_id:'bio-dev-2',template_id:'bt-3',punch_time:'2026-06-02T06:30:00Z',punch_type:'clock_in',verification_method:'fingerprint',verification_score:97,is_verified:true,is_duress:false,temperature_celsius:36.2,mask_detected:true,photo_url:'',synced_at:today,notes:'' },
  { id:'ba-4',company_id:'comp-1',employee_id:'emp-1',device_id:'bio-dev-1',template_id:'bt-1',punch_time:'2026-06-02T16:05:00Z',punch_type:'clock_out',verification_method:'fingerprint',verification_score:93,is_verified:true,is_duress:false,temperature_celsius:36.5,mask_detected:false,photo_url:'',synced_at:today,notes:'عمل إضافي 5 دقائق' },
];

// 8.3 Mapping
export const seedMapLayers: MapLayer[] = [
  { id:'ml-1',company_id:'comp-1',layer_name:'خريطة الأساس',provider:'mapbox',layer_type:'tiles',access_token_masked:'pk.ey••••a1b2',style_url:'mapbox://styles/aqari/ckx8',is_active:true,z_index:1,opacity:1.0,created_at:'2025-07-01' },
  { id:'ml-2',company_id:'comp-1',layer_name:'مباني ثلاثية الأبعاد',provider:'google',layer_type:'3d_buildings',access_token_masked:'AIza••••3c4d',style_url:'',is_active:true,z_index:5,opacity:0.8,created_at:'2025-07-01' },
  { id:'ml-3',company_id:'comp-1',layer_name:'بيانات ديموغرافية',provider:'esri',layer_type:'demographics',access_token_masked:'esri••••9a8b',style_url:'',is_active:false,z_index:10,opacity:0.6,created_at:'2025-09-15' },
];

export const seedMapLocations: MapLocation[] = [
  { id:'mloc-1',company_id:'comp-1',entity_type:'land',entity_id:'land-1',label:'أرض الخالدية',lat:24.7136,lng:46.6753,w3w_address:'///table.lamp.spoon',radius_m:500,icon:'land',color:'#10B981',cluster_group:'lands',metadata_json:'{}' },
  { id:'mloc-2',company_id:'comp-1',entity_type:'project',entity_id:'prj-1',label:'مجمع النخيل السكني',lat:24.7140,lng:46.6760,w3w_address:'///moon.star.tree',radius_m:300,icon:'construction',color:'#F59E0B',cluster_group:'projects',metadata_json:'{}' },
  { id:'mloc-3',company_id:'comp-1',entity_type:'property',entity_id:'prop-1',label:'عمارة النخيل',lat:24.7138,lng:46.6758,w3w_address:'///cloud.rain.bird',radius_m:200,icon:'building',color:'#533afd',cluster_group:'properties',metadata_json:'{}' },
];

// 8.4 OCR
export const seedOcrProcessings: OcrProcessing[] = [
  { id:'ocr-1',company_id:'comp-1',file_name:'عقد_إيجار_أحمد_العمري.pdf',file_url:'/uploads/ocr/lse-1.pdf',file_type:'pdf',page_count:8,engine:'tesseract',language:'ara+eng',status:'completed',result_text:'عقد إيجار... المادة الأولى: المستأجر أحمد محمد العمري... الإيجار الشهري 5000 ريال...',confidence:87.5,extracted_fields_json:'{"tenant_name":"أحمد محمد العمري","monthly_rent":5000,"unit":"A-101","start_date":"2025-01-01","end_date":"2026-01-01"}',processing_time_ms:4200,created_at:'2026-03-15',completed_at:'2026-03-15T10:15:00Z' },
  { id:'ocr-2',company_id:'comp-1',file_name:'فاتورة_كهرباء.pdf',file_url:'/uploads/ocr/elec-bill.pdf',file_type:'scan',page_count:1,engine:'google_vision',language:'ara',status:'completed',result_text:'فاتورة كهرباء... رقم الفاتورة 88421...',confidence:94.2,extracted_fields_json:'{"invoice_number":"88421","amount":1250}',processing_time_ms:1800,created_at:'2026-04-20',completed_at:'2026-04-20T14:30:00Z' },
  { id:'ocr-3',company_id:'comp-1',file_name:'سجل_تجاري.pdf',file_url:'/uploads/ocr/cr.pdf',file_type:'photo',page_count:2,engine:'tesseract',language:'ara',status:'processing',result_text:'',confidence:0,extracted_fields_json:'{}',processing_time_ms:0,created_at:today,completed_at:'' },
];

export const seedOcrTemplates: OcrTemplate[] = [
  { id:'oct-1',company_id:'comp-1',template_name:'استخراج عقد إيجار',document_type:'contract',fields_definition_json:'[{"field_name":"tenant_name","expected_type":"string","required":true},{"field_name":"monthly_rent","expected_type":"number","required":true}]',is_active:true,created_at:'2026-02-01',updated_at:'2026-02-01' },
  { id:'oct-2',company_id:'comp-1',template_name:'استخراج فاتورة',document_type:'invoice',fields_definition_json:'[{"field_name":"invoice_number","expected_type":"string","required":true},{"field_name":"amount","expected_type":"number","required":true}]',is_active:true,created_at:'2026-02-01',updated_at:'2026-02-01' },
];

// 8.5 ERP Integration
export const seedErpStudies: ErpIntegrationStudy[] = [
  { id:'erp-s1',company_id:'comp-1',erp_system:'erpnext',module:'real_estate',study_status:'evaluated',fit_score:78,cost_estimate_qar:45000,implementation_months:3,requirements_json:'{}',pros:['مفتوح المصدر','وحدات عقارية جاهزة','دعم عربي محدود'],cons:['ضعف دعم العقارات المتخصصة','تحتاج تخصيص كبير','صعوبة في إعداد السيرفر'],gaps:['لا يدعم BIM','لا يدعم التوقيع الإلكتروني'],api_available:true,localization_score:55,community_size:'كبير - 15K+ أعضاء',license_type:'GNU GPLv3',reviewed_by:'د. محمد العتيبي',reviewed_at:'2026-01-10',notes:'' },
  { id:'erp-s2',company_id:'comp-1',erp_system:'odoo',module:'construction',study_status:'in_review',fit_score:65,cost_estimate_qar:32000,implementation_months:4,requirements_json:'{}',pros:['واجهة حديثة','تطبيقات موبايل','مجتمع ضخم'],cons:['ضعف التعريب','ارتفاع تكاليف التخصيص'],gaps:['لا يدعم GCC compliance'],api_available:true,localization_score:40,community_size:'ضخم - 7M+ مستخدم',license_type:'LGPLv3',reviewed_by:'خالد العمري',reviewed_at:'2026-02-20',notes:'' },
  { id:'erp-s3',company_id:'comp-1',erp_system:'metabase',module:'reporting',study_status:'recommended',fit_score:92,cost_estimate_qar:5000,implementation_months:1,requirements_json:'{}',pros:['لوحات معلومات قوية','سهولة الاستخدام','تكلفة منخفضة'],cons:['ليس ERP متكامل'],gaps:['يحتاج ربط مع API النظام'],api_available:true,localization_score:60,community_size:'متوسط',license_type:'AGPL',reviewed_by:'سارة القحطاني',reviewed_at:'2026-04-15',notes:'مثالي للتقارير ولوحات المعلومات' },
];

// 8.6 Research Data
export const seedResearchDatasets: ResearchDataset[] = [
  { id:'rd-1',company_id:'comp-1',source:'world_bank',dataset_name:'Qatar GDP Growth',category:'gdp',country:'QA',indicator_code:'NY.GDP.MKTP.KD.ZG',description:'نمو الناتج المحلي الإجمالي لقطر',frequency:'annual',latest_value:3.2,latest_year:2025,value_unit:'%',trend_direction:'up',trend_percent:12,metadata_json:'{}',fetched_at:today },
  { id:'rd-2',company_id:'comp-1',source:'trading_economics',dataset_name:'Saudi Arabia Construction Index',category:'construction_costs',country:'SA',indicator_code:'TE_SA_CONST',description:'مؤشر تكاليف البناء في السعودية',frequency:'quarterly',latest_value:124.5,latest_year:2026,value_unit:'index',trend_direction:'up',trend_percent:4.5,metadata_json:'{}',fetched_at:today },
  { id:'rd-3',company_id:'comp-1',source:'numbeo',dataset_name:'Doha Property Price per sqm',category:'property_prices',country:'QA',indicator_code:'NUMB_DOHA_PROP',description:'متوسط سعر المتر المربع في الدوحة',frequency:'quarterly',latest_value:14200,latest_year:2026,value_unit:'QAR/sqm',trend_direction:'up',trend_percent:8.2,metadata_json:'{}',fetched_at:today },
];

export const seedMarketIndicators: MarketIndicator[] = [
  { id:'mi-1',company_id:'comp-1',market_name:'Doha Residential',country:'QA',city:'Doha',property_type:'residential',avg_price_sqm:14200,avg_rent_yield:4.8,occupancy_rate:88,yoy_price_change:6.5,yoy_rent_change:3.2,supply_pipeline:4500,demand_index:82,investment_volume:2500000000,data_source:'world_bank',last_updated:today },
  { id:'mi-2',company_id:'comp-1',market_name:'Riyadh Commercial',country:'SA',city:'Riyadh',property_type:'commercial',avg_price_sqm:8500,avg_rent_yield:6.2,occupancy_rate:78,yoy_price_change:12.1,yoy_rent_change:8.5,supply_pipeline:12000,demand_index:90,investment_volume:8500000000,data_source:'trading_economics',last_updated:today },
];

// 8.7 Blockchain
export const seedPropertyTokens: PropertyToken[] = [
  { id:'pt-1',company_id:'comp-1',property_id:'prop-1',blockchain:'solana',token_name:'Aqari Nakheel Tower',token_symbol:'ANKH',token_address:'ANKH7x8y...9z',mint_tx_hash:'5kL9mN...x8y',total_supply:1000,token_price_est:15000,property_value_usd:15000000,fractional_ownership:true,fractions_available:700,fractions_sold:300,status:'listed',minted_at:'2026-03-15',listed_at:'2026-04-01',owner_wallet:'AqariWallet...123',metadata_ipfs_hash:'QmX9y...789',created_by:'محمد العتيبي',created_at:'2026-03-10',notes:'مجمع النخيل - 30% مباع' },
  { id:'pt-2',company_id:'comp-1',property_id:'prop-2',blockchain:'ethereum',token_name:'Salam Towers Token',token_symbol:'SLMT',token_address:'0x742d...9ab',mint_tx_hash:'0xabc...123',total_supply:500,token_price_est:50000,property_value_usd:25000000,fractional_ownership:true,fractions_available:500,fractions_sold:0,status:'draft',minted_at:'',listed_at:'',owner_wallet:'0xWallet...555',metadata_ipfs_hash:'QmAbC...456',created_by:'سارة القحطاني',created_at:today,notes:'قيد التجهيز - لم يُسك بعد' },
];

export const seedBlockchainTransactions: BlockchainTransaction[] = [
  { id:'btx-1',token_id:'pt-1',tx_type:'mint',tx_hash:'5kL9mN...x8y',from_wallet:'',to_wallet:'AqariWallet...123',amount:1000,gas_fee:0.002,gas_currency:'SOL',block_number:228450000,block_timestamp:'2026-03-15T10:00:00Z',status:'confirmed',confirmed_at:'2026-03-15T10:00:05Z',explorer_url:'https://solscan.io/tx/5kL9mN...x8y' },
  { id:'btx-2',token_id:'pt-1',tx_type:'sale',tx_hash:'7mN2oP...y9z',from_wallet:'AqariWallet...123',to_wallet:'InvestorWallet...888',amount:100,gas_fee:0.001,gas_currency:'SOL',block_number:229100000,block_timestamp:'2026-04-15T14:30:00Z',status:'confirmed',confirmed_at:'2026-04-15T14:30:06Z',explorer_url:'https://solscan.io/tx/7mN2oP...y9z' },
];

export const seedWeb3Wallets: Web3Wallet[] = [
  { id:'w3w-1',company_id:'comp-1',wallet_name:'Aqari Treasury',wallet_address:'AqariWallet...123',blockchain:'solana',balance:125.5,balance_usd:25000,is_multisig:true,signers:['0xAdmin1...','0xAdmin2...','0xAdmin3...'],required_signatures:2,connected_dapp:'Parcl.fi',last_activity_at:'2026-05-28',created_at:'2026-01-15' },
];
