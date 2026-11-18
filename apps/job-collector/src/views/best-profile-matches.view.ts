import {
  defineView,
  ViewType,
  ViewSortDirection,
  ViewFilterOperand,
} from 'twenty-sdk/define';

import { IDENTIFIERS } from '../constants/identifiers';
import { stableRecordId } from '../utils/stable-record-id.util';

export const historicalSourcePostingMatches = defineView({
  universalIdentifier: IDENTIFIERS.BEST_MATCHES_VIEW,
  name: 'Historical profile matches',
  objectUniversalIdentifier: IDENTIFIERS.POSTINGS_OBJECT,
  type: ViewType.TABLE,
  icon: 'IconSparkles',
  fields: (
    [
      [IDENTIFIERS.POSTING_NAME, 240],
      [IDENTIFIERS.POSTINGS_COMPANY_FIELD, 180],
      [IDENTIFIERS.POSTING_FIT_SCORE, 120],
      [IDENTIFIERS.POSTING_FIT_REASON, 360],
      [IDENTIFIERS.POSTING_FIT_GAPS, 280],
      [IDENTIFIERS.POSTING_FIT_ELIGIBILITY, 220],
      [IDENTIFIERS.POSTING_LOCATION, 180],
      [IDENTIFIERS.POSTING_SALARY_TEXT, 200],
      [IDENTIFIERS.POSTING_SOURCE_URL, 230],
      [IDENTIFIERS.POSTING_MATCHED_AT, 180],
      [IDENTIFIERS.POSTING_MATCH_REPORT, 360],
    ] as const
  ).map(([fieldIdentifier, size], position) => ({
    universalIdentifier: stableRecordId(
      `best-matches:field:${fieldIdentifier}`,
    ),
    fieldMetadataUniversalIdentifier: fieldIdentifier,
    position,
    size,
    isVisible: true,
  })),
  filters: [
    {
      universalIdentifier: stableRecordId(
        'best-profile-matches.view.ts:skill-filter',
      ),
      fieldMetadataUniversalIdentifier: IDENTIFIERS.POSTING_MATCH_REPORT,
      operand: ViewFilterOperand.IS_NOT_EMPTY,
      value: '',
    },
  ],
  sorts: [
    {
      universalIdentifier: stableRecordId('best-matches:date-sort'),
      fieldMetadataUniversalIdentifier: IDENTIFIERS.POSTING_MATCHED_AT,
      direction: ViewSortDirection.DESC,
    },
  ],
});
