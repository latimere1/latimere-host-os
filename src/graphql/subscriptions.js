/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateProperty = /* GraphQL */ `
  subscription OnCreateProperty(
    $filter: ModelSubscriptionPropertyFilterInput
    $owner: String
  ) {
    onCreateProperty(filter: $filter, owner: $owner) {
      id
      name
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onUpdateProperty = /* GraphQL */ `
  subscription OnUpdateProperty(
    $filter: ModelSubscriptionPropertyFilterInput
    $owner: String
  ) {
    onUpdateProperty(filter: $filter, owner: $owner) {
      id
      name
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onDeleteProperty = /* GraphQL */ `
  subscription OnDeleteProperty(
    $filter: ModelSubscriptionPropertyFilterInput
    $owner: String
  ) {
    onDeleteProperty(filter: $filter, owner: $owner) {
      id
      name
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
