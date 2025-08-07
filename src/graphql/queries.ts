// src/graphql/queries.ts

// ─────────────────────────────────────────────
// PROPERTY QUERIES
// ─────────────────────────────────────────────

export const listProperties = /* GraphQL */ `
  query ListProperties(
    $filter: ModelPropertyFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listProperties(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        address
        owner
        description
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

export const getProperty = /* GraphQL */ `
  query GetProperty($id: ID!) {
    getProperty(id: $id) {
      id
      name
      address
      description
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
          createdAt
          updatedAt
        }
        nextToken
      }
    }
  }
`;

// ─────────────────────────────────────────────
// UNIT QUERIES
// ─────────────────────────────────────────────

export const listUnits = /* GraphQL */ `
  query ListUnits(
    $filter: ModelUnitFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUnits(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        sleeps
        price
        icalURL
        owner
        propertyID
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

export const getUnit = /* GraphQL */ `
  query GetUnit($id: ID!) {
    getUnit(id: $id) {
      id
      name
      sleeps
      price
      icalURL
      owner
      propertyID
      createdAt
      updatedAt
    }
  }
`;

// ─────────────────────────────────────────────
// CLEANING QUERIES
// ─────────────────────────────────────────────

export const listCleanings = /* GraphQL */ `
  query ListCleanings(
    $filter: ModelCleaningFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCleanings(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        scheduledDate
        status
        assignedTo
        unitID
        createdAt
        updatedAt
        unit {
          id
          name
        }
      }
      nextToken
    }
  }
`;

export const getCleaning = /* GraphQL */ `
  query GetCleaning($id: ID!) {
    getCleaning(id: $id) {
      id
      date
      scheduledDate
      status
      assignedTo
      unitID
      createdAt
      updatedAt
    }
  }
`;

// ─────────────────────────────────────────────
// USER PROFILE QUERIES
// ─────────────────────────────────────────────

export const getUserProfile = /* GraphQL */ `
  query GetUserProfile($id: ID!) {
    getUserProfile(id: $id) {
      id
      username
      role
      hasPaid
      createdAt
      updatedAt
    }
  }
`;

// ─────────────────────────────────────────────
// REVENUE RECORD QUERIES
// ─────────────────────────────────────────────

export const listRevenueRecords = /* GraphQL */ `
  query ListRevenueRecords(
    $filter: ModelRevenueRecordFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRevenueRecords(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        unitID
        month
        amount
        owner
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

export const getRevenueRecord = /* GraphQL */ `
  query GetRevenueRecord($id: ID!) {
    getRevenueRecord(id: $id) {
      id
      unitID
      month
      amount
      owner
      createdAt
      updatedAt
    }
  }
`;
