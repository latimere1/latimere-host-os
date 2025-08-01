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
      units {
        nextToken
        __typename
      }
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
      address
      sleeps
      units {
        nextToken
        __typename
      }
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
      address
      sleeps
      units {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      owner
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
      propertyID
      icalURL
      bookings {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      owner
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
      propertyID
      icalURL
      bookings {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      owner
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
      propertyID
      icalURL
      bookings {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      owner
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
      unitID
      guestName
      checkIn
      checkOut
      payout
      createdAt
      updatedAt
      owner
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
      unitID
      guestName
      checkIn
      checkOut
      payout
      createdAt
      updatedAt
      owner
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
      unitID
      guestName
      checkIn
      checkOut
      payout
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
