export const skillKey = (name: string) => {
  const key = name.normalize('NFKC').trim().toLowerCase();
  const aliases: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    postgres: 'postgresql',
    nodejs: 'node.js',
    reactjs: 'react',
    'react.js': 'react',
    vuejs: 'vue',
    'vue.js': 'vue',
    nextjs: 'next.js',
    golang: 'go',
    k8s: 'kubernetes',
  };
  return Object.hasOwn(aliases, key) ? aliases[key] : key;
};
