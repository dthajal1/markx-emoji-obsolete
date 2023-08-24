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
const router = express_1.default.Router();
function handle() {
    return __awaiter(this, void 0, void 0, function* () {
        const embed = {
            title: `Help`,
            description: `**/connect-wallet\t**\nConnect your wallet to the bot for NFT access.\n\n** /view-emojis**\nView a list of emoji NFTs that you own as stickers.\n\n**/send-emoji**\nSend a specific sticker from your collection.`,
            color: 0x00FFFF
        };
        return {
            type: discord_1.InteractionResponseType.ChannelMessageWithSource,
            data: {
                embeds: [embed],
                flags: discord_1.MessageFlags.Ephemeral,
            },
        };
    });
}
router.get("/metadata", function (req, res) {
    const manifest = new models_1.MiniAppManifest({
        appId: "help",
        developer: "markx.io",
        name: "Help Action",
        platforms: ["discord"],
        shortName: "help",
        version: { name: "0.0.1" },
        website: "https://www.markx.io",
        description: "View all available commands",
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
                // Handle `/help` slash command
                type: discord_1.InteractionType.ApplicationCommand,
                names: ["help"],
            },
        ],
        /**
         * Supported Discord application commands. They will be registered to a
         * Discord guild upon installation.
         */
        applicationCommands: [
            // `/help <your-name>` slash command
            {
                metadata: {
                    name: "Help Action",
                    shortName: "help",
                },
                name: "help",
                type: discord_1.ApplicationCommandType.ChatInput,
                description: "View all available commands",
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
        const result = yield handle();
        res.send(result);
    });
});
exports.default = router;
