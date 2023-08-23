import { getFetch, handleFetchResponse } from "@collabland/common";
import {
  APIInteraction,
  APIMessage,
  DiscordActionRequest,
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  RESTPostAPIWebhookWithTokenJSONBody,
} from "@collabland/discord";

const fetch = getFetch();

export class FollowUp {
  async followupMessage<T extends APIInteraction>(
    request: DiscordActionRequest<T>,
    message: RESTPostAPIWebhookWithTokenJSONBody
  ) {
    const callback = request.actionContext?.callbackUrl;
    if (callback) {
      const res = await fetch(callback, {
        method: "post",
        body: JSON.stringify(message),
      });
      return await handleFetchResponse<APIMessage>(res);
    }
  }

  async editMessage<T extends APIInteraction>(
    request: DiscordActionRequest<T>,
    message: RESTPatchAPIWebhookWithTokenMessageJSONBody,
    messageId = "@original"
  ) {
    const callback = request.actionContext?.callbackUrl;
    if (callback) {
      const res = await fetch(
        callback + `/messages/${encodeURIComponent(messageId)}`,
        {
          method: "patch",
          body: JSON.stringify(message),
        }
      );
      return await handleFetchResponse<APIMessage>(res);
    }
  }

  async deleteMessage<T extends APIInteraction>(
    request: DiscordActionRequest<T>,
    messageId = "@original"
  ) {
    const callback = request.actionContext?.callbackUrl;
    if (callback) {
      const res = await fetch(
        callback + `/messages/${encodeURIComponent(messageId)}`,
        {
          method: "delete",
        }
      );
      await handleFetchResponse(res);
    }
  }
}
