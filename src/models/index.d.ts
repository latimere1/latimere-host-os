import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled, AsyncCollection } from "@aws-amplify/datastore";





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