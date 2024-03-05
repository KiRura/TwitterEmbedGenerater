import { Client, Collection, EmbedBuilder, Events, GatewayIntentBits } from 'discord.js'
import { config } from 'dotenv'
import { Logger } from 'tslog'
import fs from 'fs'
import data from './data.js'
import functions from './functions.js'
config()
const logger = new Logger({ hideLogPositionForProduction: true })
logger.info('loaded modules')

const client = new Client({ intents: Object.values(GatewayIntentBits) })

const eventCommands = new Collection()
const eventFiles = fs.readdirSync('./event').filter(eventFileName => eventFileName.endsWith('.js'))
for (const eventFileName of eventFiles) {
  try {
    const eventCommand = (await import(`./event/${eventFileName}`)).default
    eventCommands.set(eventCommand.name, eventCommand)
    logger.info(`loaded ${eventFileName}`)
  } catch (error) {
    logger.error(`cannot load ${eventFileName}`)
    console.error(error)
  }
}

const commands = new Collection()
const commandFiles = fs.readdirSync('./command').filter(commandFileName => commandFileName.endsWith('.js'))
const registCommands = []
for (const commandFileName of commandFiles) {
  try {
    const command = (await import(`./command/${commandFileName}`)).default
    commands.set(command.data.name, command)
    registCommands.push(command.data.toJSON())
    logger.info(`loaded ${commandFileName}`)
  } catch (error) {
    logger.error(`cannot load ${commandFileName}`)
    console.error(error)
  }
}

client.once(Events.ClientReady, async (client) => {
  const command = eventCommands.get(Events.ClientReady)
  try {
    await command.execute(client, registCommands)
  } catch (error) {
    logger.error('ClientReady Error')
    console.error(error)
  }
})

client.on(Events.MessageCreate, async message => {
  const command = eventCommands.get(Events.MessageCreate)
  try {
    await command.execute(message)
  } catch (error) {
    logger.error('MessageCreate Error')
    console.error(error)
    await (await message.client.users.fetch('606093171151208448')).send(`誰かがエラーを吐いた\n${error}`)
  }
})

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return

  (await (await client.guilds.fetch('1074670271312711740')).channels.fetch('1175747156557189240')).send({
    embeds: [
      new EmbedBuilder()
        .setTitle(interaction.command.name)
        .setAuthor({
          name: `${interaction.user.displayName} | ${interaction.user.id}`,
          iconURL: functions.avatarToURL(interaction.user)
        })
        .setColor(interaction.member?.roles?.color?.color ? interaction.member.roles.color.color : data.mutaoColor)
        .setFooter({
          text: interaction.guild ? `${interaction.guild.name} | ${interaction.guild.id}` : 'DM',
          iconURL: interaction.inGuild() ? interaction.guild.iconURL({ size: 4096 }) : null
        })
    ]
  })

  const command = commands.get(interaction.command.name)
  if (!command) return interaction.reply({ content: `${interaction.command.name}は未実装です。`, ephemeral: true })

  try {
    await command.execute(interaction)
  } catch (error) {
    logger.error(`InteractionCreate (${interaction.command.name}) Error`)
    console.error(error)
    interaction.user.send(`エラーが発生しました。\n${error}`).catch(_error => {})
    await (await interaction.client.users.fetch('606093171151208448')).send(`誰かがエラーを吐いた\n${error}`)
  }
})

client.login(process.env.DISCORD_TOKEN)
