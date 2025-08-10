/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getProperty = /* GraphQL */ `
  query GetProperty($id: ID!) {
    getProperty(id: $id) {
      id
      name
      address
      sleeps
      owner
      units {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
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
        sleeps
        owner
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
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
      bookings {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
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
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getBooking = /* GraphQL */ `
  query GetBooking($id: ID!) {
    getBooking(id: $id) {
      id
      guestName
      checkIn
      checkOut
      payout
      owner
      unitID
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listBookings = /* GraphQL */ `
  query ListBookings(
    $filter: ModelBookingFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listBookings(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        guestName
        checkIn
        checkOut
        payout
        owner
        unitID
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getCleaning = /* GraphQL */ `
  query GetCleaning($id: ID!) {
    getCleaning(id: $id) {
      id
      unitID
      date
      status
      assignedTo
      notes
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listCleanings = /* GraphQL */ `
  query ListCleanings(
    $filter: ModelCleaningFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCleanings(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        unitID
        date
        status
        assignedTo
        notes
        owner
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getUserProfile = /* GraphQL */ `
  query GetUserProfile($id: ID!) {
    getUserProfile(id: $id) {
      id
      username
      role
      hasPaid
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listUserProfiles = /* GraphQL */ `
  query ListUserProfiles(
    $filter: ModelUserProfileFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        username
        role
        hasPaid
        owner
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getRevenueRecord = /* GraphQL */ `
  query GetRevenueRecord($id: ID!) {
    getRevenueRecord(id: $id) {
      id
      unitID
      amount
      month
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;
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
        amount
        month
        owner
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getCleanerAffiliation = /* GraphQL */ `
  query GetCleanerAffiliation($id: ID!) {
    getCleanerAffiliation(id: $id) {
      id
      owner
      cleanerUsername
      cleanerDisplay
      status
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listCleanerAffiliations = /* GraphQL */ `
  query ListCleanerAffiliations(
    $filter: ModelCleanerAffiliationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCleanerAffiliations(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        owner
        cleanerUsername
        cleanerDisplay
        status
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getInvitation = /* GraphQL */ `
  query GetInvitation($id: ID!) {
    getInvitation(id: $id) {
      id
      owner
      email
      role
      tokenHash
      status
      lastSentAt
      expiresAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listInvitations = /* GraphQL */ `
  query ListInvitations(
    $filter: ModelInvitationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listInvitations(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        owner
        email
        role
        tokenHash
        status
        lastSentAt
        expiresAt
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const unitsByPropertyIDAndName = /* GraphQL */ `
  query UnitsByPropertyIDAndName(
    $propertyID: ID!
    $name: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelUnitFilterInput
    $limit: Int
    $nextToken: String
  ) {
    unitsByPropertyIDAndName(
      propertyID: $propertyID
      name: $name
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
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
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const bookingsByUnitIDAndCheckIn = /* GraphQL */ `
  query BookingsByUnitIDAndCheckIn(
    $unitID: ID!
    $checkIn: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelBookingFilterInput
    $limit: Int
    $nextToken: String
  ) {
    bookingsByUnitIDAndCheckIn(
      unitID: $unitID
      checkIn: $checkIn
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        guestName
        checkIn
        checkOut
        payout
        owner
        unitID
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const listAffiliationsByOwner = /* GraphQL */ `
  query ListAffiliationsByOwner(
    $owner: String!
    $sortDirection: ModelSortDirection
    $filter: ModelCleanerAffiliationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAffiliationsByOwner(
      owner: $owner
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        owner
        cleanerUsername
        cleanerDisplay
        status
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const listAffiliationsByCleaner = /* GraphQL */ `
  query ListAffiliationsByCleaner(
    $cleanerUsername: String!
    $sortDirection: ModelSortDirection
    $filter: ModelCleanerAffiliationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAffiliationsByCleaner(
      cleanerUsername: $cleanerUsername
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        owner
        cleanerUsername
        cleanerDisplay
        status
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const listInvitationsByOwner = /* GraphQL */ `
  query ListInvitationsByOwner(
    $owner: String!
    $sortDirection: ModelSortDirection
    $filter: ModelInvitationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listInvitationsByOwner(
      owner: $owner
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        owner
        email
        role
        tokenHash
        status
        lastSentAt
        expiresAt
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const listInvitationsByEmail = /* GraphQL */ `
  query ListInvitationsByEmail(
    $email: String!
    $sortDirection: ModelSortDirection
    $filter: ModelInvitationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listInvitationsByEmail(
      email: $email
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        owner
        email
        role
        tokenHash
        status
        lastSentAt
        expiresAt
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
