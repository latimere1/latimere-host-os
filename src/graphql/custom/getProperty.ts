export const getProperty = /* GraphQL */ `
  query GetProperty($id: ID!) {
    getProperty(id: $id) {
      id
      name
      address
      sleeps
      owner
      createdAt
      updatedAt
      units {
        items {
          id
          name
          sleeps
          price
          propertyID
        }
        nextToken
      }
    }
  }
`;
