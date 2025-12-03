import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled, AsyncCollection, AsyncItem } from "@aws-amplify/datastore";

export enum RevenueTier {
  ESSENTIAL = "ESSENTIAL",
  PRO = "PRO",
  ELITE = "ELITE"
}

export enum PricingCadence {
  WEEKLY = "WEEKLY",
  DAILY = "DAILY"
}

type EagerPolicyRef = {
  readonly id: string;
  readonly type: string;
}

type LazyPolicyRef = {
  readonly id: string;
  readonly type: string;
}

export declare type PolicyRef = LazyLoading extends LazyLoadingDisabled ? EagerPolicyRef : LazyPolicyRef

export declare const PolicyRef: (new (init: ModelInit<PolicyRef>) => PolicyRef)

type EagerProperty = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Property, 'id'>;
  };
  readonly id: string;
  readonly name: string;
  readonly nickname?: string | null;
  readonly address: string;
  readonly city?: string | null;
  readonly state?: string | null;
  readonly country?: string | null;
  readonly sleeps: number;
  readonly owner: string;
  readonly units?: (Unit | null)[] | null;
  readonly revenueProfile?: RevenueProfile | null;
  readonly revenueSnapshots?: (RevenueSnapshot | null)[] | null;
  readonly revenueAudits?: (RevenueAudit | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly propertyRevenueProfileId?: string | null;
}

type LazyProperty = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Property, 'id'>;
  };
  readonly id: string;
  readonly name: string;
  readonly nickname?: string | null;
  readonly address: string;
  readonly city?: string | null;
  readonly state?: string | null;
  readonly country?: string | null;
  readonly sleeps: number;
  readonly owner: string;
  readonly units: AsyncCollection<Unit>;
  readonly revenueProfile: AsyncItem<RevenueProfile | undefined>;
  readonly revenueSnapshots: AsyncCollection<RevenueSnapshot>;
  readonly revenueAudits: AsyncCollection<RevenueAudit>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly propertyRevenueProfileId?: string | null;
}

export declare type Property = LazyLoading extends LazyLoadingDisabled ? EagerProperty : LazyProperty

export declare const Property: (new (init: ModelInit<Property>) => Property) & {
  copyOf(source: Property, mutator: (draft: MutableModel<Property>) => MutableModel<Property> | void): Property;
}

type EagerUnit = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Unit, 'id'>;
  };
  readonly id: string;
  readonly name: string;
  readonly sleeps: number;
  readonly price?: number | null;
  readonly icalURL?: string | null;
  readonly owner: string;
  readonly propertyID: string;
  readonly bookings?: (Booking | null)[] | null;
  readonly timezone?: string | null;
  readonly bedrooms?: number | null;
  readonly bathrooms?: number | null;
  readonly baseRate?: number | null;
  readonly minStay?: number | null;
  readonly policies?: (PolicyRef | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUnit = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Unit, 'id'>;
  };
  readonly id: string;
  readonly name: string;
  readonly sleeps: number;
  readonly price?: number | null;
  readonly icalURL?: string | null;
  readonly owner: string;
  readonly propertyID: string;
  readonly bookings: AsyncCollection<Booking>;
  readonly timezone?: string | null;
  readonly bedrooms?: number | null;
  readonly bathrooms?: number | null;
  readonly baseRate?: number | null;
  readonly minStay?: number | null;
  readonly policies?: (PolicyRef | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Unit = LazyLoading extends LazyLoadingDisabled ? EagerUnit : LazyUnit

export declare const Unit: (new (init: ModelInit<Unit>) => Unit) & {
  copyOf(source: Unit, mutator: (draft: MutableModel<Unit>) => MutableModel<Unit> | void): Unit;
}

type EagerBooking = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Booking, 'id'>;
  };
  readonly id: string;
  readonly guestName?: string | null;
  readonly checkIn: string;
  readonly checkOut: string;
  readonly payout?: number | null;
  readonly owner: string;
  readonly unitID: string;
  readonly channel?: string | null;
  readonly status?: string | null;
  readonly guestEmail?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyBooking = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Booking, 'id'>;
  };
  readonly id: string;
  readonly guestName?: string | null;
  readonly checkIn: string;
  readonly checkOut: string;
  readonly payout?: number | null;
  readonly owner: string;
  readonly unitID: string;
  readonly channel?: string | null;
  readonly status?: string | null;
  readonly guestEmail?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Booking = LazyLoading extends LazyLoadingDisabled ? EagerBooking : LazyBooking

