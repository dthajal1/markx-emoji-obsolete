import express from "express";
import { SignatureVerifier } from "../helpers";
import {
  APIInteraction,
  APIInteractionResponse,
  ApplicationCommandType,
  DiscordActionMetadata,
  getCommandOptionValue,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  APIMessageSelectMenuInteractionData,
  ApplicationCommandOptionType,
  APIChatInputApplicationCommandInteraction,
} from "@collabland/discord";
import { MiniAppManifest } from "@collabland/models";
import User from "../models/User";
import { Product } from "./helpers/redirect";
import AWS from "aws-sdk"
import { createCanvas, loadImage, registerFont, CanvasRenderingContext2D } from "canvas";
import path from "path"
import { retrieveData, storeData } from "../helpers/cache-manager";

const s3 = new AWS.S3();

const router = express.Router();

export async function handlePostEmoji(interaction: APIInteraction, text?: string) {
  const id = interaction?.member?.user?.id;
  if (id && text) {
    storeData(id.toString(), text);
  }

  const user = await User.findOne({ discordId: interaction?.member?.user?.id }).lean();
  if (!user) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        flags: MessageFlags.Ephemeral,
        content: `Your wallet isn't connected. Use /connect-wallet command to link your wallet for NFT access`,
      },
    };
  }

  const productsToDisplay = user.products;
  // console.log("products: ",productsToDisplay);

  if (productsToDisplay.length > 0) {
    switch (interaction.type) {
      case InteractionType.ApplicationCommand: {
        return handleApplicationCommand(productsToDisplay);
      }
      case InteractionType.MessageComponent: {
        return handleMessageComponent(interaction, productsToDisplay);
      }
    }
  }
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      flags: MessageFlags.Ephemeral,
      content: `You currently don't own any Emoji NFTs. Use /buy-emoji command to buy/mint Emoji NFTs in the MarkX marketplace`,
    },
  }
}

async function handleMessageComponent(interaction: APIInteraction, productsToDisplay: Product[]): Promise<APIInteractionResponse | null> {
  const interactionData = interaction.data as APIMessageSelectMenuInteractionData
  const id = interaction?.member?.user?.id 
  if (interactionData?.custom_id === "emoji_expr_select_1") {
    const selectedOption = interactionData.values?.[0].split('-')
    const productIdx = Number(selectedOption[0])
    const imgIdx = Number(selectedOption[1])

    let embed = {
      image: {
        url: productsToDisplay[productIdx].images[imgIdx]
      }
    }

    if (id && retrieveData(id)) {
      const text = retrieveData(id) as string;
      const product = productsToDisplay[productIdx]
      const imageUrl = product.images[imgIdx];
      const canvas = await writeTxtOnImg(text, imageUrl);

      // Convert canvas to a buffer
      const buffer = canvas.toBuffer();

      // Upload the merged image data to S3
      const uploadParams = {
        Bucket: process.env.S3_BUCKET || "markx-bucket", // TODO: change this
        Key: `${product.name}-${imgIdx}.jpg`, // Change the key as needed
        Body: buffer,
        // ACL: "public-read", // Set ACL for public access if needed
        ContentType: "image/jpeg", // Adjust content type as needed
      };
      const uploadResult = await s3.upload(uploadParams).promise();

      // Create the S3 URL for the merged image
      const s3ImageUrl = uploadResult.Location;

      embed = {
        image: {
          url: s3ImageUrl
        }
      }
    }

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [embed],
        components: [],
      },
    };
  }
  return null
}


async function handleApplicationCommand(productsToDisplay: Product[]): Promise<APIInteractionResponse | null> {
  const options = []
  for (let i = 0; i < productsToDisplay.length; i++) {
    const product = productsToDisplay[i]
    for (let j = 0; j < product.images.length; j++) {
      const option = {
        label: `${product.name} ${j}`,
        value: `${i}-${j}`,
        // description: product.description
      }
      options.push(option)
    }
  }

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      flags: MessageFlags.Ephemeral,
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
}

router.get("/metadata", function (req, res) {
  const manifest = new MiniAppManifest({
    appId: "send-emoji",
    developer: "markx.io",
    name: "Send Emoji Action",
    platforms: ["discord"],
    shortName: "send-emoji",
    version: { name: "0.0.1" },
    website: "https://www.markx.io",
    description: "Send a specific sticker from your emoji NFTs collection",
  });
  const metadata: DiscordActionMetadata = {
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
        type: InteractionType.ApplicationCommand,
        names: ["send-emoji"],
      },
      {
        type: InteractionType.MessageComponent,
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
        type: ApplicationCommandType.ChatInput,
        description: "Send a specific sticker from your emoji NFTs collection",
        options: [
          {
            name: "text",
            description: "The text to display along with the expression",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
    ],
  };
  res.send(metadata);
});

router.post("/interactions", async function (req, res) {
  const verifier = new SignatureVerifier();
  verifier.verify(req, res);
  const text = getCommandOptionValue(req.body as APIChatInputApplicationCommandInteraction, "text");
  const result = await handlePostEmoji(req.body, text);
  res.send(result);
});

// Helper functions
async function writeTxtOnImg(text: string, imageUrl: string) {
  // Load the Google Font
  const fontPath = path.join(__dirname, '../../public/fonts/Caprasimo-Regular.ttf');
  registerFont(fontPath, { family: "Caprasimo" });

  // Load the image using canvas
  const image = await loadImage(imageUrl);

  const canvas = createCanvas(image.width, image.height);
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
  return canvas
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = `${currentLine} ${word}`;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  lines.push(currentLine);
  return lines;
}


export default router;
