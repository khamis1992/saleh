
// =====================================================
// PHASE 8 — BIM / BIOMETRICS / FUTURE TYPES
// =====================================================

// 8.1 BIM / 3D
export type BimFileFormat = 'ifc' | 'rvt' | 'nwd' | 'obj' | 'gltf' | 'dwg' | 'fbx';
export type BimModelStatus = 'uploaded' | 'processing' | 'ready' | 'error' | 'archived';
export interface BimModel { id: string; company_id: string; project_id: string; model_name: string; discipline: 'architectural' | 'structural' | 'mep' | 'civil' | 'interior' | 'landscape' | 'coordination'; file_format: BimFileFormat; file_size_mb: number; file_url: string; version: string; author: string; status: BimModelStatus; element_count: number; floor_count: number; lod: 'LOD100' | 'LOD200' | 'LOD300' | 'LOD350' | 'LOD400'; uploaded_by: string; uploaded_at: string; processed_at: string; last_viewed_at: string; notes: string; }
export interface BimElement { id: string; model_id: string; global_id: string; element_type: string; element_name: string; level: string; phase: string; material: string; volume_m3: number; area_m2: number; length_m: number; properties_json: string; }
export interface BimClash { id: string; model_id: string; element_a_id: string; element_b_id: string; clash_type: 'hard' | 'clearance' | 'duplicate'; status: 'new' | 'active' | 'reviewed' | 'approved' | 'resolved'; distance_mm: number; point_x: number; point_y: number; point_z: number; description: string; assigned_to: string; assigned_at: string; resolved_at: string; }

// 8.2 Biometric
export type BiometricDeviceType = 'zk_fingerprint' | 'zk_face' | 'zk_palm' | 'zk_iris' | 'hikvision' | 'suprema';
export type BiometricDeviceStatus = 'online' | 'offline' | 'maintenance' | 'error';
export interface BiometricDevice { id: string; company_id: string; device_name: string; device_type: BiometricDeviceType; serial_number: string; ip_address: string; port: number; location: string; model: string; firmware_version: string; status: BiometricDeviceStatus; last_sync_at: string; storage_capacity: number; stored_templates: number; created_at: string; updated_at: string; }
export interface BiometricTemplate { id: string; employee_id: string; device_id: string; finger_index: number; template_data_hash: string; quality_score: number; registered_at: string; enrolled_by: string; status: 'active' | 'expired' | 'revoked'; }
export interface BiometricAttendanceRecord { id: string; company_id: string; employee_id: string; device_id: string; template_id: string; punch_time: string; punch_type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'overtime_in' | 'overtime_out'; verification_method: 'fingerprint' | 'face' | 'palm' | 'card' | 'pin'; verification_score: number; is_verified: boolean; is_duress: boolean; temperature_celsius: number; mask_detected: boolean; photo_url: string; synced_at: string; notes: string; }
export interface BiometricDeviceSync { id: string; device_id: string; sync_type: 'full' | 'incremental' | 'template_push' | 'template_pull'; started_at: string; completed_at: string; records_transferred: number; status: 'running' | 'completed' | 'failed'; error_message: string; }

// 8.3 Advanced Mapping
export type MapProvider = 'mapbox' | 'google' | 'esri' | 'tomtom' | 'what3words';
export interface MapLayer { id: string; company_id: string; layer_name: string; provider: MapProvider; layer_type: 'tiles' | 'vector' | 'heatmap' | 'cluster' | '3d_buildings' | 'satellite' | 'traffic' | 'demographics'; access_token_masked: string; style_url: string; is_active: boolean; z_index: number; opacity: number; created_at: string; }
export interface MapLocation { id: string; company_id: string; entity_type: 'land' | 'project' | 'property' | 'unit' | 'contractor'; entity_id: string; label: string; lat: number; lng: number; w3w_address: string; radius_m: number; icon: string; color: string; cluster_group: string; metadata_json: string; }
export interface MapHeatmapData { id: string; company_id: string; map_name: string; data_type: 'property_value' | 'occupancy' | 'rent_price' | 'maintenance_requests' | 'crime_rate' | 'schools' | 'transport'; points_json: string; gradient_colors: string[]; radius_px: number; max_weight: number; created_at: string; }

