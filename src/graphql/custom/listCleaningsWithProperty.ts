export const listCleaningsWithProperty = /* GraphQL */ `
  query ListCleanings {
    listCleanings {
      items {
        id
        unitID
        date
        scheduledDate
        status
        assignedTo
        unit {
          id
          name
          propertyID
          property {
            id
            name
          }
        }
      }
    }
  }
`;
