import express from "express";
import { SignatureVerifier } from "../helpers";
import {
  APIChatInputApplicationCommandInteraction,
  ApplicationCommandType,
  DiscordActionMetadata,
  DiscordActionRequest,
  DiscordActionResponse,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from "@collabland/discord";
import { MiniAppManifest } from "@collabland/models";
import User from "../models/User";

const router = express.Router();

async function handle(
  interaction: DiscordActionRequest<APIChatInputApplicationCommandInteraction>
): Promise<DiscordActionResponse | null> {

  const discordId = interaction?.member?.user?.id;
  const user = await User.findOne({ discordId });

  if (!user) {
  console.log("user not found")
  return null
  }

  await User.deleteOne({ discordId });

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: "you have successfully logged out! To access your NFT emojis, you have to go through /connect-wallet again",
      flags: MessageFlags.Ephemeral,
    },
  };
}

router.get("/metadata", function (req, res) {
  const manifest = new MiniAppManifest({
    appId: "logout-action",
    developer: "collab.land",
    name: "LogoutAction",
    platforms: ["discord"],
    shortName: "logout-action",
    version: { name: "0.0.1" },
    website: "https://collab.land",
    description: "An example Collab.Land action",
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
        // Handle `/logout-action` slash command
        type: InteractionType.ApplicationCommand,
        names: ["logout-action"],
      },
    ],
    /**
     * Supported Discord application commands. They will be registered to a
     * Discord guild upon installation.
     */
    applicationCommands: [
      // `/logout-action <your-name>` slash command
      {
        metadata: {
          name: "LogoutAction",
          shortName: "logout-action",
        },
        name: "logout-action",
        type: ApplicationCommandType.ChatInput,
        description: "/logout-action",
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

export default router;
