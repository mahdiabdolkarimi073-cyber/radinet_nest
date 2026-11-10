import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { verifyAdminToken } from './auth-token';
import {
  AuthLogService,
  generateRequestId,
  type CreateAuthLogInput,
  type HttpResponse,
} from './auth-log.service';

@Controller('admin/system-logs')
export class AdminSystemLogController {
  constructor(private readonly authLogService: AuthLogService) {}

  @Get()
  async listSystemLogs(
    @Headers('authorization') auth: string | undefined,
    @Headers('x-request-id') incomingRequestId: string | undefined,
    @Res({ passthrough: true }) res: HttpResponse,
    @Query('requestId') requestId?: string,
    @Query('operation') operation?: string,
    @Query('level') level?: string,
    @Query('status') status?: string,
    @Query('statusCode') statusCode?: string,
    @Query('backendReached') backendReached?: string,
    @Query('source') source?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    verifyAdminToken(auth);
    const traceId = incomingRequestId?.trim() || generateRequestId();
    res.setHeader('X-Request-ID', traceId);
    res.setHeader('X-Backend-Reached', 'true');

    const [logsResult, health] = await Promise.all([
      this.authLogService.queryLogs({
        requestId,
        operation,
        level,
        status,
        statusCode,
        backendReached,
        source,
        fromDate,
        toDate,
        search,
        page: page ? Number.parseInt(page, 10) : 1,
        limit: limit ? Number.parseInt(limit, 10) : 25,
      }),
      this.authLogService.checkDatabaseHealth(),
    ]);

    return {
      ok: true,
      requestId: traceId,
      backendHealth: {
        backendOnline: true,
        ...health,
        checkedAt: new Date().toISOString(),
      },
      ...logsResult,
    };
  }

  @Post('ingest')
  async ingestFrontendLog(
    @Headers('x-request-id') incomingRequestId: string | undefined,
    @Body() body: CreateAuthLogInput,
    @Res({ passthrough: true }) res: HttpResponse,
  ) {
    const traceId = body?.requestId || incomingRequestId?.trim() || generateRequestId();
    res.setHeader('X-Request-ID', traceId);
    res.setHeader('X-Backend-Reached', 'true');

    if (!body || typeof body !== 'object' || !body.operation || !body.routePath) {
      return { ok: false, requestId: traceId };
    }

    const record = await this.authLogService.recordLog({
      ...body,
      requestId: traceId,
      source: body.source === 'frontend-client' ? 'frontend-client' : 'frontend-proxy',
    });

    return {
      ok: true,
      requestId: traceId,
      id: record.id,
    };
  }
}
