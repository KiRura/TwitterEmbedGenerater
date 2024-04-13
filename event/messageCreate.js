/* eslint-disable no-unused-vars */
import { Message, Events, EmbedBuilder } from "discord.js";
import { fetch } from "undici";
import data from "../data.js";
import functions from "../functions.js";

export default {
  name: Events.MessageCreate,
  /**
   * @param {Message} message
   * @returns
   */
  async execute(message) {
    if (
      message.content.match("t!ttps://twitter.com/") ||
      message.content.match("t!ttps://x.com/")
    ) {
      message.content = message.content
        .replaceAll("t!ttps://x.com/", "t!ttps://twitter.com/")
        .replaceAll("t!ttps://twitter.com/", "https://api.fxtwitter.com/");
      let replaced = message.content.match(
        /https:\/\/api.fxtwitter.com?\/[-_.!~*\\'()a-zA-Z0-9;\\/?:\\@&=+\\$,%#]+/g
      );
      replaced = Array.from(new Set(replaced));
      let description = "";
      const embeds = []; // 最終的に送信する埋め込み
      const images = []; // 画像の複数枚表示用

      const resultEmbeds = await Promise.all(
        replaced.map(async url => {
          // 最終的に送信する画像以外の埋め込み
          if (message.content.match(`\\|\\|${url}\\|\\|`)) return;
          const result = await (await fetch(url)).json();
          if (result.code !== 200) return;
          const tweets = [];
          if (result.user) tweets.push(result.user);
          if (result.tweet) tweets.push(result.tweet);
          if (result.tweet && result.tweet.quote) {
            result.tweet.quote.quote = "true";
            tweets.push(result.tweet.quote);
          }

          return tweets.map(t => {
            // 引用ツイを含む主要な埋め込み達
            if (t.name) {
              // ユーザー用
              return new EmbedBuilder()
                .setTitle(t.name)
                .setDescription(
                  `${t.description}\n${
                    t.website ? `\n🔗 ${t.website.url}` : ""
                  }${t.location ? `\n📍 ${t.location}` : ""}`
                )
                .setURL(t.url)
                .setFooter({
                  text: `👤${functions.shorterNumbers(
                    t.following
                  )} 👥${functions.shorterNumbers(
                    t.followers
                  )} 💭${functions.shorterNumbers(
                    t.tweets
                  )} ♥️${functions.shorterNumbers(t.likes)}`
                })
                .setTimestamp(new Date(t.joined))
                .setAuthor({
                  name: `@${t.screen_name}`,
                  iconURL: t.avatar_url || null
                })
                .setColor(data.twitterColor)
                .setImage(t.banner_url || null);
            }

            if (t.media?.videos) {
              // 動画はURLだけ埋め込みとは別で送信する
              for (const media of t.media.videos) {
                description = `${description === "" ? "" : `${description} `}[${
                  t.quote === "true" ? "引用元動画URL" : "動画URL"
                }](${media.url})`;
              }
            }

            const embed = new EmbedBuilder();
            if (t.media?.photos) {
              // 画像の複数枚表示用
              let i = 0;
              for (const media of t.media.photos) {
                if (i === 0) {
                  embed.setImage(media.url + "?name=orig");
                } else {
                  images.push(
                    new EmbedBuilder()
                      .setURL(t.url)
                      .setImage(media.url + "?name=orig")
                  );
                }

                i++;
              }
            }

            let poll;
            if (t.poll) {
              poll = t.poll.choices.map(choice => {
                return `${functions.percentageToBar(choice.percentage)}\n**${
                  choice.label
                }:** ${choice.percentage}%`;
              });
            }

            return embed // 埋め込み
              .setTitle(t.quote === "true" ? "引用元" : null)
              .setAuthor({
                name: `${t.author.name} (@${t.author.screen_name})`,
                iconURL: t.author.avatar_url,
                url: t.author.url
              })
              .setDescription(
                `${t.text}${
                  t.poll
                    ? `\n\n${poll.join("\n")}\n\n` +
                      `合計: ${t.poll.total_votes}`
                    : ""
                }\n\n<:like:1228491553719189595> ${functions.shorterNumbers(
                  t.likes
                )} ｜ <:retweet:1228492442563510303> ${functions.shorterNumbers(
                  t.retweets
                )} ｜ <:impression:1228493304442912798> ${functions.shorterNumbers(
                  t.views
                )}`
              )
              .setTimestamp(new Date(t.created_at))
              .setFooter({
                text: t.source || null
              })
              .setURL(t.url)
              .setColor(data.twitterColor);
          });
        })
      );

      if (!resultEmbeds?.length) return;
      for (const object of resultEmbeds) {
        if (!object?.length) return;
        for (const object2 of object) {
          if (!object2?.length) return;
          embeds.push(object2);
        }
      }
      for (const object of images) {
        embeds.push(object);
      }
      if (!embeds?.length) return;

      message
        .reply({ embeds, allowedMentions: { repliedUser: false } })
        .catch(_error => {});
      if (description !== "") message.channel.send(description);
    }
  }
};
