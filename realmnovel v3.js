// ==MiruExtension==
// @name         RealmNovel
// @version      v1.0.1
// @author       Amr
// @lang         ar
// @license      MIT
// @icon         https://www.realmnovel.com/favicon.ico
// @package      realm.novel
// @type         fikushon
// @webSite      https://www.realmnovel.com
// @nsfw         false
// ==/MiruExtension==

export default class RealmNovel extends Extension {
  async latest() {
    try {
      const res = await this.request("/");
      const novelList = res.match(/<div class="novel-item">[\s\S]+?<\/div>/g) || [];

      return novelList.map(element => {
        const urlMatch = element.match(/href="(.+?)"/);
        const titleMatch = element.match(/title="(.+?)"/);
        const coverMatch = element.match(/src="(.+?)"/);
        
        if (!urlMatch || !titleMatch || !coverMatch) return null;
        return {
          title: titleMatch[1].trim(),
          url: new URL(urlMatch[1], "https://www.realmnovel.com").href,
          cover: coverMatch[1],
        };
      }).filter(Boolean);
    } catch (error) {
      console.error("Error in latest():", error);
      return [];
    }
  }

  async search(kw, page) {
    try {
      const res = await this.request(`/search?q=${encodeURIComponent(kw)}`);
      const novelList = res.match(/<div class="relative">[\s\S]+?<\/div>/g) || [];

      return novelList.map(element => {
        const urlMatch = element.match(/href="(.+?)"/);
        const titleMatch = element.match(/title="(.+?)"/);
        const coverMatch = element.match(/src="(.+?)"/);

        if (!urlMatch || !titleMatch || !coverMatch) return null;
        return {
          title: titleMatch[1].trim(),
          url: new URL(urlMatch[1], "https://www.realmnovel.com").href,
          cover: coverMatch[1],
        };
      }).filter(Boolean);
    } catch (error) {
      console.error("Error in search():", error);
      return [];
    }
  }

  async detail(url) {
    try {
      const res = await this.request(url);
      const titleMatch = res.match(/<h1 class="md:text-4xl">([\s\S]+?)<\/h1>/);
      const coverMatch = res.match(/<img class="object-cover" src="(.+?)"/);
      const descMatch = res.match(/<p class="md:text-lg">([\s\S]+?)<\/div>/);
      const episodeListMatch = res.match(/<ul class="chapter-list">([\s\S]+?)<\/ul>/);

      if (!titleMatch || !coverMatch || !descMatch || !episodeListMatch) return null;
      
      const title = titleMatch[1].trim();
      const cover = coverMatch[1];
      const desc = descMatch[1].replace(/<[^>]+>/g, '').trim();

      const episodes = (episodeListMatch[1].match(/<li>[\s\S]+?<\/li>/g) || []).map(element => {
        const nameMatch = element.match(/<a.*>(.+?)<\/a>/);
        const urlMatch = element.match(/href="([^"]+)"/);

        if (nameMatch && urlMatch) {
          return {
            name: nameMatch[1].trim(),
            url: new URL(urlMatch[1], "https://www.realmnovel.com").href,
          };
        }
        return null;
      }).filter(Boolean);

      return { title, cover, desc, episodes: [{ title: "الفصول", urls: episodes.reverse() }] };
    } catch (error) {
      console.error("Error in detail():", error);
      return null;
    }
  }

  async watch(url) {
    try {
      const res = await this.request(url);
      const titleMatch = res.match(/<h1 class="md:text-2xl">([\s\S]+?)<\/h1>/);
      const match = res.match(/<div class="chapter-content-card">[\s\S]+?<div[^>]*>([\s\S]+?)<\/div>/);

      if (!titleMatch || !match) return null;

      let chapterContentDiv = match[1].replace(/<[^>]+>/g, '\n').trim();
      chapterContentDiv = chapterContentDiv.replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
        .replace(/’/g, "'").replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"');

      const content = chapterContentDiv.split(/\n{2,}/g);
      return { title: titleMatch[1].trim(), content };
    } catch (error) {
      console.error("Error in watch():", error);
      return null;
    }
  }
}
