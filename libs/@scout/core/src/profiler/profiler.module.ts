import { Module, Global } from '@nestjs/common';
import { ProfilerService } from './profiler.service';
import { setProfilerInstance } from './profile.decorator';
import { ProfilerMonitorService } from './profiler-monitor.service';

@Global()
@Module({
  providers: [ProfilerService, ProfilerMonitorService],
  exports: [ProfilerService],
})
export class ProfilerModule {
  constructor(private readonly profilerService: ProfilerService) {
    // Make the service globally available to the decorator
    setProfilerInstance(this.profilerService);
  }
}