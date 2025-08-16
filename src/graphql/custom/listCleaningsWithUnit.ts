export const listCleaningsWithUnit = /* GraphQL */ `
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
        }
      }
    }
  }
`;
