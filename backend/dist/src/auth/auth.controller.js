"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(body, req, res) {
        try {
            const { email, password } = body;
            if (!email || !password) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Email and password are required' });
            }
            const clientIp = req.headers['x-forwarded-for'] || '127.0.0.1';
            const result = await this.authService.login(email, password, clientIp);
            if ('error' in result) {
                return res.status(result.status || 400).json({ message: result.error });
            }
            if (result.otpRequired) {
                return res.json({ otpRequired: true, otpToken: result.otpToken, email: result.email });
            }
            return res.json({ token: result.token, user: result.user });
        }
        catch (error) {
            console.error('Login error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async verifyLoginOtp(body, req, res) {
        try {
            const { otpToken, otp } = body;
            if (!otpToken || !otp) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'OTP token and verification code are required' });
            }
            const clientIp = req.headers['x-forwarded-for'] || '127.0.0.1';
            const result = await this.authService.verifyLoginOtp(otpToken, otp, clientIp);
            if ('error' in result) {
                return res.status(result.status || 400).json({ message: result.error });
            }
            return res.json({ token: result.token, user: result.user });
        }
        catch (error) {
            console.error('Verify login OTP error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async sendOtp(body, res) {
        try {
            const { email, partnerSlug, password, firstName, lastName, referralCode } = body;
            if (!email) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Email is required' });
            }
            const result = await this.authService.sendSignupOtp(email, partnerSlug, password, firstName, lastName, referralCode);
            if (result && 'error' in result) {
                return res.status(result.status || 400).json({ message: result.error });
            }
            return res.json(result);
        }
        catch (error) {
            console.error('Send OTP error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async signup(body, res) {
        try {
            const { email, password, otp, firstName, lastName, partnerSlug, referralCode } = body;
            if (!email) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Email is required' });
            }
            const result = await this.authService.signup(email, password, otp, firstName, lastName, partnerSlug, referralCode);
            if (result && 'error' in result) {
                return res.status(result.status || 400).json({ message: result.error });
            }
            return res.json({ token: result.token, user: result.user });
        }
        catch (error) {
            console.error('Signup error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async requestManualVerification(email, res) {
        try {
            if (!email) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Email is required' });
            }
            const result = await this.authService.requestManualVerification(email);
            if (result && 'error' in result) {
                return res.status(result.status || 400).json({ message: result.error });
            }
            return res.json(result);
        }
        catch (error) {
            console.error('Request manual verification error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getOtpSettings(res) {
        try {
            const result = await this.authService.getOtpSettings();
            return res.json(result);
        }
        catch (error) {
            console.error('Get OTP settings error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async updateOtpSettings(body, res) {
        try {
            const result = await this.authService.updateOtpSettings(body);
            return res.json(result);
        }
        catch (error) {
            console.error('Update OTP settings error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async me(req, res) {
        try {
            const user = req.user;
            return res.json({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    partnerId: user.partnerId || null,
                    partnerSlug: user.partnerSlug || null,
                },
            });
        }
        catch (error) {
            console.error('Auth context error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async logout(res) {
        return res.json({ success: true, message: 'Logged out successfully' });
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('verify-login-otp'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyLoginOtp", null);
__decorate([
    (0, common_1.Post)('send-otp'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sendOtp", null);
__decorate([
    (0, common_1.Post)('signup'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signup", null);
__decorate([
    (0, common_1.Post)('request-manual-verification'),
    __param(0, (0, common_1.Body)('email')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestManualVerification", null);
__decorate([
    (0, common_1.Get)('otp-settings'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getOtpSettings", null);
__decorate([
    (0, common_1.Post)('otp-settings'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateOtpSettings", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map