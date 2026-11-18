import {
  defineField,
  FieldType,
  STANDARD_OBJECT,
  RelationType,
  OnDeleteAction,
} from 'twenty-sdk/define';
import { IDENTIFIERS } from '../constants/identifiers';
export const companyOnSourcePosting = defineField({
  universalIdentifier: IDENTIFIERS.POSTINGS_COMPANY_FIELD,
  objectUniversalIdentifier: IDENTIFIERS.POSTINGS_OBJECT,
  name: 'company',
  label: 'Company',
  type: FieldType.RELATION,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT.company.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    IDENTIFIERS.COMPANIES_POSTINGS_FIELD,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'companyId',
  },
});
