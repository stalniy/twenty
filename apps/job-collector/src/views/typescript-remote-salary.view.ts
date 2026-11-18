import {
  defineView,
  ViewType,
  ViewSortDirection,
  ViewFilterOperand,
  ViewFilterGroupLogicalOperator,
} from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import {
  JOB_POSITION_FIELDS,
  JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER,
} from '../constants/workspace-binding';
import { stableRecordId } from '../utils/stable-record-id.util';

const ROOT_GROUP = stableRecordId('filtered-jobs:all');
const LOCATION_GROUP = stableRecordId('filtered-jobs:location');

export const typescriptRemoteSalaryView = defineView({
  universalIdentifier: IDENTIFIERS.FILTERED_MATCHES_VIEW,
  name: 'TypeScript · Remote · Over $100k',
  objectUniversalIdentifier: JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconFilter',
  fields: (
    [
      [JOB_POSITION_FIELDS.NAME, 240],
      [JOB_POSITION_FIELDS.COMPANY, 180],
      [JOB_POSITION_FIELDS.STATUS, 150],
      [IDENTIFIERS.POSITION_FIT_SCORE, 120],
      [IDENTIFIERS.POSITION_FIT_REASON, 360],
      [IDENTIFIERS.POSITION_FIT_GAPS, 280],
      [IDENTIFIERS.POSITION_FIT_ELIGIBILITY, 220],
      [JOB_POSITION_FIELDS.LOCATION, 180],
      [JOB_POSITION_FIELDS.MINIMUM_SALARY_USD, 180],
      [JOB_POSITION_FIELDS.JOB_URL, 230],
    ] as const
  ).map(([fieldIdentifier, size], position) => ({
    universalIdentifier: stableRecordId(
      `filtered-jobs:field:${fieldIdentifier}`,
    ),
    fieldMetadataUniversalIdentifier: fieldIdentifier,
    position,
    size,
    isVisible: true,
  })),
  filterGroups: [
    {
      universalIdentifier: ROOT_GROUP,
      logicalOperator: ViewFilterGroupLogicalOperator.AND,
    },
    {
      universalIdentifier: LOCATION_GROUP,
      logicalOperator: ViewFilterGroupLogicalOperator.OR,
      parentViewFilterGroupUniversalIdentifier: ROOT_GROUP,
      positionInViewFilterGroup: 3,
    },
  ],
  filters: [
    {
      universalIdentifier: stableRecordId('filtered-jobs:typescript'),
      fieldMetadataUniversalIdentifier: JOB_POSITION_FIELDS.MENTIONS_TYPESCRIPT,
      operand: ViewFilterOperand.IS,
      value: true,
      viewFilterGroupUniversalIdentifier: ROOT_GROUP,
      positionInViewFilterGroup: 0,
    },
    {
      universalIdentifier: stableRecordId('filtered-jobs:salary-minimum'),
      fieldMetadataUniversalIdentifier: JOB_POSITION_FIELDS.MINIMUM_SALARY_USD,
      operand: ViewFilterOperand.GREATER_THAN_OR_EQUAL,
      value: 100000,
      viewFilterGroupUniversalIdentifier: ROOT_GROUP,
      positionInViewFilterGroup: 1,
    },
    {
      universalIdentifier: stableRecordId(
        'filtered-jobs:salary-exclude-boundary',
      ),
      fieldMetadataUniversalIdentifier: JOB_POSITION_FIELDS.MINIMUM_SALARY_USD,
      operand: ViewFilterOperand.IS_NOT,
      value: 100000,
      viewFilterGroupUniversalIdentifier: ROOT_GROUP,
      positionInViewFilterGroup: 2,
    },
    {
      universalIdentifier: stableRecordId('filtered-jobs:location-empty'),
      fieldMetadataUniversalIdentifier: JOB_POSITION_FIELDS.LOCATION,
      operand: ViewFilterOperand.IS_EMPTY,
      value: '',
      viewFilterGroupUniversalIdentifier: LOCATION_GROUP,
      positionInViewFilterGroup: 0,
    },
    {
      universalIdentifier: stableRecordId('filtered-jobs:location-remote'),
      fieldMetadataUniversalIdentifier: JOB_POSITION_FIELDS.LOCATION,
      operand: ViewFilterOperand.CONTAINS,
      value: 'Remote',
      viewFilterGroupUniversalIdentifier: LOCATION_GROUP,
      positionInViewFilterGroup: 1,
    },
  ],
  sorts: [
    {
      universalIdentifier: stableRecordId('filtered-jobs:score-sort'),
      fieldMetadataUniversalIdentifier: IDENTIFIERS.POSITION_FIT_SCORE,
      direction: ViewSortDirection.DESC,
    },
  ],
});
