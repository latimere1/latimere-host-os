// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { Property, Unit, Booking, Cleaning, UserProfile, RevenueRecord, CleanerAffiliation, Invitation, InboxThread, InboxMessage, Referral, Policy, NightlyRate, Turn, Vendor, ActionLog, PolicyRef } = initSchema(schema);

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
  Policy,
  NightlyRate,
  Turn,
  Vendor,
  ActionLog,
  PolicyRef
};