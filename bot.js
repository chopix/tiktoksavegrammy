import {Api, TelegramClient} from "telegram";
import {StringSession} from "telegram/sessions/index.js";
import input from "input"; // для удобства ввода
import ytdl from "ytdl-core";
import fs from "fs";
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import {Bot, InlineKeyboard, InputFile, session} from "grammy";
import {run} from "@grammyjs/runner";
import {open} from 'sqlite';
import sqlite3 from 'sqlite3'
import {FileAdapter} from "@grammyjs/storage-file";
import {getPost, getReel, getStories} from "./inst.js";
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import {TiktokDownloader} from "@tobyg74/tiktok-api-dl";
import {autoRetry} from "@grammyjs/auto-retry";
import {Buffer} from "buffer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const apiId = 21102006;
const apiHash = "b1bd8f4b57de3ba7a0a04d1c93a84a00";
const stringSession = new StringSession("1AgAOMTQ5LjE1NC4xNjcuNDEBuz2p9cQ2FCArVjhl9oexwRL60CbgeLuj3ZghZ38BHL52sfNBVkmLFTjfw1zaRkgCL6qQkIgOPSeNcEmmQEEvlbCoiioSjJTR+cmMPIOxzZA+nJJ4Rnka0Tq3wEmO+xnYdEAyvNZxZBxNoAop5C8K65lgU1REzt37QjGtHOqsz1WPUOnu+WniSQuWZwIRHc1xswbLgQWcm2omd7TN6xc1pYL06G7SCSihVRxhbJlfeuMAG8uKr2iAJ2fTUogi55cMn0BecwW9I+L/KbtLUkoumKAtfRdXuypyWl+rbMFNLhaWxg2oNUoBcUmD8w2tmZ4nv4p+n2y5iQ4mKidF4woB05w="); // Вставьте сюда ваш StringSession, если у вас есть
const botChatId = 6470317776;
ffmpeg.setFfmpegPath("E:\\ffmpeg\\bin\\ffmpeg.exe");

const client = new TelegramClient(stringSession, apiId, apiHash, {connectionRetries: 5});
await client.start({
  phoneNumber: async () => await input.text("Please enter your number: "),
  password: async () => await input.text("Please enter your password: "),
  phoneCode: async () => await input.text("Please enter the code you received: "),
  onError: (err) => console.log(err),
});
console.log(client.session.save())

// (async () => {
//   try {
//     console.log("Loading interactive example...");
//
//     console.log("You should now be connected.");
//     console.log(client.session.save()); // Сохраните это, чтобы не вводить данные каждый раз
//
//     client.addEventHandler(async (event) => {
//       const message = event.message;
//       console.log(event)
//       // if (Number(message.peerId.userId) === botChatId && Number(message.fromId.userId) !== botChatId && message.message.includes('youtu')) {
//       //   console.log(message)
//       //   const parts = message.message.split(' ');
//       //   const url = parts[0];
//       //   const caption = Number(message.fromId.userId);
//       //   console.log(caption)
//       //   const filePath = `vid/${new Date().getTime()}.mp4`;
//       //   try {
//       //     const videoInfo = await ytdl.getInfo(message.message);
//       //     const format = ytdl.chooseFormat(videoInfo.formats, { quality: 'highestvideo' });
//       //     console.log(Number(format.contentLength))
//       //     // Проверяем размер файла. YouTube предоставляет размер в байтах, 2 ГБ = 2 * 1024 * 1024 * 1024 байт
//       //     if (format.contentLength && Number(format.contentLength) > 2 * 1024 * 1024 * 1024) {
//       //       console.error('Размер файла превышает 2 ГБ.');
//       //       await client.sendMessage(botChatId, {message: `FILESIZEJ@E)IKOWADIKAS{DOIPKOI{ASD!@312129083 ${String(caption)}`})
//       //     } else {
//       //       // Если размер не превышает 2 ГБ, продолжаем скачивание
//       //       const videoStream = ytdl.downloadFromInfo(videoInfo, { quality: 'highestvideo' });
//       //       await new Promise((resolve, reject) => {
//       //         const stream = videoStream.pipe(fs.createWriteStream(filePath));
//       //         stream.on('finish', resolve);
//       //         stream.on('error', reject);
//       //       });
//       //       console.log('Video downloaded');
//       //       await client.sendFile(botChatId, { file: filePath, caption: String(caption) });
//       //       fs.unlink(filePath, (err) => {
//       //         if (err) {
//       //           console.error('Ошибка при удалении файла:', err);
//       //         } else {
//       //           console.log('Файл успешно удален');
//       //         }
//       //       });
//       //     }
//       //   } catch (error) {
//       //     console.error('Произошла ошибка:', error);
//       //   }
//       // }
//     }, new NewMessage({}));
//   } catch (e) {console.log(e)}
//
// })();

