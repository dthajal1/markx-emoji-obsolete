"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// models/User.ts
const mongoose_1 = __importDefault(require("mongoose"));
// Subdocument schema for product metadata
const ProductSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    mergedImgUrl: {
        type: String,
        required: true,
    },
    images: {
        type: [
            {
                type: String,
                required: true,
            }
        ],
        required: true,
    },
});
const UserSchema = new mongoose_1.default.Schema({
    discordId: {
        type: String,
        unique: true,
        required: true,
        index: true,
    },
    accessToken: {
        type: String,
        unique: true,
        required: true
    },
    products: [ProductSchema],
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        index: { expireAfterSeconds: 0 },
    },
});
exports.default = mongoose_1.default.models.User || mongoose_1.default.model('User', UserSchema);
