import { defineView, ViewType } from 'twenty-sdk/define';
import { IDENTIFIERS } from '../constants/identifiers';
export const jobSourcePostingView = defineView({
  universalIdentifier: IDENTIFIERS.POSTINGS_VIEW,
  name: 'Source postings',
  objectUniversalIdentifier: IDENTIFIERS.POSTINGS_OBJECT,
  type: ViewType.TABLE,
  icon: 'IconBriefcase',
  fields: [
    {
      universalIdentifier: '9148b412-02ce-42b7-b6c3-07a6da7fdc9e',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.POSTING_NAME,
      position: 0,
      size: 240,
      isVisible: true,
    },
    {
      universalIdentifier: '1e31a089-f096-4902-8e62-9871b7f3a86c',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.POSTINGS_COMPANY_FIELD,
      position: 1,
      size: 180,
      isVisible: true,
    },
    {
      universalIdentifier: 'e7aef0ec-3970-4d5f-9eb8-d1d116cfb6bf',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.POSTING_SALARY_PRIORITY,
      position: 2,
      size: 200,
      isVisible: true,
    },
    {
      universalIdentifier: '5b2477b2-e8bf-4cc4-9592-f6eb7cf53bad',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.POSTING_MINIMUM_SALARY,
      position: 3,
      size: 170,
      isVisible: true,
    },
    {
      universalIdentifier: 'afbd5053-e109-4b27-b641-9e9c93630ec5',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.POSTING_MAXIMUM_SALARY,
      position: 4,
      size: 170,
      isVisible: true,
    },
    {
      universalIdentifier: 'aaaeec3b-fe5e-4689-b694-0b6c5c6aed16',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.POSTING_SOURCE_URL,
      position: 5,
      size: 230,
      isVisible: true,
    },
    {
      universalIdentifier: 'a83570e6-5b0c-45a2-ae55-9f3a8c571fff',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.POSTING_PROVIDER,
      position: 6,
      size: 120,
      isVisible: true,
    },
    {
      universalIdentifier: '2130e610-7bdc-4dee-ba36-000a8d6cb306',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.POSTING_JOB_POSITION_ID,
      position: 7,
      size: 220,
      isVisible: true,
    },
    {
      universalIdentifier: 'b46441b6-2f9d-468c-b675-d7c9cd264f5c',
      fieldMetadataUniversalIdentifier: IDENTIFIERS.POSTING_LAST_SEEN_AT,
      position: 8,
      size: 180,
      isVisible: true,
    },
  ],
});
