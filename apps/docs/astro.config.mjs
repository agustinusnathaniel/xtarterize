import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Xtarterize',
      description: 'A toolkit to scaffold and configure full-stack TypeScript projects with best practices.',
      social: [
        {
          icon: 'github',
          href: 'https://github.com/your-org/xtarterize',
          label: 'GitHub',
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          autogenerate: { directory: 'getting-started' },
        },
        {
          label: 'User Guide',
          items: [
            {
              label: 'CLI Reference',
              autogenerate: { directory: 'guide/cli' },
            },
            {
              label: 'Configuration',
              autogenerate: { directory: 'guide/config' },
            },
            {
              label: 'Templates',
              autogenerate: { directory: 'guide/templates' },
            },
          ],
        },
        {
          label: 'Contributing',
          items: [
            {
              label: 'Architecture',
              autogenerate: { directory: 'contributing/architecture' },
            },
            {
              label: 'Core',
              autogenerate: { directory: 'contributing/core' },
            },
            {
              label: 'Patchers',
              autogenerate: { directory: 'contributing/patchers' },
            },
            {
              label: 'Tasks',
              autogenerate: { directory: 'contributing/tasks' },
            },
          ],
        },
      ],
    }),
  ],
});
