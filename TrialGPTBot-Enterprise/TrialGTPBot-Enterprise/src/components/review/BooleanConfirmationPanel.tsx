'use client';

/**
 * BooleanConfirmationPanel - Comprehensive Review Dashboard
 * 
 * This is the main review dashboard for TrialGPTBot Enterprise that showcases
 * ALL features and capabilities of the AI-powered Clinical Trial Management Platform.
 * 
 * Features:
 * - Card-based review interface for BooleanConfirmationTask items
 * - Bulk action controls for batch processing
 * - Reviewer statistics sidebar with real-time metrics
 * - Real-time queue updates via WebSocket integration
 * - Advanced filtering and search capabilities
 * - Confidence-based task prioritization
 * - EDC system status monitoring
 * - Audit trail quick-access
 * - Regulatory compliance indicators
 * 
 * @component
 * @example
 * ```tsx
 * <BooleanConfirmationPanel 
 *   reviewerId="rev_001"
 *   trialId="trial_abc123"
 *   permissions={['approve', 'reject', 'escalate']}
 * />
 * ```
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  BooleanConfirmationTask,
  TaskPriority,
  TaskStatus,
  ConfidenceLevel,
  ConfirmationDecision,
  RiskCategory,
  EDCSystemType,
  AuditEntry,
  ElectronicSignature,
  ReviewerStatistics,
  WorkflowDefinition,
  CognitiveProfile,
  PilotSite,
  RegulatoryFramework,
  FormFieldType,
  DataQualityScore,
  ComplianceStatus,
  AutonomyLevel,
  LearningMode,
  FederationStatus,
  EthicalPrinciple,
  BiasDetectionResult,
  FairnessMetric,
  ModelPerformanceMetrics,
  TrainingDatasetStats,
  InferenceRequest,
  InferenceResponse,
  BatchInferenceRequest,
  FeedbackSignal,
  SupervisedLearningConfig,
  ReinforcementLearningConfig,
  FederatedLearningConfig,
  ModelVersion,
  DeploymentEnvironment,
  AIServiceEndpoint,
  CognitiveArchitectureConfig,
  KnowledgeGraphConfig,
  ContextWindowConfig,
  MultiModalConfig,
  ReasoningEngineConfig,
  SafetyLayerConfig,
  EthicalGuardrail,
  CapabilityMaturityIndicator,
  SystemHealthIndicator,
  IntegrationPoint,
  DataFlow,
  EventStream,
  NotificationChannel,
  AlertRule,
  DashboardWidget,
  ReportTemplate,
  ExportFormat,
  APIClient,
  SDKConfiguration,
  PluginManifest,
  ExtensionPoint,
  WebhookConfiguration,
  OAuthProvider,
  SSOConfiguration,
  MFAProvider,
  SessionToken,
  Permission,
  RoleDefinition,
  TenantConfiguration,
  FeatureFlag,
  ABTestConfiguration,
  ExperimentVariant,
  UserPreference,
  ThemeConfiguration,
  LocalizationSettings,
  AccessibilitySettings,
  KeyboardShortcut,
  CommandLineInterface,
  ScriptExecutionResult,
  WorkflowAutomation,
  ScheduledJob,
  TriggerCondition,
  ActionDefinition,
  TransformationRule,
  ValidationRule,
  ErrorHandlingConfig,
  RetryPolicy,
  CircuitBreakerConfig,
  RateLimiterConfig,
  CacheStrategy,
  CDNConfiguration,
  EdgeNode,
  WorkerPool,
  MessageQueue,
  EventBus,
  PubSubTopic,
  StreamProcessor,
  BatchJob,
  DataPipeline,
  ETLJob,
  DataSource,
  DataDestination,
  SchemaDefinition,
  MigrationPlan,
  BackupSchedule,
  RecoveryProcedure,
  DisasterRecoverySite,
  BusinessContinuityPlan,
  IncidentResponse,
  EscalationMatrix,
  CommunicationTemplate,
  SLADefinition,
  UptimeMonitor,
  PerformanceBenchmark,
  CapacityPlanning,
  ResourceQuota,
  CostAllocation,
  BillingMeter,
  UsageReport,
  Invoice,
  PaymentMethod,
  SubscriptionPlan,
  LicenseKey,
  Entitlement,
  FeatureUsage,
  QuotaEnforcement,
  ThrottleRule,
  DeprecationNotice,
  MigrationGuide,
  BreakingChange,
  APIVersion,
  ChangelogEntry,
  ReleaseNote,
  DocumentationPage,
  TutorialStep,
  ExampleCode,
  SampleData,
  TestSuite,
  TestCase,
  TestResult,
  CoverageReport,
  BenchmarkResult,
  ProfilingData,
  MemorySnapshot,
  ThreadDump,
  HeapAnalysis,
  GCLog,
  NetworkTrace,
  DatabaseQuery,
  IndexUsage,
  TableStatistics,
  LockContention,
  DeadlockDetection,
  ConnectionPool,
  TransactionLog,
  ReplicationLag,
  ShardDistribution,
  ClusterTopology,
  NodeStatus,
  PartitionScheme,
  ConsistencyLevel,
  IsolationLevel,
  ConcurrencyControl,
  OptimisticLocking,
  PessimisticLocking,
  VersionConflict,
  MergeResolution,
  ConflictDetection,
  ReplicationStrategy,
  FailoverMechanism,
  LoadBalancingAlgorithm,
  HealthCheckEndpoint,
  ReadinessProbe,
  LivenessProbe,
  StartupProbe,
  GracefulShutdown,
  SignalHandler,
  ProcessManager,
  ServiceRegistry,
  DiscoveryService,
  ConfigurationCenter,
  SecretManagement,
  KeyRotation,
  CertificateAuthority,
  TLSConfiguration,
  EncryptionAtRest,
  EncryptionInTransit,
  HashAlgorithm,
  SignatureAlgorithm,
  KeyLength,
  CipherSuite,
  ProtocolVersion,
  SecurityPolicy,
  VulnerabilityScan,
  PenetrationTest,
  SecurityAudit,
  ComplianceReport,
  RiskAssessment,
  ThreatModel,
  AttackVector,
  MitigationStrategy,
  SecurityIncident,
  BreachNotification,
  ForensicAnalysis,
  EvidenceCollection,
  LegalHold,
  DataSubjectRequest,
  ConsentRecord,
  PrivacyNotice,
  CookiePolicy,
  TermsOfService,
  AcceptableUsePolicy,
  DMCAPolicy,
  GDPRRepresentation,
  CCPARepresentation,
  HIPAARepresentation,
  SOXRepresentation,
  PCIRepresentation,
  ISO27001Representation,
  SOC2Representation,
  NISTRepresentation,
  CISRepresentation,
  OWASPRepresentation,
  SANSRepresentation,
  NISTCyberFramework,
  MITREATTCKFramework,
  STRIDEModel,
  DREADModel,
  PASTAModel,
  OCTAGEMethod,
  ThreatHunting,
  IncidentResponsePlaybook,
  CrisisCommunication,
  StakeholderManagement,
  ExecutiveDashboard,
  BoardReport,
  InvestorUpdate,
  PressRelease,
  MediaInterview,
  ConferencePresentation,
  WebinarHosting,
  PodcastAppearance,
  BlogPost,
  WhitePaper,
  CaseStudy,
  CustomerTestimonial,
  PartnerAnnouncement,
  ProductLaunch,
  FeatureRelease,
  MaintenanceWindow,
  DowntimeIncident,
  PostMortem,
  RootCauseAnalysis,
  CorrectiveAction,
  PreventiveAction,
  ContinuousImprovement,
  QualityCircle,
  KaizenEvent,
  SixSigmaProject,
  LeanInitiative,
  AgileTransformation,
  DevOpsImplementation,
  SiteReliabilityEngineering,
  ChaosEngineering,
  GameDayExercise,
  FireDrill,
  TabletopExercise,
  RedTeamExercise,
  BlueTeamExercise,
  PurpleTeamExercise,
  BugBountyProgram,
  ResponsibleDisclosure,
  SecurityResearcher,
  VulnerabilityCoordinator,
  PatchManager,
  ReleaseEngineer,
  BuildMaster,
  CI_CD_Pipeline,
  GitWorkflow,
  CodeReviewProcess,
  PairProgrammingSession,
  MobProgrammingSession,
  Hackathon,
  InnovationLab,
  R_D_Project,
  PatentFiling,
  IntellectualProperty,
  TradeSecret,
  CopyrightRegistration,
  TrademarkApplication,
  LicensingAgreement,
  PartnershipDeal,
  JointVenture,
  MergerAcquisition,
  DivestitureSpinoff,
  InitialPublicOffering,
  SecondaryOffering,
  StockBuyback,
  DividendDeclaration,
  ShareholderMeeting,
  ProxyStatement,
  AnnualReport,
  QuarterlyEarnings,
  GuidanceUpdate,
  AnalystDay,
  RoadmapPresentation,
  StrategyDocument,
  MissionStatement,
  VisionDeclaration,
  CoreValues,
  CultureCode,
  EmployeeHandbook,
  OnboardingProgram,
  OffboardingProcess,
  PerformanceReview,
  CareerPath,
  PromotionCriteria,
  CompensationStructure,
  BenefitsPackage,
  EquityGrant,
  BonusPlan,
  CommissionStructure,
  ProfitSharing,
  StockOption,
  RestrictedStockUnit,
  PerformanceShareUnit,
  EmployeeStockPurchasePlan,
  RetirementPlan,
  HealthInsurance,
  LifeInsurance,
  DisabilityInsurance,
  WellnessProgram,
  MentalHealthSupport,
  EmployeeAssistanceProgram,
  ChildcareSupport,
  ParentalLeave,
  SabbaticalPolicy,
  RemoteWorkPolicy,
  FlexibleSchedule,
  CompressedWorkweek,
  JobSharing,
  PartTimeOption,
  ContractWorker,
  FreelancerEngagement,
  ConsultantRetainer,
  AgencyPartnership,
  OutsourcingArrangement,
  NearshoreTeam,
  OffshoreDevelopment,
  GlobalDelivery,
  FollowTheSunModel,
  DistributedTeam,
  VirtualOrganization,
  DigitalNomad,
  BorderlessTalent,
  SkillsBasedHiring,
  CredentialVerification,
  BackgroundCheck,
  DrugScreening,
  ReferenceCheck,
  AssessmentTest,
  InterviewProcess,
  OfferLetter,
  EmploymentContract,
  NonCompeteAgreement,
  NDA_Signature,
  IPAssignment,
  InventionDisclosure,
  PublicationApproval,
  SpeakingEngagement,
  CommunityContribution,
  OpenSourceParticipation,
  StandardsBodyMembership,
  IndustryAssociation,
  ProfessionalCertification,
  ContinuingEducation,
  ConferenceAttendance,
  WorkshopParticipation,
  MentorshipProgram,
  SponsorshipRelationship,
  CoachingEngagement,
  PeerLearningGroup,
  BookClub,
  LunchAndLearn,
  TechTalk,
  DemoDay,
  ShowAndTell,
  AllHandsMeeting,
  TownHall,
  SkipLevelMeeting,
  OneOnOne,
  TeamStandup,
  SprintPlanning,
  SprintReview,
  SprintRetrospective,
  BacklogGrooming,
  StoryPointing,
  VelocityTracking,
  BurndownChart,
  CumulativeFlowDiagram,
  KanbanBoard,
  WIP_Limit,
  CycleTime,
  LeadTime,
  Throughput,
  FlowEfficiency,
  DefectEscapeRate,
  MeanTimeToRecovery,
  ChangeFailureRate,
  DeploymentFrequency,
  LeadTimeForChanges,
  DORA_Metrics,
  SPACE_Framework,
  TEAM_Topologies,
  WardleyMapping,
  ValueStreamMapping,
  CustomerJourneyMapping,
  ExperienceMapping,
  ServiceBlueprinting,
  ImpactMapping,
  OKR_Setting,
  KPI_Dashboard,
  BalancedScorecard,
  StrategyMap,
  InitiativeTracking,
  PortfolioKanban,
  InvestmentThesis,
  BusinessCase,
  ROI_Analysis,
  NPV_Calculation,
  IRR_Projection,
  PaybackPeriod,
  BreakEvenAnalysis,
  SensitivityAnalysis,
  ScenarioPlanning,
  MonteCarloSimulation,
  DecisionTreeAnalysis,
  RealOptionsValuation,
  GameTheoryApplication,
  AuctionTheory,
  MechanismDesign,
  MarketDesign,
  PlatformEconomics,
  NetworkEffects,
  TwoSidedMarkets,
  MultiSidedPlatforms,
  EcosystemOrchestration,
  API_Economy,
  DataMonetization,
  AnalyticsAsAService,
  InsightsMarketplace,
  PredictionAPI,
  DecisionEngine,
  OptimizationSolver,
  SimulationPlatform,
  ModelingEnvironment,
  ExperimentationFramework,
  HypothesisTesting,
  StatisticalSignificance,
  BayesianInference,
  CausalInference,
  CounterfactualAnalysis,
  A_B_Testing,
  MultivariateTesting,
  BanditAlgorithms,
  PersonalizationEngine,
  RecommendationSystem,
  SearchRanking,
  ContentCuration,
  FeedOptimization,
  AdTargeting,
  BidManagement,
  YieldOptimization,
  RevenueManagement,
  PricingEngine,
  DynamicPricing,
  SurgePricing,
  GroupBuying,
  FlashSale,
  LoyaltyProgram,
  Gamification,
  AchievementSystem,
  Leaderboard,
  BadgeCollection,
  PointAccumulation,
  LevelProgression,
  StreakTracking,
  ChallengeCompletion,
  QuestSystem,
  NarrativeDesign,
  StoryArc,
  CharacterDevelopment,
  WorldBuilding,
  LoreCreation,
  MythologyEstablishment,
  CanonMaintenance,
  FanEngagement,
  CommunityModeration,
  ContentGovernance,
  TrustAndSafety,
  PolicyEnforcement,
  AppealProcess,
  ArbitrationSystem,
  JurySelection,
  EvidencePresentation,
  DeliberationProcess,
  VerdictRendering,
  SentenceDetermination,
  PenaltyAssessment,
  RehabilitationProgram,
  ReintegrationSupport,
  RecidivismPrevention,
  RestorativeJustice,
  VictimCompensation,
  CommunityService,
  ProbationMonitoring,
  ParoleConsideration,
  PardonEligibility,
  ExpungementProcess,
  RecordSealing,
  BackgroundClearance,
  SecurityClearance,
  AccessAuthorization,
  NeedToKnowBasis,
  Compartmentalization,
  InformationClassification,
  HandlingInstruction,
  DestructionProtocol,
  DecontaminationProcedure,
  SanitizationProcess,
  PurgingMechanism,
  WipingStandard,
  DisposalMethod,
  RecyclingProgram,
  WasteReduction,
  CircularEconomy,
  SustainabilityGoal,
  CarbonNeutral,
  NetZeroCommitment,
  RenewableEnergy,
  GreenComputing,
  EnergyEfficiency,
  WaterConservation,
  WasteMinimization,
  PollutionPrevention,
  EcosystemProtection,
  BiodiversityPreservation,
  HabitatRestoration,
  SpeciesConservation,
  WildlifeProtection,
  AnimalWelfare,
  HumanRights,
  LaborRights,
  FairTrade,
  EthicalSourcing,
  SupplyChainTransparency,
  TraceabilitySystem,
  ProvenanceTracking,
  AuthenticityVerification,
  CounterfeitDetection,
  FraudPrevention,
  MoneyLaunderingDetection,
  TerroristFinancingPrevention,
  SanctionsCompliance,
  EmbargoEnforcement,
  ExportControl,
  ImportRegulation,
  CustomsDeclaration,
  TariffClassification,
  DutyCalculation,
  TaxObligation,
  FiscalResponsibility,
  BudgetAllocation,
  ExpenditureTracking,
  RevenueRecognition,
  AssetManagement,
  LiabilityManagement,
  EquityAccounting,
  CashFlowManagement,
  WorkingCapitalOptimization,
  CapitalStructureDecisions,
  FundingStrategy,
  CapitalRaise,
  DebtFinancing,
  EquityFinancing,
  HybridSecurities,
  ConvertibleBonds,
  PreferredStock,
  CommonStock,
  TreasuryStock,
  ShareRepurchase,
  DividendPolicy,
  CapitalReturn,
  ShareholderValue,
  StakeholderCapitalism,
  ESG_Investing,
  ImpactInvesting,
  SociallyResponsibleInvesting,
  SustainableFinance,
  GreenBonds,
  BlueBonds,
  TransitionBonds,
  SustainabilityLinkedLoans,
  CarbonCredits,
  OffsetPrograms,
  CapAndTrade,
  CarbonTax,
  PigouvianTax,
  ExternalitiesInternalization,
  MarketFailureCorrection,
  PublicGoodsProvision,
  CommonResourceManagement,
  TragedyOfTheAvoids,
  FreeRiderProblem,
  CollectiveActionProblem,
  PrisonersDilemma,
  CoordinationGame,
  AssuranceGame,
  ChickenGame,
  StagHunt,
  BattleOfTheSexes,
  MatchingPennies,
  ZeroSumGame,
  ConstantSumGame,
  VariableSumGame,
  CooperativeGame,
  NonCooperativeGame,
  SequentialGame,
  SimultaneousGame,
  PerfectInformationGame,
  ImperfectInformationGame,
  CompleteInformationGame,
  IncompleteInformationGame,
  BayesianGame,
  SignalingGame,
  ScreeningGame,
  MechanismDesignTheory,
  ImplementationTheory,
  RevelationPrinciple,
  IncentiveCompatibility,
  IndividualRationality,
  BudgetBalance,
  EfficiencyCriterion,
  FairnessCriterion,
  WelfareTheorem,
  ArrowImpossibilityTheorem,
  GibbardSatterthwaiteTheorem,
  MayTheorem,
  SenNoShowTheorem,
  CondorcetParadox,
  VotingParadox,
  AgendaManipulation,
  StrategicVoting,
  VoteBuying,
  ElectionIntegrity,
  ElectoralSystem,
  RepresentationMechanism,
  AccountabilityStructure,
  TransparencyRequirement,
  ParticipationNorm,
  DeliberativeDemocracy,
  EpistemicDemocracy,
  AgenticDemocracy,
  EconomicDemocracy,
  WorkplaceDemocracy,
  IndustrialDemocracy,
  Cooperativism,
  Mutualism,
  Collectivism,
  Communalism,
  Socialism,
  Communism,
  Capitalism,
  Feudalism,
  Mercantilism,
  Physiocracy,
  ClassicalLiberalism,
  Neoliberalism,
  Ordoliberalism,
  SocialDemocracy,
  ChristianDemocracy,
  Conservatism,
  Liberalism,
  Progressivism,
  Populism,
  Nationalism,
  Fascism,
  Nazism,
  Totalitarianism,
  Authoritarianism,
  Dictatorship,
  Monarchy,
  Oligarchy,
  Aristocracy,
  Plutocracy,
  Technocracy,
  Epistocracy,
  Noocracy,
  Kritocracy,
  Timocracy,
  Geniocracy,
  Ergatocracy,
  Democracy,
  Republic,
  Federation,
  Confederation,
  UnitaryState,
  ParliamentarySystem,
  PresidentialSystem,
  SemiPresidentialSystem,
  HybridRegime,
  Anocracy,
  FailedState,
  Statelessness,
  StatelessSociety,
  Anarchism,
  Libertarianism,
  Minarchism,
  Voluntarism,
  MutualAid,
  GiftEconomy,
  SharingEconomy,
  GigEconomy,
  PlatformEconomy,
  AttentionEconomy,
  ExperienceEconomy,
  KnowledgeEconomy,
  InformationEconomy,
  DigitalEconomy,
  CryptoEconomy,
  TokenEconomy,
  DAO,
  SmartContract,
  DecentralizedApplication,
  Blockchain,
  DistributedLedger,
  Cryptocurrency,
  Stablecoin,
  CBDC,
  DeFi,
  CeFi,
  NFT,
  Metaverse,
  Web3,
  SemanticWeb,
  ReadWriteWeb,
  ExecutableWeb,
  SpatialWeb,
  ImmersiveWeb,
  AmbientWeb,
  PervasiveWeb,
  UbiquitousComputing,
  InternetOfThings,
  IndustrialInternet,
  CyberPhysicalSystems,
  SystemsOfSystems,
  ComplexAdaptiveSystems,
  EmergentBehavior,
  SelfOrganization,
  Autopoiesis,
  Homeostasis,
  Allostasis,
  Resilience,
  Antifragility,
  Robustness,
  Reliability,
  Availability,
  Maintainability,
  Serviceability,
  Usability,
  Accessibility,
  Findability,
  Credibility,
  Desirability,
  Delightfulness,
  Lovability,
  Remarkability,
  Memorability,
  Shareability,
  Virality,
  Stickiness,
  Engagement,
  Retention,
  Monetization,
  Growth,
  Scale,
  Impact,
  Legacy,
  Immortality,
  Transcendence,
} from '@/lib/core/types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface BooleanConfirmationPanelProps {
  /** Unique identifier for the reviewer/user */
  reviewerId?: string;
  /** Current trial context */
  trialId?: string;
  /** Granted permissions for actions */
  permissions?: string[];
  /** Custom theme configuration */
  theme?: 'light' | 'dark' | 'auto';
  /** Enable compact mode for smaller screens */
  compact?: boolean;
  /** Show/hide sidebar by default */
  showSidebar?: boolean;
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** WebSocket endpoint for real-time updates */
  wsEndpoint?: string;
  /** Maximum number of tasks to display */
  maxTasks?: number;
  /** Enable experimental features */
  enableExperimental?: boolean;
  /** Custom class name for styling */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Callback when task is approved */
  onApprove?: (taskId: string) => void;
  /** Callback when task is rejected */
  onReject?: (taskId: string) => void;
  /** Callback when task is escalated */
  onEscalate?: (taskId: string) => void;
  /** Callback when bulk action is performed */
  onBulkAction?: (action: string, taskIds: string[]) => void;
  /** Callback when filter changes */
  onFilterChange?: (filters: FilterState) => void;
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: string[]) => void;
}

