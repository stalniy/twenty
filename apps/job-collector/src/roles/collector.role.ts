import { defineApplicationRole, STANDARD_OBJECT } from 'twenty-sdk/define';

import { CV_OBJECTS } from '../constants/cv-metadata';
import { IDENTIFIERS } from '../constants/identifiers';
import { JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER } from '../constants/workspace-binding';

export const collectorRole = defineApplicationRole({
  universalIdentifier: IDENTIFIERS.ROLE,
  label: 'Job Collector',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToUsers: false,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    ...[
      STANDARD_OBJECT.company,
      STANDARD_OBJECT.person,
      STANDARD_OBJECT.workspaceMember,
    ].map((object) => ({
      objectUniversalIdentifier: object.universalIdentifier,
      canReadObjectRecords: true,
      canUpdateObjectRecords: false,
    })),
    ...[
      ...Object.values(CV_OBJECTS),
      IDENTIFIERS.BOARDS_OBJECT,
      IDENTIFIERS.POSTINGS_OBJECT,
      JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER,
    ].map((objectUniversalIdentifier) => ({
      objectUniversalIdentifier,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    })),
  ],
});
