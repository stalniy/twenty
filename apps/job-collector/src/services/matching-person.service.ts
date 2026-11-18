export type MatchingPerson = {
  id: string;
  name: { firstName: string | null; lastName: string | null };
  emails: {
    primaryEmail: string | null;
    additionalEmails: string[] | null;
  } | null;
};

export type MatchingWorkspaceMember = {
  userEmail: string | null;
  name: MatchingPerson['name'];
};

export const MATCHING_PERSON_FIELDS =
  'id name{firstName lastName} emails{primaryEmail additionalEmails}';
export const MATCHING_MEMBER_FIELDS = 'userEmail name{firstName lastName}';

const normalizeIdentity = (value: string | null | undefined) =>
  value?.trim().toLowerCase() || '';

export const resolveOwnerPerson = (
  members: MatchingWorkspaceMember[],
  people: MatchingPerson[],
  ownerEmail?: string,
) => {
  const requestedEmail = normalizeIdentity(ownerEmail);
  const owners = requestedEmail
    ? members.filter(
        (member) => normalizeIdentity(member.userEmail) === requestedEmail,
      )
    : members;
  if (owners.length !== 1) return undefined;
  const owner = owners[0];
  const email = normalizeIdentity(owner.userEmail);
  if (!email) return undefined;
  const emailMatches = people.filter(({ emails }) =>
    [emails?.primaryEmail, ...(emails?.additionalEmails ?? [])].some(
      (emailAddress) => normalizeIdentity(emailAddress) === email,
    ),
  );
  if (emailMatches.length)
    return emailMatches.length === 1 ? emailMatches[0] : undefined;
  const firstName = normalizeIdentity(owner.name.firstName);
  const lastName = normalizeIdentity(owner.name.lastName);
  if (!firstName || !lastName) return undefined;
  const nameMatches = people.filter(
    ({ name, emails }) =>
      !normalizeIdentity(emails?.primaryEmail) &&
      !emails?.additionalEmails?.some(normalizeIdentity) &&
      normalizeIdentity(name.firstName) === firstName &&
      normalizeIdentity(name.lastName) === lastName,
  );
  return nameMatches.length === 1 ? nameMatches[0] : undefined;
};
