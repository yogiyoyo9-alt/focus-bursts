import * as zerodhaInjector from './injectors/zerodha';
import * as growwInjector from './injectors/groww';
import * as epfoInjector from './injectors/epfo';
import * as npsInjector from './injectors/nps_nsdl';
import * as hdfcInjector from './injectors/hdfc';
import * as genericInjector from './injectors/generic';

export interface InjectorModule {
  buildCredentialInjector: (creds: Record<string, string>) => string;
  buildDataExtractor: () => string;
  detectLoginSuccess: (url: string) => boolean;
}

const injectorMap: Record<string, InjectorModule> = {
  zerodha: zerodhaInjector,
  groww: growwInjector,
  epfo: epfoInjector,
  nps_nsdl: npsInjector,
  hdfc: hdfcInjector,
};

export function getInjector(institutionId: string): InjectorModule {
  return injectorMap[institutionId] ?? genericInjector;
}
