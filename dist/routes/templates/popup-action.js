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
const discord_js_1 = require("discord.js");
const router = express_1.default.Router();
function handle(interaction) {
    switch (interaction.type) {
        case v10_1.InteractionType.ApplicationCommand: {
            return handleApplicationCommand();
        }
        case v10_1.InteractionType.ModalSubmit: {
            return handleModalSubmit(interaction);
        }
    }
}
function handleModalSubmit(interaction) {
    var _a, _b;
    const components = interaction.data.components;
    const name = (_b = (_a = components[0]) === null || _a === void 0 ? void 0 : _a.components[0]) === null || _b === void 0 ? void 0 : _b.value;
    return {
        type: discord_1.InteractionResponseType.ChannelMessageWithSource,
        data: {
            content: `You submitted ${name}`,
        },
    };
}
function handleApplicationCommand() {
    const modal = new discord_js_1.ModalBuilder().setCustomId(`submit`).setTitle("Submit");
    const name = new discord_js_1.TextInputBuilder()
        .setCustomId("name")
        .setLabel("Name")
        .setPlaceholder("What's your name")
        .setMaxLength(100)
        .setStyle(discord_1.TextInputStyle.Short)
        .setRequired(true);
    const firstActionRow = new discord_js_1.ActionRowBuilder().addComponents(name);
    modal.addComponents(firstActionRow);
    return {
        type: discord_1.InteractionResponseType.Modal,
        data: Object.assign({}, modal.toJSON()),
    };
}
router.get("/metadata", function (req, res) {
    const manifest = new models_1.MiniAppManifest({
        appId: "popup-action",
        developer: "collab.land",
        name: "PopUpAction",
        platforms: ["discord"],
        shortName: "popup-action",
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
                // Handle `/popup-action` slash command
                type: v10_1.InteractionType.ApplicationCommand,
                names: ["popup-action"],
            },
            {
                type: v10_1.InteractionType.ModalSubmit,
                ids: ["submit"],
            },
        ],
        /**
         * Supported Discord application commands. They will be registered to a
         * Discord guild upon installation.
         */
        applicationCommands: [
            // `/popup-action <your-name>` slash command
            {
                metadata: {
                    name: "PopUpAction",
                    shortName: "popup-action",
                },
                name: "popup-action",
                type: discord_1.ApplicationCommandType.ChatInput,
                description: "/popup-action",
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