export declare const Booking: (new (init: ModelInit<Booking>) => Booking) & {
  copyOf(source: Booking, mutator: (draft: MutableModel<Booking>) => MutableModel<Booking> | void): Booking;
}

type EagerCleaning = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Cleaning, 'id'>;
  };
  readonly id: string;
  readonly unitID: string;
  readonly date: string;
  readonly status: string;
  readonly assignedTo: string;
  readonly notes?: string | null;
  readonly owner: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyCleaning = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Cleaning, 'id'>;
  };
  readonly id: string;
  readonly unitID: string;
  readonly date: string;
  readonly status: string;
  readonly assignedTo: string;
  readonly notes?: string | null;
  readonly owner: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Cleaning = LazyLoading extends LazyLoadingDisabled ? EagerCleaning : LazyCleaning

export declare const Cleaning: (new (init: ModelInit<Cleaning>) => Cleaning) & {
  copyOf(source: Cleaning, mutator: (draft: MutableModel<Cleaning>) => MutableModel<Cleaning> | void): Cleaning;
}

type EagerUserProfile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserProfile, 'id'>;
  };
  readonly id: string;
  readonly username: string;
  readonly role: string;
  readonly hasPaid: boolean;
  readonly owner: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUserProfile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserProfile, 'id'>;
  };
  readonly id: string;
  readonly username: string;
  readonly role: string;
  readonly hasPaid: boolean;
  readonly owner: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type UserProfile = LazyLoading extends LazyLoadingDisabled ? EagerUserProfile : LazyUserProfile

export declare const UserProfile: (new (init: ModelInit<UserProfile>) => UserProfile) & {
  copyOf(source: UserProfile, mutator: (draft: MutableModel<UserProfile>) => MutableModel<UserProfile> | void): UserProfile;
}

type EagerRevenueRecord = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<RevenueRecord, 'id'>;
  };
  readonly id: string;
  readonly unitID: string;
  readonly amount: number;
  readonly month: string;
  readonly owner: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyRevenueRecord = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<RevenueRecord, 'id'>;
  };
  readonly id: string;
  readonly unitID: string;
  readonly amount: number;
  readonly month: string;
  readonly owner: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type RevenueRecord = LazyLoading extends LazyLoadingDisabled ? EagerRevenueRecord : LazyRevenueRecord

export declare const RevenueRecord: (new (init: ModelInit<RevenueRecord>) => RevenueRecord) & {
  copyOf(source: RevenueRecord, mutator: (draft: MutableModel<RevenueRecord>) => MutableModel<RevenueRecord> | void): RevenueRecord;
}

type EagerCleanerAffiliation = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<CleanerAffiliation, 'id'>;
  };
  readonly id: string;
  readonly owner: string;
  readonly cleanerUsername: string;
  readonly cleanerDisplay?: string | null;
  readonly status: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyCleanerAffiliation = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<CleanerAffiliation, 'id'>;
  };
  readonly id: string;
  readonly owner: string;
  readonly cleanerUsername: string;
  readonly cleanerDisplay?: string | null;
  readonly status: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type CleanerAffiliation = LazyLoading extends LazyLoadingDisabled ? EagerCleanerAffiliation : LazyCleanerAffiliation

export declare const CleanerAffiliation: (new (init: ModelInit<CleanerAffiliation>) => CleanerAffiliation) & {
  copyOf(source: CleanerAffiliation, mutator: (draft: MutableModel<CleanerAffiliation>) => MutableModel<CleanerAffiliation> | void): CleanerAffiliation;
}

type EagerInvitation = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Invitation, 'id'>;
  };
  readonly id: string;
  readonly owner: string;
  readonly email: string;
  readonly role: string;
  readonly tokenHash: string;
  readonly status: string;
  readonly lastSentAt?: string | null;
  readonly expiresAt: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyInvitation = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Invitation, 'id'>;
  };
  readonly id: string;
  readonly owner: string;
  readonly email: string;
  readonly role: string;
  readonly tokenHash: string;
  readonly status: string;
  readonly lastSentAt?: string | null;
  readonly expiresAt: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Invitation = LazyLoading extends LazyLoadingDisabled ? EagerInvitation : LazyInvitation

