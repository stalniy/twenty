import { z } from 'zod';

const MONTH = '[A-Z][a-z]{2} [0-9]{4}';
const EXPERIENCE_HEADING = new RegExp(`^(.+) (${MONTH}) - (${MONTH})$`);
const SECTIONS = [
  'SUMMARY',
  'SELECTED ENGINEERING WORK',
  'EXPERIENCE',
  'EARLIER ENGINEERING EXPERIENCE',
  'CORE TECHNOLOGIES',
  'OUTSIDE SOFTWARE',
  'EDUCATION & LANGUAGES',
];

const PROJECT_EXPERIENCE: Record<string, string> = {
  'AKASH.NETWORK': 'Overclock Labs / Akash Network',
  'KNOWLEDGE PLATFORM AT INFOZAHYST': 'INFOZAHYST',
};

const joinWrappedLines = (text: string) =>
  text.replace(/\n(?=\S)/g, ' ').trim();

const splitBullets = (text: string) => {
  const [description, ...bullets] = text.split(/^• /m);
  return {
    description: joinWrappedLines(description),
    achievements: bullets.map((bullet) => bullet.trim()),
  };
};

type ImportedExperience = {
  name: string;
  roleHeld?: string;
  startDateText: string;
  endDateText: string;
  description?: string;
  technologyStack?: string;
  achievements: string[];
  alternativeWording?: Record<number, string>;
};

type ImportedProject = {
  name: string;
  description: string;
  experience?: string;
  achievements: string[];
  alternativeWording?: Record<number, string>;
};

const parseTextResume = (resume: string) => {
  const lines = resume.trim().replace(/\r\n/g, '\n').split('\n');
  const boundaries = SECTIONS.map((section) => lines.indexOf(section));
  if (
    boundaries[0] !== 3 ||
    boundaries.some(
      (boundary, index) => boundary <= (boundaries[index - 1] ?? -1),
    )
  ) {
    throw new Error(
      'The installed CANDIDATE_RESUME does not have the expected résumé sections.',
    );
  }

  const [name, targetRole, location] = lines;
  const [
    summary,
    selectedWork,
    work,
    earlierWork,
    technology,
    outsideWork,
    education,
  ] = boundaries.map((boundary, index) =>
    lines.slice(boundary + 1, boundaries[index + 1]),
  );
  const experiences = [work, earlierWork].flatMap((section) => {
    const entries = section.flatMap((line, index) =>
      EXPERIENCE_HEADING.test(line) || line.startsWith('Additional experience ')
        ? [index]
        : [],
    );
    if (entries[0] !== 0)
      throw new Error('Could not read the installed résumé experience.');
    return entries.flatMap<ImportedExperience>((index, entryIndex) => {
      const heading = section[index];
      const match = heading.match(EXPERIENCE_HEADING);
      if (!match) {
        const additional = heading.match(
          /^Additional experience (.+?) \((\d{4})[–-](\d{4})\); (.+?) \((\d{4})[–-](\d{4})\): (.+)\.$/,
        );
        if (!additional || index !== section.length - 1) {
          throw new Error('Could not read the additional résumé experience.');
        }
        const [
          ,
          first,
          firstStart,
          firstEnd,
          second,
          secondStart,
          secondEnd,
          stack,
        ] = additional;
        return [
          {
            name: first,
            startDateText: firstStart,
            endDateText: firstEnd,
            technologyStack: stack,
            achievements: [],
          },
          {
            name: second,
            startDateText: secondStart,
            endDateText: secondEnd,
            technologyStack: stack,
            achievements: [],
          },
        ];
      }
      const [, organizationAndRole, startDateText, endDateText] = match;
      const separatorIndex = organizationAndRole.indexOf(
        ' / ',
        organizationAndRole.startsWith('Overclock Labs / Akash Network') ||
          organizationAndRole.startsWith('Cogniance / SessionM')
          ? organizationAndRole.indexOf(' / ') + 3
          : 0,
      );
      if (separatorIndex < 0)
        throw new Error('Could not read a role held in the installed résumé.');
      const body = section.slice(index + 1, entries[entryIndex + 1]).join('\n');
      const [details, stack] = body.split(/^Stack /m);
      return [
        {
          name: organizationAndRole.slice(0, separatorIndex),
          roleHeld: organizationAndRole.slice(separatorIndex + 3),
          startDateText,
          endDateText,
          technologyStack: stack ? joinWrappedLines(stack) : undefined,
          ...splitBullets(details),
        },
      ];
    });
  });

  const projectHeadings = selectedWork.flatMap((line, index) =>
    /^[A-Z0-9 .&•]+$/.test(line) ? [index] : [],
  );
  if (projectHeadings[0] !== 0 || !outsideWork.length) {
    throw new Error('Could not read the projects in the installed résumé.');
  }
  const projects: ImportedProject[] = [
    ...projectHeadings.map((index, projectIndex) => ({
      name: selectedWork[index],
      experience: PROJECT_EXPERIENCE[selectedWork[index]],
      ...splitBullets(
        selectedWork
          .slice(index + 1, projectHeadings[projectIndex + 1])
          .join('\n'),
      ),
    })),
    {
      name: 'Home Assistant',
      experience: undefined,
      description: '',
      achievements: [outsideWork.join('\n').trim()],
    },
  ];

  const groupHeadings = technology.flatMap((line, index) =>
    /^[A-Z]+$/.test(line) ? [index] : [],
  );
  if (groupHeadings[0] !== 0)
    throw new Error('Could not read the skill groups in the installed résumé.');
  const skills = groupHeadings.flatMap((index, groupIndex) =>
    joinWrappedLines(
      technology.slice(index + 1, groupHeadings[groupIndex + 1]).join('\n'),
    )
      .split(';')
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name, skillGroup: technology[index] })),
  );

  const languageIndex = education.findIndex((line) =>
    line.startsWith('Languages '),
  );
  if (languageIndex < 0 || education.length !== languageIndex + 2) {
    throw new Error(
      'Could not read the education and languages in the installed résumé.',
    );
  }
  const credentials = [
    ...education.slice(0, languageIndex).map((line) => {
      const match = line.match(/^(.+?) - (.+) \((\d{4})-(\d{4})\)$/);
      if (!match)
        throw new Error(
          'Could not read an education item in the installed résumé.',
        );
      const [, name, description, startDateText, endDateText] = match;
      return {
        name,
        description,
        startDateText,
        endDateText,
        credentialType: /certificate/i.test(description)
          ? 'Qualification'
          : 'Education',
      };
    }),
    ...education[languageIndex]
      .slice('Languages '.length)
      .split(' • ')
      .map((language) => {
        const [name, proficiency] = language.split(' - ');
        if (!name || !proficiency)
          throw new Error(
            'Could not read a language proficiency in the installed résumé.',
          );
        return { name, proficiency, credentialType: 'Language' };
      }),
  ];

  return {
    name,
    targetRole,
    summary: summary.join('\n').trim(),
    location,
    resumeSource: education.at(-1),
    experiences,
    projects,
    credentials,
    skills,
  };
};

