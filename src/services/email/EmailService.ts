/**
 * Email Service
 * Transactional email notifications using Resend
 */

import { Resend } from 'resend';
import { logger } from '@/services/logger';

// Types
export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export interface PlanReadyEmailData {
    userName: string;
    planSummary: {
        weekStart: string;
        weekEnd: string;
        totalMeals: number;
        highlights: string[];
    };
}

export interface DailyReminderEmailData {
    userName: string;
    meal: {
        name: string;
        mealType: string;
        cookingTime?: number;
        imageUrl?: string;
    };
    date: string;
}

export interface ShoppingReminderEmailData {
    userName: string;
    items: Array<{
        name: string;
        quantity: number;
        unit: string;
    }>;
    totalItems: number;
}

class EmailService {
    private resend: Resend | null = null;
    private fromEmail: string = 'KeCaraJoComo <notificaciones@kecarajocomo.app>';

    constructor() {
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey) {
            this.resend = new Resend(apiKey);
        } else {
            logger.warn('RESEND_API_KEY not configured. Email sending is disabled.', 'EmailService');
        }
    }

    /**
     * Check if email service is available
     */
    isAvailable(): boolean {
        return this.resend !== null;
    }

    /**
     * Send a raw email
     */
    async send(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
        if (!this.resend) {
            logger.warn('Email service not configured', 'EmailService');
            return { success: false, error: 'Email service not configured' };
        }

        try {
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            });

            if (result.error) {
                logger.error('Failed to send email:', 'EmailService', result.error);
                return { success: false, error: result.error.message };
            }

            logger.info(`Email sent successfully: ${result.data?.id}`, 'EmailService');
            return { success: true, id: result.data?.id };
        } catch (error) {
            logger.error('Email send error:', 'EmailService', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Send "Tu plan está listo" email
     */
    async sendPlanReadyEmail(
        email: string,
        data: PlanReadyEmailData
    ): Promise<{ success: boolean; id?: string; error?: string }> {
        const html = this.generatePlanReadyHtml(data);
        const text = this.generatePlanReadyText(data);

        return this.send({
            to: email,
            subject: '🍽️ ¡Tu plan semanal está listo!',
            html,
            text,
        });
    }

    /**
     * Send daily cooking reminder email
     */
    async sendDailyReminderEmail(
        email: string,
        data: DailyReminderEmailData
    ): Promise<{ success: boolean; id?: string; error?: string }> {
        const html = this.generateDailyReminderHtml(data);
        const text = this.generateDailyReminderText(data);

        return this.send({
            to: email,
            subject: `🍳 Hoy cocinas: ${data.meal.name}`,
            html,
            text,
        });
    }

    /**
     * Send shopping reminder email
     */
    async sendShoppingReminderEmail(
        email: string,
        data: ShoppingReminderEmailData
    ): Promise<{ success: boolean; id?: string; error?: string }> {
        const html = this.generateShoppingReminderHtml(data);
        const text = this.generateShoppingReminderText(data);

        return this.send({
            to: email,
            subject: `🛒 Recordatorio: ${data.totalItems} ingredientes en tu lista`,
            html,
            text,
        });
    }

    // ========== HTML Template Generators ==========

    private generatePlanReadyHtml(data: PlanReadyEmailData): string {
        const highlightsList = data.planSummary.highlights
            .map(h => `<li style="margin-bottom: 8px; color: #374151;">${h}</li>`)
            .join('');

        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td>
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 28px;">🍽️ ¡Plan Listo!</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
            Tu semana ya está organizada
          </p>
        </div>
        
        <!-- Content -->
        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">
            ¡Hola ${data.userName}! 👋
          </p>
          <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
            Tu plan de comidas para la semana del <strong>${data.planSummary.weekStart}</strong> al <strong>${data.planSummary.weekEnd}</strong> está listo.
          </p>
          
          <!-- Stats -->
          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <div style="font-size: 36px; font-weight: bold; color: #10b981; text-align: center;">
              ${data.planSummary.totalMeals}
            </div>
            <div style="text-align: center; color: #059669; font-size: 14px;">
              comidas planificadas
            </div>
          </div>
          
          <!-- Highlights -->
          ${data.planSummary.highlights.length > 0 ? `
          <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 16px;">Destacados de la semana:</h3>
          <ul style="margin: 0 0 24px; padding-left: 20px;">
            ${highlightsList}
          </ul>
          ` : ''}
          
          <!-- CTA -->
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://kecarajocomo.app'}/planificador" 
             style="display: block; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Ver mi plan →
          </a>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0 0 8px;">
            KeCaraJoComo - Tu asistente de planificación de comidas
          </p>
          <p style="margin: 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://kecarajocomo.app'}/settings" style="color: #6b7280; text-decoration: underline;">
              Gestionar preferencias de email
            </a>
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
    }

    private generateDailyReminderHtml(data: DailyReminderEmailData): string {
        const mealTypeLabel = {
            breakfast: '🌅 Desayuno',
            lunch: '☀️ Almuerzo',
            snack: '🍪 Merienda',
            dinner: '🌙 Cena',
        }[data.meal.mealType] || data.meal.mealType;

        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td>
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 28px;">🍳 Hora de cocinar</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
            ${mealTypeLabel} • ${data.date}
          </p>
        </div>
        
        <!-- Content -->
        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">
            ¡Hola ${data.userName}! 👋
          </p>
          <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
            Hoy tenés planificado:
          </p>
          
          <!-- Meal Card -->
          <div style="background: #fffbeb; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #fcd34d;">
            <h2 style="margin: 0 0 8px; color: #92400e; font-size: 24px;">
              ${data.meal.name}
            </h2>
            ${data.meal.cookingTime ? `
            <p style="margin: 0; color: #b45309; font-size: 14px;">
              ⏱️ ${data.meal.cookingTime} minutos
            </p>
            ` : ''}
          </div>
          
          <!-- CTA -->
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://kecarajocomo.app'}/planificador" 
             style="display: block; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Ver receta completa →
          </a>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0 0 8px;">
            KeCaraJoComo - Tu asistente de planificación de comidas
          </p>
          <p style="margin: 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://kecarajocomo.app'}/settings" style="color: #6b7280; text-decoration: underline;">
              Gestionar recordatorios
            </a>
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
    }

    private generateShoppingReminderHtml(data: ShoppingReminderEmailData): string {
        const itemsList = data.items
            .slice(0, 10)
            .map(item => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #374151;">
            ${item.name}
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; text-align: right;">
            ${item.quantity} ${item.unit}
          </td>
        </tr>
      `)
            .join('');

        const moreItems = data.items.length > 10 ? data.items.length - 10 : 0;

        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td>
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 28px;">🛒 Lista de compras</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
            ${data.totalItems} ingredientes pendientes
          </p>
        </div>
        
        <!-- Content -->
        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">
            ¡Hola ${data.userName}! 👋
          </p>
          <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
            Te recordamos que tenés ingredientes pendientes para tus recetas:
          </p>
          
          <!-- Items Table -->
          <table width="100%" style="margin-bottom: 24px;">
            ${itemsList}
            ${moreItems > 0 ? `
            <tr>
              <td colspan="2" style="padding: 12px 0; color: #6b7280; font-style: italic;">
                + ${moreItems} ingredientes más...
              </td>
            </tr>
            ` : ''}
          </table>
          
          <!-- CTA -->
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://kecarajocomo.app'}/lista-compras" 
             style="display: block; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Ver lista completa →
          </a>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0 0 8px;">
            KeCaraJoComo - Tu asistente de planificación de comidas
          </p>
          <p style="margin: 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://kecarajocomo.app'}/settings" style="color: #6b7280; text-decoration: underline;">
              Gestionar recordatorios
            </a>
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
    }

    // ========== Plain Text Template Generators ==========

    private generatePlanReadyText(data: PlanReadyEmailData): string {
        const highlights = data.planSummary.highlights.map(h => `  • ${h}`).join('\n');

        return `
¡Hola ${data.userName}!

Tu plan de comidas para la semana del ${data.planSummary.weekStart} al ${data.planSummary.weekEnd} está listo.

📊 ${data.planSummary.totalMeals} comidas planificadas

${highlights ? `Destacados de la semana:\n${highlights}\n` : ''}
Ver tu plan: ${process.env.NEXT_PUBLIC_APP_URL || 'https://kecarajocomo.app'}/planificador

---
KeCaraJoComo - Tu asistente de planificación de comidas
Gestionar preferencias: ${process.env.NEXT_PUBLIC_APP_URL || 'https://kecarajocomo.app'}/settings
    `.trim();
    }

    private generateDailyReminderText(data: DailyReminderEmailData): string {
        return `
¡Hola ${data.userName}!

Hoy tenés planificado para ${data.meal.mealType}:

🍽️ ${data.meal.name}
${data.meal.cookingTime ? `⏱️ ${data.meal.cookingTime} minutos` : ''}

Ver receta: ${process.env.NEXT_PUBLIC_APP_URL || 'https://kecarajocomo.app'}/planificador

---
KeCaraJoComo - Tu asistente de planificación de comidas
Gestionar recordatorios: ${process.env.NEXT_PUBLIC_APP_URL || 'https://kecarajocomo.app'}/settings
    `.trim();
    }

    private generateShoppingReminderText(data: ShoppingReminderEmailData): string {
        const items = data.items
            .slice(0, 10)
            .map(item => `  • ${item.name} - ${item.quantity} ${item.unit}`)
            .join('\n');

        const moreItems = data.items.length > 10 ? `\n  + ${data.items.length - 10} ingredientes más...` : '';

        return `
¡Hola ${data.userName}!

Te recordamos que tenés ${data.totalItems} ingredientes pendientes:

${items}${moreItems}

Ver lista completa: ${process.env.NEXT_PUBLIC_APP_URL || 'https://kecarajocomo.app'}/lista-compras

---
KeCaraJoComo - Tu asistente de planificación de comidas
Gestionar recordatorios: ${process.env.NEXT_PUBLIC_APP_URL || 'https://kecarajocomo.app'}/settings
    `.trim();
    }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
    if (!emailServiceInstance) {
        emailServiceInstance = new EmailService();
    }
    return emailServiceInstance;
}

export const emailService = getEmailService();
