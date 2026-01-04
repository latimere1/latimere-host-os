/* eslint-disable */
// this is an auto generated file. This will be overwritten

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
export const getProperty = /* GraphQL */ `
  query GetProperty($id: ID!) {
    getProperty(id: $id) {
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
        timezone
        bedrooms
        bathrooms
        baseRate
        minStay
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
        timezone
        bedrooms
        bathrooms
        baseRate
        minStay
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
      channel
      status
      guestEmail
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
        channel
        status
        guestEmail
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
        channel
        status
        guestEmail
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
export const getInboxThread = /* GraphQL */ `
  query GetInboxThread($id: ID!) {
    getInboxThread(id: $id) {
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
export const listInboxThreads = /* GraphQL */ `
  query ListInboxThreads(
    $filter: ModelInboxThreadFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listInboxThreads(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        maskedEmail
        subject
        lastMessageAt
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const inboxThreadsByMaskedEmail = /* GraphQL */ `
  query InboxThreadsByMaskedEmail(
    $maskedEmail: String!
    $sortDirection: ModelSortDirection
    $filter: ModelInboxThreadFilterInput
    $limit: Int
    $nextToken: String
  ) {
    inboxThreadsByMaskedEmail(
      maskedEmail: $maskedEmail
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        maskedEmail
        subject
        lastMessageAt
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getInboxMessage = /* GraphQL */ `
  query GetInboxMessage($id: ID!) {
    getInboxMessage(id: $id) {
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
export const listInboxMessages = /* GraphQL */ `
  query ListInboxMessages(
    $filter: ModelInboxMessageFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listInboxMessages(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const inboxMessagesByThreadIdAndCreatedAt = /* GraphQL */ `
  query InboxMessagesByThreadIdAndCreatedAt(
    $threadId: ID!
    $createdAt: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelInboxMessageFilterInput
    $limit: Int
    $nextToken: String
  ) {
    inboxMessagesByThreadIdAndCreatedAt(
      threadId: $threadId
      createdAt: $createdAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getReferral = /* GraphQL */ `
  query GetReferral($id: ID!) {
    getReferral(id: $id) {
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
export const listReferrals = /* GraphQL */ `
  query ListReferrals(
    $filter: ModelReferralFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listReferrals(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const referralsBySource = /* GraphQL */ `
  query ReferralsBySource(
    $source: String!
    $sortDirection: ModelSortDirection
    $filter: ModelReferralFilterInput
    $limit: Int
    $nextToken: String
  ) {
    referralsBySource(
      source: $source
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const referralsByRealtorEmail = /* GraphQL */ `
  query ReferralsByRealtorEmail(
    $realtorEmailIndex: AWSEmail!
    $sortDirection: ModelSortDirection
    $filter: ModelReferralFilterInput
    $limit: Int
    $nextToken: String
  ) {
    referralsByRealtorEmail(
      realtorEmailIndex: $realtorEmailIndex
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const referralsByClientEmail = /* GraphQL */ `
  query ReferralsByClientEmail(
    $clientEmailIndex: AWSEmail!
    $sortDirection: ModelSortDirection
    $filter: ModelReferralFilterInput
    $limit: Int
    $nextToken: String
  ) {
    referralsByClientEmail(
      clientEmailIndex: $clientEmailIndex
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const referralByInviteToken = /* GraphQL */ `
  query ReferralByInviteToken(
    $inviteToken: String!
    $sortDirection: ModelSortDirection
    $filter: ModelReferralFilterInput
    $limit: Int
    $nextToken: String
  ) {
    referralByInviteToken(
      inviteToken: $inviteToken
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const referralsByOnboardingStatus = /* GraphQL */ `
  query ReferralsByOnboardingStatus(
    $onboardingStatus: String!
    $sortDirection: ModelSortDirection
    $filter: ModelReferralFilterInput
    $limit: Int
    $nextToken: String
  ) {
    referralsByOnboardingStatus(
      onboardingStatus: $onboardingStatus
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getPolicy = /* GraphQL */ `
  query GetPolicy($id: ID!) {
    getPolicy(id: $id) {
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
export const listPolicies = /* GraphQL */ `
  query ListPolicies(
    $filter: ModelPolicyFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPolicies(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const policiesByUnitIDAndType = /* GraphQL */ `
  query PoliciesByUnitIDAndType(
    $unitID: ID!
    $type: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelPolicyFilterInput
    $limit: Int
    $nextToken: String
  ) {
    policiesByUnitIDAndType(
      unitID: $unitID
      type: $type
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getNightlyRate = /* GraphQL */ `
  query GetNightlyRate($id: ID!) {
    getNightlyRate(id: $id) {
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
export const listNightlyRates = /* GraphQL */ `
  query ListNightlyRates(
    $filter: ModelNightlyRateFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listNightlyRates(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const ratesByUnitDate = /* GraphQL */ `
  query RatesByUnitDate(
    $unitID: ID!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelNightlyRateFilterInput
    $limit: Int
    $nextToken: String
  ) {
    ratesByUnitDate(
      unitID: $unitID
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getTurn = /* GraphQL */ `
  query GetTurn($id: ID!) {
    getTurn(id: $id) {
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
export const listTurns = /* GraphQL */ `
  query ListTurns(
    $filter: ModelTurnFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTurns(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const turnsByUnitStart = /* GraphQL */ `
  query TurnsByUnitStart(
    $unitID: ID!
    $startDate: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelTurnFilterInput
    $limit: Int
    $nextToken: String
  ) {
    turnsByUnitStart(
      unitID: $unitID
      startDate: $startDate
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getVendor = /* GraphQL */ `
  query GetVendor($id: ID!) {
    getVendor(id: $id) {
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
export const listVendors = /* GraphQL */ `
  query ListVendors(
    $filter: ModelVendorFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listVendors(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getActionLog = /* GraphQL */ `
  query GetActionLog($id: ID!) {
    getActionLog(id: $id) {
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
export const listActionLogs = /* GraphQL */ `
  query ListActionLogs(
    $filter: ModelActionLogFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listActionLogs(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const actionLogByUnitTime = /* GraphQL */ `
  query ActionLogByUnitTime(
    $unitID: ID!
    $createdAt: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelActionLogFilterInput
    $limit: Int
    $nextToken: String
  ) {
    actionLogByUnitTime(
      unitID: $unitID
      createdAt: $createdAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getRevenueProfile = /* GraphQL */ `
  query GetRevenueProfile($id: ID!) {
    getRevenueProfile(id: $id) {
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
export const listRevenueProfiles = /* GraphQL */ `
  query ListRevenueProfiles(
    $filter: ModelRevenueProfileFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRevenueProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const revenueProfilesByPropertyIdAndCreatedAt = /* GraphQL */ `
  query RevenueProfilesByPropertyIdAndCreatedAt(
    $propertyId: ID!
    $createdAt: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelRevenueProfileFilterInput
    $limit: Int
    $nextToken: String
  ) {
    revenueProfilesByPropertyIdAndCreatedAt(
      propertyId: $propertyId
      createdAt: $createdAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getRevenueSnapshot = /* GraphQL */ `
  query GetRevenueSnapshot($id: ID!) {
    getRevenueSnapshot(id: $id) {
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
export const listRevenueSnapshots = /* GraphQL */ `
  query ListRevenueSnapshots(
    $filter: ModelRevenueSnapshotFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRevenueSnapshots(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        propertyId
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
      nextToken
      __typename
    }
  }
`;
export const revenueSnapshotsByPropertyIdAndPeriodStart = /* GraphQL */ `
  query RevenueSnapshotsByPropertyIdAndPeriodStart(
    $propertyId: ID!
    $periodStart: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelRevenueSnapshotFilterInput
    $limit: Int
    $nextToken: String
  ) {
    revenueSnapshotsByPropertyIdAndPeriodStart(
      propertyId: $propertyId
      periodStart: $periodStart
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        propertyId
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
      nextToken
      __typename
    }
  }
`;
export const getRevenueAudit = /* GraphQL */ `
  query GetRevenueAudit($id: ID!) {
    getRevenueAudit(id: $id) {
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
export const listRevenueAudits = /* GraphQL */ `
  query ListRevenueAudits(
    $filter: ModelRevenueAuditFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRevenueAudits(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        propertyId
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
      nextToken
      __typename
    }
  }
`;
export const revenueAuditsByPropertyIdAndCreatedAt = /* GraphQL */ `
  query RevenueAuditsByPropertyIdAndCreatedAt(
    $propertyId: ID!
    $createdAt: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelRevenueAuditFilterInput
    $limit: Int
    $nextToken: String
  ) {
    revenueAuditsByPropertyIdAndCreatedAt(
      propertyId: $propertyId
      createdAt: $createdAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        propertyId
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
      nextToken
      __typename
    }
  }
`;
