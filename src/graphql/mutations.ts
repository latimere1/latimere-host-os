// src/graphql/mutations.ts

// ─────────────────────────────────────────────
// PROPERTY MUTATIONS
// ─────────────────────────────────────────────

export const createProperty = /* GraphQL */ `
  mutation CreateProperty(
    $input: CreatePropertyInput!
    $condition: ModelPropertyConditionInput
  ) {
    createProperty(input: $input, condition: $condition) {
      id
      name
      address
      sleeps
      owner
      description
      createdAt
      updatedAt
      units {
        nextToken
        __typename
      }
      __typename
    }
  }
`;

export const updateProperty = /* GraphQL */ `
  mutation UpdateProperty(
    $input: UpdatePropertyInput!
    $condition: ModelPropertyConditionInput
  ) {
    updateProperty(input: $input, condition: $condition) {
      id
      name
      address
      sleeps
      owner
      description
      createdAt
      updatedAt
      __typename
    }
  }
`;

export const deleteProperty = /* GraphQL */ `
  mutation DeleteProperty(
    $input: DeletePropertyInput!
    $condition: ModelPropertyConditionInput
  ) {
    deleteProperty(input: $input, condition: $condition) {
      id
      name
      address
      sleeps
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;

// ─────────────────────────────────────────────
// UNIT MUTATIONS
// ─────────────────────────────────────────────

export const createUnit = /* GraphQL */ `
  mutation CreateUnit(
    $input: CreateUnitInput!
    $condition: ModelUnitConditionInput
  ) {
    createUnit(input: $input, condition: $condition) {
      id
      name
      sleeps
      price
      icalURL
      propertyID
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;

export const updateUnit = /* GraphQL */ `
  mutation UpdateUnit(
    $input: UpdateUnitInput!
    $condition: ModelUnitConditionInput
  ) {
    updateUnit(input: $input, condition: $condition) {
      id
      name
      sleeps
      price
      icalURL
      propertyID
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;

export const deleteUnit = /* GraphQL */ `
  mutation DeleteUnit(
    $input: DeleteUnitInput!
    $condition: ModelUnitConditionInput
  ) {
    deleteUnit(input: $input, condition: $condition) {
      id
      __typename
    }
  }
`;

// ─────────────────────────────────────────────
// CLEANING MUTATIONS
// ─────────────────────────────────────────────

export const updateCleaning = /* GraphQL */ `
  mutation UpdateCleaning(
    $input: UpdateCleaningInput!
    $condition: ModelCleaningConditionInput
  ) {
    updateCleaning(input: $input, condition: $condition) {
      id
      unitID
      date
      status
      assignedTo
      createdAt
      updatedAt
      __typename
    }
  }
`;

export const deleteCleaning = /* GraphQL */ `
  mutation DeleteCleaning(
    $input: DeleteCleaningInput!
    $condition: ModelCleaningConditionInput
  ) {
    deleteCleaning(input: $input, condition: $condition) {
      id
      __typename
    }
  }
`;

// ─────────────────────────────────────────────
// USER PROFILE MUTATIONS
// ─────────────────────────────────────────────

export const createUserProfile = /* GraphQL */ `
  mutation CreateUserProfile(
    $input: CreateUserProfileInput!
    $condition: ModelUserProfileConditionInput
  ) {
    createUserProfile(input: $input, condition: $condition) {
      id
      username
      role
      hasPaid
      createdAt
      updatedAt
      __typename
    }
  }
`;

export const updateUserProfile = /* GraphQL */ `
  mutation UpdateUserProfile(
    $input: UpdateUserProfileInput!
    $condition: ModelUserProfileConditionInput
  ) {
    updateUserProfile(input: $input, condition: $condition) {
      id
      username
      role
      hasPaid
      createdAt
      updatedAt
      __typename
    }
  }
`;

export const deleteUserProfile = /* GraphQL */ `
  mutation DeleteUserProfile(
    $input: DeleteUserProfileInput!
    $condition: ModelUserProfileConditionInput
  ) {
    deleteUserProfile(input: $input, condition: $condition) {
      id
      __typename
    }
  }
`;

// ─────────────────────────────────────────────
// REVENUE-RECORD MUTATIONS
// ─────────────────────────────────────────────

export const createRevenueRecord = /* GraphQL */ `
  mutation CreateRevenueRecord(
    $input: CreateRevenueRecordInput!
    $condition: ModelRevenueRecordConditionInput
  ) {
    createRevenueRecord(input: $input, condition: $condition) {
      id
      unitID
      month
      amount
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;

export const updateRevenueRecord = /* GraphQL */ `
  mutation UpdateRevenueRecord(
    $input: UpdateRevenueRecordInput!
    $condition: ModelRevenueRecordConditionInput
  ) {
    updateRevenueRecord(input: $input, condition: $condition) {
      id
      unitID
      month
      amount
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;

export const deleteRevenueRecord = /* GraphQL */ `
  mutation DeleteRevenueRecord(
    $input: DeleteRevenueRecordInput!
    $condition: ModelRevenueRecordConditionInput
  ) {
    deleteRevenueRecord(input: $input, condition: $condition) {
      id
      __typename
    }
  }
`;
