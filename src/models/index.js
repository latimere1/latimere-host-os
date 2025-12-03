// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';

const RevenueTier = {
  "ESSENTIAL": "ESSENTIAL",
  "PRO": "PRO",
  "ELITE": "ELITE"
};

const PricingCadence = {
  "WEEKLY": "WEEKLY",
  "DAILY": "DAILY"
};

const { Property, Unit, Booking, Cleaning, UserProfile, RevenueRecord, CleanerAffiliation, Invitation, InboxThread, InboxMessage, Referral, ReferralPartner, Policy, NightlyRate, Turn, Vendor, ActionLog, RevenueProfile, RevenueSnapshot, RevenueAudit, PolicyRef } = initSchema(schema);

export {
  Property,
  Unit,
  Booking,
  Cleaning,
  UserProfile,
  RevenueRecord,
  CleanerAffiliation,
  Invitation,
  InboxThread,
  InboxMessage,
  Referral,
  ReferralPartner,
  Policy,
  NightlyRate,
  Turn,
  Vendor,
  ActionLog,
  RevenueProfile,
  RevenueSnapshot,
  RevenueAudit,
  RevenueTier,
  PricingCadence,
  PolicyRef
};