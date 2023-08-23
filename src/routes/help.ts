import express from "express";
import { SignatureVerifier } from "../helpers";
import {
  ApplicationCommandType,
  DiscordActionMetadata,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from "@collabland/discord";
import { MiniAppManifest } from "@collabland/models";

const router = express.Router();

async function handle() {

    const embed = {
        title: `Help`,
        description: `**/connect-wallet\t**\nConnect your wallet to the bot for NFT access.\n\n** /view-emojis**\nView a list of emoji NFTs that you own as stickers.\n\n**/send-emoji**\nSend a specific sticker from your collection.`,
        color: 0x00FFFF
    }

    return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
        },
    };
}

router.get("/metadata", function (req, res) {
  const manifest = new MiniAppManifest({
    appId: "help",
    developer: "markx.io",
    name: "Help Action",
    platforms: ["discord"],
    shortName: "help",
    version: { name: "0.0.1" },
    website: "https://www.markx.io",
    description: "View all available commands",
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
        // Handle `/help` slash command
        type: InteractionType.ApplicationCommand,
        names: ["help"],
      },
    ],
    /**
     * Supported Discord application commands. They will be registered to a
     * Discord guild upon installation.
     */
    applicationCommands: [
      // `/help <your-name>` slash command
      {
        metadata: {
          name: "Help Action",
          shortName: "help",
        },
        name: "help",
        type: ApplicationCommandType.ChatInput,
        description: "View all available commands",
        options: [],
      },
    ],
  };
  res.send(metadata);
});

router.post("/interactions", async function (req, res) {
  const verifier = new SignatureVerifier();
  verifier.verify(req, res);
  const result = await handle();
  res.send(result);
});

export default router;