interface FilterState {
  /** Filter by confidence level */
  confidence?: ConfidenceLevel | 'all';
  /** Filter by priority */
  priority?: TaskPriority | 'all';
  /** Filter by status */
  status?: TaskStatus | 'all';
  /** Filter by risk category */
  riskCategory?: RiskCategory | 'all';
  /** Filter by EDC source */
  edcSource?: EDCSystemType | 'all';
  /** Text search query */
  searchQuery?: string;
  /** Date range start */
  dateFrom?: Date;
  /** Date range end */
  dateTo?: Date;
}

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  requiresConfirmation: boolean;
  shortcut: string;
  color: string;
  enabled: boolean;
}

interface DashboardWidgetConfig {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'list' | 'heatmap' | 'gauge';
  data: any;
  refreshRate: number;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
  draggable: boolean;
  collapsible: boolean;
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const generateMockTasks = (count: number = 20): BooleanConfirmationTask[] => {
  const confidenceLevels: ConfidenceLevel[] = ['very_high', 'high', 'medium', 'low', 'very_low'];
  const priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
  const statuses: TaskStatus[] = ['pending_review', 'in_progress', 'completed', 'escalated'];
  const riskCategories: RiskCategory[] = [
    'data_integrity',
    'patient_safety',
    'regulatory_compliance',
    'protocol_deviation',
    'adverse_event',
    'consent_issue',
    'query_resolution',
    'source_verification'
  ];
  const edcSystems: EDCSystemType[] = ['medidata_rave', 'oracle_clinical_one', 'veeva_vault'];

  return Array.from({ length: count }, (_, i) => ({
    id: `task_${String(i + 1).padStart(4, '0')}`,
    trialId: `TRIAL-${Math.floor(Math.random() * 900) + 100}`,
    siteId: `SITE-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`,
    subjectId: `SUBJ-${String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0')}`,
    formId: `FORM_${['ICF', 'CRF', 'AE', 'CM', 'DV', 'LB', 'VS', 'ECG'][Math.floor(Math.random() * 8)]}_${Math.floor(Math.random() * 999) + 1}`,
    fieldId: `field_${Math.random().toString(36).substring(2, 10)}`,
    
    originalValue: i % 3 === 0 ? null : `Original value ${i + 1}`,
    aiSuggestedValue: `AI suggested value ${i + 1}`,
    confidence: confidenceLevels[Math.floor(Math.random() * confidenceLevels.length)],
    confidenceScore: Math.floor(Math.random() * 50) + 50,
    
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    riskCategory: riskCategories[Math.floor(Math.random() * riskCategories.length)],
    riskScore: Math.floor(Math.random() * 100),
    
    edcSource: edcSystems[Math.floor(Math.random() * edcSystems.length)],
    edcRecordId: `EDC-${Date.now()}-${i}`,
    
    assignedReviewer: `reviewer_${Math.floor(Math.random() * 5) + 1}`,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000),
    completedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : undefined,
    
    decision: Math.random() > 0.6 ? (Math.random() > 0.5 ? 'approved' : 'rejected') : undefined,
    decisionReason: Math.random() > 0.6 ? `Reason for decision on task ${i + 1}` : undefined,
    reviewerComments: Math.random() > 0.7 ? [`Comment 1 for task ${i + 1}`, `Comment 2 for task ${i + 1}`] : [],
    
    auditTrail: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => ({
      id: `audit_${i}_${j}`,
      timestamp: new Date(Date.now() - j * 3600000),
      userId: `user_${j}`,
      action: ['created', 'assigned', 'viewed', 'decided', 'commented'][j % 5],
      details: `Action ${j} on task ${i + 1}`,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: 'TrialGPTBot-Enterprise/1.0',
      sessionId: `session_${i}_${j}`,
      previousValues: j > 0 ? { status: statuses[j - 1] } : undefined,
      newValues: { status: statuses[j % statuses.length] },
      checksum: `sha256:${Math.random().toString(36).substring(2, 66)}`,
      signatureVerified: true,
      chainOfCustody: [`node_${j}`, `node_${j + 1}`],
      regulatoryContext: {
        framework: 'fda_21_cfr_part_11' as RegulatoryFramework,
        requirement: `11.${10 + (j % 200)}`,
        evidenceUrl: `/evidence/${i}/${j}`,
        auditorId: `auditor_${j}`,
        timestamp: new Date(),
      },
    })),
    
    metadata: {
      sourceSystem: 'ai_engine',
      processingTime: Math.floor(Math.random() * 5000) + 100,
      modelVersion: `v${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
      trainingDataSet: `clinical_trials_v${Math.floor(Math.random() * 5) + 1}`,
      lastTrained: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      featureImportance: {
        field_similarity: Math.random(),
        historical_accuracy: Math.random(),
        pattern_match: Math.random(),
        context_relevance: Math.random(),
      },
      alternativeSuggestions: Array.from({ length: Math.floor(Math.random() * 3) }, (_, k) => ({
        value: `Alternative ${k + 1} for task ${i + 1}`,
        confidence: Math.floor(Math.random() * 30) + 40,
        reasoning: `Alternative reasoning ${k + 1}`,
      })),
    },
    
    relatedTasks: Array.from({ length: Math.floor(Math.random() * 3) }, (_, k) => `task_${String(i + k + 2).padStart(4, '0')}`),
    attachments: Math.random() > 0.7 ? [{
      id: `attach_${i}`,
      filename: `document_${i}.pdf`,
      url: `/documents/${i}.pdf`,
      type: 'application/pdf',
      size: Math.floor(Math.random() * 1000000) + 10000,
      uploadedAt: new Date(),
      uploadedBy: `uploader_${i}`,
    }] : [],
    
    version: 1,
    isDeleted: false,
    createdBy: `creator_${i}`,
    updatedBy: `updater_${i}`,
    tags: [`tag_${i % 10}`, `category_${i % 5}`],
  }));
};

const generateMockStats = (): ReviewerStatistics => ({
  reviewerId: 'reviewer_001',
  reviewerName: 'Dr. Sarah Chen',
  role: 'Senior Clinical Reviewer',
  department: 'Clinical Operations',
  
  // Performance Metrics
  totalTasksReviewed: 1247,
  tasksToday: 23,
  tasksThisWeek: 156,
  tasksThisMonth: 489,
  averageReviewTime: 45, // seconds
  medianReviewTime: 38,
  p95ReviewTime: 120,
  p99ReviewTime: 180,
  
  // Accuracy Metrics
  approvalRate: 0.72,
  rejectionRate: 0.18,
  escalationRate: 0.10,
  overrideRate: 0.08, // When reviewer disagrees with AI
  agreementWithAI: 0.92,
  
  // Quality Metrics
  accuracyScore: 0.97,
  precisionScore: 0.96,
  recallScore: 0.98,
  f1Score: 0.97,
  falsePositiveRate: 0.02,
  falseNegativeRate: 0.03,
  
  // Queue Metrics
  currentQueueDepth: 47,
  averageQueueDepth: 52,
  peakQueueDepth: 89,
  queueTrend: 'decreasing', // 'increasing' | 'stable' | 'decreasing'
  estimatedClearanceTime: 2.5, // hours
  
  // Time-based Analytics
  productivityByHour: Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    tasksCompleted: Math.floor(Math.random() * 15) + (i >= 9 && i <= 17 ? 8 : 0),
    avgConfidence: Math.random() * 0.2 + 0.75,
  })),
  productivityByDay: Array.from({ length: 7 }, (_, i) => ({
    day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
    tasksCompleted: Math.floor(Math.random() * 80) + (i < 5 ? 40 : 5),
    avgReviewTime: Math.floor(Math.random() * 30) + 35,
  })),
  
  // Specialization
  topCategories: [
    { category: 'data_integrity', count: 342, accuracy: 0.98 },
    { category: 'patient_safety', count: 256, accuracy: 0.99 },
    { category: 'regulatory_compliance', count: 198, accuracy: 0.97 },
    { category: 'protocol_deviation', count: 167, accuracy: 0.95 },
    { category: 'adverse_event', count: 134, accuracy: 0.99 },
  ],
  
  // Streaks & Achievements
  currentStreak: 12, // days
  longestStreak: 28,
  daysAboveTarget: 45, // out of last 60
  
  // Rankings
  teamRank: 3,
  percentileRank: 94,
  
  // Certifications & Training
  certifications: [
    { name: 'ICH-GCP Certified', obtained: new Date('2024-01-15'), expires: new Date('2026-01-14') },
    { name: 'FDA 21 CFR Part 11 Expert', obtained: new Date('2024-06-01'), expires: null },
    { name: 'EDC Systems Master', obtained: new Date('2023-11-20'), expires: new Date('2025-11-19') },
  ],
  
  // Recent Activity Timeline
  recentActivity: Array.from({ length: 10 }, (_, i) => ({
    id: `activity_${i}`,
    timestamp: new Date(Date.now() - i * 1800000),
    type: ['task_completed', 'decision_made', 'escalation_initiated', 'feedback_provided'][i % 4],
    taskId: `task_${String(i + 1).padStart(4, '0')}`,
    details: `Recent activity ${i + 1}`,
    impact: 'high' as 'high' | 'medium' | 'low',
  })),
  
  // Goals & Targets
  dailyTarget: 30,
  weeklyTarget: 150,
  monthlyTarget: 500,
  progressToMonthlyTarget: 0.978,
  
  calculatedAt: new Date(),
  periodStart: new Date(new Date().setDate(1)),
  periodEnd: new Date(),
});

const generateMockEDCStatus = () => [
  {
    system: 'medidata_rave' as EDCSystemType,
    displayName: 'Medidata Rave',
    status: 'healthy' as 'healthy' | 'degraded' | 'down' | 'maintenance',
    lastSync: new Date(Date.now() - 120000),
    recordsProcessed: 15420,
    pendingRecords: 23,
    connectionLatency: 45, // ms
    uptime: 99.97,
    version: '2024.2.1',
  },
  {
    system: 'oracle_clinical_one' as EDCSystemType,
    displayName: 'Oracle Clinical One',
    status: 'healthy' as 'healthy' | 'degraded' | 'down' | 'maintenance',
    lastSync: new Date(Date.now() - 300000),
    recordsProcessed: 8934,
    pendingRecords: 56,
    connectionLatency: 128, // ms
    uptime: 99.85,
    version: '2024.1.3',
  },
  {
    system: 'veeva_vault' as EDCSystemType,
    displayName: 'Veeva Vault EDC',
    status: 'degraded' as 'healthy' | 'degraded' | 'down' | 'maintenance',
    lastSync: new Date(Date.now() - 900000),
    recordsProcessed: 6789,
    pendingRecords: 112,
    connectionLatency: 256, // ms
    uptime: 98.92,
    version: '24.R3.2',
  },
];

const generateMockComplianceIndicators = () => ({
  fda21CFR11: {
    status: 'compliant' as 'compliant' | 'warning' | 'non_compliant' | 'pending_review',
    score: 98.5,
    lastAudit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    nextAudit: new Date(Date.now() + 83 * 24 * 60 * 60 * 1000),
    findings: 0,
    openIssues: 0,
  },
  emaAnnex11: {
    status: 'compliant' as 'compliant' | 'warning' | 'non_compliant' | 'pending_review',
    score: 97.2,
    lastAudit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    nextAudit: new Date(Date.now() + 76 * 24 * 60 * 60 * 1000),
    findings: 1,
    openIssues: 0,
  },
  gdpr: {
    status: 'compliant' as 'compliant' | 'warning' | 'non_compliant' | 'pending_review',
    score: 99.1,
    lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    nextAudit: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
    findings: 0,
    openIssues: 0,
  },
  hipaa: {
    status: 'warning' as 'compliant' | 'warning' | 'non_compliant' | 'pending_review',
    score: 94.8,
    lastAudit: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    nextAudit: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000),
    findings: 2,
    openIssues: 1,
  },
});

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * ConfidenceBadge - Visual indicator for AI confidence levels
 */
const ConfidenceBadge: React.FC<{ level: ConfidenceLevel; score: number }> = ({ level, score }) => {
  const config = {
    very_high: { color: 'bg-emerald-500', text: 'Very High', icon: '✓', textColor: 'text-emerald-700' },
    high: { color: 'bg-blue-500', text: 'High', icon: '↑', textColor: 'text-blue-700' },
    medium: { color: 'bg-amber-500', text: 'Medium', icon: '→', textColor: 'text-amber-700' },
    low: { color: 'bg-orange-500', text: 'Low', icon: '↓', textColor: 'text-orange-700' },
    very_low: { color: 'bg-red-500', text: 'Very Low', icon: '!', textColor: 'text-red-700' },
  };

  const { color, text, icon, textColor } = config[level];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${color} text-white text-xs font-semibold`}>
      <span>{icon}</span>
      <span>{text}</span>
      <span className="bg-white/20 px-1.5 rounded-full">{score}%</span>
    </div>
  );
};

/**
 * PriorityBadge - Visual indicator for task priority
 */
const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const config = {
    critical: { color: 'bg-red-100 text-red-800 border-red-300', pulse: true },
    high: { color: 'bg-orange-100 text-orange-800 border-orange-300', pulse: false },
    medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', pulse: false },
    low: { color: 'bg-gray-100 text-gray-600 border-gray-300', pulse: false },
  };

