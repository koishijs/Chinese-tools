import { App } from 'koishi'
import memory from '@koishijs/plugin-database-memory'
import mock from '@koishijs/plugin-mock'
import * as _pangu from '../src'

const app = new App()

app.plugin(memory)
app.plugin(mock)
app.plugin(_pangu)

const client = app.mock.client('123')

before(async () => {
  await app.start()
})

it('cmd', async () => {
  await client.shouldReply('pangu 你好koishi', '你好 Koishi')
  await client.shouldReply('盘古 this是一段,测试', 'this 是一段，测试')
  await client.shouldReply('pangu 啊？？？？', '啊？？？')
  await client.shouldReply('pangu 好耶！！！！', '好耶！！！')
  await client.shouldReply('pangu 未完待续。。。。', '未完待续…')
  await client.shouldReply('pangu 。。，，、、；；：：', '。，、；：')
  await client.shouldReply('pangu 这里有一个​空格​', '这里有一个空格')
  await client.shouldNotReply('pong')
})
