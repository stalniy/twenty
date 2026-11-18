import {
  defineField,
  FieldType,
  STANDARD_OBJECT,
  RelationType,
  OnDeleteAction,
} from 'twenty-sdk/define';
import { IDENTIFIERS } from '../constants/identifiers';
export const jobBoardsOnCompany = defineField({
  universalIdentifier: IDENTIFIERS.COMPANIES_BOARDS_FIELD,
  objectUniversalIdentifier: STANDARD_OBJECT.company.universalIdentifier,
  name: 'jobCollectorBoards',
  label: 'Job boards',
  type: FieldType.RELATION,
  relationTargetObjectMetadataUniversalIdentifier: IDENTIFIERS.BOARDS_OBJECT,
  relationTargetFieldMetadataUniversalIdentifier:
    IDENTIFIERS.BOARDS_COMPANY_FIELD,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
