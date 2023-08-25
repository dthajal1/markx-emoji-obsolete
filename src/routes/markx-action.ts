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
  getSubCommandOption,
  getSubCommandOptionValue,
} from "@collabland/discord";
import { MiniAppManifest } from "@collabland/models";
import { handleBuyEmoji } from "./buy-emoji";
import { handleConnectWallet } from "./connect-wallet";
import { handleViewEmojis } from "./view-emojis";
import { handleSendEmoji } from "./send-emoji";

const router = express.Router();

async function handle(interaction: APIInteraction) {
  if (interaction.type == InteractionType.MessageComponent) {
    switch (interaction.data.custom_id) {
      case 'connect-wallet-btn': {
        return handleConnectWallet(interaction);
      }
      case 'emoji_select_1': {
        return handleViewEmojis(interaction);
      }
      case 'emoji_expr_select_1': {
        return handleSendEmoji(interaction);
      }
      default: {
        return null
      }
    }
  }

  const chatInputInteraction = interaction as APIChatInputApplicationCommandInteraction;

  const option = getSubCommandOption(chatInputInteraction);

  console.log(`handling interaction (option.name=${option?.name})`);

  switch (option?.name) {
    case 'buy-emoji': {
      return handleBuyEmoji(interaction);
    }
    case 'connect-wallet': {
      return handleConnectWallet(interaction);
    }
    case 'view-emojis': {
      return handleViewEmojis(interaction);
    }
    case 'send-emoji': {
      const text = getSubCommandOptionValue(chatInputInteraction, 'send-emoji', 'text');
      return handleSendEmoji(interaction, text)
    }
    default: {
      console.log("Invalid subcommand");
      return null
      // throw new Error('Invalid subcommand');
    }
  }
}

router.get("/metadata", function (req, res) {
    const manifest = new MiniAppManifest({
      appId: "markx-emoji-action",
      developer: "markx.io",
      name: "MarkX Emoji",
      platforms: ["discord"],
      shortName: "markx-emoji-action",
      version: { name: "0.0.1" },
      website: "https://www.markx.io",
      description: "[MarkX Emoji](https://www.markx.io/) gives the users the ability to use their owned NFTs and digital assets as stickers within the Discord platform.\n\n**To get started:**\n\n1. Install the MarkX Emoji mini-app from the [Collab.Land Marketplace](https://help.collab.land/marketplace/getting-started)\n\n2. Give mini-app the permission to read wallets you have connected with [Collab.Land](http://Collab.Land) with `/connect-wallet` command\n\n3. Run `/view-emojis` command to view all the emoji NFTs you own\n\n4. Share the emoji NFT you own as stickers with others using `/send-emoji`",
      shortDescription: "This mini-app gives users the ability to use their owned Emoji NFTs as stickers within the Discord platform."
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
          // Handle `/markx-action` slash command
          type: InteractionType.ApplicationCommand,
          names: ["markx"],
        },
        {
          type: InteractionType.MessageComponent,
          ids: ["connect-wallet-btn", "emoji_select_1", "emoji_expr_select_1"],
        }
      ],
    //   /**
    //    * Supported Discord application commands. They will be registered to a
    //    * Discord guild upon installation.
    //    */
      applicationCommands: [
        // `/markx slash command
        {
          metadata: {
            name: "MarkX Emoji",
            shortName: "markx",
          },
          name: "markx",
          type: ApplicationCommandType.ChatInput,
          description: "Use Emoji NFTs as stickers",
          options: [
            // `/markx buy-emoji <url>` slash command
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: 'buy-emoji',
              description:
                "Display link to buy/mint Emoji NFTs in the MarkX marketplace",
              options: [],
            },
            // `/markx connect-wallet <url>` slash command
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: 'connect-wallet',
              description:
                "Connect your wallet to access emoji NFTs you own",
              options: [],
            },
            // `/markx view-emojis <url>` slash command
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: 'view-emojis',
              description:
                "View all the emoji NFTs you own",
              options: [],
            },
            // `/markx send-emoji <url>` slash command
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: 'send-emoji',
              description:
                "Send a specific sticker from your emoji NFTs collection",
              options: [
                {
                  type: ApplicationCommandOptionType.String,
                  name: "text",
                  description: "The text to display along with the expression",
                  required: false,
                },
              ],
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
  const result = await handle(req.body);
  res.send(result);
});


export default router;