export declare class EmailService {
    private readonly logger;
    private transporter;
    constructor();
    sendOtpEmail(email: string, code: string, partnerName: string): Promise<boolean>;
}
