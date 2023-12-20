/* eslint-disable no-unused-vars */
import { Message, Events, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js'
import { fetch } from 'undici'
export default {
  name: Events.MessageCreate,
  /**
   * @param {Message} message
   * @returns
   */
  async execute (message) {
    if ((message.content.match('https://twitter.com/') || message.content.match('https://x.com/')) && message.content.match('status')) {
      const replaced = message.content.match(/https?:\/\/[-_.!~*\\'()a-zA-Z0-9;\\/?:\\@&=+\\$,%#]+/g)
      const embed = []
      let description = ''

      for (let url of replaced) {
        if (url.match('https://twitter.com/')) {
          url = url.replace('twitter.com', 'api.fxtwitter.com')
        } else if (url.match('https://x.com/')) {
          url = url.replace('x.com', 'api.fxtwitter.com')
        }
        let result
        try {
          result = await (await fetch(url)).json()
        } catch (error) {
          return
        }
        if (result.tweet.media?.videos) {
          for (const media of result.tweet.media.videos) {
            description = `${description === '' ? '' : '\n'}[動画URL](${media.url})`
          }
        }

        embed.push(new EmbedBuilder()
          .setAuthor({ name: `${result.tweet.author.name} (@${result.tweet.author.screen_name})`, iconURL: result.tweet.author.avatar_url })
          .setDescription(`${result.tweet.text}`)
          .setImage(result.tweet.media?.photos ? result.tweet.media.photos[0].url + '?name=orig' : null)
          .setTimestamp(new Date(result.tweet.created_at))
          .setFooter({ text: `❤️${result.tweet.likes} ♻️${result.tweet.retweets} 📈${result.tweet.views} | ${result.tweet.source}` })
          .setURL(result.tweet.url)
          .setColor(1941746)
        )
        if (result.tweet.media?.photos) {
          result.tweet.media.photos.shift()
          for (const media of result.tweet.media.photos) {
            embed.push(new EmbedBuilder()
              .setURL(result.tweet.url)
              .setImage(media.url + '?name=orig')
            )
          }
        }

        if (result.tweet.quote) {
          embed.push(new EmbedBuilder()
            .setAuthor({ name: `${result.tweet.quote.author.name} (@${result.tweet.quote.author.screen_name})`, iconURL: result.tweet.quote.author.avatar_url })
            .setTitle('引用元')
            .setDescription(`${result.tweet.quote.text}`)
            .setImage(result.tweet.quote.media?.photos ? result.tweet.quote.media.photos[0].url + '?name=orig' : null)
            .setTimestamp(new Date(result.tweet.quote.created_at))
            .setFooter({ text: `❤️${result.tweet.quote.likes} ♻️${result.tweet.quote.retweets} 📈${result.tweet.quote.views} | ${result.tweet.quote.source}` })
            .setURL(result.tweet.quote.url)
            .setColor(1941746)
          )

          if (result.tweet.quote.media?.photos) {
            result.tweet.quote.media.photos.shift()
            for (const media of result.tweet.quote.media.photos) {
              embed.push(new EmbedBuilder()
                .setURL(result.tweet.quote.url)
                .setImage(media.url + '?name=orig')
              )
            }
          }

          if (result.tweet.quote.media?.videos) {
            for (const media of result.tweet.quote.media.videos) {
              description = `${description === '' ? '' : '\n'}[引用元動画URL](${media.url})`
            }
          }
        }
      }

      message.reply({ embeds: embed, allowedMentions: { repliedUser: false } }).catch(_error => {})
      if (description !== '') {
        message.channel.send(description)
      }
    }
  }
}
