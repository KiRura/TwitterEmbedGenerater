/* eslint-disable no-unused-vars */
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import data from '../data.js'

export default {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('指定した埋め込みを削除')
    .addStringOption(option => option
      .setName('id')
      .setDescription('メッセージID')
      .setRequired(true)
    ),
  /**
   * @param {Client} client
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute (interaction) {
    const id = interaction.options.getString('id')
    let message
    try {
      message = await interaction.channel.messages.fetch(id)
    } catch (error) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle('メッセージが見つかりませんでした。')
          .setDescription('以下のいずれかの理由で見つかりませんでした。\n- 指定されたIDがメッセージIDでない\n- メッセージが存在していない\n- メッセージが見えない')
          .setColor(data.redColor)
        ],
        ephemeral: true
      })
    }

    if (message.author.id !== '1165573087958401084') {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle('指定されたメッセージの送信者がBOTではありません。')
          .setColor(data.redColor)
        ]
      })
    }

    message.delete()
      .then(() => interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('削除が完了しました。')
            .setColor(data.greenColor)
        ]
      }))
      .catch(error => interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('削除できませんでした。')
            .setDescription(error)
            .setColor(data.redColor)
        ]
      }))
  }
}
