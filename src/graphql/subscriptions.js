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
export const onUpdateProperty = /* GraphQL */ `
  subscription OnUpdateProperty(
    $filter: ModelSubscriptionPropertyFilterInput
    $owner: String
  ) {
    onUpdateProperty(filter: $filter, owner: $owner) {
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
export const onDeleteProperty = /* GraphQL */ `
  subscription OnDeleteProperty(
    $filter: ModelSubscriptionPropertyFilterInput
    $owner: String
  ) {
    onDeleteProperty(filter: $filter, owner: $owner) {
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
export const onCreateUnit = /* GraphQL */ `
  subscription OnCreateUnit(
    $filter: ModelSubscriptionUnitFilterInput
    $owner: String
  ) {
    onCreateUnit(filter: $filter, owner: $owner) {
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
export const onUpdateUnit = /* GraphQL */ `
  subscription OnUpdateUnit(
    $filter: ModelSubscriptionUnitFilterInput
    $owner: String
  ) {
    onUpdateUnit(filter: $filter, owner: $owner) {
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
export const onDeleteUnit = /* GraphQL */ `
  subscription OnDeleteUnit(
    $filter: ModelSubscriptionUnitFilterInput
    $owner: String
  ) {
    onDeleteUnit(filter: $filter, owner: $owner) {
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
export const onCreateBooking = /* GraphQL */ `
  subscription OnCreateBooking(
    $filter: ModelSubscriptionBookingFilterInput
    $owner: String
  ) {
    onCreateBooking(filter: $filter, owner: $owner) {
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
export const onUpdateBooking = /* GraphQL */ `
  subscription OnUpdateBooking(
    $filter: ModelSubscriptionBookingFilterInput
    $owner: String
  ) {
    onUpdateBooking(filter: $filter, owner: $owner) {
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
export const onDeleteBooking = /* GraphQL */ `
  subscription OnDeleteBooking(
    $filter: ModelSubscriptionBookingFilterInput
    $owner: String
  ) {
    onDeleteBooking(filter: $filter, owner: $owner) {
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
export const onCreateCleaning = /* GraphQL */ `
  subscription OnCreateCleaning(
    $filter: ModelSubscriptionCleaningFilterInput
    $owner: String
    $assignedTo: String
  ) {
    onCreateCleaning(filter: $filter, owner: $owner, assignedTo: $assignedTo) {
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
export const onUpdateCleaning = /* GraphQL */ `
  subscription OnUpdateCleaning(
    $filter: ModelSubscriptionCleaningFilterInput
    $owner: String
    $assignedTo: String
  ) {
    onUpdateCleaning(filter: $filter, owner: $owner, assignedTo: $assignedTo) {
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
export const onDeleteCleaning = /* GraphQL */ `
  subscription OnDeleteCleaning(
    $filter: ModelSubscriptionCleaningFilterInput
    $owner: String
    $assignedTo: String
  ) {
    onDeleteCleaning(filter: $filter, owner: $owner, assignedTo: $assignedTo) {
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
export const onCreateUserProfile = /* GraphQL */ `
  subscription OnCreateUserProfile(
    $filter: ModelSubscriptionUserProfileFilterInput
    $owner: String
  ) {
    onCreateUserProfile(filter: $filter, owner: $owner) {
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
export const onUpdateUserProfile = /* GraphQL */ `
  subscription OnUpdateUserProfile(
    $filter: ModelSubscriptionUserProfileFilterInput
    $owner: String
  ) {
    onUpdateUserProfile(filter: $filter, owner: $owner) {
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
export const onDeleteUserProfile = /* GraphQL */ `
  subscription OnDeleteUserProfile(
    $filter: ModelSubscriptionUserProfileFilterInput
    $owner: String
  ) {
    onDeleteUserProfile(filter: $filter, owner: $owner) {
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
export const onCreateRevenueRecord = /* GraphQL */ `
  subscription OnCreateRevenueRecord(
    $filter: ModelSubscriptionRevenueRecordFilterInput
    $owner: String
  ) {
    onCreateRevenueRecord(filter: $filter, owner: $owner) {
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
export const onUpdateRevenueRecord = /* GraphQL */ `
  subscription OnUpdateRevenueRecord(
    $filter: ModelSubscriptionRevenueRecordFilterInput
    $owner: String
  ) {
    onUpdateRevenueRecord(filter: $filter, owner: $owner) {
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
export const onDeleteRevenueRecord = /* GraphQL */ `
  subscription OnDeleteRevenueRecord(
    $filter: ModelSubscriptionRevenueRecordFilterInput
    $owner: String
  ) {
    onDeleteRevenueRecord(filter: $filter, owner: $owner) {
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
export const onCreateCleanerAffiliation = /* GraphQL */ `
  subscription OnCreateCleanerAffiliation(
    $filter: ModelSubscriptionCleanerAffiliationFilterInput
    $owner: String
  ) {
    onCreateCleanerAffiliation(filter: $filter, owner: $owner) {
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
export const onUpdateCleanerAffiliation = /* GraphQL */ `
  subscription OnUpdateCleanerAffiliation(
    $filter: ModelSubscriptionCleanerAffiliationFilterInput
    $owner: String
  ) {
    onUpdateCleanerAffiliation(filter: $filter, owner: $owner) {
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
export const onDeleteCleanerAffiliation = /* GraphQL */ `
  subscription OnDeleteCleanerAffiliation(
    $filter: ModelSubscriptionCleanerAffiliationFilterInput
    $owner: String
  ) {
    onDeleteCleanerAffiliation(filter: $filter, owner: $owner) {
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
export const onCreateInvitation = /* GraphQL */ `
  subscription OnCreateInvitation(
    $filter: ModelSubscriptionInvitationFilterInput
    $owner: String
  ) {
    onCreateInvitation(filter: $filter, owner: $owner) {
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
export const onUpdateInvitation = /* GraphQL */ `
  subscription OnUpdateInvitation(
    $filter: ModelSubscriptionInvitationFilterInput
    $owner: String
  ) {
    onUpdateInvitation(filter: $filter, owner: $owner) {
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
export const onDeleteInvitation = /* GraphQL */ `
  subscription OnDeleteInvitation(
    $filter: ModelSubscriptionInvitationFilterInput
    $owner: String
  ) {
    onDeleteInvitation(filter: $filter, owner: $owner) {
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
