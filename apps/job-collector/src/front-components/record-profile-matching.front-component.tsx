import { defineFrontComponent } from 'twenty-sdk/define';
import {
  useSelectedRecordIds,
  useSelectedRecordsFilter,
  useTranslate,
} from 'twenty-sdk/front-component';

import { IDENTIFIERS } from '../constants/identifiers';
import { ProfileMatching } from './profile-matching.front-component';

export const RecordProfileMatching = () => {
  const { t } = useTranslate();
  const recordIds = useSelectedRecordIds();
  const selectionFilter = useSelectedRecordsFilter();
  if (recordIds.length === 0 && !selectionFilter)
    return <p>{t('Select Job Positions to match.')}</p>;
  return (
    <ProfileMatching
      recordIds={recordIds}
      recordFilter={
        recordIds.length ? undefined : (selectionFilter ?? undefined)
      }
    />
  );
};

export const recordProfileMatching = defineFrontComponent({
  universalIdentifier: IDENTIFIERS.RECORD_MATCHING_COMPONENT,
  name: 'Match Job Positions to a CV',
  component: RecordProfileMatching,
});
