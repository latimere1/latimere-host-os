// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { Property, Unit, Booking, Cleaning, UserProfile, RevenueRecord, CleanerAffiliation, Invitation } = initSchema(schema);

export {
  Property,
  Unit,
  Booking,
  Cleaning,
  UserProfile,
  RevenueRecord,
  CleanerAffiliation,
  Invitation
};