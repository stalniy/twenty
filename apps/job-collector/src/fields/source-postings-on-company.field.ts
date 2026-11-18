import {
  defineField,
  FieldType,
  STANDARD_OBJECT,
  RelationType,
  OnDeleteAction,
} from 'twenty-sdk/define';
import { IDENTIFIERS } from '../constants/identifiers';
export const sourcePostingsOnCompany = defineField({
  universalIdentifier: IDENTIFIERS.COMPANIES_POSTINGS_FIELD,
  objectUniversalIdentifier: STANDARD_OBJECT.company.universalIdentifier,
  name: 'jobSourcePostings',
  label: 'Source postings',
  type: FieldType.RELATION,
  relationTargetObjectMetadataUniversalIdentifier: IDENTIFIERS.POSTINGS_OBJECT,
  relationTargetFieldMetadataUniversalIdentifier:
    IDENTIFIERS.POSTINGS_COMPANY_FIELD,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
