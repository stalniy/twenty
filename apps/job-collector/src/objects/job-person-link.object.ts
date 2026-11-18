import { defineObject } from 'twenty-sdk/define';

import { cvObject } from '../constants/cv-metadata';

export const jobPersonLink = defineObject(
  cvObject(
    'jobPersonLink',
    'jobPersonLinks',
    'Job assignment',
    'Job assignments',
    'IconUser',
    {},
  ),
);
