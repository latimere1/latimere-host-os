/* eslint-disable */
// this is an auto generated file. This will be overwritten

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
export const deleteUnit = /* GraphQL */ `
  mutation DeleteUnit(
    $input: DeleteUnitInput!
    $condition: ModelUnitConditionInput
  ) {
    deleteUnit(input: $input, condition: $condition) {
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
export const createBooking = /* GraphQL */ `
  mutation CreateBooking(
    $input: CreateBookingInput!
    $condition: ModelBookingConditionInput
  ) {
    createBooking(input: $input, condition: $condition) {
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
export const updateBooking = /* GraphQL */ `
  mutation UpdateBooking(
    $input: UpdateBookingInput!
    $condition: ModelBookingConditionInput
  ) {
    updateBooking(input: $input, condition: $condition) {
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
export const deleteBooking = /* GraphQL */ `
  mutation DeleteBooking(
    $input: DeleteBookingInput!
    $condition: ModelBookingConditionInput
  ) {
    deleteBooking(input: $input, condition: $condition) {
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
export const createCleaning = /* GraphQL */ `
  mutation CreateCleaning(
    $input: CreateCleaningInput!
    $condition: ModelCleaningConditionInput
  ) {
    createCleaning(input: $input, condition: $condition) {
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
      notes
      owner
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
      owner
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
      owner
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
export const createRevenueRecord = /* GraphQL */ `
  mutation CreateRevenueRecord(
    $input: CreateRevenueRecordInput!
    $condition: ModelRevenueRecordConditionInput
  ) {
    createRevenueRecord(input: $input, condition: $condition) {
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
export const updateRevenueRecord = /* GraphQL */ `
  mutation UpdateRevenueRecord(
    $input: UpdateRevenueRecordInput!
    $condition: ModelRevenueRecordConditionInput
  ) {
    updateRevenueRecord(input: $input, condition: $condition) {
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
export const deleteRevenueRecord = /* GraphQL */ `
  mutation DeleteRevenueRecord(
    $input: DeleteRevenueRecordInput!
    $condition: ModelRevenueRecordConditionInput
  ) {
    deleteRevenueRecord(input: $input, condition: $condition) {
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
export const createCleanerAffiliation = /* GraphQL */ `
  mutation CreateCleanerAffiliation(
    $input: CreateCleanerAffiliationInput!
    $condition: ModelCleanerAffiliationConditionInput
  ) {
    createCleanerAffiliation(input: $input, condition: $condition) {
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
export const updateCleanerAffiliation = /* GraphQL */ `
  mutation UpdateCleanerAffiliation(
    $input: UpdateCleanerAffiliationInput!
    $condition: ModelCleanerAffiliationConditionInput
  ) {
    updateCleanerAffiliation(input: $input, condition: $condition) {
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
export const deleteCleanerAffiliation = /* GraphQL */ `
  mutation DeleteCleanerAffiliation(
    $input: DeleteCleanerAffiliationInput!
    $condition: ModelCleanerAffiliationConditionInput
  ) {
    deleteCleanerAffiliation(input: $input, condition: $condition) {
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
export const createInvitation = /* GraphQL */ `
  mutation CreateInvitation(
    $input: CreateInvitationInput!
    $condition: ModelInvitationConditionInput
  ) {
    createInvitation(input: $input, condition: $condition) {
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
export const updateInvitation = /* GraphQL */ `
  mutation UpdateInvitation(
    $input: UpdateInvitationInput!
    $condition: ModelInvitationConditionInput
  ) {
    updateInvitation(input: $input, condition: $condition) {
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
export const deleteInvitation = /* GraphQL */ `
  mutation DeleteInvitation(
    $input: DeleteInvitationInput!
    $condition: ModelInvitationConditionInput
  ) {
    deleteInvitation(input: $input, condition: $condition) {
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
