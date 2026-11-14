"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const about_controller_1 = require("./about.controller");
const consultation_controller_1 = require("./consultation.controller");
const contact_controller_1 = require("./contact.controller");
const legal_controller_1 = require("./legal.controller");
const shop_controller_1 = require("./shop.controller");
const tele_report_controller_1 = require("./tele-report.controller");
const tele_report_request_controller_1 = require("./tele-report-request.controller");
const tele_report_payment_controller_1 = require("./tele-report-payment.controller");
const auth_controller_1 = require("./auth.controller");
const dashboard_controller_1 = require("./dashboard.controller");
const patient_file_controller_1 = require("./patient-file.controller");
const report_controller_1 = require("./report.controller");
const info_request_controller_1 = require("./info-request.controller");
const report_archive_controller_1 = require("./report-archive.controller");
const doctor_profile_controller_1 = require("./doctor-profile.controller");
const admin_dashboard_controller_1 = require("./admin-dashboard.controller");
const admin_user_controller_1 = require("./admin-user.controller");
const admin_doctor_controller_1 = require("./admin-doctor.controller");
const admin_imaging_center_controller_1 = require("./admin-imaging-center.controller");
const admin_organization_controller_1 = require("./admin-organization.controller");
const admin_shop_controller_1 = require("./admin-shop.controller");
const admin_order_controller_1 = require("./admin-order.controller");
const admin_tele_report_controller_1 = require("./admin-tele-report.controller");
const admin_ai_tariff_controller_1 = require("./admin-ai-tariff.controller");
const admin_routing_controller_1 = require("./admin-routing.controller");
const admin_content_controller_1 = require("./admin-content.controller");
const admin_notification_controller_1 = require("./admin-notification.controller");
const admin_discount_controller_1 = require("./admin-discount.controller");
const admin_report_controller_1 = require("./admin-report.controller");
const admin_settings_controller_1 = require("./admin-settings.controller");
const article_controller_1 = require("./article.controller");
const admin_article_controller_1 = require("./admin-article.controller");
const support_ticket_controller_1 = require("./support-ticket.controller");
const support_faq_controller_1 = require("./support-faq.controller");
const public_ticket_controller_1 = require("./public-ticket.controller");
const support_chat_controller_1 = require("./support-chat.controller");
const support_chat_gateway_1 = require("./support-chat.gateway");
const support_telereport_controller_1 = require("./support-telereport.controller");
const support_review_controller_1 = require("./support-review.controller");
const support_order_controller_1 = require("./support-order.controller");
const user_panel_controller_1 = require("./user-panel.controller");
const panel_controller_1 = require("./panel.controller");
const org_controller_1 = require("./org.controller");
const admin_review_controller_1 = require("./admin-review.controller");
const admin_communication_controller_1 = require("./admin-communication.controller");
const admin_system_log_controller_1 = require("./admin-system-log.controller");
const auth_log_service_1 = require("./auth-log.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            about_controller_1.AboutController,
            article_controller_1.ArticleController,
            admin_article_controller_1.AdminArticleController,
            consultation_controller_1.ConsultationController,
            contact_controller_1.ContactController,
            legal_controller_1.LegalController,
            shop_controller_1.ShopController,
            tele_report_controller_1.TeleReportController,
            tele_report_request_controller_1.TeleReportRequestController,
            tele_report_payment_controller_1.TeleReportPaymentController,
            auth_controller_1.AuthController,
            dashboard_controller_1.DashboardController,
            patient_file_controller_1.PatientFileController,
            report_controller_1.ReportController,
            info_request_controller_1.InfoRequestController,
            report_archive_controller_1.ReportArchiveController,
            doctor_profile_controller_1.DoctorProfileController,
            admin_dashboard_controller_1.AdminDashboardController,
            admin_user_controller_1.AdminUserController,
            admin_doctor_controller_1.AdminDoctorController,
            admin_imaging_center_controller_1.AdminImagingCenterController,
            admin_organization_controller_1.AdminOrganizationController,
            admin_shop_controller_1.AdminShopController,
            admin_order_controller_1.AdminOrderController,
            admin_tele_report_controller_1.AdminTeleReportController,
            admin_ai_tariff_controller_1.AdminAiTariffController,
            admin_routing_controller_1.AdminRoutingController,
            admin_content_controller_1.AdminContentController,
            admin_notification_controller_1.AdminNotificationController,
            admin_discount_controller_1.AdminDiscountController,
            admin_report_controller_1.AdminReportController,
            admin_settings_controller_1.AdminSettingsController,
            admin_review_controller_1.AdminReviewController,
            admin_communication_controller_1.AdminCommunicationController,
            admin_system_log_controller_1.AdminSystemLogController,
            support_ticket_controller_1.SupportTicketController,
            support_faq_controller_1.SupportFaqController,
            public_ticket_controller_1.PublicTicketController,
            support_chat_controller_1.SupportChatController,
            support_telereport_controller_1.SupportTelereportController,
            support_review_controller_1.SupportReviewController,
            support_order_controller_1.SupportOrderController,
            user_panel_controller_1.UserPanelController,
            panel_controller_1.PanelController,
            org_controller_1.OrgController,
        ],
        providers: [prisma_service_1.PrismaService, auth_log_service_1.AuthLogService, support_chat_gateway_1.SupportChatGateway],
    })
], AppModule);
