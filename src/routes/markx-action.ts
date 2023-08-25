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
import { handlePostEmoji } from "./post-emoji";
import { handleHelp } from "./help";

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
        return handlePostEmoji(interaction);
      }
      default: {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            flags: MessageFlags.Ephemeral,
            content: `${interaction.data.custom_id} message component isn't been implemented`
          }
        }
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
    case 'post-emoji': {
      const text = getSubCommandOptionValue(chatInputInteraction, 'post-emoji', 'text');
      return handlePostEmoji(interaction, text)
    }
    case 'help': {
      return handleHelp(interaction);
    }
    default: {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          flags: MessageFlags.Ephemeral,
          content: `${option?.name} subcommand is invalid`
        }
      }
    }
  }
}

router.get("/metadata", function (req, res) {
    const host = req.get('host'); // Get the host (e.g., localhost:3000)
    const protocol = req.protocol; // Get the protocol (e.g., http or https)

    // Construct the absolute URL for the image
    const imageUrl = `${protocol}://${host}/imgs/MarkX_Logo.png`;
    console.log("imageUrl: ", imageUrl)

    const manifest = new MiniAppManifest({
      appId: "markx-emoji-action",
      developer: "markx.io",
      name: "MarkX Emoji",
      platforms: ["discord"],
      shortName: "markx-emoji-action",
      version: { name: "0.0.1" },
      website: "https://www.markx.io",
      description: "[MarkX Emoji](https://www.markx.io/) gives users the ability to use their Emoji NFTs as stickers within the Discord servers. You can use your community brand or NFT IP to create emojis with the MarkX creator network and allow your community members to start communicating with it!\n\n**Get Free Custom Emojis for Your Community:**\n\n1. Follow Step 2 in Getting Started below: This step is required if you want the community to use your project emoji \n\n**To get started:**\n\n1. Install the MarkX Emoji mini-app from the [Collab.Land Marketplace](https://help.collab.land/marketplace/getting-started)\n\n2. [Create a Free Emoji](https://www.markx.io/create-emojis) collection for your IP (NFT or Brand) with the MarkX (Enter Promo Code: CollabLandFTW2023)\n\n3.  Buy/mint your community Emoji NFTs in the [MarkX marketplace (in testnet right now)](https://xyzport.com/browseProducts) using `/buy-emoji` command\n\n4. Give mini-app the permission to read wallets you have connected with [Collab.Land](http://Collab.Land) with `/connect-wallet` command\n\n5. Run `/view-emojis` command to view all the Emoji NFTs you own\n\n6. Share the Emoji NFT you own as stickers with others using `/post-emoji`\n\n",
      shortDescription: "MarkX Emoji gives users the ability to use their Emoji NFTs as stickers within the Discord servers.",
      icons: [
        {
          label: 'App icon',
          src: imageUrl,
          sizes: '512x512'
        }
      ]
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
          description: "Use Emoji NFTs as stickers in discord servers",
          options: [
            // `/markx buy-emoji <url>` slash command
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: 'buy-emoji',
              description:
                "Display a link to buy/mint Emoji NFTs in the MarkX marketplace",
              options: [],
            },
            // `/markx connect-wallet <url>` slash command
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: 'connect-wallet',
              description:
                "Connect your wallet to access your Emoji NFTs",
              options: [],
            },
            // `/markx view-emojis <url>` slash command
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: 'view-emojis',
              description:
                "View a list of Emoji NFTs that you own as stickers",
              options: [],
            },
            // `/markx post-emoji <url>` slash command
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: 'post-emoji',
              description:
                "Send/Post a specific sticker from your collection in the chat.",
              options: [
                {
                  type: ApplicationCommandOptionType.String,
                  name: "text",
                  description: "The text to display along with the expression",
                  required: false,
                },
              ],
            },
            // `/markx help <url>` slash command
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: 'help',
              description:
                "View all available commands",
              options: [],
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