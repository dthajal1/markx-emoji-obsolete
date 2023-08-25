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


export async function handleHelp(interaction: APIInteraction) {
  const embed = {
      title: `Help`,
      description: `**/buy-emoji**\nBuy/mint Emoji NFTs in the MarkX marketplace. \n\n**/connect-wallet**\nConnect your wallet to the bot for NFT access. \n\n**/view-emojis**\nView a list of Emoji NFTs that you own as stickers. \n\n**/post-emoji**\nSend/Post a specific sticker from your collection in the chat`,
      // color: 0x00FFFF
  }

  return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
      },
  };
}