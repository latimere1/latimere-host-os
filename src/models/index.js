// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { Property, Unit } = initSchema(schema);

export {
  Property,
  Unit
};