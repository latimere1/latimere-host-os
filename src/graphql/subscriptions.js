/* eslint-disable */
// this is an auto generated file. This will be overwritten

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
export const onCreateProperty = /* GraphQL */ `
  subscription OnCreateProperty(
    $filter: ModelSubscriptionPropertyFilterInput
    $owner: String
  ) {
    onCreateProperty(filter: $filter, owner: $owner) {
      id
      name
      nickname
      address
      city
      state
      country
      sleeps
      owner
      units {
        nextToken
        __typename
      }
      revenueProfile {
        id
        propertyId
        owner
        tier
        pricingCadence
        isActive
        baseNightlyRate
        targetOccupancyPct
        marketName
        notes
        internalLabel
        internalOwnerEmail
        createdAt
        updatedAt
        __typename
      }
      revenueSnapshots {
        nextToken
        __typename
      }
      revenueAudits {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      propertyRevenueProfileId
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
      nickname
      address
      city
      state
      country
      sleeps
      owner
      units {
        nextToken
        __typename
      }
      revenueProfile {
        id
        propertyId
        owner
        tier
        pricingCadence
        isActive
        baseNightlyRate
        targetOccupancyPct
        marketName
        notes
        internalLabel
        internalOwnerEmail
        createdAt
        updatedAt
        __typename
      }
      revenueSnapshots {
        nextToken
        __typename
      }
      revenueAudits {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      propertyRevenueProfileId
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
      nickname
      address
      city
      state
      country
      sleeps
      owner
      units {
        nextToken
        __typename
      }
      revenueProfile {
        id
        propertyId
        owner
        tier
        pricingCadence
        isActive
        baseNightlyRate
        targetOccupancyPct
        marketName
        notes
        internalLabel
        internalOwnerEmail
        createdAt
        updatedAt
        __typename
      }
      revenueSnapshots {
        nextToken
        __typename
      }
      revenueAudits {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      propertyRevenueProfileId
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
      channel
      status
      guestEmail
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
      channel
      status
      guestEmail
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
      channel
      status
      guestEmail
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
export const onCreateInboxThread = /* GraphQL */ `
  subscription OnCreateInboxThread(
    $filter: ModelSubscriptionInboxThreadFilterInput
  ) {
    onCreateInboxThread(filter: $filter) {
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
export const onUpdateInboxThread = /* GraphQL */ `
  subscription OnUpdateInboxThread(
    $filter: ModelSubscriptionInboxThreadFilterInput
  ) {
    onUpdateInboxThread(filter: $filter) {
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
export const onDeleteInboxThread = /* GraphQL */ `
  subscription OnDeleteInboxThread(
    $filter: ModelSubscriptionInboxThreadFilterInput
  ) {
    onDeleteInboxThread(filter: $filter) {
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
export const onCreateReferral = /* GraphQL */ `
  subscription OnCreateReferral(
    $filter: ModelSubscriptionReferralFilterInput
    $realtorSub: String
  ) {
    onCreateReferral(filter: $filter, realtorSub: $realtorSub) {
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
export const onUpdateReferral = /* GraphQL */ `
  subscription OnUpdateReferral(
    $filter: ModelSubscriptionReferralFilterInput
    $realtorSub: String
  ) {
    onUpdateReferral(filter: $filter, realtorSub: $realtorSub) {
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
export const onDeleteReferral = /* GraphQL */ `
  subscription OnDeleteReferral(
    $filter: ModelSubscriptionReferralFilterInput
    $realtorSub: String
  ) {
    onDeleteReferral(filter: $filter, realtorSub: $realtorSub) {
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
export const onCreatePolicy = /* GraphQL */ `
  subscription OnCreatePolicy(
    $filter: ModelSubscriptionPolicyFilterInput
    $owner: String
  ) {
    onCreatePolicy(filter: $filter, owner: $owner) {
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
export const onUpdatePolicy = /* GraphQL */ `
  subscription OnUpdatePolicy(
    $filter: ModelSubscriptionPolicyFilterInput
    $owner: String
  ) {
    onUpdatePolicy(filter: $filter, owner: $owner) {
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
export const onDeletePolicy = /* GraphQL */ `
  subscription OnDeletePolicy(
    $filter: ModelSubscriptionPolicyFilterInput
    $owner: String
  ) {
    onDeletePolicy(filter: $filter, owner: $owner) {
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
export const onCreateNightlyRate = /* GraphQL */ `
  subscription OnCreateNightlyRate(
    $filter: ModelSubscriptionNightlyRateFilterInput
    $owner: String
  ) {
    onCreateNightlyRate(filter: $filter, owner: $owner) {
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
export const onUpdateNightlyRate = /* GraphQL */ `
  subscription OnUpdateNightlyRate(
    $filter: ModelSubscriptionNightlyRateFilterInput
    $owner: String
  ) {
    onUpdateNightlyRate(filter: $filter, owner: $owner) {
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
export const onDeleteNightlyRate = /* GraphQL */ `
  subscription OnDeleteNightlyRate(
    $filter: ModelSubscriptionNightlyRateFilterInput
    $owner: String
  ) {
    onDeleteNightlyRate(filter: $filter, owner: $owner) {
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
export const onCreateTurn = /* GraphQL */ `
  subscription OnCreateTurn(
    $filter: ModelSubscriptionTurnFilterInput
    $owner: String
  ) {
    onCreateTurn(filter: $filter, owner: $owner) {
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
export const onUpdateTurn = /* GraphQL */ `
  subscription OnUpdateTurn(
    $filter: ModelSubscriptionTurnFilterInput
    $owner: String
  ) {
    onUpdateTurn(filter: $filter, owner: $owner) {
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
export const onDeleteTurn = /* GraphQL */ `
  subscription OnDeleteTurn(
    $filter: ModelSubscriptionTurnFilterInput
    $owner: String
  ) {
    onDeleteTurn(filter: $filter, owner: $owner) {
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
export const onCreateVendor = /* GraphQL */ `
  subscription OnCreateVendor(
    $filter: ModelSubscriptionVendorFilterInput
    $owner: String
  ) {
    onCreateVendor(filter: $filter, owner: $owner) {
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
export const onUpdateVendor = /* GraphQL */ `
  subscription OnUpdateVendor(
    $filter: ModelSubscriptionVendorFilterInput
    $owner: String
  ) {
    onUpdateVendor(filter: $filter, owner: $owner) {
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
export const onDeleteVendor = /* GraphQL */ `
  subscription OnDeleteVendor(
    $filter: ModelSubscriptionVendorFilterInput
    $owner: String
  ) {
    onDeleteVendor(filter: $filter, owner: $owner) {
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
export const onCreateActionLog = /* GraphQL */ `
  subscription OnCreateActionLog(
    $filter: ModelSubscriptionActionLogFilterInput
    $owner: String
  ) {
    onCreateActionLog(filter: $filter, owner: $owner) {
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
export const onUpdateActionLog = /* GraphQL */ `
  subscription OnUpdateActionLog(
    $filter: ModelSubscriptionActionLogFilterInput
    $owner: String
  ) {
    onUpdateActionLog(filter: $filter, owner: $owner) {
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
export const onDeleteActionLog = /* GraphQL */ `
  subscription OnDeleteActionLog(
    $filter: ModelSubscriptionActionLogFilterInput
    $owner: String
  ) {
    onDeleteActionLog(filter: $filter, owner: $owner) {
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
export const onCreateRevenueProfile = /* GraphQL */ `
  subscription OnCreateRevenueProfile(
    $filter: ModelSubscriptionRevenueProfileFilterInput
    $owner: String
  ) {
    onCreateRevenueProfile(filter: $filter, owner: $owner) {
      id
      propertyId
      property {
        id
        name
        nickname
        address
        city
        state
        country
        sleeps
        owner
        createdAt
        updatedAt
        propertyRevenueProfileId
        __typename
      }
      owner
      tier
      pricingCadence
      isActive
      baseNightlyRate
      targetOccupancyPct
      marketName
      notes
      internalLabel
      internalOwnerEmail
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateRevenueProfile = /* GraphQL */ `
  subscription OnUpdateRevenueProfile(
    $filter: ModelSubscriptionRevenueProfileFilterInput
    $owner: String
  ) {
    onUpdateRevenueProfile(filter: $filter, owner: $owner) {
      id
      propertyId
      property {
        id
        name
        nickname
        address
        city
        state
        country
        sleeps
        owner
        createdAt
        updatedAt
        propertyRevenueProfileId
        __typename
      }
      owner
      tier
      pricingCadence
      isActive
      baseNightlyRate
      targetOccupancyPct
      marketName
      notes
      internalLabel
      internalOwnerEmail
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteRevenueProfile = /* GraphQL */ `
  subscription OnDeleteRevenueProfile(
    $filter: ModelSubscriptionRevenueProfileFilterInput
    $owner: String
  ) {
    onDeleteRevenueProfile(filter: $filter, owner: $owner) {
      id
      propertyId
      property {
        id
        name
        nickname
        address
        city
        state
        country
        sleeps
        owner
        createdAt
        updatedAt
        propertyRevenueProfileId
        __typename
      }
      owner
      tier
      pricingCadence
      isActive
      baseNightlyRate
      targetOccupancyPct
      marketName
      notes
      internalLabel
      internalOwnerEmail
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateRevenueSnapshot = /* GraphQL */ `
  subscription OnCreateRevenueSnapshot(
    $filter: ModelSubscriptionRevenueSnapshotFilterInput
    $owner: String
  ) {
    onCreateRevenueSnapshot(filter: $filter, owner: $owner) {
      id
      propertyId
      property {
        id
        name
        nickname
        address
        city
        state
        country
        sleeps
        owner
        createdAt
        updatedAt
        propertyRevenueProfileId
        __typename
      }
      owner
      periodStart
      periodEnd
      label
      grossRevenue
      occupancyPct
      adr
      nightsBooked
      nightsAvailable
      marketOccupancyPct
      marketAdr
      marketSampleSize
      future30Revenue
      future60Revenue
      future90Revenue
      cleaningFeesCollected
      cancellationsCount
      cancellationRevenueLost
      revenueReportUrl
      dashboardUrl
      keyInsights
      pricingDecisionsSummary
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateRevenueSnapshot = /* GraphQL */ `
  subscription OnUpdateRevenueSnapshot(
    $filter: ModelSubscriptionRevenueSnapshotFilterInput
    $owner: String
  ) {
    onUpdateRevenueSnapshot(filter: $filter, owner: $owner) {
      id
      propertyId
      property {
        id
        name
        nickname
        address
        city
        state
        country
        sleeps
        owner
        createdAt
        updatedAt
        propertyRevenueProfileId
        __typename
      }
      owner
      periodStart
      periodEnd
      label
      grossRevenue
      occupancyPct
      adr
      nightsBooked
      nightsAvailable
      marketOccupancyPct
      marketAdr
      marketSampleSize
      future30Revenue
      future60Revenue
      future90Revenue
      cleaningFeesCollected
      cancellationsCount
      cancellationRevenueLost
      revenueReportUrl
      dashboardUrl
      keyInsights
      pricingDecisionsSummary
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteRevenueSnapshot = /* GraphQL */ `
  subscription OnDeleteRevenueSnapshot(
    $filter: ModelSubscriptionRevenueSnapshotFilterInput
    $owner: String
  ) {
    onDeleteRevenueSnapshot(filter: $filter, owner: $owner) {
      id
      propertyId
      property {
        id
        name
        nickname
        address
        city
        state
        country
        sleeps
        owner
        createdAt
        updatedAt
        propertyRevenueProfileId
        __typename
      }
      owner
      periodStart
      periodEnd
      label
      grossRevenue
      occupancyPct
      adr
      nightsBooked
      nightsAvailable
      marketOccupancyPct
      marketAdr
      marketSampleSize
      future30Revenue
      future60Revenue
      future90Revenue
      cleaningFeesCollected
      cancellationsCount
      cancellationRevenueLost
      revenueReportUrl
      dashboardUrl
      keyInsights
      pricingDecisionsSummary
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateRevenueAudit = /* GraphQL */ `
  subscription OnCreateRevenueAudit(
    $filter: ModelSubscriptionRevenueAuditFilterInput
    $owner: String
  ) {
    onCreateRevenueAudit(filter: $filter, owner: $owner) {
      id
      propertyId
      property {
        id
        name
        nickname
        address
        city
        state
        country
        sleeps
        owner
        createdAt
        updatedAt
        propertyRevenueProfileId
        __typename
      }
      owner
      ownerName
      ownerEmail
      listingUrl
      marketName
      estimatedAnnualRevenueCurrent
      estimatedAnnualRevenueOptimized
      projectedGainPct
      underpricingIssues
      competitorSummary
      recommendations
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateRevenueAudit = /* GraphQL */ `
  subscription OnUpdateRevenueAudit(
    $filter: ModelSubscriptionRevenueAuditFilterInput
    $owner: String
  ) {
    onUpdateRevenueAudit(filter: $filter, owner: $owner) {
      id
      propertyId
      property {
        id
        name
        nickname
        address
        city
        state
        country
        sleeps
        owner
        createdAt
        updatedAt
        propertyRevenueProfileId
        __typename
      }
      owner
      ownerName
      ownerEmail
      listingUrl
      marketName
      estimatedAnnualRevenueCurrent
      estimatedAnnualRevenueOptimized
      projectedGainPct
      underpricingIssues
      competitorSummary
      recommendations
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteRevenueAudit = /* GraphQL */ `
  subscription OnDeleteRevenueAudit(
    $filter: ModelSubscriptionRevenueAuditFilterInput
    $owner: String
  ) {
    onDeleteRevenueAudit(filter: $filter, owner: $owner) {
      id
      propertyId
      property {
        id
        name
        nickname
        address
        city
        state
        country
        sleeps
        owner
        createdAt
        updatedAt
        propertyRevenueProfileId
        __typename
      }
      owner
      ownerName
      ownerEmail
      listingUrl
      marketName
      estimatedAnnualRevenueCurrent
      estimatedAnnualRevenueOptimized
      projectedGainPct
      underpricingIssues
      competitorSummary
      recommendations
      createdAt
      updatedAt
      __typename
    }
  }
`;