const bot = new Bot("6470317776:AAFsWwcHisMpU7RfRX7L4oNHYDCgYgK7xK4");

bot.use(session({
  initial() {
    return {};
  },
  storage: new FileAdapter({
    dirName: "sessions",
  }),
}));
bot.api.config.use(autoRetry());

autoRetry({
  maxRetryAttempts: 1, // only repeat requests once
  maxDelaySeconds: 5, // fail immediately if we have to wait >5 seconds
});

bot.command("start", (ctx) => ctx.reply("Здравствуйте! Здесь вы можете скачать любой понравившийся вам пост из Instagram, reels, youtube видео, shorts или tiktok\nДостаточно прислать ссылку этому боту и скачанное видео уже у вас!"));


function splitArrayIntoChunks(array) {
  const chunkSize = 10;
  const chunks = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
}

function getVideoResolution(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, function(err, metadata) {
      if (err) {
        reject("Произошла ошибка при получении информации о видео: " + err);
      } else {
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (videoStream) {
          resolve({
            width: videoStream.width,
            height: videoStream.height,
            duration: metadata.format.duration
          });
        } else {
          reject("Видео поток не найден");
        }
      }
    });
  });
}

bot.on("message:text", async (ctx) => {
  try {
    const text = ctx.message.text;
    const db = await openDb();
    // if(text.includes('shorts')) {
    //   const message = await ctx.reply("⬇️ Шортс качается на сервер...");
    //   const text = ctx.message.text;
    //   const videoInfo = await ytdl.getInfo(text)
    //   let filterFormats = ytdl.filterFormats(videoInfo.formats, 'videoandaudio');
    //   const format = filterFormats.find(f => f.qualityLabel.includes('1080p') || f.qualityLabel.includes('720p'));
    //   console.log(filterFormats)
    //   const videoStream = await ytdl.downloadFromInfo(videoInfo, {format: format})
    //   const filename = new Date().getTime()
    //   const videoPath = `vid/video ${filename}.mp4`;
    //
    //   await new Promise((resolve, reject) => {
    //     const stream = videoStream.pipe(fs.createWriteStream(videoPath));
    //     stream.on('finish', resolve);
    //     stream.on('error', reject);
    //   });
    //   const inputFile = new InputFile(videoPath)
    //   await ctx.replyWithVideo(inputFile, {
    //     width: 1080,
    //     height: 1920,
    //     caption: `🦡 Скачано с @${(await bot.api.getMe()).username}`
    //   })
    //   fs.unlink(videoPath, (err) => {
    //     if (err) {
    //       console.error('Ошибка при удалении файла:', err);
    //     } else {
    //       console.log('Файл успешно удален');
    //     }
    //   });
    //   await ctx.api.deleteMessage(ctx.from.id, message.message_id)
    // }
    if (text.includes("youtu")) {
      let messageToDelete;
      if(text.includes('shorts')) messageToDelete = await ctx.reply("⬇️ Шортс качается на сервер...");
      else messageToDelete = await ctx.reply('⬇️ Видео загружается на сервер...')

      try {
        let format;
        const videoInfo = await ytdl.getInfo(ctx.message.text)
        let filterFormats = ytdl.filterFormats(videoInfo.formats, 'video');
        let audioFormats = ytdl.filterFormats(videoInfo.formats, 'audioonly');
        const mp4Formats = filterFormats.filter(f => f.container === 'mp4')
        console.log(mp4Formats)
        if(text.includes('shorts')) {
          console.log('asdsad')

          format = mp4Formats.find(f => f.qualityLabel.includes('1080p') || f.qualityLabel.includes('720p') || f.qualityLabel.includes('480p') || f.qualityLabel.includes('360p') && f.videoCodec !== 'avc1.4d400d');
        } else {
          format = mp4Formats.find(f => f.qualityLabel.includes('1080p') || f.qualityLabel.includes('720p'));
        }

        console.log(filterFormats)

        if (!format) {
          await ctx.reply(`Формат не найден.`)
          return;
        } else {
          const filename = new Date().getTime()
          const videoPath = `vid/video ${filename}.mp4`;
          const audioPath = `vid/audio ${filename}.mp3`;
          const outputPath = `vid/${filename}.mp4`
          const videoStream = ytdl.downloadFromInfo(videoInfo, {format: format});
          const audioStream = ytdl.downloadFromInfo(videoInfo, {format: audioFormats[0]});
          await new Promise((resolve, reject) => {
            const stream = videoStream.pipe(fs.createWriteStream(videoPath));
            stream.on('finish', resolve);
            stream.on('error', reject);
          });
          await new Promise((resolve, reject) => {
            const stream = audioStream.pipe(fs.createWriteStream(audioPath));
            stream.on('finish', resolve);
            stream.on('error', reject);
          });

          ffmpeg()
            .input(videoPath)
            .input(audioPath)
            .outputOptions([
              '-c:v copy', // Копировать видео дорожку без перекодирования
              '-c:a aac', // Использовать кодек AAC для аудио
              '-movflags +faststart' // Для оптимизации воспроизведения в браузере
            ])
            .save(outputPath)
            .on('error', function (err) {
              console.log('An error occurred: ' + err.message);
            })
            .on('end', async function () {
              console.log('Processing finished !');
              if (format.contentLength && Number(format.contentLength) > 2 * 1024 * 1024 * 1024) {
                console.error('Размер файла превышает 2 ГБ.');
                const entity = await client.getEntity('barsuksave_bot');
                await client.sendMessage(entity, {message: `FILESIZEJ@E)IKOWADIKAS{DOIPKOI{ASD!@312129083 ${ctx.from.id}`})
              } else {
                // Если размер не превышает 2 ГБ, продолжаем скачивание

                ctx.session.messageToDelete = messageToDelete.message_id

                const videoAttributes = [
                  new Api.DocumentAttributeVideo({
                    w: format.width, // Video width
                    h: format.height, // Video height
                    duration: Number(videoInfo.videoDetails.lengthSeconds),
                  })
                ];
                const entity = await client.getEntity('barsuksave_bot');
                await client.sendFile(entity, {
                  file: outputPath, caption: `${String(ctx.from.id)} ${messageToDelete.message_id}`, attributes:videoAttributes, forceDocument: false, workers: 10
                })
                  .then((res) => {
                    fs.unlink(outputPath, (err) => {
                      if (err) {
                        console.error('Ошибка при удалении файла:', err);
                      } else {
                        console.log('Файл успешно удален');
                      }
                    });
                    fs.unlink(videoPath, (err) => {
                      if (err) {
                        console.error('Ошибка при удалении файла:', err);
                      } else {
                        console.log('Файл успешно удален');
                      }
                    });
                    fs.unlink(audioPath, (err) => {
                      if (err) {
                        console.error('Ошибка при удалении файла:', err);
                      } else {
                        console.log('Файл успешно удален');
                      }
                    });
                  }).catch((res) => console.log(res))

              }
            });
        }
      } catch (error) {
        console.error('Произошла ошибка:', error);
      }
      // const keyboard = new InlineKeyboard()
      //   .text('1080p', '1080p')
      //   .text('720p', '720p').row()
      //   .text('480p', '480p')
      //   .text('360p', '360p')
      // ctx.session.downloadLink = ctx.message.text
      // const videoMessage = await ctx.replyWithPhoto(
      //   videoInfo.videoDetails.thumbnails[videoInfo.videoDetails.thumbnails.length - 1].url,
      //   {
      //     caption: `📹 ${videoInfo.videoDetails.title}\n👤 ${videoInfo.videoDetails.author.name}\n\n(Чтобы скачать видео или аудио, используйте кнопки ниже) 🔻`,
      //     reply_markup: keyboard,
      //   }
      // );
      // ctx.session.videoMessage = videoMessage.message_id
      // await ctx.api.deleteMessage(ctx.from.id, message.message_id)
      //
      //
      // const query = 'INSERT INTO Users (m_id, user_id) VALUES (?, ?)';
      // await db.get(query, [message.message_id, ctx.from.id])
    } else if (text.includes('FILESIZEJ@E)IKOWADIKAS{DOIPKOI{ASD!@312129083')) {
      const id = ctx.message.text.split(' ')
      await ctx.api.sendMessage(id[1], 'Размер файла превышает 2 гб. Скачивание отменено.')
      await ctx.api.deleteMessage(ctx.from.id, ctx.session.message)
    } else if (text.includes("tiktok")) {
      const message = await ctx.reply('⬇️ Видео загружается на сервер, подождите немного');
      try {
        TiktokDownloader(ctx.message.text, {
          version: "v3" //  version: "v1" | "v2" | "v3"
        }).then(async (result) => {
          // console.log(result)
          // await ctx.api.sendVideo(ctx.from.id, result.result.video_hd);
          // await ctx.api.deleteMessage(ctx.from.id, message.message_id)
          const response = await fetch(result.result.video2);
          if (!response.ok) throw new Error('Ошибка при скачивании видео');

          const arrayBuffer = await response.arrayBuffer();
          const videoBuffer = Buffer.from(arrayBuffer);
          const videoPath = path.join(__dirname, `vid/tiktok ${new Date().getTime()}.mp4`);

          // Сохраняем видео на диск
          fs.writeFileSync(videoPath, videoBuffer);

          try {
            const file = new InputFile(videoPath)
            // Отправляем видео
            await ctx.replyWithVideo(file, {
              caption: `🦡 Скачано с @${await ctx.me.username}`,
              width: 1080,
              height: 1920
            });
          } catch (error) {
            console.error('Ошибка при отправке видео:', error);
          } finally {
            // Удаляем файл после отправки или при возникновении ошибки
            fs.unlink(videoPath, (err) => {
              if (err) console.error('Ошибка при удалении файла:', err);
              else console.log('Временный файл успешно удалён');
            });
          }
        })

      } catch (error) {
        console.error('Не удалось скачать видео:', error);
      }


      // const url = "https://tiktok-video-no-watermark2.p.rapidapi.com/";
      // const querystring = {url: ctx.message.text, hd: "1"};
      //
      // const headers = {
      //   "X-RapidAPI-Key": "6e00e73d04msh470528aa9da6691p126ae4jsn5bdc16375f91",
      //   "X-RapidAPI-Host": "tiktok-video-no-watermark2.p.rapidapi.com"
      // };
      //
      // try {
      //   const response = await fetch(url + '?' + new URLSearchParams(querystring), {headers});
      //   const data = await response.json();
      //   const link = data.data.play;
      //   // Отправляем видео пользователю
      //   await ctx.api.sendVideo(ctx.from.id, link);
      //   await ctx.api.deleteMessage(ctx.from.id, message.message_id)
      // } catch (error) {
      //   console.error('Произошла ошибка:', error);
      //   await ctx.reply('Произошла ошибка при загрузке видео.');
      // }
    } else if (text.includes(('reel'))) {
      const m = await ctx.reply('⬇️ Рилс загружается на сервер, подождите немного');

      // Предполагаем, что get_reel является асинхронной функцией и возвращает URL видео
      console.log(ctx.message.text)
      const reel = await getReel(ctx.message.text);
      const response = await fetch(reel);
      if (!response.ok) throw new Error('Ошибка при скачивании видео');

      const arrayBuffer = await response.arrayBuffer();
      const videoBuffer = Buffer.from(arrayBuffer);
      const videoPath = path.join(__dirname, `vid/reel ${new Date().getTime()}.mp4`);

      // Сохраняем видео на диск
      fs.writeFileSync(videoPath, videoBuffer);

      try {
        const resolution = await getVideoResolution(videoPath);
        console.log(resolution.width,resolution.height)
        const entity = await client.getEntity('barsuksave_bot');
        const videoAttributes = [
          new Api.DocumentAttributeVideo({
            w: resolution.width, // Video width
            h: resolution.height, // Video height
            duration: Number(resolution.duration),
          })
        ];
        await client.sendFile(entity, {
          file: videoPath, caption: `${String(ctx.from.id)} ${m.message_id}`, attributes:videoAttributes, forceDocument: false, workers: 10
        });
      } catch (error) {
        console.error('Ошибка при отправке видео:', error);
      } finally {
        // Удаляем файл после отправки или при возникновении ошибки
        fs.unlink(videoPath, (err) => {
          if (err) console.error('Ошибка при удалении файла:', err);
          else console.log('Временный файл успешно удалён');
        });
      }

      // Отправляем видео пользователю

      // Удаляем исходное сообщение о загрузке
      // await ctx.api.deleteMessage(ctx.from.id, m.message_id);
      } else if(text.includes('stories')) {
        try {
          const m = await ctx.reply('⬇️ Сторисы загружается на сервер, подождите немного');

          // Предположим, что функция get_stories синхронизирована и возвращает объект со списками фото и видео
          const object = await getStories(ctx.message.text);
          console.log(object)
          if(object.type === 'photo') {
            await ctx.replyWithPhoto(object.url, {caption: `🦡 Скачано с @${ctx.me.username}`});
          } else {
            await ctx.replyWithVideo(object.url, {caption: `🦡 Скачано с @${ctx.me.username}`, width: object.width, height: object.height})
          }
          await ctx.api.deleteMessage(ctx.from.id, m.message_id)
        } catch (e) {
          await ctx.reply('Произошла ошибка при скачке сторис')
          console.log(e)
        };

      //   let media = [];
      //
      //   // Добавляем фотографии
      //   for (const photo of objects.photo) {
      //     media.push({ type: 'photo', media: photo, caption: `скачано с @${ctx.me.username}` });
      //   }
      //
      //   // Добавляем видео
      //   for (const video of objects.video) {
      //     media.push({ type: 'video', media: video, caption: `скачано с @${ctx.me.username}` });
      //   }
      //
      //   // Отправляем группу медиа
      // console.log(media.length)
      // if(media.length <= 10) {
      //   await ctx.replyWithMediaGroup(media);
      // } else {
      //   const chunks = splitArrayIntoChunks(media)
      //   // chunks.forEach((chunk, index) => {
      //   //    ctx.replyWithMediaGroup(chunks[index])
      //   // });
      //   for(const chunk of chunks) {
      //     setTimeout(async () => {
      //       await ctx.replyWithMediaGroup(chunk)
      //     }, 1500)
      //   }
      // }
      
    } else if (text.includes('instagram') && !text.includes('tv')) {
      let m;
      if(text.includes('stories')) m = await ctx.reply('⬇️ Сторисы загружается на сервер, подождите немного');
      else m = await ctx.reply('⬇️ Посты загружается на сервер, подождите немного')

      try {
        const object = await getPost(ctx.message.text);
        console.log(object)
        const username = await bot.api.getMe().then(me => me.username);

        // if(object.type === 'photo') {
        //   await ctx.replyWithPhoto(object.url, {caption: `🦡 Скачано с @${ctx.me.username}`});
        // } else {
        //   await ctx.replyWithVideo(object.url, {caption: `🦡 Скачано с @${ctx.me.username}`})
        // }
        object.map((e, index) => {
          setTimeout(async () => {
            try {
              if(e.type === 'photo') await ctx.replyWithPhoto(e.url, {caption: `🦡 Скачано с @${ctx.me.username}`})
              else await ctx.replyWithVideo(e.url, {caption: `🦡 Скачано с @${ctx.me.username}`})
              console.log('SEND')
            } catch (e) {
              await ctx.reply(`Пост, или один из файлов не был скачан из за ограничений в размере файла.`)
              console.log(e)
            }
          }, index * 1500)
        })


      } catch (error) {
        console.error('Error processing the post:', error);
        await ctx.reply('Ошибка при обработке поста.');
      }

      // Delete the loading message
      await ctx.api.deleteMessage(ctx.from.id, m.message_id)
    } else if(text.includes('instagram') && text.includes('tv')) {
      await ctx.reply(`🦡 Данный формат видео не поддерживается.`)
    }
    else {
      await ctx.reply("⬇️ Введите корректный URL");
    }
  } catch (e) {
    console.log(e)
  }
});

