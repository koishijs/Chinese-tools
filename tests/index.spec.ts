import { App } from 'koishi'
import memory from '@koishijs/plugin-database-memory'
import mock from '@koishijs/plugin-mock'
import * as ping from '../src'

const app = new App()

app.plugin(memory)
app.plugin(mock)
app.plugin(ping)

const client = app.mock.client('123')

before(async () => {
  await app.start()
})

it('basic usage', async () => {
  await client.shouldReply('ping', 'pong')
  await client.shouldNotReply('pong')
})
