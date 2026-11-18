import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import { IDENTIFIERS } from '../constants/identifiers';
export const jobSourcePostingNavigation = defineNavigationMenuItem({
  universalIdentifier: IDENTIFIERS.POSTINGS_NAVIGATION,
  name: 'Source postings',
  icon: 'IconBriefcase',
  position: 1,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: IDENTIFIERS.POSTINGS_OBJECT,
});
