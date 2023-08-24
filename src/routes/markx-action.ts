import express from "express";
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

const router = express.Router();

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
          // Handle `/send-emoji` slash command
          type: InteractionType.ApplicationCommand,
          names: ["markx-emoji"],
        },
      ],
    //   /**
    //    * Supported Discord application commands. They will be registered to a
    //    * Discord guild upon installation.
    //    */
      applicationCommands: [
        // `/send-emoji <your-name>` slash command
        {
          metadata: {
            name: "MarkX Emoji",
            shortName: "markx-emoji",
          },
          name: "markx-emoji",
          type: ApplicationCommandType.ChatInput,
          description: "Markx Emoji Action",
          options: [
            // {
            //   name: "text",
            //   description: "The text to display along with the expression",
            //   type: ApplicationCommandOptionType.String,
            //   required: false,
            // },
          ],
        },
      ],
    };
    res.send(metadata);
  });


export default router;