export declare const Invitation: (new (init: ModelInit<Invitation>) => Invitation) & {
  copyOf(source: Invitation, mutator: (draft: MutableModel<Invitation>) => MutableModel<Invitation> | void): Invitation;
}

type EagerInboxThread = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<InboxThread, 'id'>;
  };
  readonly id: string;
  readonly maskedEmail: string;
  readonly subject?: string | null;
  readonly lastMessageAt?: string | null;
  readonly messages?: (InboxMessage | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyInboxThread = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<InboxThread, 'id'>;
  };
  readonly id: string;
  readonly maskedEmail: string;
  readonly subject?: string | null;
  readonly lastMessageAt?: string | null;
  readonly messages: AsyncCollection<InboxMessage>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type InboxThread = LazyLoading extends LazyLoadingDisabled ? EagerInboxThread : LazyInboxThread

export declare const InboxThread: (new (init: ModelInit<InboxThread>) => InboxThread) & {
  copyOf(source: InboxThread, mutator: (draft: MutableModel<InboxThread>) => MutableModel<InboxThread> | void): InboxThread;
}

type EagerInboxMessage = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<InboxMessage, 'id'>;
  };
  readonly id: string;
  readonly threadId: string;
  readonly from?: string | null;
  readonly to?: string | null;
  readonly subject?: string | null;
  readonly body?: string | null;
  readonly messageId?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyInboxMessage = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<InboxMessage, 'id'>;
  };
  readonly id: string;
  readonly threadId: string;
  readonly from?: string | null;
  readonly to?: string | null;
  readonly subject?: string | null;
  readonly body?: string | null;
  readonly messageId?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type InboxMessage = LazyLoading extends LazyLoadingDisabled ? EagerInboxMessage : LazyInboxMessage

export declare const InboxMessage: (new (init: ModelInit<InboxMessage>) => InboxMessage) & {
  copyOf(source: InboxMessage, mutator: (draft: MutableModel<InboxMessage>) => MutableModel<InboxMessage> | void): InboxMessage;
}

type EagerReferral = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Referral, 'id'>;
  };
  readonly id: string;
  readonly realtorName: string;
  readonly realtorEmail: string;
  readonly realtorSub?: string | null;
  readonly realtorAgency?: string | null;
  readonly clientName: string;
  readonly clientEmail: string;
  readonly notes?: string | null;
  readonly source?: string | null;
  readonly partnerId?: string | null;
  readonly referralCode?: string | null;
  readonly realtorEmailIndex?: string | null;
  readonly clientEmailIndex?: string | null;
  readonly inviteToken: string;
  readonly onboardingStatus: string;
  readonly lastStatusChangedAt?: string | null;
  readonly lastStatusChangedBy?: string | null;
  readonly lastStatusChangeReason?: string | null;
  readonly lastEmailSentAt?: string | null;
  readonly lastEmailStatus?: string | null;
  readonly lastEmailMessageId?: string | null;
  readonly payoutEligible: boolean;
  readonly payoutSent: boolean;
  readonly payoutMethod?: string | null;
  readonly payoutReference?: string | null;
  readonly payoutMarkedAt?: string | null;
  readonly debugContext?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyReferral = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Referral, 'id'>;
  };
  readonly id: string;
  readonly realtorName: string;
  readonly realtorEmail: string;
  readonly realtorSub?: string | null;
  readonly realtorAgency?: string | null;
  readonly clientName: string;
  readonly clientEmail: string;
  readonly notes?: string | null;
  readonly source?: string | null;
  readonly partnerId?: string | null;
  readonly referralCode?: string | null;
  readonly realtorEmailIndex?: string | null;
  readonly clientEmailIndex?: string | null;
  readonly inviteToken: string;
  readonly onboardingStatus: string;
  readonly lastStatusChangedAt?: string | null;
  readonly lastStatusChangedBy?: string | null;
  readonly lastStatusChangeReason?: string | null;
  readonly lastEmailSentAt?: string | null;
  readonly lastEmailStatus?: string | null;
  readonly lastEmailMessageId?: string | null;
  readonly payoutEligible: boolean;
  readonly payoutSent: boolean;
  readonly payoutMethod?: string | null;
  readonly payoutReference?: string | null;
  readonly payoutMarkedAt?: string | null;
  readonly debugContext?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Referral = LazyLoading extends LazyLoadingDisabled ? EagerReferral : LazyReferral

