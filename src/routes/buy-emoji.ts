

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


export async function handleBuyEmoji(interaction: APIInteraction) {
    return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          flags: MessageFlags.Ephemeral,
          content: "Follow the link below to buy/mint Emoji NFTs in the MarkX marketplace",
          components: [
            {
              type: 1,
              components: [
                {
                  style: 5,
                  label: `Buy/Mint Emoji NFTs`,
                  url: "https://xyzport.com/browseProducts",
                  disabled: false,
                  type: 2,
                },
              ],
            },
          ],
        
        },
    };
  }