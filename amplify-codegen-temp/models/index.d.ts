import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled, AsyncCollection } from "@aws-amplify/datastore";



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
  readonly address: string;
  readonly sleeps: number;
  readonly owner: string;
  readonly units?: (Unit | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyProperty = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Property, 'id'>;
  };
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly sleeps: number;
  readonly owner: string;
  readonly units: AsyncCollection<Unit>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
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
  readonly inviteToken: string;
  readonly onboardingStatus: string;
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
  readonly inviteToken: string;
  readonly onboardingStatus: string;
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
  readonly unitID: string;
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
  readonly unitID: string;
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