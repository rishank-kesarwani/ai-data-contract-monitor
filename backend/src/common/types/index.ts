export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'DEPRECATED' | 'ARCHIVED';

export type CompatibilityMode = 'BACKWARD' | 'FORWARD' | 'FULL' | 'NONE';

export type FieldType =
  | 'string'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'object'
  | 'array'
  | 'timestamp'
  | 'date';

export type DriftSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type DriftCategory = 'BREAKING' | 'POTENTIALLY_RISKY' | 'NON_BREAKING';

export type RemediationStatus =
  | 'DETECTED'
  | 'REVIEWING'
  | 'MIGRATION_PROPOSED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESOLVED';

export type ConsumerInterface =
  | 'EVENT_STREAM'
  | 'REST_API'
  | 'SQL_VIEW'
  | 'BATCH_ETL';

export type ConsumerCriticality = 'BLOCKING' | 'DEGRADED' | 'INFO';

export type ApprovalDecision = 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';

export type QualityCheckType =
  | 'NULL_RATE'
  | 'TYPE_MISMATCH'
  | 'UNEXPECTED_FIELD'
  | 'VALUE_CONSTRAINT'
  | 'CARDINALITY';

export type Role =
  | 'ADMIN'
  | 'DATA_OWNER'
  | 'CONSUMER_LEAD'
  | 'PUBLIC_VIEWER';

export interface FieldConstraints {
  pattern?: string;
  minimum?: number;
  maximum?: number;
  enum?: (string | number)[];
  maxNullRate?: number; // e.g. 0.05 for 5% max nulls
  isUnique?: boolean;
  isPii?: boolean;
}

export interface SchemaField {
  name: string;
  type: FieldType;
  nullable: boolean;
  required: boolean;
  description?: string;
  defaultValue?: any;
  constraints?: FieldConstraints;
}

export interface ContractOwner {
  team: string;
  contact: string;
  tier: 'TIER_1' | 'TIER_2' | 'TIER_3';
  serviceName?: string;
}

export interface RegisteredConsumer {
  id: string;
  name: string;
  team: string;
  contact: string;
  tier: 'TIER_1' | 'TIER_2' | 'TIER_3';
  interfaceType: ConsumerInterface;
  consumedFields: string[];
  criticality: ConsumerCriticality;
  sla?: string;
  description?: string;
}

export interface ContractVersionEntry {
  version: string;
  updatedAt: string;
  author: string;
  changeSummary: string;
  schemaSnapshot: SchemaField[];
}

export interface Contract {
  id: string;
  name: string;
  description: string;
  domain: string;
  status: ContractStatus;
  version: string;
  owner: ContractOwner;
  compatibilityMode: CompatibilityMode;
  isStrict: boolean; // if true, unexpected fields are treated as violations
  schema: SchemaField[];
  consumers: RegisteredConsumer[];
  versionHistory: ContractVersionEntry[];
  createdAt: string;
  updatedAt: string;
  lastEvaluatedAt?: string;
  activeDriftId?: string;
}

export interface SnapshotField {
  name: string;
  inferredType: FieldType;
  nullable: boolean;
  nullCount: number;
  nullRate: number;
  distinctCount?: number;
  sampleValues: (string | number | boolean)[];
  observedMin?: number | string;
  observedMax?: number | string;
}

export interface SchemaSnapshot {
  id: string;
  contractId: string;
  version: string;
  source: string;
  environment: 'production' | 'staging' | 'development';
  timestamp: string;
  recordCountSampled: number;
  fieldCount: number;
  fields: SnapshotField[];
  rawJsonSchema?: Record<string, any>;
  checksum: string;
  metadata?: Record<string, any>;
}

export interface DriftChange {
  id: string;
  field: string;
  category: DriftCategory;
  severity: DriftSeverity;
  changeType:
    | 'FIELD_REMOVED'
    | 'FIELD_ADDED'
    | 'TYPE_CHANGED'
    | 'NULLABILITY_VIOLATED'
    | 'CONSTRAINT_VIOLATED'
    | 'UNEXPECTED_FIELD'
    | 'POSSIBLE_RENAME';
  contractValue?: any;
  observedValue?: any;
  description: string;
  impactScore: number; // 0 to 100
  affectedConsumers: string[]; // consumer IDs
}

export interface ConsumerImpact {
  consumerId: string;
  consumerName: string;
  team: string;
  contact: string;
  interfaceType: ConsumerInterface;
  criticality: ConsumerCriticality;
  impactedFields: string[];
  riskSummary: string;
  status: 'FAILING' | 'DEGRADED' | 'AFFECTED' | 'UNAFFECTED';
}

export interface QualityCheckResult {
  id: string;
  checkType: QualityCheckType;
  field: string;
  passed: boolean;
  severity: DriftSeverity;
  threshold?: any;
  observed: any;
  message: string;
  timestamp: string;
}

export interface DriftReport {
  id: string;
  contractId: string;
  contractName: string;
  snapshotId: string;
  detectionTime: string;
  overallSeverity: DriftSeverity;
  categorySummary: {
    breakingCount: number;
    riskyCount: number;
    nonBreakingCount: number;
  };
  remediationStatus: RemediationStatus;
  changes: DriftChange[];
  impactedConsumers: ConsumerImpact[];
  qualityChecks: QualityCheckResult[];
  activeProposalId?: string;
}

export interface MigrationPhase {
  phaseNumber: number;
  phaseName: string;
  objective: string;
  actions: string[];
  rollbackPlan: string;
}

export interface MigrationProposal {
  id: string;
  driftReportId: string;
  contractId: string;
  currentVersion: string;
  proposedVersion: string;
  title: string;
  executiveSummary: string;
  rootCauseAnalysis: string;
  compatibilityImpact: string;
  phases: MigrationPhase[];
  proposedSchema: SchemaField[];
  schemaDiff: {
    added: SchemaField[];
    removed: SchemaField[];
    modified: {
      field: string;
      before: Partial<SchemaField>;
      after: Partial<SchemaField>;
    }[];
  };
  codeSnippets: {
    language: string;
    title: string;
    code: string;
  }[];
  generatedBy: 'AI_PLATFORM' | 'DETERMINISTIC_ENGINE';
  createdAt: string;
  approvalStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
}

export interface ApprovalDecisionRecord {
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  decision: ApprovalDecision;
  comments: string;
  decidedAt: string;
}

export interface ApprovalRequest {
  id: string;
  proposalId: string;
  contractId: string;
  driftReportId: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  requiredApprovals: number;
  currentApprovals: number;
  decisions: ApprovalDecisionRecord[];
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action:
    | 'CONTRACT_CREATED'
    | 'CONTRACT_UPDATED'
    | 'CONTRACT_PUBLISHED'
    | 'SNAPSHOT_INGESTED'
    | 'DRIFT_DETECTED'
    | 'QUALITY_CHECK_RUN'
    | 'MIGRATION_PROPOSED'
    | 'APPROVAL_SUBMITTED'
    | 'APPROVAL_RESOLVED'
    | 'DEMO_RESET'
    | 'SETTINGS_CHANGED';
  actorId: string;
  actorName: string;
  actorRole: string;
  resourceType: 'CONTRACT' | 'SNAPSHOT' | 'DRIFT' | 'PROPOSAL' | 'APPROVAL' | 'SYSTEM';
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  correlationId?: string;
}

export interface UserSession {
  id: string;
  username: string;
  role: Role;
  team?: string;
}
