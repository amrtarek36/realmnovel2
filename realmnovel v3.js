// ==MiruExtension==
// @name         RealmNovel
// @version      v1.0.2
// @author       Amr
// @lang         ar
// @license      MIT
// @icon         https://www.realmnovel.com/favicon.ico
// @package      realm.novel
// @type         fikushon
// @webSite      https://www.realmnovel.com
// @nsfw         false
// ==/MiruExtension==

import puppeteer from 'puppeteer';
import axios from 'axios';
import cheerio from 'cheerio';

export default class RealmNovel extends Extension {
  async requestWithPuppeteer(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const content = await page.content();
    await browser.close();
    return content;
  }

  async latest() {
    const html = await this.requestWithPuppeteer("https://www.realmnovel.com/");
    const $ = cheerio.load(html);
    const novelList = [];

    $('.novel-item').each((_, element) => {
      const title = $(element).find('a[title]').attr('title')?.trim();
      const url = $(element).find('a').attr('href');
      const cover = $(element).find('img').attr('src');
      
      if (title && url && cover) {
        novelList.push({
          title,
          url: `https://www.realmnovel.com${url}`,
          cover,
        });
      }
    });

    return novelList;
  }

  async search(kw) {
    const html = await this.requestWithPuppeteer(`https://www.realmnovel.com/search?q=${encodeURIComponent(kw)}`);
    const $ = cheerio.load(html);
    const novelList = [];

    $('.relative').each((_, element) => {
      const title = $(element).find('a[title]').attr('title')?.trim();
      const url = $(element).find('a').attr('href');
      const cover = $(element).find('img').attr('src');
      
      if (title && url && cover) {
        novelList.push({
          title,
          url: `https://www.realmnovel.com${url}`,
          cover,
        });
      }
    });

    return novelList;
  }

  async detail(url) {
    const html = await this.requestWithPuppeteer(url);
    const $ = cheerio.load(html);

    const title = $('h1.md\:text-4xl').text().trim();
    const cover = $('img.object-cover').attr('src');
    const desc = $('p.md\:text-lg').text().trim();
    const episodes = [];

    $('.chapter-list li').each((_, element) => {
      const name = $(element).find('a').text().trim();
      const url = $(element).find('a').attr('href');
      
      if (name && url) {
        episodes.push({ name, url: `https://www.realmnovel.com${url}` });
      }
    });

    return {
      title,
      cover,
      desc,
      episodes: [{ title: "الفصول", urls: episodes.reverse() }],
    };
  }

  async watch(url) {
    const html = await this.requestWithPuppeteer(url);
    const $ = cheerio.load(html);
    
    const title = $('h1.md\:text-2xl').text().trim();
    let content = $('.chapter-content-card div').html();

    if (!content) return null;

    content = content
      .replace(/<[^>]+>/g, '\n')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/’/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .trim()
      .split(/\n\n\n/g);

    return { title, content };
  }
}
