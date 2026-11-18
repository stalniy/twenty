import {
  defineField,
  FieldType,
  RelationType,
  OnDeleteAction,
} from 'twenty-sdk/define';
import { IDENTIFIERS } from '../constants/identifiers';
import { JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER } from '../constants/workspace-binding';
export const jobPositionOnSourcePosting = defineField({
  universalIdentifier: IDENTIFIERS.POSTING_JOB_POSITION_ID,
  objectUniversalIdentifier: IDENTIFIERS.POSTINGS_OBJECT,
  name: 'jobPosition',
  label: 'Job Position',
  type: FieldType.RELATION,
  relationTargetObjectMetadataUniversalIdentifier:
    JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    IDENTIFIERS.POSITIONS_POSTINGS_FIELD,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'jobPositionId',
  },
});
