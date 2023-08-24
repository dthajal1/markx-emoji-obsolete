import express from "express";
import crypto from "crypto";
import {
  APIInteraction,
  InteractionType,
  MessageFlags,
} from "discord-api-types/v10";
import { SignatureVerifier } from "../helpers";
import {
  APIInteractionResponse,
  ApplicationCommandType,
  DiscordActionMetadata,
  InteractionResponseType,
} from "@collabland/discord";
import { MiniAppManifest } from "@collabland/models";
import { storeData } from "../helpers/cache-manager";

const router = express.Router();

export function handleConnectWallet(interaction: APIInteraction) {
  switch (interaction.type) {
    case InteractionType.ApplicationCommand: {
      return handleApplicationCommand();
    }
    case InteractionType.MessageComponent: {
      return handleMessageComponent(interaction);
    }
  }
}

function handleMessageComponent(interaction: APIInteraction): APIInteractionResponse {
  const scopes = 'user:wallet:read';
  const stateString = generateStateString(16);
  const oauth2Url = `https://api.collab.land/oauth2/authorize?response_type=code&client_id=${process.env.COLLABLAND_CLIENT_ID}&redirect_uri=${process.env.COLLABLAND_REDIRECT_URI}&scope=${scopes}&state=${stateString}`;
  
  storeData(stateString, interaction);

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      flags: MessageFlags.Ephemeral,
      content: "Use this custom link to connect (valid for 5 mins)",
      components: [
        {
          type: 1,
          components: [
            {
              style: 5,
              label: `Connect Wallet`,
              url: oauth2Url,
              disabled: false,
              type: 2,
            },
          ],
        },
      ],
    
    },
  };

}

function handleApplicationCommand(): APIInteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      flags: MessageFlags.Ephemeral,
      content: "Connect your wallet to access your emoji NFTs collection!",
      components: [
        {
          type: 1,
          components: [
            {
              style: 1,
              label: `Add New Wallet`,
              custom_id: `connect-wallet-btn`,
              disabled: false,
              type: 2,
            },
          ],
        },
      ],
    },
  };
}

router.get("/metadata", function (req, res) {
  const manifest = new MiniAppManifest({
    appId: "connect-wallet",
    developer: "markx.io",
    name: "Connect Wallet Action",
    platforms: ["discord"],
    shortName: "connect-wallet",
    version: { name: "0.0.1" },
    website: "https://www.markx.io",
    description: "Connect your wallet to view emoji NFTs you own",
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
        // Handle `/connect-wallet` slash command
        type: InteractionType.ApplicationCommand,
        names: ["connect-wallet"],
      },
      {
        type: InteractionType.MessageComponent,
        ids: ["connect-wallet-btn"],
      },
    ],
    /**
     * Supported Discord application commands. They will be registered to a
     * Discord guild upon installation.
     */
    applicationCommands: [
      // `/connect-wallet <your-name>` slash command
      {
        metadata: {
          name: "Connect Wallet Action",
          shortName: "connect-wallet",
        },
        name: "connect-wallet",
        type: ApplicationCommandType.ChatInput,
        description: "Connect your wallet to view emoji NFTs you own",
        options: [],
      },
    ],
  };
  res.send(metadata);
});

router.post("/interactions", async function (req, res) {
  const verifier = new SignatureVerifier();
  verifier.verify(req, res);
  const result = await handleConnectWallet(req.body);
  res.send(result);
});

// Helper function
function generateStateString(length: number): string {
  const bytes = crypto.randomBytes(Math.ceil(length / 2));
  return bytes.toString('hex').slice(0, length);
}

export default router;