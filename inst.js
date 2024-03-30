import fetch from 'node-fetch'
import cheerio from 'cheerio'
import instagramDL from '@sasmeee/igdl'

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
  // Добавьте дополнительные строки с разными агентами пользователя по желанию
];
const randomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

export async function getPost(url) {
  const link = `https://storiessaver.org/api/photo?url=${url}`
  const headers = { 'User-Agent': randomUserAgent(), 'Content-Type': 'application/json' };
  const request = await fetch(link, { method: 'GET', headers: headers });
  const response = await request.json()
  const data = response.data.child_medias_hd
  let res = []
  data.forEach(e => {
    if(e.type === 'image') {
      res.push({type: 'photo', url: e.url})
    } else {
      res.push({type: 'video', url: e.url})
    }
  })
  return res
}

export async function getReel(url) {
  const dataList = await instagramDL(url);
  console.log(url)
  console.log(dataList)
  return dataList[0].download_link
}

export async function getStories(url) {
  // const link = 'https://www.save-free.com/process';
  // const headers = { 'User-Agent': randomUserAgent(), 'Content-Type': 'application/json' };
  // const username = url.split('/')[4];
  // console.log(username)
  // const data = { instagram_url: username, type: 'story', resource: 'save' };
  // const response = await fetch(link, { method: 'POST', body: new URLSearchParams(data), headers: headers });
  // console.log(response)
  const link = `https://storiessaver.org/api/stories?url=${url}`
  const regex = /\/([^/]+)\/$/;
  const match = url.match(regex);
  const identifier = match[1];
  console.log(identifier)

  const headers = { 'User-Agent': randomUserAgent(), 'Content-Type': 'application/json' };
  const request = await fetch(link, { method: 'GET', headers: headers });
  const response = await request.json()
  const data = response.data.data.stories
  const story = data.find(s => s.pk === identifier)
  console.log(story)
  if(story.video_versions) {
    return {
      type: 'video',
      url: story.video_versions[0].url,
      width: story.video_versions[0].width,
      height: story.video_versions[0].height
    }
  } else {
    return {
      type: 'photo',
      url: story.image_versions2.candidates[0].url,
      width: story.image_versions2.candidates[0].width,
      height: story.image_versions2.candidates[0].height,
    }
  }
  // const dataList = await instagramDL(url);
  // let res = {
  //   video: [],
  //   photo: [],
  // }
  // dataList.forEach(e => {
  //   if(e.download_link.includes('scontent')) res.photo.push(e.download_link)
  //   else if(e.download_link.includes('download') || e.download_link.includes('ig95')) res.video.push(e.download_link)
  // })
  // console.log(dataList)
  // return res;
  // const text = await response.text();
  // const $ = cheerio.load(text);
  //
  // const res = { video: [], photo: [] };
  // const fetchPromises = [];
  //
  // const card = $('.card-body');
  // card.each((i, element) => {
  //   const l = $(element).find('a.btn.btn-primary.btn-dl');
  //   if (l.length === 3) {
  //     // Здесь сохраняем промис, а не выполняем его сразу
  //     const fetchPromise = fetch(l[0].attribs.href, { headers: headers })
  //       .then(photoResponse => res.photo.push(photoResponse.url));
  //     fetchPromises.push(fetchPromise);
  //   } else {
  //     // Аналогично для видео
  //     const fetchPromise = fetch(l[0].attribs.href, { headers: headers })
  //       .then(videoResponse => res.video.push(videoResponse.url));
  //     fetchPromises.push(fetchPromise);
  //   }
  // });
  //
  // // Дожидаемся завершения всех запросов
  // await Promise.all(fetchPromises);
  // return res;
}
