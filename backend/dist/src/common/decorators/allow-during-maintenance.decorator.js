"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllowDuringMaintenance = exports.ALLOW_DURING_MAINTENANCE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ALLOW_DURING_MAINTENANCE_KEY = 'allowDuringMaintenance';
const AllowDuringMaintenance = () => (0, common_1.SetMetadata)(exports.ALLOW_DURING_MAINTENANCE_KEY, true);
exports.AllowDuringMaintenance = AllowDuringMaintenance;
//# sourceMappingURL=allow-during-maintenance.decorator.js.map