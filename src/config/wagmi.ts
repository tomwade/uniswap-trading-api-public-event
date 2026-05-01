import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { unichainSepolia } from './chain';

const walletConnectProjectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  'YOUR_WALLETCONNECT_PROJECT_ID';

export const wagmiConfig = getDefaultConfig({
  appName: 'Unichain Swap Widget',
  projectId: walletConnectProjectId,
  chains: [unichainSepolia],
  transports: {
    [unichainSepolia.id]: http('https://sepolia.unichain.org'),
  },
  ssr: false,
});
