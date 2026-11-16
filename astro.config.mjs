import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.riadchain.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'Riadchain',
      logo: {
        light: './public/riadchain-mark.svg',
        dark: './public/riadchain-mark-light.svg',
        alt: '',
        replacesTitle: false,
      },
      description: 'Guides for Riadchain nodes, smart contracts, wallets and applications.',
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/nfl0/riadchain-docs' }],
      editLink: { baseUrl: 'https://github.com/nfl0/riadchain-docs/edit/master/' },
      customCss: ['./src/styles/theme.css'],
      sidebar: [
        { label: 'Start here', items: [{ label: 'Welcome', link: '/' }, 'start/what-is-riadchain', 'start/choose-your-path'] },
        { label: 'Your appliances', items: [{ label: 'Your Riadchain appliances', link: '/appliances/' }, 'appliances/connect-machines', 'appliances/first-network', 'appliances/everyday-use', 'appliances/updates-and-help'] },
        { label: 'Operate a network', items: ['node/deployment', 'node/system-requirements', 'node/direct-install', 'node/proxmox', 'node/gateway', 'node/cli-setup', 'node/quickstart', 'node/configuration', 'node/regtest', 'node/operations', 'node/backup-recovery', 'node/file-archive'] },
        { label: 'Build contracts', collapsed: true, items: ['build/quickstart', 'build/ping-reference', 'build/application-checkpoints', 'build/language', 'build/abi-and-guards', 'build/charlie-and-native-tokens', 'build/resource-practices'] },
        { label: 'SDK and RPC', collapsed: true, items: ['developers/sdk', 'developers/transactions', 'developers/rpc', 'developers/mcp', 'developers/contract-arguments', 'developers/files'] },
        { label: 'Wallets and apps', collapsed: true, items: ['apps/native-wallet', 'apps/keychain', 'apps/web-wallet-and-ide', 'apps/names', 'apps/chat', 'apps/smart-home', 'apps/dex-and-riax', 'apps/games-and-explorer'] },
        { label: 'Protocol reference', collapsed: true, items: ['protocol/overview', 'protocol/succession', 'protocol/genesis', 'protocol/upgrades', 'protocol/fees', 'protocol/determinism', 'protocol/storage'] },
      ],
    }),
  ],
});
