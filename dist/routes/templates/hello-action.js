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
const helpers_1 = require("../../helpers");
const common_1 = require("@collabland/common");
const discord_1 = require("@collabland/discord");
const models_1 = require("@collabland/models");
const router = express_1.default.Router();
function handle(interaction) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        /**
         * Get the value of `your-name` argument for `/hello-action`
         */
        const yourName = (0, discord_1.getCommandOptionValue)(interaction, "your-name");
        const message = `Hello, ${(_b = yourName !== null && yourName !== void 0 ? yourName : (_a = interaction.user) === null || _a === void 0 ? void 0 : _a.username) !== null && _b !== void 0 ? _b : "World"}!`;
        /**
         * Build a simple Discord message private to the user
         */
        const response = {
            type: discord_1.InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: message,
                flags: discord_1.MessageFlags.Ephemeral,
            },
        };
        /**
         * Allow advanced followup messages
         */
        followup(interaction, message).catch((err) => {
            console.error("Fail to send followup message to interaction %s: %O", interaction.id, err);
        });
        // Return the 1st response to Discord
        return response;
    });
}
function followup(request, message) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const follow = new helpers_1.FollowUp();
        const callback = (_a = request.actionContext) === null || _a === void 0 ? void 0 : _a.callbackUrl;
        if (callback != null) {
            const followupMsg = {
                content: `Follow-up: **${message}**`,
                // flags: MessageFlags.Ephemeral,
            };
            yield (0, common_1.sleep)(1000);
            yield follow.followupMessage(request, followupMsg);
            // let msg = await follow.followupMessage(request, followupMsg);
            // await sleep(1000);
            // 5 seconds count down
            // for (let i = 5; i > 0; i--) {
            //   const updated: RESTPatchAPIWebhookWithTokenMessageJSONBody = {
            //     content: `[${i}s]: **${message}**`,
            //   };
            //   msg = await follow.editMessage(request, updated, msg?.id);
            //   await sleep(1000);
            // }
            // Delete the follow-up message
            // await follow.deleteMessage(request, msg?.id);
        }
    });
}
router.get("/metadata", function (req, res) {
    const manifest = new models_1.MiniAppManifest({
        appId: "hello-action",
        developer: "collab.land",
        name: "HelloAction",
        platforms: ["discord"],
        shortName: "hello-action",
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
                // Handle `/hello-action` slash command
                type: discord_1.InteractionType.ApplicationCommand,
                names: ["hello-action"],
            },
        ],
        /**
         * Supported Discord application commands. They will be registered to a
         * Discord guild upon installation.
         */
        applicationCommands: [
            // `/hello-action <your-name>` slash command
            {
                metadata: {
                    name: "HelloAction",
                    shortName: "hello-action",
                },
                name: "hello-action",
                type: discord_1.ApplicationCommandType.ChatInput,
                description: "/hello-action",
                options: [
                    {
                        name: "your-name",
                        description: "Name of person we're greeting",
                        type: discord_1.ApplicationCommandOptionType.String,
                        required: true,
                    },
                ],
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
