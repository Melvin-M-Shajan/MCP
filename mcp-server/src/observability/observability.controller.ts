import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('observability')
export class ObservabilityController {
    constructor(private readonly metricsService: MetricsService) { }

    @Get('metrics')
    getMetrics() {
        return this.metricsService.getSystemHealthStatus();
    }
}
