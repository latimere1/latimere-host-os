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
      timezone
      bedrooms
      bathrooms
      baseRate
      minStay
      policies {
        id
        type
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
      timezone
      bedrooms
      bathrooms
      baseRate
      minStay
      policies {
        id
        type
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
      timezone
      bedrooms
      bathrooms
      baseRate
      minStay
      policies {
        id
        type
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
      channel
      status
      guestEmail
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
      channel
      status
      guestEmail
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
      channel
      status
      guestEmail
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
export const deleteInboxThread = /* GraphQL */ `
  mutation DeleteInboxThread(
    $input: DeleteInboxThreadInput!
    $condition: ModelInboxThreadConditionInput
  ) {
    deleteInboxThread(input: $input, condition: $condition) {
      id
      maskedEmail
      subject
      lastMessageAt
      messages {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateInboxMessage = /* GraphQL */ `
  mutation UpdateInboxMessage(
    $input: UpdateInboxMessageInput!
    $condition: ModelInboxMessageConditionInput
  ) {
    updateInboxMessage(input: $input, condition: $condition) {
      id
      threadId
      from
      to
      subject
      body
      messageId
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteInboxMessage = /* GraphQL */ `
  mutation DeleteInboxMessage(
    $input: DeleteInboxMessageInput!
    $condition: ModelInboxMessageConditionInput
  ) {
    deleteInboxMessage(input: $input, condition: $condition) {
      id
      threadId
      from
      to
      subject
      body
      messageId
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createPolicy = /* GraphQL */ `
  mutation CreatePolicy(
    $input: CreatePolicyInput!
    $condition: ModelPolicyConditionInput
  ) {
    createPolicy(input: $input, condition: $condition) {
      id
      unitID
      type
      config
      enabled
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updatePolicy = /* GraphQL */ `
  mutation UpdatePolicy(
    $input: UpdatePolicyInput!
    $condition: ModelPolicyConditionInput
  ) {
    updatePolicy(input: $input, condition: $condition) {
      id
      unitID
      type
      config
      enabled
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deletePolicy = /* GraphQL */ `
  mutation DeletePolicy(
    $input: DeletePolicyInput!
    $condition: ModelPolicyConditionInput
  ) {
    deletePolicy(input: $input, condition: $condition) {
      id
      unitID
      type
      config
      enabled
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteNightlyRate = /* GraphQL */ `
  mutation DeleteNightlyRate(
    $input: DeleteNightlyRateInput!
    $condition: ModelNightlyRateConditionInput
  ) {
    deleteNightlyRate(input: $input, condition: $condition) {
      id
      unitID
      date
      state
      price
      reason
      details
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteTurn = /* GraphQL */ `
  mutation DeleteTurn(
    $input: DeleteTurnInput!
    $condition: ModelTurnConditionInput
  ) {
    deleteTurn(input: $input, condition: $condition) {
      id
      unitID
      bookingId
      startDate
      endDate
      status
      assignedToVendorId
      photos
      notes
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createVendor = /* GraphQL */ `
  mutation CreateVendor(
    $input: CreateVendorInput!
    $condition: ModelVendorConditionInput
  ) {
    createVendor(input: $input, condition: $condition) {
      id
      kind
      name
      phone
      score
      costIndex
      serviceAreas
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateVendor = /* GraphQL */ `
  mutation UpdateVendor(
    $input: UpdateVendorInput!
    $condition: ModelVendorConditionInput
  ) {
    updateVendor(input: $input, condition: $condition) {
      id
      kind
      name
      phone
      score
      costIndex
      serviceAreas
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteVendor = /* GraphQL */ `
  mutation DeleteVendor(
    $input: DeleteVendorInput!
    $condition: ModelVendorConditionInput
  ) {
    deleteVendor(input: $input, condition: $condition) {
      id
      kind
      name
      phone
      score
      costIndex
      serviceAreas
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateActionLog = /* GraphQL */ `
  mutation UpdateActionLog(
    $input: UpdateActionLogInput!
    $condition: ModelActionLogConditionInput
  ) {
    updateActionLog(input: $input, condition: $condition) {
      id
      unitID
      actor
      action
      reason
      details
      createdAt
      owner
      updatedAt
      __typename
    }
  }
`;
export const deleteActionLog = /* GraphQL */ `
  mutation DeleteActionLog(
    $input: DeleteActionLogInput!
    $condition: ModelActionLogConditionInput
  ) {
    deleteActionLog(input: $input, condition: $condition) {
      id
      unitID
      actor
      action
      reason
      details
      createdAt
      owner
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
export const createInboxThread = /* GraphQL */ `
  mutation CreateInboxThread(
    $input: CreateInboxThreadInput!
    $condition: ModelInboxThreadConditionInput
  ) {
    createInboxThread(input: $input, condition: $condition) {
      id
      maskedEmail
      subject
      lastMessageAt
      messages {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateInboxThread = /* GraphQL */ `
  mutation UpdateInboxThread(
    $input: UpdateInboxThreadInput!
    $condition: ModelInboxThreadConditionInput
  ) {
    updateInboxThread(input: $input, condition: $condition) {
      id
      maskedEmail
      subject
      lastMessageAt
      messages {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createInboxMessage = /* GraphQL */ `
  mutation CreateInboxMessage(
    $input: CreateInboxMessageInput!
    $condition: ModelInboxMessageConditionInput
  ) {
    createInboxMessage(input: $input, condition: $condition) {
      id
      threadId
      from
      to
      subject
      body
      messageId
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createReferral = /* GraphQL */ `
  mutation CreateReferral(
    $input: CreateReferralInput!
    $condition: ModelReferralConditionInput
  ) {
    createReferral(input: $input, condition: $condition) {
      id
      realtorName
      realtorEmail
      realtorSub
      realtorAgency
      clientName
      clientEmail
      notes
      source
      realtorEmailIndex
      clientEmailIndex
      inviteToken
      onboardingStatus
      lastEmailSentAt
      lastEmailStatus
      lastEmailMessageId
      payoutEligible
      payoutSent
      payoutMethod
      payoutReference
      payoutMarkedAt
      debugContext
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateReferral = /* GraphQL */ `
  mutation UpdateReferral(
    $input: UpdateReferralInput!
    $condition: ModelReferralConditionInput
  ) {
    updateReferral(input: $input, condition: $condition) {
      id
      realtorName
      realtorEmail
      realtorSub
      realtorAgency
      clientName
      clientEmail
      notes
      source
      realtorEmailIndex
      clientEmailIndex
      inviteToken
      onboardingStatus
      lastEmailSentAt
      lastEmailStatus
      lastEmailMessageId
      payoutEligible
      payoutSent
      payoutMethod
      payoutReference
      payoutMarkedAt
      debugContext
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteReferral = /* GraphQL */ `
  mutation DeleteReferral(
    $input: DeleteReferralInput!
    $condition: ModelReferralConditionInput
  ) {
    deleteReferral(input: $input, condition: $condition) {
      id
      realtorName
      realtorEmail
      realtorSub
      realtorAgency
      clientName
      clientEmail
      notes
      source
      realtorEmailIndex
      clientEmailIndex
      inviteToken
      onboardingStatus
      lastEmailSentAt
      lastEmailStatus
      lastEmailMessageId
      payoutEligible
      payoutSent
      payoutMethod
      payoutReference
      payoutMarkedAt
      debugContext
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createNightlyRate = /* GraphQL */ `
  mutation CreateNightlyRate(
    $input: CreateNightlyRateInput!
    $condition: ModelNightlyRateConditionInput
  ) {
    createNightlyRate(input: $input, condition: $condition) {
      id
      unitID
      date
      state
      price
      reason
      details
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateNightlyRate = /* GraphQL */ `
  mutation UpdateNightlyRate(
    $input: UpdateNightlyRateInput!
    $condition: ModelNightlyRateConditionInput
  ) {
    updateNightlyRate(input: $input, condition: $condition) {
      id
      unitID
      date
      state
      price
      reason
      details
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createTurn = /* GraphQL */ `
  mutation CreateTurn(
    $input: CreateTurnInput!
    $condition: ModelTurnConditionInput
  ) {
    createTurn(input: $input, condition: $condition) {
      id
      unitID
      bookingId
      startDate
      endDate
      status
      assignedToVendorId
      photos
      notes
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateTurn = /* GraphQL */ `
  mutation UpdateTurn(
    $input: UpdateTurnInput!
    $condition: ModelTurnConditionInput
  ) {
    updateTurn(input: $input, condition: $condition) {
      id
      unitID
      bookingId
      startDate
      endDate
      status
      assignedToVendorId
      photos
      notes
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createActionLog = /* GraphQL */ `
  mutation CreateActionLog(
    $input: CreateActionLogInput!
    $condition: ModelActionLogConditionInput
  ) {
    createActionLog(input: $input, condition: $condition) {
      id
      unitID
      actor
      action
      reason
      details
      createdAt
      owner
      updatedAt
      __typename
    }
  }
`;
