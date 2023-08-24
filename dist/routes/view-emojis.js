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
        const user = yield User_1.default.findOne({ discordId: (_b = (_a = interaction === null || interaction === void 0 ? void 0 : interaction.member) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id }).lean();
        if (!user) {
            console.log("user not found");
            return null;
        }
        const productsToDisplay = user.products;
        if (productsToDisplay.length > 0) {
            switch (interaction.type) {
                case discord_1.InteractionType.ApplicationCommand: {
                    return handleApplicationCommand(productsToDisplay);
                }
                case discord_1.InteractionType.MessageComponent: {
                    return handleMessageComponent(interaction, productsToDisplay);
                }
            }
        }
        return null;
    });
}
function handleMessageComponent(interaction, productsToDisplay) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const interactionData = interaction.data;
        if ((interactionData === null || interactionData === void 0 ? void 0 : interactionData.custom_id) === "emoji_select_1") {
            const selectedOptionIndex = Number((_a = interactionData.values) === null || _a === void 0 ? void 0 : _a[0]); // Convert to number
            const selectedProduct = productsToDisplay[selectedOptionIndex];
            return {
                type: discord_1.InteractionResponseType.UpdateMessage,
                data: {
                    flags: discord_1.MessageFlags.Ephemeral,
                    embeds: [createEmbed(selectedProduct)],
                },
            };
        }
        return null;
    });
}
function handleApplicationCommand(productsToDisplay) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = [];
        for (let i = 0; i < productsToDisplay.length; i++) {
            const product = productsToDisplay[i];
            const option = {
                label: product.name,
                value: i.toString(),
                description: product.description
            };
            options.push(option);
        }
        const DEFAULT_SELECT_INDEX = 1;
        const selectedProduct = productsToDisplay[DEFAULT_SELECT_INDEX];
        return {
            type: discord_1.InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: discord_1.MessageFlags.Ephemeral,
                embeds: [createEmbed(selectedProduct)],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 3,
                                custom_id: "emoji_select_1",
                                options: options,
                                placeholder: "Select an emoji"
                            }
                        ]
                    }
                ]
            },
        };
    });
}
router.get("/metadata", function (req, res) {
    const manifest = new models_1.MiniAppManifest({
        appId: "view-emojis",
        developer: "markx.io",
        name: "View Emojis Action",
        platforms: ["discord"],
        shortName: "view-emojis",
        version: { name: "0.0.1" },
        website: "https://www.markx.io",
        description: "View all the emoji NFTs you own",
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
                // Handle `/view-emojis` slash command
                type: discord_1.InteractionType.ApplicationCommand,
                names: ["view-emojis"],
            },
            {
                type: discord_1.InteractionType.MessageComponent,
                ids: ["emoji_select_1"],
            },
        ],
        /**
         * Supported Discord application commands. They will be registered to a
         * Discord guild upon installation.
         */
        applicationCommands: [
            // `/view-emojis <your-name>` slash command
            {
                metadata: {
                    name: "View Emojis Action",
                    shortName: "view-emojis",
                },
                name: "view-emojis",
                type: discord_1.ApplicationCommandType.ChatInput,
                description: "View all the emoji NFTs you own",
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
function createEmbed(selectedProduct) {
    return {
        title: selectedProduct.name,
        description: selectedProduct.description,
        color: 0x00FFFF,
        image: {
            url: selectedProduct.mergedImgUrl,
            height: 0,
            width: 0,
        },
        footer: {
            text: "created with GenAI",
        },
    };
}
exports.default = router;
