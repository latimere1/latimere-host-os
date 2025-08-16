// src/lib/apiClient.ts
import { generateClient } from 'aws-amplify/api'
export const gql = generateClient({ authMode: 'userPool' })
