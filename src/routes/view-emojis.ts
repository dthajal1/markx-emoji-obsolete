import express from "express";
import { SignatureVerifier } from "../helpers";
import {
  APIInteraction,
  APIInteractionResponse,
  APIMessageSelectMenuInteractionData,
  ApplicationCommandType,
  DiscordActionMetadata,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from "@collabland/discord";
import { MiniAppManifest } from "@collabland/models";
import User from "../models/User";
import { Product } from "./helpers/redirect";

const router = express.Router();

async function handle(interaction: APIInteraction) {
  const user = await User.findOne({ discordId: interaction?.member?.user?.id }).lean();
  if (!user) {
    console.log("user not found");
    return null;
  }

  const productsToDisplay = user.products;

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
  return null
}

async function handleMessageComponent(interaction: APIInteraction, productsToDisplay: Product[]): Promise<APIInteractionResponse | null> {
  const interactionData = interaction.data as APIMessageSelectMenuInteractionData
  if (interactionData?.custom_id === "emoji_select_1") {
    const selectedOptionIndex = Number(interactionData.values?.[0]); // Convert to number
    const selectedProduct = productsToDisplay[selectedOptionIndex];

    return {
      type: InteractionResponseType.UpdateMessage,
      data: {
        flags: MessageFlags.Ephemeral,
        embeds: [createEmbed(selectedProduct)],
      },
    };
  }
  return null
}

async function handleApplicationCommand(productsToDisplay: Product[]): Promise<APIInteractionResponse | null> {
    const options = []
    for (let i = 0; i < productsToDisplay.length; i++) {
      const product = productsToDisplay[i]
      const option = {
        label: product.name,
        value: i.toString(),
        description: product.description
      }
      options.push(option)
    }

    const DEFAULT_SELECT_INDEX = 1;
    const selectedProduct = productsToDisplay[DEFAULT_SELECT_INDEX];

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        flags: MessageFlags.Ephemeral,
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
}

router.get("/metadata", function (req, res) {
  const manifest = new MiniAppManifest({
    appId: "view-emojis",
    developer: "markx.io",
    name: "View Emojis Action",
    platforms: ["discord"],
    shortName: "view-emojis",
    version: { name: "0.0.1" },
    website: "https://www.markx.io",
    description: "View all the emoji NFTs you own",
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
        // Handle `/view-emojis` slash command
        type: InteractionType.ApplicationCommand,
        names: ["view-emojis"],
      },
      {
        type: InteractionType.MessageComponent,
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
        type: ApplicationCommandType.ChatInput,
        description: "View all the emoji NFTs you own",
        options: [],
      },
    ],
  };
  res.send(metadata);
});

router.post("/interactions", async function (req, res) {
  const verifier = new SignatureVerifier();
  verifier.verify(req, res);
  const result = await handle(req.body);
  res.send(result);
});

function createEmbed(selectedProduct: Product) {
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

export default router;
