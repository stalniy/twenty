import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import { IDENTIFIERS } from '../constants/identifiers';
export const jobCollectorBoardNavigation = defineNavigationMenuItem({
  universalIdentifier: IDENTIFIERS.BOARDS_NAVIGATION,
  name: 'Job boards',
  icon: 'IconBriefcase',
  position: 0,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: IDENTIFIERS.BOARDS_OBJECT,
});
