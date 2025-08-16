// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { Property, Unit, Booking } = initSchema(schema);

export {
  Property,
  Unit,
  Booking
};