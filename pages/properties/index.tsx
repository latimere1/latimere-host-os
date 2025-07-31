import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { listProperties } from '../../src/graphql/queries';
import { createProperty } from '../../src/graphql/mutations';
import { Auth } from 'aws-amplify';

const client = generateClient();

export default function Properties() {
  const [items, setItems] = useState<any[]>([]);

  // load properties on mount
  useEffect(() => {
    (async () => {
      const { data } = await client.graphql({ query: listProperties });
      setItems(data.listProperties.items);
    })();
  }, []);

  // create a demo property owned by the signed-in user
  async function addDemo() {
    const user = await Auth.currentAuthenticatedUser();
    await client.graphql({
      query: createProperty,
      variables: {
        input: {
          name: 'Demo Cabin',
          ownerId: user.attributes.sub,
        },
      },
      authMode: 'userPool',
    });
    location.reload();
  }

  return (
    <main style={{ padding: 32 }}>
      <h1>My Properties</h1>
      <button onClick={addDemo}>+ Add Demo Property</button>
      <ul>
        {items.map((p: any) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </main>
  );
}