export declare const Referral: (new (init: ModelInit<Referral>) => Referral) & {
  copyOf(source: Referral, mutator: (draft: MutableModel<Referral>) => MutableModel<Referral> | void): Referral;
}

type EagerReferralPartner = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ReferralPartner, 'id'>;
  };
  readonly id: string;
  readonly name: string;
  readonly type?: string | null;
  readonly contactName?: string | null;
  readonly contactEmail?: string | null;
  readonly contactPhone?: string | null;
  readonly referralCode: string;
  readonly active: boolean;
  readonly totalReferrals?: number | null;
  readonly totalPayouts?: number | null;
  readonly notes?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyReferralPartner = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ReferralPartner, 'id'>;
  };
  readonly id: string;
  readonly name: string;
  readonly type?: string | null;
  readonly contactName?: string | null;
  readonly contactEmail?: string | null;
  readonly contactPhone?: string | null;
  readonly referralCode: string;
  readonly active: boolean;
  readonly totalReferrals?: number | null;
  readonly totalPayouts?: number | null;
  readonly notes?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type ReferralPartner = LazyLoading extends LazyLoadingDisabled ? EagerReferralPartner : LazyReferralPartner

export declare const ReferralPartner: (new (init: ModelInit<ReferralPartner>) => ReferralPartner) & {
  copyOf(source: ReferralPartner, mutator: (draft: MutableModel<ReferralPartner>) => MutableModel<ReferralPartner> | void): ReferralPartner;
}

type EagerPolicy = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Policy, 'id'>;
  };
  readonly id: string;
  readonly unitID: string;
  readonly type: string;
  readonly config: string;
  readonly enabled: boolean;
  readonly owner: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyPolicy = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Policy, 'id'>;
  };
  readonly id: string;
  readonly unitID: string;
  readonly type: string;
  readonly config: string;
  readonly enabled: boolean;
  readonly owner: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Policy = LazyLoading extends LazyLoadingDisabled ? EagerPolicy : LazyPolicy

export declare const Policy: (new (init: ModelInit<Policy>) => Policy) & {
  copyOf(source: Policy, mutator: (draft: MutableModel<Policy>) => MutableModel<Policy> | void): Policy;
}

type EagerNightlyRate = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<NightlyRate, 'id'>;
  };
  readonly id: string;
  readonly unitID: string;
  readonly date: string;
  readonly state: string;
  readonly price: number;
  readonly reason?: string | null;
  readonly details?: string | null;
  readonly owner: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyNightlyRate = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<NightlyRate, 'id'>;
  };
  readonly id: string;
  readonly unitID: string;
  readonly date: string;
  readonly state: string;
  readonly price: number;
  readonly reason?: string | null;
  readonly details?: string | null;
  readonly owner: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type NightlyRate = LazyLoading extends LazyLoadingDisabled ? EagerNightlyRate : LazyNightlyRate

export declare const NightlyRate: (new (init: ModelInit<NightlyRate>) => NightlyRate) & {
  copyOf(source: NightlyRate, mutator: (draft: MutableModel<NightlyRate>) => MutableModel<NightlyRate> | void): NightlyRate;
}

type EagerTurn = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Turn, 'id'>;
  };
  readonly id: string;
  readonly unitID: string;
  readonly bookingId?: string | null;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: string;
  readonly assignedToVendorId?: string | null;
  readonly photos?: string[] | null;
  readonly notes?: string | null;
  readonly owner: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyTurn = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Turn, 'id'>;
  };
  readonly id: string;
  readonly unitID: string;
  readonly bookingId?: string | null;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: string;
  readonly assignedToVendorId?: string | null;
  readonly photos?: string[] | null;
  readonly notes?: string | null;
  readonly owner: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Turn = LazyLoading extends LazyLoadingDisabled ? EagerTurn : LazyTurn

