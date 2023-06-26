import express from "express";
import { FollowUp, SignatureVerifier } from "../helpers";
import { sleep } from "@collabland/common";
import {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  DiscordActionMetadata,
  DiscordActionRequest,
  DiscordActionResponse,
  getCommandOptionValue,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  RESTPostAPIWebhookWithTokenJSONBody,
} from "@collabland/discord";
import { MiniAppManifest } from "@collabland/models";

const router = express.Router();

async function handle(
  interaction: DiscordActionRequest<APIChatInputApplicationCommandInteraction>
): Promise<DiscordActionResponse> {
  /**
   * Get user's name
   */
  const userName = interaction.user?.username ?? "World";

  const message = `Hello, ${userName}! Here are the lists of our NFTs that you hold:\n1. NFT 1\n2. NFT 2`;
  /**
   * Build a simple Discord message private to the user
   */
  const response: APIInteractionResponse = {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: message,
      flags: MessageFlags.Ephemeral,
    },
  };
  /**
   * Allow advanced followup messages
   */
//   followup(interaction, message).catch((err) => {
//     console.error(
//       "Fail to send followup message to interaction %s: %O",
//       interaction.id,
//       err
//     );
//   });
  // Return the 1st response to Discord
  return response;
}

async function followup(
  request: DiscordActionRequest<APIChatInputApplicationCommandInteraction>,
  message: string
) {
  const follow = new FollowUp();
  const callback = request.actionContext?.callbackUrl;
  if (callback != null) {
    const followupMsg: RESTPostAPIWebhookWithTokenJSONBody = {
      content: `Follow-up: **${message}**`,
      flags: MessageFlags.Ephemeral,
    };
    await sleep(1000);
    let msg = await follow.followupMessage(request, followupMsg);
    await sleep(1000);
    // 5 seconds count down
    for (let i = 5; i > 0; i--) {
      const updated: RESTPatchAPIWebhookWithTokenMessageJSONBody = {
        content: `[${i}s]: **${message}**`,
      };
      msg = await follow.editMessage(request, updated, msg?.id);
      await sleep(1000);
    }
    // Delete the follow-up message
    await follow.deleteMessage(request, msg?.id);
  }
}

router.get("/metadata", function (req, res) {
  const manifest = new MiniAppManifest({
    appId: "list-action",
    developer: "collab.land",
    name: "ListAction",
    platforms: ["discord"],
    shortName: "list-action",
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
        // Handle `/list-action` slash command
        type: InteractionType.ApplicationCommand,
        names: ["list-action"],
      },
    ],
    /**
     * Supported Discord application commands. They will be registered to a
     * Discord guild upon installation.
     */
    applicationCommands: [
      // `/list-action` slash command
      {
        metadata: {
          name: "ListAction",
          shortName: "list-action",
        },
        name: "list-action",
        type: ApplicationCommandType.ChatInput,
        description: "/list-action",
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
