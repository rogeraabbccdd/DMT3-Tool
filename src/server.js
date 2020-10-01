/* global __static */

import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import csv from 'fast-csv'
import fs from 'fs'
import fse from 'fs-extra'
import { once } from 'events'
import path from 'path'
import ini from 'ini'
import md5File from 'md5-file'
import del from 'del'
import childProcess from 'child_process'
import { shell } from 'electron'

const exec = childProcess.execFile

const server = express()

server.use(bodyParser.urlencoded({
  extended: true
}))
server.use(bodyParser.json())
server.use(cors({
  origin: (origin, callback) => {
    callback(null, true)
  },
  methods: 'GET, POST',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

const gameDiscInfoFolder = 'Resource/DiscInfo/'
const gameFileDiscStock = 'discstock.csv'
const gameFileStages = {
  star1: 'star_stage_1.csv',
  star2: 'star_stage_2.csv',
  star3: 'star_stage_3.csv',
  pop1: 'pop_stage_1.csv',
  pop2: 'pop_stage_2.csv',
  pop3: 'pop_stage_3.csv'
}

const gameConfig = 'Resource/config/setting.ini'

// md5 hash of note_basic.png, for checking note
const md5Notes = [
  '2ce3417f6e39511b5fd8560d697c0a06',
  '879f56080ba1ecf1e5e674f1739215ed',
  '4e6d9a683fc86803aacc301ec660c7b8',
  'ad4fd693bc487000494b26295515ec0b',
  '080d9fe85c0d271e25e17b304d54bd3a',
  '94356962e40d2eefc089adab029f4935',
  '6765f61155ab19e0632761a5da0aee51',
  '6e83c51f10500e2427c18e22c1dabcfd',
  'eb9c7ce14f559451b2405efd908bd6d9',
  '793ca4049e59871b0c6b43366695f1d2',
  '9cccc76ebf9d0bc0f1534690e10fe84c',
  '6ee5117ee16b79514898f364a3c6e75a',
  '93139127d77325780e229f4386ad87d0'
]

// md5 hash of max/max.vce, for checking note
// 0, 9, 10 are ad411d4069006099c3fe922f8a0dfd39
const md5Bombs = [
  '7a0158b60617b31dcaeb2c7c6f1b5539',
  'e519c59919f8efed0eff68a48cef0c2c',
  '8a45c8ce1b3e578b0eaf6946436c80df',
  '7d9178551bea05e53344356f940ba6d3',
  '89ca479867a60623b470a8a9faf7f1ff',
  '1ef2dacf3a534e6aa9c2889784109ac9',
  '41e0f4fd55935733f386e962d118259b',
  '62cd42668af45cf77bc56ea2db3643c2',
  '',
  '',
  '7f820661fc8c1f321c7fb3c3eff0b000',
  '388cfbe041482c17d0a292858951b32c',
  ''
]

let userPath = ''

// DMT3 is released in 2011/10/27 :)
server.listen(1027)

const validPath = async (rootpath) => {
  const exists = await fse.pathExists(rootpath + 'Client.exe')
  return exists
}

const readData = async () => {
  const songs = []
  const stage = []
  const settings = {}
  let exists = await fse.pathExists(userPath + gameDiscInfoFolder + gameFileDiscStock)
  if (exists === false) {
    await copyData(true, true)
  }

  let discStreeam = fs.createReadStream(userPath + gameDiscInfoFolder + gameFileDiscStock, 'utf16le')
    .pipe(csv.parse({ delimiter: '\t', headers: true, quote: '\'', escape: '\\', ignoreEmpty: true }))
    .on('data', (data) => {
      songs.push(data)
    })
  await once(discStreeam, 'finish')

  for (let file in gameFileStages) {
    const stageStream = fs.createReadStream(userPath + gameDiscInfoFolder + gameFileStages[file])
      .pipe(csv.parse({ delimiter: ',', quote: '`', escape: '\\', ignoreEmpty: true }))
      .on('data', (data) => {
        if (!isNaN(parseInt(data[0]))) stage.push(data)
      })

    await once(stageStream, 'finish')
  }

  const config = ini.parse(fs.readFileSync(userPath + gameConfig, 'utf-8'))
  settings.dev_mode = config.setting.dev_mode
  settings.fullscreen = config.setting.fullscreen
  settings.show_cursor = config.setting.show_cursor
  settings.vsync = config.setting.vsync
  settings.sfx_volume = config.setting.sfx_volume
  settings.bgm_volume = config.setting.bgm_volume

  let note = {
    note: 0,
    bomb: 0
  }
  exists = await fse.pathExists(userPath + 'Resource/maingame/note/pop/0/note_basic.png')
  if (exists === false) {
    await copyData(true, true)
  }
  if (exists) {
    const md5 = await md5File(userPath + 'Resource/maingame/note/pop/0/note_basic.png')
    note.note = md5Notes.indexOf(md5) + 1
  }

  exists = await fse.pathExists(userPath + 'Resource/maingame/coolbomb/0/max/max.vce')
  if (exists === false) {
    await copyData(true, true)
  }
  if (exists) {
    const md5 = await md5File(userPath + 'Resource/maingame/coolbomb/0/max/max.vce')
    note.bomb = md5Bombs.indexOf(md5) + 1
  }

  return { songs, stage, settings, note }
}

const copyData = async (disc, stage) => {
  let exists = await fse.pathExists(userPath + gameDiscInfoFolder + gameFileDiscStock)
  if (exists === false || disc === true) {
    const filepath = path.join(__static, 'files/' + gameFileDiscStock)
    await fse.copy(filepath, userPath + gameDiscInfoFolder + gameFileDiscStock, { overwrite: true })
  }
  for (let file in gameFileStages) {
    exists = await fse.pathExists(userPath + gameDiscInfoFolder + gameFileStages[file])
    if (exists === false || stage === true) {
      const filepath = path.join(__static, 'files/' + gameFileStages[file])
      await fse.copy(filepath, userPath + gameDiscInfoFolder + gameFileStages[file], { overwrite: true })
    }
  }

  // check official songs difficulty after reset stage
  if (!disc && stage) {
    const songs = []
    const discStreeam = fs.createReadStream(userPath + gameDiscInfoFolder + gameFileDiscStock, 'utf16le')
      .pipe(csv.parse({ delimiter: '\t', headers: true, quote: '\'', escape: '\\', ignoreEmpty: true }))
      .on('data', (data) => {
        songs.push(data)
      })
    await once(discStreeam, 'finish')

    const stagearr = []
    for (let file in gameFileStages) {
      const stageStream = fs.createReadStream(userPath + gameDiscInfoFolder + gameFileStages[file])
        .pipe(csv.parse({ delimiter: ',', quote: '`', escape: '\\', ignoreEmpty: true }))
        .on('data', (data) => {
          if (!isNaN(parseInt(data[0]))) stagearr.push(data)
        })

      await once(stageStream, 'finish', async () => {
        await fs.unlink(userPath + gameDiscInfoFolder + gameFileStages[file], (err) => {
          if (err) throw err
        })
      })
    }

    for (let s in stagearr) {
      const data = songs.filter(song => {
        return parseInt(song.no) === parseInt(stagearr[s][0])
      })[0]

      if (stagearr[s][0] === data.no.toString()) {
      // star mixing 9 * 6 * 3 = 162
        if (s < 162) {
          if (data.Star_1 > 0 || data.Star_2 > 0 || data.Star_3 > 0 || data.Star_4 > 0) {
            if (data.Star_1 === '0') {
              stagearr[s][2] = 0
              stagearr[s][3] = 0
              stagearr[s][4] = 0
            } else if (data.Star_1 > 0 && stagearr[s][3] === '0') {
              stagearr[s][2] = 2
              stagearr[s][3] = 1
              stagearr[s][4] = 0
            }
            if (data.Star_2 === '0') {
              stagearr[s][5] = 0
              stagearr[s][6] = 0
              stagearr[s][7] = 0
            } else if (data.Star_2 > 0 && stagearr[s][6] === '0') {
              stagearr[s][5] = 2
              stagearr[s][6] = 2
              stagearr[s][7] = 0
            }
            if (data.Star_3 === '0') {
              stagearr[s][8] = 0
              stagearr[s][9] = 0
              stagearr[s][10] = 0
            } else if (data.Star_3 > 0 && stagearr[s][9] === '0') {
              stagearr[s][8] = 2
              stagearr[s][9] = 3
              stagearr[s][10] = 0
            }
            if (data.Star_4 === '0') {
              stagearr[s][11] = 0
              stagearr[s][12] = 0
              stagearr[s][13] = 0
            } else if (data.Star_4 > 0 && stagearr[s][12] === '0') {
              stagearr[s][11] = 2
              stagearr[s][12] = 4
              stagearr[s][13] = 0
            }
          }
        } else {
          if (data.Pop_1 > 0 || data.Pop_2 > 0 || data.Pop_3 > 0 || data.Pop_4 > 0) {
            if (data.Pop_1 === '0') {
              stagearr[s][2] = 0
              stagearr[s][3] = 0
              stagearr[s][4] = 0
            } else if (data.Pop_1 > 0 && stagearr[s][3] === '0') {
              stagearr[s][2] = 2
              stagearr[s][3] = 1
              stagearr[s][4] = 0
            }
            if (data.Pop_2 === '0') {
              stagearr[s][5] = 0
              stagearr[s][6] = 0
              stagearr[s][7] = 0
            } else if (data.Pop_2 > 0 && stagearr[s][6] === '0') {
              stagearr[s][5] = 2
              stagearr[s][6] = 2
              stagearr[s][7] = 0
            }
            if (data.Pop_3 === '0') {
              stagearr[s][8] = 0
              stagearr[s][9] = 0
              stagearr[s][10] = 0
            } else if (data.Pop_3 > 0 && stagearr[s][9] === '0') {
              stagearr[s][8] = 2
              stagearr[s][9] = 3
              stagearr[s][10] = 0
            }
            if (data.Pop_4 === '0') {
              stagearr[s][11] = 0
              stagearr[s][12] = 0
              stagearr[s][13] = 0
            } else if (data.Pop_4 > 0 && stagearr[s][12] === '0') {
              stagearr[s][11] = 2
              stagearr[s][12] = 4
              stagearr[s][13] = 0
            }
          }
        }
      }
    }

    let count = 0
    for (let file in gameFileStages) {
      const writeStream = fs.createWriteStream(userPath + gameDiscInfoFolder + gameFileStages[file], { flag: 'w' })
      writeStream.write(`stage${gameFileStages[file].slice(-5, -4)},songname,SP,PT,Hid,SP,PT,Hid,SP,PT,Hid,SP,PT,Hid\r\n`)
      for await (let s of stagearr) {
        writeStream.write(s.join(',') + '\r\n')
        count++
        if (count % 54 === 0) {
          count = 0
          stagearr.splice(0, 54)
          break
        }
      }
      writeStream.end()
    }
  }
}

const updateSlot = async (file, slot, page) => {
  let msg = ''
  try {
    const exists = await fse.pathExists(file)
    if (exists === false) {
      const err = `Can't find stage file in game folder`
      throw err
    }
    let stage = []
    const readStream = fs.createReadStream(file)
      .pipe(csv.parse({ delimiter: ',', quote: '`', escape: '\\', ignoreEmpty: true }))
      .on('data', (data) => {
        stage.push(data)
      })
    await once(readStream, 'finish', async () => {
      await fs.unlink(userPath + gameDiscInfoFolder + gameFileStages[file], (err) => {
        if (err) throw err
      })
    })

    let index = (page - 1) * 9 + slot.slotNum + 1

    slot.NM.speed = (slot.NM.speed.value) ? slot.NM.speed.value : slot.NM.speed
    slot.HD.speed = (slot.HD.speed.value) ? slot.HD.speed.value : slot.HD.speed
    slot.MX.speed = (slot.MX.speed.value) ? slot.MX.speed.value : slot.MX.speed
    slot.EX.speed = (slot.EX.speed.value) ? slot.EX.speed.value : slot.EX.speed

    stage[index] = [
      slot.songId, slot.song.name,
      slot.NM.speed, 1, 0
    ]

    if (slot.HD.level > 0) {
      stage[index].push(slot.HD.speed)
      stage[index].push(2)
      stage[index].push(0)
    } else {
      stage[index].push(0)
      stage[index].push(0)
      stage[index].push(0)
    }

    if (slot.MX.level > 0) {
      stage[index].push(slot.MX.speed)
      stage[index].push(3)
      stage[index].push(0)
    } else {
      stage[index].push(0)
      stage[index].push(0)
      stage[index].push(0)
    }

    if (slot.EX.level > 0) {
      stage[index].push(slot.EX.speed)
      stage[index].push(4)
      stage[index].push(0)
    } else {
      stage[index].push(0)
      stage[index].push(0)
      stage[index].push(0)
    }

    const writeStream = fs.createWriteStream(file, { flag: 'w' })
    for await (let s of stage) {
      writeStream.write(s.join(',') + '\r\n')
    }
    writeStream.end()
  } catch (err) {
    msg = err.message
  }
  return msg
}

const customSong = async (data) => {
  let msg = ''
  try {
    let songs = []
    const exists = await fse.pathExists(userPath + gameDiscInfoFolder + gameFileDiscStock)
    if (exists === false) {
      const err = `Can't find songs list file in game folder`
      throw err
    }
    const discStreeam = fs.createReadStream(userPath + gameDiscInfoFolder + gameFileDiscStock, 'utf16le')
      .pipe(csv.parse({ delimiter: '\t', headers: false, quote: '\'', escape: '\\', ignoreEmpty: true }))
      .on('data', (data) => {
        songs.push(data)
      })

    await once(discStreeam, 'finish', async () => {
      await fs.unlink(userPath + gameDiscInfoFolder + gameFileDiscStock, (err) => {
        if (err) throw err
      })
    })

    data.loopBga = parseInt(data.loopBga) === 0 ? 'FALSE' : 'TRUE'
    if (data.mode === 'add') {
      let write = [
        data.songNo,
        data.name,
        data.FullName,
        data.Genre,
        data.Composer,
        `movie${data.Movie}`,
        0, 0, 0,
        data.loopBga,
        data.Star_1,
        data.Star_2,
        data.Star_3,
        data.Star_4,
        data.Pop_1,
        data.Pop_2,
        data.Pop_3,
        data.Pop_4
      ]
      songs.push(write)
    } else {
      const idx = await songs.findIndex((s) => {
        return s[0] === data.songNo
      })
      songs[idx] = [
        data.songNo,
        data.name,
        data.FullName,
        data.Genre,
        data.Composer,
        `movie${data.Movie}`,
        0, 0, 0,
        data.loopBga,
        data.Star_1,
        data.Star_2,
        data.Star_3,
        data.Star_4,
        data.Pop_1,
        data.Pop_2,
        data.Pop_3,
        data.Pop_4
      ]
    }

    songs.sort((a, b) => {
      return parseInt(a[0]) - parseInt(b[0])
    })

    const writeStream = fs.createWriteStream(userPath + gameDiscInfoFolder + gameFileDiscStock, { flag: 'w', encoding: 'utf16le' })
    for await (let s of songs) {
      let w = ''
      for (let ss of s) {
        w += ss + '\t'
      }
      writeStream.write(w + '\r\n')
    }
    writeStream.end()

    // check stages
    const defaultStage = []
    for (let file in gameFileStages) {
      const stageStream = fs.createReadStream(path.join(__static, 'files/' + gameFileStages[file]))
        .pipe(csv.parse({ delimiter: ',', quote: '`', escape: '\\', ignoreEmpty: true }))
        .on('data', (data) => {
          if (!isNaN(parseInt(data[0]))) defaultStage.push(data)
        })

      await once(stageStream, 'finish')
    }

    const stage = []
    for (let file in gameFileStages) {
      const stageStream = fs.createReadStream(userPath + gameDiscInfoFolder + gameFileStages[file])
        .pipe(csv.parse({ delimiter: ',', quote: '`', escape: '\\', ignoreEmpty: true }))
        .on('data', (data) => {
          if (!isNaN(parseInt(data[0]))) stage.push(data)
        })

      await once(stageStream, 'finish', async () => {
        await fs.unlink(userPath + gameDiscInfoFolder + gameFileStages[file], (err) => {
          if (err) throw err
        })
      })
    }

    for (let s in stage) {
      if (stage[s][0] === data.songNo.toString()) {
        // star mixing 9 * 6 * 3 = 162
        if (s < 162) {
          if (data.Star_1 > 0 || data.Star_2 > 0 || data.Star_3 > 0 || data.Star_4 > 0) {
            if (data.Star_1 === '0') {
              stage[s][2] = 0
              stage[s][3] = 0
              stage[s][4] = 0
            } else if (data.Star_1 > 0 && stage[s][3] === '0') {
              stage[s][2] = 2
              stage[s][3] = 1
              stage[s][4] = 0
            }
            if (data.Star_2 === '0') {
              stage[s][5] = 0
              stage[s][6] = 0
              stage[s][7] = 0
            } else if (data.Star_2 > 0 && stage[s][6] === '0') {
              stage[s][5] = 2
              stage[s][6] = 2
              stage[s][7] = 0
            }
            if (data.Star_3 === '0') {
              stage[s][8] = 0
              stage[s][9] = 0
              stage[s][10] = 0
            } else if (data.Star_3 > 0 && stage[s][9] === '0') {
              stage[s][8] = 2
              stage[s][9] = 3
              stage[s][10] = 0
            }
            if (data.Star_4 === '0') {
              stage[s][11] = 0
              stage[s][12] = 0
              stage[s][13] = 0
            } else if (data.Star_4 > 0 && stage[s][12] === '0') {
              stage[s][11] = 2
              stage[s][12] = 4
              stage[s][13] = 0
            }
          } else {
            stage[s] = defaultStage[s]
          }
        } else {
          if (data.Pop_1 > 0 || data.Pop_2 > 0 || data.Pop_3 > 0 || data.Pop_4 > 0) {
            if (data.Pop_1 === '0') {
              stage[s][2] = 0
              stage[s][3] = 0
              stage[s][4] = 0
            } else if (data.Pop_1 > 0 && stage[s][3] === '0') {
              stage[s][2] = 2
              stage[s][3] = 1
              stage[s][4] = 0
            }
            if (data.Pop_2 === '0') {
              stage[s][5] = 0
              stage[s][6] = 0
              stage[s][7] = 0
            } else if (data.Pop_2 > 0 && stage[s][6] === '0') {
              stage[s][5] = 2
              stage[s][6] = 2
              stage[s][7] = 0
            }
            if (data.Pop_3 === '0') {
              stage[s][8] = 0
              stage[s][9] = 0
              stage[s][10] = 0
            } else if (data.Pop_3 > 0 && stage[s][9] === '0') {
              stage[s][8] = 2
              stage[s][9] = 3
              stage[s][10] = 0
            }
            if (data.Pop_4 === '0') {
              stage[s][11] = 0
              stage[s][12] = 0
              stage[s][13] = 0
            } else if (data.Pop_4 > 0 && stage[s][12] === '0') {
              stage[s][11] = 2
              stage[s][12] = 4
              stage[s][13] = 0
            }
          } else {
            stage[s] = defaultStage[s]
          }
        }
      }
    }

    let count = 0
    for (let file in gameFileStages) {
      const writeStream = fs.createWriteStream(userPath + gameDiscInfoFolder + gameFileStages[file], { flag: 'w' })
      writeStream.write(`stage${gameFileStages[file].slice(-5, -4)},songname,SP,PT,Hid,SP,PT,Hid,SP,PT,Hid,SP,PT,Hid\r\n`)
      for await (let s of stage) {
        writeStream.write(s.join(',') + '\r\n')
        count++
        if (count % 54 === 0) {
          count = 0
          stage.splice(0, 54)
          break
        }
      }
      writeStream.end()
    }
  } catch (err) {
    msg = err.message
  }
  return msg
}

const delSongs = async (songNo) => {
  let msg = ''
  let success = false
  try {
    const songs = []

    // read user songs
    let discStreeam = fs.createReadStream(userPath + gameDiscInfoFolder + gameFileDiscStock, 'utf16le')
      .pipe(csv.parse({ delimiter: '\t', headers: false, quote: '\'', escape: '\\', ignoreEmpty: true }))
      .on('data', (data) => {
        songs.push(data)
      })

    await once(discStreeam, 'finish', async () => {
      await fs.unlink(userPath + gameDiscInfoFolder + gameFileDiscStock, (err) => {
        if (err) throw err
      })
    })

    const idx = await songs.findIndex((s) => {
      return s[0] === songNo
    })

    songs.splice(idx, 1)

    let writeStream = fs.createWriteStream(userPath + gameDiscInfoFolder + gameFileDiscStock, { flag: 'w', encoding: 'utf16le' })
    for await (let s of songs) {
      let w = ''
      for (let ss of s) {
        w += ss + '\t'
      }
      writeStream.write(w + '\r\n')
    }
    writeStream.end()

    // check stages
    const defaultStage = []
    for (let file in gameFileStages) {
      const stageStream = fs.createReadStream(path.join(__static, 'files/' + gameFileStages[file]))
        .pipe(csv.parse({ delimiter: ',', quote: '`', escape: '\\', ignoreEmpty: true }))
        .on('data', (data) => {
          if (!isNaN(parseInt(data[0]))) defaultStage.push(data)
        })

      await once(stageStream, 'finish')
    }

    // user stage
    const stage = []
    for (let file in gameFileStages) {
      const stageStream = fs.createReadStream(userPath + gameDiscInfoFolder + gameFileStages[file])
        .pipe(csv.parse({ delimiter: ',', quote: '`', escape: '\\', ignoreEmpty: true }))
        .on('data', (data) => {
          if (!isNaN(parseInt(data[0]))) stage.push(data)
        })

      await once(stageStream, 'finish', async () => {
        await fs.unlink(userPath + gameDiscInfoFolder + gameFileStages[file], (err) => {
          if (err) throw err
        })
      })
    }

    for (let s in stage) {
      if (stage[s][0] === songNo) {
        stage[s] = defaultStage[s]
      }
    }

    let count = 0
    for (let file in gameFileStages) {
      const writeStream = fs.createWriteStream(userPath + gameDiscInfoFolder + gameFileStages[file], { flag: 'w' })
      writeStream.write(`stage${gameFileStages[file].slice(-5, -4)},songname,SP,PT,Hid,SP,PT,Hid,SP,PT,Hid,SP,PT,Hid\r\n`)
      for await (let s of stage) {
        writeStream.write(s.join(',') + '\r\n')
        count++
        if (count % 54 === 0) {
          count = 0
          stage.splice(0, 54)
          break
        }
      }
      writeStream.end()
    }

    success = true
  } catch (e) {
    msg = e.message
  }
  return { success, msg }
}

const saveGames = async (data) => {
  const config = ini.parse(fs.readFileSync(userPath + gameConfig, 'utf-8'))
  config.setting.dev_mode = data.dev_mode
  config.setting.fullscreen = data.fullscreen
  config.setting.show_cursor = data.show_cursor
  config.setting.vsync = data.vsync
  config.setting.sfx_volume = data.sfx_volume
  config.setting.bgm_volume = data.bgm_volume
  fs.writeFileSync(userPath + gameConfig, ini.stringify(config))
}

const chageNote = async (data) => {
  let msg = ''
  let success = false
  try {
    // note
    await del(userPath + 'Resource/maingame/note/pop/0/**', { force: true })
    if (data.note > 0) {
      const filepath = path.join(__static, 'notes/notes/' + data.note)
      await fse.copy(filepath, userPath + 'Resource/maingame/note/pop/0/', { overwrite: true })
      await fse.copy(filepath, userPath + 'Resource/maingame/note/star/0/', { overwrite: true })
    }

    // bomb
    await del(userPath + 'Resource/maingame/coolbomb/0/**', { force: true })
    if (data.bomb > 0) {
      const filepath = path.join(__static, 'notes/coolbomb/' + data.bomb)
      await fse.copy(filepath, userPath + 'Resource/maingame/coolbomb/0/', { overwrite: true })
    }

    success = true
  } catch (err) {
    msg = err.message
  }
  return { success, msg }
}

// init
server.post('/init', async (req, res) => {
  let success = false
  let msg = ''
  let songs = []
  let stage = []
  let settings = {}
  let note = 0
  let datapath = req.body.path
  const valid = await validPath(datapath)
  if (valid === true) {
    userPath = datapath
    await readData().then((data) => {
      success = true
      songs = data.songs
      stage = data.stage
      settings = data.settings
      note = data.note
    }).catch((err) => {
      msg = err.message
    })
  } else {
    userPath = ''
    msg = `Can't find CLIENT.EXE in selected folder`
  }

  res.json({ success, msg, songs, stage, settings, note })
})

// validate settings, check folder exist
server.post('/saveSettings', async (req, res) => {
  let datapath = req.body.path
  let success = false
  let msg = ''
  const valid = await validPath(datapath)
  if (valid === true) {
    userPath = datapath
    await copyData(false, false)
    success = true
  } else {
    userPath = ''
    msg = `Can't find CLIENT.EXE in selected folder`
  }
  res.json({ success, msg })
})

server.post('/saveSlot', async (req, res) => {
  let slot = req.body.slot
  let page = req.body.page
  let file = userPath + gameDiscInfoFolder + req.body.mode + '_stage_' + req.body.num + '.csv'
  let success = false
  let msg = ''
  await updateSlot(file, slot, page).then((res) => {
    if (res === '') {
      success = true
    } else {
      msg = res
    }
  }).catch((err) => {
    msg = err.message
  })
  res.json({ success, msg })
})

server.get('/resetStage', async (req, res) => {
  const exist = await validPath(userPath)
  if (exist) {
    await copyData(false, true)
    res.json({ success: true, msg: '' })
  } else {
    userPath = ''
    res.json({ success: false, msg: `Can't find CLIENT.EXE in selected folder` })
  }
})

server.get('/resetSongs', async (req, res) => {
  const exist = await validPath(userPath)
  if (exist) {
    await copyData(true, true)
    res.json({ success: true, msg: '' })
  } else {
    userPath = ''
    res.json({ success: false, msg: `Can't find CLIENT.EXE in selected folder` })
  }
})

server.post('/custom', async (req, res) => {
  let data = req.body
  let success = false
  let msg = ''
  await customSong(data).then((res) => {
    if (res === '') {
      success = true
    } else {
      msg = res
    }
  }).catch((err) => {
    msg = err.message
  })

  res.json({ success, msg })
})

server.get('/eyecatch/:name', async (req, res) => {
  let custom = userPath + '/Resource/eyecatch/song/' + req.params.name + '_0.jpg'
  let exists = await fse.pathExists(custom)
  if (exists) {
    res.sendFile(custom)
    return
  }
  let official = path.join(__static, `eyecatch/${req.params.name}_1.jpg`)
  exists = await fse.pathExists(official)
  exists ? res.sendFile(official) : res.sendFile(path.join(__static, 'eyecatch/placeholder.jpg'))
})

server.post('/saveGame', async (req, res) => {
  let data = req.body
  let success = false
  let msg = ''
  await saveGames(data).then(() => {
    success = true
  }).catch((err) => {
    msg = err.message
  })

  res.json({ success, msg })
})

server.post('/del', async (req, res) => {
  let songNo = req.body.songNo
  let success = false
  let msg = ''
  await delSongs(songNo).then((data) => {
    success = data.success
    msg = data.msg
  }).catch((err) => {
    msg = err.message
  })

  res.json({ success, msg })
})

server.post('/note', async (req, res) => {
  let note = req.body.note
  let success = false
  let msg = ''
  await chageNote(note).then((data) => {
    success = data.success
    msg = data.msg
  }).catch((err) => {
    msg = err.message
  })

  res.json({ success, msg })
})

server.get('/play', async (req, res) => {
  exec(userPath + 'Client.exe')
  res.send('')
})

server.get('/folder', async (req, res) => {
  shell.showItemInFolder(userPath + 'Client.exe')
  res.send('')
})