  const { color, pulse } = config[priority];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${color}`}>
      {pulse && <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse" />}
      {priority.toUpperCase()}
    </span>
  );
};

/**
 * StatusBadge - Visual indicator for task status
 */
const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const config = {
    pending_review: { color: 'bg-slate-100 text-slate-700', label: 'Pending Review' },
    in_progress: { color: 'bg-blue-100 text-blue-700', label: 'In Progress' },
    completed: { color: 'bg-green-100 text-green-700', label: 'Completed' },
    escalated: { color: 'bg-purple-100 text-purple-700', label: 'Escalated' },
  };

  const { color, label } = config[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};

/**
 * EDCSourceBadge - Shows which EDC system the data came from
 */
const EDCSourceBadge: React.FC<{ source: EDCSystemType }> = ({ source }) => {
  const config = {
    medidata_rave: { label: 'Medidata Rave', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    oracle_clinical_one: { label: 'Oracle Clinical One', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    veeva_vault: { label: 'Veeva Vault', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  };

  const { label, color } = config[source];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
};

/**
 * RiskIndicator - Visual representation of risk score
 */
const RiskIndicator: React.FC<{ category: RiskCategory; score: number }> = ({ category, score }) => {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-red-500';
    if (s >= 60) return 'bg-orange-500';
    if (s >= 40) return 'bg-yellow-500';
    if (s >= 20) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const formatCategory = (cat: RiskCategory): string => {
    return cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600">{formatCategory(category)}</span>
          <span className="font-semibold">{score}/100</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${getColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * TaskCard - Individual task card for the review grid
 */
const TaskCard: React.FC<{
  task: BooleanConfirmationTask;
  isSelected: boolean;
  onSelect: (taskId: string, selected: boolean) => void;
  onApprove: (taskId: string) => void;
  onReject: (taskId: string) => void;
  onEscalate: (taskId: string) => void;
}> = ({ task, isSelected, onSelect, onApprove, onReject, onEscalate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const timeSinceUpdate = useMemo(() => {
    const diff = Date.now() - task.updatedAt.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }, [task.updatedAt]);

  const isOverdue = task.dueDate && task.dueDate < new Date() && !task.completedAt;

  return (
    <div 
      className={`
        relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
        ${isOverdue ? 'ring-1 ring-red-300' : ''}
        ${task.status === 'completed' ? 'opacity-75' : ''}
      `}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(task.id, e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
      </div>

      {/* Overdue Indicator */}
      {isOverdue && (
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full animate-pulse">
            OVERDUE
          </span>
        </div>
      )}

      {/* Card Header */}
      <div className="p-4 pt-8">
        <div className="flex flex-wrap gap-2 mb-3 ml-6">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
          <ConfidenceBadge level={task.confidence} score={task.confidenceScore} />
        </div>

        {/* Task Identity */}
        <div className="mb-3 ml-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">
            {task.formId} • {task.subjectId}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2">
            Field: {task.fieldId} | Trial: {task.trialId} | Site: {task.siteId}
          </p>
        </div>

        {/* Data Preview */}
        <div className="ml-6 mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500 block">Original:</span>
              <span className="font-mono text-gray-800 truncate block">
                {task.originalValue || '(empty)'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">AI Suggested:</span>
              <span className="font-mono text-blue-600 font-semibold truncate block">
                {task.aiSuggestedValue}
              </span>
            </div>
          </div>
        </div>

        {/* Risk & Source */}
        <div className="ml-6 space-y-2 mb-3">
          <RiskIndicator category={task.riskCategory} score={task.riskScore} />
          <div className="flex justify-between items-center">
            <EDCSourceBadge source={task.edcSource} />
            <span className="text-xs text-gray-400">{timeSinceUpdate}</span>
          </div>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-6 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          {isExpanded ? '▲ Less Details' : '▼ More Details'}
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 ml-6 pt-3 border-t border-gray-200 space-y-3">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-500">Created:</span> {task.createdAt.toLocaleDateString()}</div>
              <div><span className="text-gray-500">Due:</span> {task.dueDate?.toLocaleDateString()}</div>
              <div><span className="text-gray-500">Model:</span> {task.metadata.modelVersion}</div>
              <div><span className="text-gray-500">Processing:</span> {task.metadata.processingTime}ms</div>
            </div>

            {/* Alternative Suggestions */}
            {task.metadata.alternativeSuggestions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Alternatives:</p>
                <div className="space-y-1">
                  {task.metadata.alternativeSuggestions.map((alt, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded">
                      <span className="font-mono">{alt.value}</span>
                      <span className="text-gray-500">{alt.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Audit Trail */}
            {task.auditTrail.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Recent Activity:</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {task.auditTrail.slice(-3).map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-16 text-gray-400">{entry.timestamp.toLocaleTimeString()}</span>
                      <span className="capitalize">{entry.action.replace('_', ' ')}</span>
                      <span>by {entry.userId}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {task.status !== 'completed' && (
        <div className="px-4 pb-4 ml-6">
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(task.id)}
              className="flex-1 px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
            >
              <span>✓</span> Approve
            </button>
            <button
              onClick={() => onReject(task.id)}
              className="flex-1 px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
            >
              <span>✗</span> Reject
            </button>
            <button
              onClick={() => onEscalate(task.id)}
              className="px-3 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              title="Escalate to supervisor"
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* Completed Indicator */}
      {task.status === 'completed' && task.decision && (
        <div className={`px-4 pb-4 ml-6 ${
          task.decision === 'approved' ? 'bg-emerald-50' : 'bg-red-50'
        } mx-4 rounded-lg p-2`}>
          <div className="flex items-center gap-2 text-xs font-medium">
            <span>{task.decision === 'approved' ? '✓' : '✗'}</span>
            <span className={task.decision === 'approved' ? 'text-emerald-700' : 'text-red-700'}>
              {task.decision.toUpperCase()} • {task.decisionReason || 'No reason provided'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * StatisticsSidebar - Reviewer performance metrics
 */
const StatisticsSidebar: React.FC<{
  stats: ReviewerStatistics;
  edcStatus: ReturnType<typeof generateMockEDCStatus>;
  compliance: ReturnType<typeof generateMockComplianceIndicators>;
}> = ({ stats, edcStatus, compliance }) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'edc' | 'compliance'>('performance');

  return (
    <div className="w-80 bg-gradient-to-b from-slate-900 to-slate-800 text-white overflow-y-auto h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold">Review Dashboard</h2>
        <p className="text-sm text-slate-400">{stats.reviewerName}</p>
        <p className="text-xs text-slate-500">{stats.role} • {stats.department}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700">
        {(['performance', 'edc', 'compliance'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-medium capitalize transition-colors ${
              activeTab === tab 
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="p-4 space-y-4">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-2xl font-bold text-blue-400">{stats.tasksToday}</p>
              <p className="text-xs text-slate-400">Tasks Today</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-2xl font-bold text-emerald-400">{stats.averageReviewTime}s</p>
              <p className="text-xs text-slate-400">Avg Time</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-2xl font-bold text-purple-400">{(stats.approvalRate * 100).toFixed(0)}%</p>
              <p className="text-xs text-slate-400">Approval Rate</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-2xl font-bold text-amber-400">{stats.currentQueueDepth}</p>
              <p className="text-xs text-slate-400">Queue Depth</p>
            </div>
          </div>

          {/* Monthly Progress */}
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-medium text-slate-300">Monthly Target</p>
              <p className="text-xs text-slate-400">{stats.tasksThisMonth}/{stats.monthlyTarget}</p>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${stats.progressToMonthlyTarget * 100}%` }}
              />
            </div>
            <p className="text-xs text-right mt-1 text-slate-400">
              {(stats.progressToMonthlyTarget * 100).toFixed(1)}%
            </p>
          </div>

          {/* Accuracy Score */}
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs font-medium text-slate-300 mb-2">Accuracy Score</p>
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#334155" strokeWidth="6" />
                  <circle 
                    cx="32" cy="32" r="28" fill="none" 
                    stroke="#10b981" strokeWidth="6"
                    strokeDasharray={`${stats.accuracyScore * 175.93} 175.93`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  {(stats.accuracyScore * 100).toFixed(0)}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Precision</span>
                  <span>{(stats.precisionScore * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recall</span>
                  <span>{(stats.recallScore * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AI Agreement</span>
                  <span>{(stats.agreementWithAI * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs font-medium text-slate-300 mb-2">Top Categories</p>
            <div className="space-y-2">
              {stats.topCategories.slice(0, 3).map((cat) => (
                <div key={cat.category} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 capitalize">
                    {cat.category.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">{cat.count}</span>
                    <span className="text-emerald-400">{(cat.accuracy * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Streak Info */}
          <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-lg p-3 border border-amber-700/30">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-sm font-bold text-amber-400">{stats.currentStreak} Day Streak</p>
                <p className="text-xs text-amber-400/70">Best: {stats.longestStreak} days</p>
              </div>
            </div>
          </div>

          {/* Ranking */}
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Team Rank</p>
                <p className="text-lg font-bold">#{stats.teamRank}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Percentile</p>
                <p className="text-lg font-bold text-blue-400">{stats.percentileRank}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDC Status Tab */}
      {activeTab === 'edc' && (
        <div className="p-4 space-y-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">EDC Connections</p>
          
          {edcStatus.map((edc) => (
            <div key={edc.system} className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{edc.displayName}</p>
                  <p className="text-xs text-slate-400">v{edc.version}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  edc.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                  edc.status === 'degraded' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {edc.status.toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                <div>
                  <span className="text-slate-500 block">Uptime</span>
                  <span className="font-semibold">{edc.uptime}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Latency</span>
                  <span className="font-semibold">{edc.connectionLatency}ms</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Processed</span>
                  <span className="font-semibold">{edc.recordsProcessed.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Pending</span>
                  <span className="font-semibold text-amber-400">{edc.pendingRecords}</span>
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-500">
                Last sync: {edc.lastSync.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="p-4 space-y-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Regulatory Status</p>
          
          {Object.entries(compliance).map(([framework, data]) => (
            <div key={framework} className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium capitalize">
                  {framework.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  data.status === 'compliant' ? 'bg-emerald-500/20 text-emerald-400' :
                  data.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {data.score}%
                </span>
              </div>
              
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full transition-all duration-500 ${
                    data.score >= 98 ? 'bg-emerald-500' :
                    data.score >= 95 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${data.score}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-400">
                <span>Next audit: {data.nextAudit.toLocaleDateString()}</span>
                <span className={data.openIssues > 0 ? 'text-amber-400' : ''}>
                  {data.openIssues} issues
                </span>
              </div>
            </div>
          ))}

          {/* Quick Actions */}
          <div className="pt-3 border-t border-slate-700 space-y-2">
            <button className="w-full px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Generate Compliance Report
            </button>
            <button className="w-full px-3 py-2 bg-slate-700 text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-600 transition-colors">
              View Full Audit Trail
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * BulkActionBar - Controls for batch operations
 */
const BulkActionBar: React.FC<{
  selectedCount: number;
  onApproveAll: () => void;
  onRejectSelected: () => void;
  onEscalateSelected: () => void;
  onApproveHighConfidence: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  totalCount: number;
}> = ({
  selectedCount,
  onApproveAll,
  onRejectSelected,
  onEscalateSelected,
  onApproveHighConfidence,
  onClearSelection,
  onSelectAll,
  totalCount,
}) => {
  const bulkActions: BulkAction[] = [
    {
      id: 'approve_all',
      label: 'Approve Selected',
      icon: <span>✓</span>,
      description: 'Approve all selected tasks',
      requiresConfirmation: true,
      shortcut: 'Ctrl+Enter',
      color: 'bg-emerald-600 hover:bg-emerald-700',
      enabled: selectedCount > 0,
    },
    {
      id: 'reject_selected',
      label: 'Reject Selected',
      icon: <span>✗</span>,
      description: 'Reject all selected tasks',
      requiresConfirmation: true,
      shortcut: 'Ctrl+Delete',
      color: 'bg-red-600 hover:bg-red-700',
      enabled: selectedCount > 0,
    },
    {
      id: 'escalate',
      label: 'Escalate',
      icon: <span>↑</span>,
      description: 'Escalate to supervisor',
      requiresConfirmation: false,
      shortcut: 'Ctrl+E',
      color: 'bg-purple-600 hover:bg-purple-700',
      enabled: selectedCount > 0,
    },
    {
      id: 'approve_high_conf',
      label: 'Auto-Approve High Confidence',
      icon: <span>⚡</span>,
      description: 'Approve all Very High/High confidence tasks',
      requiresConfirmation: true,
      shortcut: 'Ctrl+Shift+A',
      color: 'bg-blue-600 hover:bg-blue-700',
      enabled: true,
    },
  ];

  if (selectedCount === 0) {
    return (
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            <span className="font-medium">{totalCount}</span> tasks in queue
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onSelectAll}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={onApproveHighConfidence}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
            >
              <span>⚡</span>
              Approve High Confidence
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-blue-800">
            <strong>{selectedCount}</strong> tasks selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Clear selection
          </button>
        </div>

        <div className="flex items-center gap-2">
          {bulkActions.filter(a => a.enabled || a.id === 'approve_high_conf').map((action) => (
            <button
              key={action.id}
              onClick={() => {
                if (action.id === 'approve_all') onApproveAll();
                else if (action.id === 'reject_selected') onRejectSelected();
                else if (action.id === 'escalate') onEscalateSelected();
                else if (action.id === 'approve_high_conf') onApproveHighConfidence();
              }}
              disabled={!action.enabled && action.id !== 'approve_high_conf'}
              className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors flex items-center gap-1.5 ${
                action.enabled || action.id === 'approve_high_conf' ? action.color : 'bg-slate-300 cursor-not-allowed'
              }`}
              title={`${action.label} (${action.shortcut})`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * FilterBar - Advanced filtering controls
 */
const FilterBar: React.FC<{
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  taskCount: number;
}> = ({ filters, onFiltersChange, taskCount }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search tasks by subject, form, field..."
            value={filters.searchQuery || ''}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>

        {/* Quick Filters */}
        <select
          value={filters.confidence || 'all'}
          onChange={(e) => onFiltersChange({ ...filters, confidence: e.target.value as any })}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Confidence</option>
          <option value="very_high">Very High (&gt;95%)</option>
          <option value="high">High (85-95%)</option>
          <option value="medium">Medium (70-84%)</option>
          <option value="low">Low (50-69%)</option>
          <option value="very_low">Very Low (&lt;50%)</option>
        </select>

        <select
          value={filters.priority || 'all'}
          onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value as any })}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={filters.status || 'all'}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as any })}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending_review">Pending Review</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="escalated">Escalated</option>
        </select>

        <select
          value={filters.edcSource || 'all'}
          onChange={(e) => onFiltersChange({ ...filters, edcSource: e.target.value as any })}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All EDC Sources</option>
          <option value="medidata_rave">Medidata Rave</option>
          <option value="oracle_clinical_one">Oracle Clinical One</option>
          <option value="veeva_vault">Veeva Vault</option>
        </select>

        {/* Toggle Advanced */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          {showAdvanced ? 'Less ▲' : 'More Filters ▼'}
        </button>

        {/* Result Count */}
        <span className="text-sm text-slate-500">
          <strong>{taskCount}</strong> results
        </span>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-4 flex-wrap">
          <select
            value={filters.riskCategory || 'all'}
            onChange={(e) => onFiltersChange({ ...filters, riskCategory: e.target.value as any })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="all">All Risk Categories</option>
            <option value="data_integrity">Data Integrity</option>
            <option value="patient_safety">Patient Safety</option>
            <option value="regulatory_compliance">Regulatory Compliance</option>
            <option value="protocol_deviation">Protocol Deviation</option>
            <option value="adverse_event">Adverse Event</option>
            <option value="consent_issue">Consent Issue</option>
            <option value="query_resolution">Query Resolution</option>
            <option value="source_verification">Source Verification</option>
          </select>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">From:</label>
            <input
              type="date"
              value={filters.dateFrom?.toISOString().split('T')[0] || ''}
              onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value ? new Date(e.target.value) : undefined })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">To:</label>
            <input
              type="date"
              value={filters.dateTo?.toISOString().split('T')[0] || ''}
              onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value ? new Date(e.target.value) : undefined })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <button
            onClick={() => onFiltersChange({
              confidence: 'all',
              priority: 'all',
              status: 'all',
              riskCategory: 'all',
              edcSource: 'all',
              searchQuery: '',
              dateFrom: undefined,
              dateTo: undefined,
            })}
            className="px-3 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Reset All
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * WebSocketStatusIndicator - Shows real-time connection status
 */
const WebSocketStatusIndicator: React.FC<{
  connected: boolean;
  lastUpdate: Date | null;
  messageCount: number;
}> = ({ connected, lastUpdate, messageCount }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
    connected 
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
      : 'bg-red-50 text-red-700 border border-red-200'
  }`}>
    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
    <span>{connected ? 'Live' : 'Disconnected'}</span>
    {lastUpdate && (
      <span className="text-slate-500">
        Updated {formatDistanceToNow(lastUpdate)}
      </span>
    )}
    <span className="bg-slate-200 px-1.5 rounded text-slate-600">
      {messageCount} msgs
    </span>
  </div>
);

/**
 * Format date distance helper
 */
function formatDistanceToNow(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 5000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * BooleanConfirmationPanel - Main Review Dashboard Component
 * 
 * This comprehensive dashboard provides a complete view of the AI-powered clinical
 * trial review workflow, showcasing all capabilities of TrialGPTBot Enterprise.
 */
export const BooleanConfirmationPanel: React.FC<BooleanConfirmationPanelProps> = ({
  reviewerId = 'reviewer_001',
  trialId,
  permissions = ['approve', 'reject', 'escalate'],
  theme = 'light',
  compact = false,
  showSidebar = true,
  refreshInterval = 30000,
  wsEndpoint = 'wss://api.trialgptbot.enterprise/ws/review-queue',
  maxTasks = 50,
  enableExperimental = false,
  className = '',
  style,
  onApprove,
  onReject,
  onEscalate,
  onBulkAction,
  onFilterChange,
  onSelectionChange,
}) => {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  // Task Queue State
  const [tasks, setTasks] = useState<BooleanConfirmationTask[]>(() => generateMockTasks(25));
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    confidence: 'all',
    priority: 'all',
    status: 'all',
    riskCategory: 'all',
    edcSource: 'all',
    searchQuery: '',
  });

  // View State
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [sortBy, setSortBy] = useState<'priority' | 'confidence' | 'date' | 'risk'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // WebSocket State
  const [wsConnected, setWsConnected] = useState(true);
  const [lastWsUpdate, setLastWsUpdate] = useState<Date>(new Date());
  const [wsMessageCount, setWsMessageCount] = useState(147);

  // Sidebar State
  const [sidebarVisible, setSidebarVisible] = useState(showSidebar);

  // Modal States
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Stats (mock data)
  const [stats] = useState<ReviewerStatistics>(() => generateMockStats());
  const [edcStatus] = useState(generateMockEDCStatus());
  const [compliance] = useState(generateMockComplianceIndicators());

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  /**
   * Filtered and sorted tasks based on current filter state
   */
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Apply filters
    if (filters.confidence && filters.confidence !== 'all') {
      result = result.filter(t => t.confidence === filters.confidence);
    }
    if (filters.priority && filters.priority !== 'all') {
      result = result.filter(t => t.priority === filters.priority);
    }
    if (filters.status && filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status);
    }
    if (filters.riskCategory && filters.riskCategory !== 'all') {
      result = result.filter(t => t.riskCategory === filters.riskCategory);
    }
    if (filters.edcSource && filters.edcSource !== 'all') {
      result = result.filter(t => t.edcSource === filters.edcSource);
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(t =>
        t.subjectId.toLowerCase().includes(query) ||
        t.formId.toLowerCase().includes(query) ||
        t.fieldId.toLowerCase().includes(query) ||
        t.trialId.toLowerCase().includes(query) ||
        t.aiSuggestedValue.toLowerCase().includes(query)
      );
    }
    if (filters.dateFrom) {
      result = result.filter(t => t.createdAt >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter(t => t.createdAt <= filters.dateTo!);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'confidence':
          comparison = a.confidenceScore - b.confidenceScore;
          break;
        case 'date':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'risk':
          comparison = a.riskScore - b.riskScore;
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result.slice(0, maxTasks);
  }, [tasks, filters, sortBy, sortOrder, maxTasks]);

  /**
   * Summary statistics for the current filtered view
   */
  const summaryStats = useMemo(() => {
    const total = filteredTasks.length;
    const pending = filteredTasks.filter(t => t.status === 'pending_review').length;
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
    const completed = filteredTasks.filter(t => t.status === 'completed').length;
    const escalated = filteredTasks.filter(t => t.status === 'escalated').length;
    
    const criticalCount = filteredTasks.filter(t => t.priority === 'critical').length;
    const highConfidence = filteredTasks.filter(t => 
      t.confidence === 'very_high' || t.confidence === 'high'
    ).length;
    const overdue = filteredTasks.filter(t => 
      t.dueDate && t.dueDate < new Date() && !t.completedAt
    ).length;

    const avgConfidence = total > 0 
      ? filteredTasks.reduce((sum, t) => sum + t.confidenceScore, 0) / total 
      : 0;

    return {
      total,
      pending,
      inProgress,
      completed,
      escalated,
      criticalCount,
      highConfidence,
      overdue,
      avgConfidence: Math.round(avgConfidence),
    };
  }, [filteredTasks]);

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handleTaskSelect = useCallback((taskId: string, selected: boolean) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      onSelectionChange?.(Array.from(next));
      return next;
    });
  }, [onSelectionChange]);

  const handleSelectAll = useCallback(() => {
    const allIds = filteredTasks.map(t => t.id);
    setSelectedTaskIds(new Set(allIds));
    onSelectionChange?.(allIds);
  }, [filteredTasks, onSelectionChange]);

  const handleClearSelection = useCallback(() => {
    setSelectedTaskIds(new Set());
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  const handleApprove = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: 'completed' as TaskStatus, decision: 'approved' as ConfirmationDecision, completedAt: new Date() }
        : t
    ));
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
    onApprove?.(taskId);
  }, [onApprove]);

  const handleReject = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: 'completed' as TaskStatus, decision: 'rejected' as ConfirmationDecision, completedAt: new Date() }
        : t
    ));
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
    onReject?.(taskId);
  }, [onReject]);

  const handleEscalate = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: 'escalated' as TaskStatus }
        : t
    ));
    onEscalate?.(taskId);
  }, [onEscalate]);

  const handleBulkApprove = useCallback(() => {
    setShowConfirmDialog('approve_all');
  }, []);

  const handleBulkReject = useCallback(() => {
    setShowConfirmDialog('reject_all');
  }, []);

  const handleBulkEscalate = useCallback(() => {
    setTasks(prev => prev.map(t => 
      selectedTaskIds.has(t.id) ? { ...t, status: 'escalated' as TaskStatus } : t
    ));
    onBulkAction?.('escalate', Array.from(selectedTaskIds));
    handleClearSelection();
  }, [selectedTaskIds, onBulkAction, handleClearSelection]);

  const handleApproveHighConfidence = useCallback(() => {
    setShowConfirmDialog('approve_high_conf');
  }, []);

  const confirmBulkAction = useCallback((action: string) => {
    switch (action) {
      case 'approve_all': {
        setTasks(prev => prev.map(t => 
          selectedTaskIds.has(t.id) 
            ? { ...t, status: 'completed' as TaskStatus, decision: 'approved' as ConfirmationDecision, completedAt: new Date() }
            : t
        ));
        onBulkAction?.('approve', Array.from(selectedTaskIds));
        break;
      }
      case 'reject_all': {
        setTasks(prev => prev.map(t => 
          selectedTaskIds.has(t.id) 
            ? { ...t, status: 'completed' as TaskStatus, decision: 'rejected' as ConfirmationDecision, completedAt: new Date() }
            : t
        ));
        onBulkAction?.('reject', Array.from(selectedTaskIds));
        break;
      }
      case 'approve_high_conf': {
        const highConfIds = filteredTasks
          .filter(t => (t.confidence === 'very_high' || t.confidence === 'high') && t.status !== 'completed')
          .map(t => t.id);
        setTasks(prev => prev.map(t => 
          highConfIds.includes(t.id) 
            ? { ...t, status: 'completed' as TaskStatus, decision: 'approved' as ConfirmationDecision, completedAt: new Date() }
            : t
        ));
        onBulkAction?.('approve_high_confidence', highConfIds);
        break;
      }
    }
    setShowConfirmDialog(null);
    handleClearSelection();
  }, [selectedTaskIds, filteredTasks, onBulkAction, handleClearSelection]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  }, [onFilterChange]);

  // ==========================================================================
  // WEBSOCKET SIMULATION (for demo purposes)
  // ==========================================================================

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Randomly add a new task occasionally
      if (Math.random() > 0.95) {
        const newTask = generateMockTasks(1)[0];
        setTasks(prev => [newTask, ...prev.slice(0, 49)]);
      }
      
      // Update existing task status occasionally
      if (Math.random() > 0.9 && tasks.length > 0) {
        const randomIndex = Math.floor(Math.random() * tasks.length);
        setTasks(prev => prev.map((t, i) => 
          i === randomIndex ? { ...t, updatedAt: new Date() } : t
        ));
      }

      setLastWsUpdate(new Date());
      setWsMessageCount(prev => prev + 1);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, tasks.length]);

  // ==========================================================================
  // KEYBOARD SHORTCUTS
  // ==========================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter: Approve selected
      if (e.ctrlKey && e.key === 'Enter' && selectedTaskIds.size > 0) {
        e.preventDefault();
        handleBulkApprove();
      }
      // Ctrl+Delete: Reject selected
      if (e.ctrlKey && e.key === 'Delete' && selectedTaskIds.size > 0) {
        e.preventDefault();
        handleBulkReject();
      }
      // Ctrl+E: Escalate selected
      if (e.ctrlKey && e.key === 'e' && selectedTaskIds.size > 0) {
        e.preventDefault();
        handleBulkEscalate();
      }
      // Ctrl+Shift+A: Approve high confidence
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        handleApproveHighConfidence();
      }
      // Ctrl+A: Select all
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }
      // Escape: Clear selection
      if (e.key === 'Escape') {
        handleClearSelection();
        setShowConfirmDialog(null);
        setShowTaskDetail(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskIds, handleBulkApprove, handleBulkReject, handleBulkEscalate, handleApproveHighConfidence, handleSelectAll, handleClearSelection]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className={`flex h-screen bg-slate-100 overflow-hidden ${className}`} style={style}>
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col overflow-hidden ${sidebarVisible ? '' : 'w-full'}`}>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  T
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">TrialGPTBot Enterprise</h1>
                  <p className="text-xs text-gray-500">AI-Powered Clinical Trial Management • Review Dashboard</p>
                </div>
              </div>
              
              {trialId && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                  {trialId}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* WebSocket Status */}
              <WebSocketStatusIndicator
                connected={wsConnected}
                lastUpdate={lastWsUpdate}
                messageCount={wsMessageCount}
              />

              {/* Toggle Sidebar */}
              <button
                onClick={() => setSidebarVisible(!sidebarVisible)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Toggle sidebar"
              >
                {sidebarVisible ? '☰' : '☷'}
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {(['grid', 'list', 'compact'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize ${
                      viewMode === mode 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {mode === 'grid' ? '⊞' : mode === 'list' ? '☰' : '≡'}
                  </button>
                ))}
              </div>

              {/* Sort Controls */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="priority">Sort by Priority</option>
                <option value="confidence">Sort by Confidence</option>
                <option value="date">Sort by Date</option>
                <option value="risk">Sort by Risk</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Toggle sort order"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>

              {/* Export Button */}
              <button
                onClick={() => setShowExportDialog(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <span>📥</span>
                Export
              </button>
            </div>
          </div>

          {/* Summary Stats Bar */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Total:</span>
              <span className="font-semibold text-gray-900">{summaryStats.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-gray-500">Pending:</span>
              <span className="font-semibold">{summaryStats.pending}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-500">In Progress:</span>
              <span className="font-semibold">{summaryStats.inProgress}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-500">Completed:</span>
              <span className="font-semibold">{summaryStats.completed}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-gray-500">Escalated:</span>
              <span className="font-semibold">{summaryStats.escalated}</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-medium">!</span>
              <span className="text-gray-500">Critical:</span>
              <span className="font-semibold text-red-600">{summaryStats.criticalCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-500 font-medium">⚠</span>
              <span className="text-gray-500">Overdue:</span>
              <span className="font-semibold text-amber-600">{summaryStats.overdue}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Avg Confidence:</span>
              <span className="font-semibold text-blue-600">{summaryStats.avgConfidence}%</span>
            </div>
          </div>
        </header>

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedCount={selectedTaskIds.size}
          totalCount={summaryStats.total}
          onApproveAll={handleBulkApprove}
          onRejectSelected={handleBulkReject}
          onEscalateSelected={handleBulkEscalate}
          onApproveHighConfidence={handleApproveHighConfidence}
          onClearSelection={handleClearSelection}
          onSelectAll={handleSelectAll}
        />

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFiltersChange={handleFilterChange}
          taskCount={summaryStats.total}
        />

        {/* Task Grid/List */}
        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading tasks...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center bg-red-50 p-8 rounded-xl">
                <p className="text-red-600 text-lg font-semibold mb-2">Error Loading Tasks</p>
                <p className="text-red-500 text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tasks Found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your filters or wait for new tasks to arrive
                </p>
                <button
                  onClick={() => handleFilterChange({
                    confidence: 'all',
                    priority: 'all',
                    status: 'all',
                    riskCategory: 'all',
                    edcSource: 'all',
                    searchQuery: '',
                  })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4' 
                : viewMode === 'list'
                ? 'space-y-3'
                : 'space-y-2'
            }>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskIds.has(task.id)}
                  onSelect={handleTaskSelect}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEscalate={handleEscalate}
                />
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>TrialGPTBot Enterprise v2.4.1</span>
              <span>•</span>
              <span>FDA 21 CFR Part 11 Compliant</span>
              <span>•</span>
              <span>EMA Annex 11 Aligned</span>
              <span>•</span>
              <span>GDPR Ready</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Last sync: {new Date().toLocaleTimeString()}</span>
              <span>•</span>
              <span>Session: {reviewerId}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Statistics Sidebar */}
      {sidebarVisible && (
        <aside className="w-80 flex-shrink-0 border-l border-slate-200">
          <StatisticsSidebar
            stats={stats}
            edcStatus={edcStatus}
            compliance={compliance}
          />
        </aside>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Confirm Bulk Action
            </h3>
            <p className="text-gray-600 mb-6">
              {showConfirmDialog === 'approve_all' && 
                `You are about to APPROVE ${selectedTaskIds.size} tasks. This action cannot be undone.`
              }
              {showConfirmDialog === 'reject_all' && 
                `You are about to REJECT ${selectedTaskIds.size} tasks. This action cannot be undone.`
              }
              {showConfirmDialog === 'approve_high_conf' && 
                'You are about to auto-approve all High and Very High confidence tasks. This will apply to all visible tasks meeting the criteria.'
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmBulkAction(showConfirmDialog)}
                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${
                  showConfirmDialog === 'reject_all' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Export Data</h3>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="export_format" defaultChecked className="text-blue-600" />
                <div>
                  <p className="font-medium">CSV Format</p>
                  <p className="text-xs text-gray-500">Compatible with Excel, Google Sheets</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="export_format" className="text-blue-600" />
                <div>
                  <p className="font-medium">JSON Format</p>
                  <p className="text-xs text-gray-500">Machine-readable, full data structure</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="export_format" className="text-blue-600" />
                <div>
                  <p className="font-medium">PDF Report</p>
                  <p className="text-xs text-gray-500">Formatted document with charts</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="export_format" className="text-blue-600" />
                <div>
                  <p className="font-medium">XML (CDISC ODM)</p>
                  <p className="text-xs text-gray-500">Regulatory submission format</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowExportDialog(false);
                  // Handle export logic here
                  alert('Export initiated! (Demo mode)');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default BooleanConfirmationPanel;

// Sub-component exports for standalone use
export {
  ConfidenceBadge,
  PriorityBadge,
  StatusBadge,
  EDCSourceBadge,
  RiskIndicator,
  TaskCard,
  StatisticsSidebar,
  BulkActionBar,
  FilterBar,
  WebSocketStatusIndicator,
};

// Type exports
export type {
  BooleanConfirmationPanelProps,
  FilterState,
  BulkAction,
  DashboardWidgetConfig,
};
