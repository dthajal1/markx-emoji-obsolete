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
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const canvas_1 = require("canvas");
const path_1 = __importDefault(require("path"));
const cache_manager_1 = require("../helpers/cache-manager");
const s3 = new aws_sdk_1.default.S3();
const router = express_1.default.Router();
function handle(interaction) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const text = (0, discord_1.getCommandOptionValue)(interaction, "text");
        // console.log(text);
        const id = (_b = (_a = interaction === null || interaction === void 0 ? void 0 : interaction.member) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id;
        if (id && text) {
            (0, cache_manager_1.storeData)(id.toString(), text);
        }
        const user = yield User_1.default.findOne({ discordId: (_d = (_c = interaction === null || interaction === void 0 ? void 0 : interaction.member) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.id }).lean();
        if (!user) {
            console.log("user not found");
            return null;
        }
        // const accessToken = user.accessToken;
        // if (!accessToken) {
        //     console.log("access token not found");
        //     return null;
        // }
        // console.log("retrieved accessToken");
        const productsToDisplay = user.products;
        // console.log("products: ",productsToDisplay);
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
    });
}
function handleMessageComponent(interaction, productsToDisplay) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const interactionData = interaction.data;
        const id = (_b = (_a = interaction === null || interaction === void 0 ? void 0 : interaction.member) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id;
        if ((interactionData === null || interactionData === void 0 ? void 0 : interactionData.custom_id) === "emoji_expr_select_1") {
            const selectedOption = (_c = interactionData.values) === null || _c === void 0 ? void 0 : _c[0].split('-');
            const productIdx = Number(selectedOption[0]);
            const imgIdx = Number(selectedOption[1]);
            let embed = {
                image: {
                    url: productsToDisplay[productIdx].images[imgIdx]
                }
            };
            if (id && (0, cache_manager_1.retrieveData)(id)) {
                const text = (0, cache_manager_1.retrieveData)(id);
                const product = productsToDisplay[productIdx];
                const imageUrl = product.images[imgIdx];
                const canvas = yield writeTxtOnImg(text, imageUrl);
                // Convert canvas to a buffer
                const buffer = canvas.toBuffer();
                // Upload the merged image data to S3
                const uploadParams = {
                    Bucket: process.env.S3_BUCKET || "markx-bucket",
                    Key: `${product.name}-${imgIdx}.jpg`,
                    Body: buffer,
                    // ACL: "public-read", // Set ACL for public access if needed
                    ContentType: "image/jpeg", // Adjust content type as needed
                };
                const uploadResult = yield s3.upload(uploadParams).promise();
                // Create the S3 URL for the merged image
                const s3ImageUrl = uploadResult.Location;
                embed = {
                    image: {
                        url: s3ImageUrl
                    }
                };
            }
            return {
                type: discord_1.InteractionResponseType.ChannelMessageWithSource,
                data: {
                    embeds: [embed],
                    components: [],
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
            for (let j = 0; j < product.images.length; j++) {
                const option = {
                    label: `${product.name} ${j}`,
                    value: `${i}-${j}`,
                    // description: product.description
                };
                options.push(option);
            }
        }
        return {
            type: discord_1.InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: discord_1.MessageFlags.Ephemeral,
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 3,
                                custom_id: "emoji_expr_select_1",
                                options: options,
                                placeholder: "Select an emoji expression you want to send"
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
        appId: "send-emoji",
        developer: "markx.io",
        name: "Send Emoji Action",
        platforms: ["discord"],
        shortName: "send-emoji",
        version: { name: "0.0.1" },
        website: "https://www.markx.io",
        description: "Send a specific sticker from your emoji NFTs collection",
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
                // Handle `/send-emoji` slash command
                type: discord_1.InteractionType.ApplicationCommand,
                names: ["send-emoji"],
            },
            {
                type: discord_1.InteractionType.MessageComponent,
                ids: ["emoji_expr_select_1"],
            },
        ],
        /**
         * Supported Discord application commands. They will be registered to a
         * Discord guild upon installation.
         */
        applicationCommands: [
            // `/send-emoji <your-name>` slash command
            {
                metadata: {
                    name: "Send Emoji Action",
                    shortName: "send-emoji",
                },
                name: "send-emoji",
                type: discord_1.ApplicationCommandType.ChatInput,
                description: "Send a specific sticker from your emoji NFTs collection",
                options: [
                    {
                        name: "text",
                        description: "The text to display along with the expression",
                        type: discord_1.ApplicationCommandOptionType.String,
                        required: false,
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
// Helper functions
function writeTxtOnImg(text, imageUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        // Load the Google Font
        const fontPath = path_1.default.join(__dirname, '../../public/fonts/Caprasimo-Regular.ttf');
        (0, canvas_1.registerFont)(fontPath, { family: "Caprasimo" });
        // Load the image using canvas
        const image = yield (0, canvas_1.loadImage)(imageUrl);
        const canvas = (0, canvas_1.createCanvas)(image.width, image.height);
        const ctx = canvas.getContext("2d");
        // Draw the image onto the canvas
        ctx.drawImage(image, 0, 0, image.width, image.height);
        const fontSize = 70;
        const fontWeight = "bold";
        ctx.font = `${fontWeight} ${fontSize}px 'Caprasimo', cursive`;
        // Get the color of the pixel at the center of the image
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const [r, g, b] = ctx.getImageData(centerX, centerY, 1, 1).data;
        // Use the sampled color for the font
        const fontColor = `rgb(${r}, ${g}, ${b})`;
        ctx.fillStyle = fontColor;
        // Horizontal alignment
        ctx.textAlign = "center";
        // Vertical alignment on the top with a margin
        // const textMargin = 20; // Adjust the margin as needed
        // const textY = textMargin + fontSize; // Add margin and font size
        const textY = 0; // Add margin and font size
        ctx.textBaseline = "top";
        // Draw the text with the desired alignments
        // ctx.fillStyle = "white";
        ctx.strokeStyle = "white"; // Border color
        ctx.lineWidth = 10; // Border thickness
        // Calculate the width of the text
        const textBoxWidth = canvas.width / 2;
        const textLines = wrapText(ctx, text, textBoxWidth); // Call the wrapText function
        // Calculate the vertical spacing between lines (negative line height)
        const lineHeight = fontSize - 20;
        // Draw the text lines with a border in the calculated text box
        for (let i = 0; i < textLines.length; i++) {
            const line = textLines[i];
            // Calculate the vertical position of the current line
            const lineY = textY + i * lineHeight;
            // Introduce a random rotation angle (in radians)
            const rotation = (Math.random() - 0.5) * Math.PI / 20; // Adjust the angle as needed
            // Save the current canvas state
            ctx.save();
            // Translate to the position of the text and apply rotation
            ctx.translate(canvas.width / 2, lineY);
            ctx.rotate(rotation);
            // Draw the text at the calculated position with rotation
            ctx.strokeText(line, 0, 0); // Draw the text
            ctx.fillText(line, 0, 0);
            // Restore the canvas state to undo the rotation
            ctx.restore();
        }
        return canvas;
    });
}
function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = `${currentLine} ${word}`;
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth <= maxWidth) {
            currentLine = testLine;
        }
        else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}
exports.default = router;
