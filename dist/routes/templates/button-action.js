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
const v10_1 = require("discord-api-types/v10");
const helpers_1 = require("../../helpers");
const discord_1 = require("@collabland/discord");
const models_1 = require("@collabland/models");
const router = express_1.default.Router();
function handle(interaction) {
    switch (interaction.type) {
        case v10_1.InteractionType.ApplicationCommand: {
            return handleApplicationCommand();
        }
        case v10_1.InteractionType.MessageComponent: {
            return handleMessageComponent();
        }
    }
}
function handleMessageComponent() {
    return {
        type: discord_1.InteractionResponseType.ChannelMessageWithSource,
        data: {
            content: "You just clicked Test Button.",
        },
    };
}
function handleApplicationCommand() {
    return {
        type: discord_1.InteractionResponseType.ChannelMessageWithSource,
        data: {
            flags: v10_1.MessageFlags.Ephemeral,
            components: [
                {
                    type: 1,
                    components: [
                        {
                            style: 1,
                            label: `Test`,
                            custom_id: `test-button`,
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
        appId: "button-action",
        developer: "collab.land",
        name: "ButtonAction",
        platforms: ["discord"],
        shortName: "button-action",
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
                // Handle `/button-action` slash command
                type: v10_1.InteractionType.ApplicationCommand,
                names: ["button-action"],
            },
            {
                type: v10_1.InteractionType.MessageComponent,
                ids: ["test-button"],
            },
        ],
        /**
         * Supported Discord application commands. They will be registered to a
         * Discord guild upon installation.
         */
        applicationCommands: [
            // `/button-action <your-name>` slash command
            {
                metadata: {
                    name: "ButtonAction",
                    shortName: "button-action",
                },
                name: "button-action",
                type: discord_1.ApplicationCommandType.ChatInput,
                description: "/button-action",
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
