import path from 'path'
import 'dotenv/config'

export const PATHS = {
  dataRoot: process.env.DATA_ROOT ?? path.resolve('./data'),
  logDir:   process.env.LOG_DIR   ?? path.resolve('./logs'),
}
