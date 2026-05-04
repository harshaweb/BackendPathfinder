"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const interview_routes_1 = __importDefault(require("./routes/interview.routes"));
const post_routes_1 = __importDefault(require("./routes/post.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const conversation_routes_1 = __importDefault(require("./routes/conversation.routes"));
const group_routes_1 = __importDefault(require("./routes/group.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.env.corsOrigin === '*' ? true : env_1.env.corsOrigin,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '1mb' }));
app.use((0, morgan_1.default)(env_1.isProduction ? 'combined' : 'dev'));
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'backend-pathfinder',
    });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/posts', post_routes_1.default);
app.use('/api/projects', project_routes_1.default);
app.use('/api/interviews', interview_routes_1.default);
app.use('/api/conversations', conversation_routes_1.default);
app.use('/api/groups', group_routes_1.default);
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map