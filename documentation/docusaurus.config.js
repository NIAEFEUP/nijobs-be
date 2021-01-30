let URL;
if(process.env.TARGET === "master") {
    URL = `https://${process.env.GITHUB_SHA || ""}--nijobs-docs.netlify.app`
} else {
    URL = `https://${process.env.GITHUB_SHA || ""}--nijobs-docs-develop.netlify.app`
}

module.exports = {
  title: 'NIJobs API Documentation',
  tagline: 'Learn how the NIJobs API works!',
  url: URL,
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'NIAEFEUP', // Usually your GitHub org/user name.
  projectName: 'nijobs-be', // Usually your repo name.
  themeConfig: {
    navbar: {
      title: 'NIJobs API',
      logo: {
        alt: 'NIJobs Logo',
        src: 'img/logo_2018.svg',
      },
      items: [
            {
                href: 'https://github.com/NIAEFEUP/nijobs-be',
                label: 'GitHub',
                position: 'right',
            },
        ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'How to use',
              to: 'docs/intro/how-to-docs',
            },
            {
              label: 'Docussaurus',
              to: 'https://v2.docusaurus.io/',
            },
          ],
        },
        {
          title: 'Packages',
          items: [
            {
              label: 'NIJobs Backend',
              href: 'https://github.com/NIAEFEUP/nijobs-be',
            },
            {
              label: 'NIJobs Frontend',
              href: 'https://github.com/NIAEFEUP/nijobs-fe',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} NIAEFEUP, Inc. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./docs-index.js'),
          editUrl:
            'https://github.com/NIAEFEUP/nijobs-be/edit/master/documentation/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
