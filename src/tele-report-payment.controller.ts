import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from './prisma.service';

type PaymentGateway = {
  id: string;
  name: string;
  description: string;
  logoText: string;
  countries: string[];
};

const gateways: PaymentGateway[] = [
  { id: 'zarinpal_sandbox', name: 'درگاه آزمایشی زرین‌پال (شاپرک)', description: 'پرداخت آزمایشی آنلاین و ثبت نهایی درخواست در صف بررسی رادینت', logoText: 'Z', countries: ['IR'] },
  { id: 'saman_sandbox', name: 'درگاه آزمایشی بانک سامان (سپ)', description: 'تراکنش آزمایشی شبیه‌سازی‌شده شاپرک', logoText: 'S', countries: ['IR'] },
  { id: 'stripe_sandbox', name: 'Stripe Experimental Checkout', description: 'پرداخت آزمایشی بین‌المللی', logoText: 'S', countries: ['TR', 'AE', 'DE', 'GB', 'US', 'IQ', 'AF'] },
];

const countryPricing: Record<string, { name: string; currency: string; amount: number; currencyLabel: string }> = {
  IR: { name: 'ایران', currency: 'IRR', amount: 950000, currencyLabel: 'تومان' },
  AF: { name: 'افغانستان', currency: 'AFN', amount: 3900, currencyLabel: 'افغانی' },
  IQ: { name: 'عراق', currency: 'IQD', amount: 52000, currencyLabel: 'دینار' },
  TR: { name: 'ترکیه', currency: 'TRY', amount: 1250, currencyLabel: 'لیر' },
  AE: { name: 'امارات', currency: 'AED', amount: 330, currencyLabel: 'درهم' },
  DE: { name: 'آلمان', currency: 'EUR', amount: 85, currencyLabel: 'یورو' },
  GB: { name: 'انگلستان', currency: 'GBP', amount: 75, currencyLabel: 'پوند' },
  US: { name: 'آمریکا', currency: 'USD', amount: 95, currencyLabel: 'دلار' },
};

class PaymentConfigQueryDto {
  @IsOptional() @IsString() country?: string;
}

class StartPaymentDto {
  @IsString() requestNumber!: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() gateway?: string;
  @IsOptional() @IsString() paymentMethod?: string;
}

class VerifyPaymentDto {
  @IsString() requestNumber!: string;
  @IsOptional() @IsString() paymentToken?: string;
  @IsOptional() @IsString() gateway?: string;
}

function getConfig(countryCode = 'IR') {
  const code = (countryCode || 'IR').toUpperCase();
  const country = countryPricing[code] ?? countryPricing.IR;
  const availableGateways = gateways.filter((gateway) => gateway.countries.includes(code) || gateway.id === 'stripe_sandbox');
  return {
    country: country.name,
    countryCode: code in countryPricing ? code : 'IR',
    currency: country.currency,
    currencyLabel: country.currencyLabel,
    amount: country.amount,
    formattedAmount: country.amount.toLocaleString('fa-IR'),
    gateways: availableGateways,
  };
}

@Controller('tele-report/payments')
export class TeleReportPaymentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('config')
  getPaymentConfig(@Query() query: PaymentConfigQueryDto) {
    return getConfig(query.country);
  }

  @Post('start')
  async startPayment(@Body() body: StartPaymentDto) {
    const config = getConfig(body.country);
    const paymentToken = `PAY-TOKEN-${Date.now().toString(36).toUpperCase()}`;

    const request = await this.prisma.teleReportRequest.findUnique({
      where: { requestNumber: body.requestNumber },
    });
    if (!request) {
      throw new BadRequestException('درخواست تله‌ریپورت یافت نشد');
    }

    if (request.paymentStatus === 'paid') {
      return {
        alreadyPaid: true,
        requestNumber: request.requestNumber,
        paymentReference: request.paymentReference,
        paymentToken: request.paymentReference,
        amount: Number(request.paymentAmount) || config.amount,
        status: request.status,
      };
    }

    await this.prisma.teleReportRequest.update({
      where: { requestNumber: body.requestNumber },
      data: {
        paymentStatus: 'pending',
        paymentReference: paymentToken,
        paymentAmount: config.amount,
      },
    });

    return {
      alreadyPaid: false,
      requestNumber: body.requestNumber,
      paymentStatus: 'pending',
      paymentToken,
      paymentReference: paymentToken,
      amount: config.amount,
      currency: config.currency,
    };
  }

  @Post('verify')
  async verifyPayment(@Body() body: VerifyPaymentDto) {
    const request = await this.prisma.teleReportRequest.findUnique({
      where: { requestNumber: body.requestNumber },
    });
    if (!request) {
      throw new BadRequestException('درخواست تله‌ریپورت یافت نشد');
    }

    if (request.paymentStatus === 'paid') {
      return {
        ok: true,
        alreadyPaid: true,
        request,
      };
    }

    const trackingRef =
      body.paymentToken && body.paymentToken.startsWith('PAY-')
        ? body.paymentToken.replace('PAY-TOKEN-', 'EXP-REF-')
        : `EXP-REF-${Date.now().toString(36).toUpperCase()}`;

    const updated = await this.prisma.teleReportRequest.update({
      where: { requestNumber: body.requestNumber },
      data: {
        paymentStatus: 'paid',
        paymentReference: trackingRef,
        paidAt: new Date(),
        status: request.status === 'pending_payment' || request.status === 'new' ? 'pending_review' : request.status,
      },
    });

    return {
      ok: true,
      alreadyPaid: false,
      request: updated,
    };
  }
}

