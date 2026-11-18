import {
  defineView,
  ViewType,
  ViewSortDirection,
  ViewFilterOperand,
} from 'twenty-sdk/define';

import { CV_OBJECTS, cvFieldId } from '../constants/cv-metadata';
import { WEIGHTED_REQUIREMENT_SCORING } from '../services/jd-match-assessment.service';
import { stableRecordId } from '../utils/stable-record-id.util';

export const bestProfileMatchesView = defineView({
  universalIdentifier: stableRecordId('weighted-matches:view'),
  name: 'Best profile matches',
  objectUniversalIdentifier: CV_OBJECTS.jobPersonAssessment,
  type: ViewType.TABLE,
  icon: 'IconSparkles',
  fields: (
    [
      ['person', 220],
      ['sourcePosting', 240],
      ['fitScore', 120],
      ['fitReason', 360],
      ['fitGaps', 280],
      ['profileMatchedAt', 180],
    ] as const
  ).map(([field, size], position) => ({
    universalIdentifier: stableRecordId(`weighted-matches:field:${field}`),
    fieldMetadataUniversalIdentifier: cvFieldId('jobPersonAssessment', field),
    position,
    size,
    isVisible: true,
  })),
  filters: [
    {
      universalIdentifier: stableRecordId('weighted-matches:method-filter'),
      fieldMetadataUniversalIdentifier: cvFieldId(
        'jobPersonAssessment',
        'scoringMethod',
      ),
      operand: ViewFilterOperand.IS,
      value: WEIGHTED_REQUIREMENT_SCORING,
    },
    {
      universalIdentifier: stableRecordId('weighted-matches:score-filter'),
      fieldMetadataUniversalIdentifier: cvFieldId(
        'jobPersonAssessment',
        'fitScore',
      ),
      operand: ViewFilterOperand.GREATER_THAN_OR_EQUAL,
      value: 0,
    },
  ],
  sorts: [
    {
      universalIdentifier: stableRecordId('weighted-matches:score-sort'),
      fieldMetadataUniversalIdentifier: cvFieldId(
        'jobPersonAssessment',
        'fitScore',
      ),
      direction: ViewSortDirection.DESC,
    },
  ],
});
