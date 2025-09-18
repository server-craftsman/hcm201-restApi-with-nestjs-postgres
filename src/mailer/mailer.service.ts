import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter | null;
  constructor(private readonly configService: ConfigService) {
    // Get mail configuration
    const mailUser = this.configService.get('app.mail.user');
    const mailPassword = this.configService.get('app.mail.password');
    const mailHost = this.configService.get('app.mail.host') || 'smtp.gmail.com';
    const mailPort = this.configService.get('app.mail.port') || 587;
    const mailSecure = this.configService.get('app.mail.secure') === 'true';

    // Check if credentials are provided
    if (!mailUser || !mailPassword) {
      console.warn('⚠️ Email service not configured - missing credentials');
      this.transporter = null;
      return;
    }

    // Gmail SMTP configuration
    const mailConfig = {
      host: mailHost,
      port: mailPort,
      secure: mailSecure, // true for 465, false for other ports
      auth: {
        user: mailUser,
        pass: mailPassword, // App Password for Gmail
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    };

    this.transporter = nodemailer.createTransport(mailConfig);

    // Test connection
    this.testConnection();
  }

  private async testConnection() {
    try {
      if (!this.transporter) {
        return;
      }

      await this.transporter.verify();
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        command: error.command,
      });
    }
  }

  async sendMail(mailOptions: {
    to: string | string[];
    subject: string;
    templatePath: string;
    context: Record<string, any>;
    html?: string;
  }): Promise<any> {
    try {
      if (!this.transporter) {
        throw new Error('Email service not configured - missing credentials');
      }

      // Read and compile template
      let html = '';
      if (mailOptions.templatePath && !mailOptions.html) {
        const templateContent = await readFile(mailOptions.templatePath, 'utf-8');
        const template = Handlebars.compile(templateContent);
        html = template(mailOptions.context);
      }

      const emailOptions = {
        to: mailOptions.to,
        subject: mailOptions.subject,
        from: `Debate System <${this.configService.get('app.mail.defaultEmail', { infer: true }) || 'noreply@debate.com'}>`,
        html: mailOptions.html ? mailOptions.html : html,
      };

      const result = await this.transporter.sendMail(emailOptions);
      return result;
    } catch (error) {
      console.error('Error in MailerService.sendMail:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