const openDb = async () => {
  return open({
    filename: 'my_database.db',
    driver: sqlite3.Database
  });
};

bot.on(':video', async (ctx) => {
  const db = await openDb();
  try {
    // Предполагаем, что в подписи к видео содержится идентификатор сообщения
    // const messageIdParts = ctx.message.caption.split(' ');
    // const messageId = messageIdParts[messageIdParts.length - 1];
    console.log(ctx.message.caption)
    const splittedCaption = ctx.message.caption.split(' ')

    // Получаем user_id из базы данных
    // const query = 'SELECT m_id FROM Users WHERE user_id = ?';
    // const user = await db.get(query, [ctx.message.caption]);
    // console.log(user)

    // if (user) {
    // Отправляем видео пользователю
    await ctx.api.sendVideo(splittedCaption[0], ctx.message.video.file_id, {
      caption: `🦡 Скачано с @${ctx.me.username}`,
      width: 1920,
      height: 1080
    });

    // Удаляем сообщение у пользователя
    await ctx.api.deleteMessage(splittedCaption[0], splittedCaption[1])

    // Удаляем запись из базы данных
    // await db.run('DELETE FROM Users WHERE m_id = ?', [user.m_id]);
    // }
  } catch (error) {
    console.error('Error handling video message:', error);
  } finally {
    // Закрываем соединение с базой данных
    await db.close();
  }
});

run(bot);