export declare const Turn: (new (init: ModelInit<Turn>) => Turn) & {
  copyOf(source: Turn, mutator: (draft: MutableModel<Turn>) => MutableModel<Turn> | void): Turn;
}

type EagerVendor = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Vendor, 'id'>;
  };
  readonly id: string;
  readonly kind: string;
  readonly name: string;
  readonly phone?: string | null;
  readonly score?: number | null;
  readonly costIndex?: number | null;
  readonly serviceAreas?: string[] | null;
  readonly owner: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyVendor = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Vendor, 'id'>;
  };
  readonly id: string;
  readonly kind: string;
  readonly name: string;
  readonly phone?: string | null;
  readonly score?: number | null;
  readonly costIndex?: number | null;
  readonly serviceAreas?: string[] | null;
  readonly owner: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Vendor = LazyLoading extends LazyLoadingDisabled ? EagerVendor : LazyVendor

export declare const Vendor: (new (init: ModelInit<Vendor>) => Vendor) & {
  copyOf(source: Vendor, mutator: (draft: MutableModel<Vendor>) => MutableModel<Vendor> | void): Vendor;
}

type EagerActionLog = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ActionLog, 'id'>;
    readOnlyFields: 'updatedAt';
  };
  readonly id: string;
  readonly unitID?: string | null;
  readonly referralId?: string | null;
  readonly actor: string;
  readonly action: string;
  readonly reason?: string | null;
  readonly details?: string | null;
  readonly createdAt: string;
  readonly owner: string;
  readonly updatedAt?: string | null;
}

type LazyActionLog = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ActionLog, 'id'>;
    readOnlyFields: 'updatedAt';
  };
  readonly id: string;
  readonly unitID?: string | null;
  readonly referralId?: string | null;
  readonly actor: string;
  readonly action: string;
  readonly reason?: string | null;
  readonly details?: string | null;
  readonly createdAt: string;
  readonly owner: string;
  readonly updatedAt?: string | null;
}

export declare type ActionLog = LazyLoading extends LazyLoadingDisabled ? EagerActionLog : LazyActionLog

export declare const ActionLog: (new (init: ModelInit<ActionLog>) => ActionLog) & {
  copyOf(source: ActionLog, mutator: (draft: MutableModel<ActionLog>) => MutableModel<ActionLog> | void): ActionLog;
}

type EagerRevenueProfile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<RevenueProfile, 'id'>;
  };
  readonly id: string;
  readonly propertyId: string;
  readonly property?: Property | null;
  readonly owner: string;
  readonly tier: RevenueTier | keyof typeof RevenueTier;
  readonly pricingCadence: PricingCadence | keyof typeof PricingCadence;
  readonly isActive: boolean;
  readonly baseNightlyRate?: number | null;
  readonly targetOccupancyPct?: number | null;
  readonly marketName?: string | null;
  readonly notes?: string | null;
  readonly internalLabel?: string | null;
  readonly internalOwnerEmail?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyRevenueProfile = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<RevenueProfile, 'id'>;
  };
  readonly id: string;
  readonly propertyId: string;
  readonly property: AsyncItem<Property | undefined>;
  readonly owner: string;
  readonly tier: RevenueTier | keyof typeof RevenueTier;
  readonly pricingCadence: PricingCadence | keyof typeof PricingCadence;
  readonly isActive: boolean;
  readonly baseNightlyRate?: number | null;
  readonly targetOccupancyPct?: number | null;
  readonly marketName?: string | null;
  readonly notes?: string | null;
  readonly internalLabel?: string | null;
  readonly internalOwnerEmail?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type RevenueProfile = LazyLoading extends LazyLoadingDisabled ? EagerRevenueProfile : LazyRevenueProfile

export declare const RevenueProfile: (new (init: ModelInit<RevenueProfile>) => RevenueProfile) & {
  copyOf(source: RevenueProfile, mutator: (draft: MutableModel<RevenueProfile>) => MutableModel<RevenueProfile> | void): RevenueProfile;
}

