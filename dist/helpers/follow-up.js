"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowUp = void 0;
const common_1 = require("@collabland/common");
const fetch = (0, common_1.getFetch)();
class FollowUp {
    followupMessage(request, message) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const callback = (_a = request.actionContext) === null || _a === void 0 ? void 0 : _a.callbackUrl;
            if (callback) {
                const res = yield fetch(callback, {
                    method: "post",
                    body: JSON.stringify(message),
                });
                return yield (0, common_1.handleFetchResponse)(res);
            }
        });
    }
    editMessage(request, message, messageId = "@original") {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const callback = (_a = request.actionContext) === null || _a === void 0 ? void 0 : _a.callbackUrl;
            if (callback) {
                const res = yield fetch(callback + `/messages/${encodeURIComponent(messageId)}`, {
                    method: "patch",
                    body: JSON.stringify(message),
                });
                return yield (0, common_1.handleFetchResponse)(res);
            }
        });
    }
    deleteMessage(request, messageId = "@original") {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const callback = (_a = request.actionContext) === null || _a === void 0 ? void 0 : _a.callbackUrl;
            if (callback) {
                const res = yield fetch(callback + `/messages/${encodeURIComponent(messageId)}`, {
                    method: "delete",
                });
                yield (0, common_1.handleFetchResponse)(res);
            }
        });
    }
}
exports.FollowUp = FollowUp;
