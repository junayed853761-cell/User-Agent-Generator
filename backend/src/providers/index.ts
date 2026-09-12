import { UserAgentProvider } from './UserAgentProvider.js';
import { LocalProvider } from './local/LocalProvider.js';
import { MicrolinkProvider } from './microlink/MicrolinkProvider.js';
import { IntoliProvider } from './intoli/IntoliProvider.js';
import { WhatIsMyBrowserProvider } from './whatismybrowser/WhatIsMyBrowserProvider.js';
import { LatestOpenSourceProvider } from './latestopensource/LatestOpenSourceProvider.js';

export const providers: Record<string, UserAgentProvider> = {
  local: new LocalProvider(),
  microlink: new MicrolinkProvider(),
  intoli: new IntoliProvider(),
  whatismybrowser: new WhatIsMyBrowserProvider(),
  latestopensource: new LatestOpenSourceProvider(),
};

export function getAllProviders(): UserAgentProvider[] {
  return Object.values(providers);
}

export function getProvider(id: string): UserAgentProvider | undefined {
  return providers[id];
}