type EagerRevenueSnapshot = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<RevenueSnapshot, 'id'>;
  };
  readonly id: string;
  readonly propertyId: string;
  readonly property?: Property | null;
  readonly owner: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly label?: string | null;
  readonly grossRevenue?: number | null;
  readonly occupancyPct?: number | null;
  readonly adr?: number | null;
  readonly nightsBooked?: number | null;
  readonly nightsAvailable?: number | null;
  readonly marketOccupancyPct?: number | null;
  readonly marketAdr?: number | null;
  readonly marketSampleSize?: number | null;
  readonly future30Revenue?: number | null;
  readonly future60Revenue?: number | null;
  readonly future90Revenue?: number | null;
  readonly cleaningFeesCollected?: number | null;
  readonly cancellationsCount?: number | null;
  readonly cancellationRevenueLost?: number | null;
  readonly revenueReportUrl?: string | null;
  readonly dashboardUrl?: string | null;
  readonly keyInsights?: string | null;
  readonly pricingDecisionsSummary?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyRevenueSnapshot = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<RevenueSnapshot, 'id'>;
  };
  readonly id: string;
  readonly propertyId: string;
  readonly property: AsyncItem<Property | undefined>;
  readonly owner: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly label?: string | null;
  readonly grossRevenue?: number | null;
  readonly occupancyPct?: number | null;
  readonly adr?: number | null;
  readonly nightsBooked?: number | null;
  readonly nightsAvailable?: number | null;
  readonly marketOccupancyPct?: number | null;
  readonly marketAdr?: number | null;
  readonly marketSampleSize?: number | null;
  readonly future30Revenue?: number | null;
  readonly future60Revenue?: number | null;
  readonly future90Revenue?: number | null;
  readonly cleaningFeesCollected?: number | null;
  readonly cancellationsCount?: number | null;
  readonly cancellationRevenueLost?: number | null;
  readonly revenueReportUrl?: string | null;
  readonly dashboardUrl?: string | null;
  readonly keyInsights?: string | null;
  readonly pricingDecisionsSummary?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type RevenueSnapshot = LazyLoading extends LazyLoadingDisabled ? EagerRevenueSnapshot : LazyRevenueSnapshot

export declare const RevenueSnapshot: (new (init: ModelInit<RevenueSnapshot>) => RevenueSnapshot) & {
  copyOf(source: RevenueSnapshot, mutator: (draft: MutableModel<RevenueSnapshot>) => MutableModel<RevenueSnapshot> | void): RevenueSnapshot;
}

type EagerRevenueAudit = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<RevenueAudit, 'id'>;
  };
  readonly id: string;
  readonly propertyId: string;
  readonly property?: Property | null;
  readonly owner: string;
  readonly ownerName?: string | null;
  readonly ownerEmail?: string | null;
  readonly listingUrl?: string | null;
  readonly marketName?: string | null;
  readonly estimatedAnnualRevenueCurrent?: number | null;
  readonly estimatedAnnualRevenueOptimized?: number | null;
  readonly projectedGainPct?: number | null;
  readonly underpricingIssues?: string | null;
  readonly competitorSummary?: string | null;
  readonly recommendations?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

type LazyRevenueAudit = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<RevenueAudit, 'id'>;
  };
  readonly id: string;
  readonly propertyId: string;
  readonly property: AsyncItem<Property | undefined>;
  readonly owner: string;
  readonly ownerName?: string | null;
  readonly ownerEmail?: string | null;
  readonly listingUrl?: string | null;
  readonly marketName?: string | null;
  readonly estimatedAnnualRevenueCurrent?: number | null;
  readonly estimatedAnnualRevenueOptimized?: number | null;
  readonly projectedGainPct?: number | null;
  readonly underpricingIssues?: string | null;
  readonly competitorSummary?: string | null;
  readonly recommendations?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export declare type RevenueAudit = LazyLoading extends LazyLoadingDisabled ? EagerRevenueAudit : LazyRevenueAudit

export declare const RevenueAudit: (new (init: ModelInit<RevenueAudit>) => RevenueAudit) & {
  copyOf(source: RevenueAudit, mutator: (draft: MutableModel<RevenueAudit>) => MutableModel<RevenueAudit> | void): RevenueAudit;
}