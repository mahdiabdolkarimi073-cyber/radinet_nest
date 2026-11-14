"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const radinet_logger_1 = require("./radinet-logger");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    async onModuleInit() {
        const startedAt = Date.now();
        (0, radinet_logger_1.logRadinet)({
            level: 'INFO',
            category: 'DATABASE',
            message: 'Connecting to PostgreSQL database via Prisma...',
            details: {
                databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
                databaseHost: process.env.DATABASE_URL
                    ? process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || '[CONFIGURED]'
                    : 'NONE',
            },
        });
        try {
            await this.$connect();
            // Perform a ping query to verify database response
            await this.$queryRaw `SELECT 1 as ping`;
            const durationMs = Date.now() - startedAt;
            (0, radinet_logger_1.logRadinet)({
                level: 'INFO',
                category: 'DATABASE',
                message: `PostgreSQL database connected and verified successfully (${durationMs}ms)`,
                durationMs,
            });
        }
        catch (e) {
            const err = e;
            (0, radinet_logger_1.logRadinet)({
                level: 'ERROR',
                category: 'DATABASE',
                message: `Prisma/PostgreSQL connection failed: ${err?.message || String(e)}`,
                error: err?.message || String(e),
                stack: err?.stack,
                details: {
                    code: err?.code,
                    hint: 'Database might be offline, credentials invalid, or firewall blocking connection. App will start with graceful degradation.',
                },
            });
        }
    }
    async onModuleDestroy() {
        try {
            (0, radinet_logger_1.logRadinet)({
                level: 'INFO',
                category: 'DATABASE',
                message: 'Disconnecting Prisma Client...',
            });
            await this.$disconnect();
        }
        catch (err) {
            (0, radinet_logger_1.logRadinet)({
                level: 'WARN',
                category: 'DATABASE',
                message: `Prisma disconnect warning: ${String(err)}`,
            });
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
