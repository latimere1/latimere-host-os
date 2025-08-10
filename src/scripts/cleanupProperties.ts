// src/scripts/cleanupProperties.ts

import { generateClient } from 'aws-amplify/api';
import { GraphQLResult } from '@aws-amplify/api-graphql';
import { listProperties } from '../graphql/queries';
import { deleteProperty } from '../graphql/mutations';

const client = generateClient();

interface Property {
  id: string;
  address: string;
  sleeps: number;
  [key: string]: any;
}

async function cleanupCorruptedProperties() {
  console.log('🟢 Starting property cleanup...');

  try {
    const response = (await client.graphql({
      query: listProperties,
      authMode: 'userPool',
    })) as GraphQLResult<any>;

    if (!response?.data?.listProperties?.items) {
      console.error('❌ No property data returned.');
      return;
    }

    const items: any[] = response.data.listProperties.items;
    console.log(`📦 Retrieved ${items.length} properties.`);

    const corrupted = items.filter((item: any) =>
      !item ||
      typeof item.id !== 'string' ||
      typeof item.address !== 'string' ||
      typeof item.sleeps !== 'number'
    );

    console.log(`⚠️ Found ${corrupted.length} corrupted properties.`);
    if (corrupted.length > 0) {
      console.table(
        corrupted.map(item => ({
          id: item?.id || '❌ MISSING',
          address: item?.address,
          sleeps: item?.sleeps,
        }))
      );
    }

    let deleted = 0;
    let failed = 0;

    for (const item of corrupted) {
      if (!item?.id) {
        console.warn('⛔ Skipping item with missing ID:', item);
        failed++;
        continue;
      }

      try {
        await client.graphql({
          query: deleteProperty,
          variables: { input: { id: item.id } },
          authMode: 'userPool',
        });
        console.log(`🗑️ Deleted property: ${item.id}`);
        deleted++;
      } catch (err) {
        console.error(`❌ Failed to delete ${item.id}:`, err);
        failed++;
      }
    }

    console.log(`✅ Cleanup complete. Deleted: ${deleted}, Failed: ${failed}`);
  } catch (err: unknown) {
    console.error('🔥 Top-level error:');
    if (err instanceof Error) {
      console.error(err.message);
      console.error(err.stack);
    } else if (typeof err === 'object') {
      console.dir(err, { depth: null });
    } else {
      console.error(String(err));
    }
  }
}

cleanupCorruptedProperties();
