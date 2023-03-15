import { Context, Schema } from 'koishi'
import { OpenCC } from 'opencc'

export const name = 'chinese-tools'

export interface Config {
  pua?: boolean
  cmd?: boolean
}

export const Config: Schema<Config> = Schema.object({
  pua: Schema.boolean().default(false).description('是否纠正用户的不规范输入'),
  cmd: Schema.boolean().default(true).description('是否启用命令'),
})

export function apply(ctx: Context, config: Config) {
  ctx.chineseTools = new ChineseTools(ctx, config)
}

declare module 'koishi' {
  interface Context {
    chineseTools: ChineseTools
  }
}

class ChineseTools {
  private s2tConverter = new OpenCC('s2t.json')
  private t2sConverter = new OpenCC('t2s.json')

  constructor(private ctx: Context, private config: Config) {
    this.setupCommands()
  }

  private setupCommands() {
    if (this.config.cmd) {
      this.ctx.command('pangu <text...>', '规范化中文排版')
        .alias('盘古')
        .option('转简体', '-s')
        .option('转繁体', '-t')
        .action(async ({ session, options }, text) => {
          if (!text) session.execute('help pangu')
          let result = this.pangu(text)
          if (options.转繁体) result = await this.s2t(result)
          if (options.转简体) result = await this.t2s(result)
          return result
        })
    }

    if (this.config.pua) {
      this.ctx.middleware(async (session, next) => {
        const text = session.content
        if (text.length > 50) return next()
        const result = this.pangu(text)
        session.send(result)
        return next()
      })
    }
  }

  private async s2t(text: string): Promise<string> {
    return this.s2tConverter.convertPromise(text)
  }

  private async t2s(text: string): Promise<string> {
    return this.t2sConverter.convertPromise(text)
  }

  private pangu(text: string): string {
    // ... 其他代码
    let result = text

    // 将 koishi 转换为 Koishi
    result = result.replace(/koishi/g, 'Koishi')

    // 全角英文、数字转成半角字符
    result = result.replace(/[\uff10-\uff19\uff21-\uff3a\uff41-\uff5a]/g,
      char => String.fromCharCode(char.charCodeAt(0) - 0xfee0))

    // 中文前后的半角标点转成全角标点
    result = result
      .replace(/([\u4e00-\u9fa5]),/g, '$1，')
      .replace(/,([\u4e00-\u9fa5])/g, '，$1')
      .replace(/([\u4e00-\u9fa5])\./g, '$1。')
      .replace(/\.([\u4e00-\u9fa5])/g, '。$1')
      .replace(/([\u4e00-\u9fa5]);/g, '$1；')
      .replace(/;([\u4e00-\u9fa5])/g, '；$1')
      .replace(/([\u4e00-\u9fa5]):/g, '$1：')
      .replace(/:([\u4e00-\u9fa5])/g, '：$1')
      .replace(/([\u4e00-\u9fa5])\?/g, '$1？')
      .replace(/\?([\u4e00-\u9fa5])/g, '？$1')
      .replace(/([\u4e00-\u9fa5])!/g, '$1！')
      .replace(/!([\u4e00-\u9fa5])/g, '！$1')

    // 中英文字符间增加一个半角空白
    result = result
      .replace(/([\u4e00-\u9fa5])([A-Za-z0-9])/g, '$1 $2')
      .replace(/([A-Za-z0-9])([\u4e00-\u9fa5])/g, '$1 $2')

    // 连续的句号自动转省略号
    result = result.replace(/(\.{3,}|。{3,})/g, '…')

    // 感叹号、问号最多允许连续重复 3 次
    result = result
      .replace(/!{4,}/g, '!!!')
      .replace(/！{4,}/g, '！！！')
      .replace(/\?{4,}/g, '???')
      .replace(/？{4,}/g, '？？？')

    // 其他中文标点符号不允许重复出现
    result = result.replace(/([。，、；：])[。，、；：]/g, '$1')

    // 剔除不可见空白
    result = result.replace(/\u200B/g, '').trim()
    return result
  }
}
