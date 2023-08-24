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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helpers_1 = require("../helpers");
const discord_1 = require("@collabland/discord");
const models_1 = require("@collabland/models");
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
function handle(interaction) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const discordId = (_b = (_a = interaction === null || interaction === void 0 ? void 0 : interaction.member) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id;
        const user = yield User_1.default.findOne({ discordId });
        if (!user) {
            console.log("user not found");
            return null;
        }
        yield User_1.default.deleteOne({ discordId });
        return {
            type: discord_1.InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "you have successfully logged out! To access your NFT emojis, you have to go through /connect-wallet again",
                flags: discord_1.MessageFlags.Ephemeral,
            },
        };
    });
}
router.get("/metadata", function (req, res) {
    const manifest = new models_1.MiniAppManifest({
        appId: "logout-action",
        developer: "collab.land",
        name: "LogoutAction",
        platforms: ["discord"],
        shortName: "logout-action",
        version: { name: "0.0.1" },
        website: "https://collab.land",
        description: "An example Collab.Land action",
    });
    const metadata = {
        /**
         * Miniapp manifest
         */
        manifest,
        /**
         * Supported Discord interactions. They allow Collab.Land to route Discord
         * interactions based on the type and name/custom-id.
         */
        supportedInteractions: [
            {
                // Handle `/logout-action` slash command
                type: discord_1.InteractionType.ApplicationCommand,
                names: ["logout-action"],
            },
        ],
        /**
         * Supported Discord application commands. They will be registered to a
         * Discord guild upon installation.
         */
        applicationCommands: [
            // `/logout-action <your-name>` slash command
            {
                metadata: {
                    name: "LogoutAction",
                    shortName: "logout-action",
                },
                name: "logout-action",
                type: discord_1.ApplicationCommandType.ChatInput,
                description: "/logout-action",
                options: [],
            },
        ],
    };
    res.send(metadata);
});
router.post("/interactions", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const verifier = new helpers_1.SignatureVerifier();
        verifier.verify(req, res);
        const result = yield handle(req.body);
        res.send(result);
    });
});
exports.default = router;