// 8.4 OCR
export type OcrEngine = 'tesseract' | 'google_vision' | 'azure_form' | 'adobe' | 'docparser';
export interface OcrProcessing { id: string; company_id: string; file_name: string; file_url: string; file_type: 'pdf' | 'image' | 'scan' | 'photo'; page_count: number; engine: OcrEngine; language: string; status: 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed'; result_text: string; confidence: number; extracted_fields_json: string; processing_time_ms: number; created_at: string; completed_at: string; }
export interface OcrTemplate { id: string; company_id: string; template_name: string; document_type: 'contract' | 'invoice' | 'receipt' | 'id_card' | 'passport' | 'title_deed' | 'cr_certificate' | 'custom'; fields_definition_json: string; is_active: boolean; created_at: string; updated_at: string; }

// 8.5 Open Source ERP
export type OpenSourceErp = 'erpnext' | 'odoo' | 'crater' | 'dolibarr' | 'metabase' | 'superset' | 'grafana';
export interface ErpIntegrationStudy { id: string; company_id: string; erp_system: OpenSourceErp; module: string; study_status: 'planned' | 'in_review' | 'evaluated' | 'recommended' | 'not_recommended' | 'adopted'; fit_score: number; cost_estimate_qar: number; implementation_months: number; requirements_json: string; pros: string[]; cons: string[]; gaps: string[]; api_available: boolean; localization_score: number; community_size: string; license_type: string; reviewed_by: string; reviewed_at: string; notes: string; }

// 8.6 Research Data
export type ResearchSource = 'world_bank' | 'imf' | 'trading_economics' | 'numbeo' | 'oecd' | 'un_data' | 'opendata';
export interface ResearchDataset { id: string; company_id: string; source: ResearchSource; dataset_name: string; category: 'gdp' | 'population' | 'infrastructure' | 'housing' | 'employment' | 'inflation' | 'property_prices' | 'construction_costs' | 'demographics' | 'custom'; country: string; indicator_code: string; description: string; frequency: 'annual' | 'quarterly' | 'monthly'; latest_value: number; latest_year: number; value_unit: string; trend_direction: 'up' | 'down' | 'stable'; trend_percent: number; metadata_json: string; fetched_at: string; }
export interface MarketIndicator { id: string; company_id: string; market_name: string; country: string; city: string; property_type: string; avg_price_sqm: number; avg_rent_yield: number; occupancy_rate: number; yoy_price_change: number; yoy_rent_change: number; supply_pipeline: number; demand_index: number; investment_volume: number; data_source: ResearchSource; last_updated: string; }

// 8.7 Blockchain
export type Blockchain = 'solana' | 'ethereum' | 'polygon' | 'avalanche';
export type PropertyTokenStatus = 'draft' | 'minted' | 'listed' | 'sold' | 'transferred' | 'burned';
export interface PropertyToken { id: string; company_id: string; property_id: string; blockchain: Blockchain; token_name: string; token_symbol: string; token_address: string; mint_tx_hash: string; total_supply: number; token_price_est: number; property_value_usd: number; fractional_ownership: boolean; fractions_available: number; fractions_sold: number; status: PropertyTokenStatus; minted_at: string; listed_at: string; owner_wallet: string; metadata_ipfs_hash: string; created_by: string; created_at: string; notes: string; }
export interface BlockchainTransaction { id: string; token_id: string; tx_type: 'mint' | 'transfer' | 'sale' | 'burn' | 'stake'; tx_hash: string; from_wallet: string; to_wallet: string; amount: number; gas_fee: number; gas_currency: string; block_number: number; block_timestamp: string; status: 'pending' | 'confirmed' | 'failed'; confirmed_at: string; explorer_url: string; }
export interface Web3Wallet { id: string; company_id: string; wallet_name: string; wallet_address: string; blockchain: Blockchain; balance: number; balance_usd: number; is_multisig: boolean; signers: string[]; required_signatures: number; connected_dapp: string; last_activity_at: string; created_at: string; }
