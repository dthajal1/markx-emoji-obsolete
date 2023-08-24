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
const crypto_1 = __importDefault(require("crypto"));
const v10_1 = require("discord-api-types/v10");
const helpers_1 = require("../helpers");
const discord_1 = require("@collabland/discord");
const models_1 = require("@collabland/models");
const cache_manager_1 = require("../helpers/cache-manager");
const router = express_1.default.Router();
function handle(interaction) {
    switch (interaction.type) {
        case v10_1.InteractionType.ApplicationCommand: {
            return handleApplicationCommand();
        }
        case v10_1.InteractionType.MessageComponent: {
            return handleMessageComponent(interaction);
        }
    }
}
function handleMessageComponent(interaction) {
    const scopes = 'user:wallet:read';
    const stateString = generateStateString(16);
    const oauth2Url = `https://api.collab.land/oauth2/authorize?response_type=code&client_id=${process.env.COLLABLAND_CLIENT_ID}&redirect_uri=${process.env.COLLABLAND_REDIRECT_URI}&scope=${scopes}&state=${stateString}`;
    (0, cache_manager_1.storeData)(stateString, interaction);
    return {
        type: discord_1.InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: v10_1.MessageFlags.Ephemeral,
            content: "Use this custom link to connect (valid for 5 mins)",
            components: [
                {
                    type: 1,
                    components: [
                        {
                            style: 5,
                            label: `Connect Wallet`,
                            url: oauth2Url,
                            disabled: false,
                            type: 2,
                        },
                    ],
                },
            ],
        },
    };
}
function handleApplicationCommand() {
    return {
        type: discord_1.InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: v10_1.MessageFlags.Ephemeral,
            content: "Connect your wallet to access your emoji NFTs collection!",
            components: [
                {
                    type: 1,
                    components: [
                        {
                            style: 1,
                            label: `Add New Wallet`,
                            custom_id: `connect-wallet-btn`,
                            disabled: false,
                            type: 2,
                        },
                    ],
                },
            ],
        },
    };
}
router.get("/metadata", function (req, res) {
    const manifest = new models_1.MiniAppManifest({
        appId: "connect-wallet",
        developer: "markx.io",
        name: "Connect Wallet Action",
        platforms: ["discord"],
        shortName: "connect-wallet",
        version: { name: "0.0.1" },
        website: "https://www.markx.io",
        description: "Connect your wallet to view emoji NFTs you own",
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
                // Handle `/connect-wallet` slash command
                type: v10_1.InteractionType.ApplicationCommand,
                names: ["connect-wallet"],
            },
            {
                type: v10_1.InteractionType.MessageComponent,
                ids: ["connect-wallet-btn"],
            },
        ],
        /**
         * Supported Discord application commands. They will be registered to a
         * Discord guild upon installation.
         */
        applicationCommands: [
            // `/connect-wallet <your-name>` slash command
            {
                metadata: {
                    name: "Connect Wallet Action",
                    shortName: "connect-wallet",
                },
                name: "connect-wallet",
                type: discord_1.ApplicationCommandType.ChatInput,
                description: "Connect your wallet to view emoji NFTs you own",
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
// Helper function
function generateStateString(length) {
    const bytes = crypto_1.default.randomBytes(Math.ceil(length / 2));
    return bytes.toString('hex').slice(0, length);
}
exports.default = router;
