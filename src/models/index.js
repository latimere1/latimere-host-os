// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { Property } = initSchema(schema);

export {
  Property
};