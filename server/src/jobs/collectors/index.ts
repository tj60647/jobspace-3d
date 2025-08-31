import { JobCollector } from './base';
import { GreenhouseCollector } from './greenhouse';
import { LeverCollector } from './lever';
import { AshbyCollector } from './ashby';
import { RecruiteeCollector } from './recruitee';
import { SmartRecruitersCollector } from './smartrecruiters';

export function getAvailableCollectors(): JobCollector[] {
  return [
    new GreenhouseCollector(),
    new LeverCollector(),
    new AshbyCollector(),
    new RecruiteeCollector(),
    new SmartRecruitersCollector()
  ];
}