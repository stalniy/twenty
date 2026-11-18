import {
  defineField,
  FieldType,
  RelationType,
  OnDeleteAction,
} from 'twenty-sdk/define';
import { IDENTIFIERS } from '../constants/identifiers';
import { JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER } from '../constants/workspace-binding';
export const sourcePostingsOnJobPosition = defineField({
  universalIdentifier: IDENTIFIERS.POSITIONS_POSTINGS_FIELD,
  objectUniversalIdentifier: JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER,
  name: 'jobCollectorPostings',
  label: 'Source postings',
  type: FieldType.RELATION,
  relationTargetObjectMetadataUniversalIdentifier: IDENTIFIERS.POSTINGS_OBJECT,
  relationTargetFieldMetadataUniversalIdentifier:
    IDENTIFIERS.POSTING_JOB_POSITION_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
