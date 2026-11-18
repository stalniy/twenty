import {
  defineView,
  ViewType,
  ViewSortDirection,
  ViewFilterOperand,
} from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import {
  JOB_POSITION_FIELDS,
  JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER,
} from '../constants/workspace-binding';
import { stableRecordId } from '../utils/stable-record-id.util';

export const jobPositionProfileMatchesView = defineView({
  universalIdentifier: IDENTIFIERS.POSITION_BEST_MATCHES_VIEW,
  name: 'Historical profile matches',
  objectUniversalIdentifier: JOB_POSITION_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconSparkles',
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
      [JOB_POSITION_FIELDS.SALARY, 200],
      [JOB_POSITION_FIELDS.JOB_URL, 230],
      [IDENTIFIERS.POSITION_MATCHED_AT, 180],
      [IDENTIFIERS.POSITION_MATCH_REPORT, 360],
    ] as const
  ).map(([fieldIdentifier, size], position) => ({
    universalIdentifier: stableRecordId(
      `position-best-matches:field:${fieldIdentifier}`,
    ),
    fieldMetadataUniversalIdentifier: fieldIdentifier,
    position,
    size,
    isVisible: true,
  })),
  filters: [
    {
      universalIdentifier: stableRecordId(
        'job-position-profile-matches.view.ts:skill-filter',
      ),
      fieldMetadataUniversalIdentifier: IDENTIFIERS.POSITION_MATCH_REPORT,
      operand: ViewFilterOperand.IS_NOT_EMPTY,
      value: '',
    },
  ],
  sorts: [
    {
      universalIdentifier: stableRecordId('position-best-matches:date-sort'),
      fieldMetadataUniversalIdentifier: IDENTIFIERS.POSITION_MATCHED_AT,
      direction: ViewSortDirection.DESC,
    },
  ],
});