const structuredResumeSchema = z.object({
  source: z.string(),
  name: z.string(),
  headline: z.string(),
  location: z.string(),
  summary: z.string(),
  professionalSkills: z.record(z.string(), z.array(z.string())),
  projects: z.array(
    z.object({
      project: z.string(),
      focus: z.string(),
      employer: z.string().optional(),
      achievements: z.array(z.string()),
    }),
  ),
  experience: z.array(
    z.object({
      role: z.string(),
      employer: z.string(),
      teamOrProduct: z.string(),
      dates: z.string(),
      achievements: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      qualification: z.string(),
      institution: z.string(),
      dates: z.string(),
    }),
  ),
});

const dateRange = (dates: string) => {
  const [startDateText, endDateText = ''] = dates.split(/\s+(?:-|–|—)\s+/);
  return { startDateText, endDateText };
};

const achievementIdentity = (achievement: string) =>
  achievement.trim().replaceAll('data-querying system', 'querying system');

const parseStructuredResume = (resume: string) => {
  const {
    source: resumeSource,
    headline: targetRole,
    name,
    location,
    summary,
    experience,
    projects: sourceProjects,
    professionalSkills,
    education,
  } = structuredResumeSchema.parse(JSON.parse(resume));
  const projects: ImportedProject[] = sourceProjects.map(
    ({ project, focus, achievements, employer }) => ({
      name: project,
      description: focus,
      experience:
        employer ??
        (project === 'Knowledge base'
          ? experience.find(
              ({ employer }) => employer.toLowerCase() === 'infozahyst',
            )?.employer
          : undefined),
      achievements,
    }),
  );
  const experiences: ImportedExperience[] = experience.map(
    ({ employer, role, teamOrProduct, dates, achievements }) => ({
      name: employer,
      roleHeld: role,
      description: teamOrProduct,
      ...dateRange(dates),
      achievements: achievements.filter((achievement) => {
        for (const project of projects.filter(
          ({ experience }) => experience === employer,
        )) {
          const projectIndex = project.achievements.findIndex(
            (entry) =>
              achievementIdentity(entry) === achievementIdentity(achievement),
          );
          if (projectIndex < 0) continue;
          if (project.achievements[projectIndex] !== achievement) {
            project.alternativeWording = {
              ...project.alternativeWording,
              [projectIndex]: achievement,
            };
          }
          return false;
        }
        return true;
      }),
    }),
  );
  const languages = professionalSkills['Languages Spoken'] ?? [];
  const credentials = [
    ...education.map(({ qualification, institution, dates }) => ({
      name: institution,
      description: qualification,
      credentialType: /\b(degree|bachelor|master|doctor)\b/iu.test(
        qualification,
      )
        ? 'Education'
        : 'Qualification',
      ...dateRange(dates),
    })),
    ...languages.map((language) => {
      const match = language.match(/^(.+) \(([^()]+)\)$/);
      if (!match)
        throw new Error(
          'Could not read a language proficiency in the installed résumé.',
        );
      const [, name, proficiency] = match;
      return { name, proficiency, credentialType: 'Language' };
    }),
  ];
  const skills = Object.entries(professionalSkills)
    .filter(([group]) => group !== 'Languages Spoken')
    .flatMap(([skillGroup, names]) =>
      names
        .flatMap((name) => name.split(/\/(?=\p{L})/u))
        .map((name) => ({ name, skillGroup })),
    );
  return {
    name,
    targetRole,
    summary,
    location,
    resumeSource,
    experiences,
    projects,
    credentials,
    skills,
  };
};

export const parseMasterCvImport = (resume: string) =>
  resume.trimStart().startsWith('{')
    ? parseStructuredResume(resume)
    : parseTextResume(resume